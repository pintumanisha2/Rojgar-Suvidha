/**
 * PINTEREST PINS API — REAL AUTO-PUBLISHER (DA-94)
 *
 * Required ENV vars (add to Vercel):
 *   PINTEREST_ACCESS_TOKEN  — From developers.pinterest.com
 *   PINTEREST_BOARD_ID      — Your official board ID
 */

const PINTEREST_TOKEN = process.env.PINTEREST_ACCESS_TOKEN;
const PINTEREST_BOARD_ID = process.env.PINTEREST_BOARD_ID;
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://www.rojgarsuvidha.com";

const ANCHOR_TEXTS = [
  "Sarkari Naukri 2026 — Apply Now on Rojgar Suvidha",
  "Government Jobs Notification — Check Eligibility & Apply",
  "Rojgar Suvidha — India's #1 Sarkari Naukri Portal",
  "Latest Govt Jobs — Direct Apply Link Available",
];

export async function publishToPinterest(params: {
  jobId: string;
  title: string;
  slug: string;
  category?: string;
  bannerUrl?: string;
}): Promise<string | null> {
  if (!PINTEREST_TOKEN || !PINTEREST_BOARD_ID) {
    console.log("ℹ️ [Pinterest Publisher] Credentials not set — skipping.");
    return null;
  }

  const jobUrl = `${BASE_URL}/job/${params.slug}`;
  const pinTitle = `${params.title} — Rojgar Suvidha`.slice(0, 100);
  const description = ANCHOR_TEXTS[Math.floor(Math.random() * ANCHOR_TEXTS.length)];

  // Use dynamic OG banner as the pin image
  const imageUrl = params.bannerUrl ||
    `${BASE_URL}/api/og/banner?title=${encodeURIComponent(params.title)}&category=${encodeURIComponent(params.category || "latest-jobs")}`;

  try {
    const res = await fetch("https://api.pinterest.com/v5/pins", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${PINTEREST_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        board_id: PINTEREST_BOARD_ID,
        title: pinTitle,
        description: `${description}\n\n${jobUrl}`,
        link: jobUrl,
        media_source: {
          source_type: "image_url",
          url: imageUrl,
        },
      }),
      signal: AbortSignal.timeout(15000),
    });
    const data = await res.json();
    if (res.ok && data?.id) {
      const pinUrl = `https://pinterest.com/pin/${data.id}`;
      console.log(`✅ [Pinterest Publisher] Pin published: ${pinUrl}`);
      return pinUrl;
    } else {
      console.warn("⚠️ [Pinterest Publisher] API error:", JSON.stringify(data));
      return null;
    }
  } catch (err: any) {
    console.warn("⚠️ [Pinterest Publisher] Exception:", err.message);
    return null;
  }
}
