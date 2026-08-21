/**
 * Auto Blog Scraper Library — v2.4 (Multi-Key Rotation + Groq Fallback)
 * FreeJobAlert → Full Page Deep Read → Gemini AI (SarkariLekhan) → [Groq Fallback] → Supabase → Telegram
 *
 * FIXES in v2:
 * 1. RSS URL corrected to freejobales.com (verified WordPress feed pattern)
 * 2. Better apply link detection — handles FreeJobAlert table structure
 * 3. Stronger data extraction — more patterns for dates/fees/vacancies
 * 4. HTML content cap increased to 12000 chars (more context for AI)
 * 5. Gemini prompt now includes mandatory id= anchors for SEO scorecard
 * 6. Slug duplicate check before saving to Supabase
 * 7. Delay between items to avoid rate limiting
 * 8. Content validation — skip if AI generated <500 words
 * 9. Better Coming Soon detection (FreeJobAlert specific patterns)
 *
 * NEW in v2.4:
 * 10. Groq API fallback — when ALL Gemini keys/models fail (quota exhausted),
 *     Groq (llama-3.3-70b → llama-3.1-8b → mixtral-8x7b) is tried automatically.
 *     Zero manual intervention needed.
 */

import { createClient } from "@supabase/supabase-js";
import { sendAdminDraftApprovalAlert, sendTelegramAdminErrorAlert, sendTelegramAdminSummaryDigest } from "./social-publisher";

// ── Types ─────────────────────────────────────────────────────────────────────
type ApplyStatus = "open" | "coming_soon" | "closed" | "unknown";
type BlogCategory = "latest-jobs" | "results" | "admit-card" | "answer-key" | "admission" | "news";

interface ScraperResult {
  processed: number;
  skipped: number;
  errors: string[];
}

// ── Config ────────────────────────────────────────────────────────────────────
// Primary: FreeJobAlert.com (WordPress blog — /feed/ works reliably)
// Fallback sources ordered by DA (Domain Authority) and reliability
// ── Category-specific RSS feeds (ONLY govt-job focused, no general news) ────
// Each category gets its own dedicated feed → correct content guaranteed
const CATEGORY_RSS_FEEDS: Record<string, string[]> = {
  "latest-jobs": [
    "https://www.freejobalert.com/feed/",          // Primary — all new govt job notifications
    "https://www.freejobalert.com/sarkari-naukri/feed/", // Secondary — sarkari naukri category
  ],
  "results": [
    "https://www.freejobalert.com/result/feed/",   // Result-only feed
  ],
  "admit-card": [
    "https://www.freejobalert.com/admit-card/feed/", // Admit card-only feed
  ],
  "answer-key": [
    "https://www.freejobalert.com/answer-key/feed/", // Answer key-only feed (was causing 0 posts)
  ],
  "admission": [
    "https://www.freejobalert.com/admission/feed/", // Admission-only feed
  ],
};

// Flat list for backward compatibility with fetchRSSItems()
// Order: latest-jobs first (highest volume + most important)
const RSS_URLS = [
  ...CATEGORY_RSS_FEEDS["latest-jobs"],
  ...CATEGORY_RSS_FEEDS["results"],
  ...CATEGORY_RSS_FEEDS["admit-card"],
  ...CATEGORY_RSS_FEEDS["answer-key"],
  ...CATEGORY_RSS_FEEDS["admission"],
];

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://www.rojgarsuvidha.com";

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// ── Sleep helper (avoid rate limiting) ───────────────────────────────────────
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// ── Category Detection v2 — Title-First, Strict Priority ─────────────────────
// Uses TITLE-ONLY matching first (source titles are always accurate)
// Falls back to combined text only if title is ambiguous
function detectCategory(title: string, content: string): BlogCategory {
  const t = title.toLowerCase();
  const combined = (title + " " + content).toLowerCase();

  // ── TITLE-ONLY checks (highest confidence) ──────────────────────────────
  // Results — specific result keywords in title
  if (/\bresult\b|merit list|scorecard|cut-?off mark|selected candidates|rank list|final result|result out|result declared/.test(t))
    return "results";

  // Admit Card — specific keywords in title
  if (/admit card|hall ticket|call letter|e-admit|city intimation|interview letter/.test(t))
    return "admit-card";

  // Answer Key — specific keywords in title
  if (/answer key|answer sheet|provisional answer|final answer|objection window|raise objection/.test(t))
    return "answer-key";

  // Admission / Counselling — specific keywords in title
  if (/\bcounselling\b|\bcounseling\b|seat allot|allotment result|admission open|college admission|merit list.*admission/.test(t))
    return "admission";

  // Latest Jobs — recruitment/vacancy in title
  if (/recruitment|vacancy|apply online|online form|job notification|\bnoti(?:fication)?\b|\bvacancy\b|\bpost\b.*202[456]/.test(t))
    return "latest-jobs";

  // ── CONTENT-BASED fallback (lower confidence — only if title is ambiguous) ─
  if (/\bresult\b|merit list|scorecard/.test(combined)) return "results";
  if (/admit card|hall ticket/.test(combined)) return "admit-card";
  if (/answer key|objection window/.test(combined)) return "answer-key";
  if (/\bcounselling\b|seat allot/.test(combined)) return "admission";

  // ── News detection (only if explicitly news-like — no job keywords) ────
  if (/postponed|cancelled|rescheduled|syllabus change|age limit change|new rule/.test(t) &&
    !/recruitment|vacancy|apply|result|admit|answer key/.test(t))
    return "news";

  return "latest-jobs"; // Safe default — job posts are highest volume
}

// ── State Code Detection (Auto-detect State vs All India) ─────────────────
function detectStateCode(title: string, content: string): string | null {
  const text = (title + " " + content).toLowerCase();

  // Central / All India indicators
  if (/\b(?:ssc|upsc|rrb|railway|ibps|sbi|rbi|lic|isro|drdo|cisf|bsf|crpf|itbp|ssb|ignou|iit|nit|aiims|central|all india)\b/i.test(text)) {
    if (!/up police|bihar police|mp police|rajasthan police|delhi police/i.test(text)) {
      return null; // All India / Central
    }
  }

  if (/uttar pradesh|\buppsc\b|\bupsssc\b|\bup police\b|\bup teacher\b|\bup bed\b|\bup\b/i.test(text)) return "UP";
  if (/bihar|\bbpsc\b|\bbssc\b|\bbihar police\b|\bbtsc\b|\bbihar/i.test(text)) return "BH";
  if (/madhya pradesh|\bmppeb\b|\bmppsc\b|\bmp police\b|\bvyapam\b|\bmp\b/i.test(text)) return "MP";
  if (/rajasthan|\brpsc\b|\brsmssb\b|\brajasthan police\b|\breet\b|\brj\b/i.test(text)) return "RJ";
  if (/haryana|\bhssc\b|\bhpsc\b|\bharyana police\b|\bhtet\b|\bhr\b/i.test(text)) return "HR";
  if (/delhi|\bdsssb\b|\bdelhi police\b|\bddu\b|\bdl\b/i.test(text)) return "DL";
  if (/maharashtra|\bmpsc\b|\bmaha\b|\bmaharashtra police\b|\bmh\b/i.test(text)) return "MH";
  if (/west bengal|\bwbpsc\b|\bwbprb\b|\bwb\b/i.test(text)) return "WB";
  if (/uttarakhand|\bukpsc\b|\buksssc\b|\buk\b/i.test(text)) return "UK";
  if (/jharkhand|\bjpsc\b|\bjssc\b|\bjharkhand police\b|\bjh\b/i.test(text)) return "JH";
  if (/punjab|\bppsc\b|\bpsssb\b|\bpunjab police\b|\bpb\b/i.test(text)) return "PB";
  if (/odisha|\bopsc\b|\bosssc\b|\bodisha police\b|\bod\b/i.test(text)) return "OD";
  if (/chhattisgarh|\bcgpsc\b|\bcg/i.test(text)) return "CG";
  if (/karnataka|\bkpsc\b|\bka\b/i.test(text)) return "KA";
  if (/gujarat|\bgpsc\b|\bgujarat police\b|\bgu\b/i.test(text)) return "GU";
  if (/assam|\bapsc\b|\bas\b/i.test(text)) return "AS";

  return null; // Default to Central / All India
}

// ── Apply Link Detection (FreeJobAlert-specific patterns) ─────────────────────
function detectApplyStatus(
  pageText: string,
  links: { href: string; text: string }[]
): { status: ApplyStatus; link: string | null } {
  const text = pageText.toLowerCase();

  // ── Coming Soon detection (FreeJobAlert specific) ──
  // They often write "Apply Online : Coming Soon" in tables
  if (/apply\s*online\s*[:\-–]\s*coming\s*soon/.test(text)) {
    return { status: "coming_soon", link: null };
  }
  if (/coming\s*soon|will\s*be\s*available\s*soon|link\s*will\s*be\s*activated|not\s*yet\s*active|to\s*be\s*announced/.test(text)) {
    return { status: "coming_soon", link: null };
  }

  // ── Closed detection ──
  if (/application\s*closed|last\s*date\s*over|form\s*closed|apply\s*last\s*date\s*passed/.test(text)) {
    return { status: "closed", link: null };
  }

  // ── Find real apply link ──
  // Priority order: most specific patterns first
  const applyPatterns = [
    // Direct apply link text patterns
    (l: { href: string; text: string }) => /^apply\s*(online|now)?$/i.test(l.text.trim()),
    (l: { href: string; text: string }) => /apply\s*online/i.test(l.text) && l.href.startsWith("http"),
    (l: { href: string; text: string }) => /click\s*here\s*to\s*apply/i.test(l.text),
    // URL patterns
    (l: { href: string; text: string }) => /\/(apply|register|application|form)\//i.test(l.href) && l.href.startsWith("http"),
  ];

  for (const pattern of applyPatterns) {
    const found = links.find(pattern);
    if (found?.href?.startsWith("http")) {
      // Exclude internal/navigation links
      const isInternal = found.href.includes("freejobalert") || found.href.includes("rojgarsuvidha");
      if (!isInternal) {
        return { status: "open", link: found.href };
      }
    }
  }

  // ── Fallback: "Apply Online" text present but no link → Coming Soon ──
  if (/apply\s*online/i.test(text)) {
    return { status: "coming_soon", link: null };
  }

  return { status: "unknown", link: null };
}

