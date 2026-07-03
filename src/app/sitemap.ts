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

  // ── 4. Static Pages ─────────────────────────────────────────
  const staticUrls: MetadataRoute.Sitemap = [
    // Core public pages
    { route: '',                    priority: 1.0, freq: 'hourly'  },
    { route: '/latest-jobs',        priority: 0.95, freq: 'hourly' },
    { route: '/results',            priority: 0.9,  freq: 'daily'  },
    { route: '/admit-card',         priority: 0.9,  freq: 'daily'  },
    { route: '/answer-key',         priority: 0.9,  freq: 'daily'  },
    { route: '/admission',          priority: 0.85, freq: 'daily'  },
    { route: '/news',               priority: 0.85, freq: 'hourly' },
    { route: '/exam-calendar',      priority: 0.9,  freq: 'daily'  },
    { route: '/apply-for-me',       priority: 0.85, freq: 'weekly' },
    { route: '/track-application',  priority: 0.7,  freq: 'weekly' },
    { route: '/saved-jobs',         priority: 0.6,  freq: 'weekly' },
    { route: '/complaint',          priority: 0.5,  freq: 'monthly'},
    // Private Jobs Portal
    { route: '/private-jobs',       priority: 0.9,  freq: 'hourly' },
    { route: '/private-jobs/community', priority: 0.7, freq: 'daily' },
    { route: '/private-jobs/resume-builder', priority: 0.75, freq: 'weekly' },
    // Sector category pages (high SEO value)
    { route: '/jobs/ssc',           priority: 0.8,  freq: 'daily'  },
    { route: '/jobs/railway',       priority: 0.8,  freq: 'daily'  },
    { route: '/jobs/banking',       priority: 0.8,  freq: 'daily'  },
    { route: '/jobs/upsc',          priority: 0.8,  freq: 'daily'  },
    { route: '/jobs/police',        priority: 0.8,  freq: 'daily'  },
    { route: '/jobs/defence',       priority: 0.75, freq: 'daily'  },
    { route: '/jobs/teaching',      priority: 0.75, freq: 'daily'  },
    { route: '/jobs/state-psc',     priority: 0.75, freq: 'daily'  },
    // Info pages
    { route: '/about-us',           priority: 0.5,  freq: 'monthly'},
    { route: '/contact-us',         priority: 0.5,  freq: 'monthly'},
    { route: '/privacy',            priority: 0.3,  freq: 'yearly' },
    { route: '/terms',              priority: 0.3,  freq: 'yearly' },
    { route: '/refund-policy',      priority: 0.3,  freq: 'yearly' },
    { route: '/e-suvidha',          priority: 0.7,  freq: 'weekly' },
    { route: '/community',          priority: 0.7,  freq: 'daily'  },
    { route: '/resume-builder',     priority: 0.75, freq: 'weekly' },
  ].map(({ route, priority, freq }) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: freq as MetadataRoute.Sitemap[0]['changeFrequency'],
    priority,
  }));

  // ── 5. State-specific pages ──────────────────────────────────
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

  // ── 6. e-Suvidha Service Pages ──────────────────────────────
  const esuvidhaUrls: MetadataRoute.Sitemap = Object.keys(SERVICE_INFO_DB).map(slug => ({
    url: `${baseUrl}/e-suvidha/apply/${slug}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }));

  return [...staticUrls, ...newsUrls, ...jobUrls, ...privateJobUrls, ...stateUrls, ...esuvidhaUrls];
}

