import { NextResponse } from "next/server";

export const maxDuration = 60;

// ══════════════════════════════════════════════════════════════════════════════
// 🧠 MASTER HUMAN BLOGGER SYSTEM PROMPT
// Applied to ALL AI writer calls to ensure human voice + SEO quality
// ══════════════════════════════════════════════════════════════════════════════
const HUMAN_BLOGGER_SYSTEM_PROMPT = `You are an experienced human blogger and SEO content writer for Rojgar Suvidha, India's #1 government job portal. Write blog posts that feel genuinely written by a real person who deeply understands government job aspirants.

=== VOICE & TONE (Sound Human) ===
- Write like a real person who has opinions, doubts, and experiences
- Use "I" naturally when it fits: "I've seen this happen...", "Honestly, I think...", "Every year I tell candidates..."
- Vary sentence length — mix short punchy sentences with longer flowing ones. Short. Then longer. Then short again.
- Add light humor, personality, or honest opinions where it fits
- It's okay to have a slight tangent or personal aside — that's human
- Never sound like you're narrating a documentary or reading a textbook
- Your reader is a nervous student from a small town who passed Class 12. Write for them.

=== BANNED AI PATTERNS (STRICTLY FORBIDDEN) ===
NEVER use these openers: "In today's rapidly evolving landscape...", "In a significant development...", "It goes without saying..."
NEVER use these words: groundbreaking, pivotal, testament, underscores, encompasses, showcases, delves, navigates, spearheads, foster, leverage, seamless, empower, transformative, utilize, facilitate, endeavour, approximately, subsequently, previously, individuals, demonstrate, commence, terminate, sufficient, regarding, ensure, ascertain, pertaining, henceforth, plethora, crucial, comprehensive, moreover, furthermore
NEVER end with: "In conclusion, the future looks bright", "exciting times lie ahead", "transformative journey"
NEVER write rule-of-three lists like: "fast, reliable, and powerful"
NEVER use em dashes (—) for dramatic effect everywhere
NEVER start sentences with: "It's important to note that...", "It is worth mentioning that..."
NEVER use: "Let's dive in", "Let's explore", signposting phrases
NEVER use bullet points with emoji icons like 🚀✅💡
NEVER use filler: "At its core", "In order to", "needless to say", "in today's world"
NEVER write: "Great question!", "I hope this helps!", "as an AI language model"

=== SEO RULES (NON-NEGOTIABLE) ===
- Use the main keyword naturally in: title (H1), first 100 words, at least 2-3 subheadings (H2), and last paragraph
- Use 2-4 related LSI keywords throughout the article naturally — never stuffed
- Keep paragraphs short: 2-4 lines max for readability
- Use H2 and H3 headings logically — each H2 should answer a specific question someone would Google
- Answer the main question directly in 40-60 words early in the article (for featured snippet)
- All HTML attributes MUST use single quotes

=== STRUCTURE ===
1. H1 title — catchy, clear, includes keyword, max 65 chars
2. Opening paragraph — hook with a relatable situation or surprising fact (NOT a generic intro)
3. Featured snippet answer — 40-60 words directly answering the main question
4. Main body — H2/H3 subheadings, flowing naturally, personal observations included
5. Personal insight section — at least once: "Here's what most candidates don't realise..."
6. FAQ section — 3-6 real questions people actually search, using <details>/<summary> tags
7. Closing paragraph — give reader a next step or honest takeaway (NO "exciting journey" endings)

=== HTML FORMAT ===
- Use single quotes for ALL HTML attributes
- Wrap every table in: <div style='overflow-x:auto;-webkit-overflow-scrolling:touch;margin-bottom:1.5rem;border-radius:8px;border:1px solid #e5e7eb;'>
- Tables minimum width 400px, use <thead> with indigo header (#4f46e5)
- FAQ: use <details style='margin-bottom:1rem;border:1px solid #e5e7eb;border-radius:8px;padding:16px 20px;background:#f8fafc;'> and <summary style='font-weight:700;color:#4f46e5;cursor:pointer;'>
- Return ONLY valid HTML. No markdown. No code blocks. No explanations before or after.

=== FINAL CHECK ===
Before finishing, ask yourself: "Would a human editor look at this and think it was written by a real person?"
If any section sounds too clean, too balanced, or too AI-like — rewrite it with more personality and specific details.`;

// ── Humanizer: Post-process AI HTML to ensure natural vocabulary without breaking tags ──────────────
function humanizeHtml(html: string): string {
  // 1. Replace overly formal words with natural equivalents
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
  ];

  let out = html;
  for (const [pattern, replacement] of wordMap) {
    out = out.replace(pattern, replacement as any);
  }

  return out;
}

