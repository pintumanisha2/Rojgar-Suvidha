const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://bflgvwgudgvvlljmtlqu.supabase.co";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function testDryRun() {
  console.log("=== DRY RUNNING CANDIDATE SELECTION ===");

  // 1. Fetch FreeJobAlert items
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

  // 2. Fetch SarkariResult items
  const srRes = await fetch("https://www.sarkariresult.com/feed/");
  const srXml = await srRes.text();
  const srItems = [];
  const re2 = /<item>([\s\S]*?)<\/item>/g;
  while ((m = re2.exec(srXml)) !== null) {
    const title = m[1].match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/)?.[1] || m[1].match(/<title>(.*?)<\/title>/)?.[1] || "";
    const link = m[1].match(/<link>(.*?)<\/link>/)?.[1] || "";
    if (title && link) srItems.push({ title: title.trim(), link: link.trim(), source: "sarkariresult" });
  }

  // 3. Scraped URLs log
  const { data: scrapedLog } = await supabase.from("scraped_urls_log").select("url");
  const scrapedUrls = new Set((scrapedLog || []).map((r) => r.url));

  const allCandidateItems = [
    ...fjaItems.map(i => ({ ...i, source: "freejobalert" })),
    ...srItems.map(i => ({ ...i, source: "sarkariresult" })),
  ];

  const fjaNew = allCandidateItems.filter((i) => i.source === "freejobalert" && !scrapedUrls.has(i.link)).slice(0, 1);
  const srNew = allCandidateItems.filter((i) => i.source === "sarkariresult" && !scrapedUrls.has(i.link)).slice(0, 1);

  console.log(`fjaNew item:`, fjaNew[0]?.title);
  console.log(`srNew item:`, srNew[0]?.title);

  const newItems = [...fjaNew, ...srNew].slice(0, 3);
  console.log(`\nnewItems array length: ${newItems.length}`);
  newItems.forEach((item, idx) => {
    console.log(`\n[Item ${idx + 1}] Source: ${item.source} | Title: ${item.title}`);
    console.log(`  Link: ${item.link}`);
  });
}

testDryRun();
