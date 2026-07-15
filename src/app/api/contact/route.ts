import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Use service role to insert contact messages without auth
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const { name, email, subject, message } = await req.json();

    // ── Validation ───────────────────────────────────────────────────────────
    if (!name || name.trim().length < 2)
      return NextResponse.json({ error: "Please enter your full name." }, { status: 400 });
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
    if (!message || message.trim().length < 10)
      return NextResponse.json({ error: "Please write a message of at least 10 characters." }, { status: 400 });

    // ── Save to Supabase (contact_messages table) ────────────────────────────
    // This table will be auto-created if it doesn't exist via Supabase UI,
    // or we gracefully continue even if it fails.
    try {
      await supabaseAdmin.from("contact_messages").insert({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        subject: subject || "General Enquiry",
        message: message.trim(),
        created_at: new Date().toISOString(),
        status: "new",
      });
    } catch (dbErr) {
      // Non-fatal: log but continue so user gets confirmation
      console.error("[contact] DB save error:", dbErr);
    }

    // ── Forward to admin via Resend (if configured) ──────────────────────────
    const resendKey = process.env.RESEND_API_KEY;
    if (resendKey) {
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "Rojgar Suvidha Contact <noreply@rojgarsuvidha.com>",
          to: ["support@rojgarsuvidha.com"],
          reply_to: email.trim(),
          subject: `[Contact Form] ${subject || "General Enquiry"} — from ${name.trim()}`,
          html: `
            <div style="font-family:Inter,sans-serif;max-width:600px;margin:0 auto;background:#f8fafc;padding:24px;">
              <div style="background:#4f46e5;color:white;border-radius:16px 16px 0 0;padding:24px;">
                <h1 style="margin:0;font-size:20px;">New Contact Form Message</h1>
                <p style="margin:4px 0 0;opacity:0.8;font-size:14px;">Rojgar Suvidha — support@rojgarsuvidha.com</p>
              </div>
              <div style="background:white;border-radius:0 0 16px 16px;padding:24px;border:1px solid #e2e8f0;border-top:none;">
                <table style="width:100%;border-collapse:collapse;">
                  <tr><td style="padding:8px 0;color:#64748b;font-size:13px;width:120px;"><strong>Name</strong></td><td style="padding:8px 0;font-size:14px;">${name.trim()}</td></tr>
                  <tr><td style="padding:8px 0;color:#64748b;font-size:13px;"><strong>Email</strong></td><td style="padding:8px 0;font-size:14px;"><a href="mailto:${email}" style="color:#4f46e5;">${email}</a></td></tr>
                  <tr><td style="padding:8px 0;color:#64748b;font-size:13px;"><strong>Subject</strong></td><td style="padding:8px 0;font-size:14px;">${subject || "General Enquiry"}</td></tr>
                </table>
                <hr style="border:1px solid #f1f5f9;margin:16px 0;" />
                <p style="color:#64748b;font-size:13px;margin-bottom:8px;"><strong>Message:</strong></p>
                <p style="background:#f8fafc;padding:16px;border-radius:8px;font-size:14px;line-height:1.6;margin:0;color:#334155;">${message.trim().replace(/\n/g, "<br/>")}</p>
                <p style="margin-top:24px;font-size:12px;color:#94a3b8;">Sent from the Contact Us page at rojgarsuvidha.com</p>
              </div>
            </div>
          `,
        }),
      });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("[contact] API error:", err);
    return NextResponse.json(
      { error: "Something went wrong. Please try again or email us directly at support@rojgarsuvidha.com" },
      { status: 500 }
    );
  }
}
