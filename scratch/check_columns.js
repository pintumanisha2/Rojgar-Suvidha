const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function test() {
  console.log("Checking columns on chat_messages...");
  const { data, error } = await supabase
    .from("chat_messages")
    .select("id, is_pinned, is_poll, poll_question, poll_options, reports_count")
    .limit(1);
    
  if (error) {
    console.error("Columns check failed:", error);
  } else {
    console.log("Columns exist successfully! Sample row:", data);
  }
}

test().catch(console.error);
