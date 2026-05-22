import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  try {
    const { name, email, password, role } = await req.json();

    if (!name || !email || !password || !role) {
      return NextResponse.json({ error: "Name, email, password, and role are required." }, { status: 400 });
    }

    // Initialize Supabase admin client (we use the Anon key here since we just want to signUp a user, 
    // it will work if signups are enabled in Supabase, without modifying the browser session)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!serviceRoleKey) {
      return NextResponse.json({ error: "Missing SUPABASE_SERVICE_ROLE_KEY in .env.local. Required to auto-verify admin users." }, { status: 500 });
    }

    // Create a client with the Service Role Key to bypass email confirmation
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false }
    });

    // 1. Create the user in Supabase Auth and auto-confirm them
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // This is the magic flag that bypasses the email verification requirement!
    });

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 400 });
    }

    // 2. Insert role into admin_roles table
    const { error: dbError } = await supabaseAdmin.from("admin_roles").insert([{
      name: name.trim(),
      email: email.toLowerCase(),
      role: role,
      status: "Active"
    }]);

    // If the record already exists, update it instead
    if (dbError && dbError.code === "23505") { // unique violation
      await supabaseAdmin.from("admin_roles").update({ name: name.trim(), role, status: "Active" }).eq("email", email.toLowerCase());
    } else if (dbError) {
      return NextResponse.json({ error: "User created, but failed to assign role: " + dbError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: "User created successfully." });
  } catch (error: any) {
    console.error("Create User Error:", error);
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}
