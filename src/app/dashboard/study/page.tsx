"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { 
  Users, Flame, Search, PlusCircle, ArrowLeft, Loader2, 
  Sparkles, Award, Shield, BookOpen, Volume2, Globe, Hash
} from "lucide-react";
import toast from "react-hot-toast";

interface StudyRoom {
  id: string;
  name: string;
  category: string;
  theme_name: string;
  max_capacity: number;
  is_private: boolean;
  join_code: string;
  active_count?: number;
}

const CATEGORY_MAP: Record<string, string> = {
  all: "🌐 All Cabins",
  ssc: "🏛️ SSC Exams",
  railway: "🚂 Railways",
  upsc: "🎖️ UPSC Prep",
  banking: "🏦 Banking/PO",
  general: "📚 General Study"
};

const THEME_COLORS: Record<string, string> = {
  library: "from-amber-700 via-amber-800 to-amber-950 border-amber-500/20",
  cafe: "from-amber-600 via-stone-800 to-stone-950 border-stone-500/20",
  forest: "from-emerald-800 via-emerald-950 to-stone-950 border-emerald-500/20",
  space: "from-indigo-900 via-purple-950 to-slate-950 border-purple-500/20"
};

const PUBLIC_HALL_ID = "00000000-0000-0000-0000-000000000001";

