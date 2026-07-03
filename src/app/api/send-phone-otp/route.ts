import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Use service role key to bypass RLS for OTP storage
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const { phone } = await req.json();

    if (!phone || !/^\+91[6-9]\d{9}$/.test(phone)) {
      return NextResponse.json(
        { error: "Please enter a valid 10-digit Indian mobile number." },
        { status: 400 }
      );
    }

    const apiKey = process.env.APITXT_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "SMS service is not configured. Please contact support." },
        { status: 500 }
      );
    }

    // Check rate limit: max 3 OTPs per phone per 10 minutes
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    const { count } = await supabaseAdmin
      .from("phone_otps")
      .select("*", { count: "exact", head: true })
      .eq("phone", phone)
      .gte("created_at", tenMinutesAgo);

    if ((count ?? 0) >= 3) {
      return NextResponse.json(
        { error: "Bahut zyada OTP requests. Please 10 minutes baad try karein." },
        { status: 429 }
      );
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Store OTP in database with 10 minute expiry
    const { error: dbError } = await supabaseAdmin.from("phone_otps").insert({
      phone,
      otp,
      expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
      used: false,
    });

    if (dbError) {
      console.error("OTP DB insert error:", dbError);
      return NextResponse.json({ error: "Failed to generate OTP. Please try again." }, { status: 500 });
    }

    // Send OTP via APITxt.com sendOTP (GET with query params)
    const phoneNumber = phone.replace("+", ""); // becomes 91XXXXXXXXXX

    const smsUrl = `https://apitxt.com/api/sendOTP?authkey=${encodeURIComponent(apiKey)}&mobile=${phoneNumber}&otp=${otp}&channel=sms`;

    const smsResponse = await fetch(smsUrl, { method: "GET" });

    let smsData: any = {};
    try {
      smsData = await smsResponse.json();
    } catch {
      smsData = { type: "error" };
    }

    if (!smsResponse.ok || smsData.type === "error") {
      console.error("APITxt SMS Error:", smsData);
      return NextResponse.json(
        { error: "SMS bhejne me problem aayi. Please dobara try karein." },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, message: "OTP sent successfully!" });
  } catch (error: any) {
    console.error("Send Phone OTP Exception:", error);
    return NextResponse.json({ error: error.message || "An unexpected error occurred." }, { status: 500 });
  }
}
