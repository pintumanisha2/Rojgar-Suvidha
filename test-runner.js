const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://bflgvwgudgvvlljmtlqu.supabase.co";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function testRunner() {
  // Fetch RSS from FreeJobAlert
  const fjaRes = await fetch("https://www.freejobalert.com/feed/");
  const fjaXml = await fjaRes.text();
  const fjaItems = [];
  let m;
  const re = /<item>([\s\S]*?)<\/item>/g;
  while ((m = re.exec(fjaXml)) !== null) {
    const title = m[1].match(/<title>(.*?)<\/title>/)?.[1] || "";
    const link = m[1].match(/<link>(.*?)<\/link>/)?.[1] || "";
    if (title && link) fjaItems.push({ title: title.trim(), link: link.trim(), source: "freejobalert" });
  }

  // Fetch RSS from SarkariResult
  const srRes = await fetch("https://www.sarkariresult.com/feed/");
  const srXml = await srRes.text();
  const srItems = [];
  const re2 = /<item>([\s\S]*?)<\/item>/g;
  while ((m = re2.exec(srXml)) !== null) {
    const title = m[1].match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/)?.[1] || m[1].match(/<title>(.*?)<\/title>/)?.[1] || "";
    const link = m[1].match(/<link>(.*?)<\/link>/)?.[1] || "";
    if (title && link) srItems.push({ title: title.trim(), link: link.trim(), source: "sarkariresult" });
  }

  console.log(`FJA items count: ${fjaItems.length}`);
  console.log(`SR items count: ${srItems.length}`);

  // Fetch scraped URLs from DB
  const { data: scrapedLog } = await supabase.from("scraped_urls_log").select("url");
  const scrapedUrls = new Set((scrapedLog || []).map((r) => r.url));
  console.log(`Total logged scraped URLs in DB: ${scrapedUrls.size}`);

  const fjaNew = fjaItems.filter(i => !scrapedUrls.has(i.link));
  const srNew = srItems.filter(i => !scrapedUrls.has(i.link));

  console.log(`Unscraped FJA items count: ${fjaNew.length}`);
  console.log(`Unscraped SR items count: ${srNew.length}`);

  console.log("\nUnscraped SR items:");
  srNew.forEach(i => console.log(`  - Title: ${i.title}\n    Link: ${i.link}`));
}

testRunner();
