import { NextResponse } from "next/server";
import crypto from "crypto";

export async function POST(req: Request) {
  try {
    const { amount, customerName, customerPhone, customerEmail, formId, orderId: clientOrderId, extraParams } = await req.json();

    const merchantId = process.env.PHONEPE_MERCHANT_ID;
    const saltKey = process.env.PHONEPE_SALT_KEY;
    const saltIndex = process.env.PHONEPE_SALT_INDEX || "1";
    const environment = process.env.PHONEPE_ENV || "production";

    if (!merchantId || !saltKey) {
      return NextResponse.json(
        { error: "PhonePe credentials are missing in environment variables." },
        { status: 500 }
      );
    }

    const orderId = clientOrderId || `order_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    const proto = req.headers.get("x-forwarded-proto") || "https";
    const host = req.headers.get("host") || "www.rojgarsuvidha.com";
    
    let redirectPath = `/apply/${formId}`;
    if (formId && formId.startsWith("esuvidha-")) {
      const serviceId = formId.replace("esuvidha-", "");
      redirectPath = `/e-suvidha/apply/${serviceId}`;
    } else if (formId === "apply-for-me" || formId === "apply_for_me") {
      redirectPath = `/apply-for-me`;
    }

    let extraQuery = "";
    if (extraParams) {
      const queryParts = Object.entries(extraParams)
        .filter(([_, v]) => v !== undefined && v !== null)
        .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`);
      if (queryParts.length > 0) {
        extraQuery = `&${queryParts.join("&")}`;
      }
    }

    const redirectUrl = `${proto}://${host}${redirectPath}?order_id=${orderId}${extraQuery}`;
    const callbackUrl = `${proto}://${host}/api/payment/phonepe-webhook`;

    const payload = {
      merchantId,
      merchantTransactionId: orderId,
      merchantUserId: `user_${Date.now()}`,
      amount: Math.round(Number(amount) * 100), // convert Rs to paise
      redirectUrl,
      redirectMode: "REDIRECT",
      callbackUrl,
      mobileNumber: customerPhone ? customerPhone.replace(/\D/g, "").slice(-10) : "9999999999",
      paymentInstrument: {
        type: "PAY_PAGE",
      },
    };

    const base64Payload = Buffer.from(JSON.stringify(payload)).toString("base64");
    const stringToHash = base64Payload + "/pg/v1/pay" + saltKey;
    const sha256 = crypto.createHash("sha256").update(stringToHash).digest("hex");
    const checksum = sha256 + "###" + saltIndex;

    const baseUrl = environment === "production"
      ? "https://api.phonepe.com/apis/hermes/pg/v1/pay"
      : "https://api-preprod.phonepe.com/apis/pg-sandbox/pg/v1/pay";

    const response = await fetch(baseUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-VERIFY": checksum,
        Accept: "application/json",
      },
      body: JSON.stringify({ request: base64Payload }),
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      console.error("PhonePe API Error:", data);
      return NextResponse.json({ error: data.message || "Failed to create PhonePe payment" }, { status: response.status || 400 });
    }

    return NextResponse.json({
      success: true,
      payment_session_id: orderId, // compatibility fallback
      redirectUrl: data.data.instrumentResponse.redirectInfo.url,
      order_id: orderId
    });
  } catch (error: any) {
    console.error("PhonePe Order Exception:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
