"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { 
  Briefcase, Mail, Lock, User, Building, Globe, 
  ArrowRight, ShieldCheck, Sparkles, Loader2, Info,
  AlertCircle, CheckCircle2
} from "lucide-react";

export default function EmployerLoginPage() {
  const router = useRouter();
  const [activeForm, setActiveForm] = useState<"signin" | "signup">("signin");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  // Form Fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [hrName, setHrName] = useState("");
  const [website, setWebsite] = useState("");
  const [gstNumber, setGstNumber] = useState("");
  const [phone, setPhone] = useState("");
  const [gstLoading, setGstLoading] = useState(false);
  const [gstVerified, setGstVerified] = useState(false);
  const [gstError, setGstError] = useState<string | null>(null);

  const handleVerifyGst = async (gstVal: string) => {
    if (!gstVal.trim()) return;
    setGstLoading(true);
    setGstError(null);
    setGstVerified(false);

    try {
      const response = await fetch("/api/employer/verify-gst", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gstin: gstVal })
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setCompanyName(data.legal_name);
        setGstVerified(true);
      } else {
        setGstError(data.error || "Failed to verify GSTIN format.");
      }
    } catch (err) {
      setGstError("Error contacting verification service.");
    } finally {
      setGstLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data, error: authErr } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password
      });

      if (authErr) throw authErr;

      // Check if user is registered as an employer (fallback check)
      const { data: profile, error: dbErr } = await supabase
        .from("employer_profiles")
        .select("company_name")
        .eq("id", data.session?.user.id)
        .single();

      // Store local flag for mock fallback if database table doesn't exist
      if (dbErr && dbErr.code === "PGRST116") {
        // Logged in via auth, but no profile. We'll register mock profile for testing.
        localStorage.setItem("rs_employer_mock_company", "Demo Corporate Partner");
        localStorage.setItem("rs_employer_mock_hr", email.split('@')[0]);
      } else if (profile) {
        localStorage.setItem("rs_employer_mock_company", profile.company_name);
      }

      setInfoMessage("Login Successful! Redirecting to HR Dashboard...");
      setTimeout(() => {
        router.push("/employer/dashboard");
      }, 1500);

    } catch (err: any) {
      console.error("Auth Sign In Error:", err);
      // Hard fallback: if Supabase config is offline or errored, allow instant demo entry with special keyword
      if (email.toLowerCase().includes("demo") && password === "demo123") {
        localStorage.setItem("rs_employer_mock_company", "Demo Corporate Ltd");
        localStorage.setItem("rs_employer_mock_hr", "Abhinav Singh");
        setInfoMessage("Demo Mode Activated! Redirecting...");
        setTimeout(() => {
          router.push("/employer/dashboard");
        }, 1500);
      } else {
        setError(err.message || "Invalid credentials. (Hint: For testing, use email 'demo@rojgarsuvidha.com' & password 'demo123')");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!companyName.trim() || !hrName.trim() || !email.trim() || !password.trim() || !gstNumber.trim() || !phone.trim()) {
      setError("Please fill out all mandatory fields, including business verification details.");
      setLoading(false);
      return;
    }

    if (!gstVerified) {
      setError("Please input a valid company GSTIN and verify it first.");
      setLoading(false);
      return;
    }

    try {
      const { data, error: authErr } = await supabase.auth.signUp({
        email: email.trim(),
        password: password,
        options: {
          data: {
            company_name: companyName.trim(),
            hr_name: hrName.trim()
          }
        }
      });

      if (authErr) throw authErr;

      const userId = data.user?.id;
      if (userId) {
        // Attempt to write in employer_profiles
        const { error: profileErr } = await supabase.from("employer_profiles").insert([
          {
            id: userId,
            company_name: companyName.trim(),
            hr_name: hrName.trim(),
            website: website.trim() || null,
            email: email.toLowerCase().trim(),
            gst_number: gstNumber.toUpperCase().trim(),
            phone: phone.trim(),
            is_verified: false
          }
        ]);

        if (profileErr) {
          console.warn("Could not insert to employer_profiles table. Vetting table migration might be pending. Using offline localStorage fallback for simulation.", profileErr);
        }
      }

      // Always write to localStorage as local developer fallback/sync
      localStorage.setItem("rs_employer_mock_company", companyName.trim());
      localStorage.setItem("rs_employer_mock_hr", hrName.trim());
      localStorage.setItem("rs_employer_mock_gst", gstNumber.toUpperCase().trim());
      localStorage.setItem("rs_employer_mock_phone", phone.trim());
      localStorage.setItem("rs_employer_mock_verified", "false");

      setInfoMessage("Registration successful! Welcome to Rojgar Suvidha Recruiters. Your business is under review. Redirecting...");
      setTimeout(() => {
        router.push("/employer/dashboard");
      }, 1500);

    } catch (err: any) {
      setError(err.message || "Sign up failed. Please check details or try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 min-h-[90vh] bg-gray-50 dark:bg-gray-950 py-12 px-4 flex items-center justify-center relative overflow-hidden">
      
      {/* Background abstract shapes */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl -z-10"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl -z-10"></div>

      <div className="max-w-md w-full bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl shadow-xl p-6 sm:p-8 space-y-6 relative z-10">
        
        {/* Header Icon & Title */}
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-2xl">
            <Briefcase className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white">
            Rojgar Suvidha Recruiters
          </h2>
          <p className="text-sm text-gray-500">
            Post vacancies and find certified, pre-verified candidates.
          </p>
        </div>

        {/* Form Toggle Tabs */}
        <div className="flex bg-gray-50 dark:bg-gray-800/60 p-1.5 rounded-2xl border border-gray-100 dark:border-gray-800">
          <button
            onClick={() => { setActiveForm("signin"); setError(null); }}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeForm === "signin"
                ? "bg-white dark:bg-gray-700 text-indigo-600 dark:text-white shadow-sm"
                : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            }`}
          >
            HR Login
          </button>
          <button
            onClick={() => { setActiveForm("signup"); setError(null); }}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeForm === "signup"
                ? "bg-white dark:bg-gray-700 text-indigo-600 dark:text-white shadow-sm"
                : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            }`}
          >
            Register Company
          </button>
        </div>

        {/* Notifications */}
        {error && (
          <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 p-3.5 rounded-xl text-xs font-medium flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {infoMessage && (
          <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 text-green-600 dark:text-green-400 p-3.5 rounded-xl text-xs font-medium flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 animate-bounce" />
            <span>{infoMessage}</span>
          </div>
        )}

        {/* Standard signin / signup Forms */}
        {activeForm === "signin" ? (
          <form onSubmit={handleSignIn} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">Company Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input 
                  type="email" 
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="hr@wipro.com" 
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white dark:focus:bg-gray-800 outline-none text-sm transition-all"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input 
                  type="password" 
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••" 
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white dark:focus:bg-gray-800 outline-none text-sm transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-all shadow-md shadow-indigo-600/10 hover:shadow-indigo-600/30 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Sign In to Recruiter Panel"}
              {!loading && <ArrowRight className="w-4 h-4" />}
            </button>
          </form>
        ) : (
          <form onSubmit={handleSignUp} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">HR Manager Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input 
                  type="text" 
                  required
                  value={hrName}
                  onChange={e => setHrName(e.target.value)}
                  placeholder="e.g. Abhinav Singh" 
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white dark:focus:bg-gray-800 outline-none text-sm transition-all text-gray-900 dark:text-white"
                />
              </div>
            </div>

            {/* GSTIN Verification Field */}
            <div className="space-y-1.5 bg-indigo-50/30 dark:bg-indigo-950/20 p-3 rounded-2xl border border-indigo-100/50 dark:border-indigo-900/30">
              <label className="block text-xs font-extrabold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">Company GSTIN / CIN / PAN</label>
              <div className="flex gap-2 mt-1">
                <div className="relative flex-1">
                  <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-indigo-500" />
                  <input 
                    type="text" 
                    required
                    value={gstNumber}
                    onChange={e => {
                      setGstNumber(e.target.value);
                      setGstVerified(false);
                      setGstError(null);
                    }}
                    placeholder="e.g. 27AADCS4120F1ZX" 
                    className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm transition-all font-mono uppercase text-gray-900 dark:text-white"
                  />
                </div>
                <button
                  type="button"
                  disabled={gstLoading || !gstNumber}
                  onClick={() => handleVerifyGst(gstNumber)}
                  className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 dark:disabled:bg-gray-800 text-white font-bold px-4 py-2 rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 shadow-sm"
                >
                  {gstLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5" />}
                  Verify
                </button>
              </div>

              {/* GST Status Banner */}
              {gstVerified && (
                <p className="text-[10px] text-green-600 dark:text-green-400 font-extrabold flex items-center gap-1 mt-1 bg-green-50 dark:bg-green-950/20 p-1.5 rounded-lg border border-green-200/50">
                  <span>🟢 Business Verified: <b>{companyName}</b></span>
                </p>
              )}
              {gstError && (
                <p className="text-[10px] text-red-500 font-extrabold flex items-center gap-1 mt-1 bg-red-50 dark:bg-red-950/20 p-1.5 rounded-lg border border-red-200/50">
                  <span>⚠️ {gstError}</span>
                </p>
              )}
              {!gstVerified && !gstError && (
                <span className="text-[10px] text-gray-400 font-medium block mt-1">Please verify your 15-digit GSTIN to unlock register company name.</span>
              )}
            </div>

            {/* Official Mobile Number */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">Official Mobile Number</label>
              <div className="relative">
                <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input 
                  type="text" 
                  required
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="e.g. +91 98765 43210" 
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white dark:focus:bg-gray-800 outline-none text-sm transition-all text-gray-900 dark:text-white"
                />
              </div>
            </div>

            {/* Company Name (Autofilled / Read-only) */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">Company Name</label>
              <div className="relative">
                <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input 
                  type="text" 
                  required
                  readOnly={gstVerified}
                  value={companyName}
                  onChange={e => setCompanyName(e.target.value)}
                  placeholder="Will autofill after verifying GSTIN" 
                  className={`w-full pl-10 pr-4 py-2.5 border rounded-xl outline-none text-sm transition-all ${
                    gstVerified 
                      ? "bg-gray-100 dark:bg-gray-800 border-green-300 dark:border-green-800 font-extrabold text-green-700 dark:text-green-400 cursor-not-allowed" 
                      : "bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-white"
                  }`}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">Company Website (Optional)</label>
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input 
                  type="url" 
                  value={website}
                  onChange={e => setWebsite(e.target.value)}
                  placeholder="https://www.company.com" 
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white dark:focus:bg-gray-800 outline-none text-sm transition-all text-gray-900 dark:text-white"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">Company Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input 
                  type="email" 
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="hr@wipro.com" 
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white dark:focus:bg-gray-800 outline-none text-sm transition-all text-gray-900 dark:text-white"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">Choose Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input 
                  type="password" 
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Min 6 characters" 
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white dark:focus:bg-gray-800 outline-none text-sm transition-all text-gray-900 dark:text-white"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold transition-all shadow-md shadow-green-600/10 hover:shadow-green-600/30 flex items-center justify-center gap-2 disabled:opacity-50 text-sm"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Register & Submit Vetting Profile"}
              {!loading && <ArrowRight className="w-4 h-4" />}
            </button>
          </form>
        )}

        {/* Vetting explanation banner */}
        <div className="bg-indigo-50/50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-800/50 rounded-2xl p-4 flex gap-2.5 text-xs text-indigo-700 dark:text-indigo-400">
          <ShieldCheck className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-bold block">100% Spam Protection Enabled</span>
            <span>Humne direct job posting ko safe rakha hai. Koi bhi job approve hone ke baad hi dynamic portal par candidates ko dikhegi.</span>
          </div>
        </div>

        {/* Demo Account Indicator */}
        <div className="bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-800/40 rounded-xl p-3 flex gap-2 text-xs text-amber-700 dark:text-amber-400 items-center justify-center">
          <Info className="w-4 h-4 shrink-0" />
          <span>Quick Demo: Email <b>demo@rojgarsuvidha.com</b> | Pass <b>demo123</b></span>
        </div>

      </div>
    </div>
  );
}
