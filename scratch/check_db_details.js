const dotenv = require('dotenv');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

// Use service role key to query system information
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function test() {
  console.log("Querying columns for apply_for_me_requests...");
  
  const { data, error } = await supabase.rpc('get_table_columns', { table_name: 'apply_for_me_requests' });
  
  if (error) {
    // If RPC doesn't exist, use raw SQL via REST if possible, or select from information_schema
    console.log("RPC get_table_columns failed, trying custom query or direct meta select...");
    
    // We can run a direct query by checking if we can fetch one row's structure or meta
    const { data: cols, error: err } = await supabase.from('apply_for_me_requests').select().limit(0);
    if (err) {
      console.error("Meta query failed:", err);
    } else {
      console.log("Table metadata fetch success. Object keys would be:");
      // Direct select empty array doesn't have keys if empty, but we can check system tables if we want.
      // Let's do a quick postgres query via an existing function or view if any.
    }
  } else {
    console.log("Columns:", data);
  }
}

test();
