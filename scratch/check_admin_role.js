const dotenv = require('dotenv');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Load .env.local
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function test() {
  const targetEmail = "akshatansh02@gmail.com";
  console.log("Checking admin role for:", targetEmail);
  const { data, error } = await supabase
    .from('admin_roles')
    .select('*')
    .eq('email', targetEmail);

  if (error) {
    console.error("Error:", error);
  } else {
    console.log("Database entries found:", data);
  }
}

test();
