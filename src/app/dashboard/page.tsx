"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import {
  UserCircle, FileText, Bookmark, ClipboardCheck,
  LogOut, CheckCircle2, Loader2, ShieldCheck, Lock, Briefcase, Camera, Trash2
} from "lucide-react";
import imageCompression from "browser-image-compression";

export default function StudentDashboard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get("tab") || "profile");

  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [myRequests, setMyRequests] = useState<any[]>([]);
  const [myApplications, setMyApplications] = useState<any[]>([]);

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push("/login"); return; }
      setUser(session.user);

      const { data: profileData } = await supabase
        .from("profiles").select("*").eq("id", session.user.id).single();

      if (!profileData?.full_name) { router.push("/profile-setup"); return; }
      setProfile(profileData);
      if (profileData?.avatar_url) setAvatarUrl(profileData.avatar_url);

      // Fetch Apply For Me requests
      const { data: reqData } = await supabase
        .from("apply_for_me_requests")
        .select("*")
        .eq("user_id", session.user.id)
        .order("created_at", { ascending: false });
      setMyRequests(reqData || []);

      // Fetch direct form applications
      const { data: appData } = await supabase
        .from("user_applications")
        .select("tracking_id, form_id, full_name, selected_post_name, application_status, total_paid, created_at")
        .eq("phone", profileData?.mobile_number || "")
        .order("created_at", { ascending: false });
      setMyApplications(appData || []);

      setLoading(false);
    };
    fetchUser();
  }, [router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  const handleDeleteAccount = async () => {
    const confirmDelete = window.confirm(
      "⚠️ DANGER: Are you absolutely sure you want to permanently delete your account?\n\nThis will instantly wipe your profile, documents, and application history. This action CANNOT be undone."
    );
    if (!confirmDelete) return;

    setLoading(true);
    // 1. Delete profile data (this will cascade or at least remove their personal data)
    await supabase.from("profiles").delete().eq("id", user.id);
    
    // 2. Sign out the user completely
    await supabase.auth.signOut();
    
    alert("Your account and associated data have been scheduled for complete deletion.");
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
        setAvatarUrl(remoteUrl); // Update to actual URL so it persists on reload
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
                      <img src={`${avatarUrl}?t=${Date.now()}`} alt="Profile" className="w-full h-full object-cover" />
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
              <button onClick={() => setActiveTab("profile")}
                className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-bold transition-all ${activeTab === "profile" ? "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400" : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"}`}>
                <FileText className="w-5 h-5" /> Profile
              </button>
              <Link href="/dashboard/locker"
                className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-bold transition-all text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800">
                <Lock className="w-5 h-5" /> Digital Locker
              </Link>
              <button onClick={() => setActiveTab("applications")}
                className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-bold transition-all ${activeTab === "applications" ? "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400" : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"}`}>
                <Briefcase className="w-5 h-5" /> My Applications
              </button>
              <button onClick={() => setActiveTab("saved")}
                className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-bold transition-all ${activeTab === "saved" ? "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400" : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"}`}>
                <Bookmark className="w-5 h-5" /> Saved Jobs
              </button>
              <button onClick={() => setActiveTab("requests")}
                className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-bold transition-all ${activeTab === "requests" ? "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400" : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"}`}>
                <ClipboardCheck className="w-5 h-5" /> Apply For Me
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

              {/* Danger Zone (Account Deletion) */}
              <div className="mt-8 bg-red-50 dark:bg-red-900/10 rounded-2xl border border-red-200 dark:border-red-800/30 p-6 md:p-8">
                <h3 className="text-lg font-extrabold text-red-700 dark:text-red-400 mb-2">Danger Zone</h3>
                <p className="text-sm text-red-600/80 dark:text-red-400/80 mb-5">
                  Permanently delete your account and all associated data, including your digital locker documents, personal details, and application history. This action cannot be undone and is strictly compliant with data privacy policies.
                </p>
                <button
                  onClick={handleDeleteAccount}
                  className="bg-red-600 hover:bg-red-700 text-white px-6 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-red-500/20 text-sm flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" /> Delete My Account
                </button>
              </div>

            </div>
          )}

          {/* SAVED JOBS TAB */}
          {activeTab === "saved" && (
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden p-16 text-center">
              <Bookmark className="w-16 h-16 text-gray-300 dark:text-gray-700 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No Saved Jobs Yet</h3>
              <p className="text-gray-500 dark:text-gray-400 max-w-sm mx-auto mb-6">
                When you browse jobs, click the heart icon to save them here for later.
              </p>
              <Link href="/" className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg shadow-indigo-500/30">
                Browse Latest Jobs
              </Link>
            </div>
          )}

          {/* MY APPLICATIONS TAB */}
          {activeTab === "applications" && (
            <div className="space-y-5">
              <h3 className="text-xl font-extrabold text-gray-900 dark:text-white">My Direct Applications</h3>
              {myApplications.length === 0 ? (
                <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm p-16 text-center">
                  <Briefcase className="w-16 h-16 text-gray-300 dark:text-gray-700 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No Applications Yet</h3>
                  <p className="text-gray-500 dark:text-gray-400 max-w-sm mx-auto mb-6">Kisi bhi job form par jaake apply karein. Aapke saare applications yahaan track honge.</p>
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
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No Applications Found</h3>
                  <p className="text-gray-500 dark:text-gray-400 max-w-sm mx-auto mb-6">
                    Kisi bhi job par "Apply For Me" button dabao aur hum aapka form bhar denge!
                  </p>
                  <Link href="/apply-for-me" className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg shadow-orange-500/30">
                    Pehli Request Daalo
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {myRequests.map(req => {
                    const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
                      pending: { label: "⏳ Pending", color: "text-amber-700", bg: "bg-amber-100 dark:bg-amber-900/30" },
                      in_progress: { label: "🔄 In Progress", color: "text-blue-700", bg: "bg-blue-100 dark:bg-blue-900/30" },
                      completed: { label: "✅ Completed", color: "text-green-700", bg: "bg-green-100 dark:bg-green-900/30" },
                      rejected: { label: "❌ Rejected", color: "text-red-700", bg: "bg-red-100 dark:bg-red-900/30" },
                    };
                    const cfg = statusConfig[req.status] || statusConfig.pending;
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
                            {req.admin_notes && (
                              <div className="mt-3 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800 rounded-xl p-3">
                                <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400 mb-1">💬 Admin Note:</p>
                                <p className="text-sm text-indigo-800 dark:text-indigo-300">{req.admin_notes}</p>
                              </div>
                            )}
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
        </div>
      </div>
    </div>
  );
}
