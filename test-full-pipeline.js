// Test pipeline logic for SarkariResult and NDTV

async function testNDTVFallback() {
  console.log("=== Testing NDTV with Google News RSS Fallback ===");
  let items = [];
  // 1. Try direct
  try {
    const res = await fetch("https://www.ndtv.com/education", {
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/124.0.0.0 Safari/537.36" }
    });
    if (res.ok) {
      const html = await res.text();
      const linkRegex = /<a\s+[^>]*href=["'](https:\/\/www\.ndtv\.com\/education\/[^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
      let match;
      while ((match = linkRegex.exec(html)) !== null) {
        const title = match[2].replace(/<[^>]+>/g, "").trim();
        if (title.length > 20) items.push({ title, link: match[1] });
      }
    }
  } catch (e) {
    console.log("Direct NDTV failed:", e.message);
  }

  // 2. Fallback to Google News RSS for NDTV if direct got 0 items
  if (items.length === 0) {
    console.log("Direct NDTV empty/blocked — using Google News RSS fallback...");
    try {
      const res = await fetch("https://news.google.com/rss/search?q=site:ndtv.com+education&hl=en-IN&gl=IN&ceid=IN:en", {
        headers: { "User-Agent": "Mozilla/5.0 (compatible; RojgarSuvidhaBot/1.0)" }
      });
      if (res.ok) {
        const xml = await res.text();
        const itemRegex = /<item>([\s\S]*?)<\/item>/g;
        let match;
        while ((match = itemRegex.exec(xml)) !== null) {
          const block = match[1];
          const title = block.match(/<title>(.*?)<\/title>/)?.[1]?.replace(/ - NDTV$/, "").trim();
          const link = block.match(/<link>(.*?)<\/link>/)?.[1] || block.match(/<guid[^>]*>(.*?)<\/guid>/)?.[1];
          if (title && link) items.push({ title, link });
        }
      }
    } catch (e) {
      console.log("Google News RSS fallback failed:", e.message);
    }
  }
  console.log(`NDTV final items count: ${items.length}`);
  items.slice(0, 3).forEach(i => console.log(`  - ${i.title} => ${i.link}`));
}

testNDTVFallback();
