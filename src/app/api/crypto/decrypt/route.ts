import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

const ENCRYPTION_KEY_RAW = process.env.SUPABASE_SERVICE_ROLE_KEY || "fallback_secret_key_at_least_32_characters";
const ENCRYPTION_KEY = crypto.createHash('sha256').update(String(ENCRYPTION_KEY_RAW)).digest();

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
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

    // Verify user is an admin by querying admin_roles table or checking direct emails
    const email = user.email;
    let isAdmin = false;
    if (email) {
      if (email === "admin@rojgarsuvidha.com" || email === "superadmin@rojgarsuvidha.com") {
        isAdmin = true;
      } else {
        const { data: roleData } = await supabaseAdmin
          .from("admin_roles")
          .select("role")
          .eq("email", email)
          .maybeSingle();
        if (roleData?.role) {
          isAdmin = true;
        }
      }
    }

    if (!isAdmin) {
      return NextResponse.json({ error: "Unauthorized: Admin access required" }, { status: 403 });
    }

    const { text } = await req.json();
    if (!text) {
      return NextResponse.json({ error: "Text to decrypt is required" }, { status: 400 });
    }

    // Split IV and encrypted text
    const textParts = text.split(":");
    if (textParts.length !== 2) {
      return NextResponse.json({ error: "Invalid encrypted text format" }, { status: 400 });
    }

    const iv = Buffer.from(textParts[0], "hex");
    const encryptedText = Buffer.from(textParts[1], "hex");

    const decipher = crypto.createDecipheriv("aes-256-cbc", ENCRYPTION_KEY, iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);

    return NextResponse.json({ decrypted: decrypted.toString() });
  } catch (err: any) {
    console.error("Decryption route error:", err);
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}
