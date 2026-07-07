"use client";

import React, { useEffect, useRef, useState, use } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import {
  ArrowLeft, ShieldAlert, LogOut, Users, Loader2,
  Target, Zap, Heart, AlertTriangle, Grid3x3
} from "lucide-react";
import toast from "react-hot-toast";

/* ─── Types ─── */
interface StudyRoom {
  id: string; name: string; category: string;
  theme_name: string; max_capacity: number;
  is_private?: boolean; join_code?: string;
}
interface Participant {
  id: string; user_id: string; display_name: string;
  target_task: string; camera_active: boolean; claps_count?: number;
}

/* ─── Helpers ─── */
const AVATAR_COLORS = [
  "#6366f1","#ec4899","#10b981","#f59e0b","#06b6d4","#8b5cf6",
  "#f43f5e","#84cc16","#14b8a6","#3b82f6",
];
const avatarColor  = (name: string) => AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];
const initials     = (name: string) => name.split(" ").slice(0,2).map(w=>w[0]).join("").toUpperCase();
const catLabel: Record<string,string> = {
  ssc:"SSC", upsc:"UPSC", railway:"Railway", banking:"Banking", general:"General"
};

/* ═══════════════════════════════════════════════════════════ */
export default function LiveStudyRoomPage({ params }: { params: Promise<{ roomId: string }> }) {
  const { roomId } = use(params);
  const router     = useRouter();
  const zegoRef    = useRef<HTMLDivElement>(null);
  const zpRef      = useRef<any>(null);

  const [loading,      setLoading]      = useState(true);
  const [room,         setRoom]         = useState<StudyRoom | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [mySessionId,  setMySessionId]  = useState<string | null>(null);
  const [myUserId,     setMyUserId]     = useState<string | null>(null);

  /* Goal modal */
  const [showGoal,  setShowGoal]  = useState(false);
  const [goalText,  setGoalText]  = useState("");
  const [goalBusy,  setGoalBusy]  = useState(false);

  /* Encourage */
  const [clapping, setClapping] = useState<Record<string,boolean>>({});

  /* Report modal */
  const [reportTarget, setReportTarget] = useState<Participant|null>(null);
  const [reportReason, setReportReason] = useState("");
  const [reportBusy,   setReportBusy]   = useState(false);

  /* View mode: "sidebar" = left sidebar list | "overlay" = fullscreen grid */
  const [viewMode, setViewMode] = useState<"sidebar"|"overlay">("overlay");

  /* ── boot ─────────────────────────────────────────────── */
  useEffect(() => {
    let tickInterval: any = null;

    const boot = async () => {
      /* 1. Auth */
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push("/login"); return; }
      setMyUserId(session.user.id);

      /* 2. Profile guard */
      const { data: profile } = await supabase
        .from("profiles").select("full_name").eq("id", session.user.id).single();
      if (!profile?.full_name) {
        router.push(`/profile-setup?redirect=/dashboard/study/${roomId}`); return;
      }
      const displayName = profile.full_name;

      /* 3. Room */
      const { data: roomData, error: roomErr } = await supabase
        .from("study_rooms").select("*").eq("id", roomId).single();
      if (roomErr || !roomData) { toast.error("Room not found."); router.push("/dashboard/study"); return; }
      setRoom(roomData);

      /* 4. Clear stale session row */
      await supabase.from("study_session_users").delete().eq("user_id", session.user.id);

      /* 5. Insert session row */
      const { data: sessRow, error: sessErr } = await supabase
        .from("study_session_users")
        .insert({ room_id: roomId, user_id: session.user.id, display_name: displayName, target_task: "", camera_active: true })
        .select().single();
      if (sessErr || !sessRow) { toast.error("Could not join room."); router.push("/dashboard/study"); return; }
      setMySessionId(sessRow.id);
      setLoading(false);

      /* 6. Show goal input */
      setShowGoal(true);

      /* 7. Init Zego */
      initZego(roomData, session.user.id, displayName);

      /* 8. Fetch participants */
      fetchParticipants();

      /* 9. Kick-check */
      tickInterval = setInterval(async () => {
        const { data } = await supabase
          .from("study_session_users").select("id").eq("user_id", session.user.id).single();
        if (!data) { toast.error("You were removed."); router.push("/dashboard/study"); }
      }, 15000);
    };

    boot().catch(err => { console.error(err); setLoading(false); toast.error("Failed to join."); });

    /* Realtime */
    const ch = supabase.channel(`room_${roomId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "study_session_users", filter: `room_id=eq.${roomId}` },
          () => fetchParticipants())
      .subscribe();

    return () => {
      clearInterval(tickInterval);
      supabase.removeChannel(ch);
      /* cleanup: remove session row & destroy Zego */
      supabase.from("study_session_users").delete().eq("user_id", myUserId || "").then(()=>{});
      zpRef.current?.destroy?.();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId]);

  /* ── Zego init ────────────────────────────────────────── */
  const initZego = async (roomData: StudyRoom, userId: string, userName: string) => {
    if (!zegoRef.current) return;
    const appID  = parseInt(process.env.NEXT_PUBLIC_ZEGO_APP_ID || "0");
    const secret = process.env.NEXT_PUBLIC_ZEGO_SERVER_SECRET || "";
    if (!appID || !secret) return;

    try {
      const { ZegoUIKitPrebuilt } = await import("@zegocloud/zego-uikit-prebuilt");
      const token = ZegoUIKitPrebuilt.generateKitTokenForTest(appID, secret, roomData.id, userId, userName);
      const zp    = ZegoUIKitPrebuilt.create(token);
      zpRef.current = zp;

      zp.joinRoom({
        container: zegoRef.current,
        scenario:  { mode: ZegoUIKitPrebuilt.GroupCall },

        /* ── Camera / Mic defaults ── */
        turnOnCameraWhenJoining:    true,
        turnOnMicrophoneWhenJoining: false,

        /* ── Hide ALL Zego chrome → we render our own overlay UI ── */
        showPreJoinView:            false,
        showLeaveRoomConfirmDialog: false,
        showScreenSharingButton:    false,
        showTextChat:               false,
        showUserList:               false,
        showRoomDetailsButton:      false,
        showAudioVideoSettingsButton: false,
        showMyMicrophoneToggleButton: false,

        /* keep only the camera toggle */
        showMyCameraToggleButton:   true,

        /* Grid layout — fills container */
        layout: "Grid",
        maxUsers: roomData.max_capacity || 20,


      });
    } catch (err) {
      console.error("Zego error:", err);
    }
  };

  /* ── Participants ─────────────────────────────────────── */
  const fetchParticipants = async () => {
    const { data } = await supabase
      .from("study_session_users").select("*")
      .eq("room_id", roomId).order("created_at", { ascending: true });
    if (data) setParticipants(data);
  };

  /* ── Save goal ─────────────────────────────────────────  */
  const saveGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    setGoalBusy(true);
    if (goalText.trim() && mySessionId) {
      await supabase.from("study_session_users")
        .update({ target_task: goalText.trim() }).eq("id", mySessionId);
      toast.success("Goal set! Stay focused 🎯");
      await fetchParticipants();
    }
    setShowGoal(false);
    setGoalBusy(false);
  };

  /* ── Encourage ─────────────────────────────────────────  */
  const encourage = async (p: Participant) => {
    if (p.user_id === myUserId) return;
    setClapping(prev => ({ ...prev, [p.user_id]: true }));
    setTimeout(() => setClapping(prev => ({ ...prev, [p.user_id]: false })), 900);
    await supabase.from("study_session_users")
      .update({ claps_count: (p.claps_count || 0) + 1 }).eq("id", p.id);
    fetchParticipants();
  };

  /* ── Report ─────────────────────────────────────────────  */
  const submitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportTarget || !reportReason.trim()) return;
    setReportBusy(true);
    try {
      await supabase.from("study_room_reports").insert({
        reporter_id: myUserId, reported_user_id: reportTarget.user_id,
        room_id: roomId, reason: reportReason.trim(),
      });
      toast.success("Report submitted.");
      setReportTarget(null); setReportReason("");
    } catch { toast.error("Report failed."); }
    finally { setReportBusy(false); }
  };

  /* ── Leave ─────────────────────────────────────────────  */
  const leave = async () => {
    if (myUserId) await supabase.from("study_session_users").delete().eq("user_id", myUserId);
    zpRef.current?.destroy?.();
    router.push("/dashboard/study");
  };

  /* ── Loading screen ─────────────────────────────────────  */
  if (loading) return (
    <div className="fixed inset-0 bg-[#030712] flex flex-col items-center justify-center gap-4">
      <Loader2 className="w-10 h-10 text-indigo-400 animate-spin" />
      <p className="text-sm font-bold text-gray-500">Joining study room...</p>
    </div>
  );

  const hasZego = !!(process.env.NEXT_PUBLIC_ZEGO_APP_ID && process.env.NEXT_PUBLIC_ZEGO_APP_ID !== "0");
  const others  = participants.filter(p => p.user_id !== myUserId);
  const me      = participants.find(p => p.user_id === myUserId);

  /* ═══════════════════════════════════════════════════════ */
  return (
    <div className="fixed inset-0 bg-[#030712] flex flex-col overflow-hidden">

      {/* ══ TOP BAR ══════════════════════════════════════ */}
      <header className="absolute top-0 left-0 right-0 z-30 h-14
                          bg-gradient-to-b from-black/70 to-transparent
                          flex items-center justify-between px-4 gap-3">

        {/* Left: back + room info */}
        <div className="flex items-center gap-3 min-w-0">
          <button onClick={() => router.push("/dashboard/study")}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all shrink-0">
            <ArrowLeft className="w-4 h-4" />
          </button>

          <div className="min-w-0 hidden sm:block">
            <p className="text-xs font-black text-white leading-none truncate">{room?.name}</p>
            <p className="text-[10px] text-gray-400 mt-0.5">
              {catLabel[room?.category || ""] || room?.category}
              {room?.is_private && room?.join_code && <> · Code: <span className="text-indigo-400 font-black">{room.join_code}</span></>}
            </p>
          </div>
        </div>

        {/* Center: live count */}
        <div className="flex items-center gap-1.5 bg-black/40 border border-white/10 rounded-xl px-3 py-1.5 shrink-0">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs font-black text-emerald-400">{participants.length}</span>
          <span className="text-[10px] text-gray-400 font-bold">live</span>
        </div>

        {/* Right: controls */}
        <div className="flex items-center gap-2 shrink-0">
          {/* View toggle */}
          <button
            onClick={() => setViewMode(v => v === "overlay" ? "sidebar" : "overlay")}
            title={viewMode === "overlay" ? "Show sidebar" : "Fullscreen grid"}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all">
            <Grid3x3 className="w-4 h-4" />
          </button>

          {/* Update goal */}
          <button onClick={() => setShowGoal(true)}
            className="hidden sm:flex items-center gap-1.5 px-3 py-2 bg-indigo-600/40 hover:bg-indigo-600/70
                       border border-indigo-500/40 text-indigo-200 rounded-xl text-[10px] font-black transition-all">
            <Target className="w-3.5 h-3.5" /> My Goal
          </button>

          {/* Report */}
          <button onClick={() => { if (others[0]) setReportTarget(others[0]); }}
            title="Report" className="p-2 rounded-xl bg-white/10 hover:bg-red-900/30 text-gray-400 hover:text-red-400 transition-all">
            <ShieldAlert className="w-4 h-4" />
          </button>

          {/* Exit */}
          <button onClick={leave}
            className="flex items-center gap-1.5 px-3 py-2 bg-red-600 hover:bg-red-700
                       text-white rounded-xl text-[10px] font-black transition-all">
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Exit</span>
          </button>
        </div>
      </header>

      {/* ══ MAIN AREA ════════════════════════════════════ */}
      <div className="flex-1 flex overflow-hidden">

        {/* ── Sidebar (when viewMode === "sidebar") ──────── */}
        {viewMode === "sidebar" && (
          <aside className="w-72 shrink-0 bg-[#080d1a] border-r border-white/5
                            flex flex-col overflow-hidden z-10 pt-14">
            <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between">
              <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-2">
                <Users className="w-3 h-3" /> Focus Buddies
              </span>
              <span className="text-[10px] text-emerald-400 font-black bg-emerald-400/10 px-2 py-0.5 rounded-full">
                {participants.length} live
              </span>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {participants.map(p => {
                const isMe   = p.user_id === myUserId;
                const isClap = clapping[p.user_id];
                return (
                  <div key={p.id} className={`relative rounded-2xl p-3 border ${isMe
                    ? "bg-indigo-900/20 border-indigo-500/20"
                    : "bg-[#0f172a] border-white/5"}`}>
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-black text-white shrink-0"
                        style={{ background: `linear-gradient(135deg, ${avatarColor(p.display_name)}, ${avatarColor(p.display_name+"x")})` }}>
                        {initials(p.display_name)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-black text-white truncate flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0"/>
                          {p.display_name} {isMe && <span className="text-indigo-400">(You)</span>}
                        </p>
                        <p className="text-[10px] text-gray-500 mt-0.5 truncate">
                          {p.target_task || <em>No goal set</em>}
                        </p>
                      </div>
                    </div>
                    {!isMe && (
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-[9px] text-gray-600">{p.claps_count || 0} 👏</span>
                        <button onClick={() => encourage(p)}
                          className={`flex items-center gap-1 px-3 py-1 rounded-lg text-[9px] font-black transition-all ${
                            isClap ? "bg-pink-500/30 text-pink-300 scale-110" : "bg-white/5 hover:bg-pink-500/20 text-gray-500 hover:text-pink-300"}`}>
                          <Heart className={`w-3 h-3 ${isClap ? "fill-pink-400" : ""}`}/> Encourage
                        </button>
                      </div>
                    )}
                    {isClap && <div className="absolute top-2 right-2 text-base animate-bounce pointer-events-none">👏</div>}
                  </div>
                );
              })}
            </div>
            <div className="p-3 border-t border-white/5">
              <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2">
                <span>🔇</span>
                <span className="text-[10px] text-red-300 font-bold">Mic is always off</span>
              </div>
            </div>
          </aside>
        )}

        {/* ── Zego Video Grid — FULL SCREEN ─────────────── */}
        <div className="flex-1 relative overflow-hidden">
          {/* Zego renders HERE — full size */}
          <div ref={zegoRef} className="absolute inset-0 w-full h-full pt-14" />

          {/* No Zego credentials → custom grid fallback */}
          {!hasZego && (
            <div className="absolute inset-0 pt-14 flex flex-col items-center justify-center bg-[#030712]">
              <div className="text-center max-w-md px-6 mb-8">
                <AlertTriangle className="w-10 h-10 text-amber-400 mx-auto mb-3"/>
                <h3 className="text-base font-black text-white mb-1">Live Camera Disabled</h3>
                <p className="text-xs text-gray-500">
                  Add <code className="text-indigo-400">NEXT_PUBLIC_ZEGO_APP_ID</code> and <code className="text-indigo-400">NEXT_PUBLIC_ZEGO_SERVER_SECRET</code> to Vercel env vars.
                </p>
              </div>

              {/* Fake grid for preview */}
              <div className="w-full px-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 max-w-5xl">
                {participants.map(p => {
                  const isMe   = p.user_id === myUserId;
                  const isClap = clapping[p.user_id];
                  return (
                    <div key={p.id} className="relative rounded-2xl overflow-hidden bg-[#111827] aspect-video border border-white/5 group">
                      {/* Avatar in center */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-14 h-14 rounded-2xl text-lg font-black text-white flex items-center justify-center"
                          style={{ background: avatarColor(p.display_name) }}>
                          {initials(p.display_name)}
                        </div>
                      </div>

                      {/* Bottom overlay — name + goal */}
                      <div className="absolute bottom-0 left-0 right-0 px-3 py-2
                                      bg-gradient-to-t from-black/90 to-transparent">
                        <p className="text-[10px] font-black text-white truncate leading-none flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0"/>
                          {p.display_name} {isMe && "(You)"}
                        </p>
                        {p.target_task && (
                          <p className="text-[9px] text-gray-400 truncate mt-0.5">📚 {p.target_task}</p>
                        )}
                      </div>

                      {/* Encourage button — top right, appears on hover */}
                      {!isMe && (
                        <button onClick={() => encourage(p)}
                          className={`absolute top-2 right-2 flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[9px] font-black transition-all opacity-0 group-hover:opacity-100 ${
                            isClap ? "bg-pink-500/60 text-white scale-110" : "bg-black/50 text-gray-300 hover:bg-pink-500/50 hover:text-white"}`}>
                          <Heart className={`w-3 h-3 ${isClap ? "fill-current" : ""}`} />
                          {p.claps_count || 0}
                        </button>
                      )}
                      {isClap && (
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-3xl animate-bounce pointer-events-none">👏</div>
                      )}
                    </div>
                  );
                })}

                {participants.length === 0 && (
                  <div className="col-span-full py-20 text-center">
                    <p className="text-sm text-gray-600 font-bold">You're alone right now.</p>
                    <p className="text-xs text-gray-700 mt-1">Share the room code to invite friends!</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── Participant overlay cards ON TOP of Zego video ── */}
          {/* Shown at bottom when in full-screen overlay mode */}
          {hasZego && viewMode === "overlay" && participants.length > 0 && (
            <div className="absolute bottom-20 left-0 right-0 z-10 px-4">
              <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth:"none" }}>
                {participants.map(p => {
                  const isMe   = p.user_id === myUserId;
                  const isClap = clapping[p.user_id];
                  return (
                    <div key={p.id}
                      className="shrink-0 flex items-center gap-2 bg-black/70 backdrop-blur-md
                                  border border-white/10 rounded-2xl px-3 py-2 relative group">
                      <div className="w-6 h-6 rounded-lg text-[9px] font-black text-white flex items-center justify-center shrink-0"
                        style={{ background: avatarColor(p.display_name) }}>
                        {initials(p.display_name)}
                      </div>
                      <div className="max-w-[110px]">
                        <p className="text-[10px] font-black text-white truncate leading-none">{p.display_name}</p>
                        {p.target_task && <p className="text-[8px] text-gray-400 truncate">{p.target_task}</p>}
                      </div>
                      {!isMe && (
                        <button onClick={() => encourage(p)}
                          className={`ml-1 p-1 rounded-lg transition-all ${isClap ? "text-pink-400 scale-125" : "text-gray-500 hover:text-pink-400"}`}>
                          <Heart className={`w-3 h-3 ${isClap ? "fill-pink-400" : ""}`}/>
                        </button>
                      )}
                      {isClap && <div className="absolute -top-5 right-0 text-base animate-bounce pointer-events-none">👏</div>}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ══ GOAL MODAL ═══════════════════════════════════ */}
      {showGoal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <form onSubmit={saveGoal}
            className="bg-[#0a0f1e] border border-white/10 rounded-3xl shadow-2xl w-full max-w-md p-8 space-y-6">
            <div className="text-center">
              <div className="w-14 h-14 bg-indigo-500/20 text-indigo-400 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Target className="w-7 h-7" />
              </div>
              <h2 className="text-2xl font-black text-white">Aaj kya padh rahe ho?</h2>
              <p className="text-sm text-gray-500 mt-1">Apna goal set karo — sabko dikhai dega 👀</p>
            </div>

            {/* Suggestion chips */}
            <div className="flex flex-wrap gap-2">
              {["SSC Math Practice","UPSC Revision","Locked in 🔒","Railway GK","English Vocab","Physics MCQs"].map(s => (
                <button key={s} type="button" onClick={() => setGoalText(s)}
                  className={`text-[10px] font-black px-3 py-1.5 rounded-xl border transition-all ${
                    goalText === s ? "bg-indigo-600 text-white border-indigo-500"
                                  : "bg-white/5 text-gray-400 border-white/10 hover:text-white"}`}>
                  {s}
                </button>
              ))}
            </div>

            <input type="text" value={goalText} onChange={e => setGoalText(e.target.value)}
              placeholder="e.g. SSC CGL Maths practice..." maxLength={60}
              className="w-full px-4 py-3.5 bg-white/5 border border-white/10 rounded-2xl text-sm font-bold
                         text-white placeholder-gray-600 outline-none focus:border-indigo-500"/>

            <div className="flex gap-3">
              <button type="button" onClick={() => setShowGoal(false)}
                className="flex-1 py-3 bg-white/5 border border-white/10 text-gray-400 rounded-2xl font-bold text-sm hover:bg-white/10 transition-all">
                Skip
              </button>
              <button type="submit" disabled={goalBusy}
                className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black text-sm transition-all flex items-center justify-center gap-2">
                {goalBusy ? <Loader2 className="w-4 h-4 animate-spin"/> : <Zap className="w-4 h-4"/>}
                Start Studying
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ══ REPORT MODAL ════════════════════════════════ */}
      {reportTarget && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4">
          <form onSubmit={submitReport}
            className="bg-[#0a0f1e] border border-white/10 rounded-3xl w-full max-w-md p-7 space-y-5">
            {/* Participant selector */}
            <div>
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-red-400"/> Report Student
              </h3>
              <div className="mt-3">
                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1.5">Who?</label>
                <select value={reportTarget.user_id}
                  onChange={e => setReportTarget(others.find(p => p.user_id === e.target.value) || null)}
                  className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm font-bold text-white outline-none">
                  {others.map(p => <option key={p.user_id} value={p.user_id}>{p.display_name}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1.5">Reason</label>
              <textarea required rows={3} value={reportReason} onChange={e => setReportReason(e.target.value)}
                placeholder="Describe what you saw..."
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-sm font-bold
                           text-white placeholder-gray-600 outline-none focus:border-red-500 resize-none"/>
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={() => { setReportTarget(null); setReportReason(""); }}
                className="flex-1 py-3 bg-white/5 border border-white/10 text-gray-400 rounded-2xl font-bold text-sm hover:bg-white/10 transition-all">
                Cancel
              </button>
              <button type="submit" disabled={reportBusy}
                className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white rounded-2xl font-black text-sm transition-all flex items-center justify-center gap-2">
                {reportBusy ? <Loader2 className="w-4 h-4 animate-spin"/> : "Submit"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
