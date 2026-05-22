"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Trash2, ShieldAlert, CheckCircle2, Search, MessageSquareX, History } from "lucide-react";

interface AdminPrivateMessage {
  id: string;
  user_id: string;
  content: string;
  author_name: string;
  author_avatar: string;
  category: string;
  is_blocked: boolean;
  created_at: string;
}

export default function AdminPrivateCommunityPage() {
  const [messages, setMessages] = useState<AdminPrivateMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchMessages();

    // Subscribe to changes for live admin monitoring
    const channel = supabase
      .channel("admin-private-chat-monitor")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "private_community_posts" },
        (payload) => {
          setMessages(prev => [payload.new as AdminPrivateMessage, ...prev]);
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "private_community_posts" },
        (payload) => {
          setMessages(prev => 
            prev.map(m => m.id === payload.new.id ? { ...m, is_blocked: payload.new.is_blocked } : m)
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchMessages = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("private_community_posts")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);
      
    if (data) {
      setMessages(data as AdminPrivateMessage[]);
    }
    setLoading(false);
  };

  const deleteMessage = async (id: string) => {
    if (!confirm("Delete this message from public view?")) return;
    const { data, error } = await supabase.from("private_community_posts").update({ is_blocked: true }).eq("id", id).select();
    if (error) {
      alert("Failed to delete message: " + error.message);
    } else if (!data || data.length === 0) {
      alert("Permission Denied: Database RLS policies are preventing you from deleting this message. Please check permissions.");
    } else {
      setMessages(prev => 
        prev.map(m => m.id === id ? { ...m, is_blocked: true } : m)
      );
    }
  };

  // We only block messages in private for now, user ban logic needs candidate_profiles support
  const blockAllUserMessages = async (userId: string, userName: string) => {
    if (!confirm(`Are you sure you want to block all messages by ${userName}?`)) return;
    
    const { error: deleteError } = await supabase.from("private_community_posts").update({ is_blocked: true }).eq("user_id", userId);
    if (deleteError) {
      alert("Failed to block user's past messages: " + deleteError.message);
    } else {
      alert(`All messages from ${userName} have been blocked.`);
      fetchMessages();
    }
  };

  const filteredMessages = messages.filter(m => 
    (m.content || "").toLowerCase().includes(searchTerm.toLowerCase()) || 
    (m.author_name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (m.category || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20">
      
      {/* Header */}
      <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-3xl p-8 border border-indigo-100 dark:border-indigo-900/30 flex flex-col md:flex-row items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-extrabold text-indigo-700 dark:text-indigo-400 flex items-center gap-3">
            <ShieldAlert className="h-8 w-8" />
            Private Community Moderation
          </h1>
          <p className="text-indigo-600 dark:text-indigo-300 mt-2 font-medium">
            Monitor the private jobs community. Delete spam messages and moderate categories.
          </p>
        </div>
        
        <div className="bg-white dark:bg-gray-800 p-2 rounded-xl border border-gray-200 dark:border-gray-700 flex items-center w-full md:w-auto shadow-sm">
          <Search className="w-5 h-5 text-gray-400 ml-2" />
          <input 
            type="text" 
            placeholder="Search words or names..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="bg-transparent border-none outline-none px-3 py-1 text-sm w-full md:w-64 dark:text-white"
          />
        </div>
      </div>

      {/* Messages List */}
      <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center bg-gray-50 dark:bg-gray-800/50">
          <h2 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <History className="w-5 h-5 text-gray-500" /> Recent Posts
          </h2>
          <span className="text-xs font-bold text-gray-500 bg-gray-200 dark:bg-gray-700 px-2.5 py-1 rounded-full">Last 100</span>
        </div>

        {loading ? (
          <div className="p-10 text-center text-gray-500 font-medium animate-pulse">Loading live feed...</div>
        ) : filteredMessages.length === 0 ? (
          <div className="p-10 text-center text-gray-500">No messages found.</div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {filteredMessages.map(msg => (
              <div key={msg.id} className={`p-4 md:p-5 flex flex-col md:flex-row gap-4 md:items-center justify-between transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/30 ${msg.is_blocked ? 'opacity-50' : ''}`}>
                
                {/* Message Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-sm text-gray-900 dark:text-white">
                      {msg.author_name || "Unknown User"}
                    </span>
                    <span className="bg-slate-100 text-slate-700 text-[10px] px-1.5 rounded uppercase font-bold">
                      #{msg.category}
                    </span>
                    <span className="text-xs text-gray-400 ml-2">
                      {new Date(msg.created_at).toLocaleString('en-IN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short' })}
                    </span>
                  </div>
                  
                  {msg.is_blocked ? (
                    <div className="flex items-center gap-1.5 text-red-500 text-sm font-medium italic">
                      <MessageSquareX className="w-4 h-4" /> Message was blocked by Admin
                    </div>
                  ) : (
                    <p className="text-gray-700 dark:text-gray-300 text-sm break-words">
                      {msg.content}
                    </p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  {!msg.is_blocked && (
                    <button 
                      onClick={() => deleteMessage(msg.id)}
                      className="px-3 py-1.5 bg-gray-100 hover:bg-red-50 text-gray-600 hover:text-red-600 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Block Post
                    </button>
                  )}
                  
                  {/* Option to block all posts by this user */}
                  {!msg.is_blocked && msg.user_id && msg.user_id !== "local-mock-user-id" && (
                     <button 
                       onClick={() => blockAllUserMessages(msg.user_id, msg.author_name)}
                       className="px-3 py-1.5 bg-red-100 hover:bg-red-600 text-red-700 hover:text-white rounded-lg text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
                     >
                       <ShieldAlert className="w-3.5 h-3.5" /> Block User
                     </button>
                  )}
                </div>

              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
