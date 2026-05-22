const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function test() {
  console.log("Testing insert on chat_users...");
  const tempId = '00000000-0000-0000-0000-000000000000';
  const { data, error } = await supabase.from('chat_users').insert([{
    display_name: 'Test Setup User',
    avatar: '1',
    role: 'student'
  }]).select();
  console.log('Insert result:', { data, error });
}

test().catch(console.error);
