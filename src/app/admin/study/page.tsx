"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { 
  ShieldAlert, Trash2, CameraOff, LogOut, CheckCircle, 
  Loader2, AlertCircle, Users, RefreshCw, BarChart2, Eye
} from "lucide-react";
import toast from "react-hot-toast";

interface ActiveRoom {
  id: string;
  name: string;
  category: string;
  theme_name: string;
  active_count: number;
}

interface ReportRecord {
  id: string;
  reason: string;
  created_at: string;
  room_id: string;
  reporter_id: string;
  reported_user_id: string;
  room_name?: string;
  reported_name?: string;
  reporter_name?: string;
}

export default function AdminStudyModerationPage() {
  const [reports, setReports] = useState<ReportRecord[]>([]);
  const [rooms, setRooms] = useState<ActiveRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Tab views
  const [activeTab, setActiveTab] = useState<"reports" | "rooms">("reports");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setRefreshing(true);
    try {
      // 1. Fetch active rooms & count active participants
      const { data: roomsData, error: roomsErr } = await supabase
        .from("study_rooms")
        .select("*");

      if (roomsErr) throw roomsErr;

      const { data: sessionsData, error: sessionsErr } = await supabase
        .from("study_session_users")
        .select("room_id");

      if (sessionsErr) throw sessionsErr;

      const countsMap: Record<string, number> = {};
      sessionsData?.forEach((sess: any) => {
        countsMap[sess.room_id] = (countsMap[sess.room_id] || 0) + 1;
      });

      const formattedRooms = (roomsData || []).map((room: any) => ({
        ...room,
        active_count: countsMap[room.id] || 0
      }));
      setRooms(formattedRooms);

      // 2. Fetch reports
      const { data: reportsData, error: reportsErr } = await supabase
        .from("study_room_reports")
        .select("*")
        .order("created_at", { ascending: false });

      if (reportsErr) throw reportsErr;

      // Hydrate reported details with profile names
      const hydratedReports: ReportRecord[] = [];
      for (const rep of (reportsData || [])) {
        // Fetch reporter name
        const { data: reporterProfile } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("id", rep.reporter_id)
          .single();

        // Fetch reported user name
        const { data: reportedProfile } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("id", rep.reported_user_id)
          .single();

        // Fetch room name
        const roomMatch = roomsData?.find(r => r.id === rep.room_id);

        hydratedReports.push({
          ...rep,
          room_name: roomMatch?.name || "Deleted Table",
          reporter_name: reporterProfile?.full_name || "Aspirant_" + rep.reporter_id.slice(-4),
          reported_name: reportedProfile?.full_name || "Aspirant_" + rep.reported_user_id.slice(-4)
        });
      }

      setReports(hydratedReports);
    } catch (err: any) {
      console.error("Admin moderation fetch error:", err);
      toast.error("Failed to sync live moderation dashboard.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Kick user out of the table session (triggers client-side check to boot them)
  const handleKickUser = async (userId: string, reportId?: string) => {
    try {
      const { error } = await supabase
        .from("study_session_users")
        .delete()
        .eq("user_id", userId);

      if (error) throw error;

      toast.success("Candidate disconnected from the study room.");
      
      // If actioned via a report, resolve/delete that report record
      if (reportId) {
        await supabase
          .from("study_room_reports")
          .delete()
          .eq("id", reportId);
      }
      
      fetchData();
    } catch (err: any) {
      toast.error(err.message || "Failed to disconnect candidate.");
    }
  };

  // Resolve/Dismiss report (no action needed)
  const handleDismissReport = async (reportId: string) => {
    try {
      const { error } = await supabase
        .from("study_room_reports")
        .delete()
        .eq("id", reportId);

      if (error) throw error;
      toast.success("Report dismissed.");
      fetchData();
    } catch (err: any) {
      toast.error(err.message || "Failed to dismiss report.");
    }
  };

  // Archive / Delete Room
  const handleDeleteRoom = async (roomId: string) => {
    if (!confirm("Are you sure you want to delete this study table? This will kick out all active members.")) return;
    try {
      const { error } = await supabase
        .from("study_rooms")
        .delete()
        .eq("id", roomId);

      if (error) throw error;
      toast.success("Study Room archived.");
      fetchData();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete room.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="text-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mx-auto" />
          <p className="text-xs font-bold text-gray-500">Loading Moderation Desk...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-200 dark:border-gray-800 pb-5">
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-2">
            Study Room Moderation Desk <ShieldAlert className="w-6 h-6 text-red-500" />
          </h1>
          <p className="text-xs text-gray-400 font-medium">
            Monitor live active streams, review student complaints, and enforce content guidelines.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchData}
            disabled={refreshing}
            className="p-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl hover:bg-gray-550 transition-colors flex items-center gap-2 text-xs font-bold text-gray-600 dark:text-gray-400"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? "Refreshing..." : "Sync Live Status"}
          </button>
        </div>
      </div>

      {/* Stats Counter Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Active Tables</span>
            <Users className="w-5 h-5 text-indigo-500" />
          </div>
          <p className="text-2xl font-black text-gray-900 dark:text-white">{rooms.length}</p>
          <p className="text-[10px] text-gray-400 mt-1">Total active spaces monitored</p>
        </div>

        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Active Students</span>
            <Users className="w-5 h-5 text-emerald-500" />
          </div>
          <p className="text-2xl font-black text-gray-900 dark:text-white">
            {rooms.reduce((acc, r) => acc + (r.active_count || 0), 0)}
          </p>
          <p className="text-[10px] text-gray-400 mt-1">Aspirants currently live on cameras</p>
        </div>

        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Pending Abuse Flags</span>
            <ShieldAlert className="w-5 h-5 text-red-500 animate-pulse" />
          </div>
          <p className="text-2xl font-black text-gray-900 dark:text-white">{reports.length}</p>
          <p className="text-[10px] text-gray-400 mt-1">Requires immediate manual verification</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-800 gap-4">
        {[
          { key: "reports", label: `⚠️ Abuse Reports Queue (${reports.length})` },
          { key: "rooms",   label: `🏛️ Active Study Tables (${rooms.length})` }
        ].map(tb => (
          <button
            key={tb.key}
            onClick={() => setActiveTab(tb.key as any)}
            className={`pb-3 text-sm font-black transition-all ${activeTab === tb.key ? 'border-b-2 border-indigo-600 text-indigo-600 dark:text-indigo-400' : 'text-gray-400 hover:text-gray-600'}`}
          >
            {tb.label}
          </button>
        ))}
      </div>

      {/* Tab Contents */}
      {activeTab === "reports" && (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden shadow-sm">
          {reports.length === 0 ? (
            <div className="p-12 text-center">
              <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
              <h3 className="text-base font-bold text-gray-900 dark:text-white">Clean Slate!</h3>
              <p className="text-xs text-gray-400 mt-1">There are no pending abuse flags or active complaints in study rooms.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-150 dark:divide-gray-800">
              {reports.map((rep) => (
                <div key={rep.id} className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-gray-50 dark:hover:bg-gray-850 transition-colors">
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-black bg-red-100 dark:bg-red-950/30 text-red-500 px-2 py-0.5 rounded">
                        Abuse Flag
                      </span>
                      <span className="text-xs font-bold text-gray-500 dark:text-gray-400">
                        Room: <strong className="text-gray-700 dark:text-gray-300">{rep.room_name}</strong>
                      </span>
                    </div>

                    <p className="text-sm font-black text-gray-900 dark:text-white">
                      Reported: <span className="text-red-500 font-extrabold">{rep.reported_name}</span> 
                      <span className="text-xs text-gray-400 font-medium"> (Reported by: {rep.reporter_name})</span>
                    </p>

                    <p className="text-xs text-gray-500 dark:text-gray-400 italic">
                      Reason: "{rep.reason}"
                    </p>

                    <p className="text-[10px] text-gray-400 font-bold">
                      Reported At: {new Date(rep.created_at).toLocaleString()}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleKickUser(rep.reported_user_id, rep.id)}
                      className="py-2 px-3 bg-red-50 hover:bg-red-100 text-red-600 dark:bg-red-950/20 dark:hover:bg-red-950/40 dark:text-red-400 rounded-xl text-xs font-black transition-all flex items-center gap-1.5"
                    >
                      <CameraOff className="w-3.5 h-3.5" /> Disconnect & Resolve
                    </button>
                    <button
                      onClick={() => handleDismissReport(rep.id)}
                      className="py-2 px-3 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-xl text-xs font-bold transition-all"
                    >
                      Dismiss Flag
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "rooms" && (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden shadow-sm">
          {rooms.length === 0 ? (
            <div className="p-12 text-center">
              <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-gray-900 dark:text-white">No Active Rooms</h3>
              <p className="text-xs text-gray-400 mt-1">There are no study tables created in the system database.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-150 dark:divide-gray-800">
              {rooms.map((room) => (
                <div key={room.id} className="p-5 flex items-center justify-between gap-4 hover:bg-gray-50 dark:hover:bg-gray-850 transition-colors">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-gray-800 dark:text-white">{room.name}</span>
                      <span className="text-[10px] bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded font-black uppercase tracking-wider">
                        {room.category}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 font-medium">
                      Theme: {room.theme_name} | Active Candidates: <strong className="text-indigo-500">{room.active_count} members</strong>
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleDeleteRoom(room.id)}
                      className="p-2.5 bg-red-50 hover:bg-red-100 text-red-600 dark:bg-red-950/20 dark:hover:bg-red-950/40 dark:text-red-400 rounded-xl transition-all"
                      title="Archive Room"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

    </div>
  );
}
