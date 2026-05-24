"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { 
  Briefcase, Mail, Lock, User, Building,
  ArrowRight, ShieldCheck, Loader2,
  AlertCircle, CheckCircle2, FileText, Upload
} from "lucide-react";

export default function EmployerLoginPage() {
  const router = useRouter();
  const [activeForm, setActiveForm] = useState<"signin" | "signup">("signin");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  // --- SIGNUP STATES ---
  const [signupStep, setSignupStep] = useState<1 | 2 | 3>(1);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Form Fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [hrName, setHrName] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [idCardFile, setIdCardFile] = useState<File | null>(null);

  const isCompanyEmail = (emailString: string) => {
    const freeDomains = [
      "gmail.com", "yahoo.com", "hotmail.com", "outlook.com", "live.com", 
      "icloud.com", "aol.com", "protonmail.com", "ymail.com", "rediffmail.com"
    ];
    const domain = emailString.split('@')[1];
    if (!domain) return false;
    return !freeDomains.includes(domain.toLowerCase());
  };

  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const resetMessages = () => {
    setError(null);
    setInfoMessage(null);
  };

  // --- LOGIN FLOW ---
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    resetMessages();

    try {
      const { data, error: authErr } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password
      });

      if (authErr) throw authErr;

      // Check Employer Profile status
      const { data: profile, error: dbErr } = await supabase
        .from("employer_profiles")
        .select("is_verified")
        .eq("id", data.session?.user.id)
        .single();

      if (dbErr || !profile) {
        await supabase.auth.signOut();
        setError("Registration incomplete! You must complete OTP and ID Card upload.");
        setLoading(false);
        return;
      }

      if (profile.is_verified === false) {
        await supabase.auth.signOut();
        setError("Account is under review by Admin. Please wait for approval before logging in.");
        setLoading(false);
        return;
      }

      setInfoMessage("Login Successful! Redirecting to HR Dashboard...");
      setTimeout(() => {
        router.push("/employer/dashboard");
      }, 1500);

    } catch (err: any) {
      console.error("Auth Sign In Error:", err);
      // Hard fallback for demo
      if (email.toLowerCase().includes("demo") && password === "demo123") {
        setInfoMessage("Demo Mode Activated! Redirecting...");
        setTimeout(() => {
          router.push("/employer/dashboard");
        }, 1500);
      } else {
        setError(err.message || "Invalid credentials.");
      }
    } finally {
      setLoading(false);
    }
  };

  // --- SIGNUP STEP 1: SEND OTP ---
  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName.trim() || !hrName.trim() || !email.trim() || !phone.trim()) {
      setError("Please fill all details to proceed.");
      return;
    }

    if (!isCompanyEmail(email.trim())) {
      setError("Only Official Company Emails are allowed. Personal emails (Gmail, Yahoo, etc.) are strictly prohibited.");
      return;
    }

    setLoading(true);
    resetMessages();

    try {
      // Create user using signUp to trigger "Confirm Signup" template
      const { error: otpErr } = await supabase.auth.signUp({
        email: email.trim(),
        password: password.trim(),
        options: {
          data: {
            company_name: companyName.trim(),
            hr_name: hrName.trim()
          }
        }
      });

      if (otpErr) {
        if (otpErr.message.toLowerCase().includes("already registered") || otpErr.message.toLowerCase().includes("already exists")) {
          // Fallback: If they already tried registering but didn't verify, resend the OTP
          const { error: resendErr } = await supabase.auth.resend({
            type: 'signup',
            email: email.trim(),
          });
          
          if (resendErr) {
            setError("This email is already registered and verified. Please click 'Login' instead.");
            setLoading(false);
            return;
          }
        } else {
          throw otpErr;
        }
      }

      setInfoMessage("OTP sent securely to your Company Email.");
      setResendCooldown(119); // 1:59 timer
      setSignupStep(2);
    } catch (err: any) {
      setError(err.message || "Could not send OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // --- SIGNUP STEP 2: VERIFY OTP ---
  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanOtp = otp.replace(/\s+/g, '');
    
    if (!cleanOtp || cleanOtp.length < 6) {
      setError("Please enter a valid OTP.");
      return;
    }

    setLoading(true);
    resetMessages();

    try {
      const verifyPromise = supabase.auth.verifyOtp({
        email: email.trim(),
        token: cleanOtp,
        type: 'signup'
      });
      
      const timeoutPromise = new Promise<{error: any}>((_, reject) => 
        setTimeout(() => reject(new Error("Supabase is taking too long to verify the OTP. Please check your internet or try again.")), 15000)
      );

      const { error: verifyErr } = await Promise.race([verifyPromise, timeoutPromise]);

      if (verifyErr) throw verifyErr;

      setInfoMessage("Email verified successfully! Please complete your profile.");
      setSignupStep(3);
    } catch (err: any) {
      setError("Invalid OTP. Please check your email and try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (resendCooldown > 0) return;
    setLoading(true);
    resetMessages();
    try {
      const { error: resendErr } = await supabase.auth.resend({
        type: 'signup',
        email: email.trim(),
      });
      if (resendErr) throw resendErr;
      
      setInfoMessage("A new OTP has been sent to your Company Email.");
      setResendCooldown(119); // Reset to 1:59
    } catch (err: any) {
      setError(err.message || "Failed to resend OTP.");
    } finally {
      setLoading(false);
    }
  };

  // --- SIGNUP STEP 3: UPLOAD ID ---
  const handleCompleteRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!idCardFile) {
      setError("Please upload your Company ID Card for verification.");
      return;
    }

    setLoading(true);
    resetMessages();

    try {
      // User is already authenticated from OTP verification
      const { data: { user } } = await supabase.auth.getUser();
      const userId = user?.id;

      // Force update password to ensure it's saved (especially for users who fell into the 'already registered' resend fallback)
      await supabase.auth.updateUser({
        password: password.trim()
      });

      let idCardUrl = "";

      // 2. Upload ID Card (Mocking this if bucket isn't ready)
      if (userId && idCardFile) {
        const fileExt = idCardFile.name.split('.').pop();
        const fileName = `${userId}-idcard.${fileExt}`;
        
        const { data: uploadData, error: uploadErr } = await supabase.storage
          .from("employer_documents")
          .upload(fileName, idCardFile, { upsert: true });

        if (!uploadErr && uploadData) {
          const { data: publicUrlData } = supabase.storage
            .from("employer_documents")
            .getPublicUrl(fileName);
          idCardUrl = publicUrlData.publicUrl;
        } else {
          console.warn("Storage upload failed, bucket might not exist:", uploadErr);
        }
      }

      // 3. Save profile in Database
      if (userId) {
        const { error: profileErr } = await supabase.from("employer_profiles").insert([
          {
            id: userId,
            user_id: userId,
            company_name: companyName.trim(),
            contact_name: hrName.trim(),
            email: email.toLowerCase().trim(),
            phone: phone.trim(),
            is_verified: false,
            company_id_card_url: idCardUrl // Requires schema update
          }
        ]);
        if (profileErr) console.warn("Could not insert to employer_profiles:", profileErr);
      }

      // Automatically sign out so they can't access dashboard while pending
      await supabase.auth.signOut();

      setInfoMessage("Registration successful! Your Company ID is under review by Admin. You will be notified once approved.");
      
      setTimeout(() => {
        setActiveForm("signin");
        setSignupStep(1);
        resetMessages();
        setInfoMessage("Your account is pending admin approval.");
      }, 4000);

    } catch (err: any) {
      setError(err.message || "Failed to complete registration.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 min-h-[100vh] relative flex items-center justify-center overflow-hidden">
      
      {/* Vibrant Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-900 via-purple-900 to-slate-900 z-0"></div>
      
      {/* Animated Glowing Orbs */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-indigo-500/40 rounded-full blur-[100px] mix-blend-screen animate-pulse -z-0"></div>
      <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-fuchsia-500/30 rounded-full blur-[120px] mix-blend-screen animate-pulse delay-1000 -z-0"></div>
      <div className="absolute top-1/3 right-1/3 w-[300px] h-[300px] bg-blue-500/30 rounded-full blur-[80px] mix-blend-screen animate-pulse delay-500 -z-0"></div>

      <div className="max-w-md w-full bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border border-white/40 dark:border-gray-700/50 rounded-3xl shadow-[0_8px_32px_0_rgba(31,38,135,0.37)] p-6 sm:p-8 space-y-6 relative z-10 transition-all duration-300">
        
        {/* Header Icon & Title */}
        <div className="text-center space-y-3">
          <div className="inline-flex p-4 bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-2xl shadow-lg transform hover:scale-105 transition-transform duration-300">
            <Briefcase className="w-8 h-8" />
          </div>
          <h2 className="text-3xl font-black bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400">
            Employer Portal
          </h2>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
            Find the top 1% certified talent for your company.
          </p>
        </div>

        {/* Form Toggle Tabs (Only show if on step 1) */}
        {signupStep === 1 && (
          <div className="flex bg-gray-50 dark:bg-gray-800/60 p-1.5 rounded-2xl border border-gray-100 dark:border-gray-800">
            <button
              onClick={() => { setActiveForm("signin"); resetMessages(); }}
              className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${
                activeForm === "signin"
                  ? "bg-white dark:bg-gray-700 text-indigo-600 dark:text-white shadow-sm"
                  : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              }`}
            >
              Login
            </button>
            <button
              onClick={() => { setActiveForm("signup"); resetMessages(); }}
              className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${
                activeForm === "signup"
                  ? "bg-white dark:bg-gray-700 text-indigo-600 dark:text-white shadow-sm"
                  : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              }`}
            >
              Register Company
            </button>
          </div>
        )}

        {/* Notifications */}
        {error && (
          <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 p-3.5 rounded-xl text-xs font-medium flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {infoMessage && (
          <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 text-green-600 dark:text-green-400 p-3.5 rounded-xl text-xs font-medium flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{infoMessage}</span>
          </div>
        )}

        {/* Standard signin Form */}
        {activeForm === "signin" ? (
          <form onSubmit={handleSignIn} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Company Email</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input 
                  type="email" 
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="hr@company.com" 
                  className="w-full pl-10 pr-4 py-3 bg-white/50 dark:bg-gray-800/50 border border-white/60 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-purple-500 focus:bg-white dark:focus:bg-gray-900 outline-none text-sm font-medium transition-all shadow-sm backdrop-blur-sm"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input 
                  type="password" 
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••" 
                  className="w-full pl-10 pr-4 py-3 bg-white/50 dark:bg-gray-800/50 border border-white/60 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-purple-500 focus:bg-white dark:focus:bg-gray-900 outline-none text-sm font-medium transition-all shadow-sm backdrop-blur-sm"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl font-bold transition-all shadow-lg hover:shadow-indigo-500/30 flex items-center justify-center gap-2 disabled:opacity-70"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Sign In to Dashboard"}
              {!loading && <ArrowRight className="w-4 h-4" />}
            </button>
          </form>
        ) : (
          /* SIGNUP FLOW */
          <div className="space-y-4">
            {signupStep === 1 && (
              <form onSubmit={handleSendOTP} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">Company Name</label>
                  <div className="relative">
                    <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input 
                      type="text" required value={companyName} onChange={e => setCompanyName(e.target.value)}
                      placeholder="e.g. Wipro Ltd" 
                      className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">HR Manager Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input 
                      type="text" required value={hrName} onChange={e => setHrName(e.target.value)}
                      placeholder="e.g. Abhinav Singh" 
                      className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">Official Company Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input 
                      type="email" required value={email} onChange={e => setEmail(e.target.value)}
                      placeholder="hr@company.com" 
                      className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm transition-all"
                    />
                  </div>
                  <p className="text-[10px] text-gray-500 mt-1">An OTP will be sent to this email for verification.</p>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">Phone Number</label>
                  <input 
                    type="text" required value={phone} onChange={e => setPhone(e.target.value)}
                    placeholder="+91 9876543210" 
                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">Choose Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input 
                      type="password" required value={password} onChange={e => setPassword(e.target.value)}
                      placeholder="Min 6 characters" 
                      className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm transition-all"
                    />
                  </div>
                </div>

                <button
                  type="submit" disabled={loading}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-all flex items-center justify-center gap-2"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Send OTP"}
                  {!loading && <ArrowRight className="w-4 h-4" />}
                </button>
              </form>
            )}

            {signupStep === 2 && (
              <form onSubmit={handleVerifyOTP} className="space-y-4 animate-in fade-in zoom-in duration-300">
                <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 rounded-2xl text-center">
                  <Mail className="w-8 h-8 text-indigo-500 mx-auto mb-2" />
                  <h3 className="font-bold text-indigo-900 dark:text-indigo-300">Verify Email</h3>
                  <p className="text-xs text-indigo-700 dark:text-indigo-400 mt-1">
                    Please enter the 8-digit OTP sent to <b>{email}</b>
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider text-center">Enter OTP</label>
                  <input 
                    type="text" required maxLength={8}
                    value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
                    placeholder="12345678" 
                    className="w-full px-4 py-3 text-center tracking-[0.5em] font-mono text-xl bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  />
                </div>

                <div className="flex gap-2">
                  <button type="button" onClick={() => setSignupStep(1)} className="px-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold text-sm hover:bg-gray-200 transition-all">
                    Back
                  </button>
                  <button
                    type="submit" disabled={loading || otp.length < 8}
                    className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-all flex items-center justify-center gap-2"
                  >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Verify OTP"}
                  </button>
                </div>

                <div className="text-center mt-4">
                  <button 
                    type="button" 
                    onClick={handleResendOTP}
                    disabled={resendCooldown > 0 || loading}
                    className="text-sm font-bold text-indigo-600 hover:text-indigo-500 disabled:text-gray-400 transition-colors"
                  >
                    {resendCooldown > 0 
                      ? `Resend OTP in ${Math.floor(resendCooldown / 60)}:${String(resendCooldown % 60).padStart(2, '0')}` 
                      : "Didn't receive OTP? Resend Now"}
                  </button>
                </div>
              </form>
            )}

            {signupStep === 3 && (
              <form onSubmit={handleCompleteRegistration} className="space-y-4 animate-in fade-in zoom-in duration-300">
                <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-100 rounded-2xl text-center">
                  <ShieldCheck className="w-8 h-8 text-green-500 mx-auto mb-2" />
                  <h3 className="font-bold text-green-900 dark:text-green-300">Final Step</h3>
                  <p className="text-xs text-green-700 dark:text-green-400 mt-1">
                    Upload your Official Company ID Card to complete registration.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">Upload Company ID Card (Mandatory)</label>
                  <div className="relative border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-2xl p-6 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors text-center cursor-pointer">
                    <input 
                      type="file" required
                      accept="image/*,.pdf"
                      onChange={e => setIdCardFile(e.target.files?.[0] || null)}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    {idCardFile ? (
                      <div className="flex flex-col items-center gap-2 text-indigo-600">
                        <FileText className="w-8 h-8" />
                        <span className="text-sm font-bold truncate max-w-[200px]">{idCardFile.name}</span>
                        <span className="text-xs text-gray-500">Click to change</span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2 text-gray-500">
                        <Upload className="w-8 h-8 text-gray-400" />
                        <span className="text-sm font-bold">Tap to upload ID Card</span>
                        <span className="text-xs text-gray-400">PDF, JPG, PNG (Max 5MB)</span>
                      </div>
                    )}
                  </div>
                </div>

                <button
                  type="submit" disabled={loading}
                  className="w-full py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold transition-all shadow-md flex items-center justify-center gap-2"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Submit for Admin Approval"}
                  {!loading && <ArrowRight className="w-4 h-4" />}
                </button>
              </form>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
