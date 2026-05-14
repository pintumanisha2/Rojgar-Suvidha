"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import {
  PlusCircle, Search, Pencil, Trash2, Eye,
  Briefcase, Loader2, AlertCircle, CheckCircle2,
  Clock, Zap, Image as ImageIcon
} from "lucide-react";

const STATUS_STYLES: Record<string, string> = {
  active:  "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  out:     "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  last:    "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  soon:    "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
};

export default function AdminJobsPage() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [stateFilter, setStateFilter] = useState("all");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from("jobs")
        .select("id, title, category, status, state_code, created_at, slug, banner_url")
        .order("created_at", { ascending: false });
      if (data) setJobs(data);
    } catch (error) {
      console.error("Error fetching jobs:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchJobs(); }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this post? This cannot be undone.")) return;
    setDeleteId(id);
    await supabase.from("jobs").delete().eq("id", id);
    setDeleteId(null);
    fetchJobs();
  };

  const filtered = jobs.filter(j => {
    const matchesSearch = j.title?.toLowerCase().includes(search.toLowerCase()) || j.category?.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter === "all" || j.category === categoryFilter;
    const matchesState = stateFilter === "all" || (stateFilter === "central" ? !j.state_code : j.state_code === stateFilter);
    return matchesSearch && matchesCategory && matchesState;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-gray-900 dark:text-white">Manage Jobs</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{jobs.length} total posts</p>
        </div>
        <a
          href="/admin/jobs/new"
          className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-5 py-2.5 rounded-xl shadow-sm transition-colors"
        >
          <PlusCircle className="h-5 w-5" />
          Add New Job
        </a>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search posts..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <select
          value={categoryFilter}
          onChange={e => setCategoryFilter(e.target.value)}
          className="w-full px-4 py-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="all">All Categories</option>
          <option value="latest-jobs">Latest Jobs</option>
          <option value="results">Results</option>
          <option value="admit-card">Admit Card</option>
          <option value="answer-key">Answer Key</option>
          <option value="admission">Admission</option>
          <option value="news">News & Updates</option>
          <option value="private-jobs">Private Jobs</option>
        </select>
        <select
          value={stateFilter}
          onChange={e => setStateFilter(e.target.value)}
          className="w-full px-4 py-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="all">All States</option>
          <option value="central">Central / All India</option>
          <option value="UP">Uttar Pradesh</option>
          <option value="BR">Bihar</option>
          <option value="MP">Madhya Pradesh</option>
          <option value="DL">Delhi</option>
          <option value="RJ">Rajasthan</option>
          <option value="HR">Haryana</option>
          {/* Add more as needed, keeping it simple for filter */}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400 dark:text-gray-500">
            <Briefcase className="h-12 w-12 mb-3 opacity-30" />
            <p className="font-medium">No jobs found.</p>
            <Link href="/admin/jobs/new" className="mt-2 text-sm text-indigo-600 dark:text-indigo-400 font-medium hover:underline">Add your first job →</Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800">
                <tr>
                  <th className="px-5 py-3 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Title</th>
                  <th className="px-5 py-3 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden md:table-cell">Category & State</th>
                  <th className="px-5 py-3 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden sm:table-cell">Status</th>
                  <th className="px-5 py-3 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                {filtered.map((job) => (
                  <tr key={job.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-20 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800 shrink-0 border border-gray-100 dark:border-gray-800">
                          {job.banner_url ? (
                            <img src={job.banner_url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-300">
                              <ImageIcon className="h-5 w-5" />
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900 dark:text-white line-clamp-2 max-w-xs">{job.title}</p>
                          <p className="text-xs text-gray-400 mt-1">{new Date(job.created_at).toLocaleDateString("en-IN")}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 hidden md:table-cell">
                      <div className="flex flex-col gap-1">
                        <span className="text-sm text-gray-600 dark:text-gray-400 capitalize font-medium">{job.category?.replace("-", " ") || "—"}</span>
                        <span className="text-xs text-indigo-500 dark:text-indigo-400 font-bold">{job.state_code || "Central"}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 hidden sm:table-cell">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold capitalize ${STATUS_STYLES[job.status] || "bg-gray-100 text-gray-600"}`}>
                        {job.status}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/job/${job.slug || job.id}`}
                          target="_blank"
                          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 transition-colors"
                          title="View Live"
                        >
                          <Eye className="h-4 w-4" />
                        </Link>
                        <a
                          href={`/admin/jobs/${job.id}`}
                          className="p-2 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 transition-colors"
                          title="Edit"
                        >
                          <Pencil className="h-4 w-4" />
                        </a>
                        <button
                          onClick={() => handleDelete(job.id)}
                          disabled={deleteId === job.id}
                          className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 dark:text-red-400 transition-colors disabled:opacity-50"
                          title="Delete"
                        >
                          {deleteId === job.id
                            ? <Loader2 className="h-4 w-4 animate-spin" />
                            : <Trash2 className="h-4 w-4" />
                          }
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
