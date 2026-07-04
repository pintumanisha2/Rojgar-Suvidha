// Utility function to send a notification to a specific user.
// Call this from any page/component after a meaningful user action.

export async function sendUserNotification({
  userId,
  title,
  body,
  icon = "🔔",
  actionUrl = "/",
  type = "general",
  sendPush = false, // true = also trigger web push
}: {
  userId: string;
  title: string;
  body: string;
  icon?: string;
  actionUrl?: string;
  type?: "job_alert" | "form_reminder" | "payment" | "result" | "admit_card" | "system" | "general";
  sendPush?: boolean;
}) {
  try {
    await fetch("/api/notifications/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, title, body, icon, actionUrl, type, sendPush }),
    });
  } catch (err) {
    // Silent fail — don't block UI
    console.error("Notification trigger error:", err);
  }
}

// Trigger: Form visited but abandoned (call after 3 min timeout)
export function scheduleFormAbandonNotification(
  userId: string,
  jobTitle: string,
  actionUrl: string,
  delayMs: number = 3 * 60 * 1000 // 3 minutes
) {
  const timer = setTimeout(() => {
    sendUserNotification({
      userId,
      title: "Form Incomplete! ⚠️",
      body: `${jobTitle} ka form pura nahi hua. Last date kaafi paas aa rahi hai!`,
      icon: "⚠️",
      actionUrl,
      type: "form_reminder",
      sendPush: true,
    });
  }, delayMs);

  // Return cleanup function — call this on form submit/unmount
  return () => clearTimeout(timer);
}

// Trigger: Profile incomplete (call once on dashboard load)
export async function triggerProfileIncompleteNotification(
  userId: string,
  completionPercent: number
) {
  if (completionPercent < 80) {
    await sendUserNotification({
      userId,
      title: `Profile ${completionPercent}% Complete 👤`,
      body: "Apna profile poora karein aur Apply For Me service unlock karein!",
      icon: "👤",
      actionUrl: "/dashboard?tab=profile",
      type: "system",
    });
  }
}

// Trigger: Payment success
export async function triggerPaymentSuccessNotification(
  userId: string,
  serviceName: string,
  trackingId: string
) {
  await sendUserNotification({
    userId,
    title: "Payment Successful! ✅",
    body: `Aapki "${serviceName}" request place ho gayi. Tracking ID: ${trackingId}`,
    icon: "✅",
    actionUrl: "/track-application",
    type: "payment",
    sendPush: true,
  });
}

// Trigger: Application status changed by admin
export async function triggerApplicationStatusNotification(
  userId: string,
  jobTitle: string,
  newStatus: string,
  trackingId: string
) {
  const statusMessages: Record<string, string> = {
    processing: "Hamari team aapka form bhar rahi hai...",
    otp_required: "OTP required hai! Turant check karein.",
    submitted: `Form successfully submit! Registration no. check karein.`,
    completed: `🎉 ${jobTitle} ka form successfully submit ho gaya!`,
    failed: "Kuch problem aayi. Hamari team aapse contact karegi.",
  };

  await sendUserNotification({
    userId,
    title: `Application Update: ${jobTitle}`,
    body: statusMessages[newStatus] || `Status: ${newStatus}`,
    icon: newStatus === "completed" ? "🎉" : newStatus === "failed" ? "❌" : "📝",
    actionUrl: `/track-application`,
    type: "system",
    sendPush: true,
  });
}
