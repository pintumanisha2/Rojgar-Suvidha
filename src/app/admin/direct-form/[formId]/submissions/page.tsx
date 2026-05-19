"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { ArrowLeft, Loader2, Download, Eye, User, FileText, Phone, Mail } from "lucide-react";
import Link from "next/link";

interface Submission {
  tracking_id: string;
  full_name: string;
  father_name: string;
  phone: string;
  email: string;
  dob: string;
  gender: string;
  category: string;
  selected_post_name: string;
  total_paid: number;
  payment_status: string;
  application_status: string;
  documents_urls: Record<string, string>;
  coupon_applied: string | null;
  created_at: string;
}

export default function FormSubmissionsPage() {
  const { formId } = useParams();
  const router = useRouter();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [formTitle, setFormTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Submission | null>(null);
  const [token, setToken] = useState("");

  useEffect(() => {
    if (!formId) return;
    
    // Fetch session token
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setToken(session.access_token);
    });

    Promise.all([
      supabase.from("custom_forms").select("title").eq("id", formId).single(),
      supabase.from("user_applications").select("*").eq("form_id", formId).order("created_at", { ascending: false })
    ]).then(([form, apps]) => {
      setFormTitle(form.data?.title || "Form");
      setSubmissions((apps.data as Submission[]) || []);
      setLoading(false);
    });
  }, [formId]);

  const getDocUrl = (url: string) => {
    if (!url) return "";
    if (url.startsWith("http")) return url; // Old public Supabase URL
    return `${url}&token=${token}`; // Secure API URL with token
  };

  function exportCSV() {
    const rows = [
      ["Tracking ID", "Name", "Father", "Phone", "Email", "DOB", "Gender", "Category", "Post", "Paid", "Status", "Date"],
      ...filtered.map(s => [
        s.tracking_id, s.full_name, s.father_name, s.phone, s.email,
        s.dob, s.gender, s.category, s.selected_post_name, s.total_paid,
        s.application_status, new Date(s.created_at).toLocaleDateString("en-IN")
      ])
    ];
    const csv = rows.map(r => r.map(c => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url;
    a.download = `${formTitle}_submissions.csv`; a.click();
  }

  const filtered = submissions.filter(s =>
    !search || s.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    s.phone?.includes(search) || s.tracking_id?.toLowerCase().includes(search.toLowerCase())
  );

  const totalRevenue = submissions.reduce((s, r) => s + (r.total_paid || 0), 0);

  const statusColors: Record<string, string> = {
    Received: "bg-yellow-100 text-yellow-700",
    Processing: "bg-blue-100 text-blue-700",
    Completed: "bg-green-100 text-green-700",
    Rejected: "bg-red-100 text-red-700",
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 flex-wrap">
        <Link href="/admin/direct-form" className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition">
          <ArrowLeft className="w-5 h-5 text-gray-500" />
        </Link>
        <div className="flex-1">
          <h2 className="text-xl font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
            <FileText className="h-6 w-6 text-indigo-500" />
            {formTitle} — Submissions
          </h2>
          <p className="text-sm text-gray-500">{submissions.length} total · ₹{totalRevenue.toLocaleString()} collected</p>
        </div>
        <button onClick={exportCSV} className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 py-2 rounded-xl transition-colors">
          <Download className="h-4 w-4" /> Export CSV
        </button>
      </div>

      {/* Search */}
      <input
        type="text"
        placeholder="Name, phone ya tracking ID se search karein..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="w-full px-4 py-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
      />

      {loading ? (
        <div className="py-20 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-indigo-500" /></div>
      ) : filtered.length === 0 ? (
        <div className="py-20 text-center text-gray-400">
          <FileText className="h-12 w-12 mx-auto mb-3 opacity-20" />
          <p>Koi submission nahi mili</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800">
                <tr>
                  {["#", "Applicant", "Post", "Paid", "Status", "Date", "Action"].map(h => (
                    <th key={h} className="px-4 py-3 text-xs font-bold text-gray-500 uppercase whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                {filtered.map((s, i) => (
                  <tr key={s.tracking_id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30">
                    <td className="px-4 py-3 text-xs text-gray-400">{i + 1}</td>
                    <td className="px-4 py-3">
                      <p className="text-sm font-bold text-gray-900 dark:text-white">{s.full_name}</p>
                      <p className="text-xs text-gray-400">{s.phone} · {s.tracking_id}</p>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600 dark:text-gray-400 max-w-[120px] truncate">{s.selected_post_name}</td>
                    <td className="px-4 py-3 text-sm font-bold text-gray-900 dark:text-white whitespace-nowrap">
                      {s.total_paid > 0 ? `₹${s.total_paid}` : <span className="text-blue-500 text-xs">FREE</span>}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-lg text-xs font-bold ${statusColors[s.application_status] || "bg-gray-100 text-gray-500"}`}>
                        {s.application_status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">
                      {new Date(s.created_at).toLocaleDateString("en-IN")}
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => setSelected(s)} className="p-2 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors">
                        <Eye className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setSelected(null)}>
          <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
                <User className="w-5 h-5 text-indigo-500" /> {selected.full_name}
              </h3>
              <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 text-2xl font-bold">×</button>
            </div>
            <div className="space-y-3 text-sm">
              {[
                ["Tracking ID", selected.tracking_id],
                ["Father's Name", selected.father_name],
                ["Phone", selected.phone],
                ["Email", selected.email],
                ["DOB", selected.dob],
                ["Gender", selected.gender],
                ["Category", selected.category],
                ["Post Applied", selected.selected_post_name],
                ["Amount Paid", selected.total_paid > 0 ? `₹${selected.total_paid}` : "FREE"],
                ["Coupon", selected.coupon_applied || "None"],
                ["Status", selected.application_status],
                ["Submitted On", new Date(selected.created_at).toLocaleString("en-IN")],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between py-2 border-b border-gray-50 dark:border-gray-800 gap-4">
                  <span className="text-gray-500 font-medium shrink-0">{label}</span>
                  <span className="font-bold text-gray-900 dark:text-white text-right">{value}</span>
                </div>
              ))}
              {selected.documents_urls && Object.keys(selected.documents_urls).length > 0 && (
                <div className="pt-2">
                  <p className="text-gray-500 font-bold mb-2">Documents:</p>
                  <div className="space-y-2">
                    {Object.entries(selected.documents_urls).map(([doc, url]) => (
                      <a key={doc} href={getDocUrl(url)} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-2 text-indigo-600 hover:underline">
                        <FileText className="w-4 h-4" /> {doc}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
