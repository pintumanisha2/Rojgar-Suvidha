import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export const runtime = "edge";

// ═══════════════════════════════════════════════════════════════════════════
// CATEGORY VISUAL IDENTITIES & THEMES
// ═══════════════════════════════════════════════════════════════════════════
interface CategoryTheme {
  bgGradient: string;
  accent: string;
  accentGlow: string;
  badgeBg: string;
  badgeText: string;
  overline: string;
  ctaLeft: string;
  ctaRight: string;
  iconType: "trophy" | "badge" | "key" | "cap" | "newspaper" | "briefcase";
}

const THEMES: Record<string, CategoryTheme> = {
  "latest-jobs": {
    bgGradient: "linear-gradient(135deg, #030712 0%, #0c1838 50%, #030712 100%)",
    accent: "#38bdf8",
    accentGlow: "rgba(56, 189, 248, 0.4)",
    badgeBg: "#2563eb",
    badgeText: "#ffffff",
    overline: "OFFICIAL NOTIFICATION",
    ctaLeft: "NOTIFICATION OUT NOW",
    ctaRight: "APPLY NOW →",
    iconType: "briefcase",
  },
  "results": {
    bgGradient: "linear-gradient(135deg, #020d06 0%, #06381a 50%, #020d06 100%)",
    accent: "#4ade80",
    accentGlow: "rgba(74, 222, 128, 0.45)",
    badgeBg: "#16a34a",
    badgeText: "#ffffff",
    overline: "RESULT DECLARED",
    ctaLeft: "CHECK YOUR RESULT NOW",
    ctaRight: "DOWNLOAD PDF →",
    iconType: "trophy",
  },
  "admit-card": {
    bgGradient: "linear-gradient(135deg, #0d0600 0%, #381a03 50%, #0d0600 100%)",
    accent: "#fb923c",
    accentGlow: "rgba(251, 146, 60, 0.45)",
    badgeBg: "#ea580c",
    badgeText: "#ffffff",
    overline: "ADMIT CARD RELEASED",
    ctaLeft: "DOWNLOAD ADMIT CARD",
    ctaRight: "GET HALL TICKET →",
    iconType: "badge",
  },
  "answer-key": {
    bgGradient: "linear-gradient(135deg, #0d0014 0%, #2e0840 50%, #0d0014 100%)",
    accent: "#c084fc",
    accentGlow: "rgba(192, 132, 252, 0.45)",
    badgeBg: "#9333ea",
    badgeText: "#ffffff",
    overline: "ANSWER KEY OUT",
    ctaLeft: "CHECK ANSWER KEY",
    ctaRight: "SUBMIT OBJECTION →",
    iconType: "key",
  },
  "admission": {
    bgGradient: "linear-gradient(135deg, #00101c 0%, #042645 50%, #00101c 100%)",
    accent: "#67e8f9",
    accentGlow: "rgba(103, 232, 249, 0.45)",
    badgeBg: "#0891b2",
    badgeText: "#ffffff",
    overline: "ADMISSION OPEN 2026",
    ctaLeft: "ADMISSION PROCESS OPEN",
    ctaRight: "REGISTER ONLINE →",
    iconType: "cap",
  },
  "news": {
    bgGradient: "linear-gradient(135deg, #050b14 0%, #0e2038 50%, #050b14 100%)",
    accent: "#38bdf8",
    accentGlow: "rgba(56, 189, 248, 0.4)",
    badgeBg: "#0284c7",
    badgeText: "#ffffff",
    overline: "SARKARI NEWS UPDATE",
    ctaLeft: "LATEST EDUCATION UPDATE",
    ctaRight: "READ FULL STORY →",
    iconType: "newspaper",
  },
};

