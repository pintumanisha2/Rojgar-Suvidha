const dotenv = require('dotenv');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Load .env.local
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function test() {
  console.log("Checking if column 'salary' exists in 'jobs'...");
  const { data, error } = await supabase
    .from('jobs')
    .select('salary')
    .limit(1);

  if (error) {
    console.error("Error checking column 'salary':", error);
  } else {
    console.log("Column 'salary' exists! Data:", data);
  }
}

test();
