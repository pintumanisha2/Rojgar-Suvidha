"use client";

import React, { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { ArrowLeft, ClipboardCheck, Loader2, CheckCircle2, AlertCircle, ShieldCheck, FileText } from "lucide-react";
import Script from "next/script";

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

  // Form fields
  const [jobTitle, setJobTitle] = useState(searchParams.get("job") || "");
  const [jobUrl, setJobUrl] = useState(searchParams.get("url") || "");
  const [note, setNote] = useState("");
  // FIX: Removed unused paymentVerified state

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

  useEffect(() => {
    generateCaptcha();
    const fetchUser = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          const fullUrl = window.location.pathname + window.location.search;
          router.push(`/login?redirect=${encodeURIComponent(fullUrl)}`);
          return;
        }
        setUser(session.user);
        const { data: profileData } = await supabase
          .from("profiles").select("*").eq("id", session.user.id).single();
        setProfile(profileData);
      } catch (err) {
        console.error("Apply-for-me fetch error:", err);
      } finally {
        setLoading(false); // FIX: Always stop spinner even on network error
      }
    };
    fetchUser();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!jobTitle.trim()) { setError("Job ka naam daalna zaroori hai."); return; }
    
    // FIX: Guard against keyboard Enter bypassing the disabled button
    if (!termsAccepted) { setError("Pehle Terms & Conditions accept karein."); return; }
    if (!profile?.full_name) { setError("Pehle apna profile complete karein."); return; }
    
    // Validate Captcha
    if (parseInt(captchaInput) !== captcha.num1 + captcha.num2) {
      setError("Captcha ka answer galat hai! Kripya sahi calculation bharein.");
      generateCaptcha(); // Reset on failure to prevent bot spam
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      // 1. Create Order on Backend
      const res = await fetch("/api/create-cashfree-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          amount: 50,
          customerName: profile?.full_name || "Applicant",
          customerPhone: profile?.mobile_number || "9999999999",
          customerEmail: user.email || "test@gmail.com",
          formId: "apply-for-me"
        }),
      });

      const order = await res.json();

      if (!res.ok) {
        throw new Error(order.error || "Payment system is currently unavailable.");
      }

      // 2. Open Cashfree Checkout Modal
      const cashfree = new (window as any).Cashfree({
          mode: process.env.NEXT_PUBLIC_CASHFREE_MODE || "sandbox",
      });

      const checkoutOptions = {
          paymentSessionId: order.payment_session_id,
          redirectTarget: "_modal",
      };

      cashfree.checkout(checkoutOptions).then(async (result: any) => {
          if (result.error) {
              setError(`Payment failed: ${result.error.message}`);
              setSubmitting(false);
              return;
          }
          if (result.paymentDetails) {
            // Generate unique codes
            const code = "RS-" + Math.floor(1000 + Math.random() * 9000).toString();
            const tId = "AFM-" + Math.random().toString(36).slice(2, 10).toUpperCase();

            // 3. Save to Supabase after successful payment
            const { data: insertedRow, error: insertError } = await supabase
              .from("apply_for_me_requests")
              .insert({
                user_id: user.id,
                applicant_name: profile?.full_name || "",
                phone_number: profile?.mobile_number || "",
                email: user.email || "",
                job_title: jobTitle.trim(),
                job_url: jobUrl.trim() || null,
                status: "paid",
                admin_notes: `[Cashfree Payment] ` + (note.trim() || ""),
                verification_code: code,
                tracking_id: tId,
              })
              .select("id")
              .single();

            if (insertError) {
              setError("Payment successful but failed to save request. Contact support.");
            } else {
              setVerificationCode(code);
              setTrackingId(tId);
              setSubmitted(true);
            }
            setSubmitting(false);
          }
      });
      
    } catch (err: any) {
      setError(err.message || "Failed to initialize payment.");
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 shadow-2xl p-7 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8 text-green-500" />
          </div>
          <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white mb-2">Request Successful! 🎉</h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed mb-4">
            Hamari team 24 ghante ke andar form fill karegi. Neeche wala <strong className="text-gray-700 dark:text-gray-200">Secret Code save karo</strong> — call ke time kaam aayega.
          </p>

          {/* Tracking ID */}
          <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-700 rounded-xl px-4 py-3 mb-4 flex items-center justify-between">
            <div className="text-left">
              <p className="text-[10px] font-extrabold text-indigo-500 uppercase tracking-wider">Tracking ID</p>
              <p className="text-base font-extrabold text-indigo-700 dark:text-indigo-300 font-mono">{trackingId}</p>
            </div>
            <p className="text-xs text-indigo-400 dark:text-indigo-500 text-right">Dashboard mein<br />status track karo</p>
          </div>

          {/* Anti-scam verification code */}
          <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-400 dark:border-red-500 rounded-2xl p-5 mb-4 text-left">
            <p className="text-[11px] font-extrabold text-red-600 dark:text-red-400 uppercase tracking-wider mb-2">
              🔐 Aapka Secret Verification Code
            </p>
            <div className="text-3xl font-extrabold text-red-700 dark:text-red-300 tracking-widest text-center py-3 bg-white dark:bg-gray-900 rounded-xl border border-red-200 dark:border-red-700 my-2 font-mono">
              {verificationCode}
            </div>
            <p className="text-xs text-red-700 dark:text-red-300 leading-relaxed mt-3">
              ⚠️ <strong>Jab hamari team call kare</strong>, woh pehle yeh code bolenge.<br />
              Agar caller yeh code <strong>nahi bata sake</strong> — woh <strong>SCAMMER hai</strong>, turant call kaat do.
            </p>
          </div>

          <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-700 rounded-xl p-3 mb-5 text-xs text-amber-800 dark:text-amber-300 text-left">
            📌 Yeh code Dashboard → Requests tab mein bhi hamesha dikhega.
          </div>

          <div className="space-y-3">
            <Link href="/dashboard?tab=requests"
              className="block w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-center transition-all shadow-lg shadow-indigo-500/30">
              Dashboard par Jaayein
            </Link>
            <Link href="/"
              className="block w-full py-3 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 rounded-xl font-bold text-center hover:bg-gray-50 transition-all">
              Aur Jobs Dekhein
            </Link>
          </div>
        </div>
      </div>
    );
  }


  return (
    <>
    <Script src="https://sdk.cashfree.com/js/v3/cashfree.js" strategy="lazyOnload" />
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-12 px-4">
      <div className="max-w-2xl mx-auto">

        {/* Back */}
        <Link href="/" className="inline-flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-indigo-600 mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Wapas Jaao
        </Link>

        {/* ── HERO EXPLAINER ── */}
        <div className="bg-gradient-to-br from-indigo-700 via-indigo-800 to-violet-900 rounded-2xl p-5 sm:p-7 mb-6 text-white shadow-xl border border-indigo-600/30">

          {/* Title */}
          <div className="flex items-center gap-3 mb-4">
            <div className="w-11 h-11 bg-orange-500/20 rounded-2xl flex items-center justify-center border border-orange-400/30 shrink-0">
              <ClipboardCheck className="w-6 h-6 text-orange-400" />
            </div>
            <div>
              <h1 className="text-lg sm:text-2xl font-extrabold leading-tight">Apply For Me Service</h1>
              <p className="text-indigo-200 text-[11px] sm:text-sm font-medium">Sarkari Naukri Form — Hum Bharenge, Tension Mat Lo!</p>
            </div>
          </div>

          {/* What is it */}
          <div className="bg-white/10 rounded-xl p-3.5 mb-5 text-sm text-indigo-100 leading-relaxed border border-white/10">
            <span className="text-white font-extrabold">🤔 Ye service kya hai?</span>
            <br />
            Kisi bhi <strong className="text-orange-300">Sarkari Naukri (SSC, Railway, Police, Army, Bank)</strong> ka online form khud bharna
            bahut mushkil hota hai — photo resize, fee payment, galat details se rejection ka darr...
            <br /><br />
            <strong className="text-white">Hum sab karte hain aapke liye.</strong> Aap bas job select karo aur payment karo — baaki hamari expert team sambhalegi. ✅
          </div>

          {/* Step-by-step visual flow */}
          <p className="text-[10px] sm:text-xs font-extrabold text-indigo-300 uppercase tracking-widest mb-3">
            📌 Exactly kaise use karna hai — Step by Step:
          </p>

          <div className="space-y-2.5">
            {/* Step 1 */}
            <div className="flex gap-3 items-start bg-white/10 rounded-xl p-3 border border-white/10">
              <div className="w-7 h-7 rounded-full bg-indigo-500 border-2 border-indigo-300 flex items-center justify-center text-xs font-extrabold shrink-0">1</div>
              <div>
                <p className="text-sm font-extrabold text-white">Koi bhi Job dhundho</p>
                <p className="text-xs text-indigo-200 mt-0.5">
                  Homepage par ya "Latest Jobs" mein apni pasand ki Sarkari Naukri dhundho —
                  jaise <span className="text-orange-300 font-bold">SSC CGL, Railway Group D, UP Police</span> etc.
                </p>
              </div>
            </div>

            {/* Arrow */}
            <div className="text-center text-indigo-400 text-sm font-bold">↓</div>

            {/* Step 2 */}
            <div className="flex gap-3 items-start bg-white/10 rounded-xl p-3 border border-white/10">
              <div className="w-7 h-7 rounded-full bg-indigo-500 border-2 border-indigo-300 flex items-center justify-center text-xs font-extrabold shrink-0">2</div>
              <div>
                <p className="text-sm font-extrabold text-white">Job page par jaao aur "Apply For Me" button dhundho</p>
                <p className="text-xs text-indigo-200 mt-0.5">
                  Job detail page par neeche scroll karo — wahan ek <span className="bg-orange-500/30 text-orange-300 font-bold px-1.5 py-0.5 rounded">🚀 Apply For Me</span> button hoga.
                  Usi par click karo.
                </p>
              </div>
            </div>

            {/* Arrow */}
            <div className="text-center text-indigo-400 text-sm font-bold">↓</div>

            {/* Step 3 */}
            <div className="flex gap-3 items-start bg-white/10 rounded-xl p-3 border border-white/10">
              <div className="w-7 h-7 rounded-full bg-indigo-500 border-2 border-indigo-300 flex items-center justify-center text-xs font-extrabold shrink-0">3</div>
              <div>
                <p className="text-sm font-extrabold text-white">Yahan aao — details confirm karo</p>
                <p className="text-xs text-indigo-200 mt-0.5">
                  Job ka naam automatically fill ho jaayega. Bas apna profile check karo
                  aur confirm karo ki sab sahi hai.
                </p>
              </div>
            </div>

            {/* Arrow */}
            <div className="text-center text-indigo-400 text-sm font-bold">↓</div>

            {/* Step 4 */}
            <div className="flex gap-3 items-start bg-emerald-500/20 rounded-xl p-3 border border-emerald-400/30">
              <div className="w-7 h-7 rounded-full bg-emerald-500 border-2 border-emerald-300 flex items-center justify-center text-xs font-extrabold shrink-0">✓</div>
              <div>
                <p className="text-sm font-extrabold text-white">Payment karo — Kaam ho gaya! 🎉</p>
                <p className="text-xs text-emerald-200 mt-0.5">
                  Secure online payment ke baad hamari team <strong>24 ghante ke andar</strong> aapka form fill karegi.
                  Status aap Dashboard par check kar sakte ho.
                </p>
              </div>
            </div>
          </div>

          {/* Tip */}
          <div className="mt-4 bg-yellow-400/10 border border-yellow-400/20 rounded-xl px-4 py-2.5 flex items-start gap-2">
            <span className="text-lg shrink-0">💡</span>
            <p className="text-xs text-yellow-200">
              <strong className="text-yellow-300">Seedha yahan aaye hain?</strong> Neeche apna form manually bhi fill kar sakte ho —
              bas job ka naam aur link do, hum baki sambhal lenge.
            </p>
          </div>
        </div>

        {/* Divider before form */}
        <div className="flex items-center gap-3 mb-5">
          <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
          <span className="text-xs font-extrabold text-gray-400 dark:text-gray-500 uppercase tracking-wider px-2">
            Ya seedha form baro
          </span>
          <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
        </div>


        <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
          
          {/* Profile Preview */}
          <div className="p-6 bg-indigo-50 dark:bg-indigo-900/20 border-b border-indigo-100 dark:border-indigo-800">
            <h3 className="text-sm font-bold text-indigo-800 dark:text-indigo-300 mb-3 uppercase tracking-wider">Aapki Details (Profile se)</h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="bg-white dark:bg-gray-800 rounded-xl p-3">
                <p className="text-xs text-gray-400">Full Name</p>
                <p className="font-bold text-gray-900 dark:text-white">{profile?.full_name || "Profile mein add karein"}</p>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-xl p-3">
                <p className="text-xs text-gray-400">Mobile</p>
                <p className="font-bold text-gray-900 dark:text-white">{profile?.mobile_number ? `+91 ${profile.mobile_number}` : "—"}</p>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-xl p-3 col-span-2">
                <p className="text-xs text-gray-400">Email</p>
                <p className="font-bold text-gray-900 dark:text-white">{user?.email || "—"}</p>
              </div>
            </div>
            {!profile?.full_name && (
              <Link href="/profile-setup" className="mt-3 inline-block text-xs font-bold text-orange-600 underline">
                ⚠️ Pehle apna profile complete karein →
              </Link>
            )}
          </div>

          {/* Smart Age Eligibility Calculator */}
          <div className="p-6 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 border-b border-indigo-100 dark:border-indigo-800/50">
            <h3 className="text-sm font-bold text-indigo-800 dark:text-indigo-300 mb-4 flex items-center gap-2">
              <span className="text-xl">🧮</span> Smart Age Eligibility Calculator
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1">Aapki Date of Birth (DOB)</label>
                <input 
                  type="date" 
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  className="w-full px-3 py-2 border border-indigo-200 dark:border-indigo-700/50 rounded-lg bg-white dark:bg-gray-800 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1">Age as on (Notification Date)</label>
                <input 
                  type="date" 
                  value={asOnDate}
                  onChange={(e) => setAsOnDate(e.target.value)}
                  className="w-full px-3 py-2 border border-indigo-200 dark:border-indigo-700/50 rounded-lg bg-white dark:bg-gray-800 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
            </div>
            {dob && asOnDate && calculateAge() && (
              <div className={`p-3 rounded-xl border flex items-start gap-3 ${calculateAge()!.isEligible ? 'bg-green-100 dark:bg-green-900/30 border-green-200 dark:border-green-800 text-green-800 dark:text-green-300' : 'bg-red-100 dark:bg-red-900/30 border-red-200 dark:border-red-800 text-red-800 dark:text-red-300'}`}>
                {calculateAge()!.isEligible ? <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" /> : <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />}
                <div>
                  <p className="font-extrabold text-sm mb-0.5">
                    Your Age: {calculateAge()!.years} Years, {calculateAge()!.months} Months, {calculateAge()!.days} Days
                  </p>
                  <p className="text-xs font-medium">
                    {calculateAge()!.isEligible 
                      ? "🟢 You are generally ELIGIBLE for this job (Age is between 18 and 32). Please verify exact age limits from the official notification." 
                      : "🔴 You might NOT BE ELIGIBLE based on 18–32 general limit. Please check category relaxation (OBC/SC/ST/Ex-servicemen) in the official notification."}
                  </p>
                  <p className="text-[10px] mt-1 opacity-70">⚠️ This calculator uses a general 18–32 range. Always verify from official notification.</p>
                </div>
              </div>
            )}
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                  Job ka Naam / Post <span className="text-red-500">*</span>
                </label>
                <input type="text" required value={jobTitle} onChange={e => setJobTitle(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 font-medium text-sm transition-all"
                  placeholder="e.g. Railway Group D, UP Police Constable..." />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                  Job ka Link (Optional)
                </label>
                <input type="url" value={jobUrl} onChange={e => setJobUrl(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 font-medium text-sm transition-all"
                  placeholder="https://..." />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                  Koi Special Note? (Optional)
                </label>
                <textarea value={note} onChange={e => setNote(e.target.value)} rows={2}
                  className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 font-medium text-sm transition-all"
                  placeholder="e.g. SC category mein apply karna hai, last date kal hai..." />
              </div>
            </div>

            {/* Secure Payment Integration */}
            <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-800">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
                Secure Payment
              </h3>
              
              <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-2xl p-5 mb-5 flex items-center gap-4">
                <div className="shrink-0 w-12 h-12 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center shadow-sm">
                  <ShieldCheck className="w-6 h-6 text-orange-500" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-gray-900 dark:text-white">Service Charge: <span className="text-orange-600 dark:text-orange-400 text-lg">₹50/-</span></p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Proceed to pay securely via Cashfree (UPI, Cards, NetBanking).
                  </p>
                </div>
              </div>
            </div>

            {/* Anti-Spam Captcha */}
            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-800">
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                Security Check (Anti-Bot) <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center gap-4">
                <div className="flex-1 bg-gray-100 dark:bg-gray-800 px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 flex items-center justify-center">
                  <span className="font-mono font-bold text-lg text-gray-800 dark:text-gray-200 tracking-widest">
                    {captcha.num1} + {captcha.num2} = ?
                  </span>
                </div>
                <div className="flex-[2]">
                  <input type="number" required value={captchaInput} onChange={e => setCaptchaInput(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 font-medium text-sm transition-all text-center"
                    placeholder="Answer likhein..." />
                </div>
              </div>
            </div>

            {/* Notice */}
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 flex gap-3">
              <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-700 dark:text-amber-300 leading-relaxed">
                Aapke documents (Photo, Signature, Aadhar) aapke Dashboard ke "My Documents" section mein pehle se upload hone chahiye. Agar nahi hain toh pehle upload karein.
              </p>
            </div>

            {/* Detailed Terms and Conditions (Collapsible) */}
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
                <p>1. <strong>"Apply For Me"</strong> is a paid service with a non-refundable service charge of ₹50.</p>
                <p>2. We only assist in filling out the application form. We are not responsible for your selection, exam scheduling, or admit card issuance.</p>
                <p>3. All documents uploaded by you (Photo, Signature, Aadhar, etc.) must be clear and strictly adhere to the official notification guidelines.</p>
                <p>4. Rojgar Suvidha will not be held liable if your application is rejected due to incorrect details provided by you.</p>
                <p>5. We are not responsible if the deadline passes due to official website server crashes. (Please apply well before the last date).</p>
                <p>6. The official examination fee (e.g., ₹100 for SSC) must be paid separately by you when our team shares the payment link.</p>
                <p>7. The application submission process may take between 24 to 48 hours to complete.</p>
                <p>8. Before final submission, our team will send a draft/preview to your WhatsApp for confirmation.</p>
                <p>9. Once the form is finally submitted, no corrections can be made by us (You will have to wait for the official correction window).</p>
                <p>10. You can track the live status of your application directly from your dashboard.</p>
                <p>11. We do not fill out forms for fraudulent or fake job postings. We only process verified government and private jobs.</p>
                <p>12. Your data (documents, personal information) is 100% secure, encrypted, and will never be sold to third-party companies.</p>
                <p>13. After your form is successfully submitted, you will have the option to auto-delete sensitive documents from our servers for security reasons.</p>
                <p>14. You must independently verify your age eligibility and qualifications from the official notification. Our calculator is just a guide.</p>
                <p>15. The final application PDF and Registration Number will be sent to you via SMS or WhatsApp.</p>
                <p>16. If we are unable to fill out your form for any reason (e.g., vacancy cancellation), the ₹50 service charge will be refunded to your wallet.</p>
                <p>17. Exam Center choices will be filled randomly unless you specify your preferences in the "Special Note" box.</p>
                <p>18. In case of technical errors, please raise a support ticket. Call support is only available during working hours (10 AM - 6 PM).</p>
                <p>19. PwD/Handicapped candidates must upload a clear PwD certificate; otherwise, they will be considered under the General category.</p>
                <p>20. If a payment fails, do not attempt another payment until the previous transaction's status is confirmed. Wait for 24 hours.</p>
                <p>21. I agree that I have read the official notification thoroughly and accept all the rules mentioned above.</p>
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
                <p className="text-gray-500 dark:text-gray-400 text-xs mt-0.5">I have read all 21 points and the official notification.</p>
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
