const dotenv = require('dotenv');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Load .env.local
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function test() {
  console.log("Checking all jobs in database...");
  
  const { data, error } = await supabase
    .from('jobs')
    .select('id, title, category, status, created_by, state_code');

  if (error) {
    console.error("Error:", error);
  } else {
    console.log(`Found ${data.length} jobs in database:`);
    data.forEach((job, index) => {
      console.log(`[${index + 1}] ID: ${job.id}`);
      console.log(`    Title: ${job.title}`);
      console.log(`    Category: ${job.category}`);
      console.log(`    Status: ${job.status}`);
      console.log(`    Created By: ${job.created_by}`);
      console.log(`    State Code: ${job.state_code}`);
    });
  }
}

test();
