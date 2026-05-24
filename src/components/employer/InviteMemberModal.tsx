"use client";

import { useState } from "react";
import { X, User, Mail, Shield } from "lucide-react";

interface InviteMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInvited: () => void;
}

export default function InviteMemberModal({ isOpen, onClose, onInvited }: InviteMemberModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: "Technical Interviewer"
  });

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/employer/team", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to invite member");
      }

      onInvited(); // Refresh parent team list
      onClose();   // Close modal
    } catch (error: any) {
      console.error(error);
      alert(error.message || "Error inviting member.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-800">
          <h2 className="text-xl font-extrabold text-gray-900 dark:text-white">Invite Team Member</h2>
          <button onClick={onClose} className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="space-y-4">
            <div className="relative">
              <User className="absolute left-3.5 top-3.5 w-5 h-5 text-gray-400" />
              <input 
                required
                type="text" 
                placeholder="Full Name" 
                className="w-full pl-11 pr-4 py-3 bg-gray-50 dark:bg-gray-800 border border-transparent focus:border-indigo-500 focus:bg-white rounded-xl text-sm font-medium outline-none transition-all"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
              />
            </div>

            <div className="relative">
              <Mail className="absolute left-3.5 top-3.5 w-5 h-5 text-gray-400" />
              <input 
                required
                type="email" 
                placeholder="Work Email Address" 
                className="w-full pl-11 pr-4 py-3 bg-gray-50 dark:bg-gray-800 border border-transparent focus:border-indigo-500 focus:bg-white rounded-xl text-sm font-medium outline-none transition-all"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
              />
            </div>

            <div className="relative">
              <Shield className="absolute left-3.5 top-3.5 w-5 h-5 text-gray-400" />
              <select 
                className="w-full pl-11 pr-4 py-3 bg-gray-50 dark:bg-gray-800 border border-transparent focus:border-indigo-500 focus:bg-white rounded-xl text-sm font-medium outline-none transition-all appearance-none"
                value={formData.role}
                onChange={(e) => setFormData({...formData, role: e.target.value})}
              >
                <option value="Super Admin">Super Admin (Full Access)</option>
                <option value="HR Manager">HR Manager (Manage Pipeline)</option>
                <option value="Technical Interviewer">Technical Interviewer (Feedback Only)</option>
              </select>
            </div>
          </div>

          <div className="pt-4 flex gap-3">
            <button 
              type="button" 
              onClick={onClose}
              className="flex-1 py-3 px-4 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-900 dark:text-white rounded-xl font-bold text-sm transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={loading}
              className="flex-1 py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-sm transition-colors flex justify-center items-center gap-2 disabled:opacity-70"
            >
              {loading ? "Sending Invite..." : "Send Invite"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
