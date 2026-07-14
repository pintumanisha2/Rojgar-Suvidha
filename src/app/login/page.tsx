"use client";

import { Suspense, useState, useEffect, useRef, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import {
  Mail, Loader2, ShieldCheck, KeyRound,
  Building, ArrowRight,
  Eye, EyeOff, Phone, CheckCircle, ArrowLeft,
  Lock, Users, Star, Zap, AlertTriangle, CheckCircle2,
} from "lucide-react";
import { useToast } from "@/components/ui/Toast";

// Maps raw Supabase/API error strings to clear, actionable English messages.
function mapAuthError(raw: string, context?: string): string {
  const r = (raw || "").toLowerCase();
  if (r.includes("invalid login credentials") || r.includes("invalid credentials"))
    return "Incorrect email or password. Please double-check and try again.";
  if (r.includes("email not confirmed"))
    return "Your email address is not verified. Please check your inbox for the verification email.";
  if (r.includes("user already registered") || r.includes("already registered"))
    return "An account with this email already exists. Please sign in instead.";
  if (r.includes("password should be at least"))
    return "Password must be at least 8 characters long.";
  if (r.includes("rate limit") || r.includes("too many requests") || r.includes("429"))
    return "Too many attempts. Please wait a few minutes and try again.";
  if (r.includes("network") || r.includes("fetch") || r.includes("503") || r.includes("failed to fetch"))
    return "Network error. Please check your internet connection and try again.";
  if (r.includes("expired") || r.includes("token has expired"))
    return context === "otp"
      ? "This OTP has expired (valid for 10 minutes). Please request a new one."
      : "Your session has expired. Please log in again.";
  if (r.includes("otp") || r.includes("invalid token") || r.includes("invalid or expired"))
    return "The OTP you entered is incorrect or has expired. Please try again.";
  if (r.includes("mobile number already registered"))
    return "This phone number is already linked to an account. Please sign in.";
  if (r.includes("does not exist") || r.includes("not found"))
    return "No account found with this phone number. Please sign up first.";
  if (r.includes("auth timeout") || r.includes("timed out"))
    return "The request timed out. Please check your connection and try again.";
  return raw || "Something went wrong. Please try again.";
}

// ── OTP 6-box component (banking-app style) ──────────────
function OtpBoxes({ value, onChange, disabled }: { value: string; onChange: (v: string) => void; disabled?: boolean }) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  const handleKey = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !value[i] && i > 0) refs.current[i - 1]?.focus();
  };

  const handleChange = (i: number, v: string) => {
    const digit = v.replace(/\D/g, "").slice(-1);
    const arr = value.split("");
    arr[i] = digit;
    const next = arr.join("").slice(0, 6);
    onChange(next);
    if (digit && i < 5) refs.current[i + 1]?.focus();
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    onChange(pasted);
    const nextIdx = Math.min(pasted.length, 5);
    refs.current[nextIdx]?.focus();
  };

  return (
    <div className="flex gap-2 justify-center">
      {Array.from({ length: 6 }).map((_, i) => (
        <input
          key={i}
          ref={(el) => { refs.current[i] = el; }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={value[i] || ""}
          disabled={disabled}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKey(i, e)}
          onPaste={handlePaste}
          className={`w-11 h-12 text-center text-xl font-black rounded-xl border-2 transition-all outline-none
            ${value[i]
              ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300"
              : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            }
            focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20
            disabled:opacity-50`}
        />
      ))}
    </div>
  );
}

// ── Password strength meter ───────────────────────────────
function PasswordStrength({ password }: { password: string }) {
  if (!password) return null;
  const score = [/.{8,}/, /[A-Z]/, /[0-9]/, /[^A-Za-z0-9]/].filter(r => r.test(password)).length;
  const levels = ["Weak", "Fair", "Good", "Strong"];
  const colors = ["bg-red-500", "bg-yellow-500", "bg-blue-500", "bg-green-500"];
  const textColors = ["text-red-600", "text-yellow-600", "text-blue-600", "text-green-600"];
  return (
    <div className="mt-2 space-y-1">
      <div className="flex gap-1">
        {[0, 1, 2, 3].map(i => (
          <div key={i} className={`h-1 flex-1 rounded-full transition-all ${i < score ? colors[score - 1] : "bg-gray-200 dark:bg-gray-700"}`} />
        ))}
      </div>
      <p className={`text-[11px] font-bold ${textColors[score - 1] || "text-gray-400"}`}>{score > 0 ? levels[score - 1] : ""}</p>
    </div>
  );
}

