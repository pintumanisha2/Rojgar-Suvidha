const dotenv = require('dotenv');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testColumn(columnName, value) {
  const { error } = await supabase
    .from("apply_for_me_requests")
    .insert([{ [columnName]: value }])
    .select();
  
  if (error && error.message.includes("schema cache")) {
    return false; // Column does not exist
  }
  return true; // Column exists (or threw another error like missing foreign key, etc.)
}

async function run() {
  const columns = [
    "applicant_name",
    "phone_number",
    "email",
    "job_title",
    "status",
    "admin_notes",
    "tracking_id",
    "details",
    "job_id"
  ];

  console.log("Checking which columns exist on apply_for_me_requests:");
  for (const col of columns) {
    const exists = await testColumn(col, col === "job_id" ? null : "test");
    console.log(`- ${col}: ${exists ? "EXISTS" : "DOES NOT EXIST"}`);
  }
}

run();
