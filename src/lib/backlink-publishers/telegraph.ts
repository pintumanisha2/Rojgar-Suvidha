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

/**
 * Publish a satellite backlink page to Telegra.ph (DA-88)
 * Returns live Telegra.ph URL or null on failure.
 */
export async function publishToTelegraph(params: {
  jobId: string;
  title: string;
  slug: string;
  category?: string;
}): Promise<string | null> {
  const token = await getTelegraphAccessToken();
  if (!token) return null;

  const jobUrl = `${BASE_URL}/job/${params.slug}`;

  // Telegraph API uses JSON DOM Node structure
  const contentNodes = [
    {
      tag: "p",
      children: [
        "A new government job notification has been announced for ",
        { tag: "strong", children: [params.title] },
        ". Candidates looking for government employment in India can check complete vacancy details, qualification criteria, and application procedure."
      ]
    },
    {
      tag: "h4",
      children: ["Key Highlights & Application Direct Link"]
    },
    {
      tag: "p",
      children: [
        "Read the official advertisement notification, eligibility breakdown, and access the direct online apply form at ",
        {
          tag: "a",
          attrs: { href: jobUrl, target: "_blank" },
          children: ["Rojgar Suvidha Official Portal"]
        },
        "."
      ]
    },
    {
      tag: "p",
      children: [
        "📢 For instant government exam & sarkari result alerts on Telegram, join ",
        {
          tag: "a",
          attrs: { href: "https://t.me/govermentform" },
          children: ["@govermentform"]
        },
        "."
      ]
    }
  ];

  try {
    const res = await fetch("https://api.telegra.ph/createPage", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        access_token: token,
        title: `${params.title.slice(0, 60)} — Rojgar Suvidha`,
        author_name: "Rojgar Suvidha",
        author_url: BASE_URL,
        content: contentNodes,
        return_content: false,
      }),
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
