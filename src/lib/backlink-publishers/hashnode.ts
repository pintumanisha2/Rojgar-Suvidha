/**
 * ═══════════════════════════════════════════════════════════════════
 * HASHNODE API (DA-86) — REAL AUTO-PUBLISHER
 * ═══════════════════════════════════════════════════════════════════
 * Publishes satellite articles to Hashnode (DA-86) via GraphQL API
 */

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://www.rojgarsuvidha.com";
const DEFAULT_HASHNODE_KEY = "3589d29f-eea0-4975-a3b6-40aac62fe693";

let cachedPubId: string | null = null;

function getHashnodeCredentials() {
  return {
    API_KEY: (process.env.HASHNODE_API_KEY || DEFAULT_HASHNODE_KEY).trim(),
    PUBLICATION_ID: process.env.HASHNODE_PUBLICATION_ID?.trim(),
  };
}

/**
 * Automatically fetch user's primary publication ID from Hashnode GraphQL API
 */
async function fetchPublicationId(apiKey: string): Promise<string | null> {
  if (cachedPubId) return cachedPubId;
  try {
    const res = await fetch("https://gql.hashnode.com", {
      method: "POST",
      headers: {
        "Authorization": apiKey,
        "Content-Type": "application/json",
        "User-Agent": "RojgarSuvidhaBot/1.0",
      },
      body: JSON.stringify({
        query: `
          query Me {
            me {
              id
              username
              publications(first: 5) {
                edges {
                  node {
                    id
                    title
                  }
                }
              }
            }
          }
        `,
      }),
      signal: AbortSignal.timeout(12000),
    });
    const json = await res.json();
    const pubId = json?.data?.me?.publications?.edges?.[0]?.node?.id || json?.data?.me?.id;
    if (pubId) {
      cachedPubId = pubId;
      console.log(`✅ [Hashnode Publisher] Found Publication ID: ${pubId}`);
      return cachedPubId;
    }
    console.warn("⚠️ [Hashnode Publisher] fetchPublicationId response:", JSON.stringify(json));
    return null;
  } catch (err: any) {
    console.warn("⚠️ [Hashnode Publisher] Fetch Publication ID error:", err.message);
    return null;
  }
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

  if (!API_KEY) {
    console.log("ℹ️ [Hashnode Publisher] HASHNODE_API_KEY not set — skipping.");
    return null;
  }

  const targetPubId = PUBLICATION_ID || (await fetchPublicationId(API_KEY));
  if (!targetPubId) {
    console.warn("⚠️ [Hashnode Publisher] Could not resolve Publication ID.");
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
      publicationId: targetPubId,
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
        "User-Agent": "RojgarSuvidhaBot/1.0",
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
