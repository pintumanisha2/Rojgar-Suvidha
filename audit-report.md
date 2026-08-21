# 📄 Rojgar Suvidha — Automated Blog & SEO System Audit Report
**Date:** August 22, 2026 | **Project:** Rojgar Suvidha (Sarkari Job Portal) | **Status:** Codebase Audit & System Architecture Inspection

---

## Executive Summary
This document provides a comprehensive technical audit of the automated content crawling, AI generation, publishing workflow, technical SEO, E-E-A-T signals, and search engine compliance risk factors for **Rojgar Suvidha**. 

The system relies on a hybrid pipeline combining automated RSS/web scraping, Gemini 3.6/3.7 Flash AI generation with Groq 120B fallback, automated quality validation filters, human-in-the-loop Telegram approval workflows, and multi-engine instant indexing (Google Indexing API + IndexNow + PubSubHubbub).

---

## 1. Crawling & Scraping Logic

### 1.1 Sources & Frequency
- **Primary Source 1:** FreeJobAlert RSS Feed (`https://www.freejobalert.com/feed/`) — Scrapes government job notifications, admit cards, exam results, answer keys.
- **Primary Source 2:** NDTV Education Scraper (`https://www.ndtv.com/education`) — Scrapes education & exam news stories.
- **Execution Mechanism:** Triggered automatically via Vercel Cron every **30 minutes** at `/api/auto-blog/cron`.
- **Batch Processing Rate:** Each 30-minute cron cycle scans candidate items and selects at most **1 new job post + 1 new news story** per run (max 2 items per run) to prevent AI quota exhaustion and maintain crawl budget pacing.

### 1.2 Fact Extraction vs. Copying
- The scraper fetches the target URL HTML using `fetchFullPage()`.
- It **does NOT** copy raw HTML or paragraphs into the final blog post.
- It uses regex extractors (`extractPageData()`) to isolate structured facts:
  - Total vacancy count (`totalPosts`)
  - Application deadlines (`lastDate`)
  - Application fees for General/OBC (`appFeeGen`) and SC/ST (`appFeeRes`)
  - Age limits & Educational qualification requirements
  - Official PDF notification links & official `.gov.in` / `.nic.in` portal links
  - Application window status (`open`, `coming_soon`, `closed`)

### 1.3 Duplicate Crawl Protection
- Every scraped URL is logged in Supabase database table `scraped_urls_log` with `url` as the primary key.
- Before processing any candidate item, the scraper checks `scraped_urls_log`. If a URL is already logged, it is skipped instantly.
- If a post fails quality validation or encounters an unrecoverable source error, the URL is saved to `scraped_urls_log` with a failure reason so the scraper will never waste API credits or time retrying the exact same broken source URL.

---

## 2. AI Content Generation Logic

### 2.1 AI Engine Pipeline
- **Primary Engine:** Google Gemini AI using **`gemini-3.6-flash`** & **`gemini-3.7-flash`** (with `gemini-3.5-flash` and `gemini-flash-latest` as dynamic fallbacks).
- **Secondary Fallback Engine:** Groq API using **`openai/gpt-oss-120b`** (120 Billion Parameter Model), `openai/gpt-oss-20b`, and `qwen/qwen3.6-27b` (activates automatically if all Gemini keys exceed daily quotas).

### 2.2 Complete System Instruction Prompt
Below is the exact system instruction prompt passed to Gemini / Groq in `src/lib/auto-blog-scraper.ts`:

