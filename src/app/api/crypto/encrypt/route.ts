import { NextResponse } from "next/server";
import crypto from "crypto";

const ENCRYPTION_KEY_RAW = process.env.SUPABASE_SERVICE_ROLE_KEY || "fallback_secret_key_at_least_32_characters";
// Ensure exactly 32 bytes key length by hashing the raw secret key
const ENCRYPTION_KEY = crypto.createHash('sha256').update(String(ENCRYPTION_KEY_RAW)).digest();
const IV_LENGTH = 16; // For AES-256-CBC

export async function POST(req: Request) {
  try {
    const { text } = await req.json();
    if (!text) {
      return NextResponse.json({ error: "Text to encrypt is required" }, { status: 400 });
    }

    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv("aes-256-cbc", ENCRYPTION_KEY, iv);
    let encrypted = cipher.update(text, "utf8", "hex");
    encrypted += cipher.final("hex");

    // Prepend the IV as hex to the encrypted text
    const result = iv.toString("hex") + ":" + encrypted;

    return NextResponse.json({ encrypted: result });
  } catch (err: any) {
    console.error("Encryption route error:", err);
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}
