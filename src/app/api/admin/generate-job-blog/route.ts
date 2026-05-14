import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { title, category, shortInfo, importantDates, highlights } = await req.json();

    if (!title) {
      return NextResponse.json({ error: "Title is required to generate a blog." }, { status: 400 });
    }

    const systemPrompt = `You are an expert SEO Content Writer and Career Counselor for "Rojgar Suvidha" (India's top job portal).
Your task is to write a comprehensive, highly SEO-optimized, and human-sounding blog post in HTML format for a new job/exam update.

### INPUT DETAILS:
- Title: ${title}
- Category: ${category}
- Short Summary: ${shortInfo || "Not provided"}
- Highlights (Fee, Age, Edu, Vacancy): ${JSON.stringify(highlights || {})}

### STRICT INSTRUCTIONS:
1. FORMAT: Return ONLY valid, clean HTML code that can be injected into a Rich Text Editor. Do not use Markdown (no \`\`\`html or ##). Use semantic HTML tags: <h2>, <h3>, <p>, <ul>, <li>, <strong>.
2. LENGTH: Write a detailed, long-form post (minimum 600-800 words) to ensure high SEO ranking.
3. TONE: Professional yet encouraging (speak directly to the candidate like a mentor). Use phrases like "If you are preparing for...", "This is a golden opportunity...".
4. CONTENT STRUCTURE:
   - Catchy Introduction (H2)
   - Important Dates & Application Fee (If not provided in input, say "Refer to the official notification for exact dates/fees"). Create a clean HTML table for this if possible.
   - Eligibility Criteria (Age Limit & Education Qualification) (H3)
   - Vacancy Details (H3)
   - Step-by-Step Guide on How to Apply Online (H3)
   - Selection Process (H3)
   - Conclusion / Expert Advice (H3)
5. AVOID AI FOOTPRINTS: Do not use words like "In the ever-evolving landscape", "Delve into", "Comprehensive guide". Sound like a real Indian career expert.

Generate the HTML now:`;

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
    
    if (data.error) {
       return NextResponse.json({ error: `API Error: ${data.error.message}` }, { status: 500 });
    }

    let blogHtml = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    
    // Clean up Markdown code blocks if AI still adds them
    blogHtml = blogHtml.replace(/```html\n?/g, "").replace(/```\n?/g, "").trim();

    if (!blogHtml) {
       return NextResponse.json({ error: "AI could not generate content. Please try again." }, { status: 500 });
    }

    return NextResponse.json({ blog: blogHtml });
  } catch (error: any) {
    console.error("AI Blog Generator Error:", error);
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}
