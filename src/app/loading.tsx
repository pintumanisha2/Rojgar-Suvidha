import React from "react";

export default function GlobalLoading() {
  return (
    <div className="fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-white/80 dark:bg-gray-950/80 backdrop-blur-md transition-all duration-300">
      <div className="relative flex flex-col items-center">
        {/* Pulsing Outer Rings */}
        <div className="absolute w-24 h-24 rounded-full border-4 border-indigo-500/20 animate-ping duration-1000" />
        <div className="absolute w-20 h-20 rounded-full border-4 border-indigo-500/30 animate-pulse" />
        
        {/* Core Loader Spinner */}
        <div className="w-16 h-16 rounded-full border-4 border-t-indigo-600 border-r-indigo-600 border-b-indigo-200 border-l-indigo-200 animate-spin" />
        
        {/* Text Details */}
        <p className="mt-6 text-sm font-black tracking-widest text-indigo-600 dark:text-indigo-400 uppercase animate-pulse">
          ROJGAR SUVIDHA
        </p>
        <p className="mt-1 text-xs font-bold text-gray-400 dark:text-gray-500">
          Form ki tayyari ho rahi hai... ☕
        </p>
      </div>
    </div>
  );
}
