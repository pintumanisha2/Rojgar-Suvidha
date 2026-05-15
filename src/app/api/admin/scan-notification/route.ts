import { NextResponse } from "next/server";

export const maxDuration = 60; // Max allowed for Vercel Hobby plan to prevent timeouts

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

### CONTENT QUALITY & WRITING STYLE (CRITICAL):
1. LANGUAGE & TONE: Write in extremely simple, conversational English (like a helpful teacher explaining to a student). Do NOT use complex vocabulary.
2. DEEP EXPLANATIONS (USE YOUR KNOWLEDGE): The user wants to know what they are applying for! Do not just copy the notification. You MUST use your own internal knowledge to explain the job.
   - For example, if it's "SSC CGL", you must write a section explaining: "What is SSC CGL?", "What kind of work will you do?", and "What is the expected salary and promotions?".
3. NO FLUFF, HIGH VALUE: To make the blog long and valuable, focus on explaining the "Selection Process" in detail, "Syllabus/Exam Pattern" (if known), and "Eligibility".
4. ZERO AI WORDS: Never use words like: delve, plethora, crucial, navigating, landscape, testament, moreover, furthermore.
3. EMOJIS: Strictly ZERO (0) emojis.
4. DESIGNER TABLES: You MUST use HTML <table> for Dates, Fees, and Vacancies. 
   - Apply these EXACT inline styles to the <table> tag: \`style="width: 100%; border-collapse: collapse; margin-bottom: 1.5rem; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); border-radius: 8px; overflow: hidden;"\`
   - Apply this to <th> tags: \`style="background-color: #4f46e5; color: white; padding: 12px; text-align: left; font-weight: bold;"\`
   - Apply this to <td> tags: \`style="padding: 12px; border-bottom: 1px solid #e5e7eb;"\`
5. SEO OPTIMIZATION & FAQ DESIGN: 
   - Highlight important keywords using <strong> tags.
   - Use H2 for major headings, H3 for sub-sections.
   - For the "Frequently Asked Questions (FAQs)" section, you MUST use interactive <details> and <summary> tags.
   - Use this EXACT format for each of the FAQs:
     <details style="margin-bottom: 1rem; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; background-color: #f8fafc; cursor: pointer;">
       <summary style="font-weight: bold; color: #4f46e5; outline: none; font-size: 1.1rem;">What is the question?</summary>
       <p style="margin-top: 12px; color: #475569; line-height: 1.6;">This is the detailed answer explaining the concept.</p>
     </details>

### STRICT HTML STRUCTURE TO FOLLOW:
You MUST format your blog exactly in this order to provide maximum value:
- H2: Introduction
- H2: What is this Job/Organization? (E.g., What is SSC CGL? What is the Job Profile & Work?)
- H2: Salary Structure & Benefits (Explain the payscale and perks clearly).
- H2: Important Dates & Application Fees (Use Clean HTML Tables).
- H2: Eligibility Criteria (Age Limit & Educational Qualification explained simply).
- H2: Vacancy Details (Use HTML Table).
- H2: Selection Process & Exam Pattern (Explain the steps like Tier 1, Physical Test, Interview).
- H2: How to Apply via Rojgar Suvidha (Pitch the "Apply For Me" service as the safest way to avoid rejection).
- H2: Frequently Asked Questions (FAQs) (Write at least 5 highly relevant FAQs).

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
  "blogHtml": "The full, rich HTML content following the structure above. CRITICAL: You must escape all double quotes inside HTML attributes (e.g. style=\\\"color: red\\\") to ensure valid JSON."
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
