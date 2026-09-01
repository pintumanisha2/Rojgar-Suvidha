/**
 * ═══════════════════════════════════════════════════════════════════
 * DEV.TO API (DA-85) — REAL AUTO-PUBLISHER
 * ═══════════════════════════════════════════════════════════════════
 * Publishes satellite articles to Dev.to (DA-85) with canonical URLs
 * pointing back to rojgarsuvidha.com
 *
 * Required ENV var (in Vercel):
 *   DEVTO_API_KEY — From dev.to → Settings → Extensions → API Keys
 */

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://www.rojgarsuvidha.com";

function getDevtoCredentials() {
  return {
    API_KEY: process.env.DEVTO_API_KEY?.trim(),
    GEMINI_KEY: (process.env.GEMINI_API_KEY_1 || process.env.GEMINI_API_KEY)?.trim(),
  };
}

/**
 * Publish a satellite article to Dev.to (DA-85)
 * Returns live Dev.to URL or null on failure.
 */
export async function publishToDevto(params: {
  jobId: string;
  title: string;
  slug: string;
  category?: string;
}): Promise<string | null> {
  const { API_KEY } = getDevtoCredentials();

  if (!API_KEY) {
    console.log("ℹ️ [Dev.to Publisher] DEVTO_API_KEY not set — skipping.");
    return null;
  }

  const jobUrl = `${BASE_URL}/job/${params.slug}`;

  // Generate unique Markdown article for Dev.to (career guide angle)
  let mdBody: string;
  try {
    const { generatePlatformContent } = await import("./content-generator");
    const result = await generatePlatformContent("devto", params.title, params.slug);
    mdBody = `---
title: ${result.title}
published: true
tags: ${(result.tags || ["sarkari-naukri", "government-jobs", "india", "career"]).join(", ")}
canonical_url: ${jobUrl}
---

${result.body}`;
  } catch {
    mdBody = `---
title: ${params.title} — Government Job 2026
published: true
tags: jobs, career, india, sarkari
canonical_url: ${jobUrl}
---

# ${params.title}

A new government recruitment notification has been announced. Check complete eligibility and apply online at [Rojgar Suvidha](${jobUrl}).

📢 *Join [Telegram @govermentform](https://t.me/govermentform) for instant alerts.*`.trim();
  }


  try {
    const res = await fetch("https://dev.to/api/articles", {
      method: "POST",
      headers: {
        "api-key": API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        article: {
          title: `${params.title} — Rojgar Suvidha`,
          published: true,
          body_markdown: mdBody,
          tags: ["jobs", "career", "india"],
          canonical_url: jobUrl,
        },
      }),
      signal: AbortSignal.timeout(15000),
    });
    const json = await res.json();

    if (res.ok && json.url) {
      console.log(`✅ [Dev.to Publisher] Published: ${json.url}`);
      return json.url;
    } else {
      console.warn("⚠️ [Dev.to Publisher] API Error:", JSON.stringify(json));
      return null;
    }
  } catch (err: any) {
    console.warn("⚠️ [Dev.to Publisher] Exception:", err.message);
    return null;
  }
}
