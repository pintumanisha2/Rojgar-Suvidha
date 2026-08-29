async function testSRExtraction(url) {
  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Referer": "https://www.google.com/",
    },
  });
  const html = await res.text();

  // Current scraper regex in fetchFullPage:
  const mainContentMatch =
    html.match(/<div[^>]*class="[^"]*(?:entry-content|post-content|article-content|td-post-content)[^"]*"[^>]*>([\s\S]*?)<\/div>/i) ||
    html.match(/<article[^>]*>([\s\S]*?)<\/article>/i);

  let workingHtml = mainContentMatch ? mainContentMatch[1] : html;

  // Extract all links
  const links = [];
  const linkRegex = /<a\s+[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let linkMatch;
  while ((linkMatch = linkRegex.exec(workingHtml)) !== null) {
    const href = linkMatch[1].trim();
    const text = linkMatch[2].replace(/<[^>]+>/g, "").trim();
    if (href && text && text.length < 100) links.push({ href, text });
  }

  // Strip HTML
  let rawText = workingHtml
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  console.log(`URL: ${url}`);
  console.log(`Words extracted: ${rawText.split(" ").length}`);
  console.log(`Links extracted: ${links.length}`);
  console.log(`Sample text: ${rawText.slice(0, 300)}...`);
  console.log(`Sample links:`, links.slice(0, 5));
}

testSRExtraction("https://www.sarkariresult.com/2026/isro-icrb-scientist-engineer-sc-aug26/");
