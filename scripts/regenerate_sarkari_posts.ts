// @ts-nocheck
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { createClient } from "@supabase/supabase-js";
import { forceProcessSpecificItem } from "../src/lib/auto-blog-scraper";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

const POSTS = [
  {
    title: "Bank of Baroda Local Bank Officer LBO Online Form 2026 for 2482 Post - sarkariresult.com",
    link: "https://news.google.com/rss/articles/CBMiXkFVX3lxTE5vQzZpd0h5RW55VjhiMkZSUHpPWjVVYVdUbVdVcEpPczhWVG9lbHo1YThfZ253QWx1U1lTbjJYRWQtYTY2RFVxSW5VbzBRZGVQX0RjakcyVk9NcHdiZUE?oc=5",
    source: "sarkariresult",
    forcedCategory: "latest-jobs" as const,
  },
  {
    title: "UPSSSC Computer Operator Online Form 2026 - sarkariresult.com",
    link: "https://news.google.com/rss/articles/CBMidkFVX3lxTE9NSDFzcW83cXRCbEE5WllReFdZNVJCYUE0bVhHLWY2MV81S3dfcGc5cnh2b1FjbURmekNRaTFTNVdyNGRlOEZWemxJNUU3Y3VBSTJiVzh3WjhRUkxnNVJWMERwSWVWRzFtbGFPWWFuVE8zRzdhLUE?oc=5",
    source: "sarkariresult",
    forcedCategory: "latest-jobs" as const,
  },
  {
    title: "SSC 10+2 CHSL Online Form 2026 for 2536 Post - sarkariresult.com",
    link: "https://news.google.com/rss/articles/CBMiY0FVX3lxTE5CNmktakg3ZlVVOG5RXzlTRWZ2dmNpRUJHek5mNk5vdGp5d2kzS0Jic3dBd3JXMEYtM3A5U0VtWjBnT3BrT05oWUxaM21udUJTOFl1YTFYbTBsNF9ic0NnYWNWbw?oc=5",
    source: "sarkariresult",
    forcedCategory: "latest-jobs" as const,
  },
  {
    title: "Rajasthan State Eligibility Test SET Admit Card 2026 - sarkariresult.com",
    link: "https://news.google.com/rss/articles/CBMiY0FVX3lxTE96c0hBWTNiOEJCWElmQmFrclNaNmlBSXcyZFBYdjVRbGFGQU5NRll6SlppWjFWZVcxcFdQSFpDc2N0LTNtWU0tcTc2SmU4S0wwQThTUC1WXzhFeGpEdUVZaDdCOA?oc=5",
    source: "sarkariresult",
    forcedCategory: "admit-card" as const,
  },
];

async function main() {
  console.log("🧹 Step 1: Cleaning up incorrect drafts and wrong published posts...");

  // 1. Delete old wrongly categorized drafts
  const oldDraftIds = [
    "f199920f-a151-4412-8b73-98187069f3b5",
    "edaecb10-2fd3-49a9-bd42-29bfbe123714",
    "de23e746-ba8d-4d73-91ed-0e7a5fce66e6",
    "f00f412a-8bfe-4284-a56a-301ccca0f165",
  ];
  await supabase.from("auto_blog_drafts").delete().in("id", oldDraftIds);
  console.log("   ✅ Removed old misclassified drafts");

  // 2. Remove wrong published posts from jobs table so fresh correct versions take over
  const wrongJobIds = [
    "4f9a6a51-ffe8-4d0a-9759-e4650d7f79a9", // SSC CHSL Result (actually Latest Job)
    "f7bdab67-acf4-44f2-ad29-0fdf6846976c", // Rajasthan SET Result (actually Admit Card)
  ];
  await supabase.from("jobs").delete().in("id", wrongJobIds);
  console.log("   ✅ Removed wrong published job entries");

  // 3. Clear from scraped_urls_log
  const urls = POSTS.map((p) => p.link);
  await supabase.from("scraped_urls_log").delete().in("url", urls);
  console.log("   ✅ Cleared scraped_urls_log for fresh re-crawl");

  console.log("\n🚀 Step 2: Regenerating high-quality blog drafts and sending to Telegram...");

  for (let i = 0; i < POSTS.length; i++) {
    const post = POSTS[i];
    console.log(`\n─────────────────────────────────────────────────────────────`);
    console.log(`[${i + 1}/${POSTS.length}] Processing: ${post.title}`);
    console.log(`Category: ${post.forcedCategory}`);
    const res = await forceProcessSpecificItem(post);
    if (res.success) {
      console.log(`🎉 SUCCESS: Draft ID = ${res.draftId} | Title = ${res.title} | Category = ${res.category}`);
    } else {
      console.error(`❌ FAILED: ${res.error}`);
    }
    // Small pause between Gemini calls
    await new Promise((r) => setTimeout(r, 3000));
  }

  console.log("\n🏁 All posts re-generated and sent to Telegram with 1-click Approve buttons!");
}

main().catch(console.error);
