"use client";

import { useState } from "react";
import { X, Calendar, Clock, Video, User, Briefcase, Mail } from "lucide-react";

interface ScheduleInterviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScheduled: () => void;
}

export default function ScheduleInterviewModal({ isOpen, onClose, onScheduled }: ScheduleInterviewModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    candidate_name: "",
    candidate_email: "",
    job_role: "",
    date: "",
    time: "",
    meeting_type: "Google Meet"
  });

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Combine date and time into ISO string
      const scheduledAt = new Date(`${formData.date}T${formData.time}`).toISOString();

      const res = await fetch("/api/employer/interviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          scheduled_at: scheduledAt,
          duration_minutes: 45
        })
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to schedule interview");
      }

      onScheduled(); // Refresh parent calendar
      onClose();     // Close modal
    } catch (error: any) {
      console.error(error);
      alert(error.message || "Error scheduling interview.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-800">
          <h2 className="text-xl font-extrabold text-gray-900 dark:text-white">Schedule Interview</h2>
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
                placeholder="Candidate Name" 
                className="w-full pl-11 pr-4 py-3 bg-gray-50 dark:bg-gray-800 border border-transparent focus:border-indigo-500 focus:bg-white rounded-xl text-sm font-medium outline-none transition-all"
                value={formData.candidate_name}
                onChange={(e) => setFormData({...formData, candidate_name: e.target.value})}
              />
            </div>

            <div className="relative">
              <Mail className="absolute left-3.5 top-3.5 w-5 h-5 text-gray-400" />
              <input 
                type="email" 
                placeholder="Candidate Email (Optional)" 
                className="w-full pl-11 pr-4 py-3 bg-gray-50 dark:bg-gray-800 border border-transparent focus:border-indigo-500 focus:bg-white rounded-xl text-sm font-medium outline-none transition-all"
                value={formData.candidate_email}
                onChange={(e) => setFormData({...formData, candidate_email: e.target.value})}
              />
            </div>

            <div className="relative">
              <Briefcase className="absolute left-3.5 top-3.5 w-5 h-5 text-gray-400" />
              <input 
                required
                type="text" 
                placeholder="Job Role / Position" 
                className="w-full pl-11 pr-4 py-3 bg-gray-50 dark:bg-gray-800 border border-transparent focus:border-indigo-500 focus:bg-white rounded-xl text-sm font-medium outline-none transition-all"
                value={formData.job_role}
                onChange={(e) => setFormData({...formData, job_role: e.target.value})}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="relative">
                <Calendar className="absolute left-3.5 top-3.5 w-5 h-5 text-gray-400" />
                <input 
                  required
                  type="date" 
                  className="w-full pl-11 pr-4 py-3 bg-gray-50 dark:bg-gray-800 border border-transparent focus:border-indigo-500 focus:bg-white rounded-xl text-sm font-medium outline-none transition-all"
                  value={formData.date}
                  onChange={(e) => setFormData({...formData, date: e.target.value})}
                />
              </div>
              <div className="relative">
                <Clock className="absolute left-3.5 top-3.5 w-5 h-5 text-gray-400" />
                <input 
                  required
                  type="time" 
                  className="w-full pl-11 pr-4 py-3 bg-gray-50 dark:bg-gray-800 border border-transparent focus:border-indigo-500 focus:bg-white rounded-xl text-sm font-medium outline-none transition-all"
                  value={formData.time}
                  onChange={(e) => setFormData({...formData, time: e.target.value})}
                />
              </div>
            </div>

            <div className="relative">
              <Video className="absolute left-3.5 top-3.5 w-5 h-5 text-gray-400" />
              <select 
                className="w-full pl-11 pr-4 py-3 bg-gray-50 dark:bg-gray-800 border border-transparent focus:border-indigo-500 focus:bg-white rounded-xl text-sm font-medium outline-none transition-all appearance-none"
                value={formData.meeting_type}
                onChange={(e) => setFormData({...formData, meeting_type: e.target.value})}
              >
                <option value="Google Meet">Google Meet (Auto-generate Link)</option>
                <option value="Phone Screen">Phone Screen</option>
                <option value="In Person">In Person</option>
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
              {loading ? "Scheduling..." : "Schedule Interview"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
