import type { Metadata } from "next";
import { Suspense } from "react";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import { PublicHeader, PublicFooter } from "@/components/layout/PublicUI";
import FloatingSocials from "@/components/layout/FloatingSocials";
import AIChatBot from "@/components/layout/AIChatBot";
import PushNotificationPrompt from "@/components/layout/PushNotificationPrompt";
import BottomNav from "@/components/layout/BottomNav";
import TopLoader from "@/components/layout/TopLoader";
import AnalyticsTracker from "@/components/layout/AnalyticsTracker";

const BASE_URL = "https://www.rojgarsuvidha.com";

// ══════════════════════════════════════════════════════════
// 🔥 NUCLEAR-GRADE SEO + AEO + GEO METADATA
// ══════════════════════════════════════════════════════════
export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: "Rojgar Suvidha – Sarkari Naukri, Govt Jobs, Results, Admit Card 2025-2026",
    template: "%s | Rojgar Suvidha – India's #1 Job Portal",
  },
  description:
    "Rojgar Suvidha is India's #1 trusted portal for Sarkari Naukri 2026, Government Jobs, Private Jobs, Exam Results, Admit Cards, Answer Keys & University Admissions. Get daily job alerts from SSC, UPSC, Railway, Banking, State PSC & Defence. Use our exclusive 'Apply For Me' service for error-free form filling.",
  keywords: [
    // Primary Hindi + English Intent Keywords
    "sarkari naukri", "sarkari naukri 2025", "sarkari naukri 2026",
    "government jobs", "govt jobs 2025", "govt jobs 2026", "latest govt jobs today",
    "sarkari result", "sarkari result 2025", "sarkari result 2026",
    "rojgar suvidha", "rojgar samachar",
    // Category Keywords
    "admit card download", "admit card 2025", "admit card 2026",
    "answer key 2025", "answer key 2026", "answer key download",
    "exam results 2025", "exam results 2026", "result check online",
    "university admission 2025", "university admission 2026",
    // Organization Keywords (High Volume)
    "SSC jobs 2025", "SSC CGL 2025", "SSC CGL 2026", "SSC CHSL 2026", "SSC MTS 2026", "SSC GD Constable",
    "UPSC Civil Services 2025", "UPSC Civil Services 2026", "UPSC NDA 2026", "UPSC CDS",
    "Railway jobs 2025", "Railway jobs 2026", "RRB NTPC", "RRB Group D", "RRB ALP",
    "Bank jobs 2025", "Bank jobs 2026", "IBPS PO 2025", "IBPS Clerk", "SBI PO", "RBI Grade B",
    "Defence jobs", "Indian Army", "Indian Navy", "Indian Air Force",
    "Police jobs 2025", "Police jobs 2026", "UP Police", "Bihar Police", "MP Police",
    // State Keywords
    "UP government jobs", "Bihar government jobs", "Rajasthan government jobs",
    "Madhya Pradesh govt jobs", "Maharashtra govt jobs",
    "state government jobs 2025", "state government jobs 2026",
    // Long-tail Keywords (AEO Optimized)
    "how to apply for government jobs online",
    "latest government job notification today",
    "sarkari naukri ki taiyari kaise karein",
    "government job form kaise bhare",
    "apply for me service government jobs",
    "10th pass sarkari naukri", "12th pass govt jobs",
    "graduate government jobs", "engineering govt jobs",
    // Private Job Keywords
    "private jobs india", "private company jobs 2025",
    "fresher jobs", "jobs near me",
    // Competitor Keywords
    "sarkariresult", "freejobalert", "employmentnews",
  ],
  authors: [{ name: "Rojgar Suvidha", url: BASE_URL }],
  creator: "Rojgar Suvidha",
  publisher: "Rojgar Suvidha",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: BASE_URL,
    siteName: "Rojgar Suvidha",
    title: "Rojgar Suvidha – Sarkari Naukri, Govt Jobs, Results & Admit Card 2026",
    description:
      "India's most trusted portal for Sarkari Naukri, Government Jobs, Admit Cards, Results & exclusive Apply For Me service. Daily updates from SSC, UPSC, Railway, Banking & State PSC.",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "Rojgar Suvidha – India's #1 Government Job Portal" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Rojgar Suvidha – Sarkari Naukri & Government Jobs 2025",
    description: "India's #1 trusted portal for Government & Private Jobs. SSC, UPSC, Railway, Banking – daily updates. Apply online now.",
    images: ["/og-image.png"],
    creator: "@rojgarsuvidha",
    site: "@rojgarsuvidha",
  },
  alternates: {
    canonical: BASE_URL,
    languages: {
      "en-IN": BASE_URL,
      "hi-IN": `${BASE_URL}?lang=hi`,
    },
  },
  icons: {
    icon: '/logo-blue.png',
    shortcut: '/logo-blue.png',
    apple: '/logo-blue.png',
  },
  verification: {
    // Add your verification codes here when ready
    // google: "your-google-verification-code",
    // yandex: "your-yandex-verification-code",
  },
  category: "Education",
  other: {
    // GEO Signals - Help AI engines understand the site
    "geo.region": "IN",
    "geo.placename": "India",
    "content-language": "en, hi",
    "revisit-after": "1 day",
    "rating": "General",
    "distribution": "Global",
    "coverage": "Worldwide",
  },
};

