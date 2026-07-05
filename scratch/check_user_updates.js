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
  console.log("Fetching job with ID:", jobId);
  
  const { data, error } = await supabase
    .from('jobs')
    .select('id, title, short_info, meta_description, updated_at')
    .eq('id', jobId)
    .single();

  if (error) {
    console.error("Error:", error);
  } else {
    console.log("Job data in DB:");
    console.log("- Title:", data.title);
    console.log("- Short Info:", data.short_info);
    console.log("- Meta Description:", data.meta_description);
    console.log("- Updated At:", data.updated_at);
  }
}

test();
