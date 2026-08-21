import { ImageResponse } from "next/og";

export const runtime = "edge";

const CATEGORY_STYLES: Record<string, { bg: string; badgeBg: string; text: string; label: string; accentColor: string }> = {
  "latest-jobs": {
    bg: "linear-gradient(135deg, #0b0f19 0%, #1e1b4b 50%, #0f172a 100%)",
    badgeBg: "linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)",
    text: "#ffffff",
    label: "💼 LATEST SARKARI JOB",
    accentColor: "#fbbf24",
  },
  results: {
    bg: "linear-gradient(135deg, #022c22 0%, #065f46 50%, #064e3b 100%)",
    badgeBg: "linear-gradient(135deg, #059669 0%, #10b981 100%)",
    text: "#ffffff",
    label: "🏆 SARKARI RESULT 2026",
    accentColor: "#34d399",
  },
  "admit-card": {
    bg: "linear-gradient(135deg, #451a03 0%, #9a3412 50%, #7c2d12 100%)",
    badgeBg: "linear-gradient(135deg, #ea580c 0%, #f97316 100%)",
    text: "#ffffff",
    label: "🪪 ADMIT CARD / HALL TICKET",
    accentColor: "#fb923c",
  },
  "answer-key": {
    bg: "linear-gradient(135deg, #4c0519 0%, #9f1239 50%, #881337 100%)",
    badgeBg: "linear-gradient(135deg, #e11d48 0%, #f43f5e 100%)",
    text: "#ffffff",
    label: "📋 OFFICIAL ANSWER KEY",
    accentColor: "#f472b6",
  },
  admission: {
    bg: "linear-gradient(135deg, #2e1065 0%, #5b21b6 50%, #4c1d95 100%)",
    badgeBg: "linear-gradient(135deg, #7c3aed 0%, #8b5cf6 100%)",
    text: "#ffffff",
    label: "🎓 ADMISSION & COUNSELING",
    accentColor: "#c084fc",
  },
  news: {
    bg: "linear-gradient(135deg, #172554 0%, #1d4ed8 50%, #1e3a8a 100%)",
    badgeBg: "linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)",
    text: "#ffffff",
    label: "📰 SARKARI NEWS UPDATE",
    accentColor: "#60a5fa",
  },
};

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const rawTitle = searchParams.get("title") || "Sarkari Naukri Notification 2026";
    const category = (searchParams.get("category") || "latest-jobs").toLowerCase();
    const posts = searchParams.get("posts") || "";
    const lastDate = searchParams.get("lastDate") || "";
    const state = searchParams.get("state") || "";

    // Clean title for high-impact display
    const title = rawTitle.replace(/\s+/g, " ").trim().slice(0, 85);
    const catStyle = CATEGORY_STYLES[category] || CATEGORY_STYLES["latest-jobs"];

    return new ImageResponse(
      (
        <div
          style={{
            height: "100%",
            width: "100%",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            padding: "40px 48px",
            background: catStyle.bg,
            fontFamily: "sans-serif",
            color: "#ffffff",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Decorative Grid Lines Background */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: "flex",
              opacity: 0.05,
              backgroundImage: "radial-gradient(#ffffff 1px, transparent 1px)",
              backgroundSize: "24px 24px",
            }}
          />

          {/* Top Decorative Glow */}
          <div
            style={{
              position: "absolute",
              top: "-100px",
              right: "-100px",
              width: "350px",
              height: "350px",
              borderRadius: "50%",
              background: catStyle.accentColor,
              opacity: 0.15,
              filter: "blur(60px)",
            }}
          />

          {/* ── Top Header Bar ── */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              width: "100%",
              zIndex: 10,
            }}
          >
            {/* Brand Logo & Tagline */}
            <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
              <div
                style={{
                  background: "linear-gradient(135deg, #6366f1, #4338ca)",
                  color: "#ffffff",
                  fontWeight: 900,
                  fontSize: "24px",
                  padding: "8px 16px",
                  borderRadius: "14px",
                  boxShadow: "0 6px 20px rgba(99,102,241,0.4)",
                  border: "1px solid rgba(255,255,255,0.2)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                RS
              </div>
              <div style={{ display: "flex", flexDirection: "column" }}>
                <span style={{ fontSize: "26px", fontWeight: 900, letterSpacing: "-0.5px", color: "#ffffff" }}>
                  Rojgar Suvidha
                </span>
                <span style={{ fontSize: "12px", color: "#a5b4fc", fontWeight: 700, letterSpacing: "0.5px" }}>
                  Official Govt Job Updates • 100% Verified
                </span>
              </div>
            </div>

            {/* Category Pill Badge */}
            <div
              style={{
                background: catStyle.badgeBg,
                color: "#ffffff",
                fontSize: "13px",
                fontWeight: 900,
                padding: "10px 22px",
                borderRadius: "30px",
                textTransform: "uppercase",
                letterSpacing: "1px",
                boxShadow: "0 4px 16px rgba(0,0,0,0.3)",
                border: "1px solid rgba(255,255,255,0.25)",
              }}
            >
              {catStyle.label}
            </div>
          </div>

          {/* ── Center Main Title Block ── */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "12px",
              margin: "20px 0",
              zIndex: 10,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                fontSize: "13px",
                fontWeight: 800,
                color: catStyle.accentColor,
                textTransform: "uppercase",
                letterSpacing: "1.5px",
              }}
            >
              ★ OFFICIAL NOTIFICATION RELEASED
            </div>
            <h1
              style={{
                fontSize: title.length > 60 ? "34px" : "42px",
                fontWeight: 900,
                lineHeight: 1.25,
                color: "#ffffff",
                margin: 0,
                letterSpacing: "-0.5px",
                textShadow: "0 4px 16px rgba(0,0,0,0.5)",
              }}
            >
              {title}
            </h1>
          </div>

          {/* ── Bottom Badges & Footer Bar ── */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              width: "100%",
              borderTop: "1px solid rgba(255,255,255,0.12)",
              paddingTop: "20px",
              zIndex: 10,
            }}
          >
            {/* Highlights Metadata Pills */}
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              {posts && (
                <div
                  style={{
                    background: "rgba(254,240,138,0.15)",
                    border: "1px solid rgba(254,240,138,0.4)",
                    padding: "8px 16px",
                    borderRadius: "12px",
                    fontSize: "13px",
                    fontWeight: 800,
                    color: "#fef08a",
                  }}
                >
                  VACANCIES: {posts}
                </div>
              )}
              {lastDate && (
                <div
                  style={{
                    background: "rgba(252,165,165,0.15)",
                    border: "1px solid rgba(252,165,165,0.4)",
                    padding: "8px 16px",
                    borderRadius: "12px",
                    fontSize: "13px",
                    fontWeight: 800,
                    color: "#fca5a5",
                  }}
                >
                  LAST DATE: {lastDate}
                </div>
              )}
              {state && state !== "ALL" && (
                <div
                  style={{
                    background: "rgba(147,197,253,0.15)",
                    border: "1px solid rgba(147,197,253,0.4)",
                    padding: "8px 16px",
                    borderRadius: "12px",
                    fontSize: "13px",
                    fontWeight: 800,
                    color: "#93c5fd",
                  }}
                >
                  STATE: {state}
                </div>
              )}
            </div>

            {/* Portal Domain Callout */}
            <div
              style={{
                fontSize: "14px",
                fontWeight: 900,
                color: "#ffffff",
                background: "rgba(255,255,255,0.1)",
                border: "1px solid rgba(255,255,255,0.2)",
                padding: "8px 20px",
                borderRadius: "12px",
                letterSpacing: "0.5px",
              }}
            >
              www.rojgarsuvidha.com
            </div>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  } catch (e: any) {
    return new Response(`Banner generation error: ${e.message}`, { status: 500 });
  }
}
