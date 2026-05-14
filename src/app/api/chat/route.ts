import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(req: Request) {
  try {
    const { message, history } = await req.json();

    // 1. Fetch Context from Supabase (Latest Jobs with slugs)
    const { data: latestJobs } = await supabase
      .from("jobs")
      .select("title, category, status, slug")
      .neq("status", "draft")
      .order("created_at", { ascending: false })
      .limit(15);

    // Build context WITH slugs so AI can generate correct links
    const contextString =
      latestJobs
        ?.map((j) => `- ${j.title} (Category: ${j.category}, Link: /jobs/${j.slug})`)
        .join("\n") || "Abhi koi recent update nahi hai.";

    const geminiApiKey = process.env.GEMINI_API_KEY;
    if (!geminiApiKey) {
      return NextResponse.json(
        { error: "AI Configuration missing (API Key)" },
        { status: 500 }
      );
    }

    // 2. System Instruction (Gemini v1beta format — separate from conversation)
    const systemInstruction = `You are "Rojgar Assistant", the EXCLUSIVE AI career guide for the "Rojgar Suvidha" platform.

STRICT RULES:
1. ONLY answer using the "Current Job Listings" provided below. Do NOT use external knowledge for job details.
2. NEVER mention or recommend other websites (e.g., Sarkari Result, FreeJobAlert, NaukariPak, etc.).
3. If a user asks for a job NOT in the list, say: "Abhi ye jaankari hamare portal par uplabdh nahi hai. Kripya Latest Updates check karte rahein."
4. NEVER hallucinate or invent job names, dates, or eligibility.
5. Always be loyal to Rojgar Suvidha.

FORMATTING:
- Respond in friendly Hinglish (mix of Hindi and English).
- Keep answers short (2-4 lines max).
- For jobs in the list, include a link exactly like this: [View Details](LINK_FROM_LIST)
- For general questions (resume tips, document upload, etc.), answer helpfully without a job link.

Current Job Listings on Rojgar Suvidha:
${contextString}`;

    // 3. Build conversation history for Gemini (user/model roles only)
    const conversationHistory = history
      .filter((h: any) => h.content?.trim())
      .map((h: any) => ({
        role: h.role === "user" ? "user" : "model",
        parts: [{ text: h.content }],
      }));

    // 4. Call Gemini API (v1beta supports systemInstruction)
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiApiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system_instruction: {
            parts: [{ text: systemInstruction }],
          },
          contents: [
            ...conversationHistory,
            { role: "user", parts: [{ text: message }] },
          ],
          generationConfig: {
            temperature: 0.6,
            topK: 40,
            topP: 0.92,
            maxOutputTokens: 512,
          },
          safetySettings: [
            { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
            { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
          ],
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("Gemini API Error:", data);
      return NextResponse.json({ error: "Gemini API error" }, { status: 502 });
    }

    const botReply =
      data.candidates?.[0]?.content?.parts?.[0]?.text ||
      "Maafi chahta hoon, main abhi samajh nahi paa raha hoon. Kripya dobara koshish karein.";

    return NextResponse.json({ reply: botReply });
  } catch (error: any) {
    console.error("Chat API Error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
