/**
 * Social Publisher Module — Telegram Channel & WhatsApp Group Auto-Poster Engine
 * 
 * Rules:
 * 1. Category "news" is STRICTLY EXCLUDED from auto-broadcasting to social channels.
 * 2. Recruitment categories (latest-jobs, results, admit-card, answer-key, admission)
 *    are formatted for high CTR, Telegram SEO, and viral WhatsApp group sharing.
 */

export interface BroadcastJobPayload {
  title: string;
  slug: string;
  category: string;
  totalPosts?: string | null;
  lastDate?: string | null;
  stateCode?: string | null;
  bannerUrl?: string | null;
}

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://www.rojgarsuvidha.com";

/**
 * Format category label for display
 */
function getCategoryBadge(category: string): string {
  switch (category) {
    case "results":
      return "🏆 SARKARI RESULT ALERT";
    case "admit-card":
      return "🪪 ADMIT CARD ALERT";
    case "answer-key":
      return "📋 ANSWER KEY ALERT";
    case "admission":
      return "🎓 ADMISSION ALERT";
    default:
      return "🚨 NEW SARKARI NAUKRI ALERT 2026";
  }
}

/**
 * Broadcast job alert to Telegram Channel / Group
 */
export async function sendTelegramPost(job: BroadcastJobPayload): Promise<boolean> {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID || "@rojgarsuvidha";

  if (!botToken) {
    console.log("ℹ️ [Telegram Auto-Poster] TELEGRAM_BOT_TOKEN missing — skipping Telegram post");
    return false;
  }

  const jobUrl = `${BASE_URL}/job/${job.slug}`;
  const categoryBadge = getCategoryBadge(job.category);
  const postsText = job.totalPosts ? `👥 *Total Vacancies:* ${job.totalPosts}` : null;
  const lastDateText = job.lastDate ? `📅 *Last Date:* ${job.lastDate}` : null;
  const stateText = job.stateCode && job.stateCode !== "ALL" ? `🏛️ *State:* ${job.stateCode}` : `🌐 *Jurisdiction:* All India`;

  const lines = [
    `🔥 *${job.title.trim()}*`,
    "",
    `📌 *Category:* ${categoryBadge}`,
    ...(postsText ? [postsText] : []),
    ...(lastDateText ? [lastDateText] : []),
    stateText,
    "🟢 *Status:* Online Update Live",
    "",
    "⚡ *100% Verified Updates @ Rojgar Suvidha*",
    "",
    `🔗 *Direct Link & Complete Details:*`,
    jobUrl,
    "",
    `📢 *Join Official Channel:* ${chatId}`,
  ];

  const text = lines.join("\n");

  try {
    // If bannerUrl is present, send as photo with caption
    if (job.bannerUrl) {
      const photoUrl = job.bannerUrl.startsWith("http") ? job.bannerUrl : `${BASE_URL}${job.bannerUrl}`;
      const res = await fetch(`https://api.telegram.org/bot${botToken}/sendPhoto`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          photo: photoUrl,
          caption: text.slice(0, 1024), // Telegram caption max 1024 chars
          parse_mode: "Markdown",
        }),
      });

      if (res.ok) {
        console.log("✅ [Telegram Auto-Poster] Photo post published successfully to Telegram channel");
        return true;
      }
    }

    // Fallback to text message
    const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: "Markdown",
        disable_web_page_preview: false,
      }),
    });

    if (res.ok) {
      console.log("✅ [Telegram Auto-Poster] Text post published successfully to Telegram channel");
      return true;
    } else {
      const errData = await res.json().catch(() => ({}));
      console.warn("⚠️ [Telegram Auto-Poster] Telegram API failed:", errData);
      return false;
    }
  } catch (err: any) {
    console.warn("⚠️ [Telegram Auto-Poster] Exception sending Telegram post:", err.message);
    return false;
  }
}

/**
 * Broadcast job alert to WhatsApp Group / Webhook / Business API
 */
export async function sendWhatsAppPost(job: BroadcastJobPayload): Promise<boolean> {
  const webhookUrl = process.env.WHATSAPP_WEBHOOK_URL;
  const apiToken = process.env.WHATSAPP_API_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  if (!webhookUrl && (!apiToken || !phoneNumberId)) {
    console.log("ℹ️ [WhatsApp Auto-Poster] WHATSAPP_WEBHOOK_URL / WHATSAPP_API_TOKEN missing — skipping WhatsApp post");
    return false;
  }

  const jobUrl = `${BASE_URL}/job/${job.slug}`;
  const categoryBadge = getCategoryBadge(job.category);
  const postsText = job.totalPosts ? `▫️ Vacancy: *${job.totalPosts}*` : null;
  const lastDateText = job.lastDate ? `▫️ Last Date: *${job.lastDate}*` : null;
  const stateText = job.stateCode && job.stateCode !== "ALL" ? `▫️ State: *${job.stateCode}*` : `▫️ Jurisdiction: *All India*`;

  const lines = [
    `${categoryBadge}`,
    "",
    `📌 *${job.title.trim()}*`,
    "",
    ...(postsText ? [postsText] : []),
    ...(lastDateText ? [lastDateText] : []),
    stateText,
    "▫️ Status: *Online Update Live*",
    "",
    "✅ *Direct Apply Link & Official Notification:*",
    "👇 Click Here 👇",
    jobUrl,
    "",
    "📲 Shared via *Rojgar Suvidha Portal* — Aapke Sapno Ki Naukri",
  ];

  const text = lines.join("\n");

  try {
    if (webhookUrl) {
      const res = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          title: job.title,
          url: jobUrl,
          bannerUrl: job.bannerUrl,
        }),
      });

      if (res.ok) {
        console.log("✅ [WhatsApp Auto-Poster] Broadcast sent successfully via Webhook");
        return true;
      }
    }

    if (apiToken && phoneNumberId) {
      const res = await fetch(
        `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`,
        {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${apiToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            messaging_product: "whatsapp",
            to: process.env.WHATSAPP_RECIPIENT_GROUP || "",
            type: "text",
            text: { body: text },
          }),
        }
      );

      if (res.ok) {
        console.log("✅ [WhatsApp Auto-Poster] Broadcast sent successfully via WhatsApp Business API");
        return true;
      }
    }
  } catch (err: any) {
    console.warn("⚠️ [WhatsApp Auto-Poster] Exception sending WhatsApp post:", err.message);
  }

  return false;
}

/**
 * Main Social Broadcaster Runner
 * 
 * Enforces rule: EXCLUDE category 'news' from auto-posting to social groups/channels.
 */
export async function broadcastJobAlert(job: BroadcastJobPayload): Promise<{ telegram: boolean; whatsapp: boolean; skipped: boolean }> {
  // RULE 1: STRICTLY EXCLUDE NEWS CATEGORY
  if (job.category === "news") {
    console.log(`ℹ️ [Social Broadcaster] Category 'news' is EXCLUDED from Telegram & WhatsApp broadcasting. Skipping.`);
    return { telegram: false, whatsapp: false, skipped: true };
  }

  console.log(`🚀 [Social Broadcaster] Broadcasting live alert for '${job.title}' (${job.category})`);

  // Run Telegram and WhatsApp posters asynchronously in parallel
  const [telegram, whatsapp] = await Promise.all([
    sendTelegramPost(job).catch(() => false),
    sendWhatsAppPost(job).catch(() => false),
  ]);

  return { telegram, whatsapp, skipped: false };
}
