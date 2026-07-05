const dotenv = require('dotenv');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function test() {
  console.log("Getting a valid custom form ID...");
  const { data: forms } = await supabase.from("custom_forms").select("id").limit(1);
  const formId = forms && forms[0] ? forms[0].id : null;
  console.log("Using Form ID:", formId);

  // We will insert a dummy row into user_applications and select it back to see all of its columns!
  console.log("Inserting a dummy application row...");
  const { data, error } = await supabase
    .from("user_applications")
    .insert([{
      form_id: formId,
      submission_data: {}
    }])
    .select();

  if (error) {
    console.error("Insert failed:", error.message);
  } else {
    console.log("Columns of user_applications table in the database:");
    console.log(Object.keys(data[0]));
    
    // Clean up
    console.log("Cleaning up dummy application...");
    await supabase.from("user_applications").delete().eq("id", data[0].id);
  }
}

test();
