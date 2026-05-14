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
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    
    // Create a fresh supabase client specifically for this server request
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false } // Crucial: Do not persist session on server!
    });

    // 1. Create the user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 400 });
    }

    // 2. Insert role into admin_roles table
    const { error: dbError } = await supabase.from("admin_roles").insert([{
      name: name.trim(),
      email: email.toLowerCase(),
      role: role,
      status: "Active"
    }]);

    // If the record already exists, update it instead
    if (dbError && dbError.code === "23505") { // unique violation
      await supabase.from("admin_roles").update({ name: name.trim(), role, status: "Active" }).eq("email", email.toLowerCase());
    } else if (dbError) {
      return NextResponse.json({ error: "User created, but failed to assign role: " + dbError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: "User created successfully." });
  } catch (error: any) {
    console.error("Create User Error:", error);
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}
