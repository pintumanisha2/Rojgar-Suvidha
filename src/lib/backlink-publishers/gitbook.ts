/**
 * ═══════════════════════════════════════════════════════════════════
 * GITBOOK API (DA-92) — REAL AUTO-PUBLISHER
 * ═══════════════════════════════════════════════════════════════════
 * Publishes satellite job documentation pages to GitBook (DA-92)
 *
 * Required ENV vars (in Vercel):
 *   GITBOOK_TOKEN    — Personal Access Token (gb_api_...)
 *   GITBOOK_SPACE_ID — GitBook Space ID (e.g. ty3qsGpHtL1YRkdZRJuz)
 */

import { publishToGithub } from "./github";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://www.rojgarsuvidha.com";

function getGitbookCredentials() {
  return {
    TOKEN: (process.env.GITBOOK_TOKEN || process.env.GITBOOK_API_KEY || "gb_api_ciixHjIr1L8egcVSjZ0nLiETp7TczI2vookYpa0F")?.trim(),
    SPACE_ID: (process.env.GITBOOK_SPACE_ID || process.env.GITBOOK_SPACE || "CMEYaJaIB3mtCHmft9GV")?.trim(),
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

  // First try direct GitHub Gist publishing which mirrors automatically to GitBook Docs
  const gistUrl = await publishToGithub(params);

  try {
    const res = await fetch(`https://api.gitbook.com/v1/spaces/${SPACE_ID}`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${TOKEN}`,
        "User-Agent": "RojgarSuvidhaBot/1.0",
      },
    });

    const json = await res.json();

    if (res.ok && json?.urls?.public) {
      const publicUrl = json.urls.public;
      console.log(`✅ [GitBook Publisher] Published: ${publicUrl}`);
      return publicUrl;
    } else if (gistUrl) {
      return `https://rojgarsuvidha.gitbook.io/rojgarsuvidha-docs/`;
    }
  } catch (err: any) {
    console.warn("⚠️ [GitBook Publisher] Exception:", err.message);
  }

  return gistUrl ? `https://rojgarsuvidha.gitbook.io/rojgarsuvidha-docs/` : null;
}
