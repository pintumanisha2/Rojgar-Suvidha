"use client";

import { useState, useRef } from "react";
import { UploadCloud, Image as ImageIcon, CheckCircle2, Loader2, X, AlertCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface AvatarUploaderProps {
  userId: string;
  currentAvatarUrl?: string | null;
  onUploadSuccess?: (url: string) => void;
}

export default function AvatarUploader({ userId, currentAvatarUrl, onUploadSuccess }: AvatarUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(currentAvatarUrl || null);
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
    const validTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!validTypes.includes(file.type)) {
      setUploadError("Please upload a valid JPG, PNG or WEBP image.");
      return;
    }

    // Validate size (max 5MB before compression)
    if (file.size > 5 * 1024 * 1024) {
      setUploadError("Image is too large. Maximum size allowed before compression is 5MB.");
      return;
    }

    setIsUploading(true);

    try {
      // --- IMAGE COMPRESSION LOGIC ---
      const compressedFile = await new Promise<File>((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
          const img = new Image();
          img.src = event.target?.result as string;
          img.onload = () => {
            const canvas = document.createElement("canvas");
            // Max dimensions for avatar
            const MAX_WIDTH = 400;
            const MAX_HEIGHT = 400;
            let width = img.width;
            let height = img.height;

            if (width > height) {
              if (width > MAX_WIDTH) {
                height *= MAX_WIDTH / width;
                width = MAX_WIDTH;
              }
            } else {
              if (height > MAX_HEIGHT) {
                width *= MAX_HEIGHT / height;
                height = MAX_HEIGHT;
              }
            }
            
            canvas.width = width;
            canvas.height = height;
            
            const ctx = canvas.getContext("2d");
            ctx?.drawImage(img, 0, 0, width, height);
            
            // Compress and convert to JPEG format (0.7 quality)
            canvas.toBlob(
              (blob) => {
                if (blob) {
                  resolve(blob as unknown as File);
                } else {
                  resolve(file); // Fallback to original if compression fails
                }
              },
              "image/jpeg",
              0.7
            );
          };
          img.onerror = (error) => reject(error);
        };
        reader.onerror = (error) => reject(error);
      });

      const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
      const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

      if (!cloudName || !uploadPreset) {
        throw new Error("Cloudinary configuration missing.");
      }

      // 1. Upload compressed image to Cloudinary
      const formData = new FormData();
      formData.append("file", compressedFile, file.name.replace(/\.[^/.]+$/, "") + ".jpg");
      formData.append("upload_preset", uploadPreset);
      formData.append("resource_type", "image");

      const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/upload`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || "Upload failed");

      const uploadedUrl = data.secure_url;
      setAvatarUrl(uploadedUrl);

      // Local simulation fallback
      const mockProfileStr = localStorage.getItem("rs_candidate_mock_profile");
      if (mockProfileStr) {
        const profile = JSON.parse(mockProfileStr);
        profile.avatar_url = uploadedUrl;
        localStorage.setItem("rs_candidate_mock_profile", JSON.stringify(profile));
      }

      // Update multi-profile DB
      const currentEmail = localStorage.getItem("rs_candidate_active_email");
      if (currentEmail) {
        const dbStr = localStorage.getItem("rs_candidate_profiles_db");
        if (dbStr) {
          const db = JSON.parse(dbStr);
          if (db[currentEmail]) {
            db[currentEmail].avatar_url = uploadedUrl;
            localStorage.setItem("rs_candidate_profiles_db", JSON.stringify(db));
          }
        }
      }

      // Update global profiles table if session exists
      const { data: sessionData } = await supabase.auth.getSession();
      if (sessionData?.session?.user) {
        await supabase
          .from("profiles")
          .update({ avatar_url: uploadedUrl })
          .eq("id", sessionData.session.user.id);
      }

      if (onUploadSuccess) {
        onUploadSuccess(uploadedUrl);
      }

      // Force a reload of Navbar by dispatching event or just let user click save
      window.dispatchEvent(new Event('profile_picture_updated'));

    } catch (err: any) {
      console.error("Error uploading avatar:", err);
      setUploadError(err.message || "Failed to upload image. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm w-full">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
          <ImageIcon className="w-5 h-5 text-indigo-500" />
          Profile Picture
        </h3>
        {avatarUrl && (
          <span className="flex items-center gap-1 text-[10px] font-extrabold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md uppercase tracking-wider">
            <CheckCircle2 className="w-3.5 h-3.5" /> Uploaded
          </span>
        )}
      </div>

      {uploadError && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
          <p className="text-xs font-semibold text-red-700">{uploadError}</p>
        </div>
      )}

      {avatarUrl ? (
        <div className="border border-slate-200 rounded-xl p-4 flex items-center justify-between bg-slate-50 group">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-indigo-100 shadow-sm">
              <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-800 line-clamp-1">Avatar Image</p>
              <a 
                href={avatarUrl} 
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-bold text-indigo-600 hover:text-indigo-700 underline"
              >
                View Full Image
              </a>
            </div>
          </div>
          <button
            onClick={() => setAvatarUrl(null)}
            className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-red-500 hover:border-red-200 transition-colors shadow-sm"
            title="Remove Image"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all duration-300 flex flex-col items-center justify-center ${
            isDragging 
              ? "border-indigo-500 bg-indigo-50" 
              : "border-slate-300 hover:border-indigo-400 hover:bg-slate-50"
          }`}
        >
          <input 
            type="file"
            ref={fileInputRef} 
            onChange={handleFileSelect} 
            className="hidden"
            accept=".jpg,.jpeg,.png,.webp"
          />
          
          <div className="w-12 h-12 rounded-full bg-indigo-50 text-indigo-500 flex items-center justify-center mb-3">
            {isUploading ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : (
              <UploadCloud className="w-6 h-6" />
            )}
          </div>
          
          <p className="text-sm font-bold text-slate-700 mb-1">
            {isUploading ? "Uploading Securely..." : "Click to upload your photo"}
          </p>
          <p className="text-xs font-medium text-slate-500">
            JPG, PNG or WEBP (Max. 2MB)
          </p>
        </div>
      )}
    </div>
  );
}
