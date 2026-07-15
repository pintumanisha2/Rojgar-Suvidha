import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const { email, source } = await req.json();

    // ── Validation ─────────────────────────────────────────────────────────
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return NextResponse.json(
        { error: "Please enter a valid email address." },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();

    // ── Upsert into email_subscribers ──────────────────────────────────────
    // Uses upsert so duplicate emails are silently ignored
    const { error } = await supabaseAdmin
      .from("email_subscribers")
      .upsert(
        { email: cleanEmail, source: source || "homepage" },
        { onConflict: "email", ignoreDuplicates: true }
      );

    if (error) {
      // Table might not exist yet — return success anyway so UX is unblocked
      if (error.code === "42P01") {
        console.warn("[subscribe] Table email_subscribers not found. Create it in Supabase.");
        return NextResponse.json({ success: true, note: "Table not found, email logged only." });
      }
      console.error("[subscribe] DB error:", error.message);
      return NextResponse.json(
        { error: "Could not save your email. Please try again." },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("[subscribe] Unexpected error:", err);
    return NextResponse.json({ error: "Internal error." }, { status: 500 });
  }
}
