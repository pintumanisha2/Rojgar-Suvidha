"use client";

import { useState } from "react";
import { Calendar, CheckCircle2, ChevronRight, MapPin, Sparkles } from "lucide-react";

interface CategoryOption {
  id: string;
  name: string;
  emoji: string;
}

const CATEGORIES: CategoryOption[] = [
  { id: "upsc", name: "UPSC Civil Services", emoji: "🏛️" },
  { id: "ssc", name: "SSC (CGL, CHSL, MTS)", emoji: "📚" },
  { id: "railway", name: "Railways (NTPC, Group D)", emoji: "🚂" },
  { id: "banking", name: "Banking & Insurance", emoji: "💰" },
  { id: "defence", name: "Defence & Police", emoji: "🪖" },
  { id: "general", name: "General Target / Other", emoji: "🎓" },
];

const STATES = [
  { code: "", name: "All India / No State Filter" },
  { code: "UP", name: "Uttar Pradesh" },
  { code: "BH", name: "Bihar" },
  { code: "MP", name: "Madhya Pradesh" },
  { code: "RJ", name: "Rajasthan" },
  { code: "HR", name: "Haryana" },
  { code: "DL", name: "Delhi" },
  { code: "MH", name: "Maharashtra" },
  { code: "WB", name: "West Bengal" },
];

export default function CalendarSelector() {
  const [selectedCats, setSelectedCats] = useState<string[]>(["general"]);
  const [selectedState, setSelectedState] = useState<string>("");

  const toggleCategory = (id: string) => {
    if (id === "general") {
      setSelectedCats(["general"]);
      return;
    }

    let next = selectedCats.filter(c => c !== "general");
    if (next.includes(id)) {
      next = next.filter(c => c !== id);
    } else {
      next.push(id);
    }

    if (next.length === 0) {
      setSelectedCats(["general"]);
    } else {
      setSelectedCats(next);
    }
  };

  const handlePrint = () => {
    const catsStr = selectedCats.join(",");
    const url = `/calendar/print?categories=${catsStr}&state=${selectedState}`;
    window.open(url, "_blank");
  };

  return (
    <div className="w-full max-w-4xl mx-auto bg-gradient-to-br from-indigo-900 to-slate-900 text-white rounded-2xl p-6 md:p-8 shadow-2xl relative overflow-hidden my-6 border border-indigo-500/20">
      
      {/* Decorative Blur Backgrounds */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none -ml-20 -mb-20" />

      <div className="relative z-10 grid md:grid-cols-12 gap-6 items-center">
        
        {/* Intro Side */}
        <div className="md:col-span-5 space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-xs font-bold text-indigo-300">
            <Sparkles className="w-3.5 h-3.5" /> Offline Growth Tool
          </div>
          <h2 className="text-2xl md:text-3xl font-black leading-tight">
            Print Your Monthly <br />
            <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">Job Wall Calendar</span>
          </h2>
          <p className="text-slate-350 text-sm leading-relaxed">
            Free printable A4 monthly calendar with exam deadlines, daily study trackers, habit streaks, and top current affairs. Stick it in front of your study desk!
          </p>
          <div className="flex items-center gap-2 text-xs text-indigo-300/80 font-bold">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Auto-updates with latest job deadlines
          </div>
        </div>

        {/* Form Selection Side */}
        <div className="md:col-span-7 bg-white/5 backdrop-blur-md rounded-xl p-5 border border-white/10 space-y-5">
          
          {/* Target Categories */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
              Select Your Target Exams (Focus):
            </label>
            <div className="grid grid-cols-2 gap-2">
              {CATEGORIES.map(opt => {
                const isActive = selectedCats.includes(opt.id);
                return (
                  <button
                    key={opt.id}
                    onClick={() => toggleCategory(opt.id)}
                    className={`flex items-center gap-2 p-2 rounded-lg text-left text-xs font-semibold border transition-all active:scale-95 cursor-pointer ${
                      isActive
                        ? "bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-600/20"
                        : "bg-white/5 border-white/10 hover:bg-white/10 text-slate-300"
                    }`}
                  >
                    <span className="text-base">{opt.emoji}</span>
                    <span>{opt.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* State Selector */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-indigo-400" /> Filter by State Jobs:
            </label>
            <select
              value={selectedState}
              onChange={(e) => setSelectedState(e.target.value)}
              className="w-full bg-slate-800 border border-white/15 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {STATES.map(st => (
                <option key={st.code} value={st.code}>
                  {st.name}
                </option>
              ))}
            </select>
          </div>

          {/* Submit Button */}
          <button
            onClick={handlePrint}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-bold p-3 rounded-lg shadow-xl shadow-indigo-900/30 transition-all hover:-translate-y-0.5 active:scale-[0.98] cursor-pointer text-sm"
          >
            <Calendar className="w-4 h-4" /> Generate Printable Calendar <ChevronRight className="w-4 h-4" />
          </button>

        </div>

      </div>

    </div>
  );
}
