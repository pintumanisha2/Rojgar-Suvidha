/**
 * useWebRTC.ts
 * ─────────────────────────────────────────────────────────────────
 * Handles:
 *   1. Local camera / microphone MediaStream
 *   2. Creating simple-peer P2P connections per remote user
 *   3. Receiving remote video streams
 *   4. Camera & mic toggle
 *
 * Works with useSignaling.ts for the Supabase signaling layer.
 * ─────────────────────────────────────────────────────────────────
 */
"use client";

import { useRef, useState, useCallback, useEffect } from "react";

export interface RemotePeer {
  userId: string;
  displayName: string;
  stream?: MediaStream;
}

/* Free Google STUN servers for NAT traversal */
const ICE_CONFIG = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun2.l.google.com:19302" },
  ],
};

export function useWebRTC(myUserId: string | null) {
  /* ── Local stream (our own camera + mic) ─────────────────── */
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [camOn, setCamOn] = useState(true);
  const [micOn, setMicOn] = useState(false); // starts muted by default
  const [camPermission, setCamPermission] = useState<"pending" | "granted" | "denied">("pending");

  /* ── Remote peers: userId → { peer, stream } ─────────────── */
  const peersRef = useRef<Map<string, any>>(new Map()); // Map<userId, SimplePeer>
  const [remotePeers, setRemotePeers] = useState<Map<string, RemotePeer>>(new Map());

  /* ── Request camera + mic from browser ───────────────────── */
  const initCamera = useCallback(async (): Promise<MediaStream | null> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: "user",
          frameRate: { ideal: 24 },
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      /* Mic starts muted */
      stream.getAudioTracks().forEach(t => (t.enabled = false));

      setLocalStream(stream);
      setCamPermission("granted");
      setCamOn(true);
      setMicOn(false);
      return stream;
    } catch (err: any) {
      console.warn("Camera init failed:", err.name, err.message);
      setCamPermission("denied");

      /* Try audio-only fallback */
      try {
        const audioOnly = await navigator.mediaDevices.getUserMedia({ audio: true });
        audioOnly.getAudioTracks().forEach(t => (t.enabled = false));
        setLocalStream(audioOnly);
        setCamOn(false);
        return audioOnly;
      } catch {
        setLocalStream(null);
        return null;
      }
    }
  }, []);

  /* ── Toggle camera ───────────────────────────────────────── */
  const toggleCam = useCallback(() => {
    if (!localStream) return;
    const track = localStream.getVideoTracks()[0];
    if (!track) return;
    track.enabled = !track.enabled;
    setCamOn(track.enabled);
  }, [localStream]);

  /* ── Toggle mic ──────────────────────────────────────────── */
  const toggleMic = useCallback(() => {
    if (!localStream) return;
    const track = localStream.getAudioTracks()[0];
    if (!track) return;
    track.enabled = !track.enabled;
    setMicOn(track.enabled);
  }, [localStream]);

  /* ── Create a peer connection to a remote user ───────────── */
  const createPeer = useCallback(async (
    remoteUserId: string,
    remoteDisplayName: string,
    initiator: boolean,
    stream: MediaStream | null,
    onSignal: (data: any) => void,
  ) => {
    /* Avoid duplicates */
    if (peersRef.current.has(remoteUserId)) return;

    const { default: SimplePeer } = await import("simple-peer");

    const peer = new SimplePeer({
      initiator,
      stream: stream ?? undefined,
      config: ICE_CONFIG,
      trickle: true, // send ICE candidates as they arrive (faster connection)
    });

    /* When THIS peer generates a signal (offer/answer/ICE) → caller sends it via Supabase */
    peer.on("signal", (data: any) => {
      onSignal(data);
    });

    /* When we receive the remote user's video stream */
    peer.on("stream", (remoteStream: MediaStream) => {
      setRemotePeers(prev => {
        const next = new Map(prev);
        next.set(remoteUserId, { userId: remoteUserId, displayName: remoteDisplayName, stream: remoteStream });
        return next;
      });
    });

    peer.on("error", (err: any) => {
      console.warn(`[WebRTC] peer error with ${remoteUserId}:`, err.message);
      destroyPeer(remoteUserId);
    });

    peer.on("close", () => {
      destroyPeer(remoteUserId);
    });

    peersRef.current.set(remoteUserId, peer);

    /* Add to remotePeers list immediately (stream arrives later) */
    setRemotePeers(prev => {
      const next = new Map(prev);
      if (!next.has(remoteUserId)) {
        next.set(remoteUserId, { userId: remoteUserId, displayName: remoteDisplayName });
      }
      return next;
    });

    return peer;
  }, []);

  /* ── Feed incoming signal to the correct peer ────────────── */
  const signalPeer = useCallback((fromUserId: string, signalData: any) => {
    const peer = peersRef.current.get(fromUserId);
    if (!peer) return;
    try {
      peer.signal(signalData);
    } catch (err) {
      console.warn("[WebRTC] signal error:", err);
    }
  }, []);

  /* ── Destroy a single peer connection ────────────────────── */
  const destroyPeer = useCallback((userId: string) => {
    const peer = peersRef.current.get(userId);
    if (peer) {
      try { peer.destroy(); } catch {}
      peersRef.current.delete(userId);
    }
    setRemotePeers(prev => {
      const next = new Map(prev);
      next.delete(userId);
      return next;
    });
  }, []);

  /* ── Destroy ALL connections and stop local stream ───────── */
  const cleanup = useCallback(() => {
    peersRef.current.forEach(peer => { try { peer.destroy(); } catch {} });
    peersRef.current.clear();
    setRemotePeers(new Map());
    localStream?.getTracks().forEach(t => t.stop());
    setLocalStream(null);
  }, [localStream]);

  return {
    /* State */
    localStream,
    camOn,
    micOn,
    camPermission,
    remotePeers,
    peersRef,
    /* Actions */
    initCamera,
    toggleCam,
    toggleMic,
    createPeer,
    signalPeer,
    destroyPeer,
    cleanup,
  };
}