// ══════════════════════════════════════════════════════════
// 🏗️ JSON-LD STRUCTURED DATA (SEO + AEO + GEO)
// ══════════════════════════════════════════════════════════

// 1. Organization Schema - Tells Google/AI who we are
const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Rojgar Suvidha",
  alternateName: ["RojgarSuvidha", "Rojgar Suvidha India"],
  url: BASE_URL,
  logo: `${BASE_URL}/logo-blue.png`,
  description: "India's #1 trusted portal for Sarkari Naukri, Government Jobs, Admit Cards, Results & Apply For Me service.",
  foundingDate: "2024",
  sameAs: [
    "https://t.me/rojgarsuvidha",
    "https://youtube.com/@rojgarsuvidha",
    "https://whatsapp.com/channel/rojgarsuvidha",
  ],
  contactPoint: {
    "@type": "ContactPoint",
    contactType: "customer support",
    url: `${BASE_URL}/complaint`,
    availableLanguage: ["English", "Hindi"],
  },
  areaServed: {
    "@type": "Country",
    name: "India",
  },
};

// 2. WebSite Schema - Enables Sitelinks Search Box in Google
const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "Rojgar Suvidha",
  alternateName: "RojgarSuvidha",
  url: BASE_URL,
  description: "India's most trusted portal for Sarkari Naukri, Government Jobs, Results, Admit Cards & Answer Keys.",
  publisher: { "@type": "Organization", name: "Rojgar Suvidha" },
  potentialAction: {
    "@type": "SearchAction",
    target: {
      "@type": "EntryPoint",
      urlTemplate: `${BASE_URL}/latest-jobs?q={search_term_string}`,
    },
    "query-input": "required name=search_term_string",
  },
  inLanguage: ["en", "hi"],
};

// 3. BreadcrumbList Schema for home
const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    {
      "@type": "ListItem",
      position: 1,
      name: "Home",
      item: BASE_URL,
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className="h-full antialiased"
    >
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#4f46e5" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        
        {/* JSON-LD Structured Data for SEO + AEO + GEO */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
        />
        {/* Preconnect for performance (Core Web Vitals = SEO signal) */}
        <link rel="preconnect" href="https://dflnrfvngmquaqdtjjhh.supabase.co" />
        <link rel="dns-prefetch" href="https://dflnrfvngmquaqdtjjhh.supabase.co" />
      </head>
      <body className="min-h-full flex flex-col bg-gray-50 text-gray-900 dark:bg-gray-950 dark:text-gray-100 transition-colors duration-300">
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <Suspense fallback={null}>
            <TopLoader />
          </Suspense>
          <PublicHeader />
          <main className="flex-grow flex flex-col">
            {children}
          </main>
          <PublicFooter />
          <FloatingSocials />
          <AIChatBot />
          <PushNotificationPrompt />
          <BottomNav />
          <AnalyticsTracker />
          
          {/* Auto-update Service Worker to prevent caching issues for users */}
          <script
            dangerouslySetInnerHTML={{
              __html: `
                if ('serviceWorker' in navigator) {
                  window.addEventListener('load', function() {
                    navigator.serviceWorker.getRegistrations().then(function(registrations) {
                      for(let registration of registrations) {
                        registration.update();
                      }
                    });
                  });
                }
              `,
            }}
          />
        </ThemeProvider>
      </body>
    </html>
  );
}