// ── Step 1: Extract metadata (Groq, fast JSON) ─────────────────────────────────
async function extractMetadata(rawText: string, groqApiKey: string, category: string, customInstructions?: string) {
  const categoryHint: Record<string, string> = {
    "latest-jobs":  `"appFee": "e.g. General: Rs.100 | SC/ST: Free", "ageLimit": "18-27 years", "education": "qualification", "totalPosts": "vacancy count", "lastDate": "last date to apply"`,
    "results":      `"appFee": "N/A", "ageLimit": "N/A", "education": "N/A", "totalPosts": "total selected if mentioned", "lastDate": "result declared date"`,
    "admit-cards":  `"appFee": "N/A", "ageLimit": "N/A", "education": "N/A", "totalPosts": "N/A", "lastDate": "exam date"`,
    "news":         `"appFee": "N/A", "ageLimit": "N/A", "education": "N/A", "totalPosts": "N/A", "lastDate": "news date"`,
    "admission":    `"appFee": "application fee", "ageLimit": "age limit if any", "education": "qualification required", "totalPosts": "total seats", "lastDate": "last date to apply"`,
    "answer-key":   `"appFee": "objection fee if any", "ageLimit": "N/A", "education": "N/A", "totalPosts": "N/A", "lastDate": "objection window last date"`,
  };

  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${groqApiKey}` },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: "You are a JSON extractor. Return only valid JSON." },
        {
          role: "user",
          content: `Extract info from this ${category} content. Return ONLY this JSON:
{
  "title": "SEO title max 70 chars, include exam/org name + year, no emojis",
  "category": "${category}",
  "metaDesc": "150-160 char SEO meta description with call to action",
  "shortInfo": "2 sentences for card preview, plain text",
  ${categoryHint[category] || categoryHint["latest-jobs"]},
  "orgName": "full organization name",
  "examName": "exam or content name",
  "primaryKeyword": "main SEO keyword e.g. 'SSC CGL Result 2025'",
  "lsiKeywords": "5 related keywords comma separated"
}
${customInstructions ? `\nADDITIONAL CONTEXT: ${customInstructions}` : ""}
CONTENT:
${rawText.substring(0, 3000)}

Return ONLY the JSON.`,
        },
      ],
      temperature: 0.1,
      max_tokens: 900,
      response_format: { type: "json_object" },
    }),
  });
  const data = await res.json();
  if (data.error) throw new Error(`Groq metadata: ${data.error.message}`);
  const text = data.choices?.[0]?.message?.content;
  if (!text) throw new Error("No metadata returned");
  return JSON.parse(text);
}


// ── Step 2A: SEO-optimized Part 1 (H1, ToC, Intro, Org, Salary) ──────────────
async function writePart1(meta: any, rawText: string, groqApiKey: string, customInstructions?: string) {
  const prompt = `Write the FIRST HALF of an SEO-optimized, human-written blog post in HTML.

PRIMARY KEYWORD: "${meta.primaryKeyword || meta.title}"
RELATED KEYWORDS TO USE NATURALLY: ${meta.lsiKeywords || ""}
EXAM: ${meta.examName || meta.title}
ORG: ${meta.orgName || "the organization"}
VACANCIES: ${meta.totalPosts}
LAST DATE: ${meta.lastDate}
AGE: ${meta.ageLimit}
EDUCATION: ${meta.education}
FEE: ${meta.appFee}

NOTIFICATION TEXT:
${rawText.substring(0, 1500)}

=== SEO RULES (NON-NEGOTIABLE) ===
1. PRIMARY KEYWORD must appear in: the H1, first paragraph (first 100 words), at least 2 H2s, and naturally throughout.
2. Use LSI/related keywords naturally throughout — do NOT keyword stuff.
3. Each H2 section should be answering a specific question a user would Google.
4. Write minimum 600 words for this half.
5. Use <strong> tags around important terms, numbers, dates.
6. ALL HTML attributes MUST use single quotes.

=== HUMAN WRITING RULES ===
1. Write like a knowledgeable friend explaining this over chai — warm but informative.
2. Mix sentence lengths. Some very short (3-5 words). Some longer and detailed.
3. Use "you" and "your" constantly. Talk directly to the reader.
4. Use casual connectors: "Look,", "Here's the thing —", "Okay so,", "Honestly,", "Now,"
5. Add personal observations: "What most students don't realize is...", "Every year I see candidates miss this because..."
6. Occasional self-correction adds authenticity: "The salary is — well, let me be specific —"
7. BANNED WORDS: delve, plethora, crucial, navigating, landscape, testament, moreover, furthermore, comprehensive, leverage, transformative, needless to say, in today's world
8. ZERO emojis. Use <p> tags for all narrative text (no bullet points for prose).

=== HTML STRUCTURE TO GENERATE ===

<!-- SEO H1: Must contain primary keyword, be compelling, max 65 chars -->
<h1 style='font-size:2rem;font-weight:800;color:#1e1b4b;margin-bottom:1rem;line-height:1.3;'>[H1 with primary keyword]</h1>

<!-- Author + Date line for E-E-A-T -->
<p style='font-size:0.85rem;color:#6b7280;margin-bottom:1.5rem;'>By <strong>Rojgar Suvidha Editorial Team</strong> &nbsp;|&nbsp; Last Updated: ${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })} &nbsp;|&nbsp; <strong>${meta.totalPosts} Vacancies</strong> &nbsp;|&nbsp; Last Date: <strong>${meta.lastDate}</strong></p>

<!-- Quick Info Box for Featured Snippet -->
<div style='background:#eff6ff;border-left:4px solid #4f46e5;border-radius:8px;padding:16px 20px;margin-bottom:2rem;'>
<p style='font-weight:700;color:#1e1b4b;margin:0 0 8px;font-size:1.05rem;'>${meta.primaryKeyword || meta.title} — Quick Overview</p>
<p style='margin:4px 0;color:#374151;font-size:0.95rem;'><strong>Total Posts:</strong> ${meta.totalPosts}</p>
<p style='margin:4px 0;color:#374151;font-size:0.95rem;'><strong>Last Date to Apply:</strong> ${meta.lastDate}</p>
<p style='margin:4px 0;color:#374151;font-size:0.95rem;'><strong>Age Limit:</strong> ${meta.ageLimit}</p>
<p style='margin:4px 0;color:#374151;font-size:0.95rem;'><strong>Application Fee:</strong> ${meta.appFee}</p>
<p style='margin:4px 0;color:#374151;font-size:0.95rem;'><strong>Education Required:</strong> ${meta.education}</p>
</div>



