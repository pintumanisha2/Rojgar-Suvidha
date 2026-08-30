import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export const runtime = "edge";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const title = searchParams.get("title") || "Sarkari Naukri Notification 2026";
    const category = (searchParams.get("category") || "latest-jobs").toLowerCase();
    const vacancies = searchParams.get("vacancies") || searchParams.get("posts") || "";
    const lastDate = searchParams.get("lastDate") || "";
    const state = (searchParams.get("state") || "").toUpperCase();

    const formattedCategory = category
      .replace(/-/g, " ")
      .replace("latest jobs", "SARKARI BHARTI 2026")
      .replace("results", "SARKARI RESULT OUT")
      .replace("admit card", "ADMIT CARD RELEASED")
      .replace("answer key", "ANSWER KEY RELEASED")
      .replace("admission", "ADMISSION 2026")
      .toUpperCase();

    // High-CTR Category Themes
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
            padding: "48px 56px",
            fontFamily: "sans-serif",
            color: "#FFFFFF",
            position: "relative",
          }}
        >
          {/* Header Badges */}
          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            <div
              style={{
                backgroundColor: theme.badgeBg,
                color: "#FFFFFF",
                padding: "8px 22px",
                borderRadius: "30px",
                fontSize: "18px",
                fontWeight: 800,
                letterSpacing: "1px",
                boxShadow: "0 4px 14px rgba(0,0,0,0.3)",
              }}
            >
              {formattedCategory}
            </div>
            {state && state !== "ALL" && (
              <div
                style={{
                  backgroundColor: "rgba(255,255,255,0.15)",
                  color: "#FFFFFF",
                  padding: "8px 18px",
                  borderRadius: "30px",
                  fontSize: "16px",
                  fontWeight: 700,
                  border: "1px solid rgba(255,255,255,0.2)",
                }}
              >
                📍 STATE: {state}
              </div>
            )}
            <div
              style={{
                backgroundColor: "rgba(234, 179, 8, 0.2)",
                color: "#FDE047",
                padding: "8px 18px",
                borderRadius: "30px",
                fontSize: "16px",
                fontWeight: 700,
                border: "1px solid rgba(234, 179, 8, 0.4)",
              }}
            >
              ⚡ VERIFIED NOTIFICATION 2026
            </div>
          </div>

          {/* Main Title Box */}
          <div style={{ display: "flex", flexDirection: "column", gap: "10px", width: "100%", margin: "20px 0" }}>
            <div
              style={{
                fontSize: title.length > 70 ? "32px" : title.length > 45 ? "38px" : "44px",
                fontWeight: 900,
                lineHeight: "1.25",
                color: "#FFFFFF",
                textShadow: "0 4px 20px rgba(0,0,0,0.6)",
                display: "-webkit-box",
                WebkitLineClamp: 3,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
                wordBreak: "break-word",
              }}
            >
              {title}
            </div>
          </div>

          {/* Footer Highlights & Branding */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              width: "100%",
              borderTop: "2px solid rgba(255,255,255,0.18)",
              paddingTop: "22px",
            }}
          >
            <div style={{ display: "flex", gap: "24px" }}>
              {vacancies && (
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <span style={{ fontSize: "13px", color: "#94A3B8", textTransform: "uppercase", fontWeight: 700 }}>Total Vacancies</span>
                  <span style={{ fontSize: "22px", fontWeight: 900, color: theme.accent }}>👥 {vacancies} Posts</span>
                </div>
              )}
              {lastDate && (
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <span style={{ fontSize: "13px", color: "#94A3B8", textTransform: "uppercase", fontWeight: 700 }}>Last Date to Apply</span>
                  <span style={{ fontSize: "22px", fontWeight: 900, color: "#F43F5E" }}>📅 {lastDate}</span>
                </div>
              )}
            </div>

            {/* Site Branding Seal */}
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div
                style={{
                  width: "46px",
                  height: "46px",
                  borderRadius: "14px",
                  backgroundColor: "#4F46E5",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "24px",
                  fontWeight: 900,
                  color: "#FFFFFF",
                  boxShadow: "0 4px 14px rgba(79,70,229,0.5)",
                }}
              >
                RS
              </div>
              <div style={{ display: "flex", flexDirection: "column" }}>
                <span style={{ fontSize: "22px", fontWeight: 900, color: "#FFFFFF", letterSpacing: "0.5px" }}>
                  ROJGAR SUVIDHA
                </span>
                <span style={{ fontSize: "13px", color: "#818CF8", fontWeight: 700 }}>
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
