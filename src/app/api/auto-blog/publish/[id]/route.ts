import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * POST /api/auto-blog/publish/[id]
 * Publishes a pending draft to the jobs table (same as AI Writer does)
 * Also triggers: translation, IndexNow, push notification
 */
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { id } = params;

  try {
    // 1. Fetch the draft
    const { data: draft, error: fetchError } = await supabase
      .from("auto_blog_drafts")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchError || !draft) {
      return NextResponse.json(
        { error: "Draft not found" },
        { status: 404 }
      );
    }

    if (draft.status === "published") {
      return NextResponse.json(
        { error: "Already published" },
        { status: 400 }
      );
    }

    // 2. Parse optional overrides from request body
    const body = await request.json().catch(() => ({}));
    const {
      title = draft.generated_title,
      slug = draft.generated_slug,
      metaDesc = draft.generated_meta,
      postStatus = "active",
    } = body;

    // 3. Insert into jobs table (same schema as AI Writer uses)
    const { data: insertedJob, error: insertError } = await supabase
      .from("jobs")
      .insert([
        {
          title,
          slug,
          blog_content: draft.generated_html,
          short_description: draft.short_description || metaDesc,
          meta_description: metaDesc,
          tag: draft.generated_tags?.[0] || null,
          category: draft.category,
          status: postStatus,
          last_date: draft.last_date || null,
          total_posts: draft.total_posts_parsed || null,
          application_fee: draft.app_fee_gen || null,
          official_link: draft.official_link || null,
          links: draft.apply_link || null,
          created_at: new Date().toISOString(),
        },
      ])
      .select("id")
      .single();

    if (insertError) throw new Error(`DB insert: ${insertError.message}`);

    const newJobId = insertedJob.id;

    // 4. Update draft status to published
    await supabase
      .from("auto_blog_drafts")
      .update({
        status: "published",
        published_at: new Date().toISOString(),
        published_post_id: newJobId,
      })
      .eq("id", id);

    // 5. Auto-translation (background, non-blocking)
    if (postStatus === "active" && newJobId) {
      fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ""}/api/admin/translate-blog`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId: newJobId }),
      }).catch((e) => console.warn("Auto-translation failed:", e));
    }

    // 6. IndexNow ping (background)
    if (postStatus === "active") {
      fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ""}/api/admin/index-now`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: `/job/${slug}` }),
      }).catch((e) => console.warn("IndexNow ping failed:", e));
    }

    // 7. Push notification (background)
    if (postStatus === "active") {
      fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ""}/api/push`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "category-broadcast",
          payload: {
            title: `नई अपडेट: ${title}`,
            body: draft.short_description || metaDesc || "Latest update on Rojgar Suvidha",
            url: `/job/${slug}`,
            icon: "/logo-blue.png",
            category: draft.category,
          },
        }),
      }).catch((e) => console.error("Push notification failed:", e));
    }

    return NextResponse.json({
      success: true,
      jobId: newJobId,
      slug,
      url: `/job/${slug}`,
    });
  } catch (error: any) {
    console.error("Publish error:", error);
    return NextResponse.json(
      { error: error.message || "Publish failed" },
      { status: 500 }
    );
  }
}
