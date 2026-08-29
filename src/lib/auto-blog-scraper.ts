/**
 * Auto Blog Scraper Library — v2.4 (Multi-Key Rotation + Groq Fallback)
 * FreeJobAlert → Full Page Deep Read → Gemini AI (SarkariLekhan) → [Groq Fallback] → Supabase → Telegram
 *
 * FIXES in v2:
 * 1. RSS URL corrected to freejobales.com (verified WordPress feed pattern)
 * 2. Better apply link detection — handles FreeJobAlert table structure
 * 3. Stronger data extraction — more patterns for dates/fees/vacancies
 * 4. HTML content cap increased to 12000 chars (more context for AI)
 * 5. Gemini prompt now includes mandatory id= anchors for SEO scorecard
 * 6. Slug duplicate check before saving to Supabase
 * 7. Delay between items to avoid rate limiting
 * 8. Content validation — skip if AI generated <500 words
 * 9. Better Coming Soon detection (FreeJobAlert specific patterns)
 *
 * NEW in v2.4:
 * 10. Groq API fallback — when ALL Gemini keys/models fail (quota exhausted),
 *     Groq (llama-3.3-70b → llama-3.1-8b → mixtral-8x7b) is tried automatically.
 *     Zero manual intervention needed.
 */

import { createClient } from "@supabase/supabase-js";
import { sendAdminDraftApprovalAlert, sendTelegramAdminErrorAlert, sendTelegramAdminSummaryDigest } from "./social-publisher";
import { callGeminiWithRotation } from "./gemini-rotator";

// ── Types ─────────────────────────────────────────────────────────────────────
type ApplyStatus = "open" | "coming_soon" | "closed" | "unknown";
type BlogCategory = "latest-jobs" | "results" | "admit-card" | "answer-key" | "admission" | "news";

interface ScraperResult {
  processed: number;
  skipped: number;
  errors: string[];
}

// ── Config ────────────────────────────────────────────────────────────────────
// Sources: FreeJobAlert.com + SarkariResult.com (both WordPress RSS — reliable)
// Each run processes 1 item from each source = 2 blogs per 30-min cron
// ── Category-specific RSS feeds ─────────────────────────────────────────────
const CATEGORY_RSS_FEEDS: Record<string, string[]> = {
  "latest-jobs": [
    "https://www.freejobalert.com/feed/",               // Primary — all govt job notifications
    "https://www.freejobalert.com/sarkari-naukri/feed/", // Secondary — sarkari naukri
  ],
  "results": [
    "https://www.freejobalert.com/result/feed/",
  ],
  "admit-card": [
    "https://www.freejobalert.com/admit-card/feed/",
  ],
  "answer-key": [
    "https://www.freejobalert.com/answer-key/feed/",
  ],
  "admission": [
    "https://www.freejobalert.com/admission/feed/",
  ],
};

// ── SarkariResult.com RSS feeds (separate — distinct source) ────────────────
const SARKARIRESULT_RSS_FEEDS: Record<string, string[]> = {
  "latest-jobs": [
    "https://www.sarkariresult.com/feed/",  // All posts — SarkariResult RSS main
    "https://news.google.com/rss/search?q=site:sarkariresult.com&hl=en-IN&gl=IN&ceid=IN:en", // Google News RSS fallback
  ],
  "results": [
    "https://www.sarkariresult.com/feed/",
  ],
  "admit-card": [
    "https://www.sarkariresult.com/feed/",
  ],
};

// Flat list for backward compatibility with fetchRSSItems()
// Order: latest-jobs first (highest volume + most important)
const RSS_URLS = [
  ...CATEGORY_RSS_FEEDS["latest-jobs"],
  ...CATEGORY_RSS_FEEDS["results"],
  ...CATEGORY_RSS_FEEDS["admit-card"],
  ...CATEGORY_RSS_FEEDS["answer-key"],
  ...CATEGORY_RSS_FEEDS["admission"],
];

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://www.rojgarsuvidha.com";

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// ── Sleep helper (avoid rate limiting) ───────────────────────────────────────
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// ── Category Detection v2 — Title-First, Strict Priority ─────────────────────
// Uses TITLE-ONLY matching first (source titles are always accurate)
// Falls back to combined text only if title is ambiguous
function detectCategory(title: string, content: string): BlogCategory {
  const t = title.toLowerCase();
  const combined = (title + " " + content).toLowerCase();

  // ── TITLE-ONLY checks (highest confidence) ──────────────────────────────
  // Results — specific result keywords in title
  if (/\bresult\b|merit list|scorecard|cut-?off mark|selected candidates|rank list|final result|result out|result declared/.test(t))
    return "results";

  // Admit Card — specific keywords in title
  if (/admit card|hall ticket|call letter|e-admit|city intimation|interview letter/.test(t))
    return "admit-card";

  // Answer Key — specific keywords in title
  if (/answer key|answer sheet|provisional answer|final answer|objection window|raise objection/.test(t))
    return "answer-key";

  // Admission / Counselling — specific keywords in title
  if (/\bcounselling\b|\bcounseling\b|seat allot|allotment result|admission open|college admission|merit list.*admission/.test(t))
    return "admission";

  // Latest Jobs — recruitment/vacancy in title
  if (/recruitment|vacancy|apply online|online form|job notification|\bnoti(?:fication)?\b|\bvacancy\b|\bpost\b.*202[456]/.test(t))
    return "latest-jobs";

  // ── CONTENT-BASED fallback (lower confidence — only if title is ambiguous) ─
  if (/\bresult\b|merit list|scorecard/.test(combined)) return "results";
  if (/admit card|hall ticket/.test(combined)) return "admit-card";
  if (/answer key|objection window/.test(combined)) return "answer-key";
  if (/\bcounselling\b|seat allot/.test(combined)) return "admission";

  // ── News detection (only if explicitly news-like — no job keywords) ────
  if (/postponed|cancelled|rescheduled|syllabus change|age limit change|new rule/.test(t) &&
    !/recruitment|vacancy|apply|result|admit|answer key/.test(t))
    return "news";

  return "latest-jobs"; // Safe default — job posts are highest volume
}

// ── State Code Detection (Auto-detect State vs All India) ─────────────────
// RULE: State detection is TITLE-FIRST. Body content is only used as secondary
// confirmation, never as the sole source. This prevents false UP/state assignments
// when a page body mentions states in passing (e.g., age relaxation tables, address).
function detectStateCode(title: string, content: string): string | null {
  const t = title.toLowerCase();

  // ── Step 1: All-India / Central org check (TITLE ONLY) ─────────────────────
  // If title contains a central org abbreviation → always return null (All India)
  // FIX: Removed 'psc' from the exception list — TSPSC/WBPSC/MPSC are STATE orgs,
  // not central. They should be caught by state-specific patterns below.
  const isCentralOrg = /\b(?:upsc|rrb|rrc|rrb-ntpc|rrb-group|railway|ibps|sbi|rbi|lic|isro|drdo|cisf|bsf|crpf|itbp|ssb|ignou|iit|nit|aiims|nta|cbse|cisce)\b/i.test(t);
  const isAllIndia = /\ball[ -]india\b|\bcentral government\b|\bcentral govt\b/i.test(t);
  const isSSCCentral = /\bssc\b/i.test(t) && !/\bhssc\b|\bjssc\b|\bbssc\b|\bsssc\b|\bosssc\b|\bwbssc\b|\btssc\b/i.test(t); // SSC = central, but state SSCs are covered separately

  if (isCentralOrg || isAllIndia || isSSCCentral) {
    return null; // All India — no state
  }

  // ── Step 2: Title-based state detection (HIGH confidence) ──────────────────
  // These fire ONLY when the state is clearly named in the JOB TITLE itself.
  // Order: most-specific first to avoid partial overlaps.

  // Uttar Pradesh — must have full name or clear UP-specific body
  if (/uttar pradesh|\buppsc\b|\bupsssc\b|\bup police\b|\bup teacher\b|\bup bed\b|\bup deled\b|\bup board\b|\bup tet\b/i.test(t)) return "UP";
  // Bihar
  if (/bihar|\bbpsc\b|\bbssc\b|\bbihar police\b|\bbtsc\b/i.test(t)) return "BH";
  // Madhya Pradesh
  if (/madhya pradesh|\bmppeb\b|\bmppsc\b|\bmp police\b|\bvyapam\b|\bmpbse\b|\bmptet\b/i.test(t)) return "MP";
  // Rajasthan
  if (/rajasthan|\brpsc\b|\brsmssb\b|\brajasthan police\b|\breet\b|\brspcb\b/i.test(t)) return "RJ";
  // Haryana — \bhssc\b is Haryana SSC (not central SSC)
  if (/haryana|\bhssc\b|\bhpsc\b|\bharyana police\b|\bhtet\b/i.test(t)) return "HR";
  // Himachal Pradesh
  if (/himachal|\bhppsc\b|\bhpsssb\b|\bhpbose\b|\bhp board\b/i.test(t)) return "HP";
  // Delhi
  if (/\bdelhi\b|\bdsssb\b|\bdelhi police\b|\bddu delhi\b/i.test(t)) return "DL";
  // Maharashtra
  if (/maharashtra|\bmpsc\b|\bmaha police\b|\bmsbshse\b/i.test(t)) return "MH";
  // West Bengal
  if (/west bengal|\bwbpsc\b|\bwbprb\b|\bwbjee\b|\bwb police\b|\bwbssc\b/i.test(t)) return "WB";
  // Uttarakhand
  if (/uttarakhand|\bukpsc\b|\buksssc\b|\buk police\b|\butet\b/i.test(t)) return "UK";
  // Jharkhand
  if (/jharkhand|\bjpsc\b|\bjssc\b|\bjceceb\b|\bjharkhand police\b/i.test(t)) return "JH";
  // Punjab
  if (/punjab|\bppsc\b|\bpsssb\b|\bpunjab police\b|\bpunjabi university\b/i.test(t)) return "PB";
  // Odisha
  if (/odisha|\bopsc\b|\bosssc\b|\bodisha police\b|\botet\b/i.test(t)) return "OD";
  // Telangana
  if (/telangana|\btspsc\b|\btshc\b|\btgicet\b|\btelangana police\b/i.test(t)) return "TS";
  // Andhra Pradesh
  if (/andhra|\bappsc\b|\bapicet\b|\bap police\b|\bandhra university\b/i.test(t)) return "AP";
  // Kerala
  if (/kerala|\bkpsc\b|\bcee kerala\b|\bkerala university\b|\bkerala high court\b/i.test(t)) return "KL";
  // Tamil Nadu
  if (/tamil nadu|\btnpsc\b|\btn police\b|\btnusrb\b/i.test(t)) return "TN";
  // Chhattisgarh
  if (/chhattisgarh|\bcgpsc\b|\bcg police\b|\bcgvyapam\b/i.test(t)) return "CG";
  // Gujarat
  if (/gujarat|\bgpsc\b|\bgujarat police\b|\bgsssb\b/i.test(t)) return "GU";
  // Assam
  if (/assam|\bapsc\b|\bassam police\b|\bslprb\b/i.test(t)) return "AS";
  // Karnataka
  if (/karnataka|\bkpsc\b|\bkarnataka police\b|\bktet\b|\bkseeb\b/i.test(t)) return "KA";
  // Jammu & Kashmir
  if (/jammu|kashmir|\bjkpsc\b|\bjkssb\b/i.test(t)) return "JK";
  // Goa
  if (/\bgoa\b|\bgpsc goa\b/i.test(t)) return "GA";

  // ── Step 3: Secondary check — ONLY if title has NO central org but content has STRONG state signal ──
  // Use a SHORT slice of content (first 500 chars = headline/intro) to avoid false positives
  // from age-relaxation tables or footer links that mention all state names
  const preview = content.slice(0, 500).toLowerCase();
  if (/uttar pradesh|\buppsc\b|\bupsssc\b/i.test(preview)) return "UP";
  if (/madhya pradesh|\bmppsc\b|\bmppeb\b/i.test(preview)) return "MP";
  if (/rajasthan|\brpsc\b|\brsmssb\b/i.test(preview)) return "RJ";
  if (/bihar|\bbpsc\b/i.test(preview)) return "BH";
  if (/haryana|\bhssc\b/i.test(preview)) return "HR";
  if (/himachal|\bhppsc\b|\bhpsssb\b/i.test(preview)) return "HP";
  if (/telangana|\btspsc\b/i.test(preview)) return "TS";
  if (/andhra|\bappsc\b/i.test(preview)) return "AP";
  if (/karnataka|\bkpsc\b|\bktet\b/i.test(preview)) return "KA";
  if (/west bengal|\bwbpsc\b/i.test(preview)) return "WB";
  if (/jharkhand|\bjpsc\b|\bjssc\b/i.test(preview)) return "JH";
  if (/odisha|\bopsc\b|\bosssc\b/i.test(preview)) return "OD";
  if (/punjab|\bpsssb\b/i.test(preview)) return "PB";
  if (/chhattisgarh|\bcgpsc\b/i.test(preview)) return "CG";
  if (/gujarat|\bgpsc\b|\bgsssb\b/i.test(preview)) return "GU";
  if (/assam|\bapsc\b/i.test(preview)) return "AS";
  if (/kerala|\bkpsc\b/i.test(preview)) return "KL";
  if (/tamil nadu|\btnpsc\b/i.test(preview)) return "TN";
  if (/maharashtra|\bmpsc\b/i.test(preview)) return "MH";
  if (/delhi|\bdsssb\b/i.test(preview)) return "DL";
  if (/jammu|kashmir|\bjkpsc\b|\bjkssb\b/i.test(preview)) return "JK";

  return null; // Central / All India — no state tag
}

// ── Post Type Detection (for specific document lists) ─────────────────────────
function detectPostType(title: string): string {
  const t = title.toLowerCase();
  if (/\bdriver\b|\bchauffeur\b|\bchowkidar\b/i.test(t)) return "driver";
  if (/\bteacher\b|\blecturer\b|\bpgt\b|\btgt\b|\bprt\b|\btet\b|\bb\.ed\b|\bsst\b|\bprimary teacher\b/i.test(t)) return "teacher";
  if (/\bjunior engineer\b|\bje\b(?=\s|$)|\bassistant engineer\b|\bae\b(?=\s|$)|\bcivil engineer\b|\belectrical engineer\b|\bmechanical engineer\b/i.test(t)) return "engineer";
  if (/\bconstable\b|\bsub inspector\b|\b\bsi\b(?=\s|$)|\bdsp\b|\binspector\b|\bpolice\b(?=\s|2)/i.test(t)) return "police";
  if (/\bnurse\b|\bstaff nurse\b|\bans\b(?=\s|$)|\bnursing\b/i.test(t)) return "nurse";
  if (/\baccountant\b|\bauditor\b|\baccounts officer\b|\bfinancial advisor\b/i.test(t)) return "accountant";
  if (/\bpeon\b|\bmts\b|\bmulti tasking\b|\bgroup[- ]d\b|\bsweeper\b|\bhousekeeper\b/i.test(t)) return "mts";
  if (/\bscientist\b|\bresearch\b|\banalyst\b|\blab\b|\btechnician\b/i.test(t)) return "scientist";
  if (/\bclerk\b|\bdata entry\b|\bdeo\b|\bsteno\b|\btyping\b/i.test(t)) return "clerk";
  if (/\bdoctor\b|\bmedical officer\b|\bmo\b(?=\s|$)|\bphysician\b/i.test(t)) return "doctor";
  if (/\bpilot\b|\baircraft\b|\baviation\b/i.test(t)) return "aviation";
  if (/\bcommando\b|\bagni\b|\bagniveer\b|\bsoldier\b|\bnavy\b|\bairforce\b|\barmy\b|\bdefence\b/i.test(t)) return "defence";
  return "general";
}

