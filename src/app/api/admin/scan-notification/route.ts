import { NextResponse } from "next/server";

export const maxDuration = 60;

// ══════════════════════════════════════════════════════════════════════════════
// 🧠 MASTER WRITER SYSTEM PROMPT — Autonomous Content Writer Persona (B3)
// ══════════════════════════════════════════════════════════════════════════════
const HUMAN_BLOGGER_SYSTEM_PROMPT = `You are not just generating content. You are a senior content editor at India's #1 government job portal — Rojgar Suvidha. You have 8 years of experience writing for UPSC, SSC, Railway, Banking, State PSC, and Defence aspirants across India.

You make autonomous editorial decisions:
- You decide which facts are important enough to bold
- You decide when a warning box is needed vs. an info box
- You decide when a positive announcement deserves a success box
- You instinctively use <mark>, <strong>, and callout boxes where a real human editor would
- You write like a mentor, not like a machine

=== VOICE & TONE (Simple & Natural) ===
- Write in simple, easy-to-read English (high school level). Never use complex or flowery vocabulary.
- Speak like a friendly elder brother (Bhaiya) or mentor advising a student over tea.
- Vary sentence lengths naturally. Use very short punchy sentences ("Apply early.", "This is crucial.", "Don't skip this.") mixed with descriptive ones.
- Never sound like a textbook, document, or generic news ticker.
- Add personal observations ("In my experience...", "Every year I see candidates make this mistake...", "What most students don't realize is...").
- Talk directly to the reader using "you", "your", and "we".

=== ADAPTIVE CONTENT (No Repetitive Templates) ===
- DO NOT use the exact same template or paragraph flow for every post. Use your intelligence to adapt:
  * For Police/Defence: Focus heavily on physical requirements using a dedicated styled callout box.
  * For Banking/SSC/UPSC: Focus on selection stages, negative marking, and preparation strategy.
  * For Technical/Medical: Focus on eligibility details, mandatory internships, specialized qualifications.
  * For Results: Open with emotional awareness — thousands waited for this. Be warm, direct, human.
  * For Admit Cards: Be practical and urgent — the exam is coming, help them prepare, not panic.
  * For News: Journalistic inverted pyramid — most important fact in the VERY FIRST SENTENCE.

=== VISUAL RICHNESS — YOU MUST USE THESE (Non-Negotiable) ===
Use <strong> around: dates, fee amounts, vacancy counts, age limits, salary figures, important deadlines.
Use <mark style='background:#fef9c3;padding:1px 5px;border-radius:3px;font-weight:700;'> around: single critical numbers like total vacancies, last date to apply, key fee amounts.

Use these callout boxes where appropriate:

WARNING BOX (for common mistakes, tricky rules):
<div style='background:#fffbeb;border-left:4px solid #d97706;padding:16px 20px;border-radius:8px;margin:1.5rem 0;color:#1e293b;'><strong style='color:#b45309;display:block;margin-bottom:4px;'>IMPORTANT ADVISORY</strong>[Content here]</div>

INFO/TIP BOX (for strategy, expert advice):
<div style='background:#f0f9ff;border-left:4px solid #0284c7;padding:16px 20px;border-radius:8px;margin:1.5rem 0;color:#1e293b;'><strong style='color:#0369a1;display:block;margin-bottom:4px;'>EXPERT STRATEGY TIP</strong>[Content here]</div>

DANGER/CRITICAL BOX (for strict deadlines, disqualification rules):
<div style='background:#fef2f2;border-left:4px solid #dc2626;padding:16px 20px;border-radius:8px;margin:1.5rem 0;color:#1e293b;'><strong style='color:#b91c1c;display:block;margin-bottom:4px;'>CRITICAL WARNING</strong>[Content here]</div>

SUCCESS BOX (for positive announcements — result declared, admit card available, fee waiver):
<div style='background:#f0fdf4;border-left:4px solid #16a34a;padding:16px 20px;border-radius:8px;margin:1.5rem 0;color:#1e293b;'><strong style='color:#15803d;display:block;margin-bottom:4px;'>GOOD NEWS</strong>[Content here]</div>

=== BANNED AI PATTERNS (STRICTLY FORBIDDEN) ===
NEVER use: "In today's rapidly evolving landscape...", "In a significant development...", "It goes without saying...", "delve", "plethora", "crucial", "navigating", "testament", "beacon", "moreover", "furthermore", "additionally", "consequently", "in conclusion", "lastly", "comprehensive", "unlock your potential", "leverage", "transformative", "needless to say", "great question", "let's dive in", "it is important to note".
ZERO EMOJIS anywhere in the text or headings.

=== SEO & SCHEMA RULES ===
- Place the primary keyword naturally in: H1 title, first 100 words, at least 2 H2 headings, and last paragraph.
- Answer the main search query directly in 45-55 words in the second paragraph for Google's featured snippet.
- Make headings (H2, H3) mimic what real students type in search boxes.
- ALL HTML attributes MUST use single quotes.

=== FINAL CHECK ===
Read your text: does it sound like a generic AI listing facts, or a real person who actually read the official PDF and is helping a younger sibling apply correctly? Make it feel 100% human, clear, and highly useful.`;

// ══════════════════════════════════════════════════════════════════════════════
// B1: Content Intelligence Engine — detectContentFeatures()
// ══════════════════════════════════════════════════════════════════════════════
function detectContentFeatures(rawText: string, title: string = "") {
  const text = (rawText + " " + title).toLowerCase();
  const resultType =
    /selected|provisionally selected|merit list/.test(text) ? "selection" :
    /scorecard|marks obtained|subject wise marks/.test(text) ? "scorecard" : "general";

  return {
    isUrgent:         /last date|apply before|closing date|hurry|final date/.test(text),
    hasPhysicalTest:  /crpf|cisf|bsf|itbp|ssb|agniveer|navy|air force|airforce|nda|capf|police|constable|rpf|paramilitary|soldier/.test(text),
    hasFeeWaiver:     /sc.?st.{0,10}(free|exempt|nil|zero|no fee)|female.{0,5}free|women.{0,5}free|no.{0,5}fee/.test(text),
    hasSalaryData:    /pay level|basic pay|pay matrix|grade pay|pay band|7th.?cpc|pay commission/.test(text),
    hasCutoffData:    /cutoff|cut.?off|qualifying marks|minimum marks/.test(text),
    hasAgeRelaxation: /obc.*3.?year|sc.?st.*5.?year|pwd.*10.?year|ex.?servicemen/.test(text),
    hasMultiplePosts: /post.*name|various post|multiple post|category wise|grade wise|cadre wise/.test(text),
    isStateLevel:     /state|pradesh|rajasthan|bihar|uttarakhand|district|block|panchayat|zila|rrb/.test(text),
    isGroupA:         /ias|ips|ifs|upsc civil|group.?a|gazetted|class.?1|administrative service/.test(text),
    isBanking:        /ibps|sbi|bank|rbi|nabard|sidbi|clerk|probationary officer|po |po\b/.test(text),
    isRailway:        /railway|rrb|rlwl|rrc|group.?d|loco pilot|station master/.test(text),
    resultType,
    urgencyDays:      (() => {
      const match = text.match(/(\d+)\s*days?\s*(left|remaining|more)/);
      return match ? parseInt(match[1]) : null;
    })(),
  };
}

