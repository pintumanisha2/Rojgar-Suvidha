"use client";

import { useEffect, useState } from "react";
import { Users, UserPlus, Mail, Shield, Trash2, Loader2, Activity, Clock } from "lucide-react";
import InviteMemberModal from "@/components/employer/InviteMemberModal";
import moment from "moment";

export default function TeamPage() {
  const [team, setTeam] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"members" | "logs">("members");
  const [logs, setLogs] = useState<any[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [currentUserRole, setCurrentUserRole] = useState<string>("Super Admin");

  const fetchTeam = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/employer/team");
      const data = await res.json();
      
      if (data.error) {
        setError(data.error);
        setTeam([]);
      } else {
        setError(null);
        setTeam(data.team || []);
      }
    } catch (err: any) {
      console.error(err);
      setError("Failed to load team members");
    } finally {
      setLoading(false);
    }
  };

  const fetchLogs = async () => {
    try {
      setLoadingLogs(true);
      const res = await fetch("/api/employer/activity");
      const data = await res.json();
      if (!data.error) {
        setLogs(data.logs || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingLogs(false);
    }
  };

  useEffect(() => {
    // Check if the current user is an Admin/Main HR
    const role = localStorage.getItem("rs_employer_mock_role") || "Super Admin";
    setCurrentUserRole(role);
    
    fetchTeam();
    if (role === "Super Admin" || role.toLowerCase().includes("admin")) {
      fetchLogs();
    }
  }, []);

  const handleRemoveAccess = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to remove access for ${name}? They will no longer be able to log in to the employer portal.`)) {
      return;
    }

    try {
      setDeletingId(id);
      const res = await fetch(`/api/employer/team?id=${id}`, {
        method: "DELETE"
      });

      if (!res.ok) {
        throw new Error("Failed to remove member");
      }

      // Update state locally
      setTeam(prev => prev.filter(member => member.id !== id));
      fetchLogs(); // Refresh logs to show deletion
    } catch (err) {
      console.error(err);
      alert("Error removing team member");
    } finally {
      setDeletingId(null);
    }
  };

  if (!currentUserRole.toLowerCase().includes("admin") && !currentUserRole.toLowerCase().includes("senior")) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4 animate-in fade-in duration-300">
        <div className="w-20 h-20 bg-red-50 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-6">
          <Shield className="w-10 h-10 text-red-500" />
        </div>
        <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-2">Access Denied</h1>
        <p className="text-gray-500 dark:text-gray-400 max-w-md">
          You do not have permission to view the Team Management page. Only Senior HR Managers and Super Admins can manage team access.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="relative border-0 rounded-3xl p-6 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4 overflow-hidden mb-6">
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 via-purple-600 to-fuchsia-600 z-0"></div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -z-0"></div>
        
        <div className="relative z-10">
          <h1 className="text-2xl font-black text-white flex items-center gap-2 drop-shadow-md">
            <Users className="w-6 h-6 text-indigo-100" /> Team Management
          </h1>
          <p className="text-sm text-indigo-100 mt-1 drop-shadow-sm">Manage recruiters, interviewers, and their access levels.</p>
        </div>
        <div className="flex items-center gap-3 relative z-10">
          <div className="flex items-center p-1 bg-black/20 backdrop-blur-md rounded-xl border border-white/20">
            <button 
              onClick={() => setActiveTab("members")}
              className={`px-4 py-1.5 text-sm font-bold rounded-lg transition-all ${activeTab === "members" ? "bg-white text-indigo-900 shadow-sm" : "text-white/70 hover:text-white"}`}
            >
              Members
            </button>
            {/* ONLY Main HR / Super Admin can see the Activity Logs tab */}
            {(currentUserRole === "Super Admin" || currentUserRole.toLowerCase().includes("admin")) && (
              <button 
                onClick={() => setActiveTab("logs")}
                className={`px-4 py-1.5 text-sm font-bold rounded-lg transition-all ${activeTab === "logs" ? "bg-white text-indigo-900 shadow-sm" : "text-white/70 hover:text-white"}`}
              >
                Activity Logs
              </button>
            )}
          </div>
          {(currentUserRole === "Super Admin" || currentUserRole.toLowerCase().includes("admin")) && (
            <button 
              onClick={() => setIsModalOpen(true)}
              className="px-5 py-2 bg-white text-indigo-900 hover:bg-gray-50 text-sm font-black rounded-xl shadow-lg transition-transform hover:scale-105 flex items-center gap-2"
            >
              <UserPlus className="w-4 h-4" /> Invite Member
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-600 rounded-xl font-bold text-sm border border-red-100">
          {error}
        </div>
      )}

      {activeTab === "members" ? (
        <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl shadow-sm overflow-hidden min-h-[400px]">
          {loading ? (
            <div className="flex items-center justify-center h-[400px]">
              <div className="animate-pulse flex flex-col items-center gap-4">
                <Users className="w-10 h-10 text-indigo-500 opacity-50" />
                <p className="font-bold text-gray-500">Loading team members...</p>
              </div>
            </div>
          ) : team.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[400px] text-center space-y-4">
              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
                <Users className="w-8 h-8 text-gray-400" />
              </div>
              <div>
                <h3 className="text-lg font-extrabold text-gray-900 dark:text-white">No Team Members Yet</h3>
                <p className="text-sm text-gray-500 mt-1 max-w-sm mx-auto">
                  Invite your colleagues to help manage your recruiting pipeline and interviews.
                </p>
              </div>
              <button 
                onClick={() => setIsModalOpen(true)}
                className="px-4 py-2 bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400 font-bold rounded-xl text-sm"
              >
                Send an Invite
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/80 dark:bg-gray-850/50 border-b border-gray-100 dark:border-gray-800">
                    <th className="px-6 py-4 text-[10px] font-extrabold text-gray-400 uppercase tracking-widest">Team Member</th>
                    <th className="px-6 py-4 text-[10px] font-extrabold text-gray-400 uppercase tracking-widest">Role</th>
                    <th className="px-6 py-4 text-[10px] font-extrabold text-gray-400 uppercase tracking-widest">Status</th>
                    <th className="px-6 py-4 text-[10px] font-extrabold text-gray-400 uppercase tracking-widest text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {team.map((member, i) => (
                    <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-black text-sm shrink-0 border border-indigo-200 dark:border-indigo-800/50">
                            {member.name.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-extrabold text-gray-900 dark:text-white text-sm">
                              {member.name}
                            </div>
                            <div className="text-[10px] font-bold text-gray-500 mt-0.5 flex items-center gap-1">
                              <Mail className="w-3 h-3" /> {member.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 px-2.5 py-1 rounded-lg w-max border border-gray-200 dark:border-gray-700">
                          <Shield className="w-3.5 h-3.5 text-indigo-500" /> {member.role}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border uppercase tracking-wide ${
                          member.status === "Active" 
                            ? "bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800/40" 
                            : "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800/40"
                        }`}>
                          {member.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {(currentUserRole === "Super Admin" || currentUserRole.toLowerCase().includes("admin")) ? (
                          <button 
                            onClick={() => handleRemoveAccess(member.id, member.name)}
                            disabled={deletingId === member.id}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors disabled:opacity-50"
                            title="Remove Access"
                          >
                            {deletingId === member.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </button>
                        ) : (
                          <span className="text-[10px] font-bold text-gray-400">No Access</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl shadow-sm p-6 min-h-[400px]">
          <h3 className="text-lg font-extrabold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
            <Activity className="w-5 h-5 text-indigo-500" /> Audit Trail & History
          </h3>
          
          {loadingLogs ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Clock className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-700" />
              <p className="font-bold">No activity recorded yet.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {logs.map((log) => (
                <div key={log.id} className="flex gap-4">
                  <div className="mt-1">
                    <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 ring-4 ring-indigo-50 dark:ring-indigo-900/30"></div>
                  </div>
                  <div className="flex-1 pb-6 border-b border-gray-100 dark:border-gray-800 last:border-0 last:pb-0">
                    <p className="text-sm text-gray-800 dark:text-gray-200">
                      <span className="font-extrabold text-gray-900 dark:text-white">{log.user_name}</span>{" "}
                      {log.action_type.includes('Removed') ? (
                        <span className="text-red-500 font-bold">{log.action_type}</span>
                      ) : (
                        <span className="text-indigo-600 dark:text-indigo-400 font-bold">{log.action_type}</span>
                      )}{" "}
                      - {log.target_details}
                    </p>
                    <p className="text-xs font-bold text-gray-400 mt-1">
                      {moment(log.created_at).format('MMM Do YYYY, h:mm a')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <InviteMemberModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onInvited={() => { fetchTeam(); fetchLogs(); }}      />
    </div>
  );
}
