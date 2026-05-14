const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://dflnrfvngmquaqdtjjhh.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRmbG5yZnZuZ21xdWFxZHRqamhoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgzMTczNTcsImV4cCI6MjA5Mzg5MzM1N30.uU7PgZZrVFV4MTe-x0fuEOVG6P6gUnbleH_WRuuAb_s');

async function test() {
  console.log("Starting insert...");
  const { data, error } = await supabase.from('jobs').insert([{
    title: "Test Job",
    slug: "test-job",
    category: "latest-jobs",
    short_info: "test",
    meta_description: "test",
    blog_content: "test",
    links: [],
    important_dates: []
  }]);
  console.log("Result:", { data, error });
}
test().catch(console.error);
