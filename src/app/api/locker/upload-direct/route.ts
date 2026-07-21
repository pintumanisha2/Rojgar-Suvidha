import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized: Missing auth token" }, { status: 401 });
    }
    const token = authHeader.split(" ")[1];

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

    // Parse Form Data
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Server-side type validation
    const allowedMimeTypes = ["application/pdf", "image/jpeg", "image/jpg", "image/png"];
    const allowedExtensions = ["pdf", "jpg", "jpeg", "png"];
    const fileExt = file.name.split(".").pop()?.toLowerCase() || "";
    if (!allowedMimeTypes.includes(file.type) || !allowedExtensions.includes(fileExt)) {
      return NextResponse.json({ error: "Invalid file type. Only PDF and JPG/PNG images are allowed." }, { status: 400 });
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

    // Construct Private File Key
    const cleanFileName = file.name.split(".")[0].replace(/[^a-zA-Z0-9]/g, "_");
    const key = `locker/${user.id}/${Date.now()}_${cleanFileName}.${fileExt}`;

    // Read file buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload direct to B2 (No browser CORS issue since this runs on the server)
    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      Body: buffer,
      ContentType: file.type,
    });

    await s3Client.send(command);

    return NextResponse.json({ key });
  } catch (error: any) {
    console.error("Direct Upload Error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
