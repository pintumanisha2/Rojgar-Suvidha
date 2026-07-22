import dynamic from "next/dynamic";
import HeroBanner from "@/components/home/HeroBanner";
import JobPreferenceToggle from "@/components/home/JobPreferenceToggle";
import { supabase } from "@/lib/supabase";
import { Suspense } from "react";
import MainContentSkeleton from "@/components/ui/MainContentSkeleton";
import RecommendedJobs from "@/components/ui/RecommendedJobs";

// Lazy load non-critical components for faster initial load
const SocialPromo = dynamic(() => import("@/components/home/SocialPromo"));
const Highlights = dynamic(() => import("@/components/home/Highlights"));
const FeaturedServices = dynamic(() => import("@/components/home/FeaturedServices"));
const TrustSignals = dynamic(() => import("@/components/home/TrustSignals"));
const MainContent = dynamic(() => import("@/components/home/MainContent"));
const StateJobsSection = dynamic(() => import("@/components/home/StateJobsSection"));
import CalendarSelector from "@/components/calendar/CalendarSelector";
const AspirantsAddaPromo = dynamic(() => import("@/components/home/AspirantsAddaPromo"));
const AdSensePlaceholder = dynamic(() => import("@/components/ads/AdSensePlaceholder"));
const EmailAlertBanner = dynamic(() => import("@/components/home/EmailAlertBanner"));
import HomeSeoSection from "@/components/home/HomeSeoSection";
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
    <div className="flex-1 bg-gray-50 dark:bg-[#000000]">
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

      {/* Featured e-Suvidha Services */}
      <FeaturedServices />

      {/* Main Content - Job Listings (Wrapped in Suspense for Shimmer Effect) */}
      <Suspense fallback={<MainContentSkeleton />}>
        <MainContent />
      </Suspense>

      {/* Browse by State Section */}
      <StateJobsSection />

      {/* Printable Monthly Wall Calendar & Tracker Widget */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <CalendarSelector />
      </div>

      {/* Bottom Banner Ad */}
      <div className="max-w-7xl mx-auto px-4 mb-8">
        <AdSensePlaceholder format="responsive" />
      </div>

      {/* Aspirants Adda Live Chat Promotion Banner */}
      <AspirantsAddaPromo />

      {/* Trust Building Signals (Stats + Reviews) */}
      <TrustSignals />

      {/* 📧 Email Alert Capture Banner — shown between trust signals and SEO block */}
      <EmailAlertBanner />

      {/* Premium UI SEO & FAQ Section */}
      <HomeSeoSection />
    </div>
  );
}
