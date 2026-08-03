import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Admin approves or rejects a manual UPI payment for both tables:
// 1) user_applications
// 2) apply_for_me_requests (e-Suvidha & Apply For Me)
export async function POST(req: Request) {
  try {
    const { tracking_id, action, rejection_reason, admin_id } = await req.json();
    // action: "approve" | "reject"

    if (!tracking_id || !action) {
      return NextResponse.json({ error: "tracking_id and action are required." }, { status: 400 });
    }

    // 1. Try finding in user_applications first
    let tableType: "user_applications" | "apply_for_me_requests" = "user_applications";
    let { data: app } = await supabaseAdmin
      .from("user_applications")
      .select("*")
      .eq("tracking_id", tracking_id)
      .maybeSingle();

    // 2. If not found in user_applications, search apply_for_me_requests (e-Suvidha)
    if (!app) {
      const { data: esuvidhaApp } = await supabaseAdmin
        .from("apply_for_me_requests")
        .select("*")
        .eq("tracking_id", tracking_id)
        .maybeSingle();

      if (esuvidhaApp) {
        tableType = "apply_for_me_requests";
        app = {
          tracking_id: esuvidhaApp.tracking_id,
          full_name: esuvidhaApp.applicant_name,
          phone: esuvidhaApp.phone_number,
          email: esuvidhaApp.email,
          total_paid: esuvidhaApp.amount_paid,
          form_id: esuvidhaApp.job_title,
          user_id: esuvidhaApp.user_id,
        };
      }
    }

    if (!app) {
      return NextResponse.json({ error: "Application record not found for tracking ID: " + tracking_id }, { status: 404 });
    }

    const nowIso = new Date().toISOString();

    if (action === "approve") {
      if (tableType === "user_applications") {
        const fullPayload = {
          payment_status: "paid",
          application_status: "Received",
          utr_verified_at: nowIso,
          utr_verified_by: admin_id || "admin",
        };

        const { error } = await supabaseAdmin
          .from("user_applications")
          .update(fullPayload)
          .eq("tracking_id", tracking_id);

        if (error) {
          // Fallback if optional columns don't exist
          const { error: fallbackErr } = await supabaseAdmin
            .from("user_applications")
            .update({ payment_status: "paid", application_status: "Received" })
            .eq("tracking_id", tracking_id);

          if (fallbackErr) {
            return NextResponse.json({ error: "Failed to approve: " + fallbackErr.message }, { status: 500 });
          }
        }
      } else {
        // apply_for_me_requests table
        const fullPayload = {
          status: "paid",
          payment_status: "paid",
          utr_verified_at: nowIso,
          utr_verified_by: admin_id || "admin",
        };

        const { error } = await supabaseAdmin
          .from("apply_for_me_requests")
          .update(fullPayload)
          .eq("tracking_id", tracking_id);

        if (error) {
          // Fallback to updating primary 'status' column if extra columns don't exist
          console.warn("Retrying apply_for_me_requests approve with core status column:", error.message);
          const { error: fallbackErr } = await supabaseAdmin
            .from("apply_for_me_requests")
            .update({ status: "paid" })
            .eq("tracking_id", tracking_id);

          if (fallbackErr) {
            return NextResponse.json({ error: "Failed to approve: " + fallbackErr.message }, { status: 500 });
          }
        }
      }

      // Send WhatsApp approval notification
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
        console.error("WhatsApp approval notification failed:", waErr);
      }

      // Send In-App notification
      if (app.user_id) {
        try {
          await supabaseAdmin.from("notifications").insert([{
            user_id: app.user_id,
            title: "✅ Payment Verified!",
            body: `Aapka ₹${app.total_paid || 0} payment approve ho gaya! Tracking ID: ${tracking_id}. Form filling start ho gaya hai.`,
            type: "payment",
            action_url: `/track/${tracking_id}`,
            is_read: false,
          }]);
        } catch (notifErr) {
          console.error("In-app notification failed:", notifErr);
        }
      }

      return NextResponse.json({ success: true, message: "Payment approved successfully. Order moved to processing." });

    } else if (action === "reject") {
      const reason = rejection_reason || "Payment UTR verify nahi hua (Bank statement mismatch or invalid UTR).";

      if (tableType === "user_applications") {
        const fullPayload = {
          payment_status: "rejected",
          utr_rejection_reason: reason,
          utr_verified_at: nowIso,
          utr_verified_by: admin_id || "admin",
        };

        const { error } = await supabaseAdmin
          .from("user_applications")
          .update(fullPayload)
          .eq("tracking_id", tracking_id);

        if (error) {
          const { error: fallbackErr } = await supabaseAdmin
            .from("user_applications")
            .update({ payment_status: "rejected" })
            .eq("tracking_id", tracking_id);

          if (fallbackErr) {
            return NextResponse.json({ error: "Failed to reject: " + fallbackErr.message }, { status: 500 });
          }
        }
      } else {
        const fullPayload = {
          status: "rejected",
          payment_status: "rejected",
          utr_rejection_reason: reason,
          utr_verified_at: nowIso,
          utr_verified_by: admin_id || "admin",
        };

        const { error } = await supabaseAdmin
          .from("apply_for_me_requests")
          .update(fullPayload)
          .eq("tracking_id", tracking_id);

        if (error) {
          console.warn("Retrying apply_for_me_requests reject with core status column:", error.message);
          const { error: fallbackErr } = await supabaseAdmin
            .from("apply_for_me_requests")
            .update({ status: "rejected" })
            .eq("tracking_id", tracking_id);

          if (fallbackErr) {
            return NextResponse.json({ error: "Failed to reject: " + fallbackErr.message }, { status: 500 });
          }
        }
      }

      // Send WhatsApp rejection alert
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

      // Send In-App rejection notification
      if (app.user_id) {
        try {
          await supabaseAdmin.from("notifications").insert([{
            user_id: app.user_id,
            title: "❌ Payment Verification Failed",
            body: `Tracking ID ${tracking_id}: ${reason} Kripya sahi UTR daal kar dobara try karein.`,
            type: "payment",
            action_url: `/track/${tracking_id}`,
            is_read: false,
          }]);
        } catch (notifErr) {
          console.error("In-app rejection notification failed:", notifErr);
        }
      }

      return NextResponse.json({ success: true, message: "Payment rejected and candidate notified." });

    } else {
      return NextResponse.json({ error: "Invalid action. Allowed: 'approve' | 'reject'." }, { status: 400 });
    }

  } catch (err: any) {
    console.error("UTR verify error:", err);
    return NextResponse.json({ error: err.message || "Unexpected server error." }, { status: 500 });
  }
}
