"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import {
  CheckCircle2, XCircle, Clock, Loader2, Copy, RefreshCw,
  IndianRupee, User, Phone, Hash, AlertTriangle, Search,
  Settings, Upload, Save, ExternalLink, Bell
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import Image from "next/image";

interface PendingPayment {
  tracking_id: string;
  full_name: string;
  phone: string;
  email: string;
  total_paid: number;
  utr_number: string;
  payment_status: string;
  payment_method: string;
  form_id: string;
  created_at: string;
  user_id: string;
}

export default function UTRVerificationPage() {
  const [payments, setPayments] = useState<PendingPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [showRejectModal, setShowRejectModal] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("pending_verification");
  const [showSettings, setShowSettings] = useState(false);

  // UPI Settings
  const [upiId, setUpiId] = useState("");
  const [accountName, setAccountName] = useState("");
  const [qrImageUrl, setQrImageUrl] = useState("");
  const [savingSettings, setSavingSettings] = useState(false);
  const [uploadingQR, setUploadingQR] = useState(false);

  const fetchPayments = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from("user_applications")
      .select("tracking_id,full_name,phone,email,total_paid,utr_number,payment_status,payment_method,form_id,created_at,user_id")
      .eq("payment_method", "upi_manual")
      .order("created_at", { ascending: false });

    if (filter !== "all") {
      query = query.eq("payment_status", filter);
    }

    const { data } = await query;
    setPayments((data as PendingPayment[]) || []);
    setLoading(false);
  }, [filter]);

  const fetchSettings = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/upi-settings");
      const data = await res.json();
      if (data.settings) {
        setUpiId(data.settings.upi_id || "");
        setAccountName(data.settings.account_name || "");
        setQrImageUrl(data.settings.qr_image_url || "");
      }
    } catch (e) {
      console.error("Failed to fetch UPI settings:", e);
    }
  }, []);

  useEffect(() => {
    fetchPayments();
    fetchSettings();
  }, [fetchPayments, fetchSettings]);

  const handleApprove = async (tracking_id: string) => {
    setProcessingId(tracking_id);
    try {
      const res = await fetch("/api/utr-verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tracking_id, action: "approve" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success(`✅ ${tracking_id} — Payment approved! User ko notification bhej di.`);
      fetchPayments();
    } catch (err: any) {
      toast.error(err.message || "Approve karne mein dikkat aayi.");
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (tracking_id: string) => {
    if (!rejectionReason.trim()) {
      toast.error("Rejection reason daalna zaroori hai.");
      return;
    }
    setRejectingId(tracking_id);
    try {
      const res = await fetch("/api/utr-verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tracking_id, action: "reject", rejection_reason: rejectionReason }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success(`❌ ${tracking_id} — Reject kar diya. User ko notification bhej di.`);
      setShowRejectModal(null);
      setRejectionReason("");
      fetchPayments();
    } catch (err: any) {
      toast.error(err.message || "Reject karne mein dikkat aayi.");
    } finally {
      setRejectingId(null);
    }
  };

  const handleSaveSettings = async () => {
    setSavingSettings(true);
    try {
      const res = await fetch("/api/admin/upi-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ upi_id: upiId, account_name: accountName, qr_image_url: qrImageUrl }),
      });
      if (!res.ok) throw new Error("Failed to save");
      toast.success("✅ UPI Settings save ho gayi!");
      setShowSettings(false);
    } catch (err: any) {
      toast.error("Settings save karne mein dikkat aayi.");
    } finally {
      setSavingSettings(false);
    }
  };

  const handleQRUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { toast.error("QR image 2MB se chhoti honi chahiye."); return; }

    setUploadingQR(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const { data: session } = await supabase.auth.getSession();
      const token = session?.session?.access_token || "";
      const res = await fetch("/api/locker/upload-direct", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || "Upload failed");
      setQrImageUrl(`/api/locker/view?key=${encodeURIComponent(resData.key)}`);
      toast.success("QR Code upload ho gaya!");
    } catch (err: any) {
      toast.error(err.message || "QR upload fail hua.");
    } finally {
      setUploadingQR(false);
      e.target.value = "";
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copy ho gaya!`);
  };

  const getTimeDiff = (createdAt: string) => {
    const diff = Date.now() - new Date(createdAt).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins} min pehle`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs} ghante pehle`;
    return `${Math.floor(hrs / 24)} din pehle`;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending_verification":
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-black bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400"><Clock className="w-3 h-3" /> Pending</span>;
      case "paid":
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-black bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"><CheckCircle2 className="w-3 h-3" /> Approved</span>;
      case "rejected":
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-black bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400"><XCircle className="w-3 h-3" /> Rejected</span>;
      default:
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-black bg-gray-100 text-gray-500">{status}</span>;
    }
  };

  const filtered = payments.filter(p =>
    !search ||
    p.tracking_id.toLowerCase().includes(search.toLowerCase()) ||
    p.full_name.toLowerCase().includes(search.toLowerCase()) ||
    p.phone.includes(search) ||
    (p.utr_number || "").includes(search)
  );

  const pendingCount = payments.filter(p => p.payment_status === "pending_verification").length;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Toaster position="top-right" />

      {/* Header */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-black text-gray-900 dark:text-white flex items-center gap-2">
              💳 UPI Payment Verification
              {pendingCount > 0 && (
                <span className="bg-red-500 text-white text-xs font-black px-2 py-0.5 rounded-full animate-pulse">
                  {pendingCount} Pending
                </span>
              )}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              Manual UPI payments verify karo — 30 min ke andar
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchPayments}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors"
              title="Refresh"
            >
              <RefreshCw className="w-4 h-4 text-gray-500" />
            </button>
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl transition-all"
            >
              <Settings className="w-4 h-4" />
              UPI Settings
            </button>
          </div>
        </div>
      </div>

      {/* UPI Settings Panel */}
      {showSettings && (
        <div className="mx-6 mt-4 bg-white dark:bg-gray-900 rounded-2xl border border-indigo-200 dark:border-indigo-800 p-5 shadow-sm">
          <h2 className="font-black text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Settings className="w-4 h-4 text-indigo-500" /> UPI Payment Settings
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1.5">UPI ID</label>
              <input
                value={upiId}
                onChange={e => setUpiId(e.target.value)}
                placeholder="yourname@ybl"
                className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1.5">Account Name</label>
              <input
                value={accountName}
                onChange={e => setAccountName(e.target.value)}
                placeholder="Pintu Kumar"
                className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1.5">QR Code Image</label>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 px-4 py-2.5 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl text-sm text-gray-500 cursor-pointer hover:border-indigo-400 transition-colors">
                  {uploadingQR ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                  {uploadingQR ? "Uploading..." : "Upload QR"}
                  <input type="file" accept="image/*" onChange={handleQRUpload} className="hidden" />
                </label>
                {qrImageUrl && (
                  <div className="relative w-16 h-16 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700">
                    <img src={qrImageUrl} alt="QR" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={handleSaveSettings}
            disabled={savingSettings}
            className="mt-4 flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold rounded-xl transition-all text-sm"
          >
            {savingSettings ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {savingSettings ? "Saving..." : "Save Settings"}
          </button>
        </div>
      )}

      {/* Filters & Search */}
      <div className="px-6 py-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, tracking ID, phone, UTR..."
            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {[
            { value: "pending_verification", label: "⏳ Pending" },
            { value: "paid", label: "✅ Approved" },
            { value: "rejected", label: "❌ Rejected" },
            { value: "all", label: "All" },
          ].map(f => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                filter === f.value
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 hover:border-indigo-300"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Payment Cards */}
      <div className="px-6 pb-8 space-y-3">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <CheckCircle2 className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="font-bold">Koi pending payment nahi hai</p>
            <p className="text-sm">Sab verified ho gaye hain 🎉</p>
          </div>
        ) : (
          filtered.map(payment => (
            <div
              key={payment.tracking_id}
              className={`bg-white dark:bg-gray-900 rounded-2xl border shadow-sm overflow-hidden transition-all ${
                payment.payment_status === "pending_verification"
                  ? "border-amber-200 dark:border-amber-800"
                  : payment.payment_status === "paid"
                  ? "border-green-200 dark:border-green-800"
                  : "border-red-200 dark:border-red-800"
              }`}
            >
              {/* Top accent bar */}
              <div className={`h-1 ${
                payment.payment_status === "pending_verification" ? "bg-amber-400" :
                payment.payment_status === "paid" ? "bg-green-500" : "bg-red-400"
              }`} />

              <div className="p-5">
                <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-black text-gray-900 dark:text-white text-base">{payment.full_name}</span>
                      {getStatusBadge(payment.payment_status)}
                    </div>
                    <p className="text-xs text-gray-400">{getTimeDiff(payment.created_at)}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-black text-gray-900 dark:text-white">₹{payment.total_paid}</div>
                    <div className="text-xs text-gray-400">UPI Manual</div>
                  </div>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3">
                    <p className="text-[10px] font-black text-gray-400 uppercase mb-1 flex items-center gap-1">
                      <Hash className="w-3 h-3" /> Tracking ID
                    </p>
                    <div className="flex items-center gap-1">
                      <span className="text-xs font-black text-indigo-600 dark:text-indigo-400">{payment.tracking_id}</span>
                      <button onClick={() => copyToClipboard(payment.tracking_id, "Tracking ID")} className="text-gray-400 hover:text-gray-600 transition-colors">
                        <Copy className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3">
                    <p className="text-[10px] font-black text-gray-400 uppercase mb-1 flex items-center gap-1">
                      <Phone className="w-3 h-3" /> Phone
                    </p>
                    <div className="flex items-center gap-1">
                      <span className="text-xs font-bold text-gray-700 dark:text-gray-300">{payment.phone}</span>
                      <button onClick={() => copyToClipboard(payment.phone, "Phone")} className="text-gray-400 hover:text-gray-600 transition-colors">
                        <Copy className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                  <div className="col-span-2 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl p-3">
                    <p className="text-[10px] font-black text-amber-600 dark:text-amber-400 uppercase mb-1">
                      🔐 UTR Number (PhonePe se verify karo)
                    </p>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-black text-gray-900 dark:text-white font-mono tracking-wider">
                        {payment.utr_number || "—"}
                      </span>
                      {payment.utr_number && (
                        <button
                          onClick={() => copyToClipboard(payment.utr_number, "UTR Number")}
                          className="text-amber-500 hover:text-amber-700 transition-colors"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Action Buttons — only for pending */}
                {payment.payment_status === "pending_verification" && (
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleApprove(payment.tracking_id)}
                      disabled={processingId === payment.tracking_id}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-sm font-black rounded-xl transition-all"
                    >
                      {processingId === payment.tracking_id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <CheckCircle2 className="w-4 h-4" />
                      )}
                      ✅ Approve (UTR Match Hua)
                    </button>
                    <button
                      onClick={() => { setShowRejectModal(payment.tracking_id); setRejectionReason(""); }}
                      disabled={processingId === payment.tracking_id}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-red-50 dark:bg-red-950/30 hover:bg-red-100 dark:hover:bg-red-900/50 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm font-black rounded-xl transition-all"
                    >
                      <XCircle className="w-4 h-4" />
                      ❌ Reject
                    </button>
                    <a
                      href={`/track/${payment.tracking_id}`}
                      target="_blank"
                      className="p-2.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl transition-colors"
                      title="Track Order"
                    >
                      <ExternalLink className="w-4 h-4 text-gray-500" />
                    </a>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-xl flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <h3 className="font-black text-gray-900 dark:text-white">Payment Reject Karo</h3>
                <p className="text-xs text-gray-400">{showRejectModal}</p>
              </div>
            </div>
            <div className="mb-4">
              <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-2">
                Rejection Reason (User ko bheji jayegi)
              </label>
              <textarea
                value={rejectionReason}
                onChange={e => setRejectionReason(e.target.value)}
                placeholder="e.g. UTR number match nahi hua. Kripya sahi UTR submit karein."
                rows={3}
                className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 outline-none resize-none"
              />
              <div className="flex flex-wrap gap-2 mt-2">
                {[
                  "UTR number match nahi hua.",
                  "Payment amount galat hai.",
                  "Duplicate UTR number hai.",
                ].map(reason => (
                  <button
                    key={reason}
                    onClick={() => setRejectionReason(reason)}
                    className="text-xs px-2.5 py-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-lg hover:bg-red-50 hover:text-red-600 transition-colors"
                  >
                    {reason}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => { setShowRejectModal(null); setRejectionReason(""); }}
                className="flex-1 px-4 py-2.5 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 font-bold rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-sm"
              >
                Cancel
              </button>
              <button
                onClick={() => handleReject(showRejectModal)}
                disabled={rejectingId === showRejectModal || !rejectionReason.trim()}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-black rounded-xl transition-all text-sm"
              >
                {rejectingId === showRejectModal ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                Reject & Notify
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
