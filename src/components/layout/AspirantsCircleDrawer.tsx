"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { Send, Users, ShieldAlert, CheckCircle2, UserCheck, AlertTriangle, X, Loader2, ArrowDown, Trash2 } from "lucide-react";

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

const BAD_WORDS_SUBSTRING = [
  "chutiya", "madarchod", "behenchod", "bhenchod", "harami", "kamina", "kamine",
  "asshole", "bastard", "bhosdike", "bhosadi", "laundiya", "randi"
];

const BAD_WORDS_EXACT = [
  "fuck", "bitch", "gandu", "bsdk", "mc", "bc", "chut", "lund", "lauda",
  "kutta", "kutti", "saala", "saali", "gali"
];

const isMessageClean = (text: string) => {
  // Convert to lowercase and normalize common spacer symbols to check substrings
  const cleanText = text.toLowerCase().replace(/[\s\-_.*\n]/g, "");
  
  // 1. Check substring bad words
  if (BAD_WORDS_SUBSTRING.some(word => cleanText.includes(word))) return false;
  
  // 2. Check exact words (split by common word boundaries)
  const words = text.toLowerCase().split(/[\s\-_.*,\n]+/);
  if (words.some(word => BAD_WORDS_EXACT.includes(word))) return false;
  
  // 3. Check for 10-digit mobile numbers (anti-spam)
  if (/\d{10}/.test(text.replace(/[\s-]/g, ""))) return false;
  
  return true;
};

