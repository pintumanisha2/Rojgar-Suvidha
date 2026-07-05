const dotenv = require('dotenv');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Load .env.local
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function test() {
  console.log("Fetching a job to update...");
  const { data: jobs, error: fetchError } = await supabase.from('jobs').select('id').limit(1);
  if (fetchError || jobs.length === 0) {
    console.error("Fetch failed:", fetchError);
    return;
  }

  const jobId = jobs[0].id;
  console.log("Updating job ID:", jobId);

  const { data, error } = await supabase
    .from('jobs')
    .update({ title: "Updated Title " + Date.now() })
    .eq('id', jobId)
    .select();

  if (error) {
    console.error("Update Error:", error);
  } else {
    console.log("Update Succeeded! Data:", data);
  }
}

test();
