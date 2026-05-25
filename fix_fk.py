import os
from supabase import create_client

url = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
key = os.environ.get("NEXT_PUBLIC_SUPABASE_ANON_KEY")

# Anon key cannot execute raw sql.
# I will output the SQL for the user to run, or I can use the Service role key if it's there.
