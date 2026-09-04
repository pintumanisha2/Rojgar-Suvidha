/**
 * ═══════════════════════════════════════════════════════════════════
 * UNIQUE CONTENT GENERATOR — PER PLATFORM (White-Hat SEO)
 * ═══════════════════════════════════════════════════════════════════
 * Generates unique, platform-specific content using Gemini AI.
 * Each platform gets different angle, format, and length.
 * 0% duplicate content across platforms = White-Hat SEO.
 *
 * Human-Writing Design:
 * - India-specific language and job seeker sensibility
 * - 3 random angles per platform — no two articles feel the same
 * - Explicit anti-AI instructions to avoid clichés
 * - Rich fallbacks (never just 1 generic line)
 */

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://www.rojgarsuvidha.com";

export type ContentPlatform =
  | "blogger"
  | "github"
  | "gitlab"
  | "wordpress"
  | "telegraph"
  | "devto"
  | "notion"
  | "livejournal"
  | "pastebin"
  | "gitbook";

interface ContentResult {
  title: string;
  body: string;
  plainText: string;
  tags?: string[];
}

import { callGeminiWithRotation } from "@/lib/gemini-rotator";

async function callGemini(prompt: string): Promise<string | null> {
  try {
    const text = await callGeminiWithRotation({
      prompt,
      temperature: 0.85,
      maxOutputTokens: 2048,
      timeoutMs: 15000,
    });
    return text?.trim() || null;
  } catch (err: any) {
    console.warn("⚠️ [Content Generator] Gemini rotator warning:", err?.message || err);
    return null;
  }
}

function randAngle(): number {
  return Math.floor(Math.random() * 3);
}

