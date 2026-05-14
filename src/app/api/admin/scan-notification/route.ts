import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { rawText } = await req.json();

    if (!rawText || rawText.length < 50) {
      return NextResponse.json({ error: "Please paste a longer text (minimum 50 characters)." }, { status: 400 });
    }

    const groqApiKey = process.env.GROQ_API_KEY;
    if (!groqApiKey) {
      return NextResponse.json({ error: "Groq API Key missing in .env.local" }, { status: 500 });
    }

    const systemPrompt = `You are the Senior Editor and Brand Voice for Rojgar Suvidha (India's #1 Job Portal). 
Your goal is to extract facts from messy notification text and write a high-ranking, professional English blog post.

### BRAND IDENTITY:
- Name: Always refer to the platform as "Rojgar Suvidha".
- "Apply For Me": Emphasize our exclusive "Apply For Me" service. Explain that candidates who are worried about making mistakes or don't have time can use this service to have our experts fill their application forms with 100% accuracy.

### CONTENT QUALITY & SEO RULES (CRITICAL):
1. LENGTH & DEPTH (URGENT): You MUST write at least 800 words. Do not just summarize. You must write 4-5 long, detailed sentences for EVERY paragraph.
   - Expand heavily on "Why this is a great opportunity".
   - Explain the "Selection Process" in deep, step-by-step detail.
   - Explain the "Eligibility" in a story-like format (e.g., "If you have completed your 12th standard...").
2. BYPASS AI DETECTORS (100% Human): 
   - Never use AI words: "delve", "plethora", "crucial", "vital", "navigating", "landscape", "testament", "moreover", "furthermore", "tapestry", "unleash", "embark", "comprehensive", "meticulous".
   - Write like a friendly, expert career counselor talking directly to a student. Use phrases like "So, if you are planning to apply...", "Let's look at the important dates."
3. EMOJIS: Strictly ZERO (0) emojis.
4. DESIGNER TABLES: You MUST use HTML <table> for Dates, Fees, and Vacancies. 
   - Apply these EXACT inline styles to the <table> tag: \`style="width: 100%; border-collapse: collapse; margin-bottom: 1.5rem; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); border-radius: 8px; overflow: hidden;"\`
   - Apply this to <th> tags: \`style="background-color: #4f46e5; color: white; padding: 12px; text-align: left; font-weight: bold;"\`
   - Apply this to <td> tags: \`style="padding: 12px; border-bottom: 1px solid #e5e7eb;"\`
5. SEO OPTIMIZATION & FAQ DESIGN: 
   - Highlight important keywords using <strong> tags.
   - Use H2 for major headings, H3 for sub-sections.
   - For the "Frequently Asked Questions (FAQs)" section, you MUST use interactive <details> and <summary> tags.
   - Use this EXACT format for each of the 5 FAQs:
     <details style="margin-bottom: 1rem; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; background-color: #f8fafc; cursor: pointer;">
       <summary style="font-weight: bold; color: #4f46e5; outline: none; font-size: 1.1rem;">What is the question?</summary>
       <p style="margin-top: 12px; color: #475569; line-height: 1.6;">This is the detailed answer explaining the concept.</p>
     </details>

### STRUCTURE OF HTML:
- H2: Introduction (Mention Rojgar Suvidha's commitment to fast updates).
- Important Dates & Fees (Clean HTML Tables).
- H3: Eligibility Criteria (Age & Education).
- H3: Vacancy Details & Salary.
- H3: How to Apply via Rojgar Suvidha (Highlight the "Apply For Me" service as the safest error-free option).
- H3: Frequently Asked Questions (FAQs)
- H3: Conclusion & Expert Advice.

### OUTPUT JSON FORMAT:
{
  "title": "SEO-friendly title (No emojis)",
  "category": "latest-jobs",
  "metaDesc": "A highly clickable SEO meta description (150-160 characters).",
  "shortInfo": "A 2-line catchy summary for the job card.",
  "appFee": "Extracted fee summary",
  "ageLimit": "Extracted age criteria",
  "education": "Extracted qualification",
  "totalPosts": "Extracted vacancy count",
  "lastDate": "Extracted deadline date",
  "blogHtml": "The full, rich HTML content (min 800 words) strictly following the structure above."
}

### RAW NOTIFICATION TEXT:
${rawText}

Return ONLY a clean JSON object.`;

    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${groqApiKey}`
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [
            { role: "system", content: "You are a professional JSON generator for job portals. You must return only valid JSON." },
            { role: "user", content: systemPrompt }
          ],
          temperature: 0.2, // Low temperature for higher accuracy and consistency
          max_tokens: 6000,
          response_format: { type: "json_object" }
        }),
      }
    );

    const data = await response.json();
    
    if (data.error) {
       return NextResponse.json({ error: `Groq API Error: ${data.error.message}` }, { status: 500 });
    }

    const aiOutput = data.choices?.[0]?.message?.content;
    
    if (!aiOutput) {
       return NextResponse.json({ error: "AI could not process this text. Please try again." }, { status: 500 });
    }

    const parsedOutput = JSON.parse(aiOutput);
    return NextResponse.json(parsedOutput);

  } catch (error: any) {
    console.error("Groq Scanner API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
