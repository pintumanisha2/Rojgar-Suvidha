/**
 * banner-generator.ts — AI Banner Generator v1.0
 *
 * Flow:
 *   1. Build category-specific AI prompt from job title
 *   2. Call Hugging Face FLUX.1-schnell → get JPEG binary
 *   3. Upload to Supabase Storage (public bucket: "banners")
 *   4. Return permanent public URL
 *
 * Fallback: returns null on failure → caller uses /api/og/banner SVG instead
 *
 * Storage: Supabase Storage, public bucket "banners"
 * URL format: {SUPABASE_URL}/storage/v1/object/public/banners/{slug}.jpg
 *
 * Volume: ~200 banners/month × 200KB = 40MB/month
 * Supabase free tier: 1GB → ~25 months headroom ✅
 *
 * HF Free Tier: ~30 req/min — our usage ~4/hour = well within limit
 */

import { createClient } from "@supabase/supabase-js";

// ── Config ────────────────────────────────────────────────────────────────────
const HF_API_URL =
  "https://api-inference.huggingface.co/models/black-forest-labs/FLUX.1-schnell";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const BANNER_BUCKET = "banners"; // Public bucket — must be created in Supabase dashboard

// ── Prompt Builder ────────────────────────────────────────────────────────────
function buildAIPrompt(title: string, category: string): string {
  const t = title.toLowerCase();
  let subject = "Indian government official emblem Ashoka Pillar gold seal";

  if (category === "results") {
    subject = "trophy award gold certificate merit scroll Indian government";
  } else if (category === "admit-card") {
    subject = "official exam hall rows of students admit card India professional";
  } else if (category === "answer-key") {
    subject = "answer sheet pencil checkmark exam paper India official";
  } else if (category === "admission") {
    subject = "graduation cap diploma books university India glowing golden";
  } else if (category === "news") {
    subject = "newspaper headlines India government official press release";
  } else {
    // Latest-jobs: keyword-based visual
    if (/railway|rrb|ntpc|alp|loco/.test(t)) {
      subject = "Vande Bharat train Indian Railways gold emblem high speed";
    } else if (/police|constable|sub inspector|lokrakshak/.test(t)) {
      subject = "Indian Police gold metallic badge navy blue uniform professional";
    } else if (/army|navy|air force|nda|cds|defence|agniveer/.test(t)) {
      subject = "Indian Armed Forces gold badge military tri-service emblem";
    } else if (/\bbank\b|sbi|ibps|rbi|\bclerk\b|nabard/.test(t)) {
      subject = "State Bank of India SBI gold coins financial building professional";
    } else if (/isro|drdo|scientist|engineer|technical/.test(t)) {
      subject = "ISRO rocket launch satellite space dark blue glowing India";
    } else if (/teacher|tet|ctet|kvs|nvs|\bschool\b|\beducation\b/.test(t)) {
      subject = "education graduation diploma books golden glow India school";
    } else if (/post office|gds|dak sevak|india post/.test(t)) {
      subject = "India Post postal van envelope gold stamp official";
    } else if (/upsc|ias|ips|civil service/.test(t)) {
      subject = "UPSC Ashoka lion capital gold India government official hall";
    } else if (/\bssc\b|cgl|chsl|staff selection/.test(t)) {
      subject = "Staff Selection Commission SSC gold seal official India";
    } else if (/nurse|anm|gnm|\bhealth\b|\bmedical\b|\bdoctor\b/.test(t)) {
      subject = "Indian healthcare medical emblem blue cross stethoscope professional";
    } else if (/\bpsc\b|patwari|lekhpal|state service/.test(t)) {
      subject = "State Public Service Commission emblem government building India";
    }
  }

  return (
    `Professional Indian government recruitment banner background, ${subject}, ` +
    `dark navy blue to black gradient, cinematic dramatic lighting, ` +
    `golden accents, ultra-realistic 8K render, no text, no watermark, ` +
    `wide 1200x630 aspect ratio, clean modern government style`
  );
}

