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
    const { message, history, pathname = "" } = await req.json();

    if (!message?.trim()) {
      return NextResponse.json({ error: "Message required" }, { status: 400 });
    }

    const keywords = extractKeywords(message);
    const groqApiKey = process.env.GROQ_API_KEY;

    if (!groqApiKey) {
      return NextResponse.json({ error: "AI Configuration missing (GROQ_API_KEY)" }, { status: 500 });
    }

    // ─── 1. DYNAMIC PAGE-CONTEXT AWARENESS (U1) ───────────────────────────────
    let pageContext = "";
    if (pathname) {
      const slugMatch = pathname.match(/\/job\/([^\/]+)/);
      if (slugMatch && slugMatch[1]) {
        const slug = slugMatch[1];
        try {
          const { data: jobDetail } = await supabaseAdmin
            .from("jobs")
            .select("title, short_info, blog_content, important_dates")
            .eq("slug", slug)
            .neq("status", "draft")
            .single();
          
          if (jobDetail) {
            pageContext = `
[USER IS CURRENTLY VIEWING THIS JOB POST]
Title: ${jobDetail.title}
Summary: ${jobDetail.short_info || ""}
Dates: ${JSON.stringify(jobDetail.important_dates || [])}
Full Page Content/Blog (Use this to answer queries about eligibility, fees, salary, exam pattern, step-by-step apply, etc.):
${jobDetail.blog_content?.replace(/<[^>]*>/g, " ").slice(0, 3500) || ""}
`;
          }
        } catch (dbErr) {
          console.error("Context fetch error:", dbErr);
        }
      } else if (pathname === "/apply-for-me") {
        pageContext = `
[USER IS CURRENTLY VIEWING THE 'APPLY FOR ME' PAGE]
User is reading about the Apply For Me service. Pitch the advantages strongly:
- Cost: ₹50 only.
- 99.8% Form Acceptance Rate (No stress of rejection).
- Perfect resizing of photos and signature verification.
- Direct delivery of official PDFs/receipts to user's dashboard and WhatsApp.
- Complete security of user credentials and documents.
`;
      }
    }

    // ─── 2. SMART SEARCH: Search jobs matching user's query ───────────────────
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

    // ─── 3. FETCH LATEST DATA (small set to keep tokens low) ─────────────
    const { data: allItems } = await supabaseAdmin
      .from("jobs")
      .select("title, category, slug, last_date, total_posts")
      .neq("status", "draft")
      .order("created_at", { ascending: false })
      .limit(40);

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

    // ─── 4. SYSTEM PROMPT: Unicorn Brand Personality & Sales Conversion (U2) ───
    const systemInstruction = `Tum "Rojgar AI" ho — Rojgar Suvidha portal ke exclusive AI Career Mentor aur Guide. Speak like an expert, friendly elder brother (Bhaiya) advising a student with complete confidence and trust.

=== UNICORN BRAND PERSPECTIVE ===
- Rojgar Suvidha ek next-gen Unicorn Brand career portal hai, jo normal portals jaisa boring nahi hai.
- Aapka personality extremely professional, helpful, motivational aur structured hai.
- Tone: Natural, friendly, authoritative Hinglish (Hindi + English mix).

=== HIGH-CONVERSION SALES SCRIPT ===
1. Jab bhi user kisi job vacancy, eligibility, dates, fee, apply karne ya form bharne ke baare me pooche, toh use naturally samjhao aur "Apply For Me" service pitch karo:
   "⚠️ Remember — form bharne me choti si galti se pura saal kharab ho jata hai. Aap tension-free apply karne ke liye hamari premium 'Apply For Me' service use kar sakte hain. Hamari expert team sirf ₹50 me aapka form 100% accuracy ke sath fill karegi."
2. Uske baad reply me ye exact Markdown link button add karo:
   [🚀 Apply For Me — ₹50 Only](/apply-for-me)
3. Pitch should be natural but highly converting. Mention: "✓ Trusted by 50,000+ candidates | 99.8% Form Acceptance Rate."

=== USER ACTIVE PAGE CONTEXT ===
${pageContext || "User is currently browsing the home page."}

=== PORTAL KEY FEATURES & DIRECT LINKS ===
- /latest-jobs → Saari jobs check karo
- /results → Results dekehein
- /admit-card → Admit card links
- /answer-key → Answer keys check karein
- /apply-for-me → Form Apply Service (₹50)
- /dashboard/locker → Upload Documents Locker
- /resume-builder → Professional Resume Maker
- /track-application → Order status checker

=== DATA-RETRIEVAL GUIDELINES ===
- User ke sawal ka jawab dene ke liye upar diye [USER IS CURRENTLY VIEWING THIS JOB POST] context ka use zaroor karein agar available hai.
- Jawab hamesha short, bullet points me bold text ke sath do takki mobile pe read karna aasan ho (max 4-5 lines).
- Kabhi bhi doosri websites (Naukri.com, Sarkari Result) ka naam mat lo. 😊

${relevantSection}

[LATEST JOBS - DATABASE]
${formatList(latestJobs)}

[RESULTS - DATABASE]
${formatList(results)}

[ADMIT CARDS - DATABASE]
${formatList(admitCards)}`;

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
