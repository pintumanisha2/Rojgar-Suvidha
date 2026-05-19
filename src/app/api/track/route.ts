import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      page, source, browser, os, device_type, screen_res,
      session_id, user_type, referrer, event,
      time_on_page, scroll_depth
    } = body;

    const userAgent = req.headers.get("user-agent") || "";
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0] ||
               req.headers.get("x-real-ip") || "unknown";
    const ipHash = Buffer.from(ip).toString("base64").slice(0, 16);

    if (event === "exit") {
      // Update existing pageview record with exit data
      await supabase
        .from("analytics")
        .update({ time_on_page, scroll_depth })
        .eq("session_id", session_id)
        .eq("page", page)
        .eq("event", "pageview");
    } else {
      await supabase.from("analytics").insert({
        page: page || "/",
        source: source || "web",
        browser: browser || "Other",
        os: os || "Other",
        device_type: device_type || "Desktop",
        screen_res: screen_res || null,
        session_id: session_id || null,
        user_type: user_type || "new",
        user_agent: userAgent,
        ip_hash: ipHash,
        referrer: referrer || null,
        event: event || "pageview",
        created_at: new Date().toISOString(),
      });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}

