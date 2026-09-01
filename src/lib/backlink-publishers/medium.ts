/**
 * ═══════════════════════════════════════════════════════════════════
 * MEDIUM.COM API — REAL AUTO-PUBLISHER
 * ═══════════════════════════════════════════════════════════════════
 * Publishes a fresh Gemini-AI-generated article to your official
 * Medium.com account (@rojgarsuvidha) with canonical URL pointing
 * back to rojgarsuvidha.com. Earns a DA-95 dofollow backlink.
 *
 * Required ENV var (add to Vercel):
 *   MEDIUM_INTEGRATION_TOKEN — From medium.com → Settings → Security & Apps → Integration Tokens
 */

// ⚠️ DO NOT use module-level constants for env vars in Next.js! Read at runtime inside functions.
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://www.rojgarsuvidha.com";

function getMediumEnv() {
  return {
    MEDIUM_TOKEN: process.env.MEDIUM_INTEGRATION_TOKEN,
    GEMINI_KEY: process.env.GEMINI_API_KEY_1 || process.env.GEMINI_API_KEY,
  };
}

async function getMediumUserId(): Promise<string | null> {
  const { MEDIUM_TOKEN } = getMediumEnv();
  if (!MEDIUM_TOKEN) return null;
  try {
    const res = await fetch("https://api.medium.com/v1/me", {
      headers: { Authorization: `Bearer ${MEDIUM_TOKEN}` },
      signal: AbortSignal.timeout(10000),
    });
    const data = await res.json();
    return data?.data?.id || null;
  } catch {
    return null;
  }
}

async function generateMediumContent(title: string, slug: string): Promise<{ body: string; tags: string[] }> {
  const { GEMINI_KEY } = getMediumEnv();
  const jobUrl = `${BASE_URL}/job/${slug}`;
  const defaultBody = `# ${title}

A new government recruitment notification has been published. Eligible candidates across India can now apply online for this important government opportunity.

## What You Need to Know

This recruitment is an excellent opportunity for Indian job seekers looking to secure a stable government career. The selection process, eligibility criteria, and application procedure are available in detail.

## How to Apply

Visit the official portal [Rojgar Suvidha](${jobUrl}) for the complete notification, direct apply link, eligibility breakdown, and step-by-step application guide.

**Last Date:** Check the official notification for exact dates.

---

*For real-time government job alerts, follow [Rojgar Suvidha](${BASE_URL}) — India's trusted Sarkari Naukri portal.*

*Official Source: [${title}](${jobUrl})*`;

  if (!GEMINI_KEY) return { body: defaultBody, tags: ["sarkari naukri", "government jobs", "india", "recruitment", "jobs"] };

  const prompt = `Write a 250-300 word Medium.com blog article in English about this government job: "${title}".

Rules:
- Write UNIQUE content, NOT copied from the original notification.
- Use Markdown format (# for title, ## for sections, **bold** for key terms).
- Sections: Introduction, Why This Opportunity Matters, Quick Details, How to Apply.
- End with: "Read the complete notification and apply online at [Rojgar Suvidha](${jobUrl})."
- Tone: professional career advisor speaking to young Indian job aspirants.
- 0% plagiarism. Be genuinely helpful.

Return ONLY the markdown text. No JSON.`;

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=${GEMINI_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
        signal: AbortSignal.timeout(20000),
      }
    );
    const data = await res.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
    return {
      body: text.trim() || defaultBody,
      tags: ["sarkari naukri", "government jobs", "india jobs", "recruitment 2026", "rojgar suvidha"],
    };
  } catch {
    return { body: defaultBody, tags: ["sarkari naukri", "government jobs", "india", "recruitment", "jobs"] };
  }
}

/**
 * Publish a unique article to Medium.com via Integration Token API
 * Returns the live Medium post URL or null on failure.
 */
export async function publishToMedium(params: {
  jobId: string;
  title: string;
  slug: string;
  category?: string;
}): Promise<string | null> {
  const { MEDIUM_TOKEN } = getMediumEnv();
  if (!MEDIUM_TOKEN) {
    console.log("ℹ️ [Medium Publisher] MEDIUM_INTEGRATION_TOKEN not set — skipping.");
    return null;
  }

  const userId = await getMediumUserId();
  if (!userId) {
    console.warn("⚠️ [Medium Publisher] Could not fetch Medium user ID.");
    return null;
  }

  const jobUrl = `${BASE_URL}/job/${params.slug}`;
  const { body, tags } = await generateMediumContent(params.title, params.slug);

  try {
    const res = await fetch(`https://api.medium.com/v1/users/${userId}/posts`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${MEDIUM_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title: `${params.title} — Rojgar Suvidha`,
        contentFormat: "markdown",
        content: body,
        tags: tags.slice(0, 5),
        canonicalUrl: jobUrl,
        publishStatus: "public",
        notifyFollowers: true,
      }),
      signal: AbortSignal.timeout(15000),
    });
    const data = await res.json();

    if (res.ok && data?.data?.url) {
      console.log(`✅ [Medium Publisher] Post published: ${data.data.url}`);
      return data.data.url;
    } else {
      console.warn("⚠️ [Medium Publisher] API error:", JSON.stringify(data));
      return null;
    }
  } catch (err: any) {
    console.warn("⚠️ [Medium Publisher] Exception:", err.message);
    return null;
  }
}
