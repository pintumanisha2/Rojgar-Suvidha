"use client";

import Link from"next/link";
import { IndianRupee, MapPin, Clock } from"lucide-react";
import CompanyLogo from"@/components/layout/CompanyLogo";
import { calculateJobMatch, UserProfile } from"@/lib/matchingEngine";

interface SupabaseJob {
 id: string;
 title: string;
 company_name: string;
 location: string;
 salary: string;
 experience_required?: string;
 skills_required?: string[];
 description?: string;
 source_url?: string;
 source_site?: string;
 is_featured?: boolean;
 status: string;
 created_at: string;
}

interface VerifiedJobCardProps {
 job: SupabaseJob;
 statusMap: Record<string, { label: string; dot: string; text: string; bg: string }>;
 profile?: UserProfile | null;
}

export default function VerifiedJobCard({ job, statusMap, profile }: VerifiedJobCardProps) {
 let lastDate ="";
 if (job.important_dates && job.important_dates.length > 0) {
 const ldObj = job.important_dates.find((d: any) => d.label ==="Last Date");
 if (ldObj) lastDate = ldObj.value;
 }

 const st = statusMap[job.status] || statusMap["active"];

 const matchResult = profile ? calculateJobMatch(
 job.title,
 job.description ||"",
 job.skills_required || [],
 job.location ||"Multiple Locations",
 profile
 ) : null;

 return (
 <Link 
 href={`/job/${job.id}`}
 className="group block rounded-2xl border bg-white border-slate-200 hover:border-blue-300 hover:shadow-lg transition-all duration-200"
 >
 <div className="p-4 flex flex-col h-full">
 {/* Header Row */}
 <div className="flex items-start justify-between gap-3 mb-2">
 <div className="flex items-center gap-3 flex-1 min-w-0">
 <CompanyLogo 
 companyName={job.company_name} 
 logoUrl={null} 
 className="h-10 w-10 rounded-xl shrink-0"
 />
 <div className="min-w-0">
 <h3 
 className="text-sm font-extrabold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-1"
 >
 {job.title}
 </h3>
 <p 
 className="text-xs font-bold text-slate-600 mt-0.5 line-clamp-1"
 >
 {job.company_name}
 </p>
 </div>
 </div>
 
 <div className="flex flex-col items-end gap-1.5 shrink-0 z-10">
 <span 
 className={`shrink-0 inline-flex items-center gap-1 text-[9px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider ${st.text} ${st.bg} border border-slate-200`}
 >
 <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
 Verified
 </span>

 {matchResult && matchResult.percentage > 0 && (
 <div className="relative group/tooltip">
 <div className={`flex items-center gap-0.5 text-[9px] font-black px-2.5 py-0.5 rounded-full cursor-help transition-all transform hover:scale-105 active:scale-95 shadow-sm border ${
 matchResult.percentage >= 80
 ?"bg-gradient-to-r from-emerald-500 to-teal-500 text-white border-emerald-400 shadow-emerald-500/20"
 : matchResult.percentage >= 50
 ?"bg-gradient-to-r from-blue-500 to-indigo-500 text-white border-blue-400 shadow-blue-500/20"
 :"bg-slate-100 text-slate-700 border-slate-200"
 }`}>
 <span>{matchResult.percentage}% Match</span>
 </div>
 {/* Tooltip Content */}
 <div className="absolute right-0 top-full mt-2 w-56 p-2.5 bg-slate-900/95 text-white text-[10px] rounded-xl shadow-xl border border-slate-700/50 opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all duration-250 z-50 pointer-events-none">
 <div className="font-extrabold mb-1 border-b border-slate-750 pb-1 text-blue-400">
 Match Insights
 </div>
 <ul className="space-y-1 list-disc list-inside text-slate-300 font-bold">
 {matchResult.reasons.map((r, i) => (
 <li key={i} className="leading-tight">{r}</li>
 ))}
 </ul>
 </div>
 </div>
 )}
 </div>
 </div>

 {/* Quick Meta */}
 <div className="flex flex-wrap items-center gap-3 text-[11px] font-bold mt-2">
 <span 
 className="flex items-center gap-1 border bg-white border-slate-200 text-slate-600 px-2 py-1 rounded-md"
 >
 <MapPin className="w-3 h-3 text-slate-400"/> <span className="line-clamp-1">{job.location || "Multiple Locations"}</span>
 </span>
 <span className="flex items-center gap-1 bg-emerald-50 text-emerald-700 px-2 py-1 rounded-md">
 <IndianRupee className="w-3 h-3"/> <span className="line-clamp-1">{job.salary || "CTC Disclosed"}</span>
 </span>
 {lastDate && (
 <span className="flex items-center gap-1 bg-rose-50 text-rose-700 px-2 py-1 rounded-md">
 <Clock className="w-3 h-3"/> <span className="line-clamp-1">Ends {lastDate}</span>
 </span>
 )}
 </div>
 </div>
 </Link>
 );
}
