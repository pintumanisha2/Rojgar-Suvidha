"use client";

import { useState, useEffect } from "react";
import { PlusCircle, Search, Users, Trash2, Loader2, ShieldCheck, AlertCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function AdminUsersPage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState("govt_data_entry");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchRoles();
  }, []);

  const fetchRoles = async () => {
    setLoading(true);
    const { data: roles, error } = await supabase.from("admin_roles").select("*").order("created_at", { ascending: false });
    if (roles) setData(roles);
    setLoading(false);
  };

  const handleAddRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newEmail.trim() || !newPassword.trim()) {
      setError("Name, Email, and Password are required.");
      return;
    }
    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    
    setIsSaving(true);
    setError(null);

    try {
      const response = await fetch("/api/admin/create-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName.trim(), email: newEmail.trim(), password: newPassword, role: newRole }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to create user");

      setNewName("");
      setNewEmail("");
      setNewPassword("");
      setShowAddForm(false);
      fetchRoles();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleStatus = async (id: number, currentStatus: string, email: string) => {
    if (email === "admin@rojgarsuvidha.com" || email === "superadmin@rojgarsuvidha.com") {
      alert("Cannot disable the primary Super Admin!");
      return;
    }
    
    const newStatus = currentStatus === "Active" ? "Inactive" : "Active";
    if (confirm(`Are you sure you want to ${newStatus === "Inactive" ? "DISABLE" : "ENABLE"} access for ${email}?`)) {
      await supabase.from("admin_roles").update({ status: newStatus }).eq("id", id);
      fetchRoles();
    }
  };

  const handleDeleteRole = async (id: number, email: string) => {
    if (email === "admin@rojgarsuvidha.com") {
      alert("Cannot delete the primary Super Admin!");
      return;
    }
    if (confirm(`Are you sure you want to remove access for ${email}?`)) {
      await supabase.from("admin_roles").delete().eq("id", id);
      fetchRoles();
    }
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
            <Users className="h-6 w-6 text-indigo-500" />
            Manage Admin Users
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Assign access roles to your team members.</p>
        </div>
        <button onClick={() => setShowAddForm(!showAddForm)} className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-5 py-2.5 rounded-xl shadow-sm transition-colors">
          <PlusCircle className="h-5 w-5" />
          Assign New Role
        </button>
      </div>



      {showAddForm && (
        <form onSubmit={handleAddRole} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5 shadow-sm space-y-4">
          <h3 className="font-bold text-gray-900 dark:text-white">Create New Admin User</h3>
          
          <div className="bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 rounded-xl p-3 flex gap-3 text-amber-700 dark:text-amber-400 text-sm">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <div>
              <p className="font-bold">Important Note Regarding Login Issues:</p>
              <p>If new users are getting "Invalid Login Credentials", you must turn OFF <strong>"Confirm email"</strong> in your Supabase Dashboard (Authentication {`>`} Providers {`>`} Email). Otherwise, they cannot log in until they verify their email.</p>
            </div>
          </div>

          {error && <p className="text-sm text-red-500 font-bold">{error}</p>}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <input type="text" required value={newName} onChange={e => setNewName(e.target.value)} placeholder="Full Name" className="col-span-1 px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm" />
            <input type="email" required value={newEmail} onChange={e => setNewEmail(e.target.value)} placeholder="user@rojgarsuvidha.com" className="col-span-1 px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm" />
            <input type="text" required value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Set Password (Min 6 chars)" className="col-span-1 px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm" />
            <select value={newRole} onChange={e => setNewRole(e.target.value)} className="col-span-1 px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm">
              <optgroup label="Full Access">
                <option value="super_admin">Super Admin (All Access)</option>
                <option value="admin">Admin (No Payments)</option>
              </optgroup>
              <optgroup label="Sarkari Team">
                <option value="govt_manager">Sarkari Manager</option>
                <option value="govt_data_entry">Sarkari Data Entry</option>
              </optgroup>
              <optgroup label="Private Portal Team">
                <option value="private_manager">Private Portal Manager</option>
                <option value="private_data_entry">Private Job Scout</option>
              </optgroup>
            </select>
            <button type="submit" disabled={isSaving} className="col-span-1 px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 disabled:opacity-50">
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
            </button>
          </div>
        </form>
      )}

      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-10 flex justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800">
                <tr>
                  <th className="px-5 py-3 text-xs font-bold text-gray-500 uppercase">User</th>
                  <th className="px-5 py-3 text-xs font-bold text-gray-500 uppercase">Assigned Role</th>
                  <th className="px-5 py-3 text-xs font-bold text-gray-500 uppercase">Status</th>
                  <th className="px-5 py-3 text-xs font-bold text-gray-500 uppercase text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                <tr className="hover:bg-gray-50 dark:hover:bg-gray-800/30">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4 text-indigo-500" /> 
                      <div>
                        <p className="text-sm font-bold text-gray-900 dark:text-white">Primary Owner</p>
                        <p className="text-xs text-gray-500">admin@rojgarsuvidha.com</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-sm font-bold text-indigo-600">super_admin</td>
                  <td className="px-5 py-4 text-sm font-bold text-green-600">Active</td>
                  <td className="px-5 py-4 text-sm text-right text-gray-400">Owner</td>
                </tr>
                {data.map((row: any) => (
                  <tr key={row.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30">
                    <td className="px-5 py-4">
                      <div>
                        <p className="text-sm font-bold text-gray-900 dark:text-white">{row.name || "Unknown"}</p>
                        <p className="text-xs text-gray-500">{row.email}</p>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-600 dark:text-gray-400 capitalize">{row.role.replace("_", " ")}</td>
                    <td className="px-5 py-4 text-sm font-bold">
                      <span className={`px-2 py-1 rounded-md text-[10px] uppercase tracking-wider ${row.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {row.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-sm text-right flex justify-end gap-2">
                      <button 
                        onClick={() => handleToggleStatus(row.id, row.status, row.email)} 
                        className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${row.status === 'Active' ? 'bg-orange-50 text-orange-600 hover:bg-orange-100' : 'bg-green-50 text-green-600 hover:bg-green-100'}`}
                      >
                        {row.status === 'Active' ? 'Disable' : 'Enable'}
                      </button>
                      <button onClick={() => handleDeleteRole(row.id, row.email)} className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
                {data.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-5 py-8 text-center text-gray-500">No additional roles assigned yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
