/**
 * VideoGrid.tsx
 * ─────────────────────────────────────────────────────────────────
 * Responsive video grid — max 9 users per room, 6 shown per page.
 *
 * Grid layout per visible count:
 *   1 person  → full screen spotlight
 *   2 people  → 2 columns side by side
 *   3-4       → 2×2 grid
 *   5-6       → 3×2 grid  ← max one page
 *
 * If > 6 participants, pagination shows 6 per page with ◀ ▶ controls.
 * ─────────────────────────────────────────────────────────────────
 */
"use client";

import React, { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
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

/** Max tiles visible on one page */
const PAGE_SIZE = 6;

function getGridConfig(count: number): { cols: number; rows: number } {
  if (count <= 1) return { cols: 1, rows: 1 };
  if (count <= 2) return { cols: 2, rows: 1 };
  if (count <= 4) return { cols: 2, rows: 2 };
  return { cols: 3, rows: 2 }; // 5–6
}

export default function VideoGrid({
  participants, clapping, onEncourage, myUserId
}: VideoGridProps) {
  const [page, setPage] = useState(0);

  const totalPages = Math.max(1, Math.ceil(participants.length / PAGE_SIZE));

  // Clamp page if participants shrink
  const safePage = Math.min(page, totalPages - 1);

  // Slice current page — always put "me" first on page 0
  const meIndex = participants.findIndex(p => p.isMe);
  let ordered = [...participants];
  if (meIndex > 0) {
    // Move me to front
    const [me] = ordered.splice(meIndex, 1);
    ordered = [me, ...ordered];
  }
  const pageSlice = ordered.slice(safePage * PAGE_SIZE, safePage * PAGE_SIZE + PAGE_SIZE);
  const count = pageSlice.length;
  const { cols } = getGridConfig(count);

  if (participants.length === 0) {
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

  /* Single participant — full screen spotlight */
  if (count === 1 && participants.length === 1) {
    const p = pageSlice[0];
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
    <div className="flex-1 flex flex-col overflow-hidden bg-[#030712]">
      {/* Grid area */}
      <div className="flex-1 overflow-hidden p-2">
        <div
          className="h-full grid gap-2"
          style={{
            gridTemplateColumns: `repeat(${cols}, 1fr)`,
            gridTemplateRows: `repeat(${Math.ceil(count / cols)}, 1fr)`,
          }}
        >
          {pageSlice.map(p => (
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

      {/* Pagination bar — only shown if > PAGE_SIZE participants */}
      {totalPages > 1 && (
        <div className="shrink-0 flex items-center justify-center gap-3 pb-2">
          <button
            onClick={() => setPage(p => Math.max(0, p - 1))}
            disabled={safePage === 0}
            className="p-1.5 rounded-xl bg-white/5 border border-white/10 text-gray-400
                       hover:bg-white/10 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed
                       transition-all"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {/* Page dots */}
          <div className="flex items-center gap-1.5">
            {Array.from({ length: totalPages }).map((_, i) => (
              <button
                key={i}
                onClick={() => setPage(i)}
                className={`rounded-full transition-all ${
                  i === safePage
                    ? "w-4 h-1.5 bg-indigo-400"
                    : "w-1.5 h-1.5 bg-white/20 hover:bg-white/40"
                }`}
              />
            ))}
          </div>

          <button
            onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
            disabled={safePage === totalPages - 1}
            className="p-1.5 rounded-xl bg-white/5 border border-white/10 text-gray-400
                       hover:bg-white/10 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed
                       transition-all"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          <span className="text-[10px] text-gray-600 font-bold">
            {safePage * PAGE_SIZE + 1}–{Math.min((safePage + 1) * PAGE_SIZE, participants.length)} of {participants.length}
          </span>
        </div>
      )}
    </div>
  );
}
