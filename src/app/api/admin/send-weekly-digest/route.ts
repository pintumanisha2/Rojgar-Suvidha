import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { buildWeeklyDigestHtml } from "@/lib/emailTemplates/weeklyDigest";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");
    const isCron = req.headers.get("x-vercel-cron") === "true";
    
    // Simple admin check: allow if it's vercel cron OR has correct bearer token
    if (!isCron && authHeader !== `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    // 1. Fetch top jobs from this week
    let { data: topJobs } = await supabaseAdmin
      .from("jobs")
      .select("title, slug, last_date, total_posts, category")
      .eq("status", "active")
      .eq("category", "latest-jobs")
      .gte("created_at", oneWeekAgo)
      .order("created_at", { ascending: false })
      .limit(5);

    // Fallback if no new jobs this week: fetch latest 5 active jobs
    if (!topJobs || topJobs.length === 0) {
      const { data } = await supabaseAdmin
        .from("jobs")
        .select("title, slug, last_date, total_posts, category")
        .eq("status", "active")
        .eq("category", "latest-jobs")
        .order("created_at", { ascending: false })
        .limit(5);
      topJobs = data || [];
    }

    // 2. Fetch results published this week
    let { data: results } = await supabaseAdmin
      .from("jobs")
      .select("title, slug")
      .eq("category", "results")
      .gte("created_at", oneWeekAgo)
      .order("created_at", { ascending: false })
      .limit(3);

    // Fallback results
    if (!results || results.length === 0) {
      const { data } = await supabaseAdmin
        .from("jobs")
        .select("title, slug")
        .eq("category", "results")
        .order("created_at", { ascending: false })
        .limit(3);
      results = data || [];
    }

    // 3. Fetch AI Study/Preparation Tip using Gemini or Groq fallback
    let aiTip = "Bhaiya ki tip: Har din thoda-thoda padhein, regular revision karein aur mock tests zaroor lagayein. Consistent rehna hi success ki chabi hai.";
    const geminiKey = process.env.GEMINI_API_KEY;
    if (geminiKey) {
      try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: "You are 'Bhaiya', a friendly elder brother mentoring Indian government job aspirants (SSC, UPSC, Railways, Banking). Generate exactly one short, encouraging, practical study tip in Hindi-English mixed (Hinglish) under 150 characters. Do not use hashtags, templates, quotes or emojis."
              }]
            }]
          })
        });
        if (response.ok) {
          const resJson = await response.json();
          const generatedText = resJson.candidates?.[0]?.content?.parts?.[0]?.text;
          if (generatedText) aiTip = generatedText.trim().replace(/^"|"$/g, "");
        }
      } catch (err) {
        console.error("Weekly digest AI tip generator error:", err);
      }
    }

    // 4. Fetch opted-in users (profiles with email_digest = true)
    const { data: users, error: userError } = await supabaseAdmin
      .from("profiles")
      .select("email")
      .eq("email_digest", true)
      .not("email", "is", null);

    if (userError) throw userError;
    if (!users || users.length === 0) {
      return NextResponse.json({ success: true, message: "No subscribed users found." });
    }

    const resendKey = process.env.RESEND_API_KEY;
    if (!resendKey) {
      console.warn("[weekly-digest] RESEND_API_KEY not configured. Skipping email dispatch.");
      return NextResponse.json({ success: true, message: "Resend key missing. Email skipped." });
    }

    const emailHtml = buildWeeklyDigestHtml(topJobs, results, aiTip);
    const emails = users.map(u => u.email).filter(Boolean);

    // 5. Send batch emails or individual sends via Resend
    // Send in chunks of 50 or individually with delay to prevent rate limits
    let successCount = 0;
    for (const email of emails) {
      try {
        const res = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${resendKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: "Rojgar Suvidha <noreply@rojgarsuvidha.com>",
            to: [email],
            subject: `📬 Weekly Sunday Job Alert & Bhaiya's Study Tip!`,
            html: emailHtml,
          }),
        });
        if (res.ok) successCount++;
        // Tiny 100ms throttle
        await new Promise(r => setTimeout(r, 100));
      } catch (err) {
        console.error(`Failed to send weekly digest to ${email}:`, err);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Weekly digest sent successfully to ${successCount} out of ${emails.length} subscribers.`
    });
  } catch (err: any) {
    console.error("Weekly digest task failed:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
