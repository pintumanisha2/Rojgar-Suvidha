"use client";

import { useState, useEffect } from "react";
import { Mail, CheckCircle2, Loader2, Bell } from "lucide-react";

const SUBSCRIBED_KEY = "rs_email_subscribed";

export default function EmailAlertBanner() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [error, setError] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (localStorage.getItem(SUBSCRIBED_KEY)) {
      setSubscribed(true);
    }
  }, []);

  // Don't render until hydrated (avoids localStorage mismatch)
  if (!mounted) return null;
  // Don't show banner if already subscribed
  if (subscribed) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const trimmed = email.trim();
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setError("Please enter a valid email address.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmed, source: "homepage-banner" }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Something went wrong. Please try again.");
      } else {
        setSubscribed(true);
        localStorage.setItem(SUBSCRIBED_KEY, "1");
      }
    } catch {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gradient-to-r from-indigo-600 via-indigo-700 to-violet-700 py-10 px-4">
      <div className="max-w-4xl mx-auto text-center">

        {/* Icon */}
        <div className="inline-flex items-center justify-center w-12 h-12 bg-white/10 rounded-2xl mb-4 border border-white/20">
          <Bell className="w-6 h-6 text-white" />
        </div>

        <h2 className="text-2xl sm:text-3xl font-black text-white mb-2">
          Get Daily Job Alerts in Your Inbox — Free Forever
        </h2>
        <p className="text-indigo-200 text-sm sm:text-base mb-6 max-w-lg mx-auto">
          Join 1.5 Lakh+ aspirants. Ek curated email roz. SSC, Railway, Banking & State jobs. No spam, ever.
        </p>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto"
          noValidate
        >
          <div className="relative flex-1">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-indigo-400 pointer-events-none" />
            <input
              type="email"
              value={email}
              onChange={e => { setEmail(e.target.value); setError(""); }}
              placeholder="yourname@gmail.com"
              id="email-alert-input"
              className="w-full pl-9 pr-4 py-3.5 rounded-xl text-sm font-medium bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white/40 border border-transparent"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            id="email-alert-submit"
            className="flex items-center justify-center gap-2 px-6 py-3.5 bg-amber-400 hover:bg-amber-300 disabled:opacity-60 text-gray-900 font-black text-sm rounded-xl transition-all shadow-lg shadow-amber-400/30 shrink-0"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            {loading ? "Subscribing..." : "Get Free Alerts"}
          </button>
        </form>

        {/* Error */}
        {error && (
          <p className="mt-3 text-red-300 text-sm font-semibold">{error}</p>
        )}

        <p className="mt-3 text-indigo-300 text-xs">
          🔒 We respect your privacy. Unsubscribe anytime.
        </p>
      </div>
    </div>
  );
}

// Separate success banner for when already subscribed (re-visit)
export function EmailAlertSuccess() {
  return (
    <div className="bg-gradient-to-r from-emerald-600 to-green-600 py-8 px-4">
      <div className="max-w-4xl mx-auto text-center flex items-center justify-center gap-3">
        <CheckCircle2 className="w-6 h-6 text-green-200 shrink-0" />
        <p className="text-white font-bold">
          ✅ You&apos;re subscribed! Daily job alerts will arrive in your inbox.
        </p>
      </div>
    </div>
  );
}