// ── Hugging Face FLUX.1-schnell ───────────────────────────────────────────────
async function callHuggingFace(prompt: string): Promise<Buffer | null> {
  const hfKey = process.env.HF_API_KEY;
  if (!hfKey) {
    console.warn("[BannerGen] HF_API_KEY not set — skipping");
    return null;
  }

  try {
    const res = await fetch(HF_API_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${hfKey}`,
        "Content-Type": "application/json",
        "Accept": "image/jpeg",
      },
      body: JSON.stringify({
        inputs: prompt,
        parameters: {
          width: 1200,
          height: 630,
          num_inference_steps: 4,  // FLUX-schnell: 4 = fast + good quality
          guidance_scale: 0,       // FLUX-schnell specific setting
        },
      }),
      signal: AbortSignal.timeout(60000), // 60s (HF cold start ~30s)
    });

    if (res.status === 503) {
      // Model still loading — normal for free tier cold start
      console.warn("[BannerGen] HF 503 (model loading) — will retry next cron run");
      return null;
    }

    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      console.warn(`[BannerGen] HF error ${res.status}: ${errText.slice(0, 200)}`);
      return null;
    }

    const contentType = res.headers.get("content-type") || "";
    if (!contentType.includes("image")) {
      const body = await res.text().catch(() => "");
      console.warn(`[BannerGen] HF non-image (${contentType}): ${body.slice(0, 200)}`);
      return null;
    }

    const arrayBuffer = await res.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    if (buffer.length < 5000) {
      console.warn(`[BannerGen] HF image too small (${buffer.length}B) — likely error`);
      return null;
    }

    console.log(`[BannerGen] HF image OK: ${Math.round(buffer.length / 1024)}KB`);
    return buffer;
  } catch (err: any) {
    console.warn("[BannerGen] HF call exception:", err.message);
    return null;
  }
}

// ── Supabase Storage helpers ──────────────────────────────────────────────────
function getSupabaseAdmin() {
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
}

/** Returns existing public URL if banner already uploaded — idempotent */
async function bannerExists(slug: string): Promise<string | null> {
  try {
    const supabase = getSupabaseAdmin();
    const { data } = await supabase.storage
      .from(BANNER_BUCKET)
      .list("", { search: `${slug}.jpg` });
    if (data && data.some((f) => f.name === `${slug}.jpg`)) {
      const { data: urlData } = supabase.storage
        .from(BANNER_BUCKET)
        .getPublicUrl(`${slug}.jpg`);
      return urlData.publicUrl || null;
    }
    return null;
  } catch {
    return null;
  }
}

async function uploadToSupabase(slug: string, imageBuffer: Buffer): Promise<string | null> {
  try {
    const supabase = getSupabaseAdmin();
    const path = `${slug}.jpg`;

    const { error } = await supabase.storage
      .from(BANNER_BUCKET)
      .upload(path, imageBuffer, {
        contentType: "image/jpeg",
        upsert: true, // Overwrite if re-generated
        cacheControl: "31536000", // 1 year browser cache
      });

    if (error) {
      console.warn(`[BannerGen] Supabase upload error: ${error.message}`);
      return null;
    }

    const { data } = supabase.storage
      .from(BANNER_BUCKET)
      .getPublicUrl(path);

    const url = data.publicUrl;
    console.log(`[BannerGen] Uploaded to Supabase: ${url} (${Math.round(imageBuffer.length / 1024)}KB)`);
    return url;
  } catch (err: any) {
    console.warn("[BannerGen] Supabase upload exception:", err.message);
    return null;
  }
}

// ── Main Export ───────────────────────────────────────────────────────────────
/**
 * Generate an AI banner via HF FLUX.1-schnell and store in Supabase Storage.
 *
 * @param slug     - Unique post slug → filename: {slug}.jpg
 * @param title    - Post title (prompt construction)
 * @param category - Blog category
 * @returns        - Public URL string, or null (caller falls back to /api/og/banner)
 */
export async function generateAndUploadBanner(
  slug: string,
  title: string,
  category: string
): Promise<string | null> {
  try {
    // 1. Already generated? Return cached URL
    const existing = await bannerExists(slug);
    if (existing) {
      console.log(`[BannerGen] Cache hit for slug: ${slug}`);
      return existing;
    }

    // 2. Build AI prompt
    const prompt = buildAIPrompt(title, category);
    console.log(`[BannerGen] Generating banner: "${title.slice(0, 60)}" | ${category}`);

    // 3. Call HF FLUX
    const imageBuffer = await callHuggingFace(prompt);
    if (!imageBuffer) return null;

    // 4. Upload to Supabase
    return await uploadToSupabase(slug, imageBuffer);
  } catch (err: any) {
    console.warn("[BannerGen] Unexpected error:", err.message);
    return null;
  }
}
