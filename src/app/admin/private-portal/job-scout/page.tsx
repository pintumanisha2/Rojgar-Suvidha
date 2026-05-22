"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import {
  Radar, Link2, Plus, Trash2, CheckCircle2, Briefcase,
  MapPin, DollarSign, Users, Star, Clock, Sparkles,
  ArrowRight, ExternalLink, BookOpen, Tag, Building
} from "lucide-react";
import Link from "next/link";
import CompanyLogo from "@/components/layout/CompanyLogo";

// ── Types ──────────────────────────────────────────────────────────────────────
interface ScoutedJob {
  id: string;
  title: string;
  company: string;
  location: string;
  salary: string;
  experience: string;
  skills: string[];
  description: string;
  source_url: string;
  source_site: string;
  status: "draft" | "published";
  is_featured: boolean;
  company_logo?: string | null;
  created_at: string;
}

// ── Helper ─────────────────────────────────────────────────────────────────────
const detectSite = (url: string): string => {
  if (url.includes("naukri.com")) return "Naukri";
  if (url.includes("linkedin.com")) return "LinkedIn";
  if (url.includes("indeed.com")) return "Indeed";
  if (url.includes("shine.com")) return "Shine";
  if (url.includes("monster.com")) return "Monster";
  if (url.includes("foundit.in")) return "Foundit";
  return "External";
};

const SITE_COLORS: Record<string, string> = {
  Naukri: "bg-orange-100 text-orange-700 border-orange-200",
  LinkedIn: "bg-blue-100 text-blue-700 border-blue-200",
  Indeed: "bg-indigo-100 text-indigo-700 border-indigo-200",
  Shine: "bg-purple-100 text-purple-700 border-purple-200",
  Monster: "bg-violet-100 text-violet-700 border-violet-200",
  Foundit: "bg-green-100 text-green-700 border-green-200",
  External: "bg-gray-100 text-gray-700 border-gray-200",
};

