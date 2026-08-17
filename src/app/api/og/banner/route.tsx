import { ImageResponse } from "next/og";

export const runtime = "edge";

const CATEGORY_STYLES: Record<string, { bg: string; badgeBg: string; text: string; label: string }> = {
  "latest-jobs": {
    bg: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #312e81 100%)",
    badgeBg: "#4f46e5",
    text: "#ffffff",
    label: "💼 LATEST JOBS",
  },
  results: {
    bg: "linear-gradient(135deg, #064e3b 0%, #065f46 50%, #047857 100%)",
    badgeBg: "#10b981",
    text: "#ffffff",
    label: "🏆 SARKARI RESULT",
  },
  "admit-card": {
    bg: "linear-gradient(135deg, #7c2d12 0%, #9a3412 50%, #c2410c 100%)",
    badgeBg: "#f97316",
    text: "#ffffff",
    label: "🪪 ADMIT CARD",
  },
  "answer-key": {
    bg: "linear-gradient(135deg, #881337 0%, #9f1239 50%, #be123c 100%)",
    badgeBg: "#f43f5e",
    text: "#ffffff",
    label: "📋 ANSWER KEY",
  },
  admission: {
    bg: "linear-gradient(135deg, #4c1d95 0%, #5b21b6 50%, #6d28d9 100%)",
    badgeBg: "#8b5cf6",
    text: "#ffffff",
    label: "🎓 ADMISSION",
  },
  news: {
    bg: "linear-gradient(135deg, #1e3a8a 0%, #1d4ed8 50%, #2563eb 100%)",
    badgeBg: "#3b82f6",
    text: "#ffffff",
    label: "📰 NEWS UPDATE",
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

    // Clean title for display
    const title = rawTitle.slice(0, 90);
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
            padding: "48px 56px",
            background: catStyle.bg,
            fontFamily: "sans-serif",
            color: "#ffffff",
            position: "relative",
          }}
        >
          {/* Top Header Bar */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              width: "100%",
            }}
          >
            {/* Brand Logo & Name */}
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div
                style={{
                  background: "#ffffff",
                  color: "#4f46e5",
                  fontWeight: 900,
                  fontSize: "22px",
                  padding: "8px 16px",
                  borderRadius: "12px",
                  boxShadow: "0 4px 14px rgba(0,0,0,0.3)",
                }}
              >
                RS
              </div>
              <div style={{ display: "flex", flexDirection: "column" }}>
                <span style={{ fontSize: "24px", fontWeight: 900, letterSpacing: "-0.5px" }}>
                  Rojgar Suvidha
                </span>
                <span style={{ fontSize: "12px", color: "#a5b4fc", fontWeight: 600 }}>
                  100% Verified Sarkari Portal
                </span>
              </div>
            </div>

            {/* Category Badge */}
            <div
              style={{
                background: catStyle.badgeBg,
                color: "#ffffff",
                fontSize: "14px",
                fontWeight: 800,
                padding: "8px 20px",
                borderRadius: "30px",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
                boxShadow: "0 4px 12px rgba(0,0,0,0.25)",
              }}
            >
              {catStyle.label}
            </div>
          </div>

          {/* Center Main Title */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "12px",
              margin: "24px 0",
            }}
          >
            <h1
              style={{
                fontSize: title.length > 60 ? "36px" : "44px",
                fontWeight: 900,
                lineHeight: 1.2,
                color: "#ffffff",
                margin: 0,
                textShadow: "0 2px 10px rgba(0,0,0,0.4)",
              }}
            >
              {title}
            </h1>
          </div>

          {/* Bottom Badges + Footer CTA */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              width: "100%",
              borderTop: "1px solid rgba(255,255,255,0.15)",
              paddingTop: "24px",
            }}
          >
            {/* Metadata Pill Badges */}
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              {posts && (
                <div
                  style={{
                    background: "rgba(255,255,255,0.15)",
                    border: "1px solid rgba(255,255,255,0.3)",
                    padding: "8px 16px",
                    borderRadius: "10px",
                    fontSize: "14px",
                    fontWeight: 700,
                    color: "#fef08a",
                  }}
                >
                  👥 {posts}
                </div>
              )}
              {lastDate && (
                <div
                  style={{
                    background: "rgba(255,255,255,0.15)",
                    border: "1px solid rgba(255,255,255,0.3)",
                    padding: "8px 16px",
                    borderRadius: "10px",
                    fontSize: "14px",
                    fontWeight: 700,
                    color: "#fca5a5",
                  }}
                >
                  📅 Last Date: {lastDate}
                </div>
              )}
              {state && state !== "ALL" && (
                <div
                  style={{
                    background: "rgba(255,255,255,0.15)",
                    border: "1px solid rgba(255,255,255,0.3)",
                    padding: "8px 16px",
                    borderRadius: "10px",
                    fontSize: "14px",
                    fontWeight: 700,
                    color: "#93c5fd",
                  }}
                >
                  🏛️ State: {state}
                </div>
              )}
            </div>

            {/* Website URL Callout */}
            <div
              style={{
                fontSize: "15px",
                fontWeight: 800,
                color: "#e0e7ff",
                background: "rgba(0,0,0,0.3)",
                padding: "8px 18px",
                borderRadius: "10px",
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
