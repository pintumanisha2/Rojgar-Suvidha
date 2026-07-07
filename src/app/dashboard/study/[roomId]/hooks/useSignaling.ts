/**
 * useSignaling.ts
 * ─────────────────────────────────────────────────────────────────
 * Supabase Realtime Broadcast = our free signaling server
 *
 * Events:
 *   peer_joined  → new user entered the room
 *   peer_left    → user left the room
 *   signal       → WebRTC offer / answer / ICE candidate
 * ─────────────────────────────────────────────────────────────────
 */
"use client";

import { useRef, useCallback } from "react";
import { supabase } from "@/lib/supabase";

export interface SignalPayload {
  to: string;
  from: string;
  fromName: string;
  signal: any;
}

export interface PeerJoinedPayload {
  userId: string;
  displayName: string;
}

export function useSignaling(roomId: string) {
  const channelRef = useRef<any>(null);

  /* ── Subscribe to the room's signaling channel ───────────── */
  const subscribe = useCallback(async (handlers: {
    onPeerJoined: (payload: PeerJoinedPayload) => void;
    onPeerLeft:   (payload: { userId: string }) => void;
    onSignal:     (payload: SignalPayload) => void;
    onSubscribed: () => void;
  }) => {
    /* Remove old channel if any */
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }

    const channel = supabase.channel(`rtc_signal_${roomId}`, {
      config: { broadcast: { self: false, ack: false } },
    });

    channel
      .on("broadcast", { event: "peer_joined" }, ({ payload }: any) => {
        handlers.onPeerJoined(payload as PeerJoinedPayload);
      })
      .on("broadcast", { event: "peer_left" }, ({ payload }: any) => {
        handlers.onPeerLeft(payload);
      })
      .on("broadcast", { event: "signal" }, ({ payload }: any) => {
        handlers.onSignal(payload as SignalPayload);
      });

    await channel.subscribe((status) => {
      if (status === "SUBSCRIBED") {
        handlers.onSubscribed();
      }
    });

    channelRef.current = channel;
    return channel;
  }, [roomId]);

  /* ── Announce that WE joined ─────────────────────────────── */
  const announceJoin = useCallback(async (userId: string, displayName: string) => {
    if (!channelRef.current) return;
    await channelRef.current.send({
      type: "broadcast",
      event: "peer_joined",
      payload: { userId, displayName } satisfies PeerJoinedPayload,
    });
  }, []);

  /* ── Announce that WE left ───────────────────────────────── */
  const announceLeave = useCallback(async (userId: string) => {
    if (!channelRef.current) return;
    await channelRef.current.send({
      type: "broadcast",
      event: "peer_left",
      payload: { userId },
    }).catch(() => {}); // ignore errors on leave
  }, []);

  /* ── Send a WebRTC signal to a specific user ─────────────── */
  const sendSignal = useCallback(async (payload: SignalPayload) => {
    if (!channelRef.current) return;
    await channelRef.current.send({
      type: "broadcast",
      event: "signal",
      payload,
    });
  }, []);

  /* ── Unsubscribe / cleanup ───────────────────────────────── */
  const cleanup = useCallback(() => {
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }
  }, []);

  return { subscribe, announceJoin, announceLeave, sendSignal, cleanup };
}