// ── Component ──────────────────────────────────────────────────────────────────
export default function PrivateJobScoutPage() {
  const [scoutedJobs, setScoutedJobs] = useState<ScoutedJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);

  // Form state
  const [sourceUrl, setSourceUrl] = useState("");
  const [sourceSite, setSourceSite] = useState("External");
  const [title, setTitle] = useState("");
  const [company, setCompany] = useState("");
  const [location, setLocation] = useState("");
  const [salary, setSalary] = useState("");
  const [experience, setExperience] = useState("");
  const [description, setDescription] = useState("");
  const [skillInput, setSkillInput] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [isFeatured, setIsFeatured] = useState(true);
  const [companyLogo, setCompanyLogo] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
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

      setCompanyLogo(publicUrl);
    } catch (err: any) {
      console.error("Logo upload error:", err);
      alert("Logo upload failed: " + err.message);
    } finally {
      setIsUploading(false);
    }
  };

  // ── Load existing scouted jobs ─────────────────────────────────────────────
  const fetchJobs = async () => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from("private_jobs")
        .select("*")
        .eq("posted_by", "system_scout")
        .order("created_at", { ascending: false });

      if (data && data.length > 0) {
        const mapped: ScoutedJob[] = data.map((j: any) => ({
          id: j.id,
          title: j.title || "",
          company: j.company_name || j.company || "",
          location: j.location || "",
          salary: j.salary || "",
          experience: j.experience_required || j.experience || "",
          skills: j.skills_required || j.skills || [],
          description: j.description || "",
          source_url: j.source_url || "",
          source_site: j.source_site || "External",
          status: j.status || "published",
          is_featured: !!j.is_featured,
          company_logo: j.company_logo || null,
          created_at: j.created_at || new Date().toISOString(),
        }));
        setScoutedJobs(mapped);
      } else {
        // Fallback mock data so UI looks great on first open
        setScoutedJobs([
          { id: "m1", title: "Senior React Developer", company: "Flipkart", location: "Bangalore, KA (Hybrid)", salary: "₹18L – ₹28L /yr", experience: "4+ Years", skills: ["React", "TypeScript", "GraphQL"], description: "Build and maintain high-performance consumer-facing React apps.", source_url: "https://naukri.com", source_site: "Naukri", status: "published", is_featured: true, created_at: new Date().toISOString() },
          { id: "m2", title: "Python Data Engineer", company: "Razorpay", location: "Remote", salary: "₹20L – ₹32L /yr", experience: "3+ Years", skills: ["Python", "Spark", "Airflow", "SQL"], description: "Design and maintain large-scale data pipelines powering payment analytics.", source_url: "https://linkedin.com", source_site: "LinkedIn", status: "published", is_featured: false, created_at: new Date(Date.now() - 86400000).toISOString() },
        ]);
      }
    } catch (e) {
      console.error("Error loading scouted jobs:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchJobs(); }, []);

  // ── URL paste handler — auto-detect site ───────────────────────────────────
  const handleUrlChange = (val: string) => {
    setSourceUrl(val);
    setSourceSite(detectSite(val));
  };

  // ── Skill tag helpers ──────────────────────────────────────────────────────
  const addSkill = () => {
    const s = skillInput.trim().toUpperCase();
    if (s && !skills.includes(s)) setSkills(prev => [...prev, s]);
    setSkillInput("");
  };

  const removeSkill = (s: string) => setSkills(prev => prev.filter(x => x !== s));

  // ── Post job to DB ─────────────────────────────────────────────────────────
  const handlePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !company) return;
    setSaving(true);

    const jobPayload = {
      title: (title || "").toString().trim(),
      company_name: (company || "").toString().trim(),
      location: (location || "").toString().trim() || "India",
      salary: (salary || "").toString().trim() || "As per industry standards",
      experience_required: (experience || "").toString().trim(),
      description: (description || "").toString().trim(),
      skills_required: Array.isArray(skills) ? skills : [],
      source_url: (sourceUrl || "").toString().trim(),
      source_site: sourceSite || "External",
      posted_by: "system_scout",
      status: "published",
      is_featured: !!isFeatured,
      apply_mode: "internal", // ← Option A: collect resumes internally
      employer_id: null,
      company_logo: (companyLogo || "").toString().trim() || null,
    };

    try {
      const { error } = await supabase.from("private_jobs").insert([jobPayload]);

      if (error) {
        console.error("Supabase insert error details:", error);
        throw new Error(error.message || "Database insert failed");
      }

      // If DB insert succeeds, update local UI
      const newJob: ScoutedJob = {
        id: "local-" + Date.now(),
        title: jobPayload.title,
        company: jobPayload.company_name,
        location: jobPayload.location,
        salary: jobPayload.salary,
        experience: jobPayload.experience_required,
        skills: jobPayload.skills_required,
        description: jobPayload.description,
        source_url: jobPayload.source_url,
        source_site: jobPayload.source_site,
        status: "published",
        is_featured: isFeatured,
        company_logo: jobPayload.company_logo,
        created_at: new Date().toISOString(),
      };

      setScoutedJobs(prev => [newJob, ...prev]);
      setSuccessMsg(`✅ "${title}" posted successfully! Candidates can now apply internally.`);
      setTimeout(() => setSuccessMsg(null), 5000);

      // Reset form
      setShowForm(false);
      setTitle(""); setCompany(""); setLocation(""); setSalary("");
      setExperience(""); setDescription(""); setSkills([]); setSkillInput("");
      setSourceUrl(""); setSourceSite("External"); setIsFeatured(true);
      setCompanyLogo("");

    } catch (err: any) {
      console.error("Publish Error:", err);
      alert(`❌ Publishing failed: ${err.message || err.toString()}\n\nPlease check your internet connection or table columns constraint.`);
    } finally {
      setSaving(false);
    }
  };

  // ── AI Auto-Fill Handler ───────────────────────────────────────────────────
  const handleAutoFill = async () => {
    if (!sourceUrl) {
      alert("Please enter a Source URL first.");
      return;
    }
    
    setIsExtracting(true);
    try {
      const res = await fetch("/api/admin/scout-extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: sourceUrl })
      });
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || "Failed to extract data");
      }
      
      // Auto-fill fields
      if (data.title) setTitle(data.title);
      if (data.company) setCompany(data.company);
      if (data.location) setLocation(data.location);
      if (data.salary && data.salary !== "Not Disclosed") setSalary(data.salary);
      if (data.experience && data.experience !== "Not Specified") setExperience(data.experience);
      if (data.description) setDescription(data.description);
      if (data.skills && Array.isArray(data.skills)) {
        setSkills(data.skills);
      }
      
      setSuccessMsg("✨ Job details auto-filled successfully using AI!");
      setTimeout(() => setSuccessMsg(null), 5000);
      
    } catch (err: any) {
      alert(err.message || "An error occurred during AI extraction.");
    } finally {
      setIsExtracting(false);
    }
  };

  // ── Delete a scouted job ───────────────────────────────────────────────────
  const handleDelete = async (id: string) => {
    if (!confirm("Remove this scouted job?")) return;
    await supabase.from("private_jobs").delete().eq("id", id);
    setScoutedJobs(prev => prev.filter(j => j.id !== id));
  };

  // ── UI ─────────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-5xl mx-auto pb-20 space-y-6">

      {/* ── Header Banner ── */}
      <div className="bg-gradient-to-br from-blue-900 via-indigo-900 to-slate-900 rounded-3xl p-8 text-white relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-72 h-72 bg-blue-500/20 rounded-full blur-3xl -mt-20 -mr-20 pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 border border-white/20 rounded-full text-xs font-bold text-blue-200 mb-4">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              Option A — Internal Resume Collection Active
            </div>
            <h1 className="text-3xl font-extrabold flex items-center gap-3">
              <Radar className="h-8 w-8 text-blue-400" /> Private Job Scout
            </h1>
            <p className="text-blue-200 mt-2 font-medium max-w-xl">
              Paste any job URL from Naukri, LinkedIn, or Indeed. Fill in the details, publish it here — candidates apply directly on <strong>Rojgar Suvidha</strong> and their resumes land in your tracker.
            </p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="shrink-0 flex items-center gap-2 bg-white text-blue-900 hover:bg-blue-50 px-6 py-3 rounded-xl font-extrabold shadow-lg transition-all"
          >
            <Plus className="h-5 w-5" /> Add Job from URL
          </button>
        </div>
      </div>

      {/* ── Success message ── */}
      {successMsg && (
        <div className="flex items-center gap-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-2xl px-5 py-4 text-emerald-700 dark:text-emerald-400 font-bold text-sm">
          <CheckCircle2 className="h-5 w-5 shrink-0" /> {successMsg}
        </div>
      )}

      {/* ── Rapid Entry Form ── */}
      {showForm && (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-6 py-4 flex items-center gap-3">
            <Link2 className="h-5 w-5 text-white" />
            <h2 className="text-white font-extrabold text-lg">Rapid Job Entry Form</h2>
            <span className="ml-auto text-xs text-blue-100 font-medium">Paste URL → Fill Details → Publish</span>
          </div>

          <form onSubmit={handlePost} className="p-6 space-y-5">
            {/* Source URL */}
            <div className="space-y-1.5">
              <label className="text-xs font-black text-gray-600 dark:text-gray-400 uppercase tracking-wider">Source URL (Naukri / LinkedIn / Indeed)</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-blue-500">
                  <Link2 className="h-4 w-4" />
                </div>
                <input
                  type="url"
                  value={sourceUrl}
                  onChange={e => handleUrlChange(e.target.value)}
                  placeholder="https://naukri.com/job-listings/..."
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
                />
                {sourceUrl && (
                  <a href={sourceUrl} target="_blank" rel="noopener noreferrer" className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-blue-500">
                    <ExternalLink className="h-4 w-4" />
                  </a>
                )}
              </div>
              <div className="flex items-center gap-3 mt-1">
                {sourceSite !== "External" && (
                  <span className={`inline-block text-xs font-black px-2.5 py-0.5 rounded-full border ${SITE_COLORS[sourceSite]}`}>
                    Detected: {sourceSite}
                  </span>
                )}
                <button
                  type="button"
                  onClick={handleAutoFill}
                  disabled={isExtracting || !sourceUrl}
                  className="ml-auto inline-flex items-center gap-1.5 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 disabled:opacity-50 text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow-md shadow-indigo-500/20 transition-all"
                >
                  <Sparkles className="h-3.5 w-3.5" /> 
                  {isExtracting ? "AI Extracting..." : "Auto-Fill with AI"}
                </button>
              </div>
            </div>

            {/* Title + Company */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-black text-gray-600 dark:text-gray-400 uppercase tracking-wider">Job Title *</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-blue-500">
                    <Briefcase className="h-4 w-4" />
                  </div>
                  <input
                    required
                    type="text"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    placeholder="e.g. Senior React Developer"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-black text-gray-600 dark:text-gray-400 uppercase tracking-wider">Company Name *</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-blue-500">
                    <Building className="h-4 w-4" />
                  </div>
                  <input
                    required
                    type="text"
                    value={company}
                    onChange={e => setCompany(e.target.value)}
                    placeholder="e.g. Flipkart, TCS, Amazon"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Company Logo URL & Upload */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-black text-gray-600 dark:text-gray-400 uppercase tracking-wider">Company Logo URL</label>
                <input
                  type="url"
                  value={companyLogo}
                  onChange={e => setCompanyLogo(e.target.value)}
                  placeholder="Paste direct logo image URL or upload →"
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-black text-gray-600 dark:text-gray-400 uppercase tracking-wider">Upload Logo File</label>
                <div className="flex items-center gap-3">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-slate-800 dark:file:text-blue-400"
                  />
                  {isUploading && <span className="text-xs text-blue-500 animate-pulse font-bold shrink-0">Uploading...</span>}
                </div>
              </div>
            </div>

            {/* Location + Salary + Experience */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-black text-gray-600 dark:text-gray-400 uppercase tracking-wider">Location</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-blue-500">
                    <MapPin className="h-4 w-4" />
                  </div>
                  <input
                    type="text"
                    value={location}
                    onChange={e => setLocation(e.target.value)}
                    placeholder="e.g. Remote / Delhi"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-black text-gray-600 dark:text-gray-400 uppercase tracking-wider">Salary / CTC</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-blue-500">
                    <DollarSign className="h-4 w-4" />
                  </div>
                  <input
                    type="text"
                    value={salary}
                    onChange={e => setSalary(e.target.value)}
                    placeholder="e.g. ₹18L – ₹24L /yr"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-black text-gray-600 dark:text-gray-400 uppercase tracking-wider">Experience Required</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-blue-500">
                    <Clock className="h-4 w-4" />
                  </div>
                  <input
                    type="text"
                    value={experience}
                    onChange={e => setExperience(e.target.value)}
                    placeholder="e.g. 3–5 Years / Fresher"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Skills */}
            <div className="space-y-2">
              <label className="text-xs font-black text-gray-600 dark:text-gray-400 uppercase tracking-wider">Required Skills (Press Enter to add)</label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-blue-500">
                    <Tag className="h-4 w-4" />
                  </div>
                  <input
                    type="text"
                    value={skillInput}
                    onChange={e => setSkillInput(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addSkill(); } }}
                    placeholder="Type a skill and press Enter (e.g. React, Python, AWS)"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-mono outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
                  />
                </div>
                <button type="button" onClick={addSkill} className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold">
                  Add
                </button>
              </div>
              {skills.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {skills.map(s => (
                    <span key={s} className="flex items-center gap-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 px-2.5 py-1 rounded-lg text-xs font-black border border-blue-200 dark:border-blue-800">
                      {s}
                      <button type="button" onClick={() => removeSkill(s)} className="text-blue-400 hover:text-blue-600">×</button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <label className="text-xs font-black text-gray-600 dark:text-gray-400 uppercase tracking-wider">Job Description / Responsibilities</label>
              <textarea
                rows={5}
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Paste the job description here. Include responsibilities, requirements, and perks..."
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all resize-none"
              />
            </div>

            {/* Featured Toggle */}
            <div className="flex items-center justify-between bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl px-5 py-4">
              <div className="flex items-center gap-3">
                <Star className="h-5 w-5 text-amber-500 fill-amber-500" />
                <div>
                  <p className="text-sm font-extrabold text-gray-900 dark:text-white">Mark as Featured Job</p>
                  <p className="text-xs text-gray-500 font-medium">Featured jobs appear at the top of the candidate feed with a gold badge.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsFeatured(!isFeatured)}
                className={`relative w-12 h-6 rounded-full transition-colors ${isFeatured ? "bg-amber-500" : "bg-gray-300 dark:bg-gray-700"}`}
              >
                <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${isFeatured ? "translate-x-7" : "translate-x-1"}`} />
              </button>
            </div>

            {/* Internal Collection Notice */}
            <div className="flex items-start gap-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-2xl px-5 py-4">
              <Sparkles className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-extrabold text-blue-900 dark:text-blue-300">Option A: Internal Collection Mode</p>
                <p className="text-xs text-blue-700 dark:text-blue-400 font-medium mt-0.5">
                  Candidates will click <strong>"1-Click Apply"</strong> on your platform. Their name, email, phone, and resume URL will be captured in the <strong>Admin Application Tracker</strong>. You can then forward their profile to the actual company.
                </p>
              </div>
            </div>

            {/* Submit + Cancel */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="submit"
                disabled={saving}
                className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-extrabold py-3 rounded-xl transition-all shadow-lg shadow-blue-600/20 disabled:opacity-50"
              >
                {saving ? "Publishing..." : <><Radar className="h-4 w-4" /> Publish Job (Internal Collection)</>}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-5 py-3 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 font-bold rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── Posted Jobs List ── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-indigo-500" /> Scouted Jobs ({scoutedJobs.length})
          </h2>
          <Link href="/admin/private-portal/jobs" className="text-sm font-bold text-blue-600 hover:underline flex items-center gap-1">
            Full Moderation Queue <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2].map(i => <div key={i} className="h-28 bg-white dark:bg-gray-800 rounded-2xl animate-pulse" />)}
          </div>
        ) : scoutedJobs.length === 0 ? (
          <div className="bg-gray-50 dark:bg-gray-900 rounded-3xl border-2 border-dashed border-gray-200 dark:border-gray-800 p-12 text-center flex flex-col items-center text-gray-500">
            <Radar className="h-14 w-14 mb-4 text-gray-300 dark:text-gray-700" />
            <p className="text-lg font-bold text-gray-700 dark:text-gray-300">No jobs scouted yet.</p>
            <p className="text-sm mt-1">Click <strong>"Add Job from URL"</strong> to post your first external job here.</p>
          </div>
        ) : (
          scoutedJobs.map(job => (
            <div key={job.id} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-start gap-4 flex-1">
                <CompanyLogo 
                  companyName={job.company} 
                  logoUrl={job.company_logo} 
                  className="h-12 w-12 rounded-xl mt-1 shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <h3 className="text-base font-extrabold text-gray-900 dark:text-white truncate">{job.title}</h3>
                    {job.is_featured && (
                      <span className="flex items-center gap-1 bg-amber-500 text-white px-2 py-0.5 rounded-md text-[10px] font-black uppercase">
                        <Star className="w-2.5 h-2.5 fill-white" /> Featured
                      </span>
                    )}
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase border ${SITE_COLORS[job.source_site] || SITE_COLORS.External}`}>
                    {job.source_site}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-[10px] font-black uppercase border border-blue-100 dark:border-blue-800">
                    Internal Collection
                  </span>
                </div>
                <p className="text-sm font-bold text-gray-600 dark:text-gray-400 mb-2">{job.company} · {job.location} · {job.salary}</p>
                <div className="flex flex-wrap gap-1.5">
                  {job.skills?.slice(0, 4).map((s: string) => (
                    <span key={s} className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded text-[10px] font-bold">
                      {s}
                    </span>
                  ))}
                  {(job.skills?.length ?? 0) > 4 && (
                    <span className="text-[10px] text-slate-400 font-bold">+{job.skills.length - 4} more</span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
                {job.source_url && (
                  <a href={job.source_url} target="_blank" rel="noopener noreferrer" className="p-2 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-400 hover:text-blue-600 hover:border-blue-300 transition-colors" title="View Original Source">
                    <ExternalLink className="h-4 w-4" />
                  </a>
                )}
                <button
                  onClick={() => handleDelete(job.id)}
                  className="p-2 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-400 hover:text-rose-500 hover:border-rose-300 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors"
                  title="Remove this scouted job"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
