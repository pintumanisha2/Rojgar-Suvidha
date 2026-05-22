"use client";

import { IndianRupee, MapPin, ChevronRight } from"lucide-react";

interface PartnerJob {
 id: string;
 title: string;
 company: string;
 location: string;
 salary: string;
 snippet: string;
 type: string;
 link: string;
 updated: string;
}

interface PartnerJobCardProps {
 job: PartnerJob;
}

export default function PartnerJobCard({ job }: PartnerJobCardProps) {
 return (
 <div 
 className="group rounded-2xl border bg-white border-slate-200 hover:border-blue-500/20 shadow-sm hover:shadow-xl hover:shadow-blue-500/5 transition-all duration-300 hover:-translate-y-1 overflow-hidden flex flex-col h-full"
 >
 <div className="h-1.5 w-full bg-slate-200 group-hover:bg-blue-500 transition-colors"/>
 
 <div className="p-5 flex flex-col h-full flex-1">
 {/* Badge Row */}
 <div className="flex items-center justify-between mb-4">
 <span 
 className="inline-flex items-center gap-1.5 text-[10px] font-extrabold px-2.5 py-1 rounded-md uppercase tracking-wider border bg-white border-slate-200 text-slate-600"
 >
 🏢 {job.company}
 </span>
 
 <span className="text-[10px] font-extrabold text-sky-600 bg-sky-50 px-2.5 py-1 rounded-md uppercase tracking-wider">
 Partner Feed
 </span>
 </div>

 {/* Job Title */}
 <a href={job.link} target="_blank"rel="noopener noreferrer"className="flex-1">
 <h3 
 className="text-base sm:text-lg font-bold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-2 leading-snug mb-3"
 >
 {job.title}
 </h3>
 </a>

 {/* Brief description snippet */}
 {job.snippet && (
 <p 
 className="text-xs line-clamp-3 mb-4 leading-relaxed font-medium text-slate-600"
 >
 {job.snippet}
 </p>
 )}

 {/* Meta Info Box */}
 <div 
 className="rounded-xl p-3.5 mb-4 space-y-2 border bg-white border-slate-200 text-xs"
 >
 <div className="flex items-center gap-2">
 <IndianRupee className="w-4 h-4 text-emerald-600 shrink-0"/>
 <span className="text-gray-600 font-bold">Salary:</span>
 <span className="font-extrabold text-gray-800">{job.salary}</span>
 </div>
 <div className="flex items-center gap-2">
 <MapPin className="w-4 h-4 text-slate-500 shrink-0"/>
 <span className="text-gray-600 font-bold">Location:</span>
 <span className="font-extrabold text-gray-800">{job.location}</span>
 </div>
 </div>

 {/* Action CTAs */}
 <div className="pt-3 border-t border-slate-100 mt-auto">
 <a
 href={job.link}
 target="_blank"
 rel="noopener noreferrer"
 className="w-full flex items-center justify-center gap-1.5 text-xs font-extrabold text-white bg-blue-600 hover:bg-blue-700 py-2.5 rounded-xl shadow-md transition-colors"
 >
 Apply External <ChevronRight className="w-3.5 h-3.5"/>
 </a>
 </div>
 </div>
 </div>
 );
}
