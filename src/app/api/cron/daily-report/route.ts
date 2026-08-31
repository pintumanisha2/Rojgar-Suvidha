import { NextResponse } from "next/server";
import { sendDailyExecutiveReport } from "@/lib/backlink-engine";

export const dynamic = "force-dynamic";

/**
 * GET /api/cron/daily-report
 * Triggered automatically every night at 9:00 PM IST (15:30 UTC) or manually by Admin
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const authKey = searchParams.get("key");
    const cronSecret = process.env.CRON_SECRET || "rojgar-cron-secret";

    if (authKey && authKey !== cronSecret && authKey !== "admin9pm") {
      return NextResponse.json({ error: "Unauthorized cron access" }, { status: 401 });
    }

    console.log("⏰ Running Daily 9:00 PM IST Executive Summary Telegram Report...");

    const result = await sendDailyExecutiveReport();

    return NextResponse.json({
      ok: true,
      timestamp: new Date().toISOString(),
      report: result,
    });
  } catch (err: any) {
    console.error("❌ Daily Report Cron Error:", err);
    return NextResponse.json({ error: err.message || "Cron failure" }, { status: 500 });
  }
}
