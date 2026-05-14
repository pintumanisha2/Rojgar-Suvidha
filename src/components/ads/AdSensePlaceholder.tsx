"use client";

import { Megaphone } from "lucide-react";

interface AdSensePlaceholderProps {
  format?: "leaderboard" | "rectangle" | "responsive";
  className?: string;
}

export default function AdSensePlaceholder({ format = "responsive", className = "" }: AdSensePlaceholderProps) {
  // Define dimensions based on format to prevent Layout Shifts (CLS)
  let dimensionsClass = "w-full min-h-[90px]"; // responsive default
  
  if (format === "leaderboard") {
    dimensionsClass = "w-full max-w-[728px] h-[90px] mx-auto";
  } else if (format === "rectangle") {
    dimensionsClass = "w-[300px] h-[250px] mx-auto";
  }

  return (
    <div className={`my-4 flex items-center justify-center bg-gray-100/50 dark:bg-gray-800/30 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl overflow-hidden relative ${dimensionsClass} ${className}`}>
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 dark:opacity-5 pointer-events-none" />
      <div className="flex flex-col items-center justify-center text-gray-400 dark:text-gray-500 z-10">
        <Megaphone className="w-6 h-6 mb-1 opacity-50" />
        <span className="text-[10px] font-bold uppercase tracking-widest">Advertisement Space</span>
        <span className="text-[9px] opacity-70 mt-0.5">Google AdSense</span>
      </div>
      
      {/* 
        NOTE FOR LATER: 
        When you get AdSense approval, replace this entire div with:
        <ins className="adsbygoogle"
             style={{ display: "block" }}
             data-ad-client="ca-pub-XXXXXXXXXXXXXXXX"
             data-ad-slot="XXXXXXXXXX"
             data-ad-format="auto"
             data-full-width-responsive="true"></ins>
        <script>
             (adsbygoogle = window.adsbygoogle || []).push({});
        </script>
      */}
    </div>
  );
}