const STATE_NAMES: Record<string, string> = {
  UP: "UP", BH: "BIHAR", MP: "MP", RJ: "RAJASTHAN", HR: "HARYANA",
  HP: "H.P.", DL: "DELHI", MH: "MAHARASHTRA", WB: "W.BENGAL",
  UK: "UTTARAKHAND", JH: "JHARKHAND", PB: "PUNJAB", OD: "ODISHA",
  TS: "TELANGANA", AP: "ANDHRA", KL: "KERALA", TN: "TAMIL NADU",
  CG: "C.G.", GU: "GUJARAT", AS: "ASSAM", KA: "KARNATAKA",
  JK: "J&K", GA: "GOA",
};

function safeTruncateWords(str: string, maxLen: number): string {
  if (str.length <= maxLen) return str;
  const sub = str.slice(0, maxLen);
  const lastSpace = sub.lastIndexOf(" ");
  return (lastSpace > 10 ? sub.slice(0, lastSpace) : sub).trim();
}

/** Clean and split title into impactful Line 1, Line 2, and Authority sub-pill */
function formatBannerTitles(rawTitle: string, category: string): {
  line1: string;
  line2: string;
  subPill: string;
  burstText: string;
} {
  const clean = rawTitle
    .replace(/\b(sarkariresult\.com|freejobalert\.com|rojgar\s*suvidha)\b/gi, "")
    .replace(/\s{2,}/g, " ")
    .trim();

  const currentYear = new Date().getFullYear().toString();
  const yearMatch = clean.match(/\b(202[4-7])\b/);
  const detectedYear = yearMatch ? yearMatch[1] : currentYear;

  // Extract post count if present e.g. (2,569 Posts) or 132 Posts
  const postsMatch = clean.match(/(\d[\d,]*)\s*(?:posts?|vacanc(?:y|ies))/i);
  const postsCount = postsMatch ? `${postsMatch[1]} POSTS` : "";

  // Detect Organization
  let org = "SARKARI RECRUITMENT";
  if (/railway|rrb|rrc/i.test(clean)) org = "RAILWAY RECRUITMENT BOARD (RRB)";
  else if (/upsssc/i.test(clean)) org = "UP SUBORDINATE (UPSSSC)";
  else if (/ssc|staff selection/i.test(clean)) org = "STAFF SELECTION COMMISSION (SSC)";
  else if (/upsc|civil service/i.test(clean)) org = "UNION PUBLIC SERVICE (UPSC)";
  else if (/bpsc|bihar public/i.test(clean)) org = "BIHAR PSC (BPSC)";
  else if (/uppsc|up public/i.test(clean)) org = "UTTAR PRADESH PSC (UPPSC)";
  else if (/rpsc|rajasthan public/i.test(clean)) org = "RAJASTHAN PSC (RPSC)";
  else if (/mppsc|mp public/i.test(clean)) org = "MADHYA PRADESH PSC (MPPSC)";
  else if (/ibps/i.test(clean)) org = "INSTITUTE OF BANKING (IBPS)";
  else if (/sbi|state bank/i.test(clean)) org = "STATE BANK OF INDIA (SBI)";
  else if (/police/i.test(clean)) org = "STATE POLICE DEPARTMENT";
  else if (/army|navy|air force|defence/i.test(clean)) org = "INDIAN ARMED FORCES";
  else if (/neet|nta|jee|ctet/i.test(clean)) org = "CENTRAL / NATIONAL EXAM";
  else if (/post office|india post|gds/i.test(clean)) org = "INDIA POST • DAK SEVAK";

  let line1 = "";
  let line2 = "";
  let burstText = "";

  if (category === "results") {
    // e.g. RRB JE CBT II Result 2026
    const base = clean.split(/result|out|scorecard|cut\s*off/i)[0].trim().replace(/[:\-–]/g, "");
    line1 = safeTruncateWords(base, 28).toUpperCase() || "SARKARI EXAM";
    line2 = `RESULT ${detectedYear}`;
    burstText = "RESULT OUT";
  } else if (category === "admit-card") {
    const base = clean.split(/admit\s*card|hall\s*ticket|exam\s*date|out/i)[0].trim().replace(/[:\-–]/g, "");
    line1 = safeTruncateWords(base, 28).toUpperCase() || "SARKARI EXAM";
    line2 = `ADMIT CARD ${detectedYear}`;
    burstText = "ADMIT CARD OUT";
  } else if (category === "answer-key") {
    const base = clean.split(/answer\s*key|key|out/i)[0].trim().replace(/[:\-–]/g, "");
    line1 = safeTruncateWords(base, 28).toUpperCase() || "SARKARI EXAM";
    line2 = `ANSWER KEY ${detectedYear}`;
    burstText = "KEY LIVE";
  } else if (category === "admission") {
    const base = clean.split(/admission|counselling|round|out/i)[0].trim().replace(/[:\-–]/g, "");
    line1 = safeTruncateWords(base, 28).toUpperCase() || "ENTRANCE EXAM";
    line2 = `ADMISSION ${detectedYear}`;
    burstText = "ADMISSION OPEN";
  } else {
    // Latest jobs / recruitment
    const base = clean.split(/recruitment|online\s*form|apply\s*online|apply|vacancy|posts/i)[0].trim().replace(/[:\-–]/g, "");
    line1 = safeTruncateWords(base, 28).toUpperCase() || "GOVT RECRUITMENT";
    line2 = `RECRUITMENT ${detectedYear}`;
    burstText = "APPLY ONLINE";
  }

  const subPill = postsCount ? `${org} • ${postsCount}` : org;

  return { line1, line2, subPill, burstText };
}

