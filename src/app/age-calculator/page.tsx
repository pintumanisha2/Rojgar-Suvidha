import type { Metadata } from "next";
import Link from "next/link";
import AgeCalculator from "@/components/ui/AgeCalculator";
import { ArrowLeft, Calendar, CheckCircle2, ShieldCheck, Sparkles, HelpCircle, Briefcase } from "lucide-react";

const BASE_URL = "https://www.rojgarsuvidha.com";

export const metadata: Metadata = {
  title: "Age Calculator for Government Jobs 2026 — Check Eligibility | Rojgar Suvidha",
  description:
    "Free online Age Calculator for Sarkari Naukri 2026. Calculate your exact age in years, months, and days as on notification cutoff date. Check age relaxation rules for OBC, SC/ST, PwD & Ex-Servicemen.",
  keywords: [
    "age calculator for government job",
    "sarkari naukri age limit calculator",
    "ssc cgl age calculator",
    "upsc age calculator 2026",
    "railway job age limit calculator",
    "age calculator online hindi"
  ],
  alternates: { canonical: `${BASE_URL}/age-calculator` },
  openGraph: {
    title: "Age Calculator for Government Jobs 2026 — Rojgar Suvidha",
    description: "Calculate your exact age for SSC, UPSC, Railway, Police & State PSC jobs. Instant eligibility check with category age relaxation table.",
    url: `${BASE_URL}/age-calculator`,
    type: "website",
    images: [{ url: `${BASE_URL}/og-image.png`, width: 1200, height: 630, alt: "Age Calculator Rojgar Suvidha" }]
  }
};

// JSON-LD Schema for Age Calculator Page
const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "Sarkari Naukri mein age cutoff date kaise calculate hoti hai?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Government job notifications mein ek specific cutoff date hoti hai (jaise 01 August 2026 ya 01 January 2026). Aapko apni Date of Birth se us cutoff date tak ki age Calculate karni hoti hai."
      }
    },
    {
      "@type": "Question",
      name: "OBC category ko kitne saal ki age relaxation milti hai?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "OBC (Non-Creamy Layer) candidates ko lagbhag sabhi Central Govt & State Govt exams mein 3 saal (3 Years) ki upper age limit relaxation milti hai."
      }
    },
    {
      "@type": "Question",
      name: "SC / ST category candidates ko kitni age relaxation milti hai?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "SC aur ST category candidates ko sabhi Sarkari Naukri notifications mein 5 saal (5 Years) ki upper age relaxation praapt hoti hai."
      }
    },
    {
      "@type": "Question",
      name: "PwD (Person with Disability) candidates ko kitni age relaxation milti hai?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "PwD General ko 10 saal, PwD OBC ko 13 saal, aur PwD SC/ST candidates ko 15 saal tak ki upper age relaxation milti hai."
      }
    }
  ]
};

