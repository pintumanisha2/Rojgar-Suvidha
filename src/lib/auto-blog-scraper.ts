/**
 * Auto Blog Scraper Library — v2 (Improved)
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
// FreeJobAlert.com is the correct URL — WordPress blog so /feed/ works
const RSS_URLS = [
  "https://www.freejobalert.com/feed/",
  "https://freejobalert.com/feed/",
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
  const rawText = workingHtml
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(?:p|div|tr|li|h[1-6])\s*>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ").replace(/&quot;/g, '"').replace(/&#8211;/g, "–")
    .replace(/&#8212;/g, "—").replace(/&#8217;/g, "'").replace(/&#8220;/g, '"')
    .replace(/\s{2,}/g, " ").replace(/\n{3,}/g, "\n\n").trim();

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
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🏆 CATEGORY BLUEPRINT: SARKARI RESULT SPECIALIST PERSONA
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
You are writing a Sarkari Result article. Candidates want to check their result FAST, know cutoff marks, and understand the next selection phase.
MANDATORY RESULT HTML SECTIONS:
① HERO HEADER: Title + Byline ("By Rojgar Suvidha Result Desk | ${todayDate} | Sarkari Result Update")
② 🚀 DIRECT RESULT DOWNLOAD BOX: Injects a green result box with direct scorecard download button:
   <div style='background:#f0fdf4;border:2px solid #22c55e;padding:20px;border-radius:12px;text-align:center;margin:1.5rem 0;'>
     <h3 style='color:#15803d;margin:0 0 10px;font-size:1.2rem;'>🎉 Sarkari Result 2026 Live — Check Scorecard</h3>
     <p style='color:#334155;margin-bottom:15px;'>Apna roll number aur date of birth tayyar rakhein aur neeche link se result download karein.</p>
     ${applyLink ? `<a href='${applyLink}' target='_blank' rel='noopener' style='display:inline-block;background:#16a34a;color:white;padding:14px 32px;border-radius:10px;font-weight:800;text-decoration:none;'>🏆 Click Here to Check Result ↗</a>` : `<span style='color:#d97706;font-weight:700;'>⏳ Result Link Activating Soon</span>`}
   </div>
③ QUICK RESULT INFO TABLE: Organization | Exam Name | Exam Date | Result Release Date | Official Website
④ 📌 KEY HIGHLIGHTS: 3-4 bullet points summarizing result status, total candidates qualified, and merit list status.
⑤ STEP-BY-STEP HOW TO CHECK RESULT ONLINE: Numbered steps (Go to official portal -> Click result link -> Enter Registration/Roll No -> View Scorecard).
⑥ OFFICIAL & EXPECTED CUTOFF MARKS TABLE: Category-wise cutoff table (UR / OBC / EWS / SC / ST / PwD).
⑦ MERIT LIST & ROLL NUMBER SEARCH GUIDE: How to search roll number in PDF merit list (Ctrl + F method).
⑧ WHAT NEXT AFTER RESULT?: Guide candidate on next stage (Tier 2 exam / Document Verification / Physical Test / Interview).
⑨ RESULT FAQs: Minimum 5 Q&As (Forgot roll number, scorecard discrepancy, revaluation rules).`;
  } else if (category === "admit-card") {
    categoryBlueprint = `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🪪 CATEGORY BLUEPRINT: ADMIT CARD & EXAM HALL INSTRUCTOR PERSONA
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
You are writing an Admit Card / Hall Ticket article. Candidates want the direct download link, shift timing, and exam hall rules.
MANDATORY ADMIT CARD HTML SECTIONS:
① HERO HEADER: Title + Byline ("By Rojgar Suvidha Exam Desk | ${todayDate} | Admit Card Update")
② 🪪 DIRECT ADMIT CARD DOWNLOAD BOX:
   <div style='background:#fff7ed;border:2px solid #f97316;padding:20px;border-radius:12px;text-align:center;margin:1.5rem 0;'>
     <h3 style='color:#c2410c;margin:0 0 10px;font-size:1.2rem;'>🪪 Download Official Admit Card / Hall Ticket</h3>
     ${applyLink ? `<a href='${applyLink}' target='_blank' rel='noopener' style='display:inline-block;background:#ea580c;color:white;padding:14px 32px;border-radius:10px;font-weight:800;text-decoration:none;'>📥 Download Admit Card Now ↗</a>` : `<span style='color:#d97706;font-weight:700;'>⏳ Admit Card Download Link Activating Soon</span>`}
   </div>
③ QUICK EXAM SCHEDULE TABLE: Exam Name | Exam Date | Shift Timings | Reporting Time | Gate Closure Time | Exam Mode (CBT/Offline)
④ STEP-BY-STEP HOW TO DOWNLOAD ADMIT CARD: Clear 1-to-N steps using Application Number & Password/DOB.
⑤ MANDATORY DOCUMENTS CHECKLIST TO CARRY: Printed Hall Ticket (Color) | Original Photo ID (Aadhaar/PAN/Voter ID) | 2 Passport Photos | Ballpoint Pen.
⑥ EXAM HALL GUIDELINES & PROHIBITED ITEMS: Banned items (mobile, smartwatch, Bluetooth, wallet, belt) & dress code.
⑦ FORGOT REGISTRATION NUMBER / PASSWORD RECOVERY: Step-by-step guide to recover login credentials online.
⑧ ADMIT CARD FAQs: Minimum 5 Q&As (Photo not clear on admit card, exam center change request, error in name).`;
  } else if (category === "answer-key") {
    categoryBlueprint = `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 CATEGORY BLUEPRINT: ANSWER KEY & SCORE CALCULATOR PERSONA
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
You are writing an Answer Key & Response Sheet article. Candidates want to check response sheet, calculate marks, and challenge wrong answers.
MANDATORY ANSWER KEY HTML SECTIONS:
① HERO HEADER: Title + Byline ("By Rojgar Suvidha Exam Desk | ${todayDate} | Answer Key Update")
② 📋 DIRECT RESPONSE SHEET LINK BOX:
   <div style='background:#fef2f2;border:2px solid #ef4444;padding:20px;border-radius:12px;text-align:center;margin:1.5rem 0;'>
     <h3 style='color:#b91c1c;margin:0 0 10px;font-size:1.2rem;'>📋 Download Answer Key & Candidate Response Sheet</h3>
     ${applyLink ? `<a href='${applyLink}' target='_blank' rel='noopener' style='display:inline-block;background:#dc2626;color:white;padding:14px 32px;border-radius:10px;font-weight:800;text-decoration:none;'>🔗 Download Answer Key & Key Challenge ↗</a>` : `<span style='color:#d97706;font-weight:700;'>⏳ Answer Key Link Releasing Soon</span>`}
   </div>
③ QUICK ANSWER KEY INFO TABLE: Exam Name | Shift | Answer Key Release Date | Objection Challenge Window | Fee per Question
④ HOW TO CALCULATE YOUR MARKS (SCORE FORMULA): Total Score = (Correct Answers × Marks per Question) - (Wrong Answers × Negative Marking).
⑤ HOW TO SUBMIT ONLINE OBJECTION / CHALLENGE: Step-by-step objection submission process + fee per question + proof attachment requirements.
⑥ EXPECTED CUTOFF MARKS TABLE: Category-wise score analysis based on answer key.
⑦ ANSWER KEY FAQs: Minimum 5 Q&As (Objection fee refund policy, final answer key release date, response sheet downloading error).`;
  } else if (category === "admission") {
    categoryBlueprint = `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎓 CATEGORY BLUEPRINT: UNIVERSITY ADMISSION & COUNSELING PERSONA
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
You are writing a College / University Admission & Counseling article. Students want course eligibility, fee structure, seat matrix, and counseling steps.
MANDATORY ADMISSION HTML SECTIONS:
① HERO HEADER: Title + Byline ("By Rojgar Suvidha Admission Desk | ${todayDate} | Admission Update")
② 🎓 DIRECT ADMISSION / COUNSELING REGISTRATION BOX
③ QUICK ADMISSION INFO TABLE: University/Institute | Course Name | Total Seats | Mode of Admission (Entrance/Merit) | Last Date
④ COURSE ELIGIBILITY & MINIMUM MARKS CRITERIA: Detailed 10th/12th/Graduation qualification requirements.
⑤ ENTRANCE EXAM PATTERN & SELECTION CRITERIA: Syllabus, marks breakdown, interview/group discussion weightage.
⑥ FEE STRUCTURE & HOSTEL / SCHOLARSHIP FACILITIES: Course fee, hostel charges, government scholarship schemes.
⑦ STEP-BY-STEP APPLICATION & COUNSELING REGISTRATION PROCESS: How to fill form online and upload certificates.
⑧ ADMISSION FAQs: Minimum 5 Q&As (Reservation quota, document verification checklist, seat withdrawal & fee refund rules).`;
  } else if (category === "news") {
    categoryBlueprint = `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📰 CATEGORY BLUEPRINT: SENIOR EDUCATION JOURNALIST PERSONA
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
You are writing an Education News & Policy update story.
MANDATORY NEWS HTML SECTIONS:
① HERO HEADER: Title + Byline ("By Rojgar Suvidha News Desk | ${todayDate} | Education News Update")
② 📌 MUKHYA BINDU (KEY HIGHLIGHTS BOX): Injects a green highlight box (<div style="background:#f0fdf4;border-left:4px solid #16a34a;padding:16px 20px;border-radius:10px;margin-bottom:1.5rem;"><strong style="color:#15803d;">📌 Key Takeaways / Mukhya Bindu:</strong><ul style="margin:8px 0 0;padding-left:20px;color:#1e293b;">...</ul></div>) with 3-4 bullet points summarizing the headline.
③ 📰 POORI KHABAR (FULL STORY): Detailed reporting on official press releases, board decisions, or re-exam announcements.
④ 🎓 CHHATRO & CANDIDATES PAR KYA ASAR PADEGA (IMPACT ANALYSIS): Practical explanation of how this news affects exam dates, cutoff scores, counseling, or preparation strategy.
⑤ 💡 ROJGAR SUVIDHA NEWS ADVISORY BOX: Injects a blue trust box linking candidates to verified Rojgar Suvidha updates.
⑥ ❓ FREQUENTLY ASKED QUESTIONS (FAQs): 2-3 schema-friendly Q&As addressing common candidate doubts.`;
  } else {
    // Default: latest-jobs
    categoryBlueprint = `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💼 CATEGORY BLUEPRINT: SARKARI JOB ANALYST & CAREER COACH PERSONA
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
You are writing a Sarkari Job Notification article. Candidates want eligibility, vacancy breakdown, salary, and how to apply.
MANDATORY JOB HTML SECTIONS:
① HERO HEADER: Title + Byline ("By Rojgar Suvidha Career Desk | ${todayDate} | Latest Sarkari Job")
② QUICK INFO TABLE: Organization, Post Name, Total Vacancy, Apply Mode, Last Date, Salary, Age Limit, Official Website
③ id="intro" INTRODUCTION: Warm candidate hook + vacancy count + key benefit
④ 💡 ROJGAR SUVIDHA EXPERT ADVISORY BOX
⑤ id="dates" IMPORTANT DATES TABLE: Application Start, Last Date (BOLD RED), Exam Date
⑥ id="vacancies" VACANCY BREAKDOWN TABLE: Post-wise & Category-wise (UR/OBC/SC/ST/EWS)
⑦ id="eligibility" ELIGIBILITY: Qualification + Age Limit & Relaxation Table (OBC 3yr, SC/ST 5yr, PwD 10yr)
⑧ id="salary" SALARY & PAY SCALE: Pay Level, In-hand estimate, Allowances
⑨ id="selection" SELECTION PROCESS: Numbered steps (CBT -> PET/PST -> DV -> Medical)
⑩ id="exam" EXAM PATTERN & SYLLABUS TABLE
⑪ id="apply" HOW TO APPLY STEP-BY-STEP (Number 1 to N + Green Apply Button / Yellow Coming Soon Box + Document Checklist)
⑫ id="fee" APPLICATION FEE TABLE
⑬ id="faq" FAQ SECTION: Minimum 7 Q&As in <details><summary> format`;
  }

  // This is the same SarkariLekhan AI persona from scan-notification/route.ts
  const SYSTEM_PROMPT = `You are "SarkariLekhan AI" (Arjun Sharma) — India's top expert Sarkari Naukri blog writer for "Rojgar Suvidha" with 10+ years of experience in government job notifications, exam analysis, recruitment patterns, and career guidance for Indian job seekers.

You strictly follow Google's E-E-A-T (Experience, Expertise, Authoritativeness, Trustworthiness) guidelines. Your goal: genuinely help job seekers with accurate, complete, actionable information.

Write in natural Hinglish (Hindi-English mix) accessible to class 10 to graduation level readers in Tier 2/3 cities.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🚨 STRICT BRAND PROTECTION & COMPETITOR SCRUBBING RULES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. NEVER mention "FreeJobAlert", "Free Job Alert", "NDTV", "NDTV Education", or any competitor brand anywhere in the title, meta description, short info, or HTML content.
2. ALWAYS use "Rojgar Suvidha" as the official publisher and portal brand name.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 HIGH RANKING SEO & AEO KEYWORD INJECTION RULES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Naturally weave high search-volume intent keywords across the post without keyword stuffing:
- Primary Brand Name: "Rojgar Suvidha" (mention 3-5 times naturally).
- High Search Intent Terms: "Sarkari Result", "Rojgar Result", "Sarkari Exam Update", "Sarkari Naukri 2026".

${categoryBlueprint}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
OUTPUT: Respond ONLY with valid JSON — no markdown, no code blocks, no preamble.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
{
  "title": "SEO title ≤60 chars — primary keyword FIRST + year + vacancy/update count",
  "metaDesc": "Exactly 150-160 chars — primary keyword + CTA like 'Abhi Apply Karein' or 'Puri Jankari Padhein'",
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

  const geminiApiKey = process.env.GEMINI_API_KEY;
  if (!geminiApiKey) throw new Error("GEMINI_API_KEY missing");

  const models = ["gemini-3.5-flash", "gemini-3.5-flash-lite", "gemini-3.6-flash", "gemini-3.7-flash", "gemini-flash-latest"];
  let lastError = "";

  for (const model of models) {
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
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiApiKey}`,
        { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload), signal: controller.signal }
      );
      clearTimeout(timeout);

      const data = await response.json();
      if (data.error) {
        lastError = `${model}: ${data.error.message || JSON.stringify(data.error)}`;
        console.warn(`   ⚠️ Model ${model} returned error, retrying next model in 3s...`);
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
        extracted_text: pageText.slice(0, 3000),
        category: aiResult.category || category,
        generated_title: cleanCompetitorBrands(aiResult.title || item.title),
        generated_meta: cleanCompetitorBrands(aiResult.metaDesc || ""),
        generated_slug: slug,
        generated_html: cleanCompetitorBrands(aiResult.blogHtml || ""),
        generated_tags: aiResult.tag ? [cleanCompetitorBrands(aiResult.tag)] : [],
        primary_keyword: cleanCompetitorBrands(aiResult.primaryKeyword || ""),
        short_description: cleanCompetitorBrands(aiResult.shortInfo || ""),
        important_dates: typeof aiResult.important_dates === "string" ? aiResult.important_dates : JSON.stringify(aiResult.important_dates || null),
        form_documents: Array.isArray(aiResult.form_documents) ? aiResult.form_documents : null,
        form_fees_structure: typeof aiResult.form_fees_structure === "string" ? aiResult.form_fees_structure : JSON.stringify(aiResult.form_fees_structure || null),
        status: "pending_review",
      };

      let inserted: any = null;
      let { data, error: insertError } = await supabase
        .from("auto_blog_drafts")
        .insert([draftPayload])
        .select("id")
        .single();

      if (insertError) {
        // Fallback if optional column not created yet in Supabase
        delete draftPayload.important_dates;
        delete draftPayload.notification_link;
        delete draftPayload.state_code;
        delete draftPayload.banner_url;
        delete draftPayload.form_documents;
        delete draftPayload.form_fees_structure;
        const retry = await supabase
          .from("auto_blog_drafts")
          .insert([draftPayload])
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

      // Mark as scraped to avoid infinite loop
      try {
        await supabase.from("scraped_urls_log").upsert([{ url: item.link }], { onConflict: "url" });
      } catch (_) { /* silent */ }

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
