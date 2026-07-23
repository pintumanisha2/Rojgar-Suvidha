import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function hashString(str: string): number {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 33) ^ str.charCodeAt(i);
  }
  return Math.abs(hash);
}

export async function GET(req: Request) {
  try {
    const slug = new URL(req.url).searchParams.get("slug");
    if (!slug) {
      return NextResponse.json({ error: "Slug is required" }, { status: 400 });
    }

    const hash = hashString(slug);
    const lowerSlug = slug.toLowerCase();

    const isMajor = /ssc|railway|rrb|upsc|bank|ibps|police|defence|army|navy|airforce|neet|jee/.test(lowerSlug);
    const isState = /bihar|uttar-pradesh|\bup\b|\bmp\b|mppsc|bpsc|rpsc|rajasthan|haryana|delhi|wb|mah|jharkhand/.test(lowerSlug);

    // 1. Calculate Base Metrics dynamically per slug scale
    let baseViews = isMajor
      ? 1850 + (hash % 4250)
      : isState
      ? 1120 + (hash % 2450)
      : 620 + (hash % 1250);

    let baseOrders = isMajor
      ? 145 + (hash % 380)
      : isState
      ? 85 + (hash % 210)
      : 38 + (hash % 95);

    let baseSubscribers = isMajor
      ? 5800 + (hash % 13500)
      : isState
      ? 3200 + (hash % 6800)
      : 1650 + (hash % 3400);

    let baseViewers = isMajor
      ? 24 + (hash % 42)
      : isState
      ? 14 + (hash % 26)
      : 8 + (hash % 14);

    // 2. Fetch real analytics count if available in Supabase DB
    try {
      const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const { count: realViews } = await supabaseAdmin
        .from("analytics")
        .select("id", { count: "exact" })
        .eq("page", `/job/${slug}`)
        .gte("created_at", oneWeekAgo);

      if (realViews && realViews > 0) {
        baseViews += realViews;
      }
    } catch {}

    // 3. Fetch real Apply For Me orders if available
    try {
      const { count: realOrders } = await supabaseAdmin
        .from("user_applications")
        .select("id", { count: "exact" })
        .eq("payment_status", "paid")
        .ilike("selected_post_name", `%${slug.replace(/-/g, " ")}%`);

      if (realOrders && realOrders > 0) {
        baseOrders += realOrders;
      }
    } catch {}

    // 4. Fetch real Push Subscribers if available
    try {
      const { count: realSubs } = await supabaseAdmin
        .from("push_subscriptions")
        .select("id", { count: "exact" });

      if (realSubs && realSubs > 50) {
        baseSubscribers = realSubs;
      }
    } catch {}

    return NextResponse.json({
      weeklyViews: baseViews,
      applyForMeOrders: baseOrders,
      totalSubscribers: baseSubscribers,
      liveViewers: baseViewers,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
