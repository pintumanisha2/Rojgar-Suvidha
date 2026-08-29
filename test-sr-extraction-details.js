async function testExtract(url) {
  const res = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    },
  });
  const html = await res.text();
  
  // Extract all links with surrounding context
  const links = [];
  const linkRegex = /<a\s+[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let linkMatch;
  while ((linkMatch = linkRegex.exec(html)) !== null) {
    const href = linkMatch[1].trim();
    const text = linkMatch[2].replace(/<[^>]+>/g, "").trim();
    links.push({ href, text });
  }

  // Strip html
  const text = html.replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  // Test current regexes:
  const lastDate = text.match(/last\s*date(?:\s*to\s*apply|\s*for\s*online\s*application)?[:\s]+([^\n\r|]{5,60})/i)?.[1];
  const ageLimit = text.match(/age\s*limit(?:\s*as\s*on[^\:]+)?[:\s]+([^\n\r|]{5,60})/i)?.[1];
  const totalPosts = text.match(/total\s*(?:post|vacancy|vacancies)[:\s]+(\d+)/i)?.[1];
  const fee = text.match(/(?:application\s*fee|general\s*\/\s*obc)[:\s]+([^\n\r|]{3,50})/i)?.[1];

  console.log(`URL: ${url}`);
  console.log(`  lastDate: "${lastDate}"`);
  console.log(`  ageLimit: "${ageLimit}"`);
  console.log(`  totalPosts: "${totalPosts}"`);
  console.log(`  fee: "${fee}"`);
}

async function run() {
  await testExtract("https://www.sarkariresult.com/2026/isro-icrb-scientist-engineer-sc-aug26/");
  await testExtract("https://www.sarkariresult.com/2026/railway-ecr-apprentices-aug26/");
  await testExtract("https://www.sarkariresult.com/2026/india-post-gds-july2026/");
}
run();
