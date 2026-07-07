"use client";

import React, { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { ArrowLeft, ShieldAlert, Users, Loader2, Heart, MicOff } from "lucide-react";
import toast from "react-hot-toast";

/* hooks */
import { useWebRTC } from "./hooks/useWebRTC";
import { useSignaling } from "./hooks/useSignaling";

/* components */
import VideoGrid, { GridParticipant } from "./components/VideoGrid";
import ControlBar from "./components/ControlBar";
import GoalModal from "./components/GoalModal";

interface StudyRoom {
  id: string;
  name: string;
  category: string;
  theme_name: string;
  max_capacity: number;
  is_private?: boolean;
  join_code?: string;
}

interface Participant {
  id: string;
  user_id: string;
  display_name: string;
  target_task: string;
  camera_active: boolean;
  claps_count?: number;
}

const AVATAR_COLORS = [
  "#6366f1", "#ec4899", "#10b981", "#f59e0b",
  "#06b6d4", "#8b5cf6", "#f43f5e", "#14b8a6"
];
const avatarColor = (name: string) => AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];
const initials = (name: string) => name.split(" ").slice(0, 2).map((w: string) => w[0]).join("").toUpperCase();

const CAT_LABEL: Record<string, string> = {
  ssc: "SSC", upsc: "UPSC", railway: "Railway",
  banking: "Banking", general: "General"
};

