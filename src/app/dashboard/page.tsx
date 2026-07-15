"use client";

import React, { Suspense, useEffect, useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import {
  UserCircle, FileText, Bookmark, ClipboardCheck,
  LogOut, CheckCircle2, Loader2, ShieldCheck, Lock, Briefcase, Camera, Trash2, MessageSquare, Send, Paperclip,
  ShieldAlert, AlertTriangle, Clock, Settings, Bell
} from "lucide-react";
import imageCompression from "browser-image-compression";
import RecentlyViewed from "@/components/home/RecentlyViewed";
import PrivateApplicationTracker from "@/components/candidate/PrivateApplicationTracker";

function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get("tab") || "profile");

  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarTimestamp, setAvatarTimestamp] = useState<number>(Date.now()); // FIX: stable timestamp, not inline Date.now()
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [myRequests, setMyRequests] = useState<any[]>([]);
  const [myApplications, setMyApplications] = useState<any[]>([]);
  // Live OTP Alert
  const [otpAlert, setOtpAlert] = useState<any>(null);
  const [otpInput, setOtpInput] = useState("");
  const [otpSubmitting, setOtpSubmitting] = useState(false);
  const [otpSubmitted, setOtpSubmitted] = useState(false);

  // Messages State
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [chatConversations, setChatConversations] = useState<any[]>([]);
  const [selectedEmployerId, setSelectedEmployerId] = useState<string | null>(null);
  const [chatInput, setChatInput] = useState("");

  const [otpSecondsLeft, setOtpSecondsLeft] = useState(0);
  const [chkSecret, setChkSecret] = useState(false);
  const [chkNotBank, setChkNotBank] = useState(false);
  const [chkNoScreenShare, setChkNoScreenShare] = useState(false);

  const lastNotifiedOtpId = useRef<string | null>(null);
  const lastNotifiedStatus = useRef<Record<string, string>>({});

  // Preferences State
  const [prefCats, setPrefCats] = useState<string[]>([]);
  const [prefChannels, setPrefChannels] = useState<string[]>(["push", "bell"]);
  const [prefTypes, setPrefTypes] = useState<string[]>(["jobs", "results", "admit-card"]);
  const [savingPrefs, setSavingPrefs] = useState(false);
  const [prefsMsg, setPrefsMsg] = useState<string | null>(null);

  // Dashboard Notifications State
  const [notifications, setNotifications] = useState<any[]>([]);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [markingAllNotifs, setMarkingAllNotifs] = useState(false);

  // Delete account confirmation modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedPrefs = localStorage.getItem(`notification_prefs_${user?.id || 'guest'}`);
      if (savedPrefs) {
        try {
          const parsed = JSON.parse(savedPrefs);
          if (parsed.categories) setPrefCats(parsed.categories);
          if (parsed.channels) setPrefChannels(parsed.channels);
          if (parsed.types) setPrefTypes(parsed.types);
        } catch (e) {
          console.error("Failed to parse saved preferences", e);
        }
      } else {
        setPrefCats(["ssc", "railway", "state-psc"]);
      }
    }
  }, [user, activeTab]);

  const handleSavePreferences = () => {
    setSavingPrefs(true);
    setPrefsMsg(null);
    try {
      const payload = {
        categories: prefCats,
        channels: prefChannels,
        types: prefTypes,
        updated_at: new Date().toISOString()
      };
      localStorage.setItem(`notification_prefs_${user?.id || 'guest'}`, JSON.stringify(payload));
      if (user?.id) {
        supabase.auth.updateUser({
          data: { notification_prefs: payload }
        }).catch(() => null);
      }
      setPrefsMsg("✓ Preferences saved successfully!");
      setTimeout(() => setPrefsMsg(null), 3000);
    } catch (err: any) {
      console.error(err);
    } finally {
      setSavingPrefs(false);
    }
  };

  const loadMessages = () => {
    const mockStr = localStorage.getItem("rs_candidate_mock_messages");
    if (mockStr) {
      const msgs = JSON.parse(mockStr);
      setChatMessages(msgs);

      const empMap = new Map();
      msgs.forEach((m: any) => {
        const empId = m.sender_type === "employer" ? m.sender_id : m.receiver_id;
        const empName = m.sender_type === "employer" ? m.sender_name : m.receiver_name;
        const compName = m.company_name || "Company";
        
        if (!empMap.has(empId)) {
          empMap.set(empId, {
            id: empId,
            name: empName || "HR Manager",
            company: compName,
            lastMsg: m.message,
            time: new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            timestamp: new Date(m.created_at).getTime(),
            unread: 0
          });
        } else {
          const existing = empMap.get(empId);
          if (new Date(m.created_at).getTime() > existing.timestamp) {
            existing.lastMsg = m.message;
            existing.time = new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            existing.timestamp = new Date(m.created_at).getTime();
          }
        }
      });

      const sorted = Array.from(empMap.values()).sort((a: any, b: any) => b.timestamp - a.timestamp);
      setChatConversations(sorted);
    }
  };

  useEffect(() => {
    loadMessages();
    const handleStorage = (e: StorageEvent) => {
      if (e.key === "rs_candidate_mock_messages") {
        loadMessages();
      }
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !selectedEmployerId) return;

    const messageText = chatInput.trim();
    setChatInput("");

    const targetEmp = chatConversations.find(c => c.id === selectedEmployerId);
    const lastMsgFromEmp = chatMessages.find((m: any) => m.sender_type === "employer" && m.sender_id === selectedEmployerId);
    const candId = lastMsgFromEmp ? lastMsgFromEmp.receiver_id : "cand-sandbox-123";
    const candName = lastMsgFromEmp ? lastMsgFromEmp.receiver_name : (user?.user_metadata?.full_name || profile?.full_name || "Candidate");

    const newMsgObj = {
      id: "msg-" + Date.now(),
      sender_id: candId,
      receiver_id: selectedEmployerId,
      message: messageText,
      sender_type: "candidate" as const,
      created_at: new Date().toISOString(),
      sender_name: candName,
      receiver_name: targetEmp?.name
    };

    const updatedMessages = [...chatMessages, newMsgObj];
    localStorage.setItem("rs_candidate_mock_messages", JSON.stringify(updatedMessages));
    loadMessages();
    window.dispatchEvent(new Event("storage"));
  };

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

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) { setLoading(false); router.push("/login"); return; }
        setUser(session.user);

        const { data: profileData } = await supabase
          .from("profiles").select("*").eq("id", session.user.id).single();

        if (!profileData?.full_name) { setLoading(false); router.push("/profile-setup"); return; }
        setProfile(profileData);
        if (profileData?.avatar_url) setAvatarUrl(profileData.avatar_url);

        // Fetch Apply For Me requests
        const { data: reqData } = await supabase
          .from("apply_for_me_requests")
          .select("*")
          .eq("user_id", session.user.id)
          .order("created_at", { ascending: false });
        setMyRequests(reqData || []);

        // Initialize status notification ref to prevent initial page-load alerts
        if (reqData) {
          reqData.forEach((req: any) => {
            lastNotifiedStatus.current[req.id] = req.status;
          });
        }

        // FIX: Fetch applications by user_id first, fallback to phone number
        const { data: appData } = await supabase
          .from("user_applications")
          .select("tracking_id, form_id, full_name, selected_post_name, application_status, total_paid, created_at")
          .or(`user_id.eq.${session.user.id},phone.eq.${profileData?.mobile_number || "__none__"}`)
          .order("created_at", { ascending: false });
        setMyApplications(appData || []);
      } catch (err) {
        console.error("Dashboard fetch error:", err);
      } finally {
        setLoading(false); // FIX: Always stop spinner, even on error
      }
    };
    fetchUser();
  }, [router]);

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab) {
      setActiveTab(tab);
    }
    if (searchParams.get("openChat") === "true") {
      // Small timeout to ensure components are mounted and event listener is ready
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent("openAspirantsCircle"));
      }, 500);
    }
  }, [searchParams]);

  // Poll for live apply requests status changes (every 8 seconds)
  useEffect(() => {
    if (!user) return;
    const checkRequestsStatus = async () => {
      try {
        const { data: reqData } = await supabase
          .from("apply_for_me_requests")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (reqData) {
          reqData.forEach((req: any) => {
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

          setMyRequests(reqData);
        }
      } catch (e) {
        console.error("Failed to poll requests status:", e);
      }
    };

    // Poll status updates every 30 seconds fallback
    const poll = setInterval(checkRequestsStatus, 30000);
    return () => clearInterval(poll);
  }, [user]);

  const fetchDashboardNotifications = async () => {
    if (!user) return;
    setNotificationsLoading(true);
    try {
      const res = await fetch(`/api/notifications?userId=${user.id}`);
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
      }
    } catch (e) {
      console.error("Failed to fetch notifications in dashboard:", e);
    } finally {
      setNotificationsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "notifications" && user) {
      fetchDashboardNotifications();
    }
  }, [activeTab, user]);

  const markDashboardNotifAsRead = async (notificationId: string) => {
    setNotifications(prev =>
      prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
    );
    fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: user.id, notificationId }),
    }).catch(() => null);
  };

  const markAllDashboardNotifsAsRead = async () => {
    setMarkingAllNotifs(true);
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: user.id, markAll: true }),
    }).catch(() => null);
    setMarkingAllNotifs(false);
  };

  // Poll for live OTP requests (every 4 seconds)
  useEffect(() => {
    if (!user) return;
    const checkOtp = async () => {
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

        // Notify user about pending OTP request
        if (lastNotifiedOtpId.current !== data.id) {
          lastNotifiedOtpId.current = data.id;
          playChimeSound();
          if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
            new Notification("🔑 OTP Required - Rojgar Suvidha", {
              body: `Please enter the OTP for live verification. Secret trust code: ${data.verification_code || "None"}.`,
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
    // Poll OTP fallback every 20 seconds
    const poll = setInterval(checkOtp, 20000);
    return () => clearInterval(poll);
  }, [user]);

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
    // Auto-dismiss success toast after 4 seconds
    setTimeout(() => setOtpSubmitted(false), 4000);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  const handleDeleteAccount = async () => {
    setLoading(true);
    // 1. Delete profile data (this will cascade or at least remove their personal data)
    await supabase.from("profiles").delete().eq("id", user.id);
    // 2. Sign out the user completely
    await supabase.auth.signOut();
    setShowDeleteModal(false);
    router.push("/");
    router.refresh();
  };

  const handleAvatarUpload = async (file: File) => {
    if (!user || !file) return;
    setAvatarUploading(true);

    // Show photo immediately via local blob URL (instant display)
    const localUrl = URL.createObjectURL(file);
    setAvatarUrl(localUrl);

    try {
      const compressed = await imageCompression(file, { maxSizeMB: 0.15, maxWidthOrHeight: 400, useWebWorker: true });
      const ext = file.type.includes("png") ? "png" : "jpg";
      const path = `${user.id}/avatar.${ext}`;

      // Upload to PUBLIC "avatars" bucket (separate from private user_documents)
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(path, compressed, { upsert: true, contentType: `image/${ext}` });

      if (!uploadError) {
        const { data } = supabase.storage.from("avatars").getPublicUrl(path);
        const remoteUrl = data.publicUrl;
        await supabase.from("profiles").update({ avatar_url: remoteUrl }).eq("id", user.id);
        setAvatarUrl(remoteUrl);
        setAvatarTimestamp(Date.now()); // FIX: Update timestamp only after new upload
      }
    } catch (e) {
      console.error("Avatar upload error:", e);
    }
    setAvatarUploading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="bg-gray-50 dark:bg-gray-950 min-h-screen py-10 px-4">

      {/* ── LIVE OTP ALERT — appears when team needs OTP ── */}
      {otpAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl border-2 border-red-500 w-full max-w-md p-6 text-center animate-in zoom-in-95 duration-200">
            {/* Header Shield */}
            <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-2xl p-3 mb-4 flex items-center gap-3 text-left">
              <ShieldAlert className="w-10 h-10 text-red-600 shrink-0" />
              <div>
                <p className="text-[10px] font-extrabold text-red-600 dark:text-red-400 uppercase tracking-wider">⚠️ FRAUD ALERT (BE SAFE)</p>
                <p className="text-[11px] text-red-700/90 dark:text-red-300/90 font-bold mt-0.5 leading-snug">
                  We <strong>NEVER</strong> ask for bank, UPI, Paytm, or payment OTPs. This OTP is strictly for logging into the <strong>{otpAlert.job_title}</strong> application portal.
                </p>
              </div>
            </div>

            {/* Pulsing indicator */}
            <div className="flex items-center justify-center gap-2 mb-2">
              <span className="w-2.5 h-2.5 bg-red-500 rounded-full animate-ping" />
              <span className="text-[11px] font-extrabold text-red-600 dark:text-red-400 uppercase tracking-widest">LIVE Verification Active</span>
            </div>

            <p className="text-gray-500 dark:text-gray-400 text-xs mb-3 font-semibold">
              Please enter the SMS OTP received from the government/exam portal on your mobile:
            </p>

            {/* Verification code — trust signal */}
            {otpAlert.verification_code && (
              <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-300 dark:border-emerald-800 rounded-2xl p-4 mb-4 text-left">
                <div className="flex items-center gap-2 mb-1.5">
                  <Lock className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <p className="text-xs font-extrabold text-emerald-800 dark:text-emerald-400">🛡️ SECRET TRUST CODE</p>
                </div>
                <div className="flex items-center justify-between bg-white dark:bg-gray-800 border border-emerald-200 dark:border-emerald-800/60 rounded-xl px-3 py-2">
                  <span className="text-[11px] text-gray-500 font-bold">Ask representative for code:</span>
                  <span className="font-mono font-extrabold tracking-widest text-emerald-600 dark:text-emerald-400 text-base">{otpAlert.verification_code}</span>
                </div>
                <p className="text-[10px] text-emerald-700/80 dark:text-emerald-300/80 font-semibold mt-2 leading-relaxed">
                  Ask the calling representative to speak this screen code. Only trust them if the code matches exactly.
                </p>
              </div>
            )}

            {/* Anti-Fraud Security Checklist */}
            <div className="bg-gray-50 dark:bg-gray-800/40 border border-gray-200 dark:border-gray-800 rounded-2xl p-4 mb-4 text-left space-y-2.5">
              <p className="text-[10px] font-extrabold text-gray-500 dark:text-gray-400 uppercase tracking-wider">🔒 SAFETY VERIFICATION CHECKLIST</p>
              
              <label className="flex items-start gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={chkSecret}
                  onChange={(e) => setChkSecret(e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-600 border-gray-300 focus:ring-indigo-500 mt-0.5 shrink-0"
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
                  className="w-4 h-4 rounded text-indigo-600 border-gray-300 focus:ring-indigo-500 mt-0.5 shrink-0"
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
                  className="w-4 h-4 rounded text-indigo-600 border-gray-300 focus:ring-indigo-500 mt-0.5 shrink-0"
                />
                <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 leading-tight">
                  I have not installed any screen-sharing application (e.g. AnyDesk, TeamViewer).
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
              placeholder="Enter OTP here"
              className="w-full text-center text-2xl font-extrabold font-mono tracking-widest py-3 px-4 border-2 border-gray-200 dark:border-gray-700 rounded-2xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:border-indigo-500 mb-4"
            />

            {/* Submit */}
            <button
              onClick={handleSubmitOtp}
              disabled={otpInput.length < 4 || otpSubmitting || !chkSecret || !chkNotBank || !chkNoScreenShare}
              className="w-full py-3 bg-red-600 hover:bg-red-700 disabled:bg-gray-300 disabled:dark:bg-gray-800 disabled:opacity-60 text-white rounded-2xl font-extrabold text-base transition-all active:scale-95 mb-3 flex items-center justify-center gap-2 shadow-lg shadow-red-500/10"
            >
              {otpSubmitting ? <Loader2 className="w-5 h-5 animate-spin text-white" /> : "✅ Submit Verified OTP"}
            </button>

            {/* Countdown */}
            <div className="flex items-center justify-center gap-1.5 text-xs text-gray-400 font-semibold">
              <Clock className="w-3.5 h-3.5" />
              <span>Request expires in {Math.floor(otpSecondsLeft / 60)}:{String(otpSecondsLeft % 60).padStart(2, "0")}</span>
            </div>
          </div>
        </div>
      )}

      {/* OTP submitted success toast */}
      {otpSubmitted && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-green-600 text-white px-6 py-3 rounded-2xl shadow-xl font-bold text-sm flex items-center gap-2 animate-in slide-in-from-top duration-300">
          ✅ OTP received! Our team will submit your form shortly.
        </div>
      )}

      {/* Delete Account Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl border-2 border-red-200 dark:border-red-800 w-full max-w-md p-6">
            <div className="w-14 h-14 bg-red-100 dark:bg-red-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-7 h-7 text-red-600" />
            </div>
            <h3 className="text-lg font-black text-gray-900 dark:text-white text-center mb-2">Delete Account Permanently?</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center mb-5 leading-relaxed">
              This will permanently delete your profile, all uploaded documents, and application history.
              <strong className="text-red-600 dark:text-red-400"> This cannot be undone.</strong>
            </p>
            <div className="mb-4">
              <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1.5">Type <span className="text-red-600 font-mono">DELETE</span> to confirm</label>
              <input
                type="text"
                value={deleteConfirmText}
                onChange={e => setDeleteConfirmText(e.target.value)}
                placeholder="Type DELETE here"
                className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white font-mono font-bold focus:outline-none focus:border-red-500 transition-all"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => { setShowDeleteModal(false); setDeleteConfirmText(""); }}
                className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-bold text-sm transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleteConfirmText !== "DELETE" || loading}
                className="flex-1 py-3 bg-red-600 hover:bg-red-700 disabled:bg-gray-300 disabled:dark:bg-gray-800 disabled:opacity-50 text-white rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                Delete Forever
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto flex flex-col md:flex-row gap-8">


        {/* Sidebar */}
        <div className="w-full md:w-80 shrink-0">
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden sticky top-24">

            <div className="p-6 bg-gradient-to-br from-indigo-500 to-violet-600 text-white text-center relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mt-10 -mr-10" />
              <div className="relative z-10 flex flex-col items-center">
                {/* Avatar with small camera corner button */}
                <div className="relative mb-3">
                  <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-white/50 shadow-lg bg-white/20 flex items-center justify-center">
                    {avatarUrl ? (
                      <img src={`${avatarUrl}?t=${avatarTimestamp}`} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <UserCircle className="w-12 h-12 text-white" />
                    )}
                  </div>
                  {/* Small camera button at corner */}
                  <label className="absolute bottom-0 right-0 w-7 h-7 bg-white rounded-full flex items-center justify-center cursor-pointer shadow-md border-2 border-indigo-500 hover:bg-indigo-50 transition-colors">
                    {avatarUploading ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-600" />
                    ) : (
                      <Camera className="w-3.5 h-3.5 text-indigo-600" />
                    )}
                    <input type="file" className="hidden" accept="image/*"
                      onChange={(e) => { const f = e.target.files?.[0]; if (f) handleAvatarUpload(f); }} />
                  </label>
                </div>
                <h2 className="text-xl font-extrabold">{profile?.full_name}</h2>
                <p className="text-indigo-100 text-sm font-medium mt-1">{user?.email || user?.phone}</p>
                {profile?.mobile_number && (
                  <p className="text-indigo-200 text-xs mt-0.5">📱 +91 {profile.mobile_number}</p>
                )}
                <div className="mt-3 bg-white/20 px-3 py-1 rounded-full text-xs font-bold border border-white/30 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-green-300" /> Account Verified
                </div>
              </div>
            </div>

            <div className="p-3 space-y-1">
              {([
                { id: "profile",              icon: <FileText className="w-5 h-5" />,      label: "Profile" },
                { id: "applications",         icon: <Briefcase className="w-5 h-5" />,     label: "Govt Job Apps" },
                { id: "private-applications", icon: <Briefcase className="w-5 h-5" />,     label: "Private Job Tracker" },
                { id: "saved",                icon: <Bookmark className="w-5 h-5" />,      label: "Saved Jobs" },
                { id: "requests",             icon: <ClipboardCheck className="w-5 h-5" />,label: "Apply For Me" },
                { id: "messages",             icon: <MessageSquare className="w-5 h-5" />, label: "Messages" },
                { id: "notifications",        icon: <Bell className="w-5 h-5" />,          label: "Notifications" },
                { id: "preferences",          icon: <Settings className="w-5 h-5" />,      label: "Preferences" },
              ] as const).map(item => (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    router.replace(`/dashboard?tab=${item.id}`, { scroll: false });
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-bold transition-all ${
                    activeTab === item.id
                      ? "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400"
                      : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
                  }`}
                >
                  {item.icon} {item.label}
                </button>
              ))}
              <Link href="/dashboard/locker"
                className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-bold transition-all text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800">
                <Lock className="w-5 h-5" /> Digital Locker
              </Link>
              <button onClick={() => window.dispatchEvent(new CustomEvent("openAspirantsCircle"))}
                className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-bold transition-all text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800">
                <span className="text-base shrink-0">💬</span> Aspirants Adda
              </button>
            </div>

            <div className="p-3 border-t border-gray-100 dark:border-gray-800">
              <button onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-bold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all">
                <LogOut className="w-4 h-4" /> Log Out
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1">

          {/* PROFILE TAB */}
          {activeTab === "profile" && (
            <div className="space-y-6">

              {/* Profile Info Card */}
              <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm p-6 md:p-8">
                <h3 className="text-lg font-extrabold text-gray-900 dark:text-white mb-4">Profile Details</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    { label: "Full Name", value: profile?.full_name },
                    { label: "Mobile", value: profile?.mobile_number ? `+91 ${profile.mobile_number}` : "—" },
                    { label: "Date of Birth", value: profile?.date_of_birth || "—" },
                    { label: "Email", value: user?.email || "—" },
                    { label: "Father's Name", value: profile?.father_name || "—" },
                    { label: "Mother's Name", value: profile?.mother_name || "—" },
                    { label: "Gender", value: profile?.gender || "—" },
                    { label: "Category", value: profile?.category?.toUpperCase() || "—" },
                  ].map(({ label, value }) => (
                    <div key={label} className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">{label}</p>
                      <p className="font-bold text-gray-900 dark:text-white">{value}</p>
                    </div>
                  ))}
                </div>
                {profile?.address && (
                  <div className="mt-4 bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Address</p>
                    <p className="font-bold text-gray-900 dark:text-white">{profile.address}</p>
                  </div>
                )}
                <div className="mt-4">
                  <Link href="/profile-setup" className="text-sm font-bold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400">
                    ✏️ Edit Profile
                  </Link>
                </div>
              </div>

              {/* Digital Locker CTA Card */}
              <Link href="/dashboard/locker">
                <div className="group bg-gradient-to-br from-indigo-600 to-violet-700 rounded-2xl p-7 text-white shadow-xl shadow-indigo-500/20 flex items-center gap-6 hover:scale-[1.01] transition-transform cursor-pointer">
                  <div className="w-16 h-16 bg-white/15 rounded-2xl flex items-center justify-center shrink-0 border border-white/20 backdrop-blur-sm">
                    <ShieldCheck className="w-8 h-8 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-xl font-black">My Digital Locker</h3>
                      <span className="text-[10px] font-extrabold bg-green-400/20 text-green-200 border border-green-400/30 px-2 py-0.5 rounded-full uppercase tracking-widest">256-Bit Secured</span>
                    </div>
                    <p className="text-indigo-100 text-sm font-medium">
                      Upload documents once — auto-fill in all job applications. Military-grade encrypted storage.
                    </p>
                  </div>
                  <div className="shrink-0 bg-white/10 hover:bg-white/20 rounded-xl px-4 py-2.5 font-bold text-sm border border-white/20 transition-colors">
                    Open Locker →
                  </div>
                </div>
              </Link>

              {/* Aspirants Adda CTA Card */}
              <div 
                onClick={() => window.dispatchEvent(new CustomEvent("openAspirantsCircle"))}
                className="group bg-gradient-to-br from-green-600 to-emerald-700 rounded-2xl p-7 text-white shadow-xl shadow-green-500/20 flex items-center gap-6 hover:scale-[1.01] transition-transform mt-6 cursor-pointer"
              >
                <div className="w-16 h-16 bg-white/15 rounded-2xl flex-shrink-0 flex items-center justify-center border border-white/20 backdrop-blur-sm">
                  <span className="text-3xl leading-none">💬</span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-xl font-black">Aspirants Adda</h3>
                    <span className="text-[10px] font-extrabold bg-green-400/20 text-green-200 border border-green-400/30 px-2 py-0.5 rounded-full uppercase tracking-widest">Live Group Chat</span>
                  </div>
                  <p className="text-green-100 text-sm font-medium">
                    Discuss exams, syllabus, admit cards, and results with fellow aspirants from all over India!
                  </p>
                </div>
                <div className="shrink-0 bg-white/10 hover:bg-white/20 rounded-xl px-4 py-2.5 font-bold text-sm border border-white/20 transition-colors">
                  Join Chat →
                </div>
              </div>

              {/* Danger Zone (Account Deletion) */}
              <div className="mt-8 bg-red-50 dark:bg-red-900/10 rounded-2xl border border-red-200 dark:border-red-800/30 p-6 md:p-8">
                <h3 className="text-lg font-extrabold text-red-700 dark:text-red-400 mb-2">Danger Zone</h3>
                <p className="text-sm text-red-600/80 dark:text-red-400/80 mb-5">
                  Permanently delete your account and all associated data, including your digital locker documents, personal details, and application history. This action cannot be undone and is strictly compliant with data privacy policies.
                </p>
                <button
                  onClick={() => setShowDeleteModal(true)}
                  className="bg-red-600 hover:bg-red-700 text-white px-6 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-red-500/20 text-sm flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" /> Delete My Account
                </button>
              </div>

            </div>
          )}

          {/* SAVED JOBS TAB */}
          {activeTab === "saved" && (
            <div className="space-y-5">
              {/* Recently Viewed Jobs - client-side localStorage */}
              <RecentlyViewed />

              <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden p-10 text-center">
                <Bookmark className="w-16 h-16 text-gray-300 dark:text-gray-700 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Your Saved Jobs</h3>
                <p className="text-gray-500 dark:text-gray-400 max-w-sm mx-auto mb-6">
                  Your saved jobs are located on a dedicated page. Click below to view them.
                </p>
                <Link href="/saved-jobs" className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg shadow-indigo-500/30">
                  View Saved Jobs →
                </Link>
              </div>
            </div>
          )}

          {/* MY APPLICATIONS TAB */}
          {activeTab === "applications" && (
            <div className="space-y-5">
              <h3 className="text-xl font-extrabold text-gray-900 dark:text-white">Govt Job Applications</h3>
              {myApplications.length === 0 ? (
                <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm p-16 text-center">
                  <Briefcase className="w-16 h-16 text-gray-300 dark:text-gray-700 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No Applications Yet</h3>
                  <p className="text-gray-500 dark:text-gray-400 max-w-sm mx-auto mb-6">Apply for any job to get started. All your submitted job applications will be tracked here.</p>
                  <Link href="/" className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg shadow-indigo-500/30">
                    Browse Jobs
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {myApplications.map(app => {
                    const statusColors: Record<string, string> = {
                      "Received": "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
                      "Under Review": "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
                      "Approved": "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
                      "Rejected": "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
                    };
                    const statusColor = statusColors[app.application_status] || statusColors["Received"];
                    return (
                      <div key={app.tracking_id} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm p-5">
                        <div className="flex items-start justify-between gap-4 flex-wrap">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 flex-wrap mb-1">
                              <h4 className="font-extrabold text-gray-900 dark:text-white">{app.selected_post_name || "Form Application"}</h4>
                              <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${statusColor}`}>{app.application_status}</span>
                            </div>
                            <p className="text-xs text-gray-400">Tracking ID: <span className="font-bold text-indigo-600 dark:text-indigo-400">{app.tracking_id}</span></p>
                            <p className="text-xs text-gray-400 mt-0.5">Submitted: {new Date(app.created_at).toLocaleString("en-IN")}</p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-xs text-gray-400">Paid</p>
                            <p className="font-extrabold text-gray-900 dark:text-white">₹{app.total_paid || 0}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* PRIVATE JOB TRACKER TAB */}
          {activeTab === "private-applications" && user && (
            <PrivateApplicationTracker userId={user.id} />
          )}

          {/* APPLY FOR ME REQUESTS TAB */}
          {activeTab === "requests" && (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-extrabold text-gray-900 dark:text-white">My Apply For Me Requests</h3>
                <Link href="/apply-for-me"
                  className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-orange-500/30">
                  + New Request
                </Link>
              </div>

              {myRequests.length === 0 ? (
                <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden p-16 text-center">
                  <ClipboardCheck className="w-16 h-16 text-gray-300 dark:text-gray-700 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No Applications Yet</h3>
                  <p className="text-gray-500 dark:text-gray-400 max-w-sm mx-auto mb-6">
                    You haven&apos;t placed any applications yet. Browse jobs and click &quot;Apply For Me&quot; — our expert team will fill the form for you!
                  </p>
                  <Link href="/apply-for-me" className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg shadow-orange-500/30">
                    Browse Jobs &amp; Apply
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {myRequests.map(req => {
                    const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
                      paid:          { label: "✅ Payment Received",    color: "text-blue-700 dark:text-blue-300",   bg: "bg-blue-50 dark:bg-blue-900/30"   },
                      pending:       { label: "⏳ Queue Mein Hai",       color: "text-amber-700 dark:text-amber-300", bg: "bg-amber-50 dark:bg-amber-900/30" },
                      in_progress:   { label: "🔄 Form Fill Ho Raha Hai",color: "text-indigo-700 dark:text-indigo-300",bg: "bg-indigo-50 dark:bg-indigo-900/30"},
                      needs_info:    { label: "⚠️ Document Chahiye",     color: "text-orange-700 dark:text-orange-300",bg: "bg-orange-50 dark:bg-orange-900/30"},
                      completed:     { label: "✅ Form Submit Ho Gaya!", color: "text-green-700 dark:text-green-300",  bg: "bg-green-50 dark:bg-green-900/30"  },
                      refund_pending:{ label: "💸 Refund Processing",    color: "text-pink-700 dark:text-pink-300",   bg: "bg-pink-50 dark:bg-pink-900/30"   },
                      rejected:      { label: "❌ Rejected",             color: "text-red-700 dark:text-red-300",     bg: "bg-red-50 dark:bg-red-900/30"     },
                    };
                    const cfg = statusConfig[req.status] || statusConfig.paid;
                    return (
                      <div key={req.id} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm p-5">
                        <div className="flex items-start justify-between gap-4 flex-wrap">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 flex-wrap">
                              <h4 className="font-extrabold text-gray-900 dark:text-white">{req.job_title}</h4>
                              <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${cfg.bg} ${cfg.color}`}>
                                {cfg.label}
                              </span>
                            </div>
                            <p className="text-xs text-gray-400 mt-1">
                              Submitted: {new Date(req.created_at).toLocaleString("en-IN")}
                            </p>
                            <p className="text-xs text-gray-400 mt-0.5">
                              Tracking ID: <span className="font-extrabold text-indigo-600 dark:text-indigo-400 font-mono">
                                {req.tracking_id || `AFM-${req.id.slice(0, 8).toUpperCase()}`}
                              </span>
                            </p>
                            {/* Verification Code — shown for anti-scam protection */}
                            {req.verification_code && (
                              <div className="mt-3 flex items-center gap-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-xl px-3 py-2">
                                <span className="text-red-500 text-sm">🔐</span>
                                <div>
                                  <p className="text-[10px] font-extrabold text-red-600 dark:text-red-400 uppercase tracking-wider leading-none">Secret Verification Code</p>
                                  <p className="text-base font-extrabold text-red-700 dark:text-red-300 font-mono tracking-widest mt-0.5">{req.verification_code}</p>
                                  <p className="text-[10px] text-red-500 dark:text-red-400 mt-0.5">Ask the calling agent for this code. If they do not know it, they are not from Rojgar Suvidha.</p>
                                </div>
                              </div>
                            )}
                            {/* in_progress: live form filling and OTP pre-alert */}
                            {req.status === "in_progress" && (
                              <div className="mt-2 bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-950/20 dark:to-blue-950/10 border border-indigo-200 dark:border-indigo-800 rounded-xl px-3 py-2.5 animate-pulse flex items-start gap-2.5">
                                <span className="text-base shrink-0">✍️</span>
                                <div>
                                  <p className="text-xs font-extrabold text-indigo-700 dark:text-indigo-400 uppercase tracking-wider">Form Filling Started — Keep Your Phone Close!</p>
                                  <p className="text-[11px] text-indigo-900/80 dark:text-indigo-300/80 font-semibold mt-0.5 leading-relaxed">
                                    Our representative is currently filling your form on the official portal. An OTP will be required during the final stage, so please keep your phone close to verify it when requested.
                                  </p>
                                </div>
                              </div>
                            )}
                            {/* Completed celebration */}
                            {req.status === "completed" && (
                              <div className="mt-2 bg-green-50 dark:bg-green-900/20 border border-green-300 dark:border-green-700 rounded-xl px-3 py-2">
                                <p className="text-xs font-extrabold text-green-700 dark:text-green-300">🎉 Your application has been successfully submitted! Download your receipt below.</p>
                              </div>
                            )}
                            {/* needs_info: user action required */}
                            {req.status === "needs_info" && (
                              <div className="mt-2 bg-orange-50 dark:bg-orange-900/20 border border-orange-300 dark:border-orange-700 rounded-xl px-3 py-2">
                                <p className="text-xs font-extrabold text-orange-700 dark:text-orange-300">⚠️ Action Required: Our team needs additional documents. Please check the representative message or contact support.</p>
                              </div>
                            )}
                            
                            {(() => {
                              const displayAdminNote = req.admin_notes ? req.admin_notes.split('--- E-SUVIDHA DETAILS ---')[0].trim() : "";
                              if (displayAdminNote && !displayAdminNote.startsWith("[Cashfree")) {
                                return (
                                  <div className="mt-3 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800 rounded-xl p-3">
                                    <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400 mb-1">💬 Team Message:</p>
                                    <p className="text-sm text-indigo-800 dark:text-indigo-300">{displayAdminNote}</p>
                                  </div>
                                );
                              }
                              return null;
                            })()}
                          </div>

                          {/* Receipt Download */}
                          {req.final_receipt_url && (
                            <a href={req.final_receipt_url} target="_blank" rel="noopener noreferrer"
                              className="flex items-center gap-2 px-4 py-2.5 bg-green-500 hover:bg-green-600 text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-green-500/20 shrink-0">
                              ⬇️ Receipt Download
                            </a>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* MESSAGES TAB */}
          {activeTab === "messages" && (
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden h-[75vh] flex">
              {/* Left Sidebar */}
              <div className="w-1/3 border-r border-gray-100 dark:border-gray-800 flex flex-col">
                <div className="p-4 border-b border-gray-100 dark:border-gray-800">
                  <h3 className="font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-indigo-500" /> Messages
                  </h3>
                </div>
                <div className="flex-1 overflow-y-auto">
                  {chatConversations.length === 0 && (
                    <div className="p-6 text-center text-gray-400 text-xs font-medium">
                      No messages yet.
                    </div>
                  )}
                  {chatConversations.map((chat) => (
                    <div 
                      key={chat.id} 
                      onClick={() => setSelectedEmployerId(chat.id)}
                      className={`p-4 border-b border-gray-50 dark:border-gray-800/50 cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50 flex gap-3 ${
                        selectedEmployerId === chat.id ? "bg-indigo-50/50 dark:bg-indigo-900/10 border-l-4 border-l-indigo-500" : "border-l-4 border-l-transparent"
                      }`}
                    >
                      <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-black text-sm shrink-0 relative">
                        {chat.company.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-0.5">
                          <h4 className="text-sm font-extrabold text-gray-900 dark:text-white truncate">{chat.name}</h4>
                          <span className="text-[10px] font-bold text-gray-400 shrink-0">{chat.time}</span>
                        </div>
                        <p className="text-[10px] text-indigo-500 font-bold mb-1">{chat.company}</p>
                        <p className="text-xs truncate text-gray-500 font-medium">
                          {chat.lastMsg}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Chat Window */}
              {selectedEmployerId ? (
                <div className="flex-1 flex flex-col bg-gray-50/30 dark:bg-gray-950/50">
                  {/* Chat Header */}
                  <div className="h-16 px-6 border-b border-gray-100 dark:border-gray-800 flex items-center bg-white dark:bg-gray-900 shrink-0">
                    <div>
                      <h3 className="font-extrabold text-gray-900 dark:text-white text-sm">
                        {chatConversations.find(c => c.id === selectedEmployerId)?.name}
                      </h3>
                      <p className="text-[10px] font-bold text-gray-500">
                        {chatConversations.find(c => c.id === selectedEmployerId)?.company}
                      </p>
                    </div>
                  </div>

                  {/* Chat Messages */}
                  <div className="flex-1 p-6 overflow-y-auto flex flex-col gap-4">
                    {chatMessages.filter(m => (m.sender_type === "employer" && m.sender_id === selectedEmployerId) || (m.sender_type === "candidate" && m.receiver_id === selectedEmployerId)).map((m: any) => {
                      const isCandidate = m.sender_type === "candidate";
                      return (
                        <div key={m.id} className={`flex items-start gap-3 ${isCandidate ? "justify-end" : ""}`}>
                          {!isCandidate && (
                            <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-black text-xs shrink-0 mt-1">
                              {m.sender_name?.slice(0, 2).toUpperCase() || "HR"}
                            </div>
                          )}
                          <div className={`${isCandidate ? "bg-indigo-600 text-white rounded-tr-sm" : "bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 text-gray-900 dark:text-gray-100 rounded-tl-sm"} p-3 rounded-2xl max-w-[75%] shadow-sm`}>
                            <p className="text-xs font-medium leading-relaxed">{m.message}</p>
                            <span className={`text-[9px] font-bold block mt-1 ${isCandidate ? "opacity-70 text-right" : "text-gray-400"}`}>
                              {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Chat Input */}
                  <form onSubmit={handleSendMessage} className="p-4 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 shrink-0">
                    <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-850 p-1.5 rounded-xl border border-gray-200 dark:border-gray-700 focus-within:ring-2 focus-within:ring-indigo-500 transition-all">
                      <button type="button" className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-white dark:hover:bg-gray-800 rounded-lg transition-colors">
                        <Paperclip className="w-4 h-4" />
                      </button>
                      <input 
                        type="text" 
                        value={chatInput}
                        onChange={e => setChatInput(e.target.value)}
                        placeholder="Type your message..." 
                        className="flex-1 bg-transparent px-2 text-xs outline-none text-gray-900 dark:text-white"
                      />
                      <button type="submit" className="p-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors shadow-sm">
                        <Send className="w-4 h-4" />
                      </button>
                    </div>
                  </form>
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center bg-gray-50/30 dark:bg-gray-950/50">
                  <MessageSquare className="w-16 h-16 text-gray-300 dark:text-gray-700 mb-4" />
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">Your Inbox</h3>
                  <p className="text-sm text-gray-500">Select a conversation from the left to start chatting</p>
                </div>
              )}
            </div>
          )}

          {/* PREFERENCES TAB */}
          {activeTab === "preferences" && (
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-6 md:p-8 shadow-sm space-y-6">
              <div>
                <h2 className="text-xl font-black text-gray-900 dark:text-white flex items-center gap-2">
                  <Settings className="w-6 h-6 text-indigo-500" /> Notification & Alert Preferences
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  Customize when and how you receive notifications. Only relevant updates will be sent based on your preferences.
                </p>
              </div>

              {prefsMsg && (
                <div className="p-4 bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400 font-bold border border-green-200 dark:border-green-800 rounded-xl text-sm transition-all animate-in fade-in duration-300">
                  {prefsMsg}
                </div>
              )}

              <div className="grid md:grid-cols-2 gap-6 pt-4 border-t border-gray-100 dark:border-gray-800">
                {/* Channels & Types */}
                <div className="space-y-6">
                  <div>
                    <h3 className="font-extrabold text-gray-800 dark:text-white text-sm mb-3">Notification Channels</h3>
                    <div className="space-y-3">
                      {[
                        { key: "bell", label: "In-App Notification Bell", desc: "Show alerts inside the website notification bell" },
                        { key: "push", label: "Web Browser Push Notification", desc: "Float browser notifications in Chrome / Safari" },
                      ].map((ch) => {
                        const checked = prefChannels.includes(ch.key);
                        return (
                          <label key={ch.key} className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-700/50 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => {
                                setPrefChannels(checked ? prefChannels.filter(c => c !== ch.key) : [...prefChannels, ch.key]);
                              }}
                              className="mt-1 w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-gray-350"
                            />
                            <div className="ml-1">
                              <p className="text-xs font-black text-gray-800 dark:text-gray-200 leading-tight">{ch.label}</p>
                              <p className="text-[10px] text-gray-500 mt-0.5">{ch.desc}</p>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <h3 className="font-extrabold text-gray-800 dark:text-white text-sm mb-3">Alert Types</h3>
                    <div className="space-y-3">
                      {[
                        { key: "jobs", label: "New Government & Private Jobs", desc: "Get alerted instantly when new vacancies are posted" },
                        { key: "results", label: "Exam Results Declared", desc: "Instant alert as soon as results are out" },
                        { key: "admit-card", label: "Admit Cards Released", desc: "Alert when hall tickets / admit cards are available" },
                      ].map((t) => {
                        const checked = prefTypes.includes(t.key);
                        return (
                          <label key={t.key} className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-700/50 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => {
                                setPrefTypes(checked ? prefTypes.filter(tp => tp !== t.key) : [...prefTypes, t.key]);
                              }}
                              className="mt-1 w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-gray-350"
                            />
                            <div className="ml-1">
                              <p className="text-xs font-black text-gray-800 dark:text-gray-200 leading-tight">{t.label}</p>
                              <p className="text-[10px] text-gray-500 mt-0.5">{t.desc}</p>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Categories */}
                <div>
                  <h3 className="font-extrabold text-gray-800 dark:text-white text-sm mb-3">Sarkari Exams of Interest</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { key: "ssc", label: "🏛️ SSC Exams" },
                      { key: "railway", label: "🚂 Railway (RRB)" },
                      { key: "banking", label: "🏦 Banking & IBPS" },
                      { key: "upsc", label: "🎖️ UPSC & IAS" },
                      { key: "police", label: "👮 Police Jobs" },
                      { key: "defence", label: "🛡️ Defence Services" },
                      { key: "teaching", label: "📚 CTET & Teaching" },
                      { key: "state-psc", label: "🏢 State PSC" },
                    ].map((cat) => {
                      const checked = prefCats.includes(cat.key);
                      return (
                        <button
                          key={cat.key}
                          type="button"
                          onClick={() => {
                            setPrefCats(checked ? prefCats.filter(c => c !== cat.key) : [...prefCats, cat.key]);
                          }}
                          className={`p-3 rounded-xl border-2 font-bold text-xs text-left transition-all ${
                            checked
                              ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-950/20 text-indigo-700 dark:text-indigo-400"
                              : "border-gray-150 dark:border-gray-800 hover:border-gray-300 text-gray-600 dark:text-gray-400"
                          }`}
                        >
                          {cat.label}
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-4 leading-normal">
                    * We will only send notifications for your selected exam categories to avoid irrelevant updates.
                  </p>
                </div>
              </div>

              <div className="pt-6 border-t border-gray-100 dark:border-gray-800 flex justify-end">
                <button
                  type="button"
                  onClick={handleSavePreferences}
                  disabled={savingPrefs}
                  className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-black text-sm flex items-center gap-2 shadow-lg shadow-indigo-500/20 active:scale-[0.98] transition-all disabled:opacity-50"
                >
                  {savingPrefs ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Preferences"}
                </button>
              </div>
            </div>
          )}

          {/* NOTIFICATIONS TAB */}
          {activeTab === "notifications" && (
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-6 md:p-8 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h2 className="text-xl font-black text-gray-900 dark:text-white flex items-center gap-2">
                    <Bell className="w-6 h-6 text-indigo-500" /> Notifications & Alerts History
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">
                    Your real-time application updates, vacancy announcements, and alert logs.
                  </p>
                </div>
                {notifications.some(n => !n.is_read) && (
                  <button
                    onClick={markAllDashboardNotifsAsRead}
                    disabled={markingAllNotifs}
                    className="flex items-center gap-1.5 px-4 py-2 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 font-bold text-xs rounded-xl self-start sm:self-center transition-all disabled:opacity-50"
                  >
                    {markingAllNotifs ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                    Mark all read
                  </button>
                )}
              </div>

              {notificationsLoading ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
                </div>
              ) : notifications.length === 0 ? (
                <div className="border border-dashed border-gray-200 dark:border-gray-800 rounded-2xl p-12 text-center">
                  <div className="w-16 h-16 bg-gray-50 dark:bg-gray-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Bell className="w-8 h-8 text-gray-300 dark:text-gray-600" />
                  </div>
                  <h3 className="font-extrabold text-gray-800 dark:text-gray-200 text-lg">No Notifications Yet</h3>
                  <p className="text-sm text-gray-400 max-w-sm mx-auto mt-1 mb-5">
                    You will receive instant alerts here as soon as there is an update on your application.
                  </p>
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                    <Link href="/" className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-sm transition-all shadow-lg shadow-indigo-500/20">
                      Browse Latest Jobs
                    </Link>
                    <button
                      onClick={() => {
                        if (typeof window !== "undefined" && "Notification" in window) {
                          Notification.requestPermission().then(p => {
                            if (p === "granted") {
                              new Notification("✅ Push Notifications Enabled!", { body: "You will now receive instant job & result alerts.", icon: "/logo-blue.png" });
                            }
                          });
                        }
                      }}
                      className="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-bold text-sm transition-all"
                    >
                      <Bell className="w-4 h-4" /> Enable Push Notifications
                    </button>
                  </div>
                </div>
              ) : (
                <div className="divide-y divide-gray-100 dark:divide-gray-800/80 border border-gray-100 dark:border-gray-800 rounded-2xl overflow-hidden bg-white dark:bg-gray-900 shadow-sm">
                  {notifications.map((notif) => (
                    <div
                      key={notif.id}
                      className={`relative p-5 transition-all flex items-start gap-4 ${!notif.is_read ? "bg-indigo-50/20 dark:bg-indigo-950/5" : ""}`}
                    >
                      {/* Icon */}
                      <div className="w-10 h-10 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700/50 flex items-center justify-center text-lg shrink-0">
                        {notif.icon || "🔔"}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4">
                          <h3 className={`font-black text-sm leading-snug ${!notif.is_read ? "text-gray-900 dark:text-white" : "text-gray-600 dark:text-gray-400"}`}>
                            {notif.title}
                          </h3>
                          <span className="text-[10px] text-gray-400 dark:text-gray-500 font-bold shrink-0 mt-0.5">
                            {new Date(notif.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-relaxed max-w-2xl">
                          {notif.body}
                        </p>
                        {notif.action_url && (
                          <Link
                            href={notif.action_url}
                            onClick={() => markDashboardNotifAsRead(notif.id)}
                            className="inline-flex items-center gap-1 mt-2.5 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
                          >
                            View details →
                          </Link>
                        )}
                      </div>

                      {/* Mark single as read */}
                      {!notif.is_read && (
                        <button
                          onClick={() => markDashboardNotifAsRead(notif.id)}
                          className="p-1 rounded-lg text-gray-300 hover:text-indigo-600 transition-colors"
                          title="Mark as read"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

export default function StudentDashboard() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-indigo-500" /></div>}>
      <DashboardContent />
    </Suspense>
  );
}
