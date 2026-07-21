import { NextResponse } from "next/server";

export const maxDuration = 15;

interface WhatsAppPayload {
  phone: string;
  name: string;
  trackingId: string;
  jobTitle: string;
  amount: number;
  trackingUrl?: string;
}

export async function POST(req: Request) {
  try {
    const body: WhatsAppPayload = await req.json();
    const { phone, name, trackingId, jobTitle, amount, trackingUrl } = body;

    if (!phone || !trackingId) {
      return NextResponse.json({ error: "Missing phone or trackingId" }, { status: 400 });
    }

    const msg91AuthKey = process.env.MSG91_AUTH_KEY;
    const msg91TemplateId = process.env.MSG91_WHATSAPP_TEMPLATE_ID;
    const msg91IntegratedNumber = process.env.MSG91_WHATSAPP_NUMBER; // Your registered WhatsApp business number

    // ── Option A: MSG91 WhatsApp API (recommended for India) ─────────────────
    if (msg91AuthKey && msg91TemplateId && msg91IntegratedNumber) {
      const firstName = name.split(" ")[0];
      const amountStr = amount > 0 ? `₹${amount}` : "Free";
      const link = trackingUrl || "https://www.rojgarsuvidha.com/dashboard?tab=applications";

      // MSG91 WhatsApp Flow API
      const msg91Payload = {
        integrated_number: msg91IntegratedNumber,
        content_type: "template",
        payload: {
          to: `91${phone.replace(/\D/g, "").slice(-10)}`, // Format: 91XXXXXXXXXX
          type: "template",
          template: {
            name: msg91TemplateId,
            language: { code: "en" },
            components: [
              {
                type: "header",
                parameters: [{ type: "text", text: `✅ Order Confirmed! — ${trackingId}` }]
              },
              {
                type: "body",
                parameters: [
                  { type: "text", text: firstName },
                  { type: "text", text: jobTitle },
                  { type: "text", text: trackingId },
                  { type: "text", text: amountStr },
                  { type: "text", text: link },
                ]
              }
            ]
          }
        }
      };

      const response = await fetch("https://api.msg91.com/api/v5/whatsapp/whatsapp-outbound-message/bulk/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authkey": msg91AuthKey,
        },
        body: JSON.stringify(msg91Payload),
      });

      const result = await response.json();
      if (!response.ok) {
        console.error("[whatsapp-confirm] MSG91 error:", result);
        return NextResponse.json({ error: "WhatsApp delivery failed via MSG91", details: result }, { status: 500 });
      }

      console.log("[whatsapp-confirm] ✅ MSG91 WhatsApp sent:", result);
      return NextResponse.json({ success: true, provider: "msg91" });
    }

    // ── Option B: Fallback — send via Twilio WhatsApp (if configured) ────────
    const twilioSid = process.env.TWILIO_ACCOUNT_SID;
    const twilioToken = process.env.TWILIO_AUTH_TOKEN;
    const twilioFrom = process.env.TWILIO_WHATSAPP_FROM; // e.g. whatsapp:+14155238886

    if (twilioSid && twilioToken && twilioFrom) {
      const firstName = name.split(" ")[0];
      const amountStr = amount > 0 ? `₹${amount}` : "Free";
      const link = trackingUrl || "https://www.rojgarsuvidha.com/dashboard?tab=applications";

      const messageBody = 
`Hii *${firstName}* 👋

✅ *Aapka Apply For Me order confirm ho gaya!*

📋 *Job:* ${jobTitle}
🆔 *Tracking ID:* \`${trackingId}\`
💰 *Amount Paid:* ${amountStr}

Hamare experts *24 hours mein* aapka form fill kar denge.

🔍 *Track karo yahan:*
${link}

Koi bhi samasya ho toh reply karein.
— *Team Rojgar Suvidha* 🙏`;

      const encodedBody = new URLSearchParams({
        To: `whatsapp:+91${phone.replace(/\D/g, "").slice(-10)}`,
        From: twilioFrom,
        Body: messageBody,
      });

      const response = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Authorization: "Basic " + Buffer.from(`${twilioSid}:${twilioToken}`).toString("base64"),
          },
          body: encodedBody,
        }
      );

      const result = await response.json();
      if (!response.ok) {
        console.error("[whatsapp-confirm] Twilio error:", result);
        return NextResponse.json({ error: "WhatsApp delivery failed via Twilio", details: result }, { status: 500 });
      }

      console.log("[whatsapp-confirm] ✅ Twilio WhatsApp sent:", result.sid);
      return NextResponse.json({ success: true, provider: "twilio" });
    }

    // ── No provider configured ────────────────────────────────────────────────
    console.warn("[whatsapp-confirm] No WhatsApp provider configured (MSG91 or Twilio). Set env vars to enable.");
    return NextResponse.json({ success: true, skipped: true, reason: "No WhatsApp provider configured" });

  } catch (err: any) {
    console.error("[whatsapp-confirm] Unexpected error:", err);
    return NextResponse.json({ error: "Internal error", details: err.message }, { status: 500 });
  }
}
