import { useEffect, useState } from"react";
import { supabase } from"@/lib/supabase";
import ScoutedJobCard from"./ScoutedJobCard";
import { Radar, Search, SlidersHorizontal, Star } from"lucide-react";
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
 created_at: string;
}

const MOCK_JOBS: ScoutedJob[] = [
 { id:"m1", title:"Senior React Developer", company_name:"Flipkart", location:"Bangalore (Hybrid)", salary:"₹18L – ₹28L /yr", experience_required:"4+ Years", skills_required: ["React","TypeScript","GraphQL","Node.js"], description:"Build and maintain high-performance consumer-facing React applications for millions of users. Work with cross-functional teams to deliver world-class UX.", source_url:"https://naukri.com", source_site:"Naukri", is_featured: true, created_at: new Date().toISOString() },
 { id:"m2", title:"Python Data Engineer", company_name:"Razorpay", location:"Remote", salary:"₹20L – ₹32L /yr", experience_required:"3+ Years", skills_required: ["Python","Spark","Airflow","SQL","AWS"], description:"Design and maintain large-scale data pipelines powering payment analytics for India's leading fintech company.", source_url:"https://linkedin.com", source_site:"LinkedIn", is_featured: false, created_at: new Date(Date.now() - 86400000).toISOString() },
 { id:"m3", title:"Product Manager – Growth", company_name:"CRED", location:"Bangalore", salary:"₹25L – ₹40L /yr", experience_required:"5+ Years", skills_required: ["Product Strategy","A/B Testing","SQL","Growth Hacking"], description:"Lead product strategy for CRED's growth initiatives. Drive experiments to improve user activation, retention, and monetization metrics.", source_url:"https://indeed.com", source_site:"Indeed", is_featured: true, created_at: new Date(Date.now() - 172800000).toISOString() },
 { id:"m4", title:"DevOps Engineer", company_name:"Swiggy", location:"Hyderabad / Remote", salary:"₹15L – ₹22L /yr", experience_required:"2–4 Years", skills_required: ["Kubernetes","Docker","AWS","Terraform","CI/CD"], description:"Manage and scale infrastructure to support millions of food deliveries. Automate deployments and ensure 99.99% uptime.", source_url:"https://naukri.com", source_site:"Naukri", is_featured: false, created_at: new Date(Date.now() - 259200000).toISOString() },
];

export default function ScoutedJobsSection({ profile }: { profile: UserProfile | null }) {
 const [jobs, setJobs] = useState<ScoutedJob[]>([]);
 const [loading, setLoading] = useState(true);
 const [search, setSearch] = useState("");
 const [featuredOnly, setFeaturedOnly] = useState(false);

 useEffect(() => {
 const fetchScoutedJobs = async () => {
 setLoading(true);
 try {
 const { data } = await supabase
 .from("private_jobs")
 .select("*")
 .eq("apply_mode","internal")
 .eq("status","published")
 .order("is_featured", { ascending: false })
 .order("created_at", { ascending: false });

 if (data && data.length > 0) {
 setJobs(data);
 } else {
 setJobs(MOCK_JOBS);
 }
 } catch {
 setJobs(MOCK_JOBS);
 } finally {
 setLoading(false);
 }
 };
 fetchScoutedJobs();
 }, []);

 const filtered = jobs.filter(j => {
 const q = search.toLowerCase();
 const matchSearch = !q ||
 j.title.toLowerCase().includes(q) ||
 j.company_name.toLowerCase().includes(q) ||
 j.location.toLowerCase().includes(q) ||
 j.skills_required?.some(s => s.toLowerCase().includes(q));
 return matchSearch && (!featuredOnly || j.is_featured);
 });

 // Sort jobs reactively based on match percentage relevance
 const sortedFiltered = [...filtered].sort((a, b) => {
 if (profile) {
 const scoreA = calculateJobMatch(a.title, a.description ||"", a.skills_required || [], a.location ||"", profile).percentage;
 const scoreB = calculateJobMatch(b.title, b.description ||"", b.skills_required || [], b.location ||"", profile).percentage;
 if (scoreB !== scoreA) {
 return scoreB - scoreA;
 }
 }
 // Fallback default sorting
 if (a.is_featured && !b.is_featured) return -1;
 if (!a.is_featured && b.is_featured) return 1;
 return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
 });

 return (
 <div className="space-y-5">
 {/* Section Header */}
 <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
 <div>
 <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
 <Radar className="w-5 h-5 text-blue-500"/> Scouted Premium Jobs
 </h2>
 <p className="text-xs text-slate-500 font-medium mt-0.5">
 Top jobs from Naukri, LinkedIn & Indeed — Apply in 1 click, we handle the rest!
 </p>
 </div>
 <div className="flex items-center gap-2 shrink-0">
 <button
 onClick={() => setFeaturedOnly(!featuredOnly)}
 className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-bold transition-colors ${
 featuredOnly
 ?"bg-amber-500 text-white border-amber-500 shadow-sm"
 :"bg-white border-slate-200 text-slate-600 hover:bg-slate-50 shadow-sm"
 }`}
 >
 <Star className={`w-3.5 h-3.5 ${featuredOnly ?"fill-white":""}`} />
 Featured Only
 </button>
 <span 
 className="text-xs font-bold px-2.5 py-2 rounded-xl border bg-white border-slate-200 text-slate-600 shadow-sm"
 >
 {sortedFiltered.length} Jobs
 </span>
 </div>
 </div>

 {/* Search Bar */}
 <div className="relative">
 <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
 <Search className="w-4 h-4"/>
 </div>
 <input
 type="text"
 value={search}
 onChange={e => setSearch(e.target.value)}
 placeholder="Search by job title, company, skill (e.g. React, Delhi)..."
 className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-semibold text-slate-900 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm"
 />
 </div>

 {/* Jobs Grid */}
 {loading ? (
 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
 {[1, 2, 3, 4].map(i => (
 <div 
 key={i} 
 className="h-52 rounded-2xl animate-pulse border bg-white border-slate-200"
 />
 ))}
 </div>
 ) : sortedFiltered.length === 0 ? (
 <div className="flex flex-col items-center justify-center py-16 text-slate-500 bg-white rounded-2xl border border-dashed border-slate-200">
 <Radar className="w-12 h-12 text-slate-300 mb-4"/>
 <p className="font-bold text-slate-700">No matching jobs found</p>
 <p className="text-sm mt-1">Try adjusting your search or removing filters.</p>
 </div>
 ) : (
 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
 {sortedFiltered.map(job => (
 <ScoutedJobCard key={job.id} job={job} profile={profile} />
 ))}
 </div>
 )}
 </div>
 );
}
