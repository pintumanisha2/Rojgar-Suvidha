"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { Sparkles, ChevronRight, Lock, UserCircle } from "lucide-react";
import JobCardSkeleton from "./JobCardSkeleton";

export default function RecommendedJobs() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [recommended, setRecommended] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchRecommendations() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session?.user) {
          setLoading(false);
          return;
        }

        setUser(session.user);

        // Fetch profile
        const { data: profileData } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", session.user.id)
          .single();

        if (profileData) {
          setProfile(profileData);
        }

        let query = supabase
          .from("jobs")
          .select("title, slug, category, created_at, status")
          .neq("status", "draft")
          .order("created_at", { ascending: false });

        let filters = [];
        if (profileData?.state_code) {
          filters.push(`state_code.eq.${profileData.state_code}`);
        }

        if (filters.length > 0) {
          query = query.or(`${filters.join(",")},state_code.is.null,state_code.eq.,state_code.ilike.%all%`);
        }

        const { data: recommendedData } = await query.limit(4);

        if (recommendedData) {
          setRecommended(recommendedData);
        }
      } catch (err) {
        console.error("Error fetching recommended jobs:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchRecommendations();
  }, []);

  if (!user) {
    return (
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-5 h-5 text-indigo-500" />
          <h2 className="text-lg sm:text-xl font-extrabold text-gray-900 dark:text-white">Jobs For You</h2>
        </div>
        <div className="bg-gradient-to-br from-indigo-900 via-indigo-800 to-indigo-900 rounded-2xl p-6 sm:p-8 relative overflow-hidden border border-indigo-700/50">
          <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
            <Lock className="w-32 h-32 text-white" />
          </div>
          <div className="relative z-10 max-w-md">
            <h3 className="text-xl sm:text-2xl font-extrabold text-white mb-2 leading-tight">
              Unlock AI Job Recommendations
            </h3>
            <p className="text-indigo-200 text-sm sm:text-base mb-6">
              Create your profile to get instant matches based on your state, education, and category. Never miss a job you're eligible for.
            </p>
            <Link 
              href="/login"
              className="inline-flex items-center gap-2 bg-yellow-400 hover:bg-yellow-300 text-indigo-900 font-bold px-6 py-3 rounded-xl transition-all hover:scale-105 active:scale-95 shadow-lg shadow-yellow-400/20"
            >
              <UserCircle className="w-5 h-5" />
              Sign In to Unlock
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!loading && recommended.length === 0) return null;

  return (
    <div className="mb-8">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="w-5 h-5 text-indigo-500" />
        <h2 className="text-lg sm:text-xl font-extrabold text-gray-900 dark:text-white">
          Top Matches For <span className="text-indigo-600 dark:text-indigo-400">{profile?.full_name?.split(" ")[0] || "You"}</span>
        </h2>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => <JobCardSkeleton key={i} />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {recommended.map((job) => (
            <Link 
              href={`/job/${job.slug}`} 
              key={job.slug}
              className="group bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-4 sm:p-5 shadow-sm hover:shadow-xl hover:border-indigo-300 dark:hover:border-indigo-700 hover:-translate-y-1 transition-all duration-300 flex flex-col relative overflow-hidden"
            >
              {/* Subtle Glowing Corner */}
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-indigo-500/10 dark:bg-indigo-500/20 rounded-full blur-2xl group-hover:bg-indigo-500/20 transition-colors"></div>

              <div className="flex items-center gap-2 mb-3 relative z-10">
                <span className="text-[10px] font-extrabold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-2.5 py-1 rounded-md uppercase tracking-widest">
                  {job.category}
                </span>
                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-1 rounded-md">
                  98% Match
                </span>
              </div>

              <h3 className="font-bold text-gray-900 dark:text-white line-clamp-2 leading-snug mb-4 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors relative z-10">
                {job.title}
              </h3>

              <div className="mt-auto pt-3 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between relative z-10">
                <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                  View Details
                </span>
                <div className="w-7 h-7 rounded-full bg-gray-50 dark:bg-gray-800 flex items-center justify-center group-hover:bg-indigo-50 dark:group-hover:bg-indigo-900/40 transition-colors">
                  <ChevronRight className="w-3.5 h-3.5 text-gray-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
