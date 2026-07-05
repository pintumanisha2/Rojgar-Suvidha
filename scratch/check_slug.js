const dotenv = require('dotenv');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Load .env.local
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function test() {
  const targetSlug = "rrb-junior-engineer-je-recruitment-2026";
  console.log("Checking if slug exists:", targetSlug);
  const { data, error } = await supabase
    .from('jobs')
    .select('id, title, slug, created_at')
    .eq('slug', targetSlug);

  if (error) {
    console.error("Error:", error);
  } else {
    console.log("Found matches:", data);
  }
}

test();
