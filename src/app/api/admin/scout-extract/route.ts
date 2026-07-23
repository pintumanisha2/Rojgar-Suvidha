import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { url } = await req.json();

    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    // ── Step 1: Fetch page content via Jina AI Reader ─────────────────────────
    // r.jina.ai is a FREE service that renders JS-heavy pages (LinkedIn, Naukri, etc.)
    // and returns clean markdown text — no API key required.
    let extractedText = "";

    try {
      const jinaUrl = `https://r.jina.ai/${url}`;
      const jinaResponse = await fetch(jinaUrl, {
        headers: {
          "Accept": "text/plain",
          "X-Return-Format": "text",
          "X-With-Links-Summary": "false",
          "X-With-Images-Summary": "false",
        },
        signal: AbortSignal.timeout(20000), // 20s timeout for JS-rendered pages
      });

      if (jinaResponse.ok) {
        const text = await jinaResponse.text();
        // Jina returns full page including some header — extract the useful part
        extractedText = text.replace(/\s+/g, " ").trim().substring(0, 20000);
      }
    } catch (jinaError) {
      console.warn("Jina AI Reader failed, trying direct fetch fallback:", jinaError);
    }

    // ── Step 2: Fallback to direct fetch if Jina failed ───────────────────────
    if (!extractedText || extractedText.length < 100) {
      try {
        const { load } = await import("cheerio");
        const response = await fetch(url, {
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
            "Accept": "text/html,application/xhtml+xml,*/*;q=0.9",
            "Accept-Language": "en-US,en;q=0.9",
            "Cache-Control": "no-cache",
          },
          signal: AbortSignal.timeout(10000),
        });

        if (response.ok) {
          const html = await response.text();
          const $ = load(html);
          $("script, style, noscript, iframe, img, svg, video, nav, footer").remove();
          extractedText = $("body").text().replace(/\s+/g, " ").trim().substring(0, 20000);
        }
      } catch (fallbackError) {
        console.error("Direct fetch fallback also failed:", fallbackError);
      }
    }

    if (!extractedText || extractedText.length < 80) {
      return NextResponse.json({
        error: "Could not read this page. Both LinkedIn and Naukri block automated scrapers. Please copy the job description text manually and paste it in the Description field.",
      }, { status: 400 });
    }

    // ── Step 3: Send to Gemini AI for structured extraction ───────────────────
    const geminiApiKey = process.env.GEMINI_API_KEY;
    if (!geminiApiKey) {
      return NextResponse.json({ error: "Gemini API Key missing in .env.local" }, { status: 500 });
    }

    const prompt = `You are an expert HR Data Extraction AI.
I will provide you with text scraped from a job posting page.
Extract the following fields accurately and return ONLY a valid raw JSON object (no markdown, no \`\`\`json wrapper).

Required JSON keys:
{
  "title": "Exact job title",
  "company": "Name of the hiring company",
  "location": "Job location (e.g., Remote, Bangalore, Delhi / NCR)",
  "salary": "Salary range (e.g., ₹10L - ₹15L/yr or 3.25-5 LPA). Use 'Not Disclosed' if not found",
  "experience": "Required experience (e.g., 0-4 Years, 3+ Years). Use 'Not Specified' if not found",
  "skills": ["Array", "of", "key", "required", "skills"],
  "description": "Clean job description with responsibilities and requirements (use newlines for readability). Remove website navigation/footer text."
}

Job page text:
===
${extractedText}
===

Return ONLY the raw JSON object.`;

    // Try modern Gemini models with fallback to handle quota or availability errors
    const models = ["gemini-1.5-flash", "gemini-1.5-pro", "gemini-2.0-flash-exp"];
    let aiResult: any = null;
    let lastError = "";

    for (const model of models) {
      try {
        const aiResponse = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiApiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ role: "user", parts: [{ text: prompt }] }],
              generationConfig: { temperature: 0.1, maxOutputTokens: 2048 },
            }),
            signal: AbortSignal.timeout(30000),
          }
        );

        const data = await aiResponse.json();

        if (data.error) {
          lastError = data.error.message || "Unknown AI error";
          console.warn(`Model ${model} failed:`, lastError);
          continue; // try next model
        }

        const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
        const cleaned = rawText.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
        aiResult = JSON.parse(cleaned);
        break; // success — stop trying other models

      } catch (modelError: any) {
        lastError = modelError.message;
        console.warn(`Model ${model} error:`, modelError);
        continue;
      }
    }

    if (!aiResult) {
      return NextResponse.json({
        error: `AI extraction failed: ${lastError}. Your Gemini free quota may be exhausted. Wait a few minutes or add billing to your Google AI account.`,
      }, { status: 500 });
    }

    return NextResponse.json(aiResult);

  } catch (error: any) {
    console.error("Scout Extract Route Error:", error);
    return NextResponse.json({ error: "Internal server error: " + error.message }, { status: 500 });
  }
}
