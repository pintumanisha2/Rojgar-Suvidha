const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://bflgvwgudgvvlljmtlqu.supabase.co";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function testProcessSR() {
  const url = "https://www.sarkariresult.com/2026/ccsu-meerut-provisional-certificate/";
  console.log(`=== TESTING FULL PROCESS FOR SR ITEM: ${url} ===`);

  // 1. Fetch full page
  const res = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Referer": "https://www.google.com/",
    },
  });
  console.log("Page HTTP Status:", res.status);
  const html = await res.text();
  console.log("HTML length:", html.length);

  // 2. Extract links
  const trMatches = html.match(/<tr[^>]*>[\s\S]*?<\/tr>/gi) || [];
  const links = [];
  for (const tr of trMatches) {
    const rowText = tr.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    const rowLinkRegex = /<a\s+[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
    let rMatch;
    while ((rMatch = rowLinkRegex.exec(tr)) !== null) {
      const href = rMatch[1].trim();
      const text = rMatch[2].replace(/<[^>]+>/g, "").trim();
      if (href && text && text.length < 100) {
        links.push({ href, text, label: `${rowText} (${text})` });
      }
    }
  }

  // 3. Raw text extraction
  let rawText = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  console.log("Raw text word count:", rawText.split(" ").length);
  console.log("Extracted links count:", links.length);

  // 4. Test detectCategory
  const title = "CCSU Meerut University Provisional & Migration Certificate Download";
  let category = "latest-jobs";
  const t = title.toLowerCase();
  if (/result|merit list|scorecard/i.test(t)) category = "results";
  else if (/admit card|hall ticket/i.test(t)) category = "admit-card";
  else if (/answer key/i.test(t)) category = "answer-key";
  else if (/admission|certificate|counselling/i.test(t)) category = "admission";

  console.log("Detected category:", category);

  // 5. Test detectApplyStatus
  let applyStatus = "unknown";
  let applyLink = null;
  for (const l of links) {
    if (/apply|download|certificate|portal|register/i.test(l.label || l.text)) {
      if (l.href.startsWith("http") && !l.href.includes("sarkariresult") && !l.href.includes("t.me")) {
        applyStatus = "open";
        applyLink = l.href;
        break;
      }
    }
  }
  console.log(`applyStatus: ${applyStatus}, applyLink: ${applyLink}`);
}

testProcessSR();