// ── Deep Data Extraction (FreeJobAlert table structure) ───────────────────────
function extractPageData(pageText: string, links: { href: string; text: string }[] = []) {
  const text = pageText;

  // Last date — multiple patterns covering FreeJobAlert's table format
  const lastDatePatterns = [
    /last\s*date(?:\s*to\s*apply|\s*of\s*application|\s*for\s*online\s*application)?[:\s]+([^\n\r|]{5,60})/i,
    /apply\s*before[:\s]+([^\n\r|]{5,60})/i,
    /closing\s*date[:\s]+([^\n\r|]{5,60})/i,
    /end\s*date[:\s]+([^\n\r|]{5,60})/i,
    /(?:application|form)\s*(?:last\s*)?date[:\s]+([^\n\r|]{5,60})/i,
  ];
  let lastDate: string | null = null;
  for (const pattern of lastDatePatterns) {
    const m = text.match(pattern);
    if (m?.[1]) { lastDate = m[1].trim().slice(0, 60).replace(/[|]/g, "").trim(); break; }
  }

  // Total posts — FreeJobAlert often writes "Total Vacancy : 1000"
  const postsPatterns = [
    /total\s*(?:vacancy|vacancies|post|posts?)[:\s–\-]+(\d[\d,]+)/i,
    /(?:no\.?\s*of\s*)?(?:vacancy|vacancies|post)[:\s–\-]+(\d[\d,]+)/i,
    /(\d[\d,]+)\s*(?:post|vacancy|vacancies|seat)/i,
  ];
  let totalPosts: string | null = null;
  for (const pattern of postsPatterns) {
    const m = text.match(pattern);
    if (m?.[1]) { totalPosts = m[1].replace(/,/g, ""); break; }
  }

  // Application fee — FreeJobAlert shows "General/OBC : 500", "SC/ST : Free"
  const feeGenPatterns = [
    /(?:general|gen|ur|obc|ews)[\/,\s]+(?:obc[\/,\s]+)?(?:ews[\/,\s]+)?(?:[:\-–]\s*)₹?\s*(\d+)/i,
    /application\s*fee[:\s–\-]*(?:general|gen|ur)?[:\s]*₹?\s*(\d+)/i,
    /fee[:\s–\-]+₹?\s*(\d+)/i,
  ];
  let appFeeGen: string | null = null;
  for (const pattern of feeGenPatterns) {
    const m = text.match(pattern);
    if (m?.[1]) { appFeeGen = `₹${m[1]}`; break; }
  }

  // SC/ST fee
  const feeResPatterns = [
    /(?:sc|st|ph|pwd|divyang)[\/,\s]+(?:female[\/,\s]+)?[:\-–]\s*₹?\s*(\d+)/i,
    /(?:sc|st)[:\s–\-]+(?:free|nil|₹?\s*0|\₹?\s*\d+)/i,
  ];
  let appFeeRes: string | null = null;
  for (const pattern of feeResPatterns) {
    const m = text.match(pattern);
    if (m) { appFeeRes = m[0].slice(0, 40).trim(); break; }
  }

  // Official website extraction from text + links
  let officialLink: string | null = null;
  const officialLinkObj = links.find(l => 
    /official\s*(website|site|portal)/i.test(l.text) || 
    (/\.(gov|nic|org)\.in/i.test(l.href) && !l.href.includes("freejobalert"))
  );
  if (officialLinkObj?.href) {
    officialLink = officialLinkObj.href;
  } else {
    const officialPatterns = [
      /official\s*(?:website|site|portal|link)[:\s]+([^\s\n|]{5,80})/i,
      /(?:www\.[a-z0-9\-\.]+\.(?:gov|nic|org|in|com))/i,
    ];
    for (const pattern of officialPatterns) {
      const m = text.match(pattern);
      if (m?.[1]) { officialLink = m[1].trim(); break; }
      if (m?.[0]?.includes("www.")) { officialLink = "https://" + m[0].trim(); break; }
    }
  }

  // Notification PDF extraction from links
  let notificationLink: string | null = null;
  const notifLinkObj = links.find(l => 
    /notification|advt|detailed notification|pdf/i.test(l.text) && 
    !l.href.includes("freejobalert") && 
    l.href.startsWith("http")
  );
  if (notifLinkObj?.href) {
    notificationLink = notifLinkObj.href;
  }

  // Age limit extraction
  const ageMatch = text.match(/age\s*limit[:\s]+([^\n\r|]{3,40})/i);
  const ageLimit = ageMatch ? ageMatch[1].trim().slice(0, 40) : null;

  // Education qualification
  const eduMatch = text.match(/(?:education|qualification|educational)[:\s]+([^\n\r|]{5,80})/i);
  const education = eduMatch ? eduMatch[1].trim().slice(0, 80) : null;

  return { lastDate, totalPosts, appFeeGen, appFeeRes, officialLink, notificationLink, ageLimit, education };
}

// ── Fetch ALL category-specific RSS feeds ─────────────────────────────────────
// Each feed URL is tagged with its category → guarantees correct categorization
// Returns items from ALL category feeds in one call
async function fetchRSSItems(): Promise<{
  title: string; link: string; pubDate: string;
  description: string; feedCategory: string;
}[]> {
  const allItems: { title: string; link: string; pubDate: string; description: string; feedCategory: string }[] = [];

  for (const [feedCat, urls] of Object.entries(CATEGORY_RSS_FEEDS)) {
    for (const rssUrl of urls) {
      try {
        const res = await fetch(rssUrl, {
          headers: {
            "User-Agent": "Mozilla/5.0 (compatible; RojgarSuvidhaBot/1.0; +https://www.rojgarsuvidha.com)",
            "Accept": "application/rss+xml, application/xml, text/xml, */*",
          },
          signal: AbortSignal.timeout(15000),
        });
        if (!res.ok) { console.warn(`RSS [${feedCat}] ${rssUrl}: HTTP ${res.status}`); continue; }
        const xml = await res.text();
        if (!xml.includes("<item>")) { console.warn(`RSS [${feedCat}] ${rssUrl}: no <item> tags`); continue; }

        const itemRegex = /<item>([\s\S]*?)<\/item>/g;
        let match: RegExpExecArray | null;
        let count = 0;

        while ((match = itemRegex.exec(xml)) !== null) {
          const block = match[1];
          const title =
            block.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/)?.[1] ||
            block.match(/<title>(.*?)<\/title>/)?.[1] || "";
          const link =
            block.match(/<link>(.*?)<\/link>/)?.[1] ||
            block.match(/<guid[^>]*>(.*?)<\/guid>/)?.[1] || "";
          const pubDate = block.match(/<pubDate>(.*?)<\/pubDate>/)?.[1] || "";
          const description =
            block.match(/<description><!\[CDATA\[([\s\S]*?)\]\]><\/description>/)?.[1] ||
            block.match(/<description>([\s\S]*?)<\/description>/)?.[1] || "";

          if (title && link) {
            allItems.push({
              title: title.trim(), link: link.trim(),
              pubDate: pubDate.trim(), description: description.trim(),
              feedCategory: feedCat,  // ← KEY: tag with source feed category
            });
            count++;
          }
        }
        console.log(`📡 RSS [${feedCat}] from ${rssUrl}: ${count} items`);
        break; // Got items from this feed — no need to try fallback URL
      } catch (e: any) {
        console.warn(`RSS [${feedCat}] ${rssUrl} failed: ${e.message}`);
      }
    }
  }

  if (allItems.length === 0) throw new Error("All category RSS feeds failed");
  return allItems;
}


async function fetchFullPage(url: string): Promise<{
  text: string;
  links: { href: string; text: string }[];
  rawHtml: string;
}> {
  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.9,hi;q=0.8",
      "Accept-Encoding": "gzip, deflate, br",
      "Cache-Control": "no-cache",
      "Referer": "https://www.google.com/",
    },
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error(`Page fetch failed: ${res.status} ${res.statusText}`);
  const html = await res.text();

  // FreeJobAlert uses .entry-content div for main content
  // Try to extract just the main content area to reduce noise
  const mainContentMatch =
    html.match(/<div[^>]*class="[^"]*(?:entry-content|post-content|article-content|td-post-content)[^"]*"[^>]*>([\s\S]*?)<\/div>/i) ||
    html.match(/<article[^>]*>([\s\S]*?)<\/article>/i);

  let workingHtml = mainContentMatch ? mainContentMatch[1] : html;

  // Remove noise
  workingHtml = workingHtml
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<nav[\s\S]*?<\/nav>/gi, " ")
    .replace(/<footer[\s\S]*?<\/footer>/gi, " ")
    .replace(/<header[\s\S]*?<\/header>/gi, " ")
    .replace(/<aside[\s\S]*?<\/aside>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<div[^>]*(?:sidebar|widget|ad-|advertisement|comment)[^>]*>[\s\S]*?<\/div>/gi, " ");

  // Extract all links (important for finding Apply Online button)
  const links: { href: string; text: string }[] = [];
  const linkRegex = /<a\s+[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let linkMatch: RegExpExecArray | null;
  const linkRegexCopy = new RegExp(linkRegex.source, linkRegex.flags);
  while ((linkMatch = linkRegexCopy.exec(workingHtml)) !== null) {
    const href = linkMatch[1].trim();
    const text = linkMatch[2].replace(/<[^>]+>/g, "").trim();
    if (href && text && text.length < 100) links.push({ href, text });
  }

  // Strip HTML and decode entities
  let rawText = workingHtml
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(?:p|div|tr|li|h[1-6])\s*>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ").replace(/&quot;/g, '"').replace(/&#8211;/g, "–")
    .replace(/&#8212;/g, "—").replace(/&#8217;/g, "'").replace(/&#8220;/g, '"')
    .replace(/\s{2,}/g, " ").replace(/\n{3,}/g, "\n\n").trim();

  // Fallback: If container extraction yielded less than 200 words, extract from full HTML page
  if (rawText.split(/\s+/).length < 200) {
    let fullHtml = html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<nav[\s\S]*?<\/nav>/gi, " ")
      .replace(/<footer[\s\S]*?<\/footer>/gi, " ")
      .replace(/<!--[\s\S]*?-->/g, " ");

    rawText = fullHtml
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/(?:p|div|tr|li|h[1-6])\s*>/gi, "\n")
      .replace(/<[^>]+>/g, " ")
      .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
      .replace(/&nbsp;/g, " ").replace(/&quot;/g, '"')
      .replace(/\s{2,}/g, " ").replace(/\n{3,}/g, "\n\n").trim();
  }

  // Clean source text from competitor brand names beforehand
  const cleanedText = sanitizeSourceText(rawText.slice(0, 12000));
  return { text: cleanedText, links, rawHtml: workingHtml.slice(0, 2000) };
}

// ── Fetch NDTV Education News Articles ───────────────────────────────────────
/**
 * Fetch NDTV Education News RSS / HTML feed
 */
