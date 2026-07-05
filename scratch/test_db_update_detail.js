const dotenv = require('dotenv');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Load .env.local
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function test() {
  const jobId = "709d15bc-a046-4224-a976-5ce06d3d3826";
  console.log("Updating job details for ID:", jobId);

  const payload = {
    short_info: "This is a test short info description " + Date.now(),
    meta_description: "This is a test SEO meta description " + Date.now(),
    updated_at: new Date().toISOString()
  };

  const { data, error } = await supabase
    .from('jobs')
    .update(payload)
    .eq('id', jobId)
    .select();

  if (error) {
    console.error("Update Error:", error);
  } else {
    console.log("Update Succeeded! Data:", data);
  }
}

test();
