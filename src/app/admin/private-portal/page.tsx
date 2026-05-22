"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import {
  Briefcase, FileText, Users, Building,
  PlusCircle, TrendingUp, Clock, CheckCircle2,
  ArrowRight, AlertCircle, BarChart
} from "lucide-react";
import PrivateAnalyticsCharts from "./components/PrivateAnalyticsCharts";

const quickActions = [
  { label: "Review Pending HRs", icon: Building, href: "/admin/private-portal/employers", color: "bg-blue-600 hover:bg-blue-700 text-white" },
  { label: "Moderate Private Jobs", icon: Briefcase, href: "/admin/private-portal/jobs", color: "bg-indigo-600 hover:bg-indigo-700 text-white" },
  { label: "View Candidate Pool", icon: Users, href: "/admin/private-portal/candidates", color: "bg-green-600 hover:bg-green-700 text-white" },
];

export default function PrivateAdminDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState<Date | null>(null);
  
  const [statCounts, setStatCounts] = useState({ 
    activeJobs: 0, 
    activeHRs: 0, 
    totalCandidates: 0, 
    totalApplications: 0 
  });

  const [pendingApprovals, setPendingApprovals] = useState(0);

  // Live Clock
  useEffect(() => {
    setCurrentTime(new Date());
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const getGreeting = () => {
    if (!currentTime) return "Welcome to Private Admin";
    const hour = currentTime.getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  };

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Try fetching actual data from Supabase if tables exist, 
        // fallback to 0 or demo numbers if they don't exist yet.
        const [jobsRes, hrsRes, appsRes] = await Promise.all([
          supabase.from("private_jobs").select("*", { count: "exact", head: true }).eq("status", "published"),
          supabase.from("employer_profiles").select("*", { count: "exact", head: true }).eq("is_verified", true),
          supabase.from("private_job_applications").select("*", { count: "exact", head: true })
        ]);

        setStatCounts({
          activeJobs: jobsRes.count || 24, // fallback mock for visuals
          activeHRs: hrsRes.count || 12,
          totalCandidates: 145, // Candidate profiles are mostly local storage testing right now
          totalApplications: appsRes.count || 328,
        });

        setPendingApprovals(3); // Mock pending HR approvals

      } catch (error) {
        console.error("Error fetching private stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  return (
    <div className="space-y-6">
      {/* Premium Welcome Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-blue-700 to-cyan-800 rounded-3xl p-8 text-white relative overflow-hidden shadow-2xl shadow-blue-900/20">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -mt-20 -mr-20 pointer-events-none animate-pulse duration-10000" />
        <div className="absolute bottom-0 left-20 w-64 h-64 bg-blue-500/30 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-xs font-bold text-blue-100 mb-4 border border-white/20">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" /> Private Sector Core Online
            </div>
            <h2 className="text-3xl md:text-4xl font-extrabold mb-2 capitalize tracking-tight">
              {getGreeting()}, Admin! 👋
            </h2>
            <p className="text-blue-100/80 text-sm md:text-base font-medium max-w-xl">
              Welcome to the Private Jobs Command Center. Monitor employer activity, moderate premium jobs, and manage candidate quality.
            </p>
            {pendingApprovals > 0 && (
              <Link href="/admin/private-portal/employers" className="mt-5 inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-amber-500/30 transition-all hover:-translate-y-0.5">
                <AlertCircle className="h-4 w-4 animate-bounce" />
                {pendingApprovals} HR Employer Approvals Pending
                <ArrowRight className="h-4 w-4" />
              </Link>
            )}
          </div>
          
          <div className="shrink-0 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-5 text-center min-w-[200px] shadow-xl">
            <p className="text-sm font-bold text-blue-200 uppercase tracking-widest mb-1">
              {currentTime ? currentTime.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' }) : "Loading..."}
            </p>
            <p className="text-3xl font-black tabular-nums tracking-tight">
              {currentTime ? currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : "--:--:--"}
            </p>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Active Private Jobs", value: statCounts.activeJobs, icon: Briefcase, color: "text-blue-600 dark:text-blue-400", bgColor: "bg-blue-50 dark:bg-blue-900/30", href: "/admin/private-portal/jobs" },
          { label: "Verified HRs / Companies", value: statCounts.activeHRs, icon: Building, color: "text-amber-600 dark:text-amber-400", bgColor: "bg-amber-50 dark:bg-amber-900/30", href: "/admin/private-portal/employers" },
          { label: "Registered Candidates", value: statCounts.totalCandidates, icon: Users, color: "text-emerald-600 dark:text-emerald-400", bgColor: "bg-emerald-50 dark:bg-emerald-900/30", href: "/admin/private-portal/candidates" },
          { label: "Total Applications", value: statCounts.totalApplications, icon: FileText, color: "text-purple-600 dark:text-purple-400", bgColor: "bg-purple-50 dark:bg-purple-900/30", href: "#" },
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

      {/* Quick Actions + Analytics Chart Placeholder */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6 shadow-sm">
          <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-blue-500" />
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

        {/* Private Platform Analytics */}
        <div className="lg:col-span-2">
          <PrivateAnalyticsCharts />
        </div>
      </div>
    </div>
  );
}