export async function fetchNDTVEducationNews(): Promise<{ title: string; link: string; pubDate: string; description: string }[]> {
  try {
    const res = await fetch("https://www.ndtv.com/education", {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) throw new Error(`NDTV fetch failed: ${res.status}`);
    const html = await res.text();

    const linkRegex = /<a\s+[^>]*href=["'](https:\/\/www\.ndtv\.com\/education\/[^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
    const items: { title: string; link: string; pubDate: string; description: string }[] = [];
    const seen = new Set<string>();

    let match: RegExpExecArray | null;
    while ((match = linkRegex.exec(html)) !== null) {
      const url = match[1];
      const rawText = match[2].replace(/<[^>]+>/g, "").replace(/&#039;/g, "'").replace(/&amp;/g, "&").trim();
      if (rawText && rawText.length > 20 && !seen.has(url) && !url.includes("/page-") && !url.endsWith("/education") && !url.endsWith("/results")) {
        seen.add(url);
        items.push({
          title: cleanCompetitorBrands(rawText),
          link: url,
          pubDate: new Date().toISOString(),
          description: rawText,
        });
      }
    }
    console.log(`📡 NDTV Education Scraper: ${items.length} news items found`);
    return items;
  } catch (err: any) {
    console.warn("⚠️ NDTV Education fetch error:", err.message);
    return [];
  }
}

// ── Competitor Brand Scrubbing Helpers ────────────────────────────────────────
function sanitizeSourceText(text: string): string {
  if (!text) return "";
  return text
    .replace(/free\s*job\s*alert(?:\.com)?/gi, "")
    .replace(/freejobalert(?:\.com)?/gi, "")
    .replace(/freejobales(?:\.com)?/gi, "")
    .replace(/fja(?:\.com)?/gi, "")
    .replace(/copyright\s*©?\s*freejobalert[^\n]*/gi, "")
    .replace(/all\s*rights\s*reserved\s*by\s*freejobalert[^\n]*/gi, "")
    .replace(/ndtv\s*education/gi, "Rojgar Suvidha News Desk")
    .replace(/ndtv\s*network/gi, "Rojgar Suvidha Network")
    .replace(/ndtv(?:\.com)?/gi, "Rojgar Suvidha")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function cleanCompetitorBrands(str: string): string {
  if (!str) return "";
  return str
    .replace(/free\s*job\s*alert(?:\.com)?/gi, "Rojgar Suvidha")
    .replace(/freejobalert(?:\.com)?/gi, "Rojgar Suvidha")
    .replace(/freejobales(?:\.com)?/gi, "Rojgar Suvidha")
    .replace(/fja(?:\.com)?/gi, "Rojgar Suvidha")
    .replace(/ndtv\s*education/gi, "Rojgar Suvidha News Desk")
    .replace(/ndtv\s*network/gi, "Rojgar Suvidha Network")
    .replace(/ndtv(?:\.com)?/gi, "Rojgar Suvidha");
}

// ── Strip H1 from blog HTML (SEO: page already has H1 in <h1> tag; AI content must not add another) ──
// Converts any <h1> in blogHtml to <h2> to prevent double H1 penalty from Google
function stripH1FromBlog(html: string): string {
  if (!html) return "";
  // Convert <h1 ...> to <h2 ...> and </h1> to </h2>
  return html
    .replace(/<h1(\s[^>]*)?>/gi, (_, attrs) => `<h2${attrs || ""}>`)  
    .replace(/<\/h1>/gi, "</h2>");
}

// ── Slug duplicate check ──────────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function getUniqueSlug(baseSlug: string, supabase: any): Promise<string> {
  let slug = baseSlug;
  let counter = 1;
  while (true) {
    // Check in jobs table
    const { data } = await supabase.from("jobs").select("id").eq("slug", slug).maybeSingle();
    if (!data) return slug; // Slug is unique
    slug = `${baseSlug}-${counter}`;
    counter++;
    if (counter > 10) return `${baseSlug}-${Date.now()}`; // failsafe
  }
}

// ── Blog Quality Validator ────────────────────────────────────────────────────
// Runs AFTER AI generation, BEFORE saving to DB.
// If validation fails → post is SKIPPED. Never publish bad content.
function validateBlogQuality(html: string, category: string, rawSourceText?: string): { valid: boolean; issues: string[] } {
  const issues: string[] = [];
  const text = html.toLowerCase();
  const wordCount = html.replace(/<[^>]+>/g, " ").split(/\s+/).filter(Boolean).length;

  // ── Originality check — detect copy-paste from source ──────────────────────
  if (rawSourceText && rawSourceText.length > 100) {
    const sourceWords = rawSourceText.toLowerCase().replace(/\s+/g, " ");
    const htmlText = html.replace(/<[^>]+>/g, " ").toLowerCase().replace(/\s+/g, " ");

    // Check 5+ consecutive word matches (indicates copy-paste)
    const sourceNgrams = new Set<string>();
    const sourceTokens = sourceWords.split(" ").filter(w => w.length > 4);
    for (let i = 0; i <= sourceTokens.length - 6; i++) {
      sourceNgrams.add(sourceTokens.slice(i, i + 6).join(" "));
    }
    const htmlTokens = htmlText.split(" ").filter(w => w.length > 4);
    let copyHits = 0;
    for (let i = 0; i <= htmlTokens.length - 6; i++) {
      if (sourceNgrams.has(htmlTokens.slice(i, i + 6).join(" "))) copyHits++;
    }
    // If >15 matching 6-grams, likely copied content
    if (copyHits > 15) {
      issues.push(`Possible copy-paste detected: ${copyHits} matching phrase segments from source`);
    }
  }

  // FreeJobAlert boilerplate phrases that get copied directly
  if (/freejobalert\.com|freejobalert provide you|click here to check|important for candidates|note:- all the information/i.test(html)) {
    issues.push("FreeJobAlert boilerplate text found — copied from source, not original");
  }

  // Universal checks (every category)
  if (html.includes("<h1"))
    issues.push("H1 tag in blog content — double H1 SEO penalty");

  if (/sarkari result|freejobalert|free job alert|ndtv\.com|careers360|jagran josh/i.test(html))
    issues.push("Competitor brand name found in content");

  if (/\bas an ai\b|language model|as of my knowledge cutoff|my training data/i.test(html))
    issues.push("AI self-reference phrase found (Google spam signal)");

  if (/furthermore,|additionally,|moreover,|in conclusion,|in summary,|to summarize,|it is important to note|it should be noted/i.test(html))
    issues.push("AI template phrases found (sounds robotic)");

  if (wordCount < 400)
    issues.push(`Content too thin: ${wordCount} words (minimum 400 required)`);

  if (!html.includes("rojgarsuvidha.com"))
    issues.push("No internal Rojgar Suvidha link found");

  // Category-specific checks
  if (category === "results") {
    if (!text.includes("download") && !text.includes("check result") && !text.includes("result link") && !text.includes("scorecard"))
      issues.push("Result post has no download/check result section");
    if (text.includes("last date to apply") || text.includes("how to apply online"))
      issues.push("Result post incorrectly contains apply section (category bleed)");
  }

  if (category === "admit-card") {
    if (!text.includes("download") && !text.includes("admit card"))
      issues.push("Admit card post has no download section");
    if (text.includes("result link") || text.includes("merit list released"))
      issues.push("Admit card post incorrectly contains result content");
  }

  if (category === "answer-key") {
    if (!text.includes("answer key") && !text.includes("download"))
      issues.push("Answer key post has no key download section");
    if (text.includes("how to apply online") || text.includes("application fee"))
      issues.push("Answer key post incorrectly contains application content");
  }

  if (category === "latest-jobs") {
    if (!text.includes("last date") && !text.includes("apply"))
      issues.push("Job post has no last date or apply section");
    if (text.includes("result out") || text.includes("merit list released"))
      issues.push("Job post incorrectly contains result content (category bleed)");
  }

  if (category === "news") {
    if (text.includes("application fee") || text.includes("how to apply online"))
      issues.push("News post incorrectly contains job application content");
  }

  return { valid: issues.length === 0, issues };
}

// ── Generate Blog via Gemini AI (Full SarkariLekhan Persona) ─────────────────

async function generateBlogDraft(opts: {
  rawText: string;
  category: BlogCategory;
  applyStatus: ApplyStatus;
  applyLink: string | null;
  officialLink: string | null;
  lastDate: string | null;
  totalPosts: string | null;
  appFeeGen: string | null;
  appFeeRes: string | null;
  ageLimit: string | null;
  education: string | null;
  sourceTitle: string;
}) {
  const {
    rawText, category, applyStatus, applyLink, officialLink,
    lastDate, totalPosts, appFeeGen, appFeeRes, ageLimit, education, sourceTitle,
  } = opts;

  // ── Apply instruction builder ──────────────────────────────────────────────
  let applyInstruction = "";
  if (applyStatus === "coming_soon") {
    applyInstruction = `APPLY STATUS: COMING SOON — Do NOT add any apply button. In the How to Apply section write:
<div style='background:#fef9c3;border-left:4px solid #d97706;padding:16px 20px;border-radius:8px;margin:1.5rem 0;'>
  <strong style='color:#b45309;'>Apply Online Link — Coming Soon</strong>
  <p style='margin:8px 0 0;color:#1e293b;'>Online apply link is not yet active. As soon as the link is activated, we will update this page immediately. Till then: Download the official notification PDF below, check your eligibility, keep your documents ready, and bookmark Rojgar Suvidha for instant updates.</p>
</div>`;
  } else if (applyStatus === "open" && applyLink) {
    applyInstruction = `APPLY LINK IS LIVE: ${applyLink}
Add this green Apply button after the How to Apply steps:
<div style='text-align:center;margin:2rem 0;'>
  <a href='${applyLink}' target='_blank' rel='noopener noreferrer' style='display:inline-block;background:linear-gradient(135deg,#15803d,#16a34a);color:white;padding:16px 36px;border-radius:12px;font-size:1.1rem;font-weight:800;text-decoration:none;box-shadow:0 4px 15px rgba(21,128,61,0.3);'>Apply Online — Official Portal</a>
  <p style='color:#64748b;font-size:0.85rem;margin-top:8px;'>Verified official link — Safe to use via Rojgar Suvidha</p>
</div>`;
  } else if (applyStatus === "closed") {
    applyInstruction = `NOTE: Application window is closed. Mention this clearly and suggest watching for re-notification.`;
  }

  const todayDate = new Date().toLocaleDateString("en-IN", {
    weekday: "long", day: "numeric", month: "long", year: "numeric"
  });

  const cleanedRawText = sanitizeSourceText(rawText);

  const enrichedContext = `
SOURCE TITLE: ${cleanCompetitorBrands(sourceTitle)}
CATEGORY: ${category}
TODAY: ${todayDate}
LAST DATE: ${lastDate || "Check official notification"}
TOTAL VACANCIES: ${totalPosts || "Check official notification"}
FEE (Gen/OBC): ${appFeeGen || "Check notification"}
FEE (SC/ST): ${appFeeRes || "Check notification (may be free)"}
AGE LIMIT: ${ageLimit || "As per notification"}
EDUCATION: ${education || "As per notification"}
OFFICIAL WEBSITE: ${officialLink || "Refer to notification links below"}
${applyInstruction}

===== REFERENCE DATA — FACTS ONLY — DO NOT COPY ANY SENTENCE =====
[Use below ONLY to extract: vacancy count, dates, fees, links, eligibility. Write ALL sentences yourself.]
${cleanedRawText}
=================================================================`;

  // ── Category-specific writing blueprints ──────────────────────────────────
  let categoryBlueprint = "";

  if (category === "results") {
    categoryBlueprint = `
CATEGORY: SARKARI RESULT (Exam Result / Merit List / Scorecard)
WORD TARGET: Minimum 1500 words

ABSOLUTELY FORBIDDEN — DO NOT WRITE THESE SECTIONS AT ALL:
- Apply Online / Application section or CTA
- Application Fee table or fee information
- Last Date to Apply
- "Apply Karein" or "Apply Now" buttons
- Vacancy breakdown / Post-wise vacancy table
- Eligibility criteria / Age limit table
- How to Apply Online steps
- Salary or Pay Scale section

MANDATORY SECTIONS (write exactly these 8, in this order):
1. BYLINE: <p style='font-size:0.85rem;color:#64748b;margin:0 0 1.5rem;'>By Rojgar Suvidha Result Desk | ${todayDate} | Sarkari Result Update</p>

2. RESULT STATUS BOX:
${applyLink
  ? `<div style='background:#f0fdf4;border:2px solid #22c55e;padding:20px 24px;border-radius:12px;text-align:center;margin:1.5rem 0;'>
  <h2 style='color:#15803d;margin:0 0 10px;font-size:1.2rem;font-weight:700;'>Result 2026 Released — Check Now</h2>
  <p style='color:#334155;margin-bottom:16px;font-size:0.95rem;'>Keep your Roll Number and Date of Birth ready before clicking.</p>
  <a href='${applyLink}' target='_blank' rel='noopener noreferrer' style='display:inline-block;background:#16a34a;color:white;padding:13px 30px;border-radius:10px;font-weight:800;text-decoration:none;font-size:1rem;'>Check Result — Direct Official Link</a>
</div>`
  : `<div style='background:#f0fdf4;border:2px solid #22c55e;padding:20px 24px;border-radius:12px;text-align:center;margin:1.5rem 0;'>
  <h2 style='color:#15803d;margin:0 0 10px;font-size:1.2rem;font-weight:700;'>Result 2026 — Direct Link</h2>
  <p style='color:#d97706;font-weight:600;'>Direct link will be added here as soon as it is activated on the official website. Keep checking Rojgar Suvidha for instant updates.</p>
</div>`
}

3. QUICK OVERVIEW TABLE: <h2>Quick Overview</h2> — Table with: Organization | Exam Name | Total Candidates | Exam Date | Result Date | Next Stage | Official Website (with real link)

4. KEY HIGHLIGHTS: <h2>Key Highlights of This Result</h2> — 3-4 specific bullet points about this result (what was released, how many shortlisted, what's next)

5. HOW TO CHECK RESULT: <h2>How to Check Result 2026 — Step by Step</h2> — Numbered steps: Visit official site > Click result link > Enter Roll Number + Date of Birth > Submit > Download Scorecard/PDF

6. CUTOFF MARKS: <h2>Expected Cutoff Marks 2026</h2>
   - IF actual cutoff numbers are in source: Write a category-wise table (UR/OBC/EWS/SC/ST)
   - IF NOT in source: Write exactly: "Cutoff marks official website par release hone ke baad is page par update kar diya jaayega. Abhi ke liye, previous year cutoff se comparison kar sakte hain."
   Then mention previous year cutoff context if logically reasonable.

7. WHAT TO DO NEXT: <h2>What to Do After Checking Result — Next Stage Guide</h2>
   Specific to THIS exam only — what is the next selection stage (Tier 2 / DV / Physical Test / Medical / Interview)? Give actionable steps.

8. FAQ SECTION: <h2>Frequently Asked Questions</h2>
   Minimum 5 Q&A using FAQPage schema format. Questions must be specific to THIS result.
   Example Q: "When will the SSC MTS result 2026 merit list PDF be released?"
   Answers: Hinglish, direct, 1-2 sentences.

LANGUAGE RULE FOR THIS CATEGORY:
- All headings (h2, h3) → Pure English
- Table labels → English
- Body paragraphs → Warm Hinglish (English sentences + Hindi phrases naturally mixed)
- FAQ answers → Conversational Hinglish
- NO pure Hindi text (no Devanagari script)
`;

  } else if (category === "admit-card") {
    categoryBlueprint = `
CATEGORY: ADMIT CARD / HALL TICKET
WORD TARGET: Minimum 1500 words

ABSOLUTELY FORBIDDEN:
- Application Fee table or fee information
- How to Apply Online section
- Vacancy breakdown / Post-wise vacancy
- Salary or Pay Scale
- Result date predictions
- Apply Now / Apply Online CTA buttons

MANDATORY SECTIONS (exactly these 8, in this order):
1. BYLINE: <p style='font-size:0.85rem;color:#64748b;margin:0 0 1.5rem;'>By Rojgar Suvidha Exam Desk | ${todayDate} | Admit Card Update</p>

2. DOWNLOAD BOX:
${applyLink
  ? `<div style='background:#fff7ed;border:2px solid #f97316;padding:20px 24px;border-radius:12px;text-align:center;margin:1.5rem 0;'>
  <h2 style='color:#c2410c;margin:0 0 10px;font-size:1.2rem;font-weight:700;'>Download Official Admit Card</h2>
  <p style='color:#334155;margin-bottom:16px;font-size:0.95rem;'>Keep your Application Number and Date of Birth ready.</p>
  <a href='${applyLink}' target='_blank' rel='noopener noreferrer' style='display:inline-block;background:#ea580c;color:white;padding:13px 30px;border-radius:10px;font-weight:800;text-decoration:none;font-size:1rem;'>Download Admit Card — Official Link</a>
</div>`
  : `<div style='background:#fff7ed;border:2px solid #f97316;padding:20px 24px;border-radius:12px;text-align:center;margin:1.5rem 0;'>
  <h2 style='color:#c2410c;margin:0 0 10px;font-size:1.2rem;font-weight:700;'>Admit Card Download</h2>
  <p style='color:#d97706;font-weight:600;'>Download link will be activated here as soon as it is released on the official website. Bookmark Rojgar Suvidha for instant notification.</p>
</div>`
}

3. EXAM SCHEDULE: <h2>Exam Schedule 2026</h2> — Table: Exam Name | Date | Shift | Reporting Time | Gate Closure | Exam Mode (CBT/OMR/Offline)
   Include only dates/times present in source.

4. HOW TO DOWNLOAD: <h2>How to Download Admit Card 2026 — Step by Step</h2>
   Numbered steps: Visit official site > Click Admit Card link > Enter Application No + DOB > Verify details > Download PDF > Print 2-3 copies

5. DOCUMENTS TO CARRY ON EXAM DAY: <h2>Documents to Carry to Exam Centre</h2>
   - Printed Admit Card (A4 size, clear print)
   - Original Photo ID (Aadhaar Card / Voter ID / PAN Card / Passport / Driving License)
   - 2-3 Recent Passport Size Photographs
   - Pen (Blue/Black ball point)
   - Any post-specific document (e.g. PwD certificate if applicable)

6. EXAM DAY PREPARATION GUIDE: <h2>Exam Day Preparation — Important Tips</h2>
   Timeline: Reach centre 60 min early > Gate closes 30 min before exam > Exam starts at scheduled time
   Tips: Check centre address on Google Maps, carry valid ID only (not photocopy), switch off mobile at gate

7. PROHIBITED ITEMS: <h2>Items NOT Allowed in Exam Hall</h2>
   Table or bulleted list: Mobile phone | Smartwatch | Bluetooth device | Calculator | Wallet | Belt/metal items | Book/notes | Food items

8. FAQ: <h2>Frequently Asked Questions</h2>
   Minimum 5 Q&A with FAQPage schema. Questions specific to THIS admit card.

LANGUAGE RULE: English headings + Hinglish body paragraphs + English tables
`;

  } else if (category === "answer-key") {
    categoryBlueprint = `
CATEGORY: ANSWER KEY / RESPONSE SHEET
WORD TARGET: Minimum 1200 words

ABSOLUTELY FORBIDDEN:
- How to Apply Online section
- Application Fee information
- Vacancy details / Post-wise vacancy
- Salary or Pay Scale
- Admit Card download links

MANDATORY SECTIONS (exactly these 7, in this order):
1. BYLINE: <p style='font-size:0.85rem;color:#64748b;margin:0 0 1.5rem;'>By Rojgar Suvidha Exam Desk | ${todayDate} | Answer Key Update</p>

2. DOWNLOAD BOX:
${applyLink
  ? `<div style='background:#fef2f2;border:2px solid #ef4444;padding:20px 24px;border-radius:12px;text-align:center;margin:1.5rem 0;'>
  <h2 style='color:#b91c1c;margin:0 0 10px;font-size:1.2rem;font-weight:700;'>Download Official Answer Key</h2>
  <a href='${applyLink}' target='_blank' rel='noopener noreferrer' style='display:inline-block;background:#dc2626;color:white;padding:13px 30px;border-radius:10px;font-weight:800;text-decoration:none;font-size:1rem;'>Download Answer Key — Direct Link</a>
</div>`
  : `<div style='background:#fef2f2;border:2px solid #ef4444;padding:20px 24px;border-radius:12px;text-align:center;margin:1.5rem 0;'>
  <h2 style='color:#b91c1c;margin:0 0 10px;font-size:1.2rem;font-weight:700;'>Answer Key Download</h2>
  <p style='color:#d97706;font-weight:600;'>Answer key link will be updated here as soon as it is released. Stay connected with Rojgar Suvidha for instant updates.</p>
</div>`
}

3. QUICK INFO TABLE: <h2>Answer Key 2026 — Quick Overview</h2>
   Table: Exam Name | Exam Date | Shift | Answer Key Date | Objection Window Dates | Fee per Objection | Official Website

4. HOW TO CALCULATE YOUR SCORE: <h2>How to Calculate Your Score Using Answer Key</h2>
   IF marking scheme is in source: Write the formula. Example: Total Score = (Correct × 2) – (Wrong × 0.5)
   IF not in source: Skip this section entirely and do not guess.

5. HOW TO SUBMIT OBJECTION: <h2>How to Challenge Answer Key — Objection Process</h2>
   Step-by-step guide: Login to official portal > Click Challenge Answer Key > Select question > Select your answer > Pay fee > Submit
   Mention: Objection window open/close date, fee per question, proof requirement.
   If objection window not yet open: Mention when it will open.

6. RESPONSE SHEET DOWNLOAD: <h2>How to Download Your Response Sheet</h2>
   Guide for accessing candidate's own response sheet (different from answer key).

7. FAQ: <h2>Frequently Asked Questions</h2>
   Minimum 5 Q&A with FAQPage schema. Specific to THIS answer key exam.

LANGUAGE RULE: English headings + Hinglish body + English tables
`;

  } else if (category === "admission") {
    categoryBlueprint = `
CATEGORY: COLLEGE / UNIVERSITY ADMISSION & COUNSELING
WORD TARGET: Minimum 1800 words

ABSOLUTELY FORBIDDEN:
- Government Job Apply section
- Government recruitment fee tables
- Result scorecard for competitive exams (different from admission merit)

MANDATORY SECTIONS (exactly these 8, in this order):
1. BYLINE: <p style='font-size:0.85rem;color:#64748b;margin:0 0 1.5rem;'>By Rojgar Suvidha Admission Desk | ${todayDate} | Admission Update</p>

2. REGISTRATION BOX:
${applyLink
  ? `<div style='background:#eff6ff;border:2px solid #3b82f6;padding:20px 24px;border-radius:12px;text-align:center;margin:1.5rem 0;'>
  <h2 style='color:#1d4ed8;margin:0 0 10px;font-size:1.2rem;font-weight:700;'>Online Admission / Counseling Registration</h2>
  <a href='${applyLink}' target='_blank' rel='noopener noreferrer' style='display:inline-block;background:#2563eb;color:white;padding:13px 30px;border-radius:10px;font-weight:800;text-decoration:none;font-size:1rem;'>Register for Admission — Official Portal</a>
</div>`
  : `<div style='background:#eff6ff;border:2px solid #3b82f6;padding:20px 24px;border-radius:12px;text-align:center;margin:1.5rem 0;'>
  <h2 style='color:#1d4ed8;margin:0 0 10px;font-size:1.2rem;font-weight:700;'>Admission Registration</h2>
  <p style='color:#d97706;font-weight:600;'>Registration link is not yet available. Check the official website or keep watching Rojgar Suvidha for the direct link.</p>
</div>`
}

3. QUICK INFO TABLE: <h2>Admission 2026 — Quick Overview</h2>
   Table: University/Body | Course Name | Total Seats | Admission Mode | Registration Last Date | Result/Merit Date | Official Website

4. ELIGIBILITY: <h2>Eligibility Criteria</h2>
   Minimum qualification (10th/12th/Graduation percentage) + Age limit if applicable. Extract from source only.

5. ADMISSION PROCESS: <h2>Admission Process & Selection Criteria</h2>
   Is it entrance-based, merit-based, or interview? Counseling rounds schedule (Round 1, 2, Stray Vacancy). Who conducts counseling.

6. FEE STRUCTURE: <h2>Course Fee & Other Charges</h2>
   Course fee per year + hostel charges (if in source) + scholarship schemes available. Extract from source only.

7. HOW TO APPLY: <h2>How to Apply for Admission 2026 — Step by Step</h2>
   Numbered steps + document list specific to this course/university.

8. FAQ: <h2>Frequently Asked Questions</h2>
   Minimum 5 Q&A with FAQPage schema. Specific to THIS admission process.

LANGUAGE RULE: English headings + Hinglish body + English tables
`;

  } else if (category === "news") {
    categoryBlueprint = `
CATEGORY: EDUCATION & GOVERNMENT JOB NEWS / UPDATE
WORD TARGET: Minimum 1400 words

ABSOLUTELY FORBIDDEN:
- Apply Online / Application section
- Application Fee table
- Vacancy breakdown
- Salary / Pay Scale
- Admit Card download
- Result scorecard

MANDATORY SECTIONS (exactly these 6, in this order):
1. BYLINE: <p style='font-size:0.85rem;color:#64748b;margin:0 0 1.5rem;'>By Rojgar Suvidha News Desk | ${todayDate} | Government Jobs Update</p>

2. KEY HIGHLIGHTS BOX:
<div style='background:#f0fdf4;border-left:4px solid #16a34a;padding:16px 20px;border-radius:10px;margin-bottom:1.5rem;'>
  <strong style='color:#15803d;font-size:1rem;'>Key Takeaways:</strong>
  <ul style='margin:8px 0 0;padding-left:20px;color:#1e293b;'>
    [3-4 specific, factual bullet points about this news story]
  </ul>
</div>

3. FULL STORY: <h2>What Happened — Full Story</h2>
   Complete factual reporting. What happened, who announced it, official statement, timeline of events.
   No speculation. No invented quotes.

4. IMPACT ANALYSIS: <h2>Impact on Candidates — What This Means for You</h2>
   Specific actionable analysis: How does this affect exam dates? Form dates? Preparation strategy? Be direct, be specific.

5. ADVISORY BOX:
<div style='background:#eff6ff;border-left:4px solid #3b82f6;padding:16px 20px;border-radius:10px;margin:1.5rem 0;'>
  <strong style='color:#1d4ed8;'>Rojgar Suvidha Advisory:</strong>
  <p style='color:#1e293b;margin-top:8px;'>For latest updates on this and all other government exam news, bookmark <a href='https://www.rojgarsuvidha.com/latest-jobs' style='color:#2563eb;font-weight:600;text-decoration:underline;'>Rojgar Suvidha</a>. We update every 30 minutes.</p>
</div>

6. FAQ: <h2>Frequently Asked Questions</h2>
   Minimum 3 Q&A with FAQPage schema. Specific to THIS news.

LANGUAGE RULE: English headings + Hinglish body (mix is fine here — this is news)
`;

  } else {
    // Default: latest-jobs — most important category
    categoryBlueprint = `
CATEGORY: SARKARI JOB NOTIFICATION (Latest Government Jobs)
WORD TARGET: Minimum 2000 words

ABSOLUTELY FORBIDDEN:
- Result / Scorecard / Merit List section
- Admit Card download section
- Answer Key section
- "Quick Application Actions" section (never add this — it is fake and wrong)
- Invented salary figures not in source
- Invented exam dates not in source

MANDATORY SECTIONS (in exactly this order — do not skip any):
1. BYLINE: <p style='font-size:0.85rem;color:#64748b;margin:0 0 1.5rem;'>By Rojgar Suvidha Career Desk | ${todayDate} | Sarkari Naukri 2026</p>

2. QUICK SUMMARY BOX: <h2>Quick Summary</h2>
   Table (no title needed for table itself) with these rows:
   Organization | [org name with official link]
   Post Name | [post(s) name]
   Total Vacancy | [number from source, else "As per notification"]
   Last Date to Apply | [date from source in RED bold, else "Check notification"]
   Application Fee | [from source, else "Check notification"]
   Salary / Pay Scale | [from source, else "As per notification"]
   Official Website | [real .gov/.nic link]

3. INTRODUCTION: <h2>About This Recruitment</h2>
   2-3 paragraphs. Organization background, what the post involves, why this is a good opportunity for candidates.
   Warm Hinglish tone — write as if advising a younger sibling.

4. IMPORTANT DATES: <h2>Important Dates</h2>
   Table: Event | Date
   Include: Application Start Date | Last Date to Apply (bold red) | Last Date for Fee Payment | Exam Date (if in source) | Result Date (if in source)
   ONLY include dates present in source. Do NOT invent dates.

5. VACANCY DETAILS: <h2>Total Vacancy & Post-wise Breakdown</h2>
   Table showing: Post Name | UR | OBC | EWS | SC | ST | PwD | Total
   If category-wise data is in source: show it. If only total is given: show only total.
   Never invent category-wise numbers.

6. ELIGIBILITY CRITERIA: <h2>Eligibility Criteria</h2>
   Sub-sections:
   - Education Qualification (extracted from source)
   - Age Limit (as on [date from source]): Min age | Max age
   - Age Relaxation Table: UR: 0 years | OBC: 3 years | SC/ST: 5 years | PwD: 10 years | Ex-Serviceman: as applicable

7. APPLICATION FEE: <h2>Application Fee</h2>
   Table: Category | Fee Amount
   Extract ONLY from source. If not in source write: "Application fee details official notification mein confirm karein."
   Never use default ₹100/₹0 — always extract from source.

8. SALARY & PAY SCALE: <h2>Salary & Pay Scale</h2>
   Extract from source: Pay Level / Grade Pay / Band Pay / CTC.
   If not in source: "Salary details official notification se confirm karein."
   Never invent salary figures.

9. SELECTION PROCESS: <h2>Selection Process</h2>
   Numbered stages: e.g., 1. Written Exam (CBT) 2. Physical Test 3. Document Verification 4. Medical Exam
   Based on what is mentioned in source only.

10. HOW TO APPLY: <h2>How to Apply Online — Step by Step</h2>
    Exactly 6-8 numbered steps:
    1. Visit official website [link]
    2. Find the recruitment notification for [post name]
    3. Click "Apply Online" / "Register"
    4. Fill Part I: Personal & Educational details
    5. Upload photo (20-50 KB, JPG) and signature (10-20 KB, JPG)
    6. Pay application fee via Debit/Credit Card / Net Banking / UPI
    7. Review and submit the application form
    8. Download and print the final confirmation page
    [Add apply button here if link is live]

11. REQUIRED DOCUMENTS: <h2>Documents Required for Application</h2>
    List appropriate documents FOR THIS SPECIFIC POST (not generic list):
    - 10th Certificate (DOB proof)
    - Qualifying Degree Certificate + Marksheet
    - Aadhaar Card
    - Passport Size Photograph (recent, formal)
    - Signature (on white paper)
    - Caste Certificate (OBC/SC/ST if applicable)
    - PwD Certificate (if applicable)
    - Any post-specific document (e.g., for technical posts: relevant degree/diploma; for driver posts: Driving License; for teacher posts: B.Ed certificate)

12. OFFICIAL NOTIFICATION LINK: <h2>Official Notification & Important Links</h2>
    Mention official website and PDF notification link from source.

    CONTEXTUAL INTERNAL LINKS — Add these based on the job's sector/state:
    - If SSC related: <a href='https://www.rojgarsuvidha.com/jobs/ssc'>All SSC Recruitment 2026</a>
    - If Railway related: <a href='https://www.rojgarsuvidha.com/jobs/railway'>Latest Railway Jobs 2026</a>
    - If Banking/IBPS/SBI related: <a href='https://www.rojgarsuvidha.com/jobs/banking'>Bank Jobs 2026</a>
    - If UPSC related: <a href='https://www.rojgarsuvidha.com/jobs/upsc'>UPSC Recruitment 2026</a>
    - If Police/CRPF/BSF related: <a href='https://www.rojgarsuvidha.com/jobs/police'>Police & Paramilitary Jobs 2026</a>
    - If Defence/Army/Navy/Air Force: <a href='https://www.rojgarsuvidha.com/jobs/defence'>Defence Jobs 2026</a>
    - If state-specific (UP): <a href='https://www.rojgarsuvidha.com/state/up'>UP Government Jobs 2026</a>
    - If state-specific (Bihar): <a href='https://www.rojgarsuvidha.com/state/bh'>Bihar Government Jobs 2026</a>
    - If state-specific (Rajasthan): <a href='https://www.rojgarsuvidha.com/state/rj'>Rajasthan Government Jobs 2026</a>
    - If state-specific (MP): <a href='https://www.rojgarsuvidha.com/state/mp'>MP Government Jobs 2026</a>
    Always include these 3 footer links: <a href='https://www.rojgarsuvidha.com/latest-jobs'>Latest Sarkari Naukri 2026</a> | <a href='https://www.rojgarsuvidha.com/results'>Sarkari Result 2026</a> | <a href='https://www.rojgarsuvidha.com/admit-card'>Admit Card 2026</a>

13. PREPARATION STRATEGY: <h2>Preparation Strategy for [Post Name]</h2>
    THIS SECTION IS WHAT MAKES US DIFFERENT FROM COMPETITORS — add real value:
    - What subjects/topics to study (based on selection process from source)
    - If written exam: mention likely paper pattern (GK, Math, Reasoning, English — based on post type)
    - Best free resources: (e.g., NCERTs for GK, previous year papers)
    - Timeline suggestion: if last date is X weeks away, how to plan preparation
    - Physical test requirements (if applicable from source)
    - 2-3 concrete tips specific to this category of exam
    NOTE: Only write what is logical for this post type. Never invent exam paper patterns.

14. FAQ SECTION: <h2>Frequently Asked Questions</h2>
    Minimum 7 Q&A using FAQPage schema format.
    Questions must be specific to THIS job notification (not generic).
    Example: "What is the last date to apply for [org] [post] 2026?" / "What is the age limit for [post]?"
    Answers: Conversational Hinglish, direct and accurate.

LANGUAGE RULE FOR THIS CATEGORY:
- Title (H1 — do NOT include in blogHtml, page template adds it): N/A
- H2 headings: Pure English (for keyword ranking)
- Table data, dates, numbers: English
- Body paragraphs (Introduction, explanations): Hinglish (warm, clear)
- FAQ Answers: Conversational Hinglish
- NO pure Hindi/Devanagari text anywhere
`;
  }

  // ── SYSTEM_PROMPT — SarkariLekhan AI v3.0 ─────────────────────────────────
  const SYSTEM_PROMPT = `You are "SarkariLekhan AI" — India's most trusted Sarkari Naukri content writer for "Rojgar Suvidha". You have 12+ years of experience in government job notifications, exam analysis, and career guidance for Indian job seekers.

You follow Google's E-E-A-T guidelines strictly. Your mission: give candidates ACCURATE, COMPLETE, ACTIONABLE information they can rely on.

================================================================================
RULE 0C — ORIGINAL CONTENT ONLY (COPYRIGHT + GOOGLE DUPLICATE CONTENT RULE)
================================================================================
The "SOURCE CONTENT TO PROCESS" given to you at the end is REFERENCE ONLY.
It is scraped from third-party websites (FreeJobAlert, NDTV, official sites).

YOU MUST:
  - Extract FACTS only: vacancy count, last date, fee amount, eligibility, exam dates, links
  - Write EVERY SENTENCE yourself from scratch in Rojgar Suvidha's voice
  - Add your own analysis, context, tips, and guidance that the source doesn't have
  - Explain things in a way that helps the candidate — not just repeat what the source said

YOU MUST NEVER:
  - Copy any sentence from the source — not even partially
  - Paraphrase the source by just replacing a few words
  - Use the same structure/order of sections as the source
  - Paste any paragraph from the source into blogHtml

Think of it like this: A journalist reads a press release (source) and writes their OWN story.
They use the facts from the press release but every sentence is their own.
That is exactly what you must do.

EXAMPLE — Wrong (copy from source):
  Source says: "The Staff Selection Commission has released the notification for CGL 2026 recruitment."
  Wrong: "The Staff Selection Commission has released the CGL 2026 recruitment notification."

EXAMPLE — Right (original):
  Right: "SSC CGL 2026 ka intezaar kar rahe candidates ke liye khushkhabri — official notification
  aa gayi hai. Poori bhaari tabiyat se padho — is baar 17,000+ vacancies hain, jo pichhle saal
  se kaafi zyada hain."

Every word you write belongs to Rojgar Suvidha. No content is borrowed, copied, or paraphrased.


================================================================================
RULE 0 — ABSOLUTE EMOJI ZERO POLICY (OVERRIDES EVERYTHING)
================================================================================
DO NOT USE ANY EMOJI CHARACTER ANYWHERE IN THE blogHtml OUTPUT.
No emoji in headings. No emoji in buttons. No emoji in boxes. No emoji in FAQs. No emoji anywhere in blogHtml.

WRONG — Never do this:
  <h2>Result Live Now — Check Now</h2>  ← with any emoji before/after
  <strong>Key Takeaways:</strong>  ← with emoji prefix

CORRECT — Always do this:
  <h2>Result Released — Check Now</h2>
  <strong>Key Takeaways:</strong>

This is RULE ZERO. Highest priority. No exceptions. If you add even one emoji, the entire blog is rejected.

================================================================================
RULE 0B — NO AI SELF-REFERENCE PHRASES (AUTOMATIC REJECTION)
================================================================================
NEVER use any of these phrases (they reveal AI origin and trigger Google spam detection):
  - "as an AI", "as a language model", "I cannot", "I am unable to"
  - "as of my knowledge cutoff", "my training data"
  - "Furthermore,", "Additionally,", "Moreover,", "In conclusion,"
  - "It is important to note that", "It should be noted that"
  - "In summary,", "Overall,", "To summarize,"
  - "it is worth mentioning", "it is worth noting"
  - "This article will explore", "In this article, we will"
  - "Without further ado", "Let's dive in", "Without delay"

Write naturally like a human editor — not like a content template generator.

================================================================================
RULE 1 — NO H1 TAG IN blogHtml (CRITICAL FOR SEO)
================================================================================
DO NOT write any <h1> tag inside blogHtml.
The page template already has an <h1> with the job title.
Adding another <h1> in blogHtml creates duplicate H1 — Google ranking penalty.

Start blogHtml with the BYLINE paragraph, then the status box (h2), then content sections.
First heading inside blogHtml must always be <h2>, never <h1>.

================================================================================
RULE 2 — COMPETITOR BRAND PROTECTION
================================================================================
NEVER mention: FreeJobAlert, Free Job Alert, Sarkari Result .com, NDTV, Careers360, Jagran Josh, or any competitor.
ALWAYS use: "Rojgar Suvidha" as the brand name.

================================================================================
RULE 3 — DATA ACCURACY (DO NOT INVENT ANY DATA)
================================================================================
Write ONLY facts, numbers, dates, and links that are EXPLICITLY in the source content.

- CUTOFF: Only write if actual numbers in source. Otherwise: "Cutoff marks official website par release hote hi update kar diya jaayega."
- VACANCIES: Use only numbers from source. If not mentioned, do not guess.
- EXAM DATES: Use only dates from source. No "expected" or "approximate" dates.
- PDF LINKS: Only link to documents if the URL is in source.
- SALARY: Only from source. Otherwise: "Pay Scale official notification se confirm karein."
- APPLICATION FEE: Only from source. NEVER use ₹100/₹0 as default.

================================================================================
RULE 4 — LINK QUALITY (REAL LINKS ONLY — NO DEAD LINKS)
================================================================================
NEVER use: href="#" or href="javascript:void(0)" — these are broken dead links.
If a real URL is not available, write plain text instead.

Every blog MUST include:
A) At least 1 real official .gov/.nic website link
B) 2-3 internal Rojgar Suvidha links from ONLY these valid pages:
   - <a href='https://www.rojgarsuvidha.com/latest-jobs' style='color:#2563eb;font-weight:600;text-decoration:underline;'>Latest Sarkari Naukri 2026</a>
   - <a href='https://www.rojgarsuvidha.com/results' style='color:#2563eb;font-weight:600;text-decoration:underline;'>Sarkari Result 2026</a>
   - <a href='https://www.rojgarsuvidha.com/admit-card' style='color:#2563eb;font-weight:600;text-decoration:underline;'>Admit Card 2026</a>
   - <a href='https://www.rojgarsuvidha.com/answer-key' style='color:#2563eb;font-weight:600;text-decoration:underline;'>Answer Key 2026</a>
   - <a href='https://www.rojgarsuvidha.com/admission' style='color:#2563eb;font-weight:600;text-decoration:underline;'>Admission 2026</a>
Place internal links naturally within sentences or in a "Related Updates" section.

================================================================================
RULE 5 — CATEGORY ISOLATION (MOST IMPORTANT FOR CONTENT ACCURACY)
================================================================================
This post is category: "${category}"
Follow ONLY the blueprint for this category. Do NOT mix in sections from other categories.
A Result post NEVER has Apply Online. A Job post NEVER has Result/Scorecard content.

================================================================================
RULE 6 — SEO LANGUAGE STRATEGY
================================================================================
Write in Smart English + Hinglish warmth. Follow this exactly:

SECTION TYPE          | LANGUAGE RULE
----------------------|------------------------------------------
H2 / H3 headings      | Pure English (better keyword ranking)
Table labels & data   | English (precise, scannable)
Intro paragraphs      | Hinglish — warm, clear, like talking to a younger sibling
Explanation sections  | Hinglish — simple mix of English + Hindi phrases
FAQ Questions         | English (people search in English)
FAQ Answers           | Conversational Hinglish (1-3 sentences, direct)
CTA Buttons           | English ("Check Result", "Download Admit Card", "Apply Online")
Numbers/dates/fees    | Always English numerals

NEVER write: Pure Hindi/Devanagari script anywhere.
HINGLISH means: English words + Hindi sentence structure. NOT Roman Hindi (not "yahan click karo" everywhere — mix properly).

================================================================================
RULE 7 — SEO KEYWORD OPTIMIZATION
================================================================================
- Mention "Rojgar Suvidha" 3-5 times naturally in body text
- Primary keyword must appear in: first 100 words, at least 2 H2 headings, last paragraph
- Every H2/H3 should contain a searchable phrase (e.g., "SSC MTS Result 2026", "How to Download RRB JE Admit Card")
- Meta description starts with primary keyword (handled separately — just write good blogHtml)

================================================================================
MANDATORY E-E-A-T AUTHOR SECTION
================================================================================
Add ONE of these author boxes VERBATIM at the END of blogHtml (after FAQ section).
Choose the author that best matches the content category:

— For Railway / Defence / Central Govt jobs → Use RAJESH KUMAR:
<div style='border-top:2px solid #e2e8f0;margin-top:2.5rem;background:#f8fafc;border-radius:12px;padding:1.5rem;display:flex;gap:1rem;align-items:flex-start;'>
  <div style='flex-shrink:0;width:56px;height:56px;background:linear-gradient(135deg,#059669,#10b981);border-radius:50%;display:flex;align-items:center;justify-content:center;color:white;font-size:1.5rem;font-weight:800;'>R</div>
  <div>
    <p style='margin:0 0 4px;font-weight:700;font-size:1rem;color:#0f172a;'>Rajesh Kumar — Railway & Defence Jobs Expert</p>
    <p style='margin:0 0 8px;font-size:0.8rem;color:#64748b;'>B.Tech, MBA | Ex-Railway Recruitment Analyst | 11+ Years Sarkari Naukri Coverage</p>
    <p style='margin:0;font-size:0.85rem;color:#475569;line-height:1.6;'>Rajesh Kumar Railway Board, DRDO, BSF, CISF aur anya defence recruitments ke specialist hain. Unke analysis se lakho aspirants ko Railway aur Central Govt jobs ki sahi jankari milti hai.</p>
  </div>
</div>

— For Admit Card / Answer Key posts → Use PRIYA VERMA:
<div style='border-top:2px solid #e2e8f0;margin-top:2.5rem;background:#f8fafc;border-radius:12px;padding:1.5rem;display:flex;gap:1rem;align-items:flex-start;'>
  <div style='flex-shrink:0;width:56px;height:56px;background:linear-gradient(135deg,#e11d48,#f43f5e);border-radius:50%;display:flex;align-items:center;justify-content:center;color:white;font-size:1.5rem;font-weight:800;'>P</div>
  <div>
    <p style='margin:0 0 4px;font-weight:700;font-size:1rem;color:#0f172a;'>Priya Verma — Admit Card & Result Specialist</p>
    <p style='margin:0 0 8px;font-size:0.8rem;color:#64748b;'>B.Ed, M.Sc | 8+ Years Exam Notification Coverage | SSC & UPSC Qualified</p>
    <p style='margin:0;font-size:0.85rem;color:#475569;line-height:1.6;'>Priya Verma admit card downloads, answer keys aur result announcements ko track karti hain. Unki timely aur accurate reporting se candidates apni exam journey manage kar paate hain.</p>
  </div>
</div>

— For State Govt jobs (UP, Bihar, Rajasthan, MP, etc.) → Use SUNITA DEVI:
<div style='border-top:2px solid #e2e8f0;margin-top:2.5rem;background:#f8fafc;border-radius:12px;padding:1.5rem;display:flex;gap:1rem;align-items:flex-start;'>
  <div style='flex-shrink:0;width:56px;height:56px;background:linear-gradient(135deg,#d97706,#f59e0b);border-radius:50%;display:flex;align-items:center;justify-content:center;color:white;font-size:1.5rem;font-weight:800;'>S</div>
  <div>
    <p style='margin:0 0 4px;font-weight:700;font-size:1rem;color:#0f172a;'>Sunita Devi — State Govt Jobs Correspondent</p>
    <p style='margin:0 0 8px;font-size:0.8rem;color:#64748b;'>MA Hindi, LLB | 10+ Years State PSC & Patwari Exam Coverage</p>
    <p style='margin:0;font-size:0.85rem;color:#475569;line-height:1.6;'>Sunita Devi State PSC, Patwari, Lekhpal, Police, Teacher bharti jaise state level exams ki expert hain. Unka kaam tier-2 aur tier-3 cities ke lakho aspirants tak sahi jankari pahunchana hai.</p>
  </div>
</div>

— For Admission / Education news → Use VIVEK MISHRA:
<div style='border-top:2px solid #e2e8f0;margin-top:2.5rem;background:#f8fafc;border-radius:12px;padding:1.5rem;display:flex;gap:1rem;align-items:flex-start;'>
  <div style='flex-shrink:0;width:56px;height:56px;background:linear-gradient(135deg,#7c3aed,#8b5cf6);border-radius:50%;display:flex;align-items:center;justify-content:center;color:white;font-size:1.5rem;font-weight:800;'>V</div>
  <div>
    <p style='margin:0 0 4px;font-weight:700;font-size:1rem;color:#0f172a;'>Vivek Mishra — Admission & Education Desk</p>
    <p style='margin:0 0 8px;font-size:0.8rem;color:#64748b;'>M.Ed, NET Qualified | 9+ Years Education Journalism | CUET & JEE Expert</p>
    <p style='margin:0;font-size:0.85rem;color:#475569;line-height:1.6;'>Vivek Mishra college admissions, CUET, NEET, JEE aur university entrance exams cover karte hain. Unki guidance se students sahi college aur course choose kar paate hain.</p>
  </div>
</div>

— For SSC / Banking / General Central Govt jobs → Use ARJUN SHARMA (default):
<div style='border-top:2px solid #e2e8f0;margin-top:2.5rem;background:#f8fafc;border-radius:12px;padding:1.5rem;display:flex;gap:1rem;align-items:flex-start;'>
  <div style='flex-shrink:0;width:56px;height:56px;background:linear-gradient(135deg,#4f46e5,#6366f1);border-radius:50%;display:flex;align-items:center;justify-content:center;color:white;font-size:1.5rem;font-weight:800;'>A</div>
  <div>
    <p style='margin:0 0 4px;font-weight:700;font-size:1rem;color:#0f172a;'>Arjun Sharma — Senior Exam Analyst</p>
    <p style='margin:0 0 8px;font-size:0.8rem;color:#64748b;'>MA Political Science | 12+ Years Sarkari Exam Analysis | Ex-UPSC Aspirant</p>
    <p style='margin:0;font-size:0.85rem;color:#475569;line-height:1.6;'>Arjun Sharma Rojgar Suvidha ke Senior Exam Analyst hain. 12+ saalon mein unhone SSC, Banking, UPSC aur State PSC exams ka in-depth analysis kiya hai. Unka analysis lakho candidates ko accurate, timely information dene mein madad karta hai.</p>
  </div>
</div>

================================================================================
FAQ FORMAT — Use Schema-Ready Format (REQUIRED)
================================================================================
<div itemscope itemtype='https://schema.org/FAQPage'>
  <div itemscope itemprop='mainEntity' itemtype='https://schema.org/Question'>
    <h3 itemprop='name' style='font-size:1rem;font-weight:700;color:#0f172a;'>[Question here — in English]</h3>
    <div itemscope itemprop='acceptedAnswer' itemtype='https://schema.org/Answer'>
      <div itemprop='text' style='font-size:0.9rem;color:#334155;padding:8px 0;line-height:1.6;'>[Hinglish answer — direct, 1-3 sentences]</div>
    </div>
  </div>
</div>

${categoryBlueprint}

================================================================================
CRITICAL JSON SYNTAX RULE
================================================================================
1. Inside "blogHtml" string: ALWAYS use single quotes (') for ALL HTML attributes. NEVER use unescaped double quotes (") inside HTML.
   CORRECT: <div class='my-box'> or <a href='https://...'>
   WRONG: <div class="my-box"> or <a href="https://...">
2. Respond ONLY with valid JSON — no markdown code blocks, no preamble, no explanation.
================================================================================

{
  "title": "SEO-optimized title — ≤60 characters — PRIMARY KEYWORD FIRST + year + key info",
  "metaDesc": "150-160 chars exactly — MUST start with primary keyword + year. Key facts in middle. End with action CTA like 'Direct Link Here' or 'Check Now at Rojgar Suvidha'. NEVER start with 'Looking for'.",
  "primaryKeyword": "main keyword phrase (e.g. 'SSC MTS Result 2026')",
  "tag": "short display tag (e.g. 'Railway Jobs' / 'SSC Result' / 'Admit Card')",
  "category": "${category}",
  "lastDate": "extracted last date string or null",
  "totalPosts": "extracted vacancy number (digits only) or null",
  "appFeeGen": "fee for General/OBC extracted from source e.g. '100' or null",
  "appFeeRes": "fee for SC/ST extracted from source e.g. '0' or null",
  "officialLink": "official .gov/.nic website URL or null",
  "links": "${applyStatus === "open" && applyLink ? applyLink : "null"}",
  "shortInfo": "2-sentence engaging summary — includes: post name, total vacancies (if known), last date (if known), and a reason to apply/check",
  "important_dates": "stringified JSON object of date events like {\"Application Start\": \"01 Aug 2026\", \"Last Date\": \"31 Aug 2026\"} or null",
  "form_documents": "Extract from source — list of documents needed for THIS specific post. Use post-appropriate list (not generic 8-item boilerplate).",
  "form_fees_structure": "Extract from source ONLY. Format: [{\"postName\": \"General/OBC/EWS\", \"fees\": {\"genFee\": \"100\", \"scFee\": \"0\", \"serviceCharge\": \"0\"}}]. If fee not in source: null",
  "blogHtml": "COMPLETE HTML blog — DO NOT truncate — follow category blueprint exactly — MINIMUM word targets must be met — ZERO emojis — NO <h1> tags"
}`;


    const rawKeys = process.env.GEMINI_API_KEYS || process.env.GEMINI_API_KEY || "";
  const apiKeys = rawKeys.split(",").map((k) => k.trim()).filter(Boolean);
  if (apiKeys.length === 0) throw new Error("GEMINI_API_KEY missing");


  const models = [
    // ── VERIFIED working models (August 2026) — in order of preference ──
    "gemini-2.5-flash",                     // Best quality, fast — primary
    "gemini-2.0-flash",                     // Stable fallback (high RPD quota)
    "gemini-2.0-flash-lite",                // Fast fallback
    "gemini-2.5-flash-lite-preview-06-17", // Lighter flash variant
    "gemini-1.5-flash",                     // Reliable older model
    "gemini-1.5-flash-8b",                  // Smallest, last resort
  ];

  let lastError = "";

  // Track globally unavailable models (deprecated/not-found) — skip across ALL keys
  const permanentlyFailedModels = new Set<string>();

  for (const apiKey of apiKeys) {
    for (const model of models) {
      // Skip models that are permanently unavailable (checked on a previous key)
      if (permanentlyFailedModels.has(model)) {
        console.warn(`   ⏭️ Skipping ${model} — permanently unavailable`);
        continue;
      }

      // ── Per-model: up to 3 attempts with exponential backoff (handles 503 overloaded) ──
      let modelAttempt = 0;
      const maxModelAttempts = 3;
      while (modelAttempt < maxModelAttempts) {
        modelAttempt++;
        try {
        const payload = {
          contents: [{
            role: "user",
            parts: [{ text: `${SYSTEM_PROMPT}\n\n===== REFERENCE DATA (READ FACTS — WRITE ORIGINAL) =====\n${enrichedContext}` }],
          }],
          generationConfig: {
            temperature: 0.75,
            maxOutputTokens: 8192, // 8192 is reliable — avoids truncation timeouts
            responseMimeType: "application/json",
          },
        };

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 90000); // 90s timeout
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
          { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload), signal: controller.signal }
        );
        clearTimeout(timeout);

        const data = await response.json();
        if (data.error) {
          const errMsg = data.error.message || JSON.stringify(data.error);
          lastError = `${model}: ${errMsg}`;

          // ── Permanently unavailable model (deprecated, removed, not available) ──
          if (/no longer available|not available|deprecated|model.*not.*found|does not exist/i.test(errMsg)) {
            console.warn(`   🚫 Model ${model} is permanently unavailable — skipping for all keys`);
            permanentlyFailedModels.add(model);
            break; // break while loop → continue to next model
          }

          // ── Quota / Rate-limit error → switch to next API key ──
          if (/quota|rate.?limit|429|resource.?exhausted|you exceeded|too many/i.test(errMsg)) {
            console.warn(`   ⛔ Quota exceeded on key ...${apiKey.slice(-4)} — switching to next API key`);
            modelAttempt = maxModelAttempts; // exhaust model attempts
            break; // will trigger outer break below
          }

          // ── Overloaded / 503 / Internal error → retry with backoff ──
          if (/overloaded|503|internal|unavailable|server error/i.test(errMsg) || response.status === 503) {
            const backoff = modelAttempt * 5000; // 5s, 10s, 15s
            console.warn(`   ⏳ Model ${model} overloaded (attempt ${modelAttempt}/${maxModelAttempts}), retrying in ${backoff/1000}s...`);
            await new Promise((r) => setTimeout(r, backoff));
            continue; // retry same model
          }

          // ── Other errors → try next model immediately ──
          console.warn(`   ⚠️ Model ${model} error (${errMsg.slice(0, 80)}), trying next model...`);
          break;
        }

        // ── Check quota flag from while-loop ──
        if (modelAttempt >= maxModelAttempts && !data.candidates) break;

        const rawJson = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
        if (!rawJson) { lastError = `${model}: empty response`; break; }

        let parsed: any;
        try {
          const cleanedJson = rawJson.replace(/^```json?\s*/i, "").replace(/```\s*$/i, "").trim();
          parsed = JSON.parse(cleanedJson);
        } catch (parseErr: any) {
          console.warn(`   ⚠️ JSON parse error on ${model}, attempting auto-repair:`, parseErr.message);
          try {
            let repaired = rawJson
              .replace(/^```json?\s*/i, "")
              .replace(/```\s*$/i, "")
              .replace(/\r\n/g, "\\n")
              .replace(/\n/g, "\\n")
              .replace(/\r/g, "\\r")
              .replace(/\t/g, "\\t")
              .trim();

            const quoteCount = (repaired.match(/(?<!\\)"/g) || []).length;
            if (quoteCount % 2 !== 0) repaired += '"';
            const openBraces = (repaired.match(/\{/g) || []).length;
            const closeBraces = (repaired.match(/\}/g) || []).length;
            for (let i = 0; i < openBraces - closeBraces; i++) repaired += "}";
            parsed = JSON.parse(repaired);
          } catch (e2: any) {
            console.warn(`   ⚠️ Advanced JSON repair failed on ${model}, using regex field extractor...`);
            const titleMatch = rawJson.match(/"title"\s*:\s*"([^"]+)"/);
            const metaMatch = rawText.match(/"metaDesc"\s*:\s*"([^"]+)"/);
            const htmlMatch = rawJson.match(/"blogHtml"\s*:\s*"([\s\S]+)"\s*\}\s*$/);

            if (titleMatch?.[1]) {
              parsed = {
                title: titleMatch[1],
                metaDesc: metaMatch ? metaMatch[1] : "",
                blogHtml: htmlMatch ? htmlMatch[1] : rawJson,
                category,
              };
            } else {
              lastError = `${model}: JSON parse failed: ${parseErr.message}`;
              break;
            }
          }
        }

        // ── Content validation ──
        const wordCount = (parsed.blogHtml || "").replace(/<[^>]+>/g, " ").split(/\s+/).filter(Boolean).length;
        if (wordCount < 500) {
          lastError = `${model}: Blog too short (${wordCount} words)`; break;
        }
        if (!parsed.title) { lastError = `${model}: No title generated`; break; }

        console.log(`   ✅ Generated via ${model} (attempt ${modelAttempt}): ${wordCount} words, title="${parsed.title}"`);
        return parsed;

      } catch (e: any) {
        if (e.name === "AbortError") {
          console.warn(`   ⏰ Model ${model} timed out (attempt ${modelAttempt}/${maxModelAttempts})`);
          lastError = `${model}: timeout`;
          if (modelAttempt < maxModelAttempts) {
            await new Promise((r) => setTimeout(r, 3000));
            continue; // retry on timeout
          }
        } else {
          lastError = `${model}: ${e.message}`;
        }
        break;
      }
      } // end while(modelAttempt)

      // ── Quota exhausted on this key (all models) — switch key ──
      if (/quota|rate.?limit|429|resource.?exhausted|you exceeded|too many/i.test(lastError)) {
        break; // break model loop → outer key loop tries next key
      }
    } // end for (model of models)
  } // end for (apiKey of apiKeys)

  // ══════════════════════════════════════════════════════════════════════════
  // GROQ FALLBACK — Activates when ALL Gemini keys + models are exhausted
  // Uses: llama-3.3-70b (best) → llama-3.1-8b (fast) → mixtral-8x7b (last)
  // Free tier: 6000 RPD on llama-3.3-70b — more than enough for daily cron
  // ══════════════════════════════════════════════════════════════════════════
  const groqApiKey = process.env.GROQ_API_KEY;
  if (groqApiKey && !groqApiKey.includes("REPLACE")) {
    console.warn("⚠️  All Gemini API keys exhausted. Switching to Groq fallback...");

    const groqModels = [
      // ── VERIFIED ACTIVE Groq models (August 2026) — live tested ──
      // Groq decommissioned: llama-3.x, mixtral, gemma2 (all gone)
      "openai/gpt-oss-120b",     // 120B model — best quality on Groq right now
      "openai/gpt-oss-20b",      // 20B — fast, reliable fallback
      "qwen/qwen3.6-27b",        // Qwen 27B — good fallback (has <think> tags, handled below)
    ];

    for (const groqModel of groqModels) {
      try {
        console.log(`   🟣 Trying Groq/${groqModel}...`);

        const groqPayload = {
          model: groqModel,
          messages: [
            {
              role: "user",
              content: `${SYSTEM_PROMPT}\n\n===== REFERENCE DATA (READ FACTS — WRITE ORIGINAL) =====\n${enrichedContext}`,
            },
          ],
          temperature: 0.75,
          max_tokens: 8192,
          response_format: { type: "json_object" },
        };

        const groqController = new AbortController();
        const groqTimeout = setTimeout(() => groqController.abort(), 90000); // 90s

        const groqResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${groqApiKey}`,
          },
          body: JSON.stringify(groqPayload),
          signal: groqController.signal,
        });
        clearTimeout(groqTimeout);

        const groqData = await groqResponse.json();

        // ── Error handling ──
        if (groqData.error) {
          const groqErrMsg = groqData.error.message || JSON.stringify(groqData.error);
          console.warn(`   ⚠️ Groq/${groqModel} error: ${groqErrMsg.slice(0, 120)}`);
          lastError = `groq/${groqModel}: ${groqErrMsg}`;

          // Decommissioned / deprecated model — skip immediately, no retry
          if (/decommissioned|no longer supported|deprecated|not supported/i.test(groqErrMsg)) {
            console.warn(`   🚫 Groq/${groqModel} permanently decommissioned — skipping`);
            continue;
          }
          // Rate limit on this model → try next
          if (/rate.?limit|429|quota|too many/i.test(groqErrMsg)) {
            console.warn(`   ⛔ Groq rate limit on ${groqModel} — trying next Groq model`);
          }
          continue;
        }

        const groqRawJson = groqData.choices?.[0]?.message?.content || "";
        if (!groqRawJson) {
          lastError = `groq/${groqModel}: empty response`;
          console.warn(`   ⚠️ Groq/${groqModel}: empty response`);
          continue;
        }

        // ── Parse JSON ──
        let groqParsed: any;
        try {
          const groqCleaned = groqRawJson
            .replace(/<think>[\s\S]*?<\/think>/gi, "")  // Strip Qwen <think> reasoning blocks
            .replace(/^```json?\s*/i, "")
            .replace(/```\s*$/i, "")
            .trim();
          groqParsed = JSON.parse(groqCleaned);
        } catch (groqParseErr: any) {
          console.warn(`   ⚠️ Groq/${groqModel} JSON parse error: ${groqParseErr.message} — trying next model`);
          lastError = `groq/${groqModel}: JSON parse failed`;
          continue;
        }

        // ── Validate content ──
        const groqWordCount = (groqParsed.blogHtml || "")
          .replace(/<[^>]+>/g, " ")
          .split(/\s+/)
          .filter(Boolean).length;

        if (groqWordCount < 500) {
          console.warn(`   ⚠️ Groq/${groqModel}: Blog too short (${groqWordCount} words) — trying next model`);
          lastError = `groq/${groqModel}: Blog too short (${groqWordCount} words)`;
          continue;
        }

        if (!groqParsed.title) {
          console.warn(`   ⚠️ Groq/${groqModel}: No title in response — trying next model`);
          lastError = `groq/${groqModel}: No title generated`;
          continue;
        }

        console.log(
          `   ✅ Generated via Groq/${groqModel}: ${groqWordCount} words, title="${groqParsed.title}"`
        );
        return groqParsed;

      } catch (groqErr: any) {
        if (groqErr.name === "AbortError") {
          console.warn(`   ⏰ Groq/${groqModel} timed out — trying next model`);
          lastError = `groq/${groqModel}: timeout`;
        } else {
          console.warn(`   ❌ Groq/${groqModel} exception: ${groqErr.message}`);
          lastError = `groq/${groqModel}: ${groqErr.message}`;
        }
        continue;
      }
    } // end for (groqModel of groqModels)

    console.error("❌ Groq fallback also exhausted all models.");
  } else {
    console.warn("⚠️  GROQ_API_KEY not configured — no fallback available.");
  }

  throw new Error(`All Gemini models failed. Groq fallback also failed. Last error: ${lastError}`);
}

// ── Telegram Notification ─────────────────────────────────────────────────────
async function sendTelegramNotification(draft: {
  source_title: string;
  category: string;
  apply_status: string;
  last_date: string | null;
  total_posts: string | null;
  apply_link?: string | null;
}, draftId: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId || token.includes("REPLACE") || chatId.includes("REPLACE")) {
    console.warn("⚠️ Telegram not configured — skipping notification");
    return;
  }

  const statusEmoji =
    draft.apply_status === "open" ? "🟢 Apply LIVE" :
    draft.apply_status === "coming_soon" ? "🟡 Coming Soon" :
    draft.apply_status === "closed" ? "🔴 Closed" : "⚪ Unknown";

  const reviewUrl = `${BASE_URL}/admin/auto-drafts/${draftId}`;
  const categoryLabel = {
    "latest-jobs": "💼 Latest Jobs",
    "results": "🏆 Result",
    "admit-card": "🪪 Admit Card",
    "answer-key": "📋 Answer Key",
    "admission": "🎓 Admission",
    "news": "📰 News",
  }[draft.category] || draft.category;

  const lines = [
    `🆕 *New Blog Draft Ready!*`,
    ``,
    `📌 *${(draft.source_title || "New Post").slice(0, 80)}*`,
    ``,
    `${categoryLabel}`,
    `🔗 ${statusEmoji}`,
    draft.total_posts ? `👥 Vacancies: *${draft.total_posts}*` : "",
    draft.last_date ? `📅 Last Date: *${draft.last_date}*` : "",
    ``,
    `✏️ Review & Publish:`,
    reviewUrl,
    ``,
    `_Auto-scraped from FreeJobAlert.com — Please review before publishing_`,
  ].filter((l) => l !== undefined && l !== null);

  try {
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: lines.join("\n"),
        parse_mode: "Markdown",
        disable_web_page_preview: true,
      }),
    });
    console.log("   📱 Telegram notification sent");
  } catch (e: any) {
    console.warn("   ⚠️ Telegram send failed:", e.message);
  }
}

// ── Slug Generator ────────────────────────────────────────────────────────────
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim()
    .slice(0, 80);
}

// ── MAIN RUNNER ───────────────────────────────────────────────────────────────
export async function runAutoBlogScraper(): Promise<ScraperResult> {
  console.log("\n🚀 Auto Blog Scraper v2 started:", new Date().toISOString());
  const supabase = getSupabaseAdmin();
  const results: ScraperResult = { processed: 0, skipped: 0, errors: [] };

  // 1. Fetch RSS & NDTV Education News
  let rssItems: { title: string; link: string; pubDate: string; description: string; feedCategory: string }[] = [];
  try {
    rssItems = await fetchRSSItems();
  } catch (err: any) {
    console.warn("⚠️ RSS Error:", err.message);
  }

  const ndtvItems = await fetchNDTVEducationNews();

  const allCandidateItems: { title: string; link: string; pubDate: string; description: string; source: string; feedCategory: string }[] = [
    ...rssItems.map((item) => ({ ...item, source: "freejobalert" })),
    ...ndtvItems.map((item) => ({ ...item, source: "ndtv", feedCategory: "news" })),
  ];

  if (allCandidateItems.length === 0) {
    return { ...results, errors: ["No candidate items fetched from any source"] };
  }

  // 2. Get already-scraped URLs
  const { data: scrapedLog } = await supabase.from("scraped_urls_log").select("url");
  const scrapedUrls = new Set((scrapedLog || []).map((r: any) => r.url));

  // 3. Process 1 recruitment post (FreeJobAlert) AND 1 news story (NDTV Education) per cron execution (Quota & Rate Limit Safe)
  const freeJobAlertNew = allCandidateItems.filter((i) => i.source === "freejobalert" && !scrapedUrls.has(i.link)).slice(0, 1);
  const ndtvNew = allCandidateItems.filter((i) => i.source === "ndtv" && !scrapedUrls.has(i.link)).slice(0, 1);

  const newItems = [...freeJobAlertNew, ...ndtvNew];
  console.log(`🆕 New items to process: ${newItems.length} (${freeJobAlertNew.length} jobs, ${ndtvNew.length} news) of ${allCandidateItems.length} candidate items`);

  if (newItems.length === 0) {
    results.skipped = allCandidateItems.length;
    console.log("✨ All caught up — no new posts");
    return results;
  }

  for (const item of newItems) {
    console.log(`\n📰 [${newItems.indexOf(item) + 1}/${newItems.length}] Processing (${item.source}): ${item.title}`);

    try {
      // 4. Full page deep read
      const { text: pageText, links } = await fetchFullPage(item.link);
      console.log(`   📄 Page extracted: ${pageText.split(" ").length} words, ${links.length} links`);

      // 5. Smart category detection — title-first logic for ALL sources
      // NDTV: apply real detection; only cap "latest-jobs" → "news" (NDTV has no apply forms)
      // FreeJobAlert category feeds: detection is pre-validated by feed URL
      let category: BlogCategory = detectCategory(item.title, pageText);

      if (item.source === "ndtv") {
        // NDTV articles don't have application forms — cap at news level
        if (category === "latest-jobs") category = "news";
        // But NDTV can correctly be: results, admit-card, answer-key, admission, news
      } else {
        // FreeJobAlert: if category feed is known, trust it over detection
        if (item.feedCategory && item.feedCategory !== "latest-jobs") {
          // Feed category is highly reliable (e.g., /result/feed/ → always results)
          category = item.feedCategory as BlogCategory;
        }
        // FreeJobAlert never has pure "news" — convert to latest-jobs as safety
        if (category === "news") category = "latest-jobs";
      }

      const stateCode = item.source === "ndtv" ? null : detectStateCode(item.title, pageText);
      const { status: applyStatus, link: applyLink } = item.source === "ndtv" ? { status: "unknown" as ApplyStatus, link: null } : detectApplyStatus(pageText, links);
      const { lastDate, totalPosts, appFeeGen, appFeeRes, officialLink, notificationLink, ageLimit, education } =
        item.source === "ndtv"
          ? { lastDate: null, totalPosts: null, appFeeGen: null, appFeeRes: null, officialLink: item.link, notificationLink: null, ageLimit: null, education: null }
          : extractPageData(pageText, links);

      console.log(`   📊 Category: ${category} | State: ${stateCode || "ALL (Central)"} | Apply: ${applyStatus} | Posts: ${totalPosts} | LastDate: ${lastDate}`);

      // 6. Generate blog with Gemini
      console.log(`   🤖 Calling Gemini AI...`);
      const aiResult = await generateBlogDraft({
        rawText: pageText,
        category,
        applyStatus,
        applyLink,
        officialLink,
        lastDate,
        totalPosts,
        appFeeGen,
        appFeeRes,
        ageLimit,
        education,
        sourceTitle: item.title,
      });

      // 7. Validate blog quality BEFORE saving — reject bad AI output immediately
      const blogHtmlFinal = stripH1FromBlog(cleanCompetitorBrands(aiResult.blogHtml || ""));
      const qualityCheck = validateBlogQuality(blogHtmlFinal, category, pageText);

      if (!qualityCheck.valid) {
        console.warn(`⚠️ [Quality] REJECTED: "${item.title.slice(0, 60)}"`);
        qualityCheck.issues.forEach(issue => console.warn(`   ❌ ${issue}`));
        console.warn(`   → Skipping. URL logged so it won't retry with same broken source.`);
        await supabase.from("scraped_urls_log").upsert(
          [{ url: item.link, reason: `quality_fail: ${qualityCheck.issues[0]}` }],
          { onConflict: "url" }
        );
        results.errors.push(`Quality rejected: ${item.title.slice(0, 50)} — ${qualityCheck.issues.join(" | ")}`);
        continue;
      }
      const finalWordCount = blogHtmlFinal.replace(/<[^>]+>/g, " ").split(/\s+/).filter(Boolean).length;
      console.log(`✅ [Quality] Validated: ${finalWordCount} words | category=${category}`);

      // 8. Generate unique slug & dynamic banner URL

      const baseSlug = generateSlug(aiResult.title || item.title);
      const slug = await getUniqueSlug(baseSlug, supabase);
      const bannerTitle = cleanCompetitorBrands(aiResult.title || item.title);
      const autoBannerUrl = `${BASE_URL}/api/og/banner?title=${encodeURIComponent(bannerTitle)}&category=${encodeURIComponent(aiResult.category || category)}&posts=${encodeURIComponent(aiResult.totalPosts || totalPosts || "")}&lastDate=${encodeURIComponent(aiResult.lastDate || lastDate || "")}&state=${encodeURIComponent(stateCode || "")}`;

      // 8. Save draft to Supabase
      const draftPayload: any = {
        source_url: item.link,
        source_title: item.title,
        source_site: item.source,
        apply_link: applyLink,
        apply_status: applyStatus,
        official_link: aiResult.officialLink || officialLink,
        notification_link: notificationLink || null,
        state_code: stateCode || null,
        banner_url: autoBannerUrl,
        last_date: aiResult.lastDate || lastDate,
        total_posts: aiResult.totalPosts || totalPosts,
        app_fee_gen: aiResult.appFeeGen || appFeeGen,
        app_fee_res: aiResult.appFeeRes || appFeeRes,
        category: aiResult.category || category,
        generated_title: cleanCompetitorBrands(aiResult.title || item.title),
        generated_meta: cleanCompetitorBrands(aiResult.metaDesc || ""),
        generated_slug: slug,
        generated_html: blogHtmlFinal, // already cleaned (stripH1 + cleanBrands) and validated above
        generated_tags: aiResult.tag ? [cleanCompetitorBrands(aiResult.tag)] : [],
        primary_keyword: cleanCompetitorBrands(aiResult.primaryKeyword || ""),
        short_description: cleanCompetitorBrands(aiResult.shortInfo || ""),
        important_dates: typeof aiResult.important_dates === "string" ? aiResult.important_dates : JSON.stringify(aiResult.important_dates || null),
        // ✅ FIX: form_documents ab apne top-level columns mein store hoga (extracted_text JSON mein nahi)
        form_documents: Array.isArray(aiResult.form_documents) ? aiResult.form_documents : null,
        form_fees_structure: aiResult.form_fees_structure ? JSON.stringify(aiResult.form_fees_structure) : null,
        extracted_text: JSON.stringify({
          // Store structured data for Apply For Me form auto-creation
          raw_preview: pageText.slice(0, 1500),
          form_documents: aiResult.form_documents || null,
          form_fees_structure: aiResult.form_fees_structure || null,
        }),
        status: "pending_review",
      };

      let inserted: any = null;
      let { data, error: insertError } = await supabase
        .from("auto_blog_drafts")
        .insert([draftPayload])
        .select("id")
        .single();

      if (insertError) {
        // ✅ FIX: Graceful fallback — optional/new columns hata ke retry karo
        console.warn(`   ⚠️ Insert error: ${insertError.message} — retrying without optional columns...`);
        const fallbackPayload = { ...draftPayload };
        delete fallbackPayload.important_dates;
        delete fallbackPayload.notification_link;
        delete fallbackPayload.state_code;
        delete fallbackPayload.banner_url;
        delete fallbackPayload.form_documents;       // ✅ Sahi column name
        delete fallbackPayload.form_fees_structure;  // ✅ Sahi column name
        const retry = await supabase
          .from("auto_blog_drafts")
          .insert([fallbackPayload])
          .select("id")
          .single();
        data = retry.data;
        insertError = retry.error;
      }

      if (insertError) throw new Error(`Supabase insert: ${insertError.message}`);
      inserted = data;
      console.log(`   ✅ Draft saved: ID = ${inserted.id}`);

      // 9. Log scraped URL (prevent duplicate)
      try {
        await supabase.from("scraped_urls_log").upsert([{ url: item.link }], { onConflict: "url" });
      } catch (_) { /* silent */ }

      // 10. Private Telegram approval notification to Admin (with 1-click Approve button)
      if (inserted?.id) {
        sendAdminDraftApprovalAlert({
          id: inserted.id,
          title: cleanCompetitorBrands(aiResult.title || item.title),
          category: aiResult.category || category,
          stateCode: stateCode || null,
          totalPosts: aiResult.totalPosts || totalPosts || null,
          lastDate: aiResult.lastDate || lastDate || null,
          bannerUrl: autoBannerUrl,
        }).catch((e) => console.warn("Admin draft approval alert failed:", e));
      }

      results.processed++;

      // ⏱️ 5-second gap between items in single run (fast & rate limit safe)
      // Posts are naturally spaced out across 30-minute Vercel Cron intervals
      if (newItems.indexOf(item) < newItems.length - 1) {
        await sleep(5000);
      }

    } catch (err: any) {
      console.error(`   ❌ Failed: ${err.message}`);
      results.errors.push(`${item.title.slice(0, 60)}: ${err.message}`);

      // Send instant Telegram error alert to Admin's phone
      sendTelegramAdminErrorAlert(err.message, item.title, item.link).catch(() => {});

      // ✅ FIX: Smart URL skip logic — same URL kitni baar fail ho chuki hai check karo
      try {
        const { count: priorErrors } = await supabase
          .from("auto_blog_drafts")
          .select("*", { count: "exact", head: true })
          .eq("source_url", item.link)
          .eq("status", "error");

        const isPageFetchError = /fetch failed|HTTP 4[0-9]{2}|timeout|blocked/i.test(err.message);
        const shouldPermanentlySkip = isPageFetchError || (priorErrors !== null && priorErrors >= 2);

        if (shouldPermanentlySkip) {
          // 3rd failure ya page fetch error → permanently skip
          await supabase.from("scraped_urls_log").upsert([{ url: item.link }], { onConflict: "url" });
          console.log(`   ⛔ URL permanently skipped (${isPageFetchError ? "page fetch error" : `${(priorErrors ?? 0) + 1} failures`}): ${item.link.slice(0, 80)}`);
        } else {
          // 1st/2nd Gemini error → retry allowed on next cron run
          console.log(`   🔁 URL retry allowed (failure ${(priorErrors ?? 0) + 1}/3): ${item.link.slice(0, 80)}`);
        }
      } catch (_) { /* silent — log failure nahi rokna chahiye main flow ko */ }

      // Save error record for admin visibility
      try {
        await supabase.from("auto_blog_drafts").insert([{
          source_url: item.link,
          source_title: item.title,
          status: "error",
          error_message: err.message.slice(0, 500),
        }]);
      } catch (_) { /* silent */ }
    }
  }

  console.log(`\n📊 Scraper complete: ${results.processed} processed | ${results.skipped} skipped | ${results.errors.length} errors\n`);

  // Send Admin Summary Digest on Telegram
  try {
    const summaryText = `⏰ <b>ROJGAR SUVIDHA AUTO-SCRAPER RUN COMPLETE</b> ⏰\n\n` +
      `<b>📊 Total Candidates Scanned:</b> ${allCandidateItems.length}\n` +
      `<b>🆕 New Items Found & Processed:</b> ${newItems.length} (${freeJobAlertNew.length} Jobs, ${ndtvNew.length} News)\n` +
      `<b>✅ Drafts Generated Successfully:</b> ${results.processed}\n` +
      `<b>❌ Errors:</b> ${results.errors.length}\n\n` +
      `<i>All new draft approval buttons have been sent above to your Telegram. Tap Approve on any post to publish live instantly!</i>`;

    await sendTelegramAdminSummaryDigest(summaryText);
  } catch (e: any) {
    console.warn("⚠️ Summary digest notification failed:", e.message);
  }

  return results;
}
