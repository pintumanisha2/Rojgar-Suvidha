"use client";
/**
 * /dashboard/study/hall/page.tsx
 * ─────────────────────────────────────────────────────────────────
 * PUBLIC STUDY HALL — supports 1000+ students simultaneously
 *
 * Architecture:
 *   • LiveKit SFU  → handles video streams (camera-on users)
 *   • Supabase DB  → presence tracking (all users, polling every 15s)
 *   • 16 tiles/page (4×4 grid), paginated with ◀ ▶
 *   • Heartbeat every 30s → auto-remove on tab close (2 min)
 * ─────────────────────────────────────────────────────────────────
 */

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Room, RoomEvent, Participant, Track } from "livekit-client";
import toast from "react-hot-toast";
import { ArrowLeft, Loader2 } from "lucide-react";
import HallGrid, { HallParticipant } from "./components/HallGrid";
import HallControls from "./components/HallControls";

/* ── Types ───────────────────────────────────────────────── */
interface DBParticipant {
  id: string;
  user_id: string;
  display_name: string;
  target_task?: string;
  camera_active: boolean;
  claps_count?: number;
  joined_at?: string;
}

const PUBLIC_HALL_ROOM_ID = process.env.NEXT_PUBLIC_PUBLIC_HALL_ROOM_ID || "public-hall";

