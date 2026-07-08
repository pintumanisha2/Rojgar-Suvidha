"use client";
/**
 * LiveTile.tsx
 * Renders a single LiveKit participant's video tile.
 * Subscribes only when visible (handled by parent HallGrid).
 */
import React, { useEffect, useRef } from "react";
import { Participant, Track } from "livekit-client";
import { Heart } from "lucide-react";

const AVATAR_COLORS = [
  "#6366f1","#ec4899","#10b981","#f59e0b",
  "#06b6d4","#8b5cf6","#f43f5e","#14b8a6",
  "#3b82f6","#84cc16","#f97316","#a855f7",
];
const avatarBg = (n: string) => AVATAR_COLORS[n.charCodeAt(0) % AVATAR_COLORS.length];
const initials = (n: string) => n.split(" ").slice(0, 2).map(w => w[0]).join("").toUpperCase();

interface LiveTileProps {
  participant: Participant;
  goal?: string;
  clapsCount?: number;
  isMe?: boolean;
  isClapping?: boolean;
  onEncourage?: () => void;
  localVideoTrack?: MediaStreamTrack | null; // For local user only
}

export default function LiveTile({
  participant, goal, clapsCount, isMe, isClapping, onEncourage, localVideoTrack
}: LiveTileProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const name = participant.name || participant.identity || "Student";

  useEffect(() => {
    if (!videoRef.current) return;

    if (isMe && localVideoTrack) {
      // For local user: attach local MediaStream directly
      const stream = new MediaStream([localVideoTrack]);
      videoRef.current.srcObject = stream;
      return;
    }

    // For remote participants: get camera track from LiveKit
    const cameraPublication = participant.getTrackPublication(Track.Source.Camera);
    if (cameraPublication?.track) {
      cameraPublication.track.attach(videoRef.current);
    }

    return () => {
      const pub = participant.getTrackPublication(Track.Source.Camera);
      if (pub?.track && videoRef.current) {
        pub.track.detach(videoRef.current);
      }
    };
  }, [participant, isMe, localVideoTrack]);

  const hasVideo = isMe
    ? !!localVideoTrack
    : !!participant.getTrackPublication(Track.Source.Camera)?.isSubscribed;

  return (
    <div className={`relative rounded-2xl overflow-hidden bg-[#0d1117] border
                     flex items-center justify-center select-none group transition-all
                     w-full h-full min-h-[120px]
                     ${isMe ? "ring-2 ring-indigo-500/40 border-indigo-500/20" : "border-white/5"}`}>

      {/* Live video */}
      {hasVideo && (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={!!isMe}
          className="absolute inset-0 w-full h-full object-cover"
        />
      )}

      {/* Avatar fallback when video not ready yet */}
      {!hasVideo && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-[#0d1117]">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center text-lg font-black text-white shadow-lg"
            style={{ background: avatarBg(name) }}
          >
            {initials(name)}
          </div>
          <p className="text-[9px] text-yellow-500 flex items-center gap-1 font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse" />
            Connecting...
          </p>
        </div>
      )}

      {/* Dark gradient overlay */}
      <div className="absolute inset-x-0 bottom-0 h-16
                      bg-gradient-to-t from-black/90 via-black/40 to-transparent
                      pointer-events-none" />

      {/* LIVE badge */}
      <div className="absolute top-2 left-2 bg-red-600/90 text-white
                      text-[8px] font-black px-1.5 py-0.5 rounded-md flex items-center gap-1">
        <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
        LIVE
      </div>

      {/* YOU badge */}
      {isMe && (
        <div className="absolute top-2 right-2 bg-indigo-600/80 text-white
                        text-[8px] font-black px-1.5 py-0.5 rounded-md border border-indigo-400/30">
          YOU
        </div>
      )}

      {/* Name + goal */}
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

      {/* Encourage button */}
      {!isMe && onEncourage && (
        <button
          onClick={onEncourage}
          className={`absolute bottom-2 right-2 flex items-center gap-1 px-2 py-1
                      rounded-lg text-[9px] font-black transition-all
                      opacity-0 group-hover:opacity-100
                      ${isClapping
                        ? "bg-pink-500/80 text-white opacity-100"
                        : "bg-black/60 text-gray-300 hover:bg-pink-500/60 hover:text-white"}`}
        >
          <Heart className={`w-2.5 h-2.5 ${isClapping ? "fill-current" : ""}`} />
          {clapsCount ?? 0}
        </button>
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
