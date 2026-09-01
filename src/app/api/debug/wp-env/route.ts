import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const SITE_URL = process.env.WORDPRESS_SITE_URL;
  const USERNAME = process.env.WORDPRESS_USERNAME;
  const PASSWORD = process.env.WORDPRESS_PASSWORD || process.env.WORDPRESS_APP_PASSWORD;
  const ACCESS_TOKEN = process.env.WORDPRESS_ACCESS_TOKEN;

  return NextResponse.json({
    ok: true,
    wpEnv: {
      WORDPRESS_SITE_URL: SITE_URL || null,
      WORDPRESS_USERNAME: USERNAME || null,
      WORDPRESS_PASSWORD_present: !!PASSWORD,
      WORDPRESS_PASSWORD_length: PASSWORD?.length || 0,
      WORDPRESS_ACCESS_TOKEN_present: !!ACCESS_TOKEN,
    }
  });
}
