const dotenv = require('dotenv');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function test() {
  const { data, error } = await supabase
    .from("user_activities")
    .select("*")
    .limit(1);

  if (error) {
    console.log("Error checking user_activities table:", error.message);
  } else {
    console.log("user_activities table exists. Rows found:", data.length);
  }
}

test();
