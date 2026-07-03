"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { 
  ArrowLeft, Mail, Loader2, ShieldCheck, KeyRound, 
  GraduationCap, Building, Sparkles, ArrowRight, Eye, EyeOff, Phone, CheckCircle
} from "lucide-react";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get("redirect") || "/dashboard";
  
  // Auto-redirect logged-in users
  useEffect(() => {
    const checkActiveSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) router.push(redirectUrl);
    };
    checkActiveSession();
  }, [router, redirectUrl]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  // Portal Type
  const [portalType, setPortalType] = useState<"govt" | "private" | "employer">("govt");

  // Auth Method Tab (Phone | Google | Email)
  const [authMethod, setAuthMethod] = useState<"phone" | "google" | "email">("phone");

  // Email Auth State
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Forgot Password State
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [newPassword, setNewPassword] = useState("");

  // Email OTP State
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  // Phone OTP State
  const [phone, setPhone] = useState("");
  const [phoneOtpSent, setPhoneOtpSent] = useState(false);
  const [phoneOtp, setPhoneOtp] = useState("");
  const [phoneResendCooldown, setPhoneResendCooldown] = useState(0);

  useEffect(() => {
    if (phoneResendCooldown > 0) {
      const timer = setTimeout(() => setPhoneResendCooldown(phoneResendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [phoneResendCooldown]);

  // Captcha State
  const [captchaNum1, setCaptchaNum1] = useState(0);
  const [captchaNum2, setCaptchaNum2] = useState(0);
  const [captchaInput, setCaptchaInput] = useState("");

  useEffect(() => {
    setCaptchaNum1(Math.floor(Math.random() * 10) + 1);
    setCaptchaNum2(Math.floor(Math.random() * 10) + 1);
  }, [isSignUp]);

  // Helper: Redirect after login
  const redirectAfterLogin = async (userId: string) => {
    try {
      const { data: profile, error } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", userId)
        .single();
      if (!error && profile?.full_name) {
        router.push(redirectUrl);
      } else {
        router.push(`/profile-setup?redirect=${encodeURIComponent(redirectUrl)}`);
      }
    } catch (err) {
      router.push(`/profile-setup?redirect=${encodeURIComponent(redirectUrl)}`);
    }
    router.refresh();
  };

  const resetFormState = () => {
    setError(null);
    setMsg(null);
    setOtpSent(false);
    setOtp("");
    setIsForgotPassword(false);
    setPhoneOtpSent(false);
    setPhoneOtp("");
  };

  // === GOOGLE LOGIN ===
  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: `${window.location.origin}/auth/callback?redirect=${encodeURIComponent(redirectUrl)}` },
      });
      if (error) setError(error.message);
    } catch (err: any) {
      setError(err.message || "Google login failed.");
    } finally {
      setLoading(false);
    }
  };

  // === PHONE OTP: Send ===
  const handleSendPhoneOtp = async () => {
    const digits = phone.replace(/\D/g, '');
    if (digits.length !== 10) {
      setError("Please enter a valid 10-digit mobile number.");
      return;
    }
    setLoading(true);
    setError(null);
    setMsg(null);
    try {
      const res = await fetch("/api/send-phone-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: `+91${digits}` }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to send OTP.");
      } else {
        setPhoneOtpSent(true);
        setPhoneResendCooldown(60);
        setMsg(`OTP sent to +91 ${digits}!`);
      }
    } catch (err: any) {
      setError(err.message || "Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // === PHONE OTP: Verify ===
  const handleVerifyPhoneOtp = async () => {
    if (phoneOtp.length !== 6) {
      setError("Please enter the 6-digit OTP.");
      return;
    }
    const digits = phone.replace(/\D/g, '');
    setLoading(true);
    setError(null);
    setMsg(null);
    try {
      const res = await fetch("/api/verify-phone-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: `+91${digits}`, otp: phoneOtp }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Invalid OTP. Please try again.");
      } else if (data.magicLink) {
        setMsg("OTP verified! Logging you in...");
        window.location.href = data.magicLink;
      } else {
        setError("Failed to create session. Please try again.");
      }
    } catch (err: any) {
      setError(err.message || "Network error.");
    } finally {
      setLoading(false);
    }
  };

  // === PHONE OTP: Resend ===
  const handleResendPhoneOtp = async () => {
    if (phoneResendCooldown > 0) return;
    const digits = phone.replace(/\D/g, '');
    setLoading(true);
    setError(null);
    setMsg(null);
    try {
      const res = await fetch("/api/send-phone-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: `+91${digits}` }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to resend OTP.");
      } else {
        setMsg("New OTP sent!");
        setPhoneResendCooldown(60);
      }
    } catch (err: any) {
      setError(err.message || "Network error.");
    } finally {
      setLoading(false);
    }
  };

  // === EMAIL LOGIN / SIGNUP ===
  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMsg(null);

    // Email typo checker
    const checkEmailTypo = (emailStr: string): string | null => {
      const parts = emailStr.split('@');
      if (parts.length !== 2) return null;
      const domain = parts[1].toLowerCase().trim();
      const commonTypos: Record<string, string> = {
        'gamil.com': 'gmail.com', 'gmal.com': 'gmail.com', 'gmaill.com': 'gmail.com',
        'gmeil.com': 'gmail.com', 'gnail.com': 'gmail.com', 'gmail.co': 'gmail.com',
        'yaho.com': 'yahoo.com', 'yhoo.com': 'yahoo.com',
        'hotmai.com': 'hotmail.com', 'hotmial.com': 'hotmail.com',
        'redifmail.com': 'rediffmail.com',
      };
      if (commonTypos[domain]) return `${parts[0]}@${commonTypos[domain]}`;
      return null;
    };

    const typoSuggestion = checkEmailTypo(email);
    if (typoSuggestion) {
      setError(`Email spelling mistake: Did you mean "${typoSuggestion}"?`);
      return;
    }

    if (isSignUp) {
      if (password.length < 6) {
        setError("Password must be at least 6 characters.");
        return;
      }
      if (parseInt(captchaInput) !== captchaNum1 + captchaNum2) {
        setError("Incorrect security answer. Are you a robot?");
        setCaptchaNum1(Math.floor(Math.random() * 10) + 1);
        setCaptchaNum2(Math.floor(Math.random() * 10) + 1);
        setCaptchaInput("");
        return;
      }
      setLoading(true);
      try {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) {
          if (error.message.toLowerCase().includes("already registered") || error.message.toLowerCase().includes("already exists")) {
            setError("This account already exists! Please Sign In instead.");
            setIsSignUp(false);
          } else {
            setError(error.message);
          }
        } else {
          if (data?.session) {
            setMsg("Account created! Redirecting...");
            await redirectAfterLogin(data.user!.id);
          } else {
            setOtpSent(true);
            setResendCooldown(60);
            setMsg("Account created! A 6-digit OTP has been sent to your email.");
          }
        }
      } catch (err: any) {
        setError(err.message || "Signup failed. Please try again.");
      } finally {
        setLoading(false);
      }
    } else {
      setLoading(true);
      try {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          if (error.message.includes("Email not confirmed")) {
            const { error: resendError } = await supabase.auth.resend({ type: 'signup', email });
            if (!resendError) {
              setIsSignUp(true);
              setOtpSent(true);
              setResendCooldown(60);
              setError("Email not verified yet. We sent a new OTP to your email.");
            } else {
              setError(error.message);
            }
          } else {
            setError(error.message);
          }
        } else if (data?.user) {
          setMsg("Login successful! Redirecting...");
          await redirectAfterLogin(data.user.id);
        }
      } catch (err: any) {
        setError(err.message || "Login failed. Please try again.");
      } finally {
        setLoading(false);
      }
    }
  };

  // === FORGOT PASSWORD ===
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMsg(null);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) {
        setError(error.message);
      } else {
        setOtpSent(true);
        setMsg("Password reset OTP sent to your email!");
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMsg(null);
    if (newPassword.length < 6) {
      setError("New password must be at least 6 characters.");
      setLoading(false);
      return;
    }
    try {
      const { error: verifyError } = await supabase.auth.verifyOtp({ email, token: otp, type: 'recovery' });
      if (verifyError) { setError(verifyError.message); setLoading(false); return; }
      const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
      if (updateError) {
        setError(updateError.message);
      } else {
        setMsg("Password reset successfully! Logging you in...");
        setTimeout(() => window.location.reload(), 1500);
      }
    } catch (err: any) {
      setError(err.message || "Password reset failed.");
    } finally {
      setLoading(false);
    }
  };

  // === VERIFY EMAIL OTP ===
  const handleVerifyOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase.auth.verifyOtp({ email, token: otp, type: 'signup' });
      if (error) {
        setError(error.message);
      } else if (data?.user) {
        setMsg("Email verified! Redirecting...");
        await redirectAfterLogin(data.user.id);
      }
    } catch (err: any) {
      setError(err.message || "OTP verification failed.");
    } finally {
      setLoading(false);
    }
  };

  // === RESEND EMAIL OTP ===
  const handleResendOtp = async () => {
    if (resendCooldown > 0) return;
    setLoading(true);
    setError(null);
    setMsg(null);
    try {
      const { error } = await supabase.auth.resend({ type: 'signup', email });
      if (error) {
        setError(error.message);
      } else {
        setMsg("A new OTP has been sent to your email!");
        setResendCooldown(60);
      }
    } catch (err: any) {
      setError(err.message || "Failed to resend OTP.");
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (val: string) => {
    setOtp(val.replace(/\D/g, '').slice(0, 6));
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-96 bg-indigo-600 rounded-b-[40%] scale-150 transform -translate-y-1/2 opacity-10 dark:opacity-20 pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <Link href="/" className="flex justify-center mb-6 hover:scale-105 transition-transform">
          <div className="bg-indigo-600 p-3 rounded-2xl shadow-xl shadow-indigo-600/30">
            <ShieldCheck className="w-10 h-10 text-white" />
          </div>
        </Link>
        <h2 className="text-center text-3xl font-extrabold text-gray-900 dark:text-white">Welcome to Rojgar Suvidha</h2>
        <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400 font-medium">
          {portalType === "govt" && "Sign in or create an account to access your digital locker and saved govt jobs."}
          {portalType === "private" && "Connect directly with MNC recruiters & build professional portfolios."}
          {portalType === "employer" && "Verify your company GSTIN, post openings, and scout vetted talent."}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-white dark:bg-gray-900 py-8 px-4 shadow-2xl sm:rounded-3xl sm:px-10 border border-gray-100 dark:border-gray-800">

          {/* GOVERNMENT PORTAL LOGIN */}
          {portalType === "govt" && (
            <div className="animate-in fade-in duration-200">

              {/* 3-Method Auth Tabs */}
              <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-2xl border border-gray-200 dark:border-gray-700 mb-6 gap-1">
                <button
                  onClick={() => { resetFormState(); setAuthMethod("phone"); }}
                  className={`flex-1 py-2.5 px-1 rounded-xl text-[11px] font-black transition-all flex flex-col items-center gap-1 ${
                    authMethod === "phone"
                      ? "bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-sm"
                      : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                  }`}
                >
                  <Phone className="w-4 h-4" />
                  <span>Mobile OTP</span>
                </button>
                <button
                  onClick={() => { resetFormState(); setAuthMethod("google"); }}
                  className={`flex-1 py-2.5 px-1 rounded-xl text-[11px] font-black transition-all flex flex-col items-center gap-1 ${
                    authMethod === "google"
                      ? "bg-white dark:bg-gray-700 text-red-500 dark:text-red-400 shadow-sm"
                      : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                  }`}
                >
                  <img src="https://www.google.com/favicon.ico" alt="G" className="w-4 h-4" />
                  <span>Google</span>
                </button>
                <button
                  onClick={() => { resetFormState(); setAuthMethod("email"); }}
                  className={`flex-1 py-2.5 px-1 rounded-xl text-[11px] font-black transition-all flex flex-col items-center gap-1 ${
                    authMethod === "email"
                      ? "bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-sm"
                      : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                  }`}
                >
                  <Mail className="w-4 h-4" />
                  <span>Email</span>
                </button>
              </div>

              {/* Error & Success Messages */}
              {error && <div className="mb-4 text-sm font-bold text-red-500 bg-red-50 dark:bg-red-900/20 p-3 rounded-lg text-center border border-red-200 dark:border-red-800">{error}</div>}
              {msg && <div className="mb-4 text-sm font-bold text-green-600 bg-green-50 dark:bg-green-900/20 p-3 rounded-lg text-center border border-green-200 dark:border-green-800">{msg}</div>}

              {/* ─── PHONE OTP TAB ─── */}
              {authMethod === "phone" && (
                <div className="space-y-4">
                  {!phoneOtpSent ? (
                    <>
                      <div>
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Mobile Number</label>
                        <div className="flex gap-2">
                          <div className="flex items-center px-3 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-600 dark:text-gray-300 font-bold text-sm select-none whitespace-nowrap">
                            🇮🇳 +91
                          </div>
                          <div className="relative flex-1">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <Phone className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                              type="tel"
                              value={phone}
                              disabled={loading}
                              onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                              className="appearance-none block w-full pl-10 pr-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 placeholder-gray-400 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium disabled:opacity-60"
                              placeholder="9876543210"
                              maxLength={10}
                            />
                          </div>
                        </div>
                        <p className="text-[11px] text-gray-500 mt-1.5">Aapke phone par 6-digit OTP bheja jayega</p>
                      </div>
                      <button
                        onClick={handleSendPhoneOtp}
                        disabled={loading || phone.replace(/\D/g, '').length !== 10}
                        className="w-full flex justify-center items-center gap-2 py-3.5 px-4 border border-transparent rounded-xl shadow-lg shadow-indigo-500/30 text-sm font-extrabold text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 transition-all disabled:opacity-70"
                      >
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Phone className="w-4 h-4" /> Send OTP</>}
                      </button>
                    </>
                  ) : (
                    <>
                      <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800">
                        <p className="text-sm font-bold text-green-700 dark:text-green-400">OTP sent to <span className="font-black">+91 {phone}</span></p>
                        <button onClick={() => { setPhoneOtpSent(false); setPhoneOtp(""); setError(null); setMsg(null); }} className="text-xs text-indigo-600 dark:text-indigo-400 font-bold mt-1 hover:underline">Change number</button>
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Enter 6-digit OTP</label>
                        <input
                          type="text"
                          value={phoneOtp}
                          disabled={loading}
                          onChange={(e) => setPhoneOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                          className="appearance-none block w-full px-4 py-4 border-2 border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 placeholder-gray-300 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all font-black text-3xl tracking-[0.6em] text-center disabled:opacity-60"
                          placeholder="------"
                          maxLength={6}
                        />
                      </div>
                      <button
                        onClick={handleVerifyPhoneOtp}
                        disabled={loading || phoneOtp.length !== 6}
                        className="w-full flex justify-center items-center gap-2 py-3.5 px-4 border border-transparent rounded-xl shadow-lg shadow-indigo-500/30 text-sm font-extrabold text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 transition-all disabled:opacity-70"
                      >
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><CheckCircle className="w-4 h-4" /> Verify &amp; Login</>}
                      </button>
                      <div className="flex items-center justify-between">
                        <button type="button" onClick={() => { setPhoneOtpSent(false); setPhoneOtp(""); }} className="text-sm font-bold text-gray-600 dark:text-gray-400 hover:text-gray-900 transition-colors">← Go Back</button>
                        <button
                          type="button"
                          onClick={handleResendPhoneOtp}
                          disabled={phoneResendCooldown > 0 || loading}
                          className="text-sm font-bold text-indigo-600 hover:text-indigo-500 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
                        >
                          {phoneResendCooldown > 0 ? `Resend in ${phoneResendCooldown}s` : "Resend OTP"}
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* ─── GOOGLE TAB ─── */}
              {authMethod === "google" && (
                <div className="space-y-4">
                  <button
                    onClick={handleGoogleLogin}
                    disabled={loading}
                    className="relative w-full flex items-center justify-center gap-3 py-3.5 px-4 border-2 border-gray-200 dark:border-gray-700 rounded-xl shadow-md bg-white dark:bg-gray-800 text-sm font-extrabold text-gray-800 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-indigo-300 transition-all overflow-hidden group disabled:opacity-70"
                  >
                    <div className="absolute top-0 right-0 bg-indigo-500 text-white text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-bl-lg">Recommended</div>
                    <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5 group-hover:scale-110 transition-transform" />
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Continue with Google"}
                  </button>
                  <p className="text-center text-xs text-gray-500">Google account se 1-click me instant login</p>
                </div>
              )}

              {/* ─── EMAIL TAB ─── */}
              {authMethod === "email" && (
                <div className="space-y-5">
                  {isForgotPassword ? (
                    !otpSent ? (
                      <form onSubmit={handleForgotPassword} className="space-y-5">
                        <div>
                          <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Enter your Email</label>
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <Mail className="h-5 w-5 text-gray-400" />
                            </div>
                            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="appearance-none block w-full pl-10 pr-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 placeholder-gray-400 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium" placeholder="student@example.com" />
                          </div>
                          <p className="text-[11px] text-gray-500 mt-2 font-medium">We will send an OTP to reset your password.</p>
                        </div>
                        <button type="submit" disabled={loading} className="w-full flex justify-center items-center gap-2 py-3.5 px-4 border border-transparent rounded-xl shadow-lg shadow-indigo-500/30 text-sm font-extrabold text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 transition-all disabled:opacity-70">
                          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Send Reset OTP"}
                        </button>
                        <div className="text-center">
                          <button type="button" onClick={() => { resetFormState(); setIsSignUp(false); }} className="text-sm font-bold text-gray-600 dark:text-gray-400 hover:text-indigo-600 transition-colors">Back to Sign In</button>
                        </div>
                      </form>
                    ) : (
                      <form onSubmit={handleResetPassword} className="space-y-5">
                        <div>
                          <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Enter Reset OTP</label>
                          <input type="text" required value={otp} onChange={(e) => handleOtpChange(e.target.value)} className="appearance-none block w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 placeholder-gray-400 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium tracking-widest text-center text-lg" placeholder="123456" maxLength={6} />
                        </div>
                        <div>
                          <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">New Password</label>
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <ShieldCheck className="h-5 w-5 text-gray-400" />
                            </div>
                            <input type="password" required value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="appearance-none block w-full pl-10 pr-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 placeholder-gray-400 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium" placeholder="New Password" minLength={6} />
                          </div>
                        </div>
                        <button type="submit" disabled={loading || otp.length < 6} className="w-full flex justify-center items-center gap-2 py-3.5 px-4 border border-transparent rounded-xl shadow-lg shadow-indigo-500/30 text-sm font-extrabold text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 transition-all disabled:opacity-70">
                          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Verify & Set New Password"}
                        </button>
                        <div className="text-center">
                          <button type="button" onClick={() => { resetFormState(); setIsSignUp(false); }} className="text-sm font-bold text-gray-600 dark:text-gray-400 hover:text-indigo-600 transition-colors">Cancel Reset</button>
                        </div>
                      </form>
                    )
                  ) : !otpSent ? (
                    <form onSubmit={handleEmailAuth} className="space-y-5">
                      <div>
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Email Address</label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Mail className="h-5 w-5 text-gray-400" />
                          </div>
                          <input type="email" required value={email} disabled={loading} onChange={(e) => setEmail(e.target.value)} className="appearance-none block w-full pl-10 pr-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 placeholder-gray-400 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium disabled:opacity-60" placeholder="student@example.com" />
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <label className="block text-sm font-bold text-gray-700 dark:text-gray-300">Password</label>
                          {!isSignUp && (
                            <button type="button" disabled={loading} onClick={() => { resetFormState(); setIsForgotPassword(true); }} className="text-[11px] font-bold text-indigo-600 hover:text-indigo-500 transition-colors disabled:opacity-60">
                              Forgot Password?
                            </button>
                          )}
                        </div>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <KeyRound className="h-5 w-5 text-gray-400" />
                          </div>
                          <input
                            type={showPassword ? "text" : "password"}
                            required
                            value={password}
                            disabled={loading}
                            onChange={(e) => setPassword(e.target.value)}
                            className="appearance-none block w-full pl-10 pr-10 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 placeholder-gray-400 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium disabled:opacity-60"
                            placeholder="••••••••"
                            minLength={6}
                          />
                          <button type="button" disabled={loading} onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-60">
                            {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                          </button>
                        </div>
                        {isSignUp && <p className="text-[11px] text-gray-500 mt-2 font-medium">Must be at least 6 characters.</p>}
                      </div>
                      {isSignUp && (
                        <div className="pt-2">
                          <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Security Check (Anti-Bot)</label>
                          <div className="flex items-center gap-4">
                            <div className="bg-gray-100 dark:bg-gray-800 px-4 py-3 rounded-xl font-extrabold text-indigo-600 dark:text-indigo-400 border border-gray-200 dark:border-gray-700 tracking-wider w-32 text-center text-lg">
                              {captchaNum1} + {captchaNum2}
                            </div>
                            <input type="number" required value={captchaInput} onChange={(e) => setCaptchaInput(e.target.value)} className="block w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-center" placeholder="=" />
                          </div>
                          <p className="text-[10px] text-gray-500 mt-1.5 font-medium">Please solve this to prove you are human.</p>
                        </div>
                      )}
                      <button type="submit" disabled={loading} className="w-full flex justify-center items-center gap-2 py-3.5 px-4 border border-transparent rounded-xl shadow-lg shadow-indigo-500/30 text-sm font-extrabold text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 transition-all disabled:opacity-70 mt-2">
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (isSignUp ? "Create Account" : "Sign In")}
                      </button>
                      <div className="text-center mt-4">
                        <button type="button" onClick={() => { resetFormState(); setIsSignUp(!isSignUp); }} className="text-sm font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 transition-colors">
                          {isSignUp ? "Already have an account? Sign In" : "Don't have an account? Create one"}
                        </button>
                      </div>
                    </form>
                  ) : (
                    <form onSubmit={handleVerifyOtp} className="space-y-5">
                      <div>
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Enter Email OTP</label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <KeyRound className="h-5 w-5 text-gray-400" />
                          </div>
                          <input type="text" required value={otp} onChange={(e) => handleOtpChange(e.target.value)} className="appearance-none block w-full pl-10 pr-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 placeholder-gray-400 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium tracking-widest text-center text-lg" placeholder="123456" maxLength={6} />
                        </div>
                        <p className="text-[11px] text-gray-500 mt-2 font-medium bg-gray-100 dark:bg-gray-800/50 p-2 rounded-lg border border-gray-200 dark:border-gray-700">
                          <span className="font-bold text-gray-700 dark:text-gray-300">Note:</span> Check your <strong className="text-red-500 dark:text-red-400">Spam or Junk folder</strong> if you don&apos;t see it.
                        </p>
                      </div>
                      <button type="submit" disabled={loading || otp.length < 6} className="w-full flex justify-center items-center gap-2 py-3.5 px-4 border border-transparent rounded-xl shadow-lg shadow-indigo-500/30 text-sm font-extrabold text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 transition-all disabled:opacity-70">
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Verify & Login"}
                      </button>
                      <div className="flex items-center justify-between mt-4">
                        <button type="button" onClick={() => { setOtpSent(false); setOtp(""); }} className="text-sm font-bold text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">Go Back</button>
                        <button type="button" onClick={handleResendOtp} disabled={resendCooldown > 0 || loading} className="text-sm font-bold text-indigo-600 hover:text-indigo-500 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors">
                          {resendCooldown > 0 ? `Resend OTP in ${resendCooldown}s` : "Resend OTP"}
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              )}
            </div>
          )}

          {/* PRIVATE PORTAL PREVIEW */}
          {portalType === "private" && (
            <div className="space-y-6 py-2 animate-in fade-in duration-200">
              <div className="text-center space-y-2">
                <div className="inline-flex p-3 bg-violet-50 dark:bg-violet-950/30 text-violet-600 dark:text-violet-400 rounded-2xl border border-violet-100/50 dark:border-violet-900/50">
                  <GraduationCap className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-black text-gray-900 dark:text-white flex items-center justify-center gap-1.5">
                  Private Candidate Workspace <Sparkles className="w-4 h-4 text-amber-500" />
                </h3>
                <p className="text-xs text-gray-500 leading-relaxed">Apna professional resume banayein, skills highlights tag karein aur direct HRs ke sath chat karein like LinkedIn.</p>
              </div>
              <Link href="/private-jobs/login" className="w-full py-3.5 px-4 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-violet-500/20 transition-all hover:scale-[1.01] active:scale-[0.99] text-sm">
                Candidate Login/Register Portal <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          )}

          {/* EMPLOYER PORTAL PREVIEW */}
          {portalType === "employer" && (
            <div className="space-y-6 py-2 animate-in fade-in duration-200">
              <div className="text-center space-y-2">
                <div className="inline-flex p-3 bg-green-50 dark:bg-green-950/30 text-green-600 dark:text-green-400 rounded-2xl border border-green-100/50 dark:border-green-900/50">
                  <Building className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-black text-gray-900 dark:text-white flex items-center justify-center gap-1.5">
                  Recruiter / HR Workspace <ShieldCheck className="w-4 h-4 text-emerald-500" />
                </h3>
                <p className="text-xs text-gray-500 leading-relaxed">Apni corporate business status verify karwayein aur skilled pre-vetted candidates se direct connect karein.</p>
              </div>
              <Link href="/employer/login" className="w-full py-3.5 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all hover:scale-[1.01] active:scale-[0.99] text-sm">
                Employer/HR Portal <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          )}

          <div className="mt-8 text-center text-xs text-gray-500">
            By signing in, you agree to our Terms of Service and Privacy Policy.
          </div>
        </div>
        
        <div className="mt-8 text-center">
          <Link href="/" className="text-sm font-bold text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors flex items-center justify-center gap-2">
            <ArrowLeft className="w-4 h-4" /> Go back to website
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" /></div>}>
      <LoginContent />
    </Suspense>
  );
}
