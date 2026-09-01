/**
 * ═══════════════════════════════════════════════════════════════════
 * GITHUB GISTS API (DA-96) — REAL AUTO-PUBLISHER
 * ═══════════════════════════════════════════════════════════════════
 * Creates instant markdown Gist pages on GitHub (DA-96)
 * Google indexes GitHub Gists super fast (often within 1-2 hours)
 */

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://www.rojgarsuvidha.com";

function getGithubToken(): string | undefined {
  return (process.env.GITHUB_BACKLINK_TOKEN || process.env.GITHUB_TOKEN)?.trim();
}

/**
 * Publish a satellite markdown page to GitHub Gists (DA-96)
 * Returns live Gist URL or null on failure.
 */
export async function publishToGithub(params: {
  jobId: string;
  title: string;
  slug: string;
  category?: string;
}): Promise<string | null> {
  const jobUrl = `${BASE_URL}/job/${params.slug}`;

  const mdContent = `# ${params.title} — Notification Overview

A new government recruitment notification has been published for **${params.title}**. 

Eligible candidates across India can check the complete eligibility details, vacancy distribution, application fee, and selection process.

## Official Links & Application Guide

- **Official Portal:** [Rojgar Suvidha — Direct Apply Link](${jobUrl})
- **Updates Channel:** [Telegram Alert @govermentform](https://t.me/govermentform)

*This is an automated educational summary. For official notifications, visit [Rojgar Suvidha](${jobUrl}).*
`.trim();

  // Sanitize filename for GitHub Gist
  const safeSlug = params.slug.replace(/[^a-zA-Z0-9-]/g, "").slice(0, 35);
  const fileName = `${safeSlug}-recruitment-2026.md`;

  const token = getGithubToken();

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "User-Agent": "RojgarSuvidhaBot/1.0",
    "Accept": "application/vnd.github.v3+json",
  };

  if (token) {
    headers["Authorization"] = token.startsWith("bearer ") || token.startsWith("Bearer ")
      ? token
      : `token ${token}`;
  }

  try {
    const res = await fetch("https://api.github.com/gists", {
      method: "POST",
      headers,
      body: JSON.stringify({
        description: `${params.title} — Rojgar Suvidha Govt Job Alert`,
        public: true,
        files: {
          [fileName]: {
            content: mdContent,
          },
        },
      }),
      signal: AbortSignal.timeout(15000),
    });
    const json = await res.json();

    if (res.ok && json.html_url) {
      console.log(`✅ [GitHub Publisher] Published Gist: ${json.html_url}`);
      return json.html_url;
    } else {
      console.warn("⚠️ [GitHub Publisher] API Error:", res.status, JSON.stringify(json));
      return null;
    }
  } catch (err: any) {
    console.warn("⚠️ [GitHub Publisher] Exception:", err.message);
    return null;
  }
}