export default function LiveStudyRoomPage({ params }: { params: Promise<{ roomId: string }> }) {
  const { roomId } = use(params);
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [room, setRoom] = useState<StudyRoom | null>(null);
  const [myUserId, setMyUserId] = useState<string | null>(null);
  const [myName, setMyName] = useState<string>("");
  const [mySessionId, setMySessionId] = useState<string | null>(null);

  /* DB participants */
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [clapping, setClapping] = useState<Record<string, boolean>>({});

  /* Modals */
  const [showGoal, setShowGoal] = useState(false);
  const [goalBusy, setGoalBusy] = useState(false);
  const [reportTarget, setReportTarget] = useState<Participant | null>(null);
  const [reportReason, setReportReason] = useState("");
  const [reportBusy, setReportBusy] = useState(false);

  /* Layout toggles */
  const [showSidebar, setShowSidebar] = useState(false);

  /* WebRTC Hooks */
  const rtc = useWebRTC(myUserId);
  const signaling = useSignaling(roomId);

  /* ── 1. Boot Room ──────────────────────────────────────── */
  useEffect(() => {
    let kickInterval: any = null;

    const boot = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push("/login");
        return;
      }
      const uid = session.user.id;
      setMyUserId(uid);

      // Verify Profile details completed
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", uid)
        .single();

      if (!profile?.full_name) {
        router.push(`/profile-setup?redirect=/dashboard/study/${roomId}`);
        return;
      }
      const displayName = profile.full_name;
      setMyName(displayName);

      // Verify Study Room exists
      const { data: roomData, error: roomErr } = await supabase
        .from("study_rooms")
        .select("*")
        .eq("id", roomId)
        .single();

      if (roomErr || !roomData) {
        toast.error("Study room not found.");
        router.push("/dashboard/study");
        return;
      }
      setRoom(roomData);

      // 1. Get user camera stream (with 4-second timeout to prevent permission prompt hangs)
      let stream = null;
      try {
        stream = await Promise.race([
          rtc.initCamera(),
          new Promise<null>((resolve) => setTimeout(() => resolve(null), 4000))
        ]);
      } catch (err) {
        console.error("Camera init error:", err);
      }

      // 2. Clear out any previous stale session row
      await supabase.from("study_session_users").delete().eq("user_id", uid);

      // 3. Register user inside DB session
      const { data: sessRow, error: sessErr } = await supabase
        .from("study_session_users")
        .insert({
          room_id: roomId,
          user_id: uid,
          display_name: displayName,
          target_task: "",
          camera_active: !!stream,
        })
        .select()
        .single();

      if (sessErr || !sessRow) {
        toast.error("Could not enter the study room.");
        router.push("/dashboard/study");
        return;
      }
      setMySessionId(sessRow.id);
      setLoading(false);

      // Trigger goal prompt modal
      setShowGoal(true);

      // 4. Fetch list of users inside this room
      await fetchParticipants();

      // 5. Setup WebRTC signaling handlers
      await signaling.subscribe({
        onPeerJoined: async (payload) => {
          // A new user has entered the room. WE will act as initiator
          if (payload.userId !== uid) {
            await rtc.createPeer(
              payload.userId,
              payload.displayName,
              true, // initiator
              stream,
              (signalData) => {
                signaling.sendSignal({
                  to: payload.userId,
                  from: uid,
                  fromName: displayName,
                  signal: signalData,
                });
              }
            );
          }
        },
        onPeerLeft: (payload) => {
          rtc.destroyPeer(payload.userId);
        },
        onSignal: async (payload) => {
          if (payload.to !== uid) return;
          // We got signal (offer/answer/candidate) from another peer
          let peer = rtc.peersRef.current.get(payload.from);
          if (!peer) {
            // If peer connection doesn't exist, create it (we are NOT initiator)
            peer = await rtc.createPeer(
              payload.from,
              payload.fromName,
              false, // not initiator
              stream,
              (signalData) => {
                signaling.sendSignal({
                  to: payload.from,
                  from: uid,
                  fromName: displayName,
                  signal: signalData,
                });
              }
            );
          }
          rtc.signalPeer(payload.from, payload.signal);
        },
        onSubscribed: () => {
          // Broadcast our presence to existing room members
          signaling.announceJoin(uid, displayName);
        },
      });

      // 6. Admin kick validation timer check
      kickInterval = setInterval(async () => {
        const { data: activeCheck } = await supabase
          .from("study_session_users")
          .select("id")
          .eq("user_id", uid)
          .single();
        if (!activeCheck) {
          toast.error("Disconnected from the study room.");
          exitRoom();
        }
      }, 15000);
    };

    boot();

    // Subscribe to DB session participant updates
    const dbChannel = supabase
      .channel(`db_room_sync_${roomId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "study_session_users",
          filter: `room_id=eq.${roomId}`,
        },
        () => {
          fetchParticipants();
        }
      )
      .subscribe();

    return () => {
      clearInterval(kickInterval);
      supabase.removeChannel(dbChannel);
      signaling.cleanup();
      rtc.cleanup();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId]);

  /* ── 2. Sync participants from Postgres DB ────────────────── */
  const fetchParticipants = async () => {
    const { data } = await supabase
      .from("study_session_users")
      .select("*")
      .eq("room_id", roomId)
      .order("joined_at", { ascending: true });
    if (data) setParticipants(data);
  };

  /* ── 3. Save Goal trigger ─────────────────────────────────── */
  const handleSaveGoal = async (newGoal: string) => {
    if (!mySessionId) return;
    setGoalBusy(true);
    try {
      await supabase
        .from("study_session_users")
        .update({ target_task: newGoal })
        .eq("id", mySessionId);
      toast.success("Goal set! Let's lock in 🎯");
      await fetchParticipants();
    } catch {
      toast.error("Failed to update goal.");
    } finally {
      setGoalBusy(false);
      setShowGoal(false);
    }
  };

  /* ── 4. Encourage / Clap trigger ─────────────────────────── */
  const handleEncourage = async (targetUserId: string) => {
    if (targetUserId === myUserId) return;
    const participant = participants.find((p) => p.user_id === targetUserId);
    if (!participant) return;

    // Local animated reaction chime trigger
    setClapping((prev) => ({ ...prev, [targetUserId]: true }));
    setTimeout(() => {
      setClapping((prev) => ({ ...prev, [targetUserId]: false }));
    }, 1000);

    // Sync database claps update
    try {
      await supabase
        .from("study_session_users")
        .update({ claps_count: (participant.claps_count || 0) + 1 })
        .eq("id", participant.id);
      await fetchParticipants();
    } catch {}
  };

  /* ── 5. Exit room handler ────────────────────────────────── */
  const exitRoom = async () => {
    setLoading(true);
    if (myUserId) {
      await signaling.announceLeave(myUserId);
      await supabase.from("study_session_users").delete().eq("user_id", myUserId);
    }
    signaling.cleanup();
    rtc.cleanup();
    router.push("/dashboard/study");
  };

  /* ── 6. Report handler ───────────────────────────────────── */
  const submitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportTarget || !reportReason.trim()) return;
    setReportBusy(true);
    try {
      await supabase.from("study_room_reports").insert({
        reporter_id: myUserId,
        reported_user_id: reportTarget.user_id,
        room_id: roomId,
        reason: reportReason.trim(),
      });
      toast.success("Report submitted. Thank you.");
      setReportTarget(null);
      setReportReason("");
    } catch {
      toast.error("Report submission failed.");
    } finally {
      setReportBusy(false);
    }
  };

  /* ── 7. Render Loading Screen ────────────────────────────── */
  if (loading) {
    return (
      <div className="fixed inset-0 bg-[#030712] flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-10 h-10 text-indigo-400 animate-spin" />
        <p className="text-sm font-bold text-gray-500">Entering study room...</p>
        <p className="text-xs text-gray-700">Requesting camera permissions</p>
      </div>
    );
  }

  /* ── 8. Render Main Room ─────────────────────────────────── */
  const myParticipant = participants.find((p) => p.user_id === myUserId);
  const others = participants.filter((p) => p.user_id !== myUserId);

  /* Build participant list format for the grid helper */
  const gridParticipants: GridParticipant[] = [
    // My own tile
    {
      userId: myUserId || "me",
      name: myName,
      goal: myParticipant?.target_task,
      stream: rtc.localStream,
      isMe: true,
      camOn: rtc.camOn,
    },
    // Other peer tiles
    ...participants
      .filter((p) => p.user_id !== myUserId)
      .map((p) => {
        const peerEntry = rtc.remotePeers.get(p.user_id);
        return {
          userId: p.user_id,
          name: p.display_name,
          goal: p.target_task,
          stream: peerEntry?.stream ?? null,
          isMe: false,
          camOn: p.camera_active,
          clapsCount: p.claps_count,
        };
      }),
  ];

  return (
    <div className="fixed inset-0 bg-[#030712] flex flex-col overflow-hidden text-white">
      {/* ── HEADER ───────────────────────────────────────────── */}
      <header className="shrink-0 h-14 bg-[#080d1a]/80 border-b border-white/5 backdrop-blur-md flex items-center justify-between px-4 z-20">
        {/* Left */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={exitRoom}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white transition-all shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="hidden sm:block min-w-0">
            <p className="text-xs font-black text-white truncate">{room?.name}</p>
            <p className="text-[10px] text-gray-500 font-bold">
              {CAT_LABEL[room?.category || ""] || room?.category}
              {room?.is_private && room?.join_code && (
                <>
                  {" · "}
                  <span className="text-indigo-400 font-black">Code: {room.join_code}</span>
                </>
              )}
            </p>
          </div>
        </div>

        {/* Center: Live indicator */}
        <div className="flex items-center gap-1.5 bg-black/40 border border-white/10 rounded-xl px-3 py-1.5 shrink-0">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs font-black text-emerald-400">{participants.length}</span>
          <span className="text-[10px] text-gray-500 font-bold">studying</span>
        </div>

        {/* Right Info header actions */}
        <div className="flex items-center gap-2">
          {others.length > 0 && (
            <button
              onClick={() => setReportTarget(others[0])}
              title="Report Stream"
              className="p-2 rounded-xl bg-white/5 hover:bg-red-950/20 text-gray-500 hover:text-red-400 transition-all"
            >
              <ShieldAlert className="w-4 h-4" />
            </button>
          )}
        </div>
      </header>

      {/* ── MAIN WORKSPACE ───────────────────────────────────── */}
      <div className="flex-1 flex overflow-hidden">
        {/* Responsive video grid */}
        <VideoGrid
          participants={gridParticipants}
          clapping={clapping}
          onEncourage={handleEncourage}
          myUserId={myUserId}
        />

        {/* Left/Right Buddies list drawer */}
        {showSidebar && (
          <aside className="w-72 shrink-0 bg-[#080d1a] border-l border-white/5 flex flex-col overflow-hidden z-10 animate-in slide-in-from-right duration-250">
            <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between">
              <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-2">
                <Users className="w-3.5 h-3.5" /> Room Buddies
              </span>
              <span className="text-[10px] text-emerald-400 font-black bg-emerald-400/10 px-2 py-0.5 rounded-full">
                {participants.length} online
              </span>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {participants.map((p) => {
                const isMe = p.user_id === myUserId;
                const isClap = clapping[p.user_id];
                return (
                  <div
                    key={p.id}
                    className={`relative rounded-2xl p-3 border transition-all ${
                      isMe
                        ? "bg-indigo-900/20 border-indigo-500/20"
                        : "bg-[#0f172a] border-white/5"
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      <div
                        className="w-8 h-8 rounded-xl flex items-center justify-center text-[10px] font-black text-white shrink-0"
                        style={{ background: avatarColor(p.display_name) }}
                      >
                        {initials(p.display_name)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-black text-white truncate flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                          {p.display_name}
                          {isMe && <span className="text-[9px] text-indigo-400 font-bold">(You)</span>}
                        </p>
                        <p className="text-[9px] text-gray-500 truncate mt-0.5">
                          {p.target_task || <em className="not-italic text-gray-700">No goal set</em>}
                        </p>
                      </div>
                    </div>

                    {!isMe && (
                      <div className="flex items-center justify-between mt-2.5 pt-2.5 border-t border-white/5">
                        <span className="text-[9px] text-gray-600 font-bold">
                          {p.claps_count || 0} claps
                        </span>
                        <button
                          onClick={() => handleEncourage(p.user_id)}
                          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[9px] font-black transition-all ${
                            isClap
                              ? "bg-pink-500/30 text-pink-300 scale-110"
                              : "bg-white/5 hover:bg-pink-500/20 text-gray-500 hover:text-pink-300"
                          }`}
                        >
                          <Heart className={`w-3 h-3 ${isClap ? "fill-pink-400" : ""}`} /> Encourage
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="p-3 border-t border-white/5">
              <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2">
                <MicOff className="w-3.5 h-3.5 text-red-400" />
                <span className="text-[9px] text-red-300 font-bold leading-tight">
                  Microphone is muted by default. Toggle in control bar.
                </span>
              </div>
            </div>
          </aside>
        )}
      </div>

      {/* ── CONTROL BAR (Zoom style bottom bar) ─────────────── */}
      <ControlBar
        camOn={rtc.camOn}
        micOn={rtc.micOn}
        onToggleCam={rtc.toggleCam}
        onToggleMic={rtc.toggleMic}
        showSidebar={showSidebar}
        onToggleSidebar={() => setShowSidebar(!showSidebar)}
        onUpdateGoal={() => setShowGoal(true)}
        onExit={exitRoom}
        participantCount={participants.length}
      />

      {/* ── GOAL DIALOG MODAL ────────────────────────────────── */}
      {showGoal && (
        <GoalModal
          initialGoal={myParticipant?.target_task || ""}
          onSave={handleSaveGoal}
          onClose={() => setShowGoal(false)}
          isBusy={goalBusy}
        />
      )}

      {/* ── REPORT DIALOG MODAL ──────────────────────────────── */}
      {reportTarget && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <form
            onSubmit={submitReport}
            className="bg-[#0a0f1e] border border-white/10 rounded-3xl w-full max-w-md p-7 space-y-5"
          >
            <h3 className="text-lg font-black text-white flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-red-400" /> Report Student
            </h3>
            <div>
              <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1.5">Who?</label>
              <select
                value={reportTarget.user_id}
                onChange={(e) => setReportTarget(others.find((p) => p.user_id === e.target.value) || null)}
                className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm font-bold text-white outline-none"
              >
                {others.map((p) => (
                  <option key={p.user_id} value={p.user_id}>
                    {p.display_name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1.5">Reason</label>
              <textarea
                required
                rows={3}
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
                placeholder="Describe what you observed..."
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-sm font-bold text-white placeholder-gray-600 outline-none focus:border-red-500 resize-none"
              />
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setReportTarget(null);
                  setReportReason("");
                }}
                className="flex-1 py-3.5 bg-white/5 border border-white/10 text-gray-400 rounded-2xl font-black text-xs hover:bg-white/10 transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={reportBusy}
                className="flex-1 py-3.5 bg-red-600 hover:bg-red-700 text-white rounded-2xl font-black text-xs transition-all flex items-center justify-center gap-2"
              >
                {reportBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : "Submit Report"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
