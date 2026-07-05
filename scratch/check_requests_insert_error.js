const dotenv = require('dotenv');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function test() {
  console.log("Testing insert into apply_for_me_requests...");
  
  // We will try to insert a dummy record to see if it succeeds or returns a database constraint/column mismatch error!
  const dummyPayload = {
    applicant_name: "Test Name",
    phone_number: "1234567890",
    email: "test@example.com",
    job_title: "[e-Suvidha] Test Service",
    status: "pending",
    admin_notes: "Test Admin Notes",
    tracking_id: "TEST-ORDER-123",
  };

  const { data, error } = await supabase
    .from("apply_for_me_requests")
    .insert([dummyPayload])
    .select();

  if (error) {
    console.error("DATABASE INSERT FAILED:");
    console.error("- Error Code:", error.code);
    console.error("- Message:", error.message);
    console.error("- Details:", error.details);
    console.error("- Hint:", error.hint);
  } else {
    console.log("DATABASE INSERT SUCCESSFUL!");
    console.log(data);
    
    // Clean up
    console.log("Cleaning up dummy record...");
    await supabase.from("apply_for_me_requests").delete().eq("tracking_id", "TEST-ORDER-123");
  }
}

test();
