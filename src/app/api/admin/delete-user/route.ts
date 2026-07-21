import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Initialize admin client with service role key to perform deletion of auth users
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const { userId, accessToken } = await req.json();

    if (!userId || !accessToken) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Verify token validity and match it to requested user ID
    const { data: { user }, error: authErr } = await supabaseAdmin.auth.getUser(accessToken);
    if (authErr || !user || user.id !== userId) {
      console.error("Token verification failed in delete-user:", authErr);
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    // Perform cascade cleanups on client tables
    console.log(`Deleting all database records for user: ${userId}`);
    await supabaseAdmin.from("profiles").delete().eq("id", userId);
    await supabaseAdmin.from("user_locker").delete().eq("user_id", userId);
    await supabaseAdmin.from("apply_for_me_requests").delete().eq("user_id", userId);
    await supabaseAdmin.from("user_applications").delete().eq("user_id", userId);

    // Delete Auth record permanently from Supabase Authentication
    console.log(`Deleting auth record for user: ${userId}`);
    const { error: deleteErr } = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (deleteErr) {
      console.error("Admin user delete error:", deleteErr);
      return NextResponse.json({ error: deleteErr.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Exception caught in delete-user route:", err);
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}
