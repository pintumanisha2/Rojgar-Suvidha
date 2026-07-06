const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function run() {
  try {
    const { data, error } = await supabase
      .from("jobs")
      .select("title, category, state_code, slug, important_dates")
      .neq("status", "draft");
      
    if (error) {
      console.error("Query Error:", error);
    } else {
      console.log("Success! Total non-draft jobs:", data.length);
      console.log("Sample jobs with dates:");
      data.slice(0, 5).forEach((j, i) => {
        console.log(`[${i}] Title: ${j.title}`);
        console.log(`    Dates:`, j.important_dates);
      });
    }
  } catch (e) {
    console.error("Exception:", e);
  }
}

run();
