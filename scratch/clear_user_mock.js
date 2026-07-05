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
  console.log("Clearing dummy data for ID:", jobId);

  const payload = {
    short_info: "",
    meta_description: "",
    updated_at: new Date().toISOString()
  };

  const { data, error } = await supabase
    .from('jobs')
    .select('title')
    .eq('id', jobId);

  if (error) {
    console.error("Fetch Error:", error);
    return;
  }

  // Clear fields
  const { data: updateData, error: updateError } = await supabase
    .from('jobs')
    .update(payload)
    .eq('id', jobId)
    .select();

  if (updateError) {
    console.error("Reset Error:", updateError);
  } else {
    console.log("Successfully reset fields in database!");
  }
}

test();
