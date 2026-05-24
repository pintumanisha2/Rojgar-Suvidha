"use client";

import { useEffect, useState } from "react";
import { BarChart3, TrendingUp, Users, CheckCircle, Clock } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from 'recharts';

export default function ReportsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const res = await fetch('/api/employer/reports');
        const json = await res.json();
        setData(json);
      } catch (err) {
        console.error("Failed to fetch reports", err);
      } finally {
        setLoading(false);
      }
    };
    fetchReports();
  }, []);

  const COLORS = ['#6366f1', '#3b82f6', '#10b981', '#f59e0b', '#ef4444'];
  const PIE_COLORS = ['#3b82f6', '#8b5cf6', '#14b8a6', '#f43f5e'];

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center h-[70vh]">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <BarChart3 className="w-12 h-12 text-indigo-500 opacity-50" />
          <p className="font-bold text-gray-500">Compiling Analytics Data...</p>
        </div>
      </div>
    );
  }

  const { metrics, funnelData, sourceData } = data;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="relative border-0 rounded-3xl p-6 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 via-purple-600 to-fuchsia-600 z-0"></div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -z-0"></div>
        
        <div className="relative z-10">
          <h1 className="text-2xl font-black text-white flex items-center gap-2 drop-shadow-md">
            <BarChart3 className="w-6 h-6 text-indigo-100" /> Analytics & Reports
          </h1>
          <p className="text-sm text-indigo-100 mt-1 drop-shadow-sm">Track your hiring performance and job posting metrics.</p>
        </div>
        <button 
          onClick={() => window.print()}
          className="relative z-10 px-4 py-2.5 bg-white/20 hover:bg-white/30 backdrop-blur-md border border-white/30 text-white text-sm font-black rounded-xl shadow-lg transition-transform hover:scale-105"
        >
          Download PDF Report
        </button>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: "Total Views", value: metrics.views.toLocaleString(), trend: "+14%", icon: TrendingUp, color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-900/20" },
          { label: "Total Applications", value: metrics.applications.toLocaleString(), trend: "+5%", icon: Users, color: "text-indigo-500", bg: "bg-indigo-50 dark:bg-indigo-900/20" },
          { label: "Hired Candidates", value: metrics.hired, trend: "+2", icon: CheckCircle, color: "text-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-900/20" },
          { label: "Avg. Time to Hire", value: `${metrics.avgTimeDays} Days`, trend: "-1 Day", icon: Clock, color: "text-amber-500", bg: "bg-amber-50 dark:bg-amber-900/20" },
        ].map((stat, i) => (
          <div key={i} className="bg-white/70 dark:bg-gray-900/70 backdrop-blur-md border border-white/50 dark:border-gray-700/50 p-6 rounded-3xl shadow-[0_4px_24px_0_rgba(31,38,135,0.05)] transition-transform hover:-translate-y-1">
            <div className="flex items-center justify-between">
              <div className={`p-3 rounded-2xl ${stat.bg} ${stat.color} shadow-sm`}>
                <stat.icon className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50/80 dark:bg-emerald-900/40 px-2 py-1 rounded-lg border border-emerald-100/50 dark:border-emerald-800/50">
                {stat.trend}
              </span>
            </div>
            <h3 className="text-3xl font-black text-gray-900 dark:text-white mt-4 drop-shadow-sm">{stat.value}</h3>
            <p className="text-[10px] font-black text-indigo-500/70 uppercase tracking-[0.2em] mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Funnel Chart */}
        <div className="bg-white/70 dark:bg-gray-900/70 backdrop-blur-md border border-white/50 dark:border-gray-700/50 p-6 rounded-3xl shadow-[0_4px_24px_0_rgba(31,38,135,0.05)] flex flex-col">
          <h3 className="text-lg font-black text-gray-900 dark:text-white mb-6">Application Funnel</h3>
          <div className="flex-1 min-h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={funnelData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" opacity={0.2} />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 12, fontWeight: 600, fill: '#6b7280' }} 
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 12, fontWeight: 600, fill: '#6b7280' }}
                />
                <RechartsTooltip 
                  cursor={{ fill: 'transparent' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  labelStyle={{ fontWeight: 'bold', color: '#111827' }}
                />
                <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={60}>
                  {funnelData.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Source of Hire Chart */}
        <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 p-6 rounded-3xl shadow-sm flex flex-col">
          <h3 className="text-lg font-extrabold text-gray-900 dark:text-white mb-6">Source of Hire</h3>
          <div className="flex-1 min-h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={sourceData}
                  cx="50%"
                  cy="45%"
                  innerRadius={80}
                  outerRadius={110}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {sourceData.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  itemStyle={{ fontWeight: 'bold' }}
                />
                <Legend 
                  verticalAlign="bottom" 
                  height={36} 
                  iconType="circle"
                  wrapperStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
