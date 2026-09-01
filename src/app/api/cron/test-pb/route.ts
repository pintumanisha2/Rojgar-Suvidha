import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const apiKey = (process.env.PASTEBIN_API_KEY || process.env.PASTEBIN_DEV_KEY || "").trim();

  if (!apiKey) {
    return NextResponse.json({
      ok: false,
      error: "PASTEBIN_API_KEY environment variable is NOT set in Vercel",
    });
  }

  const pasteCode = `
# CONCOR MT Recruitment 2026 Notification

Apply online for 77 Posts Assistant Officer.

Official Link: https://www.rojgarsuvidha.com/job/77-posts-concor-mt-assistant-officer-recruitment-2026-online-form-eligibility
Website: https://www.rojgarsuvidha.com
`.trim();

  try {
    const res = await fetch("https://pastebin.com/api/api_post.php", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": "RojgarSuvidhaBot/1.0",
      },
      body: new URLSearchParams({
        api_option: "paste",
        api_dev_key: apiKey,
        api_paste_code: pasteCode,
        api_paste_name: "CONCOR MT Recruitment 2026 — Rojgar Suvidha",
        api_paste_private: "0",
        api_paste_expire_date: "N",
        api_paste_format: "markdown",
      }).toString(),
    });

    const text = (await res.text()).trim();

    return NextResponse.json({
      ok: text.startsWith("http"),
      status: res.status,
      responseText: text,
      liveUrl: text.startsWith("http") ? text : null,
    });
  } catch (err: any) {
    return NextResponse.json({
      ok: false,
      error: err.message,
    });
  }
}