// ── Days Until Date Calculator ─────────────────────────────────────────────────
function getDaysUntil(dateStr: string | null): number | null {
  if (!dateStr) return null;
  // Handle common Indian date formats: "31 March 2026", "31-03-2026", "31/03/2026"
  const cleaned = dateStr.replace(/(\d+)[\/\-](\d+)[\/\-](\d+)/, "$3-$2-$1");
  const d = new Date(cleaned);
  if (isNaN(d.getTime())) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = Math.ceil((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  return diff;
}

// ── Context Sentence Generator (Makes Every Blog Unique) ──────────────────────
// Generates 1-2 factual, time-relevant sentences that AI cannot replicate.
// These appear as a highlighted box just below the Quick Summary table.
function generateContextSentence(opts: {
  title: string;
  lastDate: string | null;
  totalPosts: string | null;
  category: string;
  stateCode: string | null;
  appFeeGen: string | null;
}): string {
  const alerts: string[] = [];
  const daysLeft = getDaysUntil(opts.lastDate);
  const posts = opts.totalPosts ? parseInt(opts.totalPosts.replace(/,/g, "").match(/\d+/)?.[0] || "0") : null;

  // ── Urgency alert ────────────────────────────────────────────────────────────
  if (daysLeft !== null) {
    if (daysLeft < 0) {
      alerts.push(`🔴 <strong>Last date nikal chuki hai.</strong> Ab notification ke liye dobarah dekhte rahein.`);
    } else if (daysLeft === 0) {
      alerts.push(`🚨 <strong>AAJ LAST DATE HAI!</strong> Abhi apply karo — aaj midnight ke baad link band ho sakta hai.`);
    } else if (daysLeft <= 3) {
      alerts.push(`🚨 <strong>Sirf ${daysLeft} din bacha hai!</strong> Aaj hi form bharein — server down hone se pehle.`);
    } else if (daysLeft <= 7) {
      alerts.push(`⚠️ <strong>Last date: ${daysLeft} din mein.</strong> Agar documents ready nahi hain to aaj hi gather karo.`);
    } else if (daysLeft <= 15) {
      alerts.push(`📅 Apply karne ke liye <strong>${daysLeft} din</strong> bacha hai. Eligibility zaroor check karo.`);
    } else if (daysLeft > 45) {
      alerts.push(`✅ <strong>Kafi samay hai (${daysLeft} din).</strong> Properly padho, documents ready karo aur sahi se apply karo.`);
    }
  }

  // ── Scale context ────────────────────────────────────────────────────────────
  if (posts !== null && posts > 0) {
    if (posts >= 50000) {
      alerts.push(`🔥 <strong>${posts.toLocaleString("en-IN")} vacancies</strong> — Itni badi bharti saalon mein ek baar aati hai. Miss mat karo.`);
    } else if (posts >= 10000) {
      alerts.push(`📊 <strong>${posts.toLocaleString("en-IN")} posts</strong> — Bahut bada recruitment hai, selection ratio accha milega.`);
    } else if (posts <= 50) {
      alerts.push(`⚡ <strong>Sirf ${posts} seats hain</strong> — Competition bahut zyada hoga, preparation strong honi chahiye.`);
    }
  }

  // ── Free for reserved categories ─────────────────────────────────────────────
  if (opts.appFeeGen === "0" || opts.appFeeGen === "nil" || opts.appFeeGen === "free") {
    alerts.push(`🎉 <strong>Application fee ZERO hai</strong> — Koi bhi eligible candidate bina fee ki chinta ke apply kar sakta hai.`);
  }

  if (alerts.length === 0) return "";

  // Return as a styled box (max 2 alerts)
  const alertHtml = alerts.slice(0, 2).map(a => `<p style="margin:4px 0;color:#1e293b;">${a}</p>`).join("");
  return `
<div style="background:#fefce8;border-left:4px solid #f59e0b;padding:14px 18px;border-radius:10px;margin:1rem 0 1.5rem;">
  <strong style="color:#b45309;font-size:0.9rem;">📌 Rojgar Suvidha Alert</strong>
  ${alertHtml}
</div>`;
}

// ── Post-type specific document list generator ────────────────────────────────
function getDocumentListForPostType(postType: string): string {
  const common = [
    "10th Certificate & Marksheet (Date of Birth proof)",
    "Aadhaar Card (self-attested photocopy)",
    "Passport Size Photograph (recent, formal background, 3.5×4.5 cm)",
    "Signature on White Paper",
    "Caste Certificate (OBC/SC/ST — issued by competent authority)",
    "EWS Certificate (if applicable, current year)",
    "PwD Certificate (if applicable — issued from CMO/Civil Surgeon)",
  ];

  const specific: Record<string, string[]> = {
    teacher: [
      "B.Ed / D.El.Ed / BTC Certificate",
      "TET/CTET Marksheet (if applicable)",
      "Teaching Experience Certificate (if required)",
      "12th & Graduation Marksheets",
    ],
    engineer: [
      "Engineering Degree/Diploma Certificate",
      "All Semester Marksheets",
      "NOC from current employer (if employed)",
      "Experience Certificate (if applicable)",
    ],
    police: [
      "Domicile Certificate (state-specific)",
      "Medical Fitness Certificate",
      "Character Certificate from Gazetted Officer",
      "NCC Certificate (if applicable for bonus marks)",
      "Sports Certificate (if applicable)",
    ],
    nurse: [
      "GNM / B.Sc Nursing Certificate",
      "Nursing Council Registration Certificate",
      "Clinical Experience Certificate",
      "12th (Science stream) Marksheet",
    ],
    driver: [
      "Valid Driving License (Heavy Vehicle / LMV as required)",
      "PSV Badge (if applicable for passenger vehicle)",
      "Driving Experience Certificate",
    ],
    doctor: [
      "MBBS / MD / MS Degree Certificate",
      "MCI / State Medical Council Registration",
      "Internship Completion Certificate",
      "Specialization Certificate (if applicable)",
    ],
    accountant: [
      "Graduation in Commerce/B.Com/M.Com",
      "CA / ICWA Certificate (if required)",
      "Tally / Accounting Software Certificate (if applicable)",
    ],
    mts: [
      "8th / 10th Pass Certificate",
      "Domicile Certificate",
      "Character Certificate",
    ],
    scientist: [
      "M.Sc / B.E / B.Tech relevant field",
      "All semester Marksheets",
      "Research/Project Experience Certificate",
      "Publications list (if applicable)",
    ],
    clerk: [
      "Typing Speed Certificate (if required)",
      "Computer Certificate (O-Level/DCA/PGDCA)",
      "Graduation Marksheets",
    ],
    defence: [
      "Domicile/Permanent Resident Certificate",
      "Medical Fitness Certificate (from registered doctor)",
      "Sports/NCC Certificate (for extra marks)",
      "Character Certificate (from SDM/Gazetted Officer)",
    ],
    aviation: [
      "Valid DGCA License (as applicable)",
      "Medical Fitness Certificate (Class 1/2)",
      "Flying hours logbook",
    ],
    general: [
      "Qualifying Degree Certificate + All Marksheets",
      "Experience Certificate (if applicable)",
    ],
  };

  const typeItems = specific[postType] || specific.general;
  const allDocs = [...typeItems, ...common];

  return allDocs.map(d => `<li style="margin-bottom:4px;">${d}</li>`).join("\n");
}

// ── LSI Keyword Generator ─────────────────────────────────────────────────────
// Generates category + title specific LSI phrases for the AI to weave into content.
// These improve topical authority and featured snippet eligibility.
function generateLSIKeywords(title: string, category: string): string {
  const t = title.toLowerCase();
  const year = new Date().getFullYear();
  const lsi: string[] = [];

  // ── Category base LSI ──────────────────────────────────────────────────────
  if (category === "latest-jobs") {
    lsi.push(
      `sarkari naukri ${year}`, `government job notification ${year}`,
      "online application form", "last date to apply", "application fee",
      "age relaxation", "selection process", "official notification PDF",
    );
  } else if (category === "results") {
    lsi.push(
      `merit list ${year}`, "cutoff marks", "scorecard download",
      "qualifying marks", "roll number", "result PDF", "rank list",
      "next stage selection", "document verification",
    );
  } else if (category === "admit-card") {
    lsi.push(
      "hall ticket download", "exam centre", "reporting time",
      "exam day instructions", "photo ID proof", "barcode", "roll number slip",
    );
  } else if (category === "answer-key") {
    lsi.push(
      "provisional answer key", "raise objection", "final answer key",
      "correct answers", "question paper PDF", "objection window",
    );
  } else if (category === "admission") {
    lsi.push(
      "merit-based admission", "counselling process", "seat allotment",
      "college list", "choice filling", "document verification",
    );
  } else {
    lsi.push(
      `government jobs ${year}`, "sarkari naukri", "latest notification",
    );
  }

  // ── Title-specific LSI ─────────────────────────────────────────────────────
  if (/ssc|combined\s*graduate/i.test(t)) {
    lsi.push("Staff Selection Commission", "Tier-1 exam pattern", "Combined Graduate Level", "CGL syllabus");
  }
  if (/railway|rrb|rrb\s*ntpc|group\s*d/i.test(t)) {
    lsi.push("Railway Recruitment Board", "non-technical popular categories", "computer based test CBT");
  }
  if (/bank|ibps|sbi|rbi/i.test(t)) {
    lsi.push("banking exam", "IBPS PO syllabus", "probationary officer", "clerk recruitment");
  }
  if (/upsc|ias|civil\s*services/i.test(t)) {
    lsi.push("Union Public Service Commission", "civil services exam", "IAS IPS IFS", "CSAT prelims");
  }
  if (/police|crpf|bsf|cisf|paramilitary/i.test(t)) {
    lsi.push("physical endurance test", "constable recruitment", "height chest measurement", "written exam");
  }
  if (/teacher|ctet|tet|kvs|nvs/i.test(t)) {
    lsi.push("teaching certification", "B.Ed qualification", "primary teacher", "TGT PGT recruitment");
  }
  if (/bpsc|bihar/i.test(t)) {
    lsi.push("Bihar Public Service Commission", "BPSC exam pattern", "combined competitive examination");
  }
  if (/uppsc|up\s*police|up.*lekh|lekhpal/i.test(t)) {
    lsi.push("Uttar Pradesh public service", "UP recruitment exam", "lekhpal bharti");
  }
  if (/neet|jee|cuet|medical/i.test(t)) {
    lsi.push("medical entrance exam", "engineering entrance", "national testing agency NTA");
  }
  if (/nursing|anm|gnm/i.test(t)) {
    lsi.push("nursing recruitment", "ANM GNM qualification", "healthcare jobs");
  }

  // Return as comma-separated string, max 12 terms
  return lsi.slice(0, 12).join(", ");
}

// ── Editor Opinion Generator ───────────────────────────────────────────────
// Generates a category + context specific expert opinion box.
// This is a key E-E-A-T signal — shows human expertise, not just facts.
function generateEditorOpinion(opts: {
  category: string;
  postType: string;
  totalPosts: string | null;
  lastDate: string | null;
  appFeeGen: string | null;
  sourceTitle: string;
}): string {
  const { category, postType, totalPosts, lastDate, appFeeGen, sourceTitle } = opts;
  const title = sourceTitle.toLowerCase();
  const daysLeft = getDaysUntil(lastDate);
  const isFree = !appFeeGen || appFeeGen === "0" || /free|nil|no\s*fee/i.test(appFeeGen || "");

  let opinionText = "";

  if (category === "latest-jobs") {
    const posts = parseInt(totalPosts || "0", 10);

    // Competition analysis based on post count
    if (posts >= 10000) {
      opinionText = `Is recruitment mein ${posts.toLocaleString("en-IN")} vacancies hain — jo hamare hisab se is saal ki sabse badi opportunities mein se ek hai. Haan, competition bhi zyada hoga, but bulk vacancies mein selection ratio better rehta hai. Agar aap genuinely eligible ho, to apply zaroor karo.`;
    } else if (posts >= 1000) {
      opinionText = `${posts.toLocaleString("en-IN")} vacancies — ye average size recruitment hai. Competition tight hoga, isliye preparation ke saath sahi form fill karna equally important hai. Ek bhi document missing hone par rejection ho sakti hai.`;
    } else if (posts > 0 && posts < 1000) {
      opinionText = `Sirf ${posts} vacancies hain is recruitment mein. Competition bahut tight hoga. Agar aap genuinely eligible ho tabhi apply karo — half-prepared form se time aur paise dono waste honge.`;
    } else if (isFree) {
      opinionText = `Is form ka koi fee nahi hai — matlab loss kuch nahi, gain zyada. Agar eligibility match karti hai to bina soche apply karo.`;
    } else if (daysLeft !== null && daysLeft <= 7) {
      opinionText = `Sirf ${daysLeft} din bacha hai apply karne ke liye. Agar aap eligible ho aur abhi tak form nahi bhara, to aaj hi bhar lo — kal pe mat chhodna.`;
    }

    // Post-type specific additions
    if (/police|crpf|bsf|cisf/i.test(title)) {
      opinionText += " Physical test ke liye abhi se preparation shuru karo — written exam ke baad physical mein hi zyada candidates bahar hote hain.";
    } else if (/teacher|tet|ctet/i.test(title)) {
      opinionText += " TET certificate ki validity zaroor check karo — expired certificate ke saath form reject hoga.";
    } else if (/bank|ibps|sbi/i.test(title)) {
      opinionText += " Bank exams mein sectional cutoff hoti hai — sirf overall marks kafi nahi, har section pass karna zaroori hai.";
    }
  } else if (category === "results") {
    opinionText = `Result check karte waqt apna Roll Number aur Date of Birth ready rakhein. Agar result site slow ho — jo aksar peak time par hoti hai — to thodi der baad try karein. Result PDF save karna na bhoolein, kyunki baad mein link band ho sakta hai.`;
  } else if (category === "admit-card") {
    opinionText = `Admit card download karne ke baad ek cheez zaroor check karein: name, roll number aur exam centre sahi hain ya nahi. Koi bhi galti hone par turant official helpline par contact karein — exam din par kuch nahi ho sakta.`;
  } else if (category === "answer-key") {
    opinionText = `Agar koi answer galat lage to official objection process zaroor use karein. Many candidates objection nahi karte — lekin past mein answer key changes se cutoff shift hui hai. Apna time spend karo — worth it hai.`;
  } else if (category === "admission") {
    opinionText = `Admission mein document verification sabse critical step hota hai. Sabse pehle check karo ki aapke paas sab required certificates hain — baad mein dhundhna bahut stressful hota hai.`;
  } else {
    opinionText = `Ye update sabhi government job aspirants ke liye important hai. Rojgar Suvidha par in-depth analysis ke liye bookmark zaroor karein.`;
  }

  if (!opinionText.trim()) return "";

  return `<div style='background:#fffbeb;border-left:4px solid #f59e0b;padding:14px 18px;margin:1.5rem 0;border-radius:0 8px 8px 0;'>
  <p style='margin:0 0 4px;font-size:0.72rem;font-weight:700;color:#92400e;letter-spacing:0.06em;text-transform:uppercase;'>Rojgar Suvidha Expert View</p>
  <p style='margin:0;color:#1e293b;font-size:0.9rem;line-height:1.65;'>${opinionText}</p>
</div>`;
}

function detectApplyStatus(
  pageText: string,
  links: { href: string; text: string; label?: string }[]
): { status: ApplyStatus; link: string | null } {
  const text = pageText.toLowerCase();

  // ── Coming Soon detection ──
  if (/apply\s*online\s*[:\-–]?\s*coming\s*soon|link\s*will\s*be\s*activat|not\s*yet\s*active|to\s*be\s*announced/i.test(text)) {
    // If explicit "link active on [date]" or "coming soon" row text exists
    const comingSoonLink = links.find(l => /coming\s*soon|will\s*be\s*activat/i.test(l.label || ""));
    if (comingSoonLink && !links.some(l => /apply\s*(online|registration|now)/i.test(l.label || l.text) && !/coming\s*soon/i.test(l.label || ""))) {
      return { status: "coming_soon", link: null };
    }
  }

  // ── Closed detection ──
  if (/application\s*closed|last\s*date\s*over|form\s*closed|apply\s*last\s*date\s*passed/i.test(text)) {
    return { status: "closed", link: null };
  }

  // ── Find real apply link (Check label context + anchor text + href) ──
  const applyPatterns = [
    // 1. Contextual table label (e.g. "Apply Online Click Here" on SarkariResult / FreeJobAlert)
    (l: { href: string; text: string; label?: string }) => 
      /apply\s*(online|registration|now|form)/i.test(l.label || "") &&
      !/coming\s*soon|will\s*be\s*activat|how\s*to\s*apply|video/i.test(l.label || "") &&
      l.href.startsWith("http"),

    // 2. Direct anchor text
    (l: { href: string; text: string; label?: string }) => 
      /^apply\s*(online|now)?$/i.test(l.text.trim()) && l.href.startsWith("http"),

    (l: { href: string; text: string; label?: string }) => 
      /click\s*here\s*to\s*apply/i.test(l.label || l.text) && l.href.startsWith("http"),

    // 3. URL patterns
    (l: { href: string; text: string; label?: string }) => 
      /\/(apply|register|application|form)\//i.test(l.href) && l.href.startsWith("http"),
  ];

  for (const pattern of applyPatterns) {
    const found = links.find(pattern);
    if (found?.href?.startsWith("http")) {
      // Exclude competitor internal links / social media
      const isInternal = 
        found.href.includes("freejobalert.com") || 
        found.href.includes("rojgarsuvidha.com") ||
        found.href.includes("sarkariresult.com") ||
        found.href.includes("t.me") ||
        found.href.includes("whatsapp.com") ||
        found.href.includes("youtube.com") ||
        found.href.includes("instagram.com");

      if (!isInternal) {
        return { status: "open", link: found.href };
      }
    }
  }

  // ── Fallback: "Apply Online" text present but no direct external link → Coming Soon ──
  if (/apply\s*online/i.test(text)) {
    return { status: "coming_soon", link: null };
  }

  return { status: "unknown", link: null };
}

// ── Deep Data Extraction (FreeJobAlert table structure) ───────────────────────
function extractPageData(pageText: string, links: { href: string; text: string; label?: string }[] = []) {
  const text = pageText;

  // Last date — multiple patterns covering FreeJobAlert & SarkariResult table formats
  const lastDatePatterns = [
    /last\s*date\s*(?:for|to)?[^:]*[:\-–]\s*(\d{1,2}[\/\-\.][\d\w]+[\/\-\.]\d{2,4}[^\.\n\|]*)/i,
    /last\s*date(?:\s*to\s*apply|\s*of\s*application|\s*for\s*online\s*application)?[:\s]+([^\n\r|]{5,60})/i,
    /apply\s*before[:\s]+([^\n\r|]{5,60})/i,
    /closing\s*date[:\s]+([^\n\r|]{5,60})/i,
    /end\s*date[:\s]+([^\n\r|]{5,60})/i,
    /(?:application|form)\s*(?:last\s*)?date[:\s]+([^\n\r|]{5,60})/i,
  ];
  let lastDate: string | null = null;
  for (const pattern of lastDatePatterns) {
    const m = text.match(pattern);
    if (m?.[1]) { lastDate = m[1].trim().slice(0, 60).replace(/[|]/g, "").trim(); break; }
  }

  // Total posts — support singular "for 23757 post", "Total Post : 23,757", "Total Vacancy : 1,599"
  const postsPatterns = [
    /for\s*([\d,]+)\s*(?:post|posts|vacancy|vacancies)/i,
    /total\s*(?:vacancy|vacancies|post|posts?)[:\s–\-]+([\d,]+)/i,
    /(?:no\.?\s*of\s*)?(?:vacancy|vacancies|post)[:\s–\-]+([\d,]+)/i,
    /([\d,]+)\s*(?:post|posts|vacancy|vacancies|seat)/i,
  ];
  let totalPosts: string | null = null;
  for (const pattern of postsPatterns) {
    const m = text.match(pattern);
    if (m?.[1] && parseInt(m[1].replace(/,/g, ""), 10) > 0) {
      totalPosts = m[1].replace(/,/g, "");
      break;
    }
  }

  // Application fee — General / OBC / EWS
  const feeGenPatterns = [
    /(?:general|gen|ur|obc|ews)[\/,\s]+(?:obc[\/,\s]+)?(?:ews[\/,\s]+)?(?:[:\-–]\s*)₹?\s*(\d+)/i,
    /application\s*fee[:\s–\-]*(?:general|gen|ur)?[:\s]*₹?\s*(\d+)/i,
    /fee[:\s–\-]+₹?\s*(\d+)/i,
  ];
  let appFeeGen: string | null = null;
  for (const pattern of feeGenPatterns) {
    const m = text.match(pattern);
    if (m?.[1]) { appFeeGen = `₹${m[1]}`; break; }
  }

  // SC/ST fee
  const feeResPatterns = [
    /(?:sc|st|ph|pwd|divyang)[\/,\s]+(?:female[\/,\s]+)?[:\-–]\s*₹?\s*(\d+)/i,
    /(?:sc|st)[:\s–\-]+(?:free|nil|₹?\s*0|\₹?\s*\d+)/i,
  ];
  let appFeeRes: string | null = null;
  for (const pattern of feeResPatterns) {
    const m = text.match(pattern);
    if (m) { appFeeRes = m[0].slice(0, 40).trim(); break; }
  }

  // Official website extraction — use contextual label + text + href
  let officialLink: string | null = null;
  const officialLinkObj = links.find(l => 
    /official\s*(website|site|portal)/i.test(l.label || l.text) &&
    l.href.startsWith("http") &&
    !l.href.includes("freejobalert") &&
    !l.href.includes("sarkariresult") &&
    !l.href.includes("rojgarsuvidha")
  );
  if (officialLinkObj?.href) {
    officialLink = officialLinkObj.href;
  } else {
    const officialPatterns = [
      /official\s*(?:website|site|portal|link)[:\s]+([^\s\n|]{5,80})/i,
      /(?:www\.[a-z0-9\-\.]+\.(?:gov|nic|org|in|com))/i,
    ];
    for (const pattern of officialPatterns) {
      const m = text.match(pattern);
      if (m?.[1]) { officialLink = m[1].trim(); break; }
      if (m?.[0]?.includes("www.")) { officialLink = "https://" + m[0].trim(); break; }
    }
  }

  // Notification PDF extraction — use contextual label + text + href
  let notificationLink: string | null = null;
  const notifLinkObj = links.find(l => 
    /(download\s*)?(notification|advt|advertisement|detailed notification|pdf)/i.test(l.label || l.text) &&
    l.href.startsWith("http") &&
    !l.href.includes("freejobalert") &&
    !l.href.includes("sarkariresult") &&
    !l.href.includes("rojgarsuvidha")
  );
  if (notifLinkObj?.href) {
    notificationLink = notifLinkObj.href;
  }

  // Age limit extraction
  const ageMatch = text.match(/age\s*limit[:\s]+([^\n\r|]{3,40})/i) ||
    text.match(/minimum\s*age\s*[:\-–]\s*(\d+\s*(?:years|yrs)?)/i);
  const ageLimit = ageMatch ? ageMatch[1].trim().slice(0, 40) : null;

  // Education qualification
  const eduMatch = text.match(/(?:education|qualification|educational)[:\s]+([^\n\r|]{5,80})/i);
  const education = eduMatch ? eduMatch[1].trim().slice(0, 80) : null;

  return { lastDate, totalPosts, appFeeGen, appFeeRes, officialLink, notificationLink, ageLimit, education };
}

// ── Fetch ALL category-specific RSS feeds ─────────────────────────────────────
// Each feed URL is tagged with its category → guarantees correct categorization
// Returns items from ALL category feeds in one call
async function fetchRSSItems(): Promise<{
  title: string; link: string; pubDate: string;
  description: string; feedCategory: string;
}[]> {
  const allItems: { title: string; link: string; pubDate: string; description: string; feedCategory: string }[] = [];

  for (const [feedCat, urls] of Object.entries(CATEGORY_RSS_FEEDS)) {
    for (const rssUrl of urls) {
      try {
        const res = await fetch(rssUrl, {
          headers: {
            "User-Agent": "Mozilla/5.0 (compatible; RojgarSuvidhaBot/1.0; +https://www.rojgarsuvidha.com)",
            "Accept": "application/rss+xml, application/xml, text/xml, */*",
          },
          signal: AbortSignal.timeout(15000),
        });
        if (!res.ok) { console.warn(`RSS [${feedCat}] ${rssUrl}: HTTP ${res.status}`); continue; }
        const xml = await res.text();
        if (!xml.includes("<item>")) { console.warn(`RSS [${feedCat}] ${rssUrl}: no <item> tags`); continue; }

        const itemRegex = /<item>([\s\S]*?)<\/item>/g;
        let match: RegExpExecArray | null;
        let count = 0;

        while ((match = itemRegex.exec(xml)) !== null) {
          const block = match[1];
          const title =
            block.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/)?.[1] ||
            block.match(/<title>(.*?)<\/title>/)?.[1] || "";
          const link =
            block.match(/<link>(.*?)<\/link>/)?.[1] ||
            block.match(/<guid[^>]*>(.*?)<\/guid>/)?.[1] || "";
          const pubDate = block.match(/<pubDate>(.*?)<\/pubDate>/)?.[1] || "";
          const description =
            block.match(/<description><!\[CDATA\[([\s\S]*?)\]\]><\/description>/)?.[1] ||
            block.match(/<description>([\s\S]*?)<\/description>/)?.[1] || "";

          if (title && link) {
            allItems.push({
              title: title.trim(), link: link.trim(),
              pubDate: pubDate.trim(), description: description.trim(),
              feedCategory: feedCat,  // ← KEY: tag with source feed category
            });
            count++;
          }
        }
        console.log(`📡 RSS [${feedCat}] from ${rssUrl}: ${count} items`);
        break; // Got items from this feed — no need to try fallback URL
      } catch (e: any) {
        console.warn(`RSS [${feedCat}] ${rssUrl} failed: ${e.message}`);
      }
    }
  }

  if (allItems.length === 0) throw new Error("All category RSS feeds failed");
  return allItems;
}

// ── SarkariResult.com RSS Fetcher ─────────────────────────────────────────────
// SarkariResult uses WordPress RSS — same format as FreeJobAlert
// Their RSS has minimal content (title + link only), so we deep-read each page
async function fetchSarkariResultItems(): Promise<{
  title: string; link: string; pubDate: string;
  description: string; feedCategory: string;
}[]> {
  const allItems: { title: string; link: string; pubDate: string; description: string; feedCategory: string }[] = [];
  const seen = new Set<string>();

  for (const [feedCat, urls] of Object.entries(SARKARIRESULT_RSS_FEEDS)) {
    for (const rssUrl of urls) {
      try {
        const res = await fetch(rssUrl, {
          headers: {
            "User-Agent": "Mozilla/5.0 (compatible; RojgarSuvidhaBot/1.0; +https://www.rojgarsuvidha.com)",
            "Accept": "application/rss+xml, application/xml, text/xml, */*",
          },
          signal: AbortSignal.timeout(15000),
        });
        if (!res.ok) { console.warn(`SarkariResult RSS [${feedCat}] ${rssUrl}: HTTP ${res.status}`); continue; }
        const xml = await res.text();
        if (!xml.includes("<item>")) { console.warn(`SarkariResult RSS [${feedCat}] ${rssUrl}: no <item> tags`); continue; }

        const itemRegex = /<item>([\s\S]*?)<\/item>/g;
        let match: RegExpExecArray | null;
        let count = 0;

        while ((match = itemRegex.exec(xml)) !== null) {
          const block = match[1];
          const title =
            block.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/)?.[1] ||
            block.match(/<title>(.*?)<\/title>/)?.[1] || "";
          const link =
            block.match(/<link>(.*?)<\/link>/)?.[1] ||
            block.match(/<guid[^>]*>(.*?)<\/guid>/)?.[1] || "";
          const pubDate = block.match(/<pubDate>(.*?)<\/pubDate>/)?.[1] || "";
          const description =
            block.match(/<description><!\[CDATA\[([\s\S]*?)\]\]><\/description>/)?.[1] ||
            block.match(/<description>([\s\S]*?)<\/description>/)?.[1] || "";

          // SarkariResult: detect feedCategory from title (since RSS is not categorized)
          let detectedCat = feedCat;
          if (feedCat === "latest-jobs") {
            const t = title.toLowerCase();
            if (/result|merit list|scorecard|cut.?off|selected candidates/.test(t)) detectedCat = "results";
            else if (/admit card|hall ticket|call letter/.test(t)) detectedCat = "admit-card";
            else if (/answer key/.test(t)) detectedCat = "answer-key";
            else if (/admission|counselling/.test(t)) detectedCat = "admission";
          }

          // Deduplicate (SarkariResult sends same item across multiple feeds)
          const linkKey = link.trim();
          if (title && linkKey && !seen.has(linkKey)) {
            seen.add(linkKey);
            allItems.push({
              title: title.trim(), link: linkKey,
              pubDate: pubDate.trim(), description: description.trim(),
              feedCategory: detectedCat,
            });
            count++;
          }
        }
        console.log(`📡 SarkariResult RSS [${feedCat}] from ${rssUrl}: ${count} items`);
        break; // Got items from this URL — skip fallback
      } catch (e: any) {
        console.warn(`SarkariResult RSS [${feedCat}] ${rssUrl} failed: ${e.message}`);
      }
    }
  }

  return allItems; // Empty is OK — FreeJobAlert is the primary source
}

