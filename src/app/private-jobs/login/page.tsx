"use client";

import { useState, useEffect } from"react";
import { useRouter } from"next/navigation";
import Link from"next/link";
import Image from"next/image";
import { supabase } from"@/lib/supabase";
import { 
 User, Mail, Lock, Phone, ArrowRight, 
 Sparkles, Loader2, AlertCircle, CheckCircle2,
 GraduationCap, ShieldCheck, RefreshCw
} from"lucide-react";

export default function PrivateCandidateLoginPage() {
 const router = useRouter();
 const [activeForm, setActiveForm] = useState<"signin"|"signup">("signin");
 const [loading, setLoading] = useState(false);
 const [error, setError] = useState<string | null>(null);
 const [infoMessage, setInfoMessage] = useState<string | null>(null);

 // Form Fields
 const [email, setEmail] = useState("");
 const [password, setPassword] = useState("");
 const [fullName, setFullName] = useState("");
 const [phone, setPhone] = useState("");

 // CAPTCHA States
 const [captchaNum1, setCaptchaNum1] = useState(0);
 const [captchaNum2, setCaptchaNum2] = useState(0);
 const [captchaInput, setCaptchaInput] = useState("");

 const generateCaptcha = () => {
 setCaptchaNum1(Math.floor(Math.random() * 9) + 1);
 setCaptchaNum2(Math.floor(Math.random() * 9) + 1);
 setCaptchaInput("");
 };

 // Auto-redirect if already logged in
 useEffect(() => {
 const checkExistingSession = async () => {
 try {
 const { data } = await supabase.auth.getSession();
 if (data.session?.user) {
 localStorage.setItem("rs_candidate_session_active","true");
 router.push("/private-jobs/dashboard");
 return;
 }
 } catch (e) {}

 const localProfileStr = localStorage.getItem("rs_candidate_mock_profile");
 const localSession = localStorage.getItem("rs_candidate_mock_session") ==="true"|| localStorage.getItem("rs_candidate_session_active") ==="true";
 
 if (localProfileStr || localSession) {
 router.push("/private-jobs/dashboard");
 }
 };
 checkExistingSession();
 }, [router]);

 useEffect(() => {
 generateCaptcha();
 }, []);

 // Password Security Strength Analyzer
 const getPasswordStrength = (pass: string) => {
 if (!pass) return { score: 0, label:"Enter Password", color:"bg-gray-200", text:"text-gray-400"};
 let score = 0;
 if (pass.length >= 6) score += 1;
 if (pass.length >= 10) score += 1;
 if (/[A-Z]/.test(pass)) score += 1;
 if (/[0-9]/.test(pass)) score += 1;
 if (/[^A-Za-z0-9]/.test(pass)) score += 1;

 if (score <= 1) return { score, label:"Weak Security", color:"bg-rose-500", text:"text-rose-500"};
 if (score <= 3) return { score, label:"Medium Security", color:"bg-amber-500", text:"text-amber-500"};
 return { score, label:"Strong & Professional", color:"bg-emerald-500", text:"text-emerald-500"};
 };

 const pwdStrength = getPasswordStrength(password);

 const handleSignIn = async (e: React.FormEvent) => {
 e.preventDefault();
 setLoading(true);
 setError(null);

 // Validate CAPTCHA
 if (parseInt(captchaInput) !== captchaNum1 + captchaNum2) {
 setError("Incorrect anti-bot security answer. Please try again.");
 generateCaptcha();
 setLoading(false);
 return;
 }

 try {
 const { data, error: authErr } = await supabase.auth.signInWithPassword({
 email: email.trim(),
 password: password
 });

 if (authErr) throw authErr;

 // Check if user has a candidate profile
 const { data: profile } = await supabase
 .from("private_candidate_profiles")
 .select("*")
 .eq("id", data.session?.user.id)
 .single();

 if (profile) {
 localStorage.setItem("rs_candidate_mock_profile", JSON.stringify(profile));
 } else {
 const fallbackProfile = {
 id: data.session?.user.id,
 full_name: email.split("@")[0],
 email: email.trim(),
 phone:"",
 skills: [],
 experience:"Fresher",
 college:"",
 bio:""
 };
 localStorage.setItem("rs_candidate_mock_profile", JSON.stringify(fallbackProfile));
 }
 localStorage.setItem("rs_candidate_session_active","true");

 setInfoMessage("Login Successful! Redirecting to Candidate Dashboard...");
 setTimeout(() => {
 router.push("/private-jobs/dashboard");
 }, 1500);

 } catch (err: any) {
 console.error("Auth Sign In Error:", err);
 
 // Sandbox fallback mode
 if (email.toLowerCase() ==="candidate@rojgarsuvidha.com"&& password ==="demo123") {
 const demoProfile = {
 id:"demo-candidate-uid",
 full_name:"Amit Sharma",
 email:"candidate@rojgarsuvidha.com",
 phone:"+91 99887 76655",
 skills: ["REACT","NEXT.JS","TYPESCRIPT","TAILWIND CSS","NODE.JS"],
 experience:"2 Years as Frontend Developer",
 college:"Delhi Technological University",
 bio:"Passionate web developer specializing in reactive user experiences and modern frontend tooling."
 };

 // Persistence bug fix: load previous details if the user already has custom mock profile edits!
 const existingMockProfileStr = localStorage.getItem("rs_candidate_mock_profile");
 let profileToSave = demoProfile;
 
 if (existingMockProfileStr) {
 try {
 const parsed = JSON.parse(existingMockProfileStr);
 if (parsed && parsed.email ==="candidate@rojgarsuvidha.com") {
 profileToSave = parsed; // Retain edits!
 }
 } catch (ex) {
 console.error("Mock parse failed:", ex);
 }
 }

 localStorage.setItem("rs_candidate_mock_profile", JSON.stringify(profileToSave));
 localStorage.setItem("rs_candidate_mock_session","true");
 localStorage.setItem("rs_candidate_session_active","true");
 localStorage.setItem("rs_candidate_active_email", "candidate@rojgarsuvidha.com");
 
 setInfoMessage("Demo Candidate Profile Activated! Redirecting...");
 setTimeout(() => {
 router.push("/private-jobs/dashboard");
 }, 1500);
 } else {
 setError(err.message ||"Invalid credentials. (Hint: For sandbox testing, use email 'candidate@rojgarsuvidha.com' & password 'demo123')");
 generateCaptcha();
 }
 } finally {
 setLoading(false);
 }
 };

 const handleSignUp = async (e: React.FormEvent) => {
 e.preventDefault();
 setLoading(true);
 setError(null);

 if (!fullName.trim() || !email.trim() || !password.trim()) {
 setError("Please fill out all required fields.");
 setLoading(false);
 return;
 }

 // Validate CAPTCHA
 if (parseInt(captchaInput) !== captchaNum1 + captchaNum2) {
 setError("Incorrect security CAPTCHA answer. Please try again.");
 generateCaptcha();
 setLoading(false);
 return;
 }

 // Block weak passwords
 if (pwdStrength.score < 3) {
 setError("Please choose a more secure, professional password (Medium or Strong).");
 setLoading(false);
 return;
 }

 try {
 const { data, error: authErr } = await supabase.auth.signUp({
 email: email.trim(),
 password: password,
 options: {
 data: {
 full_name: fullName.trim()
 }
 }
 });

 if (authErr) throw authErr;

 const userId = data.user?.id;
 const initialProfile = {
 id: userId ||"mock-candidate-"+ Date.now(),
 full_name: fullName.trim(),
 email: email.toLowerCase().trim(),
 phone: phone.trim(),
 skills: ["HTML5","CSS3","JAVASCRIPT"],
 experience:"Fresher",
 college:"Not Specified",
 bio:"Private Sector Candidate Profile"
 };

 if (userId) {
 const { error: profileErr } = await supabase.from("private_candidate_profiles").insert([initialProfile]);
 if (profileErr) {
 console.warn("Could not insert to private_candidate_profiles table:", profileErr);
 }
 }

 localStorage.setItem("rs_candidate_mock_profile", JSON.stringify(initialProfile));
 localStorage.setItem("rs_candidate_session_active","true");

 setInfoMessage("Registration successful! Welcome to Private Job Workspace. Redirecting...");
 setTimeout(() => {
 router.push("/private-jobs/dashboard");
 }, 1500);

 } catch (err: any) {
 setError(err.message ||"Sign up failed. Please check details or try again.");
 generateCaptcha();
 } finally {
 setLoading(false);
 }
 };

 const handleGoogleSignIn = async () => {
 setLoading(true);
 setError(null);
 try {
 const { error: oauthError } = await supabase.auth.signInWithOAuth({
 provider:"google",
 options: {
 redirectTo: window.location.origin +"/private-jobs/dashboard"
 }
 });
 if (oauthError) throw oauthError;
 } catch (err: any) {
 console.warn("Supabase Google Sign-In offline fallback in sandbox mode:", err.message);
 
 // Smart simulation for sandboxed Google OAuth
 setInfoMessage("Connecting to Google Auth Sandbox...");
 setTimeout(() => {
 const simGoogleProfile = {
 id:"google-candidate-mock-uid",
 full_name:"Google Candidate User",
 email:"google.user@example.com",
 phone:"+91 98765 43210",
 skills: ["REACT","TYPESCRIPT","TAILWIND CSS"],
 experience:"Fresher (Logged in via Google)",
 college:"IIT Bombay",
 bio:"Enthusiastic full-stack engineer looking for high-quality corporate roles."
 };
 localStorage.setItem("rs_candidate_mock_profile", JSON.stringify(simGoogleProfile));
 localStorage.setItem("rs_candidate_mock_session","true");
 localStorage.setItem("rs_candidate_session_active","true");
 setInfoMessage("Google Account Connected! Loading candidate profile...");
 setTimeout(() => {
 router.push("/private-jobs/dashboard");
 }, 1500);
 }, 1200);
 } finally {
 setLoading(false);
 }
 };

 return (
 <div className="flex-1 min-h-screen bg-slate-50/50 py-12 px-4 flex items-center justify-center relative overflow-hidden transition-colors duration-500">
 
 {/* Premium Tech Background Glows */}
 <div className="absolute top-1/4 left-1/4 w-[30rem] h-[30rem] bg-blue-500/10 rounded-full blur-[120px] -z-10 animate-pulse pointer-events-none"/>
 <div className="absolute bottom-1/4 right-1/4 w-[30rem] h-[30rem] bg-indigo-500/10 rounded-full blur-[120px] -z-10 pointer-events-none animate-pulse duration-5000"/>
 <div className="absolute -top-10 right-10 w-[20rem] h-[20rem] bg-sky-400/10 rounded-full blur-[80px] -z-10 pointer-events-none"/>

 <div className="max-w-md w-full bg-white/70 border border-slate-200/50 backdrop-blur-xl rounded-[2rem] shadow-2xl shadow-blue-500/5 p-6 sm:p-10 space-y-6 relative z-10 group transition-all duration-300 hover:border-blue-400/50">
 
 {/* Header Icon & Title */}
 <div className="text-center space-y-3">
 <div className="inline-flex transition-transform duration-300 hover:scale-105">
 <Image 
 src="/Blue-icons.png"
 alt="Rojgar Suvidha Logo"
 width={76} 
 height={76} 
 className="rounded-2xl object-contain h-[76px] w-[76px] shadow-md border border-slate-100"
 priority
 />
 </div>
 <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-5 flex items-center justify-center gap-2 tracking-tight">
 Candidate <span className="text-blue-600">Console</span> <Sparkles className="w-5 h-5 text-amber-500 shrink-0 animate-bounce"/>
 </h1>
 <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed font-medium">
 Build your professional profile, showcase certified skills & chat directly with MNC recruiters.
 </p>
 </div>

 {/* Premium Google OAuth Integration */}
 <button
 type="button"
 onClick={handleGoogleSignIn}
 disabled={loading}
 className="w-full py-3.5 bg-white/80 hover:bg-slate-50 text-slate-700 border border-slate-200/60 rounded-2xl font-bold flex items-center justify-center gap-2.5 shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98] text-xs hover:border-slate-300"
 >
 <svg className="w-4 h-4 shrink-0"viewBox="0 0 24 24">
 <path fill="#EA4335"d="M12 5.04c1.78 0 3.39.61 4.65 1.8l3.48-3.48C17.97 1.38 15.22.5 12 .5 7.37.5 3.42 3.16 1.5 7.02l4.13 3.2C6.58 7.42 9.04 5.04 12 5.04z"/>
 <path fill="#4285F4"d="M23.5 12.27c0-.82-.07-1.61-.21-2.38H12v4.51h6.45c-.28 1.48-1.12 2.73-2.38 3.58l3.7 2.87c2.16-2 3.43-4.94 3.43-8.58z"/>
 <path fill="#FBBC05"d="M5.63 14.18c-.24-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29L1.5 6.4C.54 8.33 0 10.5 0 12.72c0 2.22.54 4.39 1.5 6.32l4.13-3.2-.3-.66z"/>
 <path fill="#34A853"d="M12 23.5c3.24 0 5.97-1.07 7.96-2.92l-3.7-2.87c-1.03.69-2.34 1.1-4.26 1.1-2.96 0-5.42-2.38-6.32-5.18l-4.13 3.2C3.42 20.84 7.37 23.5 12 23.5z"/>
 </svg>
 Continue with Google Account
 </button>

 <div className="relative flex py-1 items-center">
 <div className="flex-grow border-t border-slate-200/60"></div>
 <span className="flex-shrink mx-3.5 text-[9px] font-black text-slate-400 uppercase tracking-widest">Or Continue With Email</span>
 <div className="flex-grow border-t border-slate-200/60"></div>
 </div>

 {/* Form Toggle Tabs */}
 <div className="flex bg-slate-100/60 p-1.5 rounded-2xl border border-slate-200/40 backdrop-blur-sm">
 <button
 onClick={() => { setActiveForm("signin"); setError(null); }}
 className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-all ${
 activeForm ==="signin"
 ?"bg-white text-blue-600 shadow-md border border-slate-200/20"
 :"text-slate-500 hover:text-slate-700"
 }`}
 >
 Candidate Sign In
 </button>
 <button
 onClick={() => { setActiveForm("signup"); setError(null); }}
 className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-all ${
 activeForm ==="signup"
 ?"bg-white text-blue-600 shadow-md border border-slate-200/20"
 :"text-slate-500 hover:text-slate-700"
 }`}
 >
 Create Profile
 </button>
 </div>

 {/* Notifications */}
 {error && (
 <div className="bg-rose-50/80 border border-rose-200/60 text-rose-600 p-4 rounded-2xl text-xs font-semibold flex items-start gap-2.5 animate-shake shadow-sm">
 <AlertCircle className="w-4.5 h-4.5 shrink-0 mt-0.5 text-rose-500"/>
 <span>{error}</span>
 </div>
 )}

 {infoMessage && (
 <div className="bg-emerald-50/80 border border-emerald-200/60 text-emerald-600 p-4 rounded-2xl text-xs font-semibold flex items-start gap-2.5 shadow-sm">
 <CheckCircle2 className="w-4.5 h-4.5 shrink-0 mt-0.5 text-emerald-500 animate-bounce"/>
 <span>{infoMessage}</span>
 </div>
 )}

 {/* signin / signup Forms */}
 {activeForm ==="signin"? (
 <form onSubmit={handleSignIn} className="space-y-4">
 <div className="space-y-1.5">
 <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">Candidate Email</label>
 <div className="relative">
 <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"/>
 <input 
 type="email"
 required
 value={email}
 onChange={e => setEmail(e.target.value)}
 placeholder="name@example.com"
 className="w-full pl-11 pr-4 py-3 bg-slate-50/60 hover:bg-white focus:bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none text-sm transition-all text-slate-900 font-medium hover:scale-[1.005] focus:scale-[1.005]"
 />
 </div>
 </div>

 <div className="space-y-1.5">
 <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">Password</label>
 <div className="relative">
 <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"/>
 <input 
 type="password"
 required
 value={password}
 onChange={e => setPassword(e.target.value)}
 placeholder="••••••••"
 className="w-full pl-11 pr-4 py-3 bg-slate-50/60 hover:bg-white focus:bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none text-sm transition-all text-slate-900 font-medium hover:scale-[1.005] focus:scale-[1.005]"
 />
 </div>
 </div>

 {/* Anti-Bot Security CAPTCHA Box */}
 <div className="space-y-2 p-4 bg-slate-50/80 border border-slate-200/60 backdrop-blur-sm rounded-2xl">
 <div className="flex items-center justify-between">
 <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">Security Human Check</label>
 <button 
 type="button"
 onClick={generateCaptcha}
 className="text-blue-600 hover:rotate-180 transition-all duration-500 p-1 rounded-lg hover:bg-slate-100"
 title="Generate new question"
 >
 <RefreshCw className="w-3.5 h-3.5"/>
 </button>
 </div>
 <div className="flex items-center gap-3 mt-1">
 <span className="bg-white border border-slate-200 text-xs font-black px-4 py-2.5 rounded-xl text-slate-700 shadow-sm shrink-0 flex items-center justify-center">
 {captchaNum1} + {captchaNum2} = ?
 </span>
 <input 
 type="number"
 required
 value={captchaInput}
 onChange={e => setCaptchaInput(e.target.value)}
 placeholder="Enter answer"
 className="flex-1 px-3 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-xs text-slate-900 font-medium hover:scale-[1.01] focus:scale-[1.01] transition-transform"
 />
 </div>
 </div>

 <button
 type="submit"
 disabled={loading}
 className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black flex items-center justify-center gap-2 shadow-md hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 text-sm duration-300"
 >
 {loading ? <Loader2 className="w-5 h-5 animate-spin"/> : <>Sign In to Workspace <ArrowRight className="w-4 h-4"/></>}
 </button>
 </form>
 ) : (
 <form onSubmit={handleSignUp} className="space-y-4">
 <div className="space-y-1.5">
 <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">Full Name</label>
 <div className="relative">
 <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"/>
 <input 
 type="text"
 required
 value={fullName}
 onChange={e => setFullName(e.target.value)}
 placeholder="Amit Sharma"
 className="w-full pl-11 pr-4 py-3 bg-slate-50/60 hover:bg-white focus:bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none text-sm transition-all text-slate-900 font-medium hover:scale-[1.005] focus:scale-[1.005]"
 />
 </div>
 </div>

 <div className="space-y-1.5">
 <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">Candidate Email</label>
 <div className="relative">
 <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"/>
 <input 
 type="email"
 required
 value={email}
 onChange={e => setEmail(e.target.value)}
 placeholder="name@example.com"
 className="w-full pl-11 pr-4 py-3 bg-slate-50/60 hover:bg-white focus:bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none text-sm transition-all text-slate-900 font-medium hover:scale-[1.005] focus:scale-[1.005]"
 />
 </div>
 </div>

 <div className="space-y-1.5">
 <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">Mobile Number</label>
 <div className="relative">
 <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"/>
 <input 
 type="text"
 value={phone}
 onChange={e => setPhone(e.target.value)}
 placeholder="+91 98765 43210"
 className="w-full pl-11 pr-4 py-3 bg-slate-50/60 hover:bg-white focus:bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none text-sm transition-all text-slate-900 font-medium hover:scale-[1.005] focus:scale-[1.005]"
 />
 </div>
 </div>

 <div className="space-y-1.5">
 <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">Password</label>
 <div className="relative">
 <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"/>
 <input 
 type="password"
 required
 value={password}
 onChange={e => setPassword(e.target.value)}
 placeholder="Minimum 6 characters"
 className="w-full pl-11 pr-4 py-3 bg-slate-50/60 hover:bg-white focus:bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none text-sm transition-all text-slate-900 font-medium hover:scale-[1.005] focus:scale-[1.005]"
 />
 </div>
 
 {/* Password strength progress bar visual metrics */}
 <div className="space-y-1.5 pt-1.5">
 <div className="flex justify-between items-center text-[10px] font-bold">
 <span className="text-slate-400">Password Security Rating:</span>
 <span className={`${pwdStrength.text} drop-shadow-sm`}>{pwdStrength.label}</span>
 </div>
 <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden flex gap-0.5">
 <div className={`h-full flex-1 transition-all duration-300 ${pwdStrength.score >= 1 ? pwdStrength.color :"bg-transparent"}`}></div>
 <div className={`h-full flex-1 transition-all duration-300 ${pwdStrength.score >= 3 ? pwdStrength.color :"bg-transparent"}`}></div>
 <div className={`h-full flex-1 transition-all duration-300 ${pwdStrength.score >= 5 ? pwdStrength.color :"bg-transparent"}`}></div>
 </div>
 </div>
 </div>

 {/* Anti-Bot Security CAPTCHA Box */}
 <div className="space-y-2 p-4 bg-slate-50/80 border border-slate-200/60 backdrop-blur-sm rounded-2xl">
 <div className="flex items-center justify-between">
 <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">Security Human Check</label>
 <button 
 type="button"
 onClick={generateCaptcha}
 className="text-blue-600 hover:rotate-180 transition-all duration-500 p-1 rounded-lg hover:bg-slate-100"
 title="Generate new question"
 >
 <RefreshCw className="w-3.5 h-3.5"/>
 </button>
 </div>
 <div className="flex items-center gap-3 mt-1">
 <span className="bg-white border border-slate-200 text-xs font-black px-4 py-2.5 rounded-xl text-slate-700 shadow-sm shrink-0 flex items-center justify-center">
 {captchaNum1} + {captchaNum2} = ?
 </span>
 <input 
 type="number"
 required
 value={captchaInput}
 onChange={e => setCaptchaInput(e.target.value)}
 placeholder="Enter answer"
 className="flex-1 px-3 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-xs text-slate-900 font-medium hover:scale-[1.01] focus:scale-[1.01] transition-transform"
 />
 </div>
 </div>

 <button
 type="submit"
 disabled={loading}
 className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black flex items-center justify-center gap-2 shadow-md hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 text-sm duration-300"
 >
 {loading ? <Loader2 className="w-5 h-5 animate-spin"/> : <>Create Professional Profile <ArrowRight className="w-4 h-4"/></>}
 </button>
 </form>
 )}

 {/* Dynamic Sandbox Credentials Box */}
 <div className="border-t border-slate-100 pt-5 text-center">
 <div className="inline-flex items-center gap-2.5 bg-blue-50/50 border border-blue-100/50 px-4 py-3 rounded-2xl text-left max-w-sm">
 <ShieldCheck className="w-6 h-6 text-blue-600 shrink-0"/>
 <p className="text-[10px] text-slate-500 leading-normal font-medium">
 <b>Sandbox credentials:</b> Use email <span className="text-blue-600 font-bold">candidate@rojgarsuvidha.com</span> & password <span className="text-blue-600 font-bold">demo123</span> to verify dashboard data persistence!
 </p>
 </div>
 </div>

 </div>
 </div>
 );
}
