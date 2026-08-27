import { MetadataRoute } from 'next';
import { supabase } from '@/lib/supabase';
import { SERVICE_INFO_DB } from '@/lib/eSuvidhaContent';
import { SUPPORTED_LANGUAGES } from '@/lib/i18n';

export const dynamic = 'force-dynamic';
export const revalidate = 0; // Always fresh — Google must see new slugs immediately after publish

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://www.rojgarsuvidha.com';

  // ── 1. Govt Jobs (excluding news) ─────────────────────────
  const { data: jobs } = await supabase
    .from('jobs')
    .select('slug, created_at, updated_at')
    .neq('status', 'draft')
    .neq('category', 'news')
    .order('created_at', { ascending: false });

  const jobUrls: MetadataRoute.Sitemap = (jobs || []).map((job) => {
    const lastMod = new Date(job.updated_at || job.created_at);
    const langAlternates: Record<string, string> = {
      en: `${baseUrl}/job/${job.slug}`,
    };
    SUPPORTED_LANGUAGES.forEach((lang) => {
      langAlternates[lang] = `${baseUrl}/${lang}/job/${job.slug}`;
    });

    return {
      url: `${baseUrl}/job/${job.slug}`,
      lastModified: lastMod,
      changeFrequency: 'daily' as const,
      priority: 0.8,
      alternates: {
        languages: langAlternates,
      },
    };
  });

  // ── 2. News / Blog posts ────────────────────────────────────
  const { data: newsItems } = await supabase
    .from('jobs')
    .select('slug, created_at, updated_at')
    .eq('category', 'news')
    .neq('status', 'draft')
    .order('created_at', { ascending: false });

  const newsUrls: MetadataRoute.Sitemap = (newsItems || []).map((news) => {
    const lastMod = new Date(news.updated_at || news.created_at);
    const langAlternates: Record<string, string> = {
      en: `${baseUrl}/job/${news.slug}`,
    };
    SUPPORTED_LANGUAGES.forEach((lang) => {
      langAlternates[lang] = `${baseUrl}/${lang}/job/${news.slug}`;
    });

    return {
      url: `${baseUrl}/job/${news.slug}`,
      lastModified: lastMod,
      changeFrequency: 'daily' as const,
      priority: 0.85,
      alternates: {
        languages: langAlternates,
      },
    };
  });

  // ── 3. Private Jobs ─────────────────────────────────────────
  const { data: privateJobs } = await supabase
    .from('private_jobs')
    .select('slug, created_at, updated_at')
    .eq('status', 'active')
    .order('created_at', { ascending: false });

  const privateJobUrls: MetadataRoute.Sitemap = (privateJobs || []).map((job) => ({
    url: `${baseUrl}/private-jobs/${job.slug}`,
    lastModified: new Date(job.updated_at || job.created_at),
    changeFrequency: 'weekly' as const,
    priority: 0.65,
  }));

  // ── 4. Static Pages ─────────────────────────────────────────────────────────
  const SITE_LAUNCH = new Date("2024-01-01");
  const latestJobDate = jobs?.[0]?.created_at ? new Date(jobs[0].created_at) : SITE_LAUNCH;

  const staticUrls: MetadataRoute.Sitemap = [
    { route: '',                    priority: 1.0, freq: 'hourly',  changed: latestJobDate },
    { route: '/latest-jobs',        priority: 0.95, freq: 'hourly', changed: latestJobDate },
    { route: '/results',            priority: 0.9,  freq: 'daily',  changed: latestJobDate },
    { route: '/admit-card',         priority: 0.9,  freq: 'daily',  changed: latestJobDate },
    { route: '/answer-key',         priority: 0.9,  freq: 'daily',  changed: latestJobDate },
    { route: '/admission',          priority: 0.85, freq: 'daily',  changed: latestJobDate },
    { route: '/news',               priority: 0.85, freq: 'hourly', changed: latestJobDate },
    { route: '/exam-calendar',      priority: 0.9,  freq: 'daily',  changed: latestJobDate },
    { route: '/age-calculator',     priority: 0.85, freq: 'weekly', changed: SITE_LAUNCH },
    { route: '/apply-for-me',       priority: 0.85, freq: 'weekly', changed: SITE_LAUNCH },
    { route: '/complaint',          priority: 0.5,  freq: 'monthly',changed: SITE_LAUNCH },
    { route: '/private-jobs',       priority: 0.9,  freq: 'hourly', changed: latestJobDate },
    { route: '/private-jobs/community', priority: 0.7, freq: 'daily', changed: latestJobDate },
    { route: '/private-jobs/resume-builder', priority: 0.75, freq: 'weekly', changed: SITE_LAUNCH },
    { route: '/jobs/ssc',           priority: 0.8,  freq: 'daily',  changed: latestJobDate },
    { route: '/jobs/railway',       priority: 0.8,  freq: 'daily',  changed: latestJobDate },
    { route: '/jobs/banking',       priority: 0.8,  freq: 'daily',  changed: latestJobDate },
    { route: '/jobs/upsc',          priority: 0.8,  freq: 'daily',  changed: latestJobDate },
    { route: '/jobs/police',        priority: 0.8,  freq: 'daily',  changed: latestJobDate },
    { route: '/jobs/defence',       priority: 0.75, freq: 'daily',  changed: latestJobDate },
    { route: '/jobs/teaching',      priority: 0.75, freq: 'daily',  changed: latestJobDate },
    { route: '/jobs/state-psc',     priority: 0.75, freq: 'daily',  changed: latestJobDate },
    { route: '/about-us',           priority: 0.5,  freq: 'monthly',changed: SITE_LAUNCH },
    { route: '/contact-us',         priority: 0.5,  freq: 'monthly',changed: SITE_LAUNCH },
    { route: '/privacy',            priority: 0.3,  freq: 'yearly', changed: SITE_LAUNCH },
    { route: '/terms',              priority: 0.3,  freq: 'yearly', changed: SITE_LAUNCH },
    { route: '/refund-policy',      priority: 0.3,  freq: 'yearly', changed: SITE_LAUNCH },
    { route: '/e-suvidha',          priority: 0.7,  freq: 'weekly', changed: SITE_LAUNCH },
    { route: '/community',          priority: 0.7,  freq: 'daily',  changed: latestJobDate },
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
    lastModified: latestJobDate,
    changeFrequency: 'weekly' as const,
    priority: 0.65,
  }));

  // ── 6. e-Suvidha Service Pages ──────────────────────────────
  const esuvidhaUrls: MetadataRoute.Sitemap = Object.keys(SERVICE_INFO_DB).map(slug => ({
    url: `${baseUrl}/e-suvidha/apply/${slug}`,
    lastModified: SITE_LAUNCH,
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }));

  return [...staticUrls, ...newsUrls, ...jobUrls, ...privateJobUrls, ...stateUrls, ...esuvidhaUrls];
}
