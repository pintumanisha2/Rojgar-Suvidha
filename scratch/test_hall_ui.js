const { chromium } = require('playwright');
const { createClient } = require('@supabase/supabase-js');
const path = require('path');

const supabase = createClient(
  'https://kkfgdzaoukekhlijlfsw.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtrZmdkemFvdWtla2hsaWpsZnN3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjgyOTkxMCwiZXhwIjoyMDk4NDA1OTEwfQ.0yXNbCGnCws6-EQBDN859yK_atM1ITKJ9XbL-uBj_DU'
);

async function run() {
  console.log("Launching headless browser...");
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    permissions: ['camera', 'microphone']
  });

  const page = await context.newPage();

  console.log("Navigating to login page...");
  await page.goto('http://127.0.0.1:3000/login', { timeout: 15000 });
  await page.waitForTimeout(2000);

  // Dismiss user type selector popup if present
  try {
    const gateBtn = page.locator('button:has-text("I am looking for both")');
    await gateBtn.waitFor({ timeout: 5000 });
    console.log("Dismissing user type popup...");
    await gateBtn.click();
    await page.waitForTimeout(1000);
  } catch (err) {
    console.log("Gate popup did not appear, proceeding...");
  }

  console.log("Entering phone number...");
  await page.fill('input[placeholder="9876543210"]', '8877434088');
  await page.waitForTimeout(500);

  console.log("Clicking Send OTP...");
  // Find button containing text "Send OTP" or use general selector
  const sendBtn = page.locator('button:has-text("Send OTP")');
  await sendBtn.click();
  console.log("OTP request triggered. Waiting for DB insert...");
  await page.waitForTimeout(3000);

  console.log("Fetching latest OTP from database...");
  const { data, error } = await supabase
    .from('phone_otps')
    .select('otp')
    .eq('phone', '+918877434088')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error || !data) {
    console.error("Failed to fetch OTP from database:", error?.message);
    await browser.close();
    return;
  }

  const otp = data.otp;
  console.log(`Retrieved OTP: ${otp}. Entering OTP...`);

  // Fill in the 6 inputs for OTP boxes
  // Select all inputs within the OTP form container or just general text boxes
  const otpInputs = page.locator('input[type="text"], input[maxlength="1"]');
  const inputCount = await otpInputs.count();
  console.log(`Found ${inputCount} OTP inputs.`);

  // Type OTP characters one by one
  for (let i = 0; i < 6; i++) {
    const digit = otp.charAt(i);
    // Find the i-th input box
    const selector = `input[data-index="${i}"]`;
    if (await page.locator(selector).count() > 0) {
      await page.fill(selector, digit);
    } else {
      // Fallback
      await otpInputs.nth(i).fill(digit);
    }
    await page.waitForTimeout(100);
  }

  console.log("Clicking Verify...");
  const verifyBtn = page.locator('button:has-text("Verify OTP")');
  await verifyBtn.click();
  await page.waitForTimeout(4000);

  console.log("Checking current URL after login verification...");
  console.log("Current URL:", page.url());

  console.log("Navigating to Study Hall...");
  await page.goto('http://127.0.0.1:3000/dashboard/study/hall', { timeout: 15000 });
  await page.waitForTimeout(8000); // Allow time for cameras and UI elements

  console.log("Taking desktop screenshot...");
  const artifactDir = '/Users/pintukumar/.gemini/antigravity-ide/brain/6710205e-54bc-4bdd-92b6-045c1a7748a7';
  const desktopPath = path.join(artifactDir, 'hall_desktop_screenshot.png');
  await page.screenshot({ path: desktopPath });
  console.log(`Saved desktop screenshot to ${desktopPath}`);

  console.log("Resizing viewport to mobile portrait...");
  await page.setViewportSize({ width: 375, height: 812 });
  await page.waitForTimeout(2000);

  console.log("Taking mobile portrait screenshot...");
  const mobilePath = path.join(artifactDir, 'hall_mobile_screenshot.png');
  await page.screenshot({ path: mobilePath });
  console.log(`Saved mobile screenshot to ${mobilePath}`);

  await browser.close();
  console.log("Test execution finished successfully.");
}

run().catch(console.error);
