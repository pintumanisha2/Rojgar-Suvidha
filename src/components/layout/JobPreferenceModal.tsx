"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, Landmark, X } from "lucide-react";
import Image from "next/image";

export default function JobPreferenceModal() {
  const [show, setShow] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Check if the user has already set a preference
    const preference = localStorage.getItem("rs_job_preference");
    if (!preference) {
      // Small delay to allow the rest of the page to paint before showing the modal
      const timer = setTimeout(() => setShow(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleSelect = (preference: "govt" | "private" | "both") => {
    localStorage.setItem("rs_job_preference", preference);
    setShow(false);

    // Redirect to private jobs if they specifically selected private
    if (preference === "private") {
      router.push("/private-jobs");
    }
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-500">
      <div className="bg-white dark:bg-gray-900 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden relative animate-in slide-in-from-bottom-8 zoom-in-95 duration-500">
        
        {/* Decorative Header */}
        <div className="h-32 bg-gradient-to-br from-indigo-600 via-blue-600 to-indigo-800 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
          <button 
            onClick={() => handleSelect("both")}
            className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors bg-black/10 hover:bg-black/20 p-2 rounded-full backdrop-blur-md"
            aria-label="Skip"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 sm:px-8 pb-8 pt-0 relative">
          {/* Avatar / Icon */}
          <div className="w-20 h-20 bg-white dark:bg-gray-900 rounded-2xl shadow-xl flex items-center justify-center mx-auto -mt-10 mb-6 border border-gray-100 dark:border-gray-800 overflow-hidden">
            <Image src="/logo-blue.png" alt="Rojgar Suvidha" width={80} height={80} className="w-full h-full object-contain" />
          </div>

          <h2 className="text-2xl sm:text-3xl font-black text-center text-gray-900 dark:text-white mb-2 tracking-tight">
            Welcome to Rojgar Suvidha!
          </h2>
          <p className="text-center text-gray-600 dark:text-gray-400 font-medium text-sm sm:text-base mb-8">
            To give you the best experience, please tell us what kind of jobs you are looking for.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Government Option */}
            <button
              onClick={() => handleSelect("govt")}
              className="flex flex-col items-center justify-center p-6 bg-blue-50 dark:bg-blue-900/10 border-2 border-blue-100 dark:border-blue-900/30 rounded-2xl hover:bg-blue-100 dark:hover:bg-blue-900/20 hover:border-blue-300 dark:hover:border-blue-700 transition-all group active:scale-95"
            >
              <div className="w-14 h-14 bg-blue-600 rounded-full flex items-center justify-center text-white mb-4 shadow-lg shadow-blue-600/30 group-hover:scale-110 transition-transform">
                <Landmark className="w-6 h-6" />
              </div>
              <span className="font-bold text-gray-900 dark:text-white text-lg">Sarkari Naukri</span>
              <span className="text-xs text-gray-500 font-semibold mt-1">Government Jobs</span>
            </button>

            {/* Private Option */}
            <button
              onClick={() => handleSelect("private")}
              className="flex flex-col items-center justify-center p-6 bg-indigo-50 dark:bg-indigo-900/10 border-2 border-indigo-100 dark:border-indigo-900/30 rounded-2xl hover:bg-indigo-100 dark:hover:bg-indigo-900/20 hover:border-indigo-300 dark:hover:border-indigo-700 transition-all group active:scale-95"
            >
              <div className="w-14 h-14 bg-indigo-600 rounded-full flex items-center justify-center text-white mb-4 shadow-lg shadow-indigo-600/30 group-hover:scale-110 transition-transform">
                <Building2 className="w-6 h-6" />
              </div>
              <span className="font-bold text-gray-900 dark:text-white text-lg">Private Jobs</span>
              <span className="text-xs text-gray-500 font-semibold mt-1">MNCs & Startups</span>
            </button>
          </div>

          <button 
            onClick={() => handleSelect("both")}
            className="w-full mt-6 py-3 text-sm font-bold text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            I am looking for both
          </button>
        </div>
      </div>
    </div>
  );
}
