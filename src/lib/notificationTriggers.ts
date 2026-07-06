// ============================================================
// Rojgar Suvidha — Personalized Notification Triggers
// Category-aware: SSC, BPSC, Railway, Banking, UPSC, Police etc.
// ============================================================

// ── Job Category Detection ──────────────────────────────
export interface JobCategory {
  key: string;
  label: string;
  emoji: string;
  color: string;
  url: string;
  actionLabel: string;
}

const JOB_CATEGORIES: JobCategory[] = [
  { key: "ssc",      label: "SSC",      emoji: "🏛️",  color: "#4F46E5", url: "/jobs/ssc",     actionLabel: "View SSC Jobs" },
  { key: "bpsc",     label: "BPSC",     emoji: "🏢",  color: "#059669", url: "/jobs/state-psc", actionLabel: "View BPSC Jobs" },
  { key: "uppsc",    label: "UPPSC",    emoji: "🏢",  color: "#059669", url: "/jobs/state-psc", actionLabel: "View UPPSC Jobs" },
  { key: "railway",  label: "Railway",  emoji: "🚂",  color: "#DC2626", url: "/jobs/railway", actionLabel: "View Railway Jobs" },
  { key: "rrb",      label: "Railway",  emoji: "🚂",  color: "#DC2626", url: "/jobs/railway", actionLabel: "View Railway Jobs" },
  { key: "banking",  label: "Banking",  emoji: "🏦",  color: "#D97706", url: "/jobs/banking", actionLabel: "View Bank Jobs" },
  { key: "ibps",     label: "IBPS",     emoji: "🏦",  color: "#D97706", url: "/jobs/banking", actionLabel: "View IBPS Jobs" },
  { key: "sbi",      label: "SBI",      emoji: "🏦",  color: "#D97706", url: "/jobs/banking", actionLabel: "View SBI Jobs" },
  { key: "upsc",     label: "UPSC",     emoji: "🎖️",  color: "#7C3AED", url: "/jobs/upsc",    actionLabel: "View UPSC Jobs" },
  { key: "police",   label: "Police",   emoji: "👮",  color: "#1D4ED8", url: "/jobs/police",  actionLabel: "View Police Jobs" },
  { key: "defence",  label: "Defence",  emoji: "🛡️",  color: "#065F46", url: "/jobs/defence", actionLabel: "View Defence Jobs" },
  { key: "army",     label: "Army",     emoji: "🛡️",  color: "#065F46", url: "/jobs/defence", actionLabel: "View Army Jobs" },
  { key: "teaching", label: "Teaching", emoji: "📚",  color: "#9333EA", url: "/jobs/teaching", actionLabel: "View Teaching Jobs" },
  { key: "ctet",     label: "CTET",     emoji: "📚",  color: "#9333EA", url: "/jobs/teaching", actionLabel: "View CTET Jobs" },
];

/** Detect job category from any job title string */
export function detectJobCategory(jobTitle: string): JobCategory {
  const lower = jobTitle.toLowerCase();
  for (const cat of JOB_CATEGORIES) {
    if (lower.includes(cat.key)) return cat;
  }
  return { key: "general", label: "Sarkari Naukri", emoji: "💼", color: "#4F46E5", url: "/latest-jobs", actionLabel: "View All Jobs" };
}

// ── Core Send Function ──────────────────────────────────
export async function sendUserNotification({
  userId,
  title,
  body,
  icon = "🔔",
  actionUrl = "/",
  type = "general",
  sendPush = false,
  pushExtras = {},
}: {
  userId: string;
  title: string;
  body: string;
  icon?: string;
  actionUrl?: string;
  type?: "job_alert" | "form_reminder" | "payment" | "result" | "admit_card" | "system" | "general";
  sendPush?: boolean;
  pushExtras?: Record<string, string>; // extra fields forwarded to push payload
}) {
  try {
    await fetch("/api/notifications/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, title, body, icon, actionUrl, type, sendPush, pushExtras }),
    });
  } catch (err) {
    console.error("Notification trigger error:", err);
  }
}

// ── TRIGGER 1: Form Abandoned (category-aware) ──────────
/**
 * Call this when a user visits a job/form page.
 * After `delayMs` (default 3 min), if they haven't submitted, sends a personalized reminder.
 * Returns a cleanup function — call it on form submit or page unmount.
 */
