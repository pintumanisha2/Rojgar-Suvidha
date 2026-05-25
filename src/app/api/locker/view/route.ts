import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export async function GET(req: Request) {
  try {
    const urlObj = new URL(req.url);
    const key = urlObj.searchParams.get("key");
    let token = urlObj.searchParams.get("token");

    if (!key) {
      return NextResponse.json({ error: "Missing key parameter" }, { status: 400 });
    }

    // Fallback 1: Check Authorization header
    if (!token) {
      const authHeader = req.headers.get("Authorization");
      if (authHeader && authHeader.startsWith("Bearer ")) {
        token = authHeader.split(" ")[1];
      }
    }

    // Fallback 2: Check cookies
    if (!token) {
      const cookieHeader = req.headers.get("cookie") || "";
      // FIX: split("=") galat tha — base64 tokens mein "=" hota hai jo value truncate kar deta tha
      // Correct approach: sirf pehle "=" par split karo, baki sab value ka hissa hai
      const cookies: Record<string, string> = {};
      cookieHeader.split(";").forEach(c => {
        const eqIdx = c.indexOf("=");
        if (eqIdx === -1) return;
        const key = c.slice(0, eqIdx).trim();
        const val = c.slice(eqIdx + 1).trim();
        cookies[key] = val;
      });
      const supabaseCookieKey = Object.keys(cookies).find(k => k.includes("auth-token") || k.includes("access-token"));
      if (supabaseCookieKey) {
        try {
          const cookieVal = decodeURIComponent(cookies[supabaseCookieKey]);
          const parsed = JSON.parse(cookieVal);
          token = parsed.access_token || parsed[0];
        } catch {
          token = cookies[supabaseCookieKey];
        }
      }
    }

    if (!token) {
      return NextResponse.json({ error: "Unauthorized: Missing authentication token" }, { status: 401 });
    }

    // Initialize Supabase Client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false },
    });

    // Get Authenticated User
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized: Invalid session" }, { status: 401 });
    }

    // Authorization Check: User must own the file OR be an admin
    const keyParts = key.split("/");
    const fileOwnerId = keyParts[1]; // Key is locker/user_id/filename

    let isAuthorized = false;

    if (fileOwnerId === user.id) {
      isAuthorized = true;
    } else {
      // Check if user is an admin/staff
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();
      
      const adminRoles = ["admin", "super_admin", "form_filler", "staff"];
      const isStaffEmail = user.email === 'admin@rojgarsuvidha.com' || user.email === 'superadmin@rojgarsuvidha.com';
      
      if (isStaffEmail || (profile && adminRoles.includes(profile.role))) {
        isAuthorized = true;
      }
    }

    if (!isAuthorized) {
      return NextResponse.json({ error: "Forbidden: You do not have access to this document" }, { status: 403 });
    }

    // B2 Credentials Check
    const keyId = process.env.B2_KEY_ID;
    const appKey = process.env.B2_APPLICATION_KEY;
    const endpoint = process.env.B2_ENDPOINT;
    const bucketName = process.env.B2_BUCKET_NAME;

    if (!keyId || !appKey || !endpoint || !bucketName) {
      return NextResponse.json({ error: "Server Configuration Error: Backblaze keys missing" }, { status: 500 });
    }

    // Initialize B2 S3 Client
    const s3Client = new S3Client({
      endpoint: `https://${endpoint}`,
      credentials: {
        accessKeyId: keyId,
        secretAccessKey: appKey,
      },
      region: "us-east-1",
      forcePathStyle: true,
    });

    // Generate Presigned GET URL (Valid for 60 seconds)
    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: key,
    });

    const downloadUrl = await getSignedUrl(s3Client, command, { expiresIn: 60 });

    // Redirect the browser to the secure download URL
    return NextResponse.redirect(downloadUrl, { status: 302 });
  } catch (error: any) {
    console.error("View File Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
