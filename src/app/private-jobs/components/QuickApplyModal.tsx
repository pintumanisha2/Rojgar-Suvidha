"use client";

import { useState, useEffect } from"react";
import { supabase } from"@/lib/supabase";
import {
 X, Send, CheckCircle2, User, Mail, Phone,
 FileText, Briefcase, Building, MapPin, DollarSign, Loader2
} from"lucide-react";

interface Props {
 job: {
 id: string;
 title: string;
 company: string;
 location: string;
 salary: string;
 source_site?: string;
 };
 onClose: () => void;
}

export default function QuickApplyModal({ job, onClose }: Props) {
 const [name, setName] = useState("");
 const [email, setEmail] = useState("");
 const [phone, setPhone] = useState("");
 const [coverNote, setCoverNote] = useState("");
 const [resumeUrl, setResumeUrl] = useState("");
 const [submitting, setSubmitting] = useState(false);
 const [success, setSuccess] = useState(false);
 const [savedOffline, setSavedOffline] = useState(false); // DB fail, offline mein save hua
 const [error, setError] = useState<string | null>(null);
 const [candidateId, setCandidateId] = useState<string | null>(null);

 // Screener selections
 const [joiningTimeline, setJoiningTimeline] = useState("Immediately");
 const [expectedSalary, setExpectedSalary] = useState("₹15k – ₹25k");

 // Prefill details on mount (Supabase or local storage memory fallback)
 useEffect(() => {
 async function loadPrefillDetails() {
 try {
 const { data: { session } } = await supabase.auth.getSession();
 if (session) {
 setCandidateId(session.user.id);
 const { data: dbProfile } = await supabase
 .from("private_candidate_profiles")
 .select("full_name, email, phone, resume_url")
 .eq("user_id", session.user.id)
 .maybeSingle();

 if (dbProfile) {
 if (dbProfile.full_name) setName(dbProfile.full_name);
 if (dbProfile.email) setEmail(dbProfile.email);
 if (dbProfile.phone) setPhone(dbProfile.phone);
 if (dbProfile.resume_url) setResumeUrl(dbProfile.resume_url);
 return;
 }
 }

 // Local Storage memory fallback
 const saved = localStorage.getItem("rs_last_apply_details");
 if (saved) {
 const parsed = JSON.parse(saved);
 if (parsed.name) setName(parsed.name);
 if (parsed.email) setEmail(parsed.email);
 if (parsed.phone) setPhone(parsed.phone);
 if (parsed.resumeUrl) setResumeUrl(parsed.resumeUrl);
 if (parsed.joiningTimeline) setJoiningTimeline(parsed.joiningTimeline);
 if (parsed.expectedSalary) setExpectedSalary(parsed.expectedSalary);
 }
 } catch (err) {
 console.error("Error prefilling application details:", err);
 }
 }
 loadPrefillDetails();
 }, []);

 const handleSubmit = async (e: React.FormEvent) => {
 e.preventDefault();
 if (!name || !email || !phone) {
 setError("Please fill in your Name, Email, and Phone number.");
 return;
 }
 setError(null);
 setSubmitting(true);

 const fullCoverNote =`[Screener] Joining: ${joiningTimeline} | Salary: ${expectedSalary}\n\n${coverNote.trim()}`;

 const payload = {
 job_id: job.id,
 job_title: job.title,
 company_name: job.company,
 applicant_name: name.trim(),
 applicant_email: email.trim(),
 applicant_phone: phone.trim(),
 cover_note: fullCoverNote,
 resume_url: resumeUrl.trim() || null,
 status:"new",
 candidate_id: candidateId,
 created_at: new Date().toISOString(),
 };

 // Hamesha local storage mein details save karo (prefill ke liye)
 localStorage.setItem("rs_last_apply_details", JSON.stringify({
 name: name.trim(),
 email: email.trim(),
 phone: phone.trim(),
 resumeUrl: resumeUrl.trim(),
 joiningTimeline,
 expectedSalary
 }));

 try {
 // Supabase mein save karo
 const { error: dbErr } = await supabase.from("private_job_applications_internal").insert([payload]);
 if (dbErr) throw dbErr;

 // DB save successful — proper success screen dikhao
 setSubmitting(false);
 setSuccess(true);
 } catch (err: any) {
 // DB fail hua — offline fallback mein save karo aur user ko clearly batao
 console.warn("DB save failed, saving to offline localStorage fallback:", err);
 const existing = JSON.parse(localStorage.getItem("rs_internal_applications") || "[]");
 localStorage.setItem("rs_internal_applications", JSON.stringify([...existing, payload]));

 setSubmitting(false);
 // Alag state set karo — offline saved, proper success nahi
 setSavedOffline(true);
 }
 };

 return (
 <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"onClick={onClose}>
 <div
 className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto border border-slate-200"
 onClick={e => e.stopPropagation()}
 >
 {/* Header */}
 <div className="bg-blue-600 p-6 rounded-t-3xl relative">
 <button onClick={onClose} className="absolute top-4 right-4 bg-white/20 hover:bg-white/30 p-1.5 rounded-full text-white transition-colors">
 <X className="w-4 h-4"/>
 </button>
 <div className="flex items-center gap-3 mb-2">
 <div className="p-2.5 bg-white/20 rounded-xl">
 <Briefcase className="w-5 h-5 text-white"/>
 </div>
 <div>
 <h2 className="text-lg font-extrabold text-white leading-tight">{job.title}</h2>
 <p className="text-blue-100 text-xs font-medium flex items-center gap-2 mt-0.5">
 <Building className="w-3 h-3"/> {job.company}
 <MapPin className="w-3 h-3 ml-1"/> {job.location}
 </p>
 </div>
 </div>
 {job.salary && (
 <div className="inline-flex items-center gap-1 bg-white/15 rounded-full px-3 py-1 text-xs font-bold text-white mt-1">
 <DollarSign className="w-3 h-3"/> {job.salary}
 </div>
 )}
 </div>

 {success ? (
 // ── Success Screen ────────────────────────────────────────────────
 <div className="p-8 flex flex-col items-center text-center gap-4">
 <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center">
 <CheckCircle2 className="w-10 h-10 text-emerald-500"/>
 </div>
 <div>
 <h3 className="text-xl font-extrabold text-slate-900">Application Submitted!</h3>
 <p className="text-slate-500 text-sm mt-2 font-medium">
 Your profile has been received by <strong>Rojgar Suvidha</strong>. Our team will review your application and get in touch with you shortly via email or phone.
 </p>
 </div>
 <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 w-full text-left">
 <p className="text-xs font-black text-blue-700 uppercase tracking-wide mb-2">What happens next?</p>
 <ul className="text-xs text-slate-600 space-y-1.5 font-medium">
 <li>✅ Our team reviews your profile within 24–48 hours</li>
 <li>📞 We'll call you for a quick 10-min pre-screening</li>
 <li>📧 Job details &amp; interview schedule sent to your email</li>
 </ul>
 </div>
 <button onClick={onClose} className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-xl transition-colors">
 Done
 </button>
 </div>
 ) : savedOffline ? (
 // ── Offline Save Screen (DB fail hua, locally save hua) ──────────
 <div className="p-8 flex flex-col items-center text-center gap-4">
 <div className="w-20 h-20 rounded-full bg-amber-100 flex items-center justify-center">
 <svg className="w-10 h-10 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
 </svg>
 </div>
 <div>
 <h3 className="text-xl font-extrabold text-slate-900">Saved — Pending Sync</h3>
 <p className="text-slate-500 text-sm mt-2 font-medium">
 Network issue detected. Your application details have been <strong>saved locally</strong> on your device. It will be automatically submitted once connection is restored.
 </p>
 </div>
 <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 w-full text-left">
 <p className="text-xs font-black text-amber-700 uppercase tracking-wide mb-2">What to do?</p>
 <ul className="text-xs text-slate-600 space-y-1.5 font-medium">
 <li>📶 Check your internet connection</li>
 <li>🔄 Retry applying once connected</li>
 <li>📞 Or call us directly at our helpline</li>
 </ul>
 </div>
 <button onClick={onClose} className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-white font-extrabold rounded-xl transition-colors">
 Okay, Got It
 </button>
 </div>
 ) : (
 // ── Application Form ──────────────────────────────────────────────
 <form onSubmit={handleSubmit} className="p-6 space-y-4">
 <p className="text-sm text-slate-600 font-medium bg-slate-50 rounded-xl p-3">
 🔒 Your details go directly to <strong>Rojgar Suvidha's</strong> recruitment team — not shared without your consent.
 </p>

 {error && (
 <div className="text-sm text-rose-600 bg-rose-50 border border-rose-200 rounded-xl px-4 py-3 font-medium">
 {error}
 </div>
 )}

 {/* Name */}
 <div className="space-y-1.5">
 <label className="text-xs font-black text-slate-600 uppercase tracking-wider">Full Name *</label>
 <div className="relative">
 <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-blue-500">
 <User className="w-4 h-4"/>
 </div>
 <input
 required type="text"value={name} onChange={e => setName(e.target.value)}
 placeholder="e.g. Pintu Kumar"
 className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
 />
 </div>
 </div>

 {/* Email + Phone */}
 <div className="grid grid-cols-2 gap-3">
 <div className="space-y-1.5">
 <label className="text-xs font-black text-slate-600 uppercase tracking-wider">Email *</label>
 <div className="relative">
 <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-blue-500">
 <Mail className="w-4 h-4"/>
 </div>
 <input
 required type="email"value={email} onChange={e => setEmail(e.target.value)}
 placeholder="you@email.com"
 className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
 />
 </div>
 </div>
 <div className="space-y-1.5">
 <label className="text-xs font-black text-slate-600 uppercase tracking-wider">Phone *</label>
 <div className="relative">
 <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-blue-500">
 <Phone className="w-4 h-4"/>
 </div>
 <input
 required type="tel"value={phone} onChange={e => setPhone(e.target.value)}
 placeholder="+91 9876..."
 className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
 />
 </div>
 </div>
 </div>

 {/* Resume URL (optional) */}
 <div className="space-y-1.5">
 <label className="text-xs font-black text-slate-600 uppercase tracking-wider">Resume Link (Optional — Google Drive / Cloudinary)</label>
 <div className="relative">
 <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-blue-500">
 <FileText className="w-4 h-4"/>
 </div>
 <input
 type="url"value={resumeUrl} onChange={e => setResumeUrl(e.target.value)}
 placeholder="https://drive.google.com/..."
 className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
 />
 </div>
 </div>

 {/* Screening Questions (Side by Side Selects) */}
 <div className="grid grid-cols-2 gap-3">
 <div className="space-y-1.5">
 <label className="text-xs font-black text-slate-600 uppercase tracking-wider">Joining Timeline *</label>
 <select
 required
 value={joiningTimeline}
 onChange={e => setJoiningTimeline(e.target.value)}
 className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer"
 >
 <option value="Immediately">Immediately</option>
 <option value="Within 15 Days">Within 15 Days</option>
 <option value="Within 30 Days">Within 30 Days</option>
 <option value="After 30 Days">After 30 Days</option>
 </select>
 </div>
 <div className="space-y-1.5">
 <label className="text-xs font-black text-slate-600 uppercase tracking-wider">Expected Salary (Monthly) *</label>
 <select
 required
 value={expectedSalary}
 onChange={e => setExpectedSalary(e.target.value)}
 className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer"
 >
 <option value="Under ₹15k">Under ₹15k</option>
 <option value="₹15k – ₹25k">₹15k – ₹25k</option>
 <option value="₹25k – ₹40k">₹25k – ₹40k</option>
 <option value="Above ₹40k">Above ₹40k</option>
 </select>
 </div>
 </div>

 {/* Cover Note */}
 <div className="space-y-1.5">
 <label className="text-xs font-black text-slate-600 uppercase tracking-wider">Quick Note (Why are you a good fit?)</label>
 <textarea
 rows={3} value={coverNote} onChange={e => setCoverNote(e.target.value)}
 placeholder="Briefly describe your relevant experience and key skills..."
 className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none"
 />
 </div>

 <button
 type="submit"disabled={submitting}
 className="w-full flex items-center justify-center gap-2 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-xl transition-all shadow-lg shadow-blue-600/20 disabled:opacity-60"
 >
 {submitting ? <><Loader2 className="w-4 h-4 animate-spin"/> Submitting...</> : <><Send className="w-4 h-4"/> Submit Application — 1-Click Apply</>}
 </button>
 </form>
 )}
 </div>
 </div>
 );
}