<h2 id='intro'>[H2 about why this notification matters — include primary keyword naturally]</h2>
[3-4 paragraphs. Hook. Why NOW. Personal observation. Human tone. Include primary keyword in first paragraph.]

<h2 id='about'>What Is ${meta.orgName || "This Organization"} — And What Will You Actually Do There?</h2>
[4-5 paragraphs. Deep explanation from YOUR KNOWLEDGE. What the org does. Day-to-day job life. Posting locations. Authority/power of the role. Why this is a dream job. "What people don't tell you about this job is..." Include 1-2 LSI keywords naturally.]

<h2 id='salary'>${meta.examName || meta.title} Salary — What Will You Actually Take Home?</h2>
[2 human paragraphs THEN HTML salary table (Pay Level, Basic Pay, HRA by city class, DA%, TA, Gross, Deductions, Approx In-Hand). THEN 2 paragraphs: "So what does this mean in real life? Let's say you get posted in a Tier-2 city..." Compare to private sector briefly. Mention NPS pension, medical, job security.]

HTML table style — ALWAYS wrap every table in a scroll div (for mobile):
<div style='overflow-x:auto;-webkit-overflow-scrolling:touch;margin-bottom:1.5rem;border-radius:8px;border:1px solid #e5e7eb;'>
<table style='width:100%;border-collapse:collapse;min-width:400px;'>
<thead><tr><th style='background-color:#4f46e5;color:white;padding:12px 16px;text-align:left;font-weight:600;white-space:nowrap;'>Header</th></tr></thead>
<tbody><tr><td style='padding:12px 16px;border-bottom:1px solid #e5e7eb;color:#374151;'>Data</td></tr></tbody>
</table>
</div>

Return ONLY the HTML. No markdown, no code blocks, no explanations before or after.
${customInstructions ? `\n=== ADMIN INSTRUCTIONS (FOLLOW STRICTLY) ===\n${customInstructions}` : ""}`;

  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${groqApiKey}` },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content: HUMAN_BLOGGER_SYSTEM_PROMPT,
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.95,
      max_tokens: 3500,
      frequency_penalty: 0.6,
      presence_penalty: 0.4,
    }),
  });
  const data = await res.json();
  if (data.error) throw new Error(`Part1: ${data.error.message}`);
  const raw = (data.choices?.[0]?.message?.content || "").replace(/^```html?\n?/i, "").replace(/```$/g, "").trim();
  return humanizeHtml(raw);
}

