import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export const runtime = "edge";

// ═══════════════════════════════════════════════════════════════════════════
// CATEGORY THEMES — 6 main visual identities
// ═══════════════════════════════════════════════════════════════════════════
const CATEGORY_THEMES: Record<string, {
  bg1: string; bg2: string; bg3: string;
  accent: string; accentDim: string;
  overline: string;
  ctaLeft: string; ctaRight: string;
}> = {
  "latest-jobs": {
    bg1: "#060913", bg2: "#0d1b3e", bg3: "#0a0f1e",
    accent: "#2563EB", accentDim: "#1d4ed8",
    overline: "OFFICIAL NOTIFICATION",
    ctaLeft: "NOTIFICATION OUT NOW", ctaRight: "APPLY NOW →",
  },
  "results": {
    bg1: "#020d06", bg2: "#052e16", bg3: "#020d06",
    accent: "#22c55e", accentDim: "#16a34a",
    overline: "RESULT DECLARED",
    ctaLeft: "CHECK YOUR RESULT NOW", ctaRight: "DOWNLOAD PDF →",
  },
  "admit-card": {
    bg1: "#06040f", bg2: "#130b2e", bg3: "#06040f",
    accent: "#a78bfa", accentDim: "#7c3aed",
    overline: "ADMIT CARD RELEASED",
    ctaLeft: "DOWNLOAD ADMIT CARD", ctaRight: "EXAM TIPS INSIDE →",
  },
  "answer-key": {
    bg1: "#0f0800", bg2: "#1c0e00", bg3: "#0f0800",
    accent: "#f59e0b", accentDim: "#d97706",
    overline: "ANSWER KEY RELEASED",
    ctaLeft: "ANSWER KEY OUT NOW", ctaRight: "DOWNLOAD / CHALLENGE →",
  },
  "admission": {
    bg1: "#020b1e", bg2: "#0c1a45", bg3: "#020b1e",
    accent: "#60a5fa", accentDim: "#2563eb",
    overline: "ADMISSION OPEN",
    ctaLeft: "ADMISSION OPEN NOW", ctaRight: "REGISTER NOW →",
  },
  "news": {
    bg1: "#080f14", bg2: "#0c1f2e", bg3: "#080f14",
    accent: "#38bdf8", accentDim: "#0284c7",
    overline: "GOVERNMENT UPDATE",
    ctaLeft: "LATEST NEWS UPDATE", ctaRight: "READ MORE →",
  },
};
const DEFAULT_THEME = CATEGORY_THEMES["latest-jobs"];

// ═══════════════════════════════════════════════════════════════════════════
// SUB-THEMES — keyword-based accent override (54 combinations possible)
// ═══════════════════════════════════════════════════════════════════════════
const SUB_THEMES: Array<{ pattern: RegExp; accent: string; accentDim: string; icon: string }> = [
  { pattern: /railway|rrb|rrc|ntpc|group.?d|loco pilot|rrb.*je|rail.*engineer/i,      accent: "#06b6d4", accentDim: "#0891b2", icon: "🚂" },
  { pattern: /police|constable|sipahi|sub inspector|\bsi\b|dsp|crpf|cisf|bsf|itbp|ssb|paramilitary|home guard/i, accent: "#ef4444", accentDim: "#dc2626", icon: "🛡️" },
  { pattern: /\bbank\b|ibps|sbi|rbi|nabard|sidbi|bank.*clerk|bank.*po|bank.*officer|rrb.*bank/i,  accent: "#f59e0b", accentDim: "#d97706", icon: "🏦" },
  { pattern: /army|navy|air.?force|defence|agniveer|military|soldier|\bnda\b|\bcds\b|territorial/i, accent: "#65a30d", accentDim: "#4d7c0f", icon: "✈️" },
  { pattern: /teacher|tet|shikshak|ctet|stet|lekhpal|patwari|anganwadi|vidya.*sahayak/i,          accent: "#0d9488", accentDim: "#0f766e", icon: "📚" },
  { pattern: /nurse|doctor|medical|health|aiims|esic|cghs|pharmacist|\bmbbs\b|hospital|dental/i,  accent: "#e11d48", accentDim: "#be123c", icon: "🏥" },
  { pattern: /india post|gds|dak sevak|post office|gramin dak|postal/i,                            accent: "#2563EB", accentDim: "#1d4ed8", icon: "📮" },
  { pattern: /upsc|civil service|\bias\b|\bips\b|\bifs\b|\biras\b|judicial|hcs|pcs|state.*service/i, accent: "#b45309", accentDim: "#92400e", icon: "⚖️" },
];

