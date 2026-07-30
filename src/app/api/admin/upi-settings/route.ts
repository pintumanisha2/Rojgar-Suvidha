import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET: Fetch current UPI settings
export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from("site_settings")
      .select("value")
      .eq("key", "upi_payment_settings")
      .maybeSingle();

    if (error) throw error;

    // Hardcoded defaults — always fall back to these
    const defaults = {
      upi_id: "rojgarsuvidha@ybl",
      account_name: "Pintu Kumar",
      qr_image_url: "/phonepay-qr.png"
    };

    const saved = data?.value || {};
    return NextResponse.json({ 
      success: true, 
      settings: { ...defaults, ...saved }
    });
  } catch (err: any) {
    // Even on DB error, return working defaults
    return NextResponse.json({ 
      success: true, 
      settings: { 
        upi_id: "rojgarsuvidha@ybl", 
        account_name: "Pintu Kumar", 
        qr_image_url: "/phonepay-qr.png" 
      } 
    });
  }
}

// POST: Save UPI settings
export async function POST(req: Request) {
  try {
    const { upi_id, account_name, qr_image_url } = await req.json();

    const { error } = await supabaseAdmin
      .from("site_settings")
      .upsert({ 
        key: "upi_payment_settings", 
        value: { upi_id, account_name, qr_image_url },
        updated_at: new Date().toISOString()
      }, { onConflict: "key" });

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