```text
You are "SarkariLekhan AI" — India's most trusted Sarkari Naukri content writer for "Rojgar Suvidha". You have 12+ years of experience in government job notifications, exam analysis, and career guidance for Indian job seekers.

You follow Google's E-E-A-T guidelines strictly. Your mission: give candidates ACCURATE, COMPLETE, ACTIONABLE information they can rely on.

================================================================================
RULE 0C — ORIGINAL CONTENT ONLY (COPYRIGHT + GOOGLE DUPLICATE CONTENT RULE)
================================================================================
The "SOURCE CONTENT TO PROCESS" given to you at the end is REFERENCE ONLY.
It is scraped from third-party websites (FreeJobAlert, NDTV, official sites).

YOU MUST:
  - Extract FACTS only: vacancy count, last date, fee amount, eligibility, exam dates, links
  - Write EVERY SENTENCE yourself from scratch in Rojgar Suvidha's voice
  - Add your own analysis, context, tips, and guidance that the source doesn't have
  - Explain things in a way that helps the candidate — not just repeat what the source said

YOU MUST NEVER:
  - Copy any sentence from the source — not even partially
  - Paraphrase the source by just replacing a few words
  - Use the same structure/order of sections as the source
  - Paste any paragraph from the source into blogHtml

================================================================================
RULE 0 — ABSOLUTE EMOJI ZERO POLICY (OVERRIDES EVERYTHING)
================================================================================
DO NOT USE ANY EMOJI CHARACTER ANYWHERE IN THE blogHtml OUTPUT.
No emoji in headings. No emoji in buttons. No emoji in boxes. No emoji in FAQs. No emoji anywhere in blogHtml.

================================================================================
RULE 0B — NO AI SELF-REFERENCE PHRASES (AUTOMATIC REJECTION)
================================================================================
NEVER use any of these phrases (they reveal AI origin and trigger Google spam detection):
  - "as an AI", "as a language model", "I cannot", "I am unable to"
  - "as of my knowledge cutoff", "my training data"
  - "Furthermore,", "Additionally,", "Moreover,", "In conclusion,"
  - "It is important to note that", "It should be noted that"
  - "In summary,", "Overall,", "To summarize,"
  - "it is worth mentioning", "it is worth noting"

================================================================================
RULE 1 — NO H1 TAG IN blogHtml (CRITICAL FOR SEO)
================================================================================
DO NOT write any <h1> tag inside blogHtml.
The page template already has an <h1> with the job title.
Adding another <h1> in blogHtml creates duplicate H1 — Google ranking penalty.

Start blogHtml with the BYLINE paragraph, then the status box (h2), then content sections.
First heading inside blogHtml must always be <h2>, never <h1>.

================================================================================
RULE 2 — COMPETITOR BRAND PROTECTION
================================================================================
NEVER mention: FreeJobAlert, Free Job Alert, Sarkari Result .com, NDTV, Careers360, Jagran Josh, or any competitor.
ALWAYS use: "Rojgar Suvidha" as the brand name.
```

### 2.3 Prompt Philosophy & Content Mandates
- **Prompt Directive:** The prompt strictly enforces **"write original content using facts as reference"** (Rule 0C). It forbids verbatim copying or simple word substitution.
- **Word Count Targets per Category:**
  - `latest-jobs`: **Minimum 2,000 words**
  - `results`: **Minimum 1,800 words**
  - `admit-card`: **Minimum 1,600 words**
  - `answer-key`: **Minimum 1,500 words**
  - `admission`: **Minimum 1,800 words**
  - `news`: **Minimum 1,400 words**
- **Original Value-Added Sections (Not in source):**
  - **Preparation Strategy:** Subject breakdown (GK, Math, Reasoning, English), study timeline, paper pattern insights.
  - **Document Checklist:** Custom document requirements tailored to the specific post type.
  - **Next Stage Guide:** Steps to take after checking results/admit cards (DV procedure, medical requirements).
  - **Contextual FAQs:** Minimum 5–7 Q&A structured in JSON-LD FAQPage format.

---

## 3. Publishing Workflow & Duplicate Management

### 3.1 Workflow Architecture
1. **Cron Execution:** Every 30 mins, Vercel Cron calls `/api/auto-blog/cron`.
2. **Draft Generation:** Scraper generates draft and validates quality (`validateBlogQuality()`).
3. **Pending Review State:** Saved to Supabase table `auto_blog_drafts` with `status = "pending_review"`.
4. **Human-in-the-Loop Approval:** Sends an instant private Telegram notification to the Admin's phone with a **1-Click "Approve & Publish"** inline button.
5. **Publish Action:** Clicking "Approve" triggers `/api/auto-blog/publish/[id]`, inserting the post into the `jobs` database table.
6. **Instant Indexing Trigger:** Immediately notifies Googlebot via Google Indexing API, Bing/Yandex via IndexNow, and Google Discover via PubSubHubbub.

