import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { S3Client, DeleteObjectCommand } from "@aws-sdk/client-s3";

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized: Missing auth token" }, { status: 401 });
    }
    const token = authHeader.split(" ")[1];

    const { key } = await req.json();
    if (!key) {
      return NextResponse.json({ error: "key is required" }, { status: 400 });
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

    // Authorization Check: User must own the file (locker/user_id/...)
    const keyParts = key.split("/");
    const fileOwnerId = keyParts[1];

    if (fileOwnerId !== user.id) {
      return NextResponse.json({ error: "Forbidden: You do not own this document" }, { status: 403 });
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

    // Delete Object Command
    const command = new DeleteObjectCommand({
      Bucket: bucketName,
      Key: key,
    });

    await s3Client.send(command);

    return NextResponse.json({ success: true, message: "File deleted from Backblaze B2" });
  } catch (error: any) {
    console.error("Delete File Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
