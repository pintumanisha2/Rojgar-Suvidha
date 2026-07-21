// src/lib/matchScore.ts
// Job Match Score Engine — calculates how well a candidate matches a job notification

export interface UserProfile {
  dob?: string;            // ISO date string e.g. "2000-05-15"
  category?: string;       // "gen" | "obc" | "sc" | "st" | "ews"
  qualification?: string;  // "10th" | "12th" | "iti" | "diploma" | "graduation" | "post-grad"
  state?: string;          // e.g. "Uttar Pradesh"
  job_preferences?: string[]; // e.g. ["latest-jobs", "results", "banking"]
  gender?: string;         // "male" | "female" | "other"
}

export interface JobData {
  title?: string;
  category?: string;       // job category on site
  education?: string;      // from meta extraction e.g. "Bachelor Degree in any stream"
  ageLimit?: string;       // e.g. "18-27 years as on 01/07/2025"
  last_date?: string;
  appFeeGen?: string;
  appFeeRes?: string;
  totalPosts?: string;
  lsiKeywords?: string;
  orgName?: string;
}

export interface MatchResult {
  score: number;           // 0-100
  grade: "excellent" | "good" | "fair" | "low";
  reasons: string[];       // positive matches
  warnings: string[];      // what didn't match or missing info
  applyUrgency: "high" | "medium" | "low";
}

// ── Qualification hierarchy (higher = more qualified) ──────────────────────
const QUAL_LEVELS: Record<string, number> = {
  "10th": 1,
  "12th": 2,
  "iti": 2,
  "diploma": 3,
  "graduation": 4,
  "post-grad": 5,
};

// ── Parse age from ageLimit string ────────────────────────────────────────
function parseAgeRange(ageLimit: string): { min: number; max: number } | null {
  const match = ageLimit?.match(/(\d{2})\s*[-–to]+\s*(\d{2})/);
  if (!match) return null;
  return { min: parseInt(match[1]), max: parseInt(match[2]) };
}

