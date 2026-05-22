import dynamic from "next/dynamic";
import HeroBanner from "@/components/home/HeroBanner";
import JobPreferenceToggle from "@/components/home/JobPreferenceToggle";
import { supabase } from "@/lib/supabase";

// Lazy load non-critical components for faster initial load
const SocialPromo = dynamic(() => import("@/components/home/SocialPromo"));
const Highlights = dynamic(() => import("@/components/home/Highlights"));
const TrustSignals = dynamic(() => import("@/components/home/TrustSignals"));
const MainContent = dynamic(() => import("@/components/home/MainContent"));
const AspirantsAddaPromo = dynamic(() => import("@/components/home/AspirantsAddaPromo"));
const AdSensePlaceholder = dynamic(() => import("@/components/ads/AdSensePlaceholder"));
import type { Metadata } from "next";

const BASE_URL = "https://www.rojgarsuvidha.com";

// ── Homepage-specific SEO metadata (overrides layout defaults) ──
export const metadata: Metadata = {
  title: "Rojgar Suvidha – #1 Sarkari Naukri, Government Jobs, Results & Admit Card 2025",
  description:
    "Rojgar Suvidha: India's most trusted Sarkari Naukri portal. Get daily updates on Government Jobs 2025, SSC, UPSC, Railway, Bank, Police jobs, Admit Cards, Results & Answer Keys. Apply online with our expert 'Apply For Me' service.",
  alternates: { canonical: BASE_URL },
  openGraph: {
    title: "Rojgar Suvidha – #1 Sarkari Naukri & Government Jobs 2025",
    description: "Daily Sarkari Naukri, Govt Jobs, Results, Admit Cards & Answer Keys. India's most trusted job portal. Apply for me service available.",
    url: BASE_URL,
    type: "website",
  },
};

// ── JSON-LD for Homepage ──
const homepageFaqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "What is Rojgar Suvidha?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Rojgar Suvidha is India's #1 trusted online portal for Sarkari Naukri (Government Jobs), providing daily job notifications from SSC, UPSC, Railway, Banking, Police and State PSC. We also offer results, admit cards, answer keys, and an exclusive 'Apply For Me' form-filling service."
      }
    },
    {
      "@type": "Question",
      name: "How to get daily government job alerts?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Join Rojgar Suvidha's Telegram channel or WhatsApp group to get instant Sarkari Naukri alerts on your phone. You can also enable browser push notifications on our website for real-time updates."
      }
    },
    {
      "@type": "Question",
      name: "What is the 'Apply For Me' service?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "'Apply For Me' is Rojgar Suvidha's premium service where you upload your documents and our expert team fills your government job application form with 100% accuracy. We handle image resizing, data entry, and final submission to prevent rejection errors."
      }
    },
    {
      "@type": "Question",
      name: "Which government jobs are available in 2025?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "In 2025, major government job opportunities include SSC CGL, SSC CHSL, SSC MTS, RRB NTPC, RRB Group D, IBPS PO, SBI PO, UPSC Civil Services, NDA, Indian Army Agniveer, UP Police, Bihar Police, and thousands of State PSC vacancies. Visit Rojgar Suvidha's Latest Jobs section for today's updates."
      }
    },
    {
      "@type": "Question",
      name: "How to check Sarkari Result 2025?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Visit Rojgar Suvidha's Results section to find direct links to official result PDFs and scorecard login portals. You need your Roll Number or Registration Number and Date of Birth to check your Sarkari Result 2025."
      }
    },
  ]
};

const itemListSchema = {
  "@context": "https://schema.org",
  "@type": "ItemList",
  name: "Government Job Categories on Rojgar Suvidha",
  description: "Browse Sarkari Naukri by category on India's #1 job portal",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Latest Sarkari Naukri 2025", url: `${BASE_URL}/latest-jobs` },
    { "@type": "ListItem", position: 2, name: "Sarkari Result 2025", url: `${BASE_URL}/results` },
    { "@type": "ListItem", position: 3, name: "Admit Card Download 2025", url: `${BASE_URL}/admit-card` },
    { "@type": "ListItem", position: 4, name: "Answer Key 2025", url: `${BASE_URL}/answer-key` },
    { "@type": "ListItem", position: 5, name: "University Admission 2025", url: `${BASE_URL}/admission` },
    { "@type": "ListItem", position: 6, name: "Apply For Me Service", url: `${BASE_URL}/apply-for-me` },
  ]
};

