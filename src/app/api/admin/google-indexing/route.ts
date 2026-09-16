export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { JWT } from "google-auth-library";
import fs from "fs";
import path from "path";

function getServiceAccountCredentials() {
  // Option 1: Environment variable GOOGLE_SERVICE_ACCOUNT_KEY (JSON string or base64)
  if (process.env.GOOGLE_SERVICE_ACCOUNT_KEY) {
    try {
      const raw = process.env.GOOGLE_SERVICE_ACCOUNT_KEY.trim();
      if (raw.startsWith("{")) {
        return JSON.parse(raw);
      }
      const decoded = Buffer.from(raw, "base64").toString("utf-8");
      return JSON.parse(decoded);
    } catch (e) {
      console.error("Failed to parse GOOGLE_SERVICE_ACCOUNT_KEY env var:", e);
    }
  }

  // Option 2: Local file service-account.json or google-key.json in project root
  const candidates = [
    path.join(process.cwd(), "service-account.json"),
    path.join(process.cwd(), "google-key.json"),
  ];

  for (const filePath of candidates) {
    if (fs.existsSync(filePath)) {
      try {
        const fileContent = fs.readFileSync(filePath, "utf-8");
        return JSON.parse(fileContent);
      } catch (e) {
        console.error(`Failed to parse ${filePath}:`, e);
      }
    }
  }

  return null;
}

/**
 * POST /api/admin/google-indexing
 * Body: { urls: string[], type?: "URL_UPDATED" | "URL_DELETED" }
 */
export async function POST(req: Request) {
  try {
    const creds = getServiceAccountCredentials();
    if (!creds) {
      return NextResponse.json(
        {
          error:
            "Google Service Account credentials missing. Please provide GOOGLE_SERVICE_ACCOUNT_KEY in .env.local or service-account.json in project root.",
          instructions:
            "1. Create Service Account in Google Cloud Console with Indexing API enabled. 2. Add service account email as Owner in Google Search Console. 3. Place key file as service-account.json in root.",
        },
        { status: 400 }
      );
    }

    const body = await req.json();
    const urls: string[] = Array.isArray(body.urls)
      ? body.urls.filter((u: string) => typeof u === "string" && u.startsWith("http"))
      : [];

    if (urls.length === 0) {
      return NextResponse.json({ error: "No valid URLs provided" }, { status: 400 });
    }

    const type = body.type || "URL_UPDATED";

    const jwtClient = new JWT({
      email: creds.client_email,
      key: creds.private_key,
      scopes: ["https://www.googleapis.com/auth/indexing"],
    });

    const tokens = await jwtClient.authorize();
    const accessToken = tokens.access_token;

    const results: { url: string; status: number; message: string }[] = [];

    // Process URLs with a small throttle to respect Google limits
    for (const url of urls) {
      try {
        const res = await fetch("https://indexing.googleapis.com/v3/urlNotifications:publish", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ url, type }),
        });

        const data = await res.json();
        results.push({
          url,
          status: res.status,
          message: res.ok ? "Success (Notified Googlebot to crawl)" : data.error?.message || "Failed",
        });
      } catch (err: any) {
        results.push({
          url,
          status: 500,
          message: err.message || "Network error",
        });
      }
    }

    const successful = results.filter((r) => r.status === 200).length;

    return NextResponse.json({
      success: successful > 0,
      total: urls.length,
      successful,
      results,
    });
  } catch (err: any) {
    console.error("Google Indexing API error:", err);
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}
