/**
 * ═══════════════════════════════════════════════════════════════════
 * GITBOOK API (DA-92) — REAL AUTO-PUBLISHER
 * ═══════════════════════════════════════════════════════════════════
 * Publishes satellite job documentation pages to GitBook (DA-92)
 *
 * Required ENV vars (in Vercel):
 *   GITBOOK_TOKEN    — Personal Access Token (from app.gitbook.com/account/developer)
 *   GITBOOK_SPACE_ID — GitBook Space ID (from Space Settings)
 */

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://www.rojgarsuvidha.com";

function getGitbookCredentials() {
  return {
    TOKEN: (process.env.GITBOOK_TOKEN || process.env.GITBOOK_API_KEY)?.trim(),
    SPACE_ID: (process.env.GITBOOK_SPACE_ID || process.env.GITBOOK_SPACE)?.trim(),
  };
}

/**
 * Publish a satellite documentation page to GitBook (DA-92)
 * Returns live GitBook page URL or null on failure.
 */
export async function publishToGitbook(params: {
  jobId: string;
  title: string;
  slug: string;
  category?: string;
}): Promise<string | null> {
  const { TOKEN, SPACE_ID } = getGitbookCredentials();

  if (!TOKEN || !SPACE_ID) {
    console.log("ℹ️ [GitBook Publisher] GITBOOK_TOKEN or GITBOOK_SPACE_ID missing — skipping.");
    return null;
  }

  const jobUrl = `${BASE_URL}/job/${params.slug}`;
  const pageTitle = `${params.title.slice(0, 50)} — Rojgar Suvidha`;

  const markdownContent = `
# ${params.title} — Recruitment 2026

A new government job recruitment notification has been published across India. Candidates looking for sarkari naukri alerts can check complete qualification criteria, age limits, and online application procedures.

## Direct Online Application Portal
[Rojgar Suvidha — Official Application & Notification Link](${jobUrl})

📢 *Join Telegram Channel [@govermentform](https://t.me/govermentform) for instant sarkari job updates.*
`.trim();

  try {
    const res = await fetch(`https://api.gitbook.com/v1/spaces/${SPACE_ID}/content/page`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${TOKEN}`,
        "Content-Type": "application/json",
        "User-Agent": "RojgarSuvidhaBot/1.0",
      },
      body: JSON.stringify({
        title: pageTitle,
        markdown: markdownContent,
      }),
      signal: AbortSignal.timeout(15000),
    });

    const json = await res.json();

    if (res.ok && (json?.id || json?.path || json?.urls?.app)) {
      const liveUrl = json?.urls?.app || `https://app.gitbook.com/s/${SPACE_ID}/${json.id}`;
      console.log(`✅ [GitBook Publisher] Published: ${liveUrl}`);
      return liveUrl;
    } else {
      console.warn("⚠️ [GitBook Publisher] API Error:", res.status, JSON.stringify(json));
      return null;
    }
  } catch (err: any) {
    console.warn("⚠️ [GitBook Publisher] Exception:", err.message);
    return null;
  }
}
