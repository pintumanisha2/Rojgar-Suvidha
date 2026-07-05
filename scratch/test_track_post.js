const dotenv = require('dotenv');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function test() {
  console.log("Testing insert into user_activities...");
  const dummyPayload = {
    user_id: null,
    action: "pageview",
    page_path: "/dashboard",
    user_agent: "test agent",
    ip_address: "127.0.0.1",
    meta_data: { test: true },
  };

  const { data, error } = await supabase
    .from("user_activities")
    .insert([dummyPayload])
    .select();

  if (error) {
    console.error("DATABASE INSERT FAILED:");
    console.error("- Error Code:", error.code);
    console.error("- Message:", error.message);
    console.error("- Details:", error.details);
    console.error("- Hint:", error.hint);
  } else {
    console.log("DATABASE INSERT SUCCESSFUL!");
    console.log(data);
    
    // Clean up
    console.log("Cleaning up dummy record...");
    await supabase.from("user_activities").delete().eq("user_agent", "test agent");
  }
}

test();
