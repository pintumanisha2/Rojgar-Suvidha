"use client";
// F3-C: PushSubscribeWidget — Category-based push notification opt-in
// Shows after 30s on job detail pages or after user's 2nd visit

import { useState, useEffect } from "react";
import { Bell, BellOff, X, Check } from "lucide-react";
import { supabase } from "@/lib/supabase";

const CATEGORIES = [
  { value: "latest-jobs", label: "Latest Jobs",  emoji: "💼" },
  { value: "results",     label: "Results",       emoji: "🏆" },
  { value: "admit-cards", label: "Admit Cards",   emoji: "📋" },
  { value: "news",        label: "News",          emoji: "📰" },
  { value: "answer-key",  label: "Answer Keys",   emoji: "🔑" },
];

const SHOWN_KEY = "push_widget_last_shown";
const SUBSCRIBED_KEY = "push_subscribed_v2";

function urlB64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}

export default function PushSubscribeWidget({ delay = 30000 }: { delay?: number }) {
  const [show, setShow] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [selectedCats, setSelectedCats] = useState<string[]>(["latest-jobs", "results"]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Don't show if already subscribed
    if (localStorage.getItem(SUBSCRIBED_KEY)) { setSubscribed(true); return; }

    // Don't show more than once per 3 days
    const lastShown = parseInt(localStorage.getItem(SHOWN_KEY) || "0");
    const threeDays = 3 * 24 * 60 * 60 * 1000;
    if (Date.now() - lastShown < threeDays) return;

    // Show after delay
    const timer = setTimeout(() => {
      setShow(true);
      localStorage.setItem(SHOWN_KEY, String(Date.now()));
    }, delay);
    return () => clearTimeout(timer);
  }, [delay]);

  const toggleCategory = (cat: string) => {
    setSelectedCats(prev =>
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    );
  };

  const handleSubscribe = async () => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      alert("Aapke browser mein push notifications support nahi hai.");
      return;
    }
    setLoading(true);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setLoading(false);
        setDismissed(true);
        return;
      }

      const reg = await navigator.serviceWorker.ready;
      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapidKey) throw new Error("VAPID key missing");

      const subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlB64ToUint8Array(vapidKey) as any,
      });

      // Get user id if logged in
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id || null;

      await fetch("/api/push", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "subscribe",
          subscription,
          userId,
          categories: selectedCats,
        }),
      });

      localStorage.setItem(SUBSCRIBED_KEY, "true");
      setSuccess(true);
      setSubscribed(true);
    } catch (err) {
      console.error("Push subscribe error:", err);
    } finally {
      setLoading(false);
    }
  };

  if (!show || subscribed || dismissed) return null;

  return (
    <div className="fixed bottom-20 sm:bottom-6 right-4 z-40 w-[320px] sm:w-[360px] bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl shadow-black/20 border border-gray-200 dark:border-zinc-800 overflow-hidden animate-in slide-in-from-right duration-500">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center">
            <Bell className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="text-white font-black text-sm">Job Alerts Enable Karein</p>
            <p className="text-white/70 text-[11px]">Nai job aane par turant notification</p>
          </div>
        </div>
        <button onClick={() => setDismissed(true)} className="text-white/60 hover:text-white transition-colors p-1">
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="p-5">
        {success ? (
          <div className="text-center py-2">
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <Check className="h-7 w-7 text-green-600" />
            </div>
            <p className="font-black text-gray-900 dark:text-white text-sm mb-1">Subscribed Ho Gaye!</p>
            <p className="text-xs text-gray-500">Jab bhi nai notification aayegi, hum aapko turant batayenge.</p>
          </div>
        ) : (
          <>
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-3 font-medium">
              Kaunsi categories ke alerts chahiye? (Select all that apply)
            </p>
            <div className="grid grid-cols-3 gap-1.5 mb-4">
              {CATEGORIES.map(cat => (
                <button
                  key={cat.value}
                  onClick={() => toggleCategory(cat.value)}
                  className={`flex flex-col items-center gap-1 p-2 rounded-xl border text-[10px] font-bold transition-all ${
                    selectedCats.includes(cat.value)
                      ? "bg-indigo-600 text-white border-indigo-600"
                      : "bg-gray-50 dark:bg-zinc-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-zinc-700 hover:border-indigo-400"
                  }`}
                >
                  <span className="text-base">{cat.emoji}</span>
                  {cat.label}
                </button>
              ))}
            </div>
            <button
              onClick={handleSubscribe}
              disabled={loading || selectedCats.length === 0}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-black text-sm rounded-2xl transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              {loading
                ? "Enabling..."
                : <><Bell className="h-4 w-4" />Enable Notifications</>}
            </button>
            <button
              onClick={() => setDismissed(true)}
              className="w-full mt-2 text-[11px] text-gray-400 hover:text-gray-600 text-center"
            >
              Abhi nahi
            </button>
          </>
        )}
      </div>
    </div>
  );
}
