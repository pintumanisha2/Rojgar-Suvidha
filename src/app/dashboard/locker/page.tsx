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
  const [lockerDocs, setLockerDocs] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [uploadingDoc, setUploadingDoc] = useState<string | null>(null);

  useEffect(() => {
    const fetchLocker = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        window.location.href = "/login?redirect=/dashboard/locker";
        return;
      }
      setUser(session.user);

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
    if (!file || !user) return;
    
    setUploadingDoc(docType);
    
    try {
      // 1. Compress Image (Max 200KB) to save storage
      const options = {
        maxSizeMB: 0.2, // 200 KB
        maxWidthOrHeight: 1200,
        useWebWorker: true,
      };
      
      const compressedFile = await imageCompression(file, options);
      console.log(`Compressed ${docType} from ${file.size/1024}KB to ${compressedFile.size/1024}KB`);

      // 2. Upload to Supabase Storage
      const fileExt = compressedFile.name.split('.').pop() || 'jpg';
      const fileName = `locker/${user.id}/${docType.replace(/\s+/g, '_')}_${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('user_documents')
        .upload(fileName, compressedFile, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage
        .from('user_documents')
        .getPublicUrl(fileName);

      const newUrl = publicUrlData.publicUrl;

      // 3. Update Database (JSON merge)
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
    
    const updatedDocs = { ...lockerDocs };
    delete updatedDocs[docType];
    
    const { error } = await supabase
        .from("user_locker")
        .upsert({ user_id: user.id, documents: updatedDocs });
        
    if (!error) {
      setLockerDocs(updatedDocs);
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
                    
                    <div className="w-24 h-24 rounded-2xl bg-gray-100 dark:bg-gray-800 overflow-hidden mb-4 border border-gray-200 dark:border-gray-700 shadow-sm">
                      <img src={lockerDocs[docType]} alt={docType} className="w-full h-full object-cover" />
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
                        <p className="text-xs text-gray-400 font-medium">Click to upload (JPG/PNG)</p>
                      </>
                    )}
                    <input 
                      type="file" 
                      className="hidden" 
                      accept="image/*" 
                      disabled={isUploading}
                      onChange={(e) => handleFileUpload(docType, e.target.files?.[0] || null)} 
                    />
                  </label>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
