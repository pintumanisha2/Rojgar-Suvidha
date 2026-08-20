/**
 * Auto Blog Scraper — FreeJobAlert → Gemini AI → Supabase → Telegram
 *
 * Flow:
 * 1. Fetch FreeJobAlert RSS feed
 * 2. Find new posts (not in scraped_urls_log)
 * 3. Full page read with Cheerio (extract apply link, dates, vacancy, fee)
 * 4. Call /api/auto-blog/generate (which reuses scan-notification AI pipeline)
 * 5. Save draft to Supabase auto_blog_drafts
 * 6. Send Telegram notification to admin
 *
 * Called by: /api/auto-blog/cron (Vercel Cron every 30 min)
 */

import { createClient } from "@supabase/supabase-js";

// ── Supabase ──────────────────────────────────────────────────────────────────
const supabase = createClient(
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// ── RSS Feed URL ──────────────────────────────────────────────────────────────
const RSS_URL = "https://www.freejobales.com/feed/";

// ── Telegram Config ───────────────────────────────────────────────────────────
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://www.rojgarsuvidha.com";

// ── Category Detection ────────────────────────────────────────────────────────
function detectCategory(title, content) {
  const text = (title + " " + content).toLowerCase();
  if (/\bresult\b|merit list|cut.?off|scorecard|marks obtained/.test(text))
    return "results";
  if (/admit card|hall ticket|call letter/.test(text)) return "admit-card";
  if (/answer key|objection window/.test(text)) return "answer-key";
  if (
    /\badmission\b|counseling|counselling|\bcuet\b|\bneet\b|\bjee\b|university/i.test(
      text
    )
  )
    return "admission";
  return "latest-jobs";
}

// ── Apply Link + Status Detection ─────────────────────────────────────────────
function detectApplyStatus(pageText, links) {
  const text = pageText.toLowerCase();

  // Check for coming soon patterns
  if (/coming\s*soon|will\s*be\s*available|not\s*yet\s*active|notify\s*soon/.test(text)) {
    return { status: "coming_soon", link: null };
  }

  // Look for apply links in the extracted links
  const applyLink = links.find(
    (l) =>
      l.href &&
      l.href.startsWith("http") &&
      (l.text.toLowerCase().includes("apply") ||
        l.text.toLowerCase().includes("online") ||
        l.href.includes("apply"))
  );

  if (applyLink) {
    return { status: "open", link: applyLink.href };
  }

  // If "apply online" text found but no link, it's coming soon
  if (/apply\s*online/.test(text)) {
    return { status: "coming_soon", link: null };
  }

  return { status: "unknown", link: null };
}

// ── Extract Key Data from Page Text ──────────────────────────────────────────
function extractPageData(pageText) {
  const text = pageText;

  // Last date patterns
  const lastDateMatch =
    text.match(/last\s*date[:\s]+([^\n\r]{5,50})/i) ||
    text.match(/(?:apply\s*before|closing\s*date)[:\s]+([^\n\r]{5,50})/i);
  const lastDate = lastDateMatch ? lastDateMatch[1].trim().slice(0, 60) : null;

  // Total posts patterns
  const postsMatch =
    text.match(/total\s*(?:post|vacancy|vacancies)[:\s]+(\d[\d,]+)/i) ||
    text.match(/(\d[\d,]+)\s*(?:post|vacancy|vacancies)/i);
  const totalPosts = postsMatch ? postsMatch[1].replace(/,/g, "") : null;

  // Application fee patterns
  const feeGenMatch = text.match(
    /(?:general|gen|ur|obc|ews)[\/,\s]+(?:obc[\/,\s]+)?(?:ews[\/,\s]+)?(?:fee|fees?)[:\s]+₹?\s*(\d+)/i
  ) || text.match(/application\s*fee[:\s]*₹?\s*(\d+)/i);
  const appFeeGen = feeGenMatch ? `₹${feeGenMatch[1]}` : null;

  const feeResMatch = text.match(
    /(?:sc|st|ph|pwd)[\/,\s]+(?:female[\/,\s]+)?(?:fee|fees?)[:\s]+₹?\s*(\d+)/i
  ) || text.match(/sc\s*\/?\s*st[:\s]+(?:free|₹?\s*\d+)/i);
  const appFeeRes = feeResMatch ? feeResMatch[0].slice(0, 30).trim() : null;

  // Official website
  const officialMatch = text.match(
    /official\s*(?:website|site|portal|link)[:\s]+([^\s\n]{5,80})/i
  );
  const officialLink = officialMatch ? officialMatch[1].trim() : null;

  return { lastDate, totalPosts, appFeeGen, appFeeRes, officialLink };
}

// ── Parse RSS Feed ────────────────────────────────────────────────────────────
async function fetchRSSItems() {
  const res = await fetch(RSS_URL, {
    headers: { "User-Agent": "Mozilla/5.0 (compatible; RojgarSuvidhaBot/1.0)" },
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) throw new Error(`RSS fetch failed: ${res.status}`);
  const xml = await res.text();

  // Simple XML parsing for RSS items
  const items = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let match;
  while ((match = itemRegex.exec(xml)) !== null) {
    const item = match[1];
    const title = item.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/)?.[1]
      || item.match(/<title>(.*?)<\/title>/)?.[1] || "";
    const link = item.match(/<link>(.*?)<\/link>/)?.[1]
      || item.match(/<guid[^>]*>(.*?)<\/guid>/)?.[1] || "";
    const pubDate = item.match(/<pubDate>(.*?)<\/pubDate>/)?.[1] || "";
    const description = item.match(/<description><!\[CDATA\[([\s\S]*?)\]\]><\/description>/)?.[1]
      || item.match(/<description>([\s\S]*?)<\/description>/)?.[1] || "";

    if (title && link) {
      items.push({
        title: title.trim(),
        link: link.trim(),
        pubDate: pubDate.trim(),
        description: description.trim(),
      });
    }
  }
  return items;
}

// ── Fetch Full Page & Extract Content ─────────────────────────────────────────
async function fetchFullPage(url) {
  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      Accept: "text/html,application/xhtml+xml",
    },
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error(`Page fetch failed: ${res.status}`);
  const html = await res.text();

  // Extract text content and links using regex (no external library needed in edge runtime)
  // Remove script and style tags
  let cleaned = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<nav[\s\S]*?<\/nav>/gi, " ")
    .replace(/<footer[\s\S]*?<\/footer>/gi, " ")
    .replace(/<header[\s\S]*?<\/header>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ");

  // Extract all links before stripping HTML
  const links = [];
  const linkRegex = /<a\s+[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let linkMatch;
  while ((linkMatch = linkRegex.exec(cleaned)) !== null) {
    const href = linkMatch[1].trim();
    const text = linkMatch[2].replace(/<[^>]+>/g, "").trim();
    if (href && text) links.push({ href, text });
  }

  // Strip all HTML tags
  const text = cleaned
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .replace(/&quot;/g, '"')
    .replace(/\s{2,}/g, " ")
    .trim();

  return { text: text.slice(0, 8000), links }; // Limit to 8000 chars for AI
}

// ── Generate Blog via Gemini (calls our existing AI pipeline) ─────────────────
async function generateBlogDraft(
  rawText,
  category,
  applyStatus,
  applyLink,
  officialLink,
  lastDate,
  totalPosts,
  appFeeGen,
  appFeeRes,
  sourceTitle
) {
  // Build the coming soon instruction if needed
  const comingSoonNote =
    applyStatus === "coming_soon"
      ? `\n\n⚠️ CRITICAL INSTRUCTION: Apply link is NOT yet available — it shows "Coming Soon" on the official site.
In the blog, you MUST write clearly: "Online apply link abhi Coming Soon hai. Jaise hi SSC/Railway/Official portal link activate kare, hum is page ko turant update karenge. Tab tak — official notification PDF download karo, eligibility check karo, documents ready rakho."
Do NOT create a fake apply button. Instead use a "Coming Soon" styled badge/box.`
      : applyLink
        ? `\n\nAPPLY LINK (Include this prominently in the blog): ${applyLink}`
        : "";

  const officialNote = officialLink
    ? `\nOfficial Website: ${officialLink}`
    : "";

  const enrichedText = `SOURCE TITLE: ${sourceTitle}
CATEGORY: ${category}
TODAY'S DATE: ${new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
LAST DATE TO APPLY: ${lastDate || "Check notification"}
TOTAL VACANCIES: ${totalPosts || "Check notification"}
APPLICATION FEE (General/OBC): ${appFeeGen || "Check notification"}
APPLICATION FEE (SC/ST/PH): ${appFeeRes || "Free or check notification"}
APPLY STATUS: ${applyStatus.toUpperCase()}${comingSoonNote}${officialNote}

--- FULL PAGE CONTENT ---
${rawText}`;

  const geminiApiKey = process.env.GEMINI_API_KEY;
  if (!geminiApiKey) throw new Error("GEMINI_API_KEY missing");

  const SYSTEM_PROMPT = `You are "SarkariLekhan AI" (Arjun Sharma) — India's top expert Sarkari Naukri blog writer with 10+ years of experience in government job notifications, exam analysis, recruitment patterns, and career guidance for Indian job seekers.

You strictly follow Google's E-E-A-T (Experience, Expertise, Authoritativeness, Trustworthiness) guidelines and Google's Helpful Content system. Your goal is not just to write content — but to genuinely help job seekers get accurate, complete, and actionable information.

You write in simple Hindi-English mix (Hinglish) that is easy to understand for class 10 to graduation level readers across Tier 2 and Tier 3 cities of India.

You MUST respond with ONLY a valid JSON object (no markdown, no code blocks), with these fields:
{
  "title": "SEO title max 60 chars with primary keyword first + year",
  "metaDesc": "Meta description exactly 150-155 chars ending with CTA",
  "primaryKeyword": "main focus keyword",
  "tag": "short tag like 'Railway Jobs' or 'SSC Result'",
  "category": "category string",
  "lastDate": "extracted last date or null",
  "totalPosts": "extracted vacancy count or null",
  "appFeeGen": "fee for gen/obc or null",
  "appFeeRes": "fee for sc/st or null",
  "officialLink": "official website URL or null",
  "links": "apply link or null",
  "shortInfo": "2-sentence summary for cards",
  "blogHtml": "COMPLETE blog HTML (minimum 1500 words)"
}

BLOG HTML STRUCTURE RULES:
① Every blog MUST have: Quick Info Table, Important Dates, Vacancy Details, Eligibility, Salary, Selection Process, How to Apply, FAQ (min 6 Q&As), Conclusion
② If APPLY STATUS is COMING_SOON: Add a styled yellow/orange "Coming Soon" callout box instead of apply button. Write: "Apply link abhi Coming Soon hai — hum link activate hone par turant update karenge."
③ If APPLY STATUS is OPEN: Include the apply link as a prominent styled button/link
④ Use <strong> for dates, fees, vacancy counts
⑤ Use <details><summary>Q?</summary><p>A</p></details> for FAQs
⑥ NEVER use: delve, plethora, crucial, navigating, landscape, moreover, furthermore, additionally, in conclusion, comprehensive guide, leverage, transformative
⑦ Use Hinglish naturally — mix Hindi words like "yeh", "aap", "kar sakte hain", "zaroor padhein"
⑧ Add WhatsApp share box after introduction
⑨ Internal links: href='/latest-jobs', href='/results', href='/admit-card', href='/admission'`;

  const models = ["gemini-2.0-flash", "gemini-1.5-flash", "gemini-1.5-pro"];
  let lastError = "";

  for (const model of models) {
    try {
      const payload = {
        contents: [
          {
            role: "user",
            parts: [{ text: `${SYSTEM_PROMPT}\n\nCONTENT TO PROCESS:\n${enrichedText}` }],
          },
        ],
        generationConfig: {
          temperature: 0.85,
          maxOutputTokens: 6000,
          responseMimeType: "application/json",
        },
      };

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 55000);
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiApiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
          signal: controller.signal,
        }
      );
      clearTimeout(timeout);

      const data = await response.json();
      if (data.error) {
        lastError = data.error.message || JSON.stringify(data.error);
        continue;
      }
      const rawJson = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
      if (!rawJson) continue;

      try {
        const cleaned = rawJson.replace(/^```json?\s*/i, "").replace(/```\s*$/i, "").trim();
        return JSON.parse(cleaned);
      } catch (parseErr) {
        lastError = `JSON parse failed: ${parseErr.message}`;
        continue;
      }
    } catch (e) {
      lastError = e.message;
      continue;
    }
  }
  throw new Error(`All Gemini models failed: ${lastError}`);
}