// ═══════════════════════════════════════════════════════════════════════════
// CATEGORY FALLBACK ICONS
// ═══════════════════════════════════════════════════════════════════════════
const CATEGORY_ICONS: Record<string, string> = {
  "latest-jobs": "🏛️", "results": "🏆", "admit-card": "🪪",
  "answer-key": "📋", "admission": "🎓", "news": "📰",
};

// ═══════════════════════════════════════════════════════════════════════════
// STATE MAP
// ═══════════════════════════════════════════════════════════════════════════
const STATE_NAMES: Record<string, string> = {
  UP: "UP", BH: "BIHAR", MP: "MP", RJ: "RAJASTHAN", HR: "HARYANA",
  HP: "H.P.", DL: "DELHI", MH: "MAHARASHTRA", WB: "W.BENGAL",
  UK: "UTTARAKHAND", JH: "JHARKHAND", PB: "PUNJAB", OD: "ODISHA",
  TS: "TELANGANA", AP: "ANDHRA", KL: "KERALA", TN: "TAMIL NADU",
  CG: "C.G.", GU: "GUJARAT", AS: "ASSAM", KA: "KARNATAKA",
  JK: "J&K", GA: "GOA", MN: "MANIPUR", TR: "TRIPURA", SK: "SIKKIM",
};

// ═══════════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════════

/** Smart extract org name + post line from full title */
function parseOrgAndPost(title: string): { org: string; post: string } {
  const upper = title.toUpperCase();

  // Known org shortcuts — fast path
  const knownOrgs: [RegExp, string][] = [
    [/india post|gds|dak sevak|post office/i, "INDIA POST"],
    [/indian railway|rrb|rrc|rail.*ministry|railway.*board/i, "INDIAN RAILWAYS"],
    [/\bssb\b.*(?:recruit|constable|head constable)/i, "SSB"],
    [/\bssc\b|staff selection commission/i, "STAFF SELECTION COMMISSION"],
    [/\bupsc\b|union public service/i, "UPSC"],
    [/bihar.*public.*service|\bbpsc\b/i, "BPSC"],
    [/\bmpsc\b/i, "MPSC"], [/\buppsc\b/i, "UPPSC"], [/\brpsc\b/i, "RPSC"],
    [/\bspsc\b/i, "SPSC"], [/\bkpsc\b/i, "KPSC"], [/\bappsc\b/i, "APPSC"],
    [/\bstate bank|\bsbi\b/i, "STATE BANK OF INDIA"],
    [/\bibps\b/i, "IBPS"], [/\brbi\b/i, "RBI"],
    [/\bnabard\b/i, "NABARD"], [/\bsidbi\b/i, "SIDBI"],
    [/up police|uttar pradesh police/i, "UP POLICE"],
    [/bihar police/i, "BIHAR POLICE"],
    [/rajasthan police/i, "RAJASTHAN POLICE"],
    [/mp police|madhya pradesh police/i, "MP POLICE"],
    [/indian army|agniveer.*army/i, "INDIAN ARMY"],
    [/indian navy|agniveer.*navy/i, "INDIAN NAVY"],
    [/indian air force|iaf|agniveer.*air/i, "INDIAN AIR FORCE"],
    [/\baiims\b/i, "AIIMS"], [/\besic\b/i, "ESIC"],
    [/high court/i, "HIGH COURT"], [/supreme court/i, "SUPREME COURT"],
    [/\bhal\b.*(?:recruit|engineer|technician)/i, "HAL"],
    [/\bdrdo\b/i, "DRDO"], [/\bisro\b/i, "ISRO"],
    [/\bntpc\b.*(?:recruit|engineer)/i, "NTPC"],
    [/\bnhpc\b/i, "NHPC"], [/\boncg\b|\bongc\b/i, "ONGC"],
    [/\bcoal india|\bcoal.*limited/i, "COAL INDIA"],
    [/\bcrpf\b/i, "CRPF"], [/\bcisf\b/i, "CISF"],
    [/\bbsf\b/i, "BSF"], [/\bitbp\b/i, "ITBP"],
    [/\bnda\b.*(?:recruit|exam)/i, "NDA"], [/\bcds\b.*(?:recruit|exam)/i, "CDS"],
  ];
  for (const [pat, name] of knownOrgs) {
    if (pat.test(title)) {
      // Post = title minus org name minus noise words
      const noise = /notification|recruitment|result|admit card|answer key|hall ticket|admission|bharti|bharati|\b20\d{2}\b|sarkariresult\.com|free\s*job\s*alert/gi;
      const postLine = title.replace(pat, "").replace(noise, "").replace(/\s{2,}/g, " ").trim().toUpperCase();
      return { org: name, post: postLine.slice(0, 44) };
    }
  }

  // Generic extraction — first capitalised noun phrase
  const noise = /notification|recruitment|result|admit card|answer key|hall ticket|admission|bharti|\b20\d{2}\b|sarkariresult\.com|free\s*job\s*alert/gi;
  const cleaned = title.replace(noise, " ").replace(/\s{2,}/g, " ").trim();
  const words = cleaned.split(" ").filter(w => w.length > 1);
  const orgWords = words.slice(0, Math.min(3, words.length));
  const org = orgWords.join(" ").toUpperCase().slice(0, 28);
  const post = words.slice(orgWords.length).join(" ").toUpperCase().slice(0, 44);
  return { org, post };
}

