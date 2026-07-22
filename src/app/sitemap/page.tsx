import Link from "next/link";
import { ArrowLeft, Map, Briefcase, Globe, Wrench, Shield, Compass, Sparkles } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "HTML Sitemap — Rojgar Suvidha | All Pages & Services Directory",
  description: "Browse all pages, categories, state job updates, e-Suvidha digital services, tools and legal information on Rojgar Suvidha.",
};

const sitemapData = [
  {
    title: "🏛️ Main Portals & Job Sections",
    icon: Briefcase,
    color: "from-indigo-600 to-violet-700",
    links: [
      { label: "Home Page", href: "/" },
      { label: "Latest Sarkari Jobs 2026", href: "/latest-jobs" },
      { label: "Sarkari Exam Results", href: "/results" },
      { label: "Admit Card Download", href: "/admit-card" },
      { label: "Official Answer Keys", href: "/answer-key" },
      { label: "University & College Admissions", href: "/admission" },
      { label: "Govt Job News & Updates", href: "/news" },
      { label: "Apply For Me (Form Filling Service)", href: "/apply-for-me" },
      { label: "Track Application Status", href: "/track-application" },
    ],
  },
  {
    title: "💼 Jobs by Category & Sector",
    icon: Compass,
    color: "from-blue-600 to-cyan-700",
    links: [
      { label: "SSC Recruitment 2026 (CGL, CHSL, MTS, GD)", href: "/jobs/ssc" },
      { label: "Railway Jobs 2026 (NTPC, Group D, ALP, JE)", href: "/jobs/railway" },
      { label: "Banking Jobs (IBPS, SBI, RBI)", href: "/jobs/banking" },
      { label: "UPSC Examinations (IAS, IPS, NDA, CDS)", href: "/jobs/upsc" },
      { label: "Police Recruitment (UP, Bihar, MP)", href: "/jobs/police" },
      { label: "Defence Forces (Army, Navy, Air Force)", href: "/jobs/defence" },
      { label: "Teaching Jobs (CTET, KVS, NVS)", href: "/jobs/teaching" },
      { label: "State PSC Services (BPSC, UPPSC, RPSC)", href: "/jobs/state-psc" },
    ],
  },
  {
    title: "🗺️ Jobs by State (Rajya War Jobs)",
    icon: Globe,
    color: "from-emerald-600 to-teal-700",
    links: [
      { label: "Uttar Pradesh Govt Jobs (UP)", href: "/state/uttar-pradesh" },
      { label: "Bihar Govt Jobs (Bihar)", href: "/state/bihar" },
      { label: "Delhi Govt Jobs (Delhi)", href: "/state/delhi" },
      { label: "Rajasthan Govt Jobs (RJ)", href: "/state/rajasthan" },
      { label: "Madhya Pradesh Govt Jobs (MP)", href: "/state/madhya-pradesh" },
      { label: "Maharashtra Govt Jobs (MH)", href: "/state/maharashtra" },
      { label: "Haryana Govt Jobs (HR)", href: "/state/haryana" },
      { label: "West Bengal Govt Jobs (WB)", href: "/state/west-bengal" },
      { label: "Jharkhand Govt Jobs (JH)", href: "/state/jharkhand" },
    ],
  },
  {
    title: "🖥️ e-Suvidha Digital Services",
    icon: Sparkles,
    color: "from-orange-600 to-amber-700",
    links: [
      { label: "e-Suvidha Main Hub", href: "/e-suvidha" },
      { label: "Apply New PAN Card", href: "/e-suvidha/apply/pan-new" },
      { label: "PAN Card Correction", href: "/e-suvidha/apply/pan-correction" },
      { label: "Apply New Voter ID", href: "/e-suvidha/apply/voter-new" },
      { label: "Order Aadhaar PVC Card", href: "/e-suvidha/apply/aadhaar-pvc" },
      { label: "Income Certificate (Aay)", href: "/e-suvidha/apply/income-cert" },
      { label: "Caste Certificate (Jati)", href: "/e-suvidha/apply/caste-cert" },
      { label: "Domicile Certificate (Niwas)", href: "/e-suvidha/apply/domicile-cert" },
      { label: "Police Clearance Certificate (PCC)", href: "/e-suvidha/apply/pcc" },
      { label: "ITR Filing (Nil Return)", href: "/e-suvidha/apply/itr-nil" },
      { label: "Udyam Aadhaar (MSME)", href: "/e-suvidha/apply/udyam" },
      { label: "Passport Appointment Apply", href: "/e-suvidha/apply/passport" },
    ],
  },
  {
    title: "🛠️ Tools & Candidate Features",
    icon: Wrench,
    color: "from-fuchsia-600 to-pink-700",
    links: [
      { label: "Professional Resume Builder", href: "/resume-builder" },
      { label: "Digital Document Locker", href: "/dashboard/locker" },
      { label: "Printable Monthly Exam Calendar", href: "/exam-calendar" },
      { label: "Candidate Dashboard", href: "/dashboard" },
      { label: "Study Hall / Aspirants Adda", href: "/dashboard/study/hall" },
      { label: "Service Pricing List", href: "/pricing" },
    ],
  },
  {
    title: "📜 Company & Support Information",
    icon: Shield,
    color: "from-slate-700 to-zinc-900",
    links: [
      { label: "About Rojgar Suvidha", href: "/about" },
      { label: "Contact Us", href: "/contact-us" },
      { label: "Help & Support (Complaints)", href: "/complaint" },
      { label: "HR / Recruiter Login Portal", href: "/employer/login" },
      { label: "Privacy Policy", href: "/privacy" },
      { label: "Terms of Service", href: "/terms" },
      { label: "Refund & Cancellation Policy", href: "/refund-policy" },
    ],
  },
];

