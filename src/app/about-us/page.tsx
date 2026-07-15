import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import {
  Target, Users, Zap, Shield, Heart, Star, ArrowRight,
  CheckCircle2, Briefcase, FileText, Phone
} from "lucide-react";

const BASE_URL = "https://www.rojgarsuvidha.com";

export const metadata: Metadata = {
  title: "About Us | Rojgar Suvidha — India's Trusted Sarkari Naukri Portal",
  description:
    "Learn about Rojgar Suvidha — India's trusted government job portal built to help every Indian aspirant access accurate, fast sarkari naukri updates and Apply For Me service.",
  keywords: [
    "about rojgar suvidha", "sarkari naukri portal", "government job website india",
    "rojgar suvidha mission", "apply for me service", "trusted job portal india",
  ],
  openGraph: {
    title: "About Rojgar Suvidha | India's Trusted Sarkari Naukri Portal",
    description:
      "Built for every Indian aspirant — accurate government job updates, results, admit cards, and expert form-filling service.",
    url: `${BASE_URL}/about-us`,
    siteName: "Rojgar Suvidha",
    type: "website",
    images: [{ url: `${BASE_URL}/og-image.png`, width: 1200, height: 630 }],
  },
  alternates: { canonical: `${BASE_URL}/about-us` },
};

const stats = [
  { value: "1 Lakh+", label: "Registered Users", icon: Users },
  { value: "10,000+", label: "Jobs Listed", icon: Briefcase },
  { value: "500+", label: "Successful Applications", icon: FileText },
  { value: "4.8★", label: "Average Rating", icon: Star },
];

const differentiators = [
  {
    icon: Zap,
    color: "text-amber-500",
    bg: "bg-amber-50 dark:bg-amber-900/20",
    title: "Real-Time Updates",
    desc: "SSC, UPSC, Railway, Bank — every notification posted within minutes of official release. No delays, no misinformation.",
  },
  {
    icon: Shield,
    color: "text-indigo-500",
    bg: "bg-indigo-50 dark:bg-indigo-900/20",
    title: "100% Verified Information",
    desc: "Every job post is cross-verified with official government portals before publishing. We never share unverified or misleading data.",
  },
  {
    icon: Heart,
    color: "text-rose-500",
    bg: "bg-rose-50 dark:bg-rose-900/20",
    title: "Apply For Me Service",
    desc: "Can't fill a complex government form? Our expert team fills it for you — correctly, completely, and on time — for just ₹50.",
  },
  {
    icon: Target,
    color: "text-emerald-500",
    bg: "bg-emerald-50 dark:bg-emerald-900/20",
    title: "Built for Every Aspirant",
    desc: "From 10th pass MTS to UPSC Civil Services — we cover opportunities for every educational background, in every state.",
  },
];

const timeline = [
  { year: "2024", event: "Rojgar Suvidha is founded by Pintu Kumar in Noida, UP with a simple goal: make sarkari naukri updates accessible to everyone." },
  { year: "2024", event: "\"Apply For Me\" service launched — helping candidates with zero technical skills submit government forms error-free." },
  { year: "2025", event: "e-Suvidha portal launched — a one-stop service for PAN card, Voter ID, Aadhaar PVC, ITR filing, and 15+ government services." },
  { year: "2025", event: "Crossed 1 Lakh+ registered users. Private Jobs portal added for fresher and experienced candidates." },
];