export default function PublicHallPage() {
  const router = useRouter();

  /* ── State ──────────────────────────────────────────────── */
  const [loading,       setLoading]       = useState(true);
  const [myUserId,      setMyUserId]      = useState<string | null>(null);
  const [myName,        setMyName]        = useState("");
  const [mySessionId,   setMySessionId]   = useState<string | null>(null);
  const [myGoal,        setMyGoal]        = useState("");
  const [showGoalInput, setShowGoalInput] = useState(false);
  const [goalInput,     setGoalInput]     = useState("");
  const [goalBusy,      setGoalBusy]      = useState(false);

  /* Camera/mic state */
  const [camOn,         setCamOn]         = useState(false);
  const [micOn,         setMicOn]         = useState(false);
  const localStreamRef  = useRef<MediaStream | null>(null);
  const [localVideoTrack, setLocalVideoTrack] = useState<MediaStreamTrack | null>(null);

  /* DB participants */
  const [dbParticipants, setDbParticipants] = useState<DBParticipant[]>([]);
  const [totalCount,     setTotalCount]     = useState(0);

  /* LiveKit */
  const lkRoomRef       = useRef<Room | null>(null);
  const [lkParticipants, setLkParticipants] = useState<Map<string, Participant>>(new Map());

  /* Clapping */
  const [clapping,       setClapping]       = useState<Record<string, boolean>>({});

  const bootCalled = useRef(false);

  /* ── Fetch DB participants (polling) ──────────────────── */
  const fetchParticipants = useCallback(async () => {
    // Only show participants with heartbeat within last 2 minutes
    const cutoff = new Date(Date.now() - 2 * 60 * 1000).toISOString();
    const { data, count } = await supabase
      .from("study_session_users")
      .select("*", { count: "exact" })
      .eq("room_id", PUBLIC_HALL_ROOM_ID)
      .gte("last_heartbeat", cutoff)
      .order("joined_at", { ascending: true });

    if (data) {
      setDbParticipants(data as DBParticipant[]);
      setTotalCount(count ?? data.length);
    }
  }, []);

  /* ── Boot sequence ───────────────────────────────────── */
  useEffect(() => {
    if (bootCalled.current) return;
    bootCalled.current = true;

    let heartbeatTimer: any = null;
    let pollTimer:      any = null;

    const boot = async () => {
      /* 1. Auth */
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push("/login"); return; }
      const uid = session.user.id;
      setMyUserId(uid);

      /* 2. Profile */
      const { data: profile } = await supabase
        .from("profiles").select("full_name").eq("id", uid).single();
      if (!profile?.full_name) {
        router.push(`/profile-setup?redirect=/dashboard/study/hall`); return;
      }
      const displayName = profile.full_name;
      setMyName(displayName);

      /* 3. Register presence in DB */
      await supabase.from("study_session_users").delete().eq("user_id", uid);
      const { data: sessRow, error: sessErr } = await supabase
        .from("study_session_users")
        .upsert({
          room_id:      PUBLIC_HALL_ROOM_ID,
          user_id:      uid,
          display_name: displayName,
          target_task:  "",
          camera_active: false,
          last_heartbeat: new Date().toISOString(),
        }, { onConflict: "user_id" })
        .select().single();

      if (sessErr || !sessRow) {
        toast.error("Could not join the hall.");
        router.push("/dashboard/study"); return;
      }
      setMySessionId(sessRow.id);

      /* 4. Show UI */
      await fetchParticipants();
      setLoading(false);

      /* 5. Heartbeat every 30s */
      heartbeatTimer = setInterval(async () => {
        await supabase.from("study_session_users")
          .update({ last_heartbeat: new Date().toISOString() })
          .eq("user_id", uid);
      }, 30_000);

      /* 6. Poll DB every 15s for updated participant list */
      pollTimer = setInterval(fetchParticipants, 15_000);

      /* 7. Camera in background */
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 640 }, height: { ideal: 480 }, frameRate: { ideal: 24 } },
          audio: { echoCancellation: true, noiseSuppression: true },
        });
        stream.getAudioTracks().forEach(t => (t.enabled = false));
        localStreamRef.current = stream;
        const videoTrack = stream.getVideoTracks()[0] || null;
        setLocalVideoTrack(videoTrack);
        setCamOn(!!videoTrack);

        await supabase.from("study_session_users")
          .update({ camera_active: !!videoTrack }).eq("user_id", uid);

        /* 8. Connect to LiveKit if camera granted */
        if (videoTrack) await connectLiveKit(uid, displayName, stream);
      } catch {
        /* Camera denied — stay as avatar */
      }
    };

    boot();

    return () => {
      clearInterval(heartbeatTimer);
      clearInterval(pollTimer);
      lkRoomRef.current?.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── Connect to LiveKit room ─────────────────────────── */
  const connectLiveKit = async (uid: string, displayName: string, stream: MediaStream) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const res = await fetch("/api/livekit/token", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (!res.ok) {
        const err = await res.json();
        console.warn("[Hall] LiveKit token error:", err.error);
        return; // Fallback gracefully — user stays as avatar
      }

      const { token, url } = await res.json();

      const room = new Room({
        adaptiveStream: true,
        dynacast: true,
        videoCaptureDefaults: { resolution: { width: 640, height: 480, frameRate: 24 } },
      });

      room.on(RoomEvent.ParticipantConnected, updateLkParticipants);
      room.on(RoomEvent.ParticipantDisconnected, updateLkParticipants);
      room.on(RoomEvent.TrackSubscribed, updateLkParticipants);
      room.on(RoomEvent.TrackUnsubscribed, updateLkParticipants);

      await room.connect(url, token);

      /* Publish local tracks */
      const videoTrack = stream.getVideoTracks()[0];
      const audioTrack = stream.getAudioTracks()[0];
      if (videoTrack) await room.localParticipant.publishTrack(videoTrack);
      if (audioTrack) await room.localParticipant.publishTrack(audioTrack);

      lkRoomRef.current = room;
      updateLkParticipants();
    } catch (err) {
      console.warn("[Hall] LiveKit connect failed:", err);
      // Silently fail — user still shows as avatar card in DB
    }
  };

  const updateLkParticipants = useCallback(() => {
    if (!lkRoomRef.current) return;
    const map = new Map<string, Participant>();
    // Add local participant
    map.set(lkRoomRef.current.localParticipant.identity, lkRoomRef.current.localParticipant);
    // Add remote participants
    lkRoomRef.current.remoteParticipants.forEach((p) => {
      map.set(p.identity, p);
    });
    setLkParticipants(new Map(map));
  }, []);

  /* ── Toggle camera ─────────────────────────────────── */
  const toggleCam = useCallback(async () => {
    if (!localStreamRef.current) return;
    const track = localStreamRef.current.getVideoTracks()[0];
    if (!track) return;
    track.enabled = !track.enabled;
    setCamOn(track.enabled);
    if (myUserId) {
      await supabase.from("study_session_users")
        .update({ camera_active: track.enabled }).eq("user_id", myUserId);
    }
    const lkRoom = lkRoomRef.current;
    if (lkRoom) {
      // Use LiveKit's built-in camera enable/disable
      await lkRoom.localParticipant.setCameraEnabled(track.enabled).catch(() => {});
    }
  }, [myUserId]);

  /* ── Toggle mic ────────────────────────────────────── */
  const toggleMic = useCallback(async () => {
    if (!localStreamRef.current) return;
    const track = localStreamRef.current.getAudioTracks()[0];
    if (!track) return;
    track.enabled = !track.enabled;
    setMicOn(track.enabled);
  }, []);

  /* ── Encourage ─────────────────────────────────────── */
  const handleEncourage = useCallback(async (userId: string) => {
    setClapping(prev => ({ ...prev, [userId]: true }));
    try {
      await supabase.rpc("increment_claps", { target_user_id: userId });
    } catch {}
    setTimeout(() => setClapping(prev => ({ ...prev, [userId]: false })), 2000);
    toast("👏 Encouraged!");
  }, []);

  /* ── Save goal ─────────────────────────────────────── */
  const handleSaveGoal = useCallback(async () => {
    if (!mySessionId || !goalInput.trim()) return;
    setGoalBusy(true);
    await supabase.from("study_session_users")
      .update({ target_task: goalInput.trim() }).eq("id", mySessionId);
    setMyGoal(goalInput.trim());
    setShowGoalInput(false);
    setGoalBusy(false);
    toast.success("Goal set! 🎯");
  }, [mySessionId, goalInput]);

  /* ── Leave ─────────────────────────────────────────── */
  const handleLeave = useCallback(async () => {
    lkRoomRef.current?.disconnect();
    localStreamRef.current?.getTracks().forEach(t => t.stop());
    if (myUserId) {
      await supabase.from("study_session_users").delete().eq("user_id", myUserId);
    }
    router.push("/dashboard/study");
  }, [myUserId, router]);

  /* ── Build grid participants ──────────────────────── */
  const gridParticipants: HallParticipant[] = dbParticipants.map(p => ({
    userId:       p.user_id,
    displayName:  p.display_name,
    goal:         p.target_task,
    cameraActive: p.camera_active,
    clapsCount:   p.claps_count,
    isMe:         p.user_id === myUserId,
    lkParticipant: lkParticipants.get(p.user_id),
    localVideoTrack: p.user_id === myUserId ? localVideoTrack : undefined,
  }));

  /* ── Loading screen ──────────────────────────────── */
  if (loading) {
    return (
      <div className="fixed inset-0 bg-[#030712] flex flex-col items-center justify-center gap-4 z-[200]">
        <Loader2 className="w-10 h-10 text-indigo-400 animate-spin" />
        <p className="text-sm font-bold text-gray-500">Entering Study Hall...</p>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[200] bg-[#030712] flex flex-col overflow-hidden text-white">

      {/* ── HEADER ──────────────────────────────────── */}
      <header className="shrink-0 h-14 bg-[#080d1a]/80 border-b border-white/5
                         backdrop-blur-md flex items-center justify-between px-4 z-20">
        <div className="flex items-center gap-3">
          <button
            onClick={handleLeave}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <p className="text-xs font-black text-white">🏛️ Main Study Hall</p>
            <p className="text-[10px] text-gray-500 font-bold">Public · Open 24/7</p>
          </div>
        </div>

        {/* Live count */}
        <div className="flex items-center gap-1.5 bg-black/40 border border-white/10
                        rounded-xl px-3 py-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs font-black text-emerald-400">{totalCount.toLocaleString()}</span>
          <span className="text-[10px] text-gray-500 font-bold">studying now</span>
        </div>

        {/* LiveKit status */}
        <div className="text-[10px] font-bold">
          {lkRoomRef.current?.state === "connected" ? (
            <span className="text-emerald-400">📡 Live</span>
          ) : camOn ? (
            <span className="text-yellow-400">⏳ Connecting...</span>
          ) : (
            <span className="text-gray-600">🎭 Avatar Mode</span>
          )}
        </div>
      </header>

      {/* ── GRID ──────────────────────────────────────── */}
      <HallGrid
        participants={gridParticipants}
        clapping={clapping}
        onEncourage={handleEncourage}
        totalCount={totalCount}
      />

      {/* ── CONTROLS ─────────────────────────────────── */}
      <HallControls
        camOn={camOn}
        micOn={micOn}
        onToggleCam={toggleCam}
        onToggleMic={toggleMic}
        onSetGoal={() => { setGoalInput(myGoal); setShowGoalInput(true); }}
        onLeave={handleLeave}
        totalOnline={totalCount}
      />

      {/* ── GOAL MODAL ────────────────────────────────── */}
      {showGoalInput && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/80 p-4">
          <div className="bg-[#0a0f1e] border border-white/10 rounded-3xl w-full max-w-md p-7 space-y-5">
            <h3 className="text-lg font-black text-white flex items-center gap-2">
              🎯 What are you studying today?
            </h3>
            <input
              autoFocus
              type="text"
              value={goalInput}
              onChange={e => setGoalInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSaveGoal()}
              placeholder="e.g. SSC GK — Ancient History chapter"
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-2xl
                         text-sm text-white placeholder-gray-600 outline-none
                         focus:border-indigo-500 transition-colors"
            />
            <div className="flex gap-3">
              <button
                onClick={() => setShowGoalInput(false)}
                className="flex-1 py-3 bg-white/5 border border-white/10 text-gray-400
                           rounded-2xl font-black text-xs hover:bg-white/10 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveGoal}
                disabled={goalBusy || !goalInput.trim()}
                className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 text-white
                           rounded-2xl font-black text-xs transition-all
                           disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {goalBusy ? "Saving..." : "Set Goal 🎯"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
