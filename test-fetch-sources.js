const SARKARIRESULT_RSS_FEEDS = {
  "latest-jobs": ["https://www.sarkariresult.com/feed/"],
  "results": ["https://www.sarkariresult.com/feed/?cat=result", "https://www.sarkariresult.com/feed/"],
  "admit-card": ["https://www.sarkariresult.com/feed/"],
};

async function testSR() {
  console.log("--- Testing SarkariResult ---");
  const allItems = [];
  const seen = new Set();
  for (const [feedCat, urls] of Object.entries(SARKARIRESULT_RSS_FEEDS)) {
    for (const rssUrl of urls) {
      try {
        const res = await fetch(rssUrl, {
          headers: {
            "User-Agent": "Mozilla/5.0 (compatible; RojgarSuvidhaBot/1.0; +https://www.rojgarsuvidha.com)",
            "Accept": "application/rss+xml, application/xml, text/xml, */*",
          },
        });
        console.log(`URL: ${rssUrl} -> Status ${res.status}`);
        if (!res.ok) continue;
        const xml = await res.text();
        const itemRegex = /<item>([\s\S]*?)<\/item>/g;
        let match;
        let count = 0;
        while ((match = itemRegex.exec(xml)) !== null) {
          const block = match[1];
          const title = block.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/)?.[1] || block.match(/<title>(.*?)<\/title>/)?.[1] || "";
          const link = block.match(/<link>(.*?)<\/link>/)?.[1] || block.match(/<guid[^>]*>(.*?)<\/guid>/)?.[1] || "";
          if (title && link && !seen.has(link)) {
            seen.add(link);
            allItems.push({ title, link });
            count++;
          }
        }
        console.log(`  Extracted ${count} items from ${rssUrl}`);
        break;
      } catch (e) {
        console.log(`  Error: ${e.message}`);
      }
    }
  }
  console.log(`Total SarkariResult unique items: ${allItems.length}`);
  allItems.slice(0, 3).forEach(i => console.log(`  - ${i.title} => ${i.link}`));
}

async function testNDTV() {
  console.log("\n--- Testing NDTV ---");
  try {
    const res = await fetch("https://www.ndtv.com/education", {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
    });
    console.log(`NDTV Status: ${res.status}`);
    if (!res.ok) {
      console.log("NDTV IS BLOCKED (403 Forbidden)");
      return;
    }
    const html = await res.text();
    const linkRegex = /<a\s+[^>]*href=["'](https:\/\/www\.ndtv\.com\/education\/[^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
    let match;
    let count = 0;
    while ((match = linkRegex.exec(html)) !== null) {
      count++;
    }
    console.log(`NDTV items found: ${count}`);
  } catch (e) {
    console.log(`NDTV Error: ${e.message}`);
  }
}

async function run() {
  await testSR();
  await testNDTV();
}
run();
