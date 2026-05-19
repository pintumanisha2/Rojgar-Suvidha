"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import {
  Radar, Plus, Trash2, RefreshCw, ExternalLink,
  Wand2, CheckCircle2, Clock, AlertCircle, Globe
} from "lucide-react";
import Link from "next/link";

interface ScoutSite {
  id: string;
  name: string;
  url: string;
  active: boolean;
  last_checked: string;
  last_status: string;
  last_new_count: number;
}

interface ScoutAlert {
  id: string;
  site_id: string;
  site_name: string;
  site_url: string;
  link_text: string;
  link_url: string;
  detected_at: string;
  is_read: boolean;
}

export default function JobScoutPage() {
  const router = useRouter();
  const [sites, setSites] = useState<ScoutSite[]>([]);
  const [alerts, setAlerts] = useState<ScoutAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [showAddSite, setShowAddSite] = useState(false);

  // New site form
  const [newName, setNewName] = useState("");
  const [newUrl, setNewUrl] = useState("");

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: sitesData } = await supabase.from("scout_sites").select("*").order("name");
      if (sitesData) setSites(sitesData);

      const { data: alertsData } = await supabase
        .from("scout_alerts")
        .select("*")
        .eq("is_read", false)
        .order("detected_at", { ascending: false });
      if (alertsData) setAlerts(alertsData);
    } catch (err) {
      console.error("Error fetching data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 60000); // refresh every minute
    return () => clearInterval(interval);
  }, []);

  const handleAddSite = async () => {
    if (!newName.trim() || !newUrl.trim()) return;
    try {
      let finalUrl = newUrl.trim();
      if (!finalUrl.startsWith("http")) finalUrl = `https://${finalUrl}`;

      const { error } = await supabase.from("scout_sites").insert([{
        name: newName.trim(),
        url: finalUrl,
      }]);

      if (error) throw error;
      setNewName("");
      setNewUrl("");
      setShowAddSite(false);
      fetchData();
    } catch (err: any) {
      alert("Error adding site: " + err.message);
    }
  };

  const handleDeleteSite = async (id: string) => {
    if (!confirm("Remove this website from monitoring?")) return;
    await supabase.from("scout_sites").delete().eq("id", id);
    fetchData();
  };

  const handleManualCheck = async () => {
    setChecking(true);
    try {
      const res = await fetch("/api/admin/job-scout", { method: "POST", body: JSON.stringify({}) });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      alert(`Check complete. Checked ${data.checked} sites. Found ${data.newAlerts} new alerts.`);
      fetchData();
    } catch (err: any) {
      alert("Error checking sites: " + err.message);
    } finally {
      setChecking(false);
    }
  };

  const markRead = async (id: string) => {
    await fetch("/api/admin/job-scout", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ alertId: id }),
    });
    setAlerts(alerts.filter(a => a.id !== id));
  };

  const markAllRead = async () => {
    await fetch("/api/admin/job-scout", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ markAll: true }),
    });
    setAlerts([]);
  };

  const sendToAI = (alert: ScoutAlert) => {
    // Basic formatting for AI Writer input
    const content = `Source: ${alert.site_name} (${alert.site_url})\nLink text on website: ${alert.link_text}\nURL: ${alert.link_url}\n\nPlease check this notification and write a job blog about it.`;
    
    // Save to localstorage for AI writer to pick up (we'll need to update AI Writer to read this)
    localStorage.setItem("scout_to_ai", content);
    router.push("/admin/ai-writer?source=scout");
  };

  return (
    <div className="max-w-6xl mx-auto pb-20 space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-br from-gray-900 to-indigo-950 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl -mt-20 -mr-20" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl font-extrabold flex items-center gap-3">
              <Radar className="h-8 w-8 text-indigo-400" />
              Job Scout
            </h1>
            <p className="text-indigo-200 mt-2 font-medium">
              Automatically monitor govt websites 24/7 for new notifications and results.
            </p>
          </div>
          <button
            onClick={handleManualCheck}
            disabled={checking}
            className="shrink-0 flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-50"
          >
            <RefreshCw className={`h-5 w-5 ${checking ? "animate-spin" : ""}`} />
            {checking ? "Checking Sites..." : "Scan Now"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - New Alerts */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <BellIcon className="h-6 w-6 text-red-500" />
              New Alerts Inbox
              <span className="bg-red-100 text-red-600 text-sm py-0.5 px-2.5 rounded-full">
                {alerts.length}
              </span>
            </h2>
            {alerts.length > 0 && (
              <button onClick={markAllRead} className="text-sm font-medium text-gray-500 hover:text-gray-900 dark:hover:text-white">
                Clear All
              </button>
            )}
          </div>

          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => <div key={i} className="h-24 bg-white dark:bg-gray-800 rounded-2xl animate-pulse" />)}
            </div>
          ) : alerts.length === 0 ? (
            <div className="bg-gray-50 dark:bg-gray-900/50 rounded-3xl border border-dashed border-gray-200 dark:border-gray-800 p-12 text-center text-gray-500 flex flex-col items-center">
              <CheckCircle2 className="h-16 w-16 mb-4 text-green-500/50" />
              <p className="text-lg font-bold text-gray-900 dark:text-white">All caught up!</p>
              <p className="text-sm mt-1">No new notifications found on monitored sites.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {alerts.map(alert => (
                <div key={alert.id} className="bg-white dark:bg-gray-800 border-l-4 border-indigo-500 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow relative group">
                  <div className="flex justify-between items-start gap-4 mb-3">
                    <div>
                      <span className="inline-block px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs font-bold rounded mb-2">
                        {alert.site_name}
                      </span>
                      <h3 className="font-bold text-gray-900 dark:text-white leading-tight">
                        {alert.link_text || "New Link Detected (No text)"}
                      </h3>
                    </div>
                    <span className="text-xs text-gray-400 whitespace-nowrap">
                      {new Date(alert.detected_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-2 mt-4">
                    <a
                      href={alert.link_url}
                      target="_blank"
                      className="px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors"
                    >
                      <ExternalLink className="h-3.5 w-3.5" /> View Link
                    </a>
                    <button
                      onClick={() => sendToAI(alert)}
                      className="px-4 py-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors"
                    >
                      <Wand2 className="h-3.5 w-3.5" /> Send to AI Writer
                    </button>
                    <button
                      onClick={() => markRead(alert.id)}
                      className="ml-auto px-4 py-2 text-gray-400 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors"
                    >
                      <CheckCircle2 className="h-4 w-4" /> Dismiss
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column - Monitored Sites */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Globe className="h-6 w-6 text-indigo-500" />
              Monitored Sites
            </h2>
            <button
              onClick={() => setShowAddSite(!showAddSite)}
              className="text-indigo-600 hover:bg-indigo-50 p-2 rounded-full transition-colors"
            >
              <Plus className="h-5 w-5" />
            </button>
          </div>

          {showAddSite && (
            <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl p-4 border border-indigo-100 dark:border-indigo-800">
              <h3 className="font-bold text-sm mb-3">Add Website to Monitor</h3>
              <input
                type="text"
                placeholder="Site Name (e.g., SSC Official)"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="w-full text-sm p-2.5 rounded-xl border-gray-200 mb-3"
              />
              <input
                type="url"
                placeholder="URL (e.g., ssc.nic.in/notices)"
                value={newUrl}
                onChange={(e) => setNewUrl(e.target.value)}
                className="w-full text-sm p-2.5 rounded-xl border-gray-200 mb-3"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleAddSite}
                  className="flex-1 bg-indigo-600 text-white font-bold py-2 rounded-xl text-sm"
                >
                  Add Site
                </button>
                <button
                  onClick={() => setShowAddSite(false)}
                  className="flex-1 bg-white text-gray-600 border border-gray-200 font-bold py-2 rounded-xl text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
            {sites.length === 0 && !loading ? (
              <div className="p-6 text-center text-sm text-gray-500">
                No sites added yet. Click + to add.
              </div>
            ) : (
              <div className="divide-y divide-gray-100 dark:divide-gray-800">
                {sites.map(site => (
                  <div key={site.id} className="p-4 flex items-center justify-between group hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <div className="truncate pr-4">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`w-2 h-2 rounded-full ${site.last_status === "OK" ? "bg-green-500" : "bg-red-500"}`} />
                        <span className="font-bold text-gray-900 dark:text-white text-sm truncate">{site.name}</span>
                      </div>
                      <div className="flex items-center gap-3 text-[11px] text-gray-500">
                        <span className="truncate max-w-[150px]">{site.url.replace("https://", "")}</span>
                        {site.last_checked && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" /> {new Date(site.last_checked).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteSite(site.id)}
                      className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all shrink-0"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Just a tiny bell icon for the UI
function BellIcon(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
      <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
    </svg>
  );
}
