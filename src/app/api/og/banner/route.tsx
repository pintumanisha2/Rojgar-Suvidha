import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export const runtime = "edge";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const title = searchParams.get("title") || "Sarkari Naukri Notification 2026";
    const category = (searchParams.get("category") || "latest-jobs").toLowerCase();
    const vacancies = searchParams.get("vacancies") || searchParams.get("posts") || "";
    const startDate = searchParams.get("startDate") || "";
    const lastDate = searchParams.get("lastDate") || "";
    const qualification = searchParams.get("qualification") || searchParams.get("eligibility") || "";
    const state = (searchParams.get("state") || "").toUpperCase();
    const orgName = searchParams.get("orgName") || "";

    // Detect Organization Type for Badge Icon
    const cleanT = (title + " " + orgName).toLowerCase();
    let orgBadge = "🏢 SARKARI PORTAL";
    if (cleanT.includes("police") || cleanT.includes("constable") || cleanT.includes("lokrakshak") || cleanT.includes("si ")) {
      orgBadge = "🛡️ POLICE BHARTI";
    } else if (cleanT.includes("railway") || cleanT.includes("rrb") || cleanT.includes("ntpc") || cleanT.includes("alp")) {
      orgBadge = "🚆 RAILWAY BHARTI";
    } else if (cleanT.includes("post") || cleanT.includes("gds") || cleanT.includes("post office")) {
      orgBadge = "📮 INDIA POST BHARTI";
    } else if (cleanT.includes("bank") || cleanT.includes("sbi") || cleanT.includes("ibps") || cleanT.includes("rbi")) {
      orgBadge = "🏦 BANKING BHARTI";
    } else if (cleanT.includes("isro") || cleanT.includes("drdo") || cleanT.includes("scientist")) {
      orgBadge = "🚀 ISRO / DRDO BHARTI";
    } else if (cleanT.includes("army") || cleanT.includes("navy") || cleanT.includes("defence") || cleanT.includes("nda")) {
      orgBadge = "⚔️ DEFENCE BHARTI";
    } else if (cleanT.includes("upsc") || cleanT.includes("ssc") || cleanT.includes("psc")) {
      orgBadge = "🏛️ CENTRAL / STATE PSC";
    }

    const formattedCategory = category
      .replace(/-/g, " ")
      .replace("latest jobs", "SARKARI BHARTI 2026")
      .replace("results", "SARKARI RESULT OUT")
      .replace("admit card", "ADMIT CARD RELEASED")
      .replace("answer key", "ANSWER KEY RELEASED")
      .replace("admission", "ADMISSION 2026")
      .toUpperCase();

    // 6 Master High-CTR Category Themes
    const theme = category.includes("result")
      ? { bg: "linear-gradient(135deg, #022c22 0%, #065f46 50%, #047857 100%)", badgeBg: "#10b981", accent: "#34d399", label: "🏆 SARKARI RESULT" }
      : category.includes("admit")
      ? { bg: "linear-gradient(135deg, #451a03 0%, #9a3412 50%, #c2410c 100%)", badgeBg: "#f97316", accent: "#fb923c", label: "🪪 OFFICIAL ADMIT CARD" }
      : category.includes("answer")
      ? { bg: "linear-gradient(135deg, #4c0519 0%, #881337 50%, #be123c 100%)", badgeBg: "#f43f5e", accent: "#fb7185", label: "📋 OFFICIAL ANSWER KEY" }
      : category.includes("admission")
      ? { bg: "linear-gradient(135deg, #2e1065 0%, #581c87 50%, #6b21a8 100%)", badgeBg: "#a855f7", accent: "#c084fc", label: "🎓 ADMISSION 2026" }
      : category.includes("news")
      ? { bg: "linear-gradient(135deg, #0c4a6e 0%, #0369a1 50%, #0284c7 100%)", badgeBg: "#0ea5e9", accent: "#38bdf8", label: "📰 SARKARI NEWS UPDATE" }
      : { bg: "linear-gradient(135deg, #090d16 0%, #1e1b4b 50%, #312e81 100%)", badgeBg: "#4f46e5", accent: "#fbbf24", label: "💼 LATEST SARKARI JOB" };

    // Adaptive 4-Metric Grid Configuration
    let card1Label = "TOTAL VACANCIES";
    let card1Val = vacancies ? `${vacancies} Posts` : "Notification Out";
    let card1Color = theme.accent;

    let card2Label = "START DATE";
    let card2Val = startDate || "Online / Offline";
    let card2Color = "#38BDF8";

    let card3Label = "LAST DATE";
    let card3Val = lastDate || "Check Notice";
    let card3Color = "#F43F5E";

    let card4Label = "ELIGIBILITY";
    let card4Val = qualification || (state && state !== "ALL" ? `${state} Govt` : "10th/12th/Graduate");
    let card4Color = "#A7F3D0";

    if (category.includes("result")) {
      card1Label = "RESULT STATUS"; card1Val = "Declared / Scorecard"; card1Color = "#34D399";
      card2Label = "RESULT DATE"; card2Val = lastDate || "Today Live"; card2Color = "#FDE047";
      card3Label = "MERIT LIST"; card3Val = "PDF Available"; card3Color = "#60A5FA";
      card4Label = "VACANCIES"; card4Val = vacancies ? `${vacancies} Posts` : "All Candidates"; card4Color = "#C084FC";
    } else if (category.includes("admit")) {
      card1Label = "ADMIT CARD"; card1Val = "Download Live"; card1Color = "#FB923C";
      card2Label = "EXAM DATE"; card2Val = lastDate || "Check Notification"; card2Color = "#FDE047";
      card3Label = "HALL TICKET"; card3Val = "Direct Link"; card3Color = "#34D399";
      card4Label = "EXAM SHIFT"; card4Val = "Shift Wise"; card4Color = "#E879F9";
    }

    return new ImageResponse(
      (
        <div
          style={{
            height: "100%",
            width: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
            justifyContent: "space-between",
            background: theme.bg,
            padding: "44px 52px",
            fontFamily: "sans-serif",
            color: "#FFFFFF",
            position: "relative",
          }}
        >
          {/* Top Bar: Category Pill + Org Badge + State Badge + Verified Seal */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px", width: "100%", flexWrap: "nowrap" }}>
            <div
              style={{
                backgroundColor: theme.badgeBg,
                color: "#FFFFFF",
                padding: "8px 20px",
                borderRadius: "24px",
                fontSize: "16px",
                fontWeight: 900,
                letterSpacing: "0.8px",
                boxShadow: "0 4px 14px rgba(0,0,0,0.3)",
              }}
            >
              {formattedCategory}
            </div>

            <div
              style={{
                backgroundColor: "rgba(255,255,255,0.15)",
                color: "#FFFFFF",
                padding: "8px 18px",
                borderRadius: "24px",
                fontSize: "15px",
                fontWeight: 800,
                border: "1px solid rgba(255,255,255,0.25)",
              }}
            >
              {orgBadge}
            </div>

            {state && state !== "ALL" && (
              <div
                style={{
                  backgroundColor: "rgba(255,255,255,0.15)",
                  color: "#FFFFFF",
                  padding: "8px 16px",
                  borderRadius: "24px",
                  fontSize: "15px",
                  fontWeight: 800,
                  border: "1px solid rgba(255,255,255,0.25)",
                }}
              >
                📍 {state}
              </div>
            )}

            <div
              style={{
                backgroundColor: "rgba(234, 179, 8, 0.25)",
                color: "#FDE047",
                padding: "8px 18px",
                borderRadius: "24px",
                fontSize: "14px",
                fontWeight: 800,
                border: "1px solid rgba(234, 179, 8, 0.4)",
                marginLeft: "auto",
              }}
            >
              🏅 100% VERIFIED SARKARI UPDATE
            </div>
          </div>

          {/* Main Title Box */}
          <div style={{ display: "flex", flexDirection: "column", gap: "8px", width: "100%", margin: "16px 0" }}>
            <div
              style={{
                fontSize: title.length > 70 ? "30px" : title.length > 45 ? "35px" : "40px",
                fontWeight: 900,
                lineHeight: "1.25",
                color: "#FFFFFF",
                textShadow: "0 4px 18px rgba(0,0,0,0.6)",
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
                wordBreak: "break-word",
              }}
            >
              {title}
            </div>
          </div>

          {/* 4 Glassmorphic Fact Metric Cards (Graphic Designer Grid) */}
          <div style={{ display: "flex", gap: "16px", width: "100%", marginBottom: "16px" }}>
            {/* Card 1 */}
            <div
              style={{
                flex: 1,
                backgroundColor: "rgba(255, 255, 255, 0.08)",
                border: "1px solid rgba(255, 255, 255, 0.18)",
                borderRadius: "16px",
                padding: "12px 16px",
                display: "flex",
                flexDirection: "column",
                gap: "4px",
              }}
            >
              <span style={{ fontSize: "11px", color: "#94A3B8", fontWeight: 800, letterSpacing: "0.5px" }}>
                {card1Label}
              </span>
              <span style={{ fontSize: "18px", fontWeight: 900, color: card1Color }}>
                {card1Val}
              </span>
            </div>

            {/* Card 2 */}
            <div
              style={{
                flex: 1,
                backgroundColor: "rgba(255, 255, 255, 0.08)",
                border: "1px solid rgba(255, 255, 255, 0.18)",
                borderRadius: "16px",
                padding: "12px 16px",
                display: "flex",
                flexDirection: "column",
                gap: "4px",
              }}
            >
              <span style={{ fontSize: "11px", color: "#94A3B8", fontWeight: 800, letterSpacing: "0.5px" }}>
                {card2Label}
              </span>
              <span style={{ fontSize: "18px", fontWeight: 900, color: card2Color }}>
                {card2Val}
              </span>
            </div>

            {/* Card 3 */}
            <div
              style={{
                flex: 1,
                backgroundColor: "rgba(255, 255, 255, 0.08)",
                border: "1px solid rgba(255, 255, 255, 0.18)",
                borderRadius: "16px",
                padding: "12px 16px",
                display: "flex",
                flexDirection: "column",
                gap: "4px",
              }}
            >
              <span style={{ fontSize: "11px", color: "#94A3B8", fontWeight: 800, letterSpacing: "0.5px" }}>
                {card3Label}
              </span>
              <span style={{ fontSize: "18px", fontWeight: 900, color: card3Color }}>
                {card3Val}
              </span>
            </div>

            {/* Card 4 */}
            <div
              style={{
                flex: 1,
                backgroundColor: "rgba(255, 255, 255, 0.08)",
                border: "1px solid rgba(255, 255, 255, 0.18)",
                borderRadius: "16px",
                padding: "12px 16px",
                display: "flex",
                flexDirection: "column",
                gap: "4px",
              }}
            >
              <span style={{ fontSize: "11px", color: "#94A3B8", fontWeight: 800, letterSpacing: "0.5px" }}>
                {card4Label}
              </span>
              <span style={{ fontSize: "18px", fontWeight: 900, color: card4Color }}>
                {card4Val}
              </span>
            </div>
          </div>

          {/* Footer Highlights & Branding */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              width: "100%",
              borderTop: "1.5px solid rgba(255,255,255,0.18)",
              paddingTop: "16px",
            }}
          >
            <div style={{ fontSize: "14px", fontWeight: 800, color: "#CBD5E1" }}>
              ⚡ Updated Live on Official Portal • Rojgar Suvidha
            </div>

            {/* Site Branding Seal */}
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div
                style={{
                  width: "42px",
                  height: "42px",
                  borderRadius: "12px",
                  backgroundColor: "#4F46E5",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "22px",
                  fontWeight: 900,
                  color: "#FFFFFF",
                  boxShadow: "0 4px 14px rgba(79,70,229,0.5)",
                }}
              >
                RS
              </div>
              <div style={{ display: "flex", flexDirection: "column" }}>
                <span style={{ fontSize: "20px", fontWeight: 900, color: "#FFFFFF", letterSpacing: "0.5px" }}>
                  ROJGAR SUVIDHA
                </span>
                <span style={{ fontSize: "12px", color: "#818CF8", fontWeight: 700 }}>
                  www.rojgarsuvidha.com
                </span>
              </div>
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
    return new Response(`Failed to generate OG banner: ${err.message}`, { status: 500 });
  }
}
