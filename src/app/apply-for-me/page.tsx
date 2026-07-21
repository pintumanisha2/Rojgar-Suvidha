"use client";

import React, { Suspense, useEffect, useState, useRef, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { 
  ArrowLeft, ClipboardCheck, Loader2, CheckCircle2, AlertCircle,
  ClipboardList, Clock, Sparkles, Download, MessageSquare, 
  Search, ChevronRight, Lock, Zap, FileText, IndianRupee, X, Copy
} from "lucide-react";
import { triggerPaymentSuccessNotification } from "@/lib/notificationTriggers";
import confetti from "canvas-confetti";

// ─── Status config ────────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<string, { label: string; color: string; badgeBg: string; badgeText: string; canApply: boolean }> = {
  active:       { label: "Active",       color: "emerald", badgeBg: "bg-emerald-500", badgeText: "text-white",   canApply: true  },
  closed:       { label: "Form Closed",  color: "red",     badgeBg: "bg-red-100 dark:bg-red-950/50",     badgeText: "text-red-600 dark:text-red-400",   canApply: false },
  coming_soon:  { label: "Coming Soon",  color: "amber",   badgeBg: "bg-amber-100 dark:bg-amber-950/40", badgeText: "text-amber-700 dark:text-amber-400", canApply: false },
};