// ── Get user's current age ────────────────────────────────────────────────
function getUserAge(dob: string): number | null {
  if (!dob) return null;
  const birthDate = new Date(dob);
  if (isNaN(birthDate.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
  return age;
}

// ── Check if qualification matches education requirement ──────────────────
function checkQualification(userQual: string | undefined, educationReq: string | undefined): "match" | "over" | "under" | "unknown" {
  if (!userQual || !educationReq) return "unknown";
  const edu = educationReq.toLowerCase();
  const userLevel = QUAL_LEVELS[userQual] || 0;

  if (edu.includes("phd") || edu.includes("post graduate") || edu.includes("post-grad") || edu.includes("masters") || edu.includes("m.sc") || edu.includes("m.com") || edu.includes("mba")) {
    return userLevel >= 5 ? "match" : userLevel >= 4 ? "under" : "under";
  }
  if (edu.includes("degree") || edu.includes("graduate") || edu.includes("bachelor") || edu.includes("b.sc") || edu.includes("b.com") || edu.includes("b.tech") || edu.includes("llb")) {
    return userLevel >= 4 ? "match" : "under";
  }
  if (edu.includes("diploma") || edu.includes("polytechnic")) {
    return userLevel >= 3 ? "match" : "under";
  }
  if (edu.includes("iti") || edu.includes("10+2") || edu.includes("12th") || edu.includes("intermediate") || edu.includes("higher secondary")) {
    return userLevel >= 2 ? "match" : "under";
  }
  if (edu.includes("10th") || edu.includes("matriculation") || edu.includes("class x")) {
    return userLevel >= 1 ? "match" : "under";
  }
  return "unknown";
}

// ── Age relaxation for reserved categories ────────────────────────────────
function getAgeRelaxation(category: string): number {
  switch (category?.toLowerCase()) {
    case "sc":
    case "st":    return 5;
    case "obc":   return 3;
    case "ews":   return 0;
    default:      return 0;
  }
}

// ── Main score calculator ─────────────────────────────────────────────────
export function calculateMatchScore(job: JobData, profile: UserProfile): MatchResult {
  let score = 0;
  const reasons: string[] = [];
  const warnings: string[] = [];

  // ── 1. Category / Reservation Match (25 pts) ──────────────────────────
  if (profile.category) {
    const cat = profile.category.toLowerCase();
    const appFee = cat === "sc" || cat === "st"
      ? (job.appFeeRes || "").toLowerCase()
      : (job.appFeeGen || "").toLowerCase();

    if (appFee.includes("free") || appFee.includes("nil") || appFee.includes("0")) {
      score += 25;
      reasons.push(`${profile.category.toUpperCase()} ke liye application fee FREE hai`);
    } else if (profile.category !== "gen") {
      score += 20;
      reasons.push(`${profile.category.toUpperCase()} category apply kar sakti hai`);
    } else {
      score += 20;
      reasons.push("General category ke liye eligible hain");
    }
  } else {
    score += 15;
    warnings.push("Category set nahi hai — profile mein update karein");
  }

  // ── 2. Age Check (25 pts) ──────────────────────────────────────────────
  const userAge = getUserAge(profile.dob || "");
  const ageRange = parseAgeRange(job.ageLimit || "");

  if (userAge && ageRange) {
    const relaxation = getAgeRelaxation(profile.category || "");
    const effectiveMax = ageRange.max + relaxation;

    if (userAge >= ageRange.min && userAge <= effectiveMax) {
      score += 25;
      reasons.push(`Aapki umar ${userAge} saal — age limit mein fit hai`);
      if (relaxation > 0) reasons.push(`${profile.category?.toUpperCase()} category ko ${relaxation} saal ki choot milti hai`);
    } else if (userAge < ageRange.min) {
      warnings.push(`Aapki umar (${userAge}) minimum limit se kam hai (${ageRange.min} saal)`);
    } else {
      warnings.push(`Aapki umar (${userAge}) maximum limit ${effectiveMax} se zyada hai`);
    }
  } else if (!userAge) {
    score += 12;
    warnings.push("Date of birth profile mein set nahi — age check nahi ho paya");
  } else {
    score += 15;
    warnings.push("Age limit extraction nahi hua — official notification check karein");
  }

  // ── 3. Qualification Match (20 pts) ───────────────────────────────────
  const qualMatch = checkQualification(profile.qualification, job.education);
  if (qualMatch === "match") {
    score += 20;
    reasons.push(`Aapki qualification (${profile.qualification}) eligible hai`);
  } else if (qualMatch === "over") {
    score += 20;
    reasons.push("Aap over-qualified hain — phir bhi apply kar sakte hain");
  } else if (qualMatch === "under") {
    warnings.push(`Minimum qualification ${job.education} chahiye — aapki (${profile.qualification || "not set"}) kam lag rahi hai`);
  } else {
    score += 10;
    warnings.push("Qualification verify nahi ho payi — official notification dekh lijiyega");
  }

  // ── 4. State Preference Match (15 pts) ────────────────────────────────
  if (profile.state) {
    const jobText = ((job.title || "") + " " + (job.orgName || "") + " " + (job.lsiKeywords || "")).toLowerCase();
    const userState = profile.state.toLowerCase();
    if (jobText.includes(userState) || jobText.includes("all india") || jobText.includes("central") || jobText.includes("union")) {
      score += 15;
      reasons.push("Aapke preferred state ya All India posting ke liye applicable hai");
    } else {
      score += 8;
      warnings.push("State match nahi hua — yeh central recruitment ho sakti hai ya alag state");
    }
  } else {
    score += 10;
    warnings.push("State preference set nahi hai — profile update karein better matching ke liye");
  }

  // ── 5. Job Category Preference (15 pts) ───────────────────────────────
  if (profile.job_preferences && profile.job_preferences.length > 0) {
    const jobCat = job.category || "";
    const jobText = ((job.title || "") + " " + (job.lsiKeywords || "")).toLowerCase();
    const matched = profile.job_preferences.some(pref => {
      const p = pref.toLowerCase();
      return jobCat === p || jobText.includes(p.replace("-", " ")) ||
        (p === "banking" && (jobText.includes("bank") || jobText.includes("ibps") || jobText.includes("sbi"))) ||
        (p === "railway" && (jobText.includes("rrb") || jobText.includes("railway"))) ||
        (p === "police" && (jobText.includes("police") || jobText.includes("constable") || jobText.includes("crpf")));
    });
    if (matched) {
      score += 15;
      reasons.push("Aapki preferred job category se match karta hai");
    } else {
      score += 5;
      warnings.push("Aapki preferred categories se exact match nahi — but phir bhi dekh sakte hain");
    }
  } else {
    score += 8;
    warnings.push("Job preferences set nahi hain — profile mein set karein for better matching");
  }

  // ── Grade & Urgency ────────────────────────────────────────────────────
  const grade: MatchResult["grade"] =
    score >= 85 ? "excellent" :
    score >= 65 ? "good" :
    score >= 45 ? "fair" : "low";

  let applyUrgency: MatchResult["applyUrgency"] = "low";
  if (job.last_date) {
    try {
      const lastDate = new Date(job.last_date);
      const daysLeft = Math.ceil((lastDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      applyUrgency = daysLeft <= 5 ? "high" : daysLeft <= 15 ? "medium" : "low";
    } catch {}
  }

  return { score: Math.min(score, 100), grade, reasons, warnings, applyUrgency };
}
