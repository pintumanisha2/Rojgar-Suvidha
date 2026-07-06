"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Bell, BellRing, Check, CheckCheck, X, ExternalLink, Loader2 } from "lucide-react";
import Link from "next/link";

interface Notification {
  id: string;
  title: string;
  body: string;
  icon: string;
  action_url: string;
  is_read: boolean;
  type: string;
  created_at: string;
}

interface NotificationBellProps {
  userId: string;
}

function timeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

const typeColors: Record<string, string> = {
  job_alert: "bg-blue-50 dark:bg-blue-950/30 border-blue-100 dark:border-blue-900/50",
  form_reminder: "bg-amber-50 dark:bg-amber-950/30 border-amber-100 dark:border-amber-900/50",
  payment: "bg-green-50 dark:bg-green-950/30 border-green-100 dark:border-green-900/50",
  result: "bg-purple-50 dark:bg-purple-950/30 border-purple-100 dark:border-purple-900/50",
  admit_card: "bg-indigo-50 dark:bg-indigo-950/30 border-indigo-100 dark:border-indigo-900/50",
  system: "bg-gray-50 dark:bg-gray-800/50 border-gray-100 dark:border-gray-700/50",
  general: "bg-gray-50 dark:bg-gray-800/50 border-gray-100 dark:border-gray-700/50",
};

export default function NotificationBell({ userId }: NotificationBellProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<NodeJS.Timeout | null>(null);
  const prevUnreadCountRef = useRef(0);

  // Play a soft, clean notification ting sound using offline Web Audio API
  const playDing = () => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = "sine";
      osc.frequency.setValueAtTime(880, ctx.currentTime); // A5 note
      osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.1);
      
      gain.gain.setValueAtTime(0.06, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    } catch (e) {
      console.warn("Audio Context failed to play notification alert:", e);
    }
  };

  const fetchNotifications = useCallback(async () => {
    if (!userId) return;
    try {
      const res = await fetch(`/api/notifications?userId=${userId}`);
      if (!res.ok) return;
      const data = await res.json();
      const currentUnread = data.unreadCount || 0;
      setNotifications(data.notifications || []);
      setUnreadCount(currentUnread);

      // Play audio ding if a new alert arrives in the background
      if (currentUnread > prevUnreadCountRef.current) {
        playDing();
      }
      prevUnreadCountRef.current = currentUnread;
    } catch (err) {
      // Silent fail
    }
  }, [userId]);

  // Update browser tab title with unread notifications count badge
  useEffect(() => {
    if (typeof window !== "undefined") {
      const originalTitle = document.title.replace(/^\(\d+\+?\)\s*/, "");
      if (unreadCount > 0) {
        document.title = `(${unreadCount > 99 ? "99+" : unreadCount}) ${originalTitle}`;
      } else {
        document.title = originalTitle;
      }
    }
  }, [unreadCount]);

  // Initial fetch + 30-second polling
  useEffect(() => {
    if (!userId) return;
    fetchNotifications();
    pollRef.current = setInterval(fetchNotifications, 30000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [userId, fetchNotifications]);

  // Close on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const markAsRead = async (notificationId: string) => {
    setNotifications(prev =>
      prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
    fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, notificationId }),
    }).catch(() => null);
  };

  const markAllAsRead = async () => {
    setMarkingAll(true);
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    setUnreadCount(0);
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, markAll: true }),
    }).catch(() => null);
    setMarkingAll(false);
  };

  const handleOpen = () => {
    setIsOpen(!isOpen);
    if (!isOpen && loading) setLoading(false);
  };

  return (
    <div className="relative" ref={panelRef}>
      {/* Bell Button */}
      <button
        onClick={handleOpen}
        className="relative p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-all group"
        title="Notifications"
        aria-label="Open notifications"
      >
        {unreadCount > 0 ? (
          <BellRing className="w-5 h-5 text-indigo-600 dark:text-indigo-400 animate-[wiggle_1s_ease-in-out_infinite]" />
        ) : (
          <Bell className="w-5 h-5 text-gray-600 dark:text-gray-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors" />
        )}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center px-1 animate-in zoom-in-50 duration-200 shadow-lg shadow-red-500/40">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Panel */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-2xl shadow-black/10 dark:shadow-black/40 z-[200] overflow-hidden animate-in slide-in-from-top-2 fade-in duration-200">
          
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-800">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span className="font-black text-sm text-gray-900 dark:text-white">Notifications</span>
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.5 bg-red-100 dark:bg-red-950/50 text-red-600 dark:text-red-400 text-[10px] font-black rounded-md">
                  {unreadCount} New
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  disabled={markingAll}
                  className="flex items-center gap-1 text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 disabled:opacity-50 px-2 py-1 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-950/30 transition-colors"
                >
                  {markingAll ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCheck className="w-3 h-3" />}
                  Mark all read
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Notification List */}
          <div className="max-h-[420px] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                <div className="w-14 h-14 bg-gray-50 dark:bg-gray-800 rounded-full flex items-center justify-center mb-3">
                  <Bell className="w-7 h-7 text-gray-300 dark:text-gray-600" />
                </div>
                <p className="text-sm font-bold text-gray-500 dark:text-gray-400">No notifications yet</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">You will receive updates on new job vacancies and results</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50 dark:divide-gray-800/50">
                {notifications.map((notif) => (
                  <div
                    key={notif.id}
                    className={`relative group transition-all ${!notif.is_read ? "bg-indigo-50/40 dark:bg-indigo-950/10" : ""}`}
                  >
                    <Link
                      href={notif.action_url || "/"}
                      onClick={() => { markAsRead(notif.id); setIsOpen(false); }}
                      className="flex items-start gap-3 p-3.5 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors block"
                    >
                      {/* Icon */}
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg shrink-0 border ${typeColors[notif.type] || typeColors.general}`}>
                        {notif.icon || "🔔"}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className={`text-xs font-black leading-tight ${!notif.is_read ? "text-gray-900 dark:text-white" : "text-gray-600 dark:text-gray-300"}`}>
                            {notif.title}
                          </p>
                          {!notif.is_read && (
                            <div className="w-2 h-2 bg-indigo-500 rounded-full shrink-0 mt-0.5" />
                          )}
                        </div>
                        <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2 leading-relaxed">
                          {notif.body}
                        </p>
                        <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1 font-medium">
                          {timeAgo(notif.created_at)}
                        </p>
                      </div>
                    </Link>

                    {/* Mark single as read */}
                    {!notif.is_read && (
                      <button
                        onClick={(e) => { e.preventDefault(); markAsRead(notif.id); }}
                        className="absolute right-3 top-3 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-400 hover:text-indigo-600 shadow-sm"
                        title="Mark as read"
                      >
                        <Check className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="border-t border-gray-100 dark:border-gray-800 px-4 py-2.5 text-center">
              <Link
                href="/dashboard?tab=notifications"
                onClick={() => setIsOpen(false)}
                className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 flex items-center justify-center gap-1"
              >
                View All <ExternalLink className="w-3 h-3" />
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
