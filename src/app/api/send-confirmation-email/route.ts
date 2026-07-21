import { NextResponse } from "next/server";

interface EmailPayload {
  userEmail: string;
  userName: string;
  jobTitle?: string;
  serviceName?: string;
  orderId: string;
  serviceType: "apply-for-me" | "e-suvidha";
  amount?: string;
  trackingUrl?: string;
}

function buildHtml(p: EmailPayload): string {
  const isAfm = p.serviceType === "apply-for-me";
  const firstName = p.userName.split(" ")[0];
  const serviceLabel = isAfm
    ? (p.jobTitle || "Government Job Application")
    : (p.serviceName || "e-Suvidha Service");
  const amountNum = parseFloat(p.amount || "0");
  const serviceCharge = isAfm ? 49 : 0; // ₹49 service charge (₹50 - ₹1 GST simplified)
  const gst = Math.round((amountNum * 0.18) / 1.18);
  const baseAmount = amountNum - gst;
  const trackLink = p.trackingUrl || `https://www.rojgarsuvidha.com/dashboard?tab=applications`;
  const todayStr = new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  const invoiceNo = `RS-INV-${p.orderId}`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Order Confirmed — Rojgar Suvidha</title>
</head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Inter,sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:24px 16px;">

    <!-- Header Gradient Banner -->
    <div style="background:linear-gradient(135deg,#4f46e5 0%,#7c3aed 50%,#db2777 100%);border-radius:20px 20px 0 0;padding:36px 32px 28px;text-align:center;position:relative;overflow:hidden;">
      <div style="position:absolute;top:-20px;right:-20px;width:120px;height:120px;background:rgba(255,255,255,0.08);border-radius:50%;"></div>
      <div style="position:absolute;bottom:-30px;left:-10px;width:80px;height:80px;background:rgba(255,255,255,0.06);border-radius:50%;"></div>
      <p style="color:#c7d2fe;font-size:11px;font-weight:800;letter-spacing:3px;margin:0 0 10px;text-transform:uppercase;">Rojgar Suvidha</p>
      <div style="display:inline-flex;align-items:center;justify-content:center;width:56px;height:56px;background:rgba(255,255,255,0.15);border-radius:16px;margin-bottom:14px;border:2px solid rgba(255,255,255,0.25);">
        <span style="font-size:24px;">✅</span>
      </div>
      <h1 style="color:white;font-size:24px;font-weight:900;margin:0 0 8px;line-height:1.2;">Order Confirmed!</h1>
      <p style="color:#e0e7ff;font-size:14px;margin:0;">Hey ${firstName}! Hamare experts aapka form 24 hours mein fill kar denge.</p>
    </div>

    <!-- Body Card -->
    <div style="background:white;border:1px solid #e2e8f0;border-top:none;padding:32px;">

      <!-- Tracking ID Hero -->
      <div style="background:linear-gradient(135deg,#eef2ff,#f5f3ff);border:2px solid #c7d2fe;border-radius:16px;padding:20px 24px;margin-bottom:28px;text-align:center;">
        <p style="font-size:11px;font-weight:800;color:#6366f1;text-transform:uppercase;letter-spacing:2px;margin:0 0 8px;">Your Tracking ID</p>
        <p style="font-size:32px;font-weight:900;color:#4f46e5;font-family:monospace;letter-spacing:4px;margin:0 0 10px;">${p.orderId}</p>
        <p style="font-size:12px;color:#818cf8;margin:0;">📸 Screenshot le lijiye ya neeche link se track karein</p>
        <a href="${trackLink}" style="display:inline-block;margin-top:12px;background:#4f46e5;color:white;font-size:13px;font-weight:700;padding:10px 24px;border-radius:10px;text-decoration:none;">🔍 Track My Application →</a>
      </div>

      <!-- Invoice Section -->
      <h2 style="font-size:15px;font-weight:800;color:#0f172a;margin:0 0 14px;">📋 Service Invoice</h2>
      <div style="border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;margin-bottom:28px;">
        <!-- Invoice Header -->
        <div style="background:#f8fafc;padding:12px 16px;border-bottom:1px solid #e2e8f0;display:flex;justify-content:space-between;align-items:center;">
          <div>
            <p style="font-size:12px;font-weight:800;color:#475569;margin:0;">Invoice No: <span style="color:#4f46e5;">${invoiceNo}</span></p>
          </div>
          <div style="text-align:right;">
            <p style="font-size:12px;color:#64748b;margin:0;">Date: ${todayStr}</p>
          </div>
        </div>
        <!-- Line Items -->
        <table style="width:100%;border-collapse:collapse;font-size:13px;">
          <thead>
            <tr style="background:#f1f5f9;">
              <th style="padding:10px 16px;text-align:left;color:#64748b;font-weight:700;font-size:11px;text-transform:uppercase;letter-spacing:0.5px;">Description</th>
              <th style="padding:10px 16px;text-align:right;color:#64748b;font-weight:700;font-size:11px;text-transform:uppercase;letter-spacing:0.5px;">Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr style="border-bottom:1px solid #f1f5f9;">
              <td style="padding:12px 16px;color:#0f172a;font-weight:600;">Apply For Me — Form Filling Service</td>
              <td style="padding:12px 16px;text-align:right;color:#0f172a;font-weight:600;">₹${baseAmount > 0 ? baseAmount : (amountNum || 50)}</td>
            </tr>
            <tr style="border-bottom:1px solid #f1f5f9;">
              <td style="padding:10px 16px;color:#64748b;font-size:12px;">For: ${serviceLabel}</td>
              <td style="padding:10px 16px;text-align:right;color:#64748b;font-size:12px;"></td>
            </tr>
            ${gst > 0 ? `
            <tr style="border-bottom:1px solid #f1f5f9;">
              <td style="padding:10px 16px;color:#64748b;font-size:12px;">GST (18%)</td>
              <td style="padding:10px 16px;text-align:right;color:#64748b;font-size:12px;">₹${gst}</td>
            </tr>` : ""}
            <tr style="background:#f0fdf4;">
              <td style="padding:14px 16px;font-weight:800;color:#15803d;font-size:15px;">Total Paid</td>
              <td style="padding:14px 16px;text-align:right;font-weight:900;color:#15803d;font-size:18px;">₹${amountNum || 50}</td>
            </tr>
          </tbody>
        </table>
        <!-- Payment Status Badge -->
        <div style="padding:10px 16px;text-align:center;border-top:1px solid #e2e8f0;background:#f8fafc;">
          <span style="background:#dcfce7;color:#16a34a;font-size:11px;font-weight:800;padding:4px 14px;border-radius:20px;letter-spacing:0.5px;">✅ PAYMENT RECEIVED — ORDER CONFIRMED</span>
        </div>
      </div>

      <!-- What Happens Next -->
      <h2 style="font-size:15px;font-weight:800;color:#0f172a;margin:0 0 16px;">⚡ What Happens Next?</h2>
      <div>
        ${[
          { step: "1", icon: "🔍", title: "Details Verification", desc: "Hamare experts aapke submitted documents aur details verify karenge." },
          { step: "2", icon: "📝", title: "Official Form Filling", desc: `Aapka form "${serviceLabel}" ke liye carefully fill kiya jayega — koi galti nahi hogi.` },
          { step: "3", icon: "✅", title: "Submission Confirmation", desc: "Form submit hone ke baad aapko email + WhatsApp confirmation milega." },
        ].map(s => `
          <div style="display:flex;gap:14px;margin-bottom:16px;align-items:flex-start;">
            <div style="width:40px;height:40px;background:linear-gradient(135deg,#4f46e5,#7c3aed);border-radius:12px;color:white;font-size:16px;display:flex;align-items:center;justify-content:center;flex-shrink:0;text-align:center;line-height:40px;">${s.icon}</div>
            <div>
              <p style="margin:0 0 3px;font-size:14px;font-weight:700;color:#0f172a;">${s.title}</p>
              <p style="margin:0;font-size:13px;color:#64748b;line-height:1.5;">${s.desc}</p>
            </div>
          </div>
        `).join("")}
      </div>

      <!-- Trust Bar -->
      <div style="background:linear-gradient(135deg,#f0fdf4,#dcfce7);border:1px solid #bbf7d0;border-radius:12px;padding:16px 20px;margin-top:24px;text-align:center;">
        <p style="font-size:13px;font-weight:800;color:#166534;margin:0 0 6px;">✓ 50,000+ Candidates Trusted Us</p>
        <p style="font-size:12px;color:#16a34a;margin:0;">99.8% Form Acceptance Rate &nbsp;|&nbsp; 24-Hour Processing &nbsp;|&nbsp; 100% Secure</p>
      </div>

      <!-- CTA Button -->
      <div style="text-align:center;margin:28px 0 0;">
        <a href="${trackLink}"
           style="display:inline-block;background:linear-gradient(135deg,#4f46e5,#7c3aed);color:white;font-weight:800;font-size:14px;padding:14px 36px;border-radius:14px;text-decoration:none;box-shadow:0 4px 14px rgba(79,70,229,0.35);">
          📋 Track My Application →
        </a>
        <p style="font-size:11px;color:#94a3b8;margin-top:10px;">Ya apna tracking ID <strong>${p.orderId}</strong> use karein</p>
      </div>
    </div>

    <!-- Footer -->
    <div style="background:#f1f5f9;border-radius:0 0 20px 20px;padding:20px 32px;text-align:center;border:1px solid #e2e8f0;border-top:none;">
      <p style="font-size:12px;color:#64748b;margin:0 0 6px;">Koi samasya? WhatsApp karein: <a href="https://wa.me/918877434088" style="color:#4f46e5;font-weight:700;">+91 88774 34088</a> ya email: <a href="mailto:support@rojgarsuvidha.com" style="color:#4f46e5;">support@rojgarsuvidha.com</a></p>
      <p style="font-size:11px;color:#94a3b8;margin:0;">© ${new Date().getFullYear()} Rojgar Suvidha · Sector 62, Noida, UP · India</p>
    </div>

  </div>
</body>
</html>`;
}

export async function POST(req: Request) {
  try {
    const body: EmailPayload = await req.json();
    const { userEmail, userName, orderId, serviceType } = body;

    if (!userEmail || !orderId) {
      return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
    }

    const resendKey = process.env.RESEND_API_KEY;
    if (!resendKey) {
      console.warn("[confirmation-email] RESEND_API_KEY not set. Email not sent for order:", orderId);
      return NextResponse.json({ success: true, skipped: true });
    }

    const isAfm = serviceType === "apply-for-me";
    const subject = isAfm
      ? `✅ Order Confirmed — Tracking ID: ${orderId} | Rojgar Suvidha`
      : `✅ e-Suvidha Order Confirmed — ${orderId} | Rojgar Suvidha`;

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Rojgar Suvidha <noreply@rojgarsuvidha.com>",
        to: [userEmail],
        subject,
        html: buildHtml(body),
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error("[confirmation-email] Resend error:", err);
      return NextResponse.json({ error: "Email delivery failed." }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("[confirmation-email] Unexpected error:", err);
    return NextResponse.json({ error: "Internal error." }, { status: 500 });
  }
}