export const revalidate = 60; // Revalidate the page every 60 seconds for lightning-fast speeds

async function getBanners() {
  try {
    const { data } = await supabase
      .from("banners")
      .select("id, title, image_url, link_url")
      .eq("status", "active")
      .order("created_at", { ascending: false });
    return data || [];
  } catch (err) {
    return [];
  }
}

export default async function Home() {
  const initialBanners = await getBanners();

  return (
    <div className="flex-1 bg-gray-50 dark:bg-gray-950">
      {/* JSON-LD for Homepage SEO + AEO */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(homepageFaqSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }} />
      {/* Smart Tab Toggle for Govt vs Private Jobs (Moved to very top for App Users) */}
      <JobPreferenceToggle />

      {/* Auto-Sliding Hero Banner */}
      <HeroBanner initialBanners={initialBanners} />

      {/* Social Media Call to Action */}
      <SocialPromo />

      {/* Top Banner Ad — hidden on mobile to reduce scroll */}
      <div className="hidden sm:block max-w-7xl mx-auto px-4 mt-2">
        <AdSensePlaceholder format="leaderboard" />
      </div>

      {/* Feature Highlights (Apply For Me & YouTube) */}
      <Highlights />

      {/* Main Content - Job Listings */}
      <MainContent />

      {/* Bottom Banner Ad */}
      <div className="max-w-7xl mx-auto px-4 mb-8">
        <AdSensePlaceholder format="responsive" />
      </div>

      {/* Aspirants Adda Live Chat Promotion Banner */}
      <AspirantsAddaPromo />

      {/* Trust Building Signals (Stats + Reviews) - Moved below advertisement */}
      <TrustSignals />

      {/* SEO Content Block for Home Page */}
      <div className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 md:py-16">
          <div className="prose dark:prose-invert max-w-none prose-indigo prose-headings:font-extrabold prose-h2:text-2xl md:prose-h2:text-3xl prose-p:text-gray-600 dark:prose-p:text-gray-400">
            <h2>Welcome to Rojgar Suvidha: India's No. 1 Portal for Sarkari Naukri & Government Jobs 2025</h2>
            <p>
              Finding accurate and timely information about <strong className="text-gray-900 dark:text-white">government jobs (Sarkari Naukri)</strong> shouldn't be difficult. Unfortunately, misinformation, fake links, and delayed updates often lead to missed opportunities. That's why we built <strong>Rojgar Suvidha</strong>. We are a trusted, fast, and comprehensive platform dedicated to bringing you the <strong>latest government job notifications, admit cards, exam results, answer keys, and university admissions</strong>—all under one roof, with zero clutter and maximum accuracy.
            </p>

            <h3>Why Choose Rojgar Suvidha for Your Career Updates?</h3>
            <p>
              Checking multiple official websites—SSC, UPSC, RRB, IBPS, or State PSCs—every single day can be exhausting. We streamline this process for you. Here is why millions of students trust Rojgar Suvidha daily:
            </p>
            <ul>
              <li><strong>Fast Updates:</strong> Whether it's a midnight SSC result declaration or an early morning Railway notification, our team updates the portal instantly. You will be the first to know.</li>
              <li><strong>Exclusive "Apply For Me" Service:</strong> Afraid of making mistakes in your application form? Don't have access to a cyber cafe? Upload your documents securely to Rojgar Suvidha, and our expert team will carefully fill and submit your government job forms with complete accuracy.</li>
              <li><strong>Clean Experience:</strong> Unlike other platforms cluttered with misleading ads and pop-ups, we prioritize user experience with a clean, modern, and mobile-friendly interface.</li>
              <li><strong>Comprehensive Coverage:</strong> From 10th pass jobs like MTS and GD Constable to highly prestigious exams like UPSC Civil Services, NDA, and Bank PO, we cover opportunities for every educational background.</li>
              <li><strong>Direct & Verified Links:</strong> We hate clickbait. Every link provided on our platform redirects you straight to the official PDF notification, official apply online portal, or official result PDF.</li>
            </ul>

            <h3>Our Major Categories</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 not-prose my-8">
              <div className="bg-indigo-50 dark:bg-indigo-900/10 p-5 rounded-2xl border border-indigo-100 dark:border-indigo-800">
                <h4 className="font-bold text-indigo-700 dark:text-indigo-400 text-lg mb-2">Latest Jobs (Sarkari Naukri)</h4>
                <p className="text-sm text-gray-700 dark:text-gray-300">Daily updates on new vacancies from SSC, Railways, Banking, Defence, Police, and State Governments. Detailed eligibility criteria and exact last dates are clearly mentioned.</p>
              </div>
              <div className="bg-green-50 dark:bg-green-900/10 p-5 rounded-2xl border border-green-100 dark:border-green-800">
                <h4 className="font-bold text-green-700 dark:text-green-400 text-lg mb-2">Exam Results</h4>
                <p className="text-sm text-gray-700 dark:text-gray-300">Fastest direct links to check your Sarkari Result. We provide downloaded PDFs for merit lists and direct login portals for scorecards to bypass heavy server traffic.</p>
              </div>
              <div className="bg-orange-50 dark:bg-orange-900/10 p-5 rounded-2xl border border-orange-100 dark:border-orange-800">
                <h4 className="font-bold text-orange-700 dark:text-orange-400 text-lg mb-2">Admit Cards</h4>
                <p className="text-sm text-gray-700 dark:text-gray-300">Never miss an exam. Download your Hall Tickets and Call Letters 1-2 weeks before the exam. We provide direct region-wise download links.</p>
              </div>
              <div className="bg-purple-50 dark:bg-purple-900/10 p-5 rounded-2xl border border-purple-100 dark:border-purple-800">
                <h4 className="font-bold text-purple-700 dark:text-purple-400 text-lg mb-2">Answer Keys & Syllabi</h4>
                <p className="text-sm text-gray-700 dark:text-gray-300">Calculate your raw scores immediately after the exam with official answer keys. Download detailed, topic-wise official syllabus PDFs before starting your preparation.</p>
              </div>
            </div>

            <h3>Frequently Asked Questions (FAQs)</h3>
            <div className="space-y-4 not-prose mt-6">
              <div className="border border-gray-200 dark:border-gray-800 rounded-xl p-4">
                <h4 className="font-bold text-gray-900 dark:text-white">Q1. Is Rojgar Suvidha completely free to use?</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Yes, accessing job notifications, downloading admit cards, and checking results on Rojgar Suvidha is 100% free. Fees only apply if you opt for our premium "Apply For Me" service.</p>
              </div>
              <div className="border border-gray-200 dark:border-gray-800 rounded-xl p-4">
                <h4 className="font-bold text-gray-900 dark:text-white">Q2. How accurate are the job notifications here?</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">We maintain strict editorial standards. Every job posted is verified directly from official government portals, employment newspapers (Rojgar Samachar), and official press releases.</p>
              </div>
              <div className="border border-gray-200 dark:border-gray-800 rounded-xl p-4">
                <h4 className="font-bold text-gray-900 dark:text-white">Q3. What is the "Apply For Me" feature?</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">It is an expert service where students upload their documents on our secure portal, and our trained professionals fill out complex government job forms on their behalf to ensure zero rejection due to technical errors.</p>
              </div>
              <div className="border border-gray-200 dark:border-gray-800 rounded-xl p-4">
                <h4 className="font-bold text-gray-900 dark:text-white">Q4. How do I get daily job updates?</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">You can join our active Telegram channel and WhatsApp group by clicking the floating buttons on your screen to receive instant alerts right on your phone.</p>
              </div>
            </div>

            <p className="mt-8">
              <strong>Disclaimer:</strong> Rojgar Suvidha is an independent educational portal and is NOT affiliated with any government organization. We curate publicly available information to assist students. Always verify details from official government websites before applying.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
