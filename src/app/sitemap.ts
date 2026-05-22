import { MetadataRoute } from 'next';
import { supabase } from '@/lib/supabase';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Use the production URL or fallback to localhost for dev
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://rojgarsuvidha.com';

  // Fetch all jobs (excluding news) — regular job/exam posts
  const { data: jobs } = await supabase
    .from('jobs')
    .select('slug, created_at')
    .neq('status', 'draft')
    .neq('category', 'news')
    .order('created_at', { ascending: false });

  const jobUrls: MetadataRoute.Sitemap = (jobs || []).map((job) => ({
    url: `${baseUrl}/job/${job.slug}`,
    lastModified: new Date(job.created_at),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }));

  // Fetch news/blog posts separately — treated as high-priority, daily-crawl content
  const { data: newsItems } = await supabase
    .from('jobs')
    .select('slug, created_at')
    .eq('category', 'news')
    .neq('status', 'draft')
    .order('created_at', { ascending: false });

  const newsUrls: MetadataRoute.Sitemap = (newsItems || []).map((news) => ({
    url: `${baseUrl}/job/${news.slug}`,
    lastModified: new Date(news.created_at),
    changeFrequency: 'daily' as const,
    priority: 0.8,
  }));

  const staticUrls: MetadataRoute.Sitemap = [
    '',
    '/latest-jobs',
    '/results',
    '/admit-card',
    '/answer-key',
    '/admission',
    '/news',
    // '/private-jobs',
    '/about-us',
    '/contact-us',
    '/privacy',
    '/terms',
    '/refund-policy',
    '/track-application',
    '/complaint',
    '/saved-jobs',
    // Sector-specific job category pages
    '/jobs/ssc',
    '/jobs/railway',
    '/jobs/banking',
    '/jobs/upsc',
    '/jobs/police',
    '/jobs/defence',
    '/jobs/teaching',
    '/jobs/state-psc',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: route === '' ? 'hourly' as const : 'daily' as const,
    priority: route === '' ? 1.0 : route.startsWith('/jobs/') ? 0.75 : 0.8,
  }));

  // Fetch unique state codes from jobs to include state-specific pages in sitemap
  const { data: stateData } = await supabase
    .from('jobs')
    .select('state_code')
    .not('state_code', 'is', null);
  
  const uniqueStates = Array.from(new Set((stateData || []).map(s => s.state_code)));
  const stateUrls: MetadataRoute.Sitemap = uniqueStates.map(code => ({
    url: `${baseUrl}/state/${code?.toLowerCase()}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.6,
  }));

  return [...staticUrls, ...newsUrls, ...jobUrls, ...stateUrls];
}