// ── Send Telegram Notification ────────────────────────────────────────────────
async function sendTelegramNotification(draft, draftId) {
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
    console.warn("Telegram not configured — skipping notification");
    return;
  }

  const statusEmoji =
    draft.apply_status === "open"
      ? "🟢 LIVE"
      : draft.apply_status === "coming_soon"
        ? "🟡 COMING SOON"
        : "⚪ Unknown";

  const reviewUrl = `${BASE_URL}/admin/auto-drafts/${draftId}`;

  const message = `🆕 *New Blog Draft Ready!*

📌 *${(draft.source_title || "New Post").slice(0, 80)}*

📂 Category: ${draft.category || "auto-detect"}
🔗 Apply Status: ${statusEmoji}
${draft.last_date ? `📅 Last Date: ${draft.last_date}` : ""}
${draft.total_posts ? `👥 Vacancies: ${draft.total_posts}` : ""}
🌐 Source: FreeJobAlert.com

✏️ *Review karo:*
[Admin Review Link](${reviewUrl})

_Automatic draft — manual review zaroori hai before publish_`;

  const telegramUrl = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
  await fetch(telegramUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: TELEGRAM_CHAT_ID,
      text: message,
      parse_mode: "Markdown",
      disable_web_page_preview: false,
    }),
  });
}

