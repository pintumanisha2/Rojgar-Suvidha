"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { Send, Users, ShieldAlert, CheckCircle2, User, UserCheck, AlertTriangle } from "lucide-react";

interface ChatMessage {
  id: string;
  user_id: string;
  text_content: string;
  is_deleted: boolean;
  created_at: string;
  chat_users: {
    display_name: string;
    avatar: string;
    role: string;
    is_banned: boolean;
  };
}

// Basic profanity and phone number filter
const BAD_WORDS = ["gali", "badword1", "badword2"]; // Add actual words here later
const isMessageClean = (text: string) => {
  const lower = text.toLowerCase();
  // Check for bad words
  if (BAD_WORDS.some(word => lower.includes(word))) return false;
  // Check for phone numbers (10 digits anywhere)
  if (/\d{10}/.test(text.replace(/[\s-]/g, ""))) return false;
  return true;
};

export default function CommunityPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // User Session State
  const [myUserId, setMyUserId] = useState<string | null>(null);
  const [myName, setMyName] = useState("");
  const [myRole, setMyRole] = useState("student");
  const [isBanned, setIsBanned] = useState(false);
  const [setupMode, setSetupMode] = useState(false);

  useEffect(() => {
    // 1. Check local storage for existing session
    const storedUserId = localStorage.getItem("chat_user_id");
    const storedName = localStorage.getItem("chat_user_name");
    
    if (storedUserId && storedName) {
      setMyUserId(storedUserId);
      setMyName(storedName);
      checkUserStatus(storedUserId);
    } else {
      setSetupMode(true);
    }

    // 2. Load initial messages
    fetchMessages();

    // 3. Subscribe to real-time new messages
    const channel = supabase
      .channel("public-chat")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "chat_messages" },
        (payload) => {
          // Need to fetch user details for the new message
          fetchSingleMessage(payload.new.id);
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "chat_messages" },
        (payload) => {
          // Handle deletions
          setMessages(prev => 
            prev.map(m => m.id === payload.new.id ? { ...m, is_deleted: payload.new.is_deleted } : m)
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    // Scroll to bottom when messages change
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const checkUserStatus = async (id: string) => {
    const { data } = await supabase.from("chat_users").select("is_banned, role").eq("id", id).single();
    if (data) {
      setIsBanned(data.is_banned);
      setMyRole(data.role);
    }
  };

  const fetchMessages = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("chat_messages")
      .select(`
        id, text_content, is_deleted, created_at, user_id,
        chat_users ( display_name, avatar, role, is_banned )
      `)
      .order("created_at", { ascending: false })
      .limit(50);
      
    if (data) {
      // Reverse to show oldest at top, newest at bottom
      setMessages(data.reverse() as unknown as ChatMessage[]);
    }
    setLoading(false);
  };

  const fetchSingleMessage = async (msgId: string) => {
    const { data } = await supabase
      .from("chat_messages")
      .select(`
        id, text_content, is_deleted, created_at, user_id,
        chat_users ( display_name, avatar, role, is_banned )
      `)
      .eq("id", msgId)
      .single();
      
    if (data) {
      setMessages(prev => [...prev, data as unknown as ChatMessage]);
    }
  };

  const handleJoin = async () => {
    if (myName.trim().length < 3) {
      alert("Name must be at least 3 characters long.");
      return;
    }
    setLoading(true);
    
    // Check if user is logged in as admin
    let role = "student";
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      const email = session.user.email;
      if (email === "admin@rojgarsuvidha.com" || email === "superadmin@rojgarsuvidha.com") {
        role = "admin";
      }
    }

    const { data, error } = await supabase.from("chat_users").insert([{ 
      display_name: myName.trim(),
      avatar: Math.floor(Math.random() * 5) + 1 + "",
      role: role
    }]).select().single();

    if (error) {
      alert("Error joining chat.");
    } else if (data) {
      localStorage.setItem("chat_user_id", data.id);
      localStorage.setItem("chat_user_name", data.display_name);
      setMyUserId(data.id);
      setMyRole(data.role);
      setSetupMode(false);
    }
    setLoading(false);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !myUserId || isBanned) return;

    if (!isMessageClean(inputText)) {
      alert("⚠️ Warning: Phone numbers, emails, or bad words are strictly prohibited for safety reasons.");
      return;
    }

    const tempText = inputText.trim();
    setInputText("");

    const { error } = await supabase.from("chat_messages").insert([{
      user_id: myUserId,
      text_content: tempText
    }]);

    if (error) {
      alert("Failed to send message. Please try again.");
    }
  };

  if (isBanned) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md text-center">
          <ShieldAlert className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-black text-gray-900 mb-2">Account Banned</h2>
          <p className="text-gray-500">You have been permanently banned from the community for violating our safety guidelines.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col md:py-6">
      <div className="max-w-4xl w-full mx-auto bg-white dark:bg-gray-900 md:rounded-3xl shadow-sm border border-gray-200 dark:border-gray-800 flex flex-col flex-1 h-[100dvh] md:h-[90vh] overflow-hidden">
        
        {/* Header */}
        <div className="bg-indigo-600 px-4 md:px-6 py-4 flex items-center justify-between shrink-0 z-10">
          <div>
            <h1 className="text-xl font-extrabold text-white flex items-center gap-2">
              <Users className="w-5 h-5" /> Rojgar Chaupal 
              <span className="bg-green-500 text-white text-[10px] uppercase font-black px-2 py-0.5 rounded-full ml-2">Live</span>
            </h1>
            <p className="text-indigo-100 text-xs mt-1">Discuss exams, syllabus, and results with fellow aspirants.</p>
          </div>
        </div>

        {/* Setup Mode Overlay */}
        {setupMode && (
          <div className="absolute inset-0 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-2xl max-w-sm w-full border border-gray-100 dark:border-gray-700">
              <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900/50 rounded-full flex items-center justify-center mx-auto mb-4">
                <UserCheck className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
              </div>
              <h2 className="text-2xl font-black text-gray-900 dark:text-white text-center mb-2">Join the Discussion</h2>
              <p className="text-gray-500 dark:text-gray-400 text-sm text-center mb-6">Enter a display name to start chatting. No phone number required.</p>
              
              <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl mb-6 flex gap-2 items-start">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-800">Do not share your personal phone number or email in the chat for your own safety.</p>
              </div>

              <input 
                type="text" 
                placeholder="Enter your name (e.g., Rahul Kumar)"
                value={myName}
                onChange={(e) => setMyName(e.target.value)}
                className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-xl px-4 py-3 font-medium mb-4 outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
                maxLength={20}
              />
              <button 
                onClick={handleJoin}
                disabled={loading || myName.trim().length < 3}
                className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2"
              >
                {loading ? "Joining..." : "Enter Chat Room"}
              </button>
            </div>
          </div>
        )}

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 bg-gray-50 dark:bg-gray-950 relative">
          {loading && messages.length === 0 ? (
             <div className="flex justify-center items-center h-full">
               <span className="text-gray-400 font-medium animate-pulse">Loading messages...</span>
             </div>
          ) : messages.length === 0 ? (
            <div className="text-center text-gray-400 my-10">No messages yet. Be the first to say hello!</div>
          ) : (
            messages.map((msg, idx) => {
              // Group messages by same user if consecutive
              const isMe = msg.user_id === myUserId;
              const isDeleted = msg.is_deleted;
              const isAdmin = msg.chat_users?.role === 'admin';
              
              return (
                <div key={msg.id} className={`flex w-full ${isMe ? 'justify-end' : 'justify-start'}`}>
                  <div className={`flex max-w-[85%] md:max-w-[70%] gap-2 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                    
                    {/* Avatar */}
                    {!isMe && (
                      <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center shrink-0 mt-1">
                        <span className="text-indigo-600 font-bold text-xs">
                          {msg.chat_users?.display_name?.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}

                    {/* Message Bubble */}
                    <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                      {!isMe && (
                        <div className="flex items-center gap-1.5 mb-1 ml-1">
                          <span className="text-[11px] font-bold text-gray-600 dark:text-gray-400">
                            {msg.chat_users?.display_name}
                          </span>
                          {isAdmin && (
                            <span className="bg-indigo-600 text-white text-[9px] px-1.5 py-0.5 rounded uppercase tracking-wider font-black flex items-center gap-0.5">
                              <CheckCircle2 className="w-2.5 h-2.5" /> Admin
                            </span>
                          )}
                        </div>
                      )}
                      
                      <div className={`px-4 py-2.5 rounded-2xl text-[14px] ${
                        isDeleted 
                          ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 italic border border-gray-200 dark:border-gray-700'
                          : isAdmin
                            ? 'bg-indigo-50 dark:bg-indigo-900/40 text-indigo-900 dark:text-indigo-100 border border-indigo-200 dark:border-indigo-700'
                            : isMe 
                              ? 'bg-indigo-600 text-white' 
                              : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-700'
                      } ${isMe ? 'rounded-tr-sm' : 'rounded-tl-sm'}`}>
                        {isDeleted ? "This message was deleted by Admin." : msg.text_content}
                      </div>
                      
                      <span className="text-[9px] text-gray-400 mt-1 mx-1">
                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-3 md:p-4 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 shrink-0">
          <form onSubmit={handleSendMessage} className="flex items-center gap-2">
            <input 
              type="text" 
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 bg-gray-100 dark:bg-gray-800 border-transparent rounded-full px-5 py-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:bg-white dark:focus:bg-gray-900 outline-none transition-all dark:text-white"
              maxLength={500}
              disabled={setupMode || isBanned}
            />
            <button 
              type="submit"
              disabled={!inputText.trim() || setupMode || isBanned}
              className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:hover:bg-indigo-600 text-white p-3 rounded-full transition-colors flex items-center justify-center shrink-0 shadow-md"
            >
              <Send className="w-5 h-5 ml-1" />
            </button>
          </form>
          <p className="text-[10px] text-center text-gray-400 mt-2 font-medium">
            Remember to be respectful. Spamming or abusive language will lead to a permanent ban.
          </p>
        </div>

      </div>
    </div>
  );
}
