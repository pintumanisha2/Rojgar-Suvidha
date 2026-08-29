const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://bflgvwgudgvvlljmtlqu.supabase.co";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseKey) {
  console.log("No SUPABASE_SERVICE_ROLE_KEY found");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runDebug() {
  console.log("=== 1. FETCHING SARKARIRESULT RSS ITEMS ===");
  const rssUrl = "https://www.sarkariresult.com/feed/";
  let srItems = [];
  try {
    const res = await fetch(rssUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; RojgarSuvidhaBot/1.0; +https://www.rojgarsuvidha.com)",
        "Accept": "application/rss+xml, application/xml, text/xml, */*",
      }
    });
    console.log("SR RSS HTTP status:", res.status);
    const xml = await res.text();
    const itemRegex = /<item>([\s\S]*?)<\/item>/g;
    let match;
    while ((match = itemRegex.exec(xml)) !== null) {
      const block = match[1];
      const title = block.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/)?.[1] || block.match(/<title>(.*?)<\/title>/)?.[1] || "";
      const link = block.match(/<link>(.*?)<\/link>/)?.[1] || block.match(/<guid[^>]*>(.*?)<\/guid>/)?.[1] || "";
      if (title && link) srItems.push({ title: title.trim(), link: link.trim() });
    }
  } catch (e) {
    console.error("SR RSS Error:", e.message);
  }
  console.log(`SR RSS returned ${srItems.length} items.`);
  srItems.forEach(i => console.log(`  - Title: ${i.title}\n    Link: ${i.link}`));

  console.log("\n=== 2. CHECKING SCRAPED_URLS_LOG FOR THESE LINKS ===");
  const srLinks = srItems.map(i => i.link);
  const { data: logData } = await supabase.from("scraped_urls_log").select("*").in("url", srLinks);
  console.log(`Found ${logData?.length || 0} matching log entries in scraped_urls_log:`);
  (logData || []).forEach(l => console.log(`  - URL: ${l.url} | reason: ${l.reason} | created_at: ${l.created_at}`));

  console.log("\n=== 3. CHECKING AUTO_BLOG_DRAFTS FOR SARKARIRESULT DRAFTS ===");
  const { data: drafts } = await supabase.from("auto_blog_drafts").select("id, title, category, status, created_at").order("created_at", { ascending: false }).limit(20);
  console.log(`Found ${drafts?.length || 0} recent auto_blog_drafts:`);
  (drafts || []).forEach(d => console.log(`  - ID: ${d.id} | Title: ${d.title} | Status: ${d.status} | Created: ${d.created_at}`));

  console.log("\n=== 4. CHECKING JOBS TABLE FOR RECENTLY PUBLISHED JOBS ===");
  const { data: jobs } = await supabase.from("jobs").select("id, title, category, created_at").order("created_at", { ascending: false }).limit(20);
  console.log(`Found ${jobs?.length || 0} recent jobs:`);
  (jobs || []).forEach(j => console.log(`  - ID: ${j.id} | Title: ${j.title} | Created: ${j.created_at}`));
}

runDebug();
