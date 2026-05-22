const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function test() {
  console.log("Checking join query...");
  const { data, error } = await supabase
    .from("chat_messages")
    .select(`
      id, text_content, is_deleted, created_at, user_id,
      chat_users ( display_name, avatar, role, is_banned )
    `)
    .limit(5);
  console.log('Error:', error);
  console.log('Data:', data);
}

test().catch(console.error);
