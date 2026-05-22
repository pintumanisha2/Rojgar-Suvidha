"use client";

import { useEffect, useState, useRef } from"react";
import { supabase } from"@/lib/supabase";
import Link from"next/link";
import {
 Sparkles, MapPin, IndianRupee, Briefcase, ChevronRight,
 ChevronLeft, Star, TrendingUp, X, Flame, SlidersHorizontal, Check, RotateCcw
} from"lucide-react";

import CompanyLogo from"@/components/layout/CompanyLogo";
import { calculateJobMatch } from"@/lib/matchingEngine";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Job {
 id: string;
 title: string;
 company_name: string;
 location: string;
 salary: string;
 experience_required?: string;
 skills_required?: string[];
 source_site?: string;
 is_featured?: boolean;
 company_logo?: string | null;
 created_at: string;
 description?: string;
 matchResult?: any;
}

interface UserProfile {
 skills: string[];
 desired_role: string;
 preferred_location?: string;
}

interface BehavioralProfile {
 viewedSkills: string[]; // skills from jobs the user clicked
 searchedTerms: string[]; // what they typed in the search bar
 viewedJobIds: string[]; // job IDs they opened
}

interface RecommendedJobsSectionProps {
 searchQuery?: string;
 profile: UserProfile | null;
 onUpdateProfile: (newProfile: UserProfile | null) => void;
 loadingProfile: boolean;
 candidateName: string | null;
}

// ─── Behaviour Tracking Helpers (pure localStorage fallback) ───────────────────
const LS_KEY ="rs_user_profile";

export function trackJobView(job: { id: string; skills_required?: string[] }) {
 try {
 const raw = localStorage.getItem(LS_KEY);
 const bProfile: BehavioralProfile = raw ? JSON.parse(raw) : { viewedSkills: [], searchedTerms: [], viewedJobIds: [] };
 if (!bProfile.viewedJobIds.includes(job.id)) {
 bProfile.viewedJobIds = [job.id, ...bProfile.viewedJobIds].slice(0, 30);
 }
 if (job.skills_required) {
 const newSkills = job.skills_required.filter(s => !bProfile.viewedSkills.includes(s));
 bProfile.viewedSkills = [...newSkills, ...bProfile.viewedSkills].slice(0, 50);
 }
 localStorage.setItem(LS_KEY, JSON.stringify(bProfile));
 } catch {}
}

export function trackSearch(term: string) {
 try {
 if (!term || term.length < 2) return;
 const raw = localStorage.getItem(LS_KEY);
 const bProfile: BehavioralProfile = raw ? JSON.parse(raw) : { viewedSkills: [], searchedTerms: [], viewedJobIds: [] };
 const words = term.toLowerCase().trim().split(/\s+/);
 bProfile.searchedTerms = [...new Set([...words, ...bProfile.searchedTerms])].slice(0, 20);
 localStorage.setItem(LS_KEY, JSON.stringify(bProfile));
 } catch {}
}

function getBehavioralProfile(): BehavioralProfile {
 try {
 const raw = localStorage.getItem(LS_KEY);
 return raw ? JSON.parse(raw) : { viewedSkills: [], searchedTerms: [], viewedJobIds: [] };
 } catch {
 return { viewedSkills: [], searchedTerms: [], viewedJobIds: [] };
 }
}

// ─── Score how relevant a job is for this user (Behavioral Fallback) ───────────
function scoreJob(job: Job, bProfile: BehavioralProfile): number {
 let score = 0;
 const jobText =`${job.title} ${job.company_name} ${(job.skills_required || []).join("")}`.toLowerCase();

 // +3 for each user skill found in the job
 for (const skill of bProfile.viewedSkills) {
 if (jobText.includes(skill.toLowerCase())) score += 3;
 }
 // +2 for each search term found in the job
 for (const term of bProfile.searchedTerms) {
 if (jobText.includes(term.toLowerCase())) score += 2;
 }
 // +1 bonus for featured
 if (job.is_featured) score += 1;
 // Small boost for newer jobs
 const daysSincePosted = (Date.now() - new Date(job.created_at).getTime()) / 86400000;
 if (daysSincePosted < 3) score += 1;

 return score;
}

