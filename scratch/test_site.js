const { chromium } = require('@playwright/test');

async function checkSite() {
  console.log("Launching chromium...");
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  page.on('console', msg => {
    console.log(`[CONSOLE ${msg.type()}]: ${msg.text()}`);
  });

  page.on('requestfailed', request => {
    console.log(`[REQUEST FAILED]: ${request.url()} - ${request.failure()?.errorText || 'Unknown error'}`);
  });

  page.on('response', response => {
    if (response.status() >= 400) {
      console.log(`[HTTP ERROR ${response.status()}]: ${response.url()}`);
    }
  });

  page.on('pageerror', err => {
    console.error(`[PAGE ERROR]: ${err.message}`);
    console.error(err.stack);
  });

  const url = 'http://localhost:3009/calendar/print?categories=general&state=';
  console.log(`Navigating to ${url} ...`);
  try {
    const response = await page.goto(url, { waitUntil: 'networkidle', timeout: 45000 });
    console.log("Navigation status:", response.status());
    
    // Take a screenshot
    await page.screenshot({ path: 'scratch/print_screenshot.png' });
    console.log("Screenshot saved to scratch/print_screenshot.png");
  } catch (e) {
    console.error("Navigation failed:", e.message);
  }

  await browser.close();
}

checkSite();
