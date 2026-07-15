"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { supabase } from "@/lib/supabase";
import { 
  ClipboardCheck, Clock, CheckCircle2, Loader2, 
  User, Phone, Mail, ExternalLink, Upload, 
  MessageSquare, RefreshCw, FileDown, HandHeart, Trash2, Lock,
  Sparkles
} from "lucide-react";

const parseCandidateData = (req: any, esuvidhaText: string) => {
  const candidate = {
    name: req.applicant_name || "",
    dob: "",
    father: "",
    roll: ""
  };

  const fullText = `${req.admin_notes || ""} \n ${esuvidhaText || ""}`;
  const lines = fullText.split('\n');

  lines.forEach(line => {
    const lower = line.toLowerCase().trim();
    
    if (lower.includes("dob:") || lower.includes("date of birth:") || lower.includes("birth date:")) {
      const parts = line.split(':');
      if (parts[1]) candidate.dob = parts[1].trim();
    }
    
    if (lower.includes("father:") || lower.includes("fathers name:") || lower.includes("father's name:")) {
      const parts = line.split(':');
      if (parts[1]) candidate.father = parts[1].trim();
    }

    if (lower.includes("roll:") || lower.includes("roll no:") || lower.includes("roll number:") || lower.includes("roll_no:")) {
      const parts = line.split(':');
      if (parts[1]) {
        candidate.roll = parts[1].replace(/[^a-zA-Z0-9\s-]/g, '').trim();
      }
    }
  });

  // Fallbacks
  if (!candidate.dob) {
    const dobLine = lines.find(l => l.toLowerCase().includes("dob") || l.toLowerCase().includes("date of birth"));
    if (dobLine) {
      const parts = dobLine.split(':');
      if (parts[1]) candidate.dob = parts[1].trim();
    }
  }

  if (!candidate.father) {
    const fatherLine = lines.find(l => l.toLowerCase().includes("father"));
    if (fatherLine) {
      const parts = fatherLine.split(':');
      if (parts[1]) candidate.father = parts[1].trim();
    }
  }

  if (!candidate.roll) {
    const rollLine = lines.find(l => l.toLowerCase().includes("roll"));
    if (rollLine) {
      const parts = rollLine.split(':');
      if (parts[1]) candidate.roll = parts[1].replace(/[^a-zA-Z0-9\s-]/g, '').trim();
    }
  }

  return candidate;
};

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
  const [token, setToken] = useState("");
  // OTP system
  const [otpRequest, setOtpRequest] = useState<any>(null);
  const [otpTimer, setOtpTimer] = useState(0);
  const [requestingOtp, setRequestingOtp] = useState(false);

  // WhatsApp Assistant states
  const [whatsappPreviewText, setWhatsappPreviewText] = useState("");
  const [activePreset, setActivePreset] = useState("");

  const [serviceType, setServiceType] = useState("all"); // all | sarkari | esuvidha

  const handleSelectWhatsappPreset = (preset: string, req: any) => {
    if (!req) return;
    const name = req.applicant_name || "Candidate";
    const jobTitle = req.job_title || "Form Filling Service";
    let text = "";

    if (preset === "in_progress") {
      text = `Hi ${name}, main Rojgar Suvidha se bol raha hoon. Aapke "${jobTitle}" ka form humne bharna shuru kar diya hai! Form bharne ke aakhri step par OTP ki zaroorat padegi, isliye kripya apna phone apne paas rakhein aur alert rahein taaki OTP aate hi aap portal par daal sakein ya hume bata sakein taaki form filling bina delay complete ho sake. Dhanyawad!`;
    } else if (preset === "needs_info") {
      text = `Hi ${name}, aapke "${jobTitle}" form filling ke liye kuch documents/details clear nahi hain ya missing hain.

Kripya direct apne dashboard ya tracking page par visit karke corrected file upload kar dein ya hume WhatsApp par reply karein taaki hum form jaldi complete kar sakein. Dhanyawad!`;
    } else if (preset === "otp_alert") {
      text = `Hi ${name}, aapke "${jobTitle}" ke verification ke liye portal se ek OTP bheja gaya hai. Kripya correct OTP yahan WhatsApp par send karein ya direct portal dashboard par verify karein taaki completion delay na ho. Dhanyawad!`;
    } else if (preset === "success") {
      const receiptLink = req.final_receipt_url || "";
      text = `Congratulations ${name}! 🎉 Aapka "${jobTitle}" ka form successfully fill aur submit ho gaya hai.

Aap final receipt yahan se download kar sakte hain: ${receiptLink || "Rojgar Suvidha App dashboard se"}. Dhanyawad!`;
    }
    
    setActivePreset(preset);
    setWhatsappPreviewText(text);
  };

  const handleSendWhatsapp = (req: any) => {
    if (!req || !whatsappPreviewText.trim()) return;
    const rawPhone = req.phone_number || "";
    const cleanPhone = rawPhone.replace(/\D/g, "");
    const finalPhone = cleanPhone.startsWith("91") ? cleanPhone : `91${cleanPhone}`;
    const encodedText = encodeURIComponent(whatsappPreviewText.trim());
    window.open(`https://wa.me/${finalPhone}?text=${encodedText}`, "_blank");
  };

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setToken(session.access_token);
        if (session.user.email) {
          setCurrentUserEmail(session.user.email);
          
          // Fetch role from profiles
          const { data: profile } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", session.user.id)
            .single();
            
          if (profile?.role) {
            setCurrentUserRole(profile.role);
          }
          // Fallback for primary owner
          if (session.user.email === 'admin@rojgarsuvidha.com' || session.user.email === 'superadmin@rojgarsuvidha.com') {
             setCurrentUserRole('super_admin');
          }
        }
      }
      fetchRequests();
    };
    init();
  }, []);

  const getDocUrl = (url: string) => {
    if (!url) return "";
    if (url.startsWith("http")) return url;
    return `${url}&token=${token}`;
  };

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
      
      toast.success(`Great! A new form (${data.job_title}) has been assigned to you.`);
      fetchRequests();
    } else {
      toast.error("No pending forms available right now!");
      setLoading(false);
    }
  };

  const openRequest = async (req: any) => {
    setSelected(req);
    setNewStatus(req.status);
    setStudentDocs([]);
    setESuvidhaData("");
    setWhatsappPreviewText("");
    setActivePreset("");

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
          const idx = line.indexOf(': ');
          if (idx !== -1) {
            const urlVal = line.substring(idx + 2).trim();
            if (urlVal.startsWith('http') || urlVal.startsWith('/api/locker/view')) {
              esDocs.push({ name: line.substring(0, idx).trim(), url: urlVal });
            }
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

    const { error } = await supabase
      .from("apply_for_me_requests")
      .update({ status: newStatus, admin_notes: finalNote })
      .eq("id", selected.id);

    if (error) {
      toast.error(`Status update failed: ${error.message}`);
    } else {
      // Send Web Push notification if status changed (works even when user's browser is closed)
      try {
        const statusLabels: Record<string, string> = {
          pending: "Pending / Waiting",
          paid: "Payment Received",
          submitted: "Form Submitted",
          needs_info: "Action Required / Missing Info",
          completed: "Completed Successfully",
          refund_pending: "Refund Pending"
        };
        const label = statusLabels[newStatus] || newStatus;

        let pushTitle = `📋 Status Update: ${selected.job_title}`;
        let pushBody = `Aapki application ka status ab "${label}" ho gaya hai.`;
        if (newStatus === "completed") {
          pushTitle = "🎉 Application Completed!";
          pushBody = `Badhai Ho! Aapka form "${selected.job_title}" successfully fill ho gaya hai. Receipt download karein.`;
        } else if (newStatus === "needs_info") {
          pushTitle = "⚠️ Action Required";
          pushBody = `Attention: Aapke form "${selected.job_title}" ke liye kuch documents pending hain. Kripya check karein.`;
        }

        await fetch("/api/push", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "send_to_user",
            userId: selected.user_id,
            payload: {
              title: pushTitle,
              body: pushBody,
              url: "/dashboard",
              icon: "/logo-blue.png"
            }
          })
        });
      } catch (pushErr) {
        console.error("Status push notification failed:", pushErr);
      }

      setSelected(null);
      fetchRequests();
    }
    setSaving(false);
  };

  // OTP Request — sends in-app OTP request to user
  const handleRequestOtp = async () => {
    if (!selected) return;
    setRequestingOtp(true);
    setOtpRequest(null);

    let newOtp = null;
    const expiresAt = new Date(Date.now() + 3 * 60 * 1000).toISOString();

    try {
      // 1. Mark request as in_progress so user dashboard shows live alert
      const { error: err1 } = await supabase.from("apply_for_me_requests")
        .update({ status: "in_progress" })
        .eq("id", selected.id);

      if (err1) throw err1;
      setNewStatus("in_progress");

      // 2. Insert OTP request record
      const { data, error: err2 } = await supabase
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

      if (err2) throw err2;
      newOtp = data;

      setOtpRequest(newOtp);

      // Send Web Push notification for OTP Request (works even when user's browser is closed)
      try {
        await fetch("/api/push", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "send_to_user",
            userId: selected.user_id,
            payload: {
              title: "🔑 OTP Required - Rojgar Suvidha",
              body: `Form verification ke liye OTP chahiye. Secret trust code: ${selected.verification_code || "None"}.`,
              url: "/dashboard",
              icon: "/logo-blue.png",
              requireInteraction: true
            }
          })
        });
      } catch (pushErr) {
        console.error("OTP request push notification failed:", pushErr);
      }
    } catch (err: any) {
      console.error("OTP Request failed:", err);
      toast.error(`OTP Request failed: ${err.message}`);
      setRequestingOtp(false);
      return;
    }

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
    
    if (window.confirm(`Are you absolutely sure you want to delete this request from ${selected.applicant_name}? This action cannot be undone.`)) {
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
    <div className="min-h-screen bg-gray-50 dark:bg-[#000000] p-6">
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
            <button onClick={fetchRequests} className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl text-sm font-bold text-gray-600 dark:text-gray-400 hover:bg-gray-50 transition-all">
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
            <div key={s.label} className="bg-white dark:bg-zinc-950 rounded-2xl border border-gray-200 dark:border-zinc-900 p-5 shadow-sm">
              <p className="text-3xl font-extrabold text-gray-900 dark:text-white">{s.value}</p>
              <p className="text-sm text-gray-500 font-medium mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Filter Tabs & Assign Button */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <div className="flex bg-gray-200/50 dark:bg-zinc-900 rounded-xl p-1 w-full md:w-auto overflow-x-auto">
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
                className={`px-4 py-2 rounded-xl text-sm font-bold transition-all capitalize ${filter === f ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/30" : "bg-white dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50"}`}>
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
          <div className="bg-white dark:bg-zinc-950 rounded-2xl border border-gray-200 dark:border-zinc-900 p-16 text-center">
            <ClipboardCheck className="w-14 h-14 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 font-bold">Koi request nahi mili</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(req => {
              const cfg = STATUS_CONFIG[req.status] || STATUS_CONFIG.pending;
              return (
                <div key={req.id} onClick={() => openRequest(req)}
                  className="bg-white dark:bg-zinc-950 rounded-2xl border border-gray-200 dark:border-zinc-900 shadow-sm p-5 cursor-pointer hover:border-indigo-300 dark:hover:border-indigo-700 hover:shadow-md transition-all">
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

        {/* ── 2-COLUMN COMMAND CENTER MODAL ── */}
        {selected && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-2 sm:p-6">
            <div className="bg-white dark:bg-[#000000] border dark:border-zinc-800 rounded-[2rem] shadow-2xl w-full max-w-6xl max-h-[95vh] overflow-hidden flex flex-col relative animate-in fade-in zoom-in-95 duration-200">
              
              {/* Header */}
              <div className="px-8 py-5 border-b border-gray-100 dark:border-zinc-900 flex items-center justify-between bg-white/50 dark:bg-[#000000]/50 backdrop-blur-xl shrink-0">
                <div>
                  <h2 className="text-xl font-black text-gray-900 dark:text-white">Form Filler Workspace</h2>
                  <p className="text-xs font-bold text-gray-500 mt-0.5">Application ID: {selected.id}</p>
                </div>
                <button onClick={() => setSelected(null)} className="w-10 h-10 flex items-center justify-center bg-gray-100 dark:bg-zinc-900 hover:bg-gray-200 dark:hover:bg-zinc-800 text-gray-500 rounded-full transition-all text-xl font-bold">×</button>
              </div>

              {/* 2-Column Content */}
              <div className="flex flex-col lg:flex-row flex-1 overflow-hidden">
                
                {/* LEFT COLUMN: Data & Docs (Scrollable) */}
                <div className="flex-1 overflow-y-auto p-8 border-r border-gray-100 dark:border-zinc-900 space-y-8 custom-scrollbar">
                  
                  {/* Job Details */}
                  <div>
                    <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Service Details</h3>
                    <div className="bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/50 rounded-2xl p-5">
                      <p className="text-xl font-black text-gray-900 dark:text-white leading-tight">{selected.job_title}</p>
                      {selected.job_url && (
                        <a href={selected.job_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 mt-3 text-sm font-bold text-indigo-600 dark:text-indigo-400 hover:underline bg-indigo-100 dark:bg-indigo-900/40 px-3 py-1.5 rounded-lg">
                          <ExternalLink className="w-4 h-4" /> Open Original Post
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Student Info */}
                  <div>
                    <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Student Profile</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-gray-50 dark:bg-zinc-900 p-4 rounded-2xl">
                        <p className="text-[10px] font-bold text-gray-500 uppercase">Full Name</p>
                        <p className="font-bold text-gray-900 dark:text-white text-sm mt-0.5">{selected.applicant_name}</p>
                      </div>
                      <div className="bg-gray-50 dark:bg-zinc-900 p-4 rounded-2xl">
                        <p className="text-[10px] font-bold text-gray-500 uppercase">Mobile</p>
                        <p className="font-bold text-gray-900 dark:text-white text-sm mt-0.5">{selected.phone_number}</p>
                      </div>
                      <div className="bg-gray-50 dark:bg-zinc-900 p-4 rounded-2xl col-span-2 sm:col-span-1">
                        <p className="text-[10px] font-bold text-gray-500 uppercase">Email</p>
                        <p className="font-bold text-gray-900 dark:text-white text-sm mt-0.5 truncate">{selected.email}</p>
                      </div>
                      <div className="bg-gray-50 dark:bg-zinc-900 p-4 rounded-2xl col-span-2 sm:col-span-1">
                        <p className="text-[10px] font-bold text-gray-500 uppercase">Submitted At</p>
                        <p className="font-bold text-gray-900 dark:text-white text-sm mt-0.5">{new Date(selected.created_at).toLocaleString("en-IN")}</p>
                      </div>
                    </div>
                  </div>

                  {/* Sync Connector */}
                  <div className="bg-zinc-900 dark:bg-zinc-950 border border-zinc-800 rounded-2xl p-5 flex items-center justify-between">
                    <div>
                      <h4 className="text-white font-bold text-sm">Form Guard Sync</h4>
                      <p className="text-zinc-400 text-xs mt-0.5">AI powered autofill extension</p>
                    </div>
                    {(() => {
                      const candidateData = parseCandidateData(selected, eSuvidhaData);
                      return (
                        <>
                          <div id="rs-active-candidate-sync-data" data-candidate={JSON.stringify(candidateData)} className="hidden" />
                          <button id="rs-sync-form-guard-btn" type="button" className="px-5 py-2.5 bg-white hover:bg-gray-200 text-black font-extrabold text-sm rounded-xl flex items-center gap-2 transition-all">
                            <Sparkles className="w-4 h-4 text-indigo-600" /> Sync Details
                          </button>
                        </>
                      );
                    })()}
                  </div>

                  {/* Documents Viewer */}
                  <div>
                    <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Uploaded Documents</h3>
                    {!selected.user_id ? (
                      <div className="p-6 bg-gray-50 dark:bg-zinc-900/50 rounded-2xl text-center border border-dashed border-gray-200 dark:border-zinc-800">
                        <p className="text-xs font-bold text-gray-400">Dummy request (No docs)</p>
                      </div>
                    ) : docsLoading ? (
                      <div className="p-6 bg-gray-50 dark:bg-zinc-900/50 rounded-2xl flex items-center justify-center gap-2">
                        <Loader2 className="w-5 h-5 animate-spin text-indigo-500" /> <span className="text-sm font-bold text-gray-500">Loading vault...</span>
                      </div>
                    ) : studentDocs.length === 0 ? (
                      <div className="p-6 bg-amber-50 dark:bg-amber-950/20 rounded-2xl text-center border border-dashed border-amber-200 dark:border-amber-900/50">
                        <p className="text-sm font-bold text-amber-600">No documents uploaded</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {studentDocs.map(doc => {
                          const docLabels: Record<string, string> = { photo: "🖼️ Photo", signature: "✍️ Signature", aadhar: "🪪 Aadhar", marksheet_10: "📄 10th", marksheet_12: "📄 12th" };
                          const key = doc.name.split(".")[0];
                          const label = docLabels[key] || doc.name;
                          return (
                            <a key={doc.name} href={getDocUrl(doc.url)} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-4 bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 hover:border-indigo-400 transition-all group shadow-sm">
                              <span className="text-sm font-bold text-gray-800 dark:text-white">{label}</span>
                              <ExternalLink className="w-4 h-4 text-indigo-400 group-hover:text-indigo-600" />
                            </a>
                          );
                        })}
                      </div>
                    )}
                  </div>
                  
                  {eSuvidhaData && (
                    <div className="bg-gray-50 dark:bg-zinc-900 p-5 rounded-2xl">
                      <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">E-Suvidha Raw Data</h4>
                      <pre className="text-xs text-gray-600 dark:text-gray-300 whitespace-pre-wrap font-mono">{eSuvidhaData}</pre>
                    </div>
                  )}

                </div>

                {/* RIGHT COLUMN: Action Panel (Sticky) */}
                <div className="w-full lg:w-[420px] bg-gray-50 dark:bg-zinc-950/50 p-6 overflow-y-auto space-y-6">
                  
                  {/* Status Box */}
                  <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-gray-100 dark:border-zinc-800 shadow-sm">
                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Status Pipeline</label>
                    <select value={newStatus} onChange={e => setNewStatus(e.target.value)} className="w-full px-4 py-3 bg-gray-50 dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 rounded-xl text-sm font-bold text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500">
                      <option value="pending">⏳ Pending</option>
                      <option value="in_progress">🔄 In Progress (Active)</option>
                      <option value="needs_info">⚠️ Needs Info (Halted)</option>
                      <option value="completed">✅ Completed Successfully</option>
                      <option value="refund_pending">💸 Refund Pending</option>
                      <option value="rejected">❌ Rejected</option>
                    </select>

                    <div className="mt-4">
                      <label className="block text-[10px] font-bold text-gray-500 uppercase mb-2">Admin Note (Sent to student)</label>
                      <textarea value={adminNote} onChange={e => setAdminNote(e.target.value)} rows={2} placeholder="Explain reason if halted/rejected..." className="w-full p-3 bg-gray-50 dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 rounded-xl text-xs font-medium text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-indigo-500 custom-scrollbar" />
                    </div>
                  </div>

                  {/* OTP System */}
                  <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-gray-100 dark:border-zinc-800 shadow-sm">
                     <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2"><Lock className="w-4 h-4"/> Live Verification</label>
                     {currentUserRole === "form_filler" && selected.verification_code && (
                        <div className="bg-red-50 dark:bg-red-950/30 p-3 rounded-xl mb-4 border border-red-100 dark:border-red-900/50">
                          <p className="text-[10px] font-bold text-red-500 uppercase">Secret Call Code</p>
                          <p className="text-xl font-black font-mono text-red-600 dark:text-red-400 tracking-widest">{selected.verification_code}</p>
                        </div>
                     )}
                     
                     {otpRequest?.status === "fulfilled" ? (
                       <div className="bg-green-500 text-white rounded-xl p-4 text-center">
                         <p className="text-[10px] font-black uppercase tracking-wider mb-1">OTP Received</p>
                         <p className="text-3xl font-black font-mono tracking-[0.2em]">{otpRequest.otp_value}</p>
                       </div>
                     ) : otpRequest?.status === "pending" ? (
                       <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 rounded-xl p-4 flex gap-3">
                         <Loader2 className="w-5 h-5 text-amber-500 animate-spin shrink-0" />
                         <div>
                           <p className="text-xs font-bold text-amber-700 dark:text-amber-400">Waiting for user...</p>
                           <p className="text-[10px] font-bold text-amber-600 mt-1">Timeout: {Math.floor(otpTimer/60)}:{(otpTimer%60).toString().padStart(2,"0")}</p>
                         </div>
                       </div>
                     ) : (
                       <button onClick={handleRequestOtp} disabled={requestingOtp || !selected?.user_id} className="w-full py-3 bg-gray-900 dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-100 disabled:opacity-50 font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-all">
                         {requestingOtp ? <Loader2 className="w-4 h-4 animate-spin"/> : <Lock className="w-4 h-4" />} Send Push Notification for OTP
                       </button>
                     )}
                  </div>

                  {/* Receipt Box */}
                  <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-gray-100 dark:border-zinc-800 shadow-sm text-center">
                    {selected.final_receipt_url ? (
                      <div>
                        <div className="w-12 h-12 bg-green-100 dark:bg-green-900/40 text-green-600 rounded-full flex items-center justify-center mx-auto mb-3">
                          <CheckCircle2 className="w-6 h-6" />
                        </div>
                        <p className="text-sm font-bold text-gray-900 dark:text-white mb-3">Receipt Delivered</p>
                        <a href={selected.final_receipt_url} target="_blank" rel="noopener noreferrer" className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline break-all block mb-3 px-2">{selected.final_receipt_url}</a>
                        <label className="cursor-pointer text-[10px] font-bold text-gray-400 hover:text-indigo-500 uppercase tracking-widest">
                          Replace File <input type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png" onChange={e => { const f = e.target.files?.[0]; if(f) handleReceiptUpload(f); }} />
                        </label>
                      </div>
                    ) : (
                      <label className="cursor-pointer block">
                         <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-full flex items-center justify-center mx-auto mb-3 border border-indigo-100 dark:border-indigo-900/50">
                           {uploadingReceipt ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
                         </div>
                         <p className="text-sm font-bold text-indigo-600 dark:text-indigo-400">Upload Final Receipt</p>
                         <p className="text-[10px] text-gray-400 mt-1">Completes the pipeline</p>
                         <input type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png" onChange={e => { const f = e.target.files?.[0]; if(f) handleReceiptUpload(f); }} />
                      </label>
                    )}
                  </div>

                </div>
              </div>

              {/* Footer Actions */}
              <div className="p-5 border-t border-gray-100 dark:border-zinc-900 bg-gray-50 dark:bg-zinc-950/50 flex gap-3 shrink-0">
                {currentUserRole === 'super_admin' && (
                  <button onClick={handleDeleteRequest} disabled={saving} className="px-5 py-3 rounded-xl border border-red-200 dark:border-red-900/50 bg-white dark:bg-zinc-900 text-red-600 dark:text-red-500 font-bold hover:bg-red-50 transition-all flex items-center justify-center">
                    <Trash2 className="w-5 h-5" />
                  </button>
                )}
                <div className="flex-1" />
                <button onClick={() => setSelected(null)} className="px-6 py-3 rounded-xl font-bold text-gray-500 hover:bg-gray-200 dark:hover:bg-zinc-800 transition-all text-sm">Dismiss</button>
                <button onClick={handleSave} disabled={saving || ((newStatus === 'needs_info' || newStatus === 'refund_pending') && !adminNote.trim())} className="px-8 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-sm shadow-lg shadow-indigo-500/20 transition-all flex items-center gap-2">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />} Save Workspace
                </button>
              </div>

            </div>
          </div>
        )}
      </div>
    </div>
  );
}