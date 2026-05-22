"use client";

import { useState } from"react";
import QuickApplyModal from"../components/QuickApplyModal";

export default function ScoutedApplyButton({ job }: any) {
 const [showApplyModal, setShowApplyModal] = useState(false);

  return (
  <>
  <div className="relative group">
  {/* Soft animated glow behind button */}
  <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl blur opacity-30 group-hover:opacity-60 transition duration-1000 group-hover:duration-200 animate-pulse"></div>
  
  <button 
  onClick={() => setShowApplyModal(true)}
  className="relative flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black px-8 py-3 rounded-xl shadow-lg shadow-blue-500/25 transition-all duration-300 active:scale-95 text-sm w-full sm:w-auto overflow-hidden"
  >
  <span className="relative z-10">Apply Now</span>
  <div className="absolute inset-0 h-full w-full bg-white/20 scale-x-0 group-hover:scale-x-100 origin-left transition-transform duration-300 ease-out"></div>
  </button>
  </div>

  {showApplyModal && (
  <QuickApplyModal
  job={job}
  onClose={() => setShowApplyModal(false)}
  />
  )}
  </>
  );
}