export default function StudyLobbyPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [rooms, setRooms] = useState<StudyRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCat, setSelectedCat] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Room Join code input
  const [inputJoinCode, setInputJoinCode] = useState("");
  const [joiningByCode, setJoiningByCode] = useState(false);

  // Create room modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newRoomName, setNewRoomName] = useState("");
  const [newRoomCat, setNewRoomCat] = useState("general");
  const [newRoomTheme, setNewRoomTheme] = useState("library");
  const [newRoomCapacity, setNewRoomCapacity] = useState(8);
  const [creating, setCreating] = useState(false);

  // Gamified Study Streak (Statically simulated for gamified retention)
  const [streakDays, setStreakDays] = useState(5);
  const [publicActiveCount, setPublicActiveCount] = useState(0);

  useEffect(() => {
    const initLobby = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          toast.error("Please login to access study rooms.");
          router.push("/login?redirect=/dashboard/study");
          return;
        }

        // Check if user has completed profile setup, otherwise redirect
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("id", session.user.id)
          .single();

        if (!profile?.full_name) {
          toast.error("Please complete your profile setup first.");
          router.push("/profile-setup?redirect=/dashboard/study");
          return;
        }

        setUser(session.user);
        await fetchRooms();
      } catch (err) {
        console.error("Lobby initialization failed:", err);
        router.push("/profile-setup?redirect=/dashboard/study");
      }
    };

    initLobby();

    // Setup realtime subscription to sync participant counts dynamically
    const channel = supabase.channel("study_rooms_lobby")
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "study_session_users"
      }, () => {
        fetchRooms(); // Refresh counts when participants join/leave
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchRooms = async () => {
    try {
      // 1. Fetch Rooms
      const { data: roomsData, error: roomsError } = await supabase
        .from("study_rooms")
        .select("*")
        .order("created_at", { ascending: true });

      if (roomsError) throw roomsError;

      // 2. Fetch Sessions to aggregate active participants
      const { data: sessionsData, error: sessionsError } = await supabase
        .from("study_session_users")
        .select("room_id");

      if (sessionsError) throw sessionsError;

      const countsMap: Record<string, number> = {};
      sessionsData?.forEach((sess: any) => {
        countsMap[sess.room_id] = (countsMap[sess.room_id] || 0) + 1;
      });

      setPublicActiveCount(countsMap[PUBLIC_HALL_ID] || 0);

      const formattedRooms = (roomsData || []).map((room: any) => ({
        ...room,
        active_count: countsMap[room.id] || 0
      }));

      setRooms(formattedRooms);
    } catch (err: any) {
      console.error("Failed to load study rooms:", err);
      toast.error("Error loading study rooms.");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoomName.trim()) {
      toast.error("Please enter a room name.");
      return;
    }

    setCreating(true);
    // Generate a unique 6 digit join code for free rooms sharing
    const genCode = Math.floor(100000 + Math.random() * 900000).toString();

    try {
      const { data, error } = await supabase
        .from("study_rooms")
        .insert({
          name: newRoomName.trim(),
          category: newRoomCat,
          theme_name: newRoomTheme,
          max_capacity: newRoomCapacity,
          is_private: true,
          join_code: genCode,
          created_by: user.id
        })
        .select()
        .single();

      if (error) throw error;

      toast.success(`Private Room Created! Share Code: ${genCode} 🎉`);
      setShowCreateModal(false);
      setNewRoomName("");
      
      // Navigate straight to the room
      router.push(`/dashboard/study/${data.id}`);
    } catch (err: any) {
      toast.error(err.message || "Failed to create room.");
    } finally {
      setCreating(false);
    }
  };

  const handleJoinByCode = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = inputJoinCode.trim();
    if (!cleanCode) {
      toast.error("Please enter a study cabin code.");
      return;
    }

    setJoiningByCode(true);
    try {
      const { data, error } = await supabase
        .from("study_rooms")
        .select("id")
        .eq("join_code", cleanCode)
        .single();

      if (error || !data) {
        toast.error("Invalid study cabin code. Please check and try again.");
        return;
      }

      toast.success("Cabin Found! Directing to session...");
      router.push(`/dashboard/study/${data.id}`);
    } catch (err) {
      toast.error("Invalid code or connection issue.");
    } finally {
      setJoiningByCode(false);
    }
  };

  const filteredRooms = rooms.filter(room => {
    // Hide the primary public hall from the lower grid (since it is shown on center stage banner)
    if (room.id === PUBLIC_HALL_ID) return false;
    const matchesCat = selectedCat === "all" || room.category === selectedCat;
    const matchesSearch = room.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="text-center space-y-4">
          <Loader2 className="w-10 h-10 animate-spin text-indigo-600 mx-auto" />
          <p className="text-sm font-bold text-gray-500 dark:text-gray-400">Loading Silent Study Cafe Lobby...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row items-center gap-6 bg-gradient-to-br from-indigo-950 via-slate-900 to-indigo-900 rounded-3xl p-6 sm:p-8 border border-white/10 shadow-2xl text-white relative overflow-hidden">
          <div className="absolute right-0 top-0 w-82 h-82 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center shrink-0 border border-white/10 backdrop-blur-md">
            <BookOpen className="w-9 h-9 text-indigo-300" />
          </div>
          
          <div className="flex-1 text-center md:text-left z-10">
            <h1 className="text-3xl font-black mb-1 flex items-center justify-center md:justify-start gap-2">
              Silent Video Study Rooms <Sparkles className="w-5 h-5 text-yellow-300" />
            </h1>
            <p className="text-indigo-200 text-sm font-medium opacity-90 max-w-xl">
              Focus live on camera with candidates across India in complete silence. Microphones are muted to guarantee distraction-free study. 100% Free.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0 z-10">
            <Link href="/dashboard" className="px-5 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl font-bold transition-all text-sm flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" /> Dashboard
            </Link>
            <button 
              onClick={() => setShowCreateModal(true)}
              className="px-5 py-2.5 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-400 hover:to-purple-500 text-white rounded-xl font-black transition-all text-sm flex items-center gap-2 shadow-lg shadow-purple-950/50"
            >
              <PlusCircle className="w-4 h-4" /> Create Private Cabin
            </button>
          </div>
        </div>

        {/* Center Stage: Perpetual National Public Hall */}
        <div className="bg-gradient-to-r from-indigo-600 to-violet-600 rounded-3xl p-6 sm:p-8 text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl relative overflow-hidden border border-indigo-400/20">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />
          
          <div className="space-y-2 text-center md:text-left">
            <span className="text-[10px] bg-yellow-400/20 text-yellow-300 border border-yellow-400/30 px-3 py-1 rounded-full font-black uppercase tracking-wider">
              🟢 National Public Hall (Open 24/7)
            </span>
            <h2 className="text-2xl font-black tracking-tight">Enter Main National Co-Study Room</h2>
            <p className="text-indigo-100 text-xs sm:text-sm max-w-lg leading-relaxed">
              Study side-by-side with fellow aspirants from all over India. Watch everyone live in tiny Zoom-style squares. Mic off by default.
            </p>
          </div>

          <div className="flex flex-col items-center gap-2 shrink-0 w-full md:w-auto">
            <Link
              href={`/dashboard/study/${PUBLIC_HALL_ID}`}
              className="w-full md:w-auto px-8 py-4 bg-white text-indigo-750 hover:bg-indigo-50 font-black rounded-2xl transition-all text-sm text-center shadow-lg shadow-indigo-950/30 flex items-center justify-center gap-2"
            >
              <Users className="w-4 h-4" /> Join Room ({publicActiveCount} Live)
            </Link>
            <span className="text-[10px] text-indigo-200 font-bold">No seat limits. Instant enter.</span>
          </div>
        </div>

        {/* User Status Bar */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          {/* Streak */}
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-4 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-orange-50 dark:bg-orange-950/30 text-orange-500 rounded-xl">
                <Flame className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Study Streak</p>
                <p className="text-lg font-black text-gray-800 dark:text-white">{streakDays} Days Studied</p>
              </div>
            </div>
            <span className="text-xs font-bold text-orange-600 bg-orange-50 dark:bg-orange-950/30 px-2.5 py-1 rounded-lg">Active</span>
          </div>

          {/* Join Cabin by Code Form */}
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-4 shadow-sm md:col-span-2">
            <form onSubmit={handleJoinByCode} className="flex flex-col sm:flex-row items-center gap-3 h-full justify-between">
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <div className="p-3 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 rounded-xl shrink-0">
                  <Hash className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Friend's Private Room?</p>
                  <p className="text-sm font-black text-gray-800 dark:text-white">Join Table via Code</p>
                </div>
              </div>

              <div className="flex gap-2 w-full sm:w-72">
                <input
                  type="text"
                  required
                  placeholder="Enter 6-Digit Cabin Code"
                  value={inputJoinCode}
                  onChange={(e) => setInputJoinCode(e.target.value)}
                  className="flex-1 px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl text-xs font-bold text-gray-900 dark:text-white outline-none focus:border-indigo-500 text-center uppercase"
                />
                <button
                  type="submit"
                  disabled={joiningByCode}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-750 text-white rounded-xl text-xs font-black transition-all flex items-center justify-center shrink-0"
                >
                  {joiningByCode ? <Loader2 className="w-4 h-4 animate-spin" /> : "Enter"}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Categories and Search Filters */}
        <div className="flex flex-col sm:flex-row items-center gap-4 justify-between border-b border-gray-200 dark:border-gray-800 pb-5">
          {/* Categories Selector */}
          <div className="flex gap-2 overflow-x-auto w-full sm:w-auto scrollbar-hide py-1">
            {Object.keys(CATEGORY_MAP).map(catKey => (
              <button
                key={catKey}
                onClick={() => setSelectedCat(catKey)}
                className={`flex-shrink-0 px-4 py-2 rounded-xl text-xs font-black transition-all ${selectedCat === catKey ? 'bg-indigo-600 text-white shadow-md' : 'bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-800 hover:border-gray-300'}`}
              >
                {CATEGORY_MAP[catKey]}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search private room..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl pl-10 pr-4 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-white font-medium"
            />
          </div>
        </div>

        {/* Rooms Grid */}
        {filteredRooms.length === 0 ? (
          <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 p-12 text-center shadow-sm">
            <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">No active private rooms found</h3>
            <p className="text-sm text-gray-500 max-w-xs mx-auto mt-1 mb-6">
              Create a custom free private cabin and share the join code with your friends to start focus sessions.
            </p>
            <button 
              onClick={() => setShowCreateModal(true)}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs transition-colors"
            >
              Launch Private Cabin
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRooms.map((room) => {
              const bgCls = THEME_COLORS[room.theme_name] || THEME_COLORS.library;
              const isFull = (room.active_count || 0) >= room.max_capacity;

              return (
                <div 
                  key={room.id}
                  className={`relative rounded-3xl border border-gray-200 dark:border-gray-800 overflow-hidden flex flex-col justify-between shadow-sm bg-white dark:bg-gray-900 hover:shadow-md transition-shadow group`}
                >
                  {/* Theme Top Banner */}
                  <div className={`h-24 bg-gradient-to-br ${bgCls} p-4 flex flex-col justify-between relative`}>
                    <div className="flex items-center justify-between w-full">
                      <span className="text-[9px] bg-white/20 text-white backdrop-blur-sm border border-white/10 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider w-fit">
                        {room.category}
                      </span>
                      <span className="text-[10px] bg-black/40 backdrop-blur-sm text-white px-2 py-0.5 rounded-md font-bold uppercase tracking-wider">
                        Code: {room.join_code}
                      </span>
                    </div>
                    <h3 className="font-extrabold text-white text-base leading-tight truncate">
                      {room.name}
                    </h3>
                  </div>

                  {/* Room Details */}
                  <div className="p-5 flex-1 flex flex-col justify-between gap-4">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-gray-400 uppercase tracking-wider">Capacity limit</span>
                      <span className={`flex items-center gap-1 ${isFull ? 'text-red-500' : 'text-indigo-600 dark:text-indigo-400'}`}>
                        <Users className="w-3.5 h-3.5" />
                        {room.active_count || 0} / {room.max_capacity} Occupied
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-[10px] text-gray-500 dark:text-gray-400 font-bold">Zoom-style grid mode. Mic disabled.</span>
                    </div>

                    <Link
                      href={`/dashboard/study/${room.id}`}
                      className={`w-full py-3 text-center rounded-xl text-xs font-black shadow-sm transition-all flex items-center justify-center gap-2 ${isFull ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed' : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-950/20 dark:hover:bg-indigo-950/40 dark:text-indigo-400'}`}
                    >
                      Join Cabin →
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Create Custom Room Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <form onSubmit={handleCreateRoom} className="bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-800 rounded-3xl shadow-2xl w-full max-w-md p-6 relative animate-in zoom-in-95 duration-200">
              <h2 className="text-xl font-black text-gray-900 dark:text-white mb-1 flex items-center gap-2">
                Launch Free Private Study Cabin <Sparkles className="w-5 h-5 text-indigo-500" />
              </h2>
              <p className="text-xs text-gray-400 mb-6 font-medium">Create a free study table and invite up to 10 friends.</p>

              <div className="space-y-4 mb-6">
                {/* Room Name */}
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Cabin Name</label>
                  <input
                    type="text"
                    required
                    value={newRoomName}
                    onChange={(e) => setNewRoomName(e.target.value)}
                    placeholder="e.g. UPSC revision cabin"
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl text-sm font-bold text-gray-900 dark:text-white outline-none focus:border-indigo-500"
                  />
                </div>

                {/* Category */}
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Category Focus</label>
                  <select
                    value={newRoomCat}
                    onChange={(e) => setNewRoomCat(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl text-sm font-bold text-gray-900 dark:text-white outline-none focus:border-indigo-500"
                  >
                    {Object.keys(CATEGORY_MAP).filter(k => k !== "all").map(k => (
                      <option key={k} value={k}>{CATEGORY_MAP[k].slice(3)}</option>
                    ))}
                  </select>
                </div>

                {/* Theme */}
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Room Theme Ambient</label>
                  <select
                    value={newRoomTheme}
                    onChange={(e) => setNewRoomTheme(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl text-sm font-bold text-gray-900 dark:text-white outline-none focus:border-indigo-500"
                  >
                    <option value="library">📚 Classic Library</option>
                    <option value="cafe">☕ Rainy Coffee Shop</option>
                    <option value="forest">🌲 Forest Sanctuary</option>
                    <option value="space">🌌 Space Focus Cabin</option>
                  </select>
                </div>

                {/* Capacity */}
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Max Capacity</label>
                  <select
                    value={newRoomCapacity}
                    onChange={(e) => setNewRoomCapacity(parseInt(e.target.value))}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl text-sm font-bold text-gray-900 dark:text-white outline-none focus:border-indigo-500"
                  >
                    <option value={4}>4 Members</option>
                    <option value={6}>6 Members</option>
                    <option value={8}>8 Members</option>
                    <option value={10}>10 Members (Max)</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-bold text-sm transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-750 text-white rounded-xl font-extrabold text-sm transition-all flex items-center justify-center gap-2"
                >
                  {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  Create Free Room
                </button>
              </div>
            </form>
          </div>
        )}

      </div>
    </div>
  );
}
