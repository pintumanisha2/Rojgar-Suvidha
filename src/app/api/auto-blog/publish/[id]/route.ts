import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { broadcastJobAlert } from "@/lib/social-publisher";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * POST /api/auto-blog/publish/[id]
 * Publishes a pending draft to the jobs table (same as AI Writer does)
 * Also triggers: translation, IndexNow, push notification
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    // 1. Fetch the draft
    const { data: draft, error: fetchError } = await supabase
      .from("auto_blog_drafts")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchError || !draft) {
      return NextResponse.json(
        { error: "Draft not found" },
        { status: 404 }
      );
    }

    if (draft.status === "published") {
      return NextResponse.json(
        { error: "Already published" },
        { status: 400 }
      );
    }

    // 2. Parse optional overrides from request body
    const body = await request.json().catch(() => ({}));
    const {
      title = draft.generated_title,
      slug = draft.generated_slug,
      metaDesc = draft.generated_meta,
      html = draft.generated_html,
      category = draft.category,
      stateCode = draft.state_code,
      applyLink = draft.apply_link,
      officialLink = draft.official_link,
      notificationLink = draft.notification_link,
      lastDate = draft.last_date,
      totalPosts = draft.total_posts,
      appFeeGen = draft.app_fee_gen,
      bannerUrl = draft.banner_url,
      postStatus = "active",
    } = body;

    // Construct structured links JSON array expected by /job/[slug] frontend
    const linksArray: any[] = [];
    if (applyLink) {
      linksArray.push({ label: "Apply Online", url: applyLink });
    }
    if (notificationLink) {
      linksArray.push({ label: "Download Official Notification", url: notificationLink });
    }
    if (officialLink) {
      linksArray.push({ label: "Official Website", url: officialLink });
    }

    // 3. Insert into jobs table (same schema as AI Writer uses)
    const jobPayload: any = {
      title,
      slug,
      blog_content: (html || "").replace(/<h1(\s[^>]*)?>/g, (_m: string, a: string) => `<h2${a || ""}>` ).replace(/<\/h1>/gi, "</h2>"),
      short_info: draft.short_description || metaDesc,
      meta_description: metaDesc,
      tag: draft.generated_tags?.[0] || null,
      category,
      state_code: stateCode || null,
      banner_url: bannerUrl || null,
      status: postStatus,
      links: linksArray.length > 0 ? linksArray : (applyLink ? applyLink : null),
      important_dates: draft.important_dates || null,
      created_at: new Date().toISOString(),
    };

    const { data: insertedJob, error: insertError } = await supabase
      .from("jobs")
      .insert([jobPayload])
      .select("id")
      .single();

    if (insertError) throw new Error(`DB insert: ${insertError.message}`);

    const newJobId = insertedJob.id;

    // 3.1. Auto-create "Apply For Me" Custom Form (ONLY FOR category === "latest-jobs")
    if (category === "latest-jobs" && newJobId) {
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
              postName: `${title} (General / OBC / EWS)`,
              fees: { genFee: draft.app_fee_gen || "100", scFee: "0", serviceCharge: "99" }
            },
            {
              postName: `${title} (SC / ST / Female)`,
              fees: { genFee: "0", scFee: draft.app_fee_res || "0", serviceCharge: "99" }
            }
          ];
        } else if (typeof feesStruct === "string") {
          try { feesStruct = JSON.parse(feesStruct); } catch (_) {}
        }

        await supabase.from("custom_forms").insert([{
          title: `${title} Application Form 2026`,
          documents: docsList,
          fees_structure: feesStruct,
          status: "active",
          job_id: newJobId,
          job_slug: slug,
        }]);
        console.log(`✅ [Auto Form Generator] Created custom_forms entry for latest-jobs '${title}'`);
      } catch (formErr: any) {
        console.warn("⚠️ [Auto Form Generator] Failed to auto-create custom_forms entry:", formErr.message);
        // ── Notify admin on Telegram to manually update Apply For Me form ──
        const tgToken = process.env.TELEGRAM_BOT_TOKEN;
        const tgChat = process.env.TELEGRAM_CHAT_ID;
        if (tgToken && tgChat) {
          const adminJobUrl = `${process.env.NEXT_PUBLIC_BASE_URL || "https://www.rojgarsuvidha.com"}/admin/jobs/${newJobId}`;
          const alertText = [
            `⚠️ *ACTION REQUIRED — Apply For Me Form*`,
            ``,
            `Post "${title?.slice(0, 60)}" published successfully!`,
            `But *Apply For Me* form could NOT be auto-created.`,
            ``,
            `✏️ *Manually update here:*`,
            adminJobUrl,
            ``,
            `_Error: ${formErr.message?.slice(0, 100)}_`,
          ].join("\n");
          fetch(`https://api.telegram.org/bot${tgToken}/sendMessage`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              chat_id: tgChat,
              text: alertText,
              parse_mode: "Markdown",
              disable_web_page_preview: true,
            }),
          }).catch(() => {});
        }
      }
    }

    // 4. Update draft status to published
    await supabase
      .from("auto_blog_drafts")
      .update({
        status: "published",
        published_at: new Date().toISOString(),
        published_post_id: newJobId,
      })
      .eq("id", id);

    // 5. Auto-translation (background, non-blocking)
    if (postStatus === "active" && newJobId) {
      fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ""}/api/admin/translate-blog`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId: newJobId }),
      }).catch((e) => console.warn("Auto-translation failed:", e));
    }

    // 6. Full instant indexing — all 5 methods (IndexNow + Google Indexing API + Sitemap + PubSub)
    // Fires in background — does NOT block publish response
    if (postStatus === "active") {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://www.rojgarsuvidha.com";
      fetch(`${baseUrl}/api/admin/index-now`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // Pass slug + category so all 5 indexing methods fire correctly
        body: JSON.stringify({ slug, category }),
      }).catch((e) => console.warn("Instant indexing fire failed:", e));
    }

    // 7. Push notification (background)
    if (postStatus === "active") {
      fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ""}/api/push`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "category-broadcast",
          payload: {
            title: `नई अपडेट: ${title}`,
            body: draft.short_description || metaDesc || "Latest update on Rojgar Suvidha",
            url: `/job/${slug}`,
            icon: "/logo-blue.png",
            category: draft.category,
          },
        }),
      }).catch((e) => console.error("Push notification failed:", e));
    }

    // 8. Social Channel Broadcasting (Telegram Channel & WhatsApp Group Auto-Poster)
    // Rule: EXCLUDE category 'news' from auto-posting to social groups/channels
    if (postStatus === "active") {
      broadcastJobAlert({
        title,
        slug,
        category,
        totalPosts: totalPosts || draft.total_posts || null,
        lastDate: lastDate || draft.last_date || null,
        stateCode: stateCode || draft.state_code || null,
        bannerUrl: bannerUrl || draft.banner_url || null,
      }).catch((e) => console.warn("Social broadcasting error:", e));
    }

    return NextResponse.json({
      success: true,
      jobId: newJobId,
      slug,
      url: `/job/${slug}`,
    });
  } catch (error: any) {
    console.error("Publish error:", error);
    return NextResponse.json(
      { error: error.message || "Publish failed" },
      { status: 500 }
    );
  }
}
