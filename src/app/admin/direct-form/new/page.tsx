"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, Trash2, FileText, CheckCircle2, IndianRupee, FileUp, Loader2, Plus } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface FeeStructure {
  genMale: string; genFemale: string;
  obcMale: string; obcFemale: string;
  scStMale: string; scStFemale: string;
  pwd: string;
  serviceCharge: string;
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
  serviceCharge: "50"
};

export default function CreateDirectFormPage() {
  const router = useRouter();
  const [formTitle, setFormTitle] = useState("");
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

    setSaving(true);
    setError(null);

    const { error: dbError } = await supabase.from("custom_forms").insert([{
      title: formTitle,
      documents: documents,
      fees_structure: posts, // Save the entire array of posts
      status: "active"
    }]);

    if (dbError) {
      setError(dbError.message);
      setSaving(false);
    } else {
      router.push("/admin/direct-form");
    }
  };

  return (
    <div className="max-w-5xl mx-auto pb-12 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/admin/direct-form" className="p-2 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 text-gray-600 transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white">Create Application Form</h2>
            <p className="text-sm text-gray-500">Design documents and multi-post fee structures.</p>
          </div>
        </div>

        <button onClick={handleSave} disabled={saving} className="px-6 py-2.5 rounded-xl font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md flex items-center gap-2 transition-all disabled:opacity-50">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} 
          {saving ? "Saving..." : "Save Form Structure"}
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl text-sm font-medium border border-red-100 dark:border-red-800/30">
          {error}
        </div>
      )}

      {/* Form Details */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6 shadow-sm">
        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Form Title / Job Name</label>
        <input 
          type="text" 
          value={formTitle} 
          onChange={e => setFormTitle(e.target.value)} 
          placeholder="e.g. SSC Phase 12 Application" 
          className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-lg font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      {/* Fixed Requirements */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6 shadow-sm">
        <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2 text-lg border-b border-gray-100 dark:border-gray-800 pb-3 mb-4">
          <CheckCircle2 className="h-5 w-5 text-green-500" /> 
          Basic Details (Always Fixed)
        </h3>
        <div className="flex flex-wrap gap-2">
          {["Full Name", "Father's Name", "Mother's Name", "Phone", "Email", "Alternate Phone", "Aadhar Number", "DOB", "Gender", "Category", "PH/Divyang"].map(field => (
            <span key={field} className="px-3 py-1.5 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 text-xs font-medium rounded-lg border border-gray-200 dark:border-gray-700">
              {field} 🔒
            </span>
          ))}
        </div>
      </div>

      {/* Dynamic Documents Section */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6 shadow-sm">
        <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2 text-lg border-b border-gray-100 dark:border-gray-800 pb-3 mb-4">
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
            className="flex-1 px-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button onClick={handleAddDocument} type="button" className="px-4 py-2 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-bold rounded-xl hover:bg-blue-200 transition-colors">
            Add
          </button>
        </div>

        <div className="space-y-2">
          {documents.map((doc, index) => (
            <div key={index} className="flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                <FileText className="h-4 w-4 text-gray-400" /> {doc}
              </span>
              <button onClick={() => handleRemoveDocument(index)} type="button" className="text-red-500 hover:bg-red-100 p-1.5 rounded-lg transition-colors">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Multiple Posts & Complex Fees Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between bg-emerald-50 dark:bg-emerald-900/20 p-4 rounded-2xl border border-emerald-100 dark:border-emerald-800/30">
          <div>
            <h3 className="font-bold text-emerald-800 dark:text-emerald-400 flex items-center gap-2 text-lg">
              <IndianRupee className="h-5 w-5" /> 
              Posts & Fees Structure
            </h3>
            <p className="text-sm text-emerald-600 dark:text-emerald-500 mt-1">If this job has multiple posts with different fees, add them here.</p>
          </div>
          <button onClick={handleAddPost} type="button" className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-sm transition-colors text-sm">
            <Plus className="h-4 w-4" /> Add Post
          </button>
        </div>

        {posts.map((post, index) => (
          <div key={post.id} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm relative">
            
            {posts.length > 1 && (
              <button 
                onClick={() => handleRemovePost(post.id)} 
                type="button"
                className="absolute top-4 right-4 p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                title="Remove this Post"
              >
                <Trash2 className="h-5 w-5" />
              </button>
            )}

            <div className="mb-6 max-w-sm">
              <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">Post Name (e.g. Constable, SI, Matric Level)</label>
              <input 
                type="text" 
                value={post.postName} 
                onChange={e => updatePostName(post.id, e.target.value)} 
                placeholder="Enter post name..." 
                className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl font-bold text-indigo-600 dark:text-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-4">
              {/* General */}
              <div className="space-y-2 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-800">
                <h4 className="font-bold text-gray-700 dark:text-gray-300 text-xs uppercase text-center mb-3">General (UR)</h4>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <label className="block text-[10px] text-gray-500 uppercase tracking-wide mb-1">Boys (₹)</label>
                    <input type="text" value={post.fees.genMale} onChange={e => handleFeeChange(post.id, "genMale", e.target.value)} className="w-full px-2 py-1.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-md text-sm text-center" />
                  </div>
                  <div className="flex-1">
                    <label className="block text-[10px] text-gray-500 uppercase tracking-wide mb-1">Girls (₹)</label>
                    <input type="text" value={post.fees.genFemale} onChange={e => handleFeeChange(post.id, "genFemale", e.target.value)} className="w-full px-2 py-1.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-md text-sm text-center" />
                  </div>
                </div>
              </div>

              {/* OBC */}
              <div className="space-y-2 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-800">
                <h4 className="font-bold text-gray-700 dark:text-gray-300 text-xs uppercase text-center mb-3">OBC / EWS</h4>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <label className="block text-[10px] text-gray-500 uppercase tracking-wide mb-1">Boys (₹)</label>
                    <input type="text" value={post.fees.obcMale} onChange={e => handleFeeChange(post.id, "obcMale", e.target.value)} className="w-full px-2 py-1.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-md text-sm text-center" />
                  </div>
                  <div className="flex-1">
                    <label className="block text-[10px] text-gray-500 uppercase tracking-wide mb-1">Girls (₹)</label>
                    <input type="text" value={post.fees.obcFemale} onChange={e => handleFeeChange(post.id, "obcFemale", e.target.value)} className="w-full px-2 py-1.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-md text-sm text-center" />
                  </div>
                </div>
              </div>

              {/* SC/ST */}
              <div className="space-y-2 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-800">
                <h4 className="font-bold text-gray-700 dark:text-gray-300 text-xs uppercase text-center mb-3">SC / ST</h4>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <label className="block text-[10px] text-gray-500 uppercase tracking-wide mb-1">Boys (₹)</label>
                    <input type="text" value={post.fees.scStMale} onChange={e => handleFeeChange(post.id, "scStMale", e.target.value)} className="w-full px-2 py-1.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-md text-sm text-center" />
                  </div>
                  <div className="flex-1">
                    <label className="block text-[10px] text-gray-500 uppercase tracking-wide mb-1">Girls (₹)</label>
                    <input type="text" value={post.fees.scStFemale} onChange={e => handleFeeChange(post.id, "scStFemale", e.target.value)} className="w-full px-2 py-1.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-md text-sm text-center" />
                  </div>
                </div>
              </div>

              {/* PWD & Service Charge */}
              <div className="space-y-2 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-800">
                <h4 className="font-bold text-gray-700 dark:text-gray-300 text-xs uppercase text-center mb-3">PWD & Portal Charge</h4>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <label className="block text-[10px] text-gray-500 uppercase tracking-wide mb-1">PWD (₹)</label>
                    <input type="text" value={post.fees.pwd} onChange={e => handleFeeChange(post.id, "pwd", e.target.value)} className="w-full px-2 py-1.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-md text-sm text-center" />
                  </div>
                  <div className="flex-1 relative">
                    <label className="block text-[10px] text-emerald-600 font-bold uppercase tracking-wide mb-1">Charge (₹)</label>
                    <input type="text" value={post.fees.serviceCharge} onChange={e => handleFeeChange(post.id, "serviceCharge", e.target.value)} className="w-full px-2 py-1.5 bg-emerald-50 dark:bg-emerald-900/20 border-2 border-emerald-200 dark:border-emerald-700/50 rounded-md text-sm text-center font-bold text-emerald-700" />
                  </div>
                </div>
              </div>

            </div>
          </div>
        ))}

      </div>
    </div>
  );
}
