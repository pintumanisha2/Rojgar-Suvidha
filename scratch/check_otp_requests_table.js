const dotenv = require('dotenv');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function test() {
  console.log("Checking if otp_requests table exists in database...");
  const { data, error } = await supabase
    .from("otp_requests")
    .select("*")
    .limit(1);

  if (error) {
    console.error("DATABASE ERROR:", error.message);
  } else {
    console.log("otp_requests table exists. Rows found:", data.length);
  }
}

test();
