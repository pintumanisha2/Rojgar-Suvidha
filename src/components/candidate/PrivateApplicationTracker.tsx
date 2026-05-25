"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { 
  Briefcase, Building, MapPin, Calendar, Clock, 
  CheckCircle2, XCircle, AlertCircle, Sparkles, User, ChevronRight, ArrowLeft
} from "lucide-react";

export default function PrivateApplicationTracker({ userId }: { userId: string }) {
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedApp, setSelectedApp] = useState<any | null>(null);

  useEffect(() => {
    fetchApplications();
  }, [userId]);

  const fetchApplications = async () => {
    if (!userId) return;
    try {
      const { data, error } = await supabase
        .from("private_job_applications_internal")
        .select("*")
        .eq("candidate_id", userId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setApplications(data || []);
    } catch (err) {
      console.error("Error fetching applications:", err);
      // Fallback for simulation
      const local = localStorage.getItem("rs_internal_applications");
      if (local) {
        setApplications(JSON.parse(local).filter((a: any) => a.candidate_id === userId));
      }
    } finally {
      setLoading(false);
    }
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "new":
        return { label: "Application Sent", color: "text-blue-600", bg: "bg-blue-100 dark:bg-blue-900/30", icon: <Clock className="w-4 h-4" /> };
      case "shortlisted":
        return { label: "Shortlisted", color: "text-amber-600", bg: "bg-amber-100 dark:bg-amber-900/30", icon: <Sparkles className="w-4 h-4" /> };
      case "interview":
        return { label: "Interview Scheduled", color: "text-purple-600", bg: "bg-purple-100 dark:bg-purple-900/30", icon: <User className="w-4 h-4" /> };
      case "accepted":
        return { label: "Hired 🎉", color: "text-green-600", bg: "bg-green-100 dark:bg-green-900/30", icon: <CheckCircle2 className="w-4 h-4" /> };
      case "rejected":
        return { label: "Not Selected", color: "text-red-600", bg: "bg-red-100 dark:bg-red-900/30", icon: <XCircle className="w-4 h-4" /> };
      default:
        return { label: "Applied", color: "text-blue-600", bg: "bg-blue-100", icon: <Clock className="w-4 h-4" /> };
    }
  };

  if (loading) {
    return <div className="p-8 text-center"><div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto"></div></div>;
  }

  // DETAILED VIEW (Like Flipkart Order Detail)
  if (selectedApp) {
    const cfg = getStatusConfig(selectedApp.status);
    
    // Determine stepper progress
    const steps = [
      { id: "new", title: "Application Sent", desc: "Your application has reached the HR.", active: true },
      { id: "shortlisted", title: "Application Reviewed", desc: selectedApp.status === 'rejected' ? "Application was reviewed but not shortlisted." : "HR has shortlisted your profile.", active: ["shortlisted", "interview", "accepted", "rejected"].includes(selectedApp.status) },
      { id: "interview", title: "Interview", desc: "HR has scheduled an interview round.", active: ["interview", "accepted"].includes(selectedApp.status) },
      { id: "accepted", title: "Final Result", desc: selectedApp.status === "accepted" ? "Congratulations! You are hired." : selectedApp.status === "rejected" ? "Unfortunately, you were not selected." : "Waiting for final result.", active: ["accepted", "rejected"].includes(selectedApp.status) }
    ];

    return (
      <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300">
        {/* Header */}
        <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex items-center gap-4 bg-gray-50/50 dark:bg-gray-900/50">
          <button 
            onClick={() => setSelectedApp(null)}
            className="p-2 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-full transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
          <div>
            <h3 className="font-extrabold text-xl text-gray-900 dark:text-white">Application Details</h3>
            <p className="text-xs text-gray-500 font-medium tracking-wide">Tracking ID: {selectedApp.id.split('-')[0].toUpperCase()}</p>
          </div>
        </div>

        {/* Job Info */}
        <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex flex-wrap gap-6 justify-between items-start">
          <div>
            <h2 className="text-2xl font-black text-gray-900 dark:text-white leading-tight mb-2">{selectedApp.job_title}</h2>
            <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400 font-medium">
              <span className="flex items-center gap-1.5"><Building className="w-4 h-4" /> {selectedApp.company_name || "Company"}</span>
              <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4" /> Applied: {new Date(selectedApp.created_at).toLocaleDateString()}</span>
            </div>
          </div>
          <span className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl font-bold text-sm ${cfg.bg} ${cfg.color} border border-current/10`}>
            {cfg.icon} {cfg.label}
          </span>
        </div>

        {/* Live Stepper Timeline (Flipkart style) */}
        <div className="p-6 sm:p-10">
          <h4 className="text-sm font-extrabold text-gray-900 dark:text-white uppercase tracking-widest mb-8 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-500" /> Live Tracking Status
          </h4>
          
          <div className="relative max-w-2xl mx-auto">
            {/* Connecting line */}
            <div className="absolute left-[21px] top-4 bottom-4 w-1 bg-gray-100 dark:bg-gray-800 rounded-full" />
            
            <div className="space-y-8">
              {steps.map((step, idx) => {
                const isCompleted = step.active;
                const isCurrent = step.active && (idx === steps.length - 1 || !steps[idx + 1].active);
                const isFailed = step.id === "accepted" && selectedApp.status === "rejected";
                
                return (
                  <div key={step.id} className="relative flex items-start gap-6 group">
                    {/* Circle Indicator */}
                    <div className={`relative z-10 w-11 h-11 rounded-full flex items-center justify-center shrink-0 transition-all duration-300 ${
                      isFailed ? "bg-red-100 dark:bg-red-900/30 text-red-600 ring-4 ring-white dark:ring-gray-900" :
                      isCurrent ? "bg-indigo-600 text-white ring-4 ring-indigo-100 dark:ring-indigo-900/30 shadow-lg shadow-indigo-600/30 animate-pulse" :
                      isCompleted ? "bg-green-500 text-white ring-4 ring-white dark:ring-gray-900" :
                      "bg-gray-100 dark:bg-gray-800 text-gray-400 ring-4 ring-white dark:ring-gray-900"
                    }`}>
                      {isFailed ? <XCircle className="w-5 h-5" /> : 
                       isCompleted && !isCurrent ? <CheckCircle2 className="w-6 h-6" /> : 
                       <div className={`w-3 h-3 rounded-full ${isCurrent ? 'bg-white' : 'bg-gray-300 dark:bg-gray-600'}`} />}
                    </div>

                    {/* Content */}
                    <div className={`pt-2.5 transition-opacity duration-300 ${isCompleted ? "opacity-100" : "opacity-40"} w-full`}>
                      <h4 className={`text-lg font-bold ${
                        isFailed ? "text-red-600 dark:text-red-400" :
                        isCurrent ? "text-indigo-600 dark:text-indigo-400 font-black" : 
                        "text-gray-900 dark:text-white"
                      }`}>{step.title}</h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400 font-medium mt-1">{step.desc}</p>
                      
                      {/* AI Rejection Feedback Box */}
                      {isFailed && selectedApp.feedback && (
                        <div className="mt-4 bg-orange-50 dark:bg-orange-900/10 border border-orange-200 dark:border-orange-800/50 rounded-2xl p-5 shadow-sm animate-in slide-in-from-top-4">
                          <h5 className="flex items-center gap-2 text-orange-800 dark:text-orange-400 font-black text-sm uppercase tracking-wider mb-2">
                            <Sparkles className="w-4 h-4" /> AI Feedback / HR Notes
                          </h5>
                          <p className="text-sm font-medium text-orange-900/80 dark:text-orange-200/80 leading-relaxed">
                            {selectedApp.feedback}
                          </p>
                          <div className="mt-4 p-3 bg-white/50 dark:bg-black/20 rounded-xl">
                            <p className="text-xs font-bold text-orange-700 dark:text-orange-500">
                              💡 Tip: Don't lose hope! Update your resume focusing on this feedback and try applying to similar roles.
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

      </div>
    );
  }

  // LIST VIEW
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-extrabold text-gray-900 dark:text-white">My Private Jobs Applications</h3>
      </div>

      {applications.length === 0 ? (
        <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 shadow-sm p-16 text-center">
          <Briefcase className="w-16 h-16 text-gray-300 dark:text-gray-700 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No Applications Yet</h3>
          <p className="text-gray-500 dark:text-gray-400 max-w-sm mx-auto mb-6">Aapne abhi tak kisi Private Job mein apply nahi kiya hai.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {applications.map((app) => {
            const cfg = getStatusConfig(app.status);
            return (
              <div 
                key={app.id} 
                onClick={() => setSelectedApp(app)}
                className="group cursor-pointer bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5 hover:border-indigo-400 dark:hover:border-indigo-600 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-2xl ${cfg.bg} ${cfg.color} group-hover:scale-110 transition-transform`}>
                    <Briefcase className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-lg text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{app.job_title}</h4>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center gap-2 mt-0.5">
                      {app.company_name} <span className="w-1 h-1 bg-gray-300 rounded-full" /> Applied: {new Date(app.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-6 sm:w-auto w-full border-t sm:border-0 border-gray-100 dark:border-gray-800 pt-3 sm:pt-0">
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold ${cfg.bg} ${cfg.color}`}>
                    {cfg.icon} {cfg.label}
                  </span>
                  <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-indigo-500 transition-colors" />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
