"use client";

import { useState, useEffect } from"react";
import { Loader2 } from"lucide-react";
import { supabase } from"@/lib/supabase";
import { calculateJobMatch, UserProfile } from"@/lib/matchingEngine";

import PrivateJobsHero from"./PrivateJobsHero";
import PrivateJobsMetrics from"./PrivateJobsMetrics";
import PrivateJobsFilters from"./PrivateJobsFilters";
import VerifiedJobCard from"./VerifiedJobCard";
import ResumeBuilderPromo from"./ResumeBuilderPromo";
import CommunityPromo from "./CommunityPromo";
import PrivateJobsFaqs from"./PrivateJobsFaqs";
import ScoutedJobsSection from"./ScoutedJobsSection";
import RecommendedJobsSection, { trackSearch } from"./RecommendedJobsSection";
import JobPreferenceToggle from "@/components/home/JobPreferenceToggle";

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

interface PrivateJobsClientProps {
 initialJobs: SupabaseJob[];
}

const statusMap: Record<string, { label: string; dot: string; text: string; bg: string }> = {
 out: { label:"Out", dot:"bg-green-500", text:"text-green-700", bg:"bg-green-50"},
 active: { label:"Active", dot:"bg-blue-500", text:"text-blue-700", bg:"bg-blue-50"},
 last: { label:"Ending", dot:"bg-red-500", text:"text-red-700", bg:"bg-red-50"},
 soon: { label:"Closing", dot:"bg-orange-400", text:"text-orange-600", bg:"bg-orange-50"},
 new: { label:"New", dot:"bg-sky-500", text:"text-sky-700", bg:"bg-sky-50"},
};

