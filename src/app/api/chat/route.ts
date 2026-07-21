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

    // Categorize data with normalized category strings
    const jobCategories = ["latest-jobs", "ssc", "railway", "banking", "upsc", "state-psc", "defence", "police", "teaching", "psu", "latest_jobs"];
    const latestJobs = allData.filter(i => jobCategories.includes((i.category || "").toLowerCase())).slice(0, 6);
    const results = allData.filter(i => ["result", "results"].includes((i.category || "").toLowerCase())).slice(0, 4);
    const admitCards = allData.filter(i => ["admit-card", "admit-cards", "admit_card"].includes((i.category || "").toLowerCase())).slice(0, 4);

    // Compact format to save tokens
    const formatItem = (item: any) => {
      let line = `• ${item.title}`;
      if (item.total_posts) line += ` [${item.total_posts} posts]`;
      if (item.last_date) line += ` [Last: ${item.last_date}]`;
      line += ` → /job/${item.slug}`;
      return line;
    };

    const formatList = (list: any[]) =>
      list.length ? list.map(formatItem).join("\n") : "Abhi koi naya update nahi hai.";

    const relevantSection = relevantJobs.length > 0
      ? `\n[QUERY MATCH]\n${formatList(relevantJobs)}`
      : "";

    // ─── 4. SYSTEM PROMPT: Zero-Hallucination & Intent-Based Guidance ───
    const systemInstruction = `Tum "Rojgar AI" ho — Rojgar Suvidha portal ke official AI Career Assistant. Speak like a smart, helpful elder brother (Bhaiya) with complete honesty, accuracy, and clarity.

=== ABSOLUTE TRUTHFULNESS & NO HALLUCINATION RULES ===
1. ZERO FAKE DATA: Strictly use the actual database records provided below. If a section (like RESULTS or ADMIT CARDS) says "Abhi koi naya update nahi hai", DO NOT invent fake exam results, roll numbers, or dates! Tell the user honestly: "Abhi hamare portal par filhal koi naya Result/Admit Card update nahi hai. Naye updates aate hi yahan publish honge."
2. SMART INTENT-BASED PITCHING:
   - ONLY mention/pitch "Apply For Me" when the user asks about: Job Vacancies, New Forms, Eligibility, How to Apply, or Form Filling assistance.
   - DO NOT pitch "Apply For Me" when the user asks about: Exam Results, Admit Cards, Answer Keys, Syllabus, or General Info.
   - Apply For Me Fee is exact ₹49 (not ₹50, not ₹99).

=== UNICORN BRAND PERSPECTIVE ===
- Tone: Natural, respectful, friendly Hinglish.
- Format: Keep answers concise (max 3-4 bullet points) so they look great on mobile.
- Links: Use clean markdown links when referring to portal pages or jobs.

=== USER ACTIVE PAGE CONTEXT ===
${pageContext || "User is currently browsing the home page."}

=== PORTAL DIRECT LINKS ===
- /latest-jobs → Latest Govt Jobs
- /results → Exam Results
- /admit-card → Admit Cards
- /answer-key → Answer Keys
- /apply-for-me → Form Filling Service (₹49)
- /e-suvidha → Digital Cyber Cafe Services
- /pricing → Transparent Service Pricing

${relevantSection}

[LATEST JOBS IN DATABASE]
${formatList(latestJobs)}

[RESULTS IN DATABASE]
${formatList(results)}

[ADMIT CARDS IN DATABASE]
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
