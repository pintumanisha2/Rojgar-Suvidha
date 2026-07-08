"use client";
/**
 * HallGrid.tsx
 * 16-tile (4×4) paginated grid for the Public Study Hall.
 *
 * - Camera-ON users with LiveKit participant → LiveTile (real video)
 * - Camera-OFF users or non-subscribed → AvatarTile (DB avatar card)
 * - Pagination: 16 per page, ◀ ▶ navigation
 * - "Me" tile always pinned at position 0 on page 1
 */
import React, { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Participant } from "livekit-client";
import LiveTile from "./LiveTile";
import AvatarTile from "./AvatarTile";

export interface HallParticipant {
  userId: string;
  displayName: string;
  goal?: string;
  cameraActive: boolean;
  clapsCount?: number;
  isMe?: boolean;
  /** Matched LiveKit participant if camera is on */
  lkParticipant?: Participant;
  /** Local video track (only for "me") */
  localVideoTrack?: MediaStreamTrack | null;
}

interface HallGridProps {
  participants: HallParticipant[];
  clapping: Record<string, boolean>;
  onEncourage: (userId: string) => void;
  totalCount: number;
}

const PAGE_SIZE = 16; // 4×4 grid

export default function HallGrid({
  participants, clapping, onEncourage, totalCount
}: HallGridProps) {
  const [page, setPage] = useState(0);

  const totalPages = Math.max(1, Math.ceil(participants.length / PAGE_SIZE));
  const safePage   = Math.min(page, totalPages - 1);

  // Put "me" first
  const meIndex = participants.findIndex(p => p.isMe);
  const ordered = [...participants];
  if (meIndex > 0) {
    const [me] = ordered.splice(meIndex, 1);
    ordered.unshift(me);
  }

  const slice = ordered.slice(safePage * PAGE_SIZE, (safePage + 1) * PAGE_SIZE);

  if (participants.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#030712]">
        <div className="text-center space-y-4">
          <div className="text-6xl">📚</div>
          <p className="text-gray-400 font-bold text-sm">Be the first to join the hall!</p>
          <p className="text-gray-600 text-xs">Share the link with your study buddies</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-[#030712]">
      {/* Grid */}
      <div className="flex-1 overflow-hidden p-2">
        <div
          className="h-full grid gap-2"
          style={{
            gridTemplateColumns: "repeat(4, 1fr)",
            gridTemplateRows:    `repeat(${Math.ceil(slice.length / 4)}, 1fr)`,
          }}
        >
          {slice.map(p => {
            const isLive = p.cameraActive && (p.lkParticipant || p.isMe);
            return isLive ? (
              <LiveTile
                key={p.userId}
                participant={p.lkParticipant!}
                goal={p.goal}
                clapsCount={p.clapsCount}
                isMe={p.isMe}
                isClapping={clapping[p.userId]}
                onEncourage={!p.isMe ? () => onEncourage(p.userId) : undefined}
                localVideoTrack={p.localVideoTrack}
              />
            ) : (
              <AvatarTile
                key={p.userId}
                userId={p.userId}
                name={p.displayName}
                goal={p.goal}
                clapsCount={p.clapsCount}
                isMe={p.isMe}
                isClapping={clapping[p.userId]}
                onEncourage={!p.isMe ? () => onEncourage(p.userId) : undefined}
              />
            );
          })}
        </div>
      </div>

      {/* Pagination */}
      <div className="shrink-0 flex items-center justify-center gap-3 py-2">
        <button
          onClick={() => setPage(p => Math.max(0, p - 1))}
          disabled={safePage === 0}
          className="p-1.5 rounded-xl bg-white/5 border border-white/10 text-gray-400
                     hover:bg-white/10 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {/* Page dots (max 7 shown) */}
        <div className="flex items-center gap-1">
          {Array.from({ length: Math.min(7, totalPages) }).map((_, i) => {
            const pageIndex = totalPages <= 7 ? i :
              safePage < 4 ? i :
              safePage > totalPages - 4 ? totalPages - 7 + i :
              safePage - 3 + i;
            return (
              <button
                key={pageIndex}
                onClick={() => setPage(pageIndex)}
                className={`rounded-full transition-all ${
                  pageIndex === safePage
                    ? "w-4 h-1.5 bg-indigo-400"
                    : "w-1.5 h-1.5 bg-white/20 hover:bg-white/40"
                }`}
              />
            );
          })}
        </div>

        <button
          onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
          disabled={safePage >= totalPages - 1}
          className="p-1.5 rounded-xl bg-white/5 border border-white/10 text-gray-400
                     hover:bg-white/10 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
        >
          <ChevronRight className="w-4 h-4" />
        </button>

        <span className="text-[10px] text-gray-500 font-bold ml-1">
          {safePage * PAGE_SIZE + 1}–{Math.min((safePage + 1) * PAGE_SIZE, participants.length)} of {totalCount.toLocaleString()} studying
        </span>
      </div>
    </div>
  );
}
