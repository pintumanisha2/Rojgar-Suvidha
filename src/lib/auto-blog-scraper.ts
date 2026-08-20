/**
 * Auto Blog Scraper Library — v2.3 (Multi-Key Rotation Enabled)
 * FreeJobAlert → Full Page Deep Read → Gemini AI (SarkariLekhan) → Supabase → Telegram
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
const RSS_URLS = [
  // FreeJobAlert — main source (high DA, govt jobs specific)
  "https://www.freejobalert.com/feed/",
  "https://freejobalert.com/feed/",
  // Jagran Josh — India's highest DA education site (DA 78)
  "https://www.jagranjosh.com/articles/feed",
  // Careers360 — exam-focused, very reliable (DA 72)
  "https://news.careers360.com/rss",
  // India Today Education — high authority news (DA 83)
  "https://www.indiatoday.in/rss/home",
  // Hindustan Times Education — reliable Hindi newspaper (DA 80)
  "https://www.hindustantimes.com/feeds/rss/education/rssfeed.xml",
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

// ── Category Detection (improved with more patterns) ─────────────────────────
function detectCategory(title: string, content: string): BlogCategory {
  const text = (title + " " + content).toLowerCase();

  // Results first — most specific
  if (/\bresult\b|merit list|cut.?off|scorecard|marks obtained|selected candidates|final result/.test(text))
    return "results";

  // Admit card
  if (/admit card|hall ticket|call letter|e-admit|e admit/.test(text))
    return "admit-card";

  // Answer key
  if (/answer key|answer sheet|objection window|provisional answer/.test(text))
    return "answer-key";

  // Admission
  if (/\badmission\b|counseling|counselling|\bcuet\b|\bneet\b|\bjee\b|university|college admission|diploma admission/.test(text))
    return "admission";

  // News-type posts
  if (/age limit|syllabus change|exam postpone|exam cancel|new notification|official notice/.test(text) &&
    !/vacancy|recruitment|post/.test(text))
    return "news";

  return "latest-jobs";
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

// ── Parse RSS Feed (with fallback URLs) ──────────────────────────────────────
async function fetchRSSItems() {
  let lastErr = "";
  for (const rssUrl of RSS_URLS) {
    try {
      const res = await fetch(rssUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; RojgarSuvidhaBot/1.0; +https://www.rojgarsuvidha.com)",
          "Accept": "application/rss+xml, application/xml, text/xml, */*",
        },
        signal: AbortSignal.timeout(15000),
      });
      if (!res.ok) { lastErr = `HTTP ${res.status}`; continue; }
      const xml = await res.text();
      if (!xml.includes("<item>")) { lastErr = "No <item> tags found"; continue; }

      const items: { title: string; link: string; pubDate: string; description: string }[] = [];
      const itemRegex = /<item>([\s\S]*?)<\/item>/g;
      let match: RegExpExecArray | null;

      while ((match = itemRegex.exec(xml)) !== null) {
        const item = match[1];
        const title =
          item.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/)?.[1] ||
          item.match(/<title>(.*?)<\/title>/)?.[1] || "";
        const link =
          item.match(/<link>(.*?)<\/link>/)?.[1] ||
          item.match(/<guid[^>]*>(.*?)<\/guid>/)?.[1] || "";
        const pubDate = item.match(/<pubDate>(.*?)<\/pubDate>/)?.[1] || "";
        const description =
          item.match(/<description><!\[CDATA\[([\s\S]*?)\]\]><\/description>/)?.[1] ||
          item.match(/<description>([\s\S]*?)<\/description>/)?.[1] || "";

        if (title && link) {
          items.push({ title: title.trim(), link: link.trim(), pubDate: pubDate.trim(), description: description.trim() });
        }
      }
      console.log(`📡 RSS from ${rssUrl}: ${items.length} items`);
      return items;
    } catch (e: any) {
      lastErr = e.message;
    }
  }
  throw new Error(`All RSS URLs failed: ${lastErr}`);
}

