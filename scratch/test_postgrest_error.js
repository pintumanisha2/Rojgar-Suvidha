const { createClient } = require('@supabase/supabase-js');

// Custom fetch that throws an error after 1 second
const hangingFetch = async (url, options) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      reject(new Error("Custom fetch aborted error!"));
    }, 1000);
  });
};

const supabase = createClient('https://kkfgdzaoukekhlijlfsw.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtrZmdkemFvdWtla2hsaWpsZnN3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI4Mjk5MTAsImV4cCI6MjA5ODQwNTkxMH0.PqmgCt02ZGDs7X6pv3IZDMG8Bp9PJ-ycE1eViYIU5a8', {
  global: { fetch: hangingFetch }
});

async function run() {
  console.log("Starting insert with hanging fetch...");
  try {
    const res = await supabase.from('jobs').insert([{ title: "Hanging test" }]);
    console.log("Promise resolved successfully:", res);
  } catch (err) {
    console.error("Promise rejected with exception:", err);
  }
}

run();