// ══════════════════════════════════════════════════════════════════════════════
// B2: autoHighlightNumbers() — Rich Formatting Post-Processor
// ══════════════════════════════════════════════════════════════════════════════
function autoHighlightNumbers(html: string): string {
  let out = html;

  // 1. Fee amounts — highlight in yellow mark
  out = out.replace(
    /(?<![">\/=])(₹\s*\d[\d,]*(?:\.\d{1,2})?)/g,
    `<mark style='background:#fef9c3;padding:1px 5px;border-radius:3px;font-weight:700;'>$1</mark>`
  );

  // 2. "Free" fee — highlight in green
  out = out.replace(
    /\b(Free|₹\s*0\b|No Fee|Nil Fee)\b(?![^<]*>)/g,
    `<span style='color:#15803d;font-weight:800;'>$1</span>`
  );

  // 3. Vacancy counts — red bold
  out = out.replace(
    /\b(\d[\d,]+)\s*(posts?|vacancies|vacancies|seats?|positions?)\b(?![^<]*>)/gi,
    `<strong style='color:#e11d48;'>$1 $2</strong>`
  );

  // 4. Age limits — bold
  out = out.replace(
    /\b(\d{2}[\s\-–to]+\d{2}\s*years?)\b(?![^<]*>)/gi,
    `<strong>$1</strong>`
  );

  // 5. Important dates in DD Month YYYY or DD/MM/YYYY format — bold
  out = out.replace(
    /\b(\d{1,2}\s+(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4})\b(?![^<]*>)/gi,
    `<strong>$1</strong>`
  );
  out = out.replace(
    /\b(\d{1,2}\/\d{1,2}\/\d{4})\b(?![^<]*>)/g,
    `<strong>$1</strong>`
  );

  // 6. Salary amounts — bold blue
  out = out.replace(
    /\b(₹\s*[\d,]+\s*(?:per month|\/month|p\.m\.|monthly)?)\b(?![^<]*>)/gi,
    `<strong style='color:#1d4ed8;'>$1</strong>`
  );

  return out;
}

// ══════════════════════════════════════════════════════════════════════════════
// Humanizer: 60+ word pairs + human filler injector
// ══════════════════════════════════════════════════════════════════════════════
function humanizeHtml(html: string): string {
  const wordMap: [RegExp, string | ((m: string) => string)][] = [
    [/\bprovide\b/gi, "give"],
    [/\bobtain\b/gi, "get"],
    [/\bpurchase\b/gi, "buy"],
    [/\brequire\b/gi, "need"],
    [/\bdemonstrate\b/gi, "show"],
    [/\bcommence\b/gi, "start"],
    [/\bterminate\b/gi, "end"],
    [/\bassist\b/gi, "help"],
    [/\bsufficient\b/gi, "enough"],
    [/\badditionally\b/gi, "also"],
    [/\bsubsequently\b/gi, "then"],
    [/\bpreviously\b/gi, "before"],
    [/\bcurrently\b/gi, "right now"],
    [/\bnumerous\b/gi, "many"],
    [/\bapproximately\b/gi, "around"],
    [/\bregarding\b/gi, "about"],
    [/\bensure\b/gi, "make sure"],
    [/\bcontact\b(?= the| us| them| your)/gi, "reach out to"],
    [/\bnotification\b/gi, (m: string) => Math.random() > 0.5 ? m : "notice"],
    [/\bindividuals\b/gi, "people"],
    [/\bcandidates\b/gi, (m: string) => Math.random() > 0.6 ? m : "students"],
    [/\bin a significant development\b/gi, "Here's the news"],
    [/\bit is worth noting that\b/gi, "Worth mentioning —"],
    [/\bworthy of note\b/gi, "important to know"],
    [/\bpertaining to\b/gi, "about"],
    [/\bwith respect to\b/gi, "for"],
    [/\bas per\b/gi, "according to"],
    [/\bkeep in mind\b/gi, "remember"],
    [/\bstated that\b/gi, "said"],
    [/\butilize\b/gi, "use"],
    [/\butilization\b/gi, "use"],
    [/\bimplementing\b/gi, "putting in place"],
    [/\bfacilitate\b/gi, "help with"],
    [/\bfurthermore\b/gi, (m: string) => ["also", "and", "on top of that", "plus"][Math.floor(Math.random() * 4)]],
    [/\bmoreover\b/gi, (m: string) => ["also", "besides that", "and there's more"][Math.floor(Math.random() * 3)]],
    [/\bin conclusion\b/gi, "to wrap this up"],
    [/\bto summarize\b/gi, "in short"],
    [/\bit should be noted\b/gi, "one thing to know"],
    [/\baspiring candidates\b/gi, "students who want this job"],
    [/\beligible candidates\b/gi, "students who qualify"],
    [/\bintending to apply\b/gi, "planning to apply"],
    [/\bfill in the form\b/gi, "fill the form"],
    [/\bselection procedure\b/gi, "selection process"],
    [/\brecruitment process\b/gi, "hiring process"],
    [/\bofficial notification\b/gi, (m: string) => Math.random() > 0.5 ? "official notice" : m],
    [/\bgovernment job\b/gi, (m: string) => Math.random() > 0.5 ? "sarkari naukri" : m],
    [/\bimportant to note\b/gi, "worth knowing"],
    [/\bplease note that\b/gi, "remember —"],
    [/\bit is advisable\b/gi, "you should"],
    [/\bin order to\b/gi, "to"],
    [/\bprior to\b/gi, "before"],
    [/\bsubmit an application\b/gi, "apply"],
    [/\bapplication procedure\b/gi, "how to apply"],
    [/\brequirements mentioned\b/gi, "what's needed"],
    [/\bhereby\b/gi, ""],
    [/\baforesaid\b/gi, "above-mentioned"],
    [/\bundertake\b/gi, "do"],
    [/\binitiate\b/gi, "start"],
    [/\bwherein\b/gi, "where"],
    [/\bthereafter\b/gi, "after that"],
  ];

  let out = html;
  for (const [pattern, replacement] of wordMap) {
    out = out.replace(pattern, replacement as any);
  }

  const fillers = [
    "<p style='color:#374151;line-height:1.75;margin-bottom:0.9rem;font-style:italic;'>Now, I know this sounds like a lot. But go through it section by section — it becomes simple.</p>",
    "<p style='color:#374151;line-height:1.75;margin-bottom:0.9rem;'>Here is something most blogs won't tell you — the official PDF has more details than any summary. Always read the original once.</p>",
    "<p style='color:#374151;line-height:1.75;margin-bottom:0.9rem;'>Every year I see good candidates lose out over small things. Don't let that be you.</p>",
    "<p style='color:#374151;line-height:1.75;margin-bottom:0.9rem;'>Before I continue — if anything here seems unclear, the official notification at the bottom of this page has everything spelled out.</p>",
    "<p style='color:#374151;line-height:1.75;margin-bottom:0.9rem;'>Real talk — most candidates who get rejected did nothing wrong in the exam. They made form-filling mistakes. That's the part you need to take seriously.</p>",
  ];

  let injectionCount = 0;
  out = out.replace(/<\/p>/g, (match) => {
    if (injectionCount < 2 && Math.random() > 0.88) {
      injectionCount++;
      return `</p>\n${fillers[Math.floor(Math.random() * fillers.length)]}`;
    }
    return match;
  });

  // Convert any Markdown bold **text** or __text__ to <strong>text</strong> so literal stars never appear in editor
  out = out.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
  out = out.replace(/__(.*?)__/g, "<strong>$1</strong>");

  return out;
}

// ══════════════════════════════════════════════════════════════════════════════
// Blog Structure Variant Engine
// ══════════════════════════════════════════════════════════════════════════════
type BlogVariant = "standard" | "candidate-first" | "action-first";

function pickBlogVariant(): BlogVariant {
  const variants: BlogVariant[] = ["standard", "candidate-first", "action-first"];
  return variants[Math.floor(Math.random() * variants.length)];
}

function getVariantCTAStyle(variant: BlogVariant): string {
  return {
    "standard": "background:linear-gradient(135deg,#4f46e5,#7c3aed);",
    "candidate-first": "background:linear-gradient(135deg,#059669,#0d9488);",
    "action-first": "background:linear-gradient(135deg,#d97706,#dc2626);",
  }[variant];
}

function getVariantByline(variant: BlogVariant, meta: any, date: string): string {
  return {
    "standard": `By <strong>Rojgar Suvidha Editorial Team</strong> &nbsp;|&nbsp; Last Updated: <strong>${date}</strong> &nbsp;|&nbsp; Vacancies: <strong>${meta.totalPosts || "N/A"}</strong> &nbsp;|&nbsp; Last Date: <strong>${meta.lastDate || "See Notification"}</strong>`,
    "candidate-first": `<strong>Reviewed by our Career Advisory Team</strong> &nbsp;|&nbsp; ${date} &nbsp;|&nbsp; Last Date to Apply: <strong>${meta.lastDate || "See Notification"}</strong>`,
    "action-first": `<strong>${date}</strong> &nbsp;|&nbsp; ${meta.orgName || "Govt. Organisation"} &nbsp;|&nbsp; <strong>${meta.totalPosts || "Multiple"} Vacancies Open</strong>`,
  }[variant];
}

function getVariantOpener(): string {
  const openers = [
    "Look,", "Okay so,", "Here's the deal —", "Let me be straight with you —",
    "Honestly,", "Here's what you need to know —", "Real talk —", "Right, so —",
  ];
  return openers[Math.floor(Math.random() * openers.length)];
}

function getVariantToCLinks(variant: BlogVariant): string {
  const linkStyle = "color:#4f46e5;text-decoration:none;font-weight:600;font-size:0.85rem;";
  if (variant === "action-first") {
    return `
<a href='#dates' style='${linkStyle}'>Dates &amp; Deadline</a>
<a href='#apply' style='${linkStyle}'>How to Apply</a>
<a href='#eligibility' style='${linkStyle}'>Am I Eligible?</a>
<a href='#salary' style='${linkStyle}'>Salary Details</a>
<a href='#selection' style='${linkStyle}'>Selection Process</a>
<a href='#prep' style='${linkStyle}'>Prep Strategy</a>
<a href='#cutoff' style='${linkStyle}'>Expected Cutoff</a>
<a href='#faq' style='${linkStyle}'>FAQs</a>`;
  } else if (variant === "candidate-first") {
    return `
<a href='#eligibility' style='${linkStyle}'>Am I Eligible?</a>
<a href='#salary' style='${linkStyle}'>What's the Salary?</a>
<a href='#dates' style='${linkStyle}'>Important Dates &amp; Fee</a>
<a href='#selection' style='${linkStyle}'>Selection Process</a>
<a href='#vacancies' style='${linkStyle}'>Vacancy Breakdown</a>
<a href='#prep' style='${linkStyle}'>90-Day Prep Plan</a>
<a href='#cutoff' style='${linkStyle}'>Expected Cutoff</a>
<a href='#apply' style='${linkStyle}'>How to Apply</a>
<a href='#faq' style='${linkStyle}'>FAQs</a>`;
  }
  return `
<a href='#intro' style='${linkStyle}'>Overview</a>
<a href='#dates' style='${linkStyle}'>Important Dates &amp; Fees</a>
<a href='#eligibility' style='${linkStyle}'>Eligibility Details</a>
<a href='#vacancies' style='${linkStyle}'>Vacancy Breakdown</a>
<a href='#selection' style='${linkStyle}'>Selection &amp; Pattern</a>
<a href='#prep' style='${linkStyle}'>Prep Strategy</a>
<a href='#cutoff' style='${linkStyle}'>Expected Cutoff</a>
<a href='#apply' style='${linkStyle}'>How to Apply</a>
<a href='#faq' style='${linkStyle}'>FAQs</a>`;
}

// ══════════════════════════════════════════════════════════════════════════════
// FAQPage JSON-LD Schema Auto-Injector
// ══════════════════════════════════════════════════════════════════════════════
// ── Google JobPosting Schema Auto-Injector (F1-A) ─────────────────────────
function injectJobPostingSchema(blogHtml: string, meta: any): string {
  if (meta.category !== "latest-jobs" && meta.category !== "admission") return blogHtml;
  const schema = {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    "title": meta.title,
    "description": meta.shortInfo || meta.metaDesc || `Apply for ${meta.title}`,
    "datePosted": new Date().toISOString().split("T")[0],
    ...(meta.lastDate && !meta.lastDate.toLowerCase().includes("soon") && {
      "validThrough": (() => { try { const d = new Date(meta.lastDate); return isNaN(d.getTime()) ? undefined : d.toISOString(); } catch { return undefined; } })()
    }),
    "employmentType": "FULL_TIME",
    "hiringOrganization": {
      "@type": "Organization",
      "name": meta.orgName || "Government of India",
      "sameAs": "https://www.rojgarsuvidha.com",
      "logo": "https://www.rojgarsuvidha.com/logo-blue.png"
    },
    "jobLocation": {
      "@type": "Place",
      "address": { "@type": "PostalAddress", "addressCountry": "IN", "addressLocality": "India" }
    },
    "applicantLocationRequirements": { "@type": "Country", "name": "India" },
    "directApply": false,
    ...(meta.totalPosts && !isNaN(parseInt(meta.totalPosts)) && { "totalJobOpenings": parseInt(meta.totalPosts) })
  };
  const schemaTag = `<script type='application/ld+json'>${JSON.stringify(schema)}</script>`;
  return schemaTag + "\n" + blogHtml;
}

function injectFaqSchema(blogHtml: string, pageTitle: string): string {
  const faqRegex = /<summary[^>]*>([\s\S]*?)<\/summary>\s*<p[^>]*>([\s\S]*?)<\/p>/gi;
  const faqs: { q: string; a: string }[] = [];
  let match;
  const tempRegex = new RegExp(faqRegex.source, faqRegex.flags);
  while ((match = tempRegex.exec(blogHtml)) !== null) {
    const question = match[1].replace(/<[^>]*>/g, "").trim();
    const answer = match[2].replace(/<[^>]*>/g, "").trim().replace(/\s+/g, " ").slice(0, 350);
    if (question && answer && question.length > 5 && question.length < 200) {
      faqs.push({ q: question, a: answer });
    }
  }
  if (faqs.length < 2) return blogHtml;
  const schema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map(({ q, a }) => ({
      "@type": "Question",
      "name": q,
      "acceptedAnswer": { "@type": "Answer", "text": a }
    }))
  };
  const schemaTag = `<script type='application/ld+json'>${JSON.stringify(schema)}</script>`;
  return schemaTag + "\n" + blogHtml;
}

// ══════════════════════════════════════════════════════════════════════════════
// Auto Internal Link Injector
// ══════════════════════════════════════════════════════════════════════════════
function injectInternalLinks(blogHtml: string, category: string): string {
  type LinkConfig = { url: string; linked: boolean };
  const linkMap: Record<string, LinkConfig> = {
    "admit card":     { url: "/admit-card",   linked: false },
    "admit cards":    { url: "/admit-card",   linked: false },
    "result":         { url: "/results",      linked: false },
    "answer key":     { url: "/answer-key",   linked: false },
    "latest jobs":    { url: "/latest-jobs",  linked: false },
    "sarkari naukri": { url: "/latest-jobs",  linked: false },
    "apply for me":   { url: "/apply-for-me", linked: false },
  };
  const selfMap: Record<string, string[]> = {
    "latest-jobs": ["latest jobs", "sarkari naukri"],
    "results": ["result"],
    "admit-cards": ["admit card", "admit cards"],
    "answer-key": ["answer key"],
  };
  (selfMap[category] || []).forEach(k => { if (linkMap[k]) linkMap[k].linked = true; });

  let out = blogHtml;
  for (const [keyword, config] of Object.entries(linkMap)) {
    if (config.linked) continue;
    const safePattern = new RegExp(`(?<!["=>\\w])(${keyword.replace(/ /g, "\\s+")})(?![^<]*>)`, "i");
    const replaced = out.replace(safePattern, (match) => {
      if (!config.linked) {
        config.linked = true;
        return `<a href='${config.url}' style='color:#4f46e5;text-decoration:underline;font-weight:600;'>${match}</a>`;
      }
      return match;
    });
    out = replaced;
  }
  return out;
}

// ══════════════════════════════════════════════════════════════════════════════
// Physical Fitness Detection + Callout Box
// ══════════════════════════════════════════════════════════════════════════════
function isPhysicalExam(rawText: string, title: string): boolean {
  return /crpf|cisf|bsf|itbp|ssb|agniveer|navy|air force|airforce|nda|capf|police|constable|rpf|paramilitary|para military|soldier|gnm|gramin dak/i.test(rawText + " " + title);
}

function generatePhysicalStandardsBox(): string {
  return `
<div style='background:#fef3c7;border:2px solid #d97706;border-radius:12px;padding:20px 24px;margin:1.5rem 0;'>
  <p style='font-weight:800;color:#92400e;margin:0 0 8px;font-size:1rem;'>Physical Standards Apply for This Recruitment</p>
  <p style='color:#1e293b;margin:0 0 12px;font-size:0.95rem;line-height:1.7;'>This recruitment includes a Physical Efficiency Test (PET) and Physical Standard Test (PST). These are elimination rounds — there are no second chances. Check the official notification carefully for the exact height, weight, chest, and running requirements for your category (General / OBC / SC / ST) and gender.</p>
  <p style='color:#1e293b;margin:0;font-size:0.9rem;line-height:1.7;'><strong>Start your physical training from day one.</strong> Do not wait for the written result to come out. Every season, many students clear the written exam but fail the physical round because they did not prepare for it. Begin training today.</p>
</div>`;
}

// ══════════════════════════════════════════════════════════════════════════════
// Programmatic Table Generators
// ══════════════════════════════════════════════════════════════════════════════
function generateOverviewTable(meta: any): string {
  return `
<div style='overflow-x:auto;margin-bottom:2rem;border-radius:12px;border:2px solid #e2e8f0;box-shadow:0 4px 6px -1px rgba(0,0,0,0.05);'>
  <table style='width:100%;border-collapse:collapse;min-width:400px;font-family:inherit;font-size:0.95rem;'>
    <thead>
      <tr style='background:linear-gradient(135deg,#4f46e5,#6366f1);color:white;'>
        <th colspan='2' style='padding:14px 18px;text-align:center;font-weight:800;font-size:1.1rem;'>Quick Recruitment Highlights</th>
      </tr>
    </thead>
    <tbody>
      <tr style='border-bottom:1px solid #e2e8f0;'>
        <td style='padding:12px 16px;font-weight:700;background:#f8fafc;color:#1e293b;width:35%;'>Organization</td>
        <td style='padding:12px 16px;color:#334155;font-weight:600;'>${meta.orgName || "Department / Board"}</td>
      </tr>
      <tr style='border-bottom:1px solid #e2e8f0;'>
        <td style='padding:12px 16px;font-weight:700;background:#f8fafc;color:#1e293b;'>Exam Name</td>
        <td style='padding:12px 16px;color:#334155;font-weight:600;'>${meta.examName || meta.title}</td>
      </tr>
      <tr style='border-bottom:1px solid #e2e8f0;'>
        <td style='padding:12px 16px;font-weight:700;background:#f8fafc;color:#1e293b;'>Total Vacancies</td>
        <td style='padding:12px 16px;color:#e11d48;font-weight:800;font-size:1.05rem;'>${meta.totalPosts || "Not Available"} Posts</td>
      </tr>
      <tr style='border-bottom:1px solid #e2e8f0;'>
        <td style='padding:12px 16px;font-weight:700;background:#f8fafc;color:#1e293b;'>Application Mode</td>
        <td style='padding:12px 16px;color:#15803d;font-weight:700;'>Online Apply</td>
      </tr>
      <tr style='border-bottom:1px solid #e2e8f0;'>
        <td style='padding:12px 16px;font-weight:700;background:#f8fafc;color:#1e293b;'>Last Date to Apply</td>
        <td style='padding:12px 16px;color:#e11d48;font-weight:800;'>${meta.lastDate || "See Notification"}</td>
      </tr>
      <tr>
        <td style='padding:12px 16px;font-weight:700;background:#f8fafc;color:#1e293b;'>Official Website</td>
        <td style='padding:12px 16px;color:#4f46e5;font-weight:600;'>Refer to official links below</td>
      </tr>
    </tbody>
  </table>
</div>`;
}

function generateDatesFeesTable(meta: any): string {
  return `
<div style='overflow-x:auto;margin-bottom:2rem;border-radius:12px;border:1px solid #e5e7eb;box-shadow:0 4px 6px -1px rgba(0,0,0,0.02);'>
  <table style='width:100%;border-collapse:collapse;min-width:500px;font-family:inherit;font-size:0.95rem;'>
    <thead>
      <tr style='background-color:#4f46e5;color:white;'>
        <th style='padding:12px 16px;text-align:left;font-weight:700;width:50%;'>Important Dates</th>
        <th style='padding:12px 16px;text-align:left;font-weight:700;width:50%;'>Application Fee</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td style='padding:16px;border-right:1px solid #e5e7eb;border-bottom:1px solid #e5e7eb;vertical-align:top;line-height:1.6;color:#334155;'>
          <p style='margin:4px 0;'><strong>Apply Starts:</strong> ${meta.startDate || "Announced Soon"}</p>
          <p style='margin:4px 0;color:#e11d48;'><strong>Last Date to Apply:</strong> ${meta.lastDate || "See Notification"}</p>
          <p style='margin:4px 0;'><strong>Exam Date:</strong> ${meta.examDate || "Will be notified later"}</p>
        </td>
        <td style='padding:16px;border-bottom:1px solid #e5e7eb;vertical-align:top;line-height:1.6;color:#334155;'>
          <p style='margin:4px 0;'><strong>General / OBC / EWS:</strong> ${meta.appFeeGen || "Check Details"}</p>
          <p style='margin:4px 0;'><strong>SC / ST / PH:</strong> ${meta.appFeeRes || "Check Details"}</p>
          <p style='margin:4px 0;font-size:0.85rem;color:#64748b;'><strong>Note:</strong> Fees can be paid online via Credit/Debit card, Netbanking or UPI.</p>
        </td>
      </tr>
    </tbody>
  </table>
</div>`;
}

function generateVacancyTable(meta: any): string {
  return `
<div style='overflow-x:auto;margin-bottom:2rem;border-radius:12px;border:1px solid #e5e7eb;box-shadow:0 4px 6px -1px rgba(0,0,0,0.02);'>
  <table style='width:100%;border-collapse:collapse;min-width:550px;font-family:inherit;font-size:0.95rem;'>
    <thead>
      <tr style='background-color:#1e1b4b;color:white;'>
        <th style='padding:12px 16px;text-align:left;font-weight:700;width:35%;'>Post Name</th>
        <th style='padding:12px 16px;text-align:center;font-weight:700;width:20%;'>Total Vacancies</th>
        <th style='padding:12px 16px;text-align:left;font-weight:700;width:45%;'>Eligibility Criteria</th>
      </tr>
    </thead>
    <tbody>
      <tr style='border-bottom:1px solid #e5e7eb;'>
        <td style='padding:14px 16px;font-weight:600;color:#1e293b;vertical-align:middle;'>${meta.examName || meta.title}</td>
        <td style='padding:14px 16px;text-align:center;font-weight:800;color:#4f46e5;font-size:1.05rem;vertical-align:middle;'>${meta.totalPosts || "Not Available"}</td>
        <td style='padding:14px 16px;color:#334155;line-height:1.5;vertical-align:middle;'>
          <p style='margin:2px 0;'><strong>Age Limit:</strong> ${meta.ageLimit || "As per rules"}</p>
          <p style='margin:2px 0;'><strong>Education:</strong> ${meta.education || "See official notification"}</p>
        </td>
      </tr>
    </tbody>
  </table>
</div>`;
}

// ══════════════════════════════════════════════════════════════════════════════
// Call Gemini API with model fallback
// ══════════════════════════════════════════════════════════════════════════════
async function callGemini(systemPrompt: string, userPrompt: string, jsonMode: boolean = false): Promise<string> {
  const geminiApiKey = (process.env.GEMINI_API_KEY || "").trim();
  if (!geminiApiKey) throw new Error("Gemini API Key missing in environment");

  const models = ["gemini-1.5-flash", "gemini-1.5-pro", "gemini-2.0-flash-exp"];
  let lastError = "";

  for (const model of models) {
    try {
      const payload: any = {
        contents: [{
          role: "user",
          parts: [{ text: `${systemPrompt}\n\nUSER PROMPT/CONTENT:\n${userPrompt}` }]
        }],
        generationConfig: {
          temperature: jsonMode ? 0.1 : 0.87,
          maxOutputTokens: 4000,
        }
      };
      if (jsonMode) payload.generationConfig.responseMimeType = "application/json";

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 50000);
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiApiKey}`,
        { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload), signal: controller.signal }
      );
      clearTimeout(timeoutId);
      const data = await response.json();
      if (data.error) { lastError = data.error.message || JSON.stringify(data.error); continue; }
      const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
      if (rawText) return rawText;
    } catch (e: any) { lastError = e.message; continue; }
  }
  throw new Error(`All Gemini models failed: ${lastError}`);
}

async function callAI(systemPrompt: string, userPrompt: string, jsonMode: boolean = false): Promise<string> {
  let geminiErrDetail = "";
  if (process.env.GEMINI_API_KEY) {
    try {
      return await callGemini(systemPrompt, userPrompt, jsonMode);
    } catch (geminiError: any) {
      geminiErrDetail = geminiError.message || String(geminiError);
      console.warn("Gemini call failed, falling back to Groq:", geminiErrDetail);
    }
  }

  const groqApiKey = (process.env.GROQ_API_KEY || "").trim();
  if (!groqApiKey) {
    throw new Error(`Gemini failed (${geminiErrDetail || "Key missing"}) and GROQ_API_KEY is missing.`);
  }

  // Trim prompts for Groq to stay well under TPM limits.
  const MAX_USER_CHARS = jsonMode ? 3500 : 4800;
  const trimmedUserPrompt = userPrompt.length > MAX_USER_CHARS
    ? userPrompt.substring(0, MAX_USER_CHARS) + "\n\n[Content trimmed for length. Use the above to complete the section.]"
    : userPrompt;

  const groqModels = ["llama-3.3-70b-versatile", "llama3-70b-8192", "gemma2-9b-it"];
  let lastGroqError = "";

  for (const model of groqModels) {
    try {
      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${groqApiKey}` },
        body: JSON.stringify({
          model,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: trimmedUserPrompt }
          ],
          temperature: jsonMode ? 0.1 : 0.78,
          max_tokens: jsonMode ? 700 : 2800,
          response_format: jsonMode ? { type: "json_object" } : undefined,
        }),
        signal: AbortSignal.timeout(45000),
      });
      const data = await response.json();
      if (data.error) {
        lastGroqError = data.error.message || JSON.stringify(data.error);
        console.warn(`Groq model ${model} error:`, lastGroqError);
        continue;
      }
      const content = data.choices?.[0]?.message?.content || "";
      if (content) return content;
    } catch (e: any) {
      lastGroqError = e.message;
      console.warn(`Groq model ${model} threw:`, e.message);
      continue;
    }
  }

  throw new Error(`All AI models failed. [Gemini Reason: ${geminiErrDetail || "N/A"} | Groq Reason: ${lastGroqError || "N/A"}]`);
}