async function fetchFullPage(url: string): Promise<{
  text: string;
  links: { href: string; text: string }[];
  rawHtml: string;
}> {
  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.9,hi;q=0.8",
      "Accept-Encoding": "gzip, deflate, br",
      "Cache-Control": "no-cache",
      "Referer": "https://www.google.com/",
    },
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error(`Page fetch failed: ${res.status} ${res.statusText}`);
  const html = await res.text();

  // FreeJobAlert uses .entry-content div for main content
  // Try to extract just the main content area to reduce noise
  const mainContentMatch =
    html.match(/<div[^>]*class="[^"]*(?:entry-content|post-content|article-content|td-post-content)[^"]*"[^>]*>([\s\S]*?)<\/div>/i) ||
    html.match(/<article[^>]*>([\s\S]*?)<\/article>/i);

  let workingHtml = mainContentMatch ? mainContentMatch[1] : html;

  // Remove noise
  workingHtml = workingHtml
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<nav[\s\S]*?<\/nav>/gi, " ")
    .replace(/<footer[\s\S]*?<\/footer>/gi, " ")
    .replace(/<header[\s\S]*?<\/header>/gi, " ")
    .replace(/<aside[\s\S]*?<\/aside>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<div[^>]*(?:sidebar|widget|ad-|advertisement|comment)[^>]*>[\s\S]*?<\/div>/gi, " ");

  // Extract all links with contextual table labels (important for SarkariResult/FreeJobAlert tables)
  const links: { href: string; text: string; label?: string }[] = [];

  // 1. Table row links — captures context like "Apply Online Click Here"
  const trMatches = workingHtml.match(/<tr[^>]*>[\s\S]*?<\/tr>/gi) || [];
  for (const tr of trMatches) {
    const rowText = tr.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    const rowLinkRegex = /<a\s+[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
    let rMatch: RegExpExecArray | null;
    while ((rMatch = rowLinkRegex.exec(tr)) !== null) {
      const href = rMatch[1].trim();
      const text = rMatch[2].replace(/<[^>]+>/g, "").trim();
      if (href && text && text.length < 100) {
        const label = `${rowText} (${text})`;
        links.push({ href, text, label });
      }
    }
  }

  // 2. Standard link extraction (fallback for non-table links)
  const linkRegex = /<a\s+[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let linkMatch: RegExpExecArray | null;
  while ((linkMatch = linkRegex.exec(workingHtml)) !== null) {
    const href = linkMatch[1].trim();
    const text = linkMatch[2].replace(/<[^>]+>/g, "").trim();
    if (href && text && text.length < 100) {
      if (!links.some(l => l.href === href)) {
        links.push({ href, text, label: text });
      }
    }
  }

  // Strip HTML and decode entities
  let rawText = workingHtml
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(?:p|div|tr|li|h[1-6])\s*>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ").replace(/&quot;/g, '"').replace(/&#8211;/g, "–")
    .replace(/&#8212;/g, "—").replace(/&#8217;/g, "'").replace(/&#8220;/g, '"')
    .replace(/\s{2,}/g, " ").replace(/\n{3,}/g, "\n\n").trim();

  // Fallback: If container extraction yielded less than 200 words, extract from full HTML page
  if (rawText.split(/\s+/).length < 200) {
    let fullHtml = html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<nav[\s\S]*?<\/nav>/gi, " ")
      .replace(/<footer[\s\S]*?<\/footer>/gi, " ")
      .replace(/<!--[\s\S]*?-->/g, " ");

    rawText = fullHtml
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/(?:p|div|tr|li|h[1-6])\s*>/gi, "\n")
      .replace(/<[^>]+>/g, " ")
      .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
      .replace(/&nbsp;/g, " ").replace(/&quot;/g, '"')
      .replace(/\s{2,}/g, " ").replace(/\n{3,}/g, "\n\n").trim();
  }

  // Clean source text from competitor brand names beforehand
  const cleanedText = sanitizeSourceText(rawText.slice(0, 12000));
  return { text: cleanedText, links, rawHtml: workingHtml.slice(0, 2000) };
}

// ── Fetch NDTV Education News Articles ───────────────────────────────────────
/**
 * Fetch NDTV Education News RSS / HTML feed
 */
