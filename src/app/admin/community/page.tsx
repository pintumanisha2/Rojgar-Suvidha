"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Trash2, Ban, ShieldAlert, CheckCircle2, Search, MessageSquareX, History } from "lucide-react";

interface AdminChatMessage {
  id: string;
  user_id: string;
  text_content: string;
  is_deleted: boolean;
  created_at: string;
  chat_users: {
    display_name: string;
    role: string;
    is_banned: boolean;
  };
}

export default function AdminCommunityPage() {
  const [messages, setMessages] = useState<AdminChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchMessages();

    // Subscribe to changes for live admin monitoring
    const channel = supabase
      .channel("admin-chat-monitor")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "chat_messages" },
        () => fetchMessages() // re-fetch to get user details
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "chat_messages" },
        (payload) => {
          setMessages(prev => 
            prev.map(m => m.id === payload.new.id ? { ...m, is_deleted: payload.new.is_deleted } : m)
          );
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "chat_users" },
        () => fetchMessages() // re-fetch if someone is banned
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchMessages = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("chat_messages")
      .select(`
        id, text_content, is_deleted, created_at, user_id,
        chat_users ( display_name, role, is_banned )
      `)
      .order("created_at", { ascending: false })
      .limit(100); // Admin sees last 100 messages
      
    if (data) {
      setMessages(data as unknown as AdminChatMessage[]);
    }
    setLoading(false);
  };

  const deleteMessage = async (id: string) => {
    if (!confirm("Delete this message from public view?")) return;
    await supabase.from("chat_messages").update({ is_deleted: true }).eq("id", id);
  };

  const banUser = async (userId: string, userName: string) => {
    if (!confirm(`Are you sure you want to PERMANENTLY BAN ${userName}?\nThey will never be able to chat again.`)) return;
    
    // 1. Ban the user
    await supabase.from("chat_users").update({ is_banned: true }).eq("id", userId);
    
    // 2. Delete all their previous messages automatically
    await supabase.from("chat_messages").update({ is_deleted: true }).eq("user_id", userId);
    
    alert(`${userName} has been banned and all their messages deleted.`);
    fetchMessages();
  };

  const filteredMessages = messages.filter(m => 
    m.text_content.toLowerCase().includes(searchTerm.toLowerCase()) || 
    m.chat_users?.display_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20">
      
      {/* Header */}
      <div className="bg-red-50 dark:bg-red-900/20 rounded-3xl p-8 border border-red-100 dark:border-red-900/30 flex flex-col md:flex-row items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-extrabold text-red-700 dark:text-red-400 flex items-center gap-3">
            <ShieldAlert className="h-8 w-8" />
            Community Moderation (Live)
          </h1>
          <p className="text-red-600 dark:text-red-300 mt-2 font-medium">
            Monitor public chat. Delete spam messages or ban abusive users permanently.
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
            <History className="w-5 h-5 text-gray-500" /> Recent Chat Log
          </h2>
          <span className="text-xs font-bold text-gray-500 bg-gray-200 dark:bg-gray-700 px-2.5 py-1 rounded-full">Last 100</span>
        </div>

        {loading ? (
          <div className="p-10 text-center text-gray-500 font-medium animate-pulse">Loading live chat...</div>
        ) : filteredMessages.length === 0 ? (
          <div className="p-10 text-center text-gray-500">No messages found.</div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {filteredMessages.map(msg => (
              <div key={msg.id} className={`p-4 md:p-5 flex flex-col md:flex-row gap-4 md:items-center justify-between transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/30 ${msg.is_deleted ? 'opacity-50' : ''}`}>
                
                {/* Message Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`font-bold text-sm ${msg.chat_users?.is_banned ? 'text-red-500 line-through' : 'text-gray-900 dark:text-white'}`}>
                      {msg.chat_users?.display_name || "Unknown User"}
                    </span>
                    {msg.chat_users?.role === 'admin' && (
                      <span className="bg-indigo-100 text-indigo-700 text-[10px] px-1.5 rounded uppercase font-bold">Admin</span>
                    )}
                    {msg.chat_users?.is_banned && (
                      <span className="bg-red-100 text-red-700 text-[10px] px-1.5 rounded uppercase font-bold">Banned</span>
                    )}
                    <span className="text-xs text-gray-400 ml-2">
                      {new Date(msg.created_at).toLocaleString('en-IN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short' })}
                    </span>
                  </div>
                  
                  {msg.is_deleted ? (
                    <div className="flex items-center gap-1.5 text-red-500 text-sm font-medium italic">
                      <MessageSquareX className="w-4 h-4" /> Message was deleted by Admin
                    </div>
                  ) : (
                    <p className="text-gray-700 dark:text-gray-300 text-sm break-words">
                      {msg.text_content}
                    </p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  {!msg.is_deleted && msg.chat_users?.role !== 'admin' && (
                    <button 
                      onClick={() => deleteMessage(msg.id)}
                      className="px-3 py-1.5 bg-gray-100 hover:bg-red-50 text-gray-600 hover:text-red-600 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Delete Msg
                    </button>
                  )}
                  
                  {!msg.chat_users?.is_banned && msg.chat_users?.role !== 'admin' && (
                    <button 
                      onClick={() => banUser(msg.user_id, msg.chat_users.display_name)}
                      className="px-3 py-1.5 bg-red-100 hover:bg-red-600 text-red-700 hover:text-white rounded-lg text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
                    >
                      <Ban className="w-3.5 h-3.5" /> Ban User
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
