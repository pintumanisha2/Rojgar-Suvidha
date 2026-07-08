"use client";
/**
 * HallControls.tsx — Bottom control bar for the Public Study Hall
 */
import React from "react";
import { Mic, MicOff, Video, VideoOff, Target, LogOut, Users } from "lucide-react";

interface HallControlsProps {
  camOn: boolean;
  micOn: boolean;
  onToggleCam: () => void;
  onToggleMic: () => void;
  onSetGoal: () => void;
  onLeave: () => void;
  totalOnline: number;
}

export default function HallControls({
  camOn, micOn, onToggleCam, onToggleMic, onSetGoal, onLeave, totalOnline
}: HallControlsProps) {
  return (
    <div className="shrink-0 h-16 bg-[#080d1a]/95 border-t border-white/5
                    backdrop-blur-md flex items-center justify-between px-4 sm:px-6 z-20">
      {/* Left: Online count */}
      <div className="flex items-center gap-2 text-xs font-black text-gray-400">
        <Users className="w-4 h-4 text-emerald-400" />
        <span className="text-emerald-400">{totalOnline.toLocaleString()}</span>
        <span className="hidden sm:inline">online</span>
      </div>

      {/* Center: Mic + Cam + Goal */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleMic}
          title={micOn ? "Mute" : "Unmute"}
          className={`p-3 rounded-2xl border transition-all ${
            micOn
              ? "bg-white/5 border-white/10 text-emerald-400 hover:bg-white/10"
              : "bg-red-500/10 border-red-500/20 text-red-400 hover:bg-red-500/20"
          }`}
        >
          {micOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
        </button>

        <button
          onClick={onToggleCam}
          title={camOn ? "Stop Video" : "Start Video"}
          className={`p-3 rounded-2xl border transition-all ${
            camOn
              ? "bg-white/5 border-white/10 text-white hover:bg-white/10"
              : "bg-red-500/10 border-red-500/20 text-red-400 hover:bg-red-500/20"
          }`}
        >
          {camOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
        </button>

        <button
          onClick={onSetGoal}
          className="flex items-center gap-2 px-4 py-3 bg-indigo-600 hover:bg-indigo-500
                     text-white border border-indigo-500/20 rounded-2xl text-xs font-black
                     transition-all shadow-lg shadow-indigo-950/50"
        >
          <Target className="w-4 h-4" />
          <span className="hidden sm:inline">Set Goal</span>
        </button>
      </div>

      {/* Right: Leave */}
      <button
        onClick={onLeave}
        className="flex items-center gap-1.5 px-4 py-2.5 bg-red-600 hover:bg-red-700
                   text-white rounded-2xl text-xs font-extrabold transition-all
                   active:scale-95 shadow-md shadow-red-950/20"
      >
        <LogOut className="w-4 h-4" />
        <span className="hidden sm:inline">Leave</span>
      </button>
    </div>
  );
}
