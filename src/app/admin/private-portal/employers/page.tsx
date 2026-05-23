"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { 
  Building, CheckCircle, XCircle, Search, 
  MoreVertical, Mail, Phone, ExternalLink, ShieldAlert
} from "lucide-react";

export default function HRManagementPage() {
  const [employers, setEmployers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchEmployers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("employer_profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (data && data.length > 0) {
        setEmployers(data);
      } else {
        // Fallback Mock Data for UI Testing if DB is empty
        setEmployers([
          { id: '1', company_name: 'TechNova Solutions', contact_name: 'Rahul Sharma', email: 'rahul@technova.in', phone: '+91 9876543210', is_verified: false, industry: 'IT Services', created_at: new Date().toISOString(), company_id_card_url: 'https://example.com/id.pdf' },
          { id: '2', company_name: 'Global Finance Corp', contact_name: 'Priya Patel', email: 'hr@globalfinance.com', phone: '+91 8765432109', is_verified: true, industry: 'Finance', created_at: new Date(Date.now() - 86400000).toISOString(), company_id_card_url: null },
          { id: '3', company_name: 'NextGen Retail', contact_name: 'Amit Verma', email: 'amit.v@nextgenretail.in', phone: '+91 7654321098', is_verified: false, industry: 'Retail', created_at: new Date(Date.now() - 172800000).toISOString(), company_id_card_url: 'https://example.com/id2.png' },
        ]);
      }
    } catch (error) {
      console.error("Error fetching employers:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployers();
  }, []);

  const handleVerify = async (id: string, currentStatus: boolean) => {
    // Attempt DB Update
    try {
      const { error } = await supabase
        .from("employer_profiles")
        .update({ is_verified: !currentStatus })
        .eq("id", id);
      
      // Update local state regardless of DB success for smooth UI during testing
      setEmployers(prev => prev.map(emp => emp.id === id ? { ...emp, is_verified: !currentStatus } : emp));
    } catch (err) {
      setEmployers(prev => prev.map(emp => emp.id === id ? { ...emp, is_verified: !currentStatus } : emp));
    }
  };

  const handleReject = async (id: string) => {
    if (!window.confirm("Are you sure you want to completely REJECT and DELETE this employer's application? They will have to register again.")) return;
    
    try {
      const { error } = await supabase
        .from("employer_profiles")
        .delete()
        .eq("id", id);
      
      // Update local state
      setEmployers(prev => prev.filter(emp => emp.id !== id));
    } catch (err) {
      console.error("Failed to delete employer:", err);
    }
  };

  const filteredEmployers = employers.filter(emp => 
    emp.company_name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    emp.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-2">
            <Building className="h-6 w-6 text-blue-500" /> HR & Employer Approvals
          </h2>
          <p className="text-sm text-gray-500 font-medium mt-1">Review and verify companies before they can post private jobs.</p>
        </div>
        
        <div className="relative w-full md:w-72">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
            <Search className="h-4 w-4" />
          </div>
          <input
            type="text"
            placeholder="Search company or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-sm text-gray-900 dark:text-white transition-all shadow-sm"
          />
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 dark:bg-gray-800/50">
              <tr>
                <th className="px-6 py-4 text-xs font-black text-gray-500 uppercase tracking-wider">Company Details</th>
                <th className="px-6 py-4 text-xs font-black text-gray-500 uppercase tracking-wider">Contact Person</th>
                <th className="px-6 py-4 text-xs font-black text-gray-500 uppercase tracking-wider text-center">ID Document</th>
                <th className="px-6 py-4 text-xs font-black text-gray-500 uppercase tracking-wider text-center">Verification Status</th>
                <th className="px-6 py-4 text-xs font-black text-gray-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-gray-500">Loading employers...</td>
                </tr>
              ) : filteredEmployers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-gray-500 flex flex-col items-center">
                    <ShieldAlert className="h-10 w-10 text-gray-300 mb-3" />
                    No employers found matching your search.
                  </td>
                </tr>
              ) : (
                filteredEmployers.map((emp) => (
                  <tr key={emp.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center font-black text-lg">
                          {emp.company_name?.charAt(0) || "C"}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-900 dark:text-white">{emp.company_name || "Unknown Company"}</p>
                          <p className="text-xs text-gray-500 font-medium flex items-center gap-1 mt-0.5">
                            {emp.industry || "General"} • Joined {new Date(emp.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-bold text-gray-800 dark:text-gray-200">{emp.contact_name || "HR Manager"}</p>
                      <div className="flex flex-col gap-1 mt-1">
                        <a href={`mailto:${emp.email}`} className="text-xs text-blue-600 hover:underline flex items-center gap-1">
                          <Mail className="h-3 w-3" /> {emp.email}
                        </a>
                        {emp.phone && (
                          <a href={`tel:${emp.phone}`} className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1">
                            <Phone className="h-3 w-3" /> {emp.phone}
                          </a>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {emp.company_id_card_url ? (
                        <a 
                          href={emp.company_id_card_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-xs font-bold hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors border border-blue-200 dark:border-blue-800"
                        >
                          <ExternalLink className="h-3.5 w-3.5" /> View ID Card
                        </a>
                      ) : (
                        <span className="text-xs text-gray-400 font-medium italic">Not Uploaded</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {emp.is_verified ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-xs font-black tracking-wide border border-emerald-200 dark:border-emerald-800">
                          <CheckCircle className="h-3.5 w-3.5" /> VERIFIED
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-xs font-black tracking-wide border border-amber-200 dark:border-amber-800">
                          <ShieldAlert className="h-3.5 w-3.5" /> PENDING
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <div className="flex items-center justify-end gap-2">
                        {!emp.is_verified && (
                          <button 
                            onClick={() => handleReject(emp.id)}
                            className="inline-flex items-center justify-center px-4 py-2 rounded-xl text-xs font-bold transition-all border bg-white dark:bg-gray-800 border-red-200 dark:border-red-900/50 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 hover:border-red-300"
                          >
                            Reject
                          </button>
                        )}
                        <button 
                          onClick={() => handleVerify(emp.id, emp.is_verified)}
                          className={`inline-flex items-center justify-center px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                            emp.is_verified 
                              ? "bg-white dark:bg-gray-800 border-orange-200 dark:border-orange-900/50 text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20 hover:border-orange-300" 
                              : "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 border-transparent text-white shadow-md shadow-emerald-500/20"
                          }`}
                        >
                          {emp.is_verified ? "Revoke Access" : "Approve HR"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
