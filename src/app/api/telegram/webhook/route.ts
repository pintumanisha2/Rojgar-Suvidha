import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { broadcastJobAlert } from "@/lib/social-publisher";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://www.rojgarsuvidha.com";
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

/**
 * Helper to answer Telegram callback query (removes loading spinner on button)
 */
async function answerCallbackQuery(callbackQueryId: string, text: string) {
  if (!BOT_TOKEN) return;
  await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/answerCallbackQuery`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      callback_query_id: callbackQueryId,
      text,
      show_alert: true,
    }),
  }).catch((e) => console.warn("Failed to answer callback query:", e));
}

/**
 * Helper to edit original Telegram message after action
 */
async function editMessageText(chatId: number, messageId: number, text: string) {
  if (!BOT_TOKEN) return;
  await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/editMessageText`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      message_id: messageId,
      text,
      parse_mode: "Markdown",
      disable_web_page_preview: false,
    }),
  }).catch((e) => console.warn("Failed to edit message text:", e));
}

/**
 * POST /api/telegram/webhook
 * Receives update payloads from Telegram Bot Webhook
 */
export async function POST(request: Request) {
  try {
    const update = await request.json();

    // Handle Inline Button Callback Query
    if (update.callback_query) {
      const callback = update.callback_query;
      const callbackId = callback.id;
      const data = callback.data || "";
      const chatId = callback.message?.chat?.id;
      const messageId = callback.message?.message_id;

      // Handle Approve & Publish Live Button
      if (data.startsWith("pub_")) {
        const draftId = data.replace("pub_", "");

        // 1. Fetch draft from DB
        const { data: draft, error: fetchErr } = await supabase
          .from("auto_blog_drafts")
          .select("*")
          .eq("id", draftId)
          .single();

        if (fetchErr || !draft) {
          await answerCallbackQuery(callbackId, "❌ Draft not found in database!");
          return NextResponse.json({ ok: true });
        }

        if (draft.status === "published") {
          await answerCallbackQuery(callbackId, "⚠️ This draft is ALREADY published live!");
          return NextResponse.json({ ok: true });
        }

        // 2. Prepare slug and metadata
        const rawSlug = draft.generated_slug || draft.slug || draft.generated_title || "job-update";
        const slug = rawSlug
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, "") || `job-${Date.now()}`;

        let linksArray: any[] = [];
        try {
          if (typeof draft.links === "string" && draft.links.startsWith("[")) {
            linksArray = JSON.parse(draft.links);
          } else if (Array.isArray(draft.links)) {
            linksArray = draft.links;
          }
        } catch (e) {
          linksArray = [];
        }

        // 3. Insert into jobs table
        const jobPayload: any = {
          title: draft.generated_title,
          slug,
          blog_content: draft.generated_html,
          short_info: draft.short_description || draft.generated_meta,
          meta_description: draft.generated_meta,
          tag: draft.generated_tags?.[0] || null,
          category: draft.category || "latest-jobs",
          state_code: draft.state_code || null,
          banner_url: draft.banner_url || null,
          status: "active",
          links: linksArray.length > 0 ? linksArray : (draft.links || null),
          important_dates: draft.important_dates || null,
          created_at: new Date().toISOString(),
        };

        const { data: insertedJob, error: insertErr } = await supabase
          .from("jobs")
          .insert([jobPayload])
          .select("id")
          .single();

        if (insertErr) {
          await answerCallbackQuery(callbackId, `❌ Publish failed: ${insertErr.message}`);
          return NextResponse.json({ ok: true });
        }

        // 3.1. Auto-create "Apply For Me" Custom Form (ONLY FOR category === "latest-jobs")
        if ((draft.category || "latest-jobs") === "latest-jobs" && insertedJob?.id) {
          try {
            let docsList = draft.form_documents || [
              "10th Marksheet / Birth Certificate",
              "Educational Qualification Certificate",
              "Aadhaar Card / Photo ID Proof",
              "Recent Passport Size Photo",
              "Candidate Signature",
              "Caste / Category Certificate (if applicable)",
              "Domicile Certificate (if applicable)"
            ];

            let feesStruct = draft.form_fees_structure;
            if (!feesStruct) {
              feesStruct = [
                {
                  postName: `${draft.generated_title} (General / OBC / EWS)`,
                  fees: { genFee: draft.app_fee_gen || "100", scFee: "0", serviceCharge: "99" }
                },
                {
                  postName: `${draft.generated_title} (SC / ST / Female)`,
                  fees: { genFee: "0", scFee: draft.app_fee_res || "0", serviceCharge: "99" }
                }
              ];
            } else if (typeof feesStruct === "string") {
              try { feesStruct = JSON.parse(feesStruct); } catch (_) {}
            }

            await supabase.from("custom_forms").insert([{
              title: `${draft.generated_title} Application Form 2026`,
              documents: docsList,
              fees_structure: feesStruct,
              status: "active",
              job_id: insertedJob.id,
              job_slug: slug,
            }]);
            console.log(`✅ [Telegram Webhook] Created custom_forms entry for latest-jobs '${draft.generated_title}'`);
          } catch (formErr: any) {
            console.warn("⚠️ [Telegram Webhook] Failed to auto-create custom_forms entry:", formErr.message);
          }
        }

        // 4. Mark draft as published
        await supabase
          .from("auto_blog_drafts")
          .update({
            status: "published",
            published_at: new Date().toISOString(),
            published_post_id: insertedJob.id,
          })
          .eq("id", draftId);

        // 5. Answer Callback Query
        await answerCallbackQuery(callbackId, "🎉 Published Live on Rojgar Suvidha!");

        // 6. Update Telegram message to show success status
        const liveUrl = `${BASE_URL}/job/${slug}`;
        if (chatId && messageId) {
          const successText = [
            `✅ *APPROVED & PUBLISHED LIVE ON WEBSITE!*`,
            "",
            `📌 *Title:* ${draft.generated_title}`,
            `📊 *Category:* \`${draft.category}\` | *State:* \`${draft.state_code || "ALL"}\``,
            "",
            `🌐 *View Live Post:*`,
            liveUrl,
          ].join("\n");
          await editMessageText(chatId, messageId, successText);
        }

        // 7. Broadcast alert to Main Telegram Channel (@govermentform)
        broadcastJobAlert({
          title: draft.generated_title,
          slug,
          category: draft.category || "latest-jobs",
          totalPosts: draft.total_posts,
          lastDate: draft.last_date,
          stateCode: draft.state_code,
          bannerUrl: draft.banner_url,
        }).catch((e) => console.warn("Broadcasting error:", e));

        return NextResponse.json({ ok: true });
      }

      // Handle Reject Button
      if (data.startsWith("rej_")) {
        const draftId = data.replace("rej_", "");

        await supabase
          .from("auto_blog_drafts")
          .update({ status: "rejected" })
          .eq("id", draftId);

        await answerCallbackQuery(callbackId, "❌ Draft Rejected & Discarded");

        if (chatId && messageId) {
          await editMessageText(
            chatId,
            messageId,
            `❌ *DRAFT REJECTED & DISCARDED*\n\nDraft ID: \`${draftId}\``
          );
        }

        return NextResponse.json({ ok: true });
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error("Telegram Webhook Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
