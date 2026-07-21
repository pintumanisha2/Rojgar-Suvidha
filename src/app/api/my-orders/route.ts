import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const { userId } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: "User ID is required." }, { status: 400 });
    }

    const { data: requests, error } = await supabaseAdmin
      .from("apply_for_me_requests")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Failed to retrieve user orders:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const mappedOrders = (requests || []).map((req: any) => {
      let statusStep = "placed";
      if (req.status === "in_progress" || req.status === "needs_info" || req.status === "verified") {
        statusStep = "verified";
      } else if (req.status === "completed" || req.status === "submitted") {
        statusStep = "submitted";
      } else if (req.status === "rejected" || req.status === "refund_pending") {
        statusStep = "rejected";
      }

      return {
        id: req.id,
        job_title: req.job_title,
        created_at: req.created_at,
        job_url: req.details?.job_url || "",
        special_note: req.details?.special_note || "",
        payment_id: req.tracking_id,
        status: statusStep,
        pdf_url: req.final_receipt_url || null,
      };
    });

    return NextResponse.json({ success: true, orders: mappedOrders });
  } catch (err: any) {
    console.error("Fetch orders exception:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
