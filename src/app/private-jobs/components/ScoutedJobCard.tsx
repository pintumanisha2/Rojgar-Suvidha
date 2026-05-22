"use client";

import { MapPin, DollarSign, Star } from"lucide-react";
import Link from"next/link";
import CompanyLogo from"@/components/layout/CompanyLogo";
import { calculateJobMatch, UserProfile } from"@/lib/matchingEngine";

interface ScoutedJob {
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
 company_logo?: string | null;
 created_at: string;
}

const SITE_COLORS: Record<string, string> = {
 Naukri:"bg-orange-100 text-orange-700 border-orange-200",
 LinkedIn:"bg-blue-100 text-blue-700 border-blue-200",
 Indeed:"bg-indigo-100 text-indigo-700 border-indigo-200",
 Shine:"bg-purple-100 text-purple-700 border-purple-200",
 Monster:"bg-violet-100 text-violet-700 border-violet-200",
 Foundit:"bg-green-100 text-green-700 border-green-200",
 External:"bg-gray-100 text-gray-700 border-gray-200",
};

export default function ScoutedJobCard({ job, profile }: { job: ScoutedJob; profile?: UserProfile | null }) {
 const siteColor = SITE_COLORS[job.source_site ||"External"] || SITE_COLORS.External;

 const slugify = (text: string) => text.toString().toLowerCase().trim().replace(/\s+/g, '-').replace(/[^\w\-]+/g, '').replace(/\-\-+/g, '-');
 const jobSlug = slugify(job.title);

 const matchResult = profile ? calculateJobMatch(
 job.title,
 job.description ||"",
 job.skills_required || [],
 job.location ||"",
 profile
 ) : null;

 return (
 <Link 
 href={`/private-jobs/${jobSlug}?id=${job.id}`}
 className={`block rounded-2xl border bg-white transition-all hover:shadow-lg cursor-pointer group ${
 job.is_featured
 ?"border-blue-400 hover:border-blue-500 bg-blue-50/5"
 :"border-slate-200 hover:border-blue-300"
 }`}
 >
 {job.is_featured && (
 <div className="bg-blue-600 rounded-t-2xl px-3 py-1 flex items-center gap-1.5">
 <Star className="w-3 h-3 text-white fill-white"/>
 <span className="text-white text-[10px] font-black uppercase tracking-widest">Featured Opportunity</span>
 </div>
 )}

 <div className="p-4 flex flex-col h-full">
 {/* Header Row */}
 <div className="flex items-start justify-between gap-3 mb-2">
 <div className="flex items-center gap-3 flex-1 min-w-0">
 <CompanyLogo 
 companyName={job.company_name} 
 logoUrl={job.company_logo} 
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
 {job.location && (
 <span 
 className="flex items-center gap-1 border bg-white border-slate-200 text-slate-600 px-2 py-1 rounded-md"
 >
 <MapPin className="w-3 h-3 text-slate-400"/> <span className="line-clamp-1">{job.location}</span>
 </span>
 )}
 {job.salary && (
 <span className="flex items-center gap-1 bg-green-50 text-green-700 px-2 py-1 rounded-md">
 <MapPin className="w-3 h-3 text-emerald-500/50 hidden"/>
 <span className="line-clamp-1">💰 {job.salary}</span>
 </span>
 )}
 </div>

 </div>
 </Link>
 );
}
