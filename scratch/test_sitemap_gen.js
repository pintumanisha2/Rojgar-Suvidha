const dotenv = require('dotenv');
const path = require('path');

// Load .env.local
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

// In Node environment, we need to mock import alias or configure ts-node to run sitemap.ts.
// Since sitemap.ts uses typescript and alias, we can write a node-compiled JS test that emulates the exact same queries as sitemap.ts!

const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function test() {
  console.log("Simulating sitemap generator queries...");
  
  const baseUrl = 'https://www.rojgarsuvidha.com';

  // 1. Govt Jobs (excluding news)
  const { data: jobs } = await supabase
    .from('jobs')
    .select('slug, created_at, category, status')
    .neq('status', 'draft')
    .neq('category', 'news')
    .order('created_at', { ascending: false });

  const jobUrls = (jobs || []).map((job) => ({
    url: `${baseUrl}/job/${job.slug}`,
    category: job.category,
    status: job.status
  }));

  console.log("Number of general jobs found in sitemap select:", jobUrls.length);
  
  const targetJob = jobUrls.find(url => url.url.includes("rrb-junior-engineer"));
  if (targetJob) {
    console.log("MATCH FOUND in sitemap general jobs list:");
    console.log(targetJob);
  } else {
    console.log("Target job not found in general jobs. Let's check news category.");
  }

  // 2. News / Blog posts
  const { data: newsItems } = await supabase
    .from('jobs')
    .select('slug, created_at, category, status')
    .eq('category', 'news')
    .neq('status', 'draft')
    .order('created_at', { ascending: false });

  const newsUrls = (newsItems || []).map((news) => ({
    url: `${baseUrl}/job/${news.slug}`,
    category: news.category,
    status: news.status
  }));

  console.log("Number of news posts found in sitemap select:", newsUrls.length);
  const targetNews = newsUrls.find(url => url.url.includes("rrb-junior-engineer"));
  if (targetNews) {
    console.log("MATCH FOUND in news list:");
    console.log(targetNews);
  }
}

test();