### 3.2 Current Publication Metrics
- **Active Published Posts (`jobs` table):** 40 published articles.
- **Historical Draft Log (`auto_blog_drafts` table):** 501 generated drafts.
- **Publishing Rate:** Controlled by admin approval (typically 2–8 posts/day).

### 3.3 Duplicate Title & Slug Prevention
- **Slug Generation:** `getUniqueSlug()` generates clean kebab-case slugs from post titles.
- **Database Uniqueness Enforcement:** Queries the `jobs` database table for existing slugs. If `ssc-mts-result-2026` exists, it appends `-1`, `-2`, etc.
- **Source URL Logging:** `scraped_urls_log` prevents the scraper from processing the same source link twice.

---

## 4. SEO & Technical Setup

### 4.1 Metadata Generation
- **Page Titles (`titleStr`):** Generated dynamically per post (≤60 characters), keeping the primary keyword at the beginning followed by `| Rojgar Suvidha`.
- **Meta Description:** Extracted from `meta_description` column (150–160 characters), starting with the primary keyword.
- **OpenGraph & Twitter Cards:** Configured in `src/app/job/[slug]/page.tsx` with dynamic 1200x630 visual banner previews, article publication times, and author tags.

### 4.2 Sitemap & Robots.txt Setup
- **Dynamic Sitemap (`/sitemap.xml`):** Generated by `src/app/sitemap.ts`. Maps all active jobs, state landing pages (`/state/up`, `/state/bh`), sector hubs (`/jobs/ssc`, `/jobs/railway`), and core static pages.
- **Sitemap Optimization:** Excludes private login pages (`/saved-jobs`, `/track-application`, `/dashboard`) to preserve crawl budget.
- **Robots.txt (`public/robots.txt`):** Explicitly allows all public search engine crawlers while disallowing `/admin/`, `/api/`, `/dashboard/`, `/saved-jobs/`, and `/track-application/`. Points directly to `https://www.rojgarsuvidha.com/sitemap.xml`.

### 4.3 Schema Markup (Structured Data)
Every post page dynamically renders full JSON-LD schemas:
- **`JobPosting` Schema:** Rendered for `latest-jobs` with `title`, `description`, `datePosted`, `validThrough`, `employmentType`, `hiringOrganization`, and `jobLocation`.
- **`Article` Schema:** Rendered for news & update posts with `headline`, `image`, `datePublished`, `dateModified`, and `author`.
- **`BreadcrumbList` Schema:** Breadcrumb hierarchy (`Home > Category > Post Title`).
- **`FAQPage` Schema:** Structured FAQ accordion Q&A.

