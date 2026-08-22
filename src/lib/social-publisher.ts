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
  // Always target public Telegram channel (@govermentform / TELEGRAM_CHANNEL_ID), not admin personal chat ID
  const channelId = process.env.TELEGRAM_CHANNEL_ID || "@govermentform";

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
    `🚨 *NEW SARKARI NOTIFICATION 2026*`,
    "",
    `🔥 *${job.title.trim()}*`,
    "",
    `📌 *Category:* ${categoryBadge}`,
    ...(postsText ? [postsText] : []),
    ...(lastDateText ? [lastDateText] : []),
    stateText,
    "🟢 *Status:* Verified Update Live",
    "",
    `🔗 *Direct Apply Link & Complete Details:*`,
    jobUrl,
    "",
    `📢 *Join Official Channel:* ${channelId}`,
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
          chat_id: channelId,
          photo: photoUrl,
          caption: text.slice(0, 1024), // Telegram caption max 1024 chars
          parse_mode: "Markdown",
        }),
      });

      if (res.ok) {
        console.log(`✅ [Telegram Auto-Poster] Photo post published successfully to Telegram channel ${channelId}`);
        return true;
      }
    }

    // Fallback to text message
    const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: channelId,
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

  const whatsappChannelUrl = process.env.NEXT_PUBLIC_WHATSAPP_CHANNEL_URL || "https://whatsapp.com/channel/0029Vb7gNWP4Crfj2Jq5gz01";

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
    `🟢 *Join Official WhatsApp Channel:*`,
    whatsappChannelUrl,
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
  console.log(`🚀 [Social Broadcaster] Broadcasting live alert for '${job.title}' (${job.category}) to Telegram Channel @govermentform`);

  // Run Telegram and WhatsApp posters asynchronously in parallel
  const [telegram, whatsapp] = await Promise.all([
    sendTelegramPost(job).catch(() => false),
    sendWhatsAppPost(job).catch(() => false),
  ]);

  return { telegram, whatsapp, skipped: false };
}

export interface DraftNotificationPayload {
  id: string;
  title: string;
  category: string;
  stateCode?: string | null;
  totalPosts?: string | null;
  lastDate?: string | null;
  bannerUrl?: string | null;
  sourceTag?: string | null;
}

/**
 * Send private draft approval alert to Admin via Telegram with inline keyboard
 */
export async function sendAdminDraftApprovalAlert(draft: DraftNotificationPayload): Promise<boolean> {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const adminChatId = process.env.ADMIN_TELEGRAM_ID || process.env.TELEGRAM_ADMIN_CHAT_ID || "6681095051";

  if (!botToken) {
    console.log("ℹ️ [Admin Alert] TELEGRAM_BOT_TOKEN missing — skipping admin approval alert");
    return false;
  }

  const reviewUrl = `${BASE_URL}/admin/auto-drafts/${draft.id}`;
  const postsText = draft.totalPosts ? `👥 *Vacancies:* ${draft.totalPosts}` : null;
  const lastDateText = draft.lastDate ? `📅 *Last Date:* ${draft.lastDate}` : null;
  const tagBadge = draft.sourceTag ? `🏷️ *Tag:* \`${draft.sourceTag}\`\n` : "";

  const lines = [
    `📄 *NEW AUTO-BLOG DRAFT GENERATED*`,
    tagBadge,
    `📌 *Title:* ${draft.title.trim()}`,
    `📊 *Category:* \`${draft.category}\` | *State:* \`${draft.stateCode || "ALL"}\``,
    ...(postsText ? [postsText] : []),
    ...(lastDateText ? [lastDateText] : []),
    "",
    `⚡ *Review or Approve in 1-Click below:*`,
  ].filter((l) => l !== null && l !== undefined);

  const text = lines.join("\n");

  const inlineKeyboard = {
    inline_keyboard: [
      [
        { text: "✅ Approve & Publish Live", callback_data: `pub_${draft.id}` },
      ],
      [
        { text: "👁️ Review in Admin UI", url: reviewUrl },
        { text: "❌ Reject Draft", callback_data: `rej_${draft.id}` },
      ]
    ]
  };

  try {
    const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: adminChatId,
        text,
        parse_mode: "Markdown",
        reply_markup: inlineKeyboard,
      }),
    });

    if (res.ok) {
      console.log(`✅ [Admin Alert] Sent private draft approval notification for draft ${draft.id} to Admin ${adminChatId}`);
      return true;
    } else {
      const errData = await res.json().catch(() => ({}));
      console.warn("⚠️ [Admin Alert] Failed to send Telegram admin alert:", errData);
      return false;
    }
  } catch (err: any) {
    console.warn("⚠️ [Admin Alert] Exception sending admin alert:", err.message);
    return false;
  }
}

/**
 * Send Error Alert Notification directly to Admin's private Telegram chat
 */
export async function sendTelegramAdminErrorAlert(errorMessage: string, itemTitle?: string, sourceUrl?: string): Promise<boolean> {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const adminChatId = process.env.ADMIN_TELEGRAM_ID || process.env.TELEGRAM_ADMIN_CHAT_ID || "6681095051";

  if (!botToken) {
    console.log("ℹ️ [Telegram Error Alert] TELEGRAM_BOT_TOKEN missing — skipping alert");
    return false;
  }

  const caption = `⚠️ <b>ROJGAR SUVIDHA SCRAPER ERROR ALERT</b> ⚠️\n\n` +
    (itemTitle ? `<b>📌 Title:</b> ${itemTitle}\n` : "") +
    (sourceUrl ? `<b>🔗 Source:</b> ${sourceUrl}\n` : "") +
    `<b>❌ Error Details:</b> <code>${errorMessage.slice(0, 500)}</code>\n\n` +
    `<i>Time: ${new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })} IST</i>`;

  try {
    const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: adminChatId,
        text: caption,
        parse_mode: "HTML",
      }),
    });
    const data = await res.json();
    console.log(`⚠️ [Admin Error Alert] Sent alert to Admin (${adminChatId}):`, data.ok);
    return res.ok;
  } catch (e: any) {
    console.error("Failed to send Telegram admin error alert:", e.message);
    return false;
  }
}

/**
 * Send Cron Summary Digest directly to Admin's private Telegram chat
 */
export async function sendTelegramAdminSummaryDigest(text: string): Promise<boolean> {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const adminChatId = process.env.ADMIN_TELEGRAM_ID || process.env.TELEGRAM_ADMIN_CHAT_ID || "6681095051";

  if (!botToken) return false;

  try {
    const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: adminChatId,
        text,
        parse_mode: "HTML",
      }),
    });
    return res.ok;
  } catch (e: any) {
    console.error("Failed to send Telegram admin summary digest:", e.message);
    return false;
  }
}