export default function AspirantsCircleDrawer() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(false);
  const [joining, setJoining] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Smart scroll and unread tracking
  const [showScrollDownButton, setShowScrollDownButton] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const prevMessagesLengthRef = useRef(0);

  // User Auth & Session State
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  const [myUserId, setMyUserId] = useState<string | null>(null);
  const [myName, setMyName] = useState("");
  const [myRole, setMyRole] = useState("student");
  const [isBanned, setIsBanned] = useState(false);
  const [setupMode, setSetupMode] = useState(false);

  useEffect(() => {
    // Listen for global open event
    const handleOpen = () => {
      setIsOpen(true);
    };
    window.addEventListener("openAspirantsCircle", handleOpen);
    return () => window.removeEventListener("openAspirantsCircle", handleOpen);
  }, []);

  useEffect(() => {
    window.dispatchEvent(new CustomEvent("aspirantsCircleStateChange", { detail: { isOpen } }));
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    
    // Check session and profile when drawer opens
    checkUserSession();
    fetchMessages();

    // Subscribe to real-time new messages
    const channel = supabase
      .channel("public-chat")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "chat_messages" },
        (payload) => {
          fetchSingleMessage(payload.new.id);
        }
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
      .subscribe();

    // POLLING FALLBACK: Poll for new messages every 8 seconds in case Realtime isn't enabled
    const pollInterval = setInterval(() => {
      fetchMessages();
    }, 8000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(pollInterval);
    };
  }, [isOpen]);

  // Smart auto-scroll logic (WhatsApp/Telegram style)
  useEffect(() => {
    const container = chatContainerRef.current;
    if (!container) return;

    if (messages.length > prevMessagesLengthRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = container;
      const isScrolledUp = scrollHeight - scrollTop - clientHeight > 200;
      
      const lastMessage = messages[messages.length - 1];
      const isMyOwnMessage = lastMessage?.user_id === myUserId;

      if (!isScrolledUp || isMyOwnMessage) {
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 50);
        setUnreadCount(0);
      } else {
        setUnreadCount(prev => prev + 1);
      }
    } else if (messages.length > 0 && prevMessagesLengthRef.current === 0) {
      // Initial load scroll
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "auto" });
      }, 50);
    }
    prevMessagesLengthRef.current = messages.length;
  }, [messages, myUserId]);

  const handleScroll = () => {
    const container = chatContainerRef.current;
    if (!container) return;

    const { scrollTop, scrollHeight, clientHeight } = container;
    const isScrolledUp = scrollHeight - scrollTop - clientHeight > 150;
    setShowScrollDownButton(isScrolledUp);

    if (!isScrolledUp) {
      setUnreadCount(0);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    setUnreadCount(0);
    setShowScrollDownButton(false);
  };

  const checkUserSession = async () => {
    setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      setIsLoggedIn(false);
      setLoading(false);
      return;
    }

    setIsLoggedIn(true);

    // 1. Check if user already exists in chat_users by their Auth ID
    const { data: chatUser } = await supabase
      .from("chat_users")
      .select("*")
      .eq("id", session.user.id)
      .maybeSingle();

    if (chatUser) {
      setMyUserId(chatUser.id);
      setMyName(chatUser.display_name);
      setMyRole(chatUser.role);
      setIsBanned(chatUser.is_banned);
      setSetupMode(false);
      localStorage.setItem("chat_user_id", chatUser.id);
      localStorage.setItem("chat_user_name", chatUser.display_name);
    } else {
      // 2. Check local storage fallback
      const storedUserId = localStorage.getItem("chat_user_id");
      const storedName = localStorage.getItem("chat_user_name");

      if (storedUserId && storedName) {
        setMyUserId(storedUserId);
        setMyName(storedName);
        
        // Verify user status in db
        const { data: chatUserL } = await supabase
          .from("chat_users")
          .select("*")
          .eq("id", storedUserId)
          .maybeSingle();

        if (chatUserL) {
          setMyRole(chatUserL.role);
          setIsBanned(chatUserL.is_banned);
          setSetupMode(false);
        } else {
          setSetupMode(true);
        }
      } else {
        // 3. Auto-detect display name from profiles table
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("id", session.user.id)
          .maybeSingle();

        setMyName(profile?.full_name || session.user.email?.split("@")[0] || "");
        setSetupMode(true);
      }
    }
    setLoading(false);
  };

  const fetchMessages = async () => {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // 1. Clean up messages older than 7 days from DB
    try {
      await supabase
        .from("chat_messages")
        .delete()
        .lt("created_at", sevenDaysAgo.toISOString());
    } catch (err) {
      console.warn("Cleanup of old messages failed:", err);
    }

    // 2. Query only messages from the last 7 days
    const { data } = await supabase
      .from("chat_messages")
      .select(`
        id, text_content, is_deleted, created_at, user_id,
        chat_users ( display_name, avatar, role, is_banned )
      `)
      .gte("created_at", sevenDaysAgo.toISOString())
      .order("created_at", { ascending: false })
      .limit(100);
      
    if (data) {
      setMessages(data.reverse() as unknown as ChatMessage[]);
    }
  };

  const fetchSingleMessage = async (msgId: string) => {
    const { data } = await supabase
      .from("chat_messages")
      .select(`
        id, text_content, is_deleted, created_at, user_id,
        chat_users ( display_name, avatar, role, is_banned )
      `)
      .eq("id", msgId)
      .maybeSingle();
      
    if (data) {
      setMessages(prev => {
        if (prev.some(m => m.id === data.id)) return prev;
        return [...prev, data as unknown as ChatMessage];
      });
    }
  };

  const handleJoin = async () => {
    if (myName.trim().length < 3) {
      alert("Name must be at least 3 characters long.");
      return;
    }
    setJoining(true);
    
    let role = "student";
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      const email = session.user.email;
      if (email === "admin@rojgarsuvidha.com" || email === "superadmin@rojgarsuvidha.com") {
        role = "admin";
      }
    }

    // Try creating chat user with the same UUID as Supabase Auth user
    const { data, error } = await supabase.from("chat_users").insert([{ 
      id: session?.user?.id,
      display_name: myName.trim(),
      avatar: Math.floor(Math.random() * 5) + 1 + "",
      role: role
    }]).select().single();

    if (error) {
      console.error("Error joining with auth ID, retrying with default ID:", error);
      // Fallback: auto-generated UUID
      const { data: retryData, error: retryError } = await supabase.from("chat_users").insert([{ 
        display_name: myName.trim(),
        avatar: Math.floor(Math.random() * 5) + 1 + "",
        role: role
      }]).select().single();

      if (retryError) {
        alert("Error joining: " + retryError.message);
      } else if (retryData) {
        localStorage.setItem("chat_user_id", retryData.id);
        localStorage.setItem("chat_user_name", retryData.display_name);
        setMyUserId(retryData.id);
        setMyRole(retryData.role);
        setSetupMode(false);
      }
    } else if (data) {
      localStorage.setItem("chat_user_id", data.id);
      localStorage.setItem("chat_user_name", data.display_name);
      setMyUserId(data.id);
      setMyRole(data.role);
      setSetupMode(false);
    }
    setJoining(false);
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
      setInputText(tempText); // restore text
    }
  };

  const handleDeleteMessage = async (msgId: string) => {
    if (!confirm("Are you sure you want to delete this message?")) return;
    const { error } = await supabase
      .from("chat_messages")
      .update({ is_deleted: true })
      .eq("id", msgId);
      
    if (error) {
      alert("Failed to delete message: " + error.message);
    } else {
      setMessages(prev =>
        prev.map(m => m.id === msgId ? { ...m, is_deleted: true } : m)
      );
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex justify-end">
      {/* Backdrop overlay */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300"
        onClick={() => setIsOpen(false)}
      />

      {/* Drawer Panel */}
      <div className="relative w-full md:w-[50%] lg:w-[45%] xl:w-[40%] h-full bg-white dark:bg-gray-900 shadow-2xl border-l border-gray-200 dark:border-gray-800 flex flex-col z-10 transition-transform duration-300">
        
        {/* Drawer Header */}
        <div className="bg-indigo-600 dark:bg-indigo-700 px-5 py-4 flex items-center justify-between shrink-0 relative overflow-hidden">
          <div className="absolute -top-10 -right-10 w-24 h-24 bg-white/10 rounded-full blur-xl pointer-events-none" />
          <div className="flex items-center gap-2.5 relative z-10">
            <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center border border-white/20 backdrop-blur-sm shadow-inner">
              <Users className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="font-extrabold text-white text-base leading-tight flex items-center gap-2">
                Aspirants Adda
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-black bg-green-500 text-white animate-pulse">LIVE</span>
              </h2>
              <p className="text-[11px] text-indigo-100 mt-0.5">India's Live Student Discussion Forum</p>
            </div>
          </div>
          <button 
            onClick={() => setIsOpen(false)}
            className="p-1.5 hover:bg-white/15 rounded-xl transition-colors relative z-20 text-white"
            aria-label="Close drawer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Setup/Loading States */}
        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-2 bg-gray-50 dark:bg-gray-950">
            <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
            <span className="text-xs text-gray-500 font-bold uppercase tracking-wider">Verifying session...</span>
          </div>
        ) : isLoggedIn === false ? (
          // Please Login Prompt
          <div className="flex-1 flex flex-col items-center justify-center p-6 bg-gray-50 dark:bg-gray-950 text-center">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-950/40 rounded-full flex items-center justify-center mb-4">
              <ShieldAlert className="w-8 h-8 text-red-600 dark:text-red-400" />
            </div>
            <h3 className="text-xl font-black text-gray-900 dark:text-white mb-2">Login Required</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm mb-6 leading-relaxed">
              Aspirants Adda is exclusive to registered students. Log in to discuss exams, results, and syllabus with other aspirants.
            </p>
            <a 
              href="/login?redirect=/dashboard"
              onClick={() => setIsOpen(false)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold px-6 py-3 rounded-xl transition-all shadow-lg shadow-indigo-500/20 text-sm"
            >
              Sign In / Login Now →
            </a>
          </div>
        ) : isBanned ? (
          // Banned Screen
          <div className="flex-1 flex flex-col items-center justify-center p-6 bg-gray-50 dark:bg-gray-950 text-center">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-950/40 rounded-full flex items-center justify-center mb-4">
              <ShieldAlert className="w-8 h-8 text-red-500" />
            </div>
            <h3 className="text-xl font-black text-gray-900 dark:text-white mb-2">Account Suspended</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm">
              Your account has been banned from the community for violating our safety guidelines.
            </p>
          </div>
        ) : setupMode ? (
          // Display Name Setup/Confirmation Dialog
          <div className="flex-1 flex flex-col items-center justify-center p-6 bg-gray-50 dark:bg-gray-950">
            <div className="bg-white dark:bg-gray-900 p-6 md:p-8 rounded-3xl border border-gray-200 dark:border-gray-800 shadow-xl max-w-sm w-full">
              <div className="w-14 h-14 bg-indigo-100 dark:bg-indigo-900/40 rounded-full flex items-center justify-center mx-auto mb-4">
                <UserCheck className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
              </div>
              <h3 className="text-xl font-black text-gray-900 dark:text-white text-center mb-2">Confirm Display Name</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 text-center mb-5">
                We auto-detected your name. This will be shown to other aspirants in the chat.
              </p>

              <div className="bg-amber-50 border border-amber-200 dark:bg-amber-900/10 dark:border-amber-800/30 p-3 rounded-xl mb-5 flex gap-2 items-start">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <p className="text-[11px] text-amber-800 dark:text-amber-300 leading-normal">
                  Do not include your phone number or email in your name to preserve your privacy.
                </p>
              </div>

              <input 
                type="text" 
                placeholder="Name (e.g., Sunil Kumar)"
                value={myName}
                onChange={(e) => setMyName(e.target.value)}
                className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl px-4 py-3 text-sm font-semibold mb-4 outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
                maxLength={20}
              />

              <button 
                onClick={handleJoin}
                disabled={joining || myName.trim().length < 3}
                className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2"
              >
                {joining ? "Joining..." : "Confirm & Join Chat"}
              </button>
            </div>
          </div>
        ) : (
          // Active Chat view
          <>
            {/* Chat Messages */}
            <div 
              ref={chatContainerRef}
              onScroll={handleScroll}
              className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-gray-950 scrollbar-thin relative"
            >
              {messages.length === 0 ? (
                <div className="text-center text-gray-400 dark:text-gray-500 my-10 text-xs font-semibold">
                  No messages yet. Say hello to start the discussion!
                </div>
              ) : (
                messages.map((msg) => {
                  const isMe = msg.user_id === myUserId;
                  const isDeleted = msg.is_deleted;
                  const isAdmin = msg.chat_users?.role === 'admin';
                  
                  return (
                    <div key={msg.id} className={`flex w-full ${isMe ? 'justify-end' : 'justify-start'}`}>
                      <div className={`flex max-w-[85%] gap-2 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                        
                        {/* Avatar */}
                        {!isMe && (
                          <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center shrink-0 mt-1 shadow-sm border border-indigo-200/50">
                            <span className="text-indigo-600 dark:text-indigo-300 font-bold text-xs">
                              {msg.chat_users?.display_name?.charAt(0).toUpperCase() || "?"}
                            </span>
                          </div>
                        )}

                        <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                          {/* Name Tag */}
                          {!isMe && (
                            <div className="flex items-center gap-1 mb-1 ml-1">
                              <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400">
                                {msg.chat_users?.display_name || "Aspirant"}
                              </span>
                              {isAdmin && (
                                <span className="bg-indigo-600 text-white text-[8px] px-1.5 py-0.5 rounded font-black flex items-center gap-0.5 tracking-wider">
                                  <CheckCircle2 className="w-2 h-2" /> Admin
                                </span>
                              )}
                            </div>
                          )}

                          {/* Text Bubble */}
                          <div className={`flex items-center gap-1.5 group/msg ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                            <div className={`px-4 py-2.5 rounded-2xl text-[13px] font-medium leading-relaxed ${
                              isDeleted 
                                ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 italic border border-gray-200 dark:border-gray-700'
                                : isAdmin
                                  ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-200 border border-indigo-200/50 dark:border-indigo-900/50'
                                  : isMe 
                                    ? 'bg-indigo-600 text-white shadow-sm' 
                                    : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-800 shadow-sm'
                            } ${isMe ? 'rounded-tr-sm' : 'rounded-tl-sm'}`}>
                              {isDeleted ? "This message was deleted by Admin." : msg.text_content}
                            </div>
                            
                            {myRole === 'admin' && !isDeleted && (
                              <button
                                onClick={() => handleDeleteMessage(msg.id)}
                                className="opacity-0 group-hover/msg:opacity-100 p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-all shrink-0 cursor-pointer"
                                title="Delete Message"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                          
                          {/* Time */}
                          <span className="text-[8px] text-gray-400 dark:text-gray-500 mt-1 mx-1">
                            {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />

              {/* Floating Scroll Down Arrow */}
              {showScrollDownButton && (
                <button
                  type="button"
                  onClick={scrollToBottom}
                  className="absolute bottom-4 right-4 bg-indigo-600 hover:bg-indigo-700 text-white p-3 rounded-full shadow-2xl transition-all transform hover:scale-110 active:scale-95 flex items-center justify-center gap-1.5 z-40 border border-indigo-500/20"
                >
                  <ArrowDown className="w-4 h-4 animate-bounce" />
                  {unreadCount > 0 && (
                    <span className="bg-red-500 text-white text-[9px] px-1.5 py-0.5 rounded-full font-black min-w-[15px] h-[15px] flex items-center justify-center shadow-sm">
                      {unreadCount}
                    </span>
                  )}
                </button>
              )}
            </div>

            {/* Input Form */}
            <div className="p-3 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 shrink-0">
              <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                <input 
                  type="text" 
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Type a message (exams, prep, syllabus...)"
                  className="flex-1 bg-gray-100 dark:bg-gray-800 border-transparent rounded-full px-5 py-3 text-xs focus:ring-2 focus:ring-indigo-500 focus:bg-white dark:focus:bg-gray-900 outline-none transition-all dark:text-white"
                  maxLength={500}
                />
                <button 
                  type="submit"
                  disabled={!inputText.trim()}
                  className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white p-3 rounded-full transition-colors flex items-center justify-center shrink-0 shadow-md"
                >
                  <Send className="w-4 h-4 ml-0.5" />
                </button>
              </form>
              <p className="text-[9px] text-center text-gray-400 dark:text-gray-500 mt-2 font-semibold">
                Please remain respectful. Phone numbers and abuse are prohibited.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
