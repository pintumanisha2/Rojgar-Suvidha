"use client";

import React, { useState, useEffect, useRef } from "react";
import { MessageCircle, ChevronUp, ChevronDown, X, Send, Paperclip, Loader2, Phone, Video, PhoneCall } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface ChatMessage {
  id: string;
  sender_id: string;
  receiver_id: string;
  message: string;
  sender_type: "employer" | "candidate";
  created_at: string;
  sender_name?: string;
  company_name?: string;
  receiver_name?: string;
}

interface ChatThread {
  id: string;
  name: string;
  company: string;
  lastMessage: string;
  timestamp: number;
}

export default function FloatingInbox() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>("Candidate");
  
  // ZegoCloud Call States
  const [incomingCall, setIncomingCall] = useState<{ roomId: string, type: 'video'|'audio', callerName: string, messageId: string } | null>(null);
  const [activeCallRoomId, setActiveCallRoomId] = useState<string | null>(null);
  const [callType, setCallType] = useState<'video'|'audio'>('video');
  const callContainerRef = useRef<HTMLDivElement>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(interval);
  }, []);

  const getActiveStatus = (timestamp?: number) => {
    if (!timestamp) return { text: "Offline", isOnline: false };
    const diffInMins = Math.floor((now - timestamp) / 60000);
    if (diffInMins < 5) return { text: "Online", isOnline: true };
    if (diffInMins < 60) return { text: `Active ${diffInMins}m ago`, isOnline: false };
    if (diffInMins < 1440) return { text: `Active ${Math.floor(diffInMins/60)}h ago`, isOnline: false };
    return { text: `Active ${Math.floor(diffInMins/1440)}d ago`, isOnline: false };
  };

  useEffect(() => {
    // Handle mounting ZegoCloud if call is active
    let zp: any = null;
    if (activeCallRoomId && callContainerRef.current) {
      const initZego = async () => {
        const appID = parseInt(process.env.NEXT_PUBLIC_ZEGO_APP_ID || "0"); 
        const serverSecret = process.env.NEXT_PUBLIC_ZEGO_SERVER_SECRET || "";
        
        if (!appID || !serverSecret) return;

        const { ZegoUIKitPrebuilt } = await import("@zegocloud/zego-uikit-prebuilt");
        const kitToken = ZegoUIKitPrebuilt.generateKitTokenForTest(
          appID, 
          serverSecret, 
          activeCallRoomId, 
          Date.now().toString(), 
          userName
        );

        zp = ZegoUIKitPrebuilt.create(kitToken);
        zp.joinRoom({
          container: callContainerRef.current,
          scenario: { mode: ZegoUIKitPrebuilt.OneONoneCall },
          showPreJoinView: false,
          turnOnCameraWhenJoining: callType === 'video',
          turnOnMicrophoneWhenJoining: true,
          showLeavingView: false,
          onLeaveRoom: () => {
            setActiveCallRoomId(null);
          }
        });
      };
      initZego();
    }
    return () => {
      if (zp) zp.destroy();
    };
  }, [activeCallRoomId, userName, callType]);

  useEffect(() => {
    // Scroll to bottom of chat
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages, isExpanded, selectedThreadId]);

  useEffect(() => {
    const initSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session?.user) {
        setUserId(data.session.user.id);
        setUserName(data.session.user.user_metadata?.full_name || "Candidate");
      }
    };
    initSession();
  }, []);

  const loadMessages = async () => {
    let loadedMessages: ChatMessage[] = [];
    
    // DB Fetch
    if (userId) {
      try {
        const { data: messages } = await supabase
          .from("private_messages")
          .select("*")
          .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
          .order("created_at", { ascending: true });
          
        if (messages) loadedMessages = messages as ChatMessage[];
      } catch(e) {}
    }

    // Combine with Local Storage Mocks (as done in dashboard)
    const mockStr = localStorage.getItem("rs_candidate_mock_messages");
    if (mockStr) {
      const mockMsgs = JSON.parse(mockStr) as ChatMessage[];
      
      // Merge, avoid duplicates
      const existingIds = new Set(loadedMessages.map(m => m.id));
      for (const m of mockMsgs) {
        if (!existingIds.has(m.id)) {
          loadedMessages.push(m);
        }
      }
      loadedMessages.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    }
    
    setChatMessages(loadedMessages);

    // Group into threads
    const empMap = new Map<string, ChatThread>();
    loadedMessages.forEach((m) => {
      const empId = m.sender_type === "employer" ? m.sender_id : m.receiver_id;
      const empName = m.sender_type === "employer" ? m.sender_name : m.receiver_name;
      const compName = m.company_name || "Company";
      
      const ts = new Date(m.created_at).getTime();
      
      if (!empMap.has(empId)) {
        empMap.set(empId, {
          id: empId,
          name: empName || "HR Manager",
          company: compName,
          lastMessage: m.message,
          timestamp: ts,
        });
      } else {
        const existing = empMap.get(empId)!;
        if (ts > existing.timestamp) {
          existing.lastMessage = m.message;
          existing.timestamp = ts;
        }
      }
    });

    const sortedThreads = Array.from(empMap.values()).sort((a, b) => b.timestamp - a.timestamp);
    setThreads(sortedThreads);

    // Check for incoming calls in the last 60 seconds
    const now = Date.now();
    const recentCallMsg = loadedMessages.reverse().find(m => 
      m.sender_type === "employer" && 
      m.message.includes("I'm starting a") && 
      m.message.includes("call. Please join here:") &&
      (now - new Date(m.created_at).getTime() < 60000)
    );

    if (recentCallMsg && !activeCallRoomId) {
      // Check if we already rejected/accepted this specific message call to prevent loop
      if (incomingCall?.messageId !== recentCallMsg.id) {
        const isVideo = recentCallMsg.message.includes("video call");
        const match = recentCallMsg.message.match(/employer\/call\/(room_[a-zA-Z0-9]+)/);
        if (match && match[1]) {
          setIncomingCall({
            roomId: match[1],
            type: isVideo ? 'video' : 'audio',
            callerName: recentCallMsg.sender_name || "Recruiter",
            messageId: recentCallMsg.id
          });
          setIsExpanded(true);
        }
      }
    }
  };

  useEffect(() => {
    loadMessages();

    // Listen for LocalStorage mock changes
    const handleStorage = (e: StorageEvent) => {
      if (e.key === "rs_candidate_mock_messages") {
        loadMessages();
      }
    };
    window.addEventListener("storage", handleStorage);

    // Setup Real-time Supabase Subscription for incoming Employer messages
    let channel: any;
    if (userId) {
      channel = supabase.channel('candidate_inbox')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'private_messages',
            filter: `receiver_id=eq.${userId}`
          },
          (payload) => {
            loadMessages(); // Refresh messages instantly when a new one arrives
          }
        )
        .subscribe();
    }

    return () => {
      window.removeEventListener("storage", handleStorage);
      if (channel) supabase.removeChannel(channel);
    };
  }, [userId]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !selectedThreadId) return;

    const messageText = chatInput.trim();
    setChatInput("");

    const targetEmp = threads.find(c => c.id === selectedThreadId);
    const candId = userId || "cand-sandbox-123";

    const newMsgObj: ChatMessage = {
      id: "msg-" + Date.now(),
      sender_id: candId,
      receiver_id: selectedThreadId,
      message: messageText,
      sender_type: "candidate",
      created_at: new Date().toISOString(),
      sender_name: userName,
      receiver_name: targetEmp?.name || "HR"
    };

    // Save to Local Storage Mocks
    const existingStr = localStorage.getItem("rs_candidate_mock_messages");
    const existing = existingStr ? JSON.parse(existingStr) : [];
    localStorage.setItem("rs_candidate_mock_messages", JSON.stringify([...existing, newMsgObj]));
    
    // Also save to DB if logged in
    if (userId) {
      supabase.from("private_messages").insert([{
        sender_id: candId,
        receiver_id: selectedThreadId,
        message: messageText,
        sender_type: "candidate",
        sender_name: userName,
        receiver_name: targetEmp?.name || "HR"
      }]).then();
    }

    setChatMessages(prev => [...prev, newMsgObj]);
    window.dispatchEvent(new Event("storage"));
    loadMessages();
  };

  // Always show the widget
  return (
    <div className="fixed bottom-0 right-4 sm:right-8 z-50 flex flex-col items-end pointer-events-none drop-shadow-2xl">
      {/* Expanded Container */}
      <div 
        className={`bg-white dark:bg-slate-900 w-[340px] sm:w-[360px] rounded-t-2xl border border-slate-200 dark:border-slate-800 flex flex-col transition-all duration-300 pointer-events-auto shadow-[0_-8px_30px_rgba(0,0,0,0.12)] ${isExpanded ? "h-[450px] sm:h-[480px]" : "h-12 translate-y-full opacity-0"}`}
      >
        {/* Main Content Area */}
        <div className="flex-1 overflow-hidden flex">
          {selectedThreadId ? (
            // Chat View
            <div className="flex-1 flex flex-col w-full h-full">
              {/* Chat Header */}
              <div className="p-3 border-b border-gray-100 dark:border-slate-800 flex items-center gap-3 bg-white dark:bg-slate-900/90 relative z-10 shadow-sm">
                <button 
                  onClick={(e) => { e.stopPropagation(); setSelectedThreadId(null); }}
                  className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                >
                  <ChevronDown className="w-5 h-5 text-slate-500 rotate-90" />
                </button>
                <div className="w-9 h-9 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center relative shrink-0">
                  <span className="text-indigo-600 dark:text-indigo-400 font-bold text-sm">
                    {threads.find(t => t.id === selectedThreadId)?.name?.slice(0, 2).toUpperCase() || "HR"}
                  </span>
                  {getActiveStatus(threads.find(t => t.id === selectedThreadId)?.timestamp).isOnline && (
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-white dark:border-slate-900 rounded-full"></span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-extrabold text-slate-900 dark:text-white truncate flex items-center gap-2">
                    {threads.find(t => t.id === selectedThreadId)?.name}
                  </h4>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <p className="text-[10px] text-slate-500 truncate font-medium max-w-[120px]">
                      {threads.find(t => t.id === selectedThreadId)?.company}
                    </p>
                    <span className="text-slate-300 dark:text-slate-700 text-[10px]">•</span>
                    <p className={`text-[10px] font-bold ${getActiveStatus(threads.find(t => t.id === selectedThreadId)?.timestamp).isOnline ? "text-emerald-500" : "text-slate-400"}`}>
                      {getActiveStatus(threads.find(t => t.id === selectedThreadId)?.timestamp).text}
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {chatMessages
                  .filter(m => (m.sender_type === "employer" && m.sender_id === selectedThreadId) || (m.sender_type === "candidate" && m.receiver_id === selectedThreadId))
                  .map((m) => {
                    const isCandidate = m.sender_type === "candidate";
                    return (
                      <div key={m.id} className={`flex items-start gap-2 ${isCandidate ? "justify-end" : ""}`}>
                        {!isCandidate && (
                          <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                            {m.sender_name?.slice(0, 2).toUpperCase() || "HR"}
                          </div>
                        )}
                        <div className={`${isCandidate ? "bg-indigo-600 text-white rounded-tr-sm" : "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-tl-sm"} p-2.5 rounded-2xl max-w-[80%]`}>
                          <p className="text-xs font-medium leading-relaxed whitespace-pre-wrap">
                            {m.message.includes("I'm starting a") && m.message.includes("call. Please join here:") ? (
                              <div className="flex flex-col gap-2">
                                <span>Incoming {m.message.includes("video") ? "Video" : "Audio"} Call</span>
                                <button 
                                  onClick={() => {
                                    const match = m.message.match(/employer\/call\/(room_[a-zA-Z0-9]+)/);
                                    if (match && match[1]) {
                                      setCallType(m.message.includes("video") ? "video" : "audio");
                                      setActiveCallRoomId(match[1]);
                                    }
                                  }}
                                  className="bg-indigo-50 text-indigo-600 hover:bg-white px-3 py-1.5 rounded-lg text-xs font-bold transition-colors shadow-sm flex items-center justify-center gap-2"
                                >
                                  {m.message.includes("video") ? <Video className="w-3.5 h-3.5" /> : <Phone className="w-3.5 h-3.5" />}
                                  Join Call
                                </button>
                              </div>
                            ) : (
                              m.message
                            )}
                          </p>
                        </div>
                      </div>
                    );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <form onSubmit={handleSendMessage} className="p-3 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 shrink-0">
                <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-800 p-1.5 rounded-full border border-gray-200 dark:border-gray-700 focus-within:ring-2 focus-within:ring-indigo-500">
                  <input 
                    type="text" 
                    value={chatInput}
                    onChange={e => setChatInput(e.target.value)}
                    placeholder="Write a message..." 
                    className="flex-1 bg-transparent px-3 text-xs outline-none text-gray-900 dark:text-white"
                  />
                  <button type="submit" className="p-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full transition-colors">
                    <Send className="w-3.5 h-3.5 ml-0.5" />
                  </button>
                </div>
              </form>
            </div>
          ) : (
            // Thread List View
            <div className="flex-1 overflow-y-auto w-full">
              {threads.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center p-6 opacity-70">
                  <MessageCircle className="w-12 h-12 text-gray-300 dark:text-gray-700 mb-3" />
                  <p className="text-sm font-bold text-gray-500">No Messages Yet</p>
                  <p className="text-xs text-gray-400 mt-1">When recruiters contact you, you will see their messages here.</p>
                </div>
              ) : (
                threads.map(thread => (
                  <div 
                    key={thread.id}
                    onClick={() => setSelectedThreadId(thread.id)}
                    className="p-3 border-b border-gray-50 dark:border-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer flex items-center gap-3 transition-colors"
                  >
                    <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-sm shrink-0">
                      {thread.company.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center mb-0.5">
                        <h4 className="text-sm font-bold text-gray-900 dark:text-white truncate">{thread.name}</h4>
                        <span className="text-[10px] text-gray-400">{new Date(thread.timestamp).toLocaleDateString()}</span>
                      </div>
                      <p className="text-[10px] text-indigo-500 font-bold mb-0.5">{thread.company}</p>
                      <p className="text-xs text-gray-500 truncate">{thread.lastMessage}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* Incoming Call Ringing UI */}
      {incomingCall && !activeCallRoomId && (
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 w-[320px] bg-slate-900 border border-slate-700 p-5 rounded-2xl shadow-2xl z-[60] flex flex-col items-center justify-center animate-in slide-in-from-bottom-5">
          <div className="w-16 h-16 rounded-full bg-indigo-500/20 flex items-center justify-center mb-4 relative">
            <div className="absolute inset-0 rounded-full border-2 border-indigo-500 animate-ping"></div>
            {incomingCall.type === 'video' ? <Video className="w-6 h-6 text-indigo-400" /> : <Phone className="w-6 h-6 text-indigo-400" />}
          </div>
          <h3 className="text-white font-extrabold text-lg">{incomingCall.callerName}</h3>
          <p className="text-indigo-400 text-xs font-medium mt-1">Incoming {incomingCall.type} call...</p>
          
          <div className="flex items-center gap-4 mt-6 w-full px-4">
            <button 
              onClick={() => {
                setIncomingCall(prev => prev ? { ...prev, messageId: prev.messageId } : null); // Keep ID so we don't ring again
                setIncomingCall(null);
              }}
              className="flex-1 py-2.5 rounded-xl bg-rose-500/10 text-rose-500 font-bold text-sm hover:bg-rose-500 hover:text-white transition-colors"
            >
              Decline
            </button>
            <button 
              onClick={() => {
                setCallType(incomingCall.type);
                setActiveCallRoomId(incomingCall.roomId);
                setIncomingCall(null);
              }}
              className="flex-1 py-2.5 rounded-xl bg-emerald-500 text-white font-bold text-sm hover:bg-emerald-600 transition-colors shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2"
            >
              <PhoneCall className="w-4 h-4" /> Accept
            </button>
          </div>
        </div>
      )}

      {/* Active Call UI (ZegoCloud Container) */}
      {activeCallRoomId && (
        <div className="absolute bottom-16 right-0 w-[340px] sm:w-[360px] h-[450px] bg-black rounded-2xl overflow-hidden shadow-2xl z-[70] border border-slate-800 flex flex-col">
          <div className="h-10 bg-slate-900 flex items-center justify-between px-4 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
              <span className="text-white text-xs font-bold">Call in progress...</span>
            </div>
            <button onClick={() => setActiveCallRoomId(null)} className="text-gray-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div ref={callContainerRef} className="flex-1 w-full bg-slate-950"></div>
        </div>
      )}

      {/* Persistent Header Bar */}
      <button 
        onClick={() => setIsExpanded(!isExpanded)}
        className="pointer-events-auto bg-slate-900 dark:bg-black border border-slate-800 border-b-0 w-[340px] sm:w-[360px] h-12 flex items-center justify-between px-4 rounded-t-2xl hover:bg-slate-800 dark:hover:bg-gray-900 transition-colors shadow-[0_-4px_20px_rgba(0,0,0,0.2)] relative z-10 group overflow-hidden"
      >
        {/* Subtle top glare effect */}
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
        
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-7 h-7 bg-indigo-500 rounded-full flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <MessageCircle className="w-4 h-4 text-white" />
            </div>
            {threads.length > 0 && (
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-rose-500 border-2 border-slate-900 rounded-full animate-pulse" />
            )}
          </div>
          <span className="font-extrabold text-sm text-white tracking-wide">Messaging</span>
          <span className="text-[10px] font-black text-slate-900 bg-white px-2 py-0.5 rounded-full shadow-sm">{threads.length}</span>
        </div>
        <div className="flex items-center gap-2 text-slate-400 group-hover:text-white transition-colors bg-slate-800/50 p-1 rounded-full">
          {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
        </div>
      </button>
    </div>
  );
}
