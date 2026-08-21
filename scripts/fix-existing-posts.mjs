/**
 * fix-existing-posts.mjs
 * One-time cleanup of all existing posts:
 *  1. Strip <h1> → convert to <h2>
 *  2. Remove "Sarkari Result" / "FreeJobAlert" brand names
 *  3. Fix wrong categories (6 known mismatches)
 *  4. Generate short_info if missing
 *  5. Generate meta_description if missing
 *  6. Fix AI phrases (Furthermore, Additionally, etc.)
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load .env.local
const envPath = resolve(__dirname, "../.env.local");
const envContent = readFileSync(envPath, "utf-8");
for (const line of envContent.split("\n")) {
  const [key, ...rest] = line.split("=");
  if (key && rest.length) process.env[key.trim()] = rest.join("=").trim().replace(/^["']|["']$/g, "");
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// ── Known category fixes (from audit) ────────────────────────────────────────
const CATEGORY_FIXES = {
  "neet-ug-counselling-2026-round-1-result-date-revised": "results",
  "neet-ug-2026-counselling-round-1-result-date-postponed-new-schedule": "results",
  "hngu-non-teaching-answer-key-2026-out-download-final-key": "answer-key",
  "ssj-university-answer-key-2026-national-bird-error-fixed": "answer-key",
  "ssc-chsl-result-2026-out-3515-candidates-shortlisted": "results",
  "ugc-net-2026-cutoff-for-hindi-education-law": "results",
};

// ── Strip H1 → H2 ────────────────────────────────────────────────────────────
function stripH1(html) {
  if (!html) return html;
  return html
    .replace(/<h1(\s[^>]*)?>/gi, "<h2>")
    .replace(/<\/h1>/gi, "</h2>");
}

// ── Remove competitor brands ──────────────────────────────────────────────────
function cleanBrands(text) {
  if (!text) return text;
  return text
    .replace(/\bSarkari Result(?:\.com)?\b/gi, "Rojgar Suvidha")
    .replace(/\bFree ?Job ?Alert(?:\.com)?\b/gi, "Rojgar Suvidha")
    .replace(/\bNDTV Education\b/gi, "Rojgar Suvidha News Desk")
    .replace(/\bNDTV(?:\.com)?\b/gi, "Rojgar Suvidha")
    .replace(/\bCareers360(?:\.com)?\b/gi, "Rojgar Suvidha")
    .replace(/\bJagran Josh(?:\.com)?\b/gi, "Rojgar Suvidha")
    .replace(/Copyright\s*©?\s*(?:sarkari result|freejobalert)[^\n]*/gi, "");
}

// ── Remove AI template phrases ────────────────────────────────────────────────
function cleanAIPhrases(html) {
  if (!html) return html;
  return html
    .replace(/Furthermore,\s*/gi, "")
    .replace(/Additionally,\s*/gi, "")
    .replace(/Moreover,\s*/gi, "")
    .replace(/In conclusion,\s*/gi, "")
    .replace(/In summary,\s*/gi, "")
    .replace(/To summarize,\s*/gi, "")
    .replace(/It is important to note that\s*/gi, "")
    .replace(/It should be noted that\s*/gi, "")
    .replace(/it is worth (?:mentioning|noting) that\s*/gi, "")
    .replace(/This article will explore\s*/gi, "")
    .replace(/Without further ado[,.]?\s*/gi, "")
    .replace(/As a language model[^.]*\.\s*/gi, "")
    .replace(/As an AI[^.]*\.\s*/gi, "");
}

// ── Generate short info from title if missing ─────────────────────────────────
function makeShortInfo(title, category) {
  const catLabel = {
    "results": "Result",
    "admit-card": "Admit Card",
    "answer-key": "Answer Key",
    "latest-jobs": "Recruitment Notification",
    "news": "Update",
    "admission": "Admission",
  }[category] || "Update";

  return `Latest ${catLabel} update: ${title}. Check complete details, download links, and all important information on Rojgar Suvidha.`;
}

