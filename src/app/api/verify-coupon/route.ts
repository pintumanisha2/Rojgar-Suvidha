import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const { code } = await req.json();
    if (!code) {
      return NextResponse.json({ error: "Code is required" }, { status: 400 });
    }

    const cleanCode = code.trim().toUpperCase();

    // Standard high-converting referral mock codes
    const validReferrals = ["ROJGAR10", "BHAIYA10", "SUVIDHA10", "SSC10", "NTPC10", "CGL10"];
    if (validReferrals.includes(cleanCode)) {
      return NextResponse.json({ 
        success: true, 
        discount: 10, 
        message: `Referral code "${cleanCode}" applied! ₹10 Discount active.` 
      });
    }

    // Check custom database coupons created via Admin portal
    const { data, error } = await supabaseAdmin
      .from("coupons")
      .select("*")
      .eq("code", cleanCode)
      .eq("status", "active")
      .maybeSingle();

    if (error) {
      console.error("[verify-coupon] DB error:", error.message);
      return NextResponse.json({ error: "Error verifying code. Please try again." }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: "Invalid or expired coupon code." }, { status: 400 });
    }

    // Check expiry
    if (data.expires_at && new Date(data.expires_at) < new Date()) {
      return NextResponse.json({ error: "This coupon code has expired." }, { status: 400 });
    }

    const discountAmount = Number(data.discount_value || 10);

    return NextResponse.json({ 
      success: true, 
      discount: discountAmount, 
      message: `Coupon applied! Saved ₹${discountAmount}.` 
    });

  } catch (err: any) {
    console.error("[verify-coupon] Unexpected error:", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
