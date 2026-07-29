import { NextResponse } from "next/server";
import Razorpay from "razorpay";

// Initialize Razorpay instance
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

export async function POST(req: Request) {
  try {
    const {
      amount,
      customerName,
      customerEmail,
      customerPhone,
      formId,
      orderId: clientOrderId,
    } = await req.json();

    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      return NextResponse.json(
        { error: "Razorpay credentials missing. Please check environment variables." },
        { status: 500 }
      );
    }

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: "Invalid amount." }, { status: 400 });
    }

    // Generate a unique receipt ID
    const receiptId = clientOrderId || `rcpt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    // Create Razorpay order (amount is in paise = Rs * 100)
    const order = await razorpay.orders.create({
      amount: Math.round(Number(amount) * 100), // Rs → paise
      currency: "INR",
      receipt: receiptId.substring(0, 40), // Razorpay receipt max 40 chars
      notes: {
        customer_name: customerName || "",
        customer_email: customerEmail || "",
        customer_phone: customerPhone || "",
        form_id: formId || "",
      },
    });

    return NextResponse.json({
      success: true,
      order_id: order.id,         // Razorpay order ID (e.g. order_XXXXXXXXX)
      receipt: receiptId,          // Our internal receipt/tracking ID
      amount: order.amount,        // In paise
      currency: order.currency,
      key_id: process.env.RAZORPAY_KEY_ID,
    });

  } catch (error: any) {
    console.error("Razorpay Order Creation Error:", error);
    return NextResponse.json(
      { error: error?.error?.description || error.message || "Failed to create payment order." },
      { status: 500 }
    );
  }
}