// ── Generate meta description if missing ─────────────────────────────────────
function makeMetaDesc(title, category) {
  const catLabel = {
    "results": "Result out | Download scorecard, check cut-off & merit list",
    "admit-card": "Admit Card released | Download hall ticket, check exam date & centre",
    "answer-key": "Answer Key released | Download PDF, raise objection online",
    "latest-jobs": "Apply online | Check vacancy, eligibility, fee & last date",
    "news": "Latest update | Complete details and impact analysis",
    "admission": "Admission open | Check counselling schedule and seat allotment",
  }[category] || "Check complete details";

  return `${title} — ${catLabel}. Full information on Rojgar Suvidha. Updated ${new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}.`;
}

// ── MAIN ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log("\n═══════════════════════════════════════════════════════");
  console.log("  FIX EXISTING POSTS — Cleaning all posts in database");
  console.log("═══════════════════════════════════════════════════════\n");

  const { data: posts, error } = await supabase
    .from("jobs")
    .select("id, slug, title, category, blog_content, meta_description, short_info")
    .order("created_at", { ascending: false });

  if (error) { console.error("DB Error:", error); process.exit(1); }

  console.log(`📋 Total posts to fix: ${posts.length}\n`);

  let fixed = 0, skipped = 0;

  for (const post of posts) {
    const issues = [];
    const updates = {};

    // 1. Fix H1 in blog_content
    if (post.blog_content?.includes("<h1")) {
      updates.blog_content = updates.blog_content || post.blog_content;
      updates.blog_content = stripH1(updates.blog_content);
      issues.push("H1→H2");
    }

    // 2. Fix competitor brand names
    const brandInContent = /sarkari result|freejobalert|free job alert|ndtv\.com|careers360|jagran josh/i.test(post.blog_content || "");
    if (brandInContent) {
      updates.blog_content = cleanBrands(updates.blog_content || post.blog_content);
      issues.push("brand-clean");
    }

    // 3. Fix AI phrases
    const aiPhrases = /furthermore,|additionally,|moreover,|in conclusion,|it is important to note|as a language model|as an ai/i.test(post.blog_content || "");
    if (aiPhrases) {
      updates.blog_content = cleanAIPhrases(updates.blog_content || post.blog_content);
      issues.push("ai-phrases");
    }

    // 4. Fix wrong category
    const correctCat = CATEGORY_FIXES[post.slug];
    if (correctCat && correctCat !== post.category) {
      updates.category = correctCat;
      issues.push(`cat:${post.category}→${correctCat}`);
    }

    // 5. Fix missing short_info
    if (!post.short_info || post.short_info.length < 30) {
      updates.short_info = makeShortInfo(post.title, updates.category || post.category);
      issues.push("short-info");
    }

    // 6. Fix missing meta_description
    if (!post.meta_description || post.meta_description.length < 50) {
      updates.meta_description = makeMetaDesc(post.title, updates.category || post.category);
      issues.push("meta-desc");
    }

    if (Object.keys(updates).length === 0) {
      console.log(`  ✅ [OK] ${post.slug.slice(0, 50)}`);
      skipped++;
      continue;
    }

    // Apply updates
    const { error: updateError } = await supabase
      .from("jobs")
      .update(updates)
      .eq("id", post.id);

    if (updateError) {
      console.error(`  ❌ FAILED: ${post.slug.slice(0, 40)} — ${updateError.message}`);
    } else {
      console.log(`  🔧 [FIX] ${post.slug.slice(0, 50)}`);
      console.log(`         Fixed: ${issues.join(", ")}`);
      fixed++;
    }

    // Small delay to avoid rate limits
    await new Promise(r => setTimeout(r, 100));
  }

  console.log(`\n═══════════════════════════════════════════════════════`);
  console.log(`  DONE! Fixed: ${fixed} | Already OK: ${skipped} | Total: ${posts.length}`);
  console.log(`═══════════════════════════════════════════════════════\n`);
}

main().catch(console.error);