/** Adaptive font size: shorter org = bigger text, feels designed */
function orgFontSize(org: string): number {
  const l = org.length;
  if (l <= 5)  return 80;
  if (l <= 9)  return 70;
  if (l <= 14) return 58;
  if (l <= 18) return 48;
  if (l <= 23) return 40;
  return 32;
}

/** Days remaining until lastDate */
function getDaysLeft(lastDate: string): number | null {
  if (!lastDate) return null;
  try {
    // Handle DD/MM/YYYY, DD-MM-YYYY, YYYY-MM-DD
    let iso = lastDate;
    const ddmm = lastDate.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
    if (ddmm) iso = `${ddmm[3]}-${ddmm[2].padStart(2,"0")}-${ddmm[1].padStart(2,"0")}`;
    const d = new Date(iso);
    if (isNaN(d.getTime())) return null;
    const today = new Date(); today.setHours(0,0,0,0);
    return Math.ceil((d.getTime() - today.getTime()) / 86400000);
  } catch { return null; }
}

/** Format vacancy count with smart scarcity framing */
function fmtVacancy(posts: string): string {
  if (!posts) return "";
  const n = parseInt(posts.replace(/[^0-9]/g, "") || "0");
  if (!n || isNaN(n)) return posts.toUpperCase().slice(0, 20);
  const f = n.toLocaleString("en-IN");
  if (n < 50)   return `ONLY ${f} POSTS`;
  if (n >= 10000) return `${f}+ POSTS`;
  return `${f} POSTS`;
}

