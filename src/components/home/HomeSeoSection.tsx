"use client";

import React, { useState } from "react";
import Link from "next/link";
import { 
  Sparkles, CheckCircle2, ShieldCheck, Zap, HelpCircle, 
  ChevronDown, Building2, Award, FileText
} from "lucide-react";

export default function HomeSeoSection() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const whyChooseUs = [
    {
      title: "Fastest Real-Time Updates",
      desc: "Whether it's a midnight SSC CGL result declaration or an early morning Railway recruitment PDF, our dedicated team updates notifications instantly so you never miss a deadline.",
      icon: Zap,
      color: "text-amber-500 bg-amber-500/10 border-amber-500/20",
    },
    {
      title: "Exclusive 'Apply For Me' Service",
      desc: "No access to a cyber cafe or worried about form rejection? Securely upload your documents and our expert team will accurately fill out your government application for just ₹49.",
      icon: Award,
      color: "text-indigo-500 bg-indigo-500/10 border-indigo-500/20",
    },
    {
      title: "Clean & 100% Ad-Free Experience",
      desc: "Unlike legacy portals cluttered with deceptive pop-ups and fake download buttons, we provide a clean, modern, mobile-optimized experience with direct official links.",
      icon: ShieldCheck,
      color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
    },
    {
      title: "Direct & Verified Official Links",
      desc: "Zero clickbait guaranteed. Every notification link redirects you straight to official government PDFs, official apply portals, or verified result scorecards.",
      icon: CheckCircle2,
      color: "text-blue-500 bg-blue-500/10 border-blue-500/20",
    },
  ];

  const faqs = [
    {
      q: "Is Rojgar Suvidha completely free to browse?",
      a: "Yes! Searching jobs, downloading official PDFs, and checking exam results on Rojgar Suvidha is 100% free forever. A nominal service charge of only ₹49 applies if you choose to use our expert 'Apply For Me' form filling service.",
    },
    {
      q: "How accurate are the Sarkari Naukri notifications posted here?",
      a: "We follow strict editorial verification standards. Every job, result, and admit card link is double-checked and verified directly against official government websites (like SSC, UPSC, RRB, IBPS) and official Employment News releases.",
    },
    {
      q: "What is the 'Apply For Me' feature and how does it work?",
      a: "Apply For Me is our hassle-free digital form-filling assistance service. You select your target job, upload required photos and documents, and our certified form specialists fill out the official portal on your behalf for ₹49 facilitation fee.",
    },
    {
      q: "How can I receive daily instant job alerts on my mobile?",
      a: "You can subscribe to our daily push notifications, or join our official WhatsApp and Telegram channels for instant alerts right on your phone.",
    },
  ];

  return (
    <section className="bg-gradient-to-b from-gray-50 via-white to-gray-50 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950 border-t border-gray-200 dark:border-zinc-800/80 py-12 md:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        
        {/* Header Badge & Title */}
        <div className="text-center max-w-3xl mx-auto mb-10 md:mb-14">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-950/70 border border-indigo-200 dark:border-indigo-800/60 text-indigo-700 dark:text-indigo-300 text-xs font-semibold uppercase tracking-wider mb-4">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 animate-pulse" />
            India's Most Trusted Sarkari Job Platform
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight leading-tight">
            Welcome to <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600 dark:from-indigo-400 dark:to-violet-400">Rojgar Suvidha</span> 2026
          </h2>
          <p className="mt-3 text-sm sm:text-base text-gray-600 dark:text-gray-400 leading-relaxed">
            Finding accurate and timely information about <strong className="text-gray-900 dark:text-gray-200">Government Jobs (Sarkari Naukri)</strong> shouldn't be stressful. We bring you verified notifications, admit cards, results, and expert form assistance under one roof with zero clutter.
          </p>
        </div>

        {/* Why Choose Us — 4 Grid Cards */}
        <div className="mb-14">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 text-center sm:text-left flex items-center gap-2">
            <Building2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            Why Millions of Aspirants Trust Rojgar Suvidha
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            {whyChooseUs.map((item, index) => {
              const IconComp = item.icon;
              return (
                <div 
                  key={index}
                  className="bg-white dark:bg-zinc-900/90 border border-gray-200/80 dark:border-zinc-800 p-5 sm:p-6 rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 flex items-start gap-4"
                >
                  <div className={`p-3 rounded-xl border shrink-0 ${item.color}`}>
                    <IconComp className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 dark:text-white text-base mb-1.5">
                      {item.title}
                    </h4>
                    <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Category Spotlight Grid */}
        <div className="mb-14">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            Major Portals & Categories
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-indigo-500/5 to-indigo-500/10 dark:from-indigo-950/40 dark:to-indigo-900/20 border border-indigo-200/60 dark:border-indigo-800/40 p-5 rounded-2xl">
              <div className="w-9 h-9 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-sm mb-3">01</div>
              <h4 className="font-bold text-indigo-950 dark:text-indigo-200 text-base mb-1">Latest Jobs</h4>
              <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">Daily alerts for SSC, Railway, Banking, UPSC, Defence & State PSC recruitment.</p>
            </div>
            <div className="bg-gradient-to-br from-emerald-500/5 to-emerald-500/10 dark:from-emerald-950/40 dark:to-emerald-900/20 border border-emerald-200/60 dark:border-emerald-800/40 p-5 rounded-2xl">
              <div className="w-9 h-9 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-sm mb-3">02</div>
              <h4 className="font-bold text-emerald-950 dark:text-emerald-200 text-base mb-1">Exam Results</h4>
              <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">Fastest direct merit list PDFs and login portal links to check scorecards without server lag.</p>
            </div>
            <div className="bg-gradient-to-br from-amber-500/5 to-amber-500/10 dark:from-amber-950/40 dark:to-amber-900/20 border border-amber-200/60 dark:border-amber-800/40 p-5 rounded-2xl">
              <div className="w-9 h-9 rounded-lg bg-amber-600 text-white flex items-center justify-center font-bold text-sm mb-3">03</div>
              <h4 className="font-bold text-amber-950 dark:text-amber-200 text-base mb-1">Admit Cards</h4>
              <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">Region-wise hall ticket download links released 1-2 weeks before the official exam date.</p>
            </div>
            <div className="bg-gradient-to-br from-purple-500/5 to-purple-500/10 dark:from-purple-950/40 dark:to-purple-900/20 border border-purple-200/60 dark:border-purple-800/40 p-5 rounded-2xl">
              <div className="w-9 h-9 rounded-lg bg-purple-600 text-white flex items-center justify-center font-bold text-sm mb-3">04</div>
              <h4 className="font-bold text-purple-950 dark:text-purple-200 text-base mb-1">Answer Keys</h4>
              <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">Official provisional & final answer key PDFs to calculate raw marks right after exams.</p>
            </div>
          </div>
        </div>

        {/* FAQ Accordion Section */}
        <div className="mb-12">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            Frequently Asked Questions (FAQs)
          </h3>
          <div className="space-y-3">
            {faqs.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div 
                  key={idx}
                  className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl overflow-hidden transition-all duration-200"
                >
                  <button
                    onClick={() => toggleFaq(idx)}
                    className="w-full px-5 py-4 text-left flex items-center justify-between gap-4 font-semibold text-gray-900 dark:text-white text-sm sm:text-base hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-colors"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 shrink-0 ${isOpen ? "rotate-180 text-indigo-600 dark:text-indigo-400" : ""}`} />
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-4 pt-1 text-xs sm:text-sm text-gray-600 dark:text-gray-400 leading-relaxed border-t border-gray-100 dark:border-zinc-800/60 bg-gray-50/50 dark:bg-zinc-950/40">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Legal & Disclaimers Footer Bar */}
        <div className="pt-8 border-t border-gray-200 dark:border-zinc-800 text-xs text-gray-500 dark:text-gray-500 space-y-3 leading-relaxed">
          <p>
            <strong className="text-gray-700 dark:text-gray-400">Disclaimer:</strong> Rojgar Suvidha is an independent educational news and candidate facilitation portal. We are NOT affiliated with any government organization or government body. We curate publicly accessible information from official government notifications to assist students.
          </p>
          <p>
            <strong className="text-gray-700 dark:text-gray-400">Legal Info:</strong> Rojgar Suvidha is owned and operated by <strong>PINTU KUMAR</strong> (Sole Proprietor). Registered Office: Sector 62, Noida, Uttar Pradesh – 201309. Support Email: <a href="mailto:support@rojgarsuvidha.com" className="text-indigo-600 dark:text-indigo-400 font-medium hover:underline">support@rojgarsuvidha.com</a> | Helpline: <a href="tel:+918877434088" className="text-indigo-600 dark:text-indigo-400 font-medium hover:underline">+91 88774 34088</a>. Apply For Me Service Charge: ₹49 per form. Quick Links: <Link href="/refund-policy" className="text-indigo-600 dark:text-indigo-400 hover:underline">Refund Policy</Link> | <Link href="/terms" className="text-indigo-600 dark:text-indigo-400 hover:underline">Terms of Service</Link> | <Link href="/privacy" className="text-indigo-600 dark:text-indigo-400 hover:underline">Privacy Policy</Link> | <Link href="/sitemap" className="text-indigo-600 dark:text-indigo-400 hover:underline">HTML Sitemap</Link>.
          </p>
        </div>

      </div>
    </section>
  );
}
