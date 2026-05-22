"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Landmark, Building2 } from "lucide-react";

export default function JobPreferenceToggle() {
  const router = useRouter();
  const pathname = usePathname();
  const [activeTab, setActiveTab] = useState<"govt" | "private">("govt");

  useEffect(() => {
    // Sync the toggle state with the current URL path
    if (pathname.includes("/private-jobs")) {
      setActiveTab("private");
    } else {
      setActiveTab("govt");
    }
  }, [pathname]);

  const handleToggle = (tab: "govt" | "private") => {
    setActiveTab(tab);
    localStorage.setItem("rs_job_preference", tab);
    
    if (tab === "private") {
      router.push("/private-jobs");
    } else {
      router.push("/");
    }
  };

  return (
    <div className="w-full bg-white dark:bg-gray-950 py-4 px-4 border-b border-gray-100 dark:border-gray-800 sticky top-16 z-40 shadow-sm">
      <div className="max-w-xl mx-auto">
        <div className="flex items-center bg-gray-100 dark:bg-gray-900 p-1 rounded-2xl relative shadow-inner">
          
          {/* Animated Selection Background */}
          <div 
            className="absolute top-1 bottom-1 w-[calc(50%-4px)] bg-white dark:bg-gray-800 rounded-xl shadow-md transition-transform duration-300 ease-out"
            style={{ transform: activeTab === "govt" ? "translateX(0)" : "translateX(calc(100% + 4px))" }}
          ></div>

          {/* Government Tab */}
          <button
            onClick={() => handleToggle("govt")}
            className={`relative z-10 flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-black transition-colors ${
              activeTab === "govt" ? "text-indigo-600 dark:text-indigo-400" : "text-gray-500 hover:text-gray-700 dark:text-gray-400"
            }`}
          >
            <Landmark className="w-4 h-4" />
            Sarkari Naukri
          </button>

          {/* Private Tab */}
          <button
            onClick={() => handleToggle("private")}
            className={`relative z-10 flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-black transition-colors ${
              activeTab === "private" ? "text-indigo-600 dark:text-indigo-400" : "text-gray-500 hover:text-gray-700 dark:text-gray-400"
            }`}
          >
            <Building2 className="w-4 h-4" />
            Private Jobs
          </button>

        </div>
      </div>
    </div>
  );
}
