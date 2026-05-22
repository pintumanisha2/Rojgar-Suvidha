const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function test() {
  console.log("Checking chat_poll_votes...");
  const { data: votes, error: votesError } = await supabase
    .from("chat_poll_votes")
    .select("*")
    .limit(1);
  console.log('Poll Votes query result:', { exists: !votesError, count: votes?.length, error: votesError });

  console.log("Checking chat_reactions...");
  const { data: reactions, error: rxError } = await supabase
    .from("chat_reactions")
    .select("*")
    .limit(1);
  console.log('Reactions query result:', { exists: !rxError, count: reactions?.length, error: rxError });
}

test().catch(console.error);