// ── Fetch Full Page (deep content extraction) ─────────────────────────────────
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

  // Build apply section instruction based on status
  let applyInstruction = "";
  if (applyStatus === "coming_soon") {
    applyInstruction = `
⚠️ CRITICAL — APPLY STATUS IS "COMING SOON":
The apply link is NOT yet active. In the blog's How to Apply section (id='apply'), write:
<div style='background:#fef9c3;border-left:4px solid #d97706;padding:16px 20px;border-radius:8px;margin:1.5rem 0;'>
  <strong style='color:#b45309;'>⏳ Apply Online Link — Coming Soon!</strong>
  <p style='margin:8px 0 0;color:#1e293b;'>Online apply link abhi activate nahi hua hai. Jaise hi link active ho, hum is page ko turant update kar denge. Tab tak:</p>
  <ul><li>Official notification PDF download karo (link neeche diya hai)</li><li>Eligibility check karo</li><li>Documents ready rakho</li><li>Hamari website <strong>Rojgar Suvidha</strong> pe nazar rakho — hum instantly update karenge</li></ul>
</div>
DO NOT add any fake apply button.`;
  } else if (applyStatus === "open" && applyLink) {
    applyInstruction = `
✅ APPLY LINK IS LIVE: ${applyLink}
In the blog, add this as a prominent green button after the How to Apply steps:
<div style='text-align:center;margin:2rem 0;'>
  <a href='${applyLink}' target='_blank' rel='noopener noreferrer' style='display:inline-block;background:linear-gradient(135deg,#15803d,#16a34a);color:white;padding:16px 36px;border-radius:12px;font-size:1.1rem;font-weight:800;text-decoration:none;box-shadow:0 4px 15px rgba(21,128,61,0.3);'>
    🔗 Apply Online — Official Link
  </a>
  <p style='color:#64748b;font-size:0.85rem;margin-top:8px;'>Official portal link via Rojgar Suvidha — Safe & Verified</p>
</div>`;
  } else if (applyStatus === "closed") {
    applyInstruction = `NOTE: Application window is closed. Mention this clearly and suggest to watch for re-notification.`;
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

===== SANITIZED NOTIFICATION SOURCE CONTENT =====
${cleanedRawText}
=================================================`;

  // Build category-specific master writing blueprint
  let categoryBlueprint = "";
  if (category === "results") {
    categoryBlueprint = `
CATEGORY: SARKARI RESULT (Result / Merit List / Scorecard)
PERSONA: Senior Sarkari Exam Analyst who has tracked 1000+ government exam results

STRICTLY FORBIDDEN IN RESULT POSTS — DO NOT INCLUDE:
- Apply Online / Online Application section
- Application Fee table or fee information
- Last Date to Apply (irrelevant — exam already happened)
- "Apply Karein" or "Apply Now" CTA buttons
- Vacancy breakdown / Post-wise vacancy table
- Eligibility criteria / Age limit table
- How to Apply Online steps
- Salary or Pay Scale section

MANDATORY RESULT HTML SECTIONS (ONLY these 8 sections):
1. HERO HEADER: <h1> title + byline "By Rojgar Suvidha Result Desk | ${todayDate} | Sarkari Result Update"
2. RESULT STATUS BOX (green bordered div):
   ${applyLink
     ? `<div style='background:#f0fdf4;border:2px solid #22c55e;padding:20px;border-radius:12px;text-align:center;margin:1.5rem 0;'><h2 style='color:#15803d;margin:0 0 10px;font-size:1.3rem;font-weight:700;'>Result 2026 — Live Now</h2><p style='color:#334155;margin-bottom:15px;'>Apna Roll Number aur Date of Birth tayyar rakhein.</p><a href='${applyLink}' target='_blank' rel='noopener noreferrer' style='display:inline-block;background:#16a34a;color:white;padding:14px 32px;border-radius:10px;font-weight:800;text-decoration:none;font-size:1rem;'>Check Result — Direct Official Link</a></div>`
     : `<div style='background:#f0fdf4;border:2px solid #22c55e;padding:20px;border-radius:12px;text-align:center;margin:1.5rem 0;'><h2 style='color:#15803d;margin:0 0 10px;font-size:1.3rem;font-weight:700;'>Result 2026 — Direct Link</h2><p style='color:#d97706;font-weight:700;'>Direct Link activate hote hi yahan add kar diya jaayega.</p></div>`
   }
3. QUICK INFO TABLE: Organization | Post Name | Exam Date | Result Date | Official Website (with real clickable href link)
4. KEY HIGHLIGHTS: 3-4 bullet points — result status, shortlisted count (only if in source), next stage
5. HOW TO CHECK RESULT: Numbered steps (Visit official site > Click result link > Enter Roll No + DOB > Submit > Download Scorecard)
6. CUTOFF MARKS: Write ONLY IF actual numbers in source. If not: "Cutoff marks official website par release hone ke baad update kar diya jaayega."
7. WHAT NEXT AFTER RESULT: Next selection stage guide (DV / Tier 2 / Physical Test / Interview) — only stages relevant to this exam
8. FAQs: Minimum 5 questions specific to THIS result`;

  } else if (category === "admit-card") {
    categoryBlueprint = `
CATEGORY: ADMIT CARD / HALL TICKET
PERSONA: Exam Preparation Expert

STRICTLY FORBIDDEN IN ADMIT CARD POSTS — DO NOT INCLUDE:
- Application Fee table or fee information
- How to Apply Online section
- Vacancy breakdown / Post-wise vacancy
- Salary or Pay Scale
- Result date predictions
- Apply Now / Apply Online CTA buttons

MANDATORY ADMIT CARD HTML SECTIONS (ONLY these 8 sections):
1. HERO HEADER: <h1> title + byline "By Rojgar Suvidha Exam Desk | ${todayDate} | Admit Card Update"
2. ADMIT CARD DOWNLOAD BOX (orange bordered div):
   ${applyLink
     ? `<div style='background:#fff7ed;border:2px solid #f97316;padding:20px;border-radius:12px;text-align:center;margin:1.5rem 0;'><h2 style='color:#c2410c;margin:0 0 10px;font-size:1.3rem;font-weight:700;'>Download Official Admit Card</h2><a href='${applyLink}' target='_blank' rel='noopener noreferrer' style='display:inline-block;background:#ea580c;color:white;padding:14px 32px;border-radius:10px;font-weight:800;text-decoration:none;font-size:1rem;'>Download Admit Card — Official Link</a></div>`
     : `<div style='background:#fff7ed;border:2px solid #f97316;padding:20px;border-radius:12px;text-align:center;margin:1.5rem 0;'><h2 style='color:#c2410c;margin:0 0 10px;font-size:1.3rem;font-weight:700;'>Admit Card Download</h2><p style='color:#d97706;font-weight:700;'>Link activate hote hi yahan add kiya jaayega.</p></div>`
   }
3. EXAM SCHEDULE TABLE: Exam Name | Date | Shift | Reporting Time | Gate Closure | Mode (CBT/Offline)
4. HOW TO DOWNLOAD ADMIT CARD: Numbered steps (Visit site > Login > Click Admit Card > Download PDF > Print)
5. DOCUMENTS TO CARRY: Printed Admit Card | Photo ID (Aadhaar/PAN/Voter ID) | 2 Passport Photos | Pen
6. PROHIBITED ITEMS: Mobile / smartwatch / Bluetooth / wallet / belt — as a table or list
7. FORGOT LOGIN CREDENTIALS: Recovery guide for Application Number or Password
8. FAQs: Minimum 5 questions specific to THIS admit card`;

  } else if (category === "answer-key") {
    categoryBlueprint = `
CATEGORY: ANSWER KEY / RESPONSE SHEET
PERSONA: Exam Score Calculator Expert

STRICTLY FORBIDDEN IN ANSWER KEY POSTS — DO NOT INCLUDE:
- How to Apply Online section
- Application Fee information
- Vacancy details / Post-wise vacancy
- Salary or Pay Scale
- Admit Card download links

MANDATORY ANSWER KEY HTML SECTIONS (ONLY these 7 sections):
1. HERO HEADER: <h1> title + byline "By Rojgar Suvidha Exam Desk | ${todayDate} | Answer Key Update"
2. ANSWER KEY DOWNLOAD BOX (red bordered div):
   ${applyLink
     ? `<div style='background:#fef2f2;border:2px solid #ef4444;padding:20px;border-radius:12px;text-align:center;margin:1.5rem 0;'><h2 style='color:#b91c1c;margin:0 0 10px;font-size:1.3rem;font-weight:700;'>Download Official Answer Key</h2><a href='${applyLink}' target='_blank' rel='noopener noreferrer' style='display:inline-block;background:#dc2626;color:white;padding:14px 32px;border-radius:10px;font-weight:800;text-decoration:none;font-size:1rem;'>Download Answer Key — Direct Link</a></div>`
     : `<div style='background:#fef2f2;border:2px solid #ef4444;padding:20px;border-radius:12px;text-align:center;margin:1.5rem 0;'><h2 style='color:#b91c1c;margin:0 0 10px;font-size:1.3rem;font-weight:700;'>Answer Key Download</h2><p style='color:#d97706;font-weight:700;'>Answer Key upload hote hi link yahan add kar diya jaayega.</p></div>`
   }
3. QUICK INFO TABLE: Exam Name | Date | Shift | Answer Key Release Date | Objection Window | Fee per Question
4. HOW TO CALCULATE SCORE: Write ONLY if marking scheme in source. Formula: (Correct x Marks) - (Wrong x Negative). Skip if not in source.
5. HOW TO SUBMIT OBJECTION: Step-by-step + fee per question + proof requirement (only if objection window open)
6. RESPONSE SHEET DOWNLOAD GUIDE: How to access candidate response sheet
7. FAQs: Minimum 5 questions specific to THIS answer key`;

  } else if (category === "admission") {
    categoryBlueprint = `
CATEGORY: COLLEGE / UNIVERSITY ADMISSION & COUNSELING
PERSONA: Higher Education Counselor

STRICTLY FORBIDDEN IN ADMISSION POSTS — DO NOT INCLUDE:
- Government Job Apply section
- Government recruitment fee tables
- Result scorecard for competitive exams

MANDATORY ADMISSION HTML SECTIONS (ONLY these 8 sections):
1. HERO HEADER: <h1> title + byline "By Rojgar Suvidha Admission Desk | ${todayDate} | Admission Update"
2. ADMISSION REGISTRATION BOX:
   ${applyLink
     ? `<div style='background:#eff6ff;border:2px solid #3b82f6;padding:20px;border-radius:12px;text-align:center;margin:1.5rem 0;'><h2 style='color:#1d4ed8;margin:0 0 10px;font-size:1.3rem;font-weight:700;'>Online Admission / Counseling Registration</h2><a href='${applyLink}' target='_blank' rel='noopener noreferrer' style='display:inline-block;background:#2563eb;color:white;padding:14px 32px;border-radius:10px;font-weight:800;text-decoration:none;font-size:1rem;'>Register for Admission — Official Portal</a></div>`
     : `<div style='background:#eff6ff;border:2px solid #3b82f6;padding:20px;border-radius:12px;text-align:center;margin:1.5rem 0;'><h2 style='color:#1d4ed8;margin:0 0 10px;font-size:1.3rem;font-weight:700;'>Admission Registration</h2><p style='color:#d97706;font-weight:700;'>Registration link available nahi hai. Official website check karein.</p></div>`
   }
3. QUICK INFO TABLE: University | Course | Total Seats | Admission Mode | Last Date | Official Website
4. ELIGIBILITY: Minimum qualification (10th/12th/Graduation %) + Age limit if applicable
5. ADMISSION PROCESS: Selection criteria (Entrance/Merit/Interview) + Counseling schedule
6. FEE STRUCTURE: Course fee + Hostel charges (if in source) + Scholarship schemes
7. HOW TO APPLY: Numbered steps + document list
8. FAQs: Minimum 5 questions specific to THIS admission`;

  } else if (category === "news") {
    categoryBlueprint = `
CATEGORY: EDUCATION & GOVERNMENT JOB NEWS
PERSONA: Senior Education Journalist

STRICTLY FORBIDDEN IN NEWS POSTS — DO NOT INCLUDE:
- Apply Online / Application section
- Application Fee table
- Vacancy breakdown
- Salary / Pay Scale
- Admit Card download
- Result scorecard

MANDATORY NEWS HTML SECTIONS (ONLY these 6 sections):
1. HERO HEADER: <h1> title + byline "By Rojgar Suvidha News Desk | ${todayDate} | Education & Career Update"
2. KEY HIGHLIGHTS BOX:
   <div style='background:#f0fdf4;border-left:4px solid #16a34a;padding:16px 20px;border-radius:10px;margin-bottom:1.5rem;'><strong style='color:#15803d;font-size:1rem;'>Key Takeaways:</strong><ul style='margin:8px 0 0;padding-left:20px;color:#1e293b;'>...(3-4 bullets)...</ul></div>
3. FULL STORY: Complete factual reporting — what happened, who said it, official decision, timeline. No speculation.
4. IMPACT ANALYSIS: How this affects candidates — exam dates, preparation, counseling, form dates. Be specific.
5. ADVISORY BOX:
   <div style='background:#eff6ff;border-left:4px solid #3b82f6;padding:16px 20px;border-radius:10px;margin:1.5rem 0;'><strong style='color:#1d4ed8;'>Rojgar Suvidha Advisory:</strong><p style='color:#1e293b;margin-top:8px;'>Aise hi updates ke liye <a href='https://www.rojgarsuvidha.com' style='color:#2563eb;font-weight:600;text-decoration:underline;'>Rojgar Suvidha</a> bookmark karein.</p></div>
6. FAQs: Minimum 3 questions specific to THIS news`;

  } else {
    // Default: latest-jobs
    categoryBlueprint = `
CATEGORY: SARKARI JOB NOTIFICATION (Latest Government Jobs)
PERSONA: Government Job Analyst & Career Coach

STRICTLY FORBIDDEN IN JOB POSTS — DO NOT INCLUDE:
- Result / Scorecard / Merit List
- Admit Card download
- Answer Key section

MANDATORY JOB NOTIFICATION HTML SECTIONS (in this exact order):
1. HERO HEADER: <h1> title + byline "By Rojgar Suvidha Career Desk | ${todayDate} | Sarkari Naukri 2026"
2. QUICK SUMMARY BOX: Organization | Post Name | Total Vacancy | Last Date | Salary | Official Website (real clickable link)
3. INTRODUCTION (id='intro'): 2-3 paras — organization background, post info, opportunity — warm Hinglish
4. IMPORTANT DATES (id='dates'): Start Date | Last Date (RED bold) | Exam Date — only dates from source
5. VACANCY BREAKDOWN (id='vacancies'): Post-wise + Category-wise (UR/OBC/EWS/SC/ST/PwD) — only numbers from source
6. ELIGIBILITY (id='eligibility'): Education + Age limit + Relaxation table (OBC 3yr, SC/ST 5yr, PwD 10yr)
7. APPLICATION FEE (id='fee'): Category | Fee — only from source. If not mentioned: "Fee official notification mein confirm karein."
8. SALARY (id='salary'): Pay Level / Grade Pay / In-hand — only if in source
9. SELECTION PROCESS (id='selection'): Numbered steps (CBT > PET/PST > Document Verification > Medical)
10. HOW TO APPLY (id='apply'): Numbered steps + Apply button (if link) + Document checklist
11. OFFICIAL NOTIFICATION: Link to official PDF / website
12. FAQs (id='faq'): Minimum 7 questions specific to THIS job`;
  }

  // SYSTEM PROMPT — SarkariLekhan AI
  const SYSTEM_PROMPT = `You are "SarkariLekhan AI" — India's top Sarkari Naukri content expert writing for "Rojgar Suvidha". You have 10+ years of experience in government job notifications, exam analysis, and career guidance for Indian job seekers.

You follow Google's E-E-A-T guidelines strictly. Your goal: give candidates ACCURATE, COMPLETE, ACTIONABLE information they can trust.

Write in natural Hinglish (Hindi-English mix) — simple, clear language for Tier 2/3 city readers.

================================================================================
RULE 0 — ABSOLUTE EMOJI ZERO POLICY (HIGHEST PRIORITY RULE)
================================================================================
DO NOT USE ANY EMOJI CHARACTER ANYWHERE IN THE blogHtml OUTPUT.
This means: No emoji in headings, no emoji in buttons, no emoji in boxes, no emoji in FAQs, no emoji anywhere.

WRONG (do NOT do this):
  <h2>Result Live — Check Now</h2> with any emoji before or after
  <strong>Key Takeaways:</strong> with emoji
  <h3>FAQ Section</h3> with emoji
  <a>Download Answer Key</a> with emoji

CORRECT — plain text only, no emoji anywhere:
  <h2>Result Live — Check Now</h2>
  <strong>Key Takeaways:</strong>
  <h3>Frequently Asked Questions</h3>
  <a>Download Answer Key</a>

This rule overrides everything else. ZERO emojis. No exceptions.

================================================================================
RULE 1 — COMPETITOR BRAND PROTECTION
================================================================================
NEVER mention: FreeJobAlert, Free Job Alert, NDTV, NDTV Education, Sarkari Result .com, Govt Jobs India, or any competitor website.
ALWAYS use: "Rojgar Suvidha" as the brand name.

================================================================================
RULE 2 — DATA ACCURACY (DO NOT INVENT DATA)
================================================================================
Only write numbers, dates, and facts that are EXPLICITLY present in the source content provided.

CUTOFF MARKS: Write ONLY if actual cutoff data is in source. If not: write exactly this: "Cutoff marks official website par release hone ke baad yahan update kar diya jaayega."
VACANCY NUMBERS: Use only numbers from source. If not mentioned, do not guess.
EXAM DATES: Use only dates from source. Do not generate approximate or "expected" dates.
PDF LINKS: Only link to documents if URL is in source. Do not invent PDF URLs.
SALARY: Only write salary from source. If not mentioned: "Pay Scale official notification se confirm karein."

================================================================================
RULE 3 — LINK QUALITY (REAL LINKS ONLY)
================================================================================
Every blog MUST have at minimum:
A) 1 real official website link (e.g., <a href='https://ssc.nic.in' target='_blank' rel='noopener noreferrer' style='color:#2563eb;font-weight:600;text-decoration:underline;'>Official Website</a>)
B) 2-3 internal Rojgar Suvidha links — use ONLY these exact URLs:
   - <a href='https://www.rojgarsuvidha.com/results' style='color:#2563eb;font-weight:600;text-decoration:underline;'>Sarkari Result 2026</a>
   - <a href='https://www.rojgarsuvidha.com/admit-card' style='color:#2563eb;font-weight:600;text-decoration:underline;'>Admit Card 2026</a>
   - <a href='https://www.rojgarsuvidha.com/latest-jobs' style='color:#2563eb;font-weight:600;text-decoration:underline;'>Latest Sarkari Naukri</a>
   - <a href='https://www.rojgarsuvidha.com/answer-key' style='color:#2563eb;font-weight:600;text-decoration:underline;'>Answer Key 2026</a>
