"use client";

import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import {
  Inbox, Search, Mail, Phone, FileText,
  Download, CheckCircle, Clock, XCircle, User, Briefcase, Building, MessageCircle
} from "lucide-react";
import { calculateJobMatch, UserProfile } from "@/lib/matchingEngine";

interface Application {
  id: string;
  job_id: string;
  job_title: string;
  company_name: string;
  applicant_name: string;
  applicant_email: string;
  applicant_phone: string;
  cover_note?: string | null;
  resume_url?: string | null;
  status: "new" | "contacted" | "shortlisted" | "rejected";
  created_at: string;
  candidate_id?: string | null;

  // Joined tables
  private_jobs?: {
    description?: string | null;
    skills_required?: string[] | null;
    location?: string | null;
  } | null;

  private_candidate_profiles?: {
    skills?: string[] | null;
    desired_role?: string | null;
    preferred_location?: string | null;
    ats_score?: number | null;
  } | null;
}

const STATUS_STYLES = {
  new:         { label: "New",         classes: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800" },
  contacted:   { label: "Contacted",   classes: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800" },
  shortlisted: { label: "Shortlisted", classes: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800" },
  rejected:    { label: "Rejected",    classes: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400 border-rose-200 dark:border-rose-800" },
};

const MOCK_APPS: Application[] = [
  { 
    id: "a1", 
    job_id: "m1", 
    job_title: "Senior React Developer", 
    company_name: "Flipkart", 
    applicant_name: "Arjun Sharma", 
    applicant_email: "arjun.sharma@gmail.com", 
    applicant_phone: "+91 9876543210", 
    cover_note: "4 years of React experience at TCS. Strong in TypeScript and Redux.", 
    resume_url: "https://drive.google.com/sample", 
    status: "new", 
    created_at: new Date().toISOString(),
    private_jobs: {
      description: "Senior React Developer with experience in React and TypeScript. State management libraries like Redux required.",
      skills_required: ["React", "TypeScript", "Redux"],
      location: "Bangalore"
    },
    private_candidate_profiles: {
      skills: ["React", "TypeScript", "Redux", "JavaScript"],
      desired_role: "Senior React Developer",
      preferred_location: "Bangalore",
      ats_score: 85
    }
  },
  { 
    id: "a2", 
    job_id: "m2", 
    job_title: "Python Data Engineer", 
    company_name: "Razorpay", 
    applicant_name: "Priya Nair", 
    applicant_email: "priya.nair@outlook.com", 
    applicant_phone: "+91 8765432109", 
    cover_note: "3 years in data engineering. Worked on Airflow and Spark pipelines.", 
    resume_url: null, 
    status: "contacted", 
    created_at: new Date(Date.now() - 3600000).toISOString(),
    private_jobs: {
      description: "Python Data Engineer to build high-performance data processing pipelines.",
      skills_required: ["Python", "Airflow", "Spark"],
      location: "Remote"
    },
    private_candidate_profiles: {
      skills: ["Python", "Airflow", "Spark"],
      desired_role: "Data Engineer",
      preferred_location: "Remote",
      ats_score: 92
    }
  },
  { 
    id: "a3", 
    job_id: "m3", 
    job_title: "Product Manager – Growth", 
    company_name: "CRED", 
    applicant_name: "Rahul Mehta", 
    applicant_email: "rahul.mehta@gmail.com", 
    applicant_phone: "+91 7654321098", 
    cover_note: "5+ years in product. Led growth at a Series B fintech startup.", 
    resume_url: "https://drive.google.com/sample2", 
    status: "shortlisted", 
    created_at: new Date(Date.now() - 86400000).toISOString(),
    private_jobs: {
      description: "Lead product strategy for CRED growth initiatives.",
      skills_required: ["Product Strategy", "Growth Hacking", "SQL"],
      location: "Bangalore"
    },
    private_candidate_profiles: {
      skills: ["Product Strategy", "SQL"],
      desired_role: "Product Manager",
      preferred_location: "Delhi",
      ats_score: 74
    }
  },
];

const parseCoverNote = (note: string | null | undefined) => {
  if (!note) return { joining: null, salary: null, message: "" };
  const match = note.match(/^\[Screener\] Joining: (.*?) \| Salary: (.*?)\n\n([\s\S]*)$/);
  if (match) {
    return {
      joining: match[1],
      salary: match[2],
      message: match[3]
    };
  }
  return { joining: null, salary: null, message: note };
};

export default function ApplicationTrackerPage() {
  const [apps, setApps] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | Application["status"]>("all");
  const [viewMode, setViewMode] = useState<"job" | "candidate">("job");
  const [expandedCandidate, setExpandedCandidate] = useState<string | null>(null);
  const [shortlistedToast, setShortlistedToast] = useState<string | null>(null);

  const getApplicationMatchScore = (app: Application): number => {
    // If candidate has a profile, calculate match score using matching engine
    if (app.private_candidate_profiles && app.private_jobs) {
      const profile: UserProfile = {
        skills: app.private_candidate_profiles.skills || [],
        desired_role: app.private_candidate_profiles.desired_role || "",
        preferred_location: app.private_candidate_profiles.preferred_location || ""
      };
      const match = calculateJobMatch(
        app.job_title,
        app.private_jobs.description || "",
        app.private_jobs.skills_required || [],
        app.private_jobs.location || "",
        profile
      );
      return match.percentage;
    }
    
    // If the profile has cached ats_score, return that as fallback
    if (app.private_candidate_profiles?.ats_score) {
      return app.private_candidate_profiles.ats_score;
    }
    
    // Default fallback based on mock items
    if (app.id === "a1") return 85;
    if (app.id === "a2") return 92;
    if (app.id === "a3") return 74;
    
    return 0;
  };

  const fetchApps = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("private_job_applications_internal")
        .select(`
          *,
          private_jobs (
            description,
            skills_required,
            location
          ),
          private_candidate_profiles (
            skills,
            desired_role,
            preferred_location,
            ats_score
          )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setApps(data && data.length > 0 ? data : MOCK_APPS);
    } catch (err) {
      console.warn("Error fetching applications with profiles:", err);
      // Also check localStorage fallback
      const local = JSON.parse(localStorage.getItem("rs_internal_applications") || "[]");
      setApps(local.length > 0 ? local : MOCK_APPS);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchApps(); }, []);

  const updateStatus = async (id: string, status: Application["status"]) => {
    try {
      await supabase.from("private_job_applications_internal").update({ status }).eq("id", id);
    } catch {}
    setApps(prev => prev.map(a => a.id === id ? { ...a, status } : a));
  };

  const exportCSV = () => {
    const rows = filtered.map(a => [
      a.applicant_name, a.applicant_email, a.applicant_phone,
      a.job_title, a.company_name, a.status, a.cover_note || "", a.resume_url || "",
      new Date(a.created_at).toLocaleDateString()
    ]);
    const headers = ["Name", "Email", "Phone", "Job Title", "Company", "Status", "Cover Note", "Resume URL", "Applied On"];
    const csv = [headers, ...rows].map(r => r.map(v => `"${v}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `applications_${Date.now()}.csv`;
    a.click(); URL.revokeObjectURL(url);
  };

  const filtered = apps.filter(a => {
    const q = search.toLowerCase();
    const matchSearch = !q || a.applicant_name.toLowerCase().includes(q) ||
      a.applicant_email.toLowerCase().includes(q) || a.job_title.toLowerCase().includes(q);
    const matchStatus = statusFilter === "all" || a.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const filteredSorted = useMemo(() => {
    return [...filtered].sort((a, b) => getApplicationMatchScore(b) - getApplicationMatchScore(a));
  }, [filtered]);

  // Candidate grouping engine for Candidate-Centric consolidated tracking
  const candidateGroups = useMemo(() => {
    const groups: Record<string, {
      applicant_name: string;
      applicant_email: string;
      applicant_phone: string;
      resume_url?: string | null;
      applications: Application[];
    }> = {};

    filtered.forEach(app => {
      const email = app.applicant_email.toLowerCase().trim();
      if (!groups[email]) {
        groups[email] = {
          applicant_name: app.applicant_name,
          applicant_email: app.applicant_email,
          applicant_phone: app.applicant_phone,
          resume_url: app.resume_url,
          applications: []
        };
      }
      groups[email].applications.push(app);

      // Keep candidate data complete with longest fields as fallback
      if (app.applicant_name && app.applicant_name.length > groups[email].applicant_name.length) {
        groups[email].applicant_name = app.applicant_name;
      }
      if (app.resume_url && !groups[email].resume_url) {
        groups[email].resume_url = app.resume_url;
      }
    });

    // Sort by highest match / ATS score descending to keep top talent on top!
    return Object.values(groups).sort((a, b) => {
      const maxA = Math.max(...a.applications.map(getApplicationMatchScore));
      const maxB = Math.max(...b.applications.map(getApplicationMatchScore));
      return maxB - maxA;
    });
  }, [filtered]);

  // Extract candidates with Max Match / ATS Score >= 80% to spotlight at the absolute top!
  const spotlightCandidates = useMemo(() => {
    const stars = candidateGroups.filter(group => {
      const maxScore = Math.max(...group.applications.map(getApplicationMatchScore));
      return maxScore >= 80;
    });

    if (stars.length > 0) return stars;

    // Fallback: If no candidate has >= 80%, spotlight candidates with >= 50% match score (up to 2)
    return candidateGroups.filter(group => {
      const maxScore = Math.max(...group.applications.map(getApplicationMatchScore));
      return maxScore >= 50;
    }).slice(0, 2);
  }, [candidateGroups]);

  const quickShortlistCandidate = async (email: string) => {
    const candidateGroup = candidateGroups.find(c => c.applicant_email === email);
    if (!candidateGroup) return;

    try {
      // Find all application IDs for this candidate that aren't already shortlisted or rejected
      const appIdsToUpdate = candidateGroup.applications
        .filter(a => a.status !== "shortlisted")
        .map(a => a.id);

      if (appIdsToUpdate.length === 0) return;

      // Update in Supabase for each application
      await Promise.all(
        appIdsToUpdate.map(id =>
          supabase
            .from("private_job_applications_internal")
            .update({ status: "shortlisted" })
            .eq("id", id)
        )
      );

      // Show custom visual toast message
      setShortlistedToast(`${candidateGroup.applicant_name} has been successfully shortlisted!`);
      setTimeout(() => setShortlistedToast(null), 4000);

      // Update state locally
      setApps(prev =>
        prev.map(a =>
          appIdsToUpdate.includes(a.id) ? { ...a, status: "shortlisted" } : a
        )
      );
    } catch (err) {
      console.error("Error bulk shortlisting candidate:", err);
    }
  };

  const counts = {
    all: apps.length,
    new: apps.filter(a => a.status === "new").length,
    contacted: apps.filter(a => a.status === "contacted").length,
    shortlisted: apps.filter(a => a.status === "shortlisted").length,
    rejected: apps.filter(a => a.status === "rejected").length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-2">
            <Inbox className="h-6 w-6 text-blue-500" /> Internal Application Tracker
          </h2>
          <p className="text-sm text-gray-500 font-medium mt-1">
            All candidates who applied via <strong>1-Click Apply</strong> on Rojgar Suvidha Private Jobs.
          </p>
        </div>
        <button
          onClick={exportCSV}
          className="flex items-center gap-2 px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl text-sm font-bold hover:bg-gray-700 dark:hover:bg-gray-100 transition-colors shadow-sm animate-fade-in"
        >
          <Download className="h-4 w-4" /> Export CSV
        </button>
      </div>

      {/* Status Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {(["all", "new", "contacted", "shortlisted", "rejected"] as const).map(s => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`rounded-2xl p-3 text-center transition-all border ${
              statusFilter === s
                ? "bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-500/20"
                : "bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 hover:border-blue-300 text-gray-700 dark:text-gray-300"
            }`}
          >
            <p className="text-xl font-extrabold">{counts[s]}</p>
            <p className="text-[11px] font-bold capitalize mt-0.5 opacity-80">{s}</p>
          </button>
        ))}
      </div>

      {/* Shortlist Success Toast Notification */}
      {shortlistedToast && (
        <div className="fixed bottom-5 right-5 z-50 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-extrabold px-5 py-3.5 rounded-2xl shadow-xl shadow-emerald-500/25 border border-emerald-400/20 flex items-center gap-2.5 animate-bounce">
          <CheckCircle className="w-5 h-5 text-white" />
          <span className="text-sm">{shortlistedToast}</span>
        </div>
      )}

      {/* 🌟 Star Talent Spotlight (Match >= 80%) */}
      {spotlightCandidates.length > 0 && (
        <div className="bg-gradient-to-r from-blue-50/50 to-indigo-50/50 dark:from-slate-900/60 dark:to-indigo-950/40 border border-blue-100/50 dark:border-indigo-900/30 rounded-3xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="flex h-2.5 w-2.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              <h3 className="text-xs font-black text-blue-900 dark:text-blue-300 uppercase tracking-widest flex items-center gap-1.5">
                🌟 Star Talent Spotlight (Top Match & ATS {" >= "} 80%)
              </h3>
            </div>
            <p className="text-[10px] text-gray-500 font-black uppercase tracking-wider hidden sm:block">
              Priority Review Required
            </p>
          </div>
          
          <div className="flex gap-4 overflow-x-auto pb-3 pt-0.5 scrollbar-thin scrollbar-thumb-blue-200 dark:scrollbar-thumb-slate-800">
            {spotlightCandidates.map(group => {
              const maxScore = Math.max(...group.applications.map(getApplicationMatchScore));
              const allShortlisted = group.applications.every(a => a.status === "shortlisted");
              // Extract unique skills
              const uniqueSkills = Array.from(new Set(
                group.applications.flatMap(a => a.private_candidate_profiles?.skills || [])
              )).slice(0, 4);

              const screenerApp = group.applications.find(a => a.cover_note?.startsWith("[Screener]"));
              const screenerInfo = screenerApp ? parseCoverNote(screenerApp.cover_note) : null;

              return (
                <div 
                  key={group.applicant_email}
                  className="min-w-[310px] sm:min-w-[360px] bg-white dark:bg-gray-905 border border-gray-200 dark:border-gray-800/80 rounded-2xl p-4 shadow-sm hover:shadow-md hover:border-blue-300 dark:hover:border-blue-900 transition-all duration-300 flex flex-col justify-between"
                >
                  <div>
                    {/* Top Header inside Card */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-650 text-white font-black flex items-center justify-center text-lg shadow-md">
                            {group.applicant_name.charAt(0)}
                          </div>
                          <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[9px] font-black border-2 border-white dark:border-gray-900 shadow-sm">
                            ✓
                          </div>
                        </div>
                        <div>
                          <h4 className="font-extrabold text-sm text-gray-900 dark:text-white flex items-center gap-1.5 leading-none">
                            {group.applicant_name}
                          </h4>
                          <p className="text-[10px] text-gray-500 font-bold mt-1">
                            Applied to {group.applications.length} {group.applications.length === 1 ? "job" : "jobs"}
                          </p>
                        </div>
                      </div>
                      
                      {/* Dynamic Score Indicator */}
                      <span className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-[10px] font-black px-2.5 py-1 rounded-full shadow-sm shadow-emerald-500/20 border border-emerald-400 whitespace-nowrap">
                        🔥 {maxScore}% Match
                      </span>
                    </div>

                    {/* Target Roles */}
                    <div className="mt-3.5 space-y-1">
                      <p className="text-[9px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">
                        Target Openings
                      </p>
                      <div className="flex flex-wrap gap-1 mt-1 max-h-[44px] overflow-hidden">
                        {group.applications.map(app => (
                          <div key={app.id} className="inline-flex items-center gap-1 bg-gray-50 dark:bg-gray-800 border border-gray-150 dark:border-gray-700/60 rounded px-1.5 py-0.5 text-[10px] font-bold text-gray-700 dark:text-gray-300">
                            <span className="w-1 h-1 rounded-full bg-blue-500"></span>
                            {app.job_title}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Screener Details */}
                    {screenerInfo && (
                      <div className="mt-3.5 space-y-1">
                        <p className="text-[9px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">
                          Screener Responses
                        </p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          <span className="bg-gradient-to-r from-emerald-500/10 to-teal-500/10 dark:from-emerald-500/20 dark:to-teal-500/20 text-emerald-700 dark:text-emerald-300 text-[10px] font-black px-2 py-0.5 rounded border border-emerald-500/20 animate-pulse">
                            ⚡ High Intent
                          </span>
                          <span className="bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-450 text-[10px] font-bold px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-900/60">
                            Join: {screenerInfo.joining}
                          </span>
                          <span className="bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-450 text-[10px] font-bold px-2 py-0.5 rounded border border-blue-200 dark:border-blue-900/60">
                            Expected: {screenerInfo.salary}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Top Skills Tags */}
                    {uniqueSkills.length > 0 && (
                      <div className="mt-3">
                        <p className="text-[9px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">
                          Expertise
                        </p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {uniqueSkills.map(skill => (
                            <span key={skill} className="bg-blue-50/60 dark:bg-blue-900/10 text-blue-700 dark:text-blue-400 text-[10px] font-extrabold px-2 py-0.5 rounded border border-blue-100/50 dark:border-blue-900/20">
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Actions Section */}
                  <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {group.resume_url ? (
                        <a 
                          href={group.resume_url} target="_blank" rel="noopener noreferrer"
                          className="p-1.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg transition-colors border border-gray-250 dark:border-gray-700 shadow-sm"
                          title="View Resume"
                        >
                          <FileText className="w-4 h-4" />
                        </a>
                      ) : null}
                      <a 
                        href={`mailto:${group.applicant_email}`}
                        className="p-1.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-blue-600 dark:text-blue-400 rounded-lg transition-colors border border-gray-250 dark:border-gray-700 shadow-sm"
                        title="Email Candidate"
                      >
                        <Mail className="w-4 h-4" />
                      </a>
                      {group.applicant_phone && (
                        <>
                          <a 
                            href={`tel:${group.applicant_phone}`}
                            className="p-1.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-400 rounded-lg transition-colors border border-gray-250 dark:border-gray-700 shadow-sm"
                            title="Call Candidate"
                          >
                            <Phone className="w-4 h-4" />
                          </a>
                          <a 
                            href={`https://wa.me/${group.applicant_phone.replace(/[^0-9]/g, '')}`}
                            target="_blank" rel="noopener noreferrer"
                            className="p-1.5 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-900/20 dark:hover:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 rounded-lg transition-colors border border-emerald-200 dark:border-emerald-800 shadow-sm"
                            title="WhatsApp Candidate"
                          >
                            <MessageCircle className="w-4 h-4" />
                          </a>
                        </>
                      )}
                    </div>

                    <button
                      disabled={allShortlisted}
                      onClick={() => quickShortlistCandidate(group.applicant_email)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all flex items-center gap-1 ${
                        allShortlisted
                          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40"
                          : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm hover:shadow shadow-emerald-600/25"
                      }`}
                    >
                      {allShortlisted ? (
                        <>✓ Shortlisted</>
                      ) : (
                        <>⚡ Quick Shortlist</>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Search & Toggle Panel */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
            <Search className="h-4 w-4" />
          </div>
          <input
            type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, email, or job title..."
            className="w-full pl-11 pr-4 py-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm font-medium transition-all shadow-sm"
          />
        </div>

        {/* View Mode Toggle */}
        <div className="bg-gray-105 dark:bg-gray-800 p-1.5 rounded-2xl flex items-center gap-1 self-start md:self-auto shrink-0 border border-gray-200/50 dark:border-gray-700/50">
          <button
            onClick={() => setViewMode("job")}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-200 ${
              viewMode === "job"
                ? "bg-white dark:bg-gray-900 text-blue-650 dark:text-blue-400 shadow-sm"
                : "text-gray-500 hover:text-gray-950 dark:hover:text-gray-200"
            }`}
          >
            💼 Job View
          </button>
          <button
            onClick={() => setViewMode("candidate")}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-200 ${
              viewMode === "candidate"
                ? "bg-white dark:bg-gray-900 text-blue-650 dark:text-blue-400 shadow-sm"
                : "text-gray-500 hover:text-gray-950 dark:hover:text-gray-200"
            }`}
          >
            👥 Candidate View
          </button>
        </div>
      </div>

      {/* Applications Table */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden transition-all duration-300">
        {loading ? (
          <div className="p-12 text-center text-gray-500 font-bold">Loading applications...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 flex flex-col items-center text-gray-500">
            <Inbox className="h-12 w-12 text-gray-300 mb-3" />
            <p className="font-bold">No applications found</p>
            <p className="text-sm">When candidates apply via 1-Click Apply, they'll appear here instantly.</p>
          </div>
        ) : viewMode === "candidate" ? (
          // ─── CANDIDATE VIEW (Consolidated Accordion View) ───
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 dark:bg-gray-850">
                <tr>
                  <th className="px-5 py-4 text-xs font-black text-gray-500 uppercase tracking-wider">Candidate Details</th>
                  <th className="px-5 py-4 text-xs font-black text-gray-500 uppercase tracking-wider text-center">Applications</th>
                  <th className="px-5 py-4 text-xs font-black text-gray-500 uppercase tracking-wider text-center">Resume</th>
                  <th className="px-5 py-4 text-xs font-black text-gray-500 uppercase tracking-wider text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {candidateGroups.map((group) => {
                  const isExpanded = expandedCandidate === group.applicant_email;
                  const screenerApp = group.applications.find(a => a.cover_note?.startsWith("[Screener]"));
                  const groupScreenerInfo = screenerApp ? parseCoverNote(screenerApp.cover_note) : null;
                  return (
                    <tr key={group.applicant_email} className="hover:bg-slate-50/10 dark:hover:bg-slate-800/10 transition-colors">
                      <td colSpan={4} className="p-0">
                        <div 
                          className="flex items-center justify-between px-5 py-4 cursor-pointer select-none"
                          onClick={() => setExpandedCandidate(isExpanded ? null : group.applicant_email)}
                        >
                          {/* Left: Details */}
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-black flex items-center justify-center shrink-0 border border-blue-200/50 dark:border-blue-800/50 text-base shadow-sm">
                              {group.applicant_name.charAt(0)}
                            </div>
                            <div className="min-w-0">
                              {(() => {
                                const maxScore = Math.max(...group.applications.map(getApplicationMatchScore));
                                return (
                                  <p className="text-sm font-extrabold text-gray-950 dark:text-white flex items-center gap-2 flex-wrap leading-tight">
                                    {group.applicant_name}
                                    {maxScore > 0 && (
                                      <span className={`inline-flex items-center gap-0.5 text-[9px] font-black px-2 py-0.5 rounded-full border ${
                                        maxScore >= 80
                                          ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white border-emerald-400 shadow-sm shadow-emerald-500/20 animate-pulse"
                                          : maxScore >= 50
                                          ? "bg-gradient-to-r from-blue-500 to-indigo-500 text-white border-blue-400 shadow-sm"
                                          : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700"
                                      }`}>
                                        {maxScore >= 80 ? "🔥 Top Candidate" : "⚡ Match"}: {maxScore}%
                                      </span>
                                    )}
                                  </p>
                                );
                              })()}
                              <div className="flex flex-col sm:flex-row sm:items-center gap-x-3 gap-y-0.5 mt-1 text-xs">
                                <a 
                                  href={`mailto:${group.applicant_email}`} 
                                  className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                                  onClick={e => e.stopPropagation()}
                                >
                                  <Mail className="w-3.5 h-3.5 shrink-0" /> {group.applicant_email}
                                </a>
                                {group.applicant_phone && (
                                  <a 
                                    href={`tel:${group.applicant_phone}`} 
                                    className="text-gray-550 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-250 flex items-center gap-1"
                                    onClick={e => e.stopPropagation()}
                                  >
                                    <Phone className="w-3.5 h-3.5 shrink-0" /> {group.applicant_phone}
                                  </a>
                                )}
                              </div>
                              {groupScreenerInfo && (
                                <div className="flex flex-wrap gap-1 mt-2">
                                  <span className="bg-gradient-to-r from-emerald-500/10 to-teal-500/10 dark:from-emerald-500/20 dark:to-teal-500/20 text-emerald-700 dark:text-emerald-300 text-[9px] font-black px-1.5 py-0.5 rounded border border-emerald-500/20">
                                    ⚡ High Intent
                                  </span>
                                  <span className="bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-455 text-[9px] font-bold px-1.5 py-0.5 rounded border border-emerald-200 dark:border-emerald-900/60">
                                    Join: {groupScreenerInfo.joining}
                                  </span>
                                  <span className="bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-455 text-[9px] font-bold px-1.5 py-0.5 rounded border border-blue-200 dark:border-blue-900/60">
                                    Expected: {groupScreenerInfo.salary}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Middle 1: Applications Badge */}
                          <div className="px-5 text-center shrink-0">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-sm shadow-blue-500/20 border border-blue-400/20">
                              📄 {group.applications.length} Applications
                            </span>
                          </div>

                          {/* Middle 2: Resume */}
                          <div className="px-5 text-center shrink-0" onClick={e => e.stopPropagation()}>
                            {group.resume_url ? (
                              <a href={group.resume_url} target="_blank" rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-950 dark:bg-white text-white dark:text-gray-950 rounded-lg text-xs font-black hover:bg-gray-800 transition-colors shadow-sm"
                              >
                                <FileText className="w-3.5 h-3.5" /> View CV
                              </a>
                            ) : (
                              <span className="text-xs text-gray-400 font-bold">No Resume</span>
                            )}
                          </div>

                          {/* Right: Expand Arrow */}
                          <div className="text-right shrink-0">
                            <span className="inline-flex items-center gap-1 bg-blue-50 dark:bg-blue-900/20 px-3 py-1.5 rounded-lg border border-blue-100 dark:border-blue-800 text-xs font-black text-blue-700 dark:text-blue-400">
                              {isExpanded ? "Hide Details ▴" : "Show Details ▾"}
                            </span>
                          </div>
                        </div>

                        {/* Accordion Expansion Container */}
                        {isExpanded && (
                          <div className="px-5 pb-5 pt-1 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-slate-900/30">
                            <div className="bg-white dark:bg-gray-905 border border-gray-200 dark:border-gray-800 rounded-2xl p-4 shadow-sm overflow-hidden animate-fade-in">
                              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">
                                Application Log
                              </p>
                              
                              <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                  <thead>
                                    <tr className="border-b border-gray-100 dark:border-gray-800 text-[10px] uppercase font-black tracking-wider text-gray-400 dark:text-gray-500">
                                      <th className="py-2 px-3">Job Applied</th>
                                      <th className="py-2 px-3 text-center">Applied Date</th>
                                      <th className="py-2 px-3 text-center">Match</th>
                                      <th className="py-2 px-3">Cover Note</th>
                                      <th className="py-2 px-3 text-center">Status</th>
                                      <th className="py-2 px-3 text-right">Update</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-gray-50 dark:divide-gray-800/80">
                                    {group.applications.map((app) => (
                                      <tr key={app.id} className="hover:bg-slate-50/20 dark:hover:bg-slate-800/20 text-xs transition-colors">
                                        <td className="py-3 px-3">
                                          <p className="font-extrabold text-gray-900 dark:text-white flex items-center gap-1">
                                            <Briefcase className="w-3.5 h-3.5 text-gray-400 shrink-0" /> {app.job_title}
                                          </p>
                                          <p className="text-[10px] font-bold text-gray-500 flex items-center gap-1 mt-0.5">
                                            <Building className="w-3 h-3 shrink-0" /> {app.company_name}
                                          </p>
                                        </td>
                                        <td className="py-3 px-3 text-center font-bold text-gray-550 dark:text-gray-450 whitespace-nowrap">
                                          {new Date(app.created_at).toLocaleDateString("en-IN", {
                                            day: "numeric",
                                            month: "short",
                                            year: "numeric"
                                          })}
                                        </td>
                                        <td className="py-3 px-3 text-center whitespace-nowrap">
                                          {(() => {
                                            const score = getApplicationMatchScore(app);
                                            return (
                                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black border ${
                                                score >= 80
                                                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800"
                                                  : score >= 50
                                                  ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800"
                                                  : "bg-gray-100 text-gray-700 dark:bg-gray-800/30 dark:text-gray-405 border-gray-200 dark:border-gray-800"
                                              }`}>
                                                ⚡ {score}%
                                              </span>
                                            );
                                          })()}
                                        </td>
                                        <td className="py-3 px-3 text-gray-600 dark:text-gray-400 italic max-w-xs" title={app.cover_note || ""}>
                                          {(() => {
                                            const { joining, salary, message } = parseCoverNote(app.cover_note);
                                            return (
                                              <div className="space-y-1">
                                                {message ? (
                                                  <p className="truncate">"{message}"</p>
                                                ) : (
                                                  <span className="text-gray-350">—</span>
                                                )}
                                                {joining && salary && (
                                                  <div className="flex flex-wrap gap-1 mt-1">
                                                    <span className="bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 text-[9px] font-extrabold px-1.5 py-0.5 rounded border border-emerald-250 dark:border-emerald-900">
                                                      Join: {joining}
                                                    </span>
                                                    <span className="bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-400 text-[9px] font-extrabold px-1.5 py-0.5 rounded border border-blue-250 dark:border-blue-900">
                                                      Expected: {salary}
                                                    </span>
                                                  </div>
                                                )}
                                              </div>
                                            );
                                          })()}
                                        </td>
                                        <td className="py-3 px-3 text-center whitespace-nowrap">
                                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black border ${STATUS_STYLES[app.status].classes}`}>
                                            {STATUS_STYLES[app.status].label}
                                          </span>
                                        </td>
                                        
                                        <td className="py-3 px-3 text-right whitespace-nowrap" onClick={e => e.stopPropagation()}>
                                          <select
                                            value={app.status}
                                            onChange={e => updateStatus(app.id, e.target.value as Application["status"])}
                                            className="text-[11px] font-bold bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1 outline-none cursor-pointer focus:ring-2 focus:ring-blue-500/20"
                                          >
                                            <option value="new">Mark: New</option>
                                            <option value="contacted">Mark: Contacted</option>
                                            <option value="shortlisted">Mark: Shortlisted</option>
                                            <option value="rejected">Mark: Rejected</option>
                                          </select>
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          // ─── JOB VIEW (Standard Table Row-by-Row View) ───
          <div className="overflow-x-auto animate-fade-in">
            <table className="w-full text-left">
              <thead className="bg-gray-50 dark:bg-gray-800/50">
                <tr>
                  <th className="px-5 py-4 text-xs font-black text-gray-500 uppercase tracking-wider">Candidate</th>
                  <th className="px-5 py-4 text-xs font-black text-gray-500 uppercase tracking-wider">Applied For</th>
                  <th className="px-5 py-4 text-xs font-black text-gray-500 uppercase tracking-wider text-center">Match</th>
                  <th className="px-5 py-4 text-xs font-black text-gray-500 uppercase tracking-wider text-center">Resume</th>
                  <th className="px-5 py-4 text-xs font-black text-gray-500 uppercase tracking-wider text-center">Status</th>
                  <th className="px-5 py-4 text-xs font-black text-gray-500 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {filteredSorted.map(app => (
                  <tr key={app.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                    {/* Candidate */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-black flex items-center justify-center shrink-0">
                          {app.applicant_name.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-extrabold text-gray-900 dark:text-white flex items-center gap-2 flex-wrap">
                            {app.applicant_name}
                            {app.cover_note?.startsWith("[Screener]") && (
                              <span className="bg-gradient-to-r from-emerald-500/10 to-teal-500/10 dark:from-emerald-500/20 dark:to-teal-500/20 text-emerald-700 dark:text-emerald-300 text-[9px] font-black px-1.5 py-0.5 rounded border border-emerald-500/20">
                                ⚡ High Intent
                              </span>
                            )}
                          </p>
                          <div className="flex flex-col sm:flex-row sm:items-center gap-x-2 gap-y-0.5 text-xs">
                            <a href={`mailto:${app.applicant_email}`} className="text-blue-600 hover:underline flex items-center gap-1">
                              <Mail className="w-3.5 h-3.5 shrink-0" /> {app.applicant_email}
                            </a>
                            {app.applicant_phone && (
                              <a href={`tel:${app.applicant_phone}`} className="text-gray-505 dark:text-gray-400 hover:text-gray-700 flex items-center gap-1">
                                <Phone className="w-3.5 h-3.5 shrink-0" /> {app.applicant_phone}
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                      {(() => {
                        const { joining, salary, message } = parseCoverNote(app.cover_note);
                        return (
                          <div className="pl-12 mt-2">
                            {joining && salary && (
                              <div className="flex flex-wrap gap-1 mb-1.5">
                                <span className="bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-450 text-[10px] font-bold px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-900/60">
                                  Join: {joining}
                                </span>
                                <span className="bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-455 text-[10px] font-bold px-2 py-0.5 rounded border border-blue-200 dark:border-blue-900/60">
                                  Expected: {salary}
                                </span>
                              </div>
                            )}
                            {message && (
                              <p className="text-xs text-gray-500 italic line-clamp-2">"{message}"</p>
                            )}
                          </div>
                        );
                      })()}
                    </td>

                    {/* Job */}
                    <td className="px-5 py-4">
                      <p className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-1">
                        <Briefcase className="w-3.5 h-3.5 text-gray-400" /> {app.job_title}
                      </p>
                      <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                        <Building className="w-3 h-3" /> {app.company_name}
                      </p>
                      <p className="text-[11px] text-gray-400 flex items-center gap-1 mt-1">
                        <Clock className="w-3 h-3" /> {new Date(app.created_at).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
                      </p>
                    </td>

                    {/* Match Score */}
                    <td className="px-5 py-4 text-center whitespace-nowrap">
                      {(() => {
                        const score = getApplicationMatchScore(app);
                        return (
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-black border ${
                            score >= 80
                              ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white border-emerald-400 shadow-sm shadow-emerald-500/25 animate-pulse"
                              : score >= 50
                              ? "bg-gradient-to-r from-blue-500 to-indigo-500 text-white border-blue-400 shadow-sm"
                              : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700"
                          }`}>
                            ⚡ {score}% Match
                          </span>
                        );
                      })()}
                    </td>

                    {/* Resume */}
                    <td className="px-5 py-4 text-center">
                      {app.resume_url ? (
                        <a href={app.resume_url} target="_blank" rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg text-xs font-bold hover:bg-gray-700 transition-colors"
                        >
                          <FileText className="w-3.5 h-3.5" /> View CV
                        </a>
                      ) : (
                        <span className="text-xs text-gray-400 font-medium">Not uploaded</span>
                      )}
                    </td>

                    {/* Status Badge */}
                    <td className="px-5 py-4 text-center">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-black border ${STATUS_STYLES[app.status].classes}`}>
                        {STATUS_STYLES[app.status].label}
                      </span>
                    </td>

                    {/* Action Dropdown */}
                    <td className="px-5 py-4 text-right">
                      <select
                        value={app.status}
                        onChange={e => updateStatus(app.id, e.target.value as Application["status"])}
                        className="text-xs font-bold bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1.5 outline-none cursor-pointer focus:ring-2 focus:ring-blue-500/20"
                      >
                        <option value="new">Mark: New</option>
                        <option value="contacted">Mark: Contacted</option>
                        <option value="shortlisted">Mark: Shortlisted</option>
                        <option value="rejected">Mark: Rejected</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
