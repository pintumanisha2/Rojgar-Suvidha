/**
 * ═══════════════════════════════════════════════════════════════════
 * LIVEJOURNAL API (DA-89) — REAL AUTO-PUBLISHER
 * ═══════════════════════════════════════════════════════════════════
 * Publishes satellite posts to LiveJournal (DA-89)
 *
 * Required ENV vars (in Vercel):
 *   LIVEJOURNAL_USERNAME — Your LiveJournal username
 *   LIVEJOURNAL_PASSWORD — Your LiveJournal account password
 */

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://www.rojgarsuvidha.com";

function getLiveJournalCredentials() {
  return {
    USERNAME: process.env.LIVEJOURNAL_USERNAME?.trim(),
    PASSWORD: process.env.LIVEJOURNAL_PASSWORD?.trim(),
  };
}

/**
 * Publish a satellite post to LiveJournal (DA-89)
 * Returns live LiveJournal post URL or null on failure.
 */
export async function publishToLivejournal(params: {
  jobId: string;
  title: string;
  slug: string;
  category?: string;
}): Promise<string | null> {
  const { USERNAME, PASSWORD } = getLiveJournalCredentials();

  if (!USERNAME || !PASSWORD) {
    console.log("ℹ️ [LiveJournal Publisher] LIVEJOURNAL_USERNAME or LIVEJOURNAL_PASSWORD missing — skipping.");
    return null;
  }

  const jobUrl = `${BASE_URL}/job/${params.slug}`;

  const eventHtml = `
    <h2>${params.title} — Recruitment 2026 Notification</h2>
    <p>A new government job notification has been released across India. Candidates searching for latest sarkari naukri vacancies can check complete eligibility criteria, application fees, age limits, and selection procedures.</p>
    <p><strong>Official Notification & Online Application Portal:</strong> <a href="${jobUrl}" target="_blank" rel="dofollow"><strong>Rojgar Suvidha — Official Application Link</strong></a></p>
    <p>📢 <em>Join Telegram Channel <a href="https://t.me/govermentform">@govermentform</a> for daily job alerts.</em></p>
  `.trim();

  const now = new Date();

  try {
    const res = await fetch("https://www.livejournal.com/interface/flat", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": "RojgarSuvidhaBot/1.0",
      },
      body: new URLSearchParams({
        mode: "postevent",
        user: USERNAME,
        password: PASSWORD,
        auth_method: "clear",
        ver: "1",
        subject: `${params.title.slice(0, 60)} — Rojgar Suvidha`,
        event: eventHtml,
        year: now.getUTCFullYear().toString(),
        mon: (now.getUTCMonth() + 1).toString(),
        day: now.getUTCDate().toString(),
        hour: now.getUTCHours().toString(),
        min: now.getUTCMinutes().toString(),
      }).toString(),
      signal: AbortSignal.timeout(15000),
    });

    const responseText = await res.text();
    const lines = responseText.split("\n");

    // LiveJournal flat interface returns line-by-line key/value format:
    // success
    // url
    // http://username.livejournal.com/1234.html
    const urlIdx = lines.indexOf("url");
    const hasSuccess = lines.includes("success") || lines[0] === "success";

    if (res.ok && urlIdx !== -1 && lines[urlIdx + 1] && hasSuccess) {
      const liveUrl = lines[urlIdx + 1].trim();
      console.log(`✅ [LiveJournal Publisher] Published: ${liveUrl}`);
      return liveUrl;
    } else {
      (globalThis as any)._lastLjError = `Status ${res.status}: ${responseText}`;
      console.warn("⚠️ [LiveJournal Publisher] API Error:", responseText);
      return null;
    }
  } catch (err: any) {
    (globalThis as any)._lastLjError = `Exception: ${err.message}`;
    console.warn("⚠️ [LiveJournal Publisher] Exception:", err.message);
    return null;
  }
}