// ══════════════════════════════════════════════════════════════════════════════
// B4: Category-Specific Metadata Extraction (Enhanced Schemas)
// ══════════════════════════════════════════════════════════════════════════════
async function extractMetadata(rawText: string, category: string, customInstructions?: string) {
  // Category-specific JSON field definitions (B4)
  const categorySchemas: Record<string, string> = {
    "latest-jobs": `
  "appFeeGen": "General/OBC/EWS fee amount (e.g. Rs 100 or Free)",
  "appFeeRes": "SC/ST/PH/Female fee amount (e.g. Rs 0 or Free)",
  "startDate": "Application start date (e.g. 10 July 2025)",
  "lastDate": "Application last date (e.g. 30 July 2025)",
  "examDate": "Exam date if available (e.g. September 2025 or Announced Soon)",
  "ageLimit": "Age limit details (e.g. 18-27 years as on 01/07/2025)",
  "education": "Brief educational qualification (e.g. Bachelor Degree in any stream)",
  "totalPosts": "Total vacancy count as a number string (e.g. 1248 or Not Available)",
  "hasFeeWaiver": "true or false — whether SC/ST/Women get fee exemption",
  "hasMultiplePosts": "true or false — whether there are multiple post categories"`,

    "results": `
  "resultDate": "Date result was declared (e.g. 15 July 2025)",
  "lastDate": "Result declared date",
  "examDate": "N/A",
  "totalPosts": "Total selected count if mentioned, else N/A",
  "appFeeGen": "N/A",
  "appFeeRes": "N/A",
  "resultType": "selection OR scorecard OR merit-list OR general",
  "cutoffGen": "General category cutoff if mentioned (e.g. 145.5 or Not Announced)",
  "cutoffOBC": "OBC cutoff if mentioned",
  "cutoffSCST": "SC/ST cutoff if mentioned",
  "nextStep": "Next stage after result — e.g. Document Verification, Medical Test, Joining, or Not Mentioned"`,

    "admit-cards": `
  "examDate": "Actual exam date (e.g. 20 August 2025)",
  "reportingTime": "Time to report at center (e.g. 30 minutes before exam start or Not Mentioned)",
  "lastDate": "Admit card release date or exam date",
  "admitCardLink": "Official URL for admit card download if found, else empty string",
  "appFeeGen": "N/A",
  "appFeeRes": "N/A",
  "totalPosts": "N/A",
  "examDuration": "Duration of the exam in hours if mentioned"`,

    "news": `
  "lastDate": "Date of news publication or event date",
  "impactLevel": "high OR medium OR low — based on how many students are affected",
  "affectedStudents": "Rough count of students affected (e.g. lakhs of candidates or specific number)",
  "actionRequired": "What candidates must do as a result of this news — 1 sentence",
  "appFeeGen": "N/A",
  "appFeeRes": "N/A",
  "totalPosts": "N/A",
  "examDate": "N/A"`,

    "admission": `
  "lastDate": "Last date to apply for admission",
  "examDate": "Entrance exam date if applicable",
  "appFeeGen": "General/OBC fee amount",
  "appFeeRes": "SC/ST/PH fee amount",
  "totalPosts": "Total seats/intake available",
  "ageLimit": "Age criteria if applicable",
  "education": "Required qualifying course/marks",
  "courseName": "Name of the course/program for admission"`,

    "answer-key": `
  "lastDate": "Objection window last date",
  "examDate": "Date exam was conducted",
  "appFeeGen": "Objection fee per question if any, else Free",
  "appFeeRes": "N/A",
  "totalPosts": "N/A",
  "markingScheme": "Marking scheme (e.g. +2 for correct -0.5 for wrong)",
  "objectionDeadline": "Last date to raise objection",
  "objectionFee": "Fee per objection if any"`,
  };

  const systemPrompt = "You are a JSON extractor. Return only valid JSON.";
  const schemaFields = categorySchemas[category] || categorySchemas["latest-jobs"];

  const prompt = `Extract info from this ${category} content. Return ONLY this JSON:
{
  "title": "SEO title max 70 chars, include exam/org name + year, no emojis",
  "category": "${category}",
  "metaDesc": "150-160 char SEO meta description with call to action",
  "shortInfo": "2 sentences for card preview, plain text",
  "orgName": "full organization name",
  "examName": "exam or content name",
  "primaryKeyword": "main SEO keyword e.g. SSC CGL Result 2025",
  "lsiKeywords": "5 related keywords comma separated",
  ${schemaFields}
}
${customInstructions ? `\nADDITIONAL CONTEXT: ${customInstructions}` : ""}
CONTENT:
${rawText.substring(0, 3000)}

Return ONLY the JSON.`;

  const text = await callAI(systemPrompt, prompt, true);
  if (!text) throw new Error("No metadata returned");
  return JSON.parse(text.replace(/^```json?\n?/i, "").replace(/```$/g, "").trim());
}

