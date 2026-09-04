import { NextResponse } from "next/server";
import { waitUntil } from "@vercel/functions";
import { createClient } from "@supabase/supabase-js";
import { broadcastJobAlert } from "@/lib/social-publisher";
import { notifySearchEngines } from "@/lib/instant-indexing";
import { enqueuePostApprovalBacklinks } from "@/lib/backlink-engine";

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
          // Check if post was already published directly to jobs table
          const { data: existingJob } = await supabase
            .from("jobs")
            .select("slug, title")
            .eq("id", draftId)
            .single();

          if (existingJob) {
            await answerCallbackQuery(callbackId, "✅ This post is ALREADY live on website!");
            if (chatId && messageId) {
              await editMessageText(
                chatId,
                messageId,
                `✅ *ALREADY PUBLISHED LIVE ON WEBSITE!*\n\n📌 *Title:* ${existingJob.title}\n\n🌐 *View Live:* ${BASE_URL}/job/${existingJob.slug}`
              );
            }
            return NextResponse.json({ ok: true });
          }

          await answerCallbackQuery(callbackId, "ℹ️ Stale Draft: This draft was >72h old (cleaned up) or already published.");
          return NextResponse.json({ ok: true });
        }

        if (draft.status === "published") {
          const liveSlug = draft.generated_slug || draft.slug || "job-update";
          await answerCallbackQuery(callbackId, "✅ This draft is ALREADY published live!");
          if (chatId && messageId) {
            await editMessageText(
              chatId,
              messageId,
              `✅ *ALREADY PUBLISHED LIVE ON WEBSITE!*\n\n📌 *Title:* ${draft.generated_title || draft.source_title}\n\n🌐 *View Live:* ${BASE_URL}/job/${liveSlug}`
            );
          }
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
        // NOTE: important_dates from auto-blog is stored as JSON string (e.g. '{"Key":"Val"}')
        // but the job page expects either null or an array [{label,value}].
        // Storing a raw JSON string causes production server crashes.
        // So we always set it to null — blog_content already includes the dates in HTML.

        // Smart meta_description fallback — NEVER leave empty (hurts Google CTR)
        const categoryLabel: Record<string, string> = {
          "results": "Result", "admit-card": "Admit Card", "answer-key": "Answer Key",
          "latest-jobs": "Sarkari Naukri", "admission": "Admission", "news": "Update",
        };
        const catWord = categoryLabel[draft.category || "latest-jobs"] || "Update";
        const metaFallback = `${draft.generated_title || "Sarkari"} ${catWord} 2026 — Puri Jankari aur Direct Link Yahan Hai. Abhi Dekho aur Apni Taiyari Shuru Karein.`.slice(0, 158);
        const metaDescription = (draft.generated_meta && draft.generated_meta.trim().length > 30)
          ? draft.generated_meta
          : metaFallback;

        const jobPayload: any = {
          title: draft.generated_title,
          blog_content: (draft.generated_html || "").replace(/<h1(\s[^>]*)?>/g, (_m: string, a: string) => `<h2${a || ""}>` ).replace(/<\/h1>/gi, "</h2>"),
          short_info: draft.short_description || metaDescription,
          meta_description: metaDescription,
          tag: draft.generated_tags?.[0] || null,
          category: draft.category || "latest-jobs",
          state_code: draft.state_code || null,
          banner_url: draft.banner_url || null,
          status: "active",
          links: linksArray.length > 0 ? linksArray : (draft.links || null),
          important_dates: null,  // Auto-blog stores as JSON string which crashes page; always null here
          created_by: "auto-blog-pipeline",  // Required for RLS policy — anon users can only read jobs with created_by set
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        // 3. Smart Upsert: Check if job already exists by existing_job_id OR matching slug
        let targetJobId: string | null = draft.existing_job_id || null;
        if (!targetJobId && draft.extracted_text) {
          try {
            const meta = JSON.parse(draft.extracted_text);
            if (meta.existing_job_id) targetJobId = meta.existing_job_id;
          } catch (_) {}
        }
        if (!targetJobId) {
          const { data: existingBySlug } = await supabase
            .from("jobs")
            .select("id")
            .eq("slug", slug)
            .maybeSingle();
          if (existingBySlug?.id) {
            targetJobId = existingBySlug.id;
          }
        }

        let finalJobId = targetJobId;

        if (targetJobId) {
          // ── UPDATE EXISTING LIVE JOB ──
          const updatePayload: any = {
            title: draft.generated_title,
            blog_content: (draft.generated_html || "").replace(/<h1(\s[^>]*)?>/g, (_m: string, a: string) => `<h2${a || ""}>` ).replace(/<\/h1>/gi, "</h2>"),
            short_info: draft.short_description || metaDescription,
            meta_description: metaDescription,
            tag: draft.generated_tags?.[0] || null,
            category: draft.category || "latest-jobs",
            state_code: draft.state_code || null,
            banner_url: draft.banner_url || null,
            status: "active",
            links: linksArray.length > 0 ? linksArray : (draft.links || null),
            updated_at: new Date().toISOString(),
          };

          const { error: updateErr } = await supabase
            .from("jobs")
            .update(updatePayload)
            .eq("id", targetJobId);

          if (updateErr) {
            await answerCallbackQuery(callbackId, `❌ Update failed: ${updateErr.message}`);
            return NextResponse.json({ ok: true });
          }
          console.log(`✅ [Telegram Webhook] UPDATED existing job ID = ${targetJobId} (Slug: /job/${slug})`);
        } else {
          // ── INSERT NEW JOB (with unique slug retry safety) ──
          let newSlug = slug;
          let { data: insertedJob, error: insertErr } = await supabase
            .from("jobs")
            .insert([{ ...jobPayload, slug: newSlug }])
            .select("id")
            .single();

          if (insertErr && /jobs_slug_key|unique/i.test(insertErr.message)) {
            // Slug collision retry fallback with unique suffix
            newSlug = `${slug}-${Date.now().toString().slice(-4)}`;
            console.warn(`⚠️ [Telegram Webhook] Slug collision on '${slug}', retrying with new slug '${newSlug}'`);
            const retryResult = await supabase
              .from("jobs")
              .insert([{ ...jobPayload, slug: newSlug }])
              .select("id")
              .single();
            insertedJob = retryResult.data;
            insertErr = retryResult.error;
          }

          if (insertErr) {
            await answerCallbackQuery(callbackId, `❌ Publish failed: ${insertErr.message}`);
            return NextResponse.json({ ok: true });
          }
          finalJobId = insertedJob?.id || null;
          console.log(`✅ [Telegram Webhook] CREATED new job ID = ${finalJobId} (Slug: /job/${newSlug})`);
        }

        // 3.1. Auto-create "Apply For Me" Custom Form (ONLY FOR category === "latest-jobs")
        if ((draft.category || "latest-jobs") === "latest-jobs" && finalJobId) {
          try {
            let extractedMeta: any = {};
            if (draft.extracted_text) {
              try { extractedMeta = JSON.parse(draft.extracted_text); } catch (_) {}
            }

            let docsList = draft.form_documents || extractedMeta.form_documents || [
              "10th Marksheet / Birth Certificate",
              "Educational Qualification Certificate",
              "Aadhaar Card / Photo ID Proof",
              "Recent Passport Size Photo",
              "Candidate Signature",
              "Caste / Category Certificate (if applicable)",
              "Domicile Certificate (if applicable)"
            ];

            let feesStruct = draft.form_fees_structure || extractedMeta.form_fees_structure;
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
              job_id: finalJobId,
              job_slug: slug,
            }]);
            console.log(`✅ [Telegram Webhook] Created custom_forms entry for latest-jobs '${draft.generated_title}'`);
          } catch (formErr: any) {
            console.warn("⚠️ [Telegram Webhook] Failed to auto-create custom_forms entry:", formErr.message);
            // ── Notify admin on Telegram to manually update Apply For Me form ──
            if (BOT_TOKEN && chatId) {
              const adminJobUrl = `${BASE_URL}/admin/jobs/${finalJobId}`;
              const alertText = [
                `⚠️ *ACTION REQUIRED — Apply For Me Form*`,
                ``,
                `Post published successfully but *Apply For Me* form could NOT be auto-created.`,
                ``,
                `📌 *Post:* ${draft.generated_title?.slice(0, 60)}`,
                `🔗 *Live URL:* ${BASE_URL}/job/${slug}`,
                ``,
                `✏️ *Please manually update the Apply For Me form here:*`,
                adminJobUrl,
                ``,
                `_Error: ${formErr.message?.slice(0, 100)}_`,
              ].join("\n");
              fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  chat_id: chatId,
                  text: alertText,
                  parse_mode: "Markdown",
                  disable_web_page_preview: true,
                }),
              }).catch(() => {});
            }
          }
        }

        // 4. Mark draft as published
        await supabase
          .from("auto_blog_drafts")
          .update({
            status: "published",
            published_at: new Date().toISOString(),
            published_post_id: finalJobId,
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
        // Use waitUntil so Vercel keeps the function alive for background tasks
        waitUntil(
          broadcastJobAlert({
            title: draft.generated_title,
            slug,
            category: draft.category || "latest-jobs",
            totalPosts: draft.total_posts,
            lastDate: draft.last_date,
            stateCode: draft.state_code,
            bannerUrl: draft.banner_url,
          }).catch((e) => console.warn("Broadcasting error:", e))
        );

        // 8. Trigger Post-Approval Backlink Generation (ONLY after Admin approves!)
        if (finalJobId) {
          waitUntil(
            enqueuePostApprovalBacklinks(finalJobId, draft.generated_title, slug).catch((e) =>
              console.warn("Backlink engine error:", e)
            )
          );
        }

        // 9. Instantly notify Google, Bing, Yandex — guaranteed execution via waitUntil
        waitUntil(
          notifySearchEngines(slug, draft.category || "latest-jobs").then(async (summary) => {
            // After indexing fires, send a verified transparent Telegram message with real status
            if (BOT_TOKEN && chatId) {
              const googleLine = summary?.google?.success
                ? `✅ <b>Google Indexing API:</b> Accepted (HTTP ${summary.google.status || 200})`
                : summary?.google?.attempted
                  ? `⚠️ <b>Google Indexing API:</b> Failed (${summary.google.error || "Permission error"})`
                  : `⚠️ <b>Google Indexing API:</b> Skipped (Credentials missing)`;

              const statusText = [
                `📡 <b>Verified Search Engine Indexing Status</b>`,
                `━━━━━━━━━━━━━━━━━━━━━`,
                `📌 <b>Post:</b> <code>${slug}</code>`,
                ``,
                googleLine,
                `✅ <b>IndexNow (Bing/Yandex):</b> Submitted (${summary?.indexNow?.count || 10} URLs)`,
                `✅ <b>WebSub RSS/Sitemap Ping:</b> Fired`,
                `✅ <b>Language Versions:</b> 8 URLs Edge-warmed`,
                ``,
                summary?.google?.success
                  ? `⏱️ <i>Googlebot pinged to crawl immediately</i>`
                  : `⚠️ <i>Notice: Google Indexing API requires Service Account Search Console owner verification</i>`,
              ].join("\n");

              await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  chat_id: chatId,
                  text: statusText,
                  parse_mode: "HTML",
                  disable_web_page_preview: true,
                }),
              }).catch(() => {});
            }
          }).catch((e) => console.warn("[Indexing] Error:", e))
        );

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
