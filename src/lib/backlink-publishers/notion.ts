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
  const match = id.match(/([a-f0-9]{32})/i);
  const clean = match ? match[1] : id.replace(/-/g, "").trim();
  if (clean.length === 32) {
    return `${clean.slice(0, 8)}-${clean.slice(8, 12)}-${clean.slice(12, 16)}-${clean.slice(16, 20)}-${clean.slice(20)}`;
  }
  return id;
}

function markdownToNotionBlocks(md: string, jobUrl: string): any[] {
  const blocks: any[] = [];
  const lines = md.split("\n");

  for (let i = 0; i < lines.length && blocks.length < 80; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    if (line.startsWith("# ")) {
      blocks.push({
        object: "block",
        type: "heading_1",
        heading_1: {
          rich_text: [{ text: { content: line.replace(/^#\s+/, "").slice(0, 200) } }],
        },
      });
    } else if (line.startsWith("## ")) {
      blocks.push({
        object: "block",
        type: "heading_2",
        heading_2: {
          rich_text: [{ text: { content: line.replace(/^##\s+/, "").slice(0, 200) } }],
        },
      });
    } else if (line.startsWith("### ")) {
      blocks.push({
        object: "block",
        type: "heading_3",
        heading_3: {
          rich_text: [{ text: { content: line.replace(/^###\s+/, "").slice(0, 200) } }],
        },
      });
    } else if (line.startsWith("- ") || line.startsWith("* ")) {
      blocks.push({
        object: "block",
        type: "bulleted_list_item",
        bulleted_list_item: {
          rich_text: [{ text: { content: line.replace(/^[-*]\s+/, "").slice(0, 1000) } }],
        },
      });
    } else if (/^\d+\.\s+/.test(line)) {
      blocks.push({
        object: "block",
        type: "numbered_list_item",
        numbered_list_item: {
          rich_text: [{ text: { content: line.replace(/^\d+\.\s+/, "").slice(0, 1000) } }],
        },
      });
    } else {
      blocks.push({
        object: "block",
        type: "paragraph",
        paragraph: {
          rich_text: [{ text: { content: line.slice(0, 1000) } }],
        },
      });
    }
  }

  // Add prominent Apply Online Callout Box
  blocks.push({
    object: "block",
    type: "callout",
    callout: {
      icon: { type: "emoji", emoji: "📌" },
      rich_text: [
        { text: { content: "Official Notification & Direct Apply Link: " } },
        { text: { content: "Rojgar Suvidha Portal", link: { url: jobUrl } } },
      ],
    },
  });

  return blocks;
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
  totalPosts?: string | null;
  qualification?: string | null;
  ageLimit?: string | null;
  lastDate?: string | null;
  applicationFee?: string | null;
  selectionProcess?: string | null;
  company?: string | null;
}): Promise<string | null> {
  const { API_KEY, PAGE_ID } = getNotionCredentials();

  if (!API_KEY || !PAGE_ID) {
    console.log("ℹ️ [Notion Publisher] NOTION_API_KEY or NOTION_PAGE_ID missing — skipping.");
    return null;
  }

  const parentId = formatNotionId(PAGE_ID);
  const jobUrl = `${BASE_URL}/job/${params.slug}`;

  // Generate full rich Markdown content
  let mdContent = `# ${params.title} — Recruitment 2026\n\nA new government recruitment notification has been published.\n\n## Official Portal\n\nApply online and check full eligibility at [Rojgar Suvidha](${jobUrl}).`;
  try {
    const { generatePlatformContent } = await import("./content-generator");
    const result = await generatePlatformContent("notion", params);
    if (result.body) mdContent = result.body;
  } catch (e: any) {
    console.warn("⚠️ [Notion Publisher] Content generation note:", e.message);
  }

  const childrenBlocks = markdownToNotionBlocks(mdContent, jobUrl);

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
        children: childrenBlocks,
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
