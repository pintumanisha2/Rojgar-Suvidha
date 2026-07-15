"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import dynamic from "next/dynamic";
import {
  ArrowLeft, Save, Loader2, PlusCircle, Trash2,
  Link as LinkIcon, FileText, Briefcase, MapPin, Tag, Calendar,
  Eye, Monitor, Tablet, Phone, Sparkles, Wand2, UploadCloud,
  Zap, Table as TableIcon
} from "lucide-react";
import Link from "next/link";
import { compressImage } from "@/lib/image-utils";
import BannerGenerator from "@/components/admin/BannerGenerator";
import toast from "react-hot-toast";

// Load rich text editor only on client side
const RichTextEditor = dynamic(() => import("@/components/admin/RichTextEditor"), {
  ssr: false,
  loading: () => (
    <div className="border border-gray-200 dark:border-gray-700 rounded-xl h-64 bg-gray-50 dark:bg-gray-800 flex items-center justify-center">
      <div className="flex items-center gap-2 text-gray-400">
        <Loader2 className="h-5 w-5 animate-spin" />
        <span className="text-sm">Editor load ho raha hai...</span>
      </div>
    </div>
  ),
});

const CATEGORIES = [
  { value: "latest-jobs", label: "🧑‍💼 Latest Jobs" },
  { value: "private-jobs", label: "🏢 Private Jobs" },
  { value: "admission", label: "🎓 Admission" },
  { value: "results", label: "📋 Results" },
  { value: "admit-card", label: "🎫 Admit Card" },
  { value: "answer-key", label: "🔑 Answer Key" },
  { value: "news", label: "📰 News & Updates" },
];

const STATUSES = [
  { value: "active", label: "✅ Active" },
  { value: "pending_approval", label: "🛡️ Pending Approval" },
  { value: "out", label: "🟢 Out" },
  { value: "last", label: "🔴 Last Date" },
  { value: "soon", label: "⏳ Coming Soon" },
  { value: "closed", label: "❌ Closed" },
];

const TAGS = [
  { value: "", label: "None" },
  { value: "hot", label: "🔥 Hot" },
  { value: "new", label: "✨ New" },
  { value: "urgent", label: "🚨 Urgent" },
  { value: "trending", label: "📈 Trending" },
];

const INDIAN_STATES = [
  { value: "", label: "🇮🇳 Central / All India" },
  { value: "AP", label: "Andhra Pradesh" }, { value: "AR", label: "Arunachal Pradesh" },
  { value: "AS", label: "Assam" }, { value: "BR", label: "Bihar" },
  { value: "CG", label: "Chhattisgarh" }, { value: "GA", label: "Goa" },
  { value: "GJ", label: "Gujarat" }, { value: "HR", label: "Haryana" },
  { value: "HP", label: "Himachal Pradesh" }, { value: "JH", label: "Jharkhand" },
  { value: "KA", label: "Karnataka" }, { value: "KL", label: "Kerala" },
  { value: "MP", label: "Madhya Pradesh" }, { value: "MH", label: "Maharashtra" },
  { value: "MN", label: "Manipur" }, { value: "ML", label: "Meghalaya" },
  { value: "MZ", label: "Mizoram" }, { value: "NL", label: "Nagaland" },
  { value: "OR", label: "Odisha" }, { value: "PB", label: "Punjab" },
  { value: "RJ", label: "Rajasthan" }, { value: "SK", label: "Sikkim" },
  { value: "TN", label: "Tamil Nadu" }, { value: "TS", label: "Telangana" },
  { value: "TR", label: "Tripura" }, { value: "UP", label: "Uttar Pradesh" },
  { value: "UK", label: "Uttarakhand" }, { value: "WB", label: "West Bengal" },
  { value: "DL", label: "Delhi" }, { value: "JK", label: "Jammu & Kashmir" },
  { value: "LA", label: "Ladakh" }, { value: "CH", label: "Chandigarh" }
];

interface LinkRow { label: string; url: string; }

function Field({ label, children, required }: { label: string; children: React.ReactNode; required?: boolean }) {
  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
    </div>
  );
}

const inputCls = "w-full px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all";
const selectCls = "w-full px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all";

