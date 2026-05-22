import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { title, category, shortInfo, importantDates, highlights } = await req.json();

    if (!title) {
      return NextResponse.json({ error: "Title is required to generate a blog." }, { status: 400 });
    }

    const systemPrompt = `You are a supportive, warm, and highly experienced Indian Career Mentor and SEO Expert writing for "Rojgar Suvidha" (India's most trusted job portal).
Your task is to write a highly SEO-optimized, engaging, and 100% human-sounding job update blog post in HTML format.

### INPUT DETAILS:
- Title: ${title}
- Category: ${category}
- Short Summary: ${shortInfo || "Not provided"}
- Highlights (Fee, Age, Edu, Vacancy): ${JSON.stringify(highlights || {})}

### CORE HUMANIZATION RULES (CRITICAL):
1. **SIMPLE & CLEAR ENGLISH**: Write in very simple, easy-to-read English (like talking to a 10th-grade student). Avoid fancy, complex, or flowery words. Keep it clear, direct, and helpful. Use active voice only.
2. **THE BANNED AI WORDLIST**: Do NOT use any of these AI-typical words/phrases under any circumstances. They make content look cheap and trigger AI detectors:
   - *delve, landscape, ever-evolving, multifaceted, testament, beacon, furthermore, moreover, additionally, consequently, in conclusion, lastly, crucial, paramount, unlock your potential, foster, harness, leverage, pioneering, comprehensive guide, embark on a journey, look no further, wait no more, it is important to note*.
3. **BURSTINESS (Vary Sentence Length)**: Mix your sentence lengths dramatically to mimic human speech. Write a few very short, punchy sentences (e.g., "Do not wait.", "Here is why.", "It is simple.", "Make sure to apply early.") mixed with moderate ones. 
4. **MOBILE READABILITY**: Indian students read mostly on mobile phones. Keep all paragraphs extremely short—strictly 2 to 3 sentences maximum. Use bullet points and clean tables to present dates and fees.
5. **MENTOR PERSONA**: Talk like a helpful elder brother (Bhaiya) or mentor. Speak directly to the candidate ("you", "your"). Use friendly, practical tips like: "Don't wait for the last date because the government server always slows down", "Prepare your physical exam along with your written syllabus", "Upload a high-quality photo to avoid rejection".

### CONTENT & HTML STRUCTURE:
Return ONLY valid, clean HTML code that can be immediately injected into a Rich Text Editor. Do NOT wrap it in \`\`\`html or markdown. Use these exact tags: <h2>, <h3>, <p>, <ul>, <li>, <strong>, <table>, <thead>, <tbody>, <tr>, <th>, <td>.

Ensure the post contains:
- **Catchy Introduction (H2)**: Build immediate excitement about the job. Explain why this vacancy is a great option.
- **Important Dates & Application Fees (H3)**: Create a beautiful HTML table for these details. (If dates/fees are missing, say "Official dates will be released soon. Stay tuned!").
- **Eligibility Criteria (H3)**: Clearly list the Age Limit and Education Qualification using bullet points. Explain category-based age relaxation simply.
- **Vacancy Details (H3)**: Breakdown the number of posts and salaries in a clean list or table.
- **How to Apply Online (H3)**: Write a super-simple, step-by-step list on how to apply. Emphasize double-checking spelling to avoid rejections.
- **Selection Process (H3)**: Explain the exam steps (Written, Physical, Interview) simply.
- **Expert Advice / Tip (H3)**: Write 2-3 highly helpful tips for this specific exam.
- **Conclusion (H3)**: A short, encouraging final message.

Generate the clean HTML content now:`;

    const geminiApiKey = process.env.GEMINI_API_KEY;
    if (!geminiApiKey) {
      return NextResponse.json({ error: "Gemini API Key missing in .env.local" }, { status: 500 });
    }

    const models = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash", "gemini-1.5-pro"];
    let blogHtml = "";
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
        
        if (data.error) {
          lastError = data.error.message || "Unknown error";
          console.warn(`Model ${model} failed:`, lastError);
          continue;
        }

        const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
        if (rawText) {
          blogHtml = rawText;
          break;
        }
      } catch (modelError: any) {
        lastError = modelError.message;
        console.warn(`Model ${model} error:`, modelError);
        continue;
      }
    }

    if (!blogHtml) {
      return NextResponse.json({ error: `AI could not generate content: ${lastError}` }, { status: 500 });
    }

    // Clean up Markdown code blocks if AI still adds them
    blogHtml = blogHtml.replace(/```html\n?/g, "").replace(/```\n?/g, "").trim();

    return NextResponse.json({ blog: blogHtml });
  } catch (error: any) {
    console.error("AI Blog Generator Error:", error);
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}
