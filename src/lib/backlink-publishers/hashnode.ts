/**
 * ═══════════════════════════════════════════════════════════════════
 * HASHNODE API (DA-86) — REAL AUTO-PUBLISHER
 * ═══════════════════════════════════════════════════════════════════
 * Publishes satellite articles to Hashnode (DA-86) via GraphQL API
 *
 * Required ENV vars (in Vercel):
 *   HASHNODE_API_KEY     — From hashnode.com → Account Settings → Developer
 *   HASHNODE_PUBLICATION_ID — Your Hashnode publication ID
 */

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://www.rojgarsuvidha.com";

function getHashnodeCredentials() {
  return {
    API_KEY: process.env.HASHNODE_API_KEY?.trim(),
    PUBLICATION_ID: process.env.HASHNODE_PUBLICATION_ID?.trim(),
    GEMINI_KEY: (process.env.GEMINI_API_KEY_1 || process.env.GEMINI_API_KEY)?.trim(),
  };
}

/**
 * Publish a satellite article to Hashnode (DA-86)
 * Returns live Hashnode URL or null on failure.
 */
export async function publishToHashnode(params: {
  jobId: string;
  title: string;
  slug: string;
  category?: string;
}): Promise<string | null> {
  const { API_KEY, PUBLICATION_ID } = getHashnodeCredentials();

  if (!API_KEY || !PUBLICATION_ID) {
    console.log("ℹ️ [Hashnode Publisher] HASHNODE_API_KEY or HASHNODE_PUBLICATION_ID not set — skipping.");
    return null;
  }

  const jobUrl = `${BASE_URL}/job/${params.slug}`;

  const contentMarkdown = `
# ${params.title}

A new government recruitment notification has been published across India. Candidates searching for government vacancies can check complete qualification criteria, application fees, and selection procedures.

## Quick Highlights & Direct Apply Link

Read the official notification PDF, eligibility breakdown, and access the direct online apply form at [Rojgar Suvidha — Official Portal](${jobUrl}).

📢 *For real-time exam alerts, join [Rojgar Suvidha Telegram](https://t.me/govermentform).*
`.trim();

  const query = `
    mutation PublishPost($input: PublishPostInput!) {
      publishPost(input: $input) {
        post {
          url
        }
      }
    }
  `;

  const variables = {
    input: {
      publicationId: PUBLICATION_ID,
      title: `${params.title} — Notification Overview`,
      contentMarkdown,
      originalArticleURL: jobUrl,
      tags: [
        { name: "Sarkari Naukri", slug: "sarkari-naukri" },
        { name: "Jobs", slug: "jobs" }
      ]
    }
  };

  try {
    const res = await fetch("https://gql.hashnode.com", {
      method: "POST",
      headers: {
        "Authorization": API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query, variables }),
      signal: AbortSignal.timeout(15000),
    });
    const json = await res.json();

    const liveUrl = json?.data?.publishPost?.post?.url;
    if (res.ok && liveUrl) {
      console.log(`✅ [Hashnode Publisher] Published: ${liveUrl}`);
      return liveUrl;
    } else {
      console.warn("⚠️ [Hashnode Publisher] API Error:", JSON.stringify(json));
      return null;
    }
  } catch (err: any) {
    console.warn("⚠️ [Hashnode Publisher] Exception:", err.message);
    return null;
  }
}