// ══════════════════════════════════════════════════════════════════════════════
// Step 2A: Part 1 — H1, ToC, Intro, About, Salary
// ══════════════════════════════════════════════════════════════════════════════
async function writePart1(meta: any, rawText: string, features: ReturnType<typeof detectContentFeatures>, customInstructions?: string, variant: BlogVariant = "standard") {
  const date = new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
  const byline = getVariantByline(variant, meta, date);
  const opener = getVariantOpener();
  const tocLinks = getVariantToCLinks(variant);

  // Feature-specific additions to prompt (B1 integration)
  const featureNotes = [
    features.isGroupA ? "This is a GROUP-A or UPSC-level exam — mention the high competition (10+ lakhs applicants typically) and prestige of the role honestly." : "",
    features.isBanking ? "This is a banking exam (IBPS/SBI) — mention the multiple stages (Prelims/Mains/Interview), sectional cutoffs, and the importance of time management." : "",
    features.isRailway ? "This is a Railway/RRB exam — mention CBT stages, document verification, and the large number of vacancies vs. applicants." : "",
    features.isStateLevel ? "This is a STATE-level job — mention domicile requirements clearly, and that competition is typically lower than central exams." : "",
    features.hasFeeWaiver ? "Mention the SC/ST/Women fee waiver prominently in the dates/fee section — many candidates miss this." : "",
    features.isUrgent ? "The deadline appears to be URGENT — add a CRITICAL WARNING callout box about the last date prominently near the top." : "",
  ].filter(Boolean).join("\n");

  const prompt = `Write the FIRST HALF of an SEO-optimized, human-written blog post in HTML.

PRIMARY KEYWORD: "${meta.primaryKeyword || meta.title}"
RELATED KEYWORDS TO USE NATURALLY: ${meta.lsiKeywords || ""}
EXAM: ${meta.examName || meta.title}
ORG: ${meta.orgName || "the organization"}
VACANCIES: ${meta.totalPosts}
LAST DATE: ${meta.lastDate}
AGE: ${meta.ageLimit}
EDUCATION: ${meta.education}
FEE_GEN: ${meta.appFeeGen || "N/A"}
FEE_RES: ${meta.appFeeRes || "N/A"}
STRUCTURE VARIANT: ${variant}

NOTIFICATION TEXT:
${rawText.substring(0, 1500)}

=== CONTENT INTELLIGENCE (ACT ON THESE) ===
${featureNotes || "Standard government job post — write with balanced depth."}

=== SEO RULES (NON-NEGOTIABLE) ===
1. PRIMARY KEYWORD must appear in: the H1, first paragraph (first 100 words), at least 2 H2s, and naturally throughout.
2. Use LSI/related keywords naturally — do NOT keyword stuff.
3. Each H2 should answer a specific question a user would Google.
4. Write minimum 600 words for this half.
5. Use <strong> around important terms, numbers, dates, fees, vacancies. Use <mark style='background:#fef9c3;padding:1px 5px;border-radius:3px;font-weight:700;'> around the single most important number (total vacancies or last date).
6. ALL HTML attributes MUST use single quotes.

=== HUMAN WRITING RULES ===
1. Write like a knowledgeable friend explaining this over chai — warm but informative.
2. Mix sentence lengths. Some very short (3-5 words). Some longer and detailed.
3. Use "you" and "your" constantly. Talk directly to the reader.
4. Start the very first content paragraph with: "${opener}"
5. Add personal observations: "What most students don't realize is...", "Every year I see candidates miss this because..."
6. BANNED WORDS: delve, plethora, crucial, navigating, landscape, testament, moreover, furthermore, comprehensive, leverage, transformative
7. ZERO emojis.

=== LAYOUT INSTRUCTION ===
Output the placeholder '{{OVERVIEW_TABLE}}' immediately after the Quick Navigation box. Do not build an overview table yourself.

=== HTML STRUCTURE TO GENERATE ===

<h1 style='font-size:2rem;font-weight:800;color:#1e1b4b;margin-bottom:1rem;line-height:1.3;'>[H1 Title — max 65 chars, include primary keyword]</h1>
<p style='font-size:0.85rem;color:#6b7280;margin-bottom:1rem;'>${byline}</p>

<div style='background:#f8fafc;border:1px solid #e5e7eb;border-radius:12px;padding:16px 20px;margin-bottom:2rem;'>
<p style='font-weight:700;color:#1e1b4b;margin:0 0 10px;font-size:0.95rem;'>Quick Navigation</p>
<div style='display:flex;flex-wrap:wrap;gap:12px;'>
${tocLinks}
</div>
</div>

{{OVERVIEW_TABLE}}

<h2 id='intro'>[H2 about why this notification matters — include primary keyword naturally]</h2>
[3-4 paragraphs. Hook. Why NOW. Personal observation. Human tone. Start with the opener word. Use <strong> and <mark> on key numbers.]

<h2 id='about'>What Is ${meta.orgName || "This Organization"} — And What Will You Actually Do There?</h2>
[4-5 paragraphs. Deep explanation from YOUR KNOWLEDGE. What the org does. Day-to-day job life. Posting locations. Why this is a dream job. "What people don't tell you about this job is..." Include 1-2 LSI keywords naturally.]

<h2 id='salary'>${meta.examName || meta.title} Salary — What Will You Actually Take Home?</h2>
[2 human paragraphs THEN an HTML salary table (Pay Level, Basic Pay, HRA by city class, DA%, TA, Gross, Deductions, Approx In-Hand). THEN 2 paragraphs comparing to private sector. Mention NPS pension, medical, job security. Use <strong> on all salary figures.]

Return ONLY the HTML. No markdown, no code blocks.
${customInstructions ? `\n=== ADMIN INSTRUCTIONS (FOLLOW STRICTLY) ===\n${customInstructions}` : ""}`;

  const raw = await callAI(HUMAN_BLOGGER_SYSTEM_PROMPT, prompt, false);
  return humanizeHtml(raw.replace(/^```html?\n?/i, "").replace(/```$/g, "").trim());
}

