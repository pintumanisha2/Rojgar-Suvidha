/**
 * ═══════════════════════════════════════════════════════════════════
 * PASTEBIN API (DA-89) — REAL AUTO-PUBLISHER
 * ═══════════════════════════════════════════════════════════════════
 * Publishes satellite job notifications to Pastebin (DA-89)
 *
 * Required ENV var (in Vercel):
 *   PASTEBIN_API_KEY — 1-click free developer API key from pastebin.com/doc_api
 */

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://www.rojgarsuvidha.com";

function getPastebinApiKey() {
  return (process.env.PASTEBIN_API_KEY || process.env.PASTEBIN_DEV_KEY)?.trim();
}

/**
 * Publish a satellite post to Pastebin (DA-89)
 * Returns live Pastebin URL (e.g. https://pastebin.com/abc12345) or null on failure.
 */
export async function publishToPastebin(params: {
  jobId: string;
  title: string;
  slug: string;
  category?: string;
}): Promise<string | null> {
  const apiKey = getPastebinApiKey();

  if (!apiKey) {
    console.log("ℹ️ [Pastebin Publisher] PASTEBIN_API_KEY missing — skipping.");
    return null;
  }

  const jobUrl = `${BASE_URL}/job/${params.slug}`;

  const pasteCode = `
# ${params.title} — Recruitment 2026 Notification

A new government job notification has been announced across India. Candidates searching for sarkari naukri vacancies can check complete qualification details, age limits, and online application procedures.

============================================================
OFFICIAL NOTIFICATION & APPLY ONLINE PORTAL:
${jobUrl}
============================================================

Website: Rojgar Suvidha (https://www.rojgarsuvidha.com)
Telegram Channel: @govermentform (https://t.me/govermentform)

Stay updated with daily sarkari job alerts, admit cards, answer keys & results.
`.trim();

  try {
    const res = await fetch("https://pastebin.com/api/api_post.php", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": "RojgarSuvidhaBot/1.0",
      },
      body: new URLSearchParams({
        api_option: "paste",
        api_dev_key: apiKey,
        api_paste_code: pasteCode,
        api_paste_name: `${params.title.slice(0, 50)} — Rojgar Suvidha`,
        api_paste_private: "0", // 0 = Public paste
        api_paste_expire_date: "N", // N = Never expire
        api_paste_format: "markdown",
      }).toString(),
      signal: AbortSignal.timeout(15000),
    });

    const responseText = (await res.text()).trim();

    if (res.ok && responseText.startsWith("http")) {
      console.log(`✅ [Pastebin Publisher] Published: ${responseText}`);
      return responseText;
    } else {
      console.warn("⚠️ [Pastebin Publisher] API Error:", responseText);
      return null;
    }
  } catch (err: any) {
    console.warn("⚠️ [Pastebin Publisher] Exception:", err.message);
    return null;
  }
}
