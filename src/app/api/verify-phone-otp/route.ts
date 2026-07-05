import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Generates a strong internal password the user never sees.
// Phone users login via OTP always — password is only stored for Supabase's benefit.
function generateInternalPassword(phone: string): string {
  const base = `RS_ph0ne_${phone}_${process.env.SUPABASE_SERVICE_ROLE_KEY?.slice(-8) || "secret"}`;
  return base;
}

export async function POST(req: Request) {
  try {
    const { phone, otp } = await req.json();

    if (!phone || !otp) {
      return NextResponse.json({ error: "Phone number aur OTP dono required hain." }, { status: 400 });
    }

    // ── Step 1: Validate OTP from DB ──────────────────────
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

    // Mark OTP as used immediately (prevents replay attacks)
    await supabaseAdmin.from("phone_otps").update({ used: true }).eq("id", otpRecord.id);

    const digits   = phone.replace(/\D/g, "");
    const fakeEmail = `phone_${digits}@rojgarsuvidha.phone`;
    const internalPwd = generateInternalPassword(digits);

    // ── Step 2: Try to sign in (existing user) ────────────
    const { data: signInData, error: signInError } = await supabaseAdmin.auth.signInWithPassword({
      email: fakeEmail,
      password: internalPwd,
    });

    if (!signInError && signInData?.session) {
      // ✅ Existing user — return session tokens directly
      return NextResponse.json({
        success: true,
        isNewUser: false,
        accessToken:  signInData.session.access_token,
        refreshToken: signInData.session.refresh_token,
      });
    }

    // ── Step 3: New user — create account ─────────────────
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: fakeEmail,
      password: internalPwd,
      email_confirm: true,
      user_metadata: { phone, auth_method: "phone_otp" },
    });

    if (createError || !newUser.user) {
      // Edge case: user exists but with different internal password (old accounts)
      // Try generating magic link as fallback
      const { data: linkData } = await supabaseAdmin.auth.admin.generateLink({
        type: "magiclink",
        email: fakeEmail,
        options: { redirectTo: `${req.headers.get("origin") || "https://rojgarsuvidha.com"}/auth/callback` },
      });

      if (linkData?.properties?.action_link) {
        return NextResponse.json({
          success: true,
          isNewUser: false,
          actionLink: linkData.properties.action_link,
        });
      }

      console.error("User creation failed:", createError);
      return NextResponse.json({ error: "Failed to create account. Please try again." }, { status: 500 });
    }

    // Sign in the newly created user to get session tokens
    const { data: newSignIn, error: newSignInError } = await supabaseAdmin.auth.signInWithPassword({
      email: fakeEmail,
      password: internalPwd,
    });

    if (!newSignInError && newSignIn?.session) {
      return NextResponse.json({
        success: true,
        isNewUser: true,
        accessToken:  newSignIn.session.access_token,
        refreshToken: newSignIn.session.refresh_token,
      });
    }

    // Fallback: magic link for new user
    const { data: linkData } = await supabaseAdmin.auth.admin.generateLink({
      type: "magiclink",
      email: fakeEmail,
      options: { redirectTo: `${req.headers.get("origin") || "https://rojgarsuvidha.com"}/auth/callback` },
    });

    return NextResponse.json({
      success: true,
      isNewUser: true,
      actionLink: linkData?.properties?.action_link || null,
    });

  } catch (error: any) {
    console.error("Verify Phone OTP Exception:", error);
    return NextResponse.json({ error: error.message || "Unexpected error aayi." }, { status: 500 });
  }
}