// ══════════════════════════════════════════════════════════════════════════════
// Step 2B: Part 2 — Dates, Eligibility, Vacancies, Selection, Prep, FAQ
// ══════════════════════════════════════════════════════════════════════════════
async function writePart2(meta: any, rawText: string, features: ReturnType<typeof detectContentFeatures>, customInstructions?: string, variant: BlogVariant = "standard") {
  const ctaStyle = getVariantCTAStyle(variant);
  const ctaTextColor = variant === "action-first" ? "#fff7ed" : variant === "candidate-first" ? "#d1fae5" : "#c7d2fe";

  // Feature-specific additions
  const featureAdditions = [
    features.hasAgeRelaxation ? "Include a DEDICATED AGE RELAXATION TABLE in the eligibility section covering SC/ST (5 years), OBC (3 years), PwD (10 years), Ex-Servicemen rules, Women candidates if applicable." : "",
    features.hasMultiplePosts ? "In the vacancy section, explicitly ask readers to check the official PDF for category-wise post breakdown — mention that the notification usually has a detailed table you can't fully reproduce here." : "",
    features.hasCutoffData ? "You have cutoff data in the notification — include actual figures in the cutoff section, not just estimates." : "",
    features.isGroupA ? "In the prep section, mention specifically that Group-A exams require sustained 12-18 month preparation — be realistic, not misleadingly encouraging." : "",
  ].filter(Boolean).join("\n");

  const prompt = `Write the SECOND HALF of an SEO-optimized, human-written blog post in HTML.

PRIMARY KEYWORD: "${meta.primaryKeyword || meta.title}"
RELATED KEYWORDS: ${meta.lsiKeywords || ""}
EXAM: ${meta.examName || meta.title}
ORG: ${meta.orgName || "the organization"}
VACANCIES: ${meta.totalPosts} | LAST DATE: ${meta.lastDate} | AGE: ${meta.ageLimit}
EDUCATION: ${meta.education} | FEE_GEN: ${meta.appFeeGen || "N/A"} | FEE_RES: ${meta.appFeeRes || "N/A"}

NOTIFICATION TEXT:
${rawText.substring(0, 1500)}

=== CONTENT INTELLIGENCE (ACT ON THESE) ===
${featureAdditions || "Standard government job — cover all sections with appropriate depth."}

=== SEO RULES ===
1. Each H2 must answer a specific search query someone would Google.
2. The FAQ section is critical for featured snippets — write direct, concise answers (50-80 words each).
3. Minimum 800 words for this half.
4. Use <strong> on all important terms, numbers, dates. Use <mark> on the most critical single figure.
5. ALL HTML attributes MUST use single quotes.

=== HUMAN WRITING RULES ===
1. Direct, slightly urgent tone — like a knowledgeable friend who wants you to succeed.
2. Mix short and long sentences. Never monotone.
3. Address reader directly: "you", "your", "you're"
4. "Every year, I see candidates miss this because...", "Don't make the mistake of..."
5. BANNED: delve, plethora, navigating, comprehensive, moreover, furthermore, transformative
6. ZERO emojis.

=== TABLE PLACEHOLDERS ===
Place '{{DATES_FEES_TABLE}}' immediately after the H2 with id='dates'.
Place '{{VACANCY_TABLE}}' immediately after the H2 with id='vacancies'.
Do NOT build these tables yourself.

=== HTML STRUCTURE TO GENERATE ===

<h2 id='dates'>${meta.primaryKeyword || meta.examName} Important Dates and Application Fee</h2>
{{DATES_FEES_TABLE}}
[1-2 paragraphs with urgency. Use <mark> on the last date. If ${features.hasFeeWaiver ? "SC/ST fee is WAIVED — mention this clearly with a SUCCESS BOX callout." : "mention payment modes."}]

<h2 id='eligibility'>${meta.primaryKeyword || meta.examName} Eligibility Criteria — Who Can Apply?</h2>
[Very detailed. Age limit with ALL relaxations. Education qualification explained simply. Common questions answered. Use <strong> on all age limits and qualification details.]

<h2 id='vacancies'>${meta.primaryKeyword || meta.examName} Vacancy Details — Category Wise</h2>
{{VACANCY_TABLE}}
[1 paragraph about competition reality. Be honest about how tough it is.]

<h2 id='selection'>${meta.primaryKeyword || meta.examName} Selection Process and Exam Pattern</h2>
[Most detailed section — 5-7 paragraphs minimum. For each exam stage use H3 with a small HTML table showing questions/marks/time/negative marking. "If I were starting prep from zero today..."]

<h2 id='prep'>How to Prepare for ${meta.examName || meta.primaryKeyword} — A Realistic 90-Day Plan</h2>
[THIS IS THE MOST IMPORTANT SECTION FOR TIME ON PAGE. 450+ words of ONLY flowing text — NO bullet lists. Paragraph-by-paragraph plan for Days 1-30, 31-60, 61-90. Books. Resources. "If I had to start from scratch tomorrow...". Small HTML table: Week Range | Focus Area | Key Resources | Daily Hours]

<h2 id='cutoff'>${meta.primaryKeyword || meta.examName} Expected Cutoff — Category Wise Prediction</h2>
[3-4 paragraphs. "This is the section most blogs skip — so let me give you an honest, data-driven estimate." Category-wise estimated cutoff HTML table labeled clearly as ESTIMATE. Factors affecting this year's cutoff. Honest score range assessment.]

<h2 id='apply'>How to Apply for ${meta.primaryKeyword || meta.examName} — Step by Step</h2>
[Numbered steps using <ol>. Then genuine warm Apply For Me pitch: "Here's something I always tell people — every year, good candidates get rejected not because they weren't eligible, but because of small mistakes in the form. Wrong photo size. Wrong category code. Signature issues. That's why the Apply For Me service at Rojgar Suvidha exists. You send your documents, our team fills the form correctly, double-checks everything, and submits it."]

<h2 id='faq'>Frequently Asked Questions About ${meta.primaryKeyword || meta.examName}</h2>
[Exactly 6 FAQs using details/summary tags. Each answer 50-80 words, direct. Use:
<details style='margin-bottom:1rem;border:1px solid #e5e7eb;border-radius:8px;padding:16px 20px;background:#f8fafc;'>
<summary style='font-weight:700;color:#4f46e5;cursor:pointer;font-size:1rem;list-style:none;'>Question here?</summary>
<p style='margin-top:10px;color:#475569;line-height:1.8;font-size:0.95rem;'>Direct answer. Then explanation. 50-80 words.</p>
</details>]

<!-- Closing CTA -->
<div style='${ctaStyle}border-radius:12px;padding:24px;margin-top:2rem;text-align:center;'>
<p style='color:white;font-weight:700;font-size:1.1rem;margin:0 0 8px;'>${meta.primaryKeyword || meta.examName} — Apply Before ${meta.lastDate}</p>
<p style='color:${ctaTextColor};font-size:0.9rem;margin:0 0 16px;'>Worried about making mistakes in the form? Let our experts handle it.</p>
<a href='/apply-for-me' style='display:inline-block;background:white;color:#4f46e5;font-weight:700;padding:10px 24px;border-radius:8px;text-decoration:none;font-size:0.95rem;'>Use Apply For Me Service →</a>
</div>

Return ONLY the HTML. No markdown, no code blocks.
${customInstructions ? `\n=== ADMIN INSTRUCTIONS (FOLLOW STRICTLY) ===\n${customInstructions}` : ""}`;

  const raw = await callAI(HUMAN_BLOGGER_SYSTEM_PROMPT, prompt, false);
  return humanizeHtml(raw.replace(/^```html?\n?/i, "").replace(/```$/g, "").trim());
}

