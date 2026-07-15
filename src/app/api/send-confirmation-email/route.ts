import { NextResponse } from "next/server";

interface EmailPayload {
  userEmail: string;
  userName: string;
  jobTitle?: string;
  serviceName?: string;
  orderId: string;
  serviceType: "apply-for-me" | "e-suvidha";
  amount?: string;
}

function buildHtml(p: EmailPayload): string {
  const isAfm = p.serviceType === "apply-for-me";
  const title = isAfm
    ? `Apply For Me — Application Received!`
    : `e-Suvidha Service — Order Confirmed!`;
  const serviceLabel = isAfm
    ? (p.jobTitle || "Your Selected Vacancy")
    : (p.serviceName || "Your Selected Service");
  const nextSteps = isAfm
    ? [
        "Our team will verify your submitted details.",
        "Your government form will be filled carefully by our experts.",
        "You will receive a confirmation once your form is successfully submitted.",
      ]
    : [
        "Our team will review your submitted documents.",
        "The service will be processed on the official government portal.",
        "You will be notified via email or WhatsApp once completed.",
      ];

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:Inter,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:24px 16px;">

    <!-- Header -->
    <div style="background:linear-gradient(135deg,#4f46e5,#7c3aed);border-radius:20px 20px 0 0;padding:32px 32px 24px;text-align:center;">
      <p style="color:#c7d2fe;font-size:13px;font-weight:700;letter-spacing:2px;margin:0 0 8px;">ROJGAR SUVIDHA</p>
      <h1 style="color:white;font-size:22px;font-weight:900;margin:0 0 8px;line-height:1.3;">${title}</h1>
      <p style="color:#c7d2fe;font-size:14px;margin:0;">Thank you, ${p.userName.split(" ")[0]}! Your order has been received.</p>
    </div>

    <!-- Body -->
    <div style="background:white;padding:32px;border:1px solid #e2e8f0;border-top:none;">

      <!-- Order Details -->
      <div style="background:#f8fafc;border-radius:12px;padding:20px;margin-bottom:24px;border:1px solid #e2e8f0;">
        <p style="font-size:12px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:1px;margin:0 0 12px;">Order Details</p>
        <table style="width:100%;border-collapse:collapse;">
          <tr>
            <td style="padding:6px 0;font-size:13px;color:#64748b;width:140px;">Tracking ID</td>
            <td style="padding:6px 0;font-size:14px;font-weight:900;color:#4f46e5;font-family:monospace;">${p.orderId}</td>
          </tr>
          <tr>
            <td style="padding:6px 0;font-size:13px;color:#64748b;">Service</td>
            <td style="padding:6px 0;font-size:14px;font-weight:600;color:#0f172a;">${serviceLabel}</td>
          </tr>
          <tr>
            <td style="padding:6px 0;font-size:13px;color:#64748b;">Status</td>
            <td style="padding:6px 0;"><span style="background:#dcfce7;color:#16a34a;font-size:12px;font-weight:700;padding:3px 10px;border-radius:20px;">✅ Payment Received</span></td>
          </tr>
          ${p.amount ? `<tr><td style="padding:6px 0;font-size:13px;color:#64748b;">Amount Paid</td><td style="padding:6px 0;font-size:14px;font-weight:700;color:#0f172a;">₹${p.amount}</td></tr>` : ""}
        </table>
      </div>

      <!-- What Happens Next -->
      <h2 style="font-size:16px;font-weight:800;color:#0f172a;margin:0 0 16px;">What Happens Next?</h2>
      <div style="space-y:8px;">
        ${nextSteps.map((step, i) => `
          <div style="display:flex;align-items:flex-start;gap:12px;margin-bottom:12px;">
            <div style="width:28px;height:28px;background:#4f46e5;border-radius:50%;color:white;font-weight:900;font-size:13px;display:flex;align-items:center;justify-content:center;flex-shrink:0;min-width:28px;text-align:center;line-height:28px;">${i + 1}</div>
            <p style="margin:4px 0 0;font-size:14px;color:#475569;line-height:1.5;">${step}</p>
          </div>
        `).join("")}
      </div>

      <!-- Track Application -->
      <div style="text-align:center;margin:28px 0 0;">
        <a href="https://www.rojgarsuvidha.com/dashboard?tab=orders"
           style="display:inline-block;background:#4f46e5;color:white;font-weight:700;font-size:14px;padding:12px 28px;border-radius:12px;text-decoration:none;">
          Track Your Application →
        </a>
      </div>
    </div>

    <!-- Footer -->
    <div style="background:#f1f5f9;border-radius:0 0 20px 20px;padding:20px 32px;text-align:center;border:1px solid #e2e8f0;border-top:none;">
      <p style="font-size:12px;color:#94a3b8;margin:0 0 6px;">Need help? Contact us at <a href="mailto:support@rojgarsuvidha.com" style="color:#4f46e5;">support@rojgarsuvidha.com</a> or call +91 88774 34088</p>
      <p style="font-size:11px;color:#cbd5e1;margin:0;">© ${new Date().getFullYear()} Rojgar Suvidha (Pintu Kumar) · Sector 62, Noida, UP</p>
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
      // Email service not configured yet — log and return success so payment flow is unblocked
      console.warn("[confirmation-email] RESEND_API_KEY not set. Email not sent for order:", orderId);
      return NextResponse.json({ success: true, skipped: true });
    }

    const isAfm = serviceType === "apply-for-me";
    const subject = isAfm
      ? `✅ Your Apply For Me order is confirmed — Tracking ID: ${orderId}`
      : `✅ Your e-Suvidha service is confirmed — Order: ${orderId}`;

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