/** Sanitize scraper strings so banners look crisp and clean */
function sanitizeField(raw: string, type: "date" | "age" | "fee" | "qual"): string {
  if (!raw) return "";
  if (type === "date") {
    const match = raw.match(/(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}|\d{1,2}\s+[A-Za-z]{3,9}\s+\d{2,4})/);
    return match ? match[1] : raw.slice(0, 15);
  }
  if (type === "age") {
    const minMatch = raw.match(/min(?:imum)?\s*(?:age)?\s*[:\-]?\s*(\d+)/i);
    const maxMatch = raw.match(/max(?:imum)?\s*(?:age)?\s*[:\-]?\s*(\d+)/i);
    if (minMatch && maxMatch) return `${minMatch[1]}–${maxMatch[1]} Yrs`;
    if (minMatch) return `Min ${minMatch[1]} Yrs`;
    if (maxMatch) return `Max ${maxMatch[1]} Yrs`;
    return raw.length > 18 ? raw.slice(0, 18) : raw;
  }
  if (type === "fee") {
    const m = raw.match(/(?:₹|rs\.?)\s*(\d+)/i);
    if (m) return `₹${m[1]}`;
    if (/free|nil|0/i.test(raw)) return "₹0 (Free)";
    return raw.slice(0, 15);
  }
  if (type === "qual") {
    if (/10th|matric/i.test(raw)) return "10th Pass";
    if (/12th|inter/i.test(raw)) return "12th Pass";
    if (/degree|graduate|b\.?tech|b\.?sc/i.test(raw)) return "Graduate Degree";
    if (/diploma/i.test(raw)) return "Diploma / Poly";
    if (/iti/i.test(raw)) return "ITI Certificate";
    return raw.length > 20 ? raw.slice(0, 20) : raw;
  }
  return raw;
}

