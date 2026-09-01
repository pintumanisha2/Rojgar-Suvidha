/**
 * ═══════════════════════════════════════════════════════════════════
 * UNIQUE CONTENT GENERATOR — PER PLATFORM (White-Hat SEO)
 * ═══════════════════════════════════════════════════════════════════
 * Generates unique, platform-specific content using Gemini AI.
 * Each platform gets different angle, format, and length.
 * 0% duplicate content across platforms = White-Hat SEO.
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
  body: string;         // HTML or Markdown depending on platform
  plainText: string;    // Plain text fallback
  tags?: string[];
}

function getGeminiKey(): string | undefined {
  return (
    process.env.GEMINI_API_KEY_1 ||
    process.env.GEMINI_API_KEY_2 ||
    process.env.GEMINI_API_KEY
  );
}

/**
 * Call Gemini Flash Lite to generate unique content
 */
async function callGemini(prompt: string): Promise<string | null> {
  const key = getGeminiKey();
  if (!key) return null;

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=${key}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
        signal: AbortSignal.timeout(25000),
      }
    );
    const data = await res.json();
    return data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || null;
  } catch {
    return null;
  }
}

/**
 * Generate unique content for a specific platform
 * Each platform gets a different angle, format, and length
 */
export async function generatePlatformContent(
  platform: ContentPlatform,
  title: string,
  slug: string
): Promise<ContentResult> {
  const jobUrl = `${BASE_URL}/job/${slug}`;

  // ─── PLATFORM-SPECIFIC PROMPTS ───────────────────────────────────

  const prompts: Record<ContentPlatform, string> = {

    // Blogger: Long-form HTML article (400-500 words) — Career advisor angle
    blogger: `You are an experienced career counselor writing for Indian government job aspirants.
Write a 400-450 word unique HTML blog post about this recruitment notification: "${title}".
Angle: "Why this is a golden opportunity for 2026 job seekers" — career impact, job security, scope.
Rules:
- Use <h2>, <h3>, <p>, <ul>, <li> HTML tags
- Do NOT copy notification text, write fresh unique content
- Mention eligibility naturally, not copied
- End with: <p>For complete eligibility, vacancy breakdown, and official application link, visit <a href="${jobUrl}" rel="nofollow ugc"><strong>Rojgar Suvidha — Official Notification</strong></a>.</p>
- Return ONLY valid HTML, no markdown`,

    // GitHub Gist: Clean Markdown table — Factual reference format
    github: `Write a clean GitHub Gist README in Markdown format for: "${title}".
Format: Professional job reference document.
Include:
- # Heading with job title
- ## Overview paragraph (2-3 sentences, unique angle: "what makes this job valuable")
- ## Quick Reference Table with columns: Field | Details (fill: Organization, Post Name, Vacancies, Category, Apply Mode)
- ## How to Apply (3-4 numbered steps — general government job process)
- ## Important Links section with this link: [Official Notification & Apply Online](${jobUrl})
- ## Tags line at bottom: #SarkariNaukri #GovernmentJobs #India2026
Return ONLY Markdown, no HTML`,

    // WordPress: Short article (250-300 words) — Informational angle
    wordpress: `Write a 250-280 word unique WordPress blog post about: "${title}".
Angle: "Complete guide for first-time government job applicants" — how to prepare, what documents needed.
Rules:
- Simple paragraphs only (<p> tags)
- Different angle from standard notifications — focus on preparation tips
- End with: <p>Check complete notification details and apply online at <a href="${jobUrl}">Rojgar Suvidha</a>.</p>
- Return only HTML paragraphs`,

    // Dev.to: Career/technical article with tags — Developer/technical angle
    devto: `Write a 300-350 word Dev.to article in Markdown about: "${title}".
Angle: "How to navigate India's government job application portal in 2026 — a step-by-step digital guide"
Rules:
- Use ## subheadings
- Include practical digital tips (how to fill online forms, document upload tips)
- Naturally mention this specific job as example
- End with: "For this specific opening, check [Rojgar Suvidha](${jobUrl}) for the official application link."
- Return ONLY Markdown`,

    // Telegra.ph: Short punchy summary (120-150 words) — Breaking news angle
    telegraph: `Write a 120-140 word short news-style summary for Telegra.ph about: "${title}".
Angle: Breaking news / urgent alert for job seekers.
Rules:
- Use HTML <p> and <b> tags only
- Punchy, urgent tone like a news alert
- Key details: who can apply, rough timeline (general)
- End with: <p>📌 Full details & apply link: <a href="${jobUrl}">Rojgar Suvidha</a></p>
- Return ONLY HTML, keep it SHORT`,

    // Notion: Structured documentation format
    notion: `Write clean Markdown structured documentation about: "${title}".
Format like a Notion knowledge base page.
Include:
- # Title
- Brief intro paragraph (unique: focus on "career growth potential")
- ## Eligibility Highlights (bullet list — general criteria)
- ## Application Process (numbered steps)
- ## Important Note (general advice for applicants)
- End: Apply and check details → [Rojgar Suvidha](${jobUrl})
Return ONLY Markdown`,

    // LiveJournal: Personal blog style (150-200 words) — Personal story angle
    livejournal: `Write a 150-180 word personal blog-style HTML post about: "${title}".
Angle: "A passionate job seeker sharing an exciting opportunity with friends"
Rules:
- First-person, friendly conversational tone
- Use <p> tags
- Genuine excitement about the opportunity
- End with: <p>I found all the details at <a href="${jobUrl}">Rojgar Suvidha</a> — check it out if you're interested!</p>
- Return ONLY HTML paragraphs`,

    // Pastebin: Plain text format — Quick reference sheet
    pastebin: `Write a plain text quick reference sheet (no HTML, no Markdown) about: "${title}".
Format like a text memo/note shared between friends.
Include:
- Job title and basic info (3-4 lines)  
- Why it's worth applying (2-3 unique points)
- Quick how-to-apply pointer
- End with: "Full notification: ${jobUrl}"
Return ONLY plain text, no formatting symbols`,

    // GitBook: Technical documentation style
    gitbook: `Write a GitBook documentation-style Markdown page about: "${title}".
Angle: Official guide / reference documentation format.
Include:
- # Page Title
- Introduction paragraph (professional, factual but unique)
- ## Key Details section (brief bullet list)
- ## Application Guide (step-by-step)
- ## Resources section with [Official Notification & Apply](${jobUrl})
Return ONLY Markdown`,

    // GitLab: README-style Markdown
    gitlab: `Write a GitLab snippet README in Markdown about: "${title}".
Format: Job opportunities tracker / reference document.
Include:
- # Header
- Short summary paragraph (unique angle: employer reputation, why apply)
- ## Details Table (role, organization, type, mode)
- ## Application Steps (numbered list)
- ## Official Link: [Apply on Rojgar Suvidha](${jobUrl})
Return ONLY Markdown`,
  };

  // ─── CALL GEMINI ────────────────────────────────────────────────
  const isHtmlPlatform = ["blogger", "wordpress", "telegraph", "livejournal"].includes(platform);
  const isMarkdown = ["github", "gitlab", "devto", "notion", "gitbook"].includes(platform);
  const isPlainText = platform === "pastebin";

  let generatedBody: string | null = null;

  try {
    generatedBody = await callGemini(prompts[platform]);
  } catch {
    generatedBody = null;
  }

  // ─── FALLBACK CONTENT ────────────────────────────────────────────
  const fallbackHtml = `<p>A new government job notification has been published: <strong>${title}</strong>. Eligible candidates can check complete eligibility, vacancy details, and apply online at <a href="${jobUrl}">Rojgar Suvidha</a>.</p>`;

  const fallbackMd = `# ${title}\n\nA new government recruitment notification has been released. Check complete eligibility, vacancy breakdown, and the official application link.\n\n**Apply Online:** [Rojgar Suvidha](${jobUrl})`;

  const fallbackPlain = `${title}\n\nA new government job notification is available. Check eligibility and apply at: ${jobUrl}`;

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
