import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { SUPPORTED_LANGUAGES, type SupportedLang } from "@/lib/i18n";
import { callGeminiWithRotation } from "@/lib/gemini-rotator";

export const maxDuration = 60;

// ── Target language full names for AI prompt clarity ─────────────────────────
const LANG_NAMES: Record<SupportedLang, string> = {
  hi: "Hindi (Devanagari script)",
  mai: "Maithili (मैथिली - Devanagari script as spoken in Mithilanchal / Bihar)",
  bho: "Bhojpuri (भोजपुरी - Devanagari script as spoken in Bihar & Purvanchal)",
  mr: "Marathi (Devanagari script)",
  bn: "Bengali (বাংলা script)",
  ur: "Urdu (Nastaliq/Arabic script, right-to-left)",
  gu: "Gujarati (ગુજરાતી script)",
  te: "Telugu (తెలుగు script)",
  ta: "Tamil (தமிழ் script)",
};

// ── Column name in Supabase jobs table ────────────────────────────────────────
const LANG_COLUMN: Record<SupportedLang, string> = {
  hi: "blog_content_hi",
  mai: "blog_content_mai",
  bho: "blog_content_bho",
  mr: "blog_content_mr",
  bn: "blog_content_bn",
  ur: "blog_content_ur",
  gu: "blog_content_gu",
  te: "blog_content_te",
  ta: "blog_content_ta",
};

// ── Call Gemini for translation ───────────────────────────────────────────────
async function translateWithGemini(
  htmlContent: string,
  targetLang: SupportedLang,
  title: string
): Promise<string> {
  const langName = LANG_NAMES[targetLang];
  const isRTL = targetLang === "ur";

  const systemPrompt = `You are a professional Indian government job content translator specializing in recruitment posts. You translate HTML blog posts from English to ${langName}.

CRITICAL TRANSLATION RULES:
1. Translate ONLY the text content — do NOT change any HTML tags, attributes, or inline styles.
2. Keep ALL of these in English (do not translate): organization names (SSC, IBPS, RRB, UPSC, NDA, CRPF, etc.), exam names, URLs, numbers, dates, ₹ amounts, technical terms (CBT, PET, PST, DV, OMR), state names, post names.
3. Keep ALL HTML structure exactly intact — every <div>, <p>, <h1>, <h2>, <table>, <tr>, <td>, <strong>, <mark>, <details>, <summary>, inline style="..." MUST remain unchanged.
4. The translation must sound NATURAL and CONVERSATIONAL in ${langName} — not like a machine translation. Indian government job seekers should feel comfortable reading it.
5. ${isRTL ? "For Urdu: add dir='rtl' attribute to the outermost wrapper div if not already present. Text flow must be right-to-left." : ""}
6. Sarkari job terms that are commonly used in ${langName}: use the naturally accepted local terms (e.g., in Hindi: 'आवेदन करें' for apply, 'अंतिम तिथि' for last date, 'रिक्तियाँ' for vacancies).
7. NEVER translate: script tags, JSON-LD content, URLs, link hrefs, image src attributes.
8. Output ONLY the translated HTML — no explanation, no markdown.`;

  const userPrompt = `Translate this government job blog HTML to ${langName}. Title: "${title}"

HTML TO TRANSLATE:
${htmlContent.substring(0, 25000)}`;

  return await callGeminiWithRotation({
    prompt: userPrompt,
    systemInstruction: systemPrompt,
    temperature: 0.2,
    maxOutputTokens: 8192,
    timeoutMs: 90000,
  });
}

/**
 * POST /api/admin/translate-blog
 * Body: { jobId: string, languages?: SupportedLang[] }
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
      .select("id, title, slug, blog_content")
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

    // Translate each language
    for (const lang of langsToTranslate) {
      const column = LANG_COLUMN[lang];

      try {
        console.log(`Translating job "${job.title}" to ${lang}...`);
        const translated = await translateWithGemini(job.blog_content, lang, job.title);

        // Save to Supabase
        const { error: updateError } = await supabase
          .from("jobs")
          .update({ [column]: translated })
          .eq("id", jobId);

        if (updateError) {
          console.warn(`⚠️ Could not save ${column} (Schema missing column):`, updateError.message);
          results[lang] = { success: false, error: updateError.message };
        } else {
          results[lang] = { success: true };
          console.log(`✅ Translated to ${lang} successfully`);
        }
      } catch (err: any) {
        console.error(`❌ Translation to ${lang} failed:`, err.message);
        results[lang] = { success: false, error: err.message };
      }
    }

    const allSuccess = Object.values(results).some(r => r.success);
    return NextResponse.json({
      success: allSuccess,
      jobId,
      slug: job.slug,
      results,
      summary: `Processed translation for "${job.title}"`,
    });
  } catch (err: any) {
    console.error("translate-blog error:", err);
    return NextResponse.json({ error: err.message || "Server error" }, { status: 500 });
  }
}
