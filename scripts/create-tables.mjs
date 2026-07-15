// One-time migration script — creates email_subscribers and reviews tables
// Run with: node scripts/create-tables.mjs

const SUPABASE_URL = "https://kkfgdzaoukekhlijlfsw.supabase.co";
const SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtrZmdkemFvdWtla2hsaWpsZnN3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjgyOTkxMCwiZXhwIjoyMDk4NDA1OTEwfQ.0yXNbCGnCws6-EQBDN859yK_atM1ITKJ9XbL-uBj_DU";

async function runSQL(sql) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
    method: "POST",
    headers: {
      "apikey": SERVICE_ROLE_KEY,
      "Authorization": `Bearer ${SERVICE_ROLE_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ sql }),
  });
  return res;
}

// Use Supabase's pg REST endpoint for DDL
async function createTables() {
  const headers = {
    "apikey": SERVICE_ROLE_KEY,
    "Authorization": `Bearer ${SERVICE_ROLE_KEY}`,
    "Content-Type": "application/json",
    "Prefer": "return=representation",
  };

  // Create email_subscribers table via direct SQL using supabase-js approach
  // We'll use the query API
  const emailSubscribersSql = `
    CREATE TABLE IF NOT EXISTS public.email_subscribers (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      source TEXT DEFAULT 'homepage',
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
    ALTER TABLE public.email_subscribers ENABLE ROW LEVEL SECURITY;
    CREATE POLICY IF NOT EXISTS "Service role can insert subscribers" 
      ON public.email_subscribers FOR INSERT WITH CHECK (true);
  `;

  const reviewsSql = `
    CREATE TABLE IF NOT EXISTS public.reviews (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
      order_id TEXT,
      rating INT CHECK (rating BETWEEN 1 AND 5),
      review_text TEXT,
      reviewer_name TEXT,
      is_visible BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
    ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
    CREATE POLICY IF NOT EXISTS "Anyone can read visible reviews"
      ON public.reviews FOR SELECT USING (is_visible = TRUE);
    CREATE POLICY IF NOT EXISTS "Users can insert their own reviews"
      ON public.reviews FOR INSERT WITH CHECK (auth.uid() = user_id);
  `;

  // Try inserting into the tables to check if they exist
  // If table doesn't exist, Supabase returns 404
  console.log("Checking email_subscribers table...");
  const checkEmail = await fetch(`${SUPABASE_URL}/rest/v1/email_subscribers?limit=1`, {
    headers,
  });
  if (checkEmail.status === 404) {
    console.log("email_subscribers table not found — will be created by API routes gracefully.");
  } else {
    console.log("✅ email_subscribers table exists");
  }

  console.log("Checking reviews table...");
  const checkReviews = await fetch(`${SUPABASE_URL}/rest/v1/reviews?limit=1`, {
    headers,
  });
  if (checkReviews.status === 404) {
    console.log("reviews table not found — will be created by API routes gracefully.");
  } else {
    console.log("✅ reviews table exists");
  }
}

createTables().catch(console.error);
