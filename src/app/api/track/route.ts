import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET handler: Check UPI payment status from DB
// Called by tracking page: GET /api/track?order_id=RS2A3B4C
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const orderId = searchParams.get("order_id");

    if (!orderId) {
      return NextResponse.json({ error: "order_id is required" }, { status: 400 });
    }

    // Check DB for payment status (UTR-based manual UPI system)
    const { data: request } = await supabaseAdmin
      .from("apply_for_me_requests")
      .select("status")
      .eq("tracking_id", orderId)
      .maybeSingle();

    if (!request) {
      // Also check user_applications table for Apply For Me orders
      const { data: app } = await supabaseAdmin
        .from("user_applications")
        .select("payment_status")
        .eq("tracking_id", orderId)
        .maybeSingle();

      if (app?.payment_status === "paid") return NextResponse.json({ order_status: "PAID", order_id: orderId });
      return NextResponse.json({ order_status: "PENDING", order_id: orderId });
    }

    if (request.status === "paid") return NextResponse.json({ order_status: "PAID", order_id: orderId });
    if (request.status === "pending_verification") return NextResponse.json({ order_status: "PENDING_VERIFICATION", order_id: orderId });
    if (request.status === "expired") return NextResponse.json({ order_status: "EXPIRED", order_id: orderId });
    return NextResponse.json({ order_status: "PENDING", order_id: orderId });

  } catch (err: any) {
    console.error("Track GET exception:", err);
    return NextResponse.json({ error: err.message, order_status: "UNKNOWN" }, { status: 500 });
  }
}



// POST handler: Analytics/activity logging
export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    // Support both formats: Pageview analytics vs User custom actions
    const userId = body.userId || body.session_id || "anonymous";
    const action = body.action || body.event || "pageview";
    const path   = body.path || body.page || "";
    
    // Extra metadata details
    const metadata = {
      browser: body.browser || null,
      os: body.os || null,
      device_type: body.device_type || null,
      screen_res: body.screen_res || null,
      user_type: body.user_type || null,
      referrer: body.referrer || null,
      time_on_page: body.time_on_page || null,
      scroll_depth: body.scroll_depth || null,
      ...(body.metadata || {})
    };

    const { error } = await supabaseAdmin.from("user_activities").insert({
      user_id: userId === "anonymous" ? null : userId,
      action,
      page_path: path,
      user_agent: req.headers.get("user-agent") || "",
      ip_address: req.headers.get("x-forwarded-for") || "",
      meta_data: metadata,
    });

    if (error) {
      console.warn("Failed to insert activity log (table user_activities might be missing):", error.message);
      return NextResponse.json({ success: false, warning: "Log table not configured" }, { status: 200 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.warn("Track activity exception caught, suppressing:", err.message);
    return NextResponse.json({ success: false, warning: err.message }, { status: 200 });
  }
}
