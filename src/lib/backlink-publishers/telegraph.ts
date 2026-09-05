/**
 * ═══════════════════════════════════════════════════════════════════
 * TELEGRA.PH (TELEGRAM) API — 100% FREE & AUTOMATED PUBLISHER
 * ═══════════════════════════════════════════════════════════════════
 * Publishes instant satellite pages on Telegra.ph (DA-88)
 * - 0% Configuration / Token setup required (Creates account on the fly)
 * - Google indexes Telegra.ph links super fast (< 24 hours)
 * - Adds a clean dofollow canonical link to rojgarsuvidha.com
 */

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://www.rojgarsuvidha.com";

let cachedTelegraphToken: string | null = null;

/**
 * Get or create an anonymous Telegra.ph account access token
 */
async function getTelegraphAccessToken(): Promise<string | null> {
  if (cachedTelegraphToken) return cachedTelegraphToken;
  try {
    const res = await fetch("https://api.telegra.ph/createAccount?short_name=RojgarSuvidha&author_name=Rojgar+Suvidha+News", {
      signal: AbortSignal.timeout(10000),
    });
    const json = await res.json();
    if (json.ok && json.result?.access_token) {
      cachedTelegraphToken = json.result.access_token;
      return cachedTelegraphToken;
    }
    return null;
  } catch (err: any) {
    console.warn("⚠️ [Telegraph] Account creation error:", err.message);
    return null;
  }
}

import type { JobDetailsPayload } from "./content-generator";

/**
 * Publish a satellite backlink page to Telegra.ph (DA-88)
 * Returns live Telegra.ph URL or null on failure.
 */
export async function publishToTelegraph(
  params: JobDetailsPayload & { jobId: string }
): Promise<string | null> {
  const token = await getTelegraphAccessToken();
  if (!token) return null;

  const jobUrl = `${BASE_URL}/job/${params.slug}`;

  // Generate unique AI content for Telegraph
  let uniqueContent: string | null = null;
  try {
    const { generatePlatformContent } = await import("./content-generator");
    const result = await generatePlatformContent("telegraph", params);
    uniqueContent = result.body;
  } catch {
    uniqueContent = null;
  }

  // Parse HTML into Telegraph-compatible JSON nodes or use fallback
  const buildNodes = (html: string | null) => {
    if (!html) {
      return [
        { tag: "p", children: [`A new government job notification has been announced: `, { tag: "strong", children: [params.title] }, `. Check complete eligibility, vacancy details, and the official application link at Rojgar Suvidha.`] },
        { tag: "p", children: [`📌 Full details: `, { tag: "a", attrs: { href: jobUrl }, children: ["Rojgar Suvidha Official Portal"] }, `.`] },
        { tag: "p", children: [`📢 Join `, { tag: "a", attrs: { href: "https://t.me/govermentform" }, children: ["@govermentform"] }, ` on Telegram for instant job alerts.`] },
      ];
    }

    // Convert simple HTML to telegraph nodes
    const stripped = html.replace(/<\/?(?:h[1-6]|ul|li|br)[^>]*>/gi, "\n").replace(/<b[^>]*>(.*?)<\/b>/gi, "$1").replace(/<\/?p[^>]*>/gi, "\n");
    const lines = stripped.split("\n").map(l => l.trim()).filter(Boolean);
    const nodes: any[] = lines.map(line => {
      if (line.includes(jobUrl)) {
        return { tag: "p", children: [`📌 Full details & apply: `, { tag: "a", attrs: { href: jobUrl }, children: ["Rojgar Suvidha"] }] };
      }
      return { tag: "p", children: [line] };
    });
    nodes.push({ tag: "p", children: [`📢 Telegram alerts: `, { tag: "a", attrs: { href: "https://t.me/govermentform" }, children: ["@govermentform"] }] });
    return nodes;
  };

  const contentNodes = buildNodes(uniqueContent);

  try {
    const paramsBody = new URLSearchParams({
      access_token: token,
      title: `${params.title.slice(0, 60)} — Rojgar Suvidha`,
      author_name: "Rojgar Suvidha",
      author_url: BASE_URL,
      content: JSON.stringify(contentNodes),
      return_content: "false",
    });

    const res = await fetch("https://api.telegra.ph/createPage", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: paramsBody.toString(),
      signal: AbortSignal.timeout(12000),
    });
    const json = await res.json();

    if (json.ok && json.result?.url) {
      console.log(`✅ [Telegraph Publisher] Published: ${json.result.url}`);
      return json.result.url;
    } else {
      console.warn("⚠️ [Telegraph Publisher] API Error:", JSON.stringify(json));
      return null;
    }
  } catch (err: any) {
    console.warn("⚠️ [Telegraph Publisher] Exception:", err.message);
    return null;
  }
}

