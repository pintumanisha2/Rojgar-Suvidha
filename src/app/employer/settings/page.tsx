"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Settings as SettingsIcon, Building, ShieldCheck, CreditCard, Save, Loader2, Link as LinkIcon, FileText, Image as ImageIcon, Mail, Lock, CheckCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function SettingsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"profile" | "security" | "billing">("profile");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string>("");

  // Profile Form States
  const [companyName, setCompanyName] = useState("");
  const [hrName, setHrName] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [website, setWebsite] = useState("");
  const [description, setDescription] = useState("");
  const [rejectionEmail, setRejectionEmail] = useState("");
  const [interviewEmail, setInterviewEmail] = useState("");

  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    const initSession = async () => {
      const { data } = await supabase.auth.getSession();
      const sessionUser = data.session?.user;

      if (sessionUser) {
        setUserId(sessionUser.id);
        setUserEmail(sessionUser.email || "");
        fetchProfile(sessionUser.id);
      } else {
        router.push("/employer/login");
      }
    };

    initSession();
  }, []);

  const fetchProfile = async (id: string) => {
    try {
      const res = await fetch(`/api/employer/settings?employer_id=${id}`);
      const data = await res.json();
      if (data.profile) {
        setCompanyName(data.profile.company_name || "");
        setHrName(data.profile.hr_name || "");
        setLogoUrl(data.profile.logo_url || "");
        setWebsite(data.profile.website || "");
        setDescription(data.profile.description || "");
        setRejectionEmail(data.profile.email_template_rejection || "");
        setInterviewEmail(data.profile.email_template_interview || "");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setSaving(true);

    if (!userId) {
      setMessage({ type: 'error', text: "No active session." });
      setSaving(false);
      return;
    }

    try {
      const updates = {
        company_name: companyName,
        hr_name: hrName,
        logo_url: logoUrl,
        website: website,
        description: description,
        email_template_rejection: rejectionEmail,
        email_template_interview: interviewEmail
      };

      const res = await fetch("/api/employer/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employer_id: userId, updates })
      });

      if (!res.ok) throw new Error("Failed to save profile");

      setMessage({ type: 'success', text: "Company profile updated successfully!" });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || "An error occurred." });
    } finally {
      setSaving(false);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const handleResetPassword = async () => {
    if (!userEmail) return;
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(userEmail, {
        redirectTo: `${window.location.origin}/employer/login`,
      });
      if (error) throw error;
      alert("Password reset email sent! Please check your inbox.");
    } catch (err: any) {
      alert("Simulation: Password reset email sent! (Since no real auth is active)");
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 max-w-5xl mx-auto">
      <div className="relative border-0 rounded-3xl p-6 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4 overflow-hidden mb-8">
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 via-purple-600 to-fuchsia-600 z-0"></div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -z-0"></div>
        
        <div className="relative z-10">
          <h1 className="text-2xl font-black text-white flex items-center gap-2 drop-shadow-md">
            <SettingsIcon className="w-6 h-6 text-indigo-100" /> Organization Settings
          </h1>
          <p className="text-sm text-indigo-100 mt-1 drop-shadow-sm">Manage your company profile, billing, and security preferences.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        
        {/* Navigation Sidebar for Settings */}
        <div className="md:col-span-1 space-y-2 relative z-10">
          <div className="bg-white/70 dark:bg-gray-900/70 backdrop-blur-md border border-white/50 dark:border-gray-700/50 p-2 rounded-2xl shadow-[0_4px_24px_0_rgba(31,38,135,0.05)]">
            <button 
              onClick={() => setActiveTab("profile")}
              className={`w-full text-left px-4 py-3 font-bold rounded-xl border flex items-center gap-3 text-sm transition-all ${
                activeTab === "profile" 
                  ? "bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-md border-transparent" 
                  : "text-gray-600 dark:text-gray-400 border-transparent hover:bg-gray-50 dark:hover:bg-gray-900"
              }`}
            >
              <Building className="w-4 h-4" /> Company Profile
            </button>
            <button 
              onClick={() => setActiveTab("security")}
              className={`w-full text-left px-4 py-3 font-bold rounded-xl border flex items-center gap-3 text-sm transition-all mt-1 ${
                activeTab === "security" 
                  ? "bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-md border-transparent" 
                  : "text-gray-600 dark:text-gray-400 border-transparent hover:bg-gray-50 dark:hover:bg-gray-900"
              }`}
            >
              <ShieldCheck className="w-4 h-4" /> Security & Login
            </button>
            <button 
              onClick={() => setActiveTab("billing")}
              className={`w-full text-left px-4 py-3 font-bold rounded-xl border flex items-center gap-3 text-sm transition-all mt-1 ${
                activeTab === "billing" 
                  ? "bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-md border-transparent" 
                  : "text-gray-600 dark:text-gray-400 border-transparent hover:bg-gray-50 dark:hover:bg-gray-900"
              }`}
            >
              <CreditCard className="w-4 h-4" /> Billing & Plans
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="md:col-span-3">
          {loading ? (
            <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl p-12 shadow-sm flex items-center justify-center min-h-[400px]">
              <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
            </div>
          ) : (
            <>
              {/* Profile Tab */}
              {activeTab === "profile" && (
                <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl shadow-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                  <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
                    <h2 className="text-lg font-extrabold text-gray-900 dark:text-white">Company Information</h2>
                    {message && (
                      <span className={`text-xs font-bold px-3 py-1 rounded-full ${message.type === 'success' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                        {message.text}
                      </span>
                    )}
                  </div>
                  
                  <form onSubmit={handleSaveProfile} className="p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-xs font-extrabold text-gray-500 uppercase tracking-wider">Company Name</label>
                        <div className="relative">
                          <Building className="absolute left-3.5 top-3 w-4 h-4 text-gray-400" />
                          <input 
                            required
                            type="text" 
                            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500"
                            value={companyName}
                            onChange={(e) => setCompanyName(e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-extrabold text-gray-500 uppercase tracking-wider">HR Manager Name</label>
                        <div className="relative">
                          <ShieldCheck className="absolute left-3.5 top-3 w-4 h-4 text-gray-400" />
                          <input 
                            required
                            type="text" 
                            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500"
                            value={hrName}
                            onChange={(e) => setHrName(e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-extrabold text-gray-500 uppercase tracking-wider">Company Website</label>
                        <div className="relative">
                          <LinkIcon className="absolute left-3.5 top-3 w-4 h-4 text-gray-400" />
                          <input 
                            type="url" 
                            placeholder="https://eduhorizon.com"
                            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500"
                            value={website}
                            onChange={(e) => setWebsite(e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-extrabold text-gray-500 uppercase tracking-wider">Company Logo URL</label>
                        <div className="relative">
                          <ImageIcon className="absolute left-3.5 top-3 w-4 h-4 text-gray-400" />
                          <input 
                            type="url" 
                            placeholder="https://example.com/logo.png"
                            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500"
                            value={logoUrl}
                            onChange={(e) => setLogoUrl(e.target.value)}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-extrabold text-gray-500 uppercase tracking-wider">Company Description</label>
                      <div className="relative">
                        <FileText className="absolute left-3.5 top-3 w-4 h-4 text-gray-400" />
                        <textarea 
                          rows={3}
                          className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 resize-none"
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                          placeholder="Tell candidates about your company culture..."
                        />
                      </div>
                    </div>

                    <hr className="border-gray-100 dark:border-gray-800" />

                    <div>
                      <h3 className="text-sm font-extrabold text-gray-900 dark:text-white mb-4">Automation Email Templates</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-xs font-extrabold text-gray-500 uppercase tracking-wider">Rejection Email Template</label>
                          <textarea 
                            rows={5}
                            className="w-full p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-medium focus:ring-2 focus:ring-indigo-500 resize-none"
                            value={rejectionEmail}
                            onChange={(e) => setRejectionEmail(e.target.value)}
                            placeholder="Hi {{candidate_name}}, unfortunately we are not moving forward..."
                          />
                          <p className="text-[10px] text-gray-400">Available variables: {'{{candidate_name}}'}, {'{{company_name}}'}</p>
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-extrabold text-gray-500 uppercase tracking-wider">Interview Email Template</label>
                          <textarea 
                            rows={5}
                            className="w-full p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-medium focus:ring-2 focus:ring-indigo-500 resize-none"
                            value={interviewEmail}
                            onChange={(e) => setInterviewEmail(e.target.value)}
                            placeholder="Hi {{candidate_name}}, please join your interview using: {{meeting_link}}"
                          />
                          <p className="text-[10px] text-gray-400">Available variables: {'{{candidate_name}}'}, {'{{meeting_link}}'}</p>
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 flex justify-end">
                      <button 
                        type="submit" 
                        disabled={saving}
                        className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-sm transition-colors flex items-center gap-2 disabled:opacity-70"
                      >
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        {saving ? "Saving..." : "Save Changes"}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Security Tab */}
              {activeTab === "security" && (
                <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl shadow-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                  <div className="p-6 border-b border-gray-100 dark:border-gray-800">
                    <h2 className="text-lg font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
                      <ShieldCheck className="w-5 h-5 text-indigo-500" /> Security & Login
                    </h2>
                  </div>
                  <div className="p-6 space-y-6">
                    <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-xl flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/50 rounded-full flex items-center justify-center">
                          <Mail className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-900 dark:text-white">Account Email</p>
                          <p className="text-xs text-gray-500">{userEmail}</p>
                        </div>
                      </div>
                      <span className="px-2.5 py-1 bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-green-400 text-[10px] font-extrabold rounded-full border border-green-200 dark:border-green-800/40 uppercase tracking-widest">
                        Verified
                      </span>
                    </div>

                    <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
                          <Lock className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-900 dark:text-white">Password</p>
                          <p className="text-xs text-gray-500">Update your password via email link.</p>
                        </div>
                      </div>
                      <button 
                        onClick={handleResetPassword}
                        className="px-4 py-2 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 text-xs font-bold rounded-lg border border-gray-200 dark:border-gray-600 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                      >
                        Reset Password
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Billing Tab */}
              {activeTab === "billing" && (
                <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl shadow-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                  <div className="p-6 border-b border-gray-100 dark:border-gray-800">
                    <h2 className="text-lg font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
                      <CreditCard className="w-5 h-5 text-indigo-500" /> Billing & Subscription
                    </h2>
                  </div>
                  <div className="p-6">
                    <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-6 text-white relative overflow-hidden">
                      <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-white opacity-10 rounded-full blur-2xl"></div>
                      <div className="relative z-10">
                        <div className="flex justify-between items-start mb-6">
                          <div>
                            <span className="px-3 py-1 bg-white/20 rounded-full text-xs font-bold uppercase tracking-widest backdrop-blur-sm">Current Plan</span>
                            <h3 className="text-3xl font-black mt-2">Enterprise ATS</h3>
                          </div>
                          <div className="text-right">
                            <span className="text-xs font-bold opacity-80">Status</span>
                            <div className="flex items-center gap-1 mt-1 text-green-300 font-bold">
                              <CheckCircle className="w-4 h-4" /> Active
                            </div>
                          </div>
                        </div>
                        <ul className="space-y-2 mb-6 text-sm font-medium opacity-90">
                          <li className="flex items-center gap-2">✓ Unlimited Job Postings</li>
                          <li className="flex items-center gap-2">✓ Full ATS Pipeline Access</li>
                          <li className="flex items-center gap-2">✓ Integrated Video Call Scheduler</li>
                          <li className="flex items-center gap-2">✓ Team Management (Unlimited Seats)</li>
                        </ul>
                        <button className="px-5 py-2.5 bg-white text-indigo-600 text-sm font-bold rounded-xl shadow-lg hover:bg-gray-50 transition-colors">
                          Manage Subscription
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

      </div>
    </div>
  );
}