const MOCK_JOBS: Job[] = [
 { id:"m1", title:"Senior React Developer", company_name:"Flipkart", location:"Bangalore (Hybrid)", salary:"₹18L – ₹28L /yr", experience_required:"4+ Years", skills_required: ["React","TypeScript","GraphQL","Node.js"], source_site:"Naukri", is_featured: true, created_at: new Date().toISOString(), description:"Build and maintain high-performance consumer-facing React apps for Flipkart. Strong experience with state management, performance optimization, and GraphQL is required."},
 { id:"m2", title:"Python Data Engineer", company_name:"Razorpay", location:"Remote", salary:"₹20L – ₹32L /yr", experience_required:"3+ Years", skills_required: ["Python","Spark","Airflow","SQL","AWS"], source_site:"LinkedIn", is_featured: false, created_at: new Date(Date.now() - 86400000).toISOString(), description:"Design and build data warehouses, scale analytics pipelines, and support Razorpay payments infra. Strong SQL and Python skills are a must."},
 { id:"m3", title:"Product Manager – Growth", company_name:"CRED", location:"Bangalore", salary:"₹25L – ₹40L /yr", experience_required:"5+ Years", skills_required: ["Product Strategy","A/B Testing","SQL","Growth Hacking"], source_site:"Indeed", is_featured: true, created_at: new Date(Date.now() - 172800000).toISOString(), description:"Own the growth funnel, activate members, and work on key retention strategies at CRED. Excellent data analytics skills are required."},
 { id:"m4", title:"DevOps Engineer", company_name:"Swiggy", location:"Hyderabad / Remote", salary:"₹15L – ₹22L /yr", experience_required:"2–4 Years", skills_required: ["Kubernetes","Docker","AWS","Terraform","CI/CD"], source_site:"Naukri", is_featured: false, created_at: new Date(Date.now() - 259200000).toISOString(), description:"Scale Swiggy delivery system cloud infrastructure. Build high availability systems and manage continuous deployment cycles."},
 { id:"m5", title:"UX Designer", company_name:"Zomato", location:"Gurgaon", salary:"₹12L – ₹20L /yr", experience_required:"2+ Years", skills_required: ["Figma","Prototyping","User Research","Design Systems"], source_site:"LinkedIn", is_featured: false, created_at: new Date(Date.now() - 345600000).toISOString(), description:"Deliver intuitive user experiences for millions of Zomato food lovers. Work with design systems, wireframes, and run user research."},
 { id:"m6", title:"Android Developer", company_name:"PhonePe", location:"Pune (Hybrid)", salary:"₹14L – ₹22L /yr", experience_required:"3+ Years", skills_required: ["Kotlin","Android SDK","Jetpack Compose","REST APIs"], source_site:"Naukri", is_featured: true, created_at: new Date(Date.now() - 432000000).toISOString(), description:"Develop and scale PhonePe merchant applications. Experience with Jetpack Compose, multithreading, and REST APIs is required."},
];

const slugify = (text: string) => text.toString().toLowerCase().trim().replace(/\s+/g, '-').replace(/[^\w\-]+/g, '').replace(/\-\-+/g, '-');

