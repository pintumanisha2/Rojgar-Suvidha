import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Keywords to identify notification links
const NOTIFICATION_KEYWORDS = [
  "notification", "recruitment", "vacancy", "advt", "advertisement",
  "result", "admit", "card", "answer", "key", "syllabus", "exam",
  "bharti", "naukri", "job", "post", "apply", "application",
];

function isNotificationLink(text: string, href: string): boolean {
  const combined = (text + " " + href).toLowerCase();
  return NOTIFICATION_KEYWORDS.some((kw) => combined.includes(kw));
}

function extractLinks(html: string, baseUrl: string): { text: string; href: string }[] {
  const linkRegex = /<a[^>]+href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  const links: { text: string; href: string }[] = [];
  let match;
  while ((match = linkRegex.exec(html)) !== null) {
    let href = match[1].trim();
    const rawText = match[2].replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
    if (!href || href.startsWith("#") || href.startsWith("javascript") || rawText.length < 3) continue;
    // Make relative URLs absolute
    if (href.startsWith("/")) {
      try {
        const base = new URL(baseUrl);
        href = `${base.origin}${href}`;
      } catch {}
    } else if (!href.startsWith("http")) {
      continue;
    }
    if (isNotificationLink(rawText, href)) {
      links.push({ text: rawText.slice(0, 200), href: href.slice(0, 500) });
    }
  }
  return links.slice(0, 50); // Max 50 links per site
}

export async function POST(req: NextRequest) {
  try {
    const { siteId } = await req.json();

    // Fetch site(s) to check
    let query = supabase.from("scout_sites").select("*").eq("active", true);
    if (siteId) query = query.eq("id", siteId);
    const { data: sites, error: sitesErr } = await query;
    if (sitesErr) throw sitesErr;
    if (!sites || sites.length === 0) return NextResponse.json({ checked: 0, newAlerts: 0 });

    let totalNew = 0;

    for (const site of sites) {
      try {
        // Fetch the website with timeout
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 12000);
        const res = await fetch(site.url, {
          signal: controller.signal,
          headers: {
            "User-Agent": "Mozilla/5.0 (compatible; RojgarSuvidhaBot/1.0)",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          },
        });
        clearTimeout(timeout);

        if (!res.ok) {
          await supabase.from("scout_sites").update({ last_checked: new Date().toISOString(), last_status: `HTTP ${res.status}` }).eq("id", site.id);
          continue;
        }

        const html = await res.text();
        const links = extractLinks(html, site.url);

        // Get previously seen link hrefs
        const prevLinks: string[] = site.last_seen_links || [];
        const prevSet = new Set(prevLinks);

        // Find new links
        const newLinks = links.filter((l) => !prevSet.has(l.href));

        if (newLinks.length > 0) {
          // Insert alerts
          const alerts = newLinks.map((l) => ({
            site_id: site.id,
            site_name: site.name,
            site_url: site.url,
            link_text: l.text,
            link_url: l.href,
            detected_at: new Date().toISOString(),
            is_read: false,
          }));
          await supabase.from("scout_alerts").insert(alerts);
          totalNew += newLinks.length;
        }

        // Update site with current links & timestamp
        const allCurrentHrefs = links.map((l) => l.href);
        await supabase.from("scout_sites").update({
          last_checked: new Date().toISOString(),
          last_seen_links: allCurrentHrefs,
          last_status: "OK",
          last_new_count: newLinks.length,
        }).eq("id", site.id);
      } catch (siteErr: any) {
        const msg = siteErr.name === "AbortError" ? "Timeout" : siteErr.message?.slice(0, 100) || "Error";
        await supabase.from("scout_sites").update({ last_checked: new Date().toISOString(), last_status: msg }).eq("id", site.id);
      }
    }

    return NextResponse.json({ checked: sites.length, newAlerts: totalNew });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// Mark alert as read
export async function PATCH(req: NextRequest) {
  try {
    const { alertId, markAll } = await req.json();
    if (markAll) {
      await supabase.from("scout_alerts").update({ is_read: true }).eq("is_read", false);
    } else {
      await supabase.from("scout_alerts").update({ is_read: true }).eq("id", alertId);
    }
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
