import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(req: Request) {
  try {
    const { message, history } = await req.json();

    // 1. Fetch Comprehensive Context from Supabase (Jobs, Results, Admit Cards, Admissions)
    const { data: allItems } = await supabase
      .from("jobs")
      .select("title, category, status, slug")
      .neq("status", "draft")
      .order("created_at", { ascending: false })
      .limit(80);

    const formatList = (list: any[]) => list.length ? list.map(i => `- ${i.title} (Link: /jobs/${i.slug})`).join('\n') : "Abhi koi naya update nahi hai.";

    const latestJobs = formatList(allItems?.filter(i => i.category === 'latest-jobs').slice(0, 15) || []);
    const latestResults = formatList(allItems?.filter(i => i.category === 'results').slice(0, 10) || []);
    const latestAdmitCards = formatList(allItems?.filter(i => i.category === 'admit-cards').slice(0, 10) || []);
    const latestAdmissions = formatList(allItems?.filter(i => i.category === 'admission').slice(0, 10) || []);

    const openRouterKey = process.env.OPENROUTER_API_KEY;
    if (!openRouterKey) {
      return NextResponse.json(
        { error: "AI Configuration missing (OPENROUTER API Key)" },
        { status: 500 }
      );
    }

    // 2. System Instruction (Deep Knowledge of Platform)
    const systemInstruction = `You are "Rojgar Assistant", the EXCLUSIVE AI career guide for the "Rojgar Suvidha" platform.

PLATFORM FEATURES (YOU MUST KNOW THESE):
- "Apply For Me" Service: A premium service where students can pay a small fee and our expert team will fill their complex govt forms with 100% accuracy. The OTP is handled securely inside the platform without phone calls.
- "Digital Locker": A 100% secure vault where students can upload and save their documents (Photo, Signature, Aadhaar, Marksheets) so they never have to search for them while applying.

STRICT RULES:
1. ONLY answer using the "Current Database Listings" provided below. Do NOT use external knowledge for job/result details.
2. NEVER mention or recommend other websites (like Sarkari Result, FreeJobAlert). Always say check "Rojgar Suvidha".
3. If a user asks for something NOT in the list, say: "Abhi ye jaankari hamare portal par uplabdh nahi hai."
4. Always be loyal, polite, and helpful.

FORMATTING:
- Respond in friendly Hinglish (mix of Hindi and English).
- Keep answers short, direct, and scannable.
- If providing a link from the lists below, format exactly like this: [View Details](LINK_FROM_LIST)
- DO NOT use markdown bold headers (like **Jobs**). Use simple text or emojis.

CURRENT DATABASE LISTINGS ON ROJGAR SUVIDHA:

[LATEST JOBS]
${latestJobs}

[ADMIT CARDS]
${latestAdmitCards}

[RESULTS]
${latestResults}

[ADMISSIONS]
${latestAdmissions}
`;

    // 3. Build conversation history for OpenRouter (OpenAI format)
    const formattedHistory = history
      .filter((h: any) => h.content?.trim())
      .map((h: any) => ({
        role: h.role === "user" ? "user" : "assistant",
        content: h.content,
      }));

    const messagesPayload = [
      { role: "system", content: systemInstruction },
      ...formattedHistory,
      { role: "user", content: message },
    ];

    // 4. Call OpenRouter API (Accessing free models)
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${openRouterKey}`,
        "HTTP-Referer": "https://rojgarsuvidha.com", // Optional, for OpenRouter rankings
        "X-Title": "Rojgar Suvidha", // Optional, for OpenRouter rankings
      },
      body: JSON.stringify({
        model: "mistralai/mistral-7b-instruct:free", // Highly stable and always-on free model
        messages: messagesPayload,
        temperature: 0.5,
        max_tokens: 512,
        top_p: 0.9,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("OpenRouter API Error Details:", data);
      return NextResponse.json(
        { 
          error: "OpenRouter API error", 
          details: data.error?.message || "Unknown API Error" 
        }, 
        { status: 502 }
      );
    }

    const botReply =
      data.choices?.[0]?.message?.content ||
      "Maafi chahta hoon, main abhi samajh nahi paa raha hoon. Kripya dobara koshish karein.";

    return NextResponse.json({ reply: botReply });
  } catch (error: any) {
    console.error("Chat API Error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