function SectionCard({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6 shadow-sm mb-6">
      <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2 text-lg pb-3 border-b border-gray-100 dark:border-gray-800 mb-5">
        <span className="text-indigo-500 p-1.5 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg">{icon}</span> {title}
      </h3>
      {children}
    </div>
  );
}

export default function NewJobPage() {
  const router = useRouter();
  
  const [saving, setSaving] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session?.user.email) {
        setCurrentUserEmail(data.session.user.email);
        const { data: roleData } = await supabase.from('admin_roles').select('role').eq('email', data.session.user.email).single();
        if (roleData?.role) setUserRole(roleData.role);
      }
    };
    fetchUser();
  }, []);

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("latest-jobs");
  const [status, setStatus] = useState("active");
  const [stateCode, setStateCode] = useState("");
  const [tag, setTag] = useState("");
  const [lastDate, setLastDate] = useState(""); 
  
  const [shortInfo, setShortInfo] = useState("");
  const [metaDesc, setMetaDesc] = useState("");
  const [bannerUrl, setBannerUrl] = useState("");
  
  // Job Highlights
  const [appFee, setAppFee] = useState("");
  const [ageLimit, setAgeLimit] = useState("");
  const [education, setEducation] = useState("");
  const [totalPosts, setTotalPosts] = useState("");

  const [blogContent, setBlogContent] = useState("");
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [previewDevice, setPreviewDevice] = useState<"desktop" | "mobile">("desktop");
  const [uploadingPdfIndex, setUploadingPdfIndex] = useState<number | null>(null);
  const [isUploadingFile, setIsUploadingFile] = useState<"banner" | "pdf" | null>(null);

  const [applyForMeLink, setApplyForMeLink] = useState("");
  const [links, setLinks] = useState<any[]>([{ label: "Apply Online", url: "" }, { label: "Download Notification", url: "" }]);

  const [isGeneratingBlog, setIsGeneratingBlog] = useState(false);

  // Auto-save to LocalStorage
  useEffect(() => {
    // 1. Check for AI generated data from Super Writer
    const aiData = localStorage.getItem("ai_generated_job");
    if (aiData && window.location.search.includes("source=ai")) {
      try {
        const data = JSON.parse(aiData);
        setTitle(data.title || "");
        setBlogContent(data.blogHtml || "");
        setCategory(data.category || "latest-jobs");
        setAppFee(data.appFee || "");
        setAgeLimit(data.ageLimit || "");
        setEducation(data.education || "");
        setTotalPosts(data.totalPosts || "");
        setLastDate(data.lastDate || "");
        
        // SEO fields
        if (data.metaDesc) setMetaDesc(data.metaDesc);
        if (data.shortInfo) setShortInfo(data.shortInfo);
        
        // Clean up AI data after use
        localStorage.removeItem("ai_generated_job");
        return; 
      } catch (e) {
        console.error("AI Data Parse Error:", e);
      }
    }

    // 2. Existing draft logic
    const saved = localStorage.getItem("blog_draft");
    if (saved) {
      const data = JSON.parse(saved);
      if (confirm("Draft content found. Restore it?")) {
        setTitle(data.title || "");
        setBlogContent(data.blogContent || "");
        setCategory(data.category || "latest-jobs");
      }
    }
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => {
      localStorage.setItem("blog_draft", JSON.stringify({ title, blogContent, category }));
    }, 2000);
    return () => clearTimeout(timeout);
  }, [title, blogContent, category]);

  const slugify = (text: string) => text.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

  const handleSave = async (isDraft = false) => {
    if (!title.trim()) { setError("Title likhna zaroori hai."); return; }
    if (isDraft) setSavingDraft(true); else setSaving(true);
    setError(null);

    const payload: any = {
      title: title.trim(),
      slug: slugify(title),
      category,
      status: isDraft ? "draft" : (userRole === 'content_writer' ? "pending_approval" : status),
      state_code: stateCode || null,
      tag: tag || null,
      short_info: shortInfo,
      meta_description: metaDesc,
      banner_url: bannerUrl || null,
      blog_content: blogContent,
      links: (applyForMeLink && applyForMeLink.trim()) ? [...links, { label: "Apply For Me", url: applyForMeLink.trim() }] : links,
      important_dates: lastDate ? [{ label: "Last Date", value: lastDate }] : [],
      created_by: currentUserEmail,
    };

    try {
      const { error: dbErr } = await supabase.from("jobs").insert([payload]);
      
      if (dbErr) {
        console.error("Database Insert Error:", dbErr);
        setError(`Database Error: ${dbErr.message}. Check if columns 'short_info' and 'meta_description' exist in your Supabase 'jobs' table.`);
      } else {
        localStorage.removeItem("blog_draft");
        window.location.href = "/admin/jobs"; // Hard redirect to avoid UI freezing
      }
    } catch (err: any) {
      console.error("Unexpected Save Error:", err);
      setError("An unexpected error occurred while saving. Please check your internet or database columns.");
    } finally {
      setSaving(false);
      setSavingDraft(false);
    }
  };

  const generateJobTable = () => {
    const tableHtml = `
      <table style="width: 100%; border-collapse: collapse; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden; margin-bottom: 2rem;">
        <thead>
          <tr style="background-color: #4f46e5; color: white;">
            <th colspan="2" style="padding: 12px; text-align: center; font-size: 1.2rem;">Job Highlights</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="padding: 12px; border: 1px solid #e5e7eb; font-weight: bold; width: 30%;">Last Date</td>
            <td style="padding: 12px; border: 1px solid #e5e7eb;">${lastDate || "—"}</td>
          </tr>
          <tr>
            <td style="padding: 12px; border: 1px solid #e5e7eb; font-weight: bold;">Application Fee</td>
            <td style="padding: 12px; border: 1px solid #e5e7eb;">${appFee || "—"}</td>
          </tr>
          <tr>
            <td style="padding: 12px; border: 1px solid #e5e7eb; font-weight: bold;">Age Limit</td>
            <td style="padding: 12px; border: 1px solid #e5e7eb;">${ageLimit || "—"}</td>
          </tr>
          <tr>
            <td style="padding: 12px; border: 1px solid #e5e7eb; font-weight: bold;">Education</td>
            <td style="padding: 12px; border: 1px solid #e5e7eb;">${education || "—"}</td>
          </tr>
          <tr>
            <td style="padding: 12px; border: 1px solid #e5e7eb; font-weight: bold;">Total Vacancy</td>
            <td style="padding: 12px; border: 1px solid #e5e7eb;">${totalPosts || "—"}</td>
          </tr>
        </tbody>
      </table>
      <p>Yahan se apna detailed blog shuru karein...</p>
    `;
    setBlogContent(tableHtml + blogContent);
  };

  const handleGenerateBlog = async () => {
    if (!title.trim()) {
      toast.error("Please enter a Title first so AI knows what to write about.");
      return;
    }
    
    if (blogContent.trim().length > 50 && !confirm("This will overwrite your current blog content. Are you sure?")) {
      return;
    }

    setIsGeneratingBlog(true);
    try {
      const response = await fetch("/api/admin/generate-job-blog", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          category,
          shortInfo,
          highlights: { appFee, ageLimit, education, totalPosts },
          lastDate
        })
      });

      const data = await response.json();
      if (data.blog) {
        setBlogContent(data.blog);
      } else {
        throw new Error(data.error || "Failed to generate blog.");
      }
    } catch (err: any) {
      toast.error(err.message || "Something went wrong with AI generation.");
    } finally {
      setIsGeneratingBlog(false);
    }
  };

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setIsUploadingFile("banner"); 
    try {
      // Compress the image before uploading (Max width 1200px, 80% quality)
      const compressedFile = await compressImage(file, 1200, 0.8);
      
      const fileExt = compressedFile.name.split('.').pop() || 'jpg';
      const fileName = `${Date.now()}_banner.${fileExt}`;
      const { data, error } = await supabase.storage.from('blog_images').upload(fileName, compressedFile);
      if (error) throw error;
      const { data: { publicUrl } } = supabase.storage.from('blog_images').getPublicUrl(fileName);
      setBannerUrl(publicUrl);
    } catch (err: any) {
      toast.error("Banner upload failed: " + err.message);
    } finally {
      setIsUploadingFile(null);
    }
  };

  const handleNotificationPdfUpload = async (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setUploadingPdfIndex(index);
    setIsUploadingFile("pdf");
    try {
      const rawName = file.name;
      const cleanName = rawName
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9.]+/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "");

      if (!cleanName.endsWith(".pdf")) {
        throw new Error("Only PDF documents are allowed.");
      }

      const filePath = `pdfs/${cleanName}`;
      const { error } = await supabase.storage.from("blog_images").upload(filePath, file, { 
        upsert: true,
        contentType: "application/pdf"
      });
      if (error) throw error;

      const customServeUrl = `/uploads/${cleanName}`;
      const updatedLinks = [...links];
      updatedLinks[index].url = customServeUrl;
      setLinks(updatedLinks);
      
      toast.success(`PDF successfully uploaded!\nServing URL: ${customServeUrl} ✓`);
    } catch (err: any) {
      toast.error("PDF Upload failed: " + err.message);
    } finally {
      setIsUploadingFile(null);
      setUploadingPdfIndex(null);
    }
  };

  return (
    <div className="max-w-[1600px] mx-auto pb-20">
      
      {/* ── Sticky Action Bar (Premium Feel) ── */}
      <div className="sticky top-0 z-50 bg-white/80 dark:bg-[#000000]/80 backdrop-blur-xl border-b border-gray-200 dark:border-zinc-800 p-4 mb-8 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
          <Link href="/admin/jobs" className="p-2.5 rounded-xl bg-gray-100 dark:bg-zinc-900 hover:bg-gray-200 dark:hover:bg-zinc-800 text-gray-600 dark:text-gray-300 transition-colors border border-transparent dark:border-zinc-800">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white leading-tight">Create Post</h2>
            <p className="text-xs sm:text-sm text-gray-500 font-medium">Studio Editor</p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <button onClick={() => handleSave(true)} disabled={savingDraft || saving || isUploadingFile !== null} className="hidden sm:block px-5 py-2.5 rounded-xl font-bold border border-gray-200 dark:border-zinc-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-zinc-900 transition-colors">
            {savingDraft ? "Saving..." : "Save Draft"}
          </button>
          <button onClick={() => handleSave(false)} disabled={savingDraft || saving || isUploadingFile !== null} className="px-5 sm:px-6 py-2.5 rounded-xl font-bold bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-2 shadow-lg shadow-indigo-500/20 transition-all active:scale-95 border border-indigo-500">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {userRole === 'content_writer' ? "Submit" : "Publish"}
          </button>
        </div>
      </div>

      {isUploadingFile && (
        <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-400 p-4 rounded-xl text-sm font-bold mb-6 flex items-center gap-3 animate-pulse shadow-sm">
          <Loader2 className="h-5 w-5 animate-spin text-indigo-600 dark:text-indigo-400" />
          <span>Uploading {isUploadingFile === "banner" ? "featured banner" : "PDF notification"} to secure storage...</span>
        </div>
      )}

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 p-4 rounded-xl text-sm font-medium mb-6 flex items-center gap-2 shadow-sm">
          ⚠️ {error}
        </div>
      )}

      {/* ── Studio Layout: Split Screen ── */}
      <div className="flex flex-col xl:flex-row gap-8 items-start">
        
        {/* Left Column: Form Editor */}
        <div className="flex-1 w-full space-y-6">
          
          <SectionCard icon={<Briefcase className="h-5 w-5" />} title="Basic Details">
            <div className="space-y-5">
              <Field label="Post Title" required>
                <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g., SSC CGL 2026 Notification Out" className={`${inputCls} text-lg font-semibold bg-gray-50 dark:bg-zinc-900`} />
              </Field>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <Field label="Category" required>
                  <select value={category} onChange={e => setCategory(e.target.value)} className={`${selectCls} bg-gray-50 dark:bg-zinc-900`}>
                    {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                </Field>
                <Field label="Status" required>
                  <select 
                    value={userRole === 'content_writer' ? "pending_approval" : status} 
                    onChange={e => setStatus(e.target.value)} 
                    disabled={userRole === 'content_writer'}
                    className={`${selectCls} bg-gray-50 dark:bg-zinc-900 ${userRole === 'content_writer' ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {userRole === 'content_writer' 
                      ? <option value="pending_approval">🛡️ Pending Approval</option>
                      : STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)
                    }
                  </select>
                </Field>
                {category !== "news" && (
                  <Field label="Last Date">
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                      <input type="text" value={lastDate} onChange={e => setLastDate(e.target.value)} placeholder="e.g., 20-Oct-2026" className={`${inputCls} pl-9 bg-gray-50 dark:bg-zinc-900`} />
                    </div>
                  </Field>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <Field label="State / Region">
                  <select value={stateCode} onChange={e => setStateCode(e.target.value)} className={`${selectCls} bg-gray-50 dark:bg-zinc-900`}>
                    {INDIAN_STATES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>
                </Field>
                <Field label="Badge / Tag">
                  <select value={tag} onChange={e => setTag(e.target.value)} className={`${selectCls} bg-gray-50 dark:bg-zinc-900`}>
                    {TAGS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </Field>
              </div>
              
              {/* Smart SEO Section */}
              <div className="p-4 bg-indigo-50/50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-900/30 rounded-2xl mt-6">
                <h4 className="text-sm font-bold text-indigo-900 dark:text-indigo-400 flex items-center gap-2 mb-4"><Sparkles className="w-4 h-4" /> SEO & Meta Data</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <Field label="Short Summary (Homepage Card)">
                    <textarea rows={2} value={shortInfo} onChange={e => setShortInfo(e.target.value)} placeholder="Short engaging summary..." className={`${inputCls} bg-white dark:bg-zinc-900`} />
                  </Field>
                  <Field label="Meta Description (Google Search)">
                    <textarea rows={2} value={metaDesc} onChange={e => setMetaDesc(e.target.value)} maxLength={160} placeholder="AI automatically uses this for Google ranking..." className={`${inputCls} bg-white dark:bg-zinc-900`} />
                  </Field>
                </div>
              </div>
            </div>
          </SectionCard>

          {category !== 'news' && (
            <SectionCard icon={<Zap className="h-5 w-5" />} title="Quick Highlights">
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-5">
                  <Field label="Application Fee">
                     <input type="text" value={appFee} onChange={e => setAppFee(e.target.value)} placeholder="e.g., Gen: 500" className={`${inputCls} bg-gray-50 dark:bg-zinc-900`} />
                  </Field>
                  <Field label="Age Limit">
                     <input type="text" value={ageLimit} onChange={e => setAgeLimit(e.target.value)} placeholder="e.g., 18-27 Yrs" className={`${inputCls} bg-gray-50 dark:bg-zinc-900`} />
                  </Field>
                  <Field label="Education">
                     <input type="text" value={education} onChange={e => setEducation(e.target.value)} placeholder="e.g., 10th Pass" className={`${inputCls} bg-gray-50 dark:bg-zinc-900`} />
                  </Field>
                  <Field label="Total Posts">
                     <input type="text" value={totalPosts} onChange={e => setTotalPosts(e.target.value)} placeholder="e.g., 1500 Posts" className={`${inputCls} bg-gray-50 dark:bg-zinc-900`} />
                  </Field>
               </div>
               <button 
                  type="button"
                  onClick={generateJobTable}
                  className="w-full py-2.5 border-2 border-dashed border-indigo-200 dark:border-indigo-900/50 rounded-xl text-indigo-600 dark:text-indigo-400 font-bold hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all flex items-center justify-center gap-2"
               >
                  <TableIcon className="h-4 w-4" /> Insert Highlights Table into Editor
               </button>
            </SectionCard>
          )}

          <SectionCard icon={<FileText className="h-5 w-5" />} title="Article Content">
            <div className="mb-6">
              <Field label="Featured Banner">
                <div className="flex flex-col gap-3 mt-2">
                  <div className="flex flex-col md:flex-row gap-4 items-start">
                    <div className="flex-1 w-full">
                      <div className="relative">
                        <input type="url" value={bannerUrl} onChange={e => setBannerUrl(e.target.value)} placeholder="Paste image URL or upload →" className={`${inputCls} pr-12 bg-gray-50 dark:bg-zinc-900`} />
                        <label className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-white dark:bg-zinc-800 shadow-sm border border-gray-200 dark:border-zinc-700 text-indigo-600 dark:text-indigo-400 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-zinc-700 transition-colors">
                          <UploadCloud className="h-4 w-4" />
                          <input type="file" className="hidden" accept="image/*" onChange={handleBannerUpload} />
                        </label>
                      </div>
                      <div className="mt-3">
                        <BannerGenerator
                          title={title} lastDate={lastDate} appFee={appFee}
                          totalPosts={totalPosts} category={category}
                          onBannerGenerated={(url) => setBannerUrl(url)}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </Field>
            </div>
            
            <div className="border border-indigo-100 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm relative bg-white dark:bg-[#000000]">
              <div className="flex items-center justify-between bg-gray-50 dark:bg-zinc-900 border-b border-gray-200 dark:border-zinc-800 px-4 py-3">
                <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Rich Text Editor</span>
                <button 
                  type="button" 
                  onClick={handleGenerateBlog} 
                  disabled={isGeneratingBlog}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow-sm transition-all disabled:opacity-50"
                >
                  {isGeneratingBlog ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Wand2 className="w-3.5 h-3.5" />}
                  {isGeneratingBlog ? "AI Writing..." : "AI Auto-Write Blog"}
                </button>
              </div>
              
              {isGeneratingBlog && (
                <div className="absolute inset-0 bg-white/80 dark:bg-[#000000]/80 backdrop-blur-sm z-10 flex flex-col items-center justify-center">
                  <Loader2 className="w-8 h-8 animate-spin text-indigo-500 mb-3" />
                  <p className="text-indigo-900 dark:text-indigo-200 font-bold animate-pulse text-sm">Generating SEO Optimized Content...</p>
                </div>
              )}
              <div className="bg-white dark:bg-zinc-950">
                <RichTextEditor value={blogContent} onChange={setBlogContent} placeholder="Write the full notification details here..." />
              </div>
            </div>
          </SectionCard>

          <SectionCard icon={<LinkIcon className="h-5 w-5" />} title="Important Links">
            <div className="mb-6 p-4 bg-yellow-50 dark:bg-amber-900/10 border border-yellow-200 dark:border-amber-900/30 rounded-2xl">
              <label className="block text-sm font-bold text-yellow-900 dark:text-amber-500 mb-2">
                "Apply For Me" Target URL (Optional)
              </label>
              <input 
                type="url" 
                value={applyForMeLink} 
                onChange={e => setApplyForMeLink(e.target.value)} 
                placeholder="https://payment-link.com/..." 
                className={`${inputCls} border-yellow-200 focus:border-yellow-500 bg-white dark:bg-zinc-900`} 
              />
              <p className="text-xs text-yellow-700 dark:text-amber-600/70 mt-1.5 font-medium">Overwrites the default service page link for this specific job.</p>
            </div>
            
            <div className="space-y-3">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Application & PDF Links</label>
              {links.map((l, i) => {
                const isNotificationRow = l.label.toLowerCase().includes("notification") || l.label.toLowerCase().includes("pdf");
                const isThisUploading = uploadingPdfIndex === i;
                return (
                  <div key={i} className="flex gap-3 items-center">
                    <input type="text" value={l.label} onChange={e => { const n = [...links]; n[i].label = e.target.value; setLinks(n); }} placeholder="e.g. Apply Online" className={`${inputCls} flex-1 bg-gray-50 dark:bg-zinc-900`} />
                    <div className="relative flex-[1.5] flex items-center">
                      <input 
                        type="url" 
                        value={isThisUploading ? "Uploading PDF..." : l.url} 
                        onChange={e => { const n = [...links]; n[i].url = e.target.value; setLinks(n); }} 
                        disabled={isThisUploading}
                        placeholder="https://..." 
                        className={`${inputCls} pr-12 bg-gray-50 dark:bg-zinc-900 ${isThisUploading ? "opacity-70 text-indigo-500" : ""}`} 
                      />
                      {isNotificationRow && !isThisUploading && (
                        <label className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 text-indigo-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-zinc-700 transition-colors" title="Upload Official PDF">
                          <UploadCloud className="h-4 w-4" />
                          <input type="file" className="hidden" accept="application/pdf" onChange={(e) => handleNotificationPdfUpload(e, i)} />
                        </label>
                      )}
                      {isThisUploading && <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-indigo-500" />}
                    </div>
                    <button type="button" onClick={() => setLinks(links.filter((_, idx) => idx !== i))} className="p-2.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors"><Trash2 className="h-5 w-5" /></button>
                  </div>
                );
              })}
              <button type="button" onClick={() => setLinks([...links, { label: "", url: "" }])} className="text-sm font-bold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 flex items-center gap-2 mt-4 px-3 py-2 rounded-lg transition-colors w-fit border border-indigo-100 dark:border-indigo-900/50">
                <PlusCircle className="h-4 w-4" /> Add Link
              </button>
            </div>
          </SectionCard>
        </div>

        {/* Right Column: Live Mobile Preview (Sticky) */}
        <div className="hidden xl:block w-[420px] shrink-0 sticky top-28 h-[calc(100vh-8rem)] overflow-y-auto no-scrollbar">
          <div className="bg-[#000000] border-4 border-gray-800 dark:border-zinc-800 rounded-[2.5rem] shadow-2xl overflow-hidden relative w-full pb-10">
            {/* Dynamic Island / Notch Mock */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-gray-800 dark:bg-zinc-800 rounded-b-2xl z-20"></div>
            
            <div className="h-full bg-gray-50 dark:bg-[#000000] overflow-y-auto pt-6">
              {/* Preview Header */}
              <div className="px-5 py-3 border-b border-gray-100 dark:border-zinc-900 bg-white dark:bg-[#000000] sticky top-0 z-10 flex items-center justify-between">
                <span className="text-xs font-bold text-gray-400">Rojgar Suvidha</span>
                <span className="text-[10px] font-bold text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-0.5 rounded-full animate-pulse">Live Preview</span>
              </div>
              
              {/* Preview Content */}
              <div>
                {bannerUrl ? (
                  <img src={bannerUrl} alt="Banner" className="w-full aspect-video object-cover" />
                ) : (
                  <div className="w-full aspect-video bg-gray-200 dark:bg-zinc-900 flex items-center justify-center text-gray-400 text-xs font-bold">Image Placeholder</div>
                )}
                <div className="p-5">
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    <span className="px-2.5 py-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-md text-[10px] font-extrabold uppercase tracking-wider">{category.replace("-", " ")}</span>
                    {tag && <span className="px-2.5 py-1 bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 rounded-md text-[10px] font-extrabold uppercase tracking-wider">{tag}</span>}
                  </div>
                  <h1 className="text-xl font-black text-gray-900 dark:text-white leading-snug mb-4">{title || "Your Job Title Will Appear Here"}</h1>
                  
                  {/* Highlights Mock */}
                  {(appFee || ageLimit || education || lastDate) && (
                    <div className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-100 dark:border-zinc-800 p-3 mb-6 grid grid-cols-2 gap-3 text-xs">
                      {lastDate && <div><span className="text-gray-400 block mb-0.5">Last Date</span><span className="font-bold text-gray-900 dark:text-white">{lastDate}</span></div>}
                      {appFee && <div><span className="text-gray-400 block mb-0.5">Fee</span><span className="font-bold text-gray-900 dark:text-white">{appFee}</span></div>}
                      {ageLimit && <div><span className="text-gray-400 block mb-0.5">Age</span><span className="font-bold text-gray-900 dark:text-white">{ageLimit}</span></div>}
                      {education && <div><span className="text-gray-400 block mb-0.5">Eligibility</span><span className="font-bold text-gray-900 dark:text-white">{education}</span></div>}
                    </div>
                  )}

                  {/* HTML Content Render */}
                  <div className="prose prose-sm prose-indigo dark:prose-invert max-w-none text-gray-700 dark:text-gray-300" dangerouslySetInnerHTML={{ __html: blogContent || "<p class='text-gray-400 italic text-sm'>Article content will appear here. Start typing on the left!</p>" }} />
                  
                  {/* Links Mock */}
                  {links.filter(l => l.url && l.label).length > 0 && (
                     <div className="mt-8 pt-6 border-t border-gray-100 dark:border-zinc-800">
                        <h4 className="font-bold text-sm text-gray-900 dark:text-white mb-3">Important Links</h4>
                        <div className="flex flex-col gap-2">
                           {links.filter(l => l.url && l.label).map((l, i) => (
                              <div key={i} className="px-4 py-2.5 bg-indigo-50 dark:bg-zinc-900 text-indigo-700 dark:text-indigo-400 rounded-lg text-xs font-bold text-center border border-indigo-100 dark:border-zinc-800">{l.label}</div>
                           ))}
                        </div>
                     </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
