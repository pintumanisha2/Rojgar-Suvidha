/**
 * VideoGrid.tsx
 * ─────────────────────────────────────────────────────────────────
 * Responsive video grid that auto-sizes like Zoom:
 *
 *   1 person  → full screen (your camera only)
 *   2 people  → 2 columns side by side
 *   3-4       → 2×2 grid
 *   5-6       → 2×3 or 3×2 grid
 *   7-9       → 3×3 grid
 *
 * Each tile renders a VideoTile component.
 * ─────────────────────────────────────────────────────────────────
 */
"use client";

import React from "react";
import VideoTile from "./VideoTile";

export interface GridParticipant {
  userId: string;
  name: string;
  goal?: string;
  stream?: MediaStream | null;
  isMe?: boolean;
  camOn?: boolean;
  clapsCount?: number;
}

interface VideoGridProps {
  participants: GridParticipant[];
  clapping: Record<string, boolean>;
  onEncourage: (userId: string) => void;
  myUserId: string | null;
}

function getGridConfig(count: number): { cols: number; rows: number } {
  if (count <= 1) return { cols: 1, rows: 1 };
  if (count <= 2) return { cols: 2, rows: 1 };
  if (count <= 4) return { cols: 2, rows: 2 };
  if (count <= 6) return { cols: 3, rows: 2 };
  if (count <= 9) return { cols: 3, rows: 3 };
  return { cols: 4, rows: Math.ceil(count / 4) };
}

export default function VideoGrid({
  participants, clapping, onEncourage, myUserId
}: VideoGridProps) {
  const count = participants.length;
  const { cols } = getGridConfig(count);

  if (count === 0) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#030712]">
        <div className="text-center space-y-3">
          <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mx-auto">
            <span className="text-4xl">📷</span>
          </div>
          <p className="text-sm font-black text-gray-500">Setting up camera...</p>
        </div>
      </div>
    );
  }

  /* Single participant — full screen */
  if (count === 1) {
    const p = participants[0];
    return (
      <div className="flex-1 flex bg-[#030712] p-2">
        <div className="flex-1">
          <VideoTile
            stream={p.stream}
            name={p.name}
            goal={p.goal}
            isMe={p.isMe}
            camOn={p.camOn}
            clapsCount={p.clapsCount}
            isClapping={clapping[p.userId]}
            onEncourage={!p.isMe ? () => onEncourage(p.userId) : undefined}
            isSpotlight
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto bg-[#030712] p-2">
      <div
        className="h-full grid gap-2"
        style={{
          gridTemplateColumns: `repeat(${cols}, 1fr)`,
          gridAutoRows: count <= 4 ? "1fr" : "auto",
        }}
      >
        {participants.map(p => (
          <VideoTile
            key={p.userId}
            stream={p.stream}
            name={p.name}
            goal={p.goal}
            isMe={p.isMe}
            camOn={p.camOn}
            clapsCount={p.clapsCount}
            isClapping={clapping[p.userId]}
            onEncourage={!p.isMe ? () => onEncourage(p.userId) : undefined}
          />
        ))}
      </div>
    </div>
  );
}
