"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { ArrowLeft, ClipboardCheck, Loader2, CheckCircle2, AlertCircle, ShieldCheck, FileText } from "lucide-react";
import Script from "next/script";

export default function ApplyForMePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form fields
  const [jobTitle, setJobTitle] = useState(searchParams.get("job") || "");
  const [jobUrl, setJobUrl] = useState(searchParams.get("url") || "");
  const [note, setNote] = useState("");
  const [paymentVerified, setPaymentVerified] = useState(false);
  const [razorpayKey, setRazorpayKey] = useState(process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "");
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
      setLoading(false);
    };
    fetchUser();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!jobTitle.trim()) { setError("Job ka naam daalna zaroori hai."); return; }
    
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
            // 3. Save to Supabase after successful payment
            const { error: insertError } = await supabase
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
              });

            if (insertError) {
              setError("Payment successful but failed to save request. Contact support.");
            } else {
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
        <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 shadow-2xl p-10 max-w-md w-full text-center">
          <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10 text-green-500" />
          </div>
          <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white mb-3">Payment & Request Successful! 🎉</h2>
          <p className="text-gray-500 dark:text-gray-400 leading-relaxed mb-6">
            Aapki "Apply For Me" request aur payment details hume mil gayi hain. Hum jald hi aapka form fill karenge. Status check karne ke liye apna Dashboard dekhein.
          </p>
          <div className="space-y-3">
            <Link href="/dashboard"
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
        <Link href="/" className="inline-flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-indigo-600 mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Wapas Jaao
        </Link>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-amber-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-orange-500/30">
            <ClipboardCheck className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">Apply For Me 🚀</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2">Form bharna bhool jaao! Bas details do aur secure payment karo, hum form bhar denge.</p>
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
                      ? "🟢 You are generally ELIGIBLE for this job (Age is between 18 and 32). Please check exact official notification rules." 
                      : "🔴 You might NOT BE ELIGIBLE (Age is under 18 or over 32). Please check category relaxation rules."}
                  </p>
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
