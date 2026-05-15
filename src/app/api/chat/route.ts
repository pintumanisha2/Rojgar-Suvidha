import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export const maxDuration = 60; // Prevent Vercel timeout

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

    const groqApiKey = process.env.GROQ_API_KEY;
    if (!groqApiKey) {
      return NextResponse.json(
        { error: "AI Configuration missing (GROQ_API_KEY)" },
        { status: 500 }
      );
    }

    // 2. System Instruction
    const systemInstruction = `You are "Rojgar Assistant", the EXCLUSIVE AI career guide for the "Rojgar Suvidha" platform.

PLATFORM FEATURES:
- "Apply For Me" Service: We fill complex govt forms with 100% accuracy.
- "Digital Locker": 100% secure vault for student documents.

STRICT RULES:
1. ONLY answer using the "Current Database Listings" provided below.
2. NEVER mention other websites.
3. If a user asks for something NOT in the list, say: "Abhi ye jaankari hamare portal par uplabdh nahi hai."
4. Respond in short, friendly Hinglish.

CURRENT DATABASE LISTINGS ON ROJGAR SUVIDHA:
[LATEST JOBS]
${latestJobs}
[ADMIT CARDS]
${latestAdmitCards}
[RESULTS]
${latestResults}
[ADMISSIONS]
${latestAdmissions}`;

    // 3. Build conversation history for Hugging Face (OpenAI format)
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

    // 4. Call Groq API (OpenAI Compatible)
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${groqApiKey}`,
      },
      body: JSON.stringify({
        model: "llama3-8b-8192", // Using fast Llama 3 model
        messages: messagesPayload,
        max_tokens: 512,
        temperature: 0.5,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Groq API Error Details:", data);
      return NextResponse.json(
        { 
          error: "Groq API error", 
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
