import { NextResponse } from "next/server";
import { publishToWordPress } from "@/lib/backlink-publishers/wordpress";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const liveUrl = await publishToWordPress({
      jobId: "test-job-id",
      title: "CONCOR MT & Assistant Officer Recruitment 2026",
      slug: "77-posts-concor-mt-assistant-officer-recruitment-2026-online-form-eligibility",
      category: "latest-jobs",
    });

    return NextResponse.json({
      ok: !!liveUrl,
      liveUrl: liveUrl || null,
      env: {
        SITE_URL: process.env.WORDPRESS_SITE_URL?.trim(),
        USERNAME: process.env.WORDPRESS_USERNAME?.trim(),
        PASSWORD_present: !!process.env.WORDPRESS_APP_PASSWORD || !!process.env.WORDPRESS_PASSWORD,
      }
    });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message });
  }
}