// ── Step 2B: Part 2 (Dates, Eligibility, Vacancies, Selection, Apply, FAQs) ────
async function writePart2(meta: any, rawText: string, groqApiKey: string, customInstructions?: string) {
  const prompt = `Write the SECOND HALF of an SEO-optimized, human-written blog post in HTML.

PRIMARY KEYWORD: "${meta.primaryKeyword || meta.title}"
RELATED KEYWORDS: ${meta.lsiKeywords || ""}
EXAM: ${meta.examName || meta.title}
ORG: ${meta.orgName || "the organization"}
VACANCIES: ${meta.totalPosts} | LAST DATE: ${meta.lastDate} | AGE: ${meta.ageLimit}
EDUCATION: ${meta.education} | FEE: ${meta.appFee}

NOTIFICATION TEXT:
${rawText.substring(0, 1500)}

=== SEO RULES ===
1. Each H2 must answer a specific search query someone would Google.
2. The FAQ section is critical for featured snippets — write direct, concise answers (50-80 words each).
3. Use LSI keywords naturally throughout.
4. Minimum 700 words for this half.
5. ALL HTML attributes MUST use single quotes.

=== HUMAN WRITING RULES ===
1. Direct, slightly urgent tone — like a knowledgeable friend who wants you to succeed.
2. Mix short and long sentences. Never monotone.
3. Address reader directly: "you", "your", "you're"
4. Add real talk: "Every year, I see candidates miss this because...", "Don't make the mistake of..."
5. Occasional casual phrasing: "Okay,", "Look,", "Here's what you need to know —"
6. BANNED: delve, plethora, crucial, navigating, comprehensive, moreover, furthermore, transformative
7. ZERO emojis. Use <p> for prose, <ol>/<ul> only for step-by-step.

=== HTML STRUCTURE TO GENERATE ===

<h2 id='dates'>${meta.primaryKeyword || meta.examName} Important Dates and Application Fee</h2>
[1-2 direct paragraphs with urgency — why acting early matters. HTML table for important dates. HTML table for fee (General/OBC/SC/ST/EWS/PwD rows). Short closing line with human voice.]

<h2 id='eligibility'>${meta.primaryKeyword || meta.examName} Eligibility Criteria — Who Can Apply?</h2>
[Very detailed. Age limit with ALL relaxations (SC/ST: 5 yrs, OBC: 3 yrs, PwD: 10 yrs, Ex-Servicemen rules). Education qualification explained simply. Address common questions: "Final year students?", "Appearing candidates?" Include primary keyword naturally.]

<h2 id='vacancies'>${meta.primaryKeyword || meta.examName} Vacancy Details — Category Wise</h2>
[1 paragraph about competition reality. HTML table with UR/OBC/SC/ST/EWS/PwD breakdown. Estimate competition: "With lakhs expected to apply for ${meta.totalPosts} posts, here's how to stand out..." Include LSI keyword.]

<h2 id='selection'>${meta.primaryKeyword || meta.examName} Selection Process and Exam Pattern</h2>
[Most detailed section — 5-7 paragraphs minimum. For each exam stage use H3:
- Stage name as H3
- What it tests
- Number of questions, total marks, time limit, negative marking in a small HTML table
- What most students get wrong about this stage
- Which subjects to focus on
Final paragraph: "If I were starting prep from zero today, here's exactly what I'd do in the first 30 days..."]

<h2 id='apply'>How to Apply for ${meta.primaryKeyword || meta.examName} — Step by Step</h2>
[Numbered steps using <ol> for the application process. Then a genuine, warm pitch for Apply For Me: "Here's something I always tell people — every year, good candidates get rejected not because they weren't eligible, but because of small mistakes in the form. Wrong photo size. Wrong category code. Signature issues. It sounds silly, but it happens constantly. That's why the Apply For Me service at Rojgar Suvidha exists. You send your documents, our team fills the form correctly, double-checks everything, and submits it. Simple as that. If this job matters to you, it's worth it."]

<h2 id='faq'>Frequently Asked Questions About ${meta.primaryKeyword || meta.examName}</h2>
[Exactly 6 FAQs. Written for featured snippets — each answer is 50-80 words, direct, starts with a direct answer then explains. Questions must match what people actually Google. Use <details> and <summary> tags.

Example question formats:
"What is the last date to apply for [exam]?"
"Am I eligible if I am in final year of graduation?"  
"What is the salary after selection in [exam]?"
"How many stages are there in the selection process?"
"Can I apply for [exam] online from my phone?"
"What documents are needed for [exam] application?"]

FAQ HTML (single quotes):
<details style='margin-bottom:1rem;border:1px solid #e5e7eb;border-radius:8px;padding:16px 20px;background:#f8fafc;'>
<summary style='font-weight:700;color:#4f46e5;cursor:pointer;font-size:1rem;list-style:none;'>Question here?</summary>
<p style='margin-top:10px;color:#475569;line-height:1.8;font-size:0.95rem;'>Direct answer first. Then explanation. 50-80 words.</p>
</details>

HTML table style — ALWAYS wrap every table in a scroll div (mobile-safe):
<div style='overflow-x:auto;-webkit-overflow-scrolling:touch;margin-bottom:1.5rem;border-radius:8px;border:1px solid #e5e7eb;'>
<table style='width:100%;border-collapse:collapse;min-width:400px;'>
<thead><tr><th style='background-color:#4f46e5;color:white;padding:12px 16px;text-align:left;font-weight:600;white-space:nowrap;'>Header</th></tr></thead>
<tbody><tr><td style='padding:12px 16px;border-bottom:1px solid #e5e7eb;color:#374151;'>Data</td></tr></tbody>
</table>
</div>

<!-- Closing internal link CTA -->
<div style='background:linear-gradient(135deg,#4f46e5,#7c3aed);border-radius:12px;padding:24px;margin-top:2rem;text-align:center;'>
<p style='color:white;font-weight:700;font-size:1.1rem;margin:0 0 8px;'>${meta.primaryKeyword || meta.examName} — Apply Before ${meta.lastDate}</p>
<p style='color:#c7d2fe;font-size:0.9rem;margin:0 0 16px;'>Worried about making mistakes in the form? Let our experts handle it.</p>
<a href='/apply-for-me' style='display:inline-block;background:white;color:#4f46e5;font-weight:700;padding:10px 24px;border-radius:8px;text-decoration:none;font-size:0.95rem;'>Use Apply For Me Service →</a>
</div>

Return ONLY the HTML. No markdown, no code blocks.
${customInstructions ? `\n=== ADMIN INSTRUCTIONS (FOLLOW STRICTLY) ===\n${customInstructions}` : ""}`;

  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${groqApiKey}` },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content: HUMAN_BLOGGER_SYSTEM_PROMPT,
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.95,
      max_tokens: 3500,
      frequency_penalty: 0.6,
      presence_penalty: 0.4,
    }),
  });
  const data = await res.json();
  if (data.error) throw new Error(`Part2: ${data.error.message}`);
  const raw = (data.choices?.[0]?.message?.content || "").replace(/^```html?\n?/i, "").replace(/```$/g, "").trim();
  return humanizeHtml(raw);
}

// ── Step 3: Category-specific blog writer ─────────────────────────────────────
async function writeSpecialCategoryBlog(meta: any, rawText: string, groqApiKey: string, category: string, customInstructions?: string): Promise<string> {
  const tableStyle = `<div style='overflow-x:auto;-webkit-overflow-scrolling:touch;margin-bottom:1.5rem;border-radius:8px;border:1px solid #e5e7eb;'><table style='width:100%;border-collapse:collapse;min-width:400px;'>`;
  const thStyle = `style='background-color:#4f46e5;color:white;padding:12px 16px;text-align:left;font-weight:600;white-space:nowrap;'`;
  const tdStyle = `style='padding:12px 16px;border-bottom:1px solid #e5e7eb;color:#374151;'`;

  const prompts: Record<string, string> = {
    results: `Write a complete SEO-optimized human blog post about a RESULT in HTML.
PRIMARY KEYWORD: "${meta.primaryKeyword || meta.title}"
EXAM: ${meta.examName} | ORG: ${meta.orgName} | RESULT DATE: ${meta.lastDate}
CONTENT: ${rawText.substring(0, 2500)}

WRITING STYLE — Results are emotional moments. Write like a journalist + mentor:
- Open with BIG NEWS first (inverted pyramid — most important fact first)
- Use present-tense urgency: "The result is OUT.", "Candidates can NOW check..."
- Acknowledge the emotional weight — thousands waited, some will celebrate, some won't
- Warm, human, not robotic. Real people read this in a tense moment.
- Minimum 1000 words. ALL HTML attributes use single quotes. ZERO emojis.
- Use <p> for all narrative. Tables only for data (cutoff, dates).

STRUCTURE — write ALL sections with full paragraphs:

<h1 style='font-size:2rem;font-weight:800;color:#1e1b4b;margin-bottom:1rem;line-height:1.3;'>[H1: primary keyword + "Result Declared" or "Result Out 2025"]</h1>
<p style='font-size:0.85rem;color:#6b7280;margin-bottom:1rem;'>By <strong>Rojgar Suvidha Editorial Team</strong> &nbsp;|&nbsp; Updated: <strong>${new Date().toLocaleDateString("en-IN",{day:"numeric",month:"long",year:"numeric"})}</strong></p>
<div style='background:#f0fdf4;border-left:4px solid #16a34a;border-radius:8px;padding:16px 20px;margin-bottom:2rem;'><p style='font-weight:700;color:#15803d;margin:0 0 4px;'>Result Declared!</p><p style='color:#374151;margin:0;font-size:0.95rem;'>${meta.examName} result is officially out. Check your result using the steps below.</p></div>

<h2 id='news'>${meta.primaryKeyword} — What You Need to Know Right Now</h2>
[4-5 rich paragraphs. Open with the result announcement fact. How many appeared, what stages cleared, what this result covers. Explain what "result declared" means — who moves to next stage, who can re-apply. Warm human voice. 300+ words flowing text, no bullet points.]

<h2 id='check'>How to Check ${meta.examName} Result Online — Step by Step</h2>
[2 intro paragraphs. Then numbered ol steps — what to click, what to enter (registration number, date of birth), what page opens, how to save/print. End: "If the site is slow, try early morning — traffic is lowest then."]

<h2 id='details'>Cutoff, Merit List and Scorecard — Everything Explained</h2>
[3-4 paragraphs explaining cutoff, merit list, scorecard in simple language. Category-wise cutoff table if extractable. Explain what each number on the scorecard means. Educate first-time candidates who don't know these terms.]

<h2 id='next'>What Happens Next — Your Action Plan After ${meta.examName} Result</h2>
[3-4 practical paragraphs. For those who cleared: document verification, documents to keep ready, medical test, joining process. "Don't wait for official letter — start collecting documents now." Very specific and authoritative.]

<h2 id='failed'>Did Not Clear This Time? Read This.</h2>
[3 honest, warm paragraphs. Acknowledge it hurts — no fake motivation. Re-attempt strategy. What went wrong typically. Other active notifications on Rojgar Suvidha. "This result is one door. There are others open right now."]

<h2 id='faq'>Frequently Asked Questions About ${meta.primaryKeyword}</h2>
[6 FAQs using details/summary. Each answer 60-80 words, direct. Questions: scorecard download, cutoff for General, document verification schedule, documents to keep ready, challenging result, next stage after this result.]`,

    "admit-cards": `Write a complete SEO-optimized human blog post about ADMIT CARD in HTML.
PRIMARY KEYWORD: "${meta.primaryKeyword || meta.title}"
EXAM: ${meta.examName} | ORG: ${meta.orgName} | EXAM DATE: ${meta.lastDate}
CONTENT: ${rawText.substring(0, 2500)}

WRITING STYLE — Admit Card posts are PRACTICAL GUIDES. Write like a helpful senior who has been through this:
- Urgent but calm tone. The exam is coming — help the reader prepare, not panic.
- Heavy on practical details: exact steps, what to carry, what NOT to carry, timing advice.
- Minimum 1000 words. Text-heavy paragraphs, not just lists.
- Use personal advice naturally: "I always tell candidates to...", "A common mistake people make is..."
- ALL HTML attributes use single quotes. ZERO emojis.

STRUCTURE:
<h1 style='font-size:2rem;font-weight:800;color:#1e1b4b;margin-bottom:1rem;line-height:1.3;'>[H1: primary keyword + "Admit Card Download" + year]</h1>
<p style='font-size:0.85rem;color:#6b7280;margin-bottom:1rem;'>By <strong>Rojgar Suvidha Editorial Team</strong> &nbsp;|&nbsp; Exam Date: <strong>${meta.lastDate}</strong></p>
<div style='background:#fff7ed;border-left:4px solid #f97316;border-radius:8px;padding:16px 20px;margin-bottom:2rem;'><p style='font-weight:700;color:#c2410c;margin:0 0 4px;'>Exam Date: ${meta.lastDate}</p><p style='color:#374151;margin:0;font-size:0.95rem;'>Download your admit card immediately. Do not wait until the last day — servers get overloaded.</p></div>

<h2 id='intro'>The ${meta.examName} Admit Card Is Out — What You Must Do Now</h2>
[3-4 paragraphs. Why this matters urgently. What happens if you don't download in time. What the admit card contains. Why you need to verify all details immediately after downloading. Use flowing text — no bullet points here. Include a line like: "Every exam season, I see candidates show up at centers without a valid ID or with a blurry printout. Don't be that person."]

<h2 id='download'>How to Download ${meta.examName} Admit Card — Step by Step</h2>
[2 intro paragraphs about which website to visit and what to keep ready. Then numbered <ol> steps. After the steps, add 1 paragraph: "Print at least 2 copies. Keep one at home, carry one. If your printer is unavailable, a black-and-white printout from a nearby shop works — just make sure the photo and barcode are clearly visible."]

<h2 id='details'>What Is Written on Your ${meta.examName} Admit Card — Read This Carefully</h2>
[3-4 full paragraphs explaining each detail: candidate name, roll number, exam date, reporting time, exam center address, exam duration, important instructions. "Check your name spelling against your ID proof. If there is a mismatch — even one letter — get it corrected before exam day."]

<h2 id='carry'>What to Carry and What to Leave Behind</h2>
[2 intro paragraphs. Then explain: Admit card (printed), which photo IDs are accepted (Aadhaar, Voter ID, Passport, Driving License, PAN card — list all). What NOT to carry: mobile phones, smart watches, wallets with many cards, food in some cases. Why these rules exist. What the consequences are for violations. 300+ words flowing text.]

<h2 id='problem'>Admit Card Problem? Here Is Exactly What to Do</h2>
[4-5 paragraphs covering different problems: name/DOB spelling error, photo not loading, center not matching, forgot registration number, website not opening. For each: who to contact, what information to keep ready, how long it typically takes. "Most correction requests are handled within 48 hours if you contact the official helpdesk with the right documents."]

<h2 id='tips'>Last-Week Exam Preparation Tips From Experience</h2>
[6-7 rich paragraphs of practical advice — not a bullet list. Sleep routine, revision strategy, what to eat on exam day, how to reach the center early, managing exam anxiety, reading instructions carefully before starting. Write from experience, not from a textbook.]

<h2 id='faq'>Frequently Asked Questions About ${meta.primaryKeyword}</h2>
[6 FAQs using details/summary. Answers 60-80 words each. Questions: forgot registration number fix, which ID proof is accepted, what if admit card has wrong details, can I appear without original ID, can I download on mobile and show screen, what if exam center changes]`,

    news: `Write a complete SEO-optimized human blog post in NEWS ARTICLE style in HTML.
PRIMARY KEYWORD: "${meta.primaryKeyword || meta.title}"
TOPIC: ${meta.examName} | ORG: ${meta.orgName}
CONTENT: ${rawText.substring(0, 2500)}

WRITING STYLE — THIS IS A NEWS ARTICLE. Write exactly like NDTV/HinduBusinessLine education reporters:
- Inverted pyramid: most important fact in the very first sentence of the article.
- Short punchy paragraphs (2-4 sentences each). No paragraph exceeds 5 sentences.
- No fluff. Every sentence carries information.
- Quote-style statements: "According to official sources...", "The notification states that..."
- Present tense for current facts, past tense for what happened.
- Minimum 900 words. Text-heavy, paragraph-rich.
- ALL HTML attributes use single quotes. ZERO emojis.

STRUCTURE:
<h1 style='font-size:2rem;font-weight:800;color:#1e1b4b;margin-bottom:1rem;line-height:1.3;'>[H1: news headline style — specific, factual, includes primary keyword]</h1>
<p style='font-size:0.85rem;color:#6b7280;margin-bottom:1rem;'>By <strong>Rojgar Suvidha Editorial Team</strong> &nbsp;|&nbsp; Published: <strong>${new Date().toLocaleDateString("en-IN",{day:"numeric",month:"long",year:"numeric"})}</strong></p>

<h2 id='summary'>Breaking: ${meta.examName} — What Happened</h2>
[LEAD PARAGRAPH first — one paragraph that covers: who, what, when, where, why. Then 3-4 more paragraphs expanding each detail. Write like a reporter covering a breaking story. Short sentences. Factual. Direct. "The ${meta.orgName} has officially announced..." No filler opening lines like "In a significant development..."]

<h2 id='detail'>Full Details — Everything You Need to Know</h2>
[5-6 SHORT paragraphs. Each covers one specific angle of the story. Background context. What led to this. What the official notification says. Numbers, statistics, specific dates. Attribution ("official sources say...", "as per the gazette notification..."). This is pure journalism, not creative writing.]

<h2 id='impact'>How This Affects Lakhs of Aspirants — Analysis</h2>
[4-5 paragraphs. This is the "so what?" section. Practical impact on candidates. What changes for them. What they need to do differently now. Specific action items. "Candidates who were planning to apply should now...". This section adds value beyond just reporting the news.]

<h2 id='next'>What Happens Next — Timeline and Upcoming Dates</h2>
[3-4 paragraphs. What to expect in the next weeks. Dates if available. What candidates should monitor. Link back to Rojgar Suvidha for updates. "Bookmark this page — we update it as soon as official information is released."]

<h2 id='faq'>Frequently Asked Questions</h2>
[5 FAQs using details/summary. Each answer 50-70 words. Questions should be what people will actually search after reading this news.]`,

    admission: `Write a complete SEO-optimized human blog post about ADMISSION in HTML.
PRIMARY KEYWORD: "${meta.primaryKeyword || meta.title}"
COURSE/INSTITUTION: ${meta.examName} | ORG: ${meta.orgName} | LAST DATE: ${meta.lastDate}
CONTENT: ${rawText.substring(0, 2500)}

WRITING STYLE — Admission posts are DECISION-MAKING GUIDES. Write like a knowledgeable counsellor:
- Help the reader decide: Is this right for me? Can I apply? How do I apply?
- Warm, encouraging, and informative. Students read this when anxious about their future.
- Minimum 1000 words of flowing text. Rich paragraphs, not just lists.
- Include real talk: "Here is what nobody tells you about this course/institution..."
- ALL HTML attributes use single quotes. ZERO emojis.

STRUCTURE:
<h1 style='font-size:2rem;font-weight:800;color:#1e1b4b;margin-bottom:1rem;line-height:1.3;'>[H1: primary keyword + "Admission" + year + "Apply Online"]</h1>
<p style='font-size:0.85rem;color:#6b7280;margin-bottom:1rem;'>By <strong>Rojgar Suvidha Editorial Team</strong> &nbsp;|&nbsp; Last Date: <strong>${meta.lastDate}</strong></p>
<div style='background:#eff6ff;border-left:4px solid #4f46e5;border-radius:8px;padding:16px 20px;margin-bottom:2rem;'><p style='font-weight:700;color:#1e1b4b;margin:0 0 8px;font-size:1.05rem;'>Quick Overview</p><p style='margin:4px 0;color:#374151;font-size:0.9rem;'><strong>Course/Program:</strong> ${meta.examName}</p><p style='margin:4px 0;color:#374151;font-size:0.9rem;'><strong>Institution:</strong> ${meta.orgName}</p><p style='margin:4px 0;color:#374151;font-size:0.9rem;'><strong>Last Date to Apply:</strong> ${meta.lastDate}</p><p style='margin:4px 0;color:#374151;font-size:0.9rem;'><strong>Application Fee:</strong> ${meta.appFee || "As per official notification"}</p><p style='margin:4px 0;color:#374151;font-size:0.9rem;'><strong>Total Seats:</strong> ${meta.totalPosts || "As per official notification"}</p></div>

<h2 id='about'>What Is This Course and Why Should You Consider It?</h2>
[4-5 rich paragraphs. What is the course/program? What institution/university offers it? What career does it lead to? Salary expectations after completing it. Why thousands of students compete for this every year. "Here is what nobody tells first-time applicants about this course..." Add genuine insight. 350+ words.]

<h2 id='eligibility'>Are You Eligible? Eligibility Criteria Explained Simply</h2>
[3-4 paragraphs. Age limit with relaxations. Educational qualification — minimum marks, specific subjects required, equivalence of certificates. Domicile requirements if any. Common confusions addressed directly: "A lot of students ask if they can apply in their final year — here is the honest answer...". End with a clear summary of who is and is not eligible.]

<h2 id='dates'>Important Dates and Application Fee</h2>
[1-2 paragraphs on the urgency of applying early. HTML table for important dates (application start, last date, exam date, result date). HTML table for fee by category (General/OBC/SC/ST/EWS/PwD). "Pay the fee as soon as you fill the form — last-day payment servers are always jammed."]

<h2 id='apply'>How to Apply — Complete Guide Step by Step</h2>
[2 intro paragraphs. Numbered <ol> steps. Documents list. Common mistakes that lead to rejection. Then pitch for Apply For Me: "Every year, admission forms get rejected for small technical reasons — wrong photo dimensions, incorrect certificate format, field left blank. Our Apply For Me service handles the entire process for you. You share your documents, we fill everything correctly and submit."]

<h2 id='selection'>How Selection Works — Entrance Exam, Merit List or Counselling</h2>
[4-5 paragraphs. What the selection process is. If entrance exam: what subjects, how many questions, marking scheme. If merit-based: which marks count, how merit list is prepared. Counselling rounds. "This is where many students lose their seat — not in the exam but in the counselling process. Here is how to not be one of them."]

<h2 id='faq'>Frequently Asked Questions About ${meta.primaryKeyword}</h2>
[6 FAQs using details/summary. 60-80 words each. Questions: final year eligibility, documents needed, whether coaching is required, when results come, what happens if you miss counselling, whether this is a good career choice]`,

    "answer-key": `Write a complete SEO-optimized human blog post about ANSWER KEY in HTML.
PRIMARY KEYWORD: "${meta.primaryKeyword || meta.title}"
EXAM: ${meta.examName} | ORG: ${meta.orgName} | OBJECTION DEADLINE: ${meta.lastDate}
CONTENT: ${rawText.substring(0, 2500)}

WRITING STYLE — Answer Key posts serve two types of readers: relieved candidates (who got most right) and anxious ones (who are unsure). Write for both:
- Start with urgency: the objection window is ticking.
- Be analytical: help them calculate their score, understand the process.
- Be realistic about objections: most succeed only with strong proof.
- Minimum 1000 words of text-rich paragraphs.
- ALL HTML attributes use single quotes. ZERO emojis.

STRUCTURE:
<h1 style='font-size:2rem;font-weight:800;color:#1e1b4b;margin-bottom:1rem;line-height:1.3;'>[H1: primary keyword + "Answer Key Released" + "Download & Check" + year]</h1>
<p style='font-size:0.85rem;color:#6b7280;margin-bottom:1rem;'>By <strong>Rojgar Suvidha Editorial Team</strong> &nbsp;|&nbsp; Objection Deadline: <strong>${meta.lastDate}</strong></p>
<div style='background:#fff7ed;border-left:4px solid #f97316;border-radius:8px;padding:16px 20px;margin-bottom:2rem;'><p style='font-weight:700;color:#c2410c;margin:0 0 4px;'>Time-Sensitive: Objection window closes ${meta.lastDate}</p><p style='color:#374151;margin:0;font-size:0.95rem;'>Check your answers against the official key and raise objections before this deadline if you disagree.</p></div>

<h2 id='released'>${meta.examName} Answer Key Is Out — Here Is What to Do in the Next 24 Hours</h2>
[4-5 paragraphs. What was released (official answer key, set-wise). When it was released. Why checking it urgently matters — the objection window has a hard deadline. What happens to objections that get accepted. What candidates who feel confident should focus on instead. Rich, flowing text. 300+ words.]

<h2 id='download'>How to Download the ${meta.examName} Official Answer Key</h2>
[2 intro paragraphs explaining set/series codes and how to match them. Numbered <ol> download steps. After steps: "Save a PDF copy and also take a screenshot of each page. Servers often go down after a few days and access can become difficult."]

<h2 id='calculate'>How to Calculate Your Expected Score — With a Real Example</h2>
[4-5 paragraphs. Explain the marking scheme from the content (marks per correct answer, negative marking). Give a worked example: "Let us say you attempted 90 questions. You got 72 correct and 18 wrong. With +2 for correct and -0.5 for incorrect: your score = (72 × 2) - (18 × 0.5) = 144 - 9 = 135." Marking scheme table. Explain what is a safe score to hope for, based on competition and previous years.]

<h2 id='objection'>How to Raise an Objection — And When It Is Actually Worth It</h2>
[5-6 paragraphs. Step-by-step objection process. Fee per question challenged. What proof you need (textbook reference, previous papers, official sources). What happens after you raise it — expert panel reviews. Success rate of objections honestly discussed. "Objections based on ambiguous wording rarely succeed. Focus only on questions where you have strong textbook evidence on your side."]

<h2 id='cutoff'>Expected Cutoff — Your Chances of Making It</h2>
[3-4 paragraphs. Explain what determines cutoff: number of candidates, number of vacancies, difficulty of paper. Category-wise cutoff prediction table based on previous years (clearly labelled as estimate). "If your expected score is within 5 marks of the estimated cutoff, do not lose hope — cutoffs shift based on objection outcomes and the final answer key."]

<h2 id='faq'>Frequently Asked Questions About ${meta.primaryKeyword}</h2>
[6 FAQs using details/summary. 60-80 words each. Questions: how to match answer with set/series, objection fee amount, when final answer key releases, do accepted objections change the cutoff, how long after final answer key will result come, what score is safe for General category]`,
  };

  const blogPrompt = `${prompts[category] || prompts["news"]}

HUMAN WRITING RULES:
- Write like a knowledgeable, warm friend — not a textbook.
- Mix short and long sentences (burstiness is key).
- Use "you" and "your" constantly.
- Banned words: delve, plethora, crucial, navigating, comprehensive, moreover, furthermore, transformative
- ZERO emojis. Use <p> for prose, <ol>/<ul> only for lists.
- ALL HTML attributes MUST use single quotes.
- For every table, wrap it in: <div style='overflow-x:auto;-webkit-overflow-scrolling:touch;margin-bottom:1.5rem;border-radius:8px;border:1px solid #e5e7eb;'> before <table style='width:100%;border-collapse:collapse;min-width:400px;'>

Return ONLY the HTML. No markdown, no code blocks, no text before or after.
${customInstructions ? `\n=== ADMIN INSTRUCTIONS (FOLLOW STRICTLY) ===\n${customInstructions}` : ""}`;

  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${groqApiKey}` },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content: HUMAN_BLOGGER_SYSTEM_PROMPT,
        },
        { role: "user", content: blogPrompt },
      ],
      temperature: 0.95,
      max_tokens: 4500,
      frequency_penalty: 0.7,
      presence_penalty: 0.5,
    }),
  });
  const data = await res.json();
  if (data.error) throw new Error(`Special blog: ${data.error.message}`);
  const raw = (data.choices?.[0]?.message?.content || "").replace(/^```html?\n?/i, "").replace(/```$/g, "").trim();
  return humanizeHtml(raw);
}

