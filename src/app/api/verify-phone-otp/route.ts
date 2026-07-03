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

    // Step 1: Find valid, unused, non-expired OTP
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
        { error: "Invalid or expired OTP. Please request a new one." },
        { status: 400 }
      );
    }

    // Step 2: Mark OTP as used immediately
    await supabaseAdmin
      .from("phone_otps")
      .update({ used: true })
      .eq("id", otpRecord.id);

    // Step 3: Create deterministic fake email + password from phone
    const digits = phone.replace(/\D/g, ""); // e.g. 919113362979
    const fakeEmail = `phone_${digits}@rojgarsuvidha.phone`;
    const fakePassword = `RS_phone_${digits}_2024!`;

    // Step 4: Check if auth user already exists to prevent duplicate creation errors
    const { data: existingProfile } = await supabaseAdmin
      .from("profiles")
      .select("id, full_name")
      .eq("mobile_number", phone.replace("+91", ""))
      .single();

    let userId: string;
    let isNewUser = false;

    if (existingProfile) {
      userId = existingProfile.id;
    } else {
      // Find auth user
      const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
      const existingAuthUser = existingUsers?.users?.find(u => u.email === fakeEmail);

      if (existingAuthUser) {
        userId = existingAuthUser.id;
      } else {
        // Create new auth user
        const { data: newAuthUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
          email: fakeEmail,
          password: fakePassword,
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

    // Step 5: Use magic link action token to sign user in securely
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: "magiclink",
      email: fakeEmail,
      options: {
        redirectTo: `${req.headers.get("origin") || "http://localhost:3001"}/auth/callback`,
      }
    });

    if (linkError || !linkData?.properties?.action_link) {
      console.error("Magic link generation error:", linkError);
      return NextResponse.json({ error: "Failed to create session link. Please try again." }, { status: 500 });
    }

    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("full_name")
      .eq("id", userId)
      .single();

    return NextResponse.json({
      success: true,
      actionLink: linkData.properties.action_link,
      isNewUser: isNewUser || !profile?.full_name,
    });

  } catch (error: any) {
    console.error("Verify Phone OTP Exception:", error);
    return NextResponse.json(
      { error: error.message || "An unexpected error occurred." },
      { status: 500 }
    );
  }
}
