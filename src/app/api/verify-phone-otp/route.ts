import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const { phone, otp, password, isForgotPassword } = await req.json();

    if (!phone || !otp) {
      return NextResponse.json({ error: "Phone number and OTP are required." }, { status: 400 });
    }

    // Step 1: Find valid, unused, non-expired OTP record
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

    // Step 2: Mark OTP as used immediately to prevent replay
    await supabaseAdmin
      .from("phone_otps")
      .update({ used: true })
      .eq("id", otpRecord.id);

    const digits = phone.replace(/\D/g, ""); // e.g. 919113362979
    const fakeEmail = `phone_${digits}@rojgarsuvidha.phone`;

    // Step 3: Handle Password Reset
    if (isForgotPassword) {
      if (!password) {
        return NextResponse.json({ error: "New password is required." }, { status: 400 });
      }

      // Check if user exists
      const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
      const existingAuthUser = existingUsers?.users?.find(u => u.email === fakeEmail);

      if (!existingAuthUser) {
        return NextResponse.json({ error: "Account not found." }, { status: 404 });
      }

      // Update password
      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
        existingAuthUser.id,
        { password: password }
      );

      if (updateError) {
        return NextResponse.json({ error: "Failed to update password." }, { status: 500 });
      }

      // Generate action login link
      const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
        type: "magiclink",
        email: fakeEmail,
        options: {
          redirectTo: `${req.headers.get("origin") || "http://localhost:3001"}/auth/callback`,
        }
      });

      return NextResponse.json({
        success: true,
        actionLink: linkData?.properties?.action_link || null,
        message: "Password reset successful."
      });
    }

    // Step 4: Handle standard Sign Up password registration
    if (!password) {
      return NextResponse.json({ error: "Password is required for registration." }, { status: 400 });
    }

    // Create auth user with actual password chosen by user
    const { data: newAuthUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: fakeEmail,
      password: password,
      email_confirm: true,
      user_metadata: { phone, auth_method: "phone_otp" },
    });

    if (createError || !newAuthUser.user) {
      console.error("Auth user creation error:", createError);
      return NextResponse.json({ error: "Failed to create account. Please try again." }, { status: 500 });
    }

    // Generate redirect action link
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: "magiclink",
      email: fakeEmail,
      options: {
        redirectTo: `${req.headers.get("origin") || "http://localhost:3001"}/auth/callback`,
      }
    });

    return NextResponse.json({
      success: true,
      actionLink: linkData?.properties?.action_link || null,
      isNewUser: true,
    });

  } catch (error: any) {
    console.error("Verify Phone OTP Exception:", error);
    return NextResponse.json(
      { error: error.message || "An unexpected error occurred." },
      { status: 500 }
    );
  }
}
