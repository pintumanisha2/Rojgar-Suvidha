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
    const salary = searchParams.get("salary") || searchParams.get("salaryText") || "";
    const ageLimit = searchParams.get("ageLimit") || searchParams.get("ageText") || "";
    const location = searchParams.get("location") || searchParams.get("state") || "";
    const selection = searchParams.get("selection") || searchParams.get("selectionText") || "";
    const subheading = searchParams.get("subheading") || searchParams.get("postName") || "";
    const orgName = searchParams.get("orgName") || "";

    // Extract Organization & Post Subject
    const cleanT = (title + " " + orgName).toUpperCase();
    let displayOrg = "SARKARI NAUKRI";
    if (cleanT.includes("INDIA POST") || cleanT.includes("GDS") || cleanT.includes("POST OFFICE")) {
      displayOrg = "INDIA POST";
    } else if (cleanT.includes("BANK OF BARODA") || cleanT.includes("BOB ")) {
      displayOrg = "BANK OF BARODA";
    } else if (cleanT.includes("UCO BANK")) {
      displayOrg = "UCO BANK";
    } else if (cleanT.includes("SBI") || cleanT.includes("STATE BANK")) {
      displayOrg = "STATE BANK OF INDIA";
    } else if (cleanT.includes("POLICE") || cleanT.includes("UP POLICE")) {
      displayOrg = "POLICE DEPARTMENT";
    } else if (cleanT.includes("RAILWAY") || cleanT.includes("RRB")) {
      displayOrg = "INDIAN RAILWAYS";
    } else if (cleanT.includes("SSC")) {
      displayOrg = "STAFF SELECTION COMMISSION";
    } else if (cleanT.includes("UPSC")) {
      displayOrg = "UPSC COMMISSION";
    } else {
      const words = cleanT.split(" ");
      displayOrg = words.slice(0, 3).join(" ");
    }

    let displaySub = subheading;
    if (!displaySub) {
      if (cleanT.includes("GDS") || cleanT.includes("DAK SEVAK")) displaySub = "GRAMIN DAK SEVAK POSTS";
      else if (cleanT.includes("LBO") || cleanT.includes("LOCAL BANK")) displaySub = "LOCAL BANK OFFICER";
      else if (cleanT.includes("MANAGER")) displaySub = "MANAGER VACANCIES";
      else if (cleanT.includes("CONSTABLE")) displaySub = "CONSTABLE & SI RECRUITMENT";
      else if (cleanT.includes("NTPC")) displaySub = "NON-TECHNICAL POPULAR CATEGORY";
      else displaySub = "OFFICIAL NOTIFICATION RELEASED";
    }

    const defaultSalary = salary || (cleanT.includes("GDS") ? "₹10,000 TO ₹29,380" : cleanT.includes("BANK") ? "₹48,480 TO ₹85,920" : "as per rules");
    const defaultAge = ageLimit || (cleanT.includes("GDS") ? "18 TO 40 YEARS" : "18 TO 30 YEARS");
    const defaultLocation = location && location !== "ALL" ? location : "ACROSS INDIA";
    const defaultSelection = selection || (cleanT.includes("GDS") ? "10th MERIT LIST" : "ONLINE TEST + INTERVIEW");

    return new ImageResponse(
      (
        <div
          style={{
            height: "100%",
            width: "100%",
            display: "flex",
            flexDirection: "row",
            alignItems: "stretch",
            justifyContent: "space-between",
            background: "linear-gradient(135deg, #060913 0%, #0f172a 40%, #1e1b4b 100%)",
            fontFamily: "sans-serif",
            color: "#FFFFFF",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* LEFT PANEL (65% Width) — Typography & Dynamic Chips */}
          <div
            style={{
              width: "65%",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              padding: "36px 40px 0px 44px",
              position: "relative",
              zIndex: 10,
            }}
          >
            {/* Main Header Typography */}
            <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
              <div
                style={{
                  fontSize: displayOrg.length > 20 ? "34px" : "44px",
                  fontWeight: 900,
                  color: "#FFFFFF",
                  letterSpacing: "1px",
                  textShadow: "0 4px 12px rgba(0,0,0,0.8)",
                  lineHeight: "1.1",
                }}
              >
                {displayOrg}
              </div>

              <div
                style={{
                  fontSize: "36px",
                  fontWeight: 900,
                  color: "#FACC15",
                  letterSpacing: "0.5px",
                  textShadow: "0 4px 12px rgba(0,0,0,0.8)",
                  lineHeight: "1.1",
                }}
              >
                RECRUITMENT 2026
              </div>

              {/* Subheading Badge Pill */}
              <div
                style={{
                  backgroundColor: "#FFFFFF",
                  color: "#0F172A",
                  padding: "6px 16px",
                  borderRadius: "8px",
                  fontSize: "18px",
                  fontWeight: 900,
                  letterSpacing: "0.5px",
                  alignSelf: "flex-start",
                  marginTop: "6px",
                  boxShadow: "0 4px 10px rgba(0,0,0,0.3)",
                }}
              >
                {displaySub}
              </div>
            </div>

            {/* Red Vacancies Pill */}
            {vacancies && (
              <div
                style={{
                  backgroundColor: "#DC2626",
                  color: "#FFFFFF",
                  padding: "8px 18px",
                  borderRadius: "12px",
                  fontSize: "24px",
                  fontWeight: 900,
                  border: "2px solid #FEF08A",
                  alignSelf: "flex-start",
                  margin: "8px 0",
                  boxShadow: "0 4px 14px rgba(220,38,38,0.5)",
                }}
              >
                🔥 {vacancies} VACANCIES / POSTS
              </div>
            )}

            {/* 4 Fact Metric Chips (Graphic Designer Pill Grid) */}
            <div style={{ display: "flex", flexDirection: "column", gap: "8px", width: "100%" }}>
              <div style={{ display: "flex", gap: "10px", width: "100%" }}>
                {/* Salary Chip */}
                <div
                  style={{
                    flex: 1,
                    backgroundColor: "#FFFFFF",
                    color: "#0F172A",
                    borderRadius: "10px",
                    padding: "8px 12px",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    border: "1.5px solid #CBD5E1",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
                  }}
                >
                  <span style={{ fontSize: "18px" }}>💰</span>
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    <span style={{ fontSize: "10px", color: "#64748B", fontWeight: 800 }}>SALARY</span>
                    <span style={{ fontSize: "13px", fontWeight: 900, color: "#DC2626" }}>{defaultSalary}</span>
                  </div>
                </div>

                {/* Age Limit Chip */}
                <div
                  style={{
                    flex: 1,
                    backgroundColor: "#FFFFFF",
                    color: "#0F172A",
                    borderRadius: "10px",
                    padding: "8px 12px",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    border: "1.5px solid #CBD5E1",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
                  }}
                >
                  <span style={{ fontSize: "18px" }}>🎂</span>
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    <span style={{ fontSize: "10px", color: "#64748B", fontWeight: 800 }}>AGE LIMIT</span>
                    <span style={{ fontSize: "13px", fontWeight: 900, color: "#0F172A" }}>{defaultAge}</span>
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", gap: "10px", width: "100%" }}>
                {/* Location Chip */}
                <div
                  style={{
                    flex: 1,
                    backgroundColor: "#FFFFFF",
                    color: "#0F172A",
                    borderRadius: "10px",
                    padding: "8px 12px",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    border: "1.5px solid #CBD5E1",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
                  }}
                >
                  <span style={{ fontSize: "18px" }}>📍</span>
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    <span style={{ fontSize: "10px", color: "#64748B", fontWeight: 800 }}>JOB LOCATION</span>
                    <span style={{ fontSize: "13px", fontWeight: 900, color: "#0F172A" }}>{defaultLocation}</span>
                  </div>
                </div>

                {/* Selection Chip */}
                <div
                  style={{
                    flex: 1,
                    backgroundColor: "#FFFFFF",
                    color: "#0F172A",
                    borderRadius: "10px",
                    padding: "8px 12px",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    border: "1.5px solid #CBD5E1",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
                  }}
                >
                  <span style={{ fontSize: "18px" }}>📝</span>
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    <span style={{ fontSize: "10px", color: "#64748B", fontWeight: 800 }}>SELECTION</span>
                    <span style={{ fontSize: "13px", fontWeight: 900, color: "#2563EB" }}>{defaultSelection}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom CTA Ribbon (Red Notification Out + Yellow Apply Now) */}
            <div style={{ display: "flex", width: "100%", height: "54px", marginTop: "12px" }}>
              <div
                style={{
                  backgroundColor: "#DC2626",
                  color: "#FFFFFF",
                  fontSize: "20px",
                  fontWeight: 900,
                  display: "flex",
                  alignItems: "center",
                  padding: "0 24px",
                  borderTopLeftRadius: "12px",
                  letterSpacing: "0.5px",
                }}
              >
                NOTIFICATION OUT
              </div>
              <div
                style={{
                  backgroundColor: "#FACC15",
                  color: "#0F172A",
                  fontSize: "22px",
                  fontWeight: 900,
                  display: "flex",
                  alignItems: "center",
                  padding: "0 28px",
                  borderTopRightRadius: "12px",
                  letterSpacing: "0.5px",
                  boxShadow: "0 -2px 10px rgba(250,204,21,0.4)",
                }}
              >
                APPLY NOW ➔
              </div>
            </div>
          </div>

          {/* RIGHT PANEL (35% Width) — Visual Card + Megaphone Sticker */}
          <div
            style={{
              width: "35%",
              height: "100%",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "space-between",
              background: "linear-gradient(180deg, #1e293b 0%, #0f172a 100%)",
              borderLeft: "3px solid #FACC15",
              padding: "28px 24px",
              position: "relative",
            }}
          >
            {/* Top Right Megaphone Burst Sticker */}
            <div
              style={{
                backgroundColor: "#DC2626",
                color: "#FFFFFF",
                padding: "10px 16px",
                borderRadius: "14px",
                fontSize: "15px",
                fontWeight: 900,
                textAlign: "center",
                border: "2px solid #FACC15",
                boxShadow: "0 4px 14px rgba(220,38,38,0.6)",
                transform: "rotate(3deg)",
              }}
            >
              📢 NOTIFICATION OUT!!!
            </div>

            {/* Central Organization Graphic Visual Emblem */}
            <div
              style={{
                width: "140px",
                height: "140px",
                borderRadius: "28px",
                backgroundColor: "#1E1B4B",
                border: "4px solid #FACC15",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px",
                boxShadow: "0 8px 24px rgba(0,0,0,0.6)",
              }}
            >
              <span style={{ fontSize: "48px" }}>
                {cleanT.includes("GDS") || cleanT.includes("POST") ? "📮" : cleanT.includes("BANK") ? "🏦" : cleanT.includes("POLICE") ? "🛡️" : cleanT.includes("RAILWAY") ? "🚆" : "🏛️"}
              </span>
              <span style={{ fontSize: "13px", fontWeight: 900, color: "#FFFFFF", textAlign: "center", padding: "0 6px" }}>
                {displayOrg.slice(0, 16)}
              </span>
            </div>

            {/* Site Branding Seal */}
            <div style={{ display: "flex", flexContent: "column", alignItems: "center", gap: "2px", textAlign: "center" }}>
              <span style={{ fontSize: "16px", fontWeight: 900, color: "#FFFFFF" }}>
                ROJGAR SUVIDHA
              </span>
              <span style={{ fontSize: "12px", color: "#FACC15", fontWeight: 800 }}>
                www.rojgarsuvidha.com
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
    return new Response(`Failed to generate OG banner: ${err.message}`, { status: 500 });
  }
}
