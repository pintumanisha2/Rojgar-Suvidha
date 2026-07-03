import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const { userId, action, path, metadata } = await req.json();

    if (!userId || !action) {
      return NextResponse.json({ error: "User ID and action are required." }, { status: 400 });
    }

    const { error } = await supabaseAdmin.from("user_activities").insert({
      user_id: userId,
      action,
      page_path: path || "",
      user_agent: req.headers.get("user-agent") || "",
      ip_address: req.headers.get("x-forwarded-for") || "",
      meta_data: metadata || {},
    });

    if (error) {
      console.error("Failed to insert activity log:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Track activity exception:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
