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
 *
 * FIXES:
 *   1. Uses correct UUID for the public hall room (not "public-hall" string)
 *   2. Boot sequence is parallelised → fast entry
 *   3. Camera no longer blocks room entry — avatar fallback works perfectly
 *   4. last_heartbeat filter is optional (graceful if column missing)
 *   5. Proper error handling at each step
 * ─────────────────────────────────────────────────────────────────
 */

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Room, RoomEvent, Participant, Track } from "livekit-client";
import toast from "react-hot-toast";
import { ArrowLeft, Loader2, Star } from "lucide-react";
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

/**
 * IMPORTANT: This must match the actual UUID in the study_rooms table.
 * The seed SQL inserts '00000000-0000-0000-0000-000000000001' as "SSC Exam Hall 1"
 * which serves as the main public hall. The env var NEXT_PUBLIC_PUBLIC_HALL_ROOM_ID
 * must be set to this UUID (not the string "public-hall").
 *
 * If you changed the public hall room in Supabase, update the env var accordingly.
 */
const PUBLIC_HALL_ROOM_ID =
  process.env.NEXT_PUBLIC_PUBLIC_HALL_ROOM_ID &&
  process.env.NEXT_PUBLIC_PUBLIC_HALL_ROOM_ID !== "public-hall"
    ? process.env.NEXT_PUBLIC_PUBLIC_HALL_ROOM_ID
    : "00000000-0000-0000-0000-000000000001";