export default function PrivateJobsClient({ initialJobs }: PrivateJobsClientProps) {
 const [searchQuery, setSearchQuery] = useState("");
 const [selectedLocation, setSelectedLocation] = useState("All India");
 const [selectedCategory, setSelectedCategory] = useState("All");

 // Profile & Personalisation State
 const [profile, setProfile] = useState<UserProfile | null>(null);
 const [loadingProfile, setLoadingProfile] = useState(true);
 const [candidateName, setCandidateName] = useState<string | null>(null);

 // Load profile / guest interests
 useEffect(() => {
 async function loadProfile() {
 try {
 setLoadingProfile(true);
 const { data: { session } } = await supabase.auth.getSession();
 
 if (session) {
 // Fetch from Supabase
 const { data: dbProfile } = await supabase
 .from("private_candidate_profiles")
 .select("desired_role, skills, preferred_location, full_name")
 .eq("user_id", session.user.id)
 .maybeSingle();

 if (dbProfile) {
 setCandidateName(dbProfile.full_name);
 if (dbProfile.desired_role || (dbProfile.skills && dbProfile.skills.length > 0)) {
 setProfile({
 desired_role: dbProfile.desired_role ||"",
 skills: dbProfile.skills || [],
 preferred_location: dbProfile.preferred_location ||""
 });
 setLoadingProfile(false);
 return;
 }
 }
 }
 
 // Fallback to guest interests
 const rawGuest = localStorage.getItem("rs_guest_interests");
 if (rawGuest) {
 setProfile(JSON.parse(rawGuest));
 }
 } catch (err) {
 console.error("Error loading candidate profile:", err);
 } finally {
 setLoadingProfile(false);
 }
 }
 loadProfile();
 }, []);

 const handleUpdateProfile = (newProfile: UserProfile | null) => {
 setProfile(newProfile);
 if (newProfile) {
 localStorage.setItem("rs_guest_interests", JSON.stringify(newProfile));
 } else {
 localStorage.removeItem("rs_guest_interests");
 }
 };

 // Track search behaviour for AI recommendations
 useEffect(() => {
 const t = setTimeout(() => {
 if (searchQuery.length > 1) trackSearch(searchQuery);
 }, 600);
 return () => clearTimeout(t);
 }, [searchQuery]);

 // Client-side filtering for Supabase jobs
 const filteredVerifiedJobs = initialJobs.filter(job => {
  const titleMatch = job.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
  !!(job.company_name && job.company_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
  !!(job.skills_required && job.skills_required.some(s => s.toLowerCase().includes(searchQuery.toLowerCase())));
  
  // Filter WFH or regular location
  let locMatch = true;
  if (selectedLocation ==="Remote/WFH") {
  locMatch = job.title.toLowerCase().includes("wfh") || 
  job.title.toLowerCase().includes("remote") || 
  job.title.toLowerCase().includes("work from home") ||
  !!(job.location && job.location.toLowerCase().includes("remote"));
  } else if (selectedLocation !=="All India") {
  locMatch = job.location.toLowerCase().includes(selectedLocation.toLowerCase()) || 
  job.title.toLowerCase().includes(selectedLocation.toLowerCase());
  }

  // Filter categories
  let catMatch = true;
  if (selectedCategory !=="All") {
  const catKeywords: Record<string, string[]> = {
 "🏡 WFH": ["wfh","remote","home"],
 "💻 Tech & IT": ["tech","developer","it","software","support"],
 "📊 Data Entry": ["entry","typing","office","excel","clerk"],
 "📞 BPO / Telecalling": ["bpo","call","voice","tele","customer"],
 "🛵 Logistics & Delivery": ["delivery","rider","driver","logistics"]
  };
  const keys = catKeywords[selectedCategory] || [];
  catMatch = keys.some(key => 
    job.title.toLowerCase().includes(key) || 
    !!(job.description && job.description.toLowerCase().includes(key)) ||
    !!(job.skills_required && job.skills_required.some(s => s.toLowerCase().includes(key)))
  );
  }

 return titleMatch && locMatch && catMatch;
 });

 // Sort verified jobs by match percentage score if profile is active
 const sortedVerifiedJobs = [...filteredVerifiedJobs].sort((a, b) => {
  if (profile) {
  const matchA = calculateJobMatch(
  a.title,
  a.description ||"",
  a.skills_required || [],
  a.location ||"Multiple Locations",
  profile
  ).percentage;
  const matchB = calculateJobMatch(
  b.title,
  b.description ||"",
  b.skills_required || [],
  b.location ||"Multiple Locations",
  profile
  ).percentage;
 
 if (matchB !== matchA) {
 return matchB - matchA;
 }
 }
 return 0; // maintain default order if match is equal or no profile
 });

 return (
 <div className="flex flex-col min-h-screen bg-gray-50 text-gray-900 font-sans">
 {/* Smart Tab Toggle for Govt vs Private Jobs */}
 <JobPreferenceToggle />

 <div className="flex-1 bg-slate-50/50 py-8 px-4 relative overflow-x-hidden transition-colors duration-500">
 {/* Premium Ambient Background Glowing Orbs */}
 <div className="absolute top-1/4 left-1/10 w-[30rem] h-[30rem] bg-blue-500/10 rounded-full blur-[120px] -z-10 animate-pulse pointer-events-none"/>
 <div className="absolute top-1/2 right-1/10 w-[35rem] h-[35rem] bg-indigo-500/10 rounded-full blur-[150px] -z-10 pointer-events-none"/>
 <div className="absolute bottom-10 left-1/4 w-[25rem] h-[25rem] bg-violet-500/10 rounded-full blur-[100px] -z-10 pointer-events-none"/>
 
 <div className="max-w-6xl mx-auto flex flex-col gap-6 md:gap-12">
 
 {/* 1. Hero Banner */}
 <PrivateJobsHero />

 {/* 2. Metrics Counter */}
 <PrivateJobsMetrics 
 activeTab="scouted"
 verifiedCount={filteredVerifiedJobs.length}
 partnerCount={0}
 />

 {/* 3. Search & Interactive Filter Panel */}
 <PrivateJobsFilters 
 searchQuery={searchQuery}
 setSearchQuery={setSearchQuery}
 selectedLocation={selectedLocation}
 setSelectedLocation={setSelectedLocation}
 selectedCategory={selectedCategory}
 setSelectedCategory={setSelectedCategory}
 />

 {/* 4. Main Listings Section */}
 <div className="flex flex-col gap-8 md:gap-12">
 {/* Recommended Jobs (AI-personalised) */}
 <RecommendedJobsSection 
 searchQuery={searchQuery} 
 profile={profile}
 onUpdateProfile={handleUpdateProfile}
 loadingProfile={loadingProfile}
 candidateName={candidateName}
 />

 {/* Scouted Jobs (1-Click Apply) */}
 <ScoutedJobsSection profile={profile} />
 
 {/* Verified Direct Jobs (Supabase) */}
 {sortedVerifiedJobs.length > 0 && (
 <div className="space-y-4">
 <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
 Other Verified Jobs
 </h2>
 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
 {sortedVerifiedJobs.map((job) => (
 <VerifiedJobCard 
 key={job.id}
 job={job}
 statusMap={statusMap}
 profile={profile}
 />
 ))}
 </div>
 </div>
 )}
 </div>

 {/* 6. Promotional Panels */}
 <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
 <ResumeBuilderPromo />
 <CommunityPromo />
 </div>

 {/* 7. FAQs */}
 <PrivateJobsFaqs />

 </div>
 </div>
 </div>
 );
}
