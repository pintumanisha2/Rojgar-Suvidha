"use client";

import Link from "next/link";
import { Users, ChevronRight } from "lucide-react";

export default function CommunityPromo() {
  return (
    <div className="rounded-3xl bg-gradient-to-br from-indigo-900 via-indigo-800 to-slate-900 border border-indigo-500/30 p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl relative overflow-hidden group">
      {/* Abstract Background Elements */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-rose-500/20 rounded-full blur-[80px] pointer-events-none group-hover:scale-110 transition-transform duration-700"></div>
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/30 rounded-full blur-[80px] pointer-events-none group-hover:scale-110 transition-transform duration-700"></div>

      <div className="relative z-10 flex-1 text-center md:text-left">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[10px] font-extrabold rounded-full uppercase tracking-wider mb-3 shadow-sm backdrop-blur-sm">
          <Users className="w-3.5 h-3.5" /> Private Jobs Community
        </span>
        <h3 className="text-2xl sm:text-3xl font-extrabold text-white mb-2 leading-tight">
          Join 10,000+ Job Seekers Like You
        </h3>
        <p className="text-indigo-200 text-sm max-w-xl mx-auto md:mx-0 font-medium leading-relaxed">
          Stuck in your job search? Discuss MNC salary structures, ask for employee referrals, share interview questions, and network directly with HRs in our active community forum.
        </p>
      </div>

      <div className="relative z-10 shrink-0 w-full md:w-auto">
        <Link 
          href="/private-jobs/community"
          className="flex items-center justify-center gap-2 bg-white hover:bg-indigo-50 text-indigo-900 px-8 py-3.5 rounded-2xl font-extrabold text-sm sm:text-base transition-all shadow-lg shadow-black/20 hover:-translate-y-1 w-full"
        >
          Join Discussions
          <ChevronRight className="w-5 h-5"/>
        </Link>
      </div>
    </div>
  );
}
