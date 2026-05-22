"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { 
  Briefcase, CheckCircle, XCircle, Search, 
  MapPin, DollarSign, Star, Clock, AlertTriangle, ExternalLink,
  Image as ImageIcon, Upload, X, Plus
} from "lucide-react";
import CompanyLogo from "@/components/layout/CompanyLogo";
import Link from "next/link";

export default function PrivateJobsModerationPage() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "published" | "rejected">("all");
  
  const [editingJob, setEditingJob] = useState<any | null>(null);
  const [editLogoUrl, setEditLogoUrl] = useState("");
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);

  const handleOpenEditLogo = (job: any) => {
    setEditingJob(job);
    setEditLogoUrl(job.company_logo || "");
  };

  const handleUploadLogoForEdit = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingLogo(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `company-logos/${Date.now()}.${fileExt}`;
      const { data, error } = await supabase.storage
        .from("blog_images")
        .upload(fileName, file);

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from("blog_images")
        .getPublicUrl(fileName);

      setEditLogoUrl(publicUrl);
    } catch (err: any) {
      console.error("Logo upload error:", err);
      alert("Logo upload failed: " + err.message);
    } finally {
      setIsUploadingLogo(false);
    }
  };

  const handleSaveLogo = async () => {
    if (!editingJob) return;
    try {
      const { error } = await supabase
        .from("private_jobs")
        .update({ company_logo: editLogoUrl || null })
        .eq("id", editingJob.id);

      if (error) throw error;

      setJobs(prev => prev.map(job => job.id === editingJob.id ? { ...job, company_logo: editLogoUrl || null } : job));
      setEditingJob(null);
      setEditLogoUrl("");
    } catch (err: any) {
      console.error("Error saving logo:", err);
      alert("Failed to save logo: " + err.message);
    }
  };

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("private_jobs")
        .select(`*, employer:employer_id (company_name, is_verified)`)
        .order("created_at", { ascending: false });

      if (data && data.length > 0) {
        setJobs(data);
      } else {
        // Fallback Mock Data for UI Testing if DB is empty
        setJobs([
          { id: 'j1', title: 'Senior React Developer', employer: { company_name: 'TechNova Solutions', is_verified: true }, location: 'Remote / Bangalore', salary: '₹18,00,000 - ₹24,00,000', status: 'pending', is_featured: false, created_at: new Date().toISOString() },
          { id: 'j2', title: 'HR Manager', employer: { company_name: 'Global Finance Corp', is_verified: true }, location: 'Mumbai, MH', salary: '₹8,00,000 - ₹12,00,000', status: 'published', is_featured: true, created_at: new Date(Date.now() - 86400000).toISOString() },
          { id: 'j3', title: 'Data Entry Operator', employer: { company_name: 'SpammyCorp', is_verified: false }, location: 'Delhi', salary: '₹1,00,000', status: 'pending', is_featured: false, created_at: new Date(Date.now() - 172800000).toISOString() },
        ]);
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

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from("private_jobs")
        .update({ status: newStatus })
        .eq("id", id);
      
      setJobs(prev => prev.map(job => job.id === id ? { ...job, status: newStatus } : job));
    } catch (err) {
      setJobs(prev => prev.map(job => job.id === id ? { ...job, status: newStatus } : job));
    }
  };

  const handleToggleFeature = async (id: string, currentFeatured: boolean) => {
    try {
      const { error } = await supabase
        .from("private_jobs")
        .update({ is_featured: !currentFeatured })
        .eq("id", id);
      
      setJobs(prev => prev.map(job => job.id === id ? { ...job, is_featured: !currentFeatured } : job));
    } catch (err) {
      setJobs(prev => prev.map(job => job.id === id ? { ...job, is_featured: !currentFeatured } : job));
    }
  };

  const filteredJobs = jobs.filter(job => {
    const matchesSearch = job.title?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          job.employer?.company_name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || job.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-2">
            <Briefcase className="h-6 w-6 text-indigo-500" /> Private Jobs Moderation
          </h2>
          <p className="text-sm text-gray-500 font-medium mt-1">Review, approve, feature, and add new private job postings.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
          <Link 
            href="/admin/private-portal/jobs/add"
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold transition-all shadow-sm shadow-indigo-600/20 whitespace-nowrap"
          >
            <Plus className="w-4 h-4" /> Add New Job
          </Link>
          <div className="relative w-full sm:w-64">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
              <Search className="h-4 w-4" />
            </div>
            <input
              type="text"
              placeholder="Search jobs or companies..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-sm text-gray-900 dark:text-white transition-all shadow-sm"
            />
          </div>
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="w-full sm:w-40 px-4 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl focus:ring-2 focus:ring-indigo-500/20 outline-none text-sm text-gray-900 dark:text-white shadow-sm font-semibold cursor-pointer"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="published">Published</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {loading ? (
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-8 text-center text-gray-500">
            Loading job postings...
          </div>
        ) : filteredJobs.length === 0 ? (
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-12 flex flex-col items-center justify-center text-gray-500">
            <AlertTriangle className="h-12 w-12 text-gray-300 mb-4" />
            <p className="text-lg font-bold text-gray-700 dark:text-gray-300">No jobs found</p>
            <p className="text-sm">Try adjusting your search or filters.</p>
          </div>
        ) : (
          filteredJobs.map((job) => (
            <div key={job.id} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col md:flex-row md:items-center justify-between gap-6">
              
              <div className="flex items-start gap-4 flex-1">
                <CompanyLogo 
                  companyName={job.employer?.company_name || "Direct"} 
                  logoUrl={job.company_logo} 
                  className="h-12 w-12 rounded-xl mt-1 shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2 flex-wrap">
                    <h3 className="text-lg font-black text-gray-900 dark:text-white truncate">{job.title}</h3>
                  {job.status === 'pending' && <span className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider">Review Needed</span>}
                  {job.status === 'published' && <span className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider">Live</span>}
                  {job.status === 'rejected' && <span className="bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400 px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider">Rejected</span>}
                  {job.is_featured && <span className="flex items-center gap-1 bg-amber-500 text-white px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider shadow-sm"><Star className="w-3 h-3 fill-white" /> Featured</span>}
                </div>
                
                <p className="text-sm font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2 mb-3">
                  {job.employer?.company_name || "Unknown Company"}
                  {!job.employer?.is_verified && (
                    <span className="text-[10px] text-rose-500 flex items-center gap-1" title="Unverified Employer">
                      <AlertTriangle className="w-3 h-3" /> Unverified HR
                    </span>
                  )}
                </p>

                <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-gray-500 dark:text-gray-400">
                  <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {job.location || "Not specified"}</span>
                  <span className="flex items-center gap-1"><DollarSign className="w-3.5 h-3.5" /> {job.salary || "Not disclosed"}</span>
                  <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> Posted {new Date(job.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 border-t md:border-t-0 md:border-l border-gray-100 dark:border-gray-800 pt-4 md:pt-0 md:pl-6">
                
                {job.status !== 'published' && (
                  <button 
                    onClick={() => handleUpdateStatus(job.id, 'published')}
                    className="flex-1 md:flex-none flex items-center justify-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors shadow-sm"
                  >
                    <CheckCircle className="w-4 h-4" /> Approve
                  </button>
                )}
                
                {job.status !== 'rejected' && (
                  <button 
                    onClick={() => handleUpdateStatus(job.id, 'rejected')}
                    className="flex-1 md:flex-none flex items-center justify-center gap-1.5 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-rose-50 dark:hover:bg-rose-900/20 text-gray-600 hover:text-rose-600 dark:text-gray-300 dark:hover:text-rose-400 rounded-xl text-xs font-bold transition-colors"
                  >
                    <XCircle className="w-4 h-4" /> Reject
                  </button>
                )}

                <button 
                  onClick={() => handleOpenEditLogo(job)}
                  className="flex-1 md:flex-none flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl text-xs font-bold transition-colors"
                  title="Edit Company Logo"
                >
                  <ImageIcon className="w-4 h-4 text-indigo-500" /> Logo
                </button>

                <button 
                  onClick={() => handleToggleFeature(job.id, job.is_featured)}
                  className={`flex-1 md:flex-none flex items-center justify-center p-2 rounded-xl border transition-colors ${job.is_featured ? 'bg-amber-100 dark:bg-amber-900/30 border-amber-200 dark:border-amber-800 text-amber-600' : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-400 hover:text-amber-500'}`}
                  title={job.is_featured ? "Remove Featured Status" : "Mark as Featured"}
                >
                  <Star className={`w-4 h-4 ${job.is_featured ? 'fill-amber-500' : ''}`} />
                </button>
              </div>

            </div>
          ))
        )}
      </div>

      {/* ── Edit Logo Modal ── */}
      {editingJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-gradient-to-r from-indigo-600 to-blue-700 px-6 py-4 flex items-center justify-between text-white">
              <h3 className="font-extrabold text-base flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-indigo-200" /> Edit Company Logo
              </h3>
              <button 
                onClick={() => setEditingJob(null)}
                className="p-1 rounded-lg hover:bg-white/10 text-white/80 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-5">
              <div>
                <p className="text-xs font-black text-gray-400 uppercase tracking-wider mb-1">Company</p>
                <p className="text-sm font-extrabold text-gray-800 dark:text-gray-200">{editingJob.employer?.company_name || "Unknown Company"}</p>
                <p className="text-xs text-gray-500 mt-0.5">{editingJob.title}</p>
              </div>

              {/* Preview */}
              <div className="flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950/40 border border-slate-200/50 dark:border-slate-800/80 rounded-2xl p-4">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-2">Logo Preview</p>
                <CompanyLogo 
                  companyName={editingJob.employer?.company_name} 
                  logoUrl={editLogoUrl} 
                  className="h-20 w-20 rounded-2xl"
                />
              </div>

              {/* Paste URL */}
              <div className="space-y-1.5">
                <label className="text-xs font-black text-gray-600 dark:text-gray-400 uppercase tracking-wider">Logo URL</label>
                <input 
                  type="url"
                  value={editLogoUrl}
                  onChange={(e) => setEditLogoUrl(e.target.value)}
                  placeholder="Paste direct logo image URL..."
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all"
                />
              </div>

              {/* Upload file */}
              <div className="space-y-1.5">
                <label className="text-xs font-black text-gray-600 dark:text-gray-400 uppercase tracking-wider">Upload New Image File</label>
                <div className="flex items-center gap-3">
                  <input 
                    type="file"
                    accept="image/*"
                    onChange={handleUploadLogoForEdit}
                    className="block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 dark:file:bg-slate-800 dark:file:text-indigo-400"
                  />
                  {isUploadingLogo && <span className="text-xs text-indigo-500 animate-pulse font-bold shrink-0">Uploading...</span>}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3 pt-2">
                <button 
                  onClick={handleSaveLogo}
                  className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-xl transition-all shadow-lg shadow-indigo-600/20"
                >
                  Save Logo
                </button>
                <button 
                  onClick={() => setEditingJob(null)}
                  className="px-5 py-3 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 font-bold rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
