"use client";

import { useState, useEffect, use } from "react";
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
  { value: "out", label: "🟢 Out" },
  { value: "last", label: "🔴 Last Date" },
  { value: "soon", label: "⏳ Coming Soon" },
  { value: "closed", label: "❌ Closed" },
  { value: "draft", label: "📝 Draft" },
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

export default function EditJobPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
  const [applyForMeLink, setApplyForMeLink] = useState("");
  const [links, setLinks] = useState<LinkRow[]>([]);
  
  const [isGeneratingBlog, setIsGeneratingBlog] = useState(false);

  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [previewDevice, setPreviewDevice] = useState<"desktop" | "mobile">("desktop");
  const [uploadingPdfIndex, setUploadingPdfIndex] = useState<number | null>(null);

  useEffect(() => {
    const fetchPost = async () => {
      setLoading(true);
      const { data, error } = await supabase.from("jobs").select("*").eq("id", id).single();
      if (error) {
        setError("Failed to fetch post: " + error.message);
      } else if (data) {
        setTitle(data.title);
        setCategory(data.category);
        setStatus(data.status);
        setStateCode(data.state_code || "");
        setTag(data.tag || "");
        setShortInfo(data.short_info || "");
        setMetaDesc(data.meta_description || "");
        setBannerUrl(data.banner_url || "");
        setBlogContent(data.blog_content || "");
        
        const fetchedLinks = data.links || [];
        const applyLink = fetchedLinks.find((l: any) => l.label === "Apply For Me");
        if (applyLink) {
          setApplyForMeLink(applyLink.url);
          setLinks(fetchedLinks.filter((l: any) => l.label !== "Apply For Me"));
        } else {
          setLinks(fetchedLinks);
        }
        
        if (data.important_dates && data.important_dates.length > 0) {
          const lastDateObj = data.important_dates.find((d: any) => d.label === "Last Date");
          if (lastDateObj) setLastDate(lastDateObj.value);
        }
      }
      setLoading(false);
    };
    fetchPost();
  }, [id]);

  const slugify = (text: string) => text.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

  const handleSave = async (isDraft = false) => {
    console.log("handleSave started");
    try {
      if (!title || typeof title !== 'string' || !title.trim()) { 
        alert("Title likhna zaroori hai."); 
        setError("Title likhna zaroori hai."); 
        return; 
      }
      
      if (isDraft) setSavingDraft(true); else setSaving(true);
      setError(null);

      console.log("Constructing payload...");
      const payload: any = {
        title: title.trim(),
        slug: slugify(title),
        category,
        status: isDraft ? "draft" : status,
        state_code: stateCode || null,
        tag: tag || null,
        short_info: shortInfo,
        meta_description: metaDesc,
        banner_url: bannerUrl || null,
        blog_content: blogContent,
        links: (applyForMeLink && typeof applyForMeLink === 'string' && applyForMeLink.trim()) 
                 ? [...links, { label: "Apply For Me", url: applyForMeLink.trim() }] 
                 : links,
        important_dates: lastDate ? [{ label: "Last Date", value: lastDate }] : [],
      };

      console.log("Payload:", payload);
      const { error: dbErr } = await supabase.from("jobs").update(payload).eq("id", id);
      
      console.log("Supabase response error:", dbErr);
      if (dbErr) {
        alert("Database Error: " + dbErr.message);
        setError(dbErr.message);
      } else {
        alert("Job updated successfully!");
        window.location.href = "/admin/jobs";
      }
    } catch (err: any) {
      console.error("Crash during save:", err);
      alert("Failed to update post: " + err.message);
      setError("Failed to update post: " + err.message);
    } finally {
      console.log("Finally block executed");
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
    `;
    setBlogContent(tableHtml + blogContent);
  };

  const handleGenerateBlog = async () => {
    if (!title.trim()) {
      alert("Please enter a Title first so AI knows what to write about.");
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
      alert(err.message || "Something went wrong with AI generation.");
    } finally {
      setIsGeneratingBlog(false);
    }
  };

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setSavingDraft(true);
    try {
      // Compress the image before uploading (Max width 1200px, 80% quality)
      const compressedFile = await compressImage(file, 1200, 0.8);
      
      const fileExt = compressedFile.name.split('.').pop() || 'jpg';
      const fileName = `${Date.now()}_banner.${fileExt}`;
      const { data, error } = await supabase.storage.from('banners').upload(fileName, compressedFile);
      if (error) throw error;
      const { data: { publicUrl } } = supabase.storage.from('banners').getPublicUrl(fileName);
      setBannerUrl(publicUrl);
    } catch (err: any) {
      alert("Banner upload failed: " + err.message);
    } finally {
      setSavingDraft(false);
    }
  };

  const handleNotificationPdfUpload = async (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setUploadingPdfIndex(index);
    setSavingDraft(true);
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
      
      alert(`PDF successfully uploaded!\nServing URL: ${customServeUrl} ✓`);
    } catch (err: any) {
      alert("PDF Upload failed: " + err.message);
    } finally {
      setSavingDraft(false);
      setUploadingPdfIndex(null);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-40">
        <Loader2 className="h-10 w-10 animate-spin text-indigo-500 mb-4" />
        <p className="text-gray-500 animate-pulse">Loading post data...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto pb-20">
      
      {/* Standard Header */}
      <div className="flex items-center justify-between gap-4 mb-8 pb-6 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center gap-4">
          <Link href="/admin/jobs" className="p-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 text-gray-600 transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Edit Post</h2>
            <p className="text-sm text-gray-500 font-medium">Update job or blog entry details</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button onClick={() => setIsPreviewMode(!isPreviewMode)} className="px-4 py-2.5 rounded-xl font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 flex items-center gap-2">
            {isPreviewMode ? "Back to Edit" : "Preview Post"}
          </button>
          <button onClick={() => handleSave(true)} disabled={savingDraft || saving} className="px-5 py-2.5 rounded-xl font-bold border border-gray-200 text-gray-700 hover:bg-gray-50">
            {savingDraft ? "Saving..." : "Draft"}
          </button>
          <button onClick={() => handleSave(false)} disabled={savingDraft || saving} className="px-6 py-2.5 rounded-xl font-bold bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-2 shadow-sm">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Update
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 p-4 rounded-xl text-sm font-medium mb-6 flex items-center gap-2">
          ⚠️ {error}
        </div>
      )}

      {isPreviewMode ? (
        <div className="space-y-6">
          <div className="flex items-center justify-center gap-4 bg-gray-50 dark:bg-gray-800/50 p-2 rounded-2xl border border-gray-100 dark:border-gray-800">
             <button onClick={() => setPreviewDevice("desktop")} className={`p-2 rounded-lg ${previewDevice === "desktop" ? "bg-white dark:bg-gray-700 shadow-sm text-indigo-600" : "text-gray-400"}`}><Monitor className="h-5 w-5" /></button>
             <button onClick={() => setPreviewDevice("mobile")} className={`p-2 rounded-lg ${previewDevice === "mobile" ? "bg-white dark:bg-gray-700 shadow-sm text-indigo-600" : "text-gray-400"}`}><Phone className="h-5 w-5" /></button>
          </div>

          <div className={`mx-auto bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-700 shadow-2xl overflow-hidden transition-all duration-500 ${previewDevice === "mobile" ? "max-w-[375px]" : "max-w-full"}`}>
             {bannerUrl && <img src={bannerUrl} alt="Banner" className="w-full aspect-video object-cover" />}
             <div className="p-8">
                <div className="flex items-center gap-2 mb-4">
                  <span className="px-3 py-1 bg-indigo-100 text-indigo-600 rounded-full text-xs font-bold uppercase tracking-wider">{category.replace("-", " ")}</span>
                  <span className="text-gray-400 text-xs">{new Date().toLocaleDateString("en-IN")}</span>
                </div>
                <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-6 leading-tight">{title || "Your Blog Title Will Appear Here"}</h1>
                <div className="prose prose-indigo dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: blogContent || "<p className='text-gray-400 italic'>No content written yet...</p>" }} />
                {links.length > 0 && links.some(l => l.url) && (
                   <div className="mt-10 pt-8 border-t border-gray-100 dark:border-gray-800">
                      <h4 className="font-bold text-gray-900 dark:text-white mb-4">Important Links</h4>
                      <div className="flex flex-wrap gap-3">
                         {links.filter(l => l.url).map((l, i) => (
                            <a key={i} href={l.url} target="_blank" className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold shadow-md shadow-indigo-600/20">{l.label}</a>
                         ))}
                      </div>
                   </div>
                )}
             </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {category !== "news" && (
            <SectionCard icon={<Zap className="h-5 w-5" />} title="Job Quick Highlights">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-5">
                  <Field label="Application Fee">
                    <input type="text" value={appFee} onChange={e => setAppFee(e.target.value)} placeholder="e.g., Gen: 500, SC/ST: 0" className={inputCls} />
                  </Field>
                  <Field label="Age Limit">
                    <input type="text" value={ageLimit} onChange={e => setAgeLimit(e.target.value)} placeholder="e.g., 18-27 Years" className={inputCls} />
                  </Field>
                  <Field label="Education">
                    <input type="text" value={education} onChange={e => setEducation(e.target.value)} placeholder="e.g., 10th / Graduate" className={inputCls} />
                  </Field>
                  <Field label="Total Posts">
                    <input type="text" value={totalPosts} onChange={e => setTotalPosts(e.target.value)} placeholder="e.g., 1500 Posts" className={inputCls} />
                  </Field>
              </div>
              <button 
                  type="button"
                  onClick={generateJobTable}
                  className="w-full py-3 border-2 border-dashed border-indigo-200 dark:border-indigo-900/50 rounded-xl text-indigo-600 dark:text-indigo-400 font-bold hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all flex items-center justify-center gap-2"
              >
                  <TableIcon className="h-4 w-4" /> Generate & Insert Table into Editor
              </button>
            </SectionCard>
          )}

          <SectionCard icon={<Briefcase className="h-5 w-5" />} title="Basic Information">
            <div className="space-y-5">
              <Field label="Blog / Job Title" required>
                <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g., SSC CGL 2026 Notification Out" className={`${inputCls} text-lg font-medium border-indigo-100 dark:border-indigo-900 focus:border-indigo-500`} />
              </Field>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <Field label="Category" required>
                  <select value={category} onChange={e => setCategory(e.target.value)} className={selectCls}>
                    {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                </Field>
                <Field label="Status" required>
                  <select value={status} onChange={e => setStatus(e.target.value)} className={selectCls}>
                    {STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>
                </Field>
                {category !== "news" && (
                  <Field label="Last Date (Optional)">
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                      <input type="text" value={lastDate} onChange={e => setLastDate(e.target.value)} placeholder="e.g., 20-Oct-2026" className={`${inputCls} pl-9`} />
                    </div>
                  </Field>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <Field label="State / Region">
                  <select value={stateCode} onChange={e => setStateCode(e.target.value)} className={selectCls}>
                    {INDIAN_STATES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>
                </Field>
                <Field label="Tag">
                  <select value={tag} onChange={e => setTag(e.target.value)} className={selectCls}>
                    {TAGS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </Field>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                 <Field label="Short Description">
                    <textarea rows={2} value={shortInfo} onChange={e => setShortInfo(e.target.value)} placeholder="Short summary for the homepage card..." className={inputCls} />
                 </Field>
                 <Field label="Meta Description (SEO)">
                    <textarea rows={2} value={metaDesc} onChange={e => setMetaDesc(e.target.value)} maxLength={160} placeholder="Max 160 characters..." className={inputCls} />
                 </Field>
              </div>
            </div>
          </SectionCard>

          <SectionCard icon={<FileText className="h-5 w-5" />} title="Blog Content">
            <div className="mb-5">
              <Field label="Featured / Banner Image">
                <div className="flex flex-col md:flex-row gap-4 items-start">
                  <div className="flex-1 w-full">
                    <div className="relative">
                      <input type="url" value={bannerUrl} onChange={e => setBannerUrl(e.target.value)} placeholder="Paste image URL or upload →" className={`${inputCls} pr-12`} />
                      <label className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 rounded-lg cursor-pointer transition-colors">
                        <UploadCloud className="h-5 w-5" />
                        <input type="file" className="hidden" accept="image/*" onChange={handleBannerUpload} />
                      </label>
                    </div>
                  </div>
                  {bannerUrl && (
                    <div className="h-24 w-44 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 shadow-sm shrink-0">
                      <img src={bannerUrl} alt="Banner Preview" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>
              </Field>
            </div>
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 gap-3">
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Detailed Article Content</label>
                <div className="flex items-center gap-2">
                  <div className="text-[10px] bg-indigo-100 text-indigo-700 px-2 py-1 rounded uppercase font-bold">Rich Text Enabled</div>
                  <button 
                    type="button" 
                    onClick={handleGenerateBlog} 
                    disabled={isGeneratingBlog}
                    className="flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-xs font-bold rounded-lg shadow-md transition-all disabled:opacity-50"
                  >
                    {isGeneratingBlog ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                    {isGeneratingBlog ? "AI is Writing..." : "Auto-Generate SEO Blog"}
                  </button>
                </div>
              </div>
              <div className="border border-indigo-100 dark:border-indigo-900/50 rounded-2xl overflow-hidden shadow-sm relative">
                {isGeneratingBlog && (
                  <div className="absolute inset-0 bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm z-10 flex flex-col items-center justify-center">
                    <Loader2 className="w-10 h-10 animate-spin text-indigo-600 mb-2" />
                    <p className="text-indigo-800 dark:text-indigo-200 font-bold animate-pulse">Writing 800+ word SEO optimized content...</p>
                  </div>
                )}
                <RichTextEditor value={blogContent} onChange={setBlogContent} placeholder="Blog content update karein..." />
              </div>
            </div>
          </SectionCard>

          <SectionCard icon={<LinkIcon className="h-5 w-5" />} title="Important Links">
            <div className="mb-6 p-4 bg-indigo-50/50 dark:bg-indigo-900/10 border border-indigo-200 dark:border-indigo-800/50 rounded-xl">
              <label className="block text-sm font-bold text-indigo-800 dark:text-indigo-400 mb-2">
                Custom "Apply For Me" Link (Optional)
              </label>
              <input 
                type="url" 
                value={applyForMeLink} 
                onChange={e => setApplyForMeLink(e.target.value)} 
                placeholder="e.g., https://rzp.io/l/apply-ssc-cgl" 
                className={`${inputCls} border-indigo-200 focus:border-indigo-500 bg-white dark:bg-gray-900`} 
              />
              <p className="text-xs text-indigo-600 dark:text-indigo-500 mt-1">If filled, the orange banner on the blog will redirect here instead of the default page.</p>
            </div>
            <div className="space-y-3">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Regular Links (Table)</label>
              {links.map((l, i) => {
                const isNotificationRow = l.label.toLowerCase().includes("notification") || l.label.toLowerCase().includes("pdf");
                const isThisUploading = uploadingPdfIndex === i;
                return (
                  <div key={i} className="flex gap-3 group">
                    <input type="text" value={l.label} onChange={e => { const n = [...links]; n[i].label = e.target.value; setLinks(n); }} placeholder="Label" className={inputCls} />
                    <div className="relative flex-1 flex items-center">
                      <input 
                        type="url" 
                        value={isThisUploading ? "Uploading PDF..." : l.url} 
                        onChange={e => { const n = [...links]; n[i].url = e.target.value; setLinks(n); }} 
                        disabled={isThisUploading}
                        placeholder="URL (or upload PDF →)" 
                        className={`${inputCls} pr-12 ${isThisUploading ? "bg-indigo-50/50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 font-semibold" : ""}`} 
                      />
                      {isThisUploading ? (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          <Loader2 className="h-4.5 w-4.5 animate-spin text-indigo-600 dark:text-indigo-400" />
                        </div>
                      ) : (
                        isNotificationRow && (
                          <label className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 rounded-lg cursor-pointer transition-colors" title="Upload PDF to your server">
                            <UploadCloud className="h-4 w-4" />
                            <input type="file" className="hidden" accept="application/pdf" onChange={(e) => handleNotificationPdfUpload(e, i)} />
                          </label>
                        )
                      )}
                    </div>
                    <button type="button" onClick={() => setLinks(links.filter((_, idx) => idx !== i))} className="p-2.5 text-red-500 bg-red-50 hover:bg-red-100 rounded-xl transition-colors"><Trash2 className="h-5 w-5" /></button>
                  </div>
                );
              })}
              <button type="button" onClick={() => setLinks([...links, { label: "", url: "" }])} className="text-sm font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1.5 mt-4">
                <PlusCircle className="h-4 w-4" /> Add Another Link
              </button>
            </div>
          </SectionCard>
        </div>
      )}
    </div>
  );
}