// ── Generate slug ─────────────────────────────────────────────────────────────
function generateSlug(title) {
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim()
    .slice(0, 80);
}

// ── Main Runner ───────────────────────────────────────────────────────────────
export async function runAutoBlogScraper() {
  console.log("🚀 Auto Blog Scraper started:", new Date().toISOString());
  const results = { processed: 0, skipped: 0, errors: [] };

  // 1. Fetch RSS feed
  let rssItems;
  try {
    rssItems = await fetchRSSItems();
    console.log(`📡 RSS: ${rssItems.length} items found`);
  } catch (err) {
    console.error("RSS fetch failed:", err.message);
    return { ...results, errors: [`RSS: ${err.message}`] };
  }

  // 2. Get already scraped URLs
  const { data: scrapedLog } = await supabase
    .from("scraped_urls_log")
    .select("url");
  const scrapedUrls = new Set((scrapedLog || []).map((r) => r.url));

  // 3. Process new items (max 3 per run to stay within Vercel limits)
  const newItems = rssItems.filter((i) => !scrapedUrls.has(i.link)).slice(0, 3);
  console.log(`🆕 New items to process: ${newItems.length}`);

  for (const item of newItems) {
    console.log(`\n📰 Processing: ${item.title}`);
    try {
      // 4. Fetch full page
      const { text: pageText, links } = await fetchFullPage(item.link);

      // 5. Detect category + apply status
      const category = detectCategory(item.title, pageText);
      const { status: applyStatus, link: applyLink } = detectApplyStatus(
        pageText,
        links
      );

      // 6. Extract structured data
      const { lastDate, totalPosts, appFeeGen, appFeeRes, officialLink } =
        extractPageData(pageText);

      console.log(
        `   Category: ${category} | Apply: ${applyStatus} | Posts: ${totalPosts}`
      );

      // 7. Generate blog with Gemini AI
      const aiResult = await generateBlogDraft(
        pageText,
        category,
        applyStatus,
        applyLink,
        officialLink,
        lastDate,
        totalPosts,
        appFeeGen,
        appFeeRes,
        item.title
      );

      const slug = generateSlug(aiResult.title || item.title);

      // 8. Save draft to Supabase
      const { data: insertedDraft, error: insertError } = await supabase
        .from("auto_blog_drafts")
        .insert([
          {
            source_url: item.link,
            source_title: item.title,
            source_site: "freejobales",
            apply_link: applyLink,
            apply_status: applyStatus,
            official_link: aiResult.officialLink || officialLink,
            last_date: aiResult.lastDate || lastDate,
            total_posts: aiResult.totalPosts || totalPosts,
            app_fee_gen: aiResult.appFeeGen || appFeeGen,
            app_fee_res: aiResult.appFeeRes || appFeeRes,
            extracted_text: pageText.slice(0, 3000),
            category: aiResult.category || category,
            generated_title: aiResult.title,
            generated_meta: aiResult.metaDesc,
            generated_slug: slug,
            generated_html: aiResult.blogHtml,
            generated_tags: aiResult.tag ? [aiResult.tag] : [],
            primary_keyword: aiResult.primaryKeyword,
            short_description: aiResult.shortInfo,
            status: "pending_review",
          },
        ])
        .select("id")
        .single();

      if (insertError) throw new Error(`DB insert: ${insertError.message}`);

      // 9. Log URL as scraped
      await supabase
        .from("scraped_urls_log")
        .upsert([{ url: item.link }], { onConflict: "url" });

      // 10. Send Telegram notification
      await sendTelegramNotification(
        {
          source_title: item.title,
          category: aiResult.category || category,
          apply_status: applyStatus,
          last_date: aiResult.lastDate || lastDate,
          total_posts: aiResult.totalPosts || totalPosts,
        },
        insertedDraft.id
      );

      results.processed++;
      console.log(`   ✅ Draft saved: ${insertedDraft.id}`);
    } catch (err) {
      console.error(`   ❌ Error: ${err.message}`);
      results.errors.push(`${item.title}: ${err.message}`);

      // Still mark as scraped to avoid infinite retries
      await supabase
        .from("scraped_urls_log")
        .upsert([{ url: item.link }], { onConflict: "url" })
        .catch(() => {});

      // Save error draft for visibility
      await supabase
        .from("auto_blog_drafts")
        .insert([
          {
            source_url: item.link,
            source_title: item.title,
            status: "error",
            error_message: err.message,
          },
        ])
        .catch(() => {});
    }
  }

  if (newItems.length === 0) {
    results.skipped = rssItems.length;
    console.log("✨ No new posts to process");
  }

  console.log(
    `\n📊 Done: ${results.processed} processed, ${results.skipped} skipped, ${results.errors.length} errors`
  );
  return results;
}
