"use client";

import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { PlusCircle, Search, Ticket, Trash2, Loader2, X } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // New Coupon Form State
  const [code, setCode] = useState("");
  const [discountType, setDiscountType] = useState("flat");
  const [discountValue, setDiscountValue] = useState("");
  const [maxUses, setMaxUses] = useState("100");

  const fetchCoupons = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("coupons").select("*").order("created_at", { ascending: false });
    if (!error && data) {
      setCoupons(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code || !discountValue) return;

    setSaving(true);
    const { error } = await supabase.from("coupons").insert([{
      code: code.toUpperCase(),
      discount_type: discountType,
      discount_value: Number(discountValue),
      max_uses: Number(maxUses),
      used_count: 0,
      status: "active"
    }]);

    setSaving(false);
    if (error) {
      toast.error("Error: " + error.message);
    } else {
      setShowModal(false);
      setCode("");
      setDiscountValue("");
      toast.success("Coupon created successfully! 🎉");
      fetchCoupons();
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this coupon?")) return;
    await supabase.from("coupons").delete().eq("id", id);
    toast.success("Coupon deleted.");
    fetchCoupons();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
            <Ticket className="h-6 w-6 text-indigo-500" />
            Discount Coupons
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Create promo codes to give discount on Portal Service Charge.</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-5 py-2.5 rounded-xl shadow-sm transition-colors"
        >
          <PlusCircle className="h-5 w-5" />
          Create Coupon
        </button>
      </div>

      <div className="bg-white dark:bg-zinc-950 rounded-2xl border border-gray-100 dark:border-zinc-900 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100 dark:border-zinc-900">
          <div className="relative max-w-sm">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input type="text" placeholder="Search coupons by code..." className="w-full pl-11 pr-4 py-2 bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
        </div>
        
        {loading ? (
          <div className="py-20 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-indigo-500" /></div>
        ) : coupons.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center text-gray-400">
            <Ticket className="h-12 w-12 mb-3 opacity-20" />
            <p className="font-medium text-gray-500">No coupons active right now.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 dark:bg-zinc-950/50 border-b border-gray-100 dark:border-zinc-900">
                <tr>
                  <th className="px-5 py-3 text-xs font-bold text-gray-500 uppercase">Coupon Code</th>
                  <th className="px-5 py-3 text-xs font-bold text-gray-500 uppercase">Discount</th>
                  <th className="px-5 py-3 text-xs font-bold text-gray-500 uppercase">Usage (Used / Max)</th>
                  <th className="px-5 py-3 text-xs font-bold text-gray-500 uppercase">Status</th>
                  <th className="px-5 py-3 text-xs font-bold text-gray-500 uppercase text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-zinc-900">
                {coupons.map((row: any) => (
                  <tr key={row.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30">
                    <td className="px-5 py-4 text-sm font-black text-indigo-600 dark:text-indigo-400 tracking-wider">
                      {row.code}
                    </td>
                    <td className="px-5 py-4 text-sm font-bold text-emerald-600">
                      {row.discount_type === "percentage" ? `${row.discount_value}% OFF` : `₹${row.discount_value} OFF`}
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-600 dark:text-gray-400 font-medium">
                      <span className="text-gray-900 dark:text-white font-bold">{row.used_count}</span> / {row.max_uses}
                    </td>
                    <td className="px-5 py-4">
                      {row.used_count >= row.max_uses ? (
                        <span className="px-2.5 py-1 text-xs font-bold bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 rounded-full">Expired</span>
                      ) : (
                        <span className="px-2.5 py-1 text-xs font-bold bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded-full">Active</span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <button onClick={() => handleDelete(row.id)} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors" title="Delete Coupon">
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Coupon Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-zinc-950 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden border border-gray-100 dark:border-zinc-900">
            <div className="p-5 border-b border-gray-100 dark:border-zinc-900 flex items-center justify-between">
              <h3 className="font-bold text-lg text-gray-900 dark:text-white">Create New Coupon</h3>
              <button onClick={() => setShowModal(false)} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <form onSubmit={handleCreateCoupon} className="p-5 space-y-5">
              <div>
                <label className="block text-sm font-semibold mb-1.5 text-gray-700 dark:text-gray-300">Coupon Code</label>
                <input 
                  type="text" 
                  value={code} 
                  onChange={e => setCode(e.target.value.toUpperCase())} 
                  placeholder="e.g. DIWALI50" 
                  required
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl font-black tracking-wider uppercase focus:outline-none focus:ring-2 focus:ring-indigo-500" 
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-1.5 text-gray-700 dark:text-gray-300">Discount Type</label>
                  <select 
                    value={discountType} 
                    onChange={e => setDiscountType(e.target.value)} 
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="flat">Flat Amount (₹)</option>
                    <option value="percentage">Percentage (%)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1.5 text-gray-700 dark:text-gray-300">Value</label>
                  <input 
                    type="number" 
                    value={discountValue} 
                    onChange={e => setDiscountValue(e.target.value)} 
                    placeholder={discountType === "flat" ? "e.g. 50" : "e.g. 20"} 
                    required
                    min="1"
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500" 
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1.5 text-gray-700 dark:text-gray-300">Max Usage Limit</label>
                <input 
                  type="number" 
                  value={maxUses} 
                  onChange={e => setMaxUses(e.target.value)} 
                  placeholder="How many people can use this?" 
                  required
                  min="1"
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500" 
                />
                <p className="text-xs text-gray-500 mt-1.5">E.g. Set to 100 if only first 100 users get this discount.</p>
              </div>

              <button 
                type="submit" 
                disabled={saving}
                className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-xl shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : "Save Coupon"}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
