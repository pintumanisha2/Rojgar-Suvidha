import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

// ── Quality Monitoring Report — Admin Endpoint
// GET /api/admin/blog-quality-report?key=<CRON_SECRET>
// Returns a quality scorecard for the last 20 published blogs

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

function stripHtml(html: string): string {
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<[^>]+>/g, " ");
}

function scorePost(post: {
  title: string;
  meta_desc?: string | null;
  blog_html?: string | null;
}): {
  wordCount: number;
  titleLength: number;
  metaLength: number;
  h2Count: number;
  hasFaq: boolean;
  hasYear: boolean;
  titleStartsClean: boolean;
  score: number;
  flags: string[];
} {
  const flags: string[] = [];
  const html = post.blog_html || "";
  const title = post.title || "";
  const meta = post.meta_desc || "";

  const wordCount = stripHtml(html).split(/\s+/).filter(Boolean).length;
  const titleLength = title.length;
  const hasYear = /20\d{2}/.test(title);
  const titleStartsClean = !title.startsWith("[") && !/^\d/.test(title);
  const metaLength = meta.length;
  const h2Count = (html.match(/<h2[\s>]/gi) || []).length;
  const hasFaq = /faqpage|frequently asked/i.test(html);

  if (wordCount < 700) flags.push(`Short: ${wordCount} words (min 700)`);
  if (wordCount > 2500) flags.push(`Bloated: ${wordCount} words (>2000)`);
  if (titleLength > 75) flags.push(`Title too long: ${titleLength} chars`);
  if (titleLength < 30) flags.push(`Title too short: ${titleLength} chars`);
  if (!hasYear) flags.push("No year in title");
  if (!titleStartsClean) flags.push("Title starts with bracket/number");
  if (metaLength > 165) flags.push(`Meta too long: ${metaLength} chars`);
  if (metaLength < 100 && metaLength > 0) flags.push(`Meta too short: ${metaLength} chars`);
  if (metaLength === 0) flags.push("Missing meta description");
  if (h2Count < 5) flags.push(`Too few H2s: ${h2Count} (min 5)`);
  if (!hasFaq) flags.push("No FAQ section detected");

  let score = 100;
  score -= flags.length * 8;
  if (wordCount >= 700 && wordCount <= 1800) score += 5;
  if (hasFaq) score += 5;
  if (hasYear) score += 3;
  if (h2Count >= 6) score += 3;
  score = Math.max(0, Math.min(100, score));

  return { wordCount, titleLength, metaLength, h2Count, hasFaq, hasYear, titleStartsClean, score, flags };
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const key = url.searchParams.get("key");
  const expectedKey = process.env.CRON_SECRET || process.env.ADMIN_API_KEY;
  if (expectedKey && key !== expectedKey) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getSupabaseAdmin();
  const limit = Math.min(parseInt(url.searchParams.get("limit") || "20"), 50);
  const category = url.searchParams.get("category");

  try {
    let query = supabase
      .from("blogs")
      .select("id, title, slug, category, meta_desc, blog_html, created_at")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (category) query = (query as any).eq("category", category);

    const { data: posts, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (!posts || posts.length === 0) return NextResponse.json({ message: "No posts found", posts: [] });

    const scorecards = posts.map((post: any) => ({
      id: post.id,
      slug: post.slug,
      title: post.title,
      category: post.category,
      createdAt: post.created_at,
      metrics: scorePost(post),
    }));

    const avgScore = Math.round(scorecards.reduce((s: number, p: any) => s + p.metrics.score, 0) / scorecards.length);
    const avgWordCount = Math.round(scorecards.reduce((s: number, p: any) => s + p.metrics.wordCount, 0) / scorecards.length);

    return NextResponse.json({
      summary: {
        totalChecked: scorecards.length,
        averageScore: avgScore,
        averageWordCount: avgWordCount,
        postsBelow700Words: scorecards.filter((p: any) => p.metrics.wordCount < 700).length,
        postsWithoutFaq: scorecards.filter((p: any) => !p.metrics.hasFaq).length,
        postsWithLongMeta: scorecards.filter((p: any) => p.metrics.metaLength > 165).length,
        generatedAt: new Date().toISOString(),
      },
      posts: scorecards,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
