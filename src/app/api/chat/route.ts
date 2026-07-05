import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const maxDuration = 60;

// Use service role for broader read access
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Extract keywords from user message for smart DB search
function extractKeywords(message: string): string[] {
  const lower = message.toLowerCase();
  const stopWords = new Set(["kya", "hai", "hain", "ka", "ki", "ke", "mein", "se", "ko", "aur", "ya", "the", "is", "are", "for", "of", "in", "on", "at", "to", "a", "an", "kab", "kaise", "kahan", "koi", "nahi", "please", "batao", "bataiye", "chahiye"]);
  return lower.split(/[\s,।?!]+/).filter(w => w.length > 2 && !stopWords.has(w));
}

export async function POST(req: Request) {
  try {
    const { message, history } = await req.json();

    if (!message?.trim()) {
      return NextResponse.json({ error: "Message required" }, { status: 400 });
    }

    const keywords = extractKeywords(message);
    const groqApiKey = process.env.GROQ_API_KEY;

    if (!groqApiKey) {
      return NextResponse.json({ error: "AI Configuration missing (GROQ_API_KEY)" }, { status: 500 });
    }

    // ─── 1. SMART SEARCH: Search jobs matching user's query ───────────────────
    let relevantJobs: any[] = [];
    if (keywords.length > 0) {
      const { data: searchResults } = await supabaseAdmin
        .from("jobs")
        .select("title, category, slug, last_date, total_posts")
        .neq("status", "draft")
        .or(keywords.map(k => `title.ilike.%${k}%`).join(","))
        .order("created_at", { ascending: false })
        .limit(5);
      relevantJobs = searchResults || [];
    }

    // ─── 2. FETCH LATEST DATA (small set to keep tokens low) ─────────────
    const { data: allItems } = await supabaseAdmin
      .from("jobs")
      .select("title, category, slug, last_date, total_posts")
      .neq("status", "draft")
      .order("created_at", { ascending: false })
      .limit(40); // Reduced from 120 to keep system prompt small

    const allData = allItems || [];

    // Categorize data
    const jobCategories = ["latest-jobs", "ssc", "railway", "banking", "upsc", "state-psc", "defence", "police", "teaching", "psu"];
    const latestJobs = allData.filter(i => jobCategories.includes(i.category)).slice(0, 6);
    const results = allData.filter(i => i.category === "result").slice(0, 4);
    const admitCards = allData.filter(i => i.category === "admit-card").slice(0, 4);
    const answerKeys = allData.filter(i => i.category === "answer-key").slice(0, 3);
    const admissions = allData.filter(i => i.category === "admission").slice(0, 3);

    // Compact format to save tokens
    const formatItem = (item: any) => {
      let line = `• ${item.title}`;
      if (item.total_posts) line += ` [${item.total_posts} posts]`;
      if (item.last_date) line += ` [Last: ${item.last_date}]`;
      line += ` → /job/${item.slug}`;
      return line;
    };

    const formatList = (list: any[]) =>
      list.length ? list.map(formatItem).join("\n") : "Koi update nahi.";

    const relevantSection = relevantJobs.length > 0
      ? `\n[QUERY MATCH]\n${formatList(relevantJobs)}`
      : "";

    // ─── 3. SYSTEM PROMPT with full website context ────────────────────────
    const systemInstruction = `Tum "Rojgar AI" ho — Rojgar Suvidha portal ka exclusive AI Career Assistant.

PLATFORM KE BAARE MEIN:
- Rojgar Suvidha India ka government aur private job portal hai.
- Yahan user ko SSC, UPSC, Railway, Banking, State PSC, Defence, Police, Teaching, PSU aur Private Jobs milti hain.
- Services: Latest Jobs, Results, Admit Cards, Answer Keys, Admissions, Apply For Me (form bharna service), Digital Locker (documents store), Resume Builder, Track Application, Aspirants Adda (community chat).
- "Apply For Me" ek premium service hai jahan haari team user ka sarkari form bilkul sahi tarike se bhar deti hai — photo resize, document upload, payment sab kuch.
- "Digital Locker" mein user apne documents (photo, signature, marksheet, etc.) ek baar upload karta hai aur woh sab forms mein use hote hain.

TUMHARA KAAM:
1. User ke sawal ka jawab SIRF NEECHE DIYE DATABASE DATA se do.
2. Agar data mein match mile toh [View Details](/job/slug) link ZAROOR do.
3. Agar database mein relevant data NA mile toh kaho: "Abhi yeh jaankari hamare portal par nahi hai, lekin aap /latest-jobs pe jaake dekh sakte hain."
4. "Apply For Me" service ka naturally suggest karo jab user kisi form ya application ke baare mein pooche.
5. Jawab HAMESHA short, friendly aur Hinglish mein do (Hindi + English mix). Max 3-4 lines.
6. Kabhi bhi doosri websites (NaukriGuru, Naukri.com, etc.) ka naam mat lo.
7. Ek hi reply mein maximum 3 jobs/items list karo — zyada mat karo.
8. Emojis ka thoda use karo for friendly tone 😊

WEBSITE KI PAGES:
- /latest-jobs → Saari nayi jobs
- /results → Saare results
- /admit-card → Admit cards
- /answer-key → Answer keys
- /admission → Admissions
- /apply-for-me → Apply For Me service
- /dashboard/locker → Digital Locker
- /resume-builder → Resume banao
- /track-application → Application track karo
- /community → Aspirants Adda community
${relevantSection}

[LATEST JOBS - DATABASE]
${formatList(latestJobs)}

[RESULTS - DATABASE]
${formatList(results)}

[ADMIT CARDS - DATABASE]
${formatList(admitCards)}

[ANSWER KEYS - DATABASE]
${formatList(answerKeys)}

[ADMISSIONS - DATABASE]
${formatList(admissions)}`;

    // ─── 4. Build conversation for Groq ───────────────────────────────────
    const formattedHistory = (history || [])
      .filter((h: any) => h.content?.trim())
      .slice(-8) // last 8 messages for context
      .map((h: any) => ({
        role: h.role === "user" ? "user" : "assistant",
        content: h.content,
      }));

    const messagesPayload = [
      { role: "system", content: systemInstruction },
      ...formattedHistory,
      { role: "user", content: message },
    ];

    // ─── 5. Call Groq API (with retry on rate limit) ───────────────────────
    const callGroq = async (retryCount = 0): Promise<any> => {
      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${groqApiKey}`,
        },
        body: JSON.stringify({
          model: "llama-3.1-8b-instant", // Higher TPM limit: 20K vs 12K for 70b model
          messages: messagesPayload,
          max_tokens: 350,        // Reduced to stay within 12K TPM limit
          temperature: 0.4,
        }),
      });

      // Rate limit hit → wait 2 seconds and retry once
      if (response.status === 429 && retryCount < 2) {
        await new Promise(r => setTimeout(r, 2000));
        return callGroq(retryCount + 1);
      }

      return response;
    };

    const response = await callGroq();

    const data = await response.json();

    if (!response.ok) {
      console.error("Groq API Error:", data);
      return NextResponse.json(
        { error: "AI error", details: data.error?.message || "Unknown error" },
        { status: 502 }
      );
    }

    const botReply =
      data.choices?.[0]?.message?.content ||
      "I apologize, I am unable to respond at the moment. Please try again in a few moments. 🙏";

    return NextResponse.json({ reply: botReply });
  } catch (error: any) {
    console.error("Chat API Error:", error);
    return NextResponse.json({ error: "Something went wrong", details: error.message }, { status: 500 });
  }
}
