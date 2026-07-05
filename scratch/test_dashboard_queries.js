const dotenv = require('dotenv');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function test() {
  console.log("Fetching a profile to test dashboard queries...");
  const { data: profiles, error: pErr } = await supabase
    .from("profiles")
    .select("*")
    .limit(1);

  if (pErr || !profiles || profiles.length === 0) {
    console.error("Failed to fetch profiles:", pErr);
    return;
  }

  const testUser = profiles[0];
  console.log(`Using test user profile: ID=${testUser.id}, Name=${testUser.full_name}, Phone=${testUser.mobile_number}`);

  console.log("1. Querying apply_for_me_requests...");
  const startReq = Date.now();
  const { data: reqData, error: reqErr } = await supabase
    .from("apply_for_me_requests")
    .select("*")
    .eq("user_id", testUser.id)
    .order("created_at", { ascending: false });
  console.log(`- Completed in ${Date.now() - startReq}ms. Error:`, reqErr || "None", `Count: ${reqData ? reqData.length : 0}`);

  console.log("2. Querying user_applications...");
  const startApp = Date.now();
  const { data: appData, error: appErr } = await supabase
    .from("user_applications")
    .select("tracking_id, form_id, full_name, selected_post_name, application_status, total_paid, created_at")
    .or(`user_id.eq.${testUser.id},phone.eq.${testUser.mobile_number || "__none__"}`)
    .order("created_at", { ascending: false });
  console.log(`- Completed in ${Date.now() - startApp}ms. Error:`, appErr || "None", `Count: ${appData ? appData.length : 0}`);
}

test();
