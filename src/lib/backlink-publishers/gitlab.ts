/**
 * ═══════════════════════════════════════════════════════════════════
 * GITLAB SNIPPETS API (DA-94) — REAL AUTO-PUBLISHER
 * ═══════════════════════════════════════════════════════════════════
 * Creates markdown Snippet pages on GitLab (DA-94)
 *
 * Required ENV var (optional):
 *   GITLAB_TOKEN — From gitlab.com → Preferences → Access Tokens (api scope)
 */

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://www.rojgarsuvidha.com";

function getGitlabToken(): string | undefined {
  return (process.env.GITLAB_BACKLINK_TOKEN || process.env.GITLAB_TOKEN)?.trim();
}

import type { JobDetailsPayload } from "./content-generator";

/**
 * Publish a satellite markdown snippet page to GitLab (DA-94)
 * Returns live GitLab Snippet URL or null on failure.
 */
export async function publishToGitlab(
  params: JobDetailsPayload & { jobId: string }
): Promise<string | null> {
  const token = getGitlabToken();
  if (!token) {
    console.log("ℹ️ [GitLab Publisher] GITLAB_TOKEN not set — skipping.");
    return null;
  }

  const jobUrl = `${BASE_URL}/job/${params.slug}`;

  // Generate unique Markdown for GitLab (README/reference document angle)
  let mdContent: string;
  try {
    const { generatePlatformContent } = await import("./content-generator");
    const result = await generatePlatformContent("gitlab", params);
    mdContent = result.body;
  } catch {
    mdContent = `# ${params.title} — Recruitment 2026\n\nA new government job notification has been released. Check complete eligibility and apply at [Rojgar Suvidha](${jobUrl}).\n\n📢 *Join [@govermentform](https://t.me/govermentform) on Telegram.*`;
  }

  const safeSlug = params.slug.replace(/[^a-zA-Z0-9-]/g, "").slice(0, 35);
  const fileName = `${safeSlug}-job-notification.md`;


  try {
    const res = await fetch("https://gitlab.com/api/v4/snippets", {
      method: "POST",
      headers: {
        "PRIVATE-TOKEN": token,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title: `${params.title.slice(0, 60)} — Rojgar Suvidha`,
        visibility: "public",
        files: [
          {
            file_path: fileName,
            content: mdContent,
          }
        ]
      }),
      signal: AbortSignal.timeout(15000),
    });
    const json = await res.json();

    if (res.ok && json.web_url) {
      console.log(`✅ [GitLab Publisher] Published Snippet: ${json.web_url}`);
      return json.web_url;
    } else {
      console.warn("⚠️ [GitLab Publisher] API Error:", res.status, JSON.stringify(json));
      return null;
    }
  } catch (err: any) {
    console.warn("⚠️ [GitLab Publisher] Exception:", err.message);
    return null;
  }
}