export default function VisualSitemapPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-8 sm:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Navigation Back */}
        <Link 
          href="/" 
          className="inline-flex items-center gap-2 text-xs font-extrabold text-gray-500 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400 mb-6 transition-colors uppercase tracking-wider"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </Link>

        {/* Header */}
        <div className="bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-800 rounded-3xl p-6 sm:p-8 mb-8 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 rounded-2xl text-indigo-600 dark:text-indigo-400">
              <Map className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest block">User Directory</span>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
                Rojgar Suvidha Visual HTML Sitemap
              </h1>
            </div>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 max-w-3xl leading-relaxed">
            Welcome to the complete directory of Rojgar Suvidha. Find quick links to all government job updates, sector-wise vacancies, state-level recruitment, digital e-Suvidha services, candidate tools, and legal policies.
          </p>
        </div>

        {/* Directory Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sitemapData.map((section) => (
            <div 
              key={section.title}
              className="bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-800 rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col"
            >
              <div className={`bg-gradient-to-r ${section.color} px-5 py-4 text-white flex items-center gap-2.5`}>
                <section.icon className="w-5 h-5 shrink-0" />
                <h2 className="font-extrabold text-sm tracking-tight">{section.title}</h2>
              </div>

              <div className="p-5 flex-1">
                <ul className="space-y-2.5">
                  {section.links.map((link) => (
                    <li key={link.href}>
                      <Link 
                        href={link.href}
                        className="text-xs font-semibold text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors flex items-center gap-2 group"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 group-hover:scale-125 transition-transform shrink-0"></span>
                        <span className="truncate">{link.label}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>

        {/* Search & Support CTA */}
        <div className="mt-10 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-150 dark:border-indigo-900/50 rounded-3xl p-6 text-center">
          <h3 className="text-base font-extrabold text-gray-900 dark:text-white mb-1">Didn't find what you were looking for?</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">Use our smart search or contact our 24/7 candidate support team.</p>
          <div className="flex justify-center gap-3 flex-wrap">
            <Link 
              href="/" 
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-xl transition-all shadow-sm active:scale-95"
            >
              Search Jobs
            </Link>
            <Link 
              href="/contact-us" 
              className="px-5 py-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-800 dark:text-gray-200 text-xs font-bold rounded-xl transition-all hover:bg-gray-100 dark:hover:bg-gray-800 active:scale-95"
            >
              Contact Support
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}
