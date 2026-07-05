const dotenv = require('dotenv');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Load .env.local
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log("Supabase URL:", supabaseUrl);

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function test() {
  console.log("Attempting insert into jobs table...");
  const payload = {
    title: "Test Job " + Date.now(),
    slug: "test-job-" + Date.now(),
    category: "latest-jobs",
    status: "active",
    short_info: "Test short info",
    meta_description: "Test meta desc",
    blog_content: "<p>Test content</p>",
    links: [{ label: "Test Link", url: "https://example.com" }],
    important_dates: [{ label: "Last Date", value: "2026-08-01" }]
  };

  try {
    const { data, error } = await supabase.from('jobs').insert([payload]).select();
    if (error) {
      console.error("Database Insert Error:", error);
    } else {
      console.log("Insert Succeeded! Inserted Data:", data);
    }
  } catch (err) {
    console.error("Caught Exception:", err);
  }
}

test();
