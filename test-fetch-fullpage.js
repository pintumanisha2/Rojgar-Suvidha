async function fetchFullPage(url) {
  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.9,hi;q=0.8",
      "Accept-Encoding": "gzip, deflate, br",
      "Cache-Control": "no-cache",
      "Referer": "https://www.google.com/",
    },
  });
  if (!res.ok) throw new Error(`Page fetch failed: ${res.status} ${res.statusText}`);
  const html = await res.text();
  console.log(`Fetched ${url} -> ${html.length} chars`);
  
  // Test mainContentMatch regex
  const mainContentMatch =
    html.match(/<div[^>]*class="[^"]*(?:entry-content|post-content|article-content|td-post-content)[^"]*"[^>]*>([\s\S]*?)<\/div>/i) ||
    html.match(/<article[^>]*>([\s\S]*?)<\/article>/i);

  console.log("Main content match found:", !!mainContentMatch);
  if (mainContentMatch) {
    console.log("Match snippet length:", mainContentMatch[1].length);
  }
}

async function run() {
  console.log("Testing SarkariResult full page fetch...");
  try {
    await fetchFullPage("https://www.sarkariresult.com/2026/isro-icrb-scientist-engineer-sc-aug26/");
  } catch (e) {
    console.error("SR fetch failed:", e);
  }

  console.log("\nTesting NDTV full page fetch...");
  try {
    await fetchFullPage("https://www.ndtv.com/education");
  } catch (e) {
    console.error("NDTV fetch failed:", e);
  }
}
run();
