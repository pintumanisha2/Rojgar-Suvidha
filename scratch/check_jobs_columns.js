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
      .select("title, important_dates")
      .limit(5);
      
    if (error) {
      console.error("Query Error:", error);
    } else if (data && data.length > 0) {
      console.log("Sample records important_dates:");
      data.forEach((r, idx) => {
        console.log(`[${idx}] Title: ${r.title}`);
        console.log(`    Dates:`, JSON.stringify(r.important_dates));
      });
    } else {
      console.log("No records found in jobs table.");
    }
  } catch (e) {
    console.error("Exception:", e);
  }
}

run();
