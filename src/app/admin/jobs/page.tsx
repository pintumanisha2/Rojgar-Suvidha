"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import {
  PlusCircle, Search, Pencil, Trash2, Eye,
  Briefcase, Loader2, AlertCircle, CheckCircle2,
  Clock, Zap, Image as ImageIcon, Building, ShieldCheck, Check, XCircle
} from "lucide-react";

const STATUS_STYLES: Record<string, string> = {
  active:  "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  out:     "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  last:    "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  soon:    "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  pending_approval: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  closed:  "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
};

function AdminJobsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Determine current active tab from query param (sarkari vs private)
  const currentTab = searchParams.get("type") === "private" ? "private" : "sarkari";

  const [jobs, setJobs] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<Record<string, any>>({});
  const [employers, setEmployers] = useState<any[]>([]);
  const [privateSubTab, setPrivateSubTab] = useState<"jobs" | "recruiters">("jobs");
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  
  // Sarkari Filters
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [stateFilter, setStateFilter] = useState("all");
  
  // Private Filters
  const [statusFilter, setStatusFilter] = useState("all");

  const [deleteId, setDeleteId] = useState<string | null>(null);

  const loadMockEmployers = () => {
    const mockId = "demo-employer-id";
    const localGST = localStorage.getItem("rs_employer_mock_gst") || "27AADCS4120F1ZX";
    const localPhone = localStorage.getItem("rs_employer_mock_phone") || "+91 98765 43210";
    const localVerified = localStorage.getItem("rs_employer_mock_verified") === "true";
    const localCompName = localStorage.getItem("rs_employer_mock_company") || "Aspirants Adda Partner";
    const localHrName = localStorage.getItem("rs_employer_mock_hr") || "Recruitment Manager";
    const localWebsite = "https://aspirantsadda.com";
    const localEmail = "demo@rojgarsuvidha.com";

    const mockEmployer = {
      id: mockId,
      company_name: localCompName,
      hr_name: localHrName,
      email: localEmail,
      website: localWebsite,
      phone: localPhone,
      gst_number: localGST,
      is_verified: localVerified
    };

    setEmployers([mockEmployer]);
    setProfiles({ [mockId]: mockEmployer });
  };

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const { data: jobsData } = await supabase
        .from("jobs")
        .select("id, title, category, status, state_code, created_at, slug, banner_url, employer_id, salary")
        .order("created_at", { ascending: false });
      
      if (jobsData) setJobs(jobsData);
      
      try {
        const { data: profilesData } = await supabase
          .from("employer_profiles")
          .select("id, company_name, hr_name, email, website, phone, gst_number, is_verified");
        
        if (profilesData && profilesData.length > 0) {
          setEmployers(profilesData);
          const profMap: Record<string, any> = {};
          profilesData.forEach((p: any) => {
            profMap[p.id] = p;
          });
          setProfiles(profMap);
        } else {
          loadMockEmployers();
        }
      } catch (profErr) {
        console.warn("Could not fetch employer profiles, using fallback:", profErr);
        loadMockEmployers();
      }
    } catch (error) {
      console.error("Error fetching jobs:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this post? This cannot be undone.")) return;
    setDeleteId(id);
    await supabase.from("jobs").delete().eq("id", id);
    setDeleteId(null);
    fetchJobs();
  };

  const handleApproveJob = async (id: string) => {
    try {
      const { error } = await supabase
        .from("jobs")
        .update({ status: "active" })
        .eq("id", id);
      if (error) throw error;
      
      setJobs(prev => prev.map(j => j.id === id ? { ...j, status: "active" } : j));
    } catch (err) {
      console.error("Failed to approve job:", err);
      alert("Failed to approve job. Please try again.");
    }
  };

  const handleCloseJob = async (id: string) => {
    if (!confirm("Are you sure you want to close this job opening? Candidates won't be able to apply anymore.")) return;
    try {
      const { error } = await supabase
        .from("jobs")
        .update({ status: "closed" })
        .eq("id", id);
      if (error) throw error;
      
      setJobs(prev => prev.map(j => j.id === id ? { ...j, status: "closed" } : j));
    } catch (err) {
      console.error("Failed to close job:", err);
      alert("Failed to close job. Please try again.");
    }
  };

  const handleVerifyEmployer = async (id: string, verify: boolean) => {
    try {
      const { error } = await supabase
        .from("employer_profiles")
        .update({ is_verified: verify })
        .eq("id", id);
      if (error) throw error;
    } catch (err) {
      console.warn("Could not update employer verification in Supabase. Simulating via localStorage:", err);
    }
    
    // Save locally
    localStorage.setItem("rs_employer_mock_verified", verify ? "true" : "false");
    
    // Update local state
    setEmployers(prev => prev.map(emp => emp.id === id ? { ...emp, is_verified: verify } : emp));
    setProfiles(prev => {
      const updated = { ...prev };
      if (updated[id]) {
        updated[id] = { ...updated[id], is_verified: verify };
      }
      return updated;
    });

    alert(verify ? "Company has been verified successfully! They can now post jobs." : "Company verification has been revoked.");
  };

  const handleTabChange = (tab: "sarkari" | "private") => {
    router.push(`/admin/jobs?type=${tab}`);
  };

  // Segregate jobs strictly
  const sarkariJobs = jobs.filter(j => j.category !== "private-jobs");
  const privateJobs = jobs.filter(j => j.category === "private-jobs");

  // Filtering Sarkari
  const filteredSarkari = sarkariJobs.filter(j => {
    const matchesSearch = j.title?.toLowerCase().includes(search.toLowerCase()) || j.category?.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter === "all" || j.category === categoryFilter;
    const matchesState = stateFilter === "all" || (stateFilter === "central" ? !j.state_code : j.state_code === stateFilter);
    return matchesSearch && matchesCategory && matchesState;
  });

  // Filtering Private
  const filteredPrivate = privateJobs.filter(j => {
    const matchesSearch = j.title?.toLowerCase().includes(search.toLowerCase()) || 
                          !!(profiles[j.employer_id]?.company_name?.toLowerCase().includes(search.toLowerCase()));
    const matchesStatus = statusFilter === "all" || j.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
            {currentTab === "sarkari" ? "🏛️ Govt Jobs (Sarkari)" : "💼 Private Sector Vetting"}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            {currentTab === "sarkari" 
              ? `${sarkariJobs.length} Sarkari posts managed` 
              : `${privateJobs.length} recruiter listings pending/active`
            }
          </p>
        </div>
        <a
          href="/admin/jobs/new"
          className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-5 py-2.5 rounded-xl shadow-sm transition-colors text-sm"
        >
          <PlusCircle className="h-5 w-5" />
          Add New Job Post
        </a>
      </div>

      {/* Modern High-End Selector Tabs */}
      <div className="flex bg-gray-50 dark:bg-gray-800/60 p-1 rounded-2xl border border-gray-200/50 dark:border-gray-800 max-w-md">
        <button
          onClick={() => handleTabChange("sarkari")}
          className={`flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 ${
            currentTab === "sarkari"
              ? "bg-white dark:bg-gray-700 text-indigo-600 dark:text-white shadow-sm"
              : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
          }`}
        >
          🏛️ Sarkari Govt Portal ({sarkariJobs.length})
        </button>
        <button
          onClick={() => handleTabChange("private")}
          className={`flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 ${
            currentTab === "private"
              ? "bg-white dark:bg-gray-700 text-indigo-600 dark:text-white shadow-sm"
              : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
          }`}
        >
          💼 Recruiter Private ({privateJobs.length})
        </button>
      </div>

      {/* Sarkari Filters Desk */}
      {currentTab === "sarkari" ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search government exams..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <select
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
            className="w-full px-4 py-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">All Sarkari Categories</option>
            <option value="latest-jobs">Latest Jobs</option>
            <option value="results">Results</option>
            <option value="admit-card">Admit Card</option>
            <option value="answer-key">Answer Key</option>
            <option value="admission">Admission</option>
            <option value="news">News & Updates</option>
          </select>
          <select
            value={stateFilter}
            onChange={e => setStateFilter(e.target.value)}
            className="w-full px-4 py-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">All States</option>
            <option value="central">Central / All India</option>
            <option value="UP">Uttar Pradesh</option>
            <option value="BR">Bihar</option>
            <option value="MP">Madhya Pradesh</option>
            <option value="DL">Delhi</option>
            <option value="RJ">Rajasthan</option>
            <option value="HR">Haryana</option>
          </select>
        </div>
      ) : (
        /* Private Sector Segments & Filters Desk */
        <div className="space-y-4">
          {/* Sub-selector for jobs vs recruiters */}
          <div className="flex gap-3 border-b border-gray-100 dark:border-gray-800 pb-1">
            <button
              onClick={() => setPrivateSubTab("jobs")}
              className={`pb-2.5 text-sm font-extrabold px-1 transition-all border-b-2 ${
                privateSubTab === "jobs"
                  ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
                  : "border-transparent text-gray-400 hover:text-gray-600"
              }`}
            >
              📝 Vetting Job Openings ({privateJobs.length})
            </button>
            <button
              onClick={() => setPrivateSubTab("recruiters")}
              className={`pb-2.5 text-sm font-extrabold px-1 transition-all border-b-2 ${
                privateSubTab === "recruiters"
                  ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
                  : "border-transparent text-gray-400 hover:text-gray-600"
              }`}
            >
              🏢 Recruiter Verification Desk ({employers.length})
            </button>
          </div>

          {privateSubTab === "jobs" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search private jobs or company..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full pl-11 pr-4 py-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="w-full px-4 py-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="all">All Vetting Statuses</option>
                <option value="pending_approval">Pending Vetting (Approval Needed) ⏳</option>
                <option value="active">Live Active 🟢</option>
                <option value="closed">Closed / Archived ❌</option>
              </select>
            </div>
          ) : (
            <div className="relative max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Search registered recruiters..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-11 pr-4 py-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          )}
        </div>
      )}

      {/* Main List Rendering */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
          </div>
        ) : currentTab === "private" && privateSubTab === "recruiters" ? (
          (() => {
            const filteredEmployers = employers.filter(emp => {
              return emp.company_name?.toLowerCase().includes(search.toLowerCase()) || 
                     emp.hr_name?.toLowerCase().includes(search.toLowerCase()) || 
                     emp.email?.toLowerCase().includes(search.toLowerCase());
            });
            
            return filteredEmployers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-gray-400 dark:text-gray-500">
                <Building className="h-12 w-12 mb-3 opacity-30" />
                <p className="font-semibold text-sm">No recruiters found matching your parameters.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800">
                    <tr>
                      <th className="px-5 py-3 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Company & HR Details</th>
                      <th className="px-5 py-3 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden md:table-cell">Business Credentials</th>
                      <th className="px-5 py-3 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden sm:table-cell">Verification Status</th>
                      <th className="px-5 py-3 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-right">Vetting Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                    {filteredEmployers.map((emp) => (
                      <tr key={emp.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                        <td className="px-5 py-4">
                          <div className="space-y-1">
                            <span className="font-extrabold text-gray-900 dark:text-white block">{emp.company_name}</span>
                            <span className="text-xs text-gray-500 dark:text-gray-400 block">HR: {emp.hr_name} | {emp.email}</span>
                            {emp.website && (
                              <a href={emp.website} target="_blank" rel="noreferrer" className="text-[10px] text-indigo-500 hover:underline font-bold block">
                                🌐 {emp.website}
                              </a>
                            )}
                          </div>
                        </td>
                        <td className="px-5 py-4 font-semibold">
                          <div className="space-y-1">
                            <span className="text-xs text-gray-600 dark:text-gray-400 block">
                              🆔 GSTIN/CIN: <span className="font-mono font-bold text-gray-800 dark:text-gray-200">{emp.gst_number || "Not Provided ⚠️"}</span>
                            </span>
                            <span className="text-xs text-gray-600 dark:text-gray-400 block">
                              📞 Phone: <span className="font-bold text-gray-800 dark:text-gray-200">{emp.phone || "Not Provided ⚠️"}</span>
                            </span>
                          </div>
                        </td>
                        <td className="px-5 py-4 hidden sm:table-cell">
                          {emp.is_verified ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2.5 py-1 rounded-md bg-green-50 text-green-700 border border-green-200 uppercase tracking-wide">
                              Verified 🟢
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2.5 py-1 rounded-md bg-amber-50 text-amber-600 border border-amber-200 uppercase tracking-wide">
                              Pending Vetting ⏳
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-4 text-right">
                          {emp.is_verified ? (
                            <button
                              onClick={() => handleVerifyEmployer(emp.id, false)}
                              className="text-xs font-bold bg-red-50 text-red-500 hover:bg-red-100 px-3.5 py-1.5 rounded-lg border border-red-200/50 transition-colors"
                            >
                              Revoke Verification
                            </button>
                          ) : (
                            <button
                              onClick={() => handleVerifyEmployer(emp.id, true)}
                              className="text-xs font-bold bg-green-50 text-green-600 hover:bg-green-100 px-3.5 py-1.5 rounded-lg border border-green-200/50 transition-colors shadow-sm"
                            >
                              Verify & Approve Business 🟢
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          })()
        ) : (currentTab === "sarkari" ? filteredSarkari : filteredPrivate).length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400 dark:text-gray-500">
            <Briefcase className="h-12 w-12 mb-3 opacity-30" />
            <p className="font-semibold text-sm">No postings found matching your parameters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800">
                {currentTab === "sarkari" ? (
                  /* Sarkari Headers */
                  <tr>
                    <th className="px-5 py-3 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Exam Title</th>
                    <th className="px-5 py-3 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden md:table-cell">Category & State</th>
                    <th className="px-5 py-3 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden sm:table-cell">Status</th>
                    <th className="px-5 py-3 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-right">Actions</th>
                  </tr>
                ) : (
                  /* Private Headers */
                  <tr>
                    <th className="px-5 py-3 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">MNC Role & Recruiter</th>
                    <th className="px-5 py-3 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden md:table-cell">Workplace & Salary</th>
                    <th className="px-5 py-3 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden sm:table-cell">Vetting Status</th>
                    <th className="px-5 py-3 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-right">Safety Approval Desk</th>
                  </tr>
                )}
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                {/* 1. Sarkari Render Loop */}
                {currentTab === "sarkari" && filteredSarkari.map((job) => (
                  <tr key={job.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-20 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800 shrink-0 border border-gray-100 dark:border-gray-800">
                          {job.banner_url ? (
                            <img src={job.banner_url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-300">
                              <ImageIcon className="h-5 w-5" />
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900 dark:text-white line-clamp-2 max-w-xs">{job.title}</p>
                          <p className="text-xs text-gray-400 mt-1">{new Date(job.created_at).toLocaleDateString("en-IN")}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 hidden md:table-cell">
                      <div className="flex flex-col gap-1">
                        <span className="text-sm text-gray-600 dark:text-gray-400 capitalize font-semibold">{job.category?.replace("-", " ") || "—"}</span>
                        <span className="text-xs text-indigo-500 dark:text-indigo-400 font-bold">{job.state_code || "Central"}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 hidden sm:table-cell">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold capitalize ${STATUS_STYLES[job.status] || "bg-gray-100 text-gray-600"}`}>
                        {job.status}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/job/${job.slug || job.id}`}
                          target="_blank"
                          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 transition-colors"
                          title="View Live"
                        >
                          <Eye className="h-4 w-4" />
                        </Link>
                        <a
                          href={`/admin/jobs/${job.id}`}
                          className="p-2 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 transition-colors"
                          title="Edit"
                        >
                          <Pencil className="h-4 w-4" />
                        </a>
                        <button
                          onClick={() => handleDelete(job.id)}
                          disabled={deleteId === job.id}
                          className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 dark:text-red-400 transition-colors disabled:opacity-50"
                          title="Delete"
                        >
                          {deleteId === job.id
                            ? <Loader2 className="h-4 w-4 animate-spin" />
                            : <Trash2 className="h-4 w-4" />
                          }
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {/* 2. Private Render Loop */}
                {currentTab === "private" && filteredPrivate.map((job) => {
                  const company = profiles[job.employer_id]?.company_name || "Self-Posted Recruiter";
                  const hr = profiles[job.employer_id]?.hr_name || "Verification Manager";
                  
                  return (
                    <tr key={job.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 border border-indigo-100 dark:border-indigo-900/40">
                            <Building className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-gray-900 dark:text-white line-clamp-1">{job.title}</p>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="text-xs text-gray-500 font-medium">{company}</span>
                              <span className="text-[10px] text-gray-400">•</span>
                              <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">HR: {hr}</span>
                            </div>
                          </div>
                        </div>
                      </td>
                      
                      <td className="px-5 py-4 hidden md:table-cell">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">🏡 {job.state_code || "Remote"}</span>
                          <span className="text-xs font-bold text-emerald-600">{job.salary || "₹25,000 / month"}</span>
                        </div>
                      </td>

                      <td className="px-5 py-4 hidden sm:table-cell">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold capitalize ${STATUS_STYLES[job.status] || "bg-gray-100 text-gray-600"}`}>
                          {job.status === "pending_approval" ? "⏳ Pending Review" : job.status === "active" ? "🟢 Live Active" : "❌ Closed"}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex items-center justify-end gap-2.5">
                          {/* Approve trigger */}
                          {job.status === "pending_approval" && (
                            <button
                              onClick={() => handleApproveJob(job.id)}
                              className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-1.5 rounded-lg text-xs transition-colors shadow-sm animate-pulse"
                              title="Verify and Approve"
                            >
                              <Check className="h-3.5 w-3.5" /> Approve & Go Live
                            </button>
                          )}

                          {/* Close trigger */}
                          {job.status === "active" && (
                            <button
                              onClick={() => handleCloseJob(job.id)}
                              className="inline-flex items-center gap-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200/60 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-800/40 font-bold px-3 py-1.5 rounded-lg text-xs transition-colors"
                              title="Close Vacancy"
                            >
                              <XCircle className="h-3.5 w-3.5" /> Close Opening
                            </button>
                          )}

                          {/* View Live */}
                          <Link
                            href={`/job/${job.slug || job.id}`}
                            target="_blank"
                            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 transition-colors"
                            title="Preview Public Page"
                          >
                            <Eye className="h-4 w-4" />
                          </Link>

                          {/* Edit Details */}
                          <a
                            href={`/admin/jobs/${job.id}`}
                            className="p-2 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 transition-colors"
                            title="Edit"
                          >
                            <Pencil className="h-4 w-4" />
                          </a>

                          {/* Delete entirely */}
                          <button
                            onClick={() => handleDelete(job.id)}
                            disabled={deleteId === job.id}
                            className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 dark:text-red-400 transition-colors disabled:opacity-50"
                            title="Delete"
                          >
                            {deleteId === job.id
                              ? <Loader2 className="h-4 w-4 animate-spin" />
                              : <Trash2 className="h-4 w-4" />
                            }
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Recruiter instructions indicator */}
      {currentTab === "private" && (
        <div className="bg-indigo-50/50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-800/40 rounded-2xl p-4 flex gap-3 text-xs sm:text-sm text-indigo-700 dark:text-indigo-400">
          <ShieldCheck className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-bold block">Safety Guideline Checklist for Admins</span>
            <span>Kisi bhi job ko approve karne se pehle verify karein ki recruiter ne direct apply link or contact email diya hai. Direct job application verification 100% spam-free honi chahiye.</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminJobsPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
      </div>
    }>
      <AdminJobsContent />
    </Suspense>
  );
}
