import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Admin approves or rejects a manual UPI payment
export async function POST(req: Request) {
  try {
    const { tracking_id, action, rejection_reason, admin_id } = await req.json();
    // action: "approve" | "reject"

    if (!tracking_id || !action) {
      return NextResponse.json({ error: "tracking_id and action are required." }, { status: 400 });
    }

    // Fetch the application
    const { data: app, error: fetchErr } = await supabaseAdmin
      .from("user_applications")
      .select("*")
      .eq("tracking_id", tracking_id)
      .maybeSingle();

    if (fetchErr || !app) {
      return NextResponse.json({ error: "Application not found." }, { status: 404 });
    }

    if (action === "approve") {
      const { error } = await supabaseAdmin
        .from("user_applications")
        .update({
          payment_status: "paid",
          application_status: "Received",
          utr_verified_at: new Date().toISOString(),
          utr_verified_by: admin_id || "admin",
        })
        .eq("tracking_id", tracking_id);

      if (error) return NextResponse.json({ error: "Failed to approve." }, { status: 500 });

      // Send WhatsApp notification to user
      try {
        await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || "https://www.rojgarsuvidha.com"}/api/whatsapp-confirm`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            phone: app.phone,
            name: app.full_name,
            tracking_id: app.tracking_id,
            form_title: app.form_id,
            message_type: "payment_approved",
          }),
        });
      } catch (waErr) {
        console.error("WhatsApp notification failed:", waErr);
      }

      // Send in-app notification to user
      if (app.user_id) {
        try {
          await supabaseAdmin.from("notifications").insert([{
            user_id: app.user_id,
            title: "✅ Payment Verified!",
            body: `Aapka payment ₹${app.total_paid} verify ho gaya! Tracking ID: ${tracking_id}. Hamare experts 24 ghante mein aapka form fill kar denge.`,
            type: "payment",
            action_url: `/track/${tracking_id}`,
            is_read: false,
          }]);
        } catch (notifErr) {
          console.error("In-app notification failed:", notifErr);
        }
      }

      return NextResponse.json({ success: true, message: "Payment approved and user notified." });

    } else if (action === "reject") {
      const reason = rejection_reason || "Payment nahi mili. Kripya dobara sahi UTR submit karein.";

      const { error } = await supabaseAdmin
        .from("user_applications")
        .update({
          payment_status: "rejected",
          utr_rejection_reason: reason,
          utr_verified_at: new Date().toISOString(),
          utr_verified_by: admin_id || "admin",
        })
        .eq("tracking_id", tracking_id);

      if (error) return NextResponse.json({ error: "Failed to reject." }, { status: 500 });

      // WhatsApp rejection notification
      try {
        await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || "https://www.rojgarsuvidha.com"}/api/whatsapp-confirm`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            phone: app.phone,
            name: app.full_name,
            tracking_id: app.tracking_id,
            message_type: "payment_rejected",
            rejection_reason: reason,
          }),
        });
      } catch (waErr) {
        console.error("WhatsApp rejection notification failed:", waErr);
      }

      // In-app notification
      if (app.user_id) {
        try {
          await supabaseAdmin.from("notifications").insert([{
            user_id: app.user_id,
            title: "❌ Payment Verify Nahi Hui",
            body: `Tracking ID ${tracking_id}: ${reason} Kripya sahi UTR ke saath dobara submit karein.`,
            type: "payment",
            action_url: `/apply/${app.form_id}`,
            is_read: false,
          }]);
        } catch (notifErr) {
          console.error("In-app notification failed:", notifErr);
        }
      }

      return NextResponse.json({ success: true, message: "Payment rejected and user notified." });

    } else {
      return NextResponse.json({ error: "Invalid action. Use 'approve' or 'reject'." }, { status: 400 });
    }

  } catch (err: any) {
    console.error("UTR verify error:", err);
    return NextResponse.json({ error: err.message || "Unexpected error." }, { status: 500 });
  }
}
