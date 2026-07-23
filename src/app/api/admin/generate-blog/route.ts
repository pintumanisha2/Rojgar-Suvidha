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

    const systemPrompt = `You are an expert, supportive Career Mentor and SEO Blogger for "Rojgar Suvidha" (India's most trusted career portal). 
    Your task is to analyze the competitor blog posts (sources) and write a "SUPER BLOG" in 100% HUMANIZED, SIMPLE ENGLISH.
    
    ### STRICT SEO & GOOGLE ADSENSE RULES:
    1. **NO INTRO FILLER**: Do not start with generic welcome phrases like "In this article, we will tell you about..." or "Welcome back to...". Start directly with the core announcement facts in the very first sentence.
    2. **SIMPLE & CLEAR ENGLISH**: Write in very simple, easy-to-read English (like talking to a high school student). Avoid fancy, difficult, or flowery vocabulary. Use direct, warm, active sentences.
    3. **HUMANIZED HINGLISH BRACKETS (FOR EXTRA GOOGLE SEARCH TRAFFIC)**: Use standard English, but occasionally insert popular Indian search phrases in brackets to target high search volume keywords:
       - Last Date [Aavedan ki aakhri tithi]
       - Age Limit [Umar seema]
       - Apply Online Link [Online apply karne ka link]
       - Age relaxation [Umar me chhoot]
       - Selection process [Sarkari naukri selection]
    4. **THE BANNED AI WORDLIST**: Do NOT use any of these AI-typical words/phrases under any circumstances. They instantly trigger AI detectors and look cheap:
       - *delve, landscape, ever-evolving, multifaceted, testament, beacon, furthermore, moreover, additionally, consequently, in conclusion, lastly, crucial, paramount, unlock your potential, foster, harness, leverage, pioneering, comprehensive guide, embark on a journey, look no further, wait no more, it is important to note*.
    5. **BURSTINESS (Sentence Variation)**: Mix sentence lengths dramatically. Write some extremely short, punchy sentences (e.g. "Do not worry.", "This is key.", "Here is the trick.", "Apply today.") to create a natural, human flow that completely bypasses AI detectors.
    6. **MOBILE READABILITY**: Indian students read mostly on mobile screens. Keep paragraphs very short—strictly 2 to 3 sentences maximum. Use lists, bullet points, and clean tables for dates, fees, and vacancies.
    7. **MENTOR TONE**: Write from a supportive first-person perspective ("We", "I"). Speak directly to the candidate ("you", "your") like a warm, experienced elder brother. Give practical, real-world advice.
    8. **STRUCTURE**:
       - Mentorship-style Headline (H1)
       - Catchy introduction that builds trust and gets straight to the point.
       - Clean HTML/Markdown Tables for Dates, Fees, and Vacancies.
       - Step-by-step "How to Apply" guide.
       - "Expert's Advice" section (unique, highly practical tips to pass the exam or fill the form correctly).
       - FAQ Section (Include 3-4 commonly asked candidate questions with simple, accurate answers).
    9. **FORMAT**: Output in clean Markdown.
    
    SOURCES TO ANALYZE:
    ${combinedContent}`;

    const geminiApiKey = process.env.GEMINI_API_KEY;
    if (!geminiApiKey) {
      return NextResponse.json({ error: "Gemini API Key missing in .env.local" }, { status: 500 });
    }

    const models = ["gemini-1.5-flash", "gemini-1.5-pro", "gemini-2.0-flash-exp"];
    let blogContent = "";
    let lastError = "";

    for (const model of models) {
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiApiKey}`,
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
            signal: AbortSignal.timeout(30000),
          }
        );

        const data = await response.json();
        console.log(`Gemini API Response (${model}):`, JSON.stringify(data));

        if (data.error) {
          lastError = data.error.message || "Unknown error";
          console.warn(`Model ${model} failed:`, lastError);
          continue;
        }

        const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
        if (rawText) {
          blogContent = rawText;
          break;
        }
      } catch (modelError: any) {
        lastError = modelError.message;
        console.warn(`Model ${model} error:`, modelError);
        continue;
      }
    }

    if (!blogContent) {
      return NextResponse.json({ error: `AI could not generate content: ${lastError}` }, { status: 500 });
    }

    return NextResponse.json({ blog: blogContent });
  } catch (error: any) {
    console.error("AI Writer Error:", error);
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}
