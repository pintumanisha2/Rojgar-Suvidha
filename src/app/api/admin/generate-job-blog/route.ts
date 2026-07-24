import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { title, category, shortInfo, importantDates, highlights } = await req.json();

    if (!title) {
      return NextResponse.json({ error: "Title is required to generate a blog." }, { status: 400 });
    }

    // ── Category-specific mandatory sections ──────────────────────────────────
    const cat = (category || "").toLowerCase();
    let categoryMandatorySection = "";

    if (cat === "admit-card" || cat === "admit-cards") {
      categoryMandatorySection = `
8. **Download Steps (H3, must have attribute id="download")**: Step-by-step numbered guide on how to download the admit card. Start each step with an action verb (Go to, Click, Enter, Download).
9. **What to Carry to Exam Hall (H3, must have attribute id="carry")**: A bullet-point checklist: Admit Card (printed), Photo ID (Aadhar/PAN/Voter), Passport Photos, Stationery. Be thorough.
10. **Exam Day Tips (H3, must have attribute id="tips")**: 4–5 practical real-world tips (e.g. reach center 30 min early, no electronic devices, etc).`;
    } else if (cat === "results") {
      categoryMandatorySection = `
8. **How to Check Result (H3, must have attribute id="check")**: Step-by-step guide to check the result online.
9. **What Happens Next (H3, must have attribute id="next")**: Document verification, joining letter, medical test timeline.
10. **If You Didn't Qualify (H3, must have attribute id="failed")**: Encourage candidates. Suggest 3 other similar exams to apply for right now.`;
    } else if (cat === "answer-key") {
      categoryMandatorySection = `
8. **How to Calculate Your Score (H3, must have attribute id="calculate")**: Exact marking scheme with a worked example (e.g. +2 correct, -0.5 wrong).
9. **How to Raise Objection (H3, must have attribute id="objection")**: Step-by-step guide to submit an objection with the portal link and deadline.
10. **Expected Cutoff (H3, must have attribute id="cutoff")**: Category-wise (General/OBC/SC/ST) expected cutoff estimate.`;
    } else if (cat === "admission" || cat === "admissions") {
      categoryMandatorySection = `
8. **About This Course/Exam (H3, must have attribute id="about")**: Overview of the course, exam type, and which university/board is conducting it.
9. **Eligibility Criteria (H3, must have attribute id="eligibility")**: Age limit, minimum qualification, marks required.
10. **How to Apply (H3, must have attribute id="apply")**: Complete step-by-step application process with counseling dates.`;
    } else {
      categoryMandatorySection = `
8. **Exam Preparation Strategy (H3, must have attribute id="prep")**: 3–4 practical tips to prepare for this specific exam.
9. **Expected Cutoff (H3, must have attribute id="cutoff")**: Category-wise expected cutoff marks table.
10. **Salary & Job Profile (H3, must have attribute id="salary")**: Post-wise salary, grade pay, and job responsibilities table.`;
    }

    const systemPrompt = `You are a supportive, warm, and highly experienced Indian Career Mentor and SEO Specialist writing for "Rojgar Suvidha" (India's most trusted job portal).
Your task is to write a highly SEO-optimized, engaging, 100% human-sounding blog post in VALID HTML format.

### INPUT DETAILS:
- Title: ${title}
- Category: ${category}
- Short Summary: ${shortInfo || "Not provided"}
- Highlights (Fee, Age, Edu, Vacancy): ${JSON.stringify(highlights || {})}

### 💰 GOOGLE ADSENSE & USER TRUST POLICY (CRITICAL):
1. **NO ROBOTIC FILLER**: Start directly with the core announcement facts in the very first sentence. No "Welcome back", no "In this article we will...".
2. **UNIQUE VALUE MENTORSHIP**: Add practical, real-life advice. Warn students not to wait for the last date (government servers crash), advise correct photograph sizes, etc.
3. **HIGH READABILITY**: Simple, clear, direct sentences. Active voice. Speak like a helpful elder brother (Bhaiya) coaching the candidate.

### ✍️ HINGLISH BRACKET KEYWORDS (for Google India SEO):
Insert popular Indian search phrases in brackets occasionally:
- Last Date [Aavedan ki aakhri tithi]
- Age Limit [Umar seema]
- Apply Online [Online apply karne ka link]

### 🚫 BANNED PHRASES: delve, landscape, ever-evolving, multifaceted, testament, beacon, furthermore, moreover, additionally, consequently, in conclusion, crucial, paramount, unlock your potential, foster, harness, leverage, pioneering, embark on a journey.

### 📂 HTML STRUCTURE — ALL sections are MANDATORY:
Return ONLY valid clean HTML. NO markdown code blocks. NO \`\`\`html wrapper.

1. **Direct Announcement (H2)**: Core recruitment facts immediately.
2. **Important Dates & Application Fees (H3 + HTML Table)**: Clean table. Write "Dates will be updated shortly" if missing.
3. **Eligibility Criteria (H3 + bullet list)**: Age Limit and qualifications with Hinglish bracket terms.
4. **Vacancy Details & Salary (H3 + table or list)**: Post-wise vacancies and pay.
5. **How to Apply Online (H3 + numbered list)**: Simple step-by-step.
6. **Selection Process (H3 + list)**: Exam stages.
7. **Mentor's Expert Advice (H3)**: 3–4 unique practical tips from a career mentor.
${categoryMandatorySection}

### ❓ FAQ SECTION — MANDATORY HTML FORMAT (NOT plain h3/p text):
You MUST add exactly 4 FAQ items using the <details>/<summary> accordion format. The FIRST <details> MUST have id="faq".
DO NOT use plain <h3> or <p> for FAQ. Use EXACTLY this HTML structure:

<h3 id="faq">Frequently Asked Questions (FAQ)</h3>
<details id="faq">
  <summary><strong>Q: [Realistic question 1 that candidates actually search]?</strong></summary>
  <p>[Clear, helpful, factual answer]</p>
</details>
<details>
  <summary><strong>Q: [Realistic question 2]?</strong></summary>
  <p>[Answer]</p>
</details>
<details>
  <summary><strong>Q: [Realistic question 3]?</strong></summary>
  <p>[Answer]</p>
</details>
<details>
  <summary><strong>Q: [Realistic question 4]?</strong></summary>
  <p>[Answer]</p>
</details>

### 📊 FAQPage JSON-LD SCHEMA — MANDATORY (add at the VERY END after all HTML):
Replace [Question X] and [Answer X] with actual content from your FAQ above:

<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    { "@type": "Question", "name": "[Question 1]", "acceptedAnswer": { "@type": "Answer", "text": "[Answer 1]" } },
    { "@type": "Question", "name": "[Question 2]", "acceptedAnswer": { "@type": "Answer", "text": "[Answer 2]" } },
    { "@type": "Question", "name": "[Question 3]", "acceptedAnswer": { "@type": "Answer", "text": "[Answer 3]" } },
    { "@type": "Question", "name": "[Question 4]", "acceptedAnswer": { "@type": "Answer", "text": "[Answer 4]" } }
  ]
}
</script>

Generate the complete HTML content now:`;

    const geminiApiKey = process.env.GEMINI_API_KEY;
    if (!geminiApiKey) {
      return NextResponse.json({ error: "Gemini API Key missing in .env.local" }, { status: 500 });
    }

    const models = ["gemini-2.0-flash-exp", "gemini-1.5-pro", "gemini-1.5-flash"];
    let blogHtml = "";
    let lastError = "";

    for (const model of models) {
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiApiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ role: "user", parts: [{ text: systemPrompt }] }],
              generationConfig: { temperature: 0.7, maxOutputTokens: 6000 },
            }),
            signal: AbortSignal.timeout(50000),
          }
        );

        const data = await response.json();
        if (data.error) {
          lastError = data.error.message || "Unknown error";
          console.warn(`Model ${model} failed:`, lastError);
          continue;
        }

        const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
        if (rawText) { blogHtml = rawText; break; }
      } catch (modelError: any) {
        lastError = modelError.message;
        console.warn(`Model ${model} error:`, modelError);
        continue;
      }
    }

    if (!blogHtml) {
      return NextResponse.json({ error: `AI could not generate content: ${lastError}` }, { status: 500 });
    }

    // ── Post-processing cleanup ────────────────────────────────────────────────
    blogHtml = blogHtml.replace(/```html\n?/gi, "").replace(/```\n?/g, "").trim();
    blogHtml = blogHtml.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>").replace(/__(.*?)__/g, "<strong>$1</strong>");

    // ── Safety Net 1: Convert plain Q:/A: FAQ patterns to <details>/<summary> if AI ignored format ──
    if (!blogHtml.includes("<details")) {
      // Convert <p><strong>Q: ...</strong></p> <p>Answer</p> patterns
      blogHtml = blogHtml.replace(
        /<p[^>]*>\s*<strong>\s*Q:\s*(.*?)\??\s*<\/strong>\s*<\/p>\s*<p[^>]*>([\s\S]*?)<\/p>/gi,
        (_match, q, a) => `<details><summary><strong>Q: ${q.trim()}?</strong></summary><p>${a.trim()}</p></details>`
      );
    }

    // ── Safety Net 2: Auto-inject FAQPage JSON-LD if AI forgot ────────────────
    if (!blogHtml.includes("application/ld+json")) {
      const faqMatches = [...blogHtml.matchAll(/<summary>\s*<strong>\s*Q:\s*(.*?)\??\s*<\/strong>\s*<\/summary>\s*<p>([\s\S]*?)<\/p>/gi)];
      if (faqMatches.length > 0) {
        const schemaObj = {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: faqMatches.slice(0, 6).map(([, q, a]) => ({
            "@type": "Question",
            name: q.trim().replace(/<[^>]*>/g, ""),
            acceptedAnswer: {
              "@type": "Answer",
              text: a.trim().replace(/<[^>]*>/g, "").slice(0, 300),
            },
          })),
        };
        blogHtml += `\n<script type="application/ld+json">${JSON.stringify(schemaObj, null, 2)}</script>`;
      }
    }

    // ── Safety Net 3: Ensure first <details> has id="faq" ────────────────────
    if (blogHtml.includes("<details") && !blogHtml.includes(`id="faq"`)) {
      blogHtml = blogHtml.replace("<details>", `<details id="faq">`);
    }

    return NextResponse.json({ blog: blogHtml });
  } catch (error: any) {
    console.error("AI Blog Generator Error:", error);
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}
