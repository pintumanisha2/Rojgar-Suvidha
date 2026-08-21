import { MetadataRoute } from 'next';
import { supabase } from '@/lib/supabase';
import { SERVICE_INFO_DB } from '@/lib/eSuvidhaContent';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Always use the real production domain for sitemap
  const baseUrl = 'https://www.rojgarsuvidha.com';

  // ── 1. Govt Jobs (excluding news) ─────────────────────────
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

  // ── 2. News / Blog posts ────────────────────────────────────
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

  // ── 3. Private Jobs ─────────────────────────────────────────
  const { data: privateJobs } = await supabase
    .from('private_jobs')
    .select('slug, created_at')
    .eq('status', 'active')
    .order('created_at', { ascending: false });

  const privateJobUrls: MetadataRoute.Sitemap = (privateJobs || []).map((job) => ({
    url: `${baseUrl}/private-jobs/${job.slug}`,
    lastModified: new Date(job.created_at),
    changeFrequency: 'weekly' as const,
    priority: 0.65,
  }));

  // ── 4. Static Pages ─────────────────────────────────────────────────────────
  // NOTE: Login-required pages (saved-jobs, profile-setup, track-application, dashboard)
  // are intentionally EXCLUDED — Googlebot gets 401/redirect = crawl budget waste
  const SITE_LAUNCH = new Date("2024-01-01"); // Use fixed date for stable lastModified
  const staticUrls: MetadataRoute.Sitemap = [
    // Core public pages
    { route: '',                    priority: 1.0, freq: 'hourly',  changed: new Date() },
    { route: '/latest-jobs',        priority: 0.95, freq: 'hourly', changed: new Date() },
    { route: '/results',            priority: 0.9,  freq: 'daily',  changed: new Date() },
    { route: '/admit-card',         priority: 0.9,  freq: 'daily',  changed: new Date() },
    { route: '/answer-key',         priority: 0.9,  freq: 'daily',  changed: new Date() },
    { route: '/admission',          priority: 0.85, freq: 'daily',  changed: new Date() },
    { route: '/news',               priority: 0.85, freq: 'hourly', changed: new Date() },
    { route: '/exam-calendar',      priority: 0.9,  freq: 'daily',  changed: new Date() },
    { route: '/age-calculator',     priority: 0.85, freq: 'weekly', changed: SITE_LAUNCH },
    { route: '/apply-for-me',       priority: 0.85, freq: 'weekly', changed: SITE_LAUNCH },
    { route: '/complaint',          priority: 0.5,  freq: 'monthly',changed: SITE_LAUNCH },
    // Private Jobs Portal (public listing pages only)
    { route: '/private-jobs',       priority: 0.9,  freq: 'hourly', changed: new Date() },
    { route: '/private-jobs/community', priority: 0.7, freq: 'daily', changed: new Date() },
    { route: '/private-jobs/resume-builder', priority: 0.75, freq: 'weekly', changed: SITE_LAUNCH },
    // Sector category pages (high SEO value)
    { route: '/jobs/ssc',           priority: 0.8,  freq: 'daily',  changed: new Date() },
    { route: '/jobs/railway',       priority: 0.8,  freq: 'daily',  changed: new Date() },
    { route: '/jobs/banking',       priority: 0.8,  freq: 'daily',  changed: new Date() },
    { route: '/jobs/upsc',          priority: 0.8,  freq: 'daily',  changed: new Date() },
    { route: '/jobs/police',        priority: 0.8,  freq: 'daily',  changed: new Date() },
    { route: '/jobs/defence',       priority: 0.75, freq: 'daily',  changed: new Date() },
    { route: '/jobs/teaching',      priority: 0.75, freq: 'daily',  changed: new Date() },
    { route: '/jobs/state-psc',     priority: 0.75, freq: 'daily',  changed: new Date() },
    // Info pages
    { route: '/about-us',           priority: 0.5,  freq: 'monthly',changed: SITE_LAUNCH },
    { route: '/contact-us',         priority: 0.5,  freq: 'monthly',changed: SITE_LAUNCH },
    { route: '/privacy',            priority: 0.3,  freq: 'yearly', changed: SITE_LAUNCH },
    { route: '/terms',              priority: 0.3,  freq: 'yearly', changed: SITE_LAUNCH },
    { route: '/refund-policy',      priority: 0.3,  freq: 'yearly', changed: SITE_LAUNCH },
    { route: '/e-suvidha',          priority: 0.7,  freq: 'weekly', changed: SITE_LAUNCH },
    { route: '/community',          priority: 0.7,  freq: 'daily',  changed: new Date() },
    { route: '/resume-builder',     priority: 0.75, freq: 'weekly', changed: SITE_LAUNCH },
  ].map(({ route, priority, freq, changed }) => ({
    url: `${baseUrl}${route}`,
    lastModified: changed,
    changeFrequency: freq as MetadataRoute.Sitemap[0]['changeFrequency'],
    priority,
  }));

  // ── 5. State-specific pages ──────────────────────────────────
  const ALL_STATE_CODES = ["up", "mp", "rj", "bh", "hr", "pb", "uk", "jh", "mh", "gu", "ka", "tn", "dl", "wb", "od", "as", "hp", "ch", "cg", "ga"];
  const { data: stateData } = await supabase
    .from('jobs')
    .select('state_code')
    .not('state_code', 'is', null);

  const dbStates = (stateData || []).map(s => s.state_code?.toLowerCase()).filter(Boolean);
  const combinedStates = Array.from(new Set([...ALL_STATE_CODES, ...dbStates]));

  const stateUrls: MetadataRoute.Sitemap = combinedStates.map(code => ({
    url: `${baseUrl}/state/${code}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.65,
  }));

  // ── 6. e-Suvidha Service Pages ──────────────────────────────
  const esuvidhaUrls: MetadataRoute.Sitemap = Object.keys(SERVICE_INFO_DB).map(slug => ({
    url: `${baseUrl}/e-suvidha/apply/${slug}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }));

  return [...staticUrls, ...newsUrls, ...jobUrls, ...privateJobUrls, ...stateUrls, ...esuvidhaUrls];
}

