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

    // Check DB for payment status across both tables
    let status = "PENDING";
    let rejectionReason = "";
    let amountPaid = 0;

    const { data: request } = await supabaseAdmin
      .from("apply_for_me_requests")
      .select("status, payment_status, utr_rejection_reason, amount_paid")
      .eq("tracking_id", orderId)
      .maybeSingle();

    if (request) {
      status = (request.payment_status || request.status || "PENDING").toUpperCase();
      rejectionReason = request.utr_rejection_reason || "";
      amountPaid = request.amount_paid || 0;
    } else {
      const { data: app } = await supabaseAdmin
        .from("user_applications")
        .select("payment_status, application_status, utr_rejection_reason, total_paid")
        .eq("tracking_id", orderId)
        .maybeSingle();

      if (app) {
        status = (app.payment_status || app.application_status || "PENDING").toUpperCase();
        rejectionReason = app.utr_rejection_reason || "";
        amountPaid = app.total_paid || 0;
      }
    }

    return NextResponse.json({ 
      order_status: status, 
      order_id: orderId,
      rejection_reason: rejectionReason,
      amount_paid: amountPaid,
      message: 
        status === "PAID" ? "Payment verified & approved! Application in progress." :
        status === "PENDING_VERIFICATION" ? "Payment verification under progress (up to 30 mins)." :
        status === "REJECTED" ? `Payment rejected: ${rejectionReason || "Invalid UTR / Fake payment"}` :
        status === "EXPIRED" ? "Payment expired (15-min limit reached)." :
        "Order received — verification pending."
    });

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