/** Format qualification into short readable label */
function fmtQual(q: string): string {
  if (!q) return "";
  if (/10th|matric|high school|secondary/i.test(q))    return "10th Pass";
  if (/12th|intermediate|senior secondary/i.test(q))    return "12th Pass";
  if (/b\.?tech|b\.?e\b|engineering degree/i.test(q))  return "B.Tech";
  if (/\bmbbs\b/i.test(q))                              return "MBBS";
  if (/graduation|graduate|degree|b\.?a\b|b\.?sc\b|b\.?com\b/i.test(q)) return "Graduate";
  if (/diploma/i.test(q))                               return "Diploma";
  if (/post.?grad|m\.?a\b|m\.?sc\b|m\.?com\b/i.test(q)) return "Post Graduate";
  return q.slice(0, 14);
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN HANDLER
// ═══════════════════════════════════════════════════════════════════════════
export async function GET(req: NextRequest) {
  try {
    const sp = new URL(req.url).searchParams;

    // ── Parse params ──
    const title        = sp.get("title")       || "Sarkari Naukri Notification";
    const catRaw       = (sp.get("category")   || "latest-jobs").toLowerCase();
    const postsRaw     = sp.get("posts")        || sp.get("vacancies") || "";
    const startDate    = sp.get("startDate")    || "";
    const lastDate     = sp.get("lastDate")     || "";
    const qualification= sp.get("qualification")|| "";
    const stateRaw     = sp.get("state")        || "";
    const salaryRaw    = sp.get("salary")       || "";
    const ageRaw       = sp.get("age")          || sp.get("ageLimit") || "";
    const applyStatus  = (sp.get("applyStatus") || "unknown").toLowerCase();
    const feeRaw       = sp.get("fee")          || "";

    // ── Resolve theme ──
    const baseTheme = CATEGORY_THEMES[catRaw] || DEFAULT_THEME;
    const sub = SUB_THEMES.find(s => s.pattern.test(title));
    const accent    = sub ? sub.accent    : baseTheme.accent;
    const accentDim = sub ? sub.accentDim : baseTheme.accentDim;
    const icon      = sub ? sub.icon      : (CATEGORY_ICONS[catRaw] || "🏛️");

    // ── Compute dynamic values ──
    const { org, post }  = parseOrgAndPost(title);
    const orgFs          = orgFontSize(org);
    const postFs         = post.length > 30 ? 24 : post.length > 20 ? 28 : 32;
    const daysLeft       = getDaysLeft(lastDate);
    const qualLabel      = fmtQual(qualification);
    const stateName      = STATE_NAMES[stateRaw.toUpperCase()] || (stateRaw ? stateRaw.toUpperCase().slice(0,8) : "");
    const vacancyDisplay = fmtVacancy(postsRaw);
    const isFree         = /^0$|free|nil|zero|no fee/i.test(feeRaw);
    const currentYear    = new Date().getFullYear();

    // Post display line
    const postLine = post ||
      (catRaw === "results"     ? `RESULT ${currentYear}` :
       catRaw === "admit-card"  ? `ADMIT CARD ${currentYear}` :
       catRaw === "answer-key"  ? `ANSWER KEY ${currentYear}` :
       catRaw === "admission"   ? `ADMISSION ${currentYear}` :
                                   `RECRUITMENT ${currentYear}`);

    // ── Urgency badge ──
    let urgencyText = ""; let urgencyBg = "";
    if (daysLeft !== null && daysLeft >= 0 && daysLeft <= 30) {
      if (daysLeft === 0)      { urgencyText = "⚡ TODAY IS LAST DATE"; urgencyBg = "#7f1d1d"; }
      else if (daysLeft <= 2)  { urgencyText = `⚡ ${daysLeft}D LEFT`;  urgencyBg = "#dc2626"; }
      else if (daysLeft <= 7)  { urgencyText = `🔴 ${daysLeft} DAYS LEFT`; urgencyBg = "#b91c1c"; }
      else if (daysLeft <= 15) { urgencyText = `⏰ ${daysLeft} DAYS LEFT`; urgencyBg = "#d97706"; }
      else                     { urgencyText = `📅 ${daysLeft} DAYS LEFT`; urgencyBg = "#0891b2"; }
    }

    // ── Apply status chip ──
    const statusMap: Record<string, { text: string; bg: string }> = {
      open:         { text: "✅ APPLY OPEN",  bg: "#15803d" },
      coming_soon:  { text: "🟡 APPLY SOON",  bg: "#854d0e" },
      closed:       { text: "🔴 CLOSED",      bg: "#991b1b" },
      unknown:      { text: "",               bg: "" },
    };
    const statusChip = statusMap[applyStatus] || statusMap["unknown"];

    // ── Dynamic CTA text ──
    let ctaLeft  = baseTheme.ctaLeft;
    let ctaRight = baseTheme.ctaRight;
    if (catRaw === "latest-jobs" && applyStatus === "coming_soon") {
      ctaLeft = "NOTIFICATION RELEASED"; ctaRight = "APPLY LINK COMING SOON";
    }
    if (catRaw === "latest-jobs" && applyStatus === "closed") {
      ctaLeft = "APPLICATION CLOSED"; ctaRight = "CHECK RE-NOTIFICATION";
    }

    // ── Info chips — show only available data ──
    const chips: Array<{ label: string; value: string }> = [];
    if (salaryRaw) chips.push({ label: "SALARY",    value: salaryRaw.slice(0, 22) });
    if (ageRaw)    chips.push({ label: "AGE LIMIT", value: ageRaw.slice(0, 18) });
    chips.push({ label: "LOCATION", value: stateName ? `${stateName} STATE` : "PAN INDIA" });
    if (qualification) chips.push({ label: "EDUCATION", value: qualLabel || qualification.slice(0, 12) });
    const displayChips = chips.slice(0, 4);

    // ── Category label pill text ──
    const catLabel: Record<string, string> = {
      "results":    "RESULT DECLARED",
      "admit-card": "HALL TICKET AVAILABLE",
      "answer-key": "ANSWER KEY RELEASED",
      "admission":  "ADMISSION OPEN",
      "news":       "IMPORTANT UPDATE",
    };
    const postTypePill = catLabel[catRaw] || "NOTIFICATION OUT";

    return new ImageResponse(
      (
        <div
          style={{
            height: "100%", width: "100%",
            display: "flex", flexDirection: "column",
            background: `linear-gradient(135deg, ${baseTheme.bg1} 0%, ${baseTheme.bg2} 55%, ${baseTheme.bg3} 100%)`,
            fontFamily: "'Segoe UI', Arial, sans-serif",
            color: "#FFFFFF",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* ── Diagonal texture overlay ── */}
          <div style={{
            position: "absolute", inset: "0",
            backgroundImage: `repeating-linear-gradient(-45deg,rgba(255,255,255,0.018) 0,rgba(255,255,255,0.018) 1px,transparent 1px,transparent 26px)`,
            zIndex: 0,
          }} />

          {/* ── Radial accent glow top-right ── */}
          <div style={{
            position: "absolute", top: -100, right: -100,
            width: 380, height: 380,
            background: `radial-gradient(circle, ${accent}45 0%, transparent 68%)`,
            zIndex: 0,
          }} />

          {/* ── Content row ── */}
          <div style={{ display: "flex", flex: 1, position: "relative", zIndex: 1 }}>

            {/* ════ LEFT PANEL 68% ════ */}
            <div style={{
              width: "68%",
              display: "flex", flexDirection: "column",
              padding: "24px 28px 0 34px",
            }}>

              {/* Row 1: Logo + Urgency badge */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
                {/* Rojgar Suvidha wordmark */}
                <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                  <span style={{ fontSize: "19px", fontWeight: 900, color: "#2563EB", letterSpacing: "-0.3px" }}>Rojgar</span>
                  <span style={{ fontSize: "19px", fontWeight: 900, color: "#FFFFFF", letterSpacing: "-0.3px" }}>Suvidha</span>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{ marginLeft: "4px" }}>
                    <circle cx="10" cy="10" r="6" stroke="#2563EB" strokeWidth="2.5"/>
                    <line x1="14.5" y1="14.5" x2="20" y2="20" stroke="#2563EB" strokeWidth="2.5" strokeLinecap="round"/>
                    <circle cx="10" cy="10" r="2" fill="#2563EB" fillOpacity="0.4"/>
                  </svg>
                </div>
                {/* Urgency pill */}
                {urgencyText ? (
                  <div style={{
                    backgroundColor: urgencyBg, color: "#FFF",
                    padding: "4px 12px", borderRadius: "20px",
                    fontSize: "12px", fontWeight: 800, letterSpacing: "0.3px",
                  }}>{urgencyText}</div>
                ) : null}
              </div>

              {/* Row 2: Overline pill */}
              <div style={{
                display: "flex", alignSelf: "flex-start",
                backgroundColor: accentDim, color: "#FFF",
                padding: "3px 14px", borderRadius: "20px",
                fontSize: "11px", fontWeight: 800, letterSpacing: "3px",
                marginBottom: "7px",
              }}>
                {baseTheme.overline}
              </div>

              {/* Row 3: Org name — giant adaptive */}
              <div style={{
                fontSize: `${orgFs}px`, fontWeight: 900,
                color: "#FFFFFF", lineHeight: "1.0",
                letterSpacing: orgFs > 55 ? "-1.5px" : "-0.5px",
                textShadow: `0 0 50px ${accent}70`,
                marginBottom: "3px",
              }}>
                {org}
              </div>

              {/* Row 4: Post line — accent colour */}
              <div style={{
                fontSize: `${postFs}px`, fontWeight: 900,
                color: accent, letterSpacing: "-0.3px",
                textShadow: `0 0 30px ${accent}55`,
                marginBottom: "8px", lineHeight: "1.15",
              }}>
                {postLine}
              </div>

              {/* Row 5: Type pill + Vacancy burst */}
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
                <div style={{
                  backgroundColor: "#FFFFFF", color: "#0F172A",
                  padding: "5px 13px", borderRadius: "8px",
                  fontSize: "13px", fontWeight: 900, letterSpacing: "0.2px",
                }}>
                  {postTypePill}
                </div>
                {vacancyDisplay ? (
                  <div style={{
                    backgroundColor: "#DC2626", color: "#FFF",
                    padding: "5px 12px", borderRadius: "8px",
                    fontSize: "13px", fontWeight: 900,
                    border: `2px solid ${accent}`,
                    boxShadow: "0 3px 12px rgba(220,38,38,0.5)",
                    transform: "rotate(3deg)",
                  }}>
                    {vacancyDisplay}
                  </div>
                ) : null}
              </div>

              {/* Row 6: Dynamic info chips (show only available) */}
              {displayChips.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: "7px", marginBottom: "9px" }}>
                  {displayChips.map((chip, i) => (
                    <div key={i} style={{
                      backgroundColor: "rgba(255,255,255,0.07)",
                      border: `1px solid ${accent}45`,
                      borderRadius: "8px",
                      padding: "5px 11px",
                      display: "flex", flexDirection: "column",
                      minWidth: "110px", maxWidth: "180px",
                    }}>
                      <span style={{ fontSize: "8px", color: "rgba(255,255,255,0.5)", fontWeight: 800, letterSpacing: "1.5px" }}>
                        {chip.label}
                      </span>
                      <span style={{ fontSize: "12px", color: "#FFF", fontWeight: 800, marginTop: "1px" }}>
                        {chip.value}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Row 7: Status pills (apply status + qual + free) */}
              <div style={{ display: "flex", alignItems: "center", gap: "7px" }}>
                {statusChip.text ? (
                  <div style={{
                    backgroundColor: statusChip.bg, color: "#FFF",
                    padding: "4px 11px", borderRadius: "20px",
                    fontSize: "11px", fontWeight: 800,
                  }}>{statusChip.text}</div>
                ) : null}
                {qualLabel ? (
                  <div style={{
                    backgroundColor: "rgba(255,255,255,0.09)",
                    border: "1px solid rgba(255,255,255,0.2)",
                    color: "#FFF", padding: "4px 11px",
                    borderRadius: "20px", fontSize: "11px", fontWeight: 700,
                  }}>🎓 {qualLabel}</div>
                ) : null}
                {isFree && feeRaw ? (
                  <div style={{
                    backgroundColor: "#166534", color: "#FFF",
                    padding: "4px 11px", borderRadius: "20px",
                    fontSize: "11px", fontWeight: 800,
                  }}>💸 NO FEE</div>
                ) : null}
              </div>
            </div>

            {/* ════ RIGHT PANEL 32% ════ */}
            <div style={{
              width: "32%",
              display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "space-between",
              borderLeft: `2px solid ${accent}50`,
              padding: "22px 18px",
              background: "rgba(0,0,0,0.22)",
            }}>
              {/* State / All India badge — top-right */}
              <div style={{
                backgroundColor: stateName ? "#c2410c" : "#1d4ed8",
                color: "#FFF",
                padding: "5px 14px", borderRadius: "20px",
                fontSize: "13px", fontWeight: 900, letterSpacing: "0.8px",
                alignSelf: "flex-end",
              }}>
                {stateName || "ALL INDIA"}
              </div>

              {/* Category icon box */}
              <div style={{
                width: "108px", height: "108px",
                background: `linear-gradient(140deg, ${accentDim}25, ${accent}18)`,
                border: `2px solid ${accent}`,
                borderRadius: "18px",
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: `0 6px 24px ${accent}35`,
              }}>
                <span style={{ fontSize: "52px" }}>{icon}</span>
              </div>

              {/* Date cards — dynamic, shown only if data present */}
              <div style={{ display: "flex", flexDirection: "column", gap: "7px", width: "100%" }}>
                {startDate ? (
                  <div style={{
                    backgroundColor: "rgba(255,255,255,0.07)",
                    border: "1px solid rgba(255,255,255,0.13)",
                    borderRadius: "10px", padding: "7px 11px", width: "100%",
                  }}>
                    <div style={{ fontSize: "8px", color: "rgba(255,255,255,0.45)", fontWeight: 800, letterSpacing: "1px" }}>START DATE</div>
                    <div style={{ fontSize: "12px", color: "#FFF", fontWeight: 800, marginTop: "2px" }}>{startDate}</div>
                  </div>
                ) : null}
                {lastDate ? (
                  <div style={{
                    backgroundColor: daysLeft !== null && daysLeft <= 7 ? "rgba(220,38,38,0.18)" : "rgba(255,255,255,0.07)",
                    border: daysLeft !== null && daysLeft <= 7 ? "1px solid rgba(220,38,38,0.55)" : "1px solid rgba(255,255,255,0.13)",
                    borderRadius: "10px", padding: "7px 11px", width: "100%",
                  }}>
                    <div style={{ fontSize: "8px", color: "rgba(255,255,255,0.45)", fontWeight: 800, letterSpacing: "1px" }}>LAST DATE</div>
                    <div style={{
                      fontSize: "12px", fontWeight: 900, marginTop: "2px",
                      color: daysLeft !== null && daysLeft <= 7 ? "#f87171" : "#FFF",
                    }}>{lastDate}</div>
                  </div>
                ) : null}

                {/* Site branding */}
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginTop: "4px" }}>
                  <span style={{ fontSize: "11px", color: accent, fontWeight: 800, letterSpacing: "0.3px" }}>
                    www.rojgarsuvidha.com
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* ════ BOTTOM CTA RIBBON — dynamic text ════ */}
          <div style={{ display: "flex", width: "100%", height: "52px", position: "relative", zIndex: 1 }}>
            <div style={{
              flex: "0 0 57%",
              backgroundColor: "rgba(5,10,30,0.95)",
              borderTop: `2px solid ${accent}30`,
              display: "flex", alignItems: "center",
              paddingLeft: "34px",
            }}>
              <span style={{ fontSize: "19px", fontWeight: 900, color: "#FFF", letterSpacing: "0.4px" }}>
                {ctaLeft}
              </span>
            </div>
            <div style={{
              flex: "0 0 43%",
              backgroundColor: accent,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <span style={{ fontSize: "19px", fontWeight: 900, color: "#FFF", letterSpacing: "0.2px" }}>
                {ctaRight}
              </span>
            </div>
          </div>
        </div>
      ),
      { width: 1200, height: 630 }
    );
  } catch (err: any) {
    return new Response(`Banner render error: ${err.message}`, { status: 500 });
  }
}
