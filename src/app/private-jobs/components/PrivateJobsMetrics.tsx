"use client";

import { Users, Briefcase, Award, Home } from"lucide-react";

interface PrivateJobsMetricsProps {
 activeTab:"verified"|"partner"|"scouted";
 verifiedCount: number;
 partnerCount: number;
}

export default function PrivateJobsMetrics({
 activeTab,
 verifiedCount,
 partnerCount
}: PrivateJobsMetricsProps) {
 const stats = [
 {
 label:"Active Openings",
 value:"500+",
 desc:"Hiring right now",
 color:"text-blue-600 font-black",
 icon: Briefcase
 },
 {
 label:"Average CTC Package",
 value:"₹2.4 - ₹6.5 LPA",
 desc:"For freshers & experts",
 color:"text-blue-600 font-black",
 icon: Award
 },
 {
 label:"Verified Recruiters",
 value:"120+ Brands",
 desc:"100% checked by us",
 color:"text-blue-600 font-black",
 icon: Users
 },
 {
 label:"Remote/WFH Options",
 value:"40+ Positions",
 desc:"Work from anywhere",
 color:"text-blue-600 font-black",
 icon: Home
 }
 ];

 return (
 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
 {stats.map((stat, i) => {
 const Icon = stat.icon;
 return (
 <div 
 key={i} 
 className="relative overflow-hidden bg-white border border-slate-200 p-5 rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 group flex flex-col justify-between"
 >
 <div className="flex items-center justify-between gap-2 mb-2">
 <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest group-hover:text-blue-500 transition-colors">
 {stat.label}
 </span>
 <div className="bg-slate-100 p-1.5 rounded-lg text-slate-400 group-hover:text-blue-500 transition-all">
 <Icon className="w-3.5 h-3.5"/>
 </div>
 </div>

 <div>
 <span className={`block text-lg sm:text-2xl tracking-tight leading-none ${stat.color}`}>
 {stat.value}
 </span>
 <span className="block text-[10px] text-gray-500 mt-1 font-bold">
 {stat.desc}
 </span>
 </div>
 </div>
 );
 })}
 </div>
 );
}
