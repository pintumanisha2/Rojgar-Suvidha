import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ── Trigger Automation After Successful Payment ──────────────────────────────
async function triggerPostPaymentAutomation(params: {
  trackingId: string;
  userName: string;
  userEmail: string;
  userPhone: string;
  jobTitle: string;
  totalPaid: number;
  userId?: string;
}) {
  const { trackingId, userName, userEmail, userPhone, jobTitle, totalPaid, userId } = params;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://www.rojgarsuvidha.com";

  const automationPromises: PromiseLike<any>[] = [];

  // 1. Send Premium Invoice Email
  if (userEmail) {
    automationPromises.push(
      fetch(`${baseUrl}/api/send-confirmation-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userEmail,
          userName,
          jobTitle,
          serviceName: jobTitle,
          orderId: trackingId,
          serviceType: "apply-for-me",
          amount: String(totalPaid),
          trackingUrl: `${baseUrl}/track/${trackingId}`,
        }),
      }).catch(e => console.error("[webhook] Email trigger failed:", e))
    );
  }

  // 2. Send WhatsApp Confirmation Message
  if (userPhone) {
    automationPromises.push(
      fetch(`${baseUrl}/api/whatsapp-confirm`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: userPhone,
          name: userName,
          trackingId,
          jobTitle,
          amount: totalPaid,
          trackingUrl: `${baseUrl}/track/${trackingId}`,
        }),
      }).catch(e => console.error("[webhook] WhatsApp trigger failed:", e))
    );
  }

  // 3. Create Admin Notification in DB
  automationPromises.push(
    supabaseAdmin.from("notifications").insert([{
      user_id: null, // null = admin-level notification
      title: "New Apply For Me Order! 🎉",
      message: `${userName} ne apply kiya: "${jobTitle}" | ₹${totalPaid} paid | Tracking: ${trackingId}`,
      type: "new_order",
      is_read: false,
      created_at: new Date().toISOString(),
    }]).then(({ error }) => {
      if (error) console.error("[webhook] Admin notification insert failed:", error);
    })
  );

  // 4. Send In-App Push Notification to User
  if (userId) {
    automationPromises.push(
      supabaseAdmin.from("notifications").insert([{
        user_id: userId,
        title: "Order Confirmed! ✅",
        message: `Aapka Apply For Me order confirm ho gaya! Tracking ID: ${trackingId}. Hamare experts 24 hours mein aapka form fill kar denge.`,
        type: "order_confirmed",
        is_read: false,
        created_at: new Date().toISOString(),
      }]).then(({ error }) => {
        if (error) console.error("[webhook] User notification insert failed:", error);
      })
    );
  }

  // Run all automations in parallel
  await Promise.allSettled(automationPromises);
  console.log(`[webhook] ✅ Post-payment automation complete for tracking: ${trackingId}`);
}

export async function POST(req: Request) {
  try {
    const headerXVerify = req.headers.get("X-VERIFY");
    if (!headerXVerify) {
      return NextResponse.json({ error: "Missing verification signature" }, { status: 400 });
    }

    const { response: base64Payload } = await req.json();
    if (!base64Payload) {
      return NextResponse.json({ error: "Missing payload" }, { status: 400 });
    }

    const saltKey = process.env.PHONEPE_SALT_KEY;
    const saltIndex = process.env.PHONEPE_SALT_INDEX || "1";

    if (!saltKey) {
      return NextResponse.json({ error: "Webhook salt key not configured" }, { status: 500 });
    }

    // Verify webhook signature
    const stringToHash = base64Payload + saltKey;
    const sha256 = crypto.createHash("sha256").update(stringToHash).digest("hex");
    const expectedChecksum = sha256 + "###" + saltIndex;

    if (headerXVerify !== expectedChecksum) {
      console.warn("PhonePe Webhook validation failed. Expected:", expectedChecksum, "Got:", headerXVerify);
      return NextResponse.json({ error: "Invalid signature verification" }, { status: 401 });
    }

    // Decode base64 payload
    const decodedText = Buffer.from(base64Payload, "base64").toString("utf-8");
    const payload = JSON.parse(decodedText);

    if (!payload.success || payload.code !== "PAYMENT_SUCCESS") {
      console.log("PhonePe Webhook reported unsuccessful payment status:", payload.code);
      return NextResponse.json({ success: true, message: "Logged unsuccessful state" });
    }

    const merchantTransactionId = payload.data?.merchantTransactionId;
    if (!merchantTransactionId) {
      return NextResponse.json({ error: "Missing transaction ID" }, { status: 400 });
    }

    console.log("Processing PhonePe payment webhook for:", merchantTransactionId);

    // 1. Try to match user_applications (direct checkout form)
    const parts = merchantTransactionId.split("_");
    const trackingCode = parts.length > 1 ? parts[1] : merchantTransactionId;

    const { data: userApp, error: appErr } = await supabaseAdmin
      .from("user_applications")
      .select("id, coupon_applied, full_name, email, phone, user_id, total_paid, form_id, selected_post_name")
      .eq("tracking_id", trackingCode)
      .maybeSingle();

    if (!appErr && userApp) {
      const { error: updateErr } = await supabaseAdmin
        .from("user_applications")
        .update({ payment_status: "paid" })
        .eq("id", userApp.id);

      if (!updateErr) {
        console.log(`Successfully updated user_application ${userApp.id} to paid`);

        // Fetch job title from form
        let jobTitle = userApp.selected_post_name || "Government Job";
        try {
          const { data: formData } = await supabaseAdmin
            .from("custom_forms")
            .select("title")
            .eq("id", userApp.form_id)
            .single();
          if (formData?.title) jobTitle = formData.title;
        } catch (e) {}

        // 🚀 Trigger full post-payment automation
        await triggerPostPaymentAutomation({
          trackingId: trackingCode,
          userName: userApp.full_name || "Candidate",
          userEmail: userApp.email || "",
          userPhone: userApp.phone || "",
          jobTitle,
          totalPaid: userApp.total_paid || 0,
          userId: userApp.user_id,
        });

        // Handle coupon usage increment
        if (userApp.coupon_applied) {
          try {
            const { data: couponData } = await supabaseAdmin
              .from("coupons")
              .select("id, used_count")
              .eq("code", userApp.coupon_applied)
              .single();
            if (couponData) {
              const { error: rpcErr } = await supabaseAdmin.rpc('increment_coupon_usage', { coupon_id: couponData.id });
              if (rpcErr) {
                await supabaseAdmin.from("coupons").update({ used_count: couponData.used_count + 1 }).eq("id", couponData.id);
              }
            }
          } catch (cErr) {
            console.error("Failed to update coupon usage in webhook:", cErr);
          }
        }
      } else {
        console.error("Failed to update user_application payment status:", updateErr);
      }
    }

    // 2. Try to match apply_for_me_requests
    const { data: request, error: reqErr } = await supabaseAdmin
      .from("apply_for_me_requests")
      .select("id, full_name, email, phone, user_id, amount, service_name")
      .eq("tracking_id", merchantTransactionId)
      .maybeSingle();

    if (!reqErr && request) {
      const { error: updateErr } = await supabaseAdmin
        .from("apply_for_me_requests")
        .update({ status: "paid" })
        .eq("id", request.id);

      if (!updateErr) {
        console.log(`Successfully updated apply_for_me_request ${request.id} to paid`);

        // 🚀 Trigger full post-payment automation
        await triggerPostPaymentAutomation({
          trackingId: merchantTransactionId,
          userName: request.full_name || "Candidate",
          userEmail: request.email || "",
          userPhone: request.phone || "",
          jobTitle: request.service_name || "e-Suvidha Service",
          totalPaid: request.amount || 0,
          userId: request.user_id,
        });
      } else {
        console.error("Failed to update apply_for_me_request status:", updateErr);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("PhonePe Webhook error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
