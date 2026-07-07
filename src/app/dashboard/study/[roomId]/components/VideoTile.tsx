/**
 * VideoTile.tsx
 * ─────────────────────────────────────────────────────────────────
 * A single participant's camera tile.
 * Shows:
 *   • Live <video> stream (WebRTC MediaStream)
 *   • Name + study goal overlay at bottom
 *   • 👏 Encourage button (appears on hover)
 *   • "YOU" badge on your own tile
 *   • Avatar fallback when camera is off / connecting
 * ─────────────────────────────────────────────────────────────────
 */
"use client";

import React, { useEffect, useRef } from "react";
import { Heart, VideoOff } from "lucide-react";

interface VideoTileProps {
  stream?: MediaStream | null;
  name: string;
  goal?: string;
  isMe?: boolean;
  camOn?: boolean;
  clapsCount?: number;
  isClapping?: boolean;
  onEncourage?: () => void;
  /* Layout hint — larger tile for spotlight / 1-person view */
  isSpotlight?: boolean;
}

/* Avatar color from name initial */
const AVATAR_COLORS = [
  "#6366f1","#ec4899","#10b981","#f59e0b",
  "#06b6d4","#8b5cf6","#f43f5e","#14b8a6",
  "#3b82f6","#84cc16",
];
const avatarBg  = (n: string) => AVATAR_COLORS[n.charCodeAt(0) % AVATAR_COLORS.length];
const initials  = (n: string) => n.split(" ").slice(0, 2).map(w => w[0]).join("").toUpperCase();

export default function VideoTile({
  stream, name, goal, isMe, camOn = true,
  clapsCount, isClapping, onEncourage, isSpotlight,
}: VideoTileProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  /* Attach MediaStream to <video> element */
  useEffect(() => {
    if (!videoRef.current) return;
    if (stream) {
      videoRef.current.srcObject = stream;
    } else {
      videoRef.current.srcObject = null;
    }
  }, [stream]);

  const showVideo = !!stream && camOn !== false;

  return (
    <div
      className={`relative rounded-2xl overflow-hidden bg-[#0d1117] border
                  flex items-center justify-center select-none group transition-all
                  ${isSpotlight ? "border-indigo-500/40 shadow-lg shadow-indigo-950/50" : "border-white/5"}
                  ${isMe ? "ring-2 ring-indigo-500/30" : ""}`}
      style={{ aspectRatio: "16/9" }}
    >
      {/* ── LIVE VIDEO ────────────────────────────────── */}
      {showVideo && (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={!!isMe}          /* never hear yourself */
          className="absolute inset-0 w-full h-full object-cover"
        />
      )}

      {/* ── AVATAR FALLBACK (camera off / connecting) ── */}
      {!showVideo && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-[#0d1117]">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-black text-white shadow-lg"
            style={{ background: avatarBg(name) }}
          >
            {initials(name)}
          </div>
          {!stream && (
            <p className="text-[10px] text-gray-600 font-bold flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 animate-pulse" />
              Connecting...
            </p>
          )}
          {stream && !camOn && (
            <p className="text-[10px] text-gray-500 font-bold flex items-center gap-1.5">
              <VideoOff className="w-3 h-3" /> Camera off
            </p>
          )}
        </div>
      )}

      {/* ── DARK GRADIENT OVERLAY (bottom) ────────────── */}
      <div className="absolute inset-x-0 bottom-0 h-20
                      bg-gradient-to-t from-black/90 via-black/40 to-transparent
                      pointer-events-none" />

      {/* ── NAME + GOAL (bottom left) ─────────────────── */}
      <div className="absolute bottom-0 left-0 right-0 px-3 py-2.5 pointer-events-none">
        <p className="text-[11px] font-black text-white truncate leading-none flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
          {name}
          {isMe && <span className="text-[9px] text-indigo-300 font-bold ml-1">(You)</span>}
        </p>
        {goal && (
          <p className="text-[9px] text-gray-300/90 truncate mt-0.5 font-medium leading-none">
            📚 {goal}
          </p>
        )}
      </div>

      {/* ── ENCOURAGE BUTTON (top right, hover only) ──── */}
      {!isMe && onEncourage && (
        <button
          onClick={onEncourage}
          className={`absolute top-2.5 right-2.5 flex items-center gap-1 px-2.5 py-1.5
                      rounded-xl text-[9px] font-black transition-all duration-150
                      opacity-0 group-hover:opacity-100 focus:opacity-100
                      ${isClapping
                        ? "bg-pink-500/80 text-white scale-110 opacity-100"
                        : "bg-black/60 text-gray-300 hover:bg-pink-500/70 hover:text-white"}`}
        >
          <Heart className={`w-3 h-3 ${isClapping ? "fill-current" : ""}`} />
          {clapsCount || 0}
        </button>
      )}

      {/* ── CLAP BURST ANIMATION ──────────────────────── */}
      {isClapping && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <span className="text-5xl animate-bounce">👏</span>
        </div>
      )}

      {/* ── YOU BADGE (top left) ──────────────────────── */}
      {isMe && (
        <div className="absolute top-2.5 left-2.5 bg-indigo-600/80 backdrop-blur-sm
                        text-white text-[9px] font-black px-2 py-0.5 rounded-lg
                        border border-indigo-400/30">
          YOU
        </div>
      )}

      {/* ── SPEAKING INDICATOR (green border pulse) ───── */}
      {/* TODO: Add audio level detection for speaker highlight */}
    </div>
  );
}