export async function fetchNDTVEducationNews(): Promise<{ title: string; link: string; pubDate: string; description: string }[]> {
  const items: { title: string; link: string; pubDate: string; description: string }[] = [];
  const seen = new Set<string>();

  // 1. Try direct NDTV Education fetch
  try {
    const res = await fetch("https://www.ndtv.com/education", {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
      signal: AbortSignal.timeout(10000),
    });
    if (res.ok) {
      const html = await res.text();
      const linkRegex = /<a\s+[^>]*href=["'](https:\/\/www\.ndtv\.com\/education\/[^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
      let match: RegExpExecArray | null;
      while ((match = linkRegex.exec(html)) !== null) {
        const url = match[1];
        const rawText = match[2].replace(/<[^>]+>/g, "").replace(/&#039;/g, "'").replace(/&amp;/g, "&").trim();
        if (rawText && rawText.length > 20 && !seen.has(url) && !url.includes("/page-") && !url.endsWith("/education") && !url.endsWith("/results")) {
          seen.add(url);
          items.push({
            title: cleanCompetitorBrands(rawText),
            link: url,
            pubDate: new Date().toISOString(),
            description: rawText,
          });
        }
      }
    }
  } catch (err: any) {
    console.warn("⚠️ Direct NDTV Education fetch failed/blocked:", err.message);
  }

  // 2. Fallback to Google News RSS for NDTV Education if direct fetch gets 0 items
  if (items.length === 0) {
    try {
      const gRes = await fetch("https://news.google.com/rss/search?q=site:ndtv.com+education&hl=en-IN&gl=IN&ceid=IN:en", {
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; RojgarSuvidhaBot/1.0; +https://www.rojgarsuvidha.com)",
        },
        signal: AbortSignal.timeout(12000),
      });
      if (gRes.ok) {
        const xml = await gRes.text();
        const itemRegex = /<item>([\s\S]*?)<\/item>/g;
        let match: RegExpExecArray | null;
        while ((match = itemRegex.exec(xml)) !== null) {
          const block = match[1];
          const rawTitle = block.match(/<title>(.*?)<\/title>/)?.[1] || "";
          const title = rawTitle.replace(/\s*-\s*NDTV$/i, "").trim();
          const link = block.match(/<link>(.*?)<\/link>/)?.[1] || block.match(/<guid[^>]*>(.*?)<\/guid>/)?.[1] || "";
          const pubDate = block.match(/<pubDate>(.*?)<\/pubDate>/)?.[1] || new Date().toISOString();
          if (title && link && !seen.has(link)) {
            seen.add(link);
            items.push({
              title: cleanCompetitorBrands(title),
              link,
              pubDate,
              description: title,
            });
          }
        }
      }
    } catch (gErr: any) {
      console.warn("⚠️ Google News RSS fallback for NDTV failed:", gErr.message);
    }
  }

  console.log(`📡 NDTV Education Scraper: ${items.length} news items found`);
  return items;
}

// ── Competitor Brand Scrubbing Helpers ────────────────────────────────────────
function sanitizeSourceText(text: string): string {
  if (!text) return "";
  return text
    .replace(/free\s*job\s*alert(?:\.com)?/gi, "")
    .replace(/freejobalert(?:\.com)?/gi, "")
    .replace(/freejobales(?:\.com)?/gi, "")
    .replace(/fja(?:\.com)?/gi, "")
    .replace(/copyright\s*©?\s*freejobalert[^\n]*/gi, "")
    .replace(/all\s*rights\s*reserved\s*by\s*freejobalert[^\n]*/gi, "")
    .replace(/ndtv\s*education/gi, "Rojgar Suvidha News Desk")
    .replace(/ndtv\s*network/gi, "Rojgar Suvidha Network")
    .replace(/ndtv(?:\.com)?/gi, "Rojgar Suvidha")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function cleanCompetitorBrands(str: string): string {
  if (!str) return "";
  return str
    // FreeJobAlert
    .replace(/free\s*job\s*alert(?:\.com)?/gi, "Rojgar Suvidha")
    .replace(/freejobalert(?:\.com)?/gi, "Rojgar Suvidha")
    .replace(/freejobales(?:\.com)?/gi, "Rojgar Suvidha")
    .replace(/fja(?:\.com)?/gi, "Rojgar Suvidha")
    // SarkariResult
    .replace(/sarkari\s*result\s*®/gi, "Rojgar Suvidha")
    .replace(/sarkariresult(?:\.com)?/gi, "Rojgar Suvidha")
    .replace(/www\.sarkariresult\.com/gi, "www.rojgarsuvidha.com")
    .replace(/WWW\.SARKARIRESULT\.COM/g, "www.rojgarsuvidha.com")
    .replace(/SARKARI RESULT®/g, "Rojgar Suvidha")
    // NDTV
    .replace(/ndtv\s*education/gi, "Rojgar Suvidha News Desk")
    .replace(/ndtv\s*network/gi, "Rojgar Suvidha Network")
    .replace(/ndtv(?:\.com)?/gi, "Rojgar Suvidha")
    // Others
    .replace(/careers360(?:\.com)?/gi, "Rojgar Suvidha")
    .replace(/jagran\s*josh(?:\.com)?/gi, "Rojgar Suvidha");
}


// ── Strip H1 & Mobile Overflow Protection ────────────────────────────────────
function stripH1FromBlog(html: string): string {
  if (!html) return "";
  let clean = html
    .replace(/<h1(\s[^>]*)?>/gi, (_, attrs) => `<h2${attrs || ""}>`)  
    .replace(/<\/h1>/gi, "</h2>")
    // Strip fixed pixel widths (e.g. style="width: 700px;") that break mobile layout
    .replace(/style=["'][^"']*width\s*:\s*\d+px[^"']*["']/gi, "")
    // Auto-wrap raw <table> tags in a unicorn responsive container with scroll indicator if not already wrapped
    .replace(/(<table(?:\s[^>]*)?>[\s\S]*?<\/table>)/gi, (match) => {
      if (match.includes("unicorn-table-box") || match.includes("table-wrapper")) return match;
      return `<div class='unicorn-table-box' style='overflow-x:auto;max-width:100%;-webkit-overflow-scrolling:touch;margin:1.25rem 0;border-radius:12px;padding:4px;border:1px solid #e0e7ff;background:#fafaff;'><div style='font-size:11px;font-weight:700;color:#4f46e5;margin-bottom:4px;display:flex;align-items:center;gap:4px;'><span class='sm-scroll-hint'>↔ Swipe table left/right</span></div>${match}</div>`;
    });
  return clean;
}

// ── Slug duplicate check ──────────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function getUniqueSlug(baseSlug: string, supabase: any): Promise<string> {
  let slug = baseSlug;
  let counter = 1;
  while (true) {
    // Check in jobs table
    const { data } = await supabase.from("jobs").select("id").eq("slug", slug).maybeSingle();
    if (!data) return slug; // Slug is unique
    slug = `${baseSlug}-${counter}`;
    counter++;
    if (counter > 10) return `${baseSlug}-${Date.now()}`; // failsafe
  }
}

// ── Blog Quality Validator ────────────────────────────────────────────────────
// Runs AFTER AI generation, BEFORE saving to DB.
// If validation fails → post is SKIPPED. Never publish bad content.
function validateBlogQuality(html: string, category: string, rawSourceText?: string): { valid: boolean; issues: string[]; score: number } {
  const issues: string[] = [];
  const text = html.toLowerCase();
  const wordCount = html.replace(/<[^>]+>/g, " ").split(/\s+/).filter(Boolean).length;

  // ── Originality check — detect copy-paste from source ──────────────────────
  if (rawSourceText && rawSourceText.length > 100) {
    const sourceWords = rawSourceText.toLowerCase().replace(/\s+/g, " ");
    const htmlText = html.replace(/<[^>]+>/g, " ").toLowerCase().replace(/\s+/g, " ");

    // Check 6-word phrase matches (ignoring common government job boilerplate)
    const sourceNgrams = new Set<string>();
    const sourceTokens = sourceWords.split(" ").filter(w => w.length > 3);
    for (let i = 0; i <= sourceTokens.length - 6; i++) {
      sourceNgrams.add(sourceTokens.slice(i, i + 6).join(" "));
    }
    const htmlTokens = htmlText.split(" ").filter(w => w.length > 3);
    let copyHits = 0;
    for (let i = 0; i <= htmlTokens.length - 6; i++) {
      const phrase = htmlTokens.slice(i, i + 6).join(" ");
      // Exclude standard official notification boilerplate phrases from copy hits
      if (
        !phrase.includes("last date") &&
        !phrase.includes("application fee") &&
        !phrase.includes("official website") &&
        !phrase.includes("how to apply") &&
        !phrase.includes("educational qualification")
      ) {
        if (sourceNgrams.has(phrase)) copyHits++;
      }
    }
    // If >35 matching non-boilerplate 6-grams, flag copy-paste
    if (copyHits > 35) {
      issues.push(`Possible copy-paste detected: ${copyHits} matching phrase segments from source`);
    }
  }

  // FreeJobAlert boilerplate phrases that get copied directly
  if (/freejobalert\.com|freejobalert provide you|click here to check|important for candidates|note:- all the information/i.test(html)) {
    issues.push("FreeJobAlert boilerplate text found — copied from source, not original");
  }

  // SarkariResult boilerplate phrases
  if (/sarkariresult\.com|www\.sarkariresult|SARKARI RESULT®|sarkari result®|Sarkari Result® Official/i.test(html)) {
    issues.push("SarkariResult brand/URL found in content — must be stripped before publishing");
  }

  // Universal checks (every category)
  if (html.includes("<h1"))
    issues.push("H1 tag in blog content — double H1 SEO penalty");

  // Check ONLY actual competitor domain/brand names
  if (/freejobalert|sarkariresult\.com|ndtv\.com|careers360|jagran\s*josh/i.test(html))
    issues.push("Competitor brand name found in content");


  if (/\bas an ai\b|language model|as of my knowledge cutoff|my training data/i.test(html))
    issues.push("AI self-reference phrase found (Google spam signal)");

  if (/furthermore,|additionally,|moreover,|in conclusion,|in summary,|to summarize,|it is important to note|it should be noted/i.test(html))
    issues.push("AI template phrases found (sounds robotic)");

  if (wordCount < 400)
    issues.push(`Content too thin: ${wordCount} words (minimum 400 required)`);

  if (!/rojgarsuvidha\.com|\/latest-jobs|\/results|\/admit-card|\/answer-key|\/admission|\/jobs\//i.test(html))
    issues.push("No internal Rojgar Suvidha link found");

  // Category-specific checks
  if (category === "results") {
    if (!text.includes("download") && !text.includes("check result") && !text.includes("result link") && !text.includes("scorecard"))
      issues.push("Result post has no download/check result section");
    if (text.includes("last date to apply") || text.includes("how to apply online"))
      issues.push("Result post incorrectly contains apply section (category bleed)");
  }

  if (category === "admit-card") {
    if (!text.includes("download") && !text.includes("admit card"))
      issues.push("Admit card post has no download section");
    if (text.includes("result link") || text.includes("merit list released"))
      issues.push("Admit card post incorrectly contains result content");
  }

  if (category === "answer-key") {
    if (!text.includes("answer key") && !text.includes("download"))
      issues.push("Answer key post has no key download section");
    if (text.includes("how to apply online") || text.includes("application fee"))
      issues.push("Answer key post incorrectly contains application content");
  }

  if (category === "latest-jobs") {
    if (!text.includes("last date") && !text.includes("apply"))
      issues.push("Job post has no last date or apply section");
    if (text.includes("result out") || text.includes("merit list released"))
      issues.push("Job post incorrectly contains result content (category bleed)");
  }

  if (category === "news") {
    if (text.includes("application fee") || text.includes("how to apply online"))
      issues.push("News post incorrectly contains job application content");
  }

  // ── Enhanced AI-ish phrase detection (Google spam signals) ──────────────────
  const genericAIPhrases = [
    "it is worth noting", "it goes without saying", "needless to say",
    "don't miss this golden chance", "this is a golden opportunity",
    "yeh ek shandaar mauka hai", "unmatched opportunity",
    "a great opportunity for", "highly competitive era",
    "dream of securing", "countless aspirants",
    "financial stability and job security", "embark on a rewarding career",
  ];
  const foundAIPhrases = genericAIPhrases.filter(p => text.includes(p));
  if (foundAIPhrases.length >= 2) {
    issues.push(`Generic AI phrases (${foundAIPhrases.length} found): "${foundAIPhrases[0]}" — rewrite with specific content`);
  }

  // ── Word count bounds ────────────────────────────────────────────────────────
  if (wordCount > 1800 && (category === "latest-jobs" || category === "results")) {
    issues.push(`Content too long: ${wordCount} words (aim 900-1200 for better UX and lower bounce rate)`);
  }

  // ── Quality score calculation (0-100) ────────────────────────────────────────
  let score = 100;
  score -= Math.min(70, issues.length * 12); // Each issue costs 12 points, max 70 deducted
  if (wordCount >= 700 && wordCount <= 1400) score += 5;  // Optimal length bonus
  if (text.includes("faq") || text.includes("frequently asked")) score += 5;
  if (text.includes("zaroor check") || text.includes("checklist")) score += 5;
  score = Math.max(0, Math.min(100, score));

  return { valid: issues.length === 0, issues, score };
}


// ── Generate Blog via Gemini AI (Full SarkariLekhan Persona) ─────────────────

async function generateBlogDraft(opts: {
  rawText: string;
  category: BlogCategory;
  applyStatus: ApplyStatus;
  applyLink: string | null;
  officialLink: string | null;
  lastDate: string | null;
  totalPosts: string | null;
  appFeeGen: string | null;
  appFeeRes: string | null;
  ageLimit: string | null;
  education: string | null;
  sourceTitle: string;
}) {
  const {
    rawText, category, applyStatus, applyLink, officialLink,
    lastDate, totalPosts, appFeeGen, appFeeRes, ageLimit, education, sourceTitle,
  } = opts;

  // ── Apply instruction builder ──────────────────────────────────────────────
  let applyInstruction = "";
  if (applyStatus === "coming_soon") {
    applyInstruction = `APPLY STATUS: COMING SOON — Do NOT add any apply button. In the How to Apply section write:
<div style='background:#fef9c3;border-left:4px solid #d97706;padding:16px 20px;border-radius:8px;margin:1.5rem 0;'>
  <strong style='color:#b45309;'>Apply Online Link — Coming Soon</strong>
  <p style='margin:8px 0 0;color:#1e293b;'>Online apply link is not yet active. As soon as the link is activated, we will update this page immediately. Till then: Download the official notification PDF below, check your eligibility, keep your documents ready, and bookmark Rojgar Suvidha for instant updates.</p>
</div>`;
  } else if (applyStatus === "open" && applyLink) {
    applyInstruction = `APPLY LINK IS LIVE: ${applyLink}
Add this green Apply button after the How to Apply steps:
<div style='text-align:center;margin:2rem 0;'>
  <a href='${applyLink}' target='_blank' rel='noopener noreferrer' style='display:inline-block;background:linear-gradient(135deg,#15803d,#16a34a);color:white;padding:16px 36px;border-radius:12px;font-size:1.1rem;font-weight:800;text-decoration:none;box-shadow:0 4px 15px rgba(21,128,61,0.3);'>Apply Online — Official Portal</a>
  <p style='color:#64748b;font-size:0.85rem;margin-top:8px;'>Verified official link — Safe to use via Rojgar Suvidha</p>
</div>`;
  } else if (applyStatus === "closed") {
    applyInstruction = `NOTE: Application window is closed. Mention this clearly and suggest watching for re-notification.`;
  }

  const todayDate = new Date().toLocaleDateString("en-IN", {
    weekday: "long", day: "numeric", month: "long", year: "numeric"
  });

  // ── Detect post type for specific document lists ─────────────────────────────
  const postType = detectPostType(sourceTitle);

  // ── Generate unique context sentence (time-relevant, factual) ────────────────
  const contextSentenceHtml = generateContextSentence({
    title: sourceTitle,
    lastDate,
    totalPosts,
    category,
    stateCode: null, // Not available at this stage
    appFeeGen,
  });

  // ── Post-type specific document list ─────────────────────────────────────────
  const specificDocumentList = getDocumentListForPostType(postType);

  // ── LSI Keywords (category + title specific) ─────────────────────────────
  const lsiKeywords = generateLSIKeywords(sourceTitle, category);

  // ── Editor Opinion Box (E-E-A-T human signal) ──────────────────────────
  const editorOpinionHtml = generateEditorOpinion({
    category, postType, totalPosts: totalPosts || null,
    lastDate: lastDate || null, appFeeGen: appFeeGen || null, sourceTitle,
  });

  // Cap reference text to 12,000 chars (~3,000 tokens) to prevent prompt bloat & token limit errors
  const cleanedRawText = sanitizeSourceText(rawText).slice(0, 12000);

  const enrichedContext = `
SOURCE TITLE: ${cleanCompetitorBrands(sourceTitle)}
CATEGORY: ${category}
POST TYPE: ${postType} (use this to write relevant content)
TODAY: ${todayDate}
LAST DATE: ${lastDate || "Check official notification"}
DAYS LEFT TO APPLY: ${getDaysUntil(lastDate) !== null ? getDaysUntil(lastDate) + " days" : "Unknown"}
TOTAL VACANCIES: ${totalPosts || "Check official notification"}
FEE (Gen/OBC): ${appFeeGen || "Check notification"}
FEE (SC/ST): ${appFeeRes || "Check notification (may be free)"}
AGE LIMIT: ${ageLimit || "As per notification"}
EDUCATION: ${education || "As per notification"}
OFFICIAL WEBSITE: ${officialLink || "Refer to notification links below"}
${applyInstruction}

PRE-GENERATED CONTEXT ALERT BOX (insert this VERBATIM just after the Quick Summary table — do not modify):
${contextSentenceHtml || "<!-- no alert -->"}  

POST-TYPE SPECIFIC DOCUMENTS (use ONLY these for the Documents Required section — do not add generic ones):
<ul>
${specificDocumentList}
</ul>

LSI KEYWORDS — Weave 4-6 of these NATURALLY into body paragraphs (do NOT list them, just use in sentences):
${lsiKeywords}

BANNER IMAGE ALT TAG RULE (if any <img> tag is added):
alt must be: "[Primary Keyword] — [Secondary Angle] | Rojgar Suvidha"
Example: alt="SSC CGL 2026 Notification — Eligibility, Vacancy & Apply Online | Rojgar Suvidha"
NEVER use: alt="image", alt="banner", alt="Rojgar Suvidha", or any generic text.

EDITOR OPINION BOX (insert this VERBATIM after section 3 INTRODUCTION — do not modify the HTML):
${editorOpinionHtml || "<!-- no opinion box for this post -->"}  

===== REFERENCE DATA — FACTS ONLY — DO NOT COPY ANY SENTENCE =====
[Use below ONLY to extract: vacancy count, dates, fees, links, eligibility. Write ALL sentences yourself.]
${cleanedRawText}
=================================================================`;

  // ── Category-specific writing blueprints ──────────────────────────────────
  let categoryBlueprint = "";

  if (category === "results") {
    categoryBlueprint = `
CATEGORY: SARKARI RESULT (Exam Result / Merit List / Scorecard)
WORD TARGET: Minimum 1500 words

ABSOLUTELY FORBIDDEN — DO NOT WRITE THESE SECTIONS AT ALL:
- Apply Online / Application section or CTA
- Application Fee table or fee information
- Last Date to Apply
- "Apply Karein" or "Apply Now" buttons
- Vacancy breakdown / Post-wise vacancy table
- Eligibility criteria / Age limit table
- How to Apply Online steps
- Salary or Pay Scale section

MANDATORY SECTIONS (write exactly these 8, in this order):
1. BYLINE: <p style='font-size:0.85rem;color:#64748b;margin:0 0 1.5rem;'>By Rojgar Suvidha Result Desk | ${todayDate} | Sarkari Result Update</p>

2. RESULT STATUS BOX:
${applyLink
  ? `<div style='background:#f0fdf4;border:2px solid #22c55e;padding:20px 24px;border-radius:12px;text-align:center;margin:1.5rem 0;'>
  <h2 style='color:#15803d;margin:0 0 10px;font-size:1.2rem;font-weight:700;'>Result 2026 Released — Check Now</h2>
  <p style='color:#334155;margin-bottom:16px;font-size:0.95rem;'>Keep your Roll Number and Date of Birth ready before clicking.</p>
  <a href='${applyLink}' target='_blank' rel='noopener noreferrer' style='display:inline-block;background:#16a34a;color:white;padding:13px 30px;border-radius:10px;font-weight:800;text-decoration:none;font-size:1rem;'>Check Result — Direct Official Link</a>
</div>`
  : `<div style='background:#f0fdf4;border:2px solid #22c55e;padding:20px 24px;border-radius:12px;text-align:center;margin:1.5rem 0;'>
  <h2 style='color:#15803d;margin:0 0 10px;font-size:1.2rem;font-weight:700;'>Result 2026 — Direct Link</h2>
  <p style='color:#d97706;font-weight:600;'>Direct link will be added here as soon as it is activated on the official website. Keep checking Rojgar Suvidha for instant updates.</p>
</div>`
}

3. QUICK OVERVIEW TABLE: <h2>Quick Overview</h2> — Table with: Organization | Exam Name | Total Candidates | Exam Date | Result Date | Next Stage | Official Website (with real link)

4. KEY HIGHLIGHTS: <h2>Key Highlights of This Result</h2> — 3-4 specific bullet points about this result (what was released, how many shortlisted, what's next)

5. HOW TO CHECK RESULT: <h2>How to Check Result 2026 — Step by Step</h2> — Numbered steps: Visit official site > Click result link > Enter Roll Number + Date of Birth > Submit > Download Scorecard/PDF

6. CUTOFF MARKS: <h2>Expected Cutoff Marks 2026</h2>
   - IF actual cutoff numbers are in source: Write a category-wise table (UR/OBC/EWS/SC/ST)
   - IF NOT in source: Write exactly: "Cutoff marks official website par release hone ke baad is page par update kar diya jaayega. Abhi ke liye, previous year cutoff se comparison kar sakte hain."
   Then mention previous year cutoff context if logically reasonable.

7. WHAT TO DO NEXT: <h2>What to Do After Checking Result — Next Stage Guide</h2>
   Specific to THIS exam only — what is the next selection stage (Tier 2 / DV / Physical Test / Medical / Interview)? Give actionable steps.

8. FAQ SECTION: <h2>Frequently Asked Questions</h2>
   Minimum 5 Q&A using FAQPage schema format. Questions must be specific to THIS result.
   Example Q: "When will the SSC MTS result 2026 merit list PDF be released?"
   Answers: Hinglish, direct, 1-2 sentences.

LANGUAGE RULE FOR THIS CATEGORY:
- All headings (h2, h3) → Pure English
- Table labels → English
- Body paragraphs → Warm Hinglish (English sentences + Hindi phrases naturally mixed)
- FAQ answers → Conversational Hinglish
- NO pure Hindi text (no Devanagari script)
`;

  } else if (category === "admit-card") {
    categoryBlueprint = `
CATEGORY: ADMIT CARD / HALL TICKET
WORD TARGET: Minimum 1500 words

ABSOLUTELY FORBIDDEN:
- Application Fee table or fee information
- How to Apply Online section
- Vacancy breakdown / Post-wise vacancy
- Salary or Pay Scale
- Result date predictions
- Apply Now / Apply Online CTA buttons

MANDATORY SECTIONS (exactly these 8, in this order):
1. BYLINE: <p style='font-size:0.85rem;color:#64748b;margin:0 0 1.5rem;'>By Rojgar Suvidha Exam Desk | ${todayDate} | Admit Card Update</p>

2. DOWNLOAD BOX:
${applyLink
  ? `<div style='background:#fff7ed;border:2px solid #f97316;padding:20px 24px;border-radius:12px;text-align:center;margin:1.5rem 0;'>
  <h2 style='color:#c2410c;margin:0 0 10px;font-size:1.2rem;font-weight:700;'>Download Official Admit Card</h2>
  <p style='color:#334155;margin-bottom:16px;font-size:0.95rem;'>Keep your Application Number and Date of Birth ready.</p>
  <a href='${applyLink}' target='_blank' rel='noopener noreferrer' style='display:inline-block;background:#ea580c;color:white;padding:13px 30px;border-radius:10px;font-weight:800;text-decoration:none;font-size:1rem;'>Download Admit Card — Official Link</a>
</div>`
  : `<div style='background:#fff7ed;border:2px solid #f97316;padding:20px 24px;border-radius:12px;text-align:center;margin:1.5rem 0;'>
  <h2 style='color:#c2410c;margin:0 0 10px;font-size:1.2rem;font-weight:700;'>Admit Card Download</h2>
  <p style='color:#d97706;font-weight:600;'>Download link will be activated here as soon as it is released on the official website. Bookmark Rojgar Suvidha for instant notification.</p>
</div>`
}

3. EXAM SCHEDULE: <h2>Exam Schedule 2026</h2> — Table: Exam Name | Date | Shift | Reporting Time | Gate Closure | Exam Mode (CBT/OMR/Offline)
   Include only dates/times present in source.

4. HOW TO DOWNLOAD: <h2>How to Download Admit Card 2026 — Step by Step</h2>
   Numbered steps: Visit official site > Click Admit Card link > Enter Application No + DOB > Verify details > Download PDF > Print 2-3 copies

5. DOCUMENTS TO CARRY ON EXAM DAY: <h2>Documents to Carry to Exam Centre</h2>
   - Printed Admit Card (A4 size, clear print)
   - Original Photo ID (Aadhaar Card / Voter ID / PAN Card / Passport / Driving License)
   - 2-3 Recent Passport Size Photographs
   - Pen (Blue/Black ball point)
   - Any post-specific document (e.g. PwD certificate if applicable)

6. EXAM DAY PREPARATION GUIDE: <h2>Exam Day Preparation — Important Tips</h2>
   Timeline: Reach centre 60 min early > Gate closes 30 min before exam > Exam starts at scheduled time
   Tips: Check centre address on Google Maps, carry valid ID only (not photocopy), switch off mobile at gate

7. PROHIBITED ITEMS: <h2>Items NOT Allowed in Exam Hall</h2>
   Table or bulleted list: Mobile phone | Smartwatch | Bluetooth device | Calculator | Wallet | Belt/metal items | Book/notes | Food items

8. FAQ: <h2>Frequently Asked Questions</h2>
   Minimum 5 Q&A with FAQPage schema. Questions specific to THIS admit card.

LANGUAGE RULE: English headings + Hinglish body paragraphs + English tables
`;

  } else if (category === "answer-key") {
    categoryBlueprint = `
CATEGORY: ANSWER KEY / RESPONSE SHEET
WORD TARGET: Minimum 1200 words

ABSOLUTELY FORBIDDEN:
- How to Apply Online section
- Application Fee information
- Vacancy details / Post-wise vacancy
- Salary or Pay Scale
- Admit Card download links

MANDATORY SECTIONS (exactly these 7, in this order):
1. BYLINE: <p style='font-size:0.85rem;color:#64748b;margin:0 0 1.5rem;'>By Rojgar Suvidha Exam Desk | ${todayDate} | Answer Key Update</p>

2. DOWNLOAD BOX:
${applyLink
  ? `<div style='background:#fef2f2;border:2px solid #ef4444;padding:20px 24px;border-radius:12px;text-align:center;margin:1.5rem 0;'>
  <h2 style='color:#b91c1c;margin:0 0 10px;font-size:1.2rem;font-weight:700;'>Download Official Answer Key</h2>
  <a href='${applyLink}' target='_blank' rel='noopener noreferrer' style='display:inline-block;background:#dc2626;color:white;padding:13px 30px;border-radius:10px;font-weight:800;text-decoration:none;font-size:1rem;'>Download Answer Key — Direct Link</a>
</div>`
  : `<div style='background:#fef2f2;border:2px solid #ef4444;padding:20px 24px;border-radius:12px;text-align:center;margin:1.5rem 0;'>
  <h2 style='color:#b91c1c;margin:0 0 10px;font-size:1.2rem;font-weight:700;'>Answer Key Download</h2>
  <p style='color:#d97706;font-weight:600;'>Answer key link will be updated here as soon as it is released. Stay connected with Rojgar Suvidha for instant updates.</p>
</div>`
}

3. QUICK INFO TABLE: <h2>Answer Key 2026 — Quick Overview</h2>
   Table: Exam Name | Exam Date | Shift | Answer Key Date | Objection Window Dates | Fee per Objection | Official Website

4. HOW TO CALCULATE YOUR SCORE: <h2>How to Calculate Your Score Using Answer Key</h2>
   IF marking scheme is in source: Write the formula. Example: Total Score = (Correct × 2) – (Wrong × 0.5)
   IF not in source: Skip this section entirely and do not guess.

5. HOW TO SUBMIT OBJECTION: <h2>How to Challenge Answer Key — Objection Process</h2>
   Step-by-step guide: Login to official portal > Click Challenge Answer Key > Select question > Select your answer > Pay fee > Submit
   Mention: Objection window open/close date, fee per question, proof requirement.
   If objection window not yet open: Mention when it will open.

6. RESPONSE SHEET DOWNLOAD: <h2>How to Download Your Response Sheet</h2>
   Guide for accessing candidate's own response sheet (different from answer key).

7. FAQ: <h2>Frequently Asked Questions</h2>
   Minimum 5 Q&A with FAQPage schema. Specific to THIS answer key exam.

LANGUAGE RULE: English headings + Hinglish body + English tables
`;

  } else if (category === "admission") {
    categoryBlueprint = `
CATEGORY: COLLEGE / UNIVERSITY ADMISSION & COUNSELING
WORD TARGET: Minimum 1800 words

ABSOLUTELY FORBIDDEN:
- Government Job Apply section
- Government recruitment fee tables
- Result scorecard for competitive exams (different from admission merit)

MANDATORY SECTIONS (exactly these 8, in this order):
1. BYLINE: <p style='font-size:0.85rem;color:#64748b;margin:0 0 1.5rem;'>By Rojgar Suvidha Admission Desk | ${todayDate} | Admission Update</p>

2. REGISTRATION BOX:
${applyLink
  ? `<div style='background:#eff6ff;border:2px solid #3b82f6;padding:20px 24px;border-radius:12px;text-align:center;margin:1.5rem 0;'>
  <h2 style='color:#1d4ed8;margin:0 0 10px;font-size:1.2rem;font-weight:700;'>Online Admission / Counseling Registration</h2>
  <a href='${applyLink}' target='_blank' rel='noopener noreferrer' style='display:inline-block;background:#2563eb;color:white;padding:13px 30px;border-radius:10px;font-weight:800;text-decoration:none;font-size:1rem;'>Register for Admission — Official Portal</a>
</div>`
  : `<div style='background:#eff6ff;border:2px solid #3b82f6;padding:20px 24px;border-radius:12px;text-align:center;margin:1.5rem 0;'>
  <h2 style='color:#1d4ed8;margin:0 0 10px;font-size:1.2rem;font-weight:700;'>Admission Registration</h2>
  <p style='color:#d97706;font-weight:600;'>Registration link is not yet available. Check the official website or keep watching Rojgar Suvidha for the direct link.</p>
</div>`
}

3. QUICK INFO TABLE: <h2>Admission 2026 — Quick Overview</h2>
   Table: University/Body | Course Name | Total Seats | Admission Mode | Registration Last Date | Result/Merit Date | Official Website

4. ELIGIBILITY: <h2>Eligibility Criteria</h2>
   Minimum qualification (10th/12th/Graduation percentage) + Age limit if applicable. Extract from source only.

5. ADMISSION PROCESS: <h2>Admission Process & Selection Criteria</h2>
   Is it entrance-based, merit-based, or interview? Counseling rounds schedule (Round 1, 2, Stray Vacancy). Who conducts counseling.

6. FEE STRUCTURE: <h2>Course Fee & Other Charges</h2>
   Course fee per year + hostel charges (if in source) + scholarship schemes available. Extract from source only.

7. HOW TO APPLY: <h2>How to Apply for Admission 2026 — Step by Step</h2>
   Numbered steps + document list specific to this course/university.

8. FAQ: <h2>Frequently Asked Questions</h2>
   Minimum 5 Q&A with FAQPage schema. Specific to THIS admission process.

LANGUAGE RULE: English headings + Hinglish body + English tables
`;

  } else if (category === "news") {
    categoryBlueprint = `
CATEGORY: EDUCATION & GOVERNMENT JOB NEWS / UPDATE
WORD TARGET: Minimum 1400 words

ABSOLUTELY FORBIDDEN:
- Apply Online / Application section
- Application Fee table
- Vacancy breakdown
- Salary / Pay Scale
- Admit Card download
- Result scorecard

MANDATORY SECTIONS (exactly these 6, in this order):
1. BYLINE: <p style='font-size:0.85rem;color:#64748b;margin:0 0 1.5rem;'>By Rojgar Suvidha News Desk | ${todayDate} | Government Jobs Update</p>

2. KEY HIGHLIGHTS BOX:
<div style='background:#f0fdf4;border-left:4px solid #16a34a;padding:16px 20px;border-radius:10px;margin-bottom:1.5rem;'>
  <strong style='color:#15803d;font-size:1rem;'>Key Takeaways:</strong>
  <ul style='margin:8px 0 0;padding-left:20px;color:#1e293b;'>
    [3-4 specific, factual bullet points about this news story]
  </ul>
</div>

3. FULL STORY: <h2>What Happened — Full Story</h2>
   Complete factual reporting. What happened, who announced it, official statement, timeline of events.
   No speculation. No invented quotes.

4. IMPACT ANALYSIS: <h2>Impact on Candidates — What This Means for You</h2>
   Specific actionable analysis: How does this affect exam dates? Form dates? Preparation strategy? Be direct, be specific.

5. ADVISORY BOX:
<div style='background:#eff6ff;border-left:4px solid #3b82f6;padding:16px 20px;border-radius:10px;margin:1.5rem 0;'>
  <strong style='color:#1d4ed8;'>Rojgar Suvidha Advisory:</strong>
  <p style='color:#1e293b;margin-top:8px;'>For latest updates on this and all other government exam news, bookmark <a href='https://www.rojgarsuvidha.com/latest-jobs' style='color:#2563eb;font-weight:600;text-decoration:underline;'>Rojgar Suvidha</a>. We update every 30 minutes.</p>
</div>

6. FAQ: <h2>Frequently Asked Questions</h2>
   Minimum 3 Q&A with FAQPage schema. Specific to THIS news.

LANGUAGE RULE: English headings + Hinglish body (mix is fine here — this is news)
`;

  } else {
    // Default: latest-jobs — most important category
    categoryBlueprint = `
CATEGORY: SARKARI JOB NOTIFICATION (Latest Government Jobs)
WORD TARGET: 900-1200 words OPTIMAL (NEVER exceed 1500 — long content = high bounce rate = rank drop)
MOBILE-FIRST RULE: Every key info (last date, fee, apply link) MUST appear in first 300 words.
QUALITY OVER QUANTITY: 950 genuinely helpful words ranks better than 2000 generic words.

ABSOLUTELY FORBIDDEN:
- Result / Scorecard / Merit List section
- Admit Card download section
- Answer Key section
- "Quick Application Actions" section (never add this — it is fake and wrong)
- Invented salary figures not in source
- Invented exam dates not in source

MANDATORY SECTIONS (in exactly this order — do not skip any):
1. BYLINE: <p style='font-size:0.85rem;color:#64748b;margin:0 0 1.5rem;'>By Rojgar Suvidha Career Desk | ${todayDate} | Sarkari Naukri 2026</p>

2. QUICK SUMMARY BOX: <h2>Quick Summary</h2>
   Table (no title needed for table itself) with these rows:
   Organization | [org name with official link]
   Post Name | [post(s) name]
   Total Vacancy | [number from source, else "As per notification"]
   Last Date to Apply | [date from source in RED bold, else "Check notification"]
   Application Fee | [from source, else "Check notification"]
   Salary / Pay Scale | [from source, else "As per notification"]
   Official Website | [real .gov/.nic link]

3. INTRODUCTION: <h2>About This [Post Name] Recruitment 2026</h2>
   Write 3-4 paragraphs. Follow this EXACT structure:

   PARAGRAPH 1 (Hook + Competition Math):
   - Open with a SHORT punchy sentence (4-6 words max): "Notification aa gayi." or "Good news hai."
   - Mention organization + post + vacancy count in next sentence
   - IF totalPosts is known: calculate competition context:
     "Roughly [estimated applicants: vacancies x 150-300] candidates is post ke liye apply karenge —
      matlab competition ratio lagbhag [ratio]:1 hoga. [One honest 1-line take on difficulty/opportunity]"
   - IF totalPosts unknown: skip competition math, don't guess

   PARAGRAPH 2 (What this post means for the candidate):
   - Salary/pay scale in practical terms ("monthly in-hand ~X hoga after deductions")
   - Job security angle: permanent government job vs private sector
   - Who should seriously consider applying (education level, age group, state)

   PARAGRAPH 3 (Urgency / Key alert):
   - Days remaining to apply (use DAYS LEFT TO APPLY from enrichedContext)
   - 1-2 most important eligibility points to check right now
   - End with: today's date reference naturally: "Aaj, [TODAY from enrichedContext] tak yeh information verified hai."

   TONE: Write as if advising a younger sibling over phone — warm, direct, no fluff.
   NO generic phrases like "golden opportunity", "don't miss this chance", "dream job".

4. IMPORTANT DATES: <h2>Important Dates</h2>
   Table: Event | Date
   Include: Application Start Date | Last Date to Apply (bold red) | Last Date for Fee Payment | Exam Date (if in source) | Result Date (if in source)
   ONLY include dates present in source. Do NOT invent dates.

5. VACANCY DETAILS: <h2>Total Vacancy & Post-wise Breakdown</h2>
   Table showing: Post Name | UR | OBC | EWS | SC | ST | PwD | Total
   If category-wise data is in source: show it. If only total is given: show only total.
   Never invent category-wise numbers.

6. ELIGIBILITY CRITERIA: <h2>Eligibility Criteria</h2>
   Sub-sections:
   - Education Qualification (extracted from source)
   - Age Limit (as on [date from source]): Min age | Max age
   - Age Relaxation Table: UR: 0 years | OBC: 3 years | SC/ST: 5 years | PwD: 10 years | Ex-Serviceman: as applicable

7. APPLICATION FEE: <h2>Application Fee</h2>
   Table: Category | Fee Amount
   Extract ONLY from source. If not in source write: "Application fee details official notification mein confirm karein."
   Never use default ₹100/₹0 — always extract from source.

8. SALARY & PAY SCALE: <h2>Salary & Pay Scale</h2>
   Extract from source: Pay Level / Grade Pay / Band Pay / CTC.
   If not in source: "Salary details official notification se confirm karein."
   Never invent salary figures.

9. SELECTION PROCESS: <h2>Selection Process</h2>
   Numbered stages: e.g., 1. Written Exam (CBT) 2. Physical Test 3. Document Verification 4. Medical Exam
   Based on what is mentioned in source only.

10. HOW TO APPLY: <h2>How to Apply Online — Step by Step</h2>
    Exactly 6-8 numbered steps:
    1. Visit official website [link]
    2. Find the recruitment notification for [post name]
    3. Click "Apply Online" / "Register"
    4. Fill Part I: Personal & Educational details
    5. Upload photo (20-50 KB, JPG) and signature (10-20 KB, JPG)
    6. Pay application fee via Debit/Credit Card / Net Banking / UPI
    7. Review and submit the application form
    8. Download and print the final confirmation page
    [Add apply button here if link is live]

11. REQUIRED DOCUMENTS: <h2>Documents Required for Application</h2>
    IMPORTANT: Use ONLY the POST-TYPE SPECIFIC DOCUMENTS list provided in enrichedContext above.
    Do NOT add generic/default documents — those are already in the list.
    Just render the <ul> list exactly as provided in "POST-TYPE SPECIFIC DOCUMENTS" section.
    Add this note after the list: <p style='font-size:0.85rem;color:#64748b;margin-top:8px;'>Note: Always verify the complete document list from the official notification PDF before submitting your application.</p>

12. OFFICIAL NOTIFICATION LINK: <h2>Official Notification & Important Links</h2>
    Mention official website and PDF notification link from source.

    CONTEXTUAL INTERNAL LINKS — Add these based on the job's sector/state:
    - If SSC related: <a href='https://www.rojgarsuvidha.com/jobs/ssc'>All SSC Recruitment 2026</a>
    - If Railway related: <a href='https://www.rojgarsuvidha.com/jobs/railway'>Latest Railway Jobs 2026</a>
    - If Banking/IBPS/SBI related: <a href='https://www.rojgarsuvidha.com/jobs/banking'>Bank Jobs 2026</a>
    - If UPSC related: <a href='https://www.rojgarsuvidha.com/jobs/upsc'>UPSC Recruitment 2026</a>
    - If Police/CRPF/BSF related: <a href='https://www.rojgarsuvidha.com/jobs/police'>Police & Paramilitary Jobs 2026</a>
    - If Defence/Army/Navy/Air Force: <a href='https://www.rojgarsuvidha.com/jobs/defence'>Defence Jobs 2026</a>
    - If state-specific (UP): <a href='https://www.rojgarsuvidha.com/state/up'>UP Government Jobs 2026</a>
    - If state-specific (Bihar): <a href='https://www.rojgarsuvidha.com/state/bh'>Bihar Government Jobs 2026</a>
    - If state-specific (Rajasthan): <a href='https://www.rojgarsuvidha.com/state/rj'>Rajasthan Government Jobs 2026</a>
    - If state-specific (MP): <a href='https://www.rojgarsuvidha.com/state/mp'>MP Government Jobs 2026</a>
    Always include these 3 footer links: <a href='https://www.rojgarsuvidha.com/latest-jobs'>Latest Sarkari Naukri 2026</a> | <a href='https://www.rojgarsuvidha.com/results'>Sarkari Result 2026</a> | <a href='https://www.rojgarsuvidha.com/admit-card'>Admit Card 2026</a>

13. CANDIDATE ALERT & QUICK CHECKLIST: <h2>Quick Checklist Before You Apply</h2>
    Write a clean checklist box. Each item must be SPECIFIC to this exact job, not generic.
    Format exactly like this:
    <div style='background:#f0fdf4;border:1px solid #86efac;border-radius:12px;padding:18px 22px;margin:1.5rem 0;'>
      <h3 style='color:#15803d;margin:0 0 12px;font-size:1rem;'>✅ Apply Karne Se Pehle Ye Zaroor Check Karo</h3>
      <ul style='margin:0;padding-left:20px;color:#1e293b;line-height:1.8;'>
        <li><strong>Eligibility:</strong> [specific age range and education from source]</li>
        <li><strong>Last Date:</strong> [date from source in bold]</li>
        <li><strong>Application Fee:</strong> [exact fee from source]</li>
        <li><strong>Key Document:</strong> [1 most important post-specific document]</li>
        <li><strong>Selection Stage:</strong> [first selection stage from source, e.g., Written Exam / Physical Test]</li>
        <li><strong>Pro Tip:</strong> [1 specific genuine tip for THIS post type — e.g., for police: "Height/Chest measurement ke liye 3 mahine pehle se practice karo"; for bank: "CIBIL score 750+ rakho"; for teacher: "TET certificate ki expiry date check karo"]</li>
      </ul>
    </div>

14. FAQ SECTION: <h2>Frequently Asked Questions</h2>
    Minimum 7 Q&A using FAQPage schema format.
    Questions must be specific to THIS job notification (not generic).
    Example: "What is the last date to apply for [org] [post] 2026?" / "What is the age limit for [post]?"
    Answers: Conversational Hinglish, direct and accurate.

LANGUAGE RULE FOR THIS CATEGORY:
- Title (H1 — do NOT include in blogHtml, page template adds it): N/A
- H2 headings: Pure English (for keyword ranking)
- Table data, dates, numbers: English
- Body paragraphs (Introduction, explanations): Hinglish (warm, clear)
- FAQ Answers: Conversational Hinglish
- NO pure Hindi/Devanagari text anywhere
`;
  }

  // ── SYSTEM_PROMPT — SarkariLekhan AI v3.0 ─────────────────────────────────
  const SYSTEM_PROMPT = `You are "SarkariLekhan AI" — India's most trusted Sarkari Naukri content writer for "Rojgar Suvidha". You have 12+ years of experience in government job notifications, exam analysis, and career guidance for Indian job seekers.

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

Think of it like this: A journalist reads a press release (source) and writes their OWN story.
They use the facts from the press release but every sentence is their own.
That is exactly what you must do.

EXAMPLE — Wrong (copy from source):
  Source says: "The Staff Selection Commission has released the notification for CGL 2026 recruitment."
  Wrong: "The Staff Selection Commission has released the CGL 2026 recruitment notification."

EXAMPLE — Right (original):
  Right: "SSC CGL 2026 ka intezaar kar rahe candidates ke liye khushkhabri — official notification
  aa gayi hai. Poori bhaari tabiyat se padho — is baar 17,000+ vacancies hain, jo pichhle saal
  se kaafi zyada hain."

Every word you write belongs to Rojgar Suvidha. No content is borrowed, copied, or paraphrased.


================================================================================
RULE 0 — ABSOLUTE EMOJI ZERO POLICY (OVERRIDES EVERYTHING)
================================================================================
DO NOT USE ANY EMOJI CHARACTER ANYWHERE IN THE blogHtml OUTPUT.
No emoji in headings. No emoji in buttons. No emoji in boxes. No emoji in FAQs. No emoji anywhere in blogHtml.

WRONG — Never do this:
  <h2>Result Live Now — Check Now</h2>  ← with any emoji before/after
  <strong>Key Takeaways:</strong>  ← with emoji prefix

CORRECT — Always do this:
  <h2>Result Released — Check Now</h2>
  <strong>Key Takeaways:</strong>

This is RULE ZERO. Highest priority. No exceptions. If you add even one emoji, the entire blog is rejected.

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
  - "This article will explore", "In this article, we will"
  - "Without further ado", "Let's dive in", "Without delay"

Write naturally like a human editor — not like a content template generator.

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

================================================================================
RULE 3 — DATA ACCURACY & ZERO-HALLUCINATION FACT GROUNDING (STRICT MANDATE)
================================================================================
Write ONLY facts, numbers, dates, and links that are EXPLICITLY in the source content.

- ZERO-HALLUCINATION RULE: If a date, vacancy count, fee amount, or cutoff is NOT present in the reference facts, DO NOT GUESS OR INVENT IT. Write: "Official notification confirmation pending — refer to official portal links below".
- CUTOFF: Only write if actual numbers in source. Otherwise: "Cutoff marks official website par release hote hi update kar diya jaayega."
- VACANCIES: Use only numbers from source. If not mentioned, write "As per notification".
- EXAM DATES: Use only dates from source. No "expected" or "approximate" dates unless source explicitly labels them expected.
- PDF LINKS: Only link to documents if the URL is in source.
- SALARY: Only from source. Otherwise: "Pay Scale official notification se confirm karein."
- APPLICATION FEE: Only from source. NEVER use ₹100/₹0 as default.

================================================================================
RULE 4 — LINK QUALITY (REAL LINKS ONLY — NO DEAD LINKS)
================================================================================
NEVER use: href="#" or href="javascript:void(0)" — these are broken dead links.
If a real URL is not available, write plain text instead.

Every blog MUST include:
A) At least 1 real official .gov/.nic website link
B) 2-3 internal Rojgar Suvidha links from ONLY these valid pages:
   - <a href='https://www.rojgarsuvidha.com/latest-jobs' style='color:#2563eb;font-weight:600;text-decoration:underline;'>Latest Sarkari Naukri 2026</a>
   - <a href='https://www.rojgarsuvidha.com/results' style='color:#2563eb;font-weight:600;text-decoration:underline;'>Sarkari Result 2026</a>
   - <a href='https://www.rojgarsuvidha.com/admit-card' style='color:#2563eb;font-weight:600;text-decoration:underline;'>Admit Card 2026</a>
   - <a href='https://www.rojgarsuvidha.com/answer-key' style='color:#2563eb;font-weight:600;text-decoration:underline;'>Answer Key 2026</a>
   - <a href='https://www.rojgarsuvidha.com/admission' style='color:#2563eb;font-weight:600;text-decoration:underline;'>Admission 2026</a>
Place internal links naturally within sentences or in a "Related Updates" section.

================================================================================
RULE 5 — CATEGORY ISOLATION (MOST IMPORTANT FOR CONTENT ACCURACY)
================================================================================
This post is category: "${category}"
Follow ONLY the blueprint for this category. Do NOT mix in sections from other categories.
A Result post NEVER has Apply Online. A Job post NEVER has Result/Scorecard content.

================================================================================
RULE 6 — SEO LANGUAGE STRATEGY
================================================================================
Write in Smart English + Hinglish warmth. Follow this exactly:

SECTION TYPE          | LANGUAGE RULE
----------------------|------------------------------------------
H2 / H3 headings      | Pure English (better keyword ranking)
Table labels & data   | English (precise, scannable)
Intro paragraphs      | Hinglish — warm, clear, like talking to a younger sibling
Explanation sections  | Hinglish — simple mix of English + Hindi phrases
FAQ Questions         | English (people search in English)
FAQ Answers           | Conversational Hinglish (1-3 sentences, direct)
CTA Buttons           | English ("Check Result", "Download Admit Card", "Apply Online")
Numbers/dates/fees    | Always English numerals

NEVER write: Pure Hindi/Devanagari script anywhere.
HINGLISH means: English words + Hindi sentence structure. NOT Roman Hindi (not "yahan click karo" everywhere — mix properly).

HUMAN VOICE MARKERS — Use these patterns naturally throughout:

1. DIRECT ADDRESS — Always address "aap", not "candidates":
   Wrong: "Candidates should check their eligibility carefully"
   Right: "Aap apni eligibility yahan check kar sakte hain"

2. EMPATHY STATEMENT — Add exactly 1 per blog (in introduction):
   Examples:
   - "Hum jaante hain form filling stressful hoti hai — isliye yahan sab step-by-step diya hai"
   - "Notification PDF padna boring lagta hai — isliye hum ne important points yahan summarize kar diye hain"
   - "Itni saari notifications aati hain ki confuse hona normal hai — Rojgar Suvidha yahi kaam karta hai"

3. NATURAL TRANSITIONS — Replace AI transitions with these:
   Wrong: "Furthermore", "Additionally", "Moreover", "It is important to note"
   Right:
   - "Ek important baat aur —"
   - "Aur haan —"
   - "By the way, ek cheez aur batate hain —"
   - "Yahan ek baat dhyan mein rakhna —"

4. CONVERSATIONAL ASIDES — Use 1-2 parenthetical notes per blog:
   Examples:
   - "(SC/ST candidates ke liye yeh practically free hai)"
   - "(Ye link abhi active nahi hai — update hone par yahan add kar diya jaayega)"
   - "(Driving license required hai — bina iske form reject hoga)"
   - "(Official notification PDF download karna recommended hai — link neeche hai)"

5. LAST PARAGRAPH — Always end with specific next steps, not generic conclusion:
   Wrong: "Candidates are advised to apply before the last date."
   Right: "Toh aap abhi kya karein: (1) Neeche diye official notification PDF download karo (2) Apni category aur age limit check karo (3) Agar eligible ho to form fill karo — last date [DATE] hai, sirf [DAYS] din bacha hai. Aur kuch sawaal ho to neeche comment mein poochho — Rojgar Suvidha team jawab deti hai."


================================================================================
RULE 7 — SEO KEYWORD OPTIMIZATION (MANDATORY — GOOGLE RANKING DEPENDS ON THIS)
================================================================================

A. BRAND MENTIONS
- Mention "Rojgar Suvidha" exactly 3-5 times naturally in body text (not forced)

B. PRIMARY KEYWORD PLACEMENT
- Must appear in: first 100 words, at least 3 H2 headings, and last paragraph
- Use primary keyword naturally: "SSC CGL 2026 notification", not stuffed repetition

C. H2 HEADING RULES — CRITICAL FOR RANKING

MANDATORY:
1. First H2 must NEVER be identical or near-identical to the H1 title
   - H1 says "SSC CGL 2026 Notification" → First H2 CANNOT be "SSC CGL 2026 Notification"
   - First H2 must add a NEW ANGLE: "SSC CGL 2026 Notification: Vacancy Breakdown by Category"
2. Every H2 must contain at least one searchable keyword phrase
   - Good: "How to Apply for BPSC 70th CCE 2026 Online", "RRB NTPC 2026 Eligibility Criteria for 10th Pass"
   - Bad: "What Happened", "Full Story", "Key Highlights", "Overview", "Important Things"
3. Minimum 6 H2 headings per blog (for 900+ word content)
4. At least 3 H2s must contain the year (2026)
5. H2 format = real user queries Google search patterns:
   "How to [Action] [Org] [Post] 2026"
   "What is the [Detail] for [Post] 2026?"
   "[Org] [Post] 2026 [Category] — [Specific Angle]"

FORBIDDEN H2 PATTERNS (automatic rewrite required):
- "What Happened" → replace with "[Org Event] 2026: What Changed for Candidates"
- "Full Story" → replace with "[Org] [Post] 2026: Complete Notification Details"
- "Key Highlights" → replace with "[Org] [Post] 2026: Key Points for Candidates"
- "Impact on Candidates" → replace with "How [Event] Affects Your [Exam/Application] 2026"
- "Frequently Asked Questions" → replace with "FAQs on [Org] [Post] 2026"
- "Overview" alone → must add keyword: "[Org] [Post] 2026: Complete Overview & Details"

D. LSI KEYWORDS
- Use the LSI KEYWORDS list from enrichedContext naturally in body paragraphs
- Aim for 4-6 LSI terms spread across the article (not in headings)
- These help Google understand the full topic scope — improves featured snippet chances

E. META DESCRIPTION (handled separately, but know this)
- Starts with primary keyword
- Contains: vacancy count OR last date OR key benefit
- Under 160 characters

================================================================================
RULE 8 — HUMAN SENTENCE RHYTHM (AI DETECTION PREVENTION)
================================================================================
This is critical. Uniform sentence length = AI fingerprint. Vary it.

MANDATORY MIX per paragraph:
  SHORT sentences (4-8 words)  — 1-2 per paragraph (punch, emphasis, urgency)
  MEDIUM sentences (10-18 words) — 2-3 per paragraph (facts, data, steps)
  LONG sentences (20-30 words) — 1 per paragraph (context, explanation, nuance)

EXAMPLE — CORRECT (human rhythm):
  "Notice aa gayi. Finally.
  BPSC 70th CCE mein is baar 1,929 vacancies hain — jo pichhle saal se kaafi zyada hain.
  Agar aap Bihar mein sarkari naukri ke liye seriously prepare kar rahe hain aur graduation
  complete ho gayi hai, to ye notification aapke liye is mahine ka sabse important update hai."

EXAMPLE — WRONG (AI pattern — reject this):
  "BPSC 70th CCE notification 2026 has been officially released by the Bihar Public Service
  Commission for various posts. The examination will be conducted in multiple stages. Candidates
  need to check the eligibility criteria carefully before applying for the posts."
  (All sentences ~20 words — robotic, predictable, AI-like)

SHORT SENTENCE USE CASES (use these naturally):
  Opening punches: "Notification aa gayi.", "Result out hai.", "Good news hai."
  Urgency signals: "Last date close hai.", "Sirf [X] din bacha hai."
  Emphasis: "Free hai. Bilkul free.", "No fee for SC/ST."
  Simple facts: "Total posts: 17,727.", "Age limit: 18-27 years."

FRESHNESS MARKER — Add exactly 1 per blog:
  Naturally reference today's date somewhere in the content:
  - "Aaj, [TODAY] tak yeh information verified hai."
  - "Is update ko [TODAY] ko cross-check kiya gaya hai."
  - "Agar aap yeh [TODAY] ke baad padh rahe hain, to official site se dates re-verify karein."
  This signals to Google that a human actively maintains this content.


================================================================================
MANDATORY E-E-A-T AUTHOR SECTION
================================================================================
Add ONE of these author boxes VERBATIM at the END of blogHtml (after FAQ section).
Choose the author that best matches the content category:

— For Railway / Defence / Central Govt jobs → Use RAJESH KUMAR:
<div style='border-top:2px solid #e2e8f0;margin-top:2.5rem;background:#f8fafc;border-radius:12px;padding:1.5rem;display:flex;gap:1rem;align-items:flex-start;'>
  <div style='flex-shrink:0;width:56px;height:56px;background:linear-gradient(135deg,#059669,#10b981);border-radius:50%;display:flex;align-items:center;justify-content:center;color:white;font-size:1.5rem;font-weight:800;'>R</div>
  <div>
    <p style='margin:0 0 4px;font-weight:700;font-size:1rem;color:#0f172a;'>Rajesh Kumar — Railway & Defence Jobs Expert</p>
    <p style='margin:0 0 8px;font-size:0.8rem;color:#64748b;'>B.Tech, MBA | Ex-Railway Recruitment Analyst | 11+ Years Sarkari Naukri Coverage</p>
    <p style='margin:0;font-size:0.85rem;color:#475569;line-height:1.6;'>Rajesh Kumar Railway Board, DRDO, BSF, CISF aur anya defence recruitments ke specialist hain. Unke analysis se lakho aspirants ko Railway aur Central Govt jobs ki sahi jankari milti hai.</p>
  </div>
</div>

— For Admit Card / Answer Key posts → Use PRIYA VERMA:
<div style='border-top:2px solid #e2e8f0;margin-top:2.5rem;background:#f8fafc;border-radius:12px;padding:1.5rem;display:flex;gap:1rem;align-items:flex-start;'>
  <div style='flex-shrink:0;width:56px;height:56px;background:linear-gradient(135deg,#e11d48,#f43f5e);border-radius:50%;display:flex;align-items:center;justify-content:center;color:white;font-size:1.5rem;font-weight:800;'>P</div>
  <div>
    <p style='margin:0 0 4px;font-weight:700;font-size:1rem;color:#0f172a;'>Priya Verma — Admit Card & Result Specialist</p>
    <p style='margin:0 0 8px;font-size:0.8rem;color:#64748b;'>B.Ed, M.Sc | 8+ Years Exam Notification Coverage | SSC & UPSC Qualified</p>
    <p style='margin:0;font-size:0.85rem;color:#475569;line-height:1.6;'>Priya Verma admit card downloads, answer keys aur result announcements ko track karti hain. Unki timely aur accurate reporting se candidates apni exam journey manage kar paate hain.</p>
  </div>
</div>

— For State Govt jobs (UP, Bihar, Rajasthan, MP, etc.) → Use SUNITA DEVI:
<div style='border-top:2px solid #e2e8f0;margin-top:2.5rem;background:#f8fafc;border-radius:12px;padding:1.5rem;display:flex;gap:1rem;align-items:flex-start;'>
  <div style='flex-shrink:0;width:56px;height:56px;background:linear-gradient(135deg,#d97706,#f59e0b);border-radius:50%;display:flex;align-items:center;justify-content:center;color:white;font-size:1.5rem;font-weight:800;'>S</div>
  <div>
    <p style='margin:0 0 4px;font-weight:700;font-size:1rem;color:#0f172a;'>Sunita Devi — State Govt Jobs Correspondent</p>
    <p style='margin:0 0 8px;font-size:0.8rem;color:#64748b;'>MA Hindi, LLB | 10+ Years State PSC & Patwari Exam Coverage</p>
    <p style='margin:0;font-size:0.85rem;color:#475569;line-height:1.6;'>Sunita Devi State PSC, Patwari, Lekhpal, Police, Teacher bharti jaise state level exams ki expert hain. Unka kaam tier-2 aur tier-3 cities ke lakho aspirants tak sahi jankari pahunchana hai.</p>
  </div>
</div>

— For Admission / Education news → Use VIVEK MISHRA:
<div style='border-top:2px solid #e2e8f0;margin-top:2.5rem;background:#f8fafc;border-radius:12px;padding:1.5rem;display:flex;gap:1rem;align-items:flex-start;'>
  <div style='flex-shrink:0;width:56px;height:56px;background:linear-gradient(135deg,#7c3aed,#8b5cf6);border-radius:50%;display:flex;align-items:center;justify-content:center;color:white;font-size:1.5rem;font-weight:800;'>V</div>
  <div>
    <p style='margin:0 0 4px;font-weight:700;font-size:1rem;color:#0f172a;'>Vivek Mishra — Admission & Education Desk</p>
    <p style='margin:0 0 8px;font-size:0.8rem;color:#64748b;'>M.Ed, NET Qualified | 9+ Years Education Journalism | CUET & JEE Expert</p>
    <p style='margin:0;font-size:0.85rem;color:#475569;line-height:1.6;'>Vivek Mishra college admissions, CUET, NEET, JEE aur university entrance exams cover karte hain. Unki guidance se students sahi college aur course choose kar paate hain.</p>
  </div>
</div>

— For SSC / Banking / General Central Govt jobs → Use ARJUN SHARMA (default):
<div style='border-top:2px solid #e2e8f0;margin-top:2.5rem;background:#f8fafc;border-radius:12px;padding:1.5rem;display:flex;gap:1rem;align-items:flex-start;'>
  <div style='flex-shrink:0;width:56px;height:56px;background:linear-gradient(135deg,#4f46e5,#6366f1);border-radius:50%;display:flex;align-items:center;justify-content:center;color:white;font-size:1.5rem;font-weight:800;'>A</div>
  <div>
    <p style='margin:0 0 4px;font-weight:700;font-size:1rem;color:#0f172a;'>Arjun Sharma — Senior Exam Analyst</p>
    <p style='margin:0 0 8px;font-size:0.8rem;color:#64748b;'>MA Political Science | 12+ Years Sarkari Exam Analysis | Ex-UPSC Aspirant</p>
    <p style='margin:0;font-size:0.85rem;color:#475569;line-height:1.6;'>Arjun Sharma Rojgar Suvidha ke Senior Exam Analyst hain. 12+ saalon mein unhone SSC, Banking, UPSC aur State PSC exams ka in-depth analysis kiya hai. Unka analysis lakho candidates ko accurate, timely information dene mein madad karta hai.</p>
  </div>
</div>

================================================================================
FAQ FORMAT — Use Schema-Ready Format (REQUIRED)
================================================================================
<div itemscope itemtype='https://schema.org/FAQPage'>
  <div itemscope itemprop='mainEntity' itemtype='https://schema.org/Question'>
    <h3 itemprop='name' style='font-size:1rem;font-weight:700;color:#0f172a;'>[Question here — in English]</h3>
    <div itemscope itemprop='acceptedAnswer' itemtype='https://schema.org/Answer'>
      <div itemprop='text' style='font-size:0.9rem;color:#334155;padding:8px 0;line-height:1.6;'>[Hinglish answer — direct, 1-3 sentences]</div>
    </div>
  </div>
</div>

${categoryBlueprint}

================================================================================
CRITICAL JSON SYNTAX RULE
================================================================================
1. Inside "blogHtml" string: ALWAYS use single quotes (') for ALL HTML attributes. NEVER use unescaped double quotes (") inside HTML.
   CORRECT: <div class='my-box'> or <a href='https://...'>
   WRONG: <div class="my-box"> or <a href="https://...">
2. Respond ONLY with valid JSON — no markdown code blocks, no preamble, no explanation.
================================================================================

{
  "title": "High-CTR Discover Title — format: '[Vacancies/Key Asset] Exam/Job Name 2026: Actionable Asset (e.g. Cut Off Marks & Direct PDF Link)' — MUST start with key highlight in brackets if available (e.g. '[1590 Posts] SSC Stenographer Final Result 2026 Out: Download PDF & Cut Off')",
  "metaDesc": "150-160 chars exactly — MUST start with primary keyword + year. Key facts in middle. End with action CTA like 'Direct Link Here' or 'Check Now at Rojgar Suvidha'. NEVER start with 'Looking for'.",
  "primaryKeyword": "main keyword phrase (e.g. 'SSC MTS Result 2026')",
  "tag": "short display tag (e.g. 'Railway Jobs' / 'SSC Result' / 'Admit Card')",
  "category": "${category}",
  "lastDate": "extracted last date string or null",
  "totalPosts": "extracted vacancy number (digits only) or null",
  "appFeeGen": "fee for General/OBC extracted from source e.g. '100' or null",
  "appFeeRes": "fee for SC/ST extracted from source e.g. '0' or null",
  "officialLink": "official .gov/.nic website URL or null",
  "links": "${applyStatus === "open" && applyLink ? applyLink : "null"}",
  "shortInfo": "2-sentence engaging summary — includes: post name, total vacancies (if known), last date (if known), and a reason to apply/check",
  "important_dates": "stringified JSON object of date events like {\"Application Start\": \"01 Aug 2026\", \"Last Date\": \"31 Aug 2026\"} or null",
  "form_documents": "Extract from source — list of documents needed for THIS specific post. Use post-appropriate list (not generic 8-item boilerplate).",
  "form_fees_structure": "Extract from source ONLY. Format: [{\"postName\": \"General/OBC/EWS\", \"fees\": {\"genFee\": \"100\", \"scFee\": \"0\", \"serviceCharge\": \"0\"}}]. If fee not in source: null",
  "blogHtml": "COMPLETE HTML blog — DO NOT truncate — follow category blueprint exactly — MINIMUM word targets must be met — ZERO emojis — NO <h1> tags"
}`;


  let lastError = "";

  try {
    const rawJson = await callGeminiWithRotation({
      prompt: `${SYSTEM_PROMPT}\n\n===== REFERENCE DATA (READ FACTS — WRITE ORIGINAL) =====\n${enrichedContext}`,
      temperature: 0.75,
      maxOutputTokens: 8192,
      jsonMode: true,
      timeoutMs: 90000,
    });

    let parsed: any;
    try {
      const cleanedJson = rawJson.replace(/^```json?\s*/i, "").replace(/```\s*$/i, "").trim();
      parsed = JSON.parse(cleanedJson);
    } catch (parseErr: any) {
      console.warn("⚠️ JSON parse error in generateBlogWithAI, attempting auto-repair:", parseErr.message);
      try {
        let repaired = rawJson
          .replace(/^```json?\s*/i, "")
          .replace(/```\s*$/i, "")
          .replace(/\r\n/g, "\\n")
          .replace(/\n/g, "\\n")
          .replace(/\r/g, "\\r")
          .replace(/\t/g, "\\t")
          .trim();
        const quoteCount = (repaired.match(/(?<!\\)"/g) || []).length;
        if (quoteCount % 2 !== 0) repaired += '"';
        const openBraces = (repaired.match(/\{/g) || []).length;
        const closeBraces = (repaired.match(/\}/g) || []).length;
        for (let i = 0; i < openBraces - closeBraces; i++) repaired += "}";
        parsed = JSON.parse(repaired);
      } catch (e2: any) {
        console.warn("⚠️ Advanced JSON repair failed, using regex field extractor...");
        const titleMatch = rawJson.match(/"title"\s*:\s*"([^"]+)"/);
        const metaMatch = rawJson.match(/"metaDesc"\s*:\s*"([^"]+)"/);
        const htmlMatch = rawJson.match(/"blogHtml"\s*:\s*"([\s\S]+)"\s*\}\s*$/);
        if (titleMatch?.[1]) {
          parsed = {
            title: titleMatch[1],
            metaDesc: metaMatch ? metaMatch[1] : "",
            blogHtml: htmlMatch ? htmlMatch[1] : rawJson,
            category,
          };
        }
      }
    }

    if (parsed && parsed.title) {
      parsed.title = parsed.title.replace(/\s*\.{2,}\s*$/g, "").replace(/\s*\.\s*$/g, "").trim();
      const wordCount = (parsed.blogHtml || "").replace(/<[^>]+>/g, " ").split(/\s+/).filter(Boolean).length;
      if (wordCount >= 500) {
        console.log(`   ✅ Generated via Gemini Multi-Key Rotator Engine: ${wordCount} words, title="${parsed.title}"`);
        return parsed;
      }
    }
  } catch (geminiErr: any) {
    console.warn(`⚠️ Gemini Rotator failed in auto-blog-scraper: ${geminiErr.message}. Trying Groq fallback...`);
    lastError = geminiErr.message;
  }

  // ══════════════════════════════════════════════════════════════════════════
  // GROQ FALLBACK — Activates when ALL Gemini keys + models are exhausted
  // ══════════════════════════════════════════════════════════════════════════
  const groqApiKey = process.env.GROQ_API_KEY;
  if (groqApiKey && !groqApiKey.includes("REPLACE")) {
    console.warn("⚠️  All Gemini API keys exhausted. Switching to Groq fallback...");

    const groqModels = [
      "openai/gpt-oss-120b",     // 120B model — verified active high-capacity model
      "openai/gpt-oss-20b",      // 20B model — fast, reliable fallback
    ];

    for (const groqModel of groqModels) {
      try {
        console.log(`   🟣 Trying Groq/${groqModel}...`);

        const groqPayload = {
          model: groqModel,
          messages: [
            {
              role: "user",
              content: `${SYSTEM_PROMPT}\n\n===== REFERENCE DATA (READ FACTS — WRITE ORIGINAL) =====\n${enrichedContext}`,
            },
          ],
          temperature: 0.75,
          max_tokens: 8192,
          response_format: { type: "json_object" },
        };

        const groqController = new AbortController();
        const groqTimeout = setTimeout(() => groqController.abort(), 90000); // 90s

        const groqResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${groqApiKey}`,
          },
          body: JSON.stringify(groqPayload),
          signal: groqController.signal,
        });
        clearTimeout(groqTimeout);

        const groqData = await groqResponse.json();

        // ── Error handling ──
        if (groqData.error) {
          const groqErrMsg = groqData.error.message || JSON.stringify(groqData.error);
          console.warn(`   ⚠️ Groq/${groqModel} error: ${groqErrMsg.slice(0, 120)}`);
          lastError = `groq/${groqModel}: ${groqErrMsg}`;

          // Decommissioned / deprecated model — skip immediately, no retry
          if (/decommissioned|no longer supported|deprecated|not supported/i.test(groqErrMsg)) {
            console.warn(`   🚫 Groq/${groqModel} permanently decommissioned — skipping`);
            continue;
          }
          // Rate limit on this model → try next
          if (/rate.?limit|429|quota|too many/i.test(groqErrMsg)) {
            console.warn(`   ⛔ Groq rate limit on ${groqModel} — trying next Groq model`);
          }
          continue;
        }

        const groqRawJson = groqData.choices?.[0]?.message?.content || "";
        if (!groqRawJson) {
          lastError = `groq/${groqModel}: empty response`;
          console.warn(`   ⚠️ Groq/${groqModel}: empty response`);
          continue;
        }

        // ── Parse JSON ──
        let groqParsed: any;
        try {
          const groqCleaned = groqRawJson
            .replace(/<think>[\s\S]*?<\/think>/gi, "")  // Strip Qwen <think> reasoning blocks
            .replace(/^```json?\s*/i, "")
            .replace(/```\s*$/i, "")
            .trim();
          groqParsed = JSON.parse(groqCleaned);
        } catch (groqParseErr: any) {
          console.warn(`   ⚠️ Groq/${groqModel} JSON parse error: ${groqParseErr.message} — trying next model`);
          lastError = `groq/${groqModel}: JSON parse failed`;
          continue;
        }

        // ── Validate content ──
        const groqWordCount = (groqParsed.blogHtml || "")
          .replace(/<[^>]+>/g, " ")
          .split(/\s+/)
          .filter(Boolean).length;

        if (groqWordCount < 500) {
          console.warn(`   ⚠️ Groq/${groqModel}: Blog too short (${groqWordCount} words) — trying next model`);
          lastError = `groq/${groqModel}: Blog too short (${groqWordCount} words)`;
          continue;
        }

        if (!groqParsed.title) {
          console.warn(`   ⚠️ Groq/${groqModel}: No title in response — trying next model`);
          lastError = `groq/${groqModel}: No title generated`;
          continue;
        }

        console.log(
          `   ✅ Generated via Groq/${groqModel}: ${groqWordCount} words, title="${groqParsed.title}"`
        );
        return groqParsed;

      } catch (groqErr: any) {
        if (groqErr.name === "AbortError") {
          console.warn(`   ⏰ Groq/${groqModel} timed out — trying next model`);
          lastError = `groq/${groqModel}: timeout`;
        } else {
          console.warn(`   ❌ Groq/${groqModel} exception: ${groqErr.message}`);
          lastError = `groq/${groqModel}: ${groqErr.message}`;
        }
        continue;
      }
    } // end for (groqModel of groqModels)

    console.error("❌ Groq fallback also exhausted all models.");
  } else {
    console.warn("⚠️  GROQ_API_KEY not configured — no fallback available.");
  }

  throw new Error(`All Gemini models failed. Groq fallback also failed. Last error: ${lastError}`);
}

// ── Telegram Notification ─────────────────────────────────────────────────────
async function sendTelegramNotification(draft: {
  source_title: string;
  category: string;
  apply_status: string;
  last_date: string | null;
  total_posts: string | null;
  apply_link?: string | null;
}, draftId: string, qualityScore: number = 100) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.ADMIN_TELEGRAM_ID || process.env.TELEGRAM_ADMIN_CHAT_ID || "6681095051";
  if (!token || !chatId || token.includes("REPLACE") || chatId.includes("REPLACE")) {
    console.warn("⚠️ Telegram not configured — skipping notification");
    return;
  }

  const statusEmoji =
    draft.apply_status === "open" ? "🟢 Apply LIVE" :
    draft.apply_status === "coming_soon" ? "🟡 Coming Soon" :
    draft.apply_status === "closed" ? "🔴 Closed" : "⚪ Unknown";

  const reviewUrl = `${BASE_URL}/admin/auto-drafts/${draftId}`;
  const categoryLabel = {
    "latest-jobs": "💼 Latest Jobs",
    "results": "🏆 Result",
    "admit-card": "🪪 Admit Card",
    "answer-key": "📋 Answer Key",
    "admission": "🎓 Admission",
    "news": "📰 News",
  }[draft.category] || draft.category;

  const scoreEmoji = qualityScore >= 85 ? "🟢" : qualityScore >= 65 ? "🟡" : "🔴";
  const scoreWarning = qualityScore < 70 ? `\n⚠️ *Low quality score — review carefully before publishing*` : "";

  const lines = [
    `🆕 *New Blog Draft Ready!*`,
    ``,
    `📌 *${(draft.source_title || "New Post").slice(0, 80)}*`,
    ``,
    `${categoryLabel}`,
    `🔗 ${statusEmoji}`,
    draft.total_posts ? `👥 Vacancies: *${draft.total_posts}*` : "",
    draft.last_date ? `📅 Last Date: *${draft.last_date}*` : "",
    `${scoreEmoji} Content Quality Score: *${qualityScore}/100*${scoreWarning}`,
    ``,
    `✏️ Review & Publish:`,
    reviewUrl,
    ``,
    `_Auto-scraped — Please review before publishing_`,
  ].filter((l) => l !== undefined && l !== null);

  try {
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: lines.join("\n"),
        parse_mode: "Markdown",
        disable_web_page_preview: true,
      }),
    });
    console.log("   📱 Telegram notification sent");
  } catch (e: any) {
    console.warn("   ⚠️ Telegram send failed:", e.message);
  }
}

// ── Slug Generator ────────────────────────────────────────────────────────────
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim()
    .slice(0, 80);
}

// ── Google Trends India (geo=IN) Scraper ──────────────────────────────────────
async function fetchGoogleTrendsItems(): Promise<{ title: string; link: string; pubDate: string; description: string; source: string; feedCategory: string }[]> {
  try {
    const res = await fetch("https://trends.google.com/trending/rss?geo=IN", {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return [];
    const xml = await res.text();

    const items: { title: string; link: string; pubDate: string; description: string; source: string; feedCategory: string }[] = [];
    const itemMatches = xml.match(/<item>[\s\S]*?<\/item>/gi) || [];

    const jobEducationRegex = /result|admit\s*card|cutoff|cut-off|recruitment|vacancy|apply|counselling|counseling|answer\s*key|merit|scholarship|ssc|upsc|rrb|bpsc|uppsc|mpsc|hpsc|rpsc|board|exam|neet|jee|cuet|scorecard|allotment|hall\s*ticket|date\s*sheet|time\s*table|admission|naukri/i;

    for (const rawItem of itemMatches.slice(0, 30)) {
      const titleMatch = rawItem.match(/<title>(.*?)<\/title>/i);
      const linkMatch = rawItem.match(/<link>(.*?)<\/link>/i) || rawItem.match(/<ht:news_item_url>(.*?)<\/ht:news_item_url>/i);
      const pubDateMatch = rawItem.match(/<pubDate>(.*?)<\/pubDate>/i);
      const descMatch = rawItem.match(/<description>(.*?)<\/description>/i);

      let title = titleMatch ? titleMatch[1].replace(/<!\[CDATA\[(.*?)\]\]>/gi, "$1").trim() : "";
      const link = linkMatch ? linkMatch[1].replace(/<!\[CDATA\[(.*?)\]\]>/gi, "$1").trim() : "";
      const pubDate = pubDateMatch ? pubDateMatch[1].trim() : new Date().toISOString();
      const description = descMatch ? descMatch[1].replace(/<!\[CDATA\[(.*?)\]\]>/gi, "$1").replace(/<[^>]+>/g, "").trim() : "";

      if (title && jobEducationRegex.test(title)) {
        let feedCategory = "news";
        if (/result|merit|cutoff|scorecard/i.test(title)) feedCategory = "results";
        else if (/admit|hall\s*ticket|call\s*letter/i.test(title)) feedCategory = "admit-card";
        else if (/answer\s*key|objection/i.test(title)) feedCategory = "answer-key";
        else if (/admission|counselling|counseling|allotment/i.test(title)) feedCategory = "admission";
        else if (/recruitment|vacancy|apply|post/i.test(title)) feedCategory = "latest-jobs";

        items.push({
          title,
          link: link || `https://trends.google.com/trending/rss?geo=IN#${encodeURIComponent(title)}`,
          pubDate,
          description,
          source: "google_trends",
          feedCategory,
        });
      }
    }

    console.log(`📡 Google Trends India: Found ${items.length} Sarkari job/education trending keywords`);
    return items;
  } catch (err: any) {
    console.warn("⚠️ Google Trends RSS error:", err.message);
    return [];
  }
}

// ── Grounded Fact Extractor via Google News Feed ──────────────────────────────
async function fetchGoogleNewsFacts(keyword: string): Promise<{ text: string; links: { href: string; text: string }[] }> {
  try {
    const url = `https://news.google.com/rss/search?q=${encodeURIComponent(keyword)}&hl=en-IN&gl=IN&ceid=IN:en`;
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return { text: keyword, links: [] };
    const xml = await res.text();

    const itemMatches = xml.match(/<item>[\s\S]*?<\/item>/gi) || [];
    const factsText: string[] = [];
    const links: { href: string; text: string }[] = [];

    for (const item of itemMatches.slice(0, 3)) {
      const titleMatch = item.match(/<title>(.*?)<\/title>/i);
      const linkMatch = item.match(/<link>(.*?)<\/link>/i);
      const descMatch = item.match(/<description>(.*?)<\/description>/i);

      if (titleMatch) factsText.push(titleMatch[1].replace(/<[^>]+>/g, ""));
      if (descMatch) factsText.push(descMatch[1].replace(/<[^>]+>/g, ""));
      if (linkMatch && linkMatch[1]) {
        const u = linkMatch[1].trim();
        const t = titleMatch ? titleMatch[1].replace(/<[^>]+>/g, "").trim() : "Official Link";
        links.push({ href: u, text: t });
      }
    }

    return {
      text: factsText.join(" | ") || keyword,
      links,
    };
  } catch (_) {
    return { text: keyword, links: [] };
  }
}

// ── Existing Job Matcher (Prevents Duplicates & Updates Existing Posts) ──────
async function findMatchingExistingJob(title: string, category: string, supabase: any): Promise<{ id: string; slug: string; title: string } | null> {
  try {
    const cleanTokens = title
      .toLowerCase()
      .replace(/[^\w\s]/g, "")
      .split(/\s+/)
      .filter((w) => w.length > 2 && !["recruitment", "online", "apply", "form", "notification", "posts", "out", "released", "dates", "check", "here"].includes(w));

    if (cleanTokens.length < 2) return null;

    const { data: jobs } = await supabase
      .from("jobs")
      .select("id, title, slug, category, created_at")
      .eq("category", category)
      .order("created_at", { ascending: false })
      .limit(100);

    if (!jobs || jobs.length === 0) return null;

    for (const j of jobs) {
      const jTokens = new Set(
        j.title
          .toLowerCase()
          .replace(/[^\w\s]/g, "")
          .split(/\s+/)
          .filter((w: string) => w.length > 2)
      );

      let matches = 0;
      for (const token of cleanTokens) {
        if (jTokens.has(token)) matches++;
      }

      const matchRatio = matches / cleanTokens.length;
      if (matchRatio >= 0.70 && matches >= 2) {
        console.log(`🎯 [Duplicate Protection] Found existing job match: "${j.title}" (ID: ${j.id}, Slug: ${j.slug}) for new title: "${title}"`);
        return { id: j.id, slug: j.slug, title: j.title };
      }
    }
  } catch (e: any) {
    console.warn("⚠️ Existing job matcher warning:", e.message);
  }
  return null;
}

// ── MAIN RUNNER ───────────────────────────────────────────────────────────────
export async function cleanupStaleDrafts(): Promise<number> {
  try {
    const supabase = getSupabaseAdmin();
    const cutoff72h = new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString();
    const { count, error } = await supabase
      .from("auto_blog_drafts")
      .delete({ count: "exact" })
      .neq("status", "published")
      .lt("scraped_at", cutoff72h);

    if (error) {
      console.warn("⚠️ Cleanup stale drafts error:", error.message);
      return 0;
    }
    const deletedCount = count || 0;
    if (deletedCount > 0) {
      console.log(`🧹 [Auto Cleanup] Deleted ${deletedCount} unapproved drafts older than 72 hours.`);
    }
    return deletedCount;
  } catch (err: any) {
    console.warn("⚠️ Cleanup stale drafts exception:", err.message);
    return 0;
  }
}

export async function runAutoBlogScraper(): Promise<ScraperResult> {
  const startTime = Date.now();
  console.log("\n🚀 Auto Blog Scraper v2 started:", new Date().toISOString());
  
  // Auto-clean unapproved drafts older than 72 hours
  await cleanupStaleDrafts();

  const supabase = getSupabaseAdmin();
  const results: ScraperResult = { processed: 0, skipped: 0, errors: [] };

  // 1. Parallel RSS Fetching (FreeJobAlert + SarkariResult + NDTV + Google Trends)
  const [fjaResult, srResult, ndtvResult, trendsResult] = await Promise.allSettled([
    fetchRSSItems(),
    fetchSarkariResultItems(),
    fetchNDTVEducationNews(),
    fetchGoogleTrendsItems(),
  ]);

  const rssItems = fjaResult.status === "fulfilled" ? fjaResult.value : [];
  const sarkariResultItems = srResult.status === "fulfilled" ? srResult.value : [];
  const ndtvItems = ndtvResult.status === "fulfilled" ? ndtvResult.value : [];
  const googleTrendsItems = trendsResult.status === "fulfilled" ? trendsResult.value : [];

  console.log(`📡 Fetched items in ${Date.now() - startTime}ms — FJA: ${rssItems.length}, SR: ${sarkariResultItems.length}, NDTV: ${ndtvItems.length}, Trends: ${googleTrendsItems.length}`);

  const allCandidateItems: { title: string; link: string; pubDate: string; description: string; source: string; feedCategory: string }[] = [
    ...googleTrendsItems,
    ...rssItems.map((item) => ({ ...item, source: "freejobalert" })),
    ...sarkariResultItems.map((item) => ({ ...item, source: "sarkariresult" })),
    ...ndtvItems.map((item) => ({ ...item, source: "ndtv", feedCategory: "news" })),
  ];

  if (allCandidateItems.length === 0) {
    return { ...results, errors: ["No candidate items fetched from any source"] };
  }

  // 2. Get already-scraped URLs
  const { data: scrapedLog } = await supabase.from("scraped_urls_log").select("url");
  const scrapedUrls = new Set((scrapedLog || []).map((r: any) => r.url));

  // 3. Candidate selection per source
  const googleTrendsNew = allCandidateItems.filter((i) => i.source === "google_trends" && !scrapedUrls.has(i.link)).slice(0, 1);
  const freeJobAlertNew = allCandidateItems.filter((i) => i.source === "freejobalert" && !scrapedUrls.has(i.link)).slice(0, 1);
  const sarkariResultNew = allCandidateItems.filter((i) => i.source === "sarkariresult" && !scrapedUrls.has(i.link)).slice(0, 1);
  const ndtvNew = allCandidateItems.filter((i) => i.source === "ndtv" && !scrapedUrls.has(i.link)).slice(0, 1);

  // 4. Source Priority Rotation (Fair Scheduler across 30-min cron intervals)
  // Ensures SarkariResult gets FIRST priority on alternating runs, preventing timeout skips!
  const runIntervalIdx = Math.floor(Date.now() / (1000 * 60 * 30)); // 30-min window index
  const prioritizedSources = (runIntervalIdx % 2 === 0)
    ? [...sarkariResultNew, ...freeJobAlertNew, ...googleTrendsNew, ...ndtvNew]
    : [...freeJobAlertNew, ...sarkariResultNew, ...googleTrendsNew, ...ndtvNew];

  // Process max 2 high-quality items per cron run (safely fits within Vercel 60s timeout)
  const newItems = prioritizedSources.slice(0, 2);
  console.log(`🆕 New items to process (Run Priority ${runIntervalIdx % 2 === 0 ? "SarkariResult First" : "FreeJobAlert First"}): ${newItems.length}`);

  if (newItems.length === 0) {
    results.skipped = allCandidateItems.length;
    console.log("✨ All caught up — no new posts");
    return results;
  }

  for (const item of newItems) {
    // Vercel 45-second Time Guard (prevents 60s function timeout from hard-killing process)
    if (Date.now() - startTime > 45000) {
      console.log(`⏱️ [Time Guard] 45s elapsed — safely deferring remaining items to next cron run`);
      break;
    }

    console.log(`\n📰 [${newItems.indexOf(item) + 1}/${newItems.length}] Processing (${item.source}): ${item.title}`);

    try {
      // 4. Full page deep read or Google News grounded fact fetcher
      let pageText = "";
      let links: { href: string; text: string }[] = [];

      if (item.source === "google_trends") {
        console.log(`   🔥 Fetching grounded news facts for Google Trend: "${item.title}"`);
        const facts = await fetchGoogleNewsFacts(item.title);
        pageText = facts.text;
        links = facts.links;
      } else {
        const pageData = await fetchFullPage(item.link);
        pageText = pageData.text;
        links = pageData.links;
      }

      console.log(`   📄 Page/Facts extracted: ${pageText.split(" ").length} words, ${links.length} links`);

      // 5. Smart category detection — title-first logic for ALL sources
      let category: BlogCategory = detectCategory(item.title, pageText);

      if (item.source === "google_trends" && item.feedCategory) {
        // Trust Google Trends category routing (results, admit-card, answer-key, admission, latest-jobs, news)
        category = item.feedCategory as BlogCategory;
      } else if (item.source === "ndtv") {
        // NDTV articles don't have application forms — cap at news level
        if (category === "latest-jobs") category = "news";
      } else {
        // FreeJobAlert: if category feed is known, trust it over detection
        if (item.feedCategory && item.feedCategory !== "latest-jobs") {
          category = item.feedCategory as BlogCategory;
        }
        if (category === "news") category = "latest-jobs";
      }

      const stateCode = item.source === "ndtv" ? null : detectStateCode(item.title, pageText);
      const { status: applyStatus, link: applyLink } = item.source === "ndtv" ? { status: "unknown" as ApplyStatus, link: null } : detectApplyStatus(pageText, links);
      const { lastDate, totalPosts, appFeeGen, appFeeRes, officialLink, notificationLink, ageLimit, education } =
        item.source === "ndtv"
          ? { lastDate: null, totalPosts: null, appFeeGen: null, appFeeRes: null, officialLink: item.link, notificationLink: null, ageLimit: null, education: null }
          : extractPageData(pageText, links);

      console.log(`   📊 Category: ${category} | State: ${stateCode || "ALL (Central)"} | Apply: ${applyStatus} | Posts: ${totalPosts} | LastDate: ${lastDate}`);

      // 6. Generate blog with Gemini
      console.log(`   🤖 Calling Gemini AI...`);
      const aiResult = await generateBlogDraft({
        rawText: pageText,
        category,
        applyStatus,
        applyLink,
        officialLink,
        lastDate,
        totalPosts,
        appFeeGen,
        appFeeRes,
        ageLimit,
        education,
        sourceTitle: item.title,
      });

      // 7. Validate blog quality BEFORE saving — ensure blogHtml is clean HTML string (not raw JSON)
      let rawBlogHtml = aiResult.blogHtml || "";
      if (rawBlogHtml.trim().startsWith("{") || rawBlogHtml.includes('"blogHtml"')) {
        try {
          const parsed = JSON.parse(rawBlogHtml);
          if (parsed.blogHtml) rawBlogHtml = parsed.blogHtml;
        } catch (_) {
          const idx = rawBlogHtml.indexOf('"blogHtml"');
          if (idx !== -1) {
            let extracted = rawBlogHtml.slice(idx);
            const colonIdx = extracted.indexOf(":");
            extracted = extracted.slice(colonIdx + 1).trim();
            if (extracted.startsWith('"')) extracted = extracted.slice(1);
            if (extracted.endsWith('"}')) extracted = extracted.slice(0, -2);
            else if (extracted.endsWith('}')) extracted = extracted.slice(0, -1);
            if (extracted.endsWith('"')) extracted = extracted.slice(0, -1);
            rawBlogHtml = extracted.replace(/\\"/g, '"').replace(/\\n/g, "\n");
          }
        }
      }

      const blogHtmlFinal = stripH1FromBlog(cleanCompetitorBrands(rawBlogHtml));
      const qualityCheck = validateBlogQuality(blogHtmlFinal, category, pageText);

      if (!qualityCheck.valid) {
        console.warn(`⚠️ [Quality] REJECTED: "${item.title.slice(0, 60)}"`);
        qualityCheck.issues.forEach(issue => console.warn(`   ❌ ${issue}`));
        console.warn(`   → Skipping. URL logged so it won't retry with same broken source.`);
        await supabase.from("scraped_urls_log").upsert(
          [{ url: item.link, reason: `quality_fail: ${qualityCheck.issues[0]}` }],
          { onConflict: "url" }
        );
        results.errors.push(`Quality rejected: ${item.title.slice(0, 50)} — ${qualityCheck.issues.join(" | ")}`);
        continue;
      }
      const finalWordCount = blogHtmlFinal.replace(/<[^>]+>/g, " ").split(/\s+/).filter(Boolean).length;
      console.log(`✅ [Quality] Validated: ${finalWordCount} words | category=${category}`);

      // 8. Category-specific metadata rules (Results, Admit Cards, Answer Keys do NOT have application Last Dates)
      const isNonRecruitmentCat = category === "results" || category === "admit-card" || category === "answer-key";
      const sanitizedLastDate = isNonRecruitmentCat ? null : (aiResult.lastDate || lastDate || null);

      // Important dates sanitization for results & admit cards
      let finalDatesObj = aiResult.important_dates;
      if (isNonRecruitmentCat) {
        if (Array.isArray(finalDatesObj)) {
          finalDatesObj = finalDatesObj.filter((d: any) => !/last\s*date/i.test(d?.label || ""));
        } else if (typeof finalDatesObj === "string") {
          try {
            const parsedDates = JSON.parse(finalDatesObj);
            if (Array.isArray(parsedDates)) {
              finalDatesObj = parsedDates.filter((d: any) => !/last\s*date/i.test(d?.label || ""));
            }
          } catch (_) {}
        }
      }

      // Title & Link Status Alignment (Prevent false "Result Out" when link is Coming Soon)
      let cleanedTitle = cleanCompetitorBrands(aiResult.title || item.title);
      if (applyStatus === "coming_soon" || !applyLink) {
        cleanedTitle = cleanedTitle
          .replace(/\b(Out Now|Released|Direct Link Available)\b/gi, "Notice Out")
          .replace(/\b(Out|Released)\b/gi, "Date Announced");
      }

      // 9. Generate slug & check for matching existing job (Duplicate Prevention)
      const existingJobMatch = await findMatchingExistingJob(cleanedTitle, category, supabase);

      const baseSlug = existingJobMatch ? existingJobMatch.slug : generateSlug(cleanedTitle);
      const slug = existingJobMatch ? existingJobMatch.slug : await getUniqueSlug(baseSlug, supabase);
      const autoBannerUrl = `${BASE_URL}/api/og/banner?title=${encodeURIComponent(cleanedTitle)}&category=${encodeURIComponent(aiResult.category || category)}&posts=${encodeURIComponent(aiResult.totalPosts || totalPosts || "")}&lastDate=${encodeURIComponent(sanitizedLastDate || "")}&state=${encodeURIComponent(stateCode || "")}`;

      if (existingJobMatch) {
        console.log(`🎯 [Duplicate Protection] Match found! Draft will UPDATE existing job ID: ${existingJobMatch.id} (URL: /job/${existingJobMatch.slug})`);
      }

      // 10. Save draft to Supabase
      const draftPayload: any = {
        source_url: item.link,
        source_title: item.title,
        source_site: item.source,
        apply_link: applyLink,
        apply_status: applyStatus,
        official_link: aiResult.officialLink || officialLink,
        notification_link: notificationLink || null,
        state_code: stateCode || null,
        banner_url: autoBannerUrl,
        last_date: sanitizedLastDate,
        total_posts: aiResult.totalPosts || totalPosts,
        app_fee_gen: isNonRecruitmentCat ? null : (aiResult.appFeeGen || appFeeGen),
        app_fee_res: isNonRecruitmentCat ? null : (aiResult.appFeeRes || appFeeRes),
        category: aiResult.category || category,
        generated_title: cleanedTitle,
        generated_meta: cleanCompetitorBrands(aiResult.metaDesc || ""),
        generated_slug: slug,
        generated_html: blogHtmlFinal, // already cleaned (stripH1 + cleanBrands) and validated above
        generated_tags: aiResult.tag ? [cleanCompetitorBrands(aiResult.tag)] : [],
        primary_keyword: cleanCompetitorBrands(aiResult.primaryKeyword || ""),
        short_description: cleanCompetitorBrands(aiResult.shortInfo || ""),
        important_dates: typeof finalDatesObj === "string" ? finalDatesObj : JSON.stringify(finalDatesObj || null),
        form_documents: Array.isArray(aiResult.form_documents) ? aiResult.form_documents : null,
        form_fees_structure: aiResult.form_fees_structure ? JSON.stringify(aiResult.form_fees_structure) : null,
        extracted_text: JSON.stringify({
          raw_preview: pageText.slice(0, 1500),
          existing_job_id: existingJobMatch ? existingJobMatch.id : null,
          existing_job_slug: existingJobMatch ? existingJobMatch.slug : null,
          form_documents: aiResult.form_documents || null,
          form_fees_structure: aiResult.form_fees_structure || null,
        }),
        status: "pending_review",
      };

      let inserted: any = null;
      let { data, error: insertError } = await supabase
        .from("auto_blog_drafts")
        .insert([draftPayload])
        .select("id")
        .single();

      if (insertError) {
        // ✅ FIX: Graceful fallback — optional/new columns hata ke retry karo
        console.warn(`   ⚠️ Insert error: ${insertError.message} — retrying without optional columns...`);
        const fallbackPayload = { ...draftPayload };
        delete fallbackPayload.important_dates;
        delete fallbackPayload.notification_link;
        delete fallbackPayload.state_code;
        delete fallbackPayload.banner_url;
        delete fallbackPayload.form_documents;       // ✅ Sahi column name
        delete fallbackPayload.form_fees_structure;  // ✅ Sahi column name
        const retry = await supabase
          .from("auto_blog_drafts")
          .insert([fallbackPayload])
          .select("id")
          .single();
        data = retry.data;
        insertError = retry.error;
      }

      if (insertError) throw new Error(`Supabase insert: ${insertError.message}`);
      inserted = data;
      console.log(`   ✅ Draft saved: ID = ${inserted.id}`);

      // 9. Log scraped URL (prevent duplicate)
      try {
        await supabase.from("scraped_urls_log").upsert([{ url: item.link }], { onConflict: "url" });
      } catch (_) { /* silent */ }

      // 10. Private Telegram approval notification to Admin (with 1-click Approve button)
      if (inserted?.id) {
        const sourceTag = existingJobMatch
          ? "🔄 Existing Job Update"
          : item.source === "google_trends" ? "🔥 Google Trends"
          : item.source === "sarkariresult" ? "🌐 SarkariResult.com"
          : item.source === "freejobalert" ? "📰 FreeJobAlert.com"
          : null;

        sendAdminDraftApprovalAlert({
          id: inserted.id,
          title: cleanCompetitorBrands(aiResult.title || item.title),
          category: aiResult.category || category,
          stateCode: stateCode || null,
          totalPosts: aiResult.totalPosts || totalPosts || null,
          lastDate: aiResult.lastDate || lastDate || null,
          bannerUrl: autoBannerUrl,
          sourceTag,
          qualityScore: qualityCheck.score ?? null,
          sourceUrl: item.link || null,  // Original URL for admin cross-check
        }).catch((e) => console.warn("Admin draft approval alert failed:", e));
      }

      results.processed++;

      // ⏱️ 5-second gap between items in single run (fast & rate limit safe)
      // Posts are naturally spaced out across 30-minute Vercel Cron intervals
      if (newItems.indexOf(item) < newItems.length - 1) {
        await sleep(5000);
      }

    } catch (err: any) {
      console.error(`   ❌ Failed: ${err.message}`);
      results.errors.push(`${item.title.slice(0, 60)}: ${err.message}`);

      // Send instant Telegram error alert to Admin's phone
      sendTelegramAdminErrorAlert(err.message, item.title, item.link).catch(() => {});

      // ✅ FIX: Smart URL skip logic — same URL kitni baar fail ho chuki hai check karo
      try {
        const { count: priorErrors } = await supabase
          .from("auto_blog_drafts")
          .select("*", { count: "exact", head: true })
          .eq("source_url", item.link)
          .eq("status", "error");

        const isPageFetchError = /fetch failed|HTTP 4[0-9]{2}|timeout|blocked/i.test(err.message);
        const shouldPermanentlySkip = isPageFetchError || (priorErrors !== null && priorErrors >= 2);

        if (shouldPermanentlySkip) {
          // 3rd failure ya page fetch error → permanently skip
          await supabase.from("scraped_urls_log").upsert([{ url: item.link }], { onConflict: "url" });
          console.log(`   ⛔ URL permanently skipped (${isPageFetchError ? "page fetch error" : `${(priorErrors ?? 0) + 1} failures`}): ${item.link.slice(0, 80)}`);
        } else {
          // 1st/2nd Gemini error → retry allowed on next cron run
          console.log(`   🔁 URL retry allowed (failure ${(priorErrors ?? 0) + 1}/3): ${item.link.slice(0, 80)}`);
        }
      } catch (_) { /* silent — log failure nahi rokna chahiye main flow ko */ }

      // Save error record for admin visibility
      try {
        await supabase.from("auto_blog_drafts").insert([{
          source_url: item.link,
          source_title: item.title,
          status: "error",
          error_message: err.message.slice(0, 500),
        }]);
      } catch (_) { /* silent */ }
    }
  }

  console.log(`\n📊 Scraper complete: ${results.processed} processed | ${results.skipped} skipped | ${results.errors.length} errors\n`);

  // Send Admin Summary Digest on Telegram
  try {
    const summaryText = `⏰ <b>ROJGAR SUVIDHA AUTO-SCRAPER RUN COMPLETE</b> ⏰\n\n` +
      `<b>📊 Total Candidates Scanned:</b> ${allCandidateItems.length}\n` +
      `<b>🆕 New Items Found & Processed:</b> ${newItems.length} (${freeJobAlertNew.length} Jobs, ${ndtvNew.length} News)\n` +
      `<b>✅ Drafts Generated Successfully:</b> ${results.processed}\n` +
      `<b>❌ Errors:</b> ${results.errors.length}\n\n` +
      `<i>All new draft approval buttons have been sent above to your Telegram. Tap Approve on any post to publish live instantly!</i>`;

    await sendTelegramAdminSummaryDigest(summaryText);
  } catch (e: any) {
    console.warn("⚠️ Summary digest notification failed:", e.message);
  }

  return results;
}
