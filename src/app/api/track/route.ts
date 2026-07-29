import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import Razorpay from "razorpay";
import crypto from "crypto";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET handler: Verify Razorpay payment status
// Called by page after payment: GET /api/track?order_id=order_XXXXX&payment_id=pay_XXXXX&signature=XXX
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const orderId = searchParams.get("order_id");
    const paymentId = searchParams.get("payment_id");
    const signature = searchParams.get("signature");

    if (!orderId) {
      return NextResponse.json({ error: "order_id is required" }, { status: 400 });
    }

    // ── If payment_id + signature provided, verify Razorpay signature ──────
    if (paymentId && signature) {
      const keySecret = process.env.RAZORPAY_KEY_SECRET;
      if (keySecret) {
        const generatedSignature = crypto
          .createHmac("sha256", keySecret)
          .update(`${orderId}|${paymentId}`)
          .digest("hex");

        if (generatedSignature === signature) {
          // ✅ Payment is verified — update DB
          await supabaseAdmin
            .from("apply_for_me_requests")
            .update({ status: "paid" })
            .eq("tracking_id", orderId);

          return NextResponse.json({ order_status: "PAID", order_id: orderId, payment_id: paymentId });
        } else {
          return NextResponse.json({ order_status: "FAILED", error: "Signature mismatch" }, { status: 400 });
        }
      }
    }

    // ── Fallback: Check DB for status (webhook may have already updated it) ─
    const { data: request } = await supabaseAdmin
      .from("apply_for_me_requests")
      .select("status")
      .eq("tracking_id", orderId)
      .single();

    if (request?.status === "paid") {
      return NextResponse.json({ order_status: "PAID", order_id: orderId });
    }

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
