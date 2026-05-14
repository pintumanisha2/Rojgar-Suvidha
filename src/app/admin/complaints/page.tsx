"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  Search, MessageSquareWarning, Loader2, RefreshCw,
  CheckCircle2, Clock, XCircle, Send
} from "lucide-react";

const CATEGORY_LABELS: Record<string, string> = {
  apply_for_me: "🗂️ Apply For Me",
  payment:      "💳 Payment / Refund",
  documents:    "📁 Documents",
  account:      "👤 Account / Login",
  job_info:     "📋 Job Information",
  other:        "💬 Other",
};

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: JSX.Element }> = {
  open:     { label: "Open",     color: "text-amber-700",  bg: "bg-amber-100 dark:bg-amber-900/30",  icon: <Clock className="w-4 h-4" /> },
  resolved: { label: "Resolved", color: "text-green-700",  bg: "bg-green-100 dark:bg-green-900/30",  icon: <CheckCircle2 className="w-4 h-4" /> },
  closed:   { label: "Closed",   color: "text-gray-500",   bg: "bg-gray-100 dark:bg-gray-800",       icon: <XCircle className="w-4 h-4" /> },
};

export default function AdminComplaintsPage() {
  const [complaints, setComplaints] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [selected, setSelected] = useState<any>(null);
  const [reply, setReply] = useState("");
  const [newStatus, setNewStatus] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchComplaints = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("complaints")
      .select("*")
      .order("created_at", { ascending: false });
    setComplaints(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchComplaints(); }, []);

  const filtered = complaints.filter(c => {
    const matchFilter = filter === "all" || c.status === filter;
    const matchSearch = !search || 
      c.name?.toLowerCase().includes(search.toLowerCase()) ||
      c.email?.toLowerCase().includes(search.toLowerCase()) ||
      c.subject?.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  const openComplaint = (c: any) => {
    setSelected(c);
    setReply(c.admin_reply || "");
    setNewStatus(c.status);
  };

  const handleSave = async () => {
    if (!selected) return;
    setSaving(true);
    await supabase
      .from("complaints")
      .update({ status: newStatus, admin_reply: reply })
      .eq("id", selected.id);
    setSaving(false);
    setSelected(null);
    fetchComplaints();
  };

  const stats = {
    total:    complaints.length,
    open:     complaints.filter(c => c.status === "open").length,
    resolved: complaints.filter(c => c.status === "resolved").length,
  };

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
            <MessageSquareWarning className="h-6 w-6 text-red-500" />
            User Complaints & Support
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Users ki complaints dekho aur reply karo
          </p>
        </div>
        <button onClick={fetchComplaints}
          className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-bold text-gray-600 dark:text-gray-400 hover:bg-gray-50 transition-all">
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total",    value: stats.total,    color: "text-indigo-600" },
          { label: "Open",     value: stats.open,     color: "text-amber-600" },
          { label: "Resolved", value: stats.resolved, color: "text-green-600" },
        ].map(s => (
          <div key={s.label} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-4 shadow-sm text-center">
            <p className={`text-3xl font-extrabold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-gray-500 font-medium mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filters + Search */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Naam, email ya subject se search karein..."
            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500" />
        </div>
        <div className="flex gap-2">
          {["all", "open", "resolved", "closed"].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-xl text-sm font-bold capitalize transition-all ${filter === f ? "bg-red-500 text-white" : "bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400"}`}>
              {f === "all" ? "All" : STATUS_CONFIG[f]?.label || f}
            </button>
          ))}
        </div>
      </div>

      {/* Complaints List */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 text-red-500 animate-spin" /></div>
        ) : filtered.length === 0 ? (
          <div className="p-16 text-center">
            <MessageSquareWarning className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-bold">Koi complaint nahi mili</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50 dark:divide-gray-800">
            {filtered.map(c => {
              const cfg = STATUS_CONFIG[c.status] || STATUS_CONFIG.open;
              return (
                <div key={c.id} onClick={() => openComplaint(c)}
                  className="p-5 hover:bg-gray-50 dark:hover:bg-gray-800/30 cursor-pointer transition-all">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className={`text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1 ${cfg.bg} ${cfg.color}`}>
                          {cfg.icon} {cfg.label}
                        </span>
                        <span className="text-xs font-bold text-gray-500 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-full">
                          {CATEGORY_LABELS[c.category] || c.category}
                        </span>
                        {c.admin_reply && (
                          <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-full">
                            ✅ Replied
                          </span>
                        )}
                      </div>
                      <h3 className="font-extrabold text-gray-900 dark:text-white truncate">{c.subject}</h3>
                      <p className="text-sm text-gray-500 mt-0.5">{c.name} • {c.email} {c.phone ? `• ${c.phone}` : ""}</p>
                      <p className="text-xs text-gray-400 mt-1">{new Date(c.created_at).toLocaleString("en-IN")}</p>
                    </div>
                    <span className="text-indigo-500 font-bold text-sm shrink-0">View →</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
              <h2 className="text-xl font-extrabold text-gray-900 dark:text-white">Complaint Details</h2>
              <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600 text-2xl font-bold">×</button>
            </div>

            <div className="p-6 space-y-5">
              {/* User Info */}
              <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-5">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Complainant Info</h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><p className="text-xs text-gray-400">Name</p><p className="font-bold text-gray-900 dark:text-white">{selected.name}</p></div>
                  <div><p className="text-xs text-gray-400">Mobile</p><p className="font-bold text-gray-900 dark:text-white">{selected.phone || "—"}</p></div>
                  <div className="col-span-2"><p className="text-xs text-gray-400">Email</p><p className="font-bold text-gray-900 dark:text-white">{selected.email}</p></div>
                </div>
              </div>

              {/* Complaint */}
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-bold text-red-500 uppercase tracking-wider">
                    {CATEGORY_LABELS[selected.category] || selected.category}
                  </span>
                </div>
                <h3 className="font-extrabold text-gray-900 dark:text-white mb-2">{selected.subject}</h3>
                <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">{selected.message}</p>
                <p className="text-xs text-gray-400 mt-3">{new Date(selected.created_at).toLocaleString("en-IN")}</p>
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Status Update</label>
                <select value={newStatus} onChange={e => setNewStatus(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-bold focus:outline-none focus:ring-2 focus:ring-red-500 text-sm">
                  <option value="open">⏳ Open</option>
                  <option value="resolved">✅ Resolved</option>
                  <option value="closed">❌ Closed</option>
                </select>
              </div>

              {/* Admin Reply */}
              <div>
                <label className="flex items-center gap-1.5 text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                  <Send className="w-4 h-4" /> Admin Reply (User ko dikhega)
                </label>
                <textarea value={reply} onChange={e => setReply(e.target.value)} rows={4}
                  className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-red-500"
                  placeholder="Yahan user ko reply likho..." />
              </div>
            </div>

            <div className="p-6 border-t border-gray-100 dark:border-gray-800 flex gap-3">
              <button onClick={() => setSelected(null)}
                className="flex-1 py-3 rounded-xl border border-gray-200 dark:border-gray-700 font-bold text-gray-600 dark:text-gray-400 hover:bg-gray-50 transition-all">
                Cancel
              </button>
              <button onClick={handleSave} disabled={saving}
                className="flex-1 py-3 rounded-xl bg-red-500 hover:bg-red-600 text-white font-bold shadow-lg shadow-red-500/30 transition-all flex items-center justify-center gap-2 disabled:opacity-70">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                Save & Reply
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
