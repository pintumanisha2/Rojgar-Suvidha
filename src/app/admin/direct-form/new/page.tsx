"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, Trash2, FileText, CheckCircle2, IndianRupee, FileUp, Loader2, Plus } from "lucide-react";
import { supabase } from "@/lib/supabase";
import toast from "react-hot-toast";

interface FeeStructure {
  genMale: string; genFemale: string;
  obcMale: string; obcFemale: string;
  scStMale: string; scStFemale: string;
  pwd: string;
}

interface PostOption {
  id: string;
  postName: string;
  fees: FeeStructure;
}

const defaultFees: FeeStructure = {
  genMale: "0", genFemale: "0",
  obcMale: "0", obcFemale: "0",
  scStMale: "0", scStFemale: "0",
  pwd: "0",
};

export default function CreateDirectFormPage() {
  const router = useRouter();
  const [formTitle, setFormTitle] = useState("");
  const [globalServiceCharge, setGlobalServiceCharge] = useState("50");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Dynamic Documents List
  const [documents, setDocuments] = useState<string[]>(["Passport Size Photo", "Signature"]);
  const [newDoc, setNewDoc] = useState("");

  // Multiple Posts Structure
  const [posts, setPosts] = useState<PostOption[]>([
    { id: Date.now().toString(), postName: "Default Post", fees: { ...defaultFees } }
  ]);

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
    setPosts([...posts, { id: Date.now().toString(), postName: "", fees: { ...defaultFees } }]);
  };

  const handleRemovePost = (id: string) => {
    if (posts.length === 1) return; // Must have at least one post
    setPosts(posts.filter(p => p.id !== id));
  };

  const updatePostName = (id: string, name: string) => {
    setPosts(posts.map(p => p.id === id ? { ...p, postName: name } : p));
  };

  const handleFeeChange = (postId: string, field: keyof FeeStructure, value: string) => {
    if (/^\d*$/.test(value)) {
      setPosts(posts.map(p => {
        if (p.id === postId) {
          return { ...p, fees: { ...p.fees, [field]: value } };
        }
        return p;
      }));
    }
  };

  const handleSave = async () => {
    if (!formTitle.trim()) {
      setError("Please enter a Form Title (e.g. SSC CGL Application)");
      return;
    }

    // Check if all posts have a name
    const invalidPost = posts.find(p => !p.postName.trim());
    if (invalidPost) {
      setError("Please ensure all posts have a name (e.g. Constable, SI).");
      return;
    }

    if (!globalServiceCharge || isNaN(Number(globalServiceCharge)) || Number(globalServiceCharge) < 0) {
      setError("Please enter a valid Portal Service Charge (₹).");
      return;
    }

    setSaving(true);
    setError(null);

    // Inject global service charge into each post's fees
    const postsWithCharge = posts.map(p => ({
      ...p,
      fees: { ...p.fees, serviceCharge: globalServiceCharge }
    }));

    const { error: dbError } = await supabase.from("custom_forms").insert([{
      title: formTitle,
      documents: documents,
      fees_structure: postsWithCharge,
      status: "active"
    }]);

    if (dbError) {
      toast.error("Save failed: " + dbError.message);
      setSaving(false);
    } else {
      toast.success("Form created successfully! 🎉");
      router.push("/admin/direct-form");
    }
  };

  return (
    <div className="max-w-5xl mx-auto pb-12 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/admin/direct-form" className="p-2 rounded-xl bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-800 text-gray-600 transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h2 className="text-2xl font-black text-gray-900 dark:text-white">Create Application Form</h2>
            <p className="text-sm text-gray-500">Design documents, fee structure, and get a shareable link.</p>
          </div>
        </div>

        <button onClick={handleSave} disabled={saving} className="px-6 py-2.5 rounded-xl font-extrabold bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/20 flex items-center gap-2 transition-all disabled:opacity-50">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} 
          {saving ? "Saving..." : "Save & Publish Form"}
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 rounded-xl text-sm font-bold border border-red-200 dark:border-red-900/50">
          {error}
        </div>
      )}

      {/* Form Title */}
      <div className="bg-white dark:bg-zinc-950 rounded-2xl border border-gray-100 dark:border-zinc-900 p-6 shadow-sm">
        <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Form Title / Job Name</label>
        <input 
          type="text" 
          value={formTitle} 
          onChange={e => setFormTitle(e.target.value)} 
          placeholder="e.g. SSC Phase 12 Application" 
          className="w-full px-4 py-3 bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl text-lg font-black focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-white"
        />
      </div>

      {/* Global Service Charge */}
      <div className="bg-white dark:bg-zinc-950 rounded-2xl border border-gray-100 dark:border-zinc-900 p-6 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Portal Service Charge (₹)</label>
            <p className="text-xs text-gray-500 max-w-sm">This is Rojgar Suvidha's fee on top of the official exam fee. Applied globally to all posts in this form.</p>
          </div>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-600 font-black text-lg">₹</span>
            <input
              type="number"
              min="0"
              value={globalServiceCharge}
              onChange={e => { if (/^\d*$/.test(e.target.value)) setGlobalServiceCharge(e.target.value); }}
              className="w-28 pl-8 pr-4 py-3 bg-emerald-50 dark:bg-emerald-950/20 border-2 border-emerald-200 dark:border-emerald-700/50 rounded-xl text-lg font-black text-emerald-700 dark:text-emerald-400 text-center focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>
      </div>

      {/* Fixed Requirements */}
      <div className="bg-white dark:bg-zinc-950 rounded-2xl border border-gray-100 dark:border-zinc-900 p-6 shadow-sm">
        <h3 className="font-black text-gray-900 dark:text-white flex items-center gap-2 text-base border-b border-gray-100 dark:border-zinc-900 pb-3 mb-4">
          <CheckCircle2 className="h-5 w-5 text-green-500" /> 
          Basic Details (Always Fixed)
        </h3>
        <div className="flex flex-wrap gap-2">
          {["Full Name", "Father's Name", "Mother's Name", "Phone", "Email", "Alternate Phone", "Aadhar Number", "DOB", "Gender", "Category", "PH/Divyang"].map(field => (
            <span key={field} className="px-3 py-1.5 bg-gray-100 dark:bg-zinc-900 text-gray-600 dark:text-gray-300 text-xs font-bold rounded-lg border border-gray-200 dark:border-zinc-800">
              {field} 🔒
            </span>
          ))}
        </div>
      </div>

      {/* Dynamic Documents Section */}
      <div className="bg-white dark:bg-zinc-950 rounded-2xl border border-gray-100 dark:border-zinc-900 p-6 shadow-sm">
        <h3 className="font-black text-gray-900 dark:text-white flex items-center gap-2 text-base border-b border-gray-100 dark:border-zinc-900 pb-3 mb-4">
          <FileUp className="h-5 w-5 text-blue-500" /> 
          Required Documents
        </h3>
        
        <div className="flex gap-2 mb-4">
          <input 
            type="text" 
            value={newDoc} 
            onChange={e => setNewDoc(e.target.value)} 
            onKeyDown={e => e.key === 'Enter' && handleAddDocument()}
            placeholder="e.g. 10th Marksheet, Caste Certificate..." 
            className="flex-1 px-4 py-2.5 bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button onClick={handleAddDocument} type="button" className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors">
            + Add
          </button>
        </div>

        <div className="space-y-2">
          {documents.map((doc, index) => (
            <div key={index} className="flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-zinc-900 rounded-xl border border-gray-100 dark:border-zinc-800">
              <span className="text-sm font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                <FileText className="h-4 w-4 text-gray-400" /> {doc}
              </span>
              <button onClick={() => handleRemoveDocument(index)} type="button" className="text-red-500 hover:bg-red-100 dark:hover:bg-red-950/30 p-1.5 rounded-lg transition-colors">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
          {documents.length === 0 && (
            <p className="text-xs text-gray-400 text-center py-4">No documents added yet. Photo and Signature are added by default.</p>
          )}
        </div>
      </div>

      {/* Multiple Posts & Complex Fees Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between bg-indigo-50 dark:bg-indigo-950/20 p-5 rounded-2xl border border-indigo-100 dark:border-indigo-900/30">
          <div>
            <h3 className="font-black text-indigo-900 dark:text-indigo-400 flex items-center gap-2 text-base">
              <IndianRupee className="h-5 w-5" /> 
              Official Exam Fee — Per Post
            </h3>
            <p className="text-xs text-indigo-600 dark:text-indigo-500 mt-1">Define the official exam fee per category/gender. Portal Service Charge is set globally above.</p>
          </div>
          <button onClick={handleAddPost} type="button" className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-sm transition-colors text-sm">
            <Plus className="h-4 w-4" /> Add Post
          </button>
        </div>

        {posts.map((post, index) => (
          <div key={post.id} className="bg-white dark:bg-zinc-950 rounded-2xl border border-gray-200 dark:border-zinc-800 p-6 shadow-sm relative">
            
            {posts.length > 1 && (
              <button 
                onClick={() => handleRemovePost(post.id)} 
                type="button"
                className="absolute top-4 right-4 p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl transition-colors"
                title="Remove this Post"
              >
                <Trash2 className="h-5 w-5" />
              </button>
            )}

            <div className="mb-6 max-w-sm">
              <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Post Name</label>
              <input 
                type="text" 
                value={post.postName} 
                onChange={e => updatePostName(post.id, e.target.value)} 
                placeholder="e.g. Constable, SI, Matric Level" 
                className="w-full px-4 py-2.5 bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl font-black text-indigo-600 dark:text-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-base"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* General */}
              <div className="space-y-2 p-4 bg-gray-50 dark:bg-zinc-900 rounded-xl border border-gray-100 dark:border-zinc-800">
                <h4 className="font-black text-gray-600 dark:text-gray-400 text-[10px] uppercase text-center tracking-widest mb-3">General (UR)</h4>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <label className="block text-[10px] text-gray-500 uppercase tracking-wide mb-1">Boys (₹)</label>
                    <input type="text" value={post.fees.genMale} onChange={e => handleFeeChange(post.id, "genMale", e.target.value)} className="w-full px-2 py-2 bg-white dark:bg-zinc-950 border border-gray-200 dark:border-zinc-700 rounded-lg text-sm text-center font-bold" />
                  </div>
                  <div className="flex-1">
                    <label className="block text-[10px] text-gray-500 uppercase tracking-wide mb-1">Girls (₹)</label>
                    <input type="text" value={post.fees.genFemale} onChange={e => handleFeeChange(post.id, "genFemale", e.target.value)} className="w-full px-2 py-2 bg-white dark:bg-zinc-950 border border-gray-200 dark:border-zinc-700 rounded-lg text-sm text-center font-bold" />
                  </div>
                </div>
              </div>

              {/* OBC */}
              <div className="space-y-2 p-4 bg-gray-50 dark:bg-zinc-900 rounded-xl border border-gray-100 dark:border-zinc-800">
                <h4 className="font-black text-gray-600 dark:text-gray-400 text-[10px] uppercase text-center tracking-widest mb-3">OBC / EWS</h4>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <label className="block text-[10px] text-gray-500 uppercase tracking-wide mb-1">Boys (₹)</label>
                    <input type="text" value={post.fees.obcMale} onChange={e => handleFeeChange(post.id, "obcMale", e.target.value)} className="w-full px-2 py-2 bg-white dark:bg-zinc-950 border border-gray-200 dark:border-zinc-700 rounded-lg text-sm text-center font-bold" />
                  </div>
                  <div className="flex-1">
                    <label className="block text-[10px] text-gray-500 uppercase tracking-wide mb-1">Girls (₹)</label>
                    <input type="text" value={post.fees.obcFemale} onChange={e => handleFeeChange(post.id, "obcFemale", e.target.value)} className="w-full px-2 py-2 bg-white dark:bg-zinc-950 border border-gray-200 dark:border-zinc-700 rounded-lg text-sm text-center font-bold" />
                  </div>
                </div>
              </div>

              {/* SC/ST */}
              <div className="space-y-2 p-4 bg-gray-50 dark:bg-zinc-900 rounded-xl border border-gray-100 dark:border-zinc-800">
                <h4 className="font-black text-gray-600 dark:text-gray-400 text-[10px] uppercase text-center tracking-widest mb-3">SC / ST</h4>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <label className="block text-[10px] text-gray-500 uppercase tracking-wide mb-1">Boys (₹)</label>
                    <input type="text" value={post.fees.scStMale} onChange={e => handleFeeChange(post.id, "scStMale", e.target.value)} className="w-full px-2 py-2 bg-white dark:bg-zinc-950 border border-gray-200 dark:border-zinc-700 rounded-lg text-sm text-center font-bold" />
                  </div>
                  <div className="flex-1">
                    <label className="block text-[10px] text-gray-500 uppercase tracking-wide mb-1">Girls (₹)</label>
                    <input type="text" value={post.fees.scStFemale} onChange={e => handleFeeChange(post.id, "scStFemale", e.target.value)} className="w-full px-2 py-2 bg-white dark:bg-zinc-950 border border-gray-200 dark:border-zinc-700 rounded-lg text-sm text-center font-bold" />
                  </div>
                </div>
              </div>

              {/* PWD */}
              <div className="space-y-2 p-4 bg-gray-50 dark:bg-zinc-900 rounded-xl border border-gray-100 dark:border-zinc-800">
                <h4 className="font-black text-gray-600 dark:text-gray-400 text-[10px] uppercase text-center tracking-widest mb-3">PH / Divyang</h4>
                <div>
                  <label className="block text-[10px] text-gray-500 uppercase tracking-wide mb-1">PWD (₹)</label>
                  <input type="text" value={post.fees.pwd} onChange={e => handleFeeChange(post.id, "pwd", e.target.value)} className="w-full px-2 py-2 bg-white dark:bg-zinc-950 border border-gray-200 dark:border-zinc-700 rounded-lg text-sm text-center font-bold" />
                </div>
              </div>

            </div>
          </div>
        ))}

      </div>
    </div>
  );
}
