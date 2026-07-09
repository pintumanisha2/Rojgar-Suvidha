"use client";
/**
 * AvatarTile.tsx
 * Shows a DB-driven avatar card for users with camera OFF.
 * Also handles local video preview (for "Me" tile) when LiveKit is not yet connected.
 */
import React, { useEffect, useRef } from "react";
import { Heart, VideoOff } from "lucide-react";

const AVATAR_COLORS = [
  "#6366f1","#ec4899","#10b981","#f59e0b",
  "#06b6d4","#8b5cf6","#f43f5e","#14b8a6",
  "#3b82f6","#84cc16","#f97316","#a855f7",
];
const avatarBg = (n: string) => AVATAR_COLORS[n.charCodeAt(0) % AVATAR_COLORS.length];
const initials = (n: string) => n.split(" ").slice(0, 2).map(w => w[0]).join("").toUpperCase();

export interface AvatarTileProps {
  userId: string;
  name: string;
  goal?: string;
  clapsCount?: number;
  isMe?: boolean;
  cameraActive?: boolean;
  isClapping?: boolean;
  onEncourage?: () => void;
  /** Local video track — shown for "Me" tile before LiveKit connects */
  localVideoTrack?: MediaStreamTrack | null;
}

export default function AvatarTile({
  userId, name, goal, clapsCount, isMe, cameraActive,
  isClapping, onEncourage, localVideoTrack
}: AvatarTileProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  // Attach local video track for "me" tile when LiveKit isn't yet connected
  useEffect(() => {
    if (!videoRef.current || !isMe || !localVideoTrack) return;
    const stream = new MediaStream([localVideoTrack]);
    videoRef.current.srcObject = stream;
  }, [isMe, localVideoTrack]);

  const showLocalVideo = isMe && !!localVideoTrack && cameraActive;

  return (
    <div className={`relative rounded-2xl overflow-hidden bg-[#0d1117] border
                     flex flex-col items-center justify-center gap-2
                     w-full h-full min-h-[60px] select-none group transition-all
                     ${isMe ? "ring-2 ring-indigo-500/40 border-indigo-500/20" : "border-white/5 hover:border-white/10"}`}>

      {/* Local video preview (for "me" before LiveKit connects) */}
      {showLocalVideo && (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="absolute inset-0 w-full h-full object-cover"
        />
      )}

      {/* Avatar (shown when no local video) */}
      {!showLocalVideo && (
        <>
          {/* Avatar circle */}
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center text-lg font-black text-white shadow-lg shrink-0"
            style={{ background: avatarBg(name) }}
          >
            {initials(name)}
          </div>

          {/* Name */}
          <div className="text-center px-2 w-full">
            <p className="text-[11px] font-black text-white truncate leading-tight flex items-center justify-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
              {name}
              {isMe && <span className="text-[9px] text-indigo-300 font-bold">(You)</span>}
            </p>
            {goal && (
              <p className="text-[9px] text-gray-400 truncate mt-0.5 leading-tight">
                📚 {goal}
              </p>
            )}
            {!goal && isMe && (
              <p className="text-[9px] text-gray-600 truncate mt-0.5 leading-tight italic">
                Tap "Set Goal" to add your task
              </p>
            )}
          </div>

          {/* Camera off indicator */}
          {!cameraActive && !isMe && (
            <div className="absolute bottom-2 left-2 flex items-center gap-1 bg-black/50 px-1.5 py-0.5 rounded-md">
              <VideoOff className="w-2.5 h-2.5 text-gray-500" />
            </div>
          )}
        </>
      )}

      {/* Gradient overlay (only when video is showing) */}
      {showLocalVideo && (
        <div className="absolute inset-x-0 bottom-0 h-16
                        bg-gradient-to-t from-black/90 via-black/40 to-transparent
                        pointer-events-none" />
      )}

      {/* Name overlay on video */}
      {showLocalVideo && (
        <div className="absolute bottom-0 left-0 right-0 px-2.5 py-2 pointer-events-none">
          <p className="text-[10px] font-black text-white truncate leading-tight">
            {name}
          </p>
          {goal && (
            <p className="text-[8px] text-gray-300/80 truncate mt-0.5 leading-tight">
              📚 {goal}
            </p>
          )}
        </div>
      )}

      {/* Encourage button */}
      {!isMe && onEncourage && (
        <button
          onClick={onEncourage}
          className={`absolute top-2 right-2 flex items-center gap-1 px-2 py-1
                      rounded-lg text-[9px] font-black transition-all
                      opacity-0 group-hover:opacity-100
                      ${isClapping
                        ? "bg-pink-500/80 text-white opacity-100"
                        : "bg-black/50 text-gray-400 hover:bg-pink-500/50 hover:text-white"}`}
        >
          <Heart className={`w-2.5 h-2.5 ${isClapping ? "fill-current" : ""}`} />
          {clapsCount ?? 0}
        </button>
      )}

      {/* YOU badge */}
      {isMe && (
        <div className="absolute top-2 left-2 bg-indigo-600/80 text-white
                        text-[8px] font-black px-1.5 py-0.5 rounded-md border border-indigo-400/30">
          YOU
        </div>
      )}

      {/* Clap burst */}
      {isClapping && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <span className="text-4xl animate-bounce">👏</span>
        </div>
      )}
    </div>
  );
}
