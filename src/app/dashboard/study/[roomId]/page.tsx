"use client";

import React, { useEffect, useRef, useState, use } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import {
  ArrowLeft, ShieldAlert, LogOut, Users, Loader2,
  AlertTriangle, Heart, Target, CheckCircle2, Zap
} from "lucide-react";
import toast from "react-hot-toast";

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

const CATEGORY_COLORS: Record<string, string> = {
  ssc: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  upsc: "bg-purple-500/20 text-purple-300 border-purple-500/30",
  railway: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
  banking: "bg-green-500/20 text-green-300 border-green-500/30",
  general: "bg-indigo-500/20 text-indigo-300 border-indigo-500/30",
};

const AVATAR_COLORS = [
  "from-indigo-500 to-purple-600",
  "from-pink-500 to-rose-600",
  "from-emerald-500 to-teal-600",
  "from-amber-500 to-orange-600",
  "from-cyan-500 to-blue-600",
  "from-violet-500 to-purple-600",
];

function getAvatarColor(name: string) {
  const idx = name.charCodeAt(0) % AVATAR_COLORS.length;
  return AVATAR_COLORS[idx];
}

function getInitials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

export default function LiveStudyRoomPage({ params }: { params: Promise<{ roomId: string }> }) {
  const unwrappedParams = use(params);
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);

  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [room, setRoom] = useState<StudyRoom | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [mySessionId, setMySessionId] = useState<string | null>(null);
  const [myUserId, setMyUserId] = useState<string | null>(null);

  // Goal modal state
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [goalInput, setGoalInput] = useState("");
  const [savingGoal, setSavingGoal] = useState(false);

  // Moderation state
  const [showReportModal, setShowReportModal] = useState(false);
  const [flaggedUser, setFlaggedUser] = useState<Participant | null>(null);
  const [flagReason, setFlagReason] = useState("");
  const [reporting, setReporting] = useState(false);

  // Clapping state
  const [clapAnimations, setClapAnimations] = useState<Record<string, boolean>>({});

  // Zego ref
  const zpRef = useRef<any>(null);

  useEffect(() => {
    let checkSessionInterval: any = null;

    const setupRoom = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          toast.error("Please login to join the study session.");
          router.push("/login");
          return;
        }
        setUser(session.user);
        setMyUserId(session.user.id);

        // 1. Fetch Room
        const { data: roomData, error: roomError } = await supabase
          .from("study_rooms")
          .select("*")
          .eq("id", unwrappedParams.roomId)
          .single();

        if (roomError || !roomData) {
          toast.error("Study room not found.");
          router.push("/dashboard/study");
          return;
        }
        setRoom(roomData);

        // 2. Fetch Profile
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("id", session.user.id)
          .single();

        if (!profile?.full_name) {
          router.push("/profile-setup?redirect=/dashboard/study/" + unwrappedParams.roomId);
          return;
        }

        const nameDisplay = profile.full_name;

        // 3. Clear old session
        await supabase
          .from("study_session_users")
          .delete()
          .eq("user_id", session.user.id);

        // 4. Register in session with empty goal first
        const { data: sessionData, error: sessionError } = await supabase
          .from("study_session_users")
          .insert({
            room_id: unwrappedParams.roomId,
            user_id: session.user.id,
            display_name: nameDisplay,
            target_task: "",
            camera_active: true,
          })
          .select()
          .single();

        if (sessionError) {
          toast.error("Could not join study room. Please try again.");
          router.push("/dashboard/study");
          return;
        }

        setMySessionId(sessionData.id);
        setLoading(false);

        // 5. Show goal modal immediately
        setShowGoalModal(true);

        // 6. Init Zego
        await initZego(roomData, session.user.id, nameDisplay);

        // 7. Fetch initial participants
        await fetchParticipants();

        // 8. Check if admin kicked out
        checkSessionInterval = setInterval(async () => {
          const { data: sessCheck } = await supabase
            .from("study_session_users")
            .select("id")
            .eq("user_id", session.user.id)
            .single();
          if (!sessCheck) {
            toast.error("You have been disconnected by moderation.");
            router.push("/dashboard/study");
          }
        }, 15000);

      } catch (err) {
        console.error("Room setup error:", err);
        setLoading(false);
        toast.error("Failed to join room. Please retry.");
      }
    };

    setupRoom();

    const channel = supabase
      .channel(`study_room_${unwrappedParams.roomId}`)
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "study_session_users",
        filter: `room_id=eq.${unwrappedParams.roomId}`,
      }, () => {
        fetchParticipants();
      })
      .subscribe();

    return () => {
      clearInterval(checkSessionInterval);
      supabase.removeChannel(channel);
      if (myUserId) {
        supabase
          .from("study_session_users")
          .delete()
          .eq("user_id", myUserId)
          .then(() => null);
      }
      if (zpRef.current) {
        zpRef.current.destroy();
      }
    };
  }, [unwrappedParams.roomId]);

  const fetchParticipants = async () => {
    const { data } = await supabase
      .from("study_session_users")
      .select("*")
      .eq("room_id", unwrappedParams.roomId)
      .order("created_at", { ascending: true });
    if (data) setParticipants(data);
  };

  const initZego = async (roomData: StudyRoom, userId: string, userName: string) => {
    if (!containerRef.current) return;
    const appID = parseInt(process.env.NEXT_PUBLIC_ZEGO_APP_ID || "0");
    const serverSecret = process.env.NEXT_PUBLIC_ZEGO_SERVER_SECRET || "";
    if (!appID || !serverSecret) return;

    try {
      const { ZegoUIKitPrebuilt } = await import("@zegocloud/zego-uikit-prebuilt");
      const kitToken = ZegoUIKitPrebuilt.generateKitTokenForTest(
        appID,
        serverSecret,
        roomData.id,
        userId,
        userName
      );
      const zp = ZegoUIKitPrebuilt.create(kitToken);
      zpRef.current = zp;
      zp.joinRoom({
        container: containerRef.current,
        scenario: { mode: ZegoUIKitPrebuilt.GroupCall },
        showScreenSharingButton: false,
        showUserList: false,
        showRoomDetailsButton: false,
        showTextChat: false,
        showLeaveRoomConfirmDialog: false,
        turnOnMicrophoneWhenJoining: false,
        turnOnCameraWhenJoining: true,
        showMyCameraToggleButton: true,
        showAudioVideoSettingsButton: false,
        layout: "Grid",
        maxUsers: roomData.max_capacity || 20,
      });
    } catch (err) {
      console.error("Zego init error:", err);
    }
  };

  const saveGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!goalInput.trim() || !mySessionId) {
      setShowGoalModal(false);
      return;
    }
    setSavingGoal(true);
    try {
      await supabase
        .from("study_session_users")
        .update({ target_task: goalInput.trim() })
        .eq("id", mySessionId);
      setShowGoalModal(false);
      toast.success("Goal saved! Now focus 🎯");
      await fetchParticipants();
    } catch {
      setShowGoalModal(false);
    } finally {
      setSavingGoal(false);
    }
  };

  const handleClap = async (participant: Participant) => {
    if (participant.user_id === myUserId) return;
    // Show animation
    setClapAnimations(prev => ({ ...prev, [participant.user_id]: true }));
    setTimeout(() => {
      setClapAnimations(prev => ({ ...prev, [participant.user_id]: false }));
    }, 1000);
    // Update claps in DB
    await supabase
      .from("study_session_users")
      .update({ claps_count: (participant.claps_count || 0) + 1 })
      .eq("id", participant.id);
    await fetchParticipants();
  };

  const handleLeaveRoom = async () => {
    if (myUserId) {
      await supabase.from("study_session_users").delete().eq("user_id", myUserId);
    }
    if (zpRef.current) zpRef.current.destroy();
    router.push("/dashboard/study");
  };

  const triggerReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!flaggedUser || !flagReason.trim()) return;
    setReporting(true);
    try {
      await supabase.from("study_room_reports").insert({
        reporter_id: myUserId,
        reported_user_id: flaggedUser.user_id,
        room_id: unwrappedParams.roomId,
        reason: flagReason.trim(),
      });
      toast.success("Report submitted. Our team will review.");
      setShowReportModal(false);
      setFlagReason("");
      setFlaggedUser(null);
    } catch {
      toast.error("Report failed. Try again.");
    } finally {
      setReporting(false);
    }
  };

  const hasZegoCredentials =
    process.env.NEXT_PUBLIC_ZEGO_APP_ID &&
    process.env.NEXT_PUBLIC_ZEGO_APP_ID !== "0";

  if (loading) {
    return (
      <div className="min-h-screen bg-[#030712] flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-10 h-10 animate-spin text-indigo-400 mx-auto" />
          <p className="text-sm font-bold text-gray-400">Joining study room...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#030712] flex flex-col text-white overflow-hidden">
      {/* ── TOP HEADER ───────────────────────────── */}
      <header className="shrink-0 h-14 bg-[#0a0f1e] border-b border-white/5 flex items-center justify-between px-4 gap-4 z-20">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={handleLeaveRoom}
            className="p-2 rounded-xl hover:bg-white/5 text-gray-400 hover:text-white transition-all shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-black text-white truncate">{room?.name}</span>
              {room?.category && (
                <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${CATEGORY_COLORS[room.category] || CATEGORY_COLORS.general}`}>
                  {room.category}
                </span>
              )}
              {room?.is_private && room?.join_code && (
                <span className="text-[9px] bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded-full font-black">
                  Code: {room.join_code}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Live count */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs font-black text-emerald-400">{participants.length} Live</span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setShowGoalModal(true)}
            className="hidden sm:flex items-center gap-1.5 py-2 px-3 bg-indigo-600/20 hover:bg-indigo-600/40 border border-indigo-500/30 text-indigo-300 rounded-xl text-xs font-black transition-all"
          >
            <Target className="w-3.5 h-3.5" /> Update Goal
          </button>
          <button
            onClick={() => {
              const others = participants.filter(p => p.user_id !== myUserId);
              if (others.length === 0) {
                toast("You're alone right now! Others will join soon 🙏");
              } else {
                setFlaggedUser(others[0]);
                setShowReportModal(true);
              }
            }}
            className="p-2 rounded-xl hover:bg-red-900/20 text-gray-500 hover:text-red-400 transition-all"
            title="Report Stream"
          >
            <ShieldAlert className="w-4 h-4" />
          </button>
          <button
            onClick={handleLeaveRoom}
            className="py-2 px-3 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-black transition-all flex items-center gap-1.5"
          >
            <LogOut className="w-3.5 h-3.5" /> Exit
          </button>
        </div>
      </header>

      {/* ── MAIN BODY ────────────────────────────── */}
      <div className="flex-1 flex overflow-hidden">

        {/* ── LEFT SIDEBAR: Participant Cards ─────── */}
        <aside className="w-72 shrink-0 bg-[#080d1a] border-r border-white/5 flex flex-col overflow-hidden">
          {/* Sidebar header */}
          <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between">
            <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-2">
              <Users className="w-3.5 h-3.5" /> Focus Buddies
            </span>
            <span className="text-[10px] font-black text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-full">
              {participants.length} online
            </span>
          </div>

          {/* Participant list */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {participants.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-xs text-gray-600 font-bold">No one else here yet.</p>
                <p className="text-[10px] text-gray-700 mt-1">Share the room to invite friends!</p>
              </div>
            ) : (
              participants.map((p) => {
                const isMe = p.user_id === myUserId;
                const avatarColor = getAvatarColor(p.display_name);
                const isClapping = clapAnimations[p.user_id];

                return (
                  <div
                    key={p.id}
                    className={`relative rounded-2xl p-3 border transition-all ${isMe
                        ? "bg-indigo-900/20 border-indigo-500/20"
                        : "bg-[#0f172a] border-white/5 hover:border-white/10"
                      }`}
                  >
                    <div className="flex items-start gap-3">
                      {/* Avatar */}
                      <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${avatarColor} flex items-center justify-center text-xs font-black text-white shrink-0`}>
                        {getInitials(p.display_name)}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                          <span className="text-xs font-black text-white truncate">
                            {p.display_name} {isMe && <span className="text-indigo-400">(You)</span>}
                          </span>
                        </div>

                        {p.target_task ? (
                          <p className="text-[10px] text-gray-400 mt-0.5 leading-tight truncate font-medium">
                            📚 {p.target_task}
                          </p>
                        ) : (
                          <p className="text-[10px] text-gray-600 mt-0.5 italic">Setting goal...</p>
                        )}
                      </div>
                    </div>

                    {/* Encourage button */}
                    {!isMe && (
                      <div className="flex items-center justify-between mt-2.5">
                        <span className="text-[9px] text-gray-600 font-bold">
                          {p.claps_count || 0} encouragements
                        </span>
                        <button
                          onClick={() => handleClap(p)}
                          className={`flex items-center gap-1 py-1.5 px-3 rounded-xl text-[10px] font-black transition-all ${isClapping
                              ? "bg-pink-500/30 text-pink-300 scale-110"
                              : "bg-white/5 hover:bg-pink-500/20 text-gray-400 hover:text-pink-300"
                            }`}
                        >
                          <Heart className={`w-3 h-3 ${isClapping ? "fill-pink-400 text-pink-400" : ""}`} />
                          Encourage
                        </button>
                      </div>
                    )}

                    {/* Clap burst animation */}
                    {isClapping && (
                      <div className="absolute top-2 right-2 text-lg animate-bounce pointer-events-none">
                        👏
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Mute reminder */}
          <div className="p-3 border-t border-white/5">
            <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2">
              <span className="text-base">🔇</span>
              <span className="text-[10px] text-red-300 font-bold">Microphone is disabled in all rooms</span>
            </div>
          </div>
        </aside>

        {/* ── RIGHT: ZEGOCLOUD Video Grid ─────────── */}
        <main className="flex-1 relative bg-[#030712] overflow-hidden">
          {/* Zego container */}
          <div
            ref={containerRef}
            className="absolute inset-0 w-full h-full"
          />

          {/* Fallback when no Zego credentials */}
          {!hasZegoCredentials && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#030712] p-8">
              <div className="max-w-sm w-full text-center space-y-6">
                <div className="w-16 h-16 bg-amber-500/10 text-amber-400 rounded-2xl flex items-center justify-center mx-auto">
                  <AlertTriangle className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white mb-2">Live Camera Not Active</h3>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    Add <code className="text-indigo-400 bg-indigo-900/30 px-1 py-0.5 rounded">NEXT_PUBLIC_ZEGO_APP_ID</code> and <code className="text-indigo-400 bg-indigo-900/30 px-1 py-0.5 rounded">NEXT_PUBLIC_ZEGO_SERVER_SECRET</code> to Vercel environment variables to enable live group video.
                  </p>
                </div>

                {/* Still show participants grid as preview */}
                {participants.length > 0 && (
                  <div className="mt-6">
                    <p className="text-[10px] text-gray-600 uppercase tracking-widest font-bold mb-3">
                      Who's studying right now:
                    </p>
                    <div className="grid grid-cols-3 gap-2">
                      {participants.slice(0, 9).map((p) => (
                        <div
                          key={p.id}
                          className="bg-[#0f172a] border border-white/5 rounded-2xl p-3 flex flex-col items-center gap-2 text-center"
                        >
                          <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${getAvatarColor(p.display_name)} flex items-center justify-center text-xs font-black text-white`}>
                            {getInitials(p.display_name)}
                          </div>
                          <div>
                            <p className="text-[9px] font-black text-white truncate w-full">{p.display_name}</p>
                            {p.target_task && (
                              <p className="text-[8px] text-gray-500 truncate w-full">{p.target_task}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* ── STUDY GOAL ENTRY MODAL ───────────────── */}
      {showGoalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <form
            onSubmit={saveGoal}
            className="bg-[#0a0f1e] border border-white/10 rounded-3xl shadow-2xl w-full max-w-md p-8 space-y-6"
          >
            {/* Icon */}
            <div className="text-center">
              <div className="w-14 h-14 bg-indigo-500/20 text-indigo-400 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Target className="w-7 h-7" />
              </div>
              <h2 className="text-2xl font-black text-white">Aaj kya padh rahe ho?</h2>
              <p className="text-sm text-gray-500 mt-2">
                Apna study goal set karo — baaki sabko dikhai dega 👀
              </p>
            </div>

            {/* Suggestion chips */}
            <div className="flex flex-wrap gap-2">
              {["SSC Math Practice", "UPSC Revision", "Locked in 🔒", "Railway GK", "English Vocab", "Physics MCQs"].map(suggestion => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => setGoalInput(suggestion)}
                  className={`text-[10px] font-black px-3 py-1.5 rounded-xl border transition-all ${goalInput === suggestion
                      ? "bg-indigo-600 text-white border-indigo-500"
                      : "bg-white/5 text-gray-400 border-white/10 hover:border-white/20 hover:text-white"
                    }`}
                >
                  {suggestion}
                </button>
              ))}
            </div>

            {/* Input */}
            <input
              type="text"
              value={goalInput}
              onChange={(e) => setGoalInput(e.target.value)}
              placeholder="e.g., SSC CGL Maths Paper 2..."
              maxLength={60}
              className="w-full px-4 py-3.5 bg-white/5 border border-white/10 rounded-2xl text-sm font-bold text-white placeholder-gray-600 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
            />

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowGoalModal(false)}
                className="flex-1 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-gray-400 rounded-2xl font-bold text-sm transition-all"
              >
                Skip for now
              </button>
              <button
                type="submit"
                disabled={savingGoal}
                className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black text-sm transition-all flex items-center justify-center gap-2"
              >
                {savingGoal ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                Start Studying
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── REPORT MODAL ─────────────────────────── */}
      {showReportModal && flaggedUser && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4">
          <form
            onSubmit={triggerReport}
            className="bg-[#0a0f1e] border border-white/10 rounded-3xl shadow-2xl w-full max-w-md p-6 space-y-5"
          >
            <div>
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-red-400" /> Report Student
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                Reporting <strong className="text-red-300">{flaggedUser.display_name}</strong>. Our team will review.
              </p>
            </div>

            <div>
              <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Reason</label>
              <textarea
                required
                rows={3}
                value={flagReason}
                onChange={(e) => setFlagReason(e.target.value)}
                placeholder="Describe what you saw..."
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-sm font-bold text-white placeholder-gray-600 outline-none focus:border-red-500 resize-none"
              />
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => { setShowReportModal(false); setFlagReason(""); setFlaggedUser(null); }}
                className="flex-1 py-3 bg-white/5 border border-white/10 text-gray-400 rounded-2xl font-bold text-sm hover:bg-white/10 transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={reporting}
                className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white rounded-2xl font-black text-sm transition-all flex items-center justify-center gap-2"
              >
                {reporting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Submit Report"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
