import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized: Missing auth token" }, { status: 401 });
    }
    const token = authHeader.split(" ")[1];

    const { fileName, contentType } = await req.json();
    if (!fileName || !contentType) {
      return NextResponse.json({ error: "fileName and contentType are required" }, { status: 400 });
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
      region: "us-east-1", // Backblaze dummy region
      forcePathStyle: true,
    });

    // Construct Private File Key
    const fileExt = fileName.split(".").pop() || "jpg";
    const cleanFileName = fileName.split(".")[0].replace(/[^a-zA-Z0-9]/g, "_");
    const key = `locker/${user.id}/${Date.now()}_${cleanFileName}.${fileExt}`;

    // Get Presigned PUT URL
    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      ContentType: contentType,
    });

    const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 300 });

    return NextResponse.json({ uploadUrl, key });
  } catch (error: any) {
    console.error("Upload URL Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
