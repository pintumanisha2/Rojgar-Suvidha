"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import {
  Briefcase, FileText, BookOpen, Users,
  PlusCircle, TrendingUp, Clock, CheckCircle2,
  ArrowRight, AlertCircle, BellRing
} from "lucide-react";


// FIX: Removed hardcoded stats array (was always showing 0). Now using dynamic statCounts state fetched from Supabase.

const quickActions = [
  { label: "Create New Post", icon: PlusCircle, href: "/admin/jobs/new", color: "bg-indigo-600 hover:bg-indigo-700 text-white" },
  { label: "Send Job Alerts", icon: BellRing, href: "/admin/notifications", color: "bg-blue-600 hover:bg-blue-700 text-white" },
  { label: "Manage Banners", icon: FileText, href: "/admin/banners", color: "bg-green-600 hover:bg-green-700 text-white" },
  { label: "View Complaints", icon: AlertCircle, href: "/admin/complaints", color: "bg-orange-500 hover:bg-orange-600 text-white" },
  { label: "View Applications", icon: Users, href: "/admin/applications", color: "bg-gray-800 hover:bg-gray-900 text-white" },
];

export default function AdminDashboardPage() {
  const [recentJobs, setRecentJobs] = useState<any[]>([]);
  const [pendingRequests, setPendingRequests] = useState(0);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [fillerStats, setFillerStats] = useState<any>({ today: 0, month: 0, total: 0 });
  const [allFillersStats, setAllFillersStats] = useState<any[]>([]);
  const [writerStats, setWriterStats] = useState<any>({ today: 0, month: 0, total: 0 });
  const [allWritersStats, setAllWritersStats] = useState<any[]>([]);
  const [currentTime, setCurrentTime] = useState<Date | null>(null);
  // FIX: Dynamic stat counts instead of hardcoded 0
  const [statCounts, setStatCounts] = useState({ activeJobs: 0, admitCards: 0, results: 0, applyRequests: 0 });

  // Live Clock
  useEffect(() => {
    setCurrentTime(new Date());
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const getGreeting = () => {
    if (!currentTime) return "Welcome back";
    const hour = currentTime.getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  };

  const exportLeaderboardCSV = (type: 'fillers' | 'writers') => {
    const data = type === 'fillers' ? allFillersStats : allWritersStats;
    if (data.length === 0) return;
    
    const headers = ["Employee Email", "Completed Today", "Completed This Month", "Lifetime Total"];
    if (type === 'fillers') headers.push("Estimated Earnings (₹50/form)");

    const rows = data.map(row => {
      const baseRow = [row.email, row.today, row.month, row.total];
      if (type === 'fillers') baseRow.push(`₹${row.total * 50}`);
      return baseRow;
    });

    const csvContent = [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `${type}_leaderboard_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        let currentRole = null;
        let email = session?.user.email || null;
        
        if (email) {
          setUserEmail(email);
          const { data } = await supabase.from('admin_roles').select('role, name').eq('email', email).single();
          currentRole = data?.role || null;
          if (data?.name) setUserName(data.name);
          else setUserName(email.split('@')[0]);

          if (email === 'admin@rojgarsuvidha.com' || email === 'superadmin@rojgarsuvidha.com') {
            currentRole = 'super_admin';
            if (!data?.name) setUserName("Super Admin");
          }
          setUserRole(currentRole);
        }

        // FIX: Fetch real stats from Supabase (was hardcoded to 0 before)
        const [activeJobsRes, admitCardsRes, resultsRes, applyReqRes] = await Promise.all([
          supabase.from("jobs").select("*", { count: "exact", head: true }).eq("status", "published"),
          supabase.from("jobs").select("*", { count: "exact", head: true }).eq("category", "admit-card").eq("status", "published"),
          supabase.from("jobs").select("*", { count: "exact", head: true }).eq("category", "result").eq("status", "published"),
          supabase.from("apply_for_me_requests").select("*", { count: "exact", head: true }).in("status", ["pending", "paid"]),
        ]);
        setStatCounts({
          activeJobs: activeJobsRes.count || 0,
          admitCards: admitCardsRes.count || 0,
          results: resultsRes.count || 0,
          applyRequests: applyReqRes.count || 0,
        });

        // Fetch pending apply requests (for alert banner)
        const { count } = await supabase
          .from("apply_for_me_requests")
          .select("*", { count: "exact", head: true })
          .in("status", ["pending", "paid"]); // FIX: was only checking "Pending" (capital P)
        
        if (count !== null) setPendingRequests(count);

        // Fetch recent jobs
        const { data: jobs } = await supabase
          .from("jobs")
          .select("id, title, category, status, created_at")
          .order("created_at", { ascending: false })
          .limit(5);
        if (jobs) setRecentJobs(jobs);

        // Fetch Form Filler Stats
        if (currentRole === 'form_filler' && email) {
          const { data: requests } = await supabase
            .from("apply_for_me_requests")
            .select("created_at")
            .eq("assigned_to", email)
            .eq("status", "completed");
            
          if (requests) {
            const now = new Date();
            let today = 0, month = 0, total = requests.length;
            requests.forEach(r => {
              const d = new Date(r.created_at);
              if (d.getDate() === now.getDate() && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()) today++;
              if (d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()) month++;
            });
            setFillerStats({ today, month, total });
          }
        }

        // Fetch Content Writer Stats
        if (currentRole === 'content_writer' && email) {
          const { data: jobs } = await supabase
            .from("jobs")
            .select("created_at")
            .eq("created_by", email);
            
          if (jobs) {
            const now = new Date();
            let today = 0, month = 0, total = jobs.length;
            jobs.forEach(r => {
              const d = new Date(r.created_at);
              if (d.getDate() === now.getDate() && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()) today++;
              if (d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()) month++;
            });
            setWriterStats({ today, month, total });
          }
        }

        // Fetch Leaderboards for Super Admins
        if (currentRole === 'super_admin' || currentRole === 'admin') {
          // Form Fillers
          const { data: allRequests } = await supabase
            .from("apply_for_me_requests")
            .select("assigned_to, created_at")
            .eq("status", "completed")
            .not("assigned_to", "is", null);

          if (allRequests) {
            const statsMap: Record<string, any> = {};
            const now = new Date();
            allRequests.forEach(r => {
              if (!statsMap[r.assigned_to]) statsMap[r.assigned_to] = { email: r.assigned_to, today: 0, month: 0, total: 0 };
              const d = new Date(r.created_at);
              statsMap[r.assigned_to].total++;
              if (d.getDate() === now.getDate() && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()) statsMap[r.assigned_to].today++;
              if (d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()) statsMap[r.assigned_to].month++;
            });
            setAllFillersStats(Object.values(statsMap).sort((a, b) => b.today - a.today));
          }

          // Content Writers
          const { data: allWriterJobs } = await supabase
            .from("jobs")
            .select("created_by, created_at")
            .not("created_by", "is", null);

          if (allWriterJobs) {
            const statsMap: Record<string, any> = {};
            const now = new Date();
            allWriterJobs.forEach(r => {
              if (!statsMap[r.created_by]) statsMap[r.created_by] = { email: r.created_by, today: 0, month: 0, total: 0 };
              const d = new Date(r.created_at);
              statsMap[r.created_by].total++;
              if (d.getDate() === now.getDate() && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()) statsMap[r.created_by].today++;
              if (d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()) statsMap[r.created_by].month++;
            });
            setAllWritersStats(Object.values(statsMap).sort((a, b) => b.today - a.today));
          }
        }
      } catch (error) {
        console.error("Error fetching stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  return (
    <div className="space-y-6">
      {/* Premium Welcome Banner */}
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-700 to-violet-800 rounded-3xl p-8 text-white relative overflow-hidden shadow-2xl shadow-indigo-900/20">
        {/* Animated Background Elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -mt-20 -mr-20 pointer-events-none animate-pulse duration-10000" />
        <div className="absolute bottom-0 left-20 w-64 h-64 bg-indigo-500/30 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-xs font-bold text-indigo-100 mb-4 border border-white/20">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" /> System Online & Secure
            </div>
            <h2 className="text-3xl md:text-4xl font-extrabold mb-2 capitalize tracking-tight">
              {getGreeting()}, {userName || "Admin"}! 👋
            </h2>
            <p className="text-indigo-100/80 text-sm md:text-base font-medium max-w-xl">
              {userRole === 'form_filler' 
                ? "Aapka roj ka kaam yahan se shuru hota hai. Chaliye students ki madad karte hain!" 
                : userRole === 'content_writer' 
                  ? "Aapke likhe posts hazaron students tak pahuchte hain. Keep up the great work!" 
                  : "Rojgar Suvidha Content Management System. Manage all your platform operations seamlessly."}
            </p>
            {pendingRequests > 0 && userRole !== 'content_writer' && (
              <Link href="/admin/applications" className="mt-5 inline-flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-red-500/30 transition-all hover:-translate-y-0.5">
                <AlertCircle className="h-4 w-4 animate-bounce" />
                {pendingRequests} Pending Application{pendingRequests > 1 ? "s" : ""} Need Attention
                <ArrowRight className="h-4 w-4" />
              </Link>
            )}
          </div>
          
          {/* Live Glassmorphism Clock Widget */}
          <div className="shrink-0 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-5 text-center min-w-[200px] shadow-xl">
            <p className="text-sm font-bold text-indigo-200 uppercase tracking-widest mb-1">
              {currentTime ? currentTime.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' }) : "Loading..."}
            </p>
            <p className="text-3xl font-black tabular-nums tracking-tight">
              {currentTime ? currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : "--:--:--"}
            </p>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      {(userRole === 'super_admin' || userRole === 'admin' || userRole === 'content_writer') && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Total Active Jobs", value: statCounts.activeJobs, icon: Briefcase, color: "text-indigo-600 dark:text-indigo-400", bgColor: "bg-indigo-50 dark:bg-indigo-900/30", href: "/admin/jobs" },
            { label: "Admit Cards", value: statCounts.admitCards, icon: BookOpen, color: "text-orange-600 dark:text-orange-400", bgColor: "bg-orange-50 dark:bg-orange-900/30", href: "/admin/jobs" },
            { label: "Results Published", value: statCounts.results, icon: FileText, color: "text-green-600 dark:text-green-400", bgColor: "bg-green-50 dark:bg-green-900/30", href: "/admin/jobs" },
            { label: "Apply Requests", value: statCounts.applyRequests, icon: Users, color: "text-red-600 dark:text-red-400", bgColor: "bg-red-50 dark:bg-red-900/30", href: "/admin/applications" },
          ].map((stat) => {
            const Icon = stat.icon;
            return (
              <Link key={stat.label} href={stat.href} className="bg-white dark:bg-gray-900 rounded-2xl p-5 border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-md transition-shadow group">
                <div className={`inline-flex p-3 rounded-xl mb-4 ${stat.bgColor}`}>
                  <Icon className={`h-6 w-6 ${stat.color}`} />
                </div>
                <p className="text-2xl font-extrabold text-gray-900 dark:text-white">{loading ? "..." : stat.value}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{stat.label}</p>
              </Link>
            );
          })}
        </div>
      )}

      {/* Form Filler Performance Overview */}
      {userRole === 'form_filler' && (
        <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 p-6 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
            <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2 text-lg">
              <CheckCircle2 className="h-6 w-6 text-green-500" />
              My Performance Overview
            </h3>
            <div className="bg-gray-50 dark:bg-gray-800 px-4 py-2 rounded-xl text-sm font-bold text-gray-600 dark:text-gray-300">
              Daily Target: {Math.min(100, Math.round((fillerStats.today / 20) * 100))}% (Goal: 20/day)
              <div className="w-full bg-gray-200 dark:bg-gray-700 h-1.5 rounded-full mt-2 overflow-hidden">
                <div className="bg-green-500 h-full rounded-full transition-all duration-1000" style={{ width: `${Math.min(100, (fillerStats.today / 20) * 100)}%` }} />
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-100 dark:border-green-800/50 rounded-2xl p-6 text-center transform hover:scale-[1.02] transition-transform shadow-sm">
              <p className="text-5xl font-black text-green-600 dark:text-green-400 drop-shadow-sm">{fillerStats.today}</p>
              <p className="text-sm font-bold text-green-800 dark:text-green-300 mt-2 uppercase tracking-wide">Completed Today</p>
            </div>
            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border border-blue-100 dark:border-blue-800/50 rounded-2xl p-6 text-center transform hover:scale-[1.02] transition-transform shadow-sm">
              <p className="text-5xl font-black text-blue-600 dark:text-blue-400 drop-shadow-sm">{fillerStats.month}</p>
              <p className="text-sm font-bold text-blue-800 dark:text-blue-300 mt-2 uppercase tracking-wide">This Month</p>
            </div>
            <div className="bg-gradient-to-br from-indigo-50 to-violet-50 dark:from-indigo-900/20 dark:to-violet-900/20 border border-indigo-100 dark:border-indigo-800/50 rounded-2xl p-6 text-center transform hover:scale-[1.02] transition-transform shadow-sm">
              <p className="text-5xl font-black text-indigo-600 dark:text-indigo-400 drop-shadow-sm">{fillerStats.total}</p>
              <p className="text-sm font-bold text-indigo-800 dark:text-indigo-300 mt-2 uppercase tracking-wide">Lifetime Total</p>
            </div>
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border border-amber-100 dark:border-amber-800/50 rounded-2xl p-6 text-center transform hover:scale-[1.02] transition-transform shadow-sm md:col-span-3 lg:col-span-1">
              <p className="text-5xl font-black text-amber-600 dark:text-amber-400 drop-shadow-sm flex items-center justify-center gap-1">
                <span className="text-2xl mt-2">₹</span>{fillerStats.total * 50}
              </p>
              <p className="text-sm font-bold text-amber-800 dark:text-amber-300 mt-2 uppercase tracking-wide">Est. Revenue Generated</p>
            </div>
          </div>
        </div>
      )}

      {/* Content Writer Performance Overview */}
      {userRole === 'content_writer' && (
        <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 p-6 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
            <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2 text-lg">
              <CheckCircle2 className="h-6 w-6 text-purple-500" />
              My Publishing Overview
            </h3>
            <div className="bg-gray-50 dark:bg-gray-800 px-4 py-2 rounded-xl text-sm font-bold text-gray-600 dark:text-gray-300">
              Daily Target: {Math.min(100, Math.round((writerStats.today / 5) * 100))}% (Goal: 5/day)
              <div className="w-full bg-gray-200 dark:bg-gray-700 h-1.5 rounded-full mt-2 overflow-hidden">
                <div className="bg-purple-500 h-full rounded-full transition-all duration-1000" style={{ width: `${Math.min(100, (writerStats.today / 5) * 100)}%` }} />
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-purple-50 to-fuchsia-50 dark:from-purple-900/20 dark:to-fuchsia-900/20 border border-purple-100 dark:border-purple-800/50 rounded-2xl p-6 text-center transform hover:scale-[1.02] transition-transform shadow-sm">
              <p className="text-5xl font-black text-purple-600 dark:text-purple-400 drop-shadow-sm">{writerStats.today}</p>
              <p className="text-sm font-bold text-purple-800 dark:text-purple-300 mt-2 uppercase tracking-wide">Published Today</p>
            </div>
            <div className="bg-gradient-to-br from-fuchsia-50 to-pink-50 dark:from-fuchsia-900/20 dark:to-pink-900/20 border border-fuchsia-100 dark:border-fuchsia-800/50 rounded-2xl p-6 text-center transform hover:scale-[1.02] transition-transform shadow-sm">
              <p className="text-5xl font-black text-fuchsia-600 dark:text-fuchsia-400 drop-shadow-sm">{writerStats.month}</p>
              <p className="text-sm font-bold text-fuchsia-800 dark:text-fuchsia-300 mt-2 uppercase tracking-wide">This Month</p>
            </div>
            <div className="bg-gradient-to-br from-pink-50 to-rose-50 dark:from-pink-900/20 dark:to-rose-900/20 border border-pink-100 dark:border-pink-800/50 rounded-2xl p-6 text-center transform hover:scale-[1.02] transition-transform shadow-sm">
              <p className="text-5xl font-black text-pink-600 dark:text-pink-400 drop-shadow-sm">{writerStats.total}</p>
              <p className="text-sm font-bold text-pink-800 dark:text-pink-300 mt-2 uppercase tracking-wide">Lifetime Total</p>
            </div>
          </div>
        </div>
      )}

      {(userRole === 'super_admin' || userRole === 'admin') && (allFillersStats.length > 0 || allWritersStats.length > 0) && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mt-6">
          {/* Form Fillers Leaderboard */}
          {allFillersStats.length > 0 && (
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
              <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
                <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-indigo-500" />
                  Form Fillers Leaderboard
                </h3>
                <button onClick={() => exportLeaderboardCSV('fillers')} className="text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-900/30 px-3 py-1.5 rounded-lg transition-colors">
                  Export CSV
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-gray-50 dark:bg-gray-800/50">
                    <tr>
                      <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase">Employee</th>
                      <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase text-center">Today</th>
                      <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase text-center">Month</th>
                      <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase text-center">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {allFillersStats.map((filler) => (
                      <tr key={filler.email} className="hover:bg-gray-50 dark:hover:bg-gray-800/30">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-indigo-400" />
                            <span className="text-sm font-bold text-gray-900 dark:text-white">{filler.email.split('@')[0]}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="inline-block px-3 py-1 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded-lg text-sm font-bold">
                            {filler.today}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center text-sm font-bold text-gray-700 dark:text-gray-300">{filler.month}</td>
                        <td className="px-6 py-4 text-center text-sm font-bold text-gray-500">{filler.total}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Content Writers Leaderboard */}
          {allWritersStats.length > 0 && (
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
              <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
                <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-purple-500" />
                  Content Writers Leaderboard
                </h3>
                <button onClick={() => exportLeaderboardCSV('writers')} className="text-xs font-bold text-purple-600 bg-purple-50 hover:bg-purple-100 dark:bg-purple-900/30 px-3 py-1.5 rounded-lg transition-colors">
                  Export CSV
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-purple-50 dark:bg-gray-800/50">
                    <tr>
                      <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase">Employee</th>
                      <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase text-center">Today</th>
                      <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase text-center">Month</th>
                      <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase text-center">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {allWritersStats.map((writer) => (
                      <tr key={writer.email} className="hover:bg-purple-50/50 dark:hover:bg-purple-900/10">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-purple-400" />
                            <span className="text-sm font-bold text-gray-900 dark:text-white">{writer.email.split('@')[0]}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="inline-block px-3 py-1 bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 rounded-lg text-sm font-bold">
                            {writer.today}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center text-sm font-bold text-gray-700 dark:text-gray-300">{writer.month}</td>
                        <td className="px-6 py-4 text-center text-sm font-bold text-gray-500">{writer.total}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Quick Actions + Recent Jobs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6 shadow-sm">
          <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-indigo-500" />
            Quick Actions
          </h3>
          <div className="space-y-2.5">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <Link
                  key={action.label}
                  href={action.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${action.color} group`}
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  {action.label}
                  <ArrowRight className="h-4 w-4 ml-auto group-hover:translate-x-1 transition-transform" />
                </Link>
              );
            })}
          </div>
        </div>

        {/* Recent Jobs */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden lg:col-span-2">
          <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
            <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Clock className="h-5 w-5 text-indigo-500" />
              Recent Posts
            </h3>
            <Link href="/admin/jobs" className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline font-medium">View all</Link>
          </div>

          {loading ? (
            <div className="p-6 space-y-4">
              {[1,2,3].map(i => (
                <div key={i} className="h-10 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : recentJobs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400 dark:text-gray-500">
              <Briefcase className="h-12 w-12 mb-3 opacity-30" />
              <p className="font-medium">No jobs added yet.</p>
              <Link href="/admin/jobs/new" className="mt-3 text-sm text-indigo-600 dark:text-indigo-400 hover:underline font-medium">Add your first job →</Link>
            </div>
          ) : (
            <div className="divide-y divide-gray-50 dark:divide-gray-800">
              {recentJobs.map((job) => (
                <div key={job.id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors">
                  <div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white line-clamp-1">{job.title}</p>
                    <p className="text-xs text-gray-400 mt-0.5 capitalize">{job.category} • {job.status}</p>
                  </div>
                  <Link href={`/admin/jobs/${job.id}`} className="shrink-0 text-indigo-600 dark:text-indigo-400 hover:underline text-xs font-medium ml-4">Edit</Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
