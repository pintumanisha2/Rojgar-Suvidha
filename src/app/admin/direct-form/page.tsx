"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Search, BarChart2, PlusCircle, Trash2, Eye, Loader2, Copy, FileText, ChevronRight } from "lucide-react";
import { supabase } from "@/lib/supabase";
import toast from "react-hot-toast";

export default function AdminDirectFormPage() {
  const [forms, setForms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [submissionCounts, setSubmissionCounts] = useState<Record<string, number>>({});

  const fetchForms = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("custom_forms")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setForms(data);

      // Fetch submission counts for each form in parallel
      if (data.length > 0) {
        const counts: Record<string, number> = {};
        await Promise.all(
          data.map(async (form: any) => {
            const { count } = await supabase
              .from("user_applications")
              .select("*", { count: "exact", head: true })
              .eq("form_id", form.id);
            counts[form.id] = count || 0;
          })
        );
        setSubmissionCounts(counts);
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchForms();
  }, []);

  const handleDelete = async (id: string, title: string) => {
    const confirmed = window.confirm(`Delete "${title}"? This cannot be undone.`);
    if (!confirmed) return;
    const { error } = await supabase.from("custom_forms").delete().eq("id", id);
    if (error) {
      toast.error("Delete failed: " + error.message);
    } else {
      toast.success("Form deleted.");
      fetchForms();
    }
  };

  const handleCopyLink = (id: string) => {
    const link = `${window.location.origin}/apply/${id}`;
    navigator.clipboard.writeText(link).then(() => {
      toast.success("✅ Public link copied to clipboard!");
    }).catch(() => {
      toast.error("Failed to copy. Please copy manually: " + link);
    });
  };

  const filtered = forms.filter(f =>
    !search || f.title?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-2">
            <BarChart2 className="h-7 w-7 text-indigo-500" />
            Application Forms
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Create and manage custom apply forms. Copy the link and paste in any job blog.
          </p>
        </div>
        <Link
          href="/admin/direct-form/new"
          className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-5 py-2.5 rounded-xl shadow-md shadow-indigo-500/20 transition-all"
        >
          <PlusCircle className="h-5 w-5" /> Create New Form
        </Link>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search forms by title..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-11 pr-4 py-2.5 bg-white dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      {/* Content */}
      {loading ? (
        <div className="py-24 flex justify-center">
          <Loader2 className="h-9 w-9 animate-spin text-indigo-500" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-24 flex flex-col items-center justify-center text-gray-400 bg-white dark:bg-zinc-950 rounded-2xl border border-gray-100 dark:border-zinc-900">
          <FileText className="h-14 w-14 mb-4 opacity-20" />
          <p className="font-bold text-gray-500">
            {search ? `No forms found for "${search}"` : "No forms created yet."}
          </p>
          {!search && (
            <Link href="/admin/direct-form/new" className="mt-4 text-sm font-black text-indigo-600 hover:underline">
              + Create your first form
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((row: any) => (
            <div
              key={row.id}
              className="bg-white dark:bg-zinc-950 rounded-2xl border border-gray-100 dark:border-zinc-900 p-5 shadow-sm hover:shadow-md transition-all flex flex-col gap-4"
            >
              {/* Title & Meta */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <h3 className="font-black text-gray-900 dark:text-white text-base leading-tight truncate">
                    {row.title}
                  </h3>
                  <p className="text-xs text-gray-400 mt-1">
                    Created {new Date(row.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 bg-indigo-50 dark:bg-indigo-950/30 px-3 py-1.5 rounded-xl border border-indigo-100 dark:border-indigo-900/50 shrink-0">
                  <Eye className="w-3.5 h-3.5 text-indigo-500" />
                  <span className="text-xs font-black text-indigo-700 dark:text-indigo-400">
                    {submissionCounts[row.id] ?? "…"} submissions
                  </span>
                </div>
              </div>

              {/* Documents chips */}
              {row.documents && row.documents.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {row.documents.slice(0, 4).map((doc: string, i: number) => (
                    <span
                      key={i}
                      className="px-2.5 py-1 bg-gray-100 dark:bg-zinc-900 text-gray-600 dark:text-gray-400 text-[11px] font-bold rounded-lg border border-gray-200 dark:border-zinc-800"
                    >
                      {doc}
                    </span>
                  ))}
                  {row.documents.length > 4 && (
                    <span className="px-2.5 py-1 bg-gray-100 dark:bg-zinc-900 text-gray-400 text-[11px] font-bold rounded-lg border border-gray-200 dark:border-zinc-800">
                      +{row.documents.length - 4} more
                    </span>
                  )}
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-2 pt-1 border-t border-gray-100 dark:border-zinc-900">
                <button
                  onClick={() => handleCopyLink(row.id)}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold bg-emerald-50 dark:bg-emerald-950/30 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 rounded-xl border border-emerald-200 dark:border-emerald-900/50 transition-all"
                >
                  <Copy className="h-3.5 w-3.5" /> Copy Public Link
                </button>
                <Link
                  href={`/admin/direct-form/${row.id}/submissions`}
                  className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold bg-indigo-50 dark:bg-indigo-950/30 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 text-indigo-700 dark:text-indigo-400 rounded-xl border border-indigo-100 dark:border-indigo-900/50 transition-all"
                >
                  <Eye className="h-3.5 w-3.5" /> View <ChevronRight className="h-3 w-3" />
                </Link>
                <button
                  onClick={() => handleDelete(row.id, row.title)}
                  className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl border border-transparent hover:border-red-100 dark:hover:border-red-900/30 transition-all"
                  title="Delete Form"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
