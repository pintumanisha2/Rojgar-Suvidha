import { NextResponse } from "next/server";

// ─────────────────────────────────────────────
// SERVER-SIDE IN-MEMORY CACHE
// 500 req/month = ~16/day. We cache every unique
// query for 6 hours so repeated searches never
// burn extra API calls.
// ─────────────────────────────────────────────
interface CacheEntry {
  data: { totalCount: number; jobs: PartnerJob[] };
  expiry: number; // ms timestamp
}

interface PartnerJob {
  id: string;
  title: string;
  company: string;
  location: string;
  salary: string;
  snippet: string;
  type: string;
  link: string;
  updated: string;
}

const cache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6 hours

function getCacheKey(keywords: string, location: string, page: string) {
  return `${keywords.toLowerCase().trim()}|${location.toLowerCase().trim()}|${page}`;
}

function getFromCache(key: string): CacheEntry["data"] | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiry) {
    cache.delete(key);
    return null;
  }
  return entry.data;
}

function setInCache(key: string, data: CacheEntry["data"]) {
  cache.set(key, { data, expiry: Date.now() + CACHE_TTL_MS });
}

// ─────────────────────────────────────────────
// INDIA-SPECIFIC KEYWORD MAPPING
// Maps our UI category pills to better Jooble
// search terms for Indian job market
// ─────────────────────────────────────────────
const CATEGORY_KEYWORD_MAP: Record<string, string> = {
  "🏡 WFH":               "work from home jobs India",
  "💻 Tech & IT":         "IT software developer jobs India",
  "📊 Data Entry":        "data entry clerk jobs India",
  "📞 BPO / Telecalling": "BPO call center jobs India",
  "🛵 Logistics & Delivery": "delivery driver logistics jobs India",
  "All":                  "private sector jobs India hiring 2025",
};

const LOCATION_MAP: Record<string, string> = {
  "All India":   "India",
  "Remote/WFH":  "Remote India",
  "Delhi NCR":   "Delhi",
  "Bangalore":   "Bangalore",
  "Mumbai":      "Mumbai",
  "Pune":        "Pune",
};

// ─────────────────────────────────────────────
// MOCK DATA (used when no API key is set OR
// as emergency fallback on API error)
// ─────────────────────────────────────────────
const MOCK_JOBS: PartnerJob[] = [
  {
    id: "mock-1",
    title: "Work From Home Data Entry Specialist",
    company: "Teleperformance India",
    location: "Remote / WFH",
    salary: "₹18,000 – ₹28,000 / month",
    snippet: "Manage typing, verification, and spreadsheet operations entirely from home. Full training provided.",
    type: "Full-time / Remote",
    link: "https://www.teleperformance.com",
    updated: new Date().toISOString(),
  },
  {
    id: "mock-2",
    title: "Customer Support Executive (Voice/Non-Voice)",
    company: "Tech Mahindra",
    location: "Delhi NCR",
    salary: "₹20,000 – ₹32,000 / month",
    snippet: "Join our dynamic customer success team helping international and domestic clients. Hindi or English communication required.",
    type: "Full-time",
    link: "https://www.techmahindra.com",
    updated: new Date().toISOString(),
  },
  {
    id: "mock-3",
    title: "Junior Web Developer Intern",
    company: "Infosys BPM",
    location: "Remote / WFH",
    salary: "₹15,000 – ₹25,000 / month",
    snippet: "Learn HTML, CSS, JavaScript, and React while working on live portals. Perfect for fresh graduates.",
    type: "Internship",
    link: "https://www.infosys.com",
    updated: new Date().toISOString(),
  },
  {
    id: "mock-4",
    title: "Delivery Partner (Flexible Hours)",
    company: "Swiggy India",
    location: "Mumbai",
    salary: "₹25,000 – ₹35,000 / month",
    snippet: "Earn high payouts, daily incentives, and medical insurance by delivering orders in your local area.",
    type: "Part-time / Flex",
    link: "https://www.swiggy.com",
    updated: new Date().toISOString(),
  },
  {
    id: "mock-5",
    title: "Back Office Operations Associate",
    company: "Wipro",
    location: "Pune",
    salary: "₹22,000 – ₹35,000 / month",
    snippet: "Manage email queries, database updates, administrative logs, and client co-ordination.",
    type: "Full-time",
    link: "https://www.wipro.com",
    updated: new Date().toISOString(),
  },
  {
    id: "mock-6",
    title: "IT Support Technician",
    company: "Cognizant Technology",
    location: "Bangalore",
    salary: "₹28,000 – ₹45,000 / month",
    snippet: "Troubleshoot hardware, networking, and Windows systems. Bachelor's or IT certificate required.",
    type: "Full-time",
    link: "https://www.cognizant.com",
    updated: new Date().toISOString(),
  },
  {
    id: "mock-7",
    title: "HR Recruiter – Freshers Welcome",
    company: "Naukri.com",
    location: "Delhi NCR",
    salary: "₹18,000 – ₹26,000 / month",
    snippet: "Screen CVs, schedule interviews, and maintain recruitment trackers. Excellent communication mandatory.",
    type: "Full-time",
    link: "https://www.naukri.com",
    updated: new Date().toISOString(),
  },
  {
    id: "mock-8",
    title: "Digital Marketing Executive",
    company: "IndiaMart",
    location: "Remote / WFH",
    salary: "₹20,000 – ₹30,000 / month",
    snippet: "Run SEO, paid ads, social media campaigns and email marketing for B2B products.",
    type: "Full-time / Remote",
    link: "https://www.indiamart.com",
    updated: new Date().toISOString(),
  },
];

