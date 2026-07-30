import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const { tracking_id, utr_number } = await req.json();

    if (!tracking_id || !utr_number) {
      return NextResponse.json({ error: "Tracking ID and UTR number are required." }, { status: 400 });
    }

    // Validate UTR format: 12-digit numeric
    if (!/^\d{12}$/.test(utr_number.trim())) {
      return NextResponse.json({ error: "UTR number must be exactly 12 digits." }, { status: 400 });
    }

    // Check for duplicate UTR (same UTR already used by another order)
    const { data: existingUTR } = await supabaseAdmin
      .from("user_applications")
      .select("tracking_id")
      .eq("utr_number", utr_number.trim())
      .maybeSingle();

    if (existingUTR && existingUTR.tracking_id !== tracking_id) {
      return NextResponse.json({ error: "This UTR number is already associated with another order." }, { status: 400 });
    }

    // Update the application with the UTR number and set status to pending_verification
    const { error } = await supabaseAdmin
      .from("user_applications")
      .update({
        utr_number: utr_number.trim(),
        payment_method: "upi_manual",
        payment_status: "pending_verification",
      })
      .eq("tracking_id", tracking_id);

    if (error) {
      console.error("UTR update error:", error);
      return NextResponse.json({ error: "Failed to save UTR. Please try again." }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: "UTR submitted. Verification will happen within 30 minutes." });
  } catch (err: any) {
    console.error("UTR submit error:", err);
    return NextResponse.json({ error: err.message || "Unexpected error." }, { status: 500 });
  }
}
