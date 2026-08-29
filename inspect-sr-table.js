async function inspectSRTable(url) {
  const res = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    },
  });
  const html = await res.text();
  
  // Find all links in the whole HTML
  const links = [];
  const linkRegex = /<a\s+[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let linkMatch;
  while ((linkMatch = linkRegex.exec(html)) !== null) {
    const href = linkMatch[1].trim();
    const text = linkMatch[2].replace(/<[^>]+>/g, "").trim();
    if (href && text && (text.toLowerCase().includes("apply") || text.toLowerCase().includes("click") || text.toLowerCase().includes("notification") || text.toLowerCase().includes("official"))) {
      links.push({ href, text });
    }
  }
  console.log(`Found ${links.length} apply/notification/official links:`);
  links.forEach(l => console.log(`  text: "${l.text}" => href: "${l.href}"`));
}

inspectSRTable("https://www.sarkariresult.com/2026/isro-icrb-scientist-engineer-sc-aug26/");
