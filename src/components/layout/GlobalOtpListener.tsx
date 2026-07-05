"use client";

import React, { useEffect, useState, useRef } from "react";
import { usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { ShieldAlert, Lock, Clock, Loader2, CheckCircle2, User } from "lucide-react";
import { toast } from "react-hot-toast";

export default function GlobalOtpListener() {
  const pathname = usePathname() || "";
  const [user, setUser] = useState<any>(null);
  const [otpAlert, setOtpAlert] = useState<any>(null);
  const [otpInput, setOtpInput] = useState("");
  const [otpSecondsLeft, setOtpSecondsLeft] = useState(0);
  const [otpSubmitting, setOtpSubmitting] = useState(false);
  const [otpSubmitted, setOtpSubmitted] = useState(false);

  // Safety checklist states
  const [chkSecret, setChkSecret] = useState(false);
  const [chkNotBank, setChkNotBank] = useState(false);
  const [chkNoScreenShare, setChkNoScreenShare] = useState(false);

  const lastNotifiedOtpId = useRef<string | null>(null);
  const lastNotifiedStatus = useRef<Record<string, string>>({});

  // Listen to active session
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user || null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Poll & Subscribe to live apply requests status changes globally
  useEffect(() => {
    if (!user) return;

    // Initialize status cache on load
    const initStatus = async () => {
      try {
        const { data } = await supabase
          .from("apply_for_me_requests")
          .select("id, status")
          .eq("user_id", user.id);
        
        if (data) {
          data.forEach((req: any) => {
            lastNotifiedStatus.current[req.id] = req.status;
          });
        }
      } catch (e) {
        console.error("Init status error:", e);
      }
    };
    initStatus();

    // Check logic
    const checkStatusUpdate = async () => {
      try {
        const { data } = await supabase
          .from("apply_for_me_requests")
          .select("id, status, job_title")
          .eq("user_id", user.id);

        if (data) {
          data.forEach((req: any) => {
            const oldStatus = lastNotifiedStatus.current[req.id];
            // Only trigger alert if status actually changed
            if (oldStatus && oldStatus !== req.status) {
              lastNotifiedStatus.current[req.id] = req.status;
              
              // Trigger notification chime sound
              playChimeSound();

              const statusLabels: Record<string, string> = {
                pending: "Pending / Waiting",
                paid: "Payment Received",
                submitted: "Form Submitted",
                needs_info: "Action Required / Missing Info",
                completed: "Completed Successfully",
                refund_pending: "Refund Pending"
              };
              const label = statusLabels[req.status] || req.status;

              // 1. Toast Notification banner (gorgeous popup)
              let toastMsg = `Aapki application "${req.job_title}" ka status ab "${label}" ho gaya hai.`;
              if (req.status === "completed") {
                toastMsg = `🎉 Congratulations! Aapka form "${req.job_title}" successfully fill ho gaya hai. Receipt download karein.`;
              } else if (req.status === "needs_info") {
                toastMsg = `⚠️ Action Required: Aapke form "${req.job_title}" ke liye kuch documents pending hain. Kripya check karein.`;
              }
              
              toast(toastMsg, {
                duration: 8000,
                icon: req.status === "completed" ? "🎉" : req.status === "needs_info" ? "⚠️" : "📋",
              });

              // 2. HTML5 Browser Notification
              if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
                new Notification(`📋 Status Update: ${req.job_title}`, {
                  body: `Current status is now: ${label}`,
                  icon: "/logo-blue.png"
                });
              }
            }
          });
        }
      } catch (err) {
        console.error("Poll status error:", err);
      }
    };

    // Subscribe to real-time updates via Supabase WebSockets
    const channel = supabase.channel(`apply_status_channel_${user.id}`)
      .on("postgres_changes", {
        event: "UPDATE",
        schema: "public",
        table: "apply_for_me_requests",
        filter: `user_id=eq.${user.id}`
      }, (payload: any) => {
        console.log("Realtime status update detected:", payload);
        checkStatusUpdate();
      })
      .subscribe();

    // Fallback polling (every 6 seconds)
    const poll = setInterval(checkStatusUpdate, 6000);

    return () => {
      clearInterval(poll);
      supabase.removeChannel(channel);
    };
  }, [user]);

  const playChimeSound = () => {
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.frequency.setValueAtTime(587.33, ctx.currentTime);
      gain1.gain.setValueAtTime(0.15, ctx.currentTime);
      gain1.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start();
      osc1.stop(ctx.currentTime + 0.45);

      setTimeout(() => {
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.frequency.setValueAtTime(880, ctx.currentTime);
        gain2.gain.setValueAtTime(0.2, ctx.currentTime);
        gain2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        osc2.start();
        osc2.stop(ctx.currentTime + 0.55);
      }, 100);
    } catch {}
  };

  // Poll for live OTP requests globally when NOT on the dashboard page
  useEffect(() => {
    if (!user || pathname === "/dashboard") {
      setOtpAlert(null);
      return;
    }

    const checkOtp = async () => {
      try {
        const { data } = await supabase
          .from("otp_requests")
          .select("*")
          .eq("user_id", user.id)
          .eq("status", "pending")
          .gt("expires_at", new Date().toISOString())
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (data) {
          setOtpAlert(data);
          const secsLeft = Math.max(0, Math.floor((new Date(data.expires_at).getTime() - Date.now()) / 1000));
          setOtpSecondsLeft(secsLeft);

          // Browser HTML5 desktop notification
          if (lastNotifiedOtpId.current !== data.id) {
            lastNotifiedOtpId.current = data.id;
            playChimeSound();

            if (typeof window !== "undefined" && "Notification" in window) {
              if (Notification.permission === "granted") {
                new Notification("🔑 OTP Required - Rojgar Suvidha", {
                  body: `Form verification ke liye OTP chahiye. Secret trust code: ${data.verification_code || "None"}.`,
                  icon: "/logo-blue.png"
                });
              } else if (Notification.permission !== "denied") {
                Notification.requestPermission();
              }
            }
          }
        } else {
          setOtpAlert(null);
          setChkSecret(false);
          setChkNotBank(false);
          setChkNoScreenShare(false);
        }
      } catch (err) {
        console.error("Global OTP poll error:", err);
      }
    };

    checkOtp();
    const poll = setInterval(checkOtp, 4000);
    return () => clearInterval(poll);
  }, [user, pathname]);

  // Countdown timer
  useEffect(() => {
    if (!otpAlert || otpSecondsLeft <= 0) return;
    const t = setInterval(() => setOtpSecondsLeft(s => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, [otpAlert, otpSecondsLeft]);

  const handleSubmitOtp = async () => {
    if (!otpInput.trim() || !otpAlert) return;
    setOtpSubmitting(true);
    try {
      await supabase.from("otp_requests")
        .update({ otp_value: otpInput.trim(), status: "fulfilled" })
        .eq("id", otpAlert.id);

      setOtpSubmitted(true);
      setOtpAlert(null);
      setTimeout(() => setOtpSubmitted(false), 5000);
    } catch (err) {
      console.error(err);
    } finally {
      setOtpSubmitting(false);
      setOtpInput("");
    }
  };

  if (!otpAlert && !otpSubmitted) return null;

  return (
    <>
      {otpAlert && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-md p-4">
          <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl border-2 border-red-500 w-full max-w-md p-6 text-center animate-in zoom-in-95 duration-200">
            
            {/* Header Brand Branding Logo */}
            <div className="flex items-center justify-center gap-2 mb-4">
              <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-black text-lg">RS</div>
              <span className="font-black text-xl tracking-tight text-gray-900 dark:text-white">
                Rojgar<span className="text-indigo-600">Suvidha</span>
              </span>
            </div>

            {/* Anti-Scam Banner */}
            <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-2xl p-3.5 mb-4 flex items-center gap-3 text-left">
              <ShieldAlert className="w-10 h-10 text-red-600 shrink-0" />
              <div>
                <p className="text-[10px] font-extrabold text-red-600 dark:text-red-400 uppercase tracking-wider">⚠️ FRAUD ALERT (BE SAFE)</p>
                <p className="text-[11px] text-red-700/90 dark:text-red-300/90 font-bold mt-0.5 leading-snug">
                  We <strong>NEVER</strong> ask for bank, UPI, Paytm, or payment OTPs. This OTP is strictly for logging into the <strong>{otpAlert.job_title}</strong> application portal.
                </p>
              </div>
            </div>

            {/* Live Indicator */}
            <div className="flex items-center justify-center gap-2 mb-2">
              <span className="w-2.5 h-2.5 bg-red-500 rounded-full animate-ping" />
              <span className="text-[11px] font-extrabold text-red-600 dark:text-red-400 uppercase tracking-widest">LIVE Verification Alert</span>
            </div>

            <p className="text-gray-500 dark:text-gray-400 text-xs mb-3 font-bold">
              Please enter the SMS OTP received from the government/exam portal on your mobile:
            </p>

            {/* Trust Signal Verification Code */}
            {otpAlert.verification_code && (
              <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-300 dark:border-emerald-800 rounded-2xl p-4 mb-4 text-left">
                <div className="flex items-center gap-2 mb-1.5">
                  <Lock className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <p className="text-xs font-extrabold text-emerald-800 dark:text-emerald-400">🛡️ REPRESENTATIVE TRUST CODE</p>
                </div>
                <div className="flex items-center justify-between bg-white dark:bg-gray-800 border border-emerald-200 dark:border-emerald-800/60 rounded-xl px-3 py-2">
                  <span className="text-[11px] text-gray-500 font-bold">Ask representative for code:</span>
                  <span className="font-mono font-extrabold tracking-widest text-emerald-600 dark:text-emerald-400 text-base">{otpAlert.verification_code}</span>
                </div>
              </div>
            )}

            {/* Security checklist */}
            <div className="bg-gray-50 dark:bg-gray-800/40 border border-gray-200 dark:border-gray-800 rounded-2xl p-4 mb-4 text-left space-y-2.5">
              <p className="text-[10px] font-extrabold text-gray-500 dark:text-gray-400 uppercase tracking-wider">🔒 CHECK ALL TO ENABLE SUBMIT</p>
              
              <label className="flex items-start gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={chkSecret}
                  onChange={(e) => setChkSecret(e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-600 border-gray-300 mt-0.5 shrink-0"
                />
                <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 leading-tight">
                  The representative has verified and spoken the correct Secret Trust Code.
                </span>
              </label>

              <label className="flex items-start gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={chkNotBank}
                  onChange={(e) => setChkNotBank(e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-600 border-gray-300 mt-0.5 shrink-0"
                />
                <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 leading-tight">
                  This OTP is not related to my bank account, ATM card, or mobile wallets (GPay/Paytm).
                </span>
              </label>

              <label className="flex items-start gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={chkNoScreenShare}
                  onChange={(e) => setChkNoScreenShare(e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-600 border-gray-300 mt-0.5 shrink-0"
                />
                <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 leading-tight">
                  I have not installed any screen-sharing application (e.g. AnyDesk, TeamViewer).
                </span>
              </label>
            </div>

            {/* OTP Input Box */}
            <input
              type="text"
              inputMode="numeric"
              maxLength={8}
              value={otpInput}
              onChange={e => setOtpInput(e.target.value.replace(/\D/g, ""))}
              placeholder="Enter OTP here"
              className="w-full text-center text-2xl font-extrabold font-mono tracking-widest py-3 px-4 border-2 border-gray-200 dark:border-gray-700 rounded-2xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:border-indigo-500 mb-4"
            />

            {/* Submit Button */}
            <button
              onClick={handleSubmitOtp}
              disabled={otpInput.length < 4 || otpSubmitting || !chkSecret || !chkNotBank || !chkNoScreenShare}
              className="w-full py-3.5 bg-red-600 hover:bg-red-700 disabled:bg-gray-300 disabled:dark:bg-gray-800 disabled:opacity-60 text-white rounded-2xl font-extrabold text-base transition-all active:scale-95 mb-3 flex items-center justify-center gap-2 shadow-lg"
            >
              {otpSubmitting ? <Loader2 className="w-5 h-5 animate-spin text-white" /> : "✅ Submit Verified OTP"}
            </button>

            {/* Expiry Countdown */}
            <div className="flex items-center justify-center gap-1.5 text-xs text-gray-400 font-semibold">
              <Clock className="w-3.5 h-3.5" />
              <span>Request expires in {Math.floor(otpSecondsLeft / 60)}:{String(otpSecondsLeft % 60).padStart(2, "0")}</span>
            </div>

          </div>
        </div>
      )}

      {/* Success Toast Notification */}
      {otpSubmitted && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[9999] bg-green-600 text-white px-6 py-3.5 rounded-2xl shadow-2xl font-black text-sm flex items-center gap-2 animate-in slide-in-from-top duration-300">
          <CheckCircle2 className="w-5 h-5" />
          <span>OTP successfully received! Our team will submit your form shortly.</span>
        </div>
      )}
    </>
  );
}