// ── Main Handler ────────────────────────────────────────────────────────────────
export async function POST(req: Request) {
  try {
    const { rawText, category = "latest-jobs", customInstructions = "", officialLink = "" } = await req.json();

    if (!rawText || rawText.length < 50) {
      return NextResponse.json({ error: "Please paste longer text (min 50 chars)." }, { status: 400 });
    }

    const groqApiKey = process.env.GROQ_API_KEY;
    if (!groqApiKey) {
      return NextResponse.json({ error: "Groq API Key missing." }, { status: 500 });
    }

    // Step 1: extract metadata (category-aware)
    const metadata = await extractMetadata(rawText, groqApiKey, category, customInstructions);
    // Force category from user selection — don't let AI override it
    metadata.category = category;

    let blogHtml: string;

    if (category === "latest-jobs") {
      // Sequential (not parallel) to avoid Groq 12k TPM rate limit
      const part1 = await writePart1(metadata, rawText, groqApiKey, customInstructions);
      // Small delay between calls to stay within rate limit
      await new Promise(resolve => setTimeout(resolve, 2000));
      const part2 = await writePart2(metadata, rawText, groqApiKey, customInstructions);
      blogHtml = `${part1}\n\n${part2}`;
    } else {
      // Use category-specific single writer
      blogHtml = await writeSpecialCategoryBlog(metadata, rawText, groqApiKey, category, customInstructions);
    }

    // ── Append Official Notification Trust Box (if URL provided) ────────────────
    if (officialLink && officialLink.trim()) {
      const officialBox = `
<div style='background:#f0fdf4;border:2px solid #16a34a;border-radius:12px;padding:20px 24px;margin:2rem 0;display:flex;align-items:flex-start;gap:16px;'>
  <div style='font-size:2rem;line-height:1;margin-top:2px;'>📄</div>
  <div style='flex:1;'>
    <p style='font-weight:800;color:#15803d;margin:0 0 6px;font-size:1rem;'>Official Notification — Verified Source</p>
    <p style='color:#374151;margin:0 0 12px;font-size:0.9rem;line-height:1.6;'>This post is based on the official government notification. For complete and accurate information, download the original PDF below.</p>
    <a href='${officialLink.trim()}' target='_blank' rel='noopener noreferrer nofollow' style='display:inline-flex;align-items:center;gap:8px;background:#16a34a;color:white;font-weight:700;padding:10px 22px;border-radius:8px;text-decoration:none;font-size:0.9rem;'>📥 Download Official PDF / Notification →</a>
    <p style='margin:10px 0 0;font-size:0.78rem;color:#6b7280;'>Source: Official Government Website &nbsp;|&nbsp; Always verify from the official source before applying.</p>
  </div>
</div>`;
      blogHtml = blogHtml + "\n" + officialBox;
    }

    return NextResponse.json({ ...metadata, officialLink, blogHtml });
  } catch (error: any) {
    console.error("AI Super Writer Error:", error.message);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
