import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

const ENCRYPTION_KEY_RAW = process.env.SUPABASE_SERVICE_ROLE_KEY || "fallback_secret_key_at_least_32_characters";
const ENCRYPTION_KEY = crypto.createHash('sha256').update(String(ENCRYPTION_KEY_RAW)).digest();

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized: Missing auth token" }, { status: 401 });
    }
    const token = authHeader.split(" ")[1];

    // Verify token validity
    const { data: { user }, error: authErr } = await supabaseAdmin.auth.getUser(token);
    if (authErr || !user) {
      return NextResponse.json({ error: "Unauthorized: Invalid session" }, { status: 401 });
    }

    // Query user's own last application
    const { data: appData, error: dbErr } = await supabaseAdmin
      .from("user_applications")
      .select("aadhar")
      .eq("user_id", user.id)
      .not("aadhar", "is", null)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (dbErr) {
      return NextResponse.json({ error: dbErr.message }, { status: 500 });
    }

    if (!appData || !appData.aadhar) {
      return NextResponse.json({ aadhar: "" });
    }

    // Split IV and encrypted text
    const textParts = appData.aadhar.split(":");
    if (textParts.length !== 2) {
      // Return plaintext if it was stored before encryption was implemented
      return NextResponse.json({ aadhar: appData.aadhar });
    }

    const iv = Buffer.from(textParts[0], "hex");
    const encryptedText = Buffer.from(textParts[1], "hex");

    const decipher = crypto.createDecipheriv("aes-256-cbc", ENCRYPTION_KEY, iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);

    return NextResponse.json({ aadhar: decrypted.toString() });
  } catch (err: any) {
    console.error("User aadhar fetch error:", err);
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}
