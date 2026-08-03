import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const { tracking_id, utr_number, screenshot_url, declared_amount } = await req.json();

    if (!tracking_id || !utr_number) {
      return NextResponse.json({ error: "Tracking ID and UTR number are required." }, { status: 400 });
    }

    // Validate UTR format: 12-digit numeric
    if (!/^\d{12}$/.test(utr_number.trim())) {
      return NextResponse.json({ error: "UTR number must be exactly 12 digits." }, { status: 400 });
    }

    // ── Detect which table this tracking_id belongs to ──
    // Apply For Me (main jobs) → user_applications
    // e-Suvidha services       → apply_for_me_requests (tracking_id starts with "ES")
    const isEsuvidha = tracking_id.startsWith("ES");

    if (isEsuvidha) {
      // ── Handle e-Suvidha UTR submission ──
      const { data: eApp, error: fetchErr } = await supabaseAdmin
        .from("apply_for_me_requests")
        .select("tracking_id, status, amount_paid, created_at")
        .eq("tracking_id", tracking_id)
        .maybeSingle();

      if (fetchErr || !eApp) {
        return NextResponse.json({ error: "Order nahi mila. Tracking ID check karo." }, { status: 404 });
      }

      if (eApp.status === "paid") {
        return NextResponse.json({ error: "Yeh order already verify ho chuka hai. Dobara submit mat karo." }, { status: 400 });
      }

      // Amount mismatch
      if (declared_amount && eApp.amount_paid && Math.abs(Number(declared_amount) - Number(eApp.amount_paid)) > 1) {
        return NextResponse.json(
          { error: `Amount mismatch! Aapko ₹${eApp.amount_paid} pay karna tha.` },
          { status: 400 }
        );
      }

      // Update e-suvidha request
      const { error: updateErr } = await supabaseAdmin
        .from("apply_for_me_requests")
        .update({
          utr_number: utr_number.trim(),
          payment_screenshot_url: screenshot_url || null,
          status: "pending_verification",
        })
        .eq("tracking_id", tracking_id);

      if (updateErr) {
        console.error("e-Suvidha UTR update error:", updateErr);
        return NextResponse.json({ error: "Failed to save UTR. Please try again." }, { status: 500 });
      }

    } else {
      // ── Handle Apply For Me UTR submission (user_applications table) ──
      const { data: app, error: fetchErr } = await supabaseAdmin
        .from("user_applications")
        .select("tracking_id, total_paid, payment_status, created_at, utr_number")
        .eq("tracking_id", tracking_id)
        .maybeSingle();

      if (fetchErr || !app) {
        return NextResponse.json({ error: "Order nahi mila. Tracking ID check karo." }, { status: 404 });
      }

      if (app.payment_status === "paid") {
        return NextResponse.json({ error: "Yeh order already verify ho chuka hai. Dobara submit mat karo." }, { status: 400 });
      }

      // Expiry check: 20 min (only if UTR not yet submitted)
      const orderAgeMs = Date.now() - new Date(app.created_at).getTime();
      if (orderAgeMs > 20 * 60 * 1000 && !app.utr_number && app.payment_status === "pending_verification") {
        await supabaseAdmin
          .from("user_applications")
          .update({ payment_status: "expired", application_status: "Expired" })
          .eq("tracking_id", tracking_id);
        return NextResponse.json({ error: "Order expire ho gaya (20 min window). Kripya dobara apply karein." }, { status: 410 });
      }

      // Amount mismatch check
      if (declared_amount && Math.abs(Number(declared_amount) - Number(app.total_paid)) > 1) {
        return NextResponse.json(
          { error: `Amount mismatch! Aapko ₹${app.total_paid} pay karna tha, aapne ₹${declared_amount} declare kiya.` },
          { status: 400 }
        );
      }

      // Duplicate UTR check across user_applications
      const { data: existingUTR } = await supabaseAdmin
        .from("user_applications")
        .select("tracking_id")
        .eq("utr_number", utr_number.trim())
        .maybeSingle();

      if (existingUTR && existingUTR.tracking_id !== tracking_id) {
        return NextResponse.json(
          { error: "🚨 Yeh UTR number already kisi aur order mein use ho chuka hai. Sahi UTR dalo." },
          { status: 400 }
        );
      }

      const { error: updateErr } = await supabaseAdmin
        .from("user_applications")
        .update({
          utr_number: utr_number.trim(),
          payment_screenshot_url: screenshot_url || null,
          payment_method: "upi_manual",
          payment_status: "pending_verification",
        })
        .eq("tracking_id", tracking_id);

      if (updateErr) {
        console.error("UTR update error:", updateErr);
        return NextResponse.json({ error: "Failed to save UTR. Please try again." }, { status: 500 });
      }
    }

    return NextResponse.json({
      success: true,
      message: screenshot_url
        ? "UTR + Screenshot submit ho gaya! Verification 15 minute mein hogi."
        : "UTR submitted. Verification 30 minute mein hogi.",
    });

  } catch (err: any) {
    console.error("UTR submit error:", err);
    return NextResponse.json({ error: err.message || "Unexpected error." }, { status: 500 });
  }
}
