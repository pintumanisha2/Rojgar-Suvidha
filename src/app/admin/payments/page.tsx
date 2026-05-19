"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  IndianRupee, TrendingUp, Users, FileText, Download,
  CreditCard, ArrowUpRight, ArrowDownRight, Loader2, CheckCircle2, Clock, XCircle
} from "lucide-react";

interface Payment {
  tracking_id: string;
  full_name: string;
  phone: string;
  email: string;
  total_paid: number;
  payment_status: string;
  application_status: string;
  coupon_applied: string | null;
  created_at: string;
  form_id: string;
}

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    fetchPayments();
  }, []);

  async function fetchPayments() {
    setLoading(true);
    const { data } = await supabase
      .from("user_applications")
      .select("tracking_id,full_name,phone,email,total_paid,payment_status,application_status,coupon_applied,created_at,form_id")
      .order("created_at", { ascending: false });
    setPayments((data as Payment[]) || []);
    setLoading(false);
  }

  function exportCSV() {
    const rows = [
      ["Tracking ID", "Name", "Phone", "Email", "Amount", "Payment", "Status", "Coupon", "Date"],
      ...filtered.map(p => [
        p.tracking_id, p.full_name, p.phone, p.email,
        p.total_paid, p.payment_status, p.application_status,
        p.coupon_applied || "", new Date(p.created_at).toLocaleDateString("en-IN")
      ])
    ];
    const csv = rows.map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url;
    a.download = `payments_${new Date().toISOString().slice(0,10)}.csv`; a.click();
  }

  // Metrics
  const totalRevenue = payments.reduce((s, p) => s + (p.total_paid || 0), 0);
  const paidCount = payments.filter(p => p.payment_status === "paid").length;
  const freeCount = payments.filter(p => p.payment_status === "free").length;
  const todayRevenue = payments
    .filter(p => {
      const d = new Date(p.created_at);
      const t = new Date(); t.setHours(0,0,0,0);
      return d >= t && p.payment_status === "paid";
    })
    .reduce((s, p) => s + (p.total_paid || 0), 0);

  // Yesterday revenue for growth
  const ydStart = new Date(); ydStart.setDate(ydStart.getDate()-1); ydStart.setHours(0,0,0,0);
  const ydEnd = new Date(); ydEnd.setHours(0,0,0,0);
  const ydRevenue = payments
    .filter(p => {
      const d = new Date(p.created_at);
      return d >= ydStart && d < ydEnd && p.payment_status === "paid";
    })
    .reduce((s, p) => s + (p.total_paid || 0), 0);
  const growth = ydRevenue ? Math.round(((todayRevenue - ydRevenue) / ydRevenue) * 100) : 0;

  const couponUsed = payments.filter(p => p.coupon_applied).length;

  const filtered = payments.filter(p => {
    const q = search.toLowerCase();
    const matchSearch = !q || p.tracking_id?.toLowerCase().includes(q) ||
      p.full_name?.toLowerCase().includes(q) || p.phone?.includes(q) || p.email?.toLowerCase().includes(q);
    const matchFilter = filter === "all" || p.payment_status === filter;
    return matchSearch && matchFilter;
  });

  const statusStyles: Record<string, string> = {
    paid: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    free: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    pending: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
            <IndianRupee className="h-7 w-7 text-indigo-500" /> Revenue Dashboard
          </h2>
          <p className="text-sm text-gray-500 mt-1">All payments from user applications</p>
        </div>
        <button onClick={exportCSV} className="inline-flex items-center gap-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 text-gray-700 dark:text-gray-300 font-bold px-5 py-2.5 rounded-xl shadow-sm transition-colors">
          <Download className="h-5 w-5" /> Export CSV
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Revenue", value: `₹${totalRevenue.toLocaleString()}`, icon: IndianRupee, color: "#6366f1", sub: `${paidCount} paid applications` },
          { label: "Today's Revenue", value: `₹${todayRevenue.toLocaleString()}`, icon: TrendingUp, color: "#10b981", sub: growth !== 0 ? `${growth > 0 ? "+" : ""}${growth}% vs yesterday` : "No prev data", growth },
          { label: "Total Applications", value: payments.length, icon: FileText, color: "#f59e0b", sub: `${freeCount} free submissions` },
          { label: "Coupons Used", value: couponUsed, icon: CreditCard, color: "#8b5cf6", sub: `${Math.round((couponUsed/payments.length||0)*100)}% of applications` },
        ].map(({ label, value, icon: Icon, color, sub, growth: g }) => (
          <div key={label} className="bg-white dark:bg-gray-900 rounded-2xl p-5 border border-gray-100 dark:border-gray-800 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 rounded-xl" style={{ backgroundColor: color + "20" }}>
                <Icon className="w-5 h-5" style={{ color }} />
              </div>
              {g !== undefined && g !== 0 && (
                <span className={`text-xs font-bold flex items-center gap-0.5 ${g >= 0 ? "text-green-500" : "text-red-500"}`}>
                  {g >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                  {Math.abs(g)}%
                </span>
              )}
            </div>
            <p className="text-2xl font-extrabold text-gray-900 dark:text-white">{value}</p>
            <p className="text-xs text-gray-400 mt-1">{sub}</p>
            <p className="text-xs font-semibold text-gray-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            placeholder="Search by name, phone, tracking ID..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="flex-1 px-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <div className="flex gap-2">
            {["all", "paid", "free"].map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-3 py-2 rounded-xl text-xs font-bold capitalize transition-all ${filter === f ? "bg-indigo-600 text-white" : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"}`}>
                {f}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="py-20 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-indigo-500" /></div>
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center text-gray-400">Koi payment nahi mili</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800">
                <tr>
                  {["Tracking ID", "Name / Phone", "Amount", "Payment", "App Status", "Coupon", "Date"].map(h => (
                    <th key={h} className="px-4 py-3 text-xs font-bold text-gray-500 uppercase whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                {filtered.map(p => (
                  <tr key={p.tracking_id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30">
                    <td className="px-4 py-3 text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400 whitespace-nowrap">{p.tracking_id}</td>
                    <td className="px-4 py-3">
                      <p className="text-sm font-bold text-gray-900 dark:text-white">{p.full_name}</p>
                      <p className="text-xs text-gray-400">{p.phone}</p>
                    </td>
                    <td className="px-4 py-3 text-sm font-extrabold text-gray-900 dark:text-white whitespace-nowrap">
                      {p.total_paid > 0 ? `₹${p.total_paid}` : <span className="text-blue-500">FREE</span>}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-lg text-xs font-bold capitalize ${statusStyles[p.payment_status] || "bg-gray-100 text-gray-500"}`}>
                        {p.payment_status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-1 text-xs font-bold">
                        {p.application_status === "Received" && <Clock className="w-3 h-3 text-yellow-500" />}
                        {p.application_status === "Completed" && <CheckCircle2 className="w-3 h-3 text-green-500" />}
                        {p.application_status === "Rejected" && <XCircle className="w-3 h-3 text-red-500" />}
                        {p.application_status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs font-mono text-purple-600 dark:text-purple-400">{p.coupon_applied || "—"}</td>
                    <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">{new Date(p.created_at).toLocaleDateString("en-IN")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