// ─── Component ────────────────────────────────────────────────────────────────
export default function RecommendedJobsSection({
 searchQuery,
 profile,
 onUpdateProfile,
 loadingProfile,
 candidateName
}: RecommendedJobsSectionProps) {
 const [allJobs, setAllJobs] = useState<Job[]>([]);
 const [recommended, setRecommended] = useState<Job[]>([]);
 const [loading, setLoading] = useState(true);
 const [profileSummary, setProfileSummary] = useState<string[]>([]);
 const [hasProfile, setHasProfile] = useState(false);
 const [dismissed, setDismissed] = useState(false);
 const scrollRef = useRef<HTMLDivElement>(null);

 // Custom pill state
 const [showCustomForm, setShowCustomForm] = useState(false);
 const [customRole, setCustomRole] = useState(profile?.desired_role ||"");
 const [customSkills, setCustomSkills] = useState(profile?.skills.join(",") ||"");
 const [customLoc, setCustomLoc] = useState(profile?.preferred_location ||"");

 const PRESETS = [
 {
 label:"Sales & Marketing",
 icon:"🏢",
 profile: {
 desired_role:"Sales",
 skills: ["Sales","Marketing","Communication","Calling","Negotiation"],
 preferred_location:"Delhi"
 }
 },
 {
 label:"Software & IT",
 icon:"💻",
 profile: {
 desired_role:"Software Engineer",
 skills: ["React","Node.js","Python","Javascript","SQL","HTML"],
 preferred_location:"Remote"
 }
 },
 {
 label:"Remote / WFH",
 icon:"🏡",
 profile: {
 desired_role:"Work From Home",
 skills: ["Excel","Data Entry","Typing","Customer Support","Office"],
 preferred_location:"Remote"
 }
 },
 {
 label:"Data Entry",
 icon:"📊",
 profile: {
 desired_role:"Data Entry",
 skills: ["Excel","Typing","Data Entry","Office","Clerk"],
 preferred_location:"Noida"
 }
 },
 {
 label:"Telecalling / BPO",
 icon:"📞",
 profile: {
 desired_role:"Telecaller",
 skills: ["Calling","Customer Support","BPO","Voice Support","Communication"],
 preferred_location:"Gurgaon"
 }
 }
 ];

 // Track search terms reactively
 useEffect(() => {
 if (searchQuery) trackSearch(searchQuery);
 }, [searchQuery]);

 // Load all jobs once on mount
 useEffect(() => {
 const fetchJobs = async () => {
 setLoading(true);
 let jobs: Job[] = [];
 try {
 const { data } = await supabase.from("private_jobs").select("*").eq("status","published").order("created_at", { ascending: false });
 jobs = data && data.length > 0 ? data : MOCK_JOBS;
 } catch {
 jobs = MOCK_JOBS;
 }
 setAllJobs(jobs);
 setLoading(false);
 };
 fetchJobs();
 }, []);

 // Compute recommendations reactively whenever jobs or profile changes
 useEffect(() => {
 if (allJobs.length === 0) return;

 const oldBehavioralProfile = getBehavioralProfile();
 const topSkills = oldBehavioralProfile.viewedSkills.slice(0, 3);
 const topTerms = oldBehavioralProfile.searchedTerms.slice(0, 2);
 setProfileSummary([...topSkills, ...topTerms].filter(Boolean).slice(0, 4));

 setHasProfile(topSkills.length > 0 || topTerms.length > 0 || !!profile);

 // Score + sort
 const scored = allJobs
 .map(j => {
 let score = 0;
 let matchResult: any = null;
 if (profile) {
 matchResult = calculateJobMatch(j.title, j.description ||"", j.skills_required || [], j.location ||"", profile);
 score = matchResult.percentage;
 } else {
 score = scoreJob(j, oldBehavioralProfile);
 }
 return { job: j, score, matchResult };
 })
 .sort((a, b) => b.score - a.score)
 .slice(0, 6)
 .map(x => ({
 ...x.job,
 matchResult: x.matchResult
 }));

 setRecommended(scored);
 }, [allJobs, profile]);

 // Sync state if profile prop changes
 useEffect(() => {
 if (profile) {
 setCustomRole(profile.desired_role);
 setCustomSkills(profile.skills.join(","));
 setCustomLoc(profile.preferred_location ||"");
 }
 }, [profile]);

 const scroll = (dir:"left"|"right") => {
 scrollRef.current?.scrollBy({ left: dir ==="left"? -320 : 320, behavior:"smooth"});
 };

 if (dismissed) return null;

 return (
 <div className="space-y-6">
 {/* Section Header */}
 <div className="flex items-center justify-between gap-4">
 <div className="flex items-start gap-3">
 <div className="p-2 bg-blue-600 rounded-xl shadow-md">
 <Sparkles className="w-5 h-5 text-white"/>
 </div>
 <div>
 <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
 Recommended for You
 <span className="inline-flex items-center gap-1 text-[10px] font-extrabold bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full border border-blue-200">
 <TrendingUp className="w-3 h-3"/> Personalised Match
 </span>
 </h2>
 <p className="text-xs font-medium text-slate-500 mt-0.5">
 {profile 
 ?`Dynamically ranked based on your exact profile matches.`
 : hasProfile
 ?`Based on your browsing history: ${profileSummary.join(",")}`
 :"Enter your interests below to customize your jobs feed!"}
 </p>
 </div>
 </div>

 <div className="flex items-center gap-2 shrink-0">
 <button onClick={() => scroll("left")} className="p-2 bg-white border border-slate-200 rounded-full hover:border-blue-300 hover:text-blue-600 transition-all shadow-sm hidden sm:flex">
 <ChevronLeft className="w-4 h-4"/>
 </button>
 <button onClick={() => scroll("right")} className="p-2 bg-white border border-slate-200 rounded-full hover:border-blue-300 hover:text-blue-600 transition-all shadow-sm hidden sm:flex">
 <ChevronRight className="w-4 h-4"/>
 </button>
 <button onClick={() => setDismissed(true)} className="p-2 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-500 transition-colors"title="Dismiss">
 <X className="w-4 h-4"/>
 </button>
 </div>
 </div>

 {/* ─── PERSONALISATION BANNER / CONTROL PANEL ─── */}
 {!profile ? (
 <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600/10 via-indigo-600/10 to-violet-600/10 border border-blue-200/50 p-5 sm:p-6 shadow-sm">
 {/* Ambient lights */}
 <div className="absolute top-0 right-0 w-32 h-32 bg-blue-400/20 rounded-full blur-2xl pointer-events-none"/>
 <div className="absolute bottom-0 left-0 w-32 h-32 bg-purple-400/20 rounded-full blur-2xl pointer-events-none"/>
 
 <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
 <div className="space-y-2">
 <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-blue-100 text-blue-700">
 <Sparkles className="w-3.5 h-3.5 fill-blue-500/50 animate-pulse"/> Personalized Job Feed
 </div>
 <h3 className="text-xl sm:text-2xl font-black text-slate-900 leading-tight">
 {candidateName ?`Hey ${candidateName}, customize your job feed!`:"What kind of job are you looking for?"}
 </h3>
 <p className="text-sm font-medium text-slate-600 max-w-xl">
 Select a template or type custom details below. We will calculate real-time match scores and highlight the best jobs for you.
 </p>
 </div>
 <button 
 onClick={() => setShowCustomForm(!showCustomForm)}
 className="shrink-0 flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-blue-200 hover:border-blue-400 bg-white text-slate-800 font-extrabold text-xs transition-all active:scale-95 shadow-sm"
 >
 <SlidersHorizontal className="w-3.5 h-3.5 text-blue-500"/>
 {showCustomForm ?"Show Presets":"Custom Preferences"}
 </button>
 </div>

 {showCustomForm ? (
 <form 
 onSubmit={(e) => {
 e.preventDefault();
 onUpdateProfile({
 desired_role: customRole.trim(),
 skills: customSkills.split(",").map(s => s.trim()).filter(Boolean),
 preferred_location: customLoc.trim()
 });
 }}
 className="mt-6 p-4 bg-white/60 rounded-xl border border-slate-200/50 grid grid-cols-1 sm:grid-cols-3 gap-4"
 >
 <div>
 <label className="block text-[10px] font-black uppercase text-slate-450 tracking-wider mb-1.5">Desired Role</label>
 <input 
 type="text"
 value={customRole} 
 onChange={e => setCustomRole(e.target.value)}
 placeholder="e.g. Sales, React Developer"
 className="w-full px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-900 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400"
 required
 />
 </div>
 <div>
 <label className="block text-[10px] font-black uppercase text-slate-450 tracking-wider mb-1.5">Required Skills (Comma separated)</label>
 <input 
 type="text"
 value={customSkills} 
 onChange={e => setCustomSkills(e.target.value)}
 placeholder="e.g. Excel, React, Calling"
 className="w-full px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-900 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400"
 />
 </div>
 <div>
 <label className="block text-[10px] font-black uppercase text-slate-450 tracking-wider mb-1.5">Preferred City / Location</label>
 <div className="flex gap-2">
 <input 
 type="text"
 value={customLoc} 
 onChange={e => setCustomLoc(e.target.value)}
 placeholder="e.g. Remote, Delhi, Noida"
 className="w-full px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-900 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400"
 />
 <button 
 type="submit"
 className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-extrabold px-4 rounded-xl shadow-sm hover:shadow active:scale-95 transition-all shrink-0"
 >
 Apply
 </button>
 </div>
 </div>
 </form>
 ) : (
 <div className="mt-6 flex flex-wrap gap-3">
 {PRESETS.map((preset) => (
 <button
 key={preset.label}
 onClick={() => {
 onUpdateProfile(preset.profile);
 }}
 className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-white border border-slate-200 hover:border-blue-300 hover:shadow-md transition-all active:scale-95 text-left text-xs font-extrabold text-slate-800 group/preset shadow-sm"
 >
 <span className="text-lg group-hover/preset:scale-110 transition-transform">{preset.icon}</span>
 <div className="flex flex-col gap-0.5">
 <span>{preset.label}</span>
 <span className="text-[10px] text-slate-400 font-bold tracking-tight">{preset.profile.desired_role} • {preset.profile.preferred_location}</span>
 </div>
 </button>
 ))}
 </div>
 )}
 </div>
 ) : (
 <div className="rounded-2xl border border-emerald-250/50 bg-emerald-50/50 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
 <div className="flex items-start sm:items-center gap-3">
 <div className="p-2 bg-emerald-100 rounded-xl border border-emerald-200/50 text-emerald-650 shrink-0">
 <Check className="w-5 h-5"/>
 </div>
 <div className="space-y-0.5">
 <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Active Personalised Feed</p>
 <h4 className="text-sm font-extrabold text-slate-900">
 Matching for <span className="text-blue-600">"{profile.desired_role}"</span> jobs in <span className="text-blue-600">"{profile.preferred_location || 'Anywhere'}"</span>
 </h4>
 {profile.skills.length > 0 && (
 <div className="flex flex-wrap items-center gap-1.5 mt-1">
 <span className="text-[10px] text-slate-400 font-bold">Skills matched:</span>
 {profile.skills.map(s => (
 <span key={s} className="text-[9px] font-extrabold bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded-md border border-blue-100/50">
 {s}
 </span>
 ))}
 </div>
 )}
 </div>
 </div>
 <button 
 onClick={() => onUpdateProfile(null)}
 className="shrink-0 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 hover:border-red-200 hover:text-red-650 bg-white text-slate-655 font-extrabold text-xs transition-all active:scale-95 shadow-sm"
 >
 <RotateCcw className="w-3.5 h-3.5"/>
 Reset Preferences
 </button>
 </div>
 )}

 {/* Horizontal Scroll Cards */}
 {loading ? (
 <div className="flex gap-4 overflow-hidden">
 {[1, 2, 3].map(i => (
 <div 
 key={i} 
 className="w-72 shrink-0 h-44 bg-white border border-slate-200 rounded-2xl animate-pulse"
 />
 ))}
 </div>
 ) : (
 <div
 ref={scrollRef}
 className="flex gap-4 overflow-x-auto pb-2 scroll-smooth snap-x snap-mandatory scrollbar-hide"
 style={{ scrollbarWidth:"none"}}
 >
 {recommended.map((job, index) => (
 <Link
 key={job.id}
 href={`/private-jobs/${slugify(job.title)}?id=${job.id}`}
 onClick={() => trackJobView(job)}
 className="group w-72 shrink-0 snap-start border bg-white border-slate-200 hover:border-blue-300 rounded-2xl p-5 flex flex-col gap-3 transition-all hover:shadow-lg hover:-translate-y-0.5 relative overflow-hidden"
 >
 {/* Glow for top match */}
 {index === 0 && (
 <div className="absolute top-0 right-0 left-0 h-1 bg-blue-500 rounded-t-2xl"/>
 )}

 {/* Top row */}
 <div className="flex items-center justify-between gap-2">
 <CompanyLogo 
 companyName={job.company_name} 
 logoUrl={job.company_logo} 
 className="h-10 w-10 rounded-xl"
 />
 <div className="flex-1 min-w-0">
 <p 
 className="text-xs font-bold text-slate-600 truncate"
 >
 {job.company_name}
 </p>
 </div>

 {job.matchResult && job.matchResult.percentage > 0 ? (
 <div className="relative group/tooltip shrink-0 z-10">
 <div className={`flex items-center gap-0.5 text-[9px] font-black px-2 py-0.5 rounded-full cursor-help transition-all transform hover:scale-105 active:scale-95 shadow-sm border ${
 job.matchResult.percentage >= 80
 ?"bg-gradient-to-r from-emerald-500 to-teal-500 text-white border-emerald-400 shadow-emerald-500/20"
 : job.matchResult.percentage >= 50
 ?"bg-gradient-to-r from-blue-500 to-indigo-500 text-white border-blue-400 shadow-blue-500/20"
 :"bg-slate-100 text-slate-700 border-slate-200"
 }`}>
 <span>{job.matchResult.percentage}%</span>
 </div>
 {/* Tooltip */}
 <div className="absolute right-0 top-full mt-2 w-56 p-2.5 bg-slate-900/95 text-white text-[10px] rounded-xl shadow-xl border border-slate-700/50 opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all duration-200 z-50 pointer-events-none">
 <div className="font-extrabold mb-1 border-b border-slate-750 pb-1 text-blue-400">
 Match Insights
 </div>
 <ul className="space-y-1 list-disc list-inside text-slate-355 font-bold">
 {job.matchResult.reasons.map((r: string, i: number) => (
 <li key={i} className="leading-tight">{r}</li>
 ))}
 </ul>
 </div>
 </div>
 ) : index === 0 ? (
 <span className="flex items-center gap-1 text-[9px] font-black text-orange-650 bg-orange-50 px-2 py-1 rounded-full border border-orange-100 shrink-0">
 <Flame className="w-3 h-3 fill-orange-500"/> Top Pick
 </span>
 ) : job.is_featured ? (
 <Star className="w-4 h-4 text-amber-400 fill-amber-400 shrink-0"/>
 ) : null}
 </div>

 {/* Title */}
 <h3 
 className="text-sm font-extrabold text-slate-900 group-hover:text-blue-600 transition-colors leading-snug line-clamp-2"
 >
 {job.title}
 </h3>

 {/* Meta */}
 <div className="flex flex-col gap-1.5 text-[11px] font-semibold">
 {job.location && (
 <span className="flex items-center gap-1.5 text-slate-655">
 <MapPin className="w-3 h-3 shrink-0"/>
 <span className="truncate">{job.location}</span>
 </span>
 )}
 {job.salary && (
 <span className="flex items-center gap-1.5 text-emerald-650 font-bold">
 <IndianRupee className="w-3 h-3 shrink-0"/>
 {job.salary}
 </span>
 )}
 {job.experience_required && (
 <span className="flex items-center gap-1.5 text-slate-655">
 <Briefcase className="w-3 h-3 shrink-0"/>
 {job.experience_required}
 </span>
 )}
 </div>

 {/* Skills */}
 {job.skills_required && job.skills_required.length > 0 && (
 <div className="flex flex-wrap gap-1 mt-auto">
 {job.skills_required.slice(0, 3).map(s => (
 <span 
 key={s} 
 className="text-[10px] font-bold border bg-white border-slate-200 text-slate-655 px-2 py-0.5 rounded-md"
 >
 {s}
 </span>
 ))}
 {job.skills_required.length > 3 && (
 <span className="text-[10px] text-slate-400 font-bold px-1 py-0.5">+{job.skills_required.length - 3}</span>
 )}
 </div>
 )}
 </Link>
 ))}

 {/* Tail CTA Card */}
 <div className="w-52 shrink-0 snap-start bg-blue-600 rounded-2xl p-5 flex flex-col items-center justify-center text-center gap-3 text-white shadow-lg">
 <Sparkles className="w-8 h-8 text-blue-200"/>
 <p className="text-sm font-extrabold">Explore all Jobs</p>
 <p className="text-xs text-blue-200 font-medium">Browse 500+ openings and find your perfect fit.</p>
 <Link
 href="/private-jobs"
 className="bg-white text-blue-700 font-extrabold text-xs px-4 py-2 rounded-xl shadow transition-all hover:shadow-md active:scale-95"
 >
 View All →
 </Link>
 </div>
 </div>
 )}
 </div>
 );
}