### 4.4 Canonical Tags & URL Structure
- **URL Structure:** Clean keyword slugs at `https://www.rojgarsuvidha.com/job/[slug]`.
- **Canonical URL Tag:** Explicitly declared in page metadata:
  ```ts
  alternates: { canonical: `https://www.rojgarsuvidha.com/job/${slug}` }
  ```

### 4.5 Performance & Core Web Vitals Optimization
- **Caching Strategy:** Configured with Incremental Static Regeneration (`export const revalidate = 3600;` / 1 hour cache). Removed slow `force-dynamic` to eliminate server TTFB latency for Googlebot.
- **Banner Loading:** Native Graphic Designer Card fallback guarantees instant visual rendering without broken image boxes or layout shifts (CLS).

---

## 5. E-E-A-T Signals (Experience, Expertise, Authoritativeness, Trustworthiness)

### 5.1 Author Profile Rotation
- **Dynamic Desk Persona Engine (`selectAuthor()`):** Rotates across 5 distinct, specialized author profiles:
  - **Sunita Devi** (Senior Education & Recruitment Editor)
  - **Arjun Sharma** (Sarkari Exam & Cutoff Analyst)
  - **Priya Verma** (Career Guidance & Form Specialist)
  - **Rajesh Kumar** (Admit Card & Exam Schedule Desk)
  - **Anjali Gupta** (Results & Selection List Desk)
- **Author Bylines:** Displayed prominently at top and bottom of every post with author name, role title, published date, updated date, and reading time.

### 5.2 Publication & Freshness Timestamps
- Both `created_at` (Published Date) and `updated_at` (Modified Date) are rendered visually on the page and declared in OpenGraph & Article JSON-LD metadata.

### 5.3 Official Source Links & Transparency
- Every job post includes a verified **"Important Links"** block containing direct links to official government portals (`.gov.in`, `.nic.in`) and official PDF notifications.

### 5.4 Site-Wide Trust Pages
The workspace includes all essential Google Trust pages:
- `/about-us` — About Rojgar Suvidha team & editorial mission
- `/contact-us` — Official support details & contact form
- `/privacy` — Privacy policy compliant with IT rules
- `/terms` — Terms of service & usage conditions
- `/refund-policy` — Service charge refund guidelines
- `/complaint` — User grievance redresal desk

---

## 6. Risk Flags & Policy Compliance Matrix

| Risk Factor | Google Policy | Risk Level | Code Location | Current Safeguard & Status |
|---|---|---|---|---|
| **Scaled Content Abuse** | Google Spam Policy (Mass AI publishing without review) | 🟡 LOW | `src/app/api/auto-blog/publish/[id]/route.ts` | **SAFEGUARD ACTIVE:** System saves drafts as `pending_review` and requires explicit 1-click Admin Telegram approval before publishing. |
| **Scraped Content / Plagiarism** | Helpful Content System (Duplicate 6-gram phrase matching) | 🟢 SAFE | `src/lib/auto-blog-scraper.ts:L550-L569` | **SAFEGUARD ACTIVE:** `validateBlogQuality()` runs an N-gram phrase scanner against the raw source text. If >35 matching non-boilerplate 6-grams are found, post is automatically rejected. |
| **Thin / Low Word Count Content** | Google Helpful Content System (<400 words) | 🟢 SAFE | `src/lib/auto-blog-scraper.ts:L590` | **SAFEGUARD ACTIVE:** System enforces minimum word targets (1,400 to 2,000 words depending on category) and rejects thin output. |
| **Competitor Brand Leakage** | Copyright & Brand Confusion | 🟢 SAFE | `src/lib/auto-blog-scraper.ts:L505-L515` | **SAFEGUARD ACTIVE:** `cleanCompetitorBrands()` automatically strips third-party brand names (FreeJobAlert, NDTV, etc.) and replaces them with "Rojgar Suvidha". |
| **Duplicate H1 Penalty** | Technical SEO Standards | 🟢 SAFE | `src/lib/auto-blog-scraper.ts:L519-L525` | **SAFEGUARD ACTIVE:** `stripH1FromBlog()` converts any inner `<h1>` tags in AI HTML to `<h2>` to prevent duplicate H1 tags on page. |
| **Google Search Console Verification** | Search Console Integration | 🟠 ACTION REQ | `src/app/layout.tsx:L128` | **ACTION REQUIRED:** Ensure `sitemap.xml` is submitted in Search Console portal at [search.google.com/search-console](https://search.google.com/search-console). |

---

## 7. Recommended Next Steps for Maximum Ranking Growth

1. **Keep Telegram Approval Active:** Review and approve 3–6 high-priority job posts daily via your Telegram notifications.
2. **Submit Sitemap in Search Console:** Ensure `https://www.rojgarsuvidha.com/sitemap.xml` is submitted in your Google Search Console account.
3. **Monitor Indexing Status:** Check the **URL Inspection** tool in Search Console weekly to verify new posts are indexed within 24 hours.

---
*Report generated automatically by Codebase Inspection Tool for Rojgar Suvidha.*
