const dotenv = require('dotenv');
const path = require('path');

// Load .env.local
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const appId = process.env.CASHFREE_APP_ID;
const secretKey = process.env.CASHFREE_SECRET_KEY;
const environment = process.env.CASHFREE_ENVIRONMENT || "sandbox";

async function test() {
  console.log("Testing Cashfree Sandbox Order Creation...");
  console.log("App ID:", appId);
  console.log("Secret Key length:", secretKey ? secretKey.length : 0);
  console.log("Environment:", environment);

  const baseUrl = environment === "production" 
    ? "https://api.cashfree.com/pg/orders" 
    : "https://sandbox.cashfree.com/pg/orders";

  const orderId = `order_test_${Date.now()}`;
  const payload = {
    order_id: orderId,
    order_amount: 1.00,
    order_currency: "INR",
    customer_details: {
      customer_id: "cust_test_123",
      customer_name: "Test User",
      customer_email: "test@gmail.com",
      customer_phone: "9999999999",
    },
    order_meta: {
      return_url: "https://www.rojgarsuvidha.com/apply-for-me?order_id={order_id}"
    }
  };

  try {
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
    console.log("Status Code:", response.status);
    
    if (response.ok) {
      console.log("Success! Created Order details:");
      console.log("- Order ID:", data.order_id);
      console.log("- Payment Session ID:", data.payment_session_id);
      console.log("- Order Status:", data.order_status);
    } else {
      console.error("Cashfree API Error Response:", data);
    }
  } catch (err) {
    console.error("Exception occurred during fetch:", err);
  }
}

test();
