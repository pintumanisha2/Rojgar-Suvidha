#!/usr/bin/env node
/**
 * Standalone runner for submitting URLs to Google Indexing API.
 * Reads URLs from Table.csv or takes URLs from arguments, and submits them to Google.
 *
 * Usage:
 *   node scripts/submit-google-indexing.js
 *   node scripts/submit-google-indexing.js --file /path/to/Table.csv
 *   node scripts/submit-google-indexing.js https://www.rojgarsuvidha.com/job/my-slug
 */

const fs = require("fs");
const path = require("path");
const { JWT } = require("google-auth-library");

function getCredentials() {
  const root = path.resolve(__dirname, "..");
  const candidates = [
    path.join(root, "service-account.json"),
    path.join(root, "google-key.json"),
  ];

  for (const p of candidates) {
    if (fs.existsSync(p)) {
      try {
        return JSON.parse(fs.readFileSync(p, "utf-8"));
      } catch (e) {
        console.error(`Error reading ${p}:`, e.message);
      }
    }
  }

  if (process.env.GOOGLE_SERVICE_ACCOUNT_KEY) {
    try {
      const raw = process.env.GOOGLE_SERVICE_ACCOUNT_KEY.trim();
      return JSON.parse(raw.startsWith("{") ? raw : Buffer.from(raw, "base64").toString("utf-8"));
    } catch (e) {
      console.error("Error parsing GOOGLE_SERVICE_ACCOUNT_KEY:", e.message);
    }
  }

  return null;
}

async function main() {
  const creds = getCredentials();
  if (!creds) {
    console.log("\n=======================================================");
    console.log("❌ Google Service Account Key Not Found!");
    console.log("=======================================================");
    console.log("To use Google Indexing API:");
    console.log("1. Go to Google Cloud Console (console.cloud.google.com)");
    console.log("2. Enable 'Web Search Indexing API'");
    console.log("3. Create a Service Account, generate a JSON Key");
    console.log("4. Save the JSON file as 'service-account.json' in your project root");
    console.log("5. In Google Search Console -> Settings -> Users & Permissions -> Add the Service Account email as OWNER.");
    console.log("=======================================================\n");
    process.exit(1);
  }

  console.log(`🔑 Using Service Account: ${creds.client_email}`);

  // Collect URLs
  let urls = [];
  const args = process.argv.slice(2);

  let csvPath = "/Users/pintukumar/Desktop/rojgarsuvidha.com-Coverage-Validation-2026-09-16/Table.csv";
  if (args.includes("--file")) {
    const idx = args.indexOf("--file");
    if (args[idx + 1]) csvPath = args[idx + 1];
  } else if (args.length > 0 && args[0].startsWith("http")) {
    urls = args.filter(a => a.startsWith("http"));
  }

  if (urls.length === 0 && fs.existsSync(csvPath)) {
    console.log(`📄 Reading URLs from: ${csvPath}`);
    const content = fs.readFileSync(csvPath, "utf-8");
    const lines = content.trim().split("\n").slice(1);
    for (const line of lines) {
      const u = line.split(",")[0].trim();
      if (u.startsWith("http")) {
        urls.push(u);
      }
    }
  }

  if (urls.length === 0) {
    console.log("No URLs to submit.");
    process.exit(0);
  }

  console.log(`🚀 Found ${urls.length} URLs to submit to Google Indexing API.\n`);

  const jwtClient = new JWT({
    email: creds.client_email,
    key: creds.private_key,
    scopes: ["https://www.googleapis.com/auth/indexing"],
  });

  const tokens = await jwtClient.authorize();
  const accessToken = tokens.access_token;

  let successCount = 0;
  let failureCount = 0;

  for (let i = 0; i < urls.length; i++) {
    const url = urls[i];
    try {
      const res = await fetch("https://indexing.googleapis.com/v3/urlNotifications:publish", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ url, type: "URL_UPDATED" }),
      });

      if (res.ok) {
        successCount++;
        console.log(`[${i + 1}/${urls.length}] ✅ Submitted: ${url}`);
      } else {
        failureCount++;
        const err = await res.json().catch(() => ({}));
        console.log(`[${i + 1}/${urls.length}] ❌ Failed (${res.status}): ${url} -> ${err.error?.message || "Error"}`);
      }
    } catch (e) {
      failureCount++;
      console.log(`[${i + 1}/${urls.length}] ⚠️ Exception: ${url} -> ${e.message}`);
    }

    // Gentle delay to avoid hitting burst rate limits (10 requests per second max)
    await new Promise(r => setTimeout(r, 200));
  }

  console.log("\n=======================================================");
  console.log(`🎉 Google Indexing API Run Complete!`);
  console.log(`   Success: ${successCount}`);
  console.log(`   Failed : ${failureCount}`);
  console.log(`   Total  : ${urls.length}`);
  console.log("=======================================================\n");
}

main().catch(err => {
  console.error("Fatal error:", err);
  process.exit(1);
});
