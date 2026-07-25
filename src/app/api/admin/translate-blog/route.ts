import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { SUPPORTED_LANGUAGES, type SupportedLang } from "@/lib/i18n";

export const maxDuration = 60;

// ── Target language full names for AI prompt clarity ─────────────────────────
const LANG_NAMES: Record<SupportedLang, string> = {
  hi: "Hindi (Devanagari script)",
  bn: "Bengali (বাংলা script)",
  ur: "Urdu (Nastaliq/Arabic script, right-to-left)",
};

// ── Column name in Supabase jobs table ────────────────────────────────────────
const LANG_COLUMN: Record<SupportedLang, string> = {
  hi: "blog_content_hi",
  bn: "blog_content_bn",
  ur: "blog_content_ur",
};

// ── Call Gemini for translation ───────────────────────────────────────────────
async function translateWithGemini(
  htmlContent: string,
  targetLang: SupportedLang,
  title: string
): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY not configured");

  const langName = LANG_NAMES[targetLang];
  const isRTL = targetLang === "ur";

  const systemPrompt = `You are a professional government job content translator specializing in Indian government recruitment content. You translate HTML blog posts from English to ${langName}.

CRITICAL TRANSLATION RULES:
1. Translate ONLY the text content — do NOT change any HTML tags, attributes, or inline styles.
2. Keep ALL of these in English (do not translate): organization names (SSC, IBPS, RRB, UPSC, NDA, CRPF, etc.), exam names, URLs, numbers, dates, ₹ amounts, technical terms (CBT, PET, PST, DV, OMR), state names, post names.
3. Keep ALL HTML structure exactly intact — every <div>, <p>, <h1>, <h2>, <table>, <tr>, <td>, <strong>, <mark>, <details>, <summary>, inline style="..." MUST remain unchanged.
4. The translation must sound NATURAL and CONVERSATIONAL in ${langName} — not like a machine translation. Indian government job seekers should feel comfortable reading it.
5. ${isRTL ? "For Urdu: add dir='rtl' attribute to the outermost wrapper div if not already present. Text flow must be right-to-left." : ""}
6. Sarkari job terms that are commonly used in ${langName}: use the naturally accepted local terms (e.g., in Hindi: "आवेदन करें" for apply, "अंतिम तिथि" for last date, "रिक्तियाँ" for vacancies).
7. NEVER translate: script tags, JSON-LD content, URLs, link hrefs, image src attributes.
8. Output ONLY the translated HTML — no explanation, no markdown.`;

  const userPrompt = `Translate this government job blog HTML to ${langName}. Title: "${title}"

HTML TO TRANSLATE:
${htmlContent.substring(0, 25000)}`;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: systemPrompt }] },
        contents: [{ parts: [{ text: userPrompt }] }],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 32000,
        },
      }),
      signal: AbortSignal.timeout(55000),
    }
  );

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Gemini translation failed: ${err.substring(0, 200)}`);
  }

  const data = await response.json();
  const translated = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
  if (!translated) throw new Error("Empty translation response from Gemini");

  // Clean up any markdown code blocks Gemini might wrap
  return translated
    .replace(/^```html?\n?/i, "")
    .replace(/```$/g, "")
    .trim();
}

/**
 * POST /api/admin/translate-blog
 * Body: { jobId: string, languages?: SupportedLang[] }
 *
 * Translates the English blog_content of a job post into Hindi, Bengali, Urdu
 * and stores them in blog_content_hi, blog_content_bn, blog_content_ur columns.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { jobId, languages } = body as {
      jobId: string;
      languages?: SupportedLang[];
    };

    if (!jobId) {
      return NextResponse.json({ error: "jobId is required" }, { status: 400 });
    }

    // Fetch the English blog content
    const { data: job, error: fetchError } = await supabase
      .from("jobs")
      .select("id, title, slug, blog_content, blog_content_hi, blog_content_bn, blog_content_ur")
      .eq("id", jobId)
      .single();

    if (fetchError || !job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    if (!job.blog_content) {
      return NextResponse.json({ error: "No blog_content to translate" }, { status: 400 });
    }

    // Determine which languages to translate
    const langsToTranslate: SupportedLang[] = (languages && languages.length > 0)
      ? languages
      : SUPPORTED_LANGUAGES as unknown as SupportedLang[];

    const results: Record<string, { success: boolean; error?: string; skipped?: boolean }> = {};

    // Translate each language (sequentially to avoid rate limits)
    for (const lang of langsToTranslate) {
      const column = LANG_COLUMN[lang];

      // Skip if already translated (unless forced)
      if (body.force !== true && job[column as keyof typeof job]) {
        results[lang] = { success: true, skipped: true };
        continue;
      }

      try {
        console.log(`Translating job "${job.title}" to ${lang}...`);
        const translated = await translateWithGemini(job.blog_content, lang, job.title);

        // Save to Supabase
        const { error: updateError } = await supabase
          .from("jobs")
          .update({ [column]: translated })
          .eq("id", jobId);

        if (updateError) throw new Error(updateError.message);
        results[lang] = { success: true };
        console.log(`✅ Translated to ${lang} successfully`);
      } catch (err: any) {
        console.error(`❌ Translation to ${lang} failed:`, err.message);
        results[lang] = { success: false, error: err.message };
      }
    }

    const allSuccess = Object.values(results).every(r => r.success);
    return NextResponse.json({
      success: allSuccess,
      jobId,
      slug: job.slug,
      results,
      summary: `Translated "${job.title}" — ${Object.entries(results).map(([l, r]) => `${l}: ${r.skipped ? "already done" : r.success ? "✅" : "❌"}`).join(" | ")}`,
    });
  } catch (err: any) {
    console.error("translate-blog error:", err);
    return NextResponse.json({ error: err.message || "Server error" }, { status: 500 });
  }
}
