"use client";

import { useState } from "react";
import { Calculator, Calendar, ChevronDown, CheckCircle2 } from "lucide-react";

export default function AgeCalculator() {
  const [dob, setDob] = useState("");
  const [targetDate, setTargetDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split("T")[0]; // YYYY-MM-DD format
  });
  const [isOpen, setIsOpen] = useState(false);
  
  const calculateAge = () => {
    if (!dob || !targetDate) return null;

    const bDay = new Date(dob);
    const tDay = new Date(targetDate);

    if (bDay > tDay) return { error: "Date of Birth cannot be in the future!" };

    let years = tDay.getFullYear() - bDay.getFullYear();
    let months = tDay.getMonth() - bDay.getMonth();
    let days = tDay.getDate() - bDay.getDate();

    if (days < 0) {
      months -= 1;
      // Get days in the previous month
      const prevMonth = new Date(tDay.getFullYear(), tDay.getMonth(), 0);
      days += prevMonth.getDate();
    }

    if (months < 0) {
      years -= 1;
      months += 12;
    }

    return { years, months, days };
  };

  const age = calculateAge();

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-indigo-100 dark:border-indigo-900/50 p-0 shadow-sm overflow-hidden mt-6 mb-6">
      {/* Header (Click to toggle) */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between bg-indigo-50/50 dark:bg-indigo-900/20 px-5 py-4 transition-colors hover:bg-indigo-50 dark:hover:bg-indigo-900/30"
      >
        <div className="flex items-center gap-3">
          <div className="bg-indigo-100 dark:bg-indigo-800 p-2 rounded-lg text-indigo-600 dark:text-indigo-300">
            <Calculator className="w-5 h-5" />
          </div>
          <div className="text-left">
            <h3 className="font-bold text-gray-900 dark:text-white text-[15px]">Age Calculator (Check Eligibility)</h3>
            <p className="text-xs text-gray-500 font-medium mt-0.5">Find your exact age in years, months, and days instantly.</p>
          </div>
        </div>
        <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {/* Calculator Body */}
      {isOpen && (
        <div className="p-5 border-t border-indigo-50 dark:border-indigo-900/30 animate-in slide-in-from-top-2 duration-200">
          <div className="flex flex-col sm:flex-row gap-4 mb-5">
            <div className="flex-1">
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" /> Date of Birth
              </label>
              <input 
                type="date" 
                value={dob}
                onChange={(e) => setDob(e.target.value)}
                className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none transition-all dark:text-white dark:[color-scheme:dark]"
              />
            </div>
            <div className="flex-1">
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" /> Target Date (As on)
              </label>
              <input 
                type="date" 
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none transition-all dark:text-white dark:[color-scheme:dark]"
              />
            </div>
          </div>

          {/* Result Area */}
          {dob && age && (
            <div className="bg-indigo-600 rounded-xl p-4 text-white text-center shadow-md shadow-indigo-600/20 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 pointer-events-none"></div>
              
              {'error' in age ? (
                <p className="font-bold text-red-200 text-sm relative z-10">{age.error}</p>
              ) : (
                <div className="relative z-10">
                  <p className="text-indigo-200 text-xs font-bold uppercase tracking-widest mb-1 flex justify-center items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Your Exact Age Is
                  </p>
                  <p className="text-xl sm:text-2xl font-black">
                    {age.years} <span className="text-sm font-medium text-indigo-200 font-normal">Yrs</span>,{" "}
                    {age.months} <span className="text-sm font-medium text-indigo-200 font-normal">Mos</span>,{" "}
                    {age.days} <span className="text-sm font-medium text-indigo-200 font-normal">Days</span>
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