// ══════════════════════════════════════════════════════════════════════════════
// B5: Category-Specific Blog Writer (Results, Admit Cards, News, Admission, Answer Key)
// ══════════════════════════════════════════════════════════════════════════════
async function writeSpecialCategoryBlog(
  meta: any,
  rawText: string,
  category: string,
  features: ReturnType<typeof detectContentFeatures>,
  customInstructions?: string,
  trendingKeywords?: string
): Promise<string> {

  const normalizedCategory = (category === "admit-card" || category === "admit-cards") ? "admit-card" : category;

  const resultToneNote = features.resultType === "selection"
    ? "This is a SELECTION RESULT — thousands of candidates learned if they cleared. Open with emotional awareness. Many will celebrate, some won't. Be warm and real."
    : features.resultType === "scorecard"
    ? "This is a SCORECARD RESULT — candidates can see their subject-wise marks. Help them understand their scorecard and what the numbers mean."
    : "This is a GENERAL RESULT announcement.";

  const urgencyBox = features.isUrgent
    ? `<div style='background:#fef2f2;border-left:4px solid #dc2626;padding:16px 20px;border-radius:8px;margin:1.5rem 0;color:#1e293b;'><strong style='color:#b91c1c;display:block;margin-bottom:4px;'>CRITICAL WARNING</strong>The deadline for this is approaching fast. Do not delay — take action today.</div>`
    : "";

  const trendingNote = trendingKeywords && trendingKeywords.trim()
    ? `\n=== TRENDING GOOGLE KEYWORDS (MUST WEAVE NATURALLY INTO HEADLINES & TEXT) ===\n${trendingKeywords.trim()}\n`
    : "";

  const admitCardPrompt = `Write a complete SEO-optimized human blog post about ADMIT CARD in HTML.
PRIMARY KEYWORD: "${meta.primaryKeyword || meta.title}"
EXAM: ${meta.examName} | ORG: ${meta.orgName} | EXAM DATE: ${meta.examDate || meta.lastDate}
REPORTING TIME: ${meta.reportingTime || "30 minutes before exam start"}
CONTENT: ${rawText.substring(0, 3000)}
${trendingNote}

${urgencyBox ? `PREPEND THIS URGENT BOX right after the H1 and byline:\n${urgencyBox}` : ""}

STRUCTURE & CRITICAL SECTIONS (Write at least 1,200 words):
<h1 style='font-size:2rem;font-weight:800;color:#1e1b4b;margin-bottom:1rem;line-height:1.3;'>[H1: primary keyword + "Admit Card Download" + 2026]</h1>
<p style='font-size:0.85rem;color:#6b7280;margin-bottom:1rem;'>By <strong>Rojgar Suvidha Editorial Team</strong> &nbsp;|&nbsp; Exam Date: <strong>${meta.examDate || meta.lastDate}</strong></p>
<div style='background:#fff7ed;border-left:4px solid #f97316;border-radius:8px;padding:16px 20px;margin-bottom:2rem;'><p style='font-weight:700;color:#c2410c;margin:0 0 4px;'>Exam Date: ${meta.examDate || meta.lastDate}</p><p style='color:#374151;margin:0;font-size:0.95rem;'>Download your admit card immediately. Do not wait until the last day — servers get overloaded.</p></div>

<h2 id='intro'>The ${meta.examName} Admit Card Is Out — What You Must Do Now</h2>
[4-5 rich paragraphs. Why urgency matters. "Every exam season, I see candidates show up at centers without a valid ID or with a blurry printout."]

<h2 id='download'>How to Download ${meta.examName} Admit Card — Step by Step Guide</h2>
[3 paragraphs intro. Then numbered ol steps. After steps: "Print at least 2 clear copies."]

<h2 id='details'>What Is Written on Your ${meta.examName} Admit Card — Read This Carefully</h2>
[4-5 paragraphs explaining each field on the admit card. "Check your name spelling against your ID proof."]

<h2 id='carry'>What to Carry on Exam Day — And What to Leave Behind</h2>
[2 paragraphs intro. Then this EXAM DAY CHECKLIST HTML TABLE:
<div style='overflow-x:auto;margin-bottom:1.5rem;border-radius:8px;border:1px solid #e5e7eb;'>
<table style='width:100%;border-collapse:collapse;min-width:400px;font-size:0.9rem;'>
<thead><tr style='background:#4f46e5;color:white;'><th style='padding:10px 14px;text-align:left;'>MUST CARRY TO EXAM CENTER</th><th style='padding:10px 14px;text-align:left;'>STRICTLY BANNED (LEAVE AT HOME)</th></tr></thead>
<tbody>
<tr style='border-bottom:1px solid #f1f5f9;'><td style='padding:10px 14px;color:#374151;'>Admit Card (Printed Copy)</td><td style='padding:10px 14px;color:#dc2626;'>Mobile Phone & Smart Watch</td></tr>
<tr style='border-bottom:1px solid #f1f5f9;'><td style='padding:10px 14px;color:#374151;'>Original Photo ID (Aadhaar / Voter ID / Passport)</td><td style='padding:10px 14px;color:#dc2626;'>Bluetooth Devices & Earphones</td></tr>
<tr style='border-bottom:1px solid #f1f5f9;'><td style='padding:10px 14px;color:#374151;'>Passport-size Photos (2-3 extra copies)</td><td style='padding:10px 14px;color:#dc2626;'>Calculators & Electronic Gadgets</td></tr>
<tr><td style='padding:10px 14px;color:#374151;'>Transparent Blue/Black Pen</td><td style='padding:10px 14px;color:#dc2626;'>Books, Notes & Paper Chits</td></tr>
</tbody>
</table>
</div>
Then 2 paragraphs on consequences of violations.]

<h2 id='problem'>Admit Card Problem? Here Is Exactly What to Do</h2>
[4-5 paragraphs covering different problems: name error, photo not loading, center mismatch, forgot registration number. Helpdesk instructions.]

<h2 id='tips'>Last-Week Exam Preparation & Exam Day Tips</h2>
[6-7 rich paragraphs of practical advice — sleep routine, revision strategy, reaching exam hall 45 mins early, managing time.]

<h2 id='faq'>Frequently Asked Questions About ${meta.primaryKeyword}</h2>
[6 detailed FAQs using details/summary tags. 60-80 words per answer. Covers: forgot registration number, ID proof rules, wrong details correction, center changes.]

<!-- Official Download CTA -->
<div style='background:linear-gradient(135deg,#f97316,#ea580c);border-radius:12px;padding:24px;margin-top:2rem;text-align:center;'>
<p style='color:white;font-weight:700;font-size:1.1rem;margin:0 0 8px;'>${meta.examName || meta.primaryKeyword} — Official Admit Card Download</p>
<p style='color:#ffedd5;font-size:0.9rem;margin:0 0 16px;'>Verify your exam center, roll number, and instructions immediately.</p>
<a href='/admit-card' style='display:inline-block;background:white;color:#ea580c;font-weight:700;padding:10px 24px;border-radius:8px;text-decoration:none;font-size:0.95rem;'>Download Official Admit Card →</a>
</div>`;

  const resultsPrompt = `Write a complete SEO-optimized human blog post about a RESULT in HTML.
PRIMARY KEYWORD: "${meta.primaryKeyword || meta.title}"
EXAM: ${meta.examName} | ORG: ${meta.orgName} | RESULT DATE: ${meta.resultDate || meta.lastDate}
NEXT STEP: ${meta.nextStep || "Not specified"}
CUTOFFS IF KNOWN: General: ${meta.cutoffGen || "Not Announced"} | OBC: ${meta.cutoffOBC || "N/A"} | SC/ST: ${meta.cutoffSCST || "N/A"}
CONTENT: ${rawText.substring(0, 3000)}
${trendingNote}
TONE NOTE: ${resultToneNote}

STRUCTURE (Write at least 1,200 words):
<h1 style='font-size:2rem;font-weight:800;color:#1e1b4b;margin-bottom:1rem;line-height:1.3;'>[H1: primary keyword + "Result Declared 2026"]</h1>
<p style='font-size:0.85rem;color:#6b7280;margin-bottom:1rem;'>By <strong>Rojgar Suvidha Editorial Team</strong> &nbsp;|&nbsp; Updated: <strong>${new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</strong></p>
<div style='background:#f0fdf4;border-left:4px solid #16a34a;border-radius:8px;padding:16px 20px;margin-bottom:2rem;'><p style='font-weight:700;color:#15803d;margin:0 0 4px;'>GOOD NEWS — Result Declared!</p><p style='color:#374151;margin:0;font-size:0.95rem;'>${meta.examName} result is officially out. Check your scorecard and merit list using the steps below.</p></div>

<h2 id='news'>${meta.primaryKeyword} — What You Need to Know Right Now</h2>
[4-5 rich paragraphs. Open with the result fact. How many appeared, what stages cleared. Warm human voice. Use <strong> on key numbers.]

<h2 id='check'>How to Check ${meta.examName} Result Online — Step by Step</h2>
[3 paragraphs. Numbered ol steps. Direct download link advice.]

<h2 id='details'>Cutoff Marks, Merit List & Scorecard — Category Wise Breakdown</h2>
[4-5 paragraphs. Category-wise cutoff HTML table. Explain scorecard details.]

<h2 id='next'>What Happens Next — Your Action Plan After ${meta.examName} Result</h2>
[4-5 practical paragraphs about ${meta.nextStep || "document verification, medical test, joining process"}. What documents to collect now.]

<h2 id='failed'>Did Not Clear This Time? Read This.</h2>
[4 honest, warm paragraphs. Acknowledge it hurts — no fake motivation. Re-attempt strategy. Other active job notifications.]

<h2 id='faq'>Frequently Asked Questions About ${meta.primaryKeyword}</h2>
[6 FAQs using details/summary. Scorecard download, category cutoffs, DV schedule, re-evaluation.]

<!-- Result CTA -->
<div style='background:linear-gradient(135deg,#16a34a,#15803d);border-radius:12px;padding:24px;margin-top:2rem;text-align:center;'>
<p style='color:white;font-weight:700;font-size:1.1rem;margin:0 0 8px;'>${meta.examName || meta.primaryKeyword} — Check Result & Merit List</p>
<p style='color:#dcfce7;font-size:0.9rem;margin:0 0 16px;'>Official scorecards and selection lists are live.</p>
<a href='/results' style='display:inline-block;background:white;color:#15803d;font-weight:700;padding:10px 24px;border-radius:8px;text-decoration:none;font-size:0.95rem;'>Check Official Result & Cutoff →</a>
</div>`;

  const answerKeyPrompt = `Write a complete SEO-optimized human blog post about ANSWER KEY in HTML.
PRIMARY KEYWORD: "${meta.primaryKeyword || meta.title}"
EXAM: ${meta.examName} | ORG: ${meta.orgName} | OBJECTION DEADLINE: ${meta.objectionDeadline || meta.lastDate}
MARKING SCHEME: ${meta.markingScheme || "Check official notification"}
OBJECTION FEE: ${meta.objectionFee || "As per notification"}
CONTENT: ${rawText.substring(0, 3000)}
${trendingNote}

STRUCTURE (Write at least 1,200 words):
<h1 style='font-size:2rem;font-weight:800;color:#1e1b4b;margin-bottom:1rem;line-height:1.3;'>[H1: primary keyword + "Answer Key Out" + 2026]</h1>
<p style='font-size:0.85rem;color:#6b7280;margin-bottom:1rem;'>By <strong>Rojgar Suvidha Editorial Team</strong> &nbsp;|&nbsp; Objection Deadline: <strong>${meta.objectionDeadline || meta.lastDate}</strong></p>

<h2 id='released'>${meta.examName} Answer Key Is Out — Action Needed in 24 Hours</h2>
[4-5 paragraphs. Why checking key urgently matters.]

<h2 id='download'>How to Download ${meta.examName} Official Answer Key</h2>
[2 paragraphs. Numbered ol download steps.]

<h2 id='calculate'>How to Calculate Your Expected Score — With Worked Examples</h2>
[4-5 paragraphs. Explain marking scheme. Add a WORKED SCORE CALCULATOR HTML TABLE showing attempted, correct, wrong, and net score calculation.]

<h2 id='objection'>How to Raise an Objection — Step by Step Guide</h2>
[5-6 paragraphs. Step-by-step objection process, fee, proof needed.]

<h2 id='cutoff'>Expected Cutoff — Category Wise Prediction</h2>
[4-5 paragraphs. Category-wise cutoff prediction HTML table.]

<h2 id='faq'>Frequently Asked Questions About ${meta.primaryKeyword}</h2>
[6 FAQs using details/summary. Matching sets, objection fees, final key release, expected result date.]

<!-- Answer Key CTA -->
<div style='background:linear-gradient(135deg,#9333ea,#7e22ce);border-radius:12px;padding:24px;margin-top:2rem;text-align:center;'>
<p style='color:white;font-weight:700;font-size:1.1rem;margin:0 0 8px;'>${meta.examName || meta.primaryKeyword} — Official Answer Key & Objection Portal</p>
<p style='color:#f3e8ff;font-size:0.9rem;margin:0 0 16px;'>Check your responses and submit challenges before the deadline.</p>
<a href='/answer-key' style='display:inline-block;background:white;color:#7e22ce;font-weight:700;padding:10px 24px;border-radius:8px;text-decoration:none;font-size:0.95rem;'>View Official Answer Key →</a>
</div>`;

  const prompts: Record<string, string> = {
    results: resultsPrompt,
    "admit-card": admitCardPrompt,
    "admit-cards": admitCardPrompt,
    "answer-key": answerKeyPrompt,
    news: `Write a complete SEO-optimized human blog post in NEWS ARTICLE style in HTML.
PRIMARY KEYWORD: "${meta.primaryKeyword || meta.title}"
TOPIC: ${meta.examName} | ORG: ${meta.orgName}
CONTENT: ${rawText.substring(0, 3000)}
${trendingNote}

STRUCTURE:
<h1 style='font-size:2rem;font-weight:800;color:#1e1b4b;margin-bottom:1rem;line-height:1.3;'>[H1: specific factual headline, include primary keyword]</h1>
<p style='font-size:0.85rem;color:#6b7280;margin-bottom:1rem;'>By <strong>Rojgar Suvidha Editorial Team</strong> &nbsp;|&nbsp; Published: <strong>${new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</strong></p>

<h2 id='summary'>Breaking: ${meta.examName} — What Happened</h2>
[4-5 paragraphs. Lead paragraph first. Short factual sentences.]

<h2 id='detail'>Full Details — Everything You Need to Know</h2>
[5-6 paragraphs expanding on official announcement.]

<h2 id='impact'>How This Affects Aspirants — Analysis</h2>
[4-5 paragraphs. Practical impact on candidates.]

<h2 id='next'>What Happens Next — Timeline and Upcoming Dates</h2>
[3-4 paragraphs. What to expect next.]

<h2 id='faq'>Frequently Asked Questions</h2>
[6 FAQs using details/summary tags.]`,

    admission: `Write a complete SEO-optimized human blog post about ADMISSION in HTML.
PRIMARY KEYWORD: "${meta.primaryKeyword || meta.title}"
COURSE: ${meta.examName} | ORG: ${meta.orgName} | LAST DATE: ${meta.lastDate}
CONTENT: ${rawText.substring(0, 3000)}
${trendingNote}

STRUCTURE:
<h1 style='font-size:2rem;font-weight:800;color:#1e1b4b;margin-bottom:1rem;line-height:1.3;'>[H1: primary keyword + "Admission 2026"]</h1>
<p style='font-size:0.85rem;color:#6b7280;margin-bottom:1rem;'>By <strong>Rojgar Suvidha Editorial Team</strong> &nbsp;|&nbsp; Last Date: <strong>${meta.lastDate}</strong></p>

<h2 id='about'>What Is This Course and Why Should You Consider It?</h2>
[4-5 rich paragraphs. Course overview and career prospects.]

<h2 id='eligibility'>Are You Eligible? Eligibility Criteria Explained Simply</h2>
[4-5 paragraphs. Educational qualification and age criteria.]

<h2 id='dates'>Important Dates and Application Fee</h2>
[Dates and fee HTML tables.]

<h2 id='apply'>How to Apply — Complete Step by Step Guide</h2>
[Numbered steps + Apply For Me service pitch for form filling.]

<h2 id='selection'>How Selection Works — Entrance Exam, Merit List or Counselling</h2>
[4-5 paragraphs detailing selection rounds.]

<h2 id='faq'>Frequently Asked Questions About ${meta.primaryKeyword}</h2>
[6 FAQs using details/summary tags.]`
  };

  const selectedPrompt = prompts[normalizedCategory] || prompts["news"];

  const blogPrompt = `${selectedPrompt}

HUMAN WRITING RULES:
- Write like a knowledgeable, warm friend — not a textbook.
- Mix short and long sentences (burstiness is key).
- Use "you" and "your" constantly.
- Banned words: delve, plethora, crucial, navigating, comprehensive, moreover, furthermore, transformative
- ZERO emojis.
- Use <p> for prose, <ol>/<ul> only for lists.
- ALL HTML attributes MUST use single quotes.
- For every table, wrap in: <div style='overflow-x:auto;-webkit-overflow-scrolling:touch;margin-bottom:1.5rem;border-radius:8px;border:1px solid #e5e7eb;'>

Return ONLY the HTML. No markdown, no code blocks.
${customInstructions ? `\n=== ADMIN INSTRUCTIONS (FOLLOW STRICTLY) ===\n${customInstructions}` : ""}`;

  const raw = await callAI(HUMAN_BLOGGER_SYSTEM_PROMPT, blogPrompt, false);
  return humanizeHtml(raw.replace(/^```html?\n?/i, "").replace(/```$/g, "").trim());
}

