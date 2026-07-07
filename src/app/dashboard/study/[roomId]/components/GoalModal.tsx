/**
 * GoalModal.tsx
 * ─────────────────────────────────────────────────────────────────
 * Pop-up overlay modal prompting: "Aaj kya padh rahe ho?"
 * Prompts on room enter and lets user select or type a specific target.
 * ─────────────────────────────────────────────────────────────────
 */
"use client";

import React, { useState } from "react";
import { Target, Zap, Loader2 } from "lucide-react";

interface GoalModalProps {
  initialGoal?: string;
  onSave: (goal: string) => Promise<void> | void;
  onClose: () => void;
  isBusy?: boolean;
}

const SUGGESTIONS = [
  "SSC Math Practice",
  "UPSC Revision",
  "Locked in 🔒",
  "Railway GK Quiz",
  "English Vocab 📘",
  "Physics MCQs Practice",
];

export default function GoalModal({
  initialGoal = "",
  onSave,
  onClose,
  isBusy = false,
}: GoalModalProps) {
  const [goalText, setGoalText] = useState(initialGoal);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(goalText.trim());
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <form
        onSubmit={handleSubmit}
        className="bg-[#0a0f1e] border border-white/10 rounded-3xl shadow-2xl w-full max-w-md p-8 space-y-6 animate-in zoom-in-95 duration-200"
      >
        {/* Banner header icon */}
        <div className="text-center">
          <div className="w-14 h-14 bg-indigo-500/20 text-indigo-400 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Target className="w-7 h-7" />
          </div>
          <h2 className="text-2xl font-black text-white">Aaj kya padh rahe ho?</h2>
          <p className="text-xs text-gray-500 mt-2">
            Apna study goal set karein — room mein sabhi ko show hoga.
          </p>
        </div>

        {/* Suggestion Chips */}
        <div className="flex flex-wrap gap-2 justify-center">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setGoalText(s)}
              className={`text-[10px] font-black px-3 py-1.5 rounded-xl border transition-all ${
                goalText === s
                  ? "bg-indigo-600 border-indigo-500 text-white"
                  : "bg-white/5 border-white/10 text-gray-400 hover:text-white hover:border-white/20"
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        {/* Text Input */}
        <input
          type="text"
          value={goalText}
          onChange={(e) => setGoalText(e.target.value)}
          placeholder="e.g. Solving SSC CGL past papers..."
          maxLength={60}
          className="w-full px-4 py-3.5 bg-white/5 border border-white/10 rounded-2xl text-sm font-bold text-white placeholder-gray-600 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
        />

        {/* Action button triggers */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3.5 bg-white/5 border border-white/10 text-gray-400 rounded-2xl font-black text-xs hover:bg-white/10 transition-all"
          >
            Skip for now
          </button>
          <button
            type="submit"
            disabled={isBusy || !goalText.trim()}
            className="flex-1 py-3.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-gray-800 disabled:text-gray-600 disabled:border-transparent text-white rounded-2xl font-black text-xs transition-all flex items-center justify-center gap-2"
          >
            {isBusy ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Zap className="w-4 h-4" />
            )}
            Start Studying
          </button>
        </div>
      </form>
    </div>
  );
}
