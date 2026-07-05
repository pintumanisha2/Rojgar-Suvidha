const dotenv = require('dotenv');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Load .env.local
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function clean() {
  console.log("Deleting test jobs from the database...");
  
  // Delete all jobs where title starts with 'Test Job'
  const { data, error } = await supabase
    .from('jobs')
    .delete()
    .like('title', 'Test Job%')
    .select();

  if (error) {
    console.error("Delete Error:", error);
  } else {
    console.log("Successfully deleted jobs count:", data.length);
    data.forEach(j => {
      console.log(`- Deleted ID: ${j.id} | Title: ${j.title}`);
    });
  }
}

clean();