Place internal links naturally in sentences.

NEVER use: href="#" or href="javascript:void(0)" — these are broken links. If no real URL available, write plain text instead.

================================================================================
RULE 4 — CATEGORY ISOLATION (MOST IMPORTANT FOR ACCURACY)
================================================================================
This post is category: "${category}"
Read the CATEGORY BLUEPRINT below carefully.
Write ONLY the sections listed as MANDATORY for this category.
Do NOT add sections listed as FORBIDDEN for this category.
Category boundaries are strict — a Result post must NEVER have Apply Online.
A Job post must NEVER have Result/Scorecard content.

================================================================================
SEO RULES
================================================================================
- Mention "Rojgar Suvidha" 3-5 times naturally
- Use keywords: "Sarkari Result 2026", "Sarkari Naukri 2026", "Direct Link", "Official Website"
- Every section heading should be an <h2> or <h3> tag (not <div> with bold text)

================================================================================
MANDATORY E-E-A-T AUTHOR SECTION (add at END of blogHtml — copy verbatim)
================================================================================
<div style='border-top:2px solid #e2e8f0;margin-top:2.5rem;background:#f8fafc;border-radius:12px;padding:1.5rem;display:flex;gap:1rem;align-items:flex-start;'>
  <div style='flex-shrink:0;width:56px;height:56px;background:linear-gradient(135deg,#6366f1,#8b5cf6);border-radius:50%;display:flex;align-items:center;justify-content:center;color:white;font-size:1.5rem;font-weight:800;'>A</div>
  <div>
    <p style='margin:0 0 4px;font-weight:700;font-size:1rem;color:#0f172a;'>Arjun Sharma — Sarkari Naukri Expert</p>
    <p style='margin:0 0 8px;font-size:0.8rem;color:#64748b;'>B.Ed, MA Political Science | 10+ Years Sarkari Exam Analysis | Ex-UPSC Aspirant</p>
    <p style='margin:0;font-size:0.85rem;color:#475569;line-height:1.6;'>Arjun Sharma Rojgar Suvidha ke Senior Exam Analyst hain. Unhone 10+ saalon mein SSC, Railway, State PSC aur Banking exams ka detail analysis kiya hai. Unka kaam lakho aspirants ko accurate aur timely information deta hai.</p>
  </div>