// ── Left brand panel ──────────────────────────────────────
function BrandPanel() {
  return (
    <div className="hidden lg:flex flex-col justify-between bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-800 text-white p-10 relative overflow-hidden min-h-full">
      {/* Decorative blobs */}
      <div className="absolute top-0 right-0 w-72 h-72 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-violet-500/20 rounded-full translate-y-1/2 -translate-x-1/2" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(139,92,246,0.3),transparent_60%)]" />

      {/* Logo */}
      <div className="relative z-10">
        <Link href="/" className="flex items-center gap-3 mb-12">
          <div className="w-11 h-11 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/30">
            <ShieldCheck className="w-6 h-6 text-white" />
          </div>
          <div>
            <p className="font-black text-lg leading-tight">Rojgar Suvidha</p>
            <p className="text-indigo-200 text-xs font-medium">Your Career Partner</p>
          </div>
        </Link>

        <h2 className="text-3xl font-black leading-tight mb-4">
          India's #1<br />
          <span className="text-yellow-300">Sarkari Naukri</span><br />
          Portal
        </h2>
        <p className="text-indigo-200 text-sm leading-relaxed mb-8">
          SSC, UPSC, Railway, Banking, Police — latest government jobs, results, and admit cards, all in one place.
        </p>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { icon: Users, label: "Registered Users", value: "5 Lakh+" },
            { icon: Star,  label: "Jobs Listed",      value: "10,000+" },
            { icon: Zap,   label: "Daily Updates",    value: "200+" },
            { icon: Lock,  label: "Secure & Trusted", value: "100%" },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
              <Icon className="w-5 h-5 text-indigo-200 mb-2" />
              <p className="text-lg font-black">{value}</p>
              <p className="text-indigo-300 text-[11px] font-medium">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Testimonial */}
      <div className="relative z-10 bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/10 mt-8">
        <div className="flex gap-1 mb-2">
          {[...Array(5)].map((_, i) => <Star key={i} className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />)}
        </div>
        <p className="text-sm text-indigo-100 italic leading-relaxed">
          "Rojgar Suvidha ki wajah se mujhe SSC CGL ka result sabse pehle mila. Bahut helpful platform hai!"
        </p>
        <p className="text-indigo-300 text-xs font-bold mt-2">— Ravi Kumar, UP</p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get("redirect") || "/dashboard";

  useEffect(() => {
    // Fast-path: read localStorage synchronously — returning users get redirected
    // before any Supabase network call, with zero visible flicker.
    let foundSession = false;
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith("sb-") && key.endsWith("-auth-token")) {
          const stored = localStorage.getItem(key);
          if (stored) {
            const parsed = JSON.parse(stored);
            if (parsed?.expires_at && parsed.expires_at > Math.floor(Date.now() / 1000)) {
              foundSession = true;
              break;
            }
          }
        }
      }
    } catch {}

    if (foundSession) {
      window.location.href = redirectUrl;
      return;
    }

    // Slow-path: verify with server (for cases where token was revoked remotely)
    let active = true;
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (active && session) window.location.href = redirectUrl;
    });
    return () => { active = false; };
  }, [redirectUrl]);

  const toast = useToast();

  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState<string | null>(null);
  const [msg, setMsg]             = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [authMethod, setAuthMethod] = useState<"phone" | "google" | "email">("phone");
  const [portalType, setPortalType] = useState<"user" | "employer">("user");

  // Helper — show error both inline and as toast
  const showError = (msg: string, context?: string) => {
    const friendly = mapAuthError(msg, context);
    setError(friendly);
    toast.error("Authentication Error", friendly);
    return friendly;
  };

  // ── Email state ───────────────────────────────────────
  const [email, setEmail]           = useState("");
  const [password, setPassword]     = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [isSignUp, setIsSignUp]     = useState(false);
  const [showPass, setShowPass]     = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isForgotPass, setIsForgotPass] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [emailOtpSent, setEmailOtpSent] = useState(false);
  const [emailOtp, setEmailOtp]     = useState("");
  const [emailCooldown, setEmailCooldown] = useState(0);
  useEffect(() => {
    if (emailCooldown > 0) { const t = setTimeout(() => setEmailCooldown(c => c - 1), 1000); return () => clearTimeout(t); }
  }, [emailCooldown]);

  // ── Phone OTP-only state ──────────────────────────────
  const [phone, setPhone]           = useState("");
  const [phoneOtpSent, setPhoneOtpSent] = useState(false);
  const [phoneOtp, setPhoneOtp]     = useState("");
  const [phoneCooldown, setPhoneCooldown] = useState(0);
  useEffect(() => {
    if (phoneCooldown > 0) { const t = setTimeout(() => setPhoneCooldown(c => c - 1), 1000); return () => clearTimeout(t); }
  }, [phoneCooldown]);

  const reset = () => {
    setError(null); setMsg(null);
    setPhoneOtpSent(false); setPhoneOtp(""); setPhone("");
    setEmailOtpSent(false); setEmailOtp(""); setEmail("");
    setPassword(""); setConfirmPass(""); setNewPassword("");
    setIsForgotPass(false); setIsSignUp(false);
  };

  const redirectAfterLogin = async (userId: string) => {
    try {
      const { data: profile } = await supabase.from("profiles").select("full_name").eq("id", userId).single();
      const target = profile?.full_name ? redirectUrl : `/profile-setup?redirect=${encodeURIComponent(redirectUrl)}`;
      window.location.href = target;
    } catch {
      window.location.href = `/profile-setup?redirect=${encodeURIComponent(redirectUrl)}`;
    }
  };

  // ── Google ────────────────────────────────────────────────────────────────
  const handleGoogle = async () => {
    setLoading(true); setError(null);
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback?redirect=${encodeURIComponent(redirectUrl)}` },
    });
    if (oauthError) { showError(oauthError.message); setLoading(false); }
  };

  // ── Phone OTP: Send ───────────────────────────────────────────────────────
  const handleSendPhoneOtp = async () => {
    const digits = phone.replace(/\D/g, "");
    if (digits.length !== 10) {
      const msg = "Please enter a valid 10-digit Indian mobile number.";
      setError(msg);
      setFieldErrors(prev => ({ ...prev, phone: msg }));
      return;
    }
    setFieldErrors(prev => { const n = { ...prev }; delete n.phone; return n; });
    setLoading(true); setError(null); setMsg(null);
    try {
      const res = await fetch("/api/send-phone-otp", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: `+91${digits}` }),
      });
      const data = await res.json();
      if (!res.ok) { showError(data.error || "Failed to send OTP. Please try again.", "otp"); }
      else {
        setPhoneOtpSent(true); setPhoneCooldown(60);
        setMsg(`OTP sent to +91 ${digits}!`);
        toast.success("OTP Sent!", `A 6-digit code was sent to +91 ${digits}.`);
      }
    } catch { showError("Network error. Please check your connection and try again."); }
    finally { setLoading(false); }
  };

  // ── Phone OTP: Verify (auto detect new/existing user) ──
  const handleVerifyPhoneOtp = async () => {
    if (phoneOtp.length !== 6) { setError("Please enter the complete 6-digit OTP."); return; }
    const digits = phone.replace(/\D/g, "");
    setLoading(true); setError(null); setMsg(null);
    try {
      const res = await fetch("/api/verify-phone-otp", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: `+91${digits}`, otp: phoneOtp }),
      });
      const data = await res.json();
      if (!res.ok) { showError(data.error || "Invalid OTP code. Please try again.", "otp"); setLoading(false); return; }
      if (data.accessToken && data.refreshToken) {
        const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
          access_token: data.accessToken,
          refresh_token: data.refreshToken,
        });
        if (sessionError) { showError("Failed to create session. Please try again."); setLoading(false); return; }
        if (sessionData?.user) {
          const successMsg = data.isNewUser ? "Account created successfully!" : "Signed in successfully!";
          setMsg(successMsg + " Redirecting...");
          toast.success(successMsg);
          await redirectAfterLogin(sessionData.user.id);
        }
      } else if (data.actionLink) {
        const successMsg = data.isNewUser ? "Account created! Signing you in..." : "Signed in successfully!";
        setMsg(successMsg);
        toast.success(successMsg);
        const redirectParam = encodeURIComponent(data.isNewUser ? `/profile-setup?redirect=${encodeURIComponent(redirectUrl)}` : redirectUrl);
        window.location.href = `${data.actionLink}&next=${redirectParam}`;
      } else {
        showError("Session creation failed. Please try again.");
        setLoading(false);
      }
    } catch { showError("Network error. Please check your connection and try again."); setLoading(false); }
  };

  const handleResendPhoneOtp = async () => {
    if (phoneCooldown > 0) return;
    const digits = phone.replace(/\D/g, "");
    setLoading(true); setError(null);
    try {
      const res = await fetch("/api/send-phone-otp", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: `+91${digits}` }),
      });
      if (res.ok) {
        setMsg("A new OTP has been sent!");
        setPhoneCooldown(60);
        toast.success("New OTP Sent", `A fresh code was sent to +91 ${digits}.`);
      } else {
        const d = await res.json();
        showError(d.error || "OTP resend failed. Please try again.", "otp");
      }
    } catch { showError("Network error. Please check your connection."); }
    finally { setLoading(false); }
  };
   // ── Email auth ──────────────────────────────────────
  const checkEmailTypo = (e: string) => {
    const domain = e.split("@")[1]?.toLowerCase();
    const typos: Record<string,string> = { "gamil.com":"gmail.com","gmal.com":"gmail.com","gnail.com":"gmail.com","gmail.co":"gmail.com","yaho.com":"yahoo.com","hotmai.com":"hotmail.com" };
    return typos[domain] ? `${e.split("@")[0]}@${typos[domain]}` : null;
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null); setMsg(null); setFieldErrors({});
    const typo = checkEmailTypo(email);
    if (typo) {
      const msg = `Possible typo in email — did you mean "${typo}"?`;
      setError(msg);
      setFieldErrors({ email: msg });
      return;
    }
    if (isSignUp) {
      if (password.length < 8) { const m = "Password must be at least 8 characters long."; setError(m); setFieldErrors({ password: m }); return; }
      if (password !== confirmPass) { const m = "Passwords do not match."; setError(m); setFieldErrors({ confirmPass: m }); return; }
      setLoading(true);
      try {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) {
          if (error.message.toLowerCase().includes("already")) {
            const m = "An account with this email already exists. Please sign in instead.";
            setError(m); setIsSignUp(false);
            toast.warning("Account Exists", m);
          } else showError(error.message);
        } else if (data?.session) {
          setMsg("Account created successfully! Redirecting...");
          toast.success("Account Created!", "Welcome to Rojgar Suvidha.");
          await redirectAfterLogin(data.user!.id);
        } else {
          setEmailOtpSent(true); setEmailCooldown(60);
          const m = "Account created! A 6-digit verification code has been sent to your email.";
          setMsg(m);
          toast.info("Check Your Email", m);
        }
      } catch (err: any) { showError(err.message); }
      finally { setLoading(false); }
    } else {
      setLoading(true);
      try {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          if (error.message.includes("Email not confirmed")) {
            await supabase.auth.resend({ type: "signup", email });
            setIsSignUp(true); setEmailOtpSent(true); setEmailCooldown(60);
            const m = "Your email is not verified. A new verification code has been sent to your inbox.";
            setError(m);
            toast.warning("Email Not Verified", m);
          } else {
            showError(error.message);
          }
        } else if (data?.user) {
          setMsg("Signed in successfully! Redirecting...");
          toast.success("Welcome Back!", `Signed in as ${data.user.email}.`);
          await redirectAfterLogin(data.user.id);
        }
      } catch (err: any) { showError(err.message); }
      finally { setLoading(false); }
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError(null);
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) showError(error.message);
    else {
      setEmailOtpSent(true);
      setMsg("Password reset instructions have been sent to your email address.");
      toast.info("Check Your Email", "Follow the instructions in the email to reset your password.");
    }
    setLoading(false);
  };




  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 8) { setError("New password must be at least 8 characters long."); return; }
    setLoading(true); setError(null);
    const { error: ve } = await supabase.auth.verifyOtp({ email, token: emailOtp, type: "recovery" });
    if (ve) { showError(ve.message, "otp"); setLoading(false); return; }
    const { error: ue } = await supabase.auth.updateUser({ password: newPassword });
    if (ue) showError(ue.message);
    else {
      setMsg("Password updated successfully! Redirecting...");
      toast.success("Password Updated!", "Your password has been reset successfully.");
      setTimeout(() => window.location.reload(), 1500);
    }
    setLoading(false);
  };

  const handleVerifyEmailOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError(null);
    const { data, error } = await supabase.auth.verifyOtp({ email, token: emailOtp, type: "signup" });
    if (error) setError(error.message);
    else if (data?.user) { setMsg("Email verified successfully! Redirecting..."); await redirectAfterLogin(data.user.id); }
    setLoading(false);
  };

  const handleResendEmailOtp = async () => {
    if (emailCooldown > 0) return;
    setLoading(true); setError(null);
    const { error } = await supabase.auth.resend({ type: "signup", email });
    if (error) setError(error.message);
    else { setMsg("A new OTP has been sent!"); setEmailCooldown(60); }
    setLoading(false);
  };

  // ── Shared primary button ─────────────────────────────
  const PrimaryBtn = ({ children, onClick, disabled, type = "button" }: any) => (
    <button type={type} onClick={onClick} disabled={disabled || loading}
      className="w-full flex justify-center items-center gap-2 py-3.5 px-4 rounded-xl text-sm font-black text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 shadow-lg shadow-indigo-500/30 transition-all disabled:opacity-60 disabled:cursor-not-allowed active:scale-[0.98]">
      {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : children}
    </button>
  );

  const InputField = ({ icon: Icon, ...props }: any) => (
    <div className="relative">
      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
        <Icon className="h-4.5 w-4.5 text-gray-400" />
      </div>
      <input {...props} className={`w-full pl-10 pr-4 py-3 border-2 rounded-xl bg-gray-50 dark:bg-gray-800/50 text-gray-900 dark:text-white placeholder-gray-400 outline-none transition-all font-medium text-sm
        ${props.error ? "border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-500/20" : "border-gray-200 dark:border-gray-700 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"}
        disabled:opacity-60 ${props.className || ""}`} />
    </div>
  );

  return (
    <div className="min-h-screen flex bg-gray-50 dark:bg-gray-950">
      {/* Left brand panel (desktop only) */}
      <div className="hidden lg:block w-[420px] shrink-0">
        <BrandPanel />
      </div>

      {/* Right auth panel */}
      <div className="flex-1 flex flex-col items-center justify-center py-10 px-4 sm:px-8 relative overflow-y-auto">
        {/* Mobile logo */}
        <div className="lg:hidden mb-6 text-center">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <span className="font-black text-lg text-gray-900 dark:text-white">Rojgar Suvidha</span>
          </Link>
        </div>

        <div className="w-full max-w-md">
          {/* Portal type selector — User (Sarkari + Private) vs Employer */}
          <div className="flex bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-1 gap-1 mb-6 shadow-sm">
            {[
              { key: "user",     label: "👤 User Login" },
              { key: "employer", label: "🏢 Employer / HR" },
            ].map(({ key, label }) => (
              <button key={key} onClick={() => { reset(); setPortalType(key as any); }}
                className={`flex-1 py-2 text-xs font-black rounded-xl transition-all ${portalType === key ? "bg-indigo-600 text-white shadow-sm" : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"}`}>
                {label}
              </button>
            ))}
          </div>

          {/* Auth card */}
          <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-xl shadow-black/5 border border-gray-100 dark:border-gray-800 overflow-hidden">
            {/* ── UNIFIED USER PORTAL (Sarkari + Private Jobs) ── */}
            {portalType === "user" && (
              <div className="p-7">
                <div className="mb-6">
                  <h1 className="text-2xl font-black text-gray-900 dark:text-white">
                    {isSignUp && authMethod === "email" ? "Create Account" : "Welcome Back"}
                  </h1>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {authMethod === "phone" ? "Login via Mobile OTP to access all Government & Private job portals." :
                     authMethod === "google" ? "One-click login with Google to access both Government & Private jobs." :
                     isSignUp ? "Create a new account to get instant access to Government & Private jobs." :
                     "Sign in to access your unified profile for Government & Private jobs."}
                  </p>
                </div>

                {/* Method tabs */}
                <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-2xl gap-1 mb-6">
                  {[
                    { key: "phone",  icon: "📱", label: "Mobile OTP" },
                    { key: "google", icon: "G",  label: "Google", isImg: true },
                    { key: "email",  icon: "✉️", label: "Email" },
                  ].map(({ key, icon, label, isImg }) => (
                    <button key={key} onClick={() => { reset(); setAuthMethod(key as any); }}
                      className={`flex-1 flex flex-col items-center gap-1 py-2.5 px-1 rounded-xl text-[11px] font-black transition-all ${authMethod === key ? "bg-white dark:bg-gray-700 shadow-sm text-indigo-600 dark:text-indigo-400" : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"}`}>
                      {isImg
                        ? <img src="https://www.google.com/favicon.ico" alt="G" className="w-4 h-4" />
                        : <span className="text-base">{icon}</span>}
                      {label}
                    </button>
                  ))}
                </div>

                {/* Alerts */}
                {error && (
                  <div className="mb-4 flex items-start gap-2 text-sm text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 px-4 py-3 rounded-xl">
                    <span className="shrink-0 mt-0.5">⚠️</span> {error}
                  </div>
                )}
                {msg && !error && (
                  <div className="mb-4 flex items-start gap-2 text-sm text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 px-4 py-3 rounded-xl">
                    <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" /> {msg}
                  </div>
                )}

                {/* ── PHONE OTP (password-free) ── */}
                {authMethod === "phone" && (
                  <div className="space-y-5">
                    {!phoneOtpSent ? (
                      <>
                        <div>
                          <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Mobile Number</label>
                          <div className="flex gap-2">
                            <div className="flex items-center px-3 bg-gray-100 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl text-sm font-bold text-gray-700 dark:text-gray-300 whitespace-nowrap select-none">
                              🇮🇳 +91
                            </div>
                            <input
                              type="tel" value={phone} disabled={loading}
                              onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                              onKeyDown={(e) => { if (e.key === "Enter" && phone.length === 10) handleSendPhoneOtp(); }}
                              className="flex-1 py-3 px-4 border-2 border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white font-medium text-lg tracking-widest outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all disabled:opacity-60"
                              placeholder="9876543210" maxLength={10}
                            />
                          </div>
                        </div>
                        <PrimaryBtn onClick={handleSendPhoneOtp} disabled={phone.replace(/\D/g,"").length !== 10}>
                          Send OTP →
                        </PrimaryBtn>
                        <p className="text-center text-xs text-gray-400 dark:text-gray-500">
                          📱 One account — access both Government & Private jobs. Login via OTP, no password needed.
                        </p>
                      </>
                    ) : (
                      <>
                        <div className="p-4 bg-indigo-50 dark:bg-indigo-950/30 rounded-2xl border border-indigo-100 dark:border-indigo-900/50 text-center">
                          <p className="text-sm font-black text-indigo-700 dark:text-indigo-300">📲 OTP sent to +91 {phone}</p>
                          <button onClick={() => { setPhoneOtpSent(false); setPhoneOtp(""); setMsg(null); }}
                            className="text-xs text-indigo-500 hover:underline font-bold mt-1">Change number</button>
                        </div>

                        <div>
                          <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3 text-center">Enter the 6-digit OTP</label>
                          <OtpBoxes value={phoneOtp} onChange={setPhoneOtp} disabled={loading} />
                        </div>

                        <PrimaryBtn onClick={handleVerifyPhoneOtp} disabled={phoneOtp.length !== 6}>
                          Verify & Login →
                        </PrimaryBtn>

                        <div className="flex items-center justify-between text-sm">
                          <button onClick={() => { setPhoneOtpSent(false); setPhoneOtp(""); }}
                            className="font-bold text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors">
                            ← Back
                          </button>
                          <button onClick={handleResendPhoneOtp} disabled={phoneCooldown > 0 || loading}
                            className="font-bold text-indigo-600 dark:text-indigo-400 disabled:text-gray-400 transition-colors">
                            {phoneCooldown > 0 ? `Resend in ${phoneCooldown}s` : "Resend OTP"}
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                )}

                {/* ── GOOGLE ── */}
                {authMethod === "google" && (
                  <div className="space-y-4">
                    <button onClick={handleGoogle} disabled={loading}
                      className="relative w-full flex items-center justify-center gap-3 py-3.5 px-4 border-2 border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-sm font-black text-gray-800 dark:text-gray-200 hover:border-indigo-400 hover:bg-gray-50 transition-all shadow-sm overflow-hidden group">
                      <div className="absolute top-0 right-0 bg-indigo-600 text-white text-[9px] font-black px-2 py-0.5 rounded-bl-lg">
                        Recommended
                      </div>
                      <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5 group-hover:scale-110 transition-transform" />
                      {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Continue with Google"}
                    </button>
                    <p className="text-center text-xs text-gray-400 dark:text-gray-500 leading-relaxed">
                      Google account se 1 click me instant login. <br />
                      Koi password yaad nahi karna padega. ✨
                    </p>
                  </div>
                )}

                {/* ── EMAIL ── */}
                {authMethod === "email" && (
                  <div className="space-y-4">
                    {/* Forgot password flow */}
                    {isForgotPass && !emailOtpSent && (
                      <form onSubmit={handleForgotPassword} className="space-y-4">
                        <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl text-xs text-amber-700 dark:text-amber-400 font-medium">
                          🔑 Enter your email address to receive a password reset link and OTP.
                        </div>
                        <div>
                          <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Email Address</label>
                          <InputField icon={Mail} type="email" required value={email} onChange={(e: any) => setEmail(e.target.value)} placeholder="student@example.com" disabled={loading} />
                        </div>
                        <PrimaryBtn type="submit">Send Reset OTP →</PrimaryBtn>
                        <button type="button" onClick={() => { resetForm(); }}
                          className="w-full text-center text-sm font-bold text-gray-500 hover:text-indigo-600 transition-colors">
                          ← Back to Sign In
                        </button>
                      </form>
                    )}

                    {/* Forgot password OTP verify */}
                    {isForgotPass && emailOtpSent && (
                      <form onSubmit={handleResetPassword} className="space-y-4">
                        <div>
                          <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3 text-center">Enter Email OTP</label>
                          <OtpBoxes value={emailOtp} onChange={setEmailOtp} disabled={loading} />
                        </div>
                        <div>
                          <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">New Password</label>
                          <div className="relative">
                            <InputField icon={Lock} type={showPass ? "text" : "password"} required value={newPassword}
                              onChange={(e: any) => setNewPassword(e.target.value)} placeholder="Min 8 characters" disabled={loading} />
                            <button type="button" onClick={() => setShowPass(!showPass)}
                              className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600">
                              {showPass ? <EyeOff className="h-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                          <PasswordStrength password={newPassword} />
                        </div>
                        <PrimaryBtn type="submit" disabled={emailOtp.length < 6 || newPassword.length < 8}>
                          Set New Password →
                        </PrimaryBtn>
                        <button type="button" onClick={() => { setIsForgotPass(false); setEmailOtpSent(false); setEmailOtp(""); }}
                          className="w-full text-center text-sm font-bold text-gray-500 hover:text-indigo-600 transition-colors">
                          ← Wapas
                        </button>
                      </form>
                    )}

                    {/* Sign In / Create Account */}
                    {!isForgotPass && !emailOtpSent && (
                      <form onSubmit={handleEmailAuth} className="space-y-4">
                        {/* Sign In / Create tabs */}
                        <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-xl gap-1">
                          <button type="button" onClick={() => { setIsSignUp(false); setError(null); setMsg(null); }}
                            className={`flex-1 py-2 text-xs font-black rounded-lg transition-all ${!isSignUp ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm" : "text-gray-500"}`}>
                            Sign In
                          </button>
                          <button type="button" onClick={() => { setIsSignUp(true); setError(null); setMsg(null); }}
                            className={`flex-1 py-2 text-xs font-black rounded-lg transition-all ${isSignUp ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm" : "text-gray-500"}`}>
                            Create Account
                          </button>
                        </div>

                        <div>
                          <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Email Address</label>
                          <InputField icon={Mail} type="email" required value={email} onChange={(e: any) => setEmail(e.target.value)}
                            placeholder="student@example.com" disabled={loading} />
                        </div>

                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300">Password</label>
                            {!isSignUp && (
                              <button type="button" onClick={() => { setIsForgotPass(true); setError(null); }}
                                className="text-xs font-bold text-indigo-600 hover:text-indigo-500 transition-colors">
                                Forgot Password?
                              </button>
                            )}
                          </div>
                          <div className="relative">
                            <InputField icon={Lock} type={showPass ? "text" : "password"} required value={password}
                              onChange={(e: any) => setPassword(e.target.value)}
                              placeholder={isSignUp ? "Min 8 characters" : "••••••••"}
                              minLength={isSignUp ? 8 : 6} disabled={loading} />
                            <button type="button" onClick={() => setShowPass(!showPass)}
                              className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600">
                              {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                          {isSignUp && <PasswordStrength password={password} />}
                        </div>

                        {isSignUp && (
                          <div>
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Confirm Password</label>
                            <div className="relative">
                              <InputField icon={Lock} type={showConfirm ? "text" : "password"} required value={confirmPass}
                                onChange={(e: any) => setConfirmPass(e.target.value)} placeholder="Re-enter your password" disabled={loading} />
                              <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600">
                                {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                              </button>
                            </div>
                            {confirmPass && (
                              <p className={`text-[11px] font-bold mt-1 ${password === confirmPass ? "text-green-600" : "text-red-500"}`}>
                                {password === confirmPass ? "✓ Passwords match" : "✗ Passwords do not match"}
                              </p>
                            )}
                          </div>
                        )}

                        <PrimaryBtn type="submit">
                          {isSignUp ? "Create Account →" : "Sign In →"}
                        </PrimaryBtn>
                      </form>
                    )}

                    {/* Email OTP verify (after signup) */}
                    {!isForgotPass && emailOtpSent && (
                      <form onSubmit={handleVerifyEmailOtp} className="space-y-4">
                        <div className="p-4 bg-indigo-50 dark:bg-indigo-950/30 rounded-2xl border border-indigo-100 dark:border-indigo-900/50 text-center">
                          <p className="text-sm font-black text-indigo-700 dark:text-indigo-300">📧 OTP sent to: {email}</p>
                          <p className="text-xs text-indigo-500 mt-1">Please check your Spam/Junk folders as well</p>
                        </div>
                        <div>
                          <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3 text-center">Enter the 6-digit OTP</label>
                          <OtpBoxes value={emailOtp} onChange={setEmailOtp} disabled={loading} />
                        </div>
                        <PrimaryBtn type="submit" disabled={emailOtp.length < 6}>
                          Verify Email →
                        </PrimaryBtn>
                        <div className="flex items-center justify-between text-sm">
                          <button type="button" onClick={() => { setEmailOtpSent(false); setEmailOtp(""); }}
                            className="font-bold text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors">← Wapas</button>
                          <button type="button" onClick={handleResendEmailOtp} disabled={emailCooldown > 0 || loading}
                            className="font-bold text-indigo-600 disabled:text-gray-400 transition-colors">
                            {emailCooldown > 0 ? `Resend in ${emailCooldown}s` : "Resend OTP"}
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
                )}
              </div>
            )}



            {/* ── EMPLOYER PORTAL ── */}
            {portalType === "employer" && (
              <div className="p-7 space-y-6">
                <div className="text-center space-y-3">
                  <div className="inline-flex p-4 bg-green-50 dark:bg-green-950/30 rounded-2xl border border-green-100 dark:border-green-900/50">
                    <Building className="w-9 h-9 text-green-600 dark:text-green-400" />
                  </div>
                  <h2 className="text-xl font-black text-gray-900 dark:text-white flex items-center justify-center gap-2">
                    Employer / HR Portal <ShieldCheck className="w-5 h-5 text-emerald-500" />
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                    Company GSTIN verify karein, job post karein, aur pre-vetted candidates hire karein.
                  </p>
                </div>
                <Link href="/employer/login"
                  className="w-full py-4 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all hover:scale-[1.01] active:scale-[0.99]">
                  Employer Login <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            )}

            {/* Footer */}
            <div className="px-7 pb-6 border-t border-gray-100 dark:border-gray-800 pt-4 text-center">
              <p className="text-[11px] text-gray-400 dark:text-gray-500">
                Sign in karke aap hamare{" "}
                <Link href="/terms" className="underline hover:text-indigo-600 transition-colors">Terms</Link>
                {" "}&{" "}
                <Link href="/privacy" className="underline hover:text-indigo-600 transition-colors">Privacy Policy</Link>
                {" "}se agree karte hain.
              </p>
            </div>
          </div>

          <div className="mt-5 text-center">
            <Link href="/" className="text-sm font-bold text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors flex items-center justify-center gap-1.5">
              <ArrowLeft className="w-4 h-4" /> Website pe wapas jayein
            </Link>
          </div>
        </div>
      </div>
    </div>
  );

  // helper used inside component (workaround for no-nested-fn lint)
  function resetForm() { reset(); }
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-bold text-gray-500">Loading...</p>
        </div>
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}