// ─── Form Card Component ──────────────────────────────────────────────────────
function FormCard({ form, isHighlighted = false }: { form: any; isHighlighted?: boolean }) {
  const status = STATUS_CONFIG[form.status] ?? STATUS_CONFIG["active"];
  const serviceCharge = form.fees_structure?.[0]?.fees?.serviceCharge ?? "99";

  return (
    <div className={`group relative bg-white dark:bg-zinc-950 rounded-2xl border transition-all duration-200 overflow-hidden ${
      isHighlighted 
        ? "border-indigo-300 dark:border-indigo-700 shadow-lg shadow-indigo-500/10" 
        : "border-gray-200 dark:border-zinc-800 hover:border-indigo-200 dark:hover:border-zinc-700 hover:shadow-md"
    }`}>
      {/* Status accent bar */}
      <div className={`absolute top-0 left-0 right-0 h-1 ${
        form.status === "active" ? "bg-emerald-500" : 
        form.status === "closed" ? "bg-red-400" : "bg-amber-400"
      }`} />

      <div className="p-5 pt-6">
        <div className="flex items-start justify-between gap-3 mb-3">
          <h3 className="font-black text-gray-900 dark:text-white text-base leading-tight flex-1">
            {form.title}
          </h3>
          {/* Status Badge */}
          <span className={`shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-black ${status.badgeBg} ${status.badgeText}`}>
            {form.status === "active"      && <Zap className="w-3 h-3" />}
            {form.status === "closed"      && <Lock className="w-3 h-3" />}
            {form.status === "coming_soon" && <Clock className="w-3 h-3" />}
            {status.label}
          </span>
        </div>

        {/* Documents */}
        {form.documents && form.documents.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {form.documents.slice(0, 3).map((doc: string, i: number) => (
              <span key={i} className="px-2 py-0.5 bg-gray-100 dark:bg-zinc-900 text-gray-500 dark:text-zinc-400 text-[10px] font-bold rounded-md border border-gray-200 dark:border-zinc-800">
                {doc}
              </span>
            ))}
            {form.documents.length > 3 && (
              <span className="px-2 py-0.5 bg-gray-100 dark:bg-zinc-900 text-gray-400 text-[10px] font-bold rounded-md border border-gray-200 dark:border-zinc-800">
                +{form.documents.length - 3} more
              </span>
            )}
          </div>
        )}

        <div className="flex items-center justify-between gap-3">
          {/* Service Charge */}
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <IndianRupee className="w-3.5 h-3.5 text-emerald-500" />
            <span className="font-bold text-emerald-700 dark:text-emerald-400">₹{serviceCharge}</span>
            <span className="text-gray-400">service charge</span>
          </div>

          {/* CTA Button */}
          {form.status === "active" ? (
            <Link
              href={`/apply/${form.id}`}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-xl transition-all hover:scale-105 shadow-sm shadow-indigo-500/20"
            >
              Mera Form Bharo <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          ) : form.status === "closed" ? (
            <span className="inline-flex items-center gap-1.5 px-4 py-2 bg-gray-100 dark:bg-zinc-900 text-gray-400 text-xs font-bold rounded-xl cursor-not-allowed border border-gray-200 dark:border-zinc-800">
              <Lock className="w-3 h-3" /> Closed
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 text-xs font-bold rounded-xl border border-amber-200 dark:border-amber-900/50">
              <Clock className="w-3 h-3" /> Opening Soon
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main Content ─────────────────────────────────────────────────────────────
function ApplyForMeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [trackingId, setTrackingId] = useState("");
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(trackingId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Tabs
  const [activeTab, setActiveTab] = useState<"find" | "orders">("find");
  const [orders, setOrders] = useState<any[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);

  // Smart Form Finder state
  const [allForms, setAllForms] = useState<any[]>([]);
  const [formsLoading, setFormsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(searchParams.get("job") || "");
  const [debouncedQuery, setDebouncedQuery] = useState(searchParams.get("job") || "");
  const searchInputRef = useRef<HTMLInputElement>(null);

  const fetchUserOrders = async (userId: string) => {
    setOrdersLoading(true);
    try {
      const res = await fetch("/api/my-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      const data = await res.json();
      if (res.ok) setOrders(data.orders || []);
    } catch (err) {
      console.error("Fetch orders error:", err);
    } finally {
      setOrdersLoading(false);
    }
  };

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    // Fetch all active forms on mount
    const fetchForms = async () => {
      setFormsLoading(true);
      const { data } = await supabase
        .from("custom_forms")
        .select("id, title, documents, fees_structure, status, created_at")
        .order("created_at", { ascending: false });
      setAllForms(data || []);
      setFormsLoading(false);
    };
    fetchForms();

    const fetchUser = async () => {
      try {
        const sessionPromise = supabase.auth.getSession();
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("Auth check timed out")), 8000)
        );
        const { data: { session } } = await Promise.race([sessionPromise, timeoutPromise]) as Awaited<ReturnType<typeof supabase.auth.getSession>>;

        if (!session) {
          setLoading(false);
          return; // Stay on page — show find tab without login
        }
        setUser(session.user);
        const { data: profileData } = await supabase
          .from("profiles").select("*").eq("id", session.user.id).single();
        setProfile(profileData);
        await fetchUserOrders(session.user.id);
      } catch (err) {
        console.error("Auth error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, []);

  // Payment callback verification
  useEffect(() => {
    const orderId = searchParams.get("order_id");
    if (orderId && user) {
      const verifyAndSaveOrder = async () => {
        setLoading(true);
        try {
          const res = await fetch(`/api/track?order_id=${orderId}`);
          const statusData = await res.json();
          if (statusData.order_status === "PAID" || statusData.order_status === "ACTIVE") {
            const jobTitleParam = searchParams.get("job_title");
            const jobUrlParam = searchParams.get("job_url");
            const noteParam = searchParams.get("special_note");
            const { error: dbErr } = await supabase.from("apply_for_me_requests").insert({
              user_id: user.id,
              applicant_name: profile?.full_name || "",
              phone_number: profile?.mobile_number || "",
              email: user.email || "",
              job_title: jobTitleParam || "Applied Vacancy",
              status: "paid",
              tracking_id: orderId,
              details: {
                job_url: jobUrlParam || "",
                special_note: noteParam || ""
              }
            });
            if (!dbErr) {
              setSubmitted(true);
              setTrackingId(orderId);
              triggerPaymentSuccessNotification(user.id, jobTitleParam || "Vacancy", orderId);
              try { confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } }); } catch(e) {}
              fetchUserOrders(user.id);
              setActiveTab("orders");
            }
          }
        } catch (err) { console.error(err); } 
        finally { setLoading(false); }
      };
      verifyAndSaveOrder();
    }
  }, [searchParams, user]);

  // Filtered forms from search
  const recentActiveForms = allForms.filter(f => f.status === "active").slice(0, 4);
  const searchResults = debouncedQuery.length >= 1
    ? allForms.filter(f => f.title?.toLowerCase().includes(debouncedQuery.toLowerCase()))
    : [];
  const hasSearchQuery = debouncedQuery.length >= 1;

  // Status badge helper for orders
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "placed":     return <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-blue-50 text-blue-600 border border-blue-100">Order Placed</span>;
      case "verified":   return <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-amber-50 text-amber-600 border border-amber-100">Verified</span>;
      case "draft_sent": return <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-purple-50 text-purple-600 border border-purple-100">Draft Shared</span>;
      case "submitted":  return <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-green-50 text-green-600 border border-green-100">Submitted</span>;
      case "rejected":   return <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-red-50 text-red-600 border border-red-100">Rejected (Refunded)</span>;
      default:           return <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-gray-50 text-gray-600 border border-gray-100">Pending</span>;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#000000]">
        <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#000000]">
      {/* ⚡ URGENCY STRIP */}
      <div className="bg-gradient-to-r from-red-600 via-rose-600 to-red-700 text-white text-xs font-black text-center py-2.5 px-4 shadow-md sticky top-0 z-40">
        ⚡ 23 orders placed in last 24 hours — Don't miss your application deadline!
      </div>

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-zinc-950 border-b border-gray-100 dark:border-zinc-900">
        <div className="max-w-4xl mx-auto px-4 py-10 sm:py-14 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/50 rounded-full text-xs font-black text-indigo-700 dark:text-indigo-400 mb-5">
            <Sparkles className="w-3.5 h-3.5" /> Expert Form Filling Service
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-gray-900 dark:text-white leading-tight mb-3">
            Find Your Form &
            <span className="text-indigo-600"> Apply With Experts</span>
          </h1>
          <p className="text-gray-500 dark:text-zinc-400 text-sm sm:text-base max-w-xl mx-auto mb-6">
            Hamari team aapka government job form 100% accuracy se fill karti hai. Bas neeche form dhundho aur apply karo.
          </p>

          {/* Trust Badges */}
          <div className="flex items-center justify-center gap-3 flex-wrap text-xs font-bold text-gray-500 dark:text-zinc-500">
            {["🛡️ 100% Secure", "⚡ 24-48 Hr Turnaround", "✅ Expert Team", "📱 WhatsApp Updates"].map(b => (
              <span key={b} className="px-3 py-1.5 bg-gray-100 dark:bg-zinc-900 rounded-full border border-gray-200 dark:border-zinc-800">{b}</span>
            ))}
          </div>
        </div>
      </div>

      {/* ── TABS ─────────────────────────────────────────────────────────── */}
      <div className="max-w-4xl mx-auto px-4 pt-6">
        <div className="flex bg-white dark:bg-zinc-950 p-1 rounded-2xl border border-gray-100 dark:border-zinc-900 shadow-sm w-full sm:w-fit">
          <button
            onClick={() => setActiveTab("find")}
            className={`flex-1 sm:flex-none px-6 py-2.5 rounded-xl text-sm font-black transition-all flex items-center justify-center gap-2 ${
              activeTab === "find"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/20"
                : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            }`}
          >
            <Search className="w-4 h-4" /> Find & Apply
          </button>
          <button
            onClick={() => {
              if (!user) {
                const fullUrl = window.location.pathname + window.location.search;
                window.location.href = `/login?redirect=${encodeURIComponent(fullUrl)}`;
                return;
              }
              setActiveTab("orders");
            }}
            className={`flex-1 sm:flex-none px-6 py-2.5 rounded-xl text-sm font-black transition-all flex items-center justify-center gap-2 ${
              activeTab === "orders"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/20"
                : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            }`}
          >
            <ClipboardList className="w-4 h-4" /> My Orders {user && orders.length > 0 && `(${orders.length})`}
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">

        {/* ── FIND & APPLY TAB ─────────────────────────────────────────── */}
        {activeTab === "find" && (
          <>
            {submitted && (
              <div className="bg-emerald-50 dark:bg-emerald-950/20 border-2 border-emerald-200 dark:border-emerald-800/50 rounded-3xl p-6 text-center space-y-4 animate-in zoom-in-95">
                <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto text-emerald-600"><CheckCircle2 className="w-10 h-10" /></div>
                <h2 className="text-xl font-black text-gray-900 dark:text-white">Request Placed Successfully!</h2>
                <p className="text-xs text-gray-500">Hamari expert team 24-48 hours mein aapka form submit kar degi.</p>
                <div className="inline-flex items-center gap-3 bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 px-6 py-3.5 rounded-2xl relative">
                  <div className="text-left">
                    <span className="text-[10px] text-gray-400 font-black uppercase block">Tracking ID</span>
                    <code className="text-sm font-mono font-black text-gray-800 dark:text-gray-200">{trackingId}</code>
                  </div>
                  <button 
                    onClick={handleCopy}
                    className="p-2 bg-gray-50 dark:bg-zinc-800 rounded-xl hover:bg-indigo-50 dark:hover:bg-indigo-950/40 border border-gray-200 dark:border-zinc-700 transition-all flex items-center justify-center shrink-0"
                    title="Copy ID"
                  >
                    {copied ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4 text-gray-500 dark:text-gray-400" />}
                  </button>
                </div>
                {copied && <p className="text-[10px] text-green-600 dark:text-green-400 font-extrabold -mt-2">Copied to Clipboard!</p>}
                <button onClick={() => setSubmitted(false)} className="text-xs font-black text-indigo-600 hover:underline mt-2 block">Search another form</button>
              </div>
            )}

            {/* Search Box */}
            <div className="bg-white dark:bg-zinc-950 rounded-2xl border border-gray-200 dark:border-zinc-800 shadow-sm overflow-hidden">
              <div className="relative">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-6 w-6 text-gray-400 dark:text-zinc-500" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Type job name to search... (e.g. SSC CGL, Railway NTPC)"
                  className="w-full pl-14 pr-12 py-5 text-base font-bold text-gray-900 dark:text-white bg-transparent placeholder:text-gray-400 dark:placeholder:text-zinc-600 focus:outline-none"
                  autoComplete="off"
                />
                {searchQuery && (
                  <button onClick={() => { setSearchQuery(""); setDebouncedQuery(""); searchInputRef.current?.focus(); }} className="absolute right-4 top-1/2 -translate-y-1/2 w-7 h-7 flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-white rounded-full hover:bg-gray-100 dark:hover:bg-zinc-800 transition-all">
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Search Results */}
            {hasSearchQuery && (
              <div className="space-y-3">
                <p className="text-xs font-black text-gray-400 uppercase tracking-widest">
                  {searchResults.length > 0 ? `${searchResults.length} form${searchResults.length > 1 ? "s" : ""} found` : "No results"}
                </p>

                {searchResults.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {searchResults.map(form => (
                      <FormCard key={form.id} form={form} isHighlighted />
                    ))}
                  </div>
                ) : (
                  /* Empty State */
                  <div className="bg-white dark:bg-zinc-950 rounded-2xl border border-dashed border-gray-200 dark:border-zinc-800 p-8 text-center space-y-4">
                    <div className="w-14 h-14 bg-gray-100 dark:bg-zinc-900 rounded-2xl flex items-center justify-center mx-auto">
                      <FileText className="w-7 h-7 text-gray-400" />
                    </div>
                    <div>
                      <h3 className="font-black text-gray-800 dark:text-white text-base">"{debouncedQuery}" form abhi available nahi hai</h3>
                      <p className="text-sm text-gray-400 mt-1">Is form ko add hone mein thoda time lag sakta hai.</p>
                    </div>
                    <a
                      href={`https://wa.me/918877434088?text=Hello+Rojgar+Suvidha+Team!+Kya+${encodeURIComponent(debouncedQuery)}+form+available+hai?+Please+mujhe+bataye.`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 px-5 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-black rounded-xl transition-all text-sm shadow-md shadow-emerald-500/20"
                    >
                      <MessageSquare className="w-4 h-4" />
                      WhatsApp pe Poochho
                    </a>
                  </div>
                )}
              </div>
            )}

            {/* Recently Added / Active Forms (shown when no search) */}
            {!hasSearchQuery && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="font-black text-gray-900 dark:text-white text-base flex items-center gap-2">
                      <Zap className="w-5 h-5 text-amber-500" /> Active Forms Right Now
                    </h2>
                    <p className="text-xs text-gray-400 mt-0.5">Ye forms abhi apply ke liye khuli hain</p>
                  </div>
                  <span className="text-xs font-black text-indigo-600 dark:text-indigo-400">{recentActiveForms.length} active</span>
                </div>

                {formsLoading ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {[1,2,3,4].map(i => (
                      <div key={i} className="bg-white dark:bg-zinc-950 rounded-2xl border border-gray-100 dark:border-zinc-900 p-5 animate-pulse h-28" />
                    ))}
                  </div>
                ) : recentActiveForms.length === 0 ? (
                  <div className="bg-white dark:bg-zinc-950 rounded-2xl border border-dashed border-gray-200 dark:border-zinc-800 p-8 text-center space-y-4">
                    <div className="w-14 h-14 bg-gray-100 dark:bg-zinc-900 rounded-2xl flex items-center justify-center mx-auto">
                      <ClipboardList className="w-7 h-7 text-gray-400" />
                    </div>
                    <div>
                      <h3 className="font-black text-gray-800 dark:text-white text-base">Abhi Koi Active Form Available Nahi Hai</h3>
                      <p className="text-sm text-gray-400 mt-1">Naya form aane par aapko notification milega. Tab tak aap baaki jobs dekh sakte hain.</p>
                    </div>
                    <div className="flex flex-wrap gap-3 justify-center">
                      <Link href="/latest-jobs" className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs shadow-sm">
                        Latest Jobs Dekhein →
                      </Link>
                      <a href="https://wa.me/918877434088?text=Naya form kab aayega?" target="_blank" rel="noreferrer" className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold text-xs shadow-sm">
                        WhatsApp Karen
                      </a>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {recentActiveForms.map(form => (
                      <FormCard key={form.id} form={form} />
                    ))}
                  </div>
                )}

                {/* All Forms Section (show all statuses after active) */}
                {allForms.filter(f => f.status !== "active").length > 0 && (
                  <div className="space-y-3 pt-2">
                    <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">Other Forms</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {allForms.filter(f => f.status !== "active").map(form => (
                        <FormCard key={form.id} form={form} />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 🖥️ e-Suvidha Digital Services Promotion */}
            <div className="bg-gradient-to-br from-emerald-600 to-teal-700 rounded-3xl p-6 sm:p-8 text-white mt-8 shadow-lg relative overflow-hidden">
              <div className="absolute -right-16 -top-16 w-40 h-40 bg-white/10 rounded-full blur-2xl pointer-events-none" />
              <h3 className="text-lg sm:text-xl font-extrabold mb-2">e-Suvidha Portal — Cyber Cafe ab aapke mobile mein! 📱</h3>
              <p className="text-xs sm:text-sm text-emerald-100 mb-6 max-w-xl">
                Sirf sarkari naukri hi nahi, aap ghar baithe PAN Card, Voter ID, Domicile/Caste certificates aur Learner License bhi banwa sakte hain hamare experts ke dwara.
              </p>
              <div className="flex flex-wrap gap-2.5">
                <Link href="/e-suvidha" className="px-5 py-2.5 bg-white text-emerald-800 font-black text-xs rounded-xl hover:bg-emerald-50 transition-all active:scale-95">
                  e-Suvidha Services Dekhein →
                </Link>
                <Link href="/pricing" className="px-5 py-2.5 bg-emerald-700/40 border border-white/20 text-white font-black text-xs rounded-xl hover:bg-emerald-700/60 transition-all active:scale-95">
                  Pricing Plans
                </Link>
              </div>
            </div>

            {/* Trust Stats & Testimonials Grid */}
            <div className="pt-8 border-t border-gray-100 dark:border-zinc-900/50 space-y-8">
              {/* Stats Section */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  { value: "15,000+", label: "Forms Filled", icon: "📝", color: "bg-indigo-50/50 text-indigo-700 border-indigo-100/50 dark:bg-indigo-900/10 dark:text-indigo-400 dark:border-indigo-800/40" },
                  { value: "4.9★", label: "Average Rating", icon: "⭐", color: "bg-amber-50/50 text-amber-700 border-amber-100/50 dark:bg-amber-900/10 dark:text-amber-400 dark:border-amber-800/40" },
                  { value: "100%", label: "Accuracy Rate", icon: "✅", color: "bg-green-50/50 text-green-700 border-green-100/50 dark:bg-green-900/10 dark:text-green-400 dark:border-green-800/40" },
                  { value: "₹99", label: "Facilitation Charge", icon: "💰", color: "bg-purple-50/50 text-purple-700 border-purple-100/50 dark:bg-purple-900/10 dark:text-purple-400 dark:border-purple-800/40" },
                ].map((stat) => (
                  <div key={stat.label} className={`p-4 rounded-2xl border text-center ${stat.color} transition-all`}>
                    <div className="text-2xl mb-1">{stat.icon}</div>
                    <div className="text-xl font-black">{stat.value}</div>
                    <div className="text-[10px] sm:text-xs font-black opacity-75">{stat.label}</div>
                  </div>
                ))}
              </div>

              {/* Testimonials Section */}
              <div className="space-y-4">
                <div className="text-center">
                  <h3 className="font-black text-gray-900 dark:text-white text-base">Students Trust Rojgar Suvidha</h3>
                  <p className="text-xs text-gray-400 mt-0.5">Read what candidates have to say about our expert service</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[
                    { text: "Cyber cafe jaane ki zaroorat nahi padi. Phone se hi document upload kiye, aur 1 day me receipt mil gayi.", name: "Rahul Kumar", role: "SSC Aspirant", city: "Patna, Bihar" },
                    { text: "Pehle form filling me hamesha mistake hoti thi. Best service, pure security aur accuracy ke saath.", name: "Priya Sharma", role: "Banking Aspirant", city: "Jaipur, Rajasthan" },
                    { text: "Aadhar upload secure laga, payment gateway easy hai. Tracking details SMS par update hotey rahe.", name: "Aman Verma", role: "Railway Aspirant", city: "Noida, Uttar Pradesh" },
                  ].map((t, idx) => (
                    <div key={idx} className="bg-white dark:bg-zinc-950 border border-gray-100 dark:border-zinc-900 rounded-2xl p-5 shadow-sm space-y-3">
                      <div className="flex gap-0.5 text-amber-400 text-sm">{"★".repeat(5)}</div>
                      <p className="text-xs text-gray-500 dark:text-zinc-400 leading-relaxed italic">"{t.text}"</p>
                      <div>
                        <div className="font-extrabold text-xs text-gray-900 dark:text-white">{t.name}</div>
                        <div className="text-[10px] text-gray-400 font-bold">{t.role} • {t.city}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}

        {/* ── MY ORDERS TAB ────────────────────────────────────────────── */}
        {activeTab === "orders" && (
          <div className="space-y-4">
            {ordersLoading ? (
              <div className="bg-white dark:bg-zinc-950 p-12 rounded-3xl border border-gray-100 dark:border-zinc-900 flex justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
              </div>
            ) : orders.length === 0 ? (
              <div className="bg-white dark:bg-zinc-950 p-12 rounded-3xl border border-gray-100 dark:border-zinc-900 text-center space-y-3">
                <ClipboardList className="w-12 h-12 text-gray-300 mx-auto" />
                <h3 className="text-base font-bold text-gray-700 dark:text-gray-300">Abhi tak koi order nahi hai.</h3>
                <p className="text-xs text-gray-500">Koi bhi active form dhundho aur apply karo.</p>
                <button onClick={() => setActiveTab("find")} className="mt-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-black shadow-sm">Find a Form</button>
              </div>
            ) : (
              orders.map((order) => (
                <div key={order.id} className="bg-white dark:bg-zinc-950 rounded-3xl border border-gray-100 dark:border-zinc-900 p-5 shadow-sm space-y-4 animate-in fade-in">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-gray-50 dark:border-zinc-900/50 pb-4">
                    <div>
                      <h3 className="text-sm font-black text-gray-900 dark:text-white">{order.job_title}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <Clock className="w-3.5 h-3.5 text-gray-400" />
                        <span className="text-[10px] text-gray-400 font-bold">{new Date(order.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
                        {order.job_url && (
                          <a href={order.job_url} target="_blank" rel="noreferrer" className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold hover:underline">View Official Ad</a>
                        )}
                      </div>
                    </div>
                    <div>{getStatusBadge(order.status)}</div>
                  </div>

                  {/* Flipkart Style Progress Timeline */}
                  <div className="grid grid-cols-4 gap-2 pt-2 relative">
                    <div className="absolute top-6 left-[12%] right-[12%] h-1 bg-gray-100 dark:bg-zinc-900 -z-10" />
                    {[
                      { key: "placed",     label: "Placed",       desc: "Order Placed"       },
                      { key: "verified",   label: "Verified",     desc: "Details Verified"   },
                      { key: "draft_sent", label: "Draft Shared", desc: "Approved on WhatsApp"},
                      { key: "submitted",  label: "Submitted",    desc: "Form Submitted"     }
                    ].map((step, idx) => {
                      const statuses = ["placed", "verified", "draft_sent", "submitted"];
                      const currentIdx = statuses.indexOf(order.status);
                      const stepIdx = statuses.indexOf(step.key);
                      const isCompleted = stepIdx <= currentIdx && order.status !== "rejected";
                      const isCurrent = step.key === order.status;
                      return (
                        <div key={step.key} className="text-center space-y-2">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center mx-auto text-xs font-black transition-all ${
                            isCompleted ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20"
                            : isCurrent ? "bg-amber-500 text-white shadow-lg shadow-amber-500/20"
                            : "bg-gray-100 dark:bg-zinc-900 text-gray-400"
                          }`}>
                            {isCompleted ? "✓" : idx + 1}
                          </div>
                          <p className={`text-[10px] font-black ${isCompleted ? "text-emerald-600 dark:text-emerald-400" : "text-gray-400"}`}>{step.label}</p>
                        </div>
                      );
                    })}
                  </div>

                  <div className="flex justify-end gap-2 border-t border-gray-50 dark:border-zinc-900/50 pt-4 text-xs font-bold">
                    <a href={`https://wa.me/918877434088?text=Hello+Rojgar+Suvidha,+my+order+ID+is+${order.payment_id}.+Please+update+the+status.`} target="_blank" rel="noreferrer"
                      className="px-4 py-2 border border-gray-200 dark:border-zinc-800 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-zinc-900 flex items-center gap-1.5 transition-all">
                      <MessageSquare className="w-4 h-4 text-emerald-500" /> Chat Support
                    </a>
                    {order.pdf_url && (
                      <a href={order.pdf_url} target="_blank" rel="noreferrer" className="px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 flex items-center gap-1.5 shadow-sm shadow-indigo-600/10 transition-all">
                        <Download className="w-4 h-4" /> Download PDF
                      </a>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function ApplyForMePage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-indigo-500" /></div>}>
      <ApplyForMeContent />
    </Suspense>
  );
}
