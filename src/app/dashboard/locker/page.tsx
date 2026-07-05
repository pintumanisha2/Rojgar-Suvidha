"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Loader2, UploadCloud, CheckCircle2, ShieldCheck, FileText, Trash2, ArrowLeft } from "lucide-react";
import Link from "next/link";
import imageCompression from "browser-image-compression";

const STANDARD_DOCS = [
  "Passport Size Photo",
  "Signature",
  "Aadhar Card",
  "10th Marksheet",
  "12th Marksheet",
  "Graduation Degree",
  "Caste Certificate",
  "Domicile Certificate",
  "Thumb Impression",
  "Computer Certificate"
];

export default function DigitalLockerPage() {
  const [user, setUser] = useState<any>(null);
  const [token, setToken] = useState<string>("");
  const [lockerDocs, setLockerDocs] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [uploadingDoc, setUploadingDoc] = useState<string | null>(null);

  // Custom documents state
  const [showAddCustom, setShowAddCustom] = useState(false);
  const [customName, setCustomName] = useState("");
  const [customFile, setCustomFile] = useState<File | null>(null);
  const [uploadingCustom, setUploadingCustom] = useState(false);
  const [customUploadError, setCustomUploadError] = useState("");

  useEffect(() => {
    const fetchLocker = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        window.location.href = "/login?redirect=/dashboard/locker";
        return;
      }
      setUser(session.user);
      setToken(session.access_token);

      // Fetch from user_locker table
      const { data, error } = await supabase
        .from("user_locker")
        .select("documents")
        .eq("user_id", session.user.id)
        .single();

      if (data && data.documents) {
        setLockerDocs(data.documents);
      } else if (error && error.code === 'PGRST116') {
        // Row doesn't exist, we'll create it on first upload
        console.log("No locker found, will create on first upload.");
      }
      setLoading(false);
    };

    fetchLocker();
  }, []);

  const handleFileUpload = async (docType: string, file: File | null) => {
    if (!file || !user || !token) return;
    
    setUploadingDoc(docType);
    
    try {
      let fileToUpload = file;
      if (file.type.startsWith("image/")) {
        // 1. Compress Image (Max 200KB) to save storage
        const options = {
          maxSizeMB: 0.2, // 200 KB
          maxWidthOrHeight: 1200,
          useWebWorker: true,
        };
        
        fileToUpload = await imageCompression(file, options);
        console.log(`Compressed ${docType} from ${file.size/1024}KB to ${fileToUpload.size/1024}KB`);
      }

      // 2. Upload file via proxy backend endpoint to avoid browser CORS issues
      const formData = new FormData();
      formData.append("file", fileToUpload);

      const res = await fetch("/api/locker/upload-direct", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`
        },
        body: formData
      });

      const resData = await res.json();
      if (!res.ok) {
        throw new Error(resData.error || "Failed to upload file");
      }

      const { key } = resData;

      // 4. Construct the secure relative view URL
      const newUrl = `/api/locker/view?key=${encodeURIComponent(key)}`;

      // 5. Update Database (JSON merge)
      const updatedDocs = { ...lockerDocs, [docType]: newUrl };
      
      const { error: dbError } = await supabase
        .from("user_locker")
        .upsert({ user_id: user.id, documents: updatedDocs });

      if (dbError) throw dbError;

      setLockerDocs(updatedDocs);
    } catch (err: any) {
      alert(`Upload Failed: ${err.message}`);
    } finally {
      setUploadingDoc(null);
    }
  };

  const handleDelete = async (docType: string) => {
    if (!confirm(`Delete your ${docType}?`)) return;

    const fileUrl = lockerDocs[docType];
    
    // If it's a Backblaze B2 file, let's delete it from B2
    if (fileUrl && fileUrl.startsWith("/api/locker/view")) {
      try {
        const urlParams = new URL(fileUrl, window.location.origin);
        const key = urlParams.searchParams.get("key");
        if (key && token) {
          await fetch("/api/locker/delete", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({ key })
          });
        }
      } catch (err) {
        console.error("Failed to delete file from Backblaze:", err);
      }
    }
    
    const updatedDocs = { ...lockerDocs };
    delete updatedDocs[docType];
    
    const { error } = await supabase
        .from("user_locker")
        .upsert({ user_id: user.id, documents: updatedDocs });
        
    if (!error) {
      setLockerDocs(updatedDocs);
    }
  };

  const getDocUrl = (url: string) => {
    if (!url) return "";
    if (url.startsWith("http")) return url; // Old public Supabase URL
    return `${url}&token=${token}`; // Relative backend secure URL
  };

  const handleCustomUpload = async () => {
    if (!customName.trim()) {
      setCustomUploadError("Please enter a document name.");
      return;
    }
    if (!customFile) {
      setCustomUploadError("Please select a file to upload.");
      return;
    }
    if (lockerDocs[customName.trim()]) {
      setCustomUploadError("A document with this name already exists.");
      return;
    }

    setUploadingCustom(true);
    setCustomUploadError("");

    try {
      let fileToUpload = customFile;
      if (customFile.type.startsWith("image/")) {
        const options = {
          maxSizeMB: 0.2,
          maxWidthOrHeight: 1200,
          useWebWorker: true,
        };
        fileToUpload = await imageCompression(customFile, options);
      }

      const formData = new FormData();
      formData.append("file", fileToUpload);

      const res = await fetch("/api/locker/upload-direct", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`
        },
        body: formData
      });

      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || "Failed to upload file");

      const { key } = resData;

      const newUrl = `/api/locker/view?key=${encodeURIComponent(key)}`;
      const updatedDocs = { ...lockerDocs, [customName.trim()]: newUrl };

      const { error: dbError } = await supabase
        .from("user_locker")
        .upsert({ user_id: user.id, documents: updatedDocs });

      if (dbError) throw dbError;

      setLockerDocs(updatedDocs);
      setShowAddCustom(false);
      setCustomName("");
      setCustomFile(null);
    } catch (err: any) {
      setCustomUploadError(err.message || "Upload failed");
    } finally {
      setUploadingCustom(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-indigo-500" /></div>;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-10 px-4">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row items-center gap-6 bg-gradient-to-r from-indigo-900 to-indigo-700 rounded-3xl p-8 shadow-xl text-white relative overflow-hidden">
          <div className="absolute -right-10 -top-10 opacity-10">
            <ShieldCheck className="w-64 h-64" />
          </div>
          <div className="w-20 h-20 bg-white/10 rounded-2xl flex items-center justify-center shrink-0 backdrop-blur-sm border border-white/20">
            <ShieldCheck className="w-10 h-10 text-indigo-100" />
          </div>
          <div className="flex-1 z-10 text-center md:text-left">
            <h1 className="text-3xl font-black mb-2 flex items-center justify-center md:justify-start gap-2">
              My Digital Locker <CheckCircle2 className="w-6 h-6 text-green-400" />
            </h1>
            <p className="text-indigo-100 font-medium opacity-90 max-w-xl">
              Upload your documents once. We use secure 256-bit encryption for transport, and RLS to keep your files safe. 
              Documents are automatically attached when you apply for jobs!
            </p>
          </div>
          <div className="z-10 shrink-0">
             <Link href="/dashboard" className="px-5 py-2.5 bg-white/10 hover:bg-white/20 border border-white/30 rounded-xl font-bold transition-colors flex items-center gap-2">
               <ArrowLeft className="w-4 h-4" /> Dashboard
             </Link>
          </div>
        </div>

        {/* Security Notice */}
        <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/30 rounded-2xl p-4 flex items-center gap-4">
          <div className="p-2 bg-emerald-100 dark:bg-emerald-800/50 rounded-lg shrink-0">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <p className="text-sm font-medium text-emerald-800 dark:text-emerald-300">
            Auto-Compression is active. High-quality original images are resized securely in your browser to save data and speed up your uploads.
          </p>
        </div>

        {/* Document Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {STANDARD_DOCS.map((docType) => {
            const isUploaded = !!lockerDocs[docType];
            const isUploading = uploadingDoc === docType;
            const fileUrl = lockerDocs[docType];
            const isPdf = fileUrl && (fileUrl.toLowerCase().includes(".pdf") || fileUrl.includes("application%2Fpdf"));

            return (
              <div 
                key={docType} 
                className={`relative overflow-hidden rounded-3xl border-2 transition-all duration-300 ${isUploaded ? 'border-indigo-500 shadow-lg shadow-indigo-500/10 bg-white dark:bg-gray-900' : 'border-dashed border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
              >
                {/* Uploaded View */}
                {isUploaded ? (
                  <div className="p-6 h-full flex flex-col items-center text-center justify-center">
                    <div className="absolute top-4 right-4">
                      <button onClick={() => handleDelete(docType)} className="p-2 bg-red-50 hover:bg-red-100 dark:bg-red-900/30 dark:hover:bg-red-900/50 text-red-500 rounded-lg transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    
                    <div className="w-24 h-24 rounded-2xl bg-gray-100 dark:bg-gray-800 overflow-hidden mb-4 border border-gray-200 dark:border-gray-700 shadow-sm flex items-center justify-center">
                      {isPdf ? (
                        <FileText className="w-12 h-12 text-indigo-500" />
                      ) : (
                        <img src={getDocUrl(fileUrl)} alt={docType} className="w-full h-full object-cover" />
                      )}
                    </div>
                    
                    <h3 className="font-bold text-gray-900 dark:text-white mb-1">{docType}</h3>
                    <div className="flex items-center gap-1.5 text-xs font-bold text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-3 py-1 rounded-full">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Safely Stored
                    </div>
                  </div>
                ) : (
                  /* Empty View */
                  <label className="p-6 h-full flex flex-col items-center justify-center text-center cursor-pointer min-h-[14rem]">
                    {isUploading ? (
                      <div className="flex flex-col items-center gap-3">
                        <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
                        <span className="text-sm font-bold text-indigo-600">Encrypting & Uploading...</span>
                      </div>
                    ) : (
                      <>
                        <div className="w-16 h-16 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 flex items-center justify-center mb-4 text-gray-400 group-hover:text-indigo-500 transition-colors">
                          <UploadCloud className="w-8 h-8" />
                        </div>
                        <h3 className="font-bold text-gray-700 dark:text-gray-300 mb-1">{docType}</h3>
                        <p className="text-xs text-gray-400 font-medium">Click to upload (JPG/PNG/PDF)</p>
                      </>
                    )}
                    <input 
                      type="file" 
                      className="hidden" 
                      accept="image/*,application/pdf" 
                      disabled={isUploading}
                      onChange={(e) => handleFileUpload(docType, e.target.files?.[0] || null)} 
                    />
                  </label>
                )}
              </div>
            );
          })}
        </div>

        {/* Custom Documents Section */}
        <div className="space-y-6 pt-6 border-t border-gray-200 dark:border-gray-800">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-500" /> Other Documents / Certificates
              </h2>
              <p className="text-xs text-gray-500">Upload custom files that are not in the standard list above.</p>
            </div>
            <button 
              onClick={() => setShowAddCustom(true)}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-xl transition-all shadow-md shadow-indigo-500/20"
            >
              + Add Custom Document
            </button>
          </div>

          {/* Inline form to add custom document */}
          {showAddCustom && (
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-6 shadow-md max-w-md space-y-4">
              <h3 className="font-bold text-gray-900 dark:text-white">New Custom Document</h3>
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1.5">Document Label (e.g. Income Certificate)</label>
                <input 
                  type="text"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-semibold text-gray-900 dark:text-white"
                  placeholder="Enter name..."
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1.5">Select File (Image / PDF)</label>
                <input 
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={(e) => setCustomFile(e.target.files?.[0] || null)}
                  className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-600 hover:file:bg-indigo-100"
                />
              </div>
              {customUploadError && (
                <p className="text-xs font-bold text-red-500">{customUploadError}</p>
              )}
              <div className="flex gap-3 pt-2">
                <button 
                  onClick={handleCustomUpload}
                  disabled={uploadingCustom}
                  className="flex-1 py-2 bg-indigo-600 text-white font-bold text-sm rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {uploadingCustom ? <Loader2 className="w-4 h-4 animate-spin" /> : "Upload"}
                </button>
                <button 
                  onClick={() => { setShowAddCustom(false); setCustomName(""); setCustomFile(null); setCustomUploadError(""); }}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-bold text-sm rounded-xl transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {Object.keys(lockerDocs).filter(key => !STANDARD_DOCS.includes(key)).length === 0 ? (
            <div className="text-center py-10 bg-gray-50 dark:bg-gray-800/10 border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-3xl">
              <FileText className="w-10 h-10 text-gray-400 mx-auto mb-2" />
              <p className="text-sm font-bold text-gray-500">No other documents uploaded yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {Object.keys(lockerDocs).filter(key => !STANDARD_DOCS.includes(key)).map((docType) => {
                const fileUrl = lockerDocs[docType];
                const isPdf = fileUrl && (fileUrl.toLowerCase().includes(".pdf") || fileUrl.includes("application%2Fpdf"));

                return (
                  <div 
                    key={docType} 
                    className="relative overflow-hidden rounded-3xl border-2 border-indigo-500 bg-white dark:bg-gray-900 p-6 h-full flex flex-col items-center text-center justify-center shadow-lg shadow-indigo-500/5"
                  >
                    <div className="absolute top-4 right-4">
                      <button onClick={() => handleDelete(docType)} className="p-2 bg-red-50 hover:bg-red-100 dark:bg-red-900/30 dark:hover:bg-red-900/50 text-red-500 rounded-lg transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    
                    <div className="w-24 h-24 rounded-2xl bg-gray-100 dark:bg-gray-800 overflow-hidden mb-4 border border-gray-200 dark:border-gray-700 shadow-sm flex items-center justify-center">
                      {isPdf ? (
                        <FileText className="w-12 h-12 text-indigo-500" />
                      ) : (
                        <img src={getDocUrl(fileUrl)} alt={docType} className="w-full h-full object-cover" />
                      )}
                    </div>
                    
                    <h3 className="font-bold text-gray-900 dark:text-white mb-1 truncate max-w-full px-2">{docType}</h3>
                    <div className="flex items-center gap-1.5 text-xs font-bold text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-3 py-1 rounded-full">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Safely Stored
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
