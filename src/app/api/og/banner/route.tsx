import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export const runtime = "edge";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const title = searchParams.get("title") || "Sarkari Naukri Notification 2026";
    const category = (searchParams.get("category") || "Job Notification").toUpperCase();
    const vacancies = searchParams.get("vacancies") || searchParams.get("posts") || "";
    const lastDate = searchParams.get("lastDate") || "";
    const state = (searchParams.get("state") || "").toUpperCase();

    const formattedCategory = category
      .replace(/-/g, " ")
      .replace("LATEST JOBS", "SARKARI BHARTI")
      .replace("RESULTS", "SARKARI RESULT")
      .replace("ADMIT CARD", "ADMIT CARD OUT");

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
            background: "linear-gradient(135deg, #0F172A 0%, #1E293B 50%, #0284C7 100%)",
            padding: "50px 60px",
            fontFamily: "sans-serif",
            color: "#FFFFFF",
          }}
        >
          {/* Header Badges */}
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <div
              style={{
                backgroundColor: "#2563EB",
                color: "#FFFFFF",
                padding: "8px 20px",
                borderRadius: "30px",
                fontSize: "20px",
                fontWeight: 700,
                letterSpacing: "1px",
                boxShadow: "0 4px 12px rgba(37,99,235,0.4)",
              }}
            >
              {formattedCategory}
            </div>
            {state && (
              <div
                style={{
                  backgroundColor: "#059669",
                  color: "#FFFFFF",
                  padding: "8px 18px",
                  borderRadius: "30px",
                  fontSize: "18px",
                  fontWeight: 600,
                }}
              >
                📍 STATE: {state}
              </div>
            )}
            <div
              style={{
                backgroundColor: "rgba(255,255,255,0.15)",
                color: "#F8FAFC",
                padding: "8px 18px",
                borderRadius: "30px",
                fontSize: "18px",
                fontWeight: 600,
                backdropFilter: "blur(8px)",
              }}
            >
              ⚡ LIVE UPDATE
            </div>
          </div>

          {/* Main Title Box */}
          <div style={{ display: "flex", flexDirection: "column", gap: "12px", width: "100%" }}>
            <div
              style={{
                fontSize: title.length > 75 ? "30px" : title.length > 50 ? "34px" : title.length > 30 ? "40px" : "46px",
                fontWeight: 800,
                lineHeight: "1.3",
                color: "#FFFFFF",
                textShadow: "0 2px 10px rgba(0,0,0,0.5)",
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
              borderTop: "2px solid rgba(255,255,255,0.15)",
              paddingTop: "24px",
            }}
          >
            <div style={{ display: "flex", gap: "24px" }}>
              {vacancies && (
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <span style={{ fontSize: "14px", color: "#94A3B8", textTransform: "uppercase" }}>Total Vacancies</span>
                  <span style={{ fontSize: "22px", fontWeight: 700, color: "#38BDF8" }}>{vacancies} Posts</span>
                </div>
              )}
              {lastDate && (
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <span style={{ fontSize: "14px", color: "#94A3B8", textTransform: "uppercase" }}>Last Date to Apply</span>
                  <span style={{ fontSize: "22px", fontWeight: 700, color: "#F43F5E" }}>{lastDate}</span>
                </div>
              )}
            </div>

            {/* Site Branding Seal */}
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div
                style={{
                  width: "44px",
                  height: "44px",
                  borderRadius: "12px",
                  backgroundColor: "#2563EB",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "24px",
                  fontWeight: 900,
                  color: "#FFFFFF",
                }}
              >
                RS
              </div>
              <div style={{ display: "flex", flexDirection: "column" }}>
                <span style={{ fontSize: "22px", fontWeight: 800, color: "#FFFFFF", letterSpacing: "0.5px" }}>
                  ROJGAR SUVIDHA
                </span>
                <span style={{ fontSize: "14px", color: "#38BDF8", fontWeight: 600 }}>
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
