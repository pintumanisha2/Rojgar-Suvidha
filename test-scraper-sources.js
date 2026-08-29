const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://bflgvwgudgvvlljmtlqu.supabase.co";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseKey) {
  console.log("NO SUPABASE_SERVICE_ROLE_KEY in env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testSources() {
  console.log("=== TESTING RSS FEEDS ===");
  
  // 1. Test SarkariResult RSS
  try {
    const res = await fetch("https://www.sarkariresult.com/feed/", {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; RojgarSuvidhaBot/1.0; +https://www.rojgarsuvidha.com)",
        "Accept": "application/rss+xml, application/xml, text/xml, */*",
      }
    });
    console.log("SarkariResult RSS Status:", res.status);
    const xml = await res.text();
    const matches = xml.match(/<item>/g);
    console.log("SarkariResult items count:", matches ? matches.length : 0);
  } catch (e) {
    console.log("SarkariResult RSS error:", e.message);
  }

  // 2. Test NDTV
  try {
    const res = await fetch("https://www.ndtv.com/education", {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      }
    });
    console.log("NDTV Status:", res.status);
  } catch (e) {
    console.log("NDTV error:", e.message);
  }

  // 3. Test FreeJobAlert
  try {
    const res = await fetch("https://www.freejobalert.com/feed/", {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; RojgarSuvidhaBot/1.0; +https://www.rojgarsuvidha.com)",
        "Accept": "application/rss+xml, application/xml, text/xml, */*",
      }
    });
    console.log("FreeJobAlert RSS Status:", res.status);
  } catch (e) {
    console.log("FreeJobAlert error:", e.message);
  }

  // 4. Check recently scraped URLs in DB
  const { data: logs } = await supabase.from("scraped_urls_log").select("url, created_at, reason").order("created_at", { ascending: false }).limit(20);
  console.log("\n=== RECENTLY SCRAPED LOGS (LAST 20) ===");
  (logs || []).forEach(l => {
    console.log(`- ${l.created_at} | ${l.url} | reason: ${l.reason || 'none'}`);
  });
}

testSources();