// ══════════════════════════════════════════════════════════════════════════════
// Main Handler
// ══════════════════════════════════════════════════════════════════════════════
export async function POST(req: Request) {
  try {
    const { rawText, category = "latest-jobs", customInstructions = "", officialLink = "", trendingKeywords = "" } = await req.json();

    console.log("AI Super Writer Invoked. Env Check:", {
      hasGeminiKey: !!process.env.GEMINI_API_KEY,
      hasGroqKey: !!process.env.GROQ_API_KEY
    });

    if (!rawText || rawText.length < 50) {
      return NextResponse.json({ error: "Please paste longer text (min 50 chars)." }, { status: 400 });
    }

    // Combine customInstructions with trendingKeywords if provided
    const combinedInstructions = [
      customInstructions,
      trendingKeywords && trendingKeywords.trim() ? `TRENDING GOOGLE KEYWORDS TO WEAVE NATURALLY IN TEXT & H2s: ${trendingKeywords.trim()}` : ""
    ].filter(Boolean).join("\n\n");

    // B1: Run content intelligence BEFORE calling AI
    const features = detectContentFeatures(rawText);

    // B4: Category-aware metadata extraction
    const metadata = await extractMetadata(rawText, category, combinedInstructions);
    metadata.category = category;

    // Update features title-check now that we have the title
    const featuresWithTitle = detectContentFeatures(rawText, metadata.title || "");

    let blogHtml: string;

    if (category === "latest-jobs") {
      const variant = pickBlogVariant();

      let part1 = await writePart1(metadata, rawText, featuresWithTitle, combinedInstructions, variant);
      await new Promise(resolve => setTimeout(resolve, 1000));
      let part2 = await writePart2(metadata, rawText, featuresWithTitle, combinedInstructions, variant);

      // Inject programmatic tables
      const overviewTable = generateOverviewTable(metadata);
      const datesFeesTable = generateDatesFeesTable(metadata);
      const vacancyTable = generateVacancyTable(metadata);

      if (part1.includes("{{OVERVIEW_TABLE}}")) {
        part1 = part1.replace("{{OVERVIEW_TABLE}}", overviewTable);
      } else {
        const tocEndTag = "</div>";
        const tocIndex = part1.indexOf(tocEndTag);
        if (tocIndex !== -1) {
          const insertPos = tocIndex + tocEndTag.length;
          part1 = part1.slice(0, insertPos) + "\n\n" + overviewTable + part1.slice(insertPos);
        } else {
          part1 = overviewTable + "\n\n" + part1;
        }
      }

      if (part2.includes("{{DATES_FEES_TABLE}}")) {
        part2 = part2.replace("{{DATES_FEES_TABLE}}", datesFeesTable);
      } else {
        const datesHeader = "id='dates'>";
        const headerIndex = part2.indexOf(datesHeader);
        if (headerIndex !== -1) {
          const insertPos = part2.indexOf("</h2>", headerIndex) + 5;
          part2 = part2.slice(0, insertPos) + "\n\n" + datesFeesTable + part2.slice(insertPos);
        }
      }

      if (part2.includes("{{VACANCY_TABLE}}")) {
        part2 = part2.replace("{{VACANCY_TABLE}}", vacancyTable);
      } else {
        const vacancyHeader = "id='vacancies'>";
        const headerIndex = part2.indexOf(vacancyHeader);
        if (headerIndex !== -1) {
          const insertPos = part2.indexOf("</h2>", headerIndex) + 5;
          part2 = part2.slice(0, insertPos) + "\n\n" + vacancyTable + part2.slice(insertPos);
        }
      }

      // Inject physical standards callout if applicable
      let assembled = `${part1}\n\n${part2}`;
      if (featuresWithTitle.hasPhysicalTest) {
        const physicalBox = generatePhysicalStandardsBox();
        const eligibilityMarker = "id='eligibility'";
        const eligIdx = assembled.indexOf(eligibilityMarker);
        if (eligIdx !== -1) {
          const h2End = assembled.indexOf("</h2>", eligIdx) + 5;
          assembled = assembled.slice(0, h2End) + "\n" + physicalBox + assembled.slice(h2End);
        }
      }

      blogHtml = assembled;
    } else {
      // B5: Category-specific writer with content intelligence
      blogHtml = await writeSpecialCategoryBlog(metadata, rawText, category, featuresWithTitle, combinedInstructions, trendingKeywords);
    }

    // Post-process pipeline
    blogHtml = injectJobPostingSchema(blogHtml, metadata); // F1-A: Google Jobs tab schema
    blogHtml = injectFaqSchema(blogHtml, metadata.title);
    blogHtml = injectInternalLinks(blogHtml, category);
    blogHtml = autoHighlightNumbers(blogHtml); // B2: Auto-highlight fees, dates, vacancies

    // Append official notification trust box
    if (officialLink && officialLink.trim()) {
      const officialBox = `
<div style='background:#f0fdf4;border:2px solid #16a34a;border-radius:12px;padding:20px 24px;margin:2rem 0;display:flex;align-items:flex-start;gap:16px;'>
  <div style='flex:1;'>
    <p style='font-weight:800;color:#15803d;margin:0 0 6px;font-size:1rem;'>Official Notification — Verified Source</p>
    <p style='color:#374151;margin:0 0 12px;font-size:0.9rem;line-height:1.6;'>This post is based on the official government notification. For complete and accurate information, download the original PDF below.</p>
    <a href='${officialLink.trim()}' target='_blank' rel='noopener noreferrer nofollow' style='display:inline-flex;align-items:center;gap:8px;background:#16a34a;color:white;font-weight:700;padding:10px 22px;border-radius:8px;text-decoration:none;font-size:0.9rem;'>Download Official PDF / Notification →</a>
    <p style='margin:10px 0 0;font-size:0.78rem;color:#6b7280;'>Source: Official Government Website &nbsp;|&nbsp; Always verify from the official source before applying.</p>
  </div>
</div>`;
      blogHtml = blogHtml + "\n" + officialBox;
    }

    return NextResponse.json({ ...metadata, officialLink, blogHtml, contentFeatures: featuresWithTitle });
  } catch (error: any) {
    console.error("AI Super Writer Error Detail:", error.stack || error.message);
    const hasGemini = !!process.env.GEMINI_API_KEY;
    const hasGroq = !!process.env.GROQ_API_KEY;
    const diagnostics = `[Vercel Keys Status - Gemini: ${hasGemini ? "SET" : "MISSING"}, Groq: ${hasGroq ? "SET" : "MISSING"}]`;
    return NextResponse.json({ error: `Super Writer Error: ${error.message}. ${diagnostics}` }, { status: 500 });
  }
}
