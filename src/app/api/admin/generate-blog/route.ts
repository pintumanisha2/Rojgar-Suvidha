import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { sources } = await req.json();

    if (!sources || sources.length === 0) {
      return NextResponse.json({ error: "At least one source is required" }, { status: 400 });
    }

    // Prepare content for AI
    const combinedContent = sources
      .map((s: string, i: number) => `SOURCE ${i + 1}:\n${s}`)
      .join("\n\n---\n\n");

    const systemPrompt = `You are an expert Career Blogger for "Rojgar Suvidha". 
    Your task is to analyze the competitor blog posts and create a "SUPER BLOG" in HUMANIZED ENGLISH.
    
    STRICT SEO & HUMANIZATION RULES:
    1. LANGUAGE: Use professional yet conversational English (No Hinglish). 
    2. HUMAN TOUCH: Use "Burstiness" (mix of very short and long sentences). Use first-person ("We", "I"). 
    3. DETECTOR BYPASS: Avoid typical AI phrases like "In the ever-evolving world," "comprehensive guide," or "unlock your potential." Speak directly to the student like a mentor.
    4. FACTUAL ACCURACY: Extract all dates, fees, and vacancy details from the sources accurately.
    5. STRUCTURE:
       - Mentorship-style Headline (H1)
       - Introduction that builds trust.
       - Clean Tables for Dates, Fees, and Vacancies (AI will re-create these perfectly).
       - Step-by-step "How to Apply" section.
       - "Expert's Advice" section (unique tips to pass the exam).
       - FAQ Section.
    6. FORMAT: Output in clean Markdown.
    
    SOURCES TO ANALYZE:
    ${combinedContent}`;

    const geminiApiKey = process.env.GEMINI_API_KEY;
    if (!geminiApiKey) {
      return NextResponse.json({ error: "Gemini API Key missing in .env.local" }, { status: 500 });
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiApiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: systemPrompt }] }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 4096,
          },
        }),
      }
    );

    const data = await response.json();
    console.log("Gemini API Response:", JSON.stringify(data));

    if (data.error) {
       return NextResponse.json({ error: `API Error: ${data.error.message}` }, { status: 500 });
    }

    const blogContent = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!blogContent) {
       return NextResponse.json({ error: "AI could not generate content. Please try again with less text." }, { status: 500 });
    }

    return NextResponse.json({ blog: blogContent });
  } catch (error: any) {
    console.error("AI Writer Error:", error);
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}