export async function GET(req: NextRequest) {
  try {
    const sp = new URL(req.url).searchParams;

    const title         = sp.get("title") || "Sarkari Naukri Notification 2026";
    const catRaw        = (sp.get("category") || "latest-jobs").toLowerCase();
    const postsRaw      = sp.get("posts") || sp.get("vacancies") || "";
    const startDateRaw  = sp.get("startDate") || "";
    const lastDateRaw   = sp.get("lastDate") || "";
    const qualRaw       = sp.get("qualification") || "";
    const stateRaw      = sp.get("state") || "";
    const salaryRaw     = sp.get("salary") || "";
    const ageRaw        = sp.get("age") || sp.get("ageLimit") || "";

    const lastDate      = sanitizeField(lastDateRaw, "date");
    const startDate     = sanitizeField(startDateRaw, "date");
    const ageLimit      = sanitizeField(ageRaw, "age");
    const qualification = sanitizeField(qualRaw, "qual");

    const theme = THEMES[catRaw] || THEMES["latest-jobs"];
    const stateName = STATE_NAMES[stateRaw.toUpperCase()] || (stateRaw ? stateRaw.toUpperCase().slice(0, 8) : "ALL INDIA");

    const { line1, line2, subPill, burstText } = formatBannerTitles(title, catRaw);

    // Render Crisp SVG Icons in Hexagon
    const renderHexagonIcon = () => {
      if (catRaw === "results") {
        return (
          <svg width="68" height="68" viewBox="0 0 24 24" fill="none" stroke={theme.accent} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
            <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
            <path d="M4 22h16" />
            <path d="M10 14.66V17c0 .55-.45 1-1 1H8v4h8v-4h-1c-.55 0-1-.45-1-1v-2.34" />
            <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
          </svg>
        );
      }
      if (catRaw === "admit-card") {
        return (
          <svg width="68" height="68" viewBox="0 0 24 24" fill="none" stroke={theme.accent} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z" />
            <path d="M13 5v2" /><path d="M13 17v2" /><path d="M13 11v2" />
          </svg>
        );
      }
      if (catRaw === "answer-key") {
        return (
          <svg width="68" height="68" viewBox="0 0 24 24" fill="none" stroke={theme.accent} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="m15.5 7.5 2.3 2.3a1 1 0 0 0 1.4 0l2.1-2.1a1 1 0 0 0 0-1.4L19 4" />
            <path d="m21 2-9.6 9.6" />
            <circle cx="7.5" cy="15.5" r="5.5" />
          </svg>
        );
      }
      return (
        <svg width="68" height="68" viewBox="0 0 24 24" fill="none" stroke={theme.accent} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M16 20V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
          <rect width="20" height="14" x="2" y="6" rx="2" />
        </svg>
      );
    };

    return new ImageResponse(
      (
        <div
          style={{
            height: "100%",
            width: "100%",
            display: "flex",
            flexDirection: "column",
            background: theme.bgGradient,
            fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
            color: "#FFFFFF",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* ── Background Radial Glows ── */}
          <div
            style={{
              position: "absolute",
              top: "-100px",
              left: "-100px",
              width: "450px",
              height: "450px",
              borderRadius: "50%",
              background: `radial-gradient(circle, ${theme.accentGlow} 0%, transparent 70%)`,
              display: "flex",
            }}
          />
          <div
            style={{
              position: "absolute",
              bottom: "-80px",
              right: "-80px",
              width: "500px",
              height: "500px",
              borderRadius: "50%",
              background: `radial-gradient(circle, ${theme.accentGlow} 0%, transparent 70%)`,
              display: "flex",
            }}
          />

          {/* ── Main Content Container ── */}
          <div
            style={{
              display: "flex",
              flex: 1,
              padding: "36px 44px 0 44px",
            }}
          >
            {/* ════ LEFT COLUMN (72%) ════ */}
            <div
              style={{
                width: "72%",
                display: "flex",
                flexDirection: "column",
                paddingRight: "28px",
              }}
            >
              {/* Header Bar: Brand + Overline Pill */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "16px",
                  marginBottom: "18px",
                }}
              >
                {/* Brand */}
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <span style={{ fontSize: "24px", fontWeight: 900, color: "#38bdf8", letterSpacing: "-0.5px" }}>Rojgar</span>
                  <span style={{ fontSize: "24px", fontWeight: 900, color: "#FFFFFF", letterSpacing: "-0.5px" }}>Suvidha</span>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" style={{ marginLeft: "4px" }}>
                    <circle cx="10" cy="10" r="6" stroke="#38bdf8" strokeWidth="2.5" />
                    <line x1="14.5" y1="14.5" x2="20" y2="20" stroke="#38bdf8" strokeWidth="2.5" strokeLinecap="round" />
                  </svg>
                </div>

                {/* Overline Badge */}
                <div
                  style={{
                    display: "flex",
                    backgroundColor: theme.badgeBg,
                    color: theme.badgeText,
                    padding: "4px 16px",
                    borderRadius: "20px",
                    fontSize: "12px",
                    fontWeight: 900,
                    letterSpacing: "1.5px",
                  }}
                >
                  {theme.overline}
                </div>
              </div>

              {/* Main Headline (Line 1: White, Line 2: Glowing Accent) */}
              <div
                style={{
                  display: "flex",
                  fontSize: line1.length > 18 ? "46px" : "54px",
                  fontWeight: 900,
                  color: "#FFFFFF",
                  lineHeight: 1.05,
                  letterSpacing: "-1px",
                  marginBottom: "2px",
                }}
              >
                {line1}
              </div>

              <div
                style={{
                  display: "flex",
                  fontSize: "44px",
                  fontWeight: 900,
                  color: theme.accent,
                  lineHeight: 1.1,
                  letterSpacing: "-0.5px",
                  textShadow: `0 0 30px ${theme.accentGlow}`,
                  marginBottom: "16px",
                }}
              >
                {line2}
              </div>

              {/* Sub-Pill & Burst Badge */}
              <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
                <div
                  style={{
                    display: "flex",
                    backgroundColor: "#FFFFFF",
                    color: "#0f172a",
                    padding: "6px 18px",
                    borderRadius: "24px",
                    fontSize: "14px",
                    fontWeight: 900,
                    letterSpacing: "0.4px",
                    boxShadow: "0 4px 14px rgba(0,0,0,0.3)",
                  }}
                >
                  {subPill}
                </div>

                {burstText && (
                  <div
                    style={{
                      display: "flex",
                      backgroundColor: theme.badgeBg,
                      color: "#FFFFFF",
                      border: `1.5px solid ${theme.accent}`,
                      padding: "5px 14px",
                      borderRadius: "20px",
                      fontSize: "12px",
                      fontWeight: 900,
                      letterSpacing: "0.5px",
                    }}
                  >
                    {burstText}
                  </div>
                )}
              </div>

              {/* Information Rows (Clean Glassmorphism Table Style) */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "8px",
                  width: "100%",
                }}
              >
                {catRaw === "results" ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px", width: "100%" }}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        padding: "7px 16px",
                        backgroundColor: "rgba(255, 255, 255, 0.05)",
                        border: "1px solid rgba(74, 222, 128, 0.3)",
                        borderRadius: "10px",
                      }}
                    >
                      <span style={{ color: "#94a3b8", fontSize: "14px", fontWeight: 700 }}>Total Vacancies</span>
                      <span style={{ color: "#ffffff", fontSize: "14px", fontWeight: 900 }}>{postsRaw ? `${postsRaw} Posts` : "Official Notice"}</span>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        padding: "7px 16px",
                        backgroundColor: "rgba(255, 255, 255, 0.05)",
                        border: "1px solid rgba(74, 222, 128, 0.3)",
                        borderRadius: "10px",
                      }}
                    >
                      <span style={{ color: "#94a3b8", fontSize: "14px", fontWeight: 700 }}>Selection Status</span>
                      <span style={{ color: theme.accent, fontSize: "14px", fontWeight: 900 }}>Scorecard & Cut Off Marks Released</span>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        padding: "7px 16px",
                        backgroundColor: "rgba(255, 255, 255, 0.05)",
                        border: "1px solid rgba(74, 222, 128, 0.3)",
                        borderRadius: "10px",
                      }}
                    >
                      <span style={{ color: "#94a3b8", fontSize: "14px", fontWeight: 700 }}>Merit List PDF</span>
                      <span style={{ color: "#ffffff", fontSize: "14px", fontWeight: 900 }}>Direct Download Link Active</span>
                    </div>
                  </div>
                ) : catRaw === "admit-card" ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px", width: "100%" }}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        padding: "7px 16px",
                        backgroundColor: "rgba(255, 255, 255, 0.05)",
                        border: "1px solid rgba(251, 146, 60, 0.3)",
                        borderRadius: "10px",
                      }}
                    >
                      <span style={{ color: "#94a3b8", fontSize: "14px", fontWeight: 700 }}>Hall Ticket Status</span>
                      <span style={{ color: theme.accent, fontSize: "14px", fontWeight: 900 }}>E-Call Letter Available Online</span>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        padding: "7px 16px",
                        backgroundColor: "rgba(255, 255, 255, 0.05)",
                        border: "1px solid rgba(251, 146, 60, 0.3)",
                        borderRadius: "10px",
                      }}
                    >
                      <span style={{ color: "#94a3b8", fontSize: "14px", fontWeight: 700 }}>Exam Shift & Center</span>
                      <span style={{ color: "#ffffff", fontSize: "14px", fontWeight: 900 }}>Check Roll No & Shift Timing</span>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        padding: "7px 16px",
                        backgroundColor: "rgba(255, 255, 255, 0.05)",
                        border: "1px solid rgba(251, 146, 60, 0.3)",
                        borderRadius: "10px",
                      }}
                    >
                      <span style={{ color: "#94a3b8", fontSize: "14px", fontWeight: 700 }}>Required Documents</span>
                      <span style={{ color: "#ffffff", fontSize: "14px", fontWeight: 900 }}>Admit Card + Photo ID Original</span>
                    </div>
                  </div>
                ) : (
                  // Latest jobs: 4 Sleek Chips
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
                    <div
                      style={{
                        flex: 1,
                        minWidth: "150px",
                        backgroundColor: "rgba(255, 255, 255, 0.05)",
                        border: `1px solid ${theme.accentGlow}`,
                        borderRadius: "10px",
                        padding: "8px 14px",
                        display: "flex",
                        flexDirection: "column",
                      }}
                    >
                      <span style={{ fontSize: "10px", color: "#94a3b8", fontWeight: 800, letterSpacing: "1px" }}>SALARY</span>
                      <span style={{ fontSize: "14px", color: "#ffffff", fontWeight: 900, marginTop: "2px" }}>{salaryRaw || "As per Rules"}</span>
                    </div>
                    <div
                      style={{
                        flex: 1,
                        minWidth: "150px",
                        backgroundColor: "rgba(255, 255, 255, 0.05)",
                        border: `1px solid ${theme.accentGlow}`,
                        borderRadius: "10px",
                        padding: "8px 14px",
                        display: "flex",
                        flexDirection: "column",
                      }}
                    >
                      <span style={{ fontSize: "10px", color: "#94a3b8", fontWeight: 800, letterSpacing: "1px" }}>AGE LIMIT</span>
                      <span style={{ fontSize: "14px", color: "#ffffff", fontWeight: 900, marginTop: "2px" }}>{ageLimit || "18–40 Years"}</span>
                    </div>
                    <div
                      style={{
                        flex: 1,
                        minWidth: "150px",
                        backgroundColor: "rgba(255, 255, 255, 0.05)",
                        border: `1px solid ${theme.accentGlow}`,
                        borderRadius: "10px",
                        padding: "8px 14px",
                        display: "flex",
                        flexDirection: "column",
                      }}
                    >
                      <span style={{ fontSize: "10px", color: "#94a3b8", fontWeight: 800, letterSpacing: "1px" }}>LOCATION</span>
                      <span style={{ fontSize: "14px", color: "#ffffff", fontWeight: 900, marginTop: "2px" }}>{stateName}</span>
                    </div>
                    <div
                      style={{
                        flex: 1,
                        minWidth: "150px",
                        backgroundColor: "rgba(255, 255, 255, 0.05)",
                        border: `1px solid ${theme.accentGlow}`,
                        borderRadius: "10px",
                        padding: "8px 14px",
                        display: "flex",
                        flexDirection: "column",
                      }}
                    >
                      <span style={{ fontSize: "10px", color: "#94a3b8", fontWeight: 800, letterSpacing: "1px" }}>ELIGIBILITY</span>
                      <span style={{ fontSize: "14px", color: "#ffffff", fontWeight: 900, marginTop: "2px" }}>{qualification || "10th / 12th / Degree"}</span>
                    </div>

                    {/* Status badges matching reference design */}
                    <div style={{ display: "flex", gap: "10px", width: "100%", marginTop: "4px" }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          backgroundColor: "#16a34a",
                          color: "#ffffff",
                          padding: "4px 14px",
                          borderRadius: "16px",
                          fontSize: "12px",
                          fontWeight: 900,
                        }}
                      >
                        ✔ APPLY OPEN
                      </div>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          backgroundColor: "rgba(255, 255, 255, 0.08)",
                          border: "1px solid rgba(255, 255, 255, 0.15)",
                          color: "#e2e8f0",
                          padding: "4px 14px",
                          borderRadius: "16px",
                          fontSize: "12px",
                          fontWeight: 800,
                        }}
                      >
                        🎓 {qualification || "Online Application"}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* ════ RIGHT COLUMN (28%) ════ */}
            <div
              style={{
                width: "28%",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "space-between",
                backgroundColor: "rgba(255, 255, 255, 0.03)",
                border: `1px solid ${theme.accentGlow}`,
                borderRadius: "24px",
                padding: "24px 18px",
                boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
              }}
            >
              {/* State Pill */}
              <div
                style={{
                  display: "flex",
                  backgroundColor: "#f59e0b",
                  color: "#0f172a",
                  padding: "4px 16px",
                  borderRadius: "20px",
                  fontSize: "13px",
                  fontWeight: 900,
                  letterSpacing: "1px",
                  alignSelf: "flex-end",
                }}
              >
                {stateName}
              </div>

              {/* Emblem Hexagon Box with Clean SVG */}
              <div
                style={{
                  width: "120px",
                  height: "120px",
                  borderRadius: "28px",
                  backgroundColor: "rgba(255, 255, 255, 0.06)",
                  border: `2px solid ${theme.accent}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: `0 0 40px ${theme.accentGlow}`,
                }}
              >
                {renderHexagonIcon()}
              </div>

              {/* Status / Dates Box */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "4px",
                  width: "100%",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    backgroundColor: "rgba(255, 255, 255, 0.07)",
                    borderRadius: "12px",
                    padding: "8px 12px",
                    width: "100%",
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                  }}
                >
                  <span style={{ fontSize: "10px", color: "#94a3b8", fontWeight: 800, letterSpacing: "1px" }}>
                    {lastDate ? "LAST DATE" : "OFFICIAL STATUS"}
                  </span>
                  <span style={{ fontSize: "13px", color: "#ffffff", fontWeight: 900, marginTop: "2px" }}>
                    {lastDate || "100% VERIFIED UPDATE"}
                  </span>
                </div>

                <span style={{ fontSize: "12px", color: theme.accent, fontWeight: 800, marginTop: "6px" }}>
                  www.rojgarsuvidha.com
                </span>
              </div>
            </div>
          </div>

          {/* ── Bottom CTA Bar ── */}
          <div
            style={{
              display: "flex",
              height: "64px",
              width: "100%",
              marginTop: "auto",
              boxShadow: "0 -4px 20px rgba(0,0,0,0.5)",
            }}
          >
            {/* Left CTA (Dark) */}
            <div
              style={{
                flex: 1,
                backgroundColor: "#0b1329",
                display: "flex",
                alignItems: "center",
                paddingLeft: "44px",
                borderTop: "1px solid rgba(255,255,255,0.1)",
              }}
            >
              <span style={{ fontSize: "17px", fontWeight: 900, color: "#FFFFFF", letterSpacing: "0.5px" }}>
                {theme.ctaLeft}
              </span>
            </div>

            {/* Right CTA (Accent Action Button) */}
            <div
              style={{
                backgroundColor: theme.badgeBg,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "0 40px",
              }}
            >
              <span style={{ fontSize: "18px", fontWeight: 900, color: "#FFFFFF", letterSpacing: "0.5px" }}>
                {theme.ctaRight}
              </span>
            </div>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  } catch (err: any) {
    console.error("Banner generation error:", err);
    return new Response(`Error generating banner: ${err?.message}`, { status: 500 });
  }
}
