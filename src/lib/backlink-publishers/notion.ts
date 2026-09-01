/**
 * ═══════════════════════════════════════════════════════════════════
 * NOTION API (DA-90) — REAL AUTO-PUBLISHER
 * ═══════════════════════════════════════════════════════════════════
 * Publishes satellite job notifications to Notion (DA-90)
 *
 * Required ENV vars (in Vercel):
 *   NOTION_API_KEY — Internal Integration Secret (from notion.so/my-integrations)
 *   NOTION_PAGE_ID — Public Parent Page ID (from page URL)
 */

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://www.rojgarsuvidha.com";

function getNotionCredentials() {
  return {
    API_KEY: (process.env.NOTION_API_KEY || process.env.NOTION_TOKEN)?.trim(),
    PAGE_ID: (process.env.NOTION_PAGE_ID || process.env.NOTION_DATABASE_ID)?.trim(),
  };
}

/**
 * Format raw Notion page ID into standard UUID hyphenated string if needed
 */
function formatNotionId(id: string): string {
  const clean = id.replace(/-/g, "").trim();
  if (clean.length === 32) {
    return `${clean.slice(0, 8)}-${clean.slice(8, 12)}-${clean.slice(12, 16)}-${clean.slice(16, 20)}-${clean.slice(20)}`;
  }
  return id;
}

/**
 * Publish a satellite post to Notion (DA-90)
 * Returns live Notion Page URL or null on failure.
 */
export async function publishToNotion(params: {
  jobId: string;
  title: string;
  slug: string;
  category?: string;
}): Promise<string | null> {
  const { API_KEY, PAGE_ID } = getNotionCredentials();

  if (!API_KEY || !PAGE_ID) {
    console.log("ℹ️ [Notion Publisher] NOTION_API_KEY or NOTION_PAGE_ID missing — skipping.");
    return null;
  }

  const parentId = formatNotionId(PAGE_ID);
  const jobUrl = `${BASE_URL}/job/${params.slug}`;

  try {
    const res = await fetch("https://api.notion.com/v1/pages", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${API_KEY}`,
        "Notion-Version": "2022-06-28",
        "Content-Type": "application/json",
        "User-Agent": "RojgarSuvidhaBot/1.0",
      },
      body: JSON.stringify({
        parent: { page_id: parentId },
        properties: {
          title: [
            {
              text: {
                content: `${params.title.slice(0, 60)} — Rojgar Suvidha`,
              },
            },
          ],
        },
        children: [
          {
            object: "block",
            type: "heading_2",
            heading_2: {
              rich_text: [
                {
                  text: { content: `${params.title} (Recruitment 2026)` },
                },
              ],
            },
          },
          {
            object: "block",
            type: "paragraph",
            paragraph: {
              rich_text: [
                {
                  text: {
                    content: "A new government job recruitment notification has been released across India. Candidates searching for latest sarkari naukri alerts can check complete qualification details, age limits, and online application procedures.",
                  },
                },
              ],
            },
          },
          {
            object: "block",
            type: "callout",
            callout: {
              icon: { type: "emoji", emoji: "📌" },
              rich_text: [
                {
                  text: { content: "Direct Application Portal: " },
                },
                {
                  text: {
                    content: "Rojgar Suvidha — Official Notification & Apply Online",
                    link: { url: jobUrl },
                  },
                },
              ],
            },
          },
          {
            object: "block",
            type: "paragraph",
            paragraph: {
              rich_text: [
                {
                  text: {
                    content: "📢 Join Telegram @govermentform for instant alerts: ",
                  },
                },
                {
                  text: {
                    content: "t.me/govermentform",
                    link: { url: "https://t.me/govermentform" },
                  },
                },
              ],
            },
          },
        ],
      }),
      signal: AbortSignal.timeout(15000),
    });

    const json = await res.json();

    if (res.ok && json?.id) {
      const pageIdClean = json.id.replace(/-/g, "");
      const liveUrl = json.url || `https://www.notion.so/${pageIdClean}`;
      console.log(`✅ [Notion Publisher] Published: ${liveUrl}`);
      return liveUrl;
    } else {
      console.warn("⚠️ [Notion Publisher] API Error:", res.status, JSON.stringify(json));
      return null;
    }
  } catch (err: any) {
    console.warn("⚠️ [Notion Publisher] Exception:", err.message);
    return null;
  }
}
