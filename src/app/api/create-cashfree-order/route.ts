import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { amount, customerName, customerPhone, customerEmail, formId } = await req.json();

    const appId = process.env.CASHFREE_APP_ID;
    const secretKey = process.env.CASHFREE_SECRET_KEY;
    // Set 'production' for live, 'sandbox' for testing
    const environment = process.env.CASHFREE_ENVIRONMENT || "sandbox";

    if (!appId || !secretKey) {
      return NextResponse.json(
        { error: "Cashfree API keys are missing in environment variables." },
        { status: 500 }
      );
    }

    const baseUrl = environment === "production" 
      ? "https://api.cashfree.com/pg/orders" 
      : "https://sandbox.cashfree.com/pg/orders";

    const orderId = `order_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    const payload = {
      order_id: orderId,
      order_amount: amount,
      order_currency: "INR",
      customer_details: {
        customer_id: `cust_${Date.now()}`,
        customer_name: customerName || "Customer",
        customer_email: customerEmail || "test@gmail.com",
        customer_phone: customerPhone || "9999999999",
      },
      order_meta: {
        return_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/apply/${formId}?order_id={order_id}`
      }
    };

    const response = await fetch(baseUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-version": "2023-08-01",
        "x-client-id": appId,
        "x-client-secret": secretKey,
        "Accept": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Cashfree API Error:", data);
      return NextResponse.json({ error: data.message || "Failed to create Cashfree order" }, { status: response.status });
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Cashfree Order Exception:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
