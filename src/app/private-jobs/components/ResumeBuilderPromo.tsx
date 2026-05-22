"use client";

import Link from"next/link";
import { ChevronRight } from"lucide-react";

export default function ResumeBuilderPromo() {
 return (
 <div className="rounded-3xl bg-white border border-gray-200 p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl relative overflow-hidden group">
 <div className="absolute -top-24 -right-24 w-64 h-64 bg-blue-50 rounded-full blur-3xl group-hover:scale-110 transition-transform duration-700 pointer-events-none"></div>

 <div className="relative z-10 flex-1 text-center md:text-left">
 <span className="inline-block px-3 py-1 bg-sky-50 text-sky-700 border border-sky-100 text-[10px] font-extrabold rounded-full uppercase tracking-wider mb-3 shadow-sm">
 Free ATS Resume Builder
 </span>
 <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-2 leading-tight">
 Aapka Resume 100% Job-Ready Hai?
 </h3>
 <p className="text-slate-600 text-sm max-w-xl mx-auto md:mx-0">
 MNC recruiters standard resumes check karte hain. Humare interactive builder se 2 minutes mein super-professional ATS-friendly Resume banayein bilkul FREE!
 </p>
 </div>

 <div className="relative z-10 shrink-0 w-full md:w-auto">
 <Link 
 href="/private-jobs/resume-builder"
 className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-8 py-3.5 rounded-2xl font-extrabold text-sm sm:text-base transition-all shadow-lg shadow-blue-500/25 hover:-translate-y-1 w-full"
 >
 Make Resume (FREE)
 <ChevronRight className="w-5 h-5"/>
 </Link>
 </div>
 </div>
 );
}
