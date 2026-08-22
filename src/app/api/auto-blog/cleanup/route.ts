import { NextResponse } from "next/server";
import { cleanupStaleDrafts } from "@/lib/auto-blog-scraper";

export const dynamic = "force-dynamic";

/**
 * POST /api/auto-blog/cleanup
 * Deletes all unapproved auto blog drafts created >72 hours ago
 */
export async function POST() {
  try {
    const deletedCount = await cleanupStaleDrafts();
    return NextResponse.json({
      success: true,
      deletedCount,
      message: `Deleted ${deletedCount} unapproved drafts older than 72 hours.`,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
