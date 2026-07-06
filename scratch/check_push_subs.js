const dotenv = require('dotenv');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function test() {
  console.log("Checking push_subscriptions columns...");
  const { data, error } = await supabase
    .from("push_subscriptions")
    .select("*")
    .limit(1);

  if (error) {
    console.error("Select failed:", error);
  } else {
    console.log("Found row keys:", data[0] ? Object.keys(data[0]) : "No rows");
  }
}

test();
