"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { 
  Users, Flame, Search, PlusCircle, ArrowLeft, Loader2, 
  Sparkles, Award, Shield, BookOpen, Volume2, Globe 
} from "lucide-react";
import toast from "react-hot-toast";

interface StudyRoom {
  id: string;
  name: string;
  category: string;
  theme_name: string;
  max_capacity: number;
  is_private: boolean;
  active_count?: number;
}

const CATEGORY_MAP: Record<string, string> = {
  all: "🌐 All Rooms",
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

export default function StudyLobbyPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [rooms, setRooms] = useState<StudyRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCat, setSelectedCat] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Create room modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newRoomName, setNewRoomName] = useState("");
  const [newRoomCat, setNewRoomCat] = useState("general");
  const [newRoomTheme, setNewRoomTheme] = useState("library");
  const [newRoomCapacity, setNewRoomCapacity] = useState(6);
  const [creating, setCreating] = useState(false);

  // User Stats (Statically simulated for gamified retention)
  const [userCoins, setUserCoins] = useState(120);
  const [streakDays, setStreakDays] = useState(4);

  useEffect(() => {
    const initLobby = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Please login to access study rooms.");
        router.push("/login?redirect=/dashboard/study");
        return;
      }
      setUser(session.user);
      await fetchRooms();
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

    if (userCoins < 50) {
      toast.error("You need at least 50 coins to create a custom study room!");
      return;
    }

    setCreating(true);
    try {
      const { data, error } = await supabase
        .from("study_rooms")
        .insert({
          name: newRoomName.trim(),
          category: newRoomCat,
          theme_name: newRoomTheme,
          max_capacity: newRoomCapacity,
          created_by: user.id
        })
        .select()
        .single();

      if (error) throw error;

      // Deduct coins for gamification conversion
      setUserCoins(prev => prev - 50);
      toast.success("Custom Study Room Created! 🎉 (50 Coins Deducted)");
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

  const filteredRooms = rooms.filter(room => {
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
              Silent Video Study Room <Sparkles className="w-5 h-5 text-yellow-300" />
            </h1>
            <p className="text-indigo-200 text-sm font-medium opacity-90 max-w-xl">
              Study live on camera with thousands of aspirants across India in complete silence. Microphones are permanently muted to guarantee zero distractions.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0 z-10">
            <Link href="/dashboard" className="px-5 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl font-bold transition-all text-sm flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" /> Back
            </Link>
            <button 
              onClick={() => setShowCreateModal(true)}
              className="px-5 py-2.5 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-400 hover:to-purple-500 text-white rounded-xl font-black transition-all text-sm flex items-center gap-2 shadow-lg shadow-purple-950/50"
            >
              <PlusCircle className="w-4 h-4" /> Create Table
            </button>
          </div>
        </div>

        {/* User Status Bar (Gamified Retentions) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          
          {/* Streak */}
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-4 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-orange-50 dark:bg-orange-950/30 text-orange-500 rounded-xl">
                <Flame className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Your Daily Streak</p>
                <p className="text-lg font-black text-gray-800 dark:text-white">{streakDays} Days Studied</p>
              </div>
            </div>
            <span className="text-xs font-bold text-orange-600 bg-orange-50 dark:bg-orange-950/30 px-2.5 py-1 rounded-lg">Active</span>
          </div>

          {/* Coins */}
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-4 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-yellow-50 dark:bg-yellow-950/30 text-yellow-500 rounded-xl">
                <Award className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Rojgar Coins</p>
                <p className="text-lg font-black text-gray-800 dark:text-white">{userCoins} Coins</p>
              </div>
            </div>
            <button className="text-xs font-extrabold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/30 px-3 py-1.5 rounded-lg hover:underline">
              Shop Store
            </button>
          </div>

          {/* Guidelines */}
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-4 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-500 rounded-xl">
                <Shield className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Content Security</p>
                <p className="text-sm font-black text-gray-800 dark:text-white">AI Real-time Moderation</p>
              </div>
            </div>
            <span className="text-[10px] font-extrabold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 px-2 py-0.5 rounded uppercase tracking-wider">Active</span>
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
              placeholder="Search table or cabin..."
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
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">No active tables found</h3>
            <p className="text-sm text-gray-500 max-w-xs mx-auto mt-1 mb-6">
              Create a custom private/public study table and invite your friends to start study sessions.
            </p>
            <button 
              onClick={() => setShowCreateModal(true)}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs transition-colors"
            >
              Launch Table
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
                    <span className="absolute top-3 right-3 text-xs bg-black/30 backdrop-blur-sm text-white px-2 py-0.5 rounded-md font-bold uppercase tracking-widest">
                      {room.theme_name}
                    </span>
                    <span className="text-[9px] bg-white/20 text-white backdrop-blur-sm border border-white/10 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider w-fit">
                      {room.category}
                    </span>
                    <h3 className="font-extrabold text-white text-base leading-tight truncate">
                      {room.name}
                    </h3>
                  </div>

                  {/* Room Details */}
                  <div className="p-5 flex-1 flex flex-col justify-between gap-4">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-gray-400 uppercase tracking-wider">Participants</span>
                      <span className={`flex items-center gap-1 ${isFull ? 'text-red-500' : 'text-indigo-600 dark:text-indigo-400'}`}>
                        <Users className="w-3.5 h-3.5" />
                        {room.active_count || 0} / {room.max_capacity} Occupied
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-[10px] text-gray-500 dark:text-gray-400 font-bold">Mic disabled by default for silent focus</span>
                    </div>

                    <Link
                      href={`/dashboard/study/${room.id}`}
                      className={`w-full py-3 text-center rounded-xl text-xs font-black shadow-sm transition-all flex items-center justify-center gap-2 ${isFull ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed' : 'bg-indigo-550 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-950/20 dark:hover:bg-indigo-950/40 dark:text-indigo-400'}`}
                    >
                      Join Table →
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
                Launch Custom Study Table <Sparkles className="w-5 h-5 text-yellow-500" />
              </h2>
              <p className="text-xs text-gray-400 mb-6 font-medium">Creating a custom table costs 50 Rojgar Coins.</p>

              <div className="space-y-4 mb-6">
                {/* Room Name */}
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Table Name</label>
                  <input
                    type="text"
                    required
                    value={newRoomName}
                    onChange={(e) => setNewRoomName(e.target.value)}
                    placeholder="e.g. My SSC Revision Table"
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
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Table Capacity</label>
                  <select
                    value={newRoomCapacity}
                    onChange={(e) => setNewRoomCapacity(parseInt(e.target.value))}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl text-sm font-bold text-gray-900 dark:text-white outline-none focus:border-indigo-500"
                  >
                    <option value={4}>4 Seats (Highly Focused)</option>
                    <option value={6}>6 Seats (Recommended)</option>
                    <option value={10}>10 Seats (Study Group)</option>
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
                  className="flex-1 py-3 bg-indigo-650 bg-indigo-600 hover:bg-indigo-750 text-white rounded-xl font-extrabold text-sm transition-all flex items-center justify-center gap-2"
                >
                  {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  Launch (-50)
                </button>
              </div>
            </form>
          </div>
        )}

      </div>
    </div>
  );
}
