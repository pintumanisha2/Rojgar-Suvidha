import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ── Deterministic seed for a given date ───────────────────────────────────────
// Same date → same seed everywhere (consistent across all users/requests)
function getDailySeed(date: Date): number {
  const dateStr = date.toISOString().split("T")[0].replace(/-/g, ""); // "20250720"
  const n = parseInt(dateStr);
  // LCG pseudo-random — always same for same date
  const seed = ((n * 9301 + 49297) % 233280) / 233280;

  // Weekend vs weekday base
  const dayOfWeek = date.getDay();
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
  const baseMin = isWeekend ? 55000 : 72000;
  const baseMax = isWeekend ? 80000 : 105000;

  return Math.floor(baseMin + seed * (baseMax - baseMin));
}

// ── Seconds elapsed since midnight IST ────────────────────────────────────────
function getSecondsSinceMidnightIST(): number {
  // IST = UTC + 5:30
  const nowUTC = Date.now();
  const nowIST = nowUTC + 5.5 * 60 * 60 * 1000;
  const midnightIST = Math.floor(nowIST / (24 * 60 * 60 * 1000)) * 24 * 60 * 60 * 1000;
  return Math.floor((nowIST - midnightIST) / 1000);
}

// ── Per-second visitor rate (visitors added per second) ──────────────────────
// 1 visitor/second = 86,400/day incremental on top of seed
// This gives ~86,400 + seed (72,000–105,000) = 1.5L–1.9L total by end of day
const VISITOR_RATE_PER_SECOND = 1; // change to 0.5 for slower growth

// ── Apply For Me daily rate ───────────────────────────────────────────────────
// 1 apply per 60 seconds = 1440/day incremental on top of seed
const APPLY_RATE_PER_SECOND = 1 / 60;

export async function GET() {
  try {
    const now = new Date();
    const secondsSinceMidnight = getSecondsSinceMidnightIST();
    const dailySeed = getDailySeed(now);

    // Visitor count = seed + (seconds elapsed × rate)
    const visitorBase = dailySeed + Math.floor(secondsSinceMidnight * VISITOR_RATE_PER_SECOND);

    // Apply For Me daily seed (10% of visitors is very high — realistic is ~0.15%)
    const applyBase = Math.floor(dailySeed * 0.012) + Math.floor(secondsSinceMidnight * APPLY_RATE_PER_SECOND);

    // Try to add real data on top (graceful fallback if tables don't exist)
    let realVisitors = 0;
    let realApply = 0;

    try {
      const todayIST = now.toISOString().split("T")[0];
      const { data: statsRow } = await supabaseAdmin
        .from("site_daily_stats")
        .select("real_visitors, real_apply_for_me")
        .eq("stat_date", todayIST)
        .single();

      if (statsRow) {
        realVisitors = statsRow.real_visitors || 0;
        realApply = statsRow.real_apply_for_me || 0;
      }
    } catch {
      // Table doesn't exist yet — use seed only
    }

    return NextResponse.json(
      {
        // These are the "anchor" values at this moment in time
        visitorCount: visitorBase + realVisitors,
        applyForMeCount: applyBase + realApply,
        // Client uses these to continue live animation
        ratePerSecond: VISITOR_RATE_PER_SECOND,
        applyRatePerSecond: APPLY_RATE_PER_SECOND,
        // Timestamp so client can sync
        serverTime: Date.now(),
      },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
        },
      }
    );
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