export default function AboutUsPage() {
  return (
    <div className="flex-1 bg-gray-50 dark:bg-gray-950">

      {/* ── Hero Section ── */}
      <div className="bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-700 text-white py-20 px-4">
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-4 py-1.5 text-sm font-semibold mb-6 border border-white/20">
            <Heart className="w-4 h-4 text-rose-300" />
            <span>Made in India, for India</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-black mb-6 leading-tight">
            We Are <span className="text-amber-300">Rojgar Suvidha</span>
          </h1>
          <p className="text-xl text-indigo-100 max-w-2xl mx-auto leading-relaxed">
            India&apos;s most trusted portal for Sarkari Naukri — built by an aspirant, for aspirants.
            We believe every Indian deserves fast, accurate, and free access to government job opportunities.
          </p>
        </div>
      </div>

      {/* ── Stats Bar ── */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 py-8 px-4">
        <div className="max-w-5xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-6">
          {stats.map(({ value, label, icon: Icon }) => (
            <div key={label} className="text-center">
              <Icon className="w-6 h-6 text-indigo-500 mx-auto mb-2" />
              <div className="text-3xl font-black text-gray-900 dark:text-white">{value}</div>
              <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">{label}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-16 space-y-20">

        {/* ── Our Story ── */}
        <section>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <p className="text-indigo-600 dark:text-indigo-400 font-bold text-sm uppercase tracking-widest mb-3">Our Story</p>
              <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-6 leading-tight">
                Started with a Problem Every Aspirant Faces
              </h2>
              <div className="space-y-4 text-gray-600 dark:text-gray-300 leading-relaxed">
                <p>
                  <strong className="text-gray-900 dark:text-white">Pintu Kumar</strong>, the founder of Rojgar Suvidha, grew up watching talented people miss out on government job opportunities — not because they weren&apos;t qualified, but because they couldn&apos;t access the right information in time, or made costly mistakes filling complex application forms.
                </p>
                <p>
                  In 2024, he built Rojgar Suvidha from scratch in Noida, UP — a platform with one clear mission: <strong className="text-gray-900 dark:text-white">make sarkari naukri accessible to every Indian, regardless of their location, income, or technical skills.</strong>
                </p>
                <p>
                  Today, Rojgar Suvidha serves over a lakh users across India — from Bihar to Maharashtra, from Rajasthan to West Bengal — helping them find jobs, track results, and get their forms filled by experts.
                </p>
              </div>
            </div>
            {/* Founder Card */}
            <div className="flex justify-center">
              <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-800 overflow-hidden max-w-xs w-full">
                <div className="relative w-full aspect-[3/4]">
                  <Image
                    src="/founder.jpg"
                    alt="Pintu Kumar — Founder of Rojgar Suvidha"
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 320px"
                  />
                </div>
                <div className="p-5">
                  <p className="font-extrabold text-gray-900 dark:text-white text-lg">Pintu Kumar</p>
                  <p className="text-indigo-600 dark:text-indigo-400 text-sm font-semibold">Founder & CEO, Rojgar Suvidha</p>
                  <p className="text-gray-500 dark:text-gray-400 text-xs mt-2">Sector 62, Noida, Uttar Pradesh</p>
                  <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800 flex items-center gap-2 text-xs text-gray-500">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    <span>Verified Business Owner</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Mission & Vision ── */}
        <section className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="bg-indigo-600 text-white rounded-3xl p-8">
            <Target className="w-10 h-10 mb-4 text-indigo-200" />
            <h3 className="text-xl font-black mb-3">Our Mission</h3>
            <p className="text-indigo-100 leading-relaxed">
              To bridge the gap between India&apos;s government job seekers and opportunities — by delivering fast, verified, and free job notifications alongside expert application support for every aspirant in the country.
            </p>
          </div>
          <div className="bg-violet-600 text-white rounded-3xl p-8">
            <Star className="w-10 h-10 mb-4 text-violet-200" />
            <h3 className="text-xl font-black mb-3">Our Vision</h3>
            <p className="text-violet-100 leading-relaxed">
              A future where no deserving candidate misses a sarkari job opportunity due to lack of awareness, poor internet access, or fear of making form-filling mistakes. Rojgar Suvidha for every Indian.
            </p>
          </div>
        </section>

        {/* ── Why Different ── */}
        <section>
          <div className="text-center mb-10">
            <p className="text-indigo-600 dark:text-indigo-400 font-bold text-sm uppercase tracking-widest mb-2">Why Choose Us</p>
            <h2 className="text-3xl font-black text-gray-900 dark:text-white">What Makes Rojgar Suvidha Different</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {differentiators.map(({ icon: Icon, color, bg, title, desc }) => (
              <div key={title} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6 shadow-sm flex gap-5">
                <div className={`${bg} p-3 rounded-xl h-fit shrink-0`}>
                  <Icon className={`w-6 h-6 ${color}`} />
                </div>
                <div>
                  <h3 className="font-extrabold text-gray-900 dark:text-white mb-2">{title}</h3>
                  <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Our Journey ── */}
        <section>
          <div className="text-center mb-10">
            <p className="text-indigo-600 dark:text-indigo-400 font-bold text-sm uppercase tracking-widest mb-2">Our Journey</p>
            <h2 className="text-3xl font-black text-gray-900 dark:text-white">How We Got Here</h2>
          </div>
          <div className="relative">
            <div className="absolute left-6 top-0 bottom-0 w-px bg-indigo-100 dark:bg-indigo-900 hidden sm:block" />
            <div className="space-y-6">
              {timeline.map(({ year, event }, i) => (
                <div key={i} className="flex gap-6 items-start">
                  <div className="shrink-0 w-12 h-12 bg-indigo-600 text-white rounded-xl flex items-center justify-center font-black text-xs z-10">
                    {year}
                  </div>
                  <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4 flex-1 shadow-sm">
                    <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">{event}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Legal Info ── */}
        <section className="bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900 rounded-2xl p-6">
          <h3 className="font-bold text-blue-800 dark:text-blue-300 text-sm uppercase tracking-wider mb-3">
            Legal & Business Information
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-blue-900 dark:text-blue-200">
            <div className="space-y-1">
              <p><strong>Legal Name:</strong> PINTU KUMAR</p>
              <p><strong>Business:</strong> Rojgar Suvidha</p>
              <p><strong>Type:</strong> Sole Proprietorship</p>
            </div>
            <div className="space-y-1">
              <p><strong>Address:</strong> Sector 62, Noida, UP – 201309</p>
              <p><strong>Email:</strong> support@rojgarsuvidha.com</p>
              <p><strong>Phone:</strong> +91 88774 34088</p>
            </div>
          </div>
        </section>

        {/* ── CTA ── */}
        <section className="text-center py-10 bg-gradient-to-br from-indigo-50 to-violet-50 dark:from-indigo-950/30 dark:to-violet-950/30 rounded-3xl border border-indigo-100 dark:border-indigo-900 px-6">
          <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-4">
            Ready to Find Your Dream Government Job?
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-lg mx-auto">
            Join over a lakh aspirants who trust Rojgar Suvidha for accurate, daily sarkari naukri updates.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/latest-jobs"
              className="inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 px-8 rounded-2xl transition-all shadow-lg shadow-indigo-600/20"
            >
              <Briefcase className="w-5 h-5" />
              Browse Latest Jobs
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/apply-for-me"
              className="inline-flex items-center justify-center gap-2 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 text-indigo-600 dark:text-indigo-400 font-bold py-4 px-8 rounded-2xl transition-all border border-indigo-200 dark:border-indigo-800 shadow-sm"
            >
              <FileText className="w-5 h-5" />
              Apply For Me — ₹50
            </Link>
            <Link
              href="/contact-us"
              className="inline-flex items-center justify-center gap-2 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 font-bold py-4 px-8 rounded-2xl transition-all border border-gray-200 dark:border-gray-700 shadow-sm"
            >
              <Phone className="w-5 h-5" />
              Contact Us
            </Link>
          </div>
        </section>

      </div>
    </div>
  );
}
