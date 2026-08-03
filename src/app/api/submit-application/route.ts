import { NextResponse } from "next/server";

// ── DEPRECATED: This endpoint was used for Razorpay payments ──
// All payments now use UPI Manual payment via /api/utr-submit
// Keeping this file to avoid 404 errors on old/cached requests
export async function POST() {
  return NextResponse.json(
    { error: "This payment method is no longer supported. Please use UPI payment." },
    { status: 410 }
  );
}
