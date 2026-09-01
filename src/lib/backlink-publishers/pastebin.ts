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

  // Generate unique plain text content for Pastebin (quick reference format)
  let pasteCode: string;
  try {
    const { generatePlatformContent } = await import("./content-generator");
    const result = await generatePlatformContent("pastebin", params.title, params.slug);
    pasteCode = result.plainText;
  } catch {
    pasteCode = `${params.title} — Recruitment 2026\n\nA new government job notification has been announced. Check eligibility and apply at:\n${jobUrl}\n\nWebsite: Rojgar Suvidha (https://www.rojgarsuvidha.com)\nTelegram: @govermentform (https://t.me/govermentform)\n\nStay updated with daily sarkari job alerts, admit cards, answer keys & results.`;
  }


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
        api_paste_format: "text",
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
