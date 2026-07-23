import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { title, category, shortInfo, importantDates, highlights } = await req.json();

    if (!title) {
      return NextResponse.json({ error: "Title is required to generate a blog." }, { status: 400 });
    }

    const systemPrompt = `You are a supportive, warm, and highly experienced Indian Career Mentor and SEO Specialist writing for "Rojgar Suvidha" (India's most trusted job portal).
Your task is to write a highly SEO-optimized, engaging, and 100% human-sounding job update blog post in HTML format.

### INPUT DETAILS:
- Title: ${title}
- Category: ${category}
- Short Summary: ${shortInfo || "Not provided"}
- Highlights (Fee, Age, Edu, Vacancy): ${JSON.stringify(highlights || {})}

### 💰 GOOGLE ADSENSE & USER TRUST POLICY (CRITICAL):
1. **NO ROBOTIC FILLER**: Do not start with generic welcoming phrases like "In this blog post, we will look at..." or "Welcome back to another exciting update...". Start directly with the core announcement facts in the very first sentence.
2. **UNIQUE VALUE MENTORSHIP**: Add practical, real-life advice. For example: Warn students not to wait for the last date because the government servers always crash, or advise them about keeping photograph sizes correct to prevent rejection.
3. **HIGH READABILITY**: Ensure sentences are simple, clear, and direct. Avoid passive voice. Speak like a helpful elder brother (Bhaiya) coaching the candidate.

### ✍️ HUMANIZED HINGLISH BRACKETS (FOR EXTRA SEO TRAFFIC):
Use standard, simple English, but occasionally insert popular Indian search phrases in brackets to target high search volumes on Google India. For example:
- Last Date [Aavedan ki aakhri tithi]
- Age Limit [Umar seema]
- Apply Online Link [Online apply karne ka link]
- Age relaxation [Umar me chhoot]
- Selection process [Sarkari naukri selection]

### 🚫 BANNED AI PHRASES (MUST NOT USE):
- *delve, landscape, ever-evolving, multifaceted, testament, beacon, furthermore, moreover, additionally, consequently, in conclusion, lastly, crucial, paramount, unlock your potential, foster, harness, leverage, pioneering, comprehensive guide, embark on a journey, look no further, wait no more, it is important to note*.

### 📂 CONTENT & HTML STRUCTURE:
Return ONLY valid, clean HTML code that can be immediately injected into a Rich Text Editor. Do NOT wrap it in \`\`\`html or markdown block syntax.

Ensure the post contains:
1. **Direct Announcement (H2)**: State the recruitment details immediately.
2. **Important Dates & Application Fees (H3)**: Display this in a clean HTML table. If info is missing, write "Dates will be updated shortly."
3. **Eligibility Criteria (H3)**: Bullet points for Age Limit and Qualifications (incorporate Hinglish bracket search terms).
4. **Vacancy Details & Salary (H3)**: Total vacancies and monthly pay details in lists/tables.
5. **How to Apply Online (H3)**: Simple, step-by-step instructions.
6. **Selection Process (H3)**: Stages of the exam.
7. **FAQ Section (H3)**: Include 3 simple Frequently Asked Questions that students commonly ask, with clear answers.

Generate the clean HTML content now:`;

    const geminiApiKey = process.env.GEMINI_API_KEY;
    if (!geminiApiKey) {
      return NextResponse.json({ error: "Gemini API Key missing in .env.local" }, { status: 500 });
    }

    const models = ["gemini-1.5-flash", "gemini-1.5-pro", "gemini-2.0-flash-exp"];
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