export async function generatePlatformContent(
  platform: ContentPlatform,
  title: string,
  slug: string
): Promise<ContentResult> {
  const jobUrl = `${BASE_URL}/job/${slug}`;
  const angle = randAngle();

  const antiAiInstruction = `

CRITICAL WRITING RULES (must follow strictly):
- Do NOT start with "In today's competitive world" or "In this fast-paced era"
- Do NOT use phrases like "golden opportunity", "exciting chance", "aspiring candidates"
- Do NOT write robotic bullet lists that feel copy-pasted from a notification
- Write like a knowledgeable Indian person sharing genuine, helpful information
- Use natural transitions — Indian English is fine ("crores of applicants" etc.)
- Vary sentence length — some short punchy sentences, some detailed ones
- Sound specific to THIS job, not generic to "government jobs in general"`;

  const bloggerAngles = [
    `You are an experienced career counselor who has helped thousands of SSC and state PSC aspirants across UP, Bihar, and Rajasthan. Write a 400-450 word HTML blog post about: "${title}". Angle: "Why THIS specific job matters for a 2026 job seeker — career stability, pension, and future scope". Structure: <h2> intro, <h3> subheadings, <ul><li> for key points, <p> for paragraphs. End with: <p>For official eligibility, vacancy breakdown and direct apply link, visit <a href="${jobUrl}" rel="nofollow ugc"><strong>Rojgar Suvidha — Official Notification</strong></a>.</p>. Return ONLY valid HTML, no markdown.`,
    `You are a popular Hindi-medium career blogger writing for government job aspirants. Write a 420-460 word HTML post about: "${title}". Angle: "A complete preparation roadmap — what to study, how competitive the exam is, timeline tips". Make it feel like advice from a senior who cleared a similar exam. Structure: <h2> opening, <h3> sections like "Vacancy Overview", "Selection Process", "How to Prepare". End with: <p>Check all official details and apply at <a href="${jobUrl}" rel="nofollow ugc"><strong>Rojgar Suvidha</strong></a>.</p>. Return ONLY valid HTML, no markdown.`,
    `You are writing for Rojgar Suvidha's blog, aimed at fresh graduates looking for their first government job. Write a 400-440 word HTML post about: "${title}". Angle: "First-time applicants guide — what documents to keep ready, how the online form works, common mistakes to avoid". Tone: Practical, warm, like a helpful elder sibling. Structure: <h2> heading, <h3> subheadings with practical tips. End: <p>For complete official notification and direct apply link — <a href="${jobUrl}" rel="nofollow ugc"><strong>Click Here: Rojgar Suvidha</strong></a>.</p>. Return ONLY valid HTML, no markdown.`,
  ];

  const githubAngles = [
    `Write a GitHub Gist README (Markdown) about: "${title}". Format: A developer-friendly reference card. Include: # Header, ## TL;DR (2-3 sentence summary), ## Quick Facts table (Organization | Post | Type | Mode), ## Application Steps (numbered), ## Official Resources: [Full Notification](${jobUrl}) | [Telegram](https://t.me/govermentform). Return ONLY Markdown.`,
    `Write a GitHub Gist README (Markdown) about: "${title}". Angle: "Opportunity analysis for educated youth in Tier-2/Tier-3 Indian cities". Tone: Analytical but human. Include: # Title, ## Why This Matters (2 paragraphs), ## Eligibility At A Glance (bullets), ## How To Apply (4 clear steps), ## Apply Now: [Rojgar Suvidha](${jobUrl}). Return ONLY Markdown.`,
    `Write a clean GitHub Gist reference document (Markdown) about: "${title}". Format: Like a well-maintained open-source project wiki page. Include: # Job Title with tagline, ## Overview (2 paragraphs with personality), ## Key Requirements (bullets), ## Application Process (numbered), ## Links: [Apply via Rojgar Suvidha](${jobUrl}). Return ONLY Markdown.`,
  ];

  const wordpressAngles = [
    `Write a 260-280 word WordPress blog post about: "${title}". Angle: "Complete step-by-step guide for candidates who have never applied for a government job online before". Tone: Simple, clear, encouraging. Use <p> tags only. End: <p>For complete details and direct apply link — visit <a href="${jobUrl}">Rojgar Suvidha here</a>.</p>. Return only HTML paragraphs.`,
    `Write a 250-280 word WordPress blog post about: "${title}". Angle: "Why skipping this recruitment could be a mistake — analysis of pay scale and career growth". Tone: Slightly urgent but factual, not clickbait. Use <p> and <strong> tags. End: <p>Check eligibility and apply at <a href="${jobUrl}">Rojgar Suvidha</a>.</p>. Return only HTML paragraphs.`,
    `Write a 260-290 word WordPress post about: "${title}". Angle: "Honest take — who SHOULD apply and who should not — eligibility reality check". Tone: Direct, honest, like advice from a frank friend. Use <p> tags. End: <p>Read the complete official notification at <a href="${jobUrl}">Rojgar Suvidha</a> and decide if this is right for you.</p>. Return only HTML paragraphs.`,
  ];

  const devtoAngles = [
    `Write a 310-340 word Dev.to article (Markdown) about: "${title}". Angle: "How India's digital transformation of government recruitment works in 2026 — OTR, document upload, fee gateways". Use this job as the example throughout. Use ## subheadings. End: "For the specific apply link: [Rojgar Suvidha](${jobUrl})". Return ONLY Markdown.`,
    `Write a 300-330 word Dev.to article (Markdown) about: "${title}". Angle: "Building a job application tracker — and why this recruitment is a good test case". A technical spin — mention parsing PDFs, tracking dates, building reminder bots. End: "Full details: [Rojgar Suvidha](${jobUrl})". Return ONLY Markdown.`,
    `Write a 320-350 word Dev.to article (Markdown) about: "${title}". Angle: "Open-source tools that can help Indian job seekers track opportunities like this one". Mention RSS feeds, notification APIs, Telegram bots. Use ## subheadings. End: "Check the official post: [Rojgar Suvidha](${jobUrl})". Return ONLY Markdown.`,
  ];

  const telegraphAngles = [
    `Write a 120-135 word urgent news alert for Telegra.ph about: "${title}". Style: Breaking news, concise, like a WhatsApp forward from a reliable source. Use <p> and <b> tags only. End: <p>📌 Full notification and apply link: <a href="${jobUrl}">Rojgar Suvidha</a></p>. Return ONLY short HTML.`,
    `Write a 125-140 word Telegra.ph update about: "${title}". Style: Like a quick update from an exam coaching center's Telegram channel. Mention key highlights in 2-3 short paragraphs. End: <p>🔗 Apply here: <a href="${jobUrl}">Rojgar Suvidha — Official Link</a></p>. Return ONLY short HTML.`,
    `Write a 115-130 word Telegra.ph alert about: "${title}". Style: Punchy, to-the-point. Like a trusted friend texting about a good opportunity. End: <p>💡 Check eligibility at <a href="${jobUrl}">Rojgar Suvidha</a>.</p>. Return ONLY short HTML with <p> and <b> tags.`,
  ];

  const notionAngles = [
    `Write a Notion-style Markdown knowledge base page about: "${title}". Include: # Title, > Summary callout (1-2 sentences with unique perspective), ## Eligibility Overview (brief bullets), ## Application Process (numbered), ## Resources: [Apply Online via Rojgar Suvidha](${jobUrl}). Return ONLY Markdown.`,
    `Write a Notion-style Markdown page about: "${title}". Format: "Should I apply?" decision framework. Include: # Opportunity Assessment, ## What is the opportunity?, ## Am I eligible? (checklist), ## What is the timeline?, ## Decision: [Check full details at Rojgar Suvidha](${jobUrl}). Return ONLY Markdown.`,
    `Write a Notion-style Markdown reference page about: "${title}". Format: Like a team wiki for a study group preparing together. Include: # Study Group Notes, ## Overview (unique angle on importance), ## What We Need to Prepare (bullets), ## Useful Links: [Official Notification via Rojgar Suvidha](${jobUrl}). Return ONLY Markdown.`,
  ];

  const livejournalAngles = [
    `Write a 155-175 word personal LiveJournal blog entry about: "${title}". Angle: A 24-year-old job aspirant sharing genuine excitement. First-person, conversational. Include a tiny personal detail like finding this while scrolling Rojgar Suvidha. End: <p>All the details and apply link are at <a href="${jobUrl}">Rojgar Suvidha</a> — check it out if you're in the same boat as me!</p>. Use <p> tags. Return ONLY HTML.`,
    `Write a 150-170 word LiveJournal entry about: "${title}". Angle: Someone who missed a similar government job last year shares this one with friends. First-person, natural, mention the fear of missing deadlines. End: <p>I found the full info at <a href="${jobUrl}">Rojgar Suvidha</a> — sharing because I wish someone had told me about these earlier.</p>. Return ONLY HTML with <p> tags.`,
    `Write a 160-180 word LiveJournal post about: "${title}". Angle: A career counselor sharing a tip with personal blog contacts. Warm, like advice from an older cousin who works in HR. End: <p>For the official notification and apply link, everything is at <a href="${jobUrl}">Rojgar Suvidha</a>.</p>. Return ONLY HTML with <p> tags.`,
  ];

  const pastebinAngles = [
    `Write a plain text note about: "${title}". Format: Like a WhatsApp message someone sends to their study group. Honest, direct, no fluff. 3-4 short paragraphs, under 180 words. Must feel like a real person wrote it. End: "Full official info and apply link: ${jobUrl}". Return ONLY plain text, no HTML, no Markdown, no symbols.`,
    `Write a plain text quick reference note about: "${title}". Format: Like handwritten notes from a coaching class — key points, what matters, what to do next. Keep under 180 words. Practical, no padding. End: "Apply and check everything at: ${jobUrl}". Return ONLY plain text.`,
    `Write a plain text advisory note about: "${title}". Format: Like advice from a friend who just found this opportunity while browsing. Mention who it suits, why bother applying, what is roughly needed. Under 200 words. End: "Full info: ${jobUrl}". Return ONLY plain text, conversational tone.`,
  ];

  const gitbookAngles = [
    `Write a GitBook Markdown documentation page about: "${title}". Format: Government recruitment reference guide. Include: # Title, ## Introduction (2 paragraphs — factual but with useful context), ## Eligibility Requirements (bullets), ## How to Apply (numbered), ## Official Links: [View Notification and Apply Online](${jobUrl}). Return ONLY Markdown.`,
    `Write a GitBook Markdown page about: "${title}". Angle: "Frequently Asked Questions about this Recruitment". Format: Q&A style — 5-6 realistic questions aspirants would actually ask (eligibility, fees, timeline, selection). End: "For the official notification PDF and apply link, visit: [Rojgar Suvidha](${jobUrl})". Return ONLY Markdown.`,
    `Write a GitBook Markdown reference page about: "${title}". Format: Concise technical documentation — clean, scannable, useful. Include: # Overview, ## At A Glance (table: Parameter | Details), ## Step-by-Step Application Guide, ## Resources: [Official Apply Link](${jobUrl}). Return ONLY Markdown.`,
  ];

  const gitlabAngles = [
    `Write a GitLab snippet README (Markdown) about: "${title}". Format: Like a well-written open-source job board entry. Tone: Factual but engaging. Include: # Header, ## About This Recruitment (2 paragraphs), ## Quick Reference Table, ## How to Apply (numbered), ## Apply: [Rojgar Suvidha](${jobUrl}). Return ONLY Markdown.`,
    `Write a GitLab README (Markdown) about: "${title}". Angle: "Community resource — helping Tier-2 city students access government job info". Tone: Inclusive, helpful, community-minded. Include: # Title, ## Why We Shared This, ## Who Can Apply (brief), ## Application Process, ## Official Info: [Rojgar Suvidha](${jobUrl}). Return ONLY Markdown.`,
    `Write a GitLab snippet description (Markdown) about: "${title}". Format: Clean, professional, readable — like a well-maintained internal wiki. Include: # Recruitment Notice, ## Summary (1 unique paragraph), ## Key Requirements (bullets), ## Apply: [Rojgar Suvidha Official Link](${jobUrl}). Return ONLY Markdown.`,
  ];

  const promptSets: Record<ContentPlatform, string[]> = {
    blogger: bloggerAngles,
    github: githubAngles,
    wordpress: wordpressAngles,
    devto: devtoAngles,
    telegraph: telegraphAngles,
    notion: notionAngles,
    livejournal: livejournalAngles,
    pastebin: pastebinAngles,
    gitbook: gitbookAngles,
    gitlab: gitlabAngles,
  };

  const selectedPrompt = promptSets[platform][angle] + antiAiInstruction;

  const isHtmlPlatform = ["blogger", "wordpress", "telegraph", "livejournal"].includes(platform);
  const isMarkdown = ["github", "gitlab", "devto", "notion", "gitbook"].includes(platform);

  let generatedBody: string | null = null;
  try {
    generatedBody = await callGemini(selectedPrompt);
  } catch {
    generatedBody = null;
  }

  const jobShortTitle = title.split(" ").slice(0, 6).join(" ");

  const fallbackHtml = `<h2>${jobShortTitle} — Recruitment 2026</h2>
<p>A fresh recruitment notification has been released that many government job aspirants have been waiting for. This is one of those opportunities where the pay scale, job stability, and career progression make it genuinely worth applying — especially if you meet the eligibility criteria.</p>
<p>Government jobs in India remain one of the most sought-after career paths, particularly for candidates from non-metro cities. This particular notification comes with decent vacancies and a structured selection process.</p>
<p>For the complete official notification, eligibility breakdown, application fee structure, and direct apply link — visit <a href="${jobUrl}" rel="nofollow ugc"><strong>Rojgar Suvidha — Official Details</strong></a>. Do not wait till the last day to apply.</p>
<p>📢 Follow <a href="https://t.me/govermentform">@govermentform on Telegram</a> for instant alerts when new notifications drop.</p>`;

  const fallbackMd = `# ${jobShortTitle} — 2026 Recruitment

A new government recruitment notification has been released. If you have been preparing for a stable government career, this is worth a serious look.

## What You Need to Know

This recruitment comes from a reputed organization and offers a structured selection process. The number of vacancies, combined with the official pay scale, makes it competitive but achievable for well-prepared candidates.

## How to Apply

1. Visit the official portal linked below
2. Register or log in with your OTR or existing credentials
3. Fill the application form carefully — double-check all details before submitting
4. Upload required documents (photo, signature, certificates)
5. Pay the application fee and submit before the deadline

## Official Notification and Apply Link

Full details and apply online: [Rojgar Suvidha](${jobUrl})

Telegram alerts: [Join @govermentform](https://t.me/govermentform)`;

  const fallbackPlain = `${jobShortTitle} — Government Recruitment 2026

If you have been looking for a solid government job opportunity, this one is worth checking out. The notification has been released with official vacancy details, eligibility criteria, and application process outlined clearly.

Don't wait too long — government job deadlines are strict and the last few days always see a surge in applications, which can cause form submission issues.

Key things to check: educational qualification, age limit, application fee for your category, and the selection process stages.

Full information and direct apply link: ${jobUrl}

For daily job alerts: t.me/govermentform`;

  const body = generatedBody ||
    (isHtmlPlatform ? fallbackHtml : isMarkdown ? fallbackMd : fallbackPlain);

  const titleSuffix = platform === "blogger" || platform === "wordpress"
    ? " — Sarkari Naukri 2026"
    : platform === "devto"
    ? " — Government Job Guide 2026"
    : "";

  const tags = platform === "devto"
    ? ["sarkari-naukri", "government-jobs", "india", "career", "recruitment2026"]
    : undefined;

  return {
    title: `${title}${titleSuffix}`,
    body,
    plainText: body.replace(/<[^>]+>/g, "").trim(),
    tags,
  };
}
