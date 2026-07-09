"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import {
  Users, Search, PlusCircle, Loader2,
  Hash, Globe, Lock, ChevronRight, Flame,
  BookOpen, Zap
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

// Public Hall Room UUID — must match the seeded study_rooms row in Supabase DB.
// Reads from env var if set, otherwise falls back to the seed UUID.
const PUBLIC_HALL_ID =
  (process.env.NEXT_PUBLIC_PUBLIC_HALL_ROOM_ID &&
   process.env.NEXT_PUBLIC_PUBLIC_HALL_ROOM_ID !== "public-hall")
    ? process.env.NEXT_PUBLIC_PUBLIC_HALL_ROOM_ID
    : "00000000-0000-0000-0000-000000000001";


const CATEGORIES = [
  { key: "all", label: "All Rooms", emoji: "🌐" },
  { key: "ssc", label: "SSC", emoji: "🏛️" },
  { key: "upsc", label: "UPSC", emoji: "🎖️" },
  { key: "railway", label: "Railway", emoji: "🚂" },
  { key: "banking", label: "Banking", emoji: "🏦" },
  { key: "general", label: "General", emoji: "📚" },
];

const AVATAR_COLORS = [
  "from-indigo-500 to-purple-600",
  "from-pink-500 to-rose-600",
  "from-emerald-500 to-teal-600",
  "from-amber-500 to-orange-600",
];

// Simulated live user previews for empty rooms visual
const PREVIEW_NAMES = ["Aarav", "Priya", "Rohit", "Ananya", "Kiran", "Sneha", "Vikram", "Pooja"];

function getAvatarColor(name: string) {
  return AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];
}

