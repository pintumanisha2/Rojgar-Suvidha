import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const { email, source } = await req.json();

    // ── Validation ─────────────────────────────────────────────────────────
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return NextResponse.json(
        { error: "Please enter a valid email address." },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();

    // ── Upsert into email_subscribers ──────────────────────────────────────
    // Uses upsert so duplicate emails are silently ignored
    const { error } = await supabaseAdmin
      .from("email_subscribers")
      .upsert(
        { email: cleanEmail, source: source || "homepage" },
        { onConflict: "email", ignoreDuplicates: true }
      );

    if (error) {
      // Table might not exist yet — return success anyway so UX is unblocked
      if (error.code === "42P01") {
        console.warn("[subscribe] Table email_subscribers not found. Create it in Supabase.");
      } else {
        console.error("[subscribe] DB error:", error.message);
        return NextResponse.json(
          { error: "Could not save your email. Please try again." },
          { status: 500 }
        );
      }
    }

    // ── Brevo (Sendinblue) Transactional welcome email integration ─────────
    const BREVO_API_KEY = process.env.BREVO_API_KEY;
    if (BREVO_API_KEY) {
      try {
        // Add to Contacts list in Brevo
        await fetch("https://api.brevo.com/v3/contacts", {
          method: "POST",
          headers: {
            "accept": "application/json",
            "content-type": "application/json",
            "api-key": BREVO_API_KEY,
          },
          body: JSON.stringify({
            email: cleanEmail,
            updateEnabled: true,
          }),
        });

        // Send confirmation transactional email
        await fetch("https://api.brevo.com/v3/smtp/email", {
          method: "POST",
          headers: {
            "accept": "application/json",
            "content-type": "application/json",
            "api-key": BREVO_API_KEY,
          },
          body: JSON.stringify({
            sender: { name: "Rojgar Suvidha", email: "support@rojgarsuvidha.com" },
            to: [{ email: cleanEmail }],
            subject: "Rojgar Suvidha — Aapka Subscription Confirm Hua! ✅",
            htmlContent: `
              <div style="font-family: sans-serif; max-w: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 16px;">
                <h2 style="color: #4f46e5; margin-bottom: 16px;">Namaste Aspirant! 🙏</h2>
                <p style="font-size: 14px; color: #4a5568; line-height: 1.6;">Aapka daily sarkari job updates subscription confirm ho gaya hai. Ab aapko har roz subah selected SSC, Railway, Bank aur State PSC notifications seedha aapke inbox mein milenge.</p>
                <div style="background-color: #f7fafc; border-left: 4px solid #4f46e5; padding: 12px 16px; margin: 20px 0; border-radius: 4px;">
                  <strong style="color: #1a202c; display: block; font-size: 14px; margin-bottom: 4px;">Form Hamara, Naukri Aapki</strong>
                  <span style="font-size: 12px; color: #718096;">Cyber cafe jaane ki chinta chhoro. Bas documents upload karo aur hamari team se safely form fill karwao.</span>
                </div>
                <div style="margin-top: 24px; text-align: center;">
                  <a href="https://www.rojgarsuvidha.com/apply-for-me" style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 14px; display: inline-block;">Mera Form Bharo →</a>
                </div>
                <p style="margin-top: 30px; font-size: 11px; color: #a0aec0; text-align: center; border-t: 1px solid #edf2f7; pt: 20px;">
                  🔒 We respect your privacy. You can unsubscribe at any time.
                </p>
              </div>
            `,
          }),
        });
      } catch (brevoErr) {
        console.error("[subscribe] Brevo dispatch failed:", brevoErr);
      }
    } else {
      console.warn("[subscribe] BREVO_API_KEY is not defined in environment configuration. Email skipped.");
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("[subscribe] Unexpected error:", err);
    return NextResponse.json({ error: "Internal error." }, { status: 500 });
  }
}
