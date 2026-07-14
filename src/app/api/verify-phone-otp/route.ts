import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Generates a deterministic internal password the user never sees.
// Used for phone-only Supabase accounts (they login via OTP, not password).
function generateInternalPassword(phoneDigits: string): string {
  return `RS_ph0ne_${phoneDigits}_${process.env.SUPABASE_SERVICE_ROLE_KEY?.slice(-8) || "secret"}`;
}

export async function POST(req: Request) {
  try {
    const { phone, otp } = await req.json();

    if (!phone || !otp) {
      return NextResponse.json(
        { error: "Phone number aur OTP dono required hain." },
        { status: 400 }
      );
    }

    const origin = req.headers.get("origin") || "https://rojgarsuvidha.com";

    // ── Step 1: Validate OTP from DB ──────────────────────────────────────────
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

    // Mark OTP as used immediately to prevent replay attacks
    await supabaseAdmin.from("phone_otps").update({ used: true }).eq("id", otpRecord.id);

    const digits = phone.replace(/\D/g, ""); // e.g. 919876543210

    // ── Step 2: Check if this phone is already linked to an existing account ─
    // Industry pattern: 1 phone = 1 account, regardless of how they signed up
    const rawDigits = digits.replace(/^91/, ""); // strip country code → 10-digit number
    const { data: existingProfile } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("mobile_number", rawDigits)
      .maybeSingle();

    if (existingProfile?.id) {
      // ✅ Phone is linked to an existing account — sign them in to THAT account
      const userId = existingProfile.id;

      // Get the auth user details for this profile
      const { data: { user: authUser }, error: getUserError } = await supabaseAdmin.auth.admin.getUserById(userId);

      if (!getUserError && authUser?.email) {
        const isPhoneOnlyAccount = authUser.email.endsWith("@rojgarsuvidha.phone");

        if (isPhoneOnlyAccount) {
          // Phone-only account: sign in with internal credentials
          const internalPwd = generateInternalPassword(rawDigits);
          const { data: signInData, error: signInError } = await supabaseAdmin.auth.signInWithPassword({
            email: authUser.email,
            password: internalPwd,
          });

          if (!signInError && signInData?.session) {
            return NextResponse.json({
              success: true,
              isNewUser: false,
              accessToken: signInData.session.access_token,
              refreshToken: signInData.session.refresh_token,
            });
          }
        } else {
          // Google/email account linked to this phone: generate a magic link to sign them in
          // This lets phone OTP act as an authentication method for non-phone accounts
          const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
            type: "magiclink",
            email: authUser.email,
            options: { redirectTo: `${origin}/auth/callback` },
          });

          if (!linkError && linkData?.properties?.action_link) {
            return NextResponse.json({
              success: true,
              isNewUser: false,
              actionLink: linkData.properties.action_link,
            });
          }
        }
      }
    }

    // ── Step 3: No linked account found → create or sign in phone-only account ─
    const fakeEmail = `phone_${digits}@rojgarsuvidha.phone`;
    const internalPwd = generateInternalPassword(rawDigits);

    // Try sign in first (returning phone-only user whose phone is not yet in profiles)
    const { data: signInData, error: signInError } = await supabaseAdmin.auth.signInWithPassword({
      email: fakeEmail,
      password: internalPwd,
    });

    if (!signInError && signInData?.session) {
      return NextResponse.json({
        success: true,
        isNewUser: false,
        accessToken: signInData.session.access_token,
        refreshToken: signInData.session.refresh_token,
      });
    }

    // New user — create phone-only account
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: fakeEmail,
      password: internalPwd,
      email_confirm: true,
      user_metadata: { phone, auth_method: "phone_otp" },
    });

    if (createError || !newUser.user) {
      // Fallback: magic link for edge cases (e.g. user exists with old credentials)
      const { data: linkData } = await supabaseAdmin.auth.admin.generateLink({
        type: "magiclink",
        email: fakeEmail,
        options: { redirectTo: `${origin}/auth/callback` },
      });

      if (linkData?.properties?.action_link) {
        return NextResponse.json({
          success: true,
          isNewUser: false,
          actionLink: linkData.properties.action_link,
        });
      }

      console.error("User creation failed:", createError);
      return NextResponse.json(
        { error: "Failed to create account. Please try again." },
        { status: 500 }
      );
    }

    // Sign in newly created user to get session tokens
    const { data: newSignIn, error: newSignInError } = await supabaseAdmin.auth.signInWithPassword({
      email: fakeEmail,
      password: internalPwd,
    });

    if (!newSignInError && newSignIn?.session) {
      return NextResponse.json({
        success: true,
        isNewUser: true,
        accessToken: newSignIn.session.access_token,
        refreshToken: newSignIn.session.refresh_token,
      });
    }

    // Final fallback
    const { data: linkData } = await supabaseAdmin.auth.admin.generateLink({
      type: "magiclink",
      email: fakeEmail,
      options: { redirectTo: `${origin}/auth/callback` },
    });

    return NextResponse.json({
      success: true,
      isNewUser: true,
      actionLink: linkData?.properties?.action_link || null,
    });

  } catch (error: any) {
    console.error("Verify Phone OTP Exception:", error);
    return NextResponse.json(
      { error: error.message || "Unexpected error aayi." },
      { status: 500 }
    );
  }
}
