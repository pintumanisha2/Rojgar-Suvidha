const dotenv = require('dotenv');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function test() {
  console.log("Checking user_applications columns in DB...");
  const { data, error } = await supabase
    .from('user_applications')
    .select('*')
    .limit(1);

  if (error) {
    console.error("Error fetching user_applications:", error);
  } else {
    console.log("Columns found:", data[0] ? Object.keys(data[0]) : "No records in table");
  }
}

test();