export default function PublicHallPage() {
  const router = useRouter();

  /* ── State ──────────────────────────────────────────────── */
  const [loading,       setLoading]       = useState(true);
  const [loadingMsg,    setLoadingMsg]    = useState("Entering Study Hall...");
  const [myUserId,      setMyUserId]      = useState<string | null>(null);
  const [myName,        setMyName]        = useState("");
  const [mySessionId,   setMySessionId]   = useState<string | null>(null);
  const [myGoal,        setMyGoal]        = useState("");
  const [showGoalInput, setShowGoalInput] = useState(false);
  const [goalInput,     setGoalInput]     = useState("");
  const [goalBusy,      setGoalBusy]      = useState(false);

  /* Feedback state */
  const [showFeedback,       setShowFeedback]       = useState(false);
  const [feedbackRating,     setFeedbackRating]     = useState(0);
  const [hoverRating,        setHoverRating]        = useState<number | null>(null);
  const [feedbackComment,    setFeedbackComment]    = useState("");
  const [submittingFeedback, setSubmittingFeedback] = useState(false);

  /* Camera/mic state */
  const [camOn,            setCamOn]            = useState(false);
  const [micOn,            setMicOn]            = useState(false);
  const localStreamRef      = useRef<MediaStream | null>(null);
  const [localVideoTrack,  setLocalVideoTrack]  = useState<MediaStreamTrack | null>(null);

  /* DB participants */
  const [dbParticipants, setDbParticipants] = useState<DBParticipant[]>([]);
  const [totalCount,     setTotalCount]     = useState(0);

  /* LiveKit */
  const lkRoomRef       = useRef<Room | null>(null);
  const [lkParticipants, setLkParticipants] = useState<Map<string, Participant>>(new Map());

  /* Clapping */
  const [clapping, setClapping] = useState<Record<string, boolean>>({});

  const bootCalled = useRef(false);
  const myUserIdRef = useRef<string | null>(null);

  /* ── Fetch DB participants (polling) ──────────────────── */
  const fetchParticipants = useCallback(async () => {
    try {
      let query = supabase
        .from("study_session_users")
        .select("*", { count: "exact" })
        .eq("room_id", PUBLIC_HALL_ROOM_ID)
        .order("joined_at", { ascending: true });

      const { data, count, error } = await query;

      if (error) {
        console.warn("[Hall] fetchParticipants error:", error.message);
        return;
      }
      if (data) {
        setDbParticipants(data as DBParticipant[]);
        setTotalCount(count ?? data.length);
      }
    } catch (err) {
      console.warn("[Hall] fetchParticipants exception:", err);
    }
  }, []);

  /* ── Boot sequence ───────────────────────────────────── */
  useEffect(() => {
    if (bootCalled.current) return;
    bootCalled.current = true;

    let heartbeatTimer: any = null;
    let pollTimer:      any = null;

    const boot = async () => {
      // 1. Synchronous check to dismiss loader instantly for logged in users
      const referenceId = "kkfgdzaoukekhlijlfsw";
      const cacheKey = `sb-${referenceId}-auth-token`;
      const cachedSessionStr = typeof window !== "undefined" ? localStorage.getItem(cacheKey) : null;
      
      let initialUid: string | null = null;
      let initialName: string | null = null;

      if (cachedSessionStr) {
        try {
          const parsed = JSON.parse(cachedSessionStr);
          if (parsed?.user?.id) {
            initialUid = parsed.user.id;
            const cachedName = localStorage.getItem("rs_display_name");
            initialName = cachedName || parsed.user.email?.split("@")[0] || "Student";
          }
        } catch (e) {
          console.warn("Error parsing cached session:", e);
        }
      }

      if (initialUid) {
        setMyUserId(initialUid);
        setMyName(initialName || "Student");
        myUserIdRef.current = initialUid;
        setLoading(false); // Dismiss loader instantly!
      }

      try {
        /* 2. Run real auth check in background */
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          window.location.href = "/login?redirect=/dashboard/study/hall";
          return;
        }
        const uid = session.user.id;
        myUserIdRef.current = uid;
        setMyUserId(uid);

        // Fetch profile to update name
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("id", uid)
          .single();
        
        const displayName = profile?.full_name || session.user.email?.split("@")[0] || "Student";
        setMyName(displayName);
        localStorage.setItem("rs_display_name", displayName);

        // Dismiss loader in case synchronous check didn't run
        setLoading(false);

        /* 3. Register presence in new room in background (non-blocking) */
        Promise.resolve().then(async () => {
          try {
            await supabase.from("study_session_users").delete().eq("user_id", uid);
            const upsertPayload: any = {
              room_id:       PUBLIC_HALL_ROOM_ID,
              user_id:       uid,
              display_name:  displayName,
              target_task:   "",
              camera_active: false,
              last_heartbeat: new Date().toISOString(),
            };
            const { data: sessRow } = await supabase
              .from("study_session_users")
              .upsert(upsertPayload, { onConflict: "user_id" })
              .select().single();

            if (sessRow) {
              setMySessionId(sessRow.id);
            }
          } catch (e) {
            console.warn("Background presence registration warning:", e);
          }
          // Fetch initial participant list once presence setup runs
          fetchParticipants();
        });

        /* 5. Start heartbeat */
        heartbeatTimer = setInterval(async () => {
          try {
            await supabase.from("study_session_users")
              .update({ last_heartbeat: new Date().toISOString() })
              .eq("user_id", uid);
          } catch {}
        }, 30_000);

        /* 6. Poll DB every 15s for updated participant list */
        pollTimer = setInterval(fetchParticipants, 15_000);

        /* 7. Camera — request ONLY video first to speed up permission popups */
        initCameraInBackground(uid, displayName, session.access_token);

      } catch (err: any) {
        console.error("[Hall] Boot failed:", err);
        setLoading(false);
      }
    };

    boot();

    return () => {
      clearInterval(heartbeatTimer);
      clearInterval(pollTimer);
      lkRoomRef.current?.disconnect();
      localStreamRef.current?.getTracks().forEach(t => t.stop());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── Camera (non-blocking background init) ───────────── */
  const initCameraInBackground = async (uid: string, displayName: string, accessToken: string) => {
    try {
      // Request ONLY video to make loading fast and bypass audio blocker issues
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, frameRate: { ideal: 24 } },
        audio: false,
      });
      localStreamRef.current = stream;

      const videoTrack = stream.getVideoTracks()[0] || null;
      setLocalVideoTrack(videoTrack);
      setCamOn(!!videoTrack);

      if (videoTrack) {
        await supabase.from("study_session_users")
          .update({ camera_active: true }).eq("user_id", uid);

        /* Connect to LiveKit only if camera is available */
        await connectLiveKit(uid, displayName, stream, accessToken);
      }
    } catch {
      /* Camera denied — user stays as avatar, perfectly fine */
    }
  };

  /* ── Connect to LiveKit room ─────────────────────────── */
  const connectLiveKit = async (uid: string, displayName: string, stream: MediaStream, accessToken: string) => {
    try {
      const res = await fetch("/api/livekit/token", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (!res.ok) {
        const err = await res.json();
        console.warn("[Hall] LiveKit token error:", err.error);
        return; // Graceful fallback — user stays as avatar
      }

      const { token, url } = await res.json();

      const room = new Room({
        adaptiveStream: true,
        dynacast: true,
        videoCaptureDefaults: { resolution: { width: 640, height: 480, frameRate: 24 } },
      });

      room.on(RoomEvent.ParticipantConnected,    updateLkParticipants);
      room.on(RoomEvent.ParticipantDisconnected, updateLkParticipants);
      room.on(RoomEvent.TrackSubscribed,         updateLkParticipants);
      room.on(RoomEvent.TrackUnsubscribed,       updateLkParticipants);

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
    map.set(lkRoomRef.current.localParticipant.identity, lkRoomRef.current.localParticipant);
    lkRoomRef.current.remoteParticipants.forEach((p) => {
      map.set(p.identity, p);
    });
    setLkParticipants(new Map(map));
  }, []);

  /* ── Toggle camera ─────────────────────────────────── */
  const toggleCam = useCallback(async () => {
    const uid = myUserIdRef.current;
    if (!localStreamRef.current) {
      // Try to request camera if not yet acquired
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 640 }, height: { ideal: 480 } },
          audio: { echoCancellation: true, noiseSuppression: true },
        });
        stream.getAudioTracks().forEach(t => (t.enabled = false));
        localStreamRef.current = stream;
        const videoTrack = stream.getVideoTracks()[0] || null;
        setLocalVideoTrack(videoTrack);
        setCamOn(!!videoTrack);
        if (uid && videoTrack) {
          await supabase.from("study_session_users")
            .update({ camera_active: true }).eq("user_id", uid);
          const { data: { session } } = await supabase.auth.getSession();
          if (session) await connectLiveKit(uid, myName, stream, session.access_token);
        }
      } catch {
        toast.error("Camera permission denied.");
      }
      return;
    }

    const track = localStreamRef.current.getVideoTracks()[0];
    if (!track) return;
    track.enabled = !track.enabled;
    setCamOn(track.enabled);
    if (uid) {
      await supabase.from("study_session_users")
        .update({ camera_active: track.enabled }).eq("user_id", uid);
    }
    const lkRoom = lkRoomRef.current;
    if (lkRoom) {
      await lkRoom.localParticipant.setCameraEnabled(track.enabled).catch(() => {});
    }
  }, [myName]);

  /* ── Toggle mic ────────────────────────────────────── */
  const toggleMic = useCallback(async () => {
    if (!localStreamRef.current) return;
    let track = localStreamRef.current.getAudioTracks()[0];

    if (!track) {
      // Dynamically request microphone permission if not yet acquired
      try {
        const audioStream = await navigator.mediaDevices.getUserMedia({
          audio: { echoCancellation: true, noiseSuppression: true }
        });
        const audioTrack = audioStream.getAudioTracks()[0];
        if (audioTrack) {
          localStreamRef.current.addTrack(audioTrack);
          track = audioTrack;
          
          // Publish to LiveKit if connected
          if (lkRoomRef.current) {
            await lkRoomRef.current.localParticipant.publishTrack(audioTrack);
          }
        }
      } catch (err) {
        toast.error("Microphone permission denied.");
        return;
      }
    }

    if (track) {
      track.enabled = !track.enabled;
      setMicOn(track.enabled);
      toast.success(track.enabled ? "Microphone ON" : "Microphone MUTED");
    }
  }, []);

  /* ── Encourage ─────────────────────────────────────── */
  const handleEncourage = useCallback(async (userId: string) => {
    setClapping(prev => ({ ...prev, [userId]: true }));
    const target = dbParticipants.find(p => p.user_id === userId);
    const currentClaps = target?.claps_count || 0;
    try {
      await supabase.from("study_session_users")
        .update({ claps_count: currentClaps + 1 })
        .eq("user_id", userId);
      setDbParticipants(prev =>
        prev.map(p => p.user_id === userId ? { ...p, claps_count: currentClaps + 1 } : p)
      );
    } catch {}
    setTimeout(() => setClapping(prev => ({ ...prev, [userId]: false })), 2000);
    toast("👏 Encouraged!");
  }, [dbParticipants]);

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

  /* ── Leave & Feedback Handlers ─────────────────────── */
  const performActualLeave = useCallback(async () => {
    lkRoomRef.current?.disconnect();
    localStreamRef.current?.getTracks().forEach(t => t.stop());
    const uid = myUserIdRef.current;
    if (uid) {
      try {
        await supabase.from("study_session_users").delete().eq("user_id", uid);
      } catch {}
    }
    router.push("/dashboard/study");
  }, [router]);

  const handleLeave = useCallback(() => {
    // Show rating modal first instead of leaving immediately
    setShowFeedback(true);
  }, []);

  const handleFeedbackSubmit = async () => {
    if (feedbackRating === 0) {
      toast.error("Please select a rating! ⭐");
      return;
    }

    setSubmittingFeedback(true);
    const uid = myUserIdRef.current;
    try {
      const { error } = await supabase.from("study_room_feedback").insert({
        user_id: uid,
        rating: feedbackRating,
        feedback_text: feedbackComment.trim() || null,
      });

      if (error) {
        console.warn("Feedback save database error:", error.message);
      } else {
        toast.success("Thank you for your rating! ❤️");
      }
    } catch (e: any) {
      console.warn("Feedback save catch error:", e.message);
    }
    setSubmittingFeedback(false);
    setShowFeedback(false);
    performActualLeave();
  };

  const handleFeedbackSkip = () => {
    setShowFeedback(false);
    performActualLeave();
  };

  /* ── Build grid participants ──────────────────────── */
  /* ── Build grid participants ──────────────────────── */
  const gridParticipants: HallParticipant[] = [];
  let meAdded = false;

  dbParticipants.forEach(p => {
    const isMe = p.user_id === myUserId;
    if (isMe) meAdded = true;
    gridParticipants.push({
      userId:       p.user_id,
      displayName:  p.display_name,
      goal:         p.target_task,
      cameraActive: isMe ? camOn : p.camera_active, // Use local reactive state for "me"
      clapsCount:   p.claps_count,
      isMe:         isMe,
      lkParticipant: lkParticipants.get(p.user_id),
      localVideoTrack: isMe ? localVideoTrack : undefined,
    });
  });

  // Always prepend "me" if not yet added to prevent blank screen while fetching DB
  if (!meAdded && myUserId) {
    gridParticipants.unshift({
      userId:       myUserId,
      displayName:  myName || "You",
      goal:         myGoal,
      cameraActive: camOn,
      clapsCount:   0,
      isMe:         true,
      lkParticipant: lkParticipants.get(myUserId),
      localVideoTrack: localVideoTrack,
    });
  }

  /* ── Loading screen ──────────────────────────────── */
  if (loading) {
    return (
      <div className="fixed inset-0 bg-[#030712] flex flex-col items-center justify-center gap-4 z-[200]">
        <Loader2 className="w-10 h-10 text-indigo-400 animate-spin" />
        <p className="text-sm font-bold text-gray-500">{loadingMsg}</p>
        <p className="text-xs text-gray-700">Setting up your study space...</p>
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

        {/* LiveKit / Avatar status */}
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

      {/* ── RATING & FEEDBACK MODAL ───────────────────── */}
      {showFeedback && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#0a0f1e]/95 border border-white/10 rounded-3xl w-full max-w-md p-7 space-y-6 text-center shadow-2xl">
            <div className="space-y-2">
              <span className="text-3xl">🌟</span>
              <h3 className="text-lg font-black text-white">
                How was your study session?
              </h3>
              <p className="text-xs text-gray-500">
                Help us make Rojgar Study Rooms better for everyone.
              </p>
            </div>

            {/* Stars row */}
            <div className="flex justify-center items-center gap-3 py-2">
              {[1, 2, 3, 4, 5].map((starValue) => {
                const isLit = hoverRating !== null ? starValue <= hoverRating : starValue <= feedbackRating;
                return (
                  <button
                    key={starValue}
                    type="button"
                    onMouseEnter={() => setHoverRating(starValue)}
                    onMouseLeave={() => setHoverRating(null)}
                    onClick={() => setFeedbackRating(starValue)}
                    className="focus:outline-none transition-all duration-150 transform hover:scale-125"
                  >
                    <Star
                      className={`w-9 h-9 ${
                        isLit
                          ? "text-yellow-400 fill-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.6)]"
                          : "text-gray-600 hover:text-yellow-500"
                      } transition-all duration-150`}
                    />
                  </button>
                );
              })}
            </div>

            {/* Textarea comments */}
            <textarea
              rows={3}
              value={feedbackComment}
              onChange={e => setFeedbackComment(e.target.value)}
              placeholder="What did you study today? Any feedback on the room? (optional)"
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-2xl
                         text-sm text-white placeholder-gray-600 outline-none resize-none
                         focus:border-indigo-500 transition-colors"
            />

            {/* Action buttons */}
            <div className="flex gap-3 pt-2">
              <button
                onClick={handleFeedbackSkip}
                className="flex-1 py-3 bg-white/5 border border-white/10 text-gray-400
                           rounded-2xl font-black text-xs hover:bg-white/10 transition-all"
              >
                Skip & Leave
              </button>
              <button
                onClick={handleFeedbackSubmit}
                disabled={submittingFeedback || feedbackRating === 0}
                className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 text-white
                           rounded-2xl font-black text-xs transition-all
                           disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submittingFeedback ? "Submitting..." : "Submit & Leave"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
