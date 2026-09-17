const { createClient } = require("@supabase/supabase-js");
require("dotenv").config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const BASE_URL = "https://www.rojgarsuvidha.com";

async function main() {
  console.log("🚀 Starting bulk publish of pending drafts (Sep 15 onwards)...");

  // Fetch pending drafts
  const { data: drafts, error } = await supabase
    .from("auto_blog_drafts")
    .select("*")
    .eq("status", "pending_review")
    .gte("scraped_at", "2026-09-15T00:00:00Z")
    .order("scraped_at", { ascending: false });

  if (error || !drafts) {
    console.error("❌ Failed to fetch drafts:", error);
    process.exit(1);
  }

  console.log(`📋 Found ${drafts.length} pending drafts to evaluate.`);

  let publishedCount = 0;
  let skippedCount = 0;
  let errorCount = 0;

  for (let i = 0; i < drafts.length; i++) {
    const draft = drafts[i];
    const title = draft.generated_title;
    const slug = draft.generated_slug;
    const html = draft.generated_html;
    const category = draft.category || "latest-jobs";
    const stateCode = draft.state_code || null;
    const metaDesc = draft.generated_meta || draft.short_description || "";
    const shortInfo = draft.short_description || metaDesc;
    const tag = draft.generated_tags?.[0] || "Rojgar Suvidha";

    if (!title || !slug || !html || html.length < 400) {
      console.log(`⚠️ Skipping draft ID ${draft.id}: Incomplete content`);
      skippedCount++;
      continue;
    }

    // Check if job with this slug already exists in `jobs`
    const { data: existingJob } = await supabase
      .from("jobs")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();

    if (existingJob) {
      // Mark as published in draft table so it's not pending
      await supabase
        .from("auto_blog_drafts")
        .update({
          status: "published",
          published_at: new Date().toISOString(),
          published_post_id: existingJob.id,
        })
        .eq("id", draft.id);

      skippedCount++;
      continue;
    }

    // Prepare links array
    const linksArray = [];
    if (draft.apply_link) {
      linksArray.push({ label: "Apply Online", url: draft.apply_link });
    }
    if (draft.notification_link) {
      linksArray.push({ label: "Download Official Notification", url: draft.notification_link });
    }
    if (draft.official_link) {
      linksArray.push({ label: "Official Website", url: draft.official_link });
    }

    // Generate clean branded OG banner URL
    const postMatch = (title + " " + shortInfo).match(/(\d[\d,]*)\s*(?:posts?|vacanc(?:y|ies))/i);
    const postsCount = postMatch ? postMatch[1] : "";
    const bannerUrl = `${BASE_URL}/api/og/banner?title=${encodeURIComponent(title)}&category=${encodeURIComponent(category)}&posts=${encodeURIComponent(postsCount)}&state=${encodeURIComponent(stateCode || "")}`;

    // Format clean blog HTML (clean up any leftover top h1)
    const cleanHtml = html
      .replace(/<h1(\s[^>]*)?>/g, (_m, a) => `<h2${a || ""}>`)
      .replace(/<\/h1>/gi, "</h2>");

    const jobPayload = {
      title,
      slug,
      blog_content: cleanHtml,
      short_info: shortInfo,
      meta_description: metaDesc,
      tag,
      category,
      state_code: stateCode,
      banner_url: bannerUrl,
      status: "active",
      links: linksArray.length > 0 ? linksArray : null,
      important_dates: draft.important_dates || null,
      created_at: draft.scraped_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data: inserted, error: insertError } = await supabase
      .from("jobs")
      .insert([jobPayload])
      .select("id")
      .single();

    if (insertError) {
      console.error(`❌ Insert failed for '${title.slice(0, 40)}': ${insertError.message}`);
      errorCount++;
      continue;
    }

    // Update draft status
    await supabase
      .from("auto_blog_drafts")
      .update({
        status: "published",
        published_at: new Date().toISOString(),
        published_post_id: inserted.id,
      })
      .eq("id", draft.id);

    publishedCount++;
    console.log(`✅ [${publishedCount}/${drafts.length}] Published: "${title.slice(0, 50)}..." (/job/${slug})`);
  }

  console.log("\n==========================================");
  console.log(`🎉 COMPLETED!`);
  console.log(`✅ Successfully published: ${publishedCount} new posts`);
  console.log(`⏩ Already existing / skipped: ${skippedCount}`);
  console.log(`❌ Errors: ${errorCount}`);
  console.log("==========================================");
}

main().catch(console.error);
