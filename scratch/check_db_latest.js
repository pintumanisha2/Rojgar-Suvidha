const dotenv = require('dotenv');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Load .env.local
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function test() {
  console.log("Fetching latest 5 jobs...");
  const { data, error } = await supabase
    .from('jobs')
    .select('id, title, slug, created_at')
    .order('created_at', { ascending: false })
    .limit(5);

  if (error) {
    console.error("Error:", error);
  } else {
    console.log("Latest jobs in DB:");
    data.forEach(j => {
      console.log(`- [${j.created_at}] ID: ${j.id} | Slug: ${j.slug} | Title: ${j.title}`);
    });
  }
}

test();