</div>
<div style='margin-top:1rem;padding:12px 16px;background:#fef9c3;border-left:4px solid #eab308;border-radius:8px;font-size:0.82rem;color:#713f12;'>
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FAQ section mein ALWAYS use this schema-ready format:
<div itemscope itemtype='https://schema.org/FAQPage'>
  <div itemscope itemprop='mainEntity' itemtype='https://schema.org/Question'>
    <h3 itemprop='name' style='font-size:1rem;font-weight:700;color:#0f172a;cursor:pointer;'>❓ [Question here?]</h3>
    <div itemscope itemprop='acceptedAnswer' itemtype='https://schema.org/Answer'>
      <div itemprop='text' style='font-size:0.9rem;color:#334155;padding:8px 0;'>[Direct 1-2 sentence answer]</div>
    </div>
  </div>
</div>

${categoryBlueprint}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🚨 CRITICAL JSON SYNTAX RULE FOR HTML
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. Inside the "blogHtml" string value, ALWAYS use single quotes (') for ALL HTML attributes (e.g. <div class='my-box'> or <a href='https://...'>). NEVER use unescaped double quotes (") inside the HTML text.
2. Respond ONLY with valid JSON — no markdown, no code blocks, no preamble.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
{
  "title": "SEO title ≤60 chars — primary keyword FIRST + year + vacancy/update count",
  "metaDesc": "Exactly 150-160 chars — MUST start with primary keyword + year. End with strong CTA: 'Abhi Dekho', 'Direct Link Yahan Hai', 'Abhi Apply Karein'. NEVER leave empty.",
  "primaryKeyword": "main focus keyword phrase (e.g. 'SSC GD Constable 2026')",
  "tag": "short display tag (e.g. 'Railway Jobs', 'SSC Result', 'Admit Card')",
  "category": "${category}",
  "lastDate": "extracted last date string or null",
  "totalPosts": "extracted vacancy number (digits only) or null",
  "appFeeGen": "fee for General/OBC e.g. '₹100' or null",
  "appFeeRes": "fee for SC/ST e.g. 'Free' or '₹0' or null",
  "officialLink": "official .gov/.nic website URL or null",
  "links": "${applyStatus === "open" && applyLink ? applyLink : "null"}",
  "shortInfo": "2-sentence card summary — engaging, includes key facts",
  "important_dates": "stringified JSON of {key: date} pairs or null",
  "form_documents": ["10th Marksheet / DOB Proof", "Qualification Certificate", "Aadhaar Card", "Passport Size Photo", "Candidate Signature", "Caste Certificate (if applicable)", "Domicile Certificate (if applicable)", "Driving License / Typing / ITI Cert (if post-specific)"],
  "form_fees_structure": [
    {
      "postName": "General / OBC / EWS Candidates",
      "fees": { "genFee": "100", "scFee": "0", "serviceCharge": "99" }
    },
    {
      "postName": "SC / ST / PwD / Female Candidates",
      "fees": { "genFee": "0", "scFee": "0", "serviceCharge": "99" }
    }
  ],
  "blogHtml": "COMPLETE HTML blog MINIMUM 1800 words following category blueprint"
}`;

  const rawKeys = process.env.GEMINI_API_KEYS || process.env.GEMINI_API_KEY || "";
  const apiKeys = rawKeys.split(",").map((k) => k.trim()).filter(Boolean);
  if (apiKeys.length === 0) throw new Error("GEMINI_API_KEY missing");


  const models = [
    "gemini-3.6-flash",       // ✅ Latest — recommended replacement for gemini-2.5-flash
    "gemini-2.0-flash",       // ✅ Stable
    "gemini-2.0-flash-lite",  // ✅ Faster/lighter
    "gemini-1.5-flash",       // ✅ Fallback
    "gemini-1.5-flash-8b",    // ✅ Last resort
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

      try {
      const payload = {
        contents: [{
          role: "user",
          parts: [{ text: `${SYSTEM_PROMPT}\n\n===== SOURCE CONTENT TO PROCESS =====\n${enrichedContext}` }],
        }],
        generationConfig: {
          temperature: 0.82,
          maxOutputTokens: 16000, // Increased to 16k to prevent JSON truncation
          responseMimeType: "application/json",
        },
      };

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 55000);
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
        // Skip this model for ALL remaining API keys — no point trying them
        if (/no longer available|not available|deprecated|model.*not.*found|does not exist/i.test(errMsg)) {
          console.warn(`   🚫 Model ${model} is permanently unavailable — skipping for all keys`);
          permanentlyFailedModels.add(model);
          continue; // try next model in list
        }

        // ── Quota / Rate-limit error: break inner model loop for this key ──
        // All models on the same key share the same quota — no point trying them
        if (/quota|rate.?limit|429|resource.?exhausted|you exceeded|too many/i.test(errMsg)) {
          console.warn(`   ⛔ Quota exceeded on key ...${apiKey.slice(-4)} — switching to next API key`);
          break; // break inner model loop → outer key loop will try next key
        }

        console.warn(`   ⚠️ Model ${model} returned error (${errMsg.slice(0, 80)}), retrying next model in 3s...`);
        await new Promise((r) => setTimeout(r, 3000));
        continue;
      }
      const rawJson = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
      if (!rawJson) { lastError = `${model}: empty response`; continue; }

      let parsed: any;
      try {
        const cleanedJson = rawJson.replace(/^```json?\s*/i, "").replace(/```\s*$/i, "").trim();
        parsed = JSON.parse(cleanedJson);
      } catch (parseErr: any) {
        console.warn(`   ⚠️ JSON parse error on ${model}, attempting auto-repair:`, parseErr.message);
        try {
          // Escape unescaped newlines/tabs inside raw JSON string
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
            continue;
          }
        }
      }

      // ── Content validation ──
      const wordCount = (parsed.blogHtml || "").replace(/<[^>]+>/g, " ").split(/\s+/).filter(Boolean).length;
      if (wordCount < 500) {
        lastError = `${model}: Blog too short (${wordCount} words)`; continue;
      }
      if (!parsed.title) { lastError = `${model}: No title generated`; continue; }

      console.log(`   🤖 Generated via ${model}: ${wordCount} words, title="${parsed.title}"`);
      return parsed;

    } catch (e: any) {
      lastError = `${model}: ${e.message}`;
      continue;
    }
    }
  }
  throw new Error(`All Gemini models failed. Last error: ${lastError}`);
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
  let rssItems: Awaited<ReturnType<typeof fetchRSSItems>> = [];
  try {
    rssItems = await fetchRSSItems();
  } catch (err: any) {
    console.warn("⚠️ RSS Error:", err.message);
  }

  const ndtvItems = await fetchNDTVEducationNews();

  const allCandidateItems: { title: string; link: string; pubDate: string; description: string; source: string }[] = [
    ...rssItems.map((i) => ({ ...i, source: "freejobalert" })),
    ...ndtvItems.map((i) => ({ ...i, source: "ndtv" })),
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

      // 5. Smart analysis (FreeJobAlert is NEVER news; NDTV is ALWAYS news)
      let detectedCat = detectCategory(item.title, pageText);
      if (detectedCat === "news") detectedCat = "latest-jobs";
      const category: BlogCategory = item.source === "ndtv" ? "news" : detectedCat;
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

      // 7. Generate unique slug & dynamic banner URL
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
        generated_html: cleanCompetitorBrands(aiResult.blogHtml || ""),
        generated_tags: aiResult.tag ? [cleanCompetitorBrands(aiResult.tag)] : [],
        primary_keyword: cleanCompetitorBrands(aiResult.primaryKeyword || ""),
        short_description: cleanCompetitorBrands(aiResult.shortInfo || ""),
        important_dates: typeof aiResult.important_dates === "string" ? aiResult.important_dates : JSON.stringify(aiResult.important_dates || null),
        // ✅ FIX: form_documents ab apne top-level columns mein store hoga (extracted_text JSON mein nahi)
        form_documents: Array.isArray(aiResult.form_documents) ? aiResult.form_documents : null,
        form_fees_structure: aiResult.form_fees_structure ? JSON.stringify(aiResult.form_fees_structure) : null,
        extracted_text: pageText.slice(0, 2000), // Sirf raw source text
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

      // ⏱️ Delay between items (avoid rate limiting on FreeJobAlert)
      if (newItems.indexOf(item) < newItems.length - 1) {
        await sleep(3000);
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