export default function AgeCalculatorPage() {
  return (
    <main className="min-h-screen bg-slate-50 dark:bg-zinc-950 py-8 px-4 sm:px-6 lg:px-8">
      {/* Schema injection */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      <div className="max-w-4xl mx-auto space-y-8">
        {/* Navigation Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs font-semibold text-gray-500 dark:text-gray-400">
          <Link href="/" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors flex items-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5" /> Home
          </Link>
          <span>/</span>
          <span className="text-gray-900 dark:text-gray-200">Age Calculator</span>
        </nav>

        {/* Page Hero Header */}
        <header className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-blue-900 rounded-3xl p-6 sm:p-10 text-white shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
          <div className="relative z-10 space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-indigo-200 text-xs font-bold backdrop-blur-md">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Free Sarkari Eligibility Tool
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
              Sarkari Naukri Age Calculator 2026
            </h1>
            <p className="text-sm sm:text-base text-indigo-100/90 max-w-2xl font-normal leading-relaxed">
              Calculate your exact age in years, months, and days as per official government job notification cutoff dates. Verify your category eligibility instantly.
            </p>
          </div>
        </header>

        {/* Interactive Age Calculator Component */}
        <section className="bg-white dark:bg-zinc-900 rounded-2xl p-6 shadow-md border border-gray-150 dark:border-zinc-800">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            Calculate Your Age Online
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-6">
            Enter your Date of Birth and the cutoff date mentioned in the recruitment notification (e.g. 01/08/2026).
          </p>

          <AgeCalculator defaultOpen={true} />
        </section>

        {/* Standard Category Age Relaxation Table */}
        <section className="bg-white dark:bg-zinc-900 rounded-2xl p-6 shadow-md border border-gray-150 dark:border-zinc-800 space-y-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            Government Job Category Age Relaxation Rules
          </h2>
          <p className="text-xs text-gray-600 dark:text-gray-400">
            Standard upper age limit relaxation permitted across SSC, Railway, UPSC, Banking, and State PSC notifications:
          </p>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-700 dark:text-gray-300 border-collapse">
              <thead>
                <tr className="bg-gray-100 dark:bg-zinc-800/80 text-gray-900 dark:text-white font-bold text-xs uppercase border-b border-gray-200 dark:border-zinc-700">
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Age Relaxation</th>
                  <th className="py-3 px-4">Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-zinc-800 text-xs">
                <tr className="hover:bg-slate-50 dark:hover:bg-zinc-800/40">
                  <td className="py-3 px-4 font-bold text-gray-900 dark:text-white">UR / General / EWS</td>
                  <td className="py-3 px-4 text-gray-600 dark:text-gray-400">No Relaxation</td>
                  <td className="py-3 px-4 text-gray-500">As per standard notification age limit</td>
                </tr>
                <tr className="hover:bg-slate-50 dark:hover:bg-zinc-800/40">
                  <td className="py-3 px-4 font-bold text-emerald-700 dark:text-emerald-400">OBC (Non-Creamy Layer)</td>
                  <td className="py-3 px-4 font-bold text-emerald-600 dark:text-emerald-400">+3 Years</td>
                  <td className="py-3 px-4 text-gray-500">Valid NCL certificate required</td>
                </tr>
                <tr className="hover:bg-slate-50 dark:hover:bg-zinc-800/40">
                  <td className="py-3 px-4 font-bold text-indigo-700 dark:text-indigo-400">SC / ST Candidates</td>
                  <td className="py-3 px-4 font-bold text-indigo-600 dark:text-indigo-400">+5 Years</td>
                  <td className="py-3 px-4 text-gray-500">Caste certificate mandatory</td>
                </tr>
                <tr className="hover:bg-slate-50 dark:hover:bg-zinc-800/40">
                  <td className="py-3 px-4 font-bold text-purple-700 dark:text-purple-400">PwD (Unreserved)</td>
                  <td className="py-3 px-4 font-bold text-purple-600 dark:text-purple-400">+10 Years</td>
                  <td className="py-3 px-4 text-gray-500">40%+ Disability certificate required</td>
                </tr>
                <tr className="hover:bg-slate-50 dark:hover:bg-zinc-800/40">
                  <td className="py-3 px-4 font-bold text-purple-700 dark:text-purple-400">PwD + OBC</td>
                  <td className="py-3 px-4 font-bold text-purple-600 dark:text-purple-400">+13 Years</td>
                  <td className="py-3 px-4 text-gray-500">Cumulative relaxation</td>
                </tr>
                <tr className="hover:bg-slate-50 dark:hover:bg-zinc-800/40">
                  <td className="py-3 px-4 font-bold text-purple-700 dark:text-purple-400">PwD + SC / ST</td>
                  <td className="py-3 px-4 font-bold text-purple-600 dark:text-purple-400">+15 Years</td>
                  <td className="py-3 px-4 text-gray-500">Cumulative relaxation</td>
                </tr>
                <tr className="hover:bg-slate-50 dark:hover:bg-zinc-800/40">
                  <td className="py-3 px-4 font-bold text-amber-700 dark:text-amber-400">Ex-Servicemen (ESM)</td>
                  <td className="py-3 px-4 font-bold text-amber-600 dark:text-amber-400">Service + 3 Years</td>
                  <td className="py-3 px-4 text-gray-500">Deduct military service rendered</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Frequently Asked Questions (FAQs) */}
        <section className="bg-white dark:bg-zinc-900 rounded-2xl p-6 shadow-md border border-gray-150 dark:border-zinc-800 space-y-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            Frequently Asked Questions (FAQs)
          </h2>

          <div className="space-y-3 text-sm">
            <div className="p-4 bg-slate-50 dark:bg-zinc-800/50 rounded-xl space-y-1">
              <h3 className="font-bold text-gray-900 dark:text-white">Q1: Cutoff date par exact age kaise nikalein?</h3>
              <p className="text-gray-600 dark:text-gray-300 text-xs leading-relaxed">
                Aap upar diye gaye Age Calculator mein apni Date of Birth (DOB) daalein aur second field mein notification mein di gayi cutoff date (jaise 01-08-2026) chunein. Tool aapki exact age saal, mahine aur dino mein calculate karke dikha dega.
              </p>
            </div>
            <div className="p-4 bg-slate-50 dark:bg-zinc-800/50 rounded-xl space-y-1">
              <h3 className="font-bold text-gray-900 dark:text-white">Q2: SSC CGL aur Railway exams mein age calculate kis date se hoti hai?</h3>
              <p className="text-gray-600 dark:text-gray-300 text-xs leading-relaxed">
                SSC aur Railway exams mein aamtaur par cutoff date saal ki shuruat (1st January) ya mid-year (1st August) hoti hai. Exact date hamesha official notification ke Important Dates section mein likhi rehti hai.
              </p>
            </div>
            <div className="p-4 bg-slate-50 dark:bg-zinc-800/50 rounded-xl space-y-1">
              <h3 className="font-bold text-gray-900 dark:text-white">Q3: Kya State PSC exams mein age relaxation alag hoti hai?</h3>
              <p className="text-gray-600 dark:text-gray-300 text-xs leading-relaxed">
                Haan, kuchh states (jaise UPPSC, BPSC, MPSC, Rajasthan) mein local domicile candidates aur female candidates ko additional age relaxation milti hai (jaise up to 40 years). Always official PDF notification check karein.
              </p>
            </div>
          </div>
        </section>

        {/* Quick Links CTA */}
        <section className="bg-indigo-50 dark:bg-indigo-950/40 rounded-2xl p-6 border border-indigo-100 dark:border-indigo-900/50 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="font-bold text-gray-900 dark:text-white text-base">Check Latest Government Jobs 2026</h3>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              Now that you know your age eligibility, explore active Sarkari Naukri notifications.
            </p>
          </div>
          <Link
            href="/latest-jobs"
            className="shrink-0 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-5 py-3 rounded-xl transition-all shadow-md flex items-center gap-2"
          >
            <Briefcase className="w-4 h-4" /> Explore Jobs Now
          </Link>
        </section>
      </div>
    </main>
  );
}
