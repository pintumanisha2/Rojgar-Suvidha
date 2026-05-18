"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { 
  ClipboardCheck, Clock, CheckCircle2, Loader2, 
  User, Phone, Mail, ExternalLink, Upload, 
  MessageSquare, RefreshCw, FileDown, HandHeart, Trash2
} from "lucide-react";

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  pending:     { label: "Pending",     color: "text-amber-700",  bg: "bg-amber-100 dark:bg-amber-900/30" },
  in_progress: { label: "In Progress", color: "text-blue-700",   bg: "bg-blue-100 dark:bg-blue-900/30" },
  needs_info:  { label: "Needs Info",  color: "text-orange-700", bg: "bg-orange-100 dark:bg-orange-900/30" },
  completed:   { label: "Completed",   color: "text-green-700",  bg: "bg-green-100 dark:bg-green-900/30" },
  refund_pending: { label: "Refund Pending", color: "text-pink-700", bg: "bg-pink-100 dark:bg-pink-900/30" },
  rejected:    { label: "Rejected",    color: "text-red-700",    bg: "bg-red-100 dark:bg-red-900/30" },
};

export default function AdminApplicationsPage() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [selected, setSelected] = useState<any>(null);
  const [adminNote, setAdminNote] = useState("");
  const [newStatus, setNewStatus] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploadingReceipt, setUploadingReceipt] = useState(false);
  const [studentDocs, setStudentDocs] = useState<{name: string; url: string}[]>([]);
  const [eSuvidhaData, setESuvidhaData] = useState<string>("");
  const [docsLoading, setDocsLoading] = useState(false);
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null);
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null);
  // OTP system
  const [otpRequest, setOtpRequest] = useState<any>(null);
  const [otpTimer, setOtpTimer] = useState(0);
  const [requestingOtp, setRequestingOtp] = useState(false);

  const [serviceType, setServiceType] = useState("all"); // all | sarkari | esuvidha

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user.email) {
        setCurrentUserEmail(session.user.email);
        const { data } = await supabase.from('admin_roles').select('role').eq('email', session.user.email).single();
        if (data) setCurrentUserRole(data.role);
        // Fallback for primary owner
        if (session.user.email === 'admin@rojgarsuvidha.com' || session.user.email === 'superadmin@rojgarsuvidha.com') {
           setCurrentUserRole('super_admin');
        }
      }
      fetchRequests();
    };
    init();
  }, []);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const query = supabase.from("apply_for_me_requests").select("*").order("created_at", { ascending: false });
      const { data } = await query;
      setRequests(data || []);
    } catch (err) {
      console.error("Failed to fetch requests:", err);
    } finally {
      setLoading(false); // FIX: Always stop spinner
    }
  };

  const filtered = requests.filter(r => {
    if (currentUserRole === 'form_filler' && r.assigned_to !== currentUserEmail) return false;
    
    const isESuvidha = r.job_title?.includes("[e-Suvidha]");
    if (serviceType === "sarkari" && isESuvidha) return false;
    if (serviceType === "esuvidha" && !isESuvidha) return false;

    if (filter === "all") return true;
    // "pending" tab shows both unpaid-pending AND freshly paid requests
    if (filter === "pending") return r.status === "pending" || r.status === "paid";
    return r.status === filter;
  });

  const handleAssignNewForm = async () => {
    if (!currentUserEmail) return;
    setLoading(true);
    
    // Find the oldest pending request that is NOT assigned to anyone
    const { data, error } = await supabase
      .from("apply_for_me_requests")
      .select("*")
      .in("status", ["pending", "paid"])  // ✅ Include freshly paid requests
      .is("assigned_to", null)
      .order("created_at", { ascending: true })
      .limit(1)
      .single();

    if (data) {
      // Assign it to this user
      await supabase
        .from("apply_for_me_requests")
        .update({ assigned_to: currentUserEmail, status: "in_progress" })
        .eq("id", data.id);
      
      alert(`Great! A new form (${data.job_title}) has been assigned to you.`);
      fetchRequests();
    } else {
      alert("No pending forms available right now!");
      setLoading(false);
    }
  };

  const openRequest = async (req: any) => {
    setSelected(req);
    setNewStatus(req.status);
    setStudentDocs([]);
    setESuvidhaData("");

    let note = req.admin_notes || "";
    let esDocs: {name: string; url: string}[] = [];
    
    // Parse e-Suvidha data
    if (note.includes("--- E-SUVIDHA DETAILS ---")) {
      const parts = note.split("--- E-SUVIDHA DETAILS ---");
      note = parts[0].trim(); // Real admin note
      
      const rest = parts[1];
      if (rest.includes("--- UPLOADED DOCUMENTS ---")) {
        const subparts = rest.split("--- UPLOADED DOCUMENTS ---");
        setESuvidhaData(subparts[0].trim()); // Extra fields like Father Name
        
        const docLines = subparts[1].trim().split('\n');
        for (const line of docLines) {
          const idx = line.indexOf(': http');
          if (idx !== -1) {
            esDocs.push({ name: line.substring(0, idx).trim(), url: line.substring(idx + 2).trim() });
          }
        }
      } else {
        setESuvidhaData(rest.trim());
      }
    }
    
    setAdminNote(note);

    if (req.job_title?.includes("[e-Suvidha]")) {
      setStudentDocs(esDocs);
      return; // Skip fetching from Supabase for e-Suvidha
    }

    // Fetch student's uploaded documents from Storage (For regular Sarkari jobs)
    if (req.user_id) {
      setDocsLoading(true);
      const { data: files } = await supabase.storage
        .from("student-documents")
        .list(req.user_id);

      if (files && files.length > 0) {
        const docs = files.map(file => {
          const { data } = supabase.storage
            .from("student-documents")
            .getPublicUrl(`${req.user_id}/${file.name}`);
          return { name: file.name, url: data.publicUrl };
        });
        setStudentDocs(docs);
      }
      setDocsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!selected) return;
    setSaving(true);
    
    let finalNote = adminNote;
    if (selected.job_title?.includes("[e-Suvidha]")) {
      const originalNote = selected.admin_notes || "";
      if (originalNote.includes("--- E-SUVIDHA DETAILS ---")) {
        const esuvidhaPart = originalNote.substring(originalNote.indexOf("--- E-SUVIDHA DETAILS ---"));
        finalNote = adminNote.trim() + (adminNote.trim() ? "\n\n" : "") + esuvidhaPart;
      }
    }

    await supabase
      .from("apply_for_me_requests")
      .update({ status: newStatus, admin_notes: finalNote })
      .eq("id", selected.id);
    setSaving(false);
    setSelected(null);
    fetchRequests();
  };

  // OTP Request — sends in-app OTP request to user
  const handleRequestOtp = async () => {
    if (!selected) return;
    setRequestingOtp(true);
    setOtpRequest(null);

    // 1. Mark request as in_progress so user dashboard shows live alert
    await supabase.from("apply_for_me_requests")
      .update({ status: "in_progress" })
      .eq("id", selected.id);
    setNewStatus("in_progress");

    // 2. Insert OTP request record
    const expiresAt = new Date(Date.now() + 3 * 60 * 1000).toISOString();
    const { data: newOtp } = await supabase
      .from("otp_requests")
      .insert({
        apply_request_id: selected.id,
        user_id: selected.user_id,
        job_title: selected.job_title,
        verification_code: selected.verification_code || null,
        status: "pending",
        expires_at: expiresAt,
      })
      .select()
      .single();

    setOtpRequest(newOtp);
    setRequestingOtp(false);

    // 3. Start countdown timer (3 min = 180s)
    setOtpTimer(180);
    const countdown = setInterval(() => {
      setOtpTimer(prev => {
        if (prev <= 1) { clearInterval(countdown); return 0; }
        return prev - 1;
      });
    }, 1000);

    // 4. Poll every 3s for user's OTP response
    const poll = setInterval(async () => {
      if (!newOtp) { clearInterval(poll); return; }
      const { data } = await supabase
        .from("otp_requests")
        .select("*")
        .eq("id", newOtp.id)
        .single();
      if (data?.status === "fulfilled") {
        setOtpRequest(data);
        clearInterval(poll);
      }
      // Stop polling after 3 min
      if (new Date() > new Date(expiresAt)) {
        clearInterval(poll);
        await supabase.from("otp_requests").update({ status: "expired" }).eq("id", newOtp.id);
      }
    }, 3000);
  };

  const handleReceiptUpload = async (file: File) => {
    if (!selected) return;
    setUploadingReceipt(true);
    const path = `receipts/${selected.id}/${file.name}`;
    await supabase.storage.from("student-documents").upload(path, file, { upsert: true });
    const { data } = supabase.storage.from("student-documents").getPublicUrl(path);
    
    await supabase
      .from("apply_for_me_requests")
      .update({ final_receipt_url: data.publicUrl, status: "completed" })
      .eq("id", selected.id);

    setSelected((prev: any) => ({ ...prev, final_receipt_url: data.publicUrl }));
    setNewStatus("completed");
    setUploadingReceipt(false);
    fetchRequests();
  };

  const handleDeleteRequest = async () => {
    if (!selected || currentUserRole !== 'super_admin') return;
    
    if (confirm(`Are you absolutely sure you want to delete this request from ${selected.applicant_name}? This action cannot be undone.`)) {
      setSaving(true);
      await supabase.from("apply_for_me_requests").delete().eq("id", selected.id);
      
      // Optionally delete their documents from storage too
      if (selected.user_id) {
        // We won't delete user docs right now to avoid data loss if they used it elsewhere, 
        // but we delete the request record.
      }
      
      setSaving(false);
      setSelected(null);
      fetchRequests();
    }
  };

  const exportToCSV = () => {
    if (requests.length === 0) return;
    const headers = ["ID", "Student Name", "Email", "Phone", "Job Title", "Status", "Assigned To", "Admin Notes", "Date Submitted"];
    
    // For Form Fillers, only export their own requests. For admins, export all filtered ones.
    const dataToExport = currentUserRole === 'form_filler' ? filtered : requests;
    
    const rows = dataToExport.map(r => [
      r.id, 
      `"${r.applicant_name}"`, 
      r.email, 
      r.phone_number, 
      `"${r.job_title}"`, 
      r.status, 
      r.assigned_to || 'Unassigned', 
      `"${(r.admin_notes || '').replace(/"/g, '""')}"`, 
      new Date(r.created_at).toLocaleString("en-IN")
    ]);
    
    const csvContent = [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `applications_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const stats = {
    total:       requests.length,
    pending:     requests.filter(r => r.status === "pending" || r.status === "paid").length,
    in_progress: requests.filter(r => r.status === "in_progress").length,
    completed:   requests.filter(r => r.status === "completed").length,
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-6">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white flex items-center gap-3">
              <ClipboardCheck className="w-8 h-8 text-indigo-500" /> Apply For Me — Requests
            </h1>
            <p className="text-gray-500 mt-1">Student ki requests dekho, form bharo, receipt upload karo</p>
          </div>
          <div className="flex items-center gap-3">
            {(currentUserRole === 'super_admin' || currentUserRole === 'admin') && (
              <button onClick={exportToCSV} className="flex items-center gap-2 px-4 py-2 bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-200 dark:border-indigo-800 rounded-xl text-sm font-bold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 transition-all">
                <FileDown className="w-4 h-4" /> Export CSV
              </button>
            )}
            <button onClick={fetchRequests} className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-bold text-gray-600 dark:text-gray-400 hover:bg-gray-50 transition-all">
              <RefreshCw className="w-4 h-4" /> Refresh
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Total Requests", value: stats.total, color: "indigo" },
            { label: "Pending",        value: stats.pending, color: "amber" },
            { label: "In Progress",    value: stats.in_progress, color: "blue" },
            { label: "Completed",      value: stats.completed, color: "green" },
          ].map(s => (
            <div key={s.label} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5 shadow-sm">
              <p className="text-3xl font-extrabold text-gray-900 dark:text-white">{s.value}</p>
              <p className="text-sm text-gray-500 font-medium mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Filter Tabs & Assign Button */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <div className="flex bg-gray-200/50 dark:bg-gray-800 rounded-xl p-1 w-full md:w-auto overflow-x-auto">
            <button onClick={() => setServiceType("all")} className={`px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap transition-all ${serviceType === "all" ? "bg-white dark:bg-gray-700 shadow text-gray-900 dark:text-white" : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"}`}>
              🌍 All Applications
            </button>
            <button onClick={() => setServiceType("sarkari")} className={`px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap transition-all ${serviceType === "sarkari" ? "bg-white dark:bg-gray-700 shadow text-orange-600 dark:text-orange-400" : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"}`}>
              🏛️ Sarkari Jobs
            </button>
            <button onClick={() => setServiceType("esuvidha")} className={`px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap transition-all ${serviceType === "esuvidha" ? "bg-white dark:bg-gray-700 shadow text-indigo-600 dark:text-indigo-400" : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"}`}>
              📱 E-Suvidha Services
            </button>
          </div>
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="flex gap-2 flex-wrap">
            {["all", "pending", "in_progress", "needs_info", "completed", "refund_pending", "rejected"].map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-xl text-sm font-bold transition-all capitalize ${filter === f ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/30" : "bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50"}`}>
                {f === "all" ? "All Status" : STATUS_CONFIG[f]?.label}
              </button>
            ))}
          </div>

          {currentUserRole === 'form_filler' && (
            <button onClick={handleAssignNewForm} className="flex items-center justify-center gap-2 px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold shadow-lg shadow-green-500/30 transition-all animate-pulse hover:animate-none">
              <HandHeart className="w-5 h-5" /> Get Next Form To Fill
            </button>
          )}
        </div>

        {/* Requests Table */}
        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-10 h-10 text-indigo-500 animate-spin" /></div>
        ) : filtered.length === 0 ? (
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-16 text-center">
            <ClipboardCheck className="w-14 h-14 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 font-bold">Koi request nahi mili</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(req => {
              const cfg = STATUS_CONFIG[req.status] || STATUS_CONFIG.pending;
              return (
                <div key={req.id} onClick={() => openRequest(req)}
                  className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm p-5 cursor-pointer hover:border-indigo-300 dark:hover:border-indigo-700 hover:shadow-md transition-all">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 flex-wrap">
                        <h3 className="font-extrabold text-gray-900 dark:text-white truncate">{req.job_title}</h3>
                        <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${cfg.bg} ${cfg.color}`}>
                          {cfg.label}
                        </span>
                        {req.receipt_url && (
                          <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-green-100 text-green-700">
                            📎 Receipt Ready
                          </span>
                        )}
                        {req.assigned_to && currentUserRole !== 'form_filler' && (
                          <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 flex items-center gap-1 border border-purple-200 dark:border-purple-800">
                            <User className="w-3 h-3" /> Assigned to: {req.assigned_to.split('@')[0]}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 mt-2 flex-wrap text-sm text-gray-500">
                        <span className="flex items-center gap-1"><User className="w-4 h-4" />{req.applicant_name}</span>
                        <span className="flex items-center gap-1"><Phone className="w-4 h-4" />{req.phone_number}</span>
                        <span className="flex items-center gap-1"><Mail className="w-4 h-4" />{req.email}</span>
                      </div>
                      <p className="text-xs text-gray-400 mt-1">
                        Submitted: {new Date(req.created_at).toLocaleString("en-IN")}
                      </p>

                      {/* Role-based info row */}
                      {currentUserRole === "super_admin" && req.tracking_id && (
                        <p className="text-xs mt-1">
                          Tracking: <span className="font-extrabold text-indigo-600 dark:text-indigo-400 font-mono">{req.tracking_id}</span>
                        </p>
                      )}
                      {currentUserRole === "form_filler" && req.verification_code && (
                        <p className="text-xs mt-1 text-red-600 dark:text-red-400 font-bold">
                          🔐 Secret Code: <span className="font-mono font-extrabold tracking-widest">{req.verification_code}</span>
                          <span className="text-gray-400 font-normal ml-2">(Call verify karne ke liye)</span>
                        </p>
                      )}
                    </div>
                    <div className="text-indigo-500 font-bold text-sm shrink-0">View →</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Detail Modal */}
        {selected && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
                <h2 className="text-xl font-extrabold text-gray-900 dark:text-white">Request Details</h2>
                <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600 text-2xl font-bold">×</button>
              </div>

              <div className="p-6 space-y-5">

                {/* Student Info */}
                <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-5 space-y-3">
                  <h3 className="font-bold text-gray-900 dark:text-white text-sm uppercase tracking-wider">Student Information</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div><p className="text-gray-400 text-xs">Full Name</p><p className="font-bold text-gray-900 dark:text-white">{selected.applicant_name}</p></div>
                    <div><p className="text-gray-400 text-xs">Mobile</p><p className="font-bold text-gray-900 dark:text-white">{selected.phone_number}</p></div>
                    <div><p className="text-gray-400 text-xs">Email</p><p className="font-bold text-gray-900 dark:text-white">{selected.email}</p></div>
                    <div><p className="text-gray-400 text-xs">Submitted</p><p className="font-bold text-gray-900 dark:text-white">{new Date(selected.created_at).toLocaleString("en-IN")}</p></div>

                    {/* Super admin: tracking ID */}
                    {currentUserRole === "super_admin" && selected.tracking_id && (
                      <div className="col-span-2 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-700 rounded-xl px-3 py-2">
                        <p className="text-gray-400 text-xs">Tracking ID</p>
                        <p className="font-extrabold text-indigo-700 dark:text-indigo-300 font-mono text-base">{selected.tracking_id}</p>
                      </div>
                    )}

                    {/* Form filler: only secret code, no tracking ID */}
                    {currentUserRole === "form_filler" && selected.verification_code && (
                      <div className="col-span-2 bg-red-50 dark:bg-red-900/20 border-2 border-red-300 dark:border-red-600 rounded-xl px-3 py-2">
                        <p className="text-[10px] font-extrabold text-red-500 uppercase tracking-wider">🔐 Secret Verification Code</p>
                        <p className="font-extrabold text-red-700 dark:text-red-300 font-mono text-xl tracking-widest mt-1">{selected.verification_code}</p>
                        <p className="text-[10px] text-red-500 mt-1">Jab user call kare, pehle aap yeh code bolo — tab woh OTP share karega.</p>
                      </div>
                    )}
                    {selected.assigned_to && currentUserRole !== 'form_filler' && (
                      <div className="col-span-2 mt-2 bg-purple-50 dark:bg-purple-900/20 border border-purple-100 dark:border-purple-800 p-3 rounded-xl">
                        <p className="text-purple-600 dark:text-purple-400 text-xs font-bold mb-1">Form Filler / Assigned To:</p>
                        <p className="font-extrabold text-purple-900 dark:text-purple-300 flex items-center gap-2">
                          <User className="w-4 h-4" /> {selected.assigned_to}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Job Info */}
                <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl p-5">
                  <h3 className="font-bold text-indigo-900 dark:text-indigo-300 text-sm mb-2">Job / Service Details</h3>
                  <p className="font-extrabold text-gray-900 dark:text-white">{selected.job_title}</p>
                  {selected.job_url && (
                    <a href={selected.job_url} target="_blank" rel="noopener noreferrer"
                      className="text-indigo-600 text-sm font-bold flex items-center gap-1 mt-1 hover:underline">
                      <ExternalLink className="w-4 h-4" /> Job Link Kholein
                    </a>
                  )}
                  
                  {eSuvidhaData && (
                    <div className="mt-4 pt-4 border-t border-indigo-200 dark:border-indigo-800">
                      <h4 className="text-xs font-bold text-indigo-800 dark:text-indigo-400 mb-2 uppercase tracking-wider">E-Suvidha Extra Details</h4>
                      <div className="space-y-1.5">
                        {eSuvidhaData.split('\n').map((line, i) => {
                          const [key, ...valParts] = line.split(':');
                          if (!key || !valParts.length) return null;
                          return (
                            <div key={i} className="text-sm">
                              <span className="font-bold text-gray-700 dark:text-gray-300">{key}:</span> 
                              <span className="text-gray-900 dark:text-white ml-1">{valParts.join(':')}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* Student Documents - Direct Download */}
                <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-5">
                  <h3 className="font-bold text-gray-900 dark:text-white text-sm mb-3">📁 Student Documents</h3>
                  {!selected.user_id ? (
                    <p className="text-xs text-gray-400">Ye ek dummy request hai, documents available nahi hain.</p>
                  ) : docsLoading ? (
                    <div className="flex items-center gap-2 text-gray-400 text-sm">
                      <Loader2 className="w-4 h-4 animate-spin" /> Loading documents...
                    </div>
                  ) : studentDocs.length === 0 ? (
                    <p className="text-xs text-amber-600 font-bold">⚠️ Student ne abhi tak koi document upload nahi kiya hai.</p>
                  ) : (
                    <div className="space-y-2">
                      {studentDocs.map(doc => {
                        const docLabels: Record<string, string> = {
                          photo: "🖼️ Passport Photo",
                          signature: "✍️ Signature",
                          aadhar: "🪪 Aadhar Card",
                          marksheet_10: "📄 10th Marksheet",
                          marksheet_12: "📄 12th Marksheet",
                        };
                        const key = doc.name.split(".")[0];
                        const label = docLabels[key] || doc.name;
                        return (
                          <a key={doc.name} href={doc.url} target="_blank" rel="noopener noreferrer"
                            className="flex items-center justify-between p-3 bg-white dark:bg-gray-700 rounded-xl border border-gray-200 dark:border-gray-600 hover:border-indigo-400 transition-all group">
                            <span className="text-sm font-bold text-gray-800 dark:text-white">{label}</span>
                            <span className="text-xs font-bold text-indigo-600 group-hover:underline flex items-center gap-1">
                              <ExternalLink className="w-3.5 h-3.5" /> View / Download
                            </span>
                          </a>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Status Update */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Status Update Karo</label>
                  <select value={newStatus} onChange={e => setNewStatus(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm">
                    <option value="pending">⏳ Pending</option>
                    <option value="in_progress">🔄 In Progress</option>
                    <option value="needs_info">⚠️ Needs Info (Document Missing)</option>
                    <option value="completed">✅ Completed</option>
                    <option value="refund_pending">💸 Refund Pending (Can't Fill Form)</option>
                    <option value="rejected">❌ Rejected</option>
                  </select>
                </div>

                {/* Admin Note */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                    <MessageSquare className="w-4 h-4 inline mr-1" /> Admin Note (Student ko dikhega)
                  </label>
                  <textarea value={adminNote} onChange={e => setAdminNote(e.target.value)} rows={3}
                    className={`w-full px-4 py-3 border ${(newStatus === 'needs_info' || newStatus === 'refund_pending') && !adminNote ? 'border-red-400 ring-2 ring-red-200' : 'border-gray-200 dark:border-gray-700'} rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500`}
                    placeholder={newStatus === 'needs_info' ? "Zaroori: Likhye ki kaunsa document missing hai (e.g., Aadhar blur hai)..." : newStatus === 'refund_pending' ? "Reason for refund (e.g., Server error, Age limit cross)..." : "e.g. Form fill ho gaya, receipt download karein..."} />
                  {(newStatus === 'needs_info' || newStatus === 'refund_pending') && !adminNote && (
                    <p className="text-xs font-bold text-red-500 mt-1">Please provide a valid note explaining the reason.</p>
                  )}
                </div>

                {/* Receipt Upload */}
                <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-2xl p-5 text-center">
                  <FileDown className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <h4 className="font-bold text-gray-900 dark:text-white mb-1">Form Confirmation / Receipt Upload</h4>
                  <p className="text-xs text-gray-500 mb-4">Form fill karne ke baad confirmation ya screenshot yahan upload karo. Student apne dashboard se download kar sakta hai.</p>
                  
                  {selected.final_receipt_url ? (
                    <div className="space-y-3">
                      <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 rounded-xl p-3">
                        <p className="text-green-700 font-bold text-sm">✅ Receipt Uploaded!</p>
                        <a href={selected.final_receipt_url} target="_blank" rel="noopener noreferrer"
                          className="text-indigo-600 text-xs font-bold underline break-all">{selected.final_receipt_url}</a>
                      </div>
                      <label className="cursor-pointer text-sm font-bold text-gray-500 hover:text-indigo-600">
                        Replace Receipt
                        <input type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png"
                          onChange={e => { const f = e.target.files?.[0]; if (f) handleReceiptUpload(f); }} />
                      </label>
                    </div>
                  ) : (
                    <label className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-sm cursor-pointer transition-all">
                      {uploadingReceipt ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                      {uploadingReceipt ? "Uploading..." : "Receipt Upload Karo"}
                      <input type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png"
                        onChange={e => { const f = e.target.files?.[0]; if (f) handleReceiptUpload(f); }} />
                    </label>
                  )}
                </div>

              </div>

              {/* ── IN-APP OTP SECTION ── */}
              <div className="p-5 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                <p className="text-xs font-extrabold text-gray-500 uppercase tracking-wider mb-3">🔐 User se OTP Maango (In-App)</p>

                {/* OTP received! Show it prominently */}
                {otpRequest?.status === "fulfilled" && (
                  <div className="bg-green-50 dark:bg-green-900/20 border-2 border-green-400 rounded-2xl p-4 mb-3 text-center">
                    <p className="text-xs font-extrabold text-green-600 uppercase tracking-wider mb-1">✅ OTP Mil Gaya!</p>
                    <p className="text-4xl font-extrabold font-mono text-green-700 dark:text-green-300 tracking-[0.3em]">
                      {otpRequest.otp_value}
                    </p>
                    <p className="text-xs text-green-500 mt-1">Abhi portal par enter karo — jaldi!</p>
                  </div>
                )}

                {/* Waiting for OTP */}
                {otpRequest?.status === "pending" && (
                  <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-300 rounded-xl p-3 mb-3 flex items-center gap-3">
                    <Loader2 className="w-5 h-5 text-amber-500 animate-spin shrink-0" />
                    <div>
                      <p className="text-xs font-extrabold text-amber-700 dark:text-amber-300">User se OTP ka wait kar rahe hain...</p>
                      <p className="text-xs text-amber-500">
                        Expires in: {Math.floor(otpTimer / 60)}:{String(otpTimer % 60).padStart(2, "0")}
                      </p>
                    </div>
                  </div>
                )}

                {/* Expired */}
                {otpRequest?.status === "expired" && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-3">
                    <p className="text-xs font-bold text-red-600">⏰ OTP request expire ho gayi. User ne respond nahi kiya. Dobara try karo.</p>
                  </div>
                )}

                {/* Request button */}
                {(!otpRequest || otpRequest.status === "expired") && (
                  <button onClick={handleRequestOtp} disabled={requestingOtp || !selected?.user_id}
                    className="w-full py-2.5 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2">
                    {requestingOtp
                      ? <><Loader2 className="w-4 h-4 animate-spin" /> Bhej rahe hain...</>
                      : <>🔔 User se OTP Maango</>
                    }
                  </button>
                )}
                <p className="text-[10px] text-gray-400 mt-2 text-center">
                  User ke dashboard par ek live alert aayega — woh OTP enter karenge, aapko yahan dikhe ga.
                </p>
              </div>

              <div className="p-6 border-t border-gray-100 dark:border-gray-800 flex gap-3">
                {currentUserRole === 'super_admin' && (
                  <button onClick={handleDeleteRequest} disabled={saving}
                    className="px-4 py-3 rounded-xl border border-red-200 dark:border-red-800/30 text-red-600 dark:text-red-400 font-bold bg-red-50 hover:bg-red-100 dark:bg-red-900/10 dark:hover:bg-red-900/20 transition-all flex items-center justify-center disabled:opacity-70">
                    <Trash2 className="w-5 h-5" />
                  </button>
                )}
                <button onClick={() => setSelected(null)}
                  className="flex-1 py-3 rounded-xl border border-gray-200 dark:border-gray-700 font-bold text-gray-600 dark:text-gray-400 hover:bg-gray-50 transition-all">
                  Cancel
                </button>
                <button onClick={handleSave} disabled={saving || ((newStatus === 'needs_info' || newStatus === 'refund_pending') && !adminNote.trim())}
                  className="flex-[2] py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-lg shadow-indigo-500/30 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  Save Changes
                </button>
              </div>

            </div>
          </div>
        )}

      </div>
    </div>
  );
}
