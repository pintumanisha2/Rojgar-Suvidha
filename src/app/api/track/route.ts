import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET handler: Verify payment order status (PhonePe)
// Called by page after payment redirect: GET /api/track?order_id=xxx
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const orderId = searchParams.get("order_id");

    if (!orderId) {
      return NextResponse.json({ error: "order_id is required" }, { status: 400 });
    }

    const merchantId = process.env.PHONEPE_MERCHANT_ID;
    const saltKey = process.env.PHONEPE_SALT_KEY;
    const saltIndex = process.env.PHONEPE_SALT_INDEX || "1";
    const environment = process.env.PHONEPE_ENV || "sandbox";

    if (!merchantId || !saltKey) {
      console.warn("PhonePe credentials missing — returning mock PAID status");
      return NextResponse.json({ order_status: "PAID", order_id: orderId });
    }

    const apiPath = `/pg/v1/status/${merchantId}/${orderId}`;
    const stringToHash = apiPath + saltKey;
    const sha256 = crypto.createHash("sha256").update(stringToHash).digest("hex");
    const checksum = sha256 + "###" + saltIndex;

    const baseUrl = environment === "production"
      ? `https://api.phonepe.com/apis/hermes${apiPath}`
      : `https://api-preprod.phonepe.com/apis/pg-sandbox${apiPath}`;

    const response = await fetch(baseUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "X-VERIFY": checksum,
        "X-MERCHANT-ID": merchantId,
        Accept: "application/json",
      },
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      console.error("PhonePe order fetch error:", data);
      return NextResponse.json(
        { error: data.message || "Failed to fetch order status", order_status: "UNKNOWN" },
        { status: response.status || 400 }
      );
    }

    let mappedStatus = "UNKNOWN";
    if (data.code === "PAYMENT_SUCCESS") {
      mappedStatus = "PAID";
    } else if (data.code === "PAYMENT_PENDING") {
      mappedStatus = "ACTIVE";
    } else {
      mappedStatus = "FAILED";
    }

    return NextResponse.json({
      order_status: mappedStatus,
      order_id: orderId,
      order_amount: data.data?.amount ? data.data.amount / 100 : 0, // convert paise back to Rs
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