export function scheduleFormAbandonNotification(
  userId: string,
  jobTitle: string,
  formUrl: string,
  delayMs: number = 3 * 60 * 1000
) {
  const cat = detectJobCategory(jobTitle);

  const timer = setTimeout(() => {
    sendUserNotification({
      userId,
      title: `${cat.emoji} ${cat.label} Form Incomplete!`,
      body: `The form for "${jobTitle}" is still incomplete. Don't miss the deadline!`,
      icon: cat.emoji,
      actionUrl: formUrl,
      type: "form_reminder",
      sendPush: true,
      pushExtras: {
        tag: `form-abandon-${userId}`,
        actionLabel: cat.actionLabel,
        jobTitle,
        category: cat.key,
      },
    });
  }, delayMs);

  return () => clearTimeout(timer);
}

// ── TRIGGER 2: Payment Success ──────────────────────────
export async function triggerPaymentSuccessNotification(
  userId: string,
  jobTitle: string,
  trackingId: string
) {
  const cat = detectJobCategory(jobTitle);
  await sendUserNotification({
    userId,
    title: `✅ Apply For Me — Successful!`,
    body: `"${jobTitle}" request placed! Tracking ID: ${trackingId}. Our team will start processing it shortly.`,
    icon: "✅",
    actionUrl: "/track-application",
    type: "payment",
    sendPush: true,
    pushExtras: {
      tag: `payment-${trackingId}`,
      actionLabel: "Track Order",
      jobTitle,
      category: cat.key,
    },
  });
}

// ── TRIGGER 3: Application Status Updated (by admin) ────
export async function triggerApplicationStatusNotification(
  userId: string,
  jobTitle: string,
  newStatus: string,
  trackingId: string
) {
  const cat = detectJobCategory(jobTitle);
  const statusMap: Record<string, { emoji: string; msg: string }> = {
    processing:    { emoji: "⏳", msg: "Our team is filling your application form..." },
    otp_required:  { emoji: "🔑", msg: "OTP required! Please verify immediately." },
    submitted:     { emoji: "📝", msg: "Form submitted! Please confirm your registration." },
    completed:     { emoji: "🎉", msg: "Form submitted successfully! Congratulations!" },
    failed:        { emoji: "❌", msg: "An issue occurred. Our team will contact you shortly." },
  };
  const s = statusMap[newStatus] || { emoji: "🔔", msg: `Status updated to: ${newStatus}` };

  await sendUserNotification({
    userId,
    title: `${s.emoji} ${cat.label} Application Update`,
    body: `"${jobTitle}": ${s.msg}`,
    icon: s.emoji,
    actionUrl: "/track-application",
    type: "system",
    sendPush: true,
    pushExtras: {
      tag: `status-${trackingId}`,
      actionLabel: "View Status",
      jobTitle,
      category: cat.key,
    },
  });
}

// ── TRIGGER 4: Profile Incomplete ──────────────────────
export async function triggerProfileIncompleteNotification(
  userId: string,
  completionPercent: number
) {
  if (completionPercent < 80) {
    await sendUserNotification({
      userId,
      title: `👤 Profile ${completionPercent}% Complete`,
      body: "Complete your profile to unlock the 'Apply For Me' service and personalized job alerts!",
      icon: "👤",
      actionUrl: "/dashboard?tab=profile",
      type: "system",
    });
  }
}

// ── TRIGGER 5: New Job Alert (category-aware) ──────────
export async function triggerJobAlertNotification(
  userId: string,
  jobTitle: string,
  jobUrl: string,
  vacancies?: string
) {
  const cat = detectJobCategory(jobTitle);
  await sendUserNotification({
    userId,
    title: `${cat.emoji} New ${cat.label} Vacancy!`,
    body: `${jobTitle}${vacancies ? ` — ${vacancies} vacancies` : ""}. Apply now!`,
    icon: cat.emoji,
    actionUrl: jobUrl,
    type: "job_alert",
    sendPush: true,
    pushExtras: {
      tag: `job-alert-${cat.key}`,
      actionLabel: cat.actionLabel,
      jobTitle,
      category: cat.key,
    },
  });
}

// ── TRIGGER 6: Re-engagement (7 days inactive) ─────────
export async function triggerReEngagementNotification(
  userId: string,
  matchCount: number = 5
) {
  await sendUserNotification({
    userId,
    title: `🔔 ${matchCount} New Jobs For You!`,
    body: "It's been 7 days! View new vacancies matching your profile.",
    icon: "🔔",
    actionUrl: "/latest-jobs",
    type: "job_alert",
    sendPush: true,
    pushExtras: {
      tag: "re-engagement",
      actionLabel: "View Jobs",
      category: "general",
    },
  });
}
