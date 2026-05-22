"use client";

import { useState, useRef } from"react";
import { UploadCloud, FileText, CheckCircle2, Loader2, X, AlertCircle } from"lucide-react";
import { supabase } from"@/lib/supabase";

interface ResumeUploaderProps {
 userId: string;
 currentResumeUrl?: string | null;
 onUploadSuccess?: (url: string) => void;
}

export default function ResumeUploader({ userId, currentResumeUrl, onUploadSuccess }: ResumeUploaderProps) {
 const [isDragging, setIsDragging] = useState(false);
 const [isUploading, setIsUploading] = useState(false);
 const [uploadError, setUploadError] = useState<string | null>(null);
 const [resumeUrl, setResumeUrl] = useState<string | null>(currentResumeUrl || null);
 const fileInputRef = useRef<HTMLInputElement>(null);

 const handleDragOver = (e: React.DragEvent) => {
 e.preventDefault();
 setIsDragging(true);
 };

 const handleDragLeave = () => {
 setIsDragging(false);
 };

 const handleDrop = async (e: React.DragEvent) => {
 e.preventDefault();
 setIsDragging(false);
 const file = e.dataTransfer.files[0];
 if (file) await handleFileUpload(file);
 };

 const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
 const file = e.target.files?.[0];
 if (file) await handleFileUpload(file);
 };

 const handleFileUpload = async (file: File) => {
 setUploadError(null);

 // Validate file type
 const validTypes = ["application/pdf","application/msword","application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
 if (!validTypes.includes(file.type)) {
 setUploadError("Please upload a valid PDF or DOCX file.");
 return;
 }

 // Validate size (max 5MB)
 if (file.size > 5 * 1024 * 1024) {
 setUploadError("File is too large. Maximum size allowed is 5MB.");
 return;
 }

 setIsUploading(true);

 try {
 const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
 const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

 if (!cloudName || !uploadPreset) {
 throw new Error("Cloudinary configuration missing.");
 }

 // 1. Upload to Cloudinary
 const formData = new FormData();
 formData.append("file", file);
 formData.append("upload_preset", uploadPreset);
 formData.append("resource_type","auto");

 const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/upload`, {
 method:"POST",
 body: formData,
 });

 const data = await res.json();
 if (!res.ok) throw new Error(data.error?.message ||"Upload failed");

 const uploadedUrl = data.secure_url;
 setResumeUrl(uploadedUrl);

 // 2. Save URL to Supabase Profile
 if (userId && !userId.startsWith("mock-")) {
 const { error } = await supabase
 .from("private_candidate_profiles")
 .update({ resume_url: uploadedUrl })
 .eq("id", userId);

 if (error) throw error;
 } else {
 // Local simulation fallback
 const mockProfileStr = localStorage.getItem("rs_candidate_mock_profile");
 if (mockProfileStr) {
 const profile = JSON.parse(mockProfileStr);
 profile.resume_url = uploadedUrl;
 localStorage.setItem("rs_candidate_mock_profile", JSON.stringify(profile));
 }
 }

 if (onUploadSuccess) {
 onUploadSuccess(uploadedUrl);
 }

 } catch (err: any) {
 console.error("Error uploading resume:", err);
 setUploadError(err.message ||"Failed to upload resume. Please try again.");
 } finally {
 setIsUploading(false);
 }
 };

 return (
 <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
 <div className="mb-4 flex items-center justify-between">
 <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
 <FileText className="w-5 h-5 text-blue-500"/>
 Resume / CV
 </h3>
 {resumeUrl && (
 <span className="flex items-center gap-1 text-[10px] font-extrabold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md uppercase tracking-wider">
 <CheckCircle2 className="w-3.5 h-3.5"/> Uploaded
 </span>
 )}
 </div>

 {uploadError && (
 <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2">
 <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5"/>
 <p className="text-xs font-semibold text-red-700">{uploadError}</p>
 </div>
 )}

 {resumeUrl ? (
 <div className="border border-slate-200 rounded-xl p-4 flex items-center justify-between bg-slate-50 group">
 <div className="flex items-center gap-3">
 <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
 <FileText className="w-5 h-5"/>
 </div>
 <div>
 <p className="text-sm font-bold text-slate-800 line-clamp-1">Professional_Resume.pdf</p>
 <a 
 href={resumeUrl} 
 target="_blank"
 rel="noopener noreferrer"
 className="text-xs font-bold text-blue-600 hover:text-blue-700 underline"
 >
 View Document
 </a>
 </div>
 </div>
 <button
 onClick={() => setResumeUrl(null)}
 className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-red-500 hover:border-red-200 transition-colors shadow-sm"
 title="Remove Resume"
 >
 <X className="w-4 h-4"/>
 </button>
 </div>
 ) : (
 <div
 onDragOver={handleDragOver}
 onDragLeave={handleDragLeave}
 onDrop={handleDrop}
 onClick={() => fileInputRef.current?.click()}
 className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-300 flex flex-col items-center justify-center ${
 isDragging 
 ?"border-blue-500 bg-blue-50"
 :"border-slate-300 hover:border-blue-400 hover:bg-slate-50"
 }`}
 >
 <input 
 type="file"
 ref={fileInputRef} 
 onChange={handleFileSelect} 
 className="hidden"
 accept=".pdf,.doc,.docx"
 />
 
 <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center mb-3">
 {isUploading ? (
 <Loader2 className="w-6 h-6 animate-spin"/>
 ) : (
 <UploadCloud className="w-6 h-6"/>
 )}
 </div>
 
 <p className="text-sm font-bold text-slate-700 mb-1">
 {isUploading ?"Uploading Securely to Cloudinary...":"Click to upload or drag & drop"}
 </p>
 <p className="text-xs font-medium text-slate-500">
 PDF or DOCX (Max. 5MB)
 </p>
 </div>
 )}
 </div>
 );
}
