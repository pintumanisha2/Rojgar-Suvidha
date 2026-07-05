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

    // ─── 1. SMART SEARCH: Search jobs matching user's query ───────────────
    let relevantJobs: any[] = [];
    if (keywords.length > 0) {
      // Try keyword-based search using ilike on title
      const searchQuery = keywords.slice(0, 3).join(" | ");
      const { data: searchResults } = await supabaseAdmin
        .from("jobs")
        .select("title, category, status, slug, short_info, exam_date, last_date, total_posts, qualification")
        .neq("status", "draft")
        .or(keywords.map(k => `title.ilike.%${k}%`).join(","))
        .order("created_at", { ascending: false })
        .limit(8);
      relevantJobs = searchResults || [];
    }

    // ─── 2. FETCH LATEST DATA from all categories ─────────────────────────
    const { data: allItems } = await supabaseAdmin
      .from("jobs")
      .select("title, category, status, slug, short_info, exam_date, last_date, total_posts, qualification")
      .neq("status", "draft")
      .order("created_at", { ascending: false })
      .limit(120);

    const allData = allItems || [];

    // Categorize data
    const jobCategories = ["latest-jobs", "ssc", "railway", "banking", "upsc", "state-psc", "defence", "police", "teaching", "psu"];
    const latestJobs = allData.filter(i => jobCategories.includes(i.category)).slice(0, 20);
    const results = allData.filter(i => i.category === "result").slice(0, 10);
    const admitCards = allData.filter(i => i.category === "admit-card").slice(0, 10);
    const answerKeys = allData.filter(i => i.category === "answer-key").slice(0, 8);
    const admissions = allData.filter(i => i.category === "admission").slice(0, 8);

    // Format function with rich info
    const formatItem = (item: any) => {
      let line = `• ${item.title}`;
      if (item.total_posts) line += ` | Vacancies: ${item.total_posts}`;
      if (item.last_date) line += ` | Last Date: ${item.last_date}`;
      if (item.qualification) line += ` | Qualification: ${item.qualification}`;
      if (item.short_info) line += ` | Info: ${item.short_info.slice(0, 120)}`;
      line += ` | Link: [View Details](/job/${item.slug})`;
      return line;
    };

    const formatList = (list: any[]) =>
      list.length ? list.map(formatItem).join("\n") : "Abhi koi naya update nahi hai.";

    const relevantSection = relevantJobs.length > 0
      ? `\n[USER QUERY SE MATCH HUI NAUKRI / RESULTS]\n${formatList(relevantJobs)}`
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

    // ─── 5. Call Groq API ─────────────────────────────────────────────────
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${groqApiKey}`,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: messagesPayload,
        max_tokens: 600,
        temperature: 0.4,
      }),
    });

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
      "Maafi chahta hoon, abhi jawab nahi de paa raha. Thodi der baad try karein. 🙏";

    return NextResponse.json({ reply: botReply });
  } catch (error: any) {
    console.error("Chat API Error:", error);
    return NextResponse.json({ error: "Something went wrong", details: error.message }, { status: 500 });
  }
}
