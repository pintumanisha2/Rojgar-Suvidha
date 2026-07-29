import { NextResponse } from "next/server";
import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";

// Use service role key for server-side DB writes
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const body = await req.text();
    const signature = req.headers.get("x-razorpay-signature");
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

    // ── Verify webhook signature (security check) ──────────────────────────
    // IMPORTANT: Set RAZORPAY_WEBHOOK_SECRET in .env.local
    // Razorpay Dashboard → Settings → Webhooks → Add Webhook → copy secret
    if (webhookSecret && signature) {
      const expectedSignature = crypto
        .createHmac("sha256", webhookSecret)
        .update(body)
        .digest("hex");

      if (expectedSignature !== signature) {
        console.error("Razorpay webhook: Invalid signature");
        return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
      }
    }

    const event = JSON.parse(body);
    const eventType = event.event;

    console.log("Razorpay Webhook Event:", eventType);

    // ── Handle payment.captured (successful payment) ──────────────────────
    if (eventType === "payment.captured") {
      const payment = event.payload.payment.entity;
      const orderId = payment.order_id; // Razorpay order ID
      const paymentId = payment.id;     // Razorpay payment ID
      const amount = payment.amount / 100; // Convert paise → Rs

      console.log(`Payment captured: ${paymentId} for order ${orderId}, ₹${amount}`);

      // Update the apply_for_me_requests row that has this order_id as tracking_id
      const { error: updateError } = await supabase
        .from("apply_for_me_requests")
        .update({ status: "paid" })
        .eq("tracking_id", orderId);

      if (updateError) {
        console.error("Webhook DB update error:", updateError);
        // Still return 200 so Razorpay doesn't retry unnecessarily
      }
    }

    // ── Handle payment.failed ─────────────────────────────────────────────
    if (eventType === "payment.failed") {
      const payment = event.payload.payment.entity;
      const orderId = payment.order_id;

      await supabase
        .from("apply_for_me_requests")
        .update({ status: "failed" })
        .eq("tracking_id", orderId);
    }

    // Always return 200 to acknowledge receipt
    return NextResponse.json({ received: true }, { status: 200 });

  } catch (error: any) {
    console.error("Razorpay webhook error:", error);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
