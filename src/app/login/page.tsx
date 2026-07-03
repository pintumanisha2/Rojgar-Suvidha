"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { 
  ArrowLeft, Mail, Loader2, ShieldCheck, KeyRound, 
  GraduationCap, Building, Sparkles, ArrowRight 
} from "lucide-react";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get("redirect") || "/dashboard";
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  // Portal Type Selector
  const [portalType, setPortalType] = useState<"govt" | "private" | "employer">("govt");

  // Authentication State
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  
  // Forgot Password State
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  
  // OTP Verification State
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);

  // Anti-Spam Captcha State
  const [captchaNum1, setCaptchaNum1] = useState(0);
  const [captchaNum2, setCaptchaNum2] = useState(0);
  const [captchaInput, setCaptchaInput] = useState("");

  // Initialize Captcha
  useEffect(() => {
    setCaptchaNum1(Math.floor(Math.random() * 10) + 1);
    setCaptchaNum2(Math.floor(Math.random() * 10) + 1);
  }, [isSignUp]);

  // Handle Resend Cooldown
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  // Helper: Check profile and redirect
  const redirectAfterLogin = async (userId: string) => {
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", userId)
      .single();

    if (profile?.full_name) {
      router.push(redirectUrl);
    } else {
      router.push(`/profile-setup?redirect=${encodeURIComponent(redirectUrl)}`);
    }
    router.refresh();
  };

  // === 1. GOOGLE LOGIN ===
  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    
    // Determine redirect base: default to window.location.origin, but fallback to Vercel if running in Capacitor local webview
    let redirectBase = typeof window !== "undefined" ? window.location.origin : "https://www.rojgarsuvidha.com";

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${redirectBase}/profile-setup?redirect=${encodeURIComponent(redirectUrl)}`,
      }
    });
    if (error) setError(error.message);
    setLoading(false);
  };

  // === 2. EMAIL & PASSWORD LOGIN / SIGNUP ===
  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMsg(null);

    if (isSignUp) {
      // Simplified Password Validation
      if (password.length < 6) {
        setError("Password must be at least 6 characters.");
        return;
      }

      // CAPTCHA Validation for Sign Up
      if (parseInt(captchaInput) !== captchaNum1 + captchaNum2) {
        setError("Incorrect security answer. Are you a robot?");
        setCaptchaNum1(Math.floor(Math.random() * 10) + 1);
        setCaptchaNum2(Math.floor(Math.random() * 10) + 1);
        setCaptchaInput("");
        return;
      }

      setLoading(true);
      // Initiate Sign Up
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        if (error.message.toLowerCase().includes("already registered") || error.message.toLowerCase().includes("already exists")) {
          setError("This account already exists! Please Sign In instead.");
          setIsSignUp(false);
        } else {
          setError(error.message);
        }
      } else {
        if (data?.session) {
          // If email confirmation is disabled in Supabase, the user is logged in instantly
          setMsg("Account created successfully! Redirecting...");
          await redirectAfterLogin(data.user!.id);
        } else {
          // Sign up successful, but requires OTP verification
          setOtpSent(true);
          setResendCooldown(60); // Start 60s cooldown
          setMsg("Account created! A 6-digit OTP has been sent to your email to verify your account.");
        }
      }
      setLoading(false);
    } else {
      // Login Flow
      setLoading(true);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        if (error.message.includes("Email not confirmed")) {
          // If they haven't verified their email, send another OTP and show verification screen
          const { error: resendError } = await supabase.auth.resend({
            type: 'signup',
            email: email,
          });
          if (!resendError) {
             setIsSignUp(true);
             setOtpSent(true);
             setResendCooldown(60);
             setError("Your email is not verified yet. We just sent a new OTP to your email.");
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
      setLoading(false);
    }
  };

  // === 3. FORGOT PASSWORD FLOW ===
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMsg(null);

    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) {
      setError(error.message);
    } else {
      setOtpSent(true);
      setMsg("Password reset OTP sent to your email!");
    }
    setLoading(false);
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMsg(null);

    // Validate new password (Simplified)
    if (newPassword.length < 6) {
      setError("New password must be at least 6 characters.");
      setLoading(false);
      return;
    }

    // 1. Verify OTP
    const { error: verifyError } = await supabase.auth.verifyOtp({
      email,
      token: otp,
      type: 'recovery'
    });

    if (verifyError) {
      setError(verifyError.message);
      setLoading(false);
      return;
    }

    // 2. Update Password
    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword
    });

    if (updateError) {
      setError(updateError.message);
    } else {
      setMsg("Password reset successfully! Logging you in...");
      setTimeout(() => window.location.reload(), 1500);
    }
    setLoading(false);
  };

  // === 3. VERIFY OTP (ONLY FOR SIGNUP) ===
  const handleVerifyOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError(null);
    
    const { data, error } = await supabase.auth.verifyOtp({
      email: email,
      token: otp,
      type: 'signup',
    });

    if (error) {
      setError(error.message);
    } else if (data?.user) {
      setMsg("Email verified successfully! Redirecting...");
      await redirectAfterLogin(data.user.id);
    }
    setLoading(false);
  };

  // === 4. RESEND OTP ===
  const handleResendOtp = async () => {
    if (resendCooldown > 0) return;
    
    setLoading(true);
    setError(null);
    setMsg(null);
    
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: email,
    });

    if (error) {
      setError(error.message);
    } else {
      setMsg("A new OTP has been sent to your email!");
      setResendCooldown(60);
    }
    setLoading(false);
  };

  // Auto-submit OTP
  const handleOtpChange = (val: string) => {
    const cleanVal = val.replace(/\D/g, '').slice(0, 8);
    setOtp(cleanVal);
  };

  const resetFormState = () => {
    setError(null);
    setMsg(null);
    setOtpSent(false);
    setOtp("");
    setIsForgotPassword(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      
      {/* Background Decorations */}
      <div className="absolute top-0 left-0 w-full h-96 bg-indigo-600 rounded-b-[40%] scale-150 transform -translate-y-1/2 opacity-10 dark:opacity-20 pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <Link href="/" className="flex justify-center mb-6 hover:scale-105 transition-transform">
          <div className="bg-indigo-600 p-3 rounded-2xl shadow-xl shadow-indigo-600/30">
            <ShieldCheck className="w-10 h-10 text-white" />
          </div>
        </Link>
        <h2 className="text-center text-3xl font-extrabold text-gray-900 dark:text-white">
          Welcome to Rojgar Suvidha
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400 font-medium">
          {portalType === "govt" && "Sign in or create an account to access your digital locker and saved govt jobs."}
          {portalType === "private" && "Connect directly with MNC recruiters & build professional portfolios."}
          {portalType === "employer" && "Verify your company GSTIN, post openings, and scout vetted talent."}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-white dark:bg-gray-900 py-8 px-4 shadow-2xl sm:rounded-3xl sm:px-10 border border-gray-100 dark:border-gray-800">
          
          {/* Unified Tabs Selector (Hidden until Private Jobs are live)
          <div className="flex bg-gray-50 dark:bg-gray-800/60 p-1.5 rounded-2xl border border-gray-200 dark:border-gray-800 mb-6 gap-1">
            <button
              onClick={() => { setPortalType("govt"); resetFormState(); }}
              className={`flex-1 py-3 px-1 rounded-xl text-[10px] sm:text-xs font-black transition-all flex flex-col items-center gap-1.5 ${
                portalType === "govt"
                  ? "bg-white dark:bg-gray-700 text-indigo-600 dark:text-white shadow-sm border border-indigo-100/50 dark:border-gray-600"
                  : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              }`}
            >
              <span className="text-base sm:text-lg">🏛️</span>
              <span>Sarkari Locker</span>
            </button>
            
            <button
              onClick={() => { setPortalType("private"); resetFormState(); }}
              className={`flex-1 py-3 px-1 rounded-xl text-[10px] sm:text-xs font-black transition-all flex flex-col items-center gap-1.5 ${
                portalType === "private"
                  ? "bg-white dark:bg-gray-700 text-violet-600 dark:text-white shadow-sm border border-violet-100/50 dark:border-gray-600"
                  : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              }`}
            >
              <span className="text-base sm:text-lg"></span>
              <span>Private Jobs</span>
            </button>

            <button
              onClick={() => { setPortalType("employer"); resetFormState(); }}
              className={`flex-1 py-3 px-1 rounded-xl text-[10px] sm:text-xs font-black transition-all flex flex-col items-center gap-1.5 ${
                portalType === "employer"
                  ? "bg-white dark:bg-gray-700 text-green-600 dark:text-white shadow-sm border border-green-100/50 dark:border-gray-600"
                  : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              }`}
            >
              <span className="text-base sm:text-lg">🏢</span>
              <span>HR / Employer</span>
            </button>
          </div>
          */}

          {/* GOVERNMENT PORTAL LOGIN (ORIGINAL FLOW) */}
          {portalType === "govt" && (
            <div className="animate-in fade-in duration-200">
              {/* Google Login Button */}
              <button
                onClick={handleGoogleLogin}
                disabled={loading}
                className="relative w-full mb-6 flex items-center justify-center gap-3 py-3.5 px-4 border-2 border-indigo-100 dark:border-indigo-900/50 rounded-xl shadow-md shadow-indigo-100 dark:shadow-none bg-white dark:bg-gray-800 text-sm font-extrabold text-gray-800 dark:text-gray-200 hover:bg-indigo-50 dark:hover:bg-gray-700 hover:border-indigo-300 dark:hover:border-indigo-600 transition-all overflow-hidden group"
              >
                <div className="absolute top-0 right-0 bg-indigo-500 text-white text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-bl-lg">Recommended</div>
                <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5 group-hover:scale-110 transition-transform" />
                Continue with Google
              </button>

              <div className="relative mb-6">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200 dark:border-gray-800" /></div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-3 bg-white dark:bg-gray-900 text-gray-500 font-bold uppercase tracking-widest text-[10px]">Or use email & password</span>
                </div>
              </div>

              {/* Error & Success Messages */}
              {error && <div className="mb-4 text-sm font-bold text-red-500 bg-red-50 dark:bg-red-900/20 p-3 rounded-lg text-center border border-red-200 dark:border-red-800">{error}</div>}
              {msg && <div className="mb-4 text-sm font-bold text-green-600 bg-green-50 dark:bg-green-900/20 p-3 rounded-lg text-center border border-green-200 dark:border-green-800">{msg}</div>}

              {/* EMAIL FORM */}
              <div className="space-y-5">
                {isForgotPassword ? (
                  // FORGOT PASSWORD FLOW
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
                        <p className="text-[11px] text-gray-500 mt-2 font-medium">We will send an OTP to your email to reset your password.</p>
                      </div>
                      <button type="submit" disabled={loading} className="w-full flex justify-center items-center gap-2 py-3.5 px-4 border border-transparent rounded-xl shadow-lg shadow-indigo-500/30 text-sm font-extrabold text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 transition-all disabled:opacity-70 mt-2">
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Send Reset OTP"}
                      </button>
                      <div className="text-center mt-4">
                        <button type="button" onClick={() => { resetFormState(); setIsSignUp(false); }} className="text-sm font-bold text-gray-600 dark:text-gray-400 hover:text-indigo-600 transition-colors">
                          Back to Sign In
                        </button>
                      </div>
                    </form>
                  ) : (
                    <form onSubmit={handleResetPassword} className="space-y-5">
                      <div>
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Enter Reset OTP</label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <KeyRound className="h-5 w-5 text-gray-400" />
                          </div>
                          <input type="text" required value={otp} onChange={(e) => handleOtpChange(e.target.value)} className="appearance-none block w-full pl-10 pr-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 placeholder-gray-400 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium tracking-widest text-center text-lg" placeholder="12345678" maxLength={8} />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">New Password</label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <ShieldCheck className="h-5 w-5 text-gray-400" />
                          </div>
                          <input type="password" required value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="appearance-none block w-full pl-10 pr-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 placeholder-gray-400 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium" placeholder="New Password" minLength={8} />
                        </div>
                      </div>
                      <button type="submit" disabled={loading || otp.length < 6} className="w-full flex justify-center items-center gap-2 py-3.5 px-4 border border-transparent rounded-xl shadow-lg shadow-indigo-500/30 text-sm font-extrabold text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 transition-all disabled:opacity-70 mt-2">
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Verify & Set New Password"}
                      </button>
                      <div className="text-center mt-4">
                        <button type="button" onClick={() => { resetFormState(); setIsSignUp(false); }} className="text-sm font-bold text-gray-600 dark:text-gray-400 hover:text-indigo-600 transition-colors">
                          Cancel Reset
                        </button>
                      </div>
                    </form>
                  )
                ) : !otpSent ? (
                  // NORMAL LOGIN/SIGNUP FLOW
                  <form onSubmit={handleEmailAuth} className="space-y-5">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Email Address</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Mail className="h-5 w-5 text-gray-400" />
                        </div>
                        <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="appearance-none block w-full pl-10 pr-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 placeholder-gray-400 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium" placeholder="student@example.com" />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300">Password</label>
                        {!isSignUp && (
                          <button type="button" onClick={() => { resetFormState(); setIsForgotPassword(true); }} className="text-[11px] font-bold text-indigo-600 hover:text-indigo-500 transition-colors">
                            Forgot Password?
                          </button>
                        )}
                      </div>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <KeyRound className="h-5 w-5 text-gray-400" />
                        </div>
                        <input 
                          type="password" 
                          required 
                          value={password} 
                          onChange={(e) => setPassword(e.target.value)} 
                          className="appearance-none block w-full pl-10 pr-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 placeholder-gray-400 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium" 
                          placeholder="••••••••" 
                          minLength={8}
                        />
                      </div>
                      {isSignUp && (
                        <p className="text-[11px] text-gray-500 mt-2 font-medium">
                          Must be at least 8 chars, with 1 uppercase, 1 lowercase, 1 number & 1 special char.
                        </p>
                      )}
                    </div>

                    {isSignUp && (
                      <div className="pt-2">
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">
                          Security Check (Anti-Bot)
                        </label>
                        <div className="flex items-center gap-4">
                          <div className="bg-gray-100 dark:bg-gray-800 px-4 py-3 rounded-xl font-extrabold text-indigo-600 dark:text-indigo-400 border border-gray-200 dark:border-gray-700 tracking-wider w-32 text-center text-lg">
                            {captchaNum1} + {captchaNum2}
                          </div>
                          <input
                            type="number"
                            required
                            value={captchaInput}
                            onChange={(e) => setCaptchaInput(e.target.value)}
                            className="block w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-center"
                            placeholder="="
                          />
                        </div>
                        <p className="text-[10px] text-gray-500 mt-1.5 font-medium">Please solve this to prove you are human.</p>
                      </div>
                    )}

                    <button type="submit" disabled={loading} className="w-full flex justify-center items-center gap-2 py-3.5 px-4 border border-transparent rounded-xl shadow-lg shadow-indigo-500/30 text-sm font-extrabold text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 transition-all disabled:opacity-70 mt-2">
                      {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (isSignUp ? "Create Account" : "Sign In")}
                    </button>

                    <div className="text-center mt-4">
                      <button 
                        type="button" 
                        onClick={() => { resetFormState(); setIsSignUp(!isSignUp); }} 
                        className="text-sm font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 transition-colors"
                      >
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
                        <input 
                          type="text" 
                          required 
                          value={otp} 
                          onChange={(e) => handleOtpChange(e.target.value)} 
                          className="appearance-none block w-full pl-10 pr-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 placeholder-gray-400 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium tracking-widest text-center text-lg" 
                          placeholder="12345678" 
                          maxLength={8}
                        />
                      </div>
                      <p className="text-[11px] text-gray-500 mt-2 font-medium bg-gray-100 dark:bg-gray-800/50 p-2 rounded-lg border border-gray-200 dark:border-gray-700">
                        <span className="font-bold text-gray-700 dark:text-gray-300">Note:</span> If you don't see the email in your inbox, please check your <strong className="text-red-500 dark:text-red-400">Spam or Junk folder</strong>.
                      </p>
                    </div>
                    <button type="submit" disabled={loading || otp.length < 6} className="w-full flex justify-center items-center gap-2 py-3.5 px-4 border border-transparent rounded-xl shadow-lg shadow-indigo-500/30 text-sm font-extrabold text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 transition-all disabled:opacity-70">
                      {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Verify & Login"}
                    </button>
                    
                    <div className="flex items-center justify-between mt-4">
                      <button type="button" onClick={() => { setOtpSent(false); setOtp(""); }} className="text-sm font-bold text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
                        Go Back
                      </button>
                      <button 
                        type="button" 
                        onClick={handleResendOtp}
                        disabled={resendCooldown > 0 || loading}
                        className="text-sm font-bold text-indigo-600 hover:text-indigo-500 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
                      >
                        {resendCooldown > 0 ? `Resend OTP in ${resendCooldown}s` : "Resend OTP"}
                      </button>
                    </div>
                  </form>
                )}
              </div>
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
                <p className="text-xs text-gray-500 leading-relaxed">
                  Apna professional resume banayein, skills highlights tag karein aur direct HRs ke sath chat karein like LinkedIn.
                </p>
              </div>

              {/* Highlights List */}
              <div className="space-y-3 bg-gray-50 dark:bg-gray-800/40 p-4 rounded-2xl border border-gray-200 dark:border-gray-800">
                {[
                  { icon: "💬", title: "LinkedIn-Style Chat", desc: "MNC Recruiter aapki profile dekh kar aapse direct real-time chat shuru kar sakte hain." },
                  { icon: "🏷️", title: "Smart Skills Tag Editor", desc: "Apne technical ya non-technical skills enter karke professional profile stand out karein." },
                  { icon: "🎓", title: "College & Work Profile", desc: "Apna college educational detail, previous projects & work experience simple form me store karein." }
                ].map((item, idx) => (
                  <div key={idx} className="flex gap-3 text-left">
                    <span className="text-lg shrink-0 mt-0.5">{item.icon}</span>
                    <div className="space-y-0.5">
                      <h4 className="text-xs font-black text-gray-800 dark:text-gray-200">{item.title}</h4>
                      <p className="text-[11px] text-gray-500 leading-normal">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <Link 
                href="/private-jobs/login"
                className="w-full py-3.5 px-4 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-violet-500/20 transition-all hover:scale-[1.01] active:scale-[0.99] text-sm"
              >
                Candidate Login/Register Portal Kholein <ArrowRight className="w-4 h-4" />
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
                <p className="text-xs text-gray-500 leading-relaxed">
                  Apni corporate business status verify karwayein aur skilled pre-vetted candidates se direct connect karein.
                </p>
              </div>

              {/* Highlights List */}
              <div className="space-y-3 bg-gray-50 dark:bg-gray-800/40 p-4 rounded-2xl border border-gray-200 dark:border-gray-800">
                {[
                  { icon: "🛡️", title: "GSTIN Verified Spamless Postings", desc: "Har company ka GSTIN check hota hai, jisse candidates ko target spammers se 100% safety milti hai." },
                  { icon: "🎯", title: "Talent Scout Direct Search", desc: "Skills, college aur exact experience filters ke sath high-quality candidates filter out karein." },
                  { icon: "✉️", title: "LinkedIn-Style Candidate Chat", desc: "Select direct profiles, start live messaging & call candidates for interviews instantly." }
                ].map((item, idx) => (
                  <div key={idx} className="flex gap-3 text-left">
                    <span className="text-lg shrink-0 mt-0.5">{item.icon}</span>
                    <div className="space-y-0.5">
                      <h4 className="text-xs font-black text-gray-800 dark:text-gray-200">{item.title}</h4>
                      <p className="text-[11px] text-gray-500 leading-normal">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <Link 
                href="/employer/login"
                className="w-full py-3.5 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all hover:scale-[1.01] active:scale-[0.99] text-sm"
              >
                Employer/HR Portal Kholein <ArrowRight className="w-4 h-4" />
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
