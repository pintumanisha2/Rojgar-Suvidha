"use client";

import React, { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { 
  ArrowLeft, ClipboardCheck, Loader2, CheckCircle2, AlertCircle, 
  ShieldCheck, FileText, ClipboardList, Clock, Sparkles, Download, MessageSquare
} from "lucide-react";
import Script from "next/script";
import { triggerPaymentSuccessNotification } from "@/lib/notificationTriggers";
import confetti from "canvas-confetti";

function ApplyForMeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [verificationCode, setVerificationCode] = useState("");
  const [trackingId, setTrackingId] = useState("");

  // Tabs: "apply" or "orders"
  const [activeTab, setActiveTab] = useState<"apply" | "orders">("apply");
  const [orders, setOrders] = useState<any[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);

  // Form fields
  const [jobTitle, setJobTitle] = useState(searchParams.get("job") || "");
  const [jobUrl, setJobUrl] = useState(searchParams.get("url") || "");
  const [note, setNote] = useState("");
  const [existingId, setExistingId] = useState("");
  const [existingPassword, setExistingPassword] = useState("");
  const [preferences, setPreferences] = useState("");

  const [termsAccepted, setTermsAccepted] = useState(false);
  
  // Smart Age Calculator State
  const [dob, setDob] = useState("");
  const [asOnDate, setAsOnDate] = useState(new Date().toISOString().split("T")[0]);

  const calculateAge = () => {
    if (!dob || !asOnDate) return null;
    const birthDate = new Date(dob);
    const targetDate = new Date(asOnDate);
    
    if (targetDate < birthDate) return null;

    let years = targetDate.getFullYear() - birthDate.getFullYear();
    let months = targetDate.getMonth() - birthDate.getMonth();
    let days = targetDate.getDate() - birthDate.getDate();

    if (days < 0) {
      months--;
      const previousMonth = new Date(targetDate.getFullYear(), targetDate.getMonth(), 0);
      days += previousMonth.getDate();
    }
    if (months < 0) {
      years--;
      months += 12;
    }

    const isEligible = years >= 18 && years <= 32;
    return { years, months, days, isEligible };
  };
  
  // Captcha state
  const [captcha, setCaptcha] = useState({ num1: 0, num2: 0 });
  const [captchaInput, setCaptchaInput] = useState("");

  const generateCaptcha = () => {
    setCaptcha({ 
      num1: Math.floor(Math.random() * 10) + 1, 
      num2: Math.floor(Math.random() * 10) + 1 
    });
    setCaptchaInput("");
  };

  const fetchUserOrders = async (userId: string) => {
    setOrdersLoading(true);
    try {
      const res = await fetch("/api/my-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      const data = await res.json();
      if (res.ok) {
        setOrders(data.orders || []);
      }
    } catch (err) {
      console.error("Fetch orders error:", err);
    } finally {
      setOrdersLoading(false);
    }
  };

  const logUserActivity = async (userId: string, action: string, path: string, metadata: any = {}) => {
    try {
      await fetch("/api/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, action, path, metadata }),
      });
    } catch (err) {
      console.error("Activity tracking failed:", err);
    }
  };

  useEffect(() => {
    generateCaptcha();
    const fetchUser = async () => {
      try {
        // ⏱️ Timeout: agar Supabase 8 second mein respond nahi kare → login pe redirect
        const sessionPromise = supabase.auth.getSession();
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("Auth check timed out")), 8000)
        );

        const { data: { session } } = await Promise.race([sessionPromise, timeoutPromise]) as Awaited<ReturnType<typeof supabase.auth.getSession>>;

        if (!session) {
          setLoading(false);
          const fullUrl = window.location.pathname + window.location.search;
          window.location.href = `/login?redirect=${encodeURIComponent(fullUrl)}`;
          return;
        }
        setUser(session.user);
        const { data: profileData } = await supabase
          .from("profiles").select("*").eq("id", session.user.id).single();
        setProfile(profileData);
        if (profileData?.date_of_birth) {
          setDob(profileData.date_of_birth);
        }
        
        // Load initial orders
        await fetchUserOrders(session.user.id);
        
        // Log access activity
        await logUserActivity(session.user.id, "access_apply_for_me", "/apply-for-me");

      } catch (err) {
        console.error("Apply-for-me fetch error:", err);
        setLoading(false);
        window.location.href = `/login?redirect=${encodeURIComponent("/apply-for-me")}`;
        return;
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [router]);


  // Tab switcher activity tracking
  const handleTabChange = (tab: "apply" | "orders") => {
    setActiveTab(tab);
    if (user) {
      logUserActivity(user.id, `view_${tab}_tab`, `/apply-for-me`);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!jobTitle.trim()) { setError("Job title is required."); return; }
    // URL format validation — must start with http:// or https://
    if (jobUrl.trim() && !/^https?:\/\/.+/i.test(jobUrl.trim())) {
      setError("Job URL must be a valid link starting with http:// or https://");
      return;
    }
    if (!termsAccepted) { setError("Please accept the Terms & Conditions to proceed."); return; }
    if (!profile?.full_name) { setError("Please complete your profile details first."); return; }
    
    // Validate Captcha
    if (parseInt(captchaInput) !== captcha.num1 + captcha.num2) {
      setError("Incorrect answer! Please solve the calculation again.");
      generateCaptcha();
      setCaptchaInput("");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      // 1. Create Order on Backend
      const res = await fetch("/api/submit-application", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: "50.00",
          customerName: profile.full_name,
          customerPhone: profile.mobile_number,
          customerEmail: user.email,
          formId: "apply_for_me",
          extraParams: {
            job_title: jobTitle,
            job_url: jobUrl,
            special_note: note
          }
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Payment order check fail ho gaya.");
        setSubmitting(false);
        return;
      }

      // Track Payment Initialized
      if (user) {
        logUserActivity(user.id, "payment_initiated", "/apply-for-me", {
          jobTitle,
          orderId: data.order_id
        });
      }

      // 2. Redirect to PhonePe Pay Page
      if (data.redirectUrl) {
        window.location.href = data.redirectUrl;
      } else {
        throw new Error("Unable to obtain checkout URL from PhonePe");
      }

    } catch (err: any) {
      console.error("Checkout Exception:", err);
      setError(err.message || "Payment checkout failed.");
      setSubmitting(false);
    }
  };

  // Callback validation parameter check
  useEffect(() => {
    const orderId = searchParams.get("order_id");
    const jobTitleParam = searchParams.get("job_title");
    const jobUrlParam = searchParams.get("job_url");
    const noteParam = searchParams.get("special_note");

    if (orderId && user) {
      const verifyAndSaveOrder = async () => {
        setLoading(true);
        try {
          const res = await fetch(`/api/track?order_id=${orderId}`);
          const statusData = await res.json();

          if (statusData.order_status === "PAID" || statusData.order_status === "ACTIVE") {
            // Save to database
            const { error: dbErr } = await supabase.from("apply_for_me_orders").insert({
              user_id: user.id,
              job_title: jobTitleParam || "Applied Vacancy",
              job_url: jobUrlParam || "",
              special_note: noteParam || "",
              payment_id: orderId,
              status: "placed",
              payment_status: "paid",
            });

            if (!dbErr) {
              setSubmitted(true);
              setTrackingId(orderId);
              logUserActivity(user.id, "application_order_placed_success", "/apply-for-me", { orderId });
              
              // 🔔 Trigger payment success notification
              triggerPaymentSuccessNotification(user.id, jobTitleParam || "Vacancy", orderId);
              
              // 🎉 Trigger Confetti micro-interaction
              try {
                confetti({
                  particleCount: 150,
                  spread: 80,
                  origin: { y: 0.6 }
                });
              } catch (e) {
                console.error("Confetti error:", e);
              }
              
              fetchUserOrders(user.id);
              setActiveTab("orders");
            } else {
              setError("Database insertion failed: " + dbErr.message);
            }
          } else {
            setError("Payment verified status: " + statusData.order_status);
          }
        } catch (err: any) {
          console.error("Order completion verification failure:", err);
          setError("Failed to verify transaction status.");
        } finally {
          setLoading(false);
        }
      };
      verifyAndSaveOrder();
    }
  }, [searchParams, user]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "placed":
        return <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-blue-50 text-blue-600 border border-blue-100">Order Placed</span>;
      case "verified":
        return <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-amber-50 text-amber-600 border border-amber-100">Verified</span>;
      case "draft_sent":
        return <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-purple-50 text-purple-600 border border-purple-100">Draft Shared</span>;
      case "submitted":
        return <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-green-50 text-green-600 border border-green-100">Submitted</span>;
      case "rejected":
        return <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-red-50 text-red-600 border border-red-100">Rejected (Refunded)</span>;
      default:
        return <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-gray-50 text-gray-600 border border-gray-100">Pending</span>;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
      </div>
    );
  }

  return (
    <>
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-violet-50 dark:from-gray-950 dark:via-gray-900 dark:to-indigo-950 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      
      <div className="max-w-4xl w-full mx-auto space-y-6">
        
        {/* Back Link */}
        <div>
          <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-indigo-600 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </Link>
        </div>

        {/* Title Block */}
        <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-2">
              Apply For Me <Sparkles className="w-5 h-5 text-amber-500 animate-pulse" />
            </h1>
            <p className="text-xs text-gray-500 mt-1">Aapki jagah hamari team vacancy forms fill karegi without mistakes.</p>
          </div>
          
          {/* Tabs Switcher */}
          <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-xl border border-gray-200 dark:border-gray-700 w-full sm:w-auto">
            <button
              onClick={() => handleTabChange("apply")}
              className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                activeTab === "apply" 
                  ? "bg-white dark:bg-gray-700 text-indigo-600 dark:text-white shadow-sm" 
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <ClipboardCheck className="w-4 h-4" /> Apply Now
            </button>
            <button
              onClick={() => handleTabChange("orders")}
              className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                activeTab === "orders" 
                  ? "bg-white dark:bg-gray-700 text-indigo-600 dark:text-white shadow-sm" 
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <ClipboardList className="w-4 h-4" /> My Orders ({orders.length})
            </button>
          </div>
        </div>

        {/* Success Alert */}
        {submitted && (
          <div className="bg-green-50 dark:bg-green-950/20 border-2 border-green-200 dark:border-green-800/50 rounded-3xl p-6 text-center space-y-4 animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto text-green-600">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <div className="space-y-1">
              <h2 className="text-xl font-black text-gray-900 dark:text-white">Request Placed Successfully!</h2>
              <p className="text-xs text-gray-500">Hamari expert team aapka form verify karke 24-48 hours me submit kar degi.</p>
            </div>
            <div className="inline-block bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 px-4 py-2 rounded-2xl">
              <span className="text-[10px] text-gray-400 font-bold uppercase block">Payment Tracking ID</span>
              <code className="text-sm font-mono font-bold text-gray-800 dark:text-gray-200">{trackingId}</code>
            </div>
            <div className="pt-2">
              <button onClick={() => { setSubmitted(false); setTrackingId(""); }} className="text-xs font-bold text-indigo-600 hover:underline">Apply for another job</button>
            </div>
          </div>
        )}

        {/* ─── TAB CONTENT: APPLICATIONS LIST ─── */}
        {activeTab === "orders" && (
          <div className="space-y-4">
            {ordersLoading ? (
              <div className="bg-white dark:bg-gray-900 p-12 rounded-3xl border border-gray-100 dark:border-gray-800 flex justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
              </div>
            ) : orders.length === 0 ? (
              <div className="bg-white dark:bg-gray-900 p-12 rounded-3xl border border-gray-100 dark:border-gray-800 text-center space-y-3">
                <ClipboardList className="w-12 h-12 text-gray-300 mx-auto" />
                <h3 className="text-base font-bold text-gray-700 dark:text-gray-300">You have not placed any application requests yet.</h3>
                <p className="text-xs text-gray-500">Apply now to get your Government & Private job forms filled error-free by our experts.</p>
                <button onClick={() => setActiveTab("apply")} className="mt-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold">Apply Now</button>
              </div>
            ) : (
              // FLIPKART STYLE TIMELINE CARDS
              orders.map((order) => (
                <div key={order.id} className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 p-5 shadow-xl space-y-4 animate-in fade-in duration-200">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-gray-50 dark:border-gray-800/50 pb-4">
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
                    <div>
                      {getStatusBadge(order.status)}
                    </div>
                  </div>

                  {/* Flipkart Style Order Ticks Timeline */}
                  <div className="grid grid-cols-4 gap-2 pt-2 relative">
                    <div className="absolute top-6 left-[12%] right-[12%] h-1 bg-gray-100 dark:bg-gray-800 -z-10" />
                    
                    {[
                      { key: "placed", label: "Placed", desc: "Order Placed" },
                      { key: "verified", label: "Verified", desc: "Details Verified" },
                      { key: "draft_sent", label: "Draft Shared", desc: "Approved on WhatsApp" },
                      { key: "submitted", label: "Submitted", desc: "Form Submitted" }
                    ].map((step, idx) => {
                      const statuses = ["placed", "verified", "draft_sent", "submitted"];
                      const currentIdx = statuses.indexOf(order.status);
                      const stepIdx = statuses.indexOf(step.key);
                      const isCompleted = stepIdx <= currentIdx && order.status !== "rejected";
                      const isCurrent = step.key === order.status;

                      return (
                        <div key={step.key} className="text-center space-y-2">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center mx-auto text-xs font-black transition-all ${
                            isCompleted 
                              ? "bg-green-500 text-white shadow-lg shadow-green-500/20" 
                              : isCurrent
                              ? "bg-amber-500 text-white shadow-lg shadow-amber-500/20"
                              : "bg-gray-100 dark:bg-gray-800 text-gray-400"
                          }`}>
                            {isCompleted ? "✓" : idx + 1}
                          </div>
                          <div>
                            <p className={`text-[10px] font-black ${isCompleted ? "text-green-600 dark:text-green-400" : "text-gray-500"}`}>{step.label}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Action Bar (Download PDF / Support Chat) */}
                  <div className="flex justify-end gap-2 border-t border-gray-50 dark:border-gray-800/50 pt-4 text-xs font-bold">
                    <a 
                      href={`https://wa.me/918118029532?text=Hello%20Rojgar%20Suvidha%20Team,%20my%20order%20ID%20is%20${order.payment_id}.%20Please%20update%20the%20status.`}
                      target="_blank"
                      rel="noreferrer"
                      className="px-4 py-2 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center gap-1.5"
                    >
                      <MessageSquare className="w-4 h-4 text-emerald-500" /> Chat Support
                    </a>
                    {order.pdf_url && (
                      <a 
                        href={order.pdf_url} 
                        target="_blank"
                        rel="noreferrer"
                        className="px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 flex items-center gap-1.5 shadow-md shadow-indigo-600/10"
                      >
                        <Download className="w-4 h-4" /> Download PDF
                      </a>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* ─── TAB CONTENT: APPLY FORM ─── */}
        {activeTab === "apply" && (
          <div className="bg-white dark:bg-gray-900 py-8 px-4 shadow-2xl sm:rounded-3xl sm:px-10 border border-gray-100 dark:border-gray-800 animate-in fade-in duration-200">
            
            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* Profile complete warning */}
              {!profile?.full_name && (
                <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-2xl p-4 flex gap-3">
                  <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-bold text-red-800 dark:text-red-400">Profile Incomplete!</h4>
                    <p className="text-xs text-red-700 dark:text-red-300/80 leading-relaxed mt-0.5">
                      Please complete your details on the profile setup page so that we can access your application data.
                    </p>
                    <Link href="/profile-setup" className="inline-block mt-2 text-xs font-black text-indigo-600 hover:underline">Complete Setup Now →</Link>
                  </div>
                </div>
              )}

              {/* Form Input fields */}
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Job/Vacancy Title *</label>
                <input
                  type="text"
                  required
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  className="appearance-none block w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 placeholder-gray-400 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 font-medium text-sm transition-all"
                  placeholder="e.g. SSC MTS 2024 / Railway NTPC"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Official Notification Link (Optional)</label>
                <input
                  type="url"
                  value={jobUrl}
                  onChange={(e) => setJobUrl(e.target.value)}
                  className="appearance-none block w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 placeholder-gray-400 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 font-medium text-sm transition-all"
                  placeholder="https://example.com/notification.pdf"
                />
              </div>

              {/* Special Note Box */}
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Special instructions / Center choices</label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={3}
                  className="appearance-none block w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 placeholder-gray-400 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 font-medium text-sm transition-all resize-none"
                  placeholder="Apna center preference, category detail ya koi special instruction yahan likhein..."
                />
              </div>

              {/* Smart Age Eligibility Calculator block */}
              <div className="bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/50 rounded-2xl p-4 space-y-4">
                <h4 className="text-xs font-black text-indigo-900 dark:text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
                  🛡️ Age & Eligibility Calculator
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-500 dark:text-gray-400 mb-1">Date of Birth</label>
                    <input 
                      type="date" 
                      value={dob} 
                      onChange={(e) => setDob(e.target.value)} 
                      className="block w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-xs text-gray-800 dark:text-white font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-500 dark:text-gray-400 mb-1">Calculate Age As On</label>
                    <input 
                      type="date" 
                      value={asOnDate} 
                      onChange={(e) => setAsOnDate(e.target.value)} 
                      className="block w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-xs text-gray-800 dark:text-white font-medium"
                    />
                  </div>
                </div>
                {dob && (
                  <div className="bg-white dark:bg-gray-900 p-3 rounded-xl border border-indigo-100/50 dark:border-indigo-950 flex items-center justify-between text-xs">
                    <div>
                      <span className="text-gray-400 font-bold block">Current Age Status:</span>
                      {calculateAge() ? (
                        <p className="font-extrabold text-gray-800 dark:text-gray-200 mt-0.5">
                          {calculateAge()?.years} Years, {calculateAge()?.months} Months, {calculateAge()?.days} Days
                        </p>
                      ) : (
                        <p className="text-red-500 font-bold mt-0.5">Invalid target date</p>
                      )}
                    </div>
                    {calculateAge()?.isEligible ? (
                      <span className="px-2 py-0.5 bg-green-500 text-white rounded-md font-bold text-[10px]">Standard Age Fit</span>
                    ) : (
                      <span className="px-2 py-0.5 bg-amber-500 text-white rounded-md font-bold text-[10px]">Age Alert / Review Required</span>
                    )}
                  </div>
                )}
              </div>

              {/* Bot Check Captcha */}
              <div className="pt-2">
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Security Check (Anti-Bot) <span className="text-red-500">*</span></label>
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="flex-1 min-w-[140px] bg-indigo-50 dark:bg-indigo-950/20 px-4 py-3 rounded-xl border-2 border-indigo-100 dark:border-indigo-900 flex items-center justify-center">
                    <span className="font-mono font-black text-xl text-indigo-700 dark:text-indigo-300 tracking-widest">
                      {captcha.num1} + {captcha.num2} = ?
                    </span>
                  </div>
                  <input type="number" required value={captchaInput} onChange={e => setCaptchaInput(e.target.value)}
                    className="flex-[2] min-w-[100px] px-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 font-bold text-lg transition-all text-center"
                    placeholder="Your answer" />
                  <button
                    type="button"
                    onClick={() => { generateCaptcha(); setCaptchaInput(""); }}
                    className="flex items-center gap-1.5 px-4 py-3 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-xl font-bold text-xs transition-all border border-gray-200 dark:border-gray-700 whitespace-nowrap"
                    title="Get a new math question"
                  >
                    🔄 Try new sum
                  </button>
                </div>
                <p className="text-[11px] text-gray-400 mt-1.5">Solve the simple math above to verify you are human.</p>
              </div>

              {/* Notice */}
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 flex gap-3">
                <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-700 dark:text-amber-300 leading-relaxed">
                  Your documents (Photo, Signature, Aadhaar) must be pre-uploaded in the "My Documents" section of your Dashboard. If they are not, please upload them first.
                </p>
              </div>

              {/* Collapsible Terms and Conditions */}
              <details className="mt-6 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden bg-gray-50 dark:bg-gray-800/50 group">
                <summary className="bg-white dark:bg-gray-800 px-4 py-4 cursor-pointer list-none flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800/80 transition-colors border-b border-gray-200 dark:border-gray-800">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center">
                      <FileText className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-gray-900 dark:text-white">View Terms & Conditions</h4>
                      <p className="text-[10px] text-gray-500 mt-0.5">Click here to read all 21 points</p>
                    </div>
                  </div>
                  <div className="w-6 h-6 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center group-open:rotate-180 transition-transform">
                    <svg className="w-3 h-3 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </summary>
                <div className="p-5 h-64 overflow-y-auto text-xs text-gray-600 dark:text-gray-400 space-y-3 leading-relaxed custom-scrollbar bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800/50">
                  <p>1. <strong>"Apply For Me"</strong> is a paid service with a non-refundable service charge of ₹50 INR.</p>
                  <p>2. We only assist in filling out the application form. We are not responsible for your selection, exam scheduling, or admit card issuance.</p>
                  <p>3. All documents uploaded by you (Photo, Signature, Aadhar, etc.) must be clear and strictly adhere to the official notification guidelines.</p>
                  <p>4. Rojgar Suvidha will not be held liable if your application is rejected due to incorrect details provided by you.</p>
                  <p>5. We are not responsible if the vacancies deadline passes due to server crashes.</p>
                  <p>6. The official examination fee must be paid separately by you when our team shares the payment link.</p>
                  <p>7. The application submission process may take between 24 to 48 hours to complete.</p>
                  <p>8. Before final submission, our team will send a draft/preview to your WhatsApp for confirmation.</p>
                  <p>9. Once the form is finally submitted, no corrections can be made by us.</p>
                  <p>10. You can track the live status of your application directly from your dashboard.</p>
                  <p>11. We only process verified government and private vacancies.</p>
                  <p>12. Your data (documents, personal information) is 100% secure and encrypted.</p>
                  <p>13. After your form is successfully submitted, you will have the option to delete sensitive documents.</p>
                  <p>14. You must independently verify vacancy eligibility constraints.</p>
                  <p>15. The final application PDF will be sent to you via SMS, WhatsApp or email.</p>
                  <p>16. If we are unable to fill out your form for any reason, the ₹50 INR service charge will be refunded.</p>
                  <p>17. Exam Center choices will be filled randomly unless you specify preferences in the box.</p>
                  <p>18. Call support is available during working hours (10 AM - 6 PM).</p>
                  <p>19. PwD candidates must upload a valid PwD certificate.</p>
                  <p>20. If a payment fails, do not attempt another payment until transaction is confirmed.</p>
                  <p>21. I agree that I have read the vacancy notifications thoroughly.</p>
                </div>
              </details>

              <label className="flex items-start gap-3 p-4 border border-gray-200 dark:border-gray-800 rounded-xl cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                <div className="flex items-center h-5 mt-0.5">
                  <input 
                    type="checkbox" 
                    checked={termsAccepted}
                    onChange={(e) => setTermsAccepted(e.target.checked)}
                    className="w-5 h-5 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500 dark:focus:ring-indigo-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600 cursor-pointer"
                  />
                </div>
                <div className="text-sm">
                  <span className="font-bold text-gray-900 dark:text-white">I agree to all Terms and Conditions</span>
                  <p className="text-gray-500 dark:text-gray-400 text-xs mt-0.5">I have read all 21 points and vacancy guidelines.</p>
                </div>
              </label>

              {error && <div className="text-sm font-bold text-red-500 bg-red-50 dark:bg-red-900/20 p-3 rounded-xl text-center border border-red-200 dark:border-red-800">{error}</div>}

              <button type="submit" disabled={submitting || !profile?.full_name || !termsAccepted}
                className="w-full flex items-center justify-center gap-2 py-4 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-xl font-extrabold text-base shadow-lg shadow-orange-500/30 transition-all disabled:opacity-60 disabled:cursor-not-allowed mt-4">
                {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <ClipboardCheck className="w-5 h-5" />}
                {submitting ? "Processing..." : "Pay & Submit Request"}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
    </>
  );
}

export default function ApplyForMePage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-indigo-500" /></div>}>
      <ApplyForMeContent />
    </Suspense>
  );
}
