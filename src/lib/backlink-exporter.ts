/**
 * ═══════════════════════════════════════════════════════════════════
 * BACKLINK EXPORTER & SYNC ENGINE
 * ═══════════════════════════════════════════════════════════════════
 * 1. Real-time sync to Google Sheet via Google Apps Script Webhook (Method 1)
 * 2. Daily Excel/CSV document generator and Telegram Document Sender
 */

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://www.rojgarsuvidha.com";

export interface BacklinkExportPayload {
  type?: "backlink" | "pdf" | "social" | "pillar" | "custom_keyword" | "master_keyword" | "live_backlink";
  page_type?: "Job Article" | "Category Pillar" | "State Hub" | "Utility Tool" | "Homepage";
  date?: string;
  time?: string;
  job_title: string;
  target_url: string;
  platform: string;
  tier?: string;
  backlink_url: string;
  anchor_text: string;
  status?: string;
  pdf_url?: string;
  live_link?: string;
  reach?: string;
}

/**
 * Platform Tier / DA Map for SEO Reporting
 */
const PLATFORM_TIERS: Record<string, string> = {
  blogger: "Tier 1 (DA-95)",
  github: "Tier 1 (DA-96)",
  gitlab: "Tier 2 (DA-94)",
  wordpress: "Tier 2 (DA-93)",
  gitbook: "Tier 2 (DA-91)",
  devto: "Tier 2 (DA-87)",
  telegraph: "Tier 3 (DA-88)",
  notion: "Tier 3 (DA-90)",
  livejournal: "Tier 3 (DA-92)",
  pastebin: "Tier 3 (DA-89)",
  medium: "Tier 1 (DA-95)",
  hashnode: "Tier 2 (DA-86)",
  tumblr: "Tier 2 (DA-86)",
  pinterest: "Tier 2 (DA-94)",
};

/**
 * 1. Real-time Sync to Google Sheet (Method 1: Google Apps Script Webhook)
 * Triggers as soon as a backlink, PDF, or social notification is published.
 */
export async function syncBacklinkToGoogleSheet(payload: BacklinkExportPayload): Promise<boolean> {
  const webhookUrl = process.env.GOOGLE_SHEETS_WEBHOOK_URL?.trim();
  if (!webhookUrl) {
    console.log("ℹ️ [Backlink Exporter] GOOGLE_SHEETS_WEBHOOK_URL not set — skipping real-time Google Sheet sync.");
    return false;
  }

  try {
    const now = new Date();
    const dateStr = payload.date || now.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric", timeZone: "Asia/Kolkata" });
    const timeStr = payload.time || now.toLocaleTimeString("en-IN", { timeZone: "Asia/Kolkata", hour: "2-digit", minute: "2-digit" });

    const formattedPayload = {
      type: payload.type || "backlink",
      page_type: payload.page_type || "Job Article",
      date: dateStr,
      time: timeStr,
      job_title: payload.job_title,
      target_url: payload.target_url,
      platform: payload.platform.toUpperCase(),
      tier: payload.tier || PLATFORM_TIERS[payload.platform.toLowerCase()] || "High DA",
      backlink_url: payload.backlink_url,
      anchor_text: payload.anchor_text,
      status: payload.status || "Published",
      pdf_url: payload.pdf_url,
      live_link: payload.live_link,
      reach: payload.reach,
    };

    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(formattedPayload),
      redirect: "follow",
      signal: AbortSignal.timeout(10000),
    });

    if (res.ok || res.status === 302 || res.status === 200) {
      console.log(`✅ [Google Sheet Sync] Successfully pushed backlink to Google Sheet: ${payload.backlink_url}`);
      return true;
    } else {
      console.warn(`⚠️ [Google Sheet Sync] Webhook responded with status: ${res.status}`);
      return false;
    }
  } catch (err: any) {
    console.warn(`⚠️ [Google Sheet Sync] Failed to sync backlink to Google Sheet:`, err.message || err);
    return false;
  }
}

export interface BacklinkCsvRecord {
  created_at?: string;
  job_title: string;
  slug: string;
  target_url?: string;
  page_type?: string;
  platform: string;
  backlink_url: string;
  anchor_text: string;
  status: string;
}

