"use client";

import React, { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { 
  ClipboardCheck, Loader2, Download, Clock, CheckCircle2, 
  AlertCircle, RefreshCw, User, FileUp, Sparkles, HelpCircle,
  ShieldAlert, Lock
} from "lucide-react";
import imageCompression from "browser-image-compression";

const STATUS_STEPS = ["pending", "in_progress", "completed"];

const STATUS_CONFIG: Record<string, { label: string; desc: string; color: string; bg: string; icon: React.ReactNode }> = {
  pending:     { label: "Request Received",  desc: "Aapki request hume mil gayi. Hum jald kaam shuru karenge.", color: "text-amber-700",  bg: "bg-amber-100 dark:bg-amber-900/30",  icon: <Clock className="w-5 h-5" /> },
  in_progress: { label: "Form Filling",      desc: "Hum abhi aapka form fill kar rahe hain.",                 color: "text-blue-700",   bg: "bg-blue-100 dark:bg-blue-900/30",   icon: <RefreshCw className="w-5 h-5" /> },
  completed:   { label: "Completed! ✅",     desc: "Aapka form bhar diya gaya hai. Receipt download karein.", color: "text-green-700",  bg: "bg-green-100 dark:bg-green-900/30", icon: <CheckCircle2 className="w-5 h-5" /> },
  rejected:    { label: "Rejected",          desc: "Kisi wajah se request process nahi ho payi.",            color: "text-red-700",    bg: "bg-red-100 dark:bg-red-900/30",     icon: <AlertCircle className="w-5 h-5" /> },
};

export default function TrackApplicationPage() {
  const [user, setUser] = useState<any>(null);
  const [token, setToken] = useState("");
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [notLoggedIn, setNotLoggedIn] = useState(false);

  // For guest tracking by mobile
  const [mobileInput, setMobileInput] = useState("");
  const [guestResults, setGuestResults] = useState<any[] | null>(null);
  const [guestLoading, setGuestLoading] = useState(false);
  const [guestError, setGuestError] = useState<string | null>(null);

  // Live OTP Alert States
  const [otpAlert, setOtpAlert] = useState<any>(null);
  const [otpInput, setOtpInput] = useState("");
  const [otpSubmitting, setOtpSubmitting] = useState(false);
  const [otpSubmitted, setOtpSubmitted] = useState(false);
  const [otpSecondsLeft, setOtpSecondsLeft] = useState(0);
  const [chkSecret, setChkSecret] = useState(false);
  const [chkNotBank, setChkNotBank] = useState(false);
  const [chkNoScreenShare, setChkNoScreenShare] = useState(false);

  const lastNotifiedOtpId = useRef<string | null>(null);
  const lastNotifiedStatus = useRef<Record<string, string>>({});

  const playChimeSound = () => {
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = "sine";
      osc1.frequency.setValueAtTime(587.33, ctx.currentTime);
      gain1.gain.setValueAtTime(0.08, ctx.currentTime);
      gain1.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start();
      osc1.stop(ctx.currentTime + 0.25);

      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = "sine";
      osc2.frequency.setValueAtTime(880, ctx.currentTime + 0.12);
      gain2.gain.setValueAtTime(0.08, ctx.currentTime + 0.12);
      gain2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(ctx.currentTime + 0.12);
      osc2.stop(ctx.currentTime + 0.4);
    } catch (e) {
      console.error("Audio failed to play:", e);
    }
  };

  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  const fetchData = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      setNotLoggedIn(true);
      setLoading(false);
      return;
    }
    setUser(session.user);
    setToken(session.access_token);
    const { data } = await supabase
      .from("apply_for_me_requests")
      .select("*")
      .eq("user_id", session.user.id)
      .order("created_at", { ascending: false });
    setRequests(data || []);

    // Initialize notification ref to prevent initial page-load alerts
    if (data) {
      data.forEach((req: any) => {
        lastNotifiedStatus.current[req.id] = req.status;
      });
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Poll for live requests status changes (every 8 seconds)
  useEffect(() => {
    const pollRequestsStatus = async () => {
      try {
        let query = supabase
          .from("apply_for_me_requests")
          .select("*")
          .order("created_at", { ascending: false });

        if (user) {
          query = query.eq("user_id", user.id);
        } else if (guestResults && guestResults.length > 0) {
          query = query.eq("phone_number", mobileInput.replace(/\D/g, ""));
        } else {
          return;
        }

        const { data } = await query;

        if (data) {
          data.forEach((req: any) => {
            const prevStatus = lastNotifiedStatus.current[req.id];
            
            // Only trigger alert if status transitions from something else to "in_progress"
            if (req.status === "in_progress" && prevStatus !== "in_progress") {
              playChimeSound();
              if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
                new Notification("✍️ Form Filling Started!", {
                  body: `Aapke "${req.job_title}" form fill hona shuru ho gaya hai. Phone ready rakhein!`,
                  icon: "/logo-blue.png"
                });
              }
            }

            // Sync the ref
            lastNotifiedStatus.current[req.id] = req.status;
          });

          if (user) {
            setRequests(data);
          } else {
            setGuestResults(data);
          }
        }
      } catch (e) {
        console.error("Failed to poll requests status:", e);
      }
    };

    const poll = setInterval(pollRequestsStatus, 8000);
    return () => clearInterval(poll);
  }, [user, guestResults, mobileInput]);

  // Poll for live OTP requests (every 4 seconds)
  useEffect(() => {
    const checkOtp = async () => {
      let query = supabase
        .from("otp_requests")
        .select("*")
        .eq("status", "pending")
        .gt("expires_at", new Date().toISOString());

      if (user) {
        query = query.eq("user_id", user.id);
      } else if (guestResults && guestResults.length > 0) {
        const ids = guestResults.map(r => r.id);
        query = query.in("apply_request_id", ids);
      } else {
        setOtpAlert(null);
        return;
      }

      const { data } = await query
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (data) {
        setOtpAlert(data);
        const secsLeft = Math.max(0, Math.floor((new Date(data.expires_at).getTime() - Date.now()) / 1000));
        setOtpSecondsLeft(secsLeft);

        // Notify user about pending OTP request
        if (lastNotifiedOtpId.current !== data.id) {
          lastNotifiedOtpId.current = data.id;
          playChimeSound();
          if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
            new Notification("🔑 OTP Required - Rojgar Suvidha", {
              body: `Kripya live verification ke liye OTP enter karein. Secret trust code: ${data.verification_code || "None"}.`,
              icon: "/logo-blue.png"
            });
          }
        }
      } else {
        setOtpAlert(null);
        setChkSecret(false);
        setChkNotBank(false);
        setChkNoScreenShare(false);
      }
    };

    checkOtp();
    const poll = setInterval(checkOtp, 4000);
    return () => clearInterval(poll);
  }, [user, guestResults]);

  // OTP countdown timer
  useEffect(() => {
    if (!otpAlert || otpSecondsLeft <= 0) return;
    const t = setInterval(() => setOtpSecondsLeft(s => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, [otpAlert, otpSecondsLeft]);

  const handleSubmitOtp = async () => {
    if (!otpInput.trim() || !otpAlert) return;
    setOtpSubmitting(true);
    await supabase.from("otp_requests")
      .update({ otp_value: otpInput.trim(), status: "fulfilled" })
      .eq("id", otpAlert.id);
    setOtpSubmitting(false);
    setOtpSubmitted(true);
    setOtpAlert(null);
    setChkSecret(false);
    setChkNotBank(false);
    setChkNoScreenShare(false);
  };

  const handleGuestTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    setGuestLoading(true);
    setGuestError(null);
    setGuestResults(null);

    const { data, error } = await supabase
      .from("apply_for_me_requests")
      .select("*")
      .eq("phone_number", mobileInput.replace(/\D/g, ""))
      .order("created_at", { ascending: false });

    if (error || !data || data.length === 0) {
      setGuestError("Is mobile number par koi application nahi mili. Sahi number daalo.");
    } else {
      setGuestResults(data);
      // Initialize status notification ref to prevent initial page-load alerts for guest
      data.forEach((req: any) => {
        lastNotifiedStatus.current[req.id] = req.status;
      });
    }
    setGuestLoading(false);
  };

  const RequestCard = ({ req }: { req: any }) => {
    const [uploadingDoc, setUploadingDoc] = useState(false);
    const [selectedDocType, setSelectedDocType] = useState("photo");
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [uploadError, setUploadError] = useState<string | null>(null);
    const [uploadSuccess, setUploadSuccess] = useState(false);

    const cfg = STATUS_CONFIG[req.status] || STATUS_CONFIG.pending;

    const isCompleted = req.status === "completed";
    const isNeedsInfo = req.status === "needs_info";
    const isRefund = req.status === "refund_pending";
    const isRejected = req.status === "rejected";

    // Dynamic Step Completion
    const step1_done = true; // Received
    const step2_done = !!req.assigned_to || req.status === "in_progress" || isCompleted;
    const step3_done = req.status === "in_progress" || isCompleted;
    const step4_active = req.status === "in_progress" && !!req.verification_code;
    const step4_done = isCompleted;
    const step5_done = isCompleted;

    const currentStepIdx = isCompleted ? 5 : isNeedsInfo ? 2 : req.status === "in_progress" ? 3 : 1;

    const TIMELINE_STEPS = [
      { id: 1, label: "Request Received", desc: "Payment successfully verified.", done: step1_done, active: currentStepIdx === 1, icon: "📥" },
      { id: 2, label: "Expert Assigned", desc: req.assigned_to ? `Assigned to ${req.assigned_to.split('@')[0]}` : "Assigning best form-filling expert...", done: step2_done, active: currentStepIdx === 2, icon: "👤" },
      { id: 3, label: "Form Filling Started", desc: "Live form typing and data cross-check...", done: step3_done, active: currentStepIdx === 3, icon: "✍️" },
      { id: 4, label: "OTP Verification", desc: step4_active ? "Waiting for OTP input." : "Completed or not required.", done: step4_done, active: step4_active, icon: "🔑" },
      { id: 5, label: "Form Submitted 🎉", desc: "Official receipt uploaded and ready.", done: step5_done, active: currentStepIdx === 5, icon: "🏆" }
    ];

    const handleUpload = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!selectedFile) return;

      setUploadingDoc(true);
      setUploadError(null);
      setUploadSuccess(false);

      try {
        let fileToUpload = selectedFile;
        // Compression
        if (selectedFile.type.startsWith("image/")) {
          try {
            const options = {
              maxSizeMB: 0.18,
              maxWidthOrHeight: 1200,
              useWebWorker: true,
            };
            fileToUpload = await imageCompression(selectedFile, options);
          } catch (err) {
            console.error("Compression failed:", err);
          }
        }

        // Get PUT URL
        const uploadRes = await fetch("/api/locker/upload-url", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify({
            fileName: `${selectedDocType}_reuploaded_${Date.now()}.${selectedFile.name.split('.').pop()}`,
            contentType: fileToUpload.type
          })
        });

        const resData = await uploadRes.json();
        if (!uploadRes.ok) {
          throw new Error(resData.error || "Failed to get upload URL");
        }

        const { uploadUrl, key } = resData;

        // PUT to Backblaze B2
        const uploadFileRes = await fetch(uploadUrl, {
          method: "PUT",
          headers: { "Content-Type": fileToUpload.type },
          body: fileToUpload
        });

        if (!uploadFileRes.ok) {
          throw new Error("Failed to upload file to Backblaze");
        }

        const viewUrl = `/api/locker/view?key=${encodeURIComponent(key)}`;

        // Construct updated notes
        let updatedAdminNotes = req.admin_notes || "";
        const isESuvidha = req.job_title?.includes("[e-Suvidha]");

        if (isESuvidha) {
          if (updatedAdminNotes.includes("--- UPLOADED DOCUMENTS ---")) {
            const parts = updatedAdminNotes.split("--- UPLOADED DOCUMENTS ---");
            const extraDetails = parts[0];
            const documentsPart = parts[1].trim();

            const docLines = documentsPart.split('\n');
            let found = false;
            const newDocLines = docLines.map((line: string) => {
              const idx = line.indexOf(': ');
              if (idx !== -1) {
                const currentDocName = line.substring(0, idx).trim();
                if (currentDocName.toLowerCase() === selectedDocType.toLowerCase() || 
                    (selectedDocType === "photo" && currentDocName.toLowerCase().includes("photo")) ||
                    (selectedDocType === "signature" && currentDocName.toLowerCase().includes("signature")) ||
                    (selectedDocType === "aadhar" && currentDocName.toLowerCase().includes("aadhar")) ||
                    (selectedDocType === "marksheet_10" && currentDocName.toLowerCase().includes("10th")) ||
                    (selectedDocType === "marksheet_12" && currentDocName.toLowerCase().includes("12th"))) {
                  found = true;
                  return `${currentDocName}: ${viewUrl}`;
                }
              }
              return line;
            });

            if (!found) {
              newDocLines.push(`${selectedDocType}: ${viewUrl}`);
            }

            updatedAdminNotes = `${extraDetails}--- UPLOADED DOCUMENTS ---\n${newDocLines.join('\n')}`;
          } else {
            updatedAdminNotes += `\n\n--- E-SUVIDHA DETAILS ---\n--- UPLOADED DOCUMENTS ---\n${selectedDocType}: ${viewUrl}`;
          }
        } else {
          updatedAdminNotes = `[SYSTEM: Student re-uploaded "${selectedDocType}" document on ${new Date().toLocaleString("en-IN")}: ${viewUrl}]\n\n${updatedAdminNotes}`;
        }

        // Save status back to pending/paid so team is re-alerted
        const targetStatus = "pending";
        const { error: updateError } = await supabase
          .from("apply_for_me_requests")
          .update({
            admin_notes: updatedAdminNotes,
            status: targetStatus
          })
          .eq("id", req.id);

        if (updateError) throw updateError;

        setUploadSuccess(true);
        setSelectedFile(null);
        setTimeout(() => {
          fetchData();
        }, 1500);

      } catch (err: any) {
        console.error(err);
        setUploadError(err.message || "Upload failed. Please try again.");
      } finally {
        setUploadingDoc(false);
      }
    };

    return (
      <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-150 dark:border-gray-800 shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-300">
        
        {/* Dynamic Gradient Card Header */}
        <div className={`p-6 border-b border-gray-100 dark:border-gray-800 flex items-start justify-between gap-4 flex-wrap bg-gradient-to-r ${
          isCompleted ? "from-green-50/30 to-emerald-50/10 dark:from-green-950/10 dark:to-transparent" :
          isNeedsInfo ? "from-amber-50/50 to-orange-50/10 dark:from-amber-950/20 dark:to-transparent" :
          isRefund ? "from-pink-50/40 to-rose-50/10 dark:from-pink-950/10 dark:to-transparent" :
          "from-indigo-50/20 to-transparent dark:from-indigo-950/10"
        }`}>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-extrabold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest bg-indigo-50 dark:bg-indigo-950 px-2 py-0.5 rounded">
                {req.job_title?.includes("[e-Suvidha]") ? "📱 E-SUVIDHA SERVICE" : "🏛️ SARKARI JOB"}
              </span>
              <p className="text-[10px] text-gray-400 font-bold font-mono">ID: {req.tracking_id || req.id.slice(0,8)}</p>
            </div>
            <h3 className="font-extrabold text-gray-900 dark:text-white text-lg mt-1 leading-snug">{req.job_title}</h3>
            <p className="text-xs text-gray-400 mt-0.5 font-medium">
              Submitted: {new Date(req.created_at).toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
            </p>
          </div>
          <span className={`text-xs font-bold px-3 py-1.5 rounded-xl flex items-center gap-1.5 ${cfg.bg} ${cfg.color} border border-current/15 shrink-0 shadow-sm`}>
            {cfg.icon} {cfg.label}
          </span>
        </div>

        {/* Dynamic Stepper Timeline - Zomato/Swiggy style */}
        {!isRejected && !isRefund && (
          <div className="p-6 bg-gray-50/50 dark:bg-gray-900/40 border-b border-gray-100 dark:border-gray-800">
            <h4 className="text-xs font-extrabold text-gray-400 uppercase tracking-wider mb-5 flex items-center gap-1.5">
              <Sparkles className="w-4.5 h-4.5 text-indigo-500" />
              Live Application Stepper
            </h4>
            
            <div className="relative">
              {/* Stepper vertical joining line */}
              <div className="absolute left-5 top-5 bottom-5 w-0.5 bg-gray-200 dark:bg-gray-800" />
              
              <div className="space-y-6">
                {TIMELINE_STEPS.map((step) => {
                  const done = step.done;
                  const active = step.active;
                  return (
                    <div key={step.id} className="flex items-start gap-4 relative group">
                      
                      {/* Stepper Bullet Node */}
                      <div className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center text-sm shrink-0 transition-all duration-300 ${
                        done ? "bg-gradient-to-r from-indigo-600 to-violet-600 shadow-md shadow-indigo-600/20 text-white" :
                        active ? "bg-indigo-500 text-white ring-4 ring-indigo-100 dark:ring-indigo-950 animate-pulse" :
                        "bg-gray-100 dark:bg-gray-800 text-gray-400 border border-gray-200 dark:border-gray-700"
                      }`}>
                        {done ? (
                          <span className="text-white text-xs font-black">✓</span>
                        ) : (
                          <span className="text-xs font-bold">{step.icon}</span>
                        )}
                      </div>

                      {/* Stepper Content */}
                      <div className={`flex-1 pt-1 transition-opacity duration-300 ${done || active ? "opacity-100" : "opacity-40"}`}>
                        <div className="flex items-center gap-2">
                          <p className={`text-sm font-bold ${active ? "text-indigo-600 dark:text-indigo-400 font-extrabold" : "text-gray-900 dark:text-white"}`}>
                            {step.label}
                          </p>
                          {active && (
                            <span className="inline-flex items-center gap-1 text-[9px] font-extrabold bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded-full uppercase tracking-wider animate-pulse">
                              Active
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 font-medium">{step.desc}</p>
                      </div>

                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Dynamic Action Alerts & File Upload Portals */}
        <div className="p-6 space-y-4">
          
          {/* Status Description Badge */}
          <div className={`rounded-2xl p-4 flex items-start gap-3 border ${cfg.bg} border-current/10`}>
            <span className="text-lg shrink-0">{isCompleted ? "🎉" : isNeedsInfo ? "⚠️" : isRefund ? "💸" : "⏳"}</span>
            <div>
              <p className={`text-sm font-extrabold ${cfg.color}`}>{cfg.label}</p>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 font-medium leading-relaxed">{cfg.desc}</p>
            </div>
          </div>

          {/* Admin Note Card */}
          {(() => {
            const displayAdminNote = req.admin_notes ? req.admin_notes.split('--- E-SUVIDHA DETAILS ---')[0].trim() : "";
            if (displayAdminNote && !displayAdminNote.startsWith("[Cashfree") && !displayAdminNote.startsWith("[SYSTEM")) {
              return (
                <div className="bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100/80 dark:border-indigo-900/50 rounded-2xl p-4 flex items-start gap-3">
                  <span className="text-base">💬</span>
                  <div className="space-y-0.5">
                    <p className="text-[10px] font-extrabold text-indigo-500 uppercase tracking-widest">Message From Rojgar Suvidha Team</p>
                    <p className="text-xs text-indigo-900 dark:text-indigo-300 font-bold leading-relaxed">{displayAdminNote}</p>
                  </div>
                </div>
              );
            }
            return null;
          })()}

          {/* ── LIVE FORM FILLING / OTP WARNING ALERT (For In Progress Alert) ── */}
          {req.status === "in_progress" && (
            <div className="bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-950/20 dark:to-blue-950/10 border border-indigo-250 dark:border-indigo-850 rounded-2xl p-4 flex items-start gap-3 animate-pulse">
              <span className="text-lg shrink-0">✍️</span>
              <div>
                <p className="text-xs font-extrabold text-indigo-750 dark:text-indigo-400 uppercase tracking-wider">Form Filling Started — Phone Ready Rakhein!</p>
                <p className="text-[11px] text-indigo-900/80 dark:text-indigo-300/85 font-semibold mt-1 leading-relaxed">
                  Humare expert abhi official portal par aapka form fill kar rahe hain. Form ke last stage par OTP ki zaroorat padegi, isliye kripya apne phone ke paas rahein taaki OTP aate hi aap verified tareeqe se submit kar sakein.
                </p>
              </div>
            </div>
          )}

          {/* ── DOCUMENT RE-UPLOAD PORTAL (For Needs Info Alert) ── */}
          {isNeedsInfo && (
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/10 border-2 border-dashed border-amber-300 dark:border-amber-800 rounded-3xl p-5 space-y-4">
              <div className="flex items-start gap-2">
                <span className="text-lg mt-0.5">📁</span>
                <div>
                  <h4 className="font-extrabold text-sm text-amber-800 dark:text-amber-400 uppercase tracking-wider">Correct Document Re-upload Portal</h4>
                  <p className="text-xs text-amber-700/80 dark:text-amber-300/80 font-medium mt-0.5">
                    Aapki application complete karne ke liye sahi file submit karein. Ye automatic Backblaze database par save ho jayegi.
                  </p>
                </div>
              </div>

              {uploadSuccess ? (
                <div className="bg-green-100 dark:bg-green-950/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800 p-4 rounded-xl text-center text-xs font-bold animate-pulse">
                  ✅ File uploaded successfully! Re-submitting application to team...
                </div>
              ) : (
                <form onSubmit={handleUpload} className="space-y-3">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Kaunsa Document Hai?</label>
                    <select
                      value={selectedDocType}
                      onChange={(e) => setSelectedDocType(e.target.value)}
                      className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-amber-250 dark:border-amber-900 rounded-xl text-xs font-bold text-gray-800 dark:text-gray-250 focus:outline-none"
                    >
                      <option value="photo">🖼️ Passport Size Photo</option>
                      <option value="signature">✍️ Signature (Sign Copy)</option>
                      <option value="aadhar">🪪 Aadhar Card (Front/Back)</option>
                      <option value="marksheet_10">📄 10th Class Marksheet</option>
                      <option value="marksheet_12">📄 12th Class Marksheet</option>
                      <option value="other">📄 Other Required File</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-3">
                    <label className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-white dark:bg-gray-800 border border-amber-250 dark:border-amber-900 hover:border-amber-400 dark:hover:border-amber-700 rounded-xl text-xs font-bold text-gray-600 dark:text-gray-300 cursor-pointer transition-all">
                      <FileUp className="w-4 h-4 text-amber-500" />
                      {selectedFile ? selectedFile.name.slice(0, 20) + "..." : "Sahi File Select Karein"}
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*,.pdf"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) setSelectedFile(f);
                        }}
                      />
                    </label>

                    <button
                      type="submit"
                      disabled={!selectedFile || uploadingDoc}
                      className="px-5 py-3 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white rounded-xl font-extrabold text-xs transition-all shrink-0 flex items-center gap-1.5 shadow-md shadow-amber-600/20 active:scale-95"
                    >
                      {uploadingDoc ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          🚀 Upload & Submit
                        </>
                      )}
                    </button>
                  </div>

                  {uploadError && (
                    <p className="text-[10px] font-bold text-red-500 mt-1">⚠️ {uploadError}</p>
                  )}
                </form>
              )}
            </div>
          )}

          {/* FINAL RECEIPT DOWNLOAD BUTTON */}
          {req.final_receipt_url && (
            <a
              href={req.final_receipt_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-3.5 w-full py-4 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white rounded-2xl font-extrabold text-base shadow-xl shadow-green-500/20 active:scale-98 transition-all"
            >
              <Download className="w-5.5 h-5.5 animate-bounce" />
              Download Receipt / Confirmation PDF
            </a>
          )}

        </div>
      </div>
    );
  };



  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex-1 bg-gray-50 dark:bg-gray-950 py-10 px-4 relative">

      {/* ── LIVE OTP ALERT — appears when team needs OTP ── */}
      {otpAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl border-2 border-red-500 w-full max-w-md p-6 text-center animate-in zoom-in-95 duration-200">
            {/* Header Shield */}
            <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-905 rounded-2xl p-3 mb-4 flex items-center gap-3 text-left">
              <ShieldAlert className="w-10 h-10 text-red-650 shrink-0 animate-pulse" />
              <div>
                <p className="text-[10px] font-extrabold text-red-650 dark:text-red-405 uppercase tracking-wider">⚠️ FRAUD SE BACHEIN (ANTI-SCAM)</p>
                <p className="text-[11px] text-red-750/90 dark:text-red-300/90 font-bold mt-0.5 leading-snug">
                  Hum <strong>KABHI BHI</strong> bank/UPI, Paytm ya payment OTP nahi mangte. Yeh OTP sirf <strong>{otpAlert.job_title}</strong> ke form login ke liye hai.
                </p>
              </div>
            </div>

            {/* Pulsing indicator */}
            <div className="flex items-center justify-center gap-2 mb-2">
              <span className="w-2.5 h-2.5 bg-red-500 rounded-full animate-ping" />
              <span className="text-[11px] font-extrabold text-red-600 dark:text-red-400 uppercase tracking-widest">LIVE OTP Request Active</span>
            </div>

            <p className="text-gray-500 dark:text-gray-400 text-xs mb-3 font-semibold">
              Apne mobile par government/exam portal se aaya SMS OTP yahan enter karein:
            </p>

            {/* Verification code — trust signal */}
            {otpAlert.verification_code && (
              <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-300 dark:border-emerald-800 rounded-2xl p-4 mb-4 text-left">
                <div className="flex items-center gap-2 mb-1.5">
                  <Lock className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <p className="text-xs font-extrabold text-emerald-800 dark:text-emerald-400">🛡️ SECRET TRUST CODE</p>
                </div>
                <div className="flex items-center justify-between bg-white dark:bg-gray-800 border border-emerald-150 dark:border-emerald-800/60 rounded-xl px-3 py-2">
                  <span className="text-[11px] text-gray-500 font-bold">Representative se pucho:</span>
                  <span className="font-mono font-extrabold tracking-widest text-emerald-600 dark:text-emerald-400 text-base">{otpAlert.verification_code}</span>
                </div>
                <p className="text-[10px] text-emerald-700/80 dark:text-emerald-300/80 font-semibold mt-2 leading-relaxed">
                  Call par baithe agent se poochiye ki unka screen code kya hai. Agar woh same yahi code batayein tabhi trust karein.
                </p>
              </div>
            )}

            {/* Anti-Fraud Security Checklist */}
            <div className="bg-gray-50 dark:bg-gray-800/40 border border-gray-150 dark:border-gray-800 rounded-2xl p-4 mb-4 text-left space-y-2.5">
              <p className="text-[10px] font-extrabold text-gray-450 dark:text-gray-400 uppercase tracking-wider">🔒 SAFETY VERIFICATION CHECKLIST</p>
              
              <label className="flex items-start gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={chkSecret}
                  onChange={(e) => setChkSecret(e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-650 border-gray-300 focus:ring-indigo-500 mt-0.5 shrink-0"
                />
                <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 leading-tight">
                  Representative ne mujhe same Secret Trust Code bol kar sunaya hai.
                </span>
              </label>

              <label className="flex items-start gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={chkNotBank}
                  onChange={(e) => setChkNotBank(e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-650 border-gray-300 focus:ring-indigo-500 mt-0.5 shrink-0"
                />
                <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 leading-tight">
                  Yeh OTP bank account, ATM card ya Google Pay/Paytm se related nahi hai.
                </span>
              </label>

              <label className="flex items-start gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={chkNoScreenShare}
                  onChange={(e) => setChkNoScreenShare(e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-650 border-gray-300 focus:ring-indigo-500 mt-0.5 shrink-0"
                />
                <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 leading-tight">
                  Kisi ne mujhe screen-share (e.g. AnyDesk, TeamViewer) download nahi karwaya.
                </span>
              </label>
            </div>

            {/* OTP Input */}
            <input
              type="text"
              inputMode="numeric"
              maxLength={8}
              value={otpInput}
              onChange={e => setOtpInput(e.target.value.replace(/\D/g, ""))}
              placeholder="OTP yahan likhein"
              className="w-full text-center text-2xl font-extrabold font-mono tracking-widest py-3 px-4 border-2 border-gray-200 dark:border-gray-700 rounded-2xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:border-indigo-500 mb-4"
            />

            {/* Submit */}
            <button
              onClick={handleSubmitOtp}
              disabled={otpInput.length < 4 || otpSubmitting || !chkSecret || !chkNotBank || !chkNoScreenShare}
              className="w-full py-3 bg-red-600 hover:bg-red-700 disabled:bg-gray-300 disabled:dark:bg-gray-800 disabled:opacity-60 text-white rounded-2xl font-extrabold text-base transition-all active:scale-95 mb-3 flex items-center justify-center gap-2 shadow-lg shadow-red-500/10"
            >
              {otpSubmitting ? <Loader2 className="w-5 h-5 animate-spin text-white" /> : "✅ Verified OTP Submit Karein"}
            </button>

            {/* Countdown */}
            <div className="flex items-center justify-center gap-1.5 text-xs text-gray-400 font-semibold">
              <Clock className="w-3.5 h-3.5" />
              <span>{Math.floor(otpSecondsLeft / 60)}:{String(otpSecondsLeft % 60).padStart(2, "0")} mein request expire hogi</span>
            </div>
          </div>
        </div>
      )}

      {/* OTP submitted success toast */}
      {otpSubmitted && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-green-600 text-white px-6 py-3 rounded-2xl shadow-xl font-bold text-sm flex items-center gap-2 animate-bounce">
          ✅ OTP team ko mil gaya! Form jald submit hoga.
        </div>
      )}

      <div className="max-w-3xl mx-auto">

        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center bg-indigo-100 dark:bg-indigo-900/30 p-4 rounded-full mb-4">
            <ClipboardCheck className="w-10 h-10 text-indigo-600 dark:text-indigo-400" />
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-white mb-3">
            Track Your Application
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            Apne "Apply For Me" requests ka status aur receipt yahan dekho
          </p>
        </div>

        {/* LOGGED IN: Show all requests */}
        {user && (
          <div className="space-y-5">
            {requests.length === 0 ? (
              <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-16 text-center shadow-sm">
                <ClipboardCheck className="w-14 h-14 text-gray-300 dark:text-gray-700 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Koi Application Nahi Mili</h3>
                <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-sm mx-auto">
                  Abhi tak aapne koi "Apply For Me" request nahi dali hai.
                </p>
                <a href="/apply-for-me"
                  className="inline-block bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg shadow-orange-500/30">
                  Pehli Request Daalo
                </a>
              </div>
            ) : (
              requests.map(req => <RequestCard key={req.id} req={req} />)
            )}
          </div>
        )}

        {/* GUEST: Track by Mobile */}
        {notLoggedIn && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 p-8 shadow-sm">
              <h2 className="text-lg font-extrabold text-gray-900 dark:text-white mb-2">Mobile Number se Track Karo</h2>
              <p className="text-sm text-gray-500 mb-5">Wahi mobile number daalo jo aapne "Apply For Me" form submit karte waqt diya tha.</p>
              <form onSubmit={handleGuestTrack} className="flex gap-3">
                <input
                  type="tel"
                  value={mobileInput}
                  onChange={e => setMobileInput(e.target.value)}
                  placeholder="e.g. 9876543210"
                  className="flex-1 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                  maxLength={10}
                />
                <button type="submit" disabled={guestLoading || mobileInput.length < 10}
                  className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-sm transition-all disabled:opacity-60 flex items-center gap-2">
                  {guestLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Track"}
                </button>
              </form>
              {guestError && <p className="mt-3 text-sm font-bold text-red-500">{guestError}</p>}
            </div>

            {guestResults && (
              <div className="space-y-5">
                <h3 className="font-extrabold text-gray-900 dark:text-white text-lg">{guestResults.length} application(s) mili</h3>
                {guestResults.map(req => <RequestCard key={req.id} req={req} />)}
              </div>
            )}

            <div className="text-center">
              <p className="text-sm text-gray-500">
                Seedha apna Dashboard dekhna chahte ho?{" "}
                <a href="/login" className="font-bold text-indigo-600 hover:underline">Login Karo</a>
              </p>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
