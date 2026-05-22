"use client";

import Link from"next/link";
import { Sparkles, ChevronRight, Briefcase } from"lucide-react";

export default function PrivateJobsHero() {
 return (
 <div className="relative overflow-hidden bg-white/60 border border-slate-200/60 backdrop-blur-xl rounded-3xl shadow-xl shadow-blue-500/5 p-6 sm:p-10 text-slate-900 flex flex-col md:flex-row md:items-center justify-between gap-6 group transition-all duration-500 hover:border-blue-400/50">
 
 <div className="relative z-10 space-y-4 max-w-2xl">
 <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 border border-blue-200 rounded-full text-blue-700 text-[10px] font-black uppercase tracking-widest shadow-sm">
 <span className="w-2 h-2 rounded-full bg-blue-600 animate-ping shrink-0"/>
 <Sparkles className="w-3 h-3 text-blue-600 shrink-0"/> 
 2026 Direct Recruitment Drive
 </span>
 <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
 Discover <span className="text-blue-600">Verified</span> Private Sector Jobs
 </h1>
 <p className="text-slate-600 text-sm sm:text-base leading-relaxed max-w-xl font-medium">
 Find secure remote jobs, MNC opportunities, BPO, data entry, and delivery postings with 100% authentic HR recruiters. Zero fees, zero scams.
 </p>
 </div>

 <div className="relative z-10 shrink-0 flex flex-col gap-3 w-full sm:w-auto items-center sm:items-end">
 <Link 
 href="/private-jobs/resume-builder"
 className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-4 rounded-2xl font-black text-sm transition-all shadow-md hover:shadow-lg active:scale-95 w-full sm:w-auto duration-300"
 >
 📄 Build Free AI Resume
 <ChevronRight className="w-4 h-4 transition-transform group-hover/btn:translate-x-1"/>
 </Link>
 <Link 
 href="/employer/login"
 className="text-xs font-black text-slate-500 hover:text-blue-600 transition-all duration-300 hover:underline hover:underline-offset-4 flex items-center gap-1 mt-1 group/link"
 >
 <Briefcase className="w-3.5 h-3.5 group-hover/link:animate-bounce"/>
 Are you a Recruiter? Hire Candidates →
 </Link>
 </div>
 </div>
 );
}
