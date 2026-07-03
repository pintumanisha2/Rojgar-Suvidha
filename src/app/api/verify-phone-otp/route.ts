import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const { phone, otp } = await req.json();

    if (!phone || !otp) {
      return NextResponse.json({ error: "Phone number and OTP are required." }, { status: 400 });
    }

    // Find valid, unused OTP
    const { data: otpRecord, error: fetchError } = await supabaseAdmin
      .from("phone_otps")
      .select("*")
      .eq("phone", phone)
      .eq("otp", otp)
      .eq("used", false)
      .gte("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (fetchError || !otpRecord) {
      return NextResponse.json(
        { error: "Invalid or expired OTP. Please try again." },
        { status: 400 }
      );
    }

    // Mark OTP as used
    await supabaseAdmin
      .from("phone_otps")
      .update({ used: true })
      .eq("id", otpRecord.id);

    // Check if user with this phone exists in profiles
    const { data: existingProfile } = await supabaseAdmin
      .from("profiles")
      .select("id, full_name")
      .eq("mobile_number", phone.replace("+91", ""))
      .single();

    let userId: string;
    let isNewUser = false;

    if (existingProfile) {
      // Returning user — find their auth account
      userId = existingProfile.id;
    } else {
      // New user — create an auth account with phone as identifier
      const fakeEmail = `phone_${phone.replace("+", "").replace(/\s/g, "")}@rojgarsuvidha.phone`;
      const randomPassword = `RS_${Math.random().toString(36).slice(2)}_${Date.now()}`;

      // Check if auth user already exists
      const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
      const existingAuthUser = existingUsers?.users?.find(u => u.email === fakeEmail);

      if (existingAuthUser) {
        userId = existingAuthUser.id;
      } else {
        // Create new auth user
        const { data: newAuthUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
          email: fakeEmail,
          password: randomPassword,
          email_confirm: true,
          user_metadata: { phone, auth_method: "phone_otp" },
        });

        if (createError || !newAuthUser.user) {
          console.error("Auth user creation error:", createError);
          return NextResponse.json({ error: "Failed to create account. Please try again." }, { status: 500 });
        }

        userId = newAuthUser.user.id;
        isNewUser = true;
      }
    }

    // Generate a session for the user using magic link approach
    const { data: sessionData, error: sessionError } = await supabaseAdmin.auth.admin.generateLink({
      type: "magiclink",
      email: `phone_${phone.replace("+", "").replace(/\s/g, "")}@rojgarsuvidha.phone`,
    });

    if (sessionError || !sessionData) {
      console.error("Session generation error:", sessionError);
      return NextResponse.json({ error: "Failed to create session. Please try again." }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      userId,
      isNewUser,
      hasProfile: !!existingProfile?.full_name,
      magicLink: sessionData.properties?.action_link,
    });
  } catch (error: any) {
    console.error("Verify Phone OTP Exception:", error);
    return NextResponse.json({ error: error.message || "An unexpected error occurred." }, { status: 500 });
  }
}
