"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, Trash2, FileText, CheckCircle2, IndianRupee, Loader2, Plus, Sparkles, AlertCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";
import toast from "react-hot-toast";

interface FeeStructure {
  genMale: string; genFemale: string;
  obcMale: string; obcFemale: string;
  scStMale: string; scStFemale: string;
  pwd: string;
  serviceCharge?: string;
  genFee?: string;
  scFee?: string;
}

interface PostOption {
  id: string;
  postName: string;
  fees: FeeStructure;
}

const defaultFees: FeeStructure = {
  genMale: "100", genFemale: "0",
  obcMale: "100", obcFemale: "0",
  scStMale: "0", scStFemale: "0",
  pwd: "0",
  serviceCharge: "99",
};

export default function EditDirectFormPage({ params }: { params: Promise<{ formId: string }> }) {
  const { formId } = use(params);
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [formTitle, setFormTitle] = useState("");
  const [globalServiceCharge, setGlobalServiceCharge] = useState("99");
  const [status, setStatus] = useState("active");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Dynamic Documents List
  const [documents, setDocuments] = useState<string[]>([]);
  const [newDoc, setNewDoc] = useState("");

  // Multiple Posts Structure
  const [posts, setPosts] = useState<PostOption[]>([]);

  useEffect(() => {
    async function loadForm() {
      if (!formId) return;
      try {
        const { data, error: err } = await supabase
          .from("custom_forms")
          .select("*")
          .eq("id", formId)
          .single();

        if (err || !data) {
          setError("Form not found in database.");
          setLoading(false);
          return;
        }

        setFormTitle(data.title || "");
        setStatus(data.status || "active");
        setDocuments(data.documents || []);

        if (data.fees_structure && Array.isArray(data.fees_structure)) {
          const loadedPosts: PostOption[] = data.fees_structure.map((item: any, idx: number) => ({
            id: item.id || `post_${idx}_${Date.now()}`,
            postName: item.postName || item.title || `Post ${idx + 1}`,
            fees: {
              genMale: item.fees?.genMale || item.fees?.genFee || "100",
              genFemale: item.fees?.genFemale || "0",
              obcMale: item.fees?.obcMale || item.fees?.genFee || "100",
              obcFemale: item.fees?.obcFemale || "0",
              scStMale: item.fees?.scStMale || item.fees?.scFee || "0",
              scStFemale: item.fees?.scStFemale || "0",
              pwd: item.fees?.pwd || "0",
              serviceCharge: item.fees?.serviceCharge || "99",
            },
          }));

          setPosts(loadedPosts);
          if (loadedPosts[0]?.fees?.serviceCharge) {
            setGlobalServiceCharge(loadedPosts[0].fees.serviceCharge);
          }
        } else {
          setPosts([{ id: "post_default", postName: data.title || "General Candidate", fees: { ...defaultFees } }]);
        }
      } catch (e: any) {
        setError(e.message || "Failed to load form");
      } finally {
        setLoading(false);
      }
    }

    loadForm();
  }, [formId]);

  const handleAddDocument = () => {
    if (newDoc.trim() && !documents.includes(newDoc.trim())) {
      setDocuments([...documents, newDoc.trim()]);
      setNewDoc("");
    }
  };

  const handleRemoveDocument = (index: number) => {
    setDocuments(documents.filter((_, i) => i !== index));
  };

  const handleAddPost = () => {
    setPosts([...posts, { id: `post_${Date.now()}`, postName: "", fees: { ...defaultFees, serviceCharge: globalServiceCharge } }]);
  };

  const handleRemovePost = (id: string) => {
    if (posts.length === 1) {
      toast.error("Form must have at least one post/category!");
      return;
    }
    setPosts(posts.filter((p) => p.id !== id));
  };

  const updatePostName = (id: string, name: string) => {
    setPosts(posts.map((p) => (p.id === id ? { ...p, postName: name } : p)));
  };

  const handleFeeChange = (postId: string, field: keyof FeeStructure, value: string) => {
    if (/^\d*$/.test(value)) {
      setPosts(
        posts.map((p) => {
          if (p.id === postId) {
            return { ...p, fees: { ...p.fees, [field]: value } };
          }
          return p;
        })
      );
    }
  };

  const handleSave = async () => {
    if (!formTitle.trim()) {
      setError("Please enter a Form Title (e.g. SSC GD Constable 2026 Form)");
      return;
    }

    const invalidPost = posts.find((p) => !p.postName.trim());
    if (invalidPost) {
      setError("Please ensure all post/category options have a name.");
      return;
    }

    if (!globalServiceCharge || isNaN(Number(globalServiceCharge)) || Number(globalServiceCharge) < 0) {
      setError("Please enter a valid Portal Service Charge (₹).");
      return;
    }

    setSaving(true);
    setError(null);

    const postsWithCharge = posts.map((p) => ({
      ...p,
      fees: { ...p.fees, serviceCharge: globalServiceCharge },
    }));

    const { error: dbError } = await supabase
      .from("custom_forms")
      .update({
        title: formTitle,
        documents,
        fees_structure: postsWithCharge,
        status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", formId);

    if (dbError) {
      toast.error("Save failed: " + dbError.message);
      setSaving(false);
    } else {
      toast.success("Application Form updated successfully! 🎉");
      router.push("/admin/direct-form");
    }
  };

  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto pb-12 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/direct-form"
            className="p-2 rounded-xl bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-800 text-gray-600 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h2 className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-2">
              ✏️ Edit Application Form & Fee Structure
            </h2>
            <p className="text-xs text-gray-500">Form ID: {formId}</p>
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-2.5 rounded-xl font-extrabold bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/20 flex items-center gap-2 transition-all disabled:opacity-50"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {saving ? "Updating..." : "Save Changes"}
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 text-sm font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Card 1: General Details */}
      <div className="bg-white dark:bg-zinc-950 p-6 rounded-2xl border border-gray-200 dark:border-zinc-800 shadow-sm space-y-4">
        <h3 className="font-extrabold text-base text-gray-900 dark:text-white flex items-center gap-2 border-b border-gray-100 dark:border-zinc-900 pb-3">
          <FileText className="w-4 h-4 text-indigo-600" /> Basic Details & Status
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2 space-y-1.5">
            <label className="text-xs font-bold text-gray-600 dark:text-gray-400">Form Title</label>
            <input
              type="text"
              value={formTitle}
              onChange={(e) => setFormTitle(e.target.value)}
              placeholder="e.g. SSC GD Constable 2026 Online Application"
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 font-bold text-sm outline-none focus:border-indigo-500"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-600 dark:text-gray-400">Portal Service Charge (₹)</label>
            <div className="relative">
              <IndianRupee className="w-4 h-4 text-emerald-500 absolute left-3 top-3" />
              <input
                type="number"
                value={globalServiceCharge}
                onChange={(e) => setGlobalServiceCharge(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 font-bold text-sm outline-none focus:border-indigo-500 text-emerald-600 dark:text-emerald-400"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-600 dark:text-gray-400">Form Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 font-bold text-sm outline-none focus:border-indigo-500"
            >
              <option value="active">🟢 Active (Form Open)</option>
              <option value="closed">🔴 Closed (Form Locked)</option>
              <option value="coming_soon">⏳ Coming Soon</option>
            </select>
          </div>
        </div>
      </div>

      {/* Card 2: Required Documents Checklist */}
      <div className="bg-white dark:bg-zinc-950 p-6 rounded-2xl border border-gray-200 dark:border-zinc-800 shadow-sm space-y-4">
        <h3 className="font-extrabold text-base text-gray-900 dark:text-white flex items-center gap-2 border-b border-gray-100 dark:border-zinc-900 pb-3">
          <CheckCircle2 className="w-4 h-4 text-indigo-600" /> Required Documents Checklist
        </h3>

        <div className="flex gap-2">
          <input
            type="text"
            value={newDoc}
            onChange={(e) => setNewDoc(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddDocument())}
            placeholder="Add document name (e.g. 10th Marksheet, Driving License, Caste Cert)"
            className="flex-1 px-4 py-2 rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-sm font-medium outline-none focus:border-indigo-500"
          />
          <button
            type="button"
            onClick={handleAddDocument}
            className="px-4 py-2 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 font-bold text-sm rounded-xl border border-indigo-200 dark:border-indigo-900 hover:bg-indigo-100 transition-colors flex items-center gap-1"
          >
            <Plus className="w-4 h-4" /> Add Tag
          </button>
        </div>

        <div className="flex flex-wrap gap-2 pt-2">
          {documents.map((doc, idx) => (
            <span
              key={idx}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-100 dark:bg-zinc-900 text-gray-800 dark:text-gray-200 text-xs font-bold border border-gray-200 dark:border-zinc-800"
            >
              {doc}
              <button
                type="button"
                onClick={() => handleRemoveDocument(idx)}
                className="text-gray-400 hover:text-red-500 transition-colors ml-1"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      </div>

      {/* Card 3: Post-Wise Fee Structure Matrix */}
      <div className="bg-white dark:bg-zinc-950 p-6 rounded-2xl border border-gray-200 dark:border-zinc-800 shadow-sm space-y-6">
        <div className="flex items-center justify-between border-b border-gray-100 dark:border-zinc-900 pb-3">
          <h3 className="font-extrabold text-base text-gray-900 dark:text-white flex items-center gap-2">
            <IndianRupee className="w-4 h-4 text-emerald-500" /> Post / Category Fee Structure
          </h3>
          <button
            type="button"
            onClick={handleAddPost}
            className="px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 font-bold text-xs rounded-xl border border-emerald-200 dark:border-emerald-900 hover:bg-emerald-100 transition-colors flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" /> Add Post Option
          </button>
        </div>

        <div className="space-y-6">
          {posts.map((post, index) => (
            <div
              key={post.id}
              className="p-5 rounded-2xl bg-gray-50 dark:bg-zinc-900/50 border border-gray-200 dark:border-zinc-800 space-y-4"
            >
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1 space-y-1">
                  <label className="text-xs font-bold text-gray-500">Post / Category Name #{index + 1}</label>
                  <input
                    type="text"
                    value={post.postName}
                    onChange={(e) => updatePostName(post.id, e.target.value)}
                    placeholder="e.g. Sub-Inspector / Constable / General Candidate"
                    className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 font-bold text-sm outline-none focus:border-indigo-500"
                  />
                </div>
                {posts.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemovePost(post.id)}
                    className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/50 rounded-xl transition-colors mt-5"
                    title="Remove Post"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Fees breakdown inputs */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-gray-500">Gen/OBC Fee (₹)</label>
                  <input
                    type="text"
                    value={post.fees.genMale}
                    onChange={(e) => handleFeeChange(post.id, "genMale", e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 font-bold text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-gray-500">SC/ST Fee (₹)</label>
                  <input
                    type="text"
                    value={post.fees.scStMale}
                    onChange={(e) => handleFeeChange(post.id, "scStMale", e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 font-bold text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-gray-500">Female Fee (₹)</label>
                  <input
                    type="text"
                    value={post.fees.genFemale}
                    onChange={(e) => handleFeeChange(post.id, "genFemale", e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 font-bold text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-gray-500">PwD Fee (₹)</label>
                  <input
                    type="text"
                    value={post.fees.pwd}
                    onChange={(e) => handleFeeChange(post.id, "pwd", e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 font-bold text-xs"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
