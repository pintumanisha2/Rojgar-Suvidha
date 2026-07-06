"use client";

import React, { useEffect, useRef, useState, use } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { 
  ArrowLeft, Bell, BellOff, Volume2, ShieldAlert, 
  Flame, Award, Loader2, Music, Video, VideoOff, 
  Sparkles, AlertTriangle, LogOut
} from "lucide-react";
import toast from "react-hot-toast";

interface StudyRoom {
  id: string;
  name: string;
  category: string;
  theme_name: string;
  max_capacity: number;
}

interface Participant {
  id: string;
  user_id: string;
  display_name: string;
  target_task: string;
  camera_active: boolean;
}

const MUSIC_STREAMS = [
  { name: "🎧 Chill Lo-Fi Study Beats", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3" }, // Dummy mp3 streams
  { name: "🌧️ Soft Rain Soundscape", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3" },
  { name: "🌲 Forest Camp Ambient", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3" }
];

export default function LiveStudyRoomPage({ params }: { params: Promise<{ roomId: string }> }) {
  const unwrappedParams = use(params);
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [room, setRoom] = useState<StudyRoom | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [joinedSessionId, setJoinedSessionId] = useState<string | null>(null);

  // Audio / Music settings
  const [currentMusic, setCurrentMusic] = useState<number>(-1);
  const [volume, setVolume] = useState<number>(0.5);

  // Pomodoro Timer States
  const [timerMinutes, setTimerMinutes] = useState(25);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [timerActive, setTimerActive] = useState(false);
  const [timerMode, setTimerMode] = useState<"focus" | "break">("focus");

  // Moderation / Flag State
  const [showReportModal, setShowReportModal] = useState(false);
  const [flaggedUser, setFlaggedUser] = useState<Participant | null>(null);
  const [flagReason, setFlagReason] = useState("");
  const [reporting, setReporting] = useState(false);

  // Zego state
  const [zpInstance, setZpInstance] = useState<any>(null);
  const [cameraOn, setCameraOn] = useState(false);

  useEffect(() => {
    let zp: any = null;
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

        // 1. Fetch Room Metadata
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

        // Fetch User profile to get display name
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("id", session.user.id)
          .single();

        const nameDisplay = profile?.full_name || "Aspirant_" + session.user.id.slice(-4);

        // 2. Clear any old session for this user first
        await supabase
          .from("study_session_users")
          .delete()
          .eq("user_id", session.user.id);

        // 3. Register user in study_session_users
        const { data: sessionData, error: sessionError } = await supabase
          .from("study_session_users")
          .insert({
            room_id: unwrappedParams.roomId,
            user_id: session.user.id,
            display_name: nameDisplay,
            target_task: "Studying Focus"
          })
          .select()
          .single();

        if (sessionError) throw sessionError;
        setJoinedSessionId(sessionData.id);

        // 4. Fetch participants
        await fetchParticipants();

        // 5. Initialize ZEGOCLOUD Video
        await initZego(roomData, session.user.id, nameDisplay);
      } catch (err: any) {
        toast.error("Failed to join room: " + err.message);
        router.push("/dashboard/study");
      } finally {
        setLoading(false);
      }
    };

    setupRoom();

    // 6. Listen to Realtime join/leave updates
    const channel = supabase.channel(`study_room_${unwrappedParams.roomId}`)
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "study_session_users",
        filter: `room_id=eq.${unwrappedParams.roomId}`
      }, () => {
        fetchParticipants();
      })
      .subscribe();

    // Interval to check if Admin has disabled their camera track or kicked them out
    checkSessionInterval = setInterval(async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { data: sessCheck } = await supabase
          .from("study_session_users")
          .select("id")
          .eq("user_id", session.user.id)
          .single();

        if (!sessCheck) {
          // If session is deleted, user has been kicked out or banned
          toast.error("You have been disconnected from the room by moderation.");
          router.push("/dashboard/study");
        }
      }
    }, 15000);

    return () => {
      clearInterval(checkSessionInterval);
      supabase.removeChannel(channel);
      
      // Cleanup session on component unmount
      if (user) {
        supabase
          .from("study_session_users")
          .delete()
          .eq("user_id", user.id)
          .then(() => null);
      }

      if (zp) {
        zp.destroy();
      }
    };
  }, [unwrappedParams.roomId]);

  // Pomodoro Timer Effect
  useEffect(() => {
    let interval: any = null;
    if (timerActive) {
      interval = setInterval(() => {
        if (timerSeconds > 0) {
          setTimerSeconds(prev => prev - 1);
        } else if (timerMinutes > 0) {
          setTimerMinutes(prev => prev - 1);
          setTimerSeconds(59);
        } else {
          // Cycle Completed
          handleCycleComplete();
        }
      }, 1000);
    } else {
      clearInterval(interval);
    }

    return () => clearInterval(interval);
  }, [timerActive, timerMinutes, timerSeconds]);

  const handleCycleComplete = () => {
    setTimerActive(false);
    
    // Play Chime
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.type = "sine";
      osc.frequency.setValueAtTime(440, audioCtx.currentTime); // A4 Key
      gain.gain.setValueAtTime(0.5, audioCtx.currentTime);
      osc.start();
      osc.stop(audioCtx.currentTime + 1.2);
    } catch (e) {}

    if (timerMode === "focus") {
      toast.success("Focus Cycle Completed! 🎉 Time for a 5-minute break.");
      setTimerMode("break");
      setTimerMinutes(5);
    } else {
      toast.success("Break Finished! Back to focus.");
      setTimerMode("focus");
      setTimerMinutes(25);
    }
    setTimerSeconds(0);
  };

  const fetchParticipants = async () => {
    const { data } = await supabase
      .from("study_session_users")
      .select("*")
      .eq("room_id", unwrappedParams.roomId);
    if (data) setParticipants(data);
  };

  const initZego = async (roomData: StudyRoom, userId: string, userName: string) => {
    if (!containerRef.current) return;

    const appID = parseInt(process.env.NEXT_PUBLIC_ZEGO_APP_ID || "0"); 
    const serverSecret = process.env.NEXT_PUBLIC_ZEGO_SERVER_SECRET || "";
    
    if (!appID || !serverSecret) {
      console.warn("Zego Credentials missing. Running in mock/preview stream mode.");
      return;
    }

    const { ZegoUIKitPrebuilt } = await import("@zegocloud/zego-uikit-prebuilt");

    const kitToken = ZegoUIKitPrebuilt.generateKitTokenForTest(
      appID, 
      serverSecret, 
      roomData.id, 
      userId, 
      userName
    );

    const zp = ZegoUIKitPrebuilt.create(kitToken);
    setZpInstance(zp);

    zp.joinRoom({
      container: containerRef.current,
      scenario: {
        mode: ZegoUIKitPrebuilt.GroupCall,
      },
      showPreJoinView: false,
      turnOnMicrophoneWhenJoining: false,       // Force Mic off
      showAudioVideoSettingsButton: false,       // Prevent users from enabling audio
      showScreenSharingButton: false,            // Screen sharing disabled
      onJoinRoom: () => {
        setCameraOn(true);
        // Sync camera active state in database
        supabase
          .from("study_session_users")
          .update({ camera_active: true })
          .eq("user_id", userId)
          .then(() => null);
      },
      onLeaveRoom: () => {
        router.push("/dashboard/study");
      }
    });
  };

  const handleLeaveRoom = async () => {
    if (zpInstance) {
      zpInstance.destroy();
    }
    if (user) {
      await supabase
        .from("study_session_users")
        .delete()
        .eq("user_id", user.id);
    }
    router.push("/dashboard/study");
  };

  const toggleMusic = (idx: number) => {
    if (!audioRef.current) return;
    if (currentMusic === idx) {
      audioRef.current.pause();
      setCurrentMusic(-1);
    } else {
      audioRef.current.src = MUSIC_STREAMS[idx].url;
      audioRef.current.volume = volume;
      audioRef.current.play().catch(() => null);
      setCurrentMusic(idx);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (audioRef.current) {
      audioRef.current.volume = val;
    }
  };

  const triggerReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!flaggedUser || !flagReason.trim()) return;

    setReporting(true);
    try {
      const { error } = await supabase
        .from("study_room_reports")
        .insert({
          reporter_id: user.id,
          reported_user_id: flaggedUser.user_id,
          room_id: unwrappedParams.roomId,
          reason: flagReason.trim()
        });

      if (error) throw error;
      toast.success("Thank you. Report filed! Our AI and moderators will inspect the feed.");
      setShowReportModal(false);
      setFlagReason("");
    } catch (err: any) {
      toast.error(err.message || "Failed to submit report.");
    } finally {
      setReporting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
        <div className="text-center space-y-4">
          <Loader2 className="w-10 h-10 animate-spin text-indigo-500 mx-auto" />
          <p className="text-sm font-bold text-gray-400">Loading Silent Study Room Environment...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col justify-between">
      
      {/* Top Header */}
      <div className="h-16 px-6 bg-gray-900 border-b border-gray-800 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <button 
            onClick={handleLeaveRoom}
            className="p-2 bg-gray-800 hover:bg-gray-700 rounded-xl transition-all"
            title="Leave Table"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-sm font-black tracking-wide truncate max-w-[200px] sm:max-w-sm">
              {room?.name}
            </h2>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
              Theme: {room?.theme_name}
            </p>
          </div>
        </div>

        {/* Counter */}
        <div className="flex items-center gap-4 bg-gray-850 px-4 py-2 rounded-2xl border border-gray-800">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-black">
            {participants.length} / {room?.max_capacity} Studying Live
          </span>
        </div>
      </div>

      {/* Main Study Grid Panel */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
        
        {/* Left Side: Circular Timer & Sound Mixers */}
        <div className="lg:col-span-4 bg-gray-900/40 p-6 flex flex-col items-center justify-center gap-8 border-r border-gray-900/60 overflow-y-auto">
          
          {/* Pomodoro Timer Widget */}
          <div className="bg-gray-900 border border-gray-800 rounded-3xl p-6 text-center max-w-sm w-full relative overflow-hidden">
            <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${timerMode === 'focus' ? 'bg-indigo-500/20 text-indigo-300' : 'bg-pink-500/20 text-pink-300'}`}>
              {timerMode === "focus" ? "🎯 Focus Session" : "☕ Break Time"}
            </span>

            {/* Circular representation */}
            <div className="my-6 flex items-center justify-center">
              <div className="w-40 h-40 rounded-full border-4 border-gray-800 flex items-center justify-center relative shadow-[0_0_20px_rgba(99,102,241,0.08)]">
                <span className="text-4xl font-extrabold font-mono tracking-tight text-white">
                  {String(timerMinutes).padStart(2, "0")}:{String(timerSeconds).padStart(2, "0")}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => setTimerActive(!timerActive)}
                className={`flex-1 py-3 px-4 rounded-xl text-xs font-black transition-all ${timerActive ? 'bg-amber-600 hover:bg-amber-700 text-white' : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-950/50'}`}
              >
                {timerActive ? "Pause Timer" : "Start Focus"}
              </button>
              <button
                onClick={() => { setTimerActive(false); setTimerMinutes(25); setTimerSeconds(0); }}
                className="py-3 px-4 bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white rounded-xl text-xs font-bold transition-all"
              >
                Reset
              </button>
            </div>
          </div>

          {/* Sound Mixer Panel */}
          <div className="bg-gray-900 border border-gray-800 rounded-3xl p-6 max-w-sm w-full space-y-4">
            <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
              <Music className="w-4 h-4 text-indigo-400" /> Focus Soundscape
            </h3>

            <audio ref={audioRef} loop />

            <div className="space-y-2">
              {MUSIC_STREAMS.map((st, idx) => (
                <button
                  key={st.name}
                  onClick={() => toggleMusic(idx)}
                  className={`w-full py-2.5 px-4 rounded-xl border text-xs font-bold text-left transition-all flex items-center justify-between ${currentMusic === idx ? 'bg-indigo-600/10 border-indigo-500 text-indigo-300' : 'bg-gray-950 border-gray-850 hover:border-gray-700 text-gray-400 hover:text-white'}`}
                >
                  <span>{st.name}</span>
                  <Volume2 className={`w-4 h-4 ${currentMusic === idx ? 'opacity-100 animate-bounce' : 'opacity-40'}`} />
                </button>
              ))}
            </div>

            {/* Volume controller */}
            {currentMusic !== -1 && (
              <div className="pt-2 flex items-center gap-3">
                <span className="text-[10px] text-gray-400 font-bold">Vol</span>
                <input 
                  type="range" 
                  min="0" 
                  max="1" 
                  step="0.05"
                  value={volume}
                  onChange={handleVolumeChange}
                  className="flex-1 accent-indigo-500"
                />
              </div>
            )}
          </div>
        </div>

        {/* Right Side: ZEGOCLOUD Video Streams & Report Overlay */}
        <div className="lg:col-span-8 flex flex-col p-4 sm:p-6 justify-between gap-4 overflow-y-auto">
          
          {/* Zego pre-built layout target */}
          <div className="flex-1 bg-gray-900 border border-gray-800 rounded-3xl overflow-hidden relative min-h-[400px]">
            
            <div 
              ref={containerRef} 
              className="w-full h-full relative"
            />

            {/* If Zego fails to load credentials, show fallback banner */}
            {(!process.env.NEXT_PUBLIC_ZEGO_APP_ID || process.env.NEXT_PUBLIC_ZEGO_APP_ID === "0") && (
              <div className="absolute inset-0 bg-gray-900/60 flex flex-col items-center justify-center p-6 text-center backdrop-blur-sm space-y-4">
                <div className="w-14 h-14 bg-amber-500/15 text-amber-500 rounded-full flex items-center justify-center">
                  <AlertTriangle className="w-8 h-8" />
                </div>
                <h3 className="font-extrabold text-base text-white">Live Camera Preview Suspended</h3>
                <p className="text-xs text-gray-400 max-w-sm leading-relaxed">
                  Zego App Credentials are not verified. Run dynamic camera outputs inside active production channels or toggle local simulators.
                </p>
              </div>
            )}
          </div>

          {/* Bottom Toolbar controls */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-[11px] text-gray-400 font-bold tracking-wide">STUDY CONTROLS:</span>
              <span className="text-xs text-red-500 font-extrabold bg-red-500/10 border border-red-500/20 px-2.5 py-1 rounded-xl">
                🔇 Microphone Disabled
              </span>
            </div>

            <div className="flex items-center gap-2">
              {/* Flag / Abuse trigger button */}
              <button
                onClick={() => {
                  const targetList = participants.filter(p => p.user_id !== user?.id);
                  if (targetList.length === 0) {
                    toast.error("You are currently alone at this table.");
                  } else {
                    setFlaggedUser(targetList[0]);
                    setShowReportModal(true);
                  }
                }}
                className="py-2.5 px-4 bg-gray-800 hover:bg-red-950/20 border border-gray-700 hover:border-red-900/40 text-gray-400 hover:text-red-400 rounded-xl text-xs font-black transition-all flex items-center gap-2"
              >
                <ShieldAlert className="w-4 h-4" /> Report Stream
              </button>

              <button
                onClick={handleLeaveRoom}
                className="py-2.5 px-4 bg-red-650 bg-red-600 hover:bg-red-750 text-white rounded-xl text-xs font-black transition-all flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" /> Exit Lobby
              </button>
            </div>
          </div>
        </div>

      </div>

      {/* Report Modal */}
      {showReportModal && flaggedUser && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 backdrop-blur-sm p-4">
          <form onSubmit={triggerReport} className="bg-gray-900 border border-gray-800 rounded-3xl shadow-2xl w-full max-w-md p-6 relative animate-in zoom-in-95 duration-200">
            <h3 className="text-lg font-black text-white mb-2 flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-red-500" /> Report Inappropriate Stream
            </h3>
            <p className="text-xs text-gray-400 mb-6 leading-relaxed">
              Report candidate <strong className="text-red-400">{flaggedUser.display_name}</strong>. If 3 different users flag their feed, their video stream will be disconnected automatically.
            </p>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Reason for Report</label>
                <textarea
                  required
                  rows={3}
                  value={flagReason}
                  onChange={(e) => setFlagReason(e.target.value)}
                  placeholder="Describe the inappropriate gesture, post, or behavior you noticed on camera..."
                  className="w-full px-4 py-3 bg-gray-950 border border-gray-800 rounded-xl text-sm font-bold text-white placeholder-gray-600 outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowReportModal(false)}
                className="flex-1 py-3 bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white rounded-xl font-bold text-sm transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={reporting}
                className="flex-1 py-3 bg-red-600 hover:bg-red-750 text-white rounded-xl font-extrabold text-sm transition-all flex items-center justify-center gap-2"
              >
                {reporting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                File Report
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
