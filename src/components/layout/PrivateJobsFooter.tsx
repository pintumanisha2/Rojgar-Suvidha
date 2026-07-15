"use client";

import Link from "next/link";
import { Shield, AlertTriangle, Building2, Briefcase, ArrowLeft, ExternalLink, Phone, Mail } from "lucide-react";
import Image from "next/image";

export default function PrivateJobsFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer 
      style={{ backgroundColor: "#020617" }}
      className="border-t-4 border-blue-600 text-gray-300 mt-auto relative z-50 shadow-[0_-4px_20px_rgba(0,0,0,0.3)]"
    >

      {/* Anti-Fraud Banner */}
      <div className="bg-blue-950/30 border-b border-blue-900/20">
        <div className="max-w-6xl mx-auto px-4 py-4 flex flex-col sm:flex-row items-center justify-center gap-3 text-center">
          <AlertTriangle className="w-5 h-5 text-blue-400 shrink-0 animate-pulse" />
          <p className="text-sm font-bold text-blue-200">
            ⚠️ Rojgar Suvidha kabhi bhi paise ya documents phone pe nahi maangta. Fraud se bachein!
          </p>
          <Link
            href="/private-jobs/contact-us"
            className="shrink-0 text-xs font-extrabold text-blue-400 hover:text-blue-300 underline underline-offset-2 transition-colors"
          >
            Report Fraud →
          </Link>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">

          {/* Brand Column */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="shrink-0 flex items-center justify-center hover:scale-110 transition-transform duration-300">
                <Image 
                  src="/rojgar suvidha logo.png" 
                  alt="Rojgar Suvidha Icon"
                  width={36}
                  height={36}
                  className="h-9 w-9 object-contain"
                />
              </div>
              <div>
                <p className="font-black text-white text-base leading-tight">Rojgar Suvidha</p>
                <span className="text-[9px] font-black tracking-widest uppercase text-blue-400 bg-blue-900/30 px-1.5 py-0.5 rounded-md border border-blue-900/50">
                  Private Sector
                </span>
              </div>
            </div>
            <p className="text-sm text-gray-400 leading-relaxed">
              India&apos;s trusted platform for verified private job listings. Directly posted by companies or curated from top aggregators.
            </p>
            <div className="flex items-center gap-2 p-3 bg-green-950/40 border border-green-900/30 rounded-xl">
              <Shield className="w-4 h-4 text-green-400 shrink-0" />
              <span className="text-xs font-bold text-green-300">Verified & Anti-Fraud Protected</span>
            </div>
          </div>

          {/* For Candidates */}
          <div className="space-y-4">
            <h4 className="font-extrabold text-white text-sm tracking-wide">For Candidates</h4>
            <ul className="space-y-3">
              {[
                { label: "Browse Vetted Jobs", href: "/private-jobs" },
                { label: "MNC & Partner Feed", href: "/private-jobs?tab=partner" },
                { label: "Build Your Resume", href: "/private-jobs/resume-builder" },
                { label: "Post a Job opening", href: "/employer/login" },
                { label: "Contact Support Team", href: "/private-jobs/contact-us" },
              ].map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-gray-400 hover:text-blue-400 transition-colors flex items-center gap-1.5 group"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500/50 group-hover:bg-blue-400 transition-colors shrink-0" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* For Recruiters */}
          <div className="space-y-4">
            <h4 className="font-extrabold text-white text-sm tracking-wide">For Recruiters</h4>
            
            {/* HIGHLIGHTED HR LOGIN BUTTON */}
            <Link
              href="/employer/login"
              className="group flex items-center justify-between p-1.5 pl-4 pr-1.5 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-xl shadow-lg hover:shadow-emerald-500/25 transition-all mb-5 border border-emerald-400/40 hover:scale-105 active:scale-95"
            >
              <span className="font-extrabold text-white text-xs tracking-widest uppercase">HR / Recruiter Login</span>
              <span className="w-7 h-7 rounded-lg flex items-center justify-center text-white bg-white/20 group-hover:bg-white group-hover:text-emerald-600 transition-colors">
                →
              </span>
            </Link>

            <ul className="space-y-3">
              {[
                { label: "Create Company Account", href: "/employer/login" },
                { label: "Post a Job Opening", href: "/employer/dashboard" },
                { label: "Recruiter Guidelines", href: "/private-jobs/terms" },
                { label: "Candidate Vetting Standards", href: "/private-jobs/privacy" },
                { label: "Partnership Enquiry", href: "/private-jobs/contact-us" },
              ].map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-gray-400 hover:text-blue-400 transition-colors flex items-center gap-1.5 group"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500/50 group-hover:bg-blue-400 transition-colors shrink-0" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Help & Info */}
          <div className="space-y-4">
            <h4 className="font-extrabold text-white text-sm tracking-wide">Help & Info</h4>
            <ul className="space-y-3 mb-5">
              {[
                { label: "Contact Support", href: "/private-jobs/contact-us" },
                { label: "Privacy Policy", href: "/private-jobs/privacy" },
                { label: "Terms of Service", href: "/private-jobs/terms" },
                { label: "Refund Policy", href: "/private-jobs/refund-policy" },
              ].map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-gray-400 hover:text-gray-300 transition-colors flex items-center gap-1.5 group"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-gray-700 group-hover:bg-gray-400 transition-colors shrink-0" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>

            {/* Back to Govt Jobs */}
            <Link
              href="/"
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-600 via-blue-700 to-sky-500 hover:from-blue-700 hover:to-sky-600 text-white font-extrabold text-sm rounded-xl shadow-lg shadow-blue-500/20 hover:scale-[1.02] active:scale-95 transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
              🏛️ Go to Sarkari Govt Jobs
            </Link>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-gray-800/50 px-4 py-5">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-500">
          <p>© {currentYear} Rojgar Suvidha Private Sector Portal. Owned & Operated by PINTU KUMAR (MSME No. UDYAM-BR-27-0074756) at Champanagar, Purnia, Bihar - 854304. Not affiliated with any government organization. All rights reserved.</p>
          <p className="flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-green-600" />
            All listings manually reviewed for authenticity.
          </p>
        </div>
      </div>
    </footer>
  );
}
