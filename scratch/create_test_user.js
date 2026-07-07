/**
 * create_test_user.js
 * ─────────────────────────────────────────────────────────────────
 * Creates a stable testing user under Supabase Auth.
 * Uses service role key to bypass registration restrictions.
 * ─────────────────────────────────────────────────────────────────
 */
const { createClient } = require("@supabase/supabase-js");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.resolve(__dirname, "../.env.local") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error("Missing env vars!");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function main() {
  const email = "testuser@example.com";
  const password = "password123";
  const fullName = "P2P WebRTC Test User";

  console.log(`Checking if user ${email} exists...`);
  const { data: { users }, error: listErr } = await supabase.auth.admin.listUsers();
  if (listErr) {
    console.error("Error listing users:", listErr);
    return;
  }

  let user = users.find(u => u.email === email);

  if (user) {
    console.log(`User already exists (id: ${user.id}). Updating password to: ${password}`);
    const { data, error: updateErr } = await supabase.auth.admin.updateUserById(user.id, {
      password: password,
      email_confirm: true
    });
    if (updateErr) {
      console.error("Error updating user password:", updateErr);
      return;
    }
    user = data.user;
  } else {
    console.log(`User does not exist. Creating new user ${email}...`);
    const { data, error: createErr } = await supabase.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true,
      user_metadata: { full_name: fullName }
    });
    if (createErr) {
      console.error("Error creating user:", createErr);
      return;
    }
    user = data.user;
  }

  console.log(`Syncing full_name inside public.profiles table for user ID: ${user.id}`);
  const { error: profileErr } = await supabase
    .from("profiles")
    .upsert({
      id: user.id,
      full_name: fullName,
      category: "general",
      gender: "male"
    });

  if (profileErr) {
    console.error("Error upserting profile:", profileErr);
  } else {
    console.log("Profile synchronized successfully!");
  }

  console.log("=== USER PREPARED ===");
  console.log(`Email: ${email}`);
  console.log(`Password: ${password}`);
}

main();