/**
 * 2. Generate UTF-8 BOM CSV String (Natively opens in Excel with proper formatting)
 */
export function generateBacklinksCsvString(backlinks: BacklinkCsvRecord[]): string {
  const headers = [
    "S.No",
    "Date (IST)",
    "Time (IST)",
    "Job Title",
    "Targeted Website URL",
    "Target Page Type",
    "Platform",
    "Tier / DA",
    "Live Platform Backlink URL",
    "Anchor Text",
    "Publication Status"
  ];
  
  const escapeCsv = (str: string) => {
    if (!str) return '""';
    const escaped = str.replace(/"/g, '""');
    return `"${escaped}"`;
  };

  const rows = backlinks.map((item, idx) => {
    const dateObj = item.created_at ? new Date(item.created_at) : new Date();
    const dateStr = dateObj.toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata" });
    const timeStr = dateObj.toLocaleTimeString("en-IN", { timeZone: "Asia/Kolkata", hour: "2-digit", minute: "2-digit" });
    const targetUrl = item.target_url || (item.slug ? `${BASE_URL}/job/${item.slug}` : BASE_URL);
    const tierStr = PLATFORM_TIERS[item.platform?.toLowerCase()] || "High DA";

    // Detect page type
    let pageType = item.page_type;
    if (!pageType) {
      if (targetUrl.includes("/resume-builder")) pageType = "Utility Tool";
      else if (targetUrl.includes("/latest-jobs") || targetUrl.includes("/sarkari-result")) pageType = "Category Pillar";
      else if (targetUrl.includes("/job/")) pageType = "Job Article";
      else pageType = "Homepage";
    }

    return [
      idx + 1,
      escapeCsv(dateStr),
      escapeCsv(timeStr),
      escapeCsv(item.job_title),
      escapeCsv(targetUrl),
      escapeCsv(pageType),
      escapeCsv(item.platform?.toUpperCase() || ""),
      escapeCsv(tierStr),
      escapeCsv(item.backlink_url),
      escapeCsv(item.anchor_text || "Rojgar Suvidha"),
      escapeCsv(item.status || "In Drip Queue"),
    ].join(",");
  });

  // \uFEFF is UTF-8 Byte Order Mark (BOM) for Excel
  return "\uFEFF" + [headers.join(","), ...rows].join("\n");
}

/**
 * 3. Send Excel/CSV Document directly to Admin Telegram Chat via Telegram sendDocument API
 */
export async function sendTelegramBacklinksExcelReport(
  botToken: string,
  chatId: string,
  backlinks: BacklinkCsvRecord[],
  customTitle?: string
): Promise<boolean> {
  if (!botToken || !chatId) {
    console.warn("⚠️ [Telegram Excel Exporter] Missing BOT_TOKEN or ADMIN_CHAT_ID.");
    return false;
  }

  try {
    const csvContent = generateBacklinksCsvString(backlinks);
    const dateFormatted = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
    const fileName = `Rojgar_Suvidha_Backlinks_${dateFormatted}.csv`;

    // Use Web Native FormData and Blob (Supported natively in Node 18+)
    const formData = new FormData();
    formData.append("chat_id", chatId);
    formData.append(
      "caption",
      `📑 *DAILY BACKLINKS EXCEL SHEET (${dateFormatted})*\n\nAttached is your official Excel log containing *${backlinks.length} backlinks* generated today date-wise.\n\nOpen directly in Microsoft Excel or Google Sheets.`
    );
    formData.append("parse_mode", "Markdown");

    const fileBlob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    formData.append("document", fileBlob, fileName);

    const res = await fetch(`https://api.telegram.org/bot${botToken}/sendDocument`, {
      method: "POST",
      body: formData,
      signal: AbortSignal.timeout(15000),
    });

    const json = await res.json();
    if (res.ok && json.ok) {
      console.log(`✅ [Telegram Exporter] Successfully sent Daily Backlinks Excel Sheet to Admin Chat (${chatId})`);
      return true;
    } else {
      console.warn("⚠️ [Telegram Exporter] Telegram sendDocument API Error:", JSON.stringify(json));
      return false;
    }
  } catch (err: any) {
    console.error("❌ [Telegram Exporter] Exception sending Excel document:", err.message || err);
    return false;
  }
}
