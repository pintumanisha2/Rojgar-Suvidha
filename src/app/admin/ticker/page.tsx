"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Zap, Plus, Trash2, CheckCircle2, Loader2, Link as LinkIcon, AlertCircle } from "lucide-react";

interface Ticker {
  id: string;
  title: string;
  url: string;
  status: string;
  created_at: string;
}

export default function TickerAdminPage() {
  const [tickers, setTickers] = useState<Ticker[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Form State
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");

  const fetchTickers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("tickers")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setTickers(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchTickers();
  }, []);

  const handleAddTicker = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !url.trim()) return;

    setSaving(true);
    const { error } = await supabase.from("tickers").insert([
      { title: title.trim(), url: url.trim(), status: "active" }
    ]);

    if (error) {
      alert("Error adding ticker: " + error.message);
    } else {
      setTitle("");
      setUrl("");
      fetchTickers();
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this link?")) return;
    await supabase.from("tickers").delete().eq("id", id);
    fetchTickers();
  };

  const toggleStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === "active" ? "inactive" : "active";
    await supabase.from("tickers").update({ status: newStatus }).eq("id", id);
    fetchTickers();
  };

  return (
    <div className="max-w-4xl mx-auto pb-20">
      
      <div className="mb-8">
        <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
          <Zap className="h-6 w-6 text-indigo-500" /> Live Ticker Management
        </h1>
        <p className="text-sm text-gray-500 mt-1">Add, remove, or hide links showing in the moving ticker under the public navbar.</p>
      </div>

      {/* Add New Form */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-sm mb-8">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Add New Ticker Link</h2>
        <form onSubmit={handleAddTicker} className="flex flex-col md:flex-row gap-4 items-start">
          <div className="flex-1 w-full space-y-1">
            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">English Title <span className="text-red-500">*</span></label>
            <input 
              type="text" 
              required
              value={title} 
              onChange={e => setTitle(e.target.value)} 
              placeholder="e.g., 🔥 SSC CGL 2026 Notification Out" 
              className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div className="flex-1 w-full space-y-1">
            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Target URL <span className="text-red-500">*</span></label>
            <input 
              type="url" 
              required
              value={url} 
              onChange={e => setUrl(e.target.value)} 
              placeholder="e.g., https://.../job/ssc-cgl-2026" 
              className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div className="md:mt-6 w-full md:w-auto">
            <button 
              type="submit" 
              disabled={saving}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 px-6 rounded-xl flex items-center justify-center gap-2 transition-all shadow-md shadow-indigo-600/20 disabled:opacity-70"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Add Ticker
            </button>
          </div>
        </form>
      </div>

      {/* List */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-sm overflow-hidden">
        <div className="bg-gray-50 dark:bg-gray-800/50 px-6 py-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
          <h2 className="font-bold text-gray-900 dark:text-white">Active & Past Tickers</h2>
          <span className="text-xs font-bold bg-indigo-100 text-indigo-700 px-2.5 py-1 rounded-full">{tickers.length} Items</span>
        </div>

        {loading ? (
          <div className="p-10 flex justify-center text-gray-400"><Loader2 className="h-6 w-6 animate-spin" /></div>
        ) : tickers.length === 0 ? (
          <div className="p-10 text-center text-gray-500 flex flex-col items-center">
            <AlertCircle className="h-8 w-8 mb-2 text-gray-400" />
            <p>No tickers found. Add one above to start the scrolling text.</p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-100 dark:divide-gray-800">
            {tickers.map((t) => (
              <li key={t.id} className="p-5 hover:bg-gray-50 dark:hover:bg-gray-800/20 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`w-2 h-2 rounded-full ${t.status === 'active' ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`} />
                    <h3 className={`font-bold text-sm ${t.status === 'active' ? 'text-gray-900 dark:text-white' : 'text-gray-500 line-through'}`}>{t.title}</h3>
                  </div>
                  <a href={t.url} target="_blank" className="text-xs text-indigo-500 hover:underline flex items-center gap-1">
                    <LinkIcon className="h-3 w-3" /> {t.url}
                  </a>
                </div>
                
                <div className="flex items-center gap-2 shrink-0">
                  <button 
                    onClick={() => toggleStatus(t.id, t.status)}
                    className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      t.status === 'active' ? 'bg-orange-100 text-orange-700 hover:bg-orange-200' : 'bg-green-100 text-green-700 hover:bg-green-200'
                    }`}
                  >
                    {t.status === 'active' ? 'Hide' : 'Show'}
                  </button>
                  <button 
                    onClick={() => handleDelete(t.id)}
                    className="p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

    </div>
  );
}