export default function StudyLobbyPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [rooms, setRooms] = useState<StudyRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCat, setSelectedCat] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const [inputJoinCode, setInputJoinCode] = useState("");
  const [joiningByCode, setJoiningByCode] = useState(false);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newRoomName, setNewRoomName] = useState("");
  const [newRoomCat, setNewRoomCat] = useState("general");
  const [newRoomCapacity, setNewRoomCapacity] = useState(8);
  const [creating, setCreating] = useState(false);

  const [publicActiveCount, setPublicActiveCount] = useState(0);

  useEffect(() => {
    const initLobby = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          router.push("/login?redirect=/dashboard/study");
          return;
        }
        const { data: profile } = await supabase
          .from("profiles").select("full_name").eq("id", session.user.id).single();
        if (!profile?.full_name) {
          router.push("/profile-setup?redirect=/dashboard/study");
          return;
        }
        setUser(session.user);
        await fetchRooms();
      } catch (err) {
        console.error("Lobby init error:", err);
        setLoading(false);
      }
    };

    const safetyTimer = setTimeout(() => setLoading(false), 4000);
    initLobby();

    const channel = supabase.channel("study_rooms_lobby")
      .on("postgres_changes", { event: "*", schema: "public", table: "study_session_users" }, () => {
        fetchRooms();
      }).subscribe();

    return () => {
      clearTimeout(safetyTimer);
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchRooms = async () => {
    try {
      const { data: roomsData } = await supabase
        .from("study_rooms").select("*").order("created_at", { ascending: true });
      const { data: sessionsData } = await supabase
        .from("study_session_users").select("room_id");

      const countsMap: Record<string, number> = {};
      sessionsData?.forEach((s: any) => {
        countsMap[s.room_id] = (countsMap[s.room_id] || 0) + 1;
      });

      setPublicActiveCount(countsMap[PUBLIC_HALL_ID] || 0);
      setRooms((roomsData || []).map((r: any) => ({ ...r, active_count: countsMap[r.id] || 0 })));
    } catch (err) {
      console.error("Fetch rooms error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoomName.trim()) { toast.error("Please enter a room name."); return; }
    setCreating(true);
    const genCode = Math.floor(100000 + Math.random() * 900000).toString();
    try {
      const { data, error } = await supabase.from("study_rooms").insert({
        name: newRoomName.trim(),
        category: newRoomCat,
        theme_name: "library",
        max_capacity: newRoomCapacity,
        is_private: true,
        join_code: genCode,
        created_by: user.id
      }).select().single();
      if (error) throw error;
      toast.success(`Room created! Code: ${genCode} 🎉`);
      setShowCreateModal(false);
      setNewRoomName("");
      router.push(`/dashboard/study/${data.id}`);
    } catch (err: any) {
      toast.error(err.message || "Failed to create room.");
    } finally {
      setCreating(false);
    }
  };

  const handleJoinByCode = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = inputJoinCode.trim();
    if (!code) { toast.error("Enter a room code."); return; }
    setJoiningByCode(true);
    try {
      const { data, error } = await supabase
        .from("study_rooms").select("id").eq("join_code", code).single();
      if (error || !data) { toast.error("Invalid room code."); return; }
      router.push(`/dashboard/study/${data.id}`);
    } catch { toast.error("Invalid code."); }
    finally { setJoiningByCode(false); }
  };

  const filteredRooms = rooms.filter(r => {
    if (r.id === PUBLIC_HALL_ID) return false;
    if (selectedCat !== "all" && r.category !== selectedCat) return false;
    if (searchQuery && !r.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-[#030712] flex items-center justify-center">
        <div className="text-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-400 mx-auto" />
          <p className="text-xs font-bold text-gray-600">Loading study rooms...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#030712] text-white">
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">

        {/* ── PAGE HEADER ─────────────────── */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-white flex items-center gap-2">
              <BookOpen className="w-6 h-6 text-indigo-400" />
              Silent Study Rooms
            </h1>
            <p className="text-xs text-gray-500 mt-1">Study with thousands of aspirants across India. Camera on, mic off.</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black text-xs transition-all"
          >
            <PlusCircle className="w-4 h-4" /> Create Private Room
          </button>
        </div>

        {/* ── NATIONAL PUBLIC HALL ─────────── */}
        <div className="relative rounded-3xl overflow-hidden border border-indigo-500/20 bg-gradient-to-r from-indigo-950/80 to-purple-950/50">
          {/* Background animated orbs */}
          <div className="absolute top-0 left-0 w-64 h-64 bg-indigo-600/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
          <div className="absolute bottom-0 right-0 w-48 h-48 bg-purple-600/10 rounded-full blur-3xl translate-x-1/2 translate-y-1/2 pointer-events-none" />

          <div className="relative p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Open 24/7 • National Public Hall</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white">Enter Main Study Hall</h2>
              <p className="text-xs text-gray-400 max-w-md leading-relaxed">
                Join hundreds of aspirants studying silently on camera. See everyone in Zoom-style grids. Encourage each other. All free.
              </p>

              {/* Simulated live avatars */}
              <div className="flex items-center gap-2">
                <div className="flex -space-x-2">
                  {PREVIEW_NAMES.slice(0, 5).map((name, i) => (
                    <div
                      key={i}
                      className={`w-7 h-7 rounded-full bg-gradient-to-br ${getAvatarColor(name)} border-2 border-indigo-950 flex items-center justify-center text-[8px] font-black text-white`}
                    >
                      {name[0]}
                    </div>
                  ))}
                </div>
                <span className="text-xs text-gray-400 font-bold">
                  <span className="text-white font-black">{publicActiveCount}</span> studying right now
                </span>
              </div>
            </div>

            <Link
              href="/dashboard/study/hall"
              className="shrink-0 flex items-center gap-2 px-6 py-3.5 bg-white text-indigo-900 hover:bg-indigo-50 font-black rounded-2xl text-sm transition-all shadow-lg shadow-indigo-950/50"
            >
              Enter Hall <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* ── JOIN BY CODE ─────────────────── */}
        <div className="bg-[#080d1a] border border-white/5 rounded-2xl p-4">
          <form onSubmit={handleJoinByCode} className="flex flex-col sm:flex-row items-center gap-3">
            <div className="flex items-center gap-3 flex-1">
              <div className="w-9 h-9 bg-indigo-600/20 text-indigo-400 rounded-xl flex items-center justify-center shrink-0">
                <Hash className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-black text-white">Join Friend's Private Room</p>
                <p className="text-[10px] text-gray-600">Enter the 6-digit room code</p>
              </div>
            </div>
            <div className="flex gap-2 w-full sm:w-72">
              <input
                type="text"
                placeholder="Enter 6-digit code"
                value={inputJoinCode}
                onChange={(e) => setInputJoinCode(e.target.value)}
                className="flex-1 px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm font-black text-white placeholder-gray-600 outline-none focus:border-indigo-500 text-center tracking-widest uppercase"
                maxLength={6}
              />
              <button
                type="submit"
                disabled={joiningByCode}
                className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-black transition-all"
              >
                {joiningByCode ? <Loader2 className="w-4 h-4 animate-spin" /> : "Join"}
              </button>
            </div>
          </form>
        </div>

        {/* ── CATEGORY FILTERS + SEARCH ─────── */}
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <div className="flex gap-2 overflow-x-auto pb-1 w-full sm:w-auto">
            {CATEGORIES.map(cat => (
              <button
                key={cat.key}
                onClick={() => setSelectedCat(cat.key)}
                className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition-all ${selectedCat === cat.key
                    ? "bg-indigo-600 text-white"
                    : "bg-white/5 text-gray-500 hover:text-white border border-white/5 hover:border-white/10"
                  }`}
              >
                {cat.emoji} {cat.label}
              </button>
            ))}
          </div>
          <div className="relative w-full sm:w-56">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-600" />
            <input
              type="text"
              placeholder="Search rooms..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white/5 border border-white/5 rounded-xl text-xs font-bold text-white placeholder-gray-600 outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        {/* ── PRIVATE ROOMS GRID ───────────── */}
        {filteredRooms.length === 0 ? (
          <div className="bg-[#080d1a] border border-white/5 rounded-3xl py-16 text-center">
            <Globe className="w-10 h-10 text-gray-700 mx-auto mb-3" />
            <p className="text-sm font-black text-gray-500">No private rooms found</p>
            <p className="text-xs text-gray-700 mt-1 mb-5">Create one and share the code with friends</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-xs transition-all"
            >
              Create Free Room
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredRooms.map((room) => {
              const isFull = (room.active_count || 0) >= room.max_capacity;
              return (
                <div
                  key={room.id}
                  className="bg-[#080d1a] border border-white/5 hover:border-white/10 rounded-3xl overflow-hidden transition-all group"
                >
                  {/* Colored top strip */}
                  <div className={`h-1 w-full ${isFull ? "bg-red-600" : "bg-indigo-600"}`} />

                  <div className="p-5 space-y-4">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-xs font-black text-white leading-tight">{room.name}</p>
                        <div className="flex items-center gap-1.5 mt-1">
                          <span className="text-[9px] text-gray-500 font-bold uppercase">{room.category}</span>
                          {room.is_private && <Lock className="w-2.5 h-2.5 text-gray-600" />}
                        </div>
                      </div>
                      <span className="text-[9px] bg-white/5 text-gray-500 border border-white/5 px-2 py-0.5 rounded-lg font-black shrink-0">
                        #{room.join_code}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className={`w-1.5 h-1.5 rounded-full ${isFull ? "bg-red-400" : "bg-emerald-400 animate-pulse"}`} />
                        <span className="text-[10px] font-black text-gray-400">
                          {room.active_count || 0}/{room.max_capacity} studying
                        </span>
                      </div>
                      <Link
                        href={`/dashboard/study/${room.id}`}
                        className={`flex items-center gap-1 py-1.5 px-3 rounded-xl text-[10px] font-black transition-all ${isFull
                            ? "bg-white/5 text-gray-600 pointer-events-none"
                            : "bg-indigo-600/20 text-indigo-300 hover:bg-indigo-600/40 border border-indigo-500/20"
                          }`}
                      >
                        {isFull ? "Full" : <>Join <ChevronRight className="w-3 h-3" /></>}
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── CREATE ROOM MODAL ───────────────── */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <form
            onSubmit={handleCreateRoom}
            className="bg-[#080d1a] border border-white/10 rounded-3xl shadow-2xl w-full max-w-md p-7 space-y-5"
          >
            <div>
              <h2 className="text-xl font-black text-white flex items-center gap-2">
                <Zap className="w-5 h-5 text-indigo-400" /> Create Private Study Cabin
              </h2>
              <p className="text-xs text-gray-500 mt-1">Free. Share the auto-generated code with up to 10 friends.</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1.5">Room Name</label>
                <input
                  type="text"
                  required
                  value={newRoomName}
                  onChange={(e) => setNewRoomName(e.target.value)}
                  placeholder="e.g. UPSC Revision Group"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-sm font-bold text-white placeholder-gray-600 outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1.5">Category</label>
                  <select
                    value={newRoomCat}
                    onChange={(e) => setNewRoomCat(e.target.value)}
                    className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-2xl text-xs font-bold text-white outline-none focus:border-indigo-500"
                  >
                    <option value="ssc">SSC</option>
                    <option value="upsc">UPSC</option>
                    <option value="railway">Railway</option>
                    <option value="banking">Banking</option>
                    <option value="general">General</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1.5">Max Seats</label>
                  <select
                    value={newRoomCapacity}
                    onChange={(e) => setNewRoomCapacity(parseInt(e.target.value))}
                    className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-2xl text-xs font-bold text-white outline-none focus:border-indigo-500"
                  >
                    <option value={4}>4 members</option>
                    <option value={6}>6 members</option>
                    <option value={8}>8 members</option>
                    <option value={10}>10 members</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-1">
              <button type="button" onClick={() => setShowCreateModal(false)}
                className="flex-1 py-3 bg-white/5 border border-white/10 text-gray-400 rounded-2xl font-bold text-sm hover:bg-white/10 transition-all">
                Cancel
              </button>
              <button type="submit" disabled={creating}
                className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black text-sm transition-all flex items-center justify-center gap-2">
                {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create Room"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
