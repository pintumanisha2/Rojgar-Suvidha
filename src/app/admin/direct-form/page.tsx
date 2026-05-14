"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Search, BarChart2, PlusCircle, Trash2, Eye, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function AdminDirectFormPage() {
  const [forms, setForms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchForms = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("custom_forms").select("*").order("created_at", { ascending: false });
    if (!error && data) {
      setForms(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchForms();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this form?")) return;
    await supabase.from("custom_forms").delete().eq("id", id);
    fetchForms();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
            <BarChart2 className="h-6 w-6 text-indigo-500" />
            Direct Form Leads & Applications
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage custom application forms and view user submissions.</p>
        </div>
        <Link href="/admin/direct-form/new" className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-5 py-2.5 rounded-xl shadow-sm transition-colors">
          <PlusCircle className="h-5 w-5" />
          Create New Form
        </Link>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
          <div className="relative max-w-sm w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input type="text" placeholder="Search forms..." className="w-full pl-11 pr-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
        </div>
        
        {loading ? (
          <div className="py-20 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-indigo-500" /></div>
        ) : forms.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center text-gray-400">
            <BarChart2 className="h-12 w-12 mb-3 opacity-20" />
            <p className="font-medium text-gray-500">No forms created yet. Create your first form!</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800">
                <tr>
                  <th className="px-5 py-3 text-xs font-bold text-gray-500 uppercase">Form Title</th>
                  <th className="px-5 py-3 text-xs font-bold text-gray-500 uppercase">Required Documents</th>
                  <th className="px-5 py-3 text-xs font-bold text-gray-500 uppercase">Created On</th>
                  <th className="px-5 py-3 text-xs font-bold text-gray-500 uppercase text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                {forms.map((row: any) => (
                  <tr key={row.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30">
                    <td className="px-5 py-4 text-sm font-bold text-gray-900 dark:text-white">{row.title}</td>
                    <td className="px-5 py-4">
                      <div className="flex flex-wrap gap-1">
                        {row.documents?.map((doc: string, i: number) => (
                          <span key={i} className="px-2 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 text-xs rounded border border-gray-200 dark:border-gray-700">
                            {doc}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-500">
                      {new Date(row.created_at).toLocaleDateString("en-IN")}
                    </td>
                    <td className="px-5 py-4 text-right flex items-center justify-end gap-2">
                      <button 
                        onClick={() => {
                          const link = `${window.location.origin}/apply/${row.id}`;
                          navigator.clipboard.writeText(link);
                          alert("Link Copied! Aap isse apne Blog/Post mein paste kar sakte hain:\n" + link);
                        }} 
                        className="px-3 py-1.5 text-xs font-bold bg-green-100 hover:bg-green-200 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded-lg transition-colors flex items-center gap-1"
                        title="Copy Public Link"
                      >
                        Copy Link
                      </button>
                      <button className="p-2 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors" title="View Submissions">
                        <Eye className="h-5 w-5" />
                      </button>
                      <button onClick={() => handleDelete(row.id)} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors" title="Delete Form">
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
    </div>
  );
}
