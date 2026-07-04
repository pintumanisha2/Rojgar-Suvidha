import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import webpush from "web-push";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

if (process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    "mailto:admin@rojgarsuvidha.com",
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
}

// POST: Send personalized notification to one user or all users
export async function POST(req: Request) {
  try {
    const {
      userId,
      title,
      body,
      icon = "🔔",
      actionUrl = "/",
      type = "general",
      sendPush = true,
      pushExtras = {},   // ← category, tag, actionLabel, jobTitle from triggers
    } = await req.json();

    if (!title || !body) {
      return NextResponse.json({ error: "title and body required" }, { status: 400 });
    }

    // ── Step 1: Save In-App notification(s) to DB ──────────
    if (userId) {
      await supabaseAdmin.from("notifications").insert({
        user_id: userId, title, body, icon, action_url: actionUrl, type,
      });
    } else {
      // Broadcast to ALL users
      const { data: profiles } = await supabaseAdmin.from("profiles").select("id");
      if (profiles && profiles.length > 0) {
        await supabaseAdmin.from("notifications").insert(
          profiles.map((p: any) => ({ user_id: p.id, title, body, icon, action_url: actionUrl, type }))
        );
      }
    }

    // ── Step 2: Send Premium Web Push ─────────────────────
    if (sendPush) {
      let subsQuery = supabaseAdmin.from("push_subscriptions").select("subscription_data, user_id");
      if (userId) subsQuery = subsQuery.eq("user_id", userId);

      const { data: subs } = await subsQuery;

      if (subs && subs.length > 0) {
        // Rich push payload — merged with pushExtras for category personalization
        const pushPayload = JSON.stringify({
          title,
          body,
          url:         actionUrl,
          icon:        "/logo-blue.png",
          tag:         pushExtras.tag         || "rojgar-suvidha",
          actionLabel: pushExtras.actionLabel || "Abhi Dekho",
          jobTitle:    pushExtras.jobTitle    || "",
          category:    pushExtras.category    || "general",
          requireInteraction: false,
        });

        const pushResults = await Promise.allSettled(
          subs.map((sub: any) =>
            webpush.sendNotification(sub.subscription_data, pushPayload).catch(() => null)
          )
        );
        console.log(`Push sent: ${pushResults.filter(r => r.status === "fulfilled").length}/${subs.length}`);
      }
    }

    return NextResponse.json({ success: true, message: "Notification sent!" });
  } catch (err: any) {
    console.error("Send notification error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
