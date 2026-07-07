/**
 * ControlBar.tsx
 * ─────────────────────────────────────────────────────────────────
 * Bottom Control Bar for the video room. Zoom-style:
 *   • Mic Toggle (starts muted, shows red MicOff if muted)
 *   • Camera Toggle (starts unmuted, shows red VideoOff if off)
 *   • Participants Sidebar Toggle (highlights when active)
 *   • Update Goal target_task trigger
 *   • Exit Room (red exit button)
 * ─────────────────────────────────────────────────────────────────
 */
"use client";

import React from "react";
import { Mic, MicOff, Video, VideoOff, Users, Target, LogOut } from "lucide-react";

interface ControlBarProps {
  camOn: boolean;
  micOn: boolean;
  onToggleCam: () => void;
  onToggleMic: () => void;
  showSidebar: boolean;
  onToggleSidebar: () => void;
  onUpdateGoal: () => void;
  onExit: () => void;
  participantCount: number;
}

export default function ControlBar({
  camOn,
  micOn,
  onToggleCam,
  onToggleMic,
  showSidebar,
  onToggleSidebar,
  onUpdateGoal,
  onExit,
  participantCount,
}: ControlBarProps) {
  return (
    <div className="shrink-0 h-16 bg-[#080d1a]/95 border-t border-white/5 backdrop-blur-md flex items-center justify-between px-4 sm:px-6 z-20">
      {/* Left side: participant status */}
      <div className="flex items-center gap-2">
        <button
          onClick={onToggleSidebar}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-black transition-all ${
            showSidebar
              ? "bg-indigo-600/20 text-indigo-300 border-indigo-500/30"
              : "bg-white/5 text-gray-400 border-white/5 hover:bg-white/10"
          }`}
        >
          <Users className="w-4 h-4" />
          <span className="hidden sm:inline">Buddies</span>
          <span className="bg-indigo-600/30 text-indigo-300 text-[10px] px-1.5 py-0.5 rounded-full font-black">
            {participantCount}
          </span>
        </button>
      </div>

      {/* Center controls: Mic, Cam, Goal */}
      <div className="flex items-center gap-3">
        {/* Toggle Audio Mic */}
        <button
          onClick={onToggleMic}
          title={micOn ? "Mute Microphone" : "Unmute Microphone"}
          className={`p-3 rounded-2xl border transition-all flex items-center justify-center ${
            micOn
              ? "bg-white/5 border-white/10 text-emerald-400 hover:bg-white/10"
              : "bg-red-500/10 border-red-500/20 text-red-400 hover:bg-red-500/20 animate-pulse-subtle"
          }`}
        >
          {micOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
        </button>

        {/* Toggle Video Camera */}
        <button
          onClick={onToggleCam}
          title={camOn ? "Stop Video" : "Start Video"}
          className={`p-3 rounded-2xl border transition-all flex items-center justify-center ${
            camOn
              ? "bg-white/5 border-white/10 text-white hover:bg-white/10"
              : "bg-red-500/10 border-red-500/20 text-red-400 hover:bg-red-500/20"
          }`}
        >
          {camOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
        </button>

        {/* Update Goal target */}
        <button
          onClick={onUpdateGoal}
          className="flex items-center gap-2 px-4 py-3 bg-indigo-600 hover:bg-indigo-500 text-white border border-indigo-500/20 rounded-2xl text-xs font-black transition-all shadow-lg shadow-indigo-950/50"
        >
          <Target className="w-4 h-4" />
          <span className="hidden sm:inline">Set Goal</span>
        </button>
      </div>

      {/* Right controls: Red Exit */}
      <div className="flex items-center">
        <button
          onClick={onExit}
          className="flex items-center gap-1.5 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-2xl text-xs font-extrabold transition-all active:scale-95 shadow-md shadow-red-950/20"
        >
          <LogOut className="w-4 h-4" />
          <span className="hidden sm:inline">Leave Room</span>
        </button>
      </div>
    </div>
  );
}