// ─────────────────────────────────────────────
// MAIN ROUTE HANDLER
// ─────────────────────────────────────────────
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const rawKeywords: string = body.keywords || "";
    const rawLocation: string = body.location || "All India";
    const page: string = body.page || "1";

    // Map category pill label → proper search keyword
    const keywords = CATEGORY_KEYWORD_MAP[rawKeywords] || rawKeywords || "private jobs India";
    const location = LOCATION_MAP[rawLocation] || rawLocation;

    const apiKey = process.env.JOOBLE_API_KEY;

    // — No API key: return filtered mock data —
    if (!apiKey || apiKey === "APNI_KEY_YAHAN_PASTE_KARO") {
      const q = rawKeywords.toLowerCase();
      const loc = rawLocation.toLowerCase();
      let filtered = MOCK_JOBS;
      if (q && q !== "all") {
        filtered = filtered.filter(
          j => j.title.toLowerCase().includes(q) || j.snippet.toLowerCase().includes(q)
        );
      }
      if (loc && loc !== "all india") {
        filtered = filtered.filter(
          j => j.location.toLowerCase().includes(loc) ||
               (loc.includes("remote") && j.location.toLowerCase().includes("remote"))
        );
      }
      return NextResponse.json({ totalCount: filtered.length, jobs: filtered, cached: false, mock: true });
    }

    // — Check cache first (saves API calls) —
    const cacheKey = getCacheKey(keywords, location, page);
    const cached = getFromCache(cacheKey);
    if (cached) {
      console.log(`[Jooble] Cache HIT: "${cacheKey}"`);
      return NextResponse.json({ ...cached, cached: true });
    }

    // — Live Jooble API call —
    console.log(`[Jooble] Cache MISS → calling API: keywords="${keywords}" location="${location}"`);
    const joobleUrl = `https://jooble.org/api/${apiKey}`;
    const response = await fetch(joobleUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        keywords,
        location,
        page,
        ResultOnPage: "15", // Max 15 per call to maximize info per request
      }),
      next: { revalidate: 0 }, // We handle caching ourselves
    });

    if (!response.ok) {
      throw new Error(`Jooble API error: ${response.status}`);
    }

    const data = await response.json();

    const cleanedJobs: PartnerJob[] = (data.jobs || []).map((job: Record<string, string>) => ({
      id: job.id?.toString() || Math.random().toString(36).slice(2),
      title: job.title || "Private Sector Job",
      company: job.company || "Verified Recruiter",
      location: job.location || "India",
      salary: job.salary || "Best in Industry",
      snippet: (job.snippet || "").replace(/<\/?[^>]+(>|$)/g, ""), // strip HTML tags
      type: job.type || "Full-time",
      link: job.link || "https://jooble.org",
      updated: job.updated || new Date().toISOString(),
    }));

    const result = {
      totalCount: data.totalCount || cleanedJobs.length,
      jobs: cleanedJobs,
    };

    // Store in cache for 6 hours
    setInCache(cacheKey, result);

    return NextResponse.json({ ...result, cached: false });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[Jooble] Route Error:", message);
    // Graceful fallback — UI never crashes
    return NextResponse.json({
      totalCount: MOCK_JOBS.length,
      jobs: MOCK_JOBS,
      cached: false,
      mock: true,
      error: message,
    });
  }
}
