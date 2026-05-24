"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { MessageSquare, Search, Phone, Video, MoreVertical, Send, Paperclip, X, User, Mail, Briefcase, FileText, MapPin, Star, Clock, Maximize2, Minimize2 } from "lucide-react";

export default function MessagesPage() {
  const [messages, setMessages] = useState<any[]>([]);
  const [conversations, setConversations] = useState<any[]>([]);
  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null);
  const [chatInput, setChatInput] = useState("");
  const [hrName, setHrName] = useState("HR Manager");
  const [companyName, setCompanyName] = useState("Company");
  const [showProfileDrawer, setShowProfileDrawer] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  // ZegoCloud Call States
  const [activeCallId, setActiveCallId] = useState<string | null>(null);
  const [isCallMinimized, setIsCallMinimized] = useState(false);
  const callContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let zp: any = null;
    
    if (activeCallId && callContainerRef.current) {
      const callType = typeof window !== "undefined" ? sessionStorage.getItem("rs_call_type") || "video" : "video";
      
      const initZego = async () => {
        const appID = parseInt(process.env.NEXT_PUBLIC_ZEGO_APP_ID || "0"); 
        const serverSecret = process.env.NEXT_PUBLIC_ZEGO_SERVER_SECRET || "";
        
        if (!appID || !serverSecret) {
          showToast("Setup Required: Add ZegoCloud keys to .env.local to make calls.");
          setActiveCallId(null);
          return;
        }

        const { ZegoUIKitPrebuilt } = await import("@zegocloud/zego-uikit-prebuilt");
        
        const kitToken = ZegoUIKitPrebuilt.generateKitTokenForTest(
          appID, 
          serverSecret, 
          activeCallId, 
          Date.now().toString(), 
          companyName || "Company"
        );

        zp = ZegoUIKitPrebuilt.create(kitToken);
        zp.joinRoom({
          container: callContainerRef.current,
          scenario: {
            mode: ZegoUIKitPrebuilt.OneONoneCall,
          },
          showPreJoinView: false,
          turnOnCameraWhenJoining: callType === 'video',
          turnOnMicrophoneWhenJoining: true,
          showLeavingView: false,
          onLeaveRoom: () => {
            setActiveCallId(null);
          }
        });
      };
      
      initZego();
    }

    return () => {
      if (zp) {
        zp.destroy();
      }
    };
  }, [activeCallId]);

  const startCall = (type: 'video' | 'audio') => {
    if (!selectedCandidateId) return;
    
    // Generate unique room ID
    const roomId = `room_${Math.random().toString(36).substring(2, 9)}`;
    
    // Store type so Zego config knows whether to turn on camera
    if (typeof window !== "undefined") {
      sessionStorage.setItem("rs_call_type", type);
    }
    
    // Send automated message to candidate
    const targetCand = conversations.find(c => c.id === selectedCandidateId);
    const callLink = `${window.location.protocol}//${window.location.host}/employer/call/${roomId}`;
    
    const newMsgObj = {
      id: "msg-" + Date.now(),
      sender_id: "demo-recruiter-uid",
      receiver_id: selectedCandidateId,
      message: `I'm starting a ${type} call. Please join here: ${callLink}`,
      sender_type: "employer" as const,
      created_at: new Date().toISOString(),
      sender_name: hrName,
      receiver_name: targetCand?.name,
      company_name: companyName
    };

    if (userId) {
      supabase.from("private_messages").insert([newMsgObj]).then();
    }

    // Set active call ID to show the WhatsApp-like overlay
    setActiveCallId(roomId);
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const fetchMessages = async (uid: string) => {
    try {
      const { data, error } = await supabase
        .from("private_messages")
        .select(`
          *,
          sender:sender_id (full_name),
          receiver:receiver_id (full_name)
        `)
        .or(`sender_id.eq.${uid},receiver_id.eq.${uid}`)
        .order("created_at", { ascending: true });

      if (error) throw error;
      
      if (data) {
        setMessages(data);

        // Group by candidate
        const candMap = new Map();
        data.forEach((m: any) => {
          const candId = m.sender_type === "candidate" ? m.sender_id : m.receiver_id;
          const candName = m.sender_type === "candidate" ? (m.sender?.full_name || m.sender_name) : (m.receiver?.full_name || m.receiver_name);
          
          if (!candMap.has(candId)) {
            candMap.set(candId, {
              id: candId,
              name: candName || "Candidate",
              lastMsg: m.message,
              time: new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              timestamp: new Date(m.created_at).getTime(),
              unread: 0
            });
          } else {
            const existing = candMap.get(candId);
            if (new Date(m.created_at).getTime() > existing.timestamp) {
              existing.lastMsg = m.message;
              existing.time = new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
              existing.timestamp = new Date(m.created_at).getTime();
            }
          }
        });

        const sorted = Array.from(candMap.values()).sort((a: any, b: any) => b.timestamp - a.timestamp);
        setConversations(sorted);
      }
    } catch (err) {
      console.warn("Could not fetch messages:", err);
    }
  };

  useEffect(() => {
    let channel: any;

    const initSession = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        const { data: profile } = await supabase.from("employer_profiles").select("*").eq("id", user.id).single();
        if (profile) {
          setHrName(profile.hr_name);
          setCompanyName(profile.company_name);
        }
        
        await fetchMessages(user.id);

        // Realtime Subscription
        channel = supabase.channel('employer_messages')
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'private_messages',
              filter: `receiver_id=eq.${user.id}`
            },
            (payload) => {
              fetchMessages(user.id); // Refresh messages when a new one arrives
            }
          )
          .subscribe();
      }
    };

    initSession();

    // Check if we were redirected from Talent Scout
    const scoutData = sessionStorage.getItem('rs_outbound_scout');
    if (scoutData) {
      try {
        const cand = JSON.parse(scoutData);
        if (cand && cand.id) {
          // If there's no conversation history, we could optionally insert an initial automated message to the DB here.
          // For now, we just select the candidate so the chat window opens.
          setTimeout(() => setSelectedCandidateId(cand.id), 100);
          sessionStorage.removeItem('rs_outbound_scout');
        }
      } catch (e) {}
    }

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, []);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !selectedCandidateId) return;

    const messageText = chatInput.trim();
    setChatInput("");

    if (userId) {
      const newMsgObj = {
        sender_id: userId,
        receiver_id: selectedCandidateId,
        message: messageText,
        sender_type: "employer" as const
      };

      const { error } = await supabase.from("private_messages").insert([newMsgObj]);
      if (error) {
        console.warn("Error sending message:", error);
      }
    }
  };

  const selectedChatMsgs = messages.filter(
    (m: any) => (m.sender_type === "candidate" && m.sender_id === selectedCandidateId) ||
                (m.sender_type === "employer" && m.receiver_id === selectedCandidateId)
  );

  const selectedCandData = conversations.find(c => c.id === selectedCandidateId);

  return (
    <div className="h-[calc(100vh-6rem)] animate-in fade-in duration-300 flex flex-col">
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
          <MessageSquare className="w-6 h-6 text-indigo-500" /> Inbox
        </h1>
        <p className="text-sm text-gray-500 mt-1">Chat directly with sourced candidates and applicants.</p>
      </div>

      <div className="bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl border border-white/50 dark:border-gray-700/50 rounded-3xl shadow-[0_8px_32px_0_rgba(31,38,135,0.07)] flex-1 flex overflow-hidden">
        
        {/* Left Side: Conversation List */}
        <div className="w-full md:w-80 border-r border-gray-100 dark:border-gray-800 flex flex-col">
          <div className="p-4 border-b border-gray-100 dark:border-gray-800">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search messages..."
                className="w-full pl-9 pr-4 py-2 bg-gray-50 dark:bg-gray-850 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-xs transition-all text-gray-900 dark:text-white"
              />
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            {conversations.length === 0 && (
              <div className="p-6 text-center text-gray-400 text-xs font-medium">
                No conversations yet. Message a candidate from the Talent Scout page!
              </div>
            )}
            {conversations.map((chat) => (
              <div 
                key={chat.id} 
                onClick={() => setSelectedCandidateId(chat.id)}
                className={`p-4 border-b border-gray-100/50 dark:border-gray-800/50 cursor-pointer transition-all hover:bg-white/60 dark:hover:bg-gray-800/50 flex gap-3 ${
                  selectedCandidateId === chat.id ? "bg-indigo-50/80 dark:bg-indigo-900/20 border-l-4 border-l-indigo-500 shadow-sm" : "border-l-4 border-l-transparent"
                }`}
              >
                <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-black text-sm shrink-0 border border-indigo-200 dark:border-indigo-800/50 relative">
                  {chat.name.slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <h4 className="text-sm font-extrabold text-gray-900 dark:text-white truncate">{chat.name}</h4>
                    <span className="text-[10px] font-bold text-gray-400 shrink-0">{chat.time}</span>
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-xs truncate text-gray-500 font-medium">
                      {chat.lastMsg}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Side: Chat Window */}
        {selectedCandidateId ? (
          <div className="hidden md:flex flex-1 flex-col bg-gradient-to-br from-indigo-50/30 to-purple-50/30 dark:from-gray-950/50 dark:to-indigo-950/10 relative">
            {/* Chat Header */}
            <div className="h-16 px-6 border-b border-gray-100/50 dark:border-gray-800/50 flex items-center justify-between bg-white/40 dark:bg-gray-900/40 backdrop-blur-md shrink-0">
                <div 
                  className="flex items-center gap-3 cursor-pointer group"
                  onClick={() => setShowProfileDrawer(!showProfileDrawer)}
                >
                  <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-black text-sm shrink-0 border border-indigo-200 dark:border-indigo-800/50 group-hover:scale-105 transition-transform">
                    {selectedCandData?.name?.slice(0, 2).toUpperCase() || "CN"}
                  </div>
                  <div>
                    <h3 className="font-extrabold text-gray-900 dark:text-white text-sm group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                      {selectedCandData?.name || "Candidate"}
                    </h3>
                    <p className="text-[10px] font-bold text-gray-500 flex items-center gap-1">
                      Candidate <span className="w-1 h-1 rounded-full bg-green-500 animate-pulse"></span> Online
                    </p>
                  </div>
                </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => startCall('audio')}
                  className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-colors"
                >
                  <Phone className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => startCall('video')}
                  className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-colors"
                >
                  <Video className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => setShowProfileDrawer(!showProfileDrawer)}
                  className={`p-2 rounded-lg transition-colors ${showProfileDrawer ? 'text-indigo-600 bg-indigo-50 dark:bg-indigo-900/30' : 'text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30'}`}
                >
                  <User className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 p-6 overflow-y-auto flex flex-col gap-4">
              {selectedChatMsgs.map((m: any) => {
                const isEmployer = m.sender_type === "employer";
                return (
                  <div key={m.id} className={`flex items-start gap-3 ${isEmployer ? "justify-end" : ""}`}>
                    {!isEmployer && (
                      <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-black text-xs shrink-0 mt-1">
                        {m.sender_name?.slice(0, 2).toUpperCase() || "CN"}
                      </div>
                    )}
                    <div className={`${isEmployer ? "bg-indigo-600 text-white rounded-tr-sm" : "bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 text-gray-900 dark:text-gray-100 rounded-tl-sm"} p-3 rounded-2xl max-w-[75%] shadow-sm`}>
                      <p className="text-xs font-medium leading-relaxed whitespace-pre-wrap">
                        {m.message.includes('http') ? (
                          <>
                            {m.message.split(/(https?:\/\/[^\s]+)/g).map((part: string, i: number) => 
                              part.match(/https?:\/\/[^\s]+/) ? (
                                <a key={i} href={part} target="_blank" rel="noopener noreferrer" className="underline hover:text-indigo-200">
                                  {part}
                                </a>
                              ) : (
                                <span key={i}>{part}</span>
                              )
                            )}
                          </>
                        ) : (
                          m.message
                        )}
                      </p>
                      <span className={`text-[9px] font-bold block mt-1 ${isEmployer ? "opacity-70 text-right" : "text-gray-400"}`}>
                        {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Chat Input */}
            <form onSubmit={handleSendMessage} className="p-4 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 shrink-0">
              <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-850 p-1.5 rounded-xl border border-gray-200 dark:border-gray-700 focus-within:ring-2 focus-within:ring-indigo-500 transition-all">
                <button type="button" className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-white dark:hover:bg-gray-800 rounded-lg transition-colors">
                  <Paperclip className="w-4 h-4" />
                </button>
                <input 
                  type="text" 
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  placeholder="Type your message..." 
                  className="flex-1 bg-transparent px-2 text-xs outline-none text-gray-900 dark:text-white"
                />
                <button type="submit" className="p-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors shadow-sm">
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div className="hidden md:flex flex-1 flex-col items-center justify-center bg-gray-50/30 dark:bg-gray-950/50 border-l border-gray-100 dark:border-gray-800">
            <MessageSquare className="w-16 h-16 text-gray-300 dark:text-gray-700 mb-4" />
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Your Messages</h3>
            <p className="text-sm text-gray-500">Select a conversation from the left to start chatting</p>
          </div>
        )}

        {/* Profile Drawer */}
        {showProfileDrawer && selectedCandidateId && (
          <div className="w-80 border-l border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 flex flex-col animate-in slide-in-from-right duration-300">
            <div className="h-16 px-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between shrink-0">
              <h3 className="font-extrabold text-gray-900 dark:text-white">Profile Details</h3>
              <button 
                onClick={() => setShowProfileDrawer(false)}
                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6">
              <div className="flex flex-col items-center text-center mb-6">
                <div className="w-20 h-20 rounded-2xl bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-black text-2xl border-2 border-indigo-200 dark:border-indigo-800/50 mb-3 relative shadow-sm">
                  {selectedCandData?.name?.slice(0, 2).toUpperCase() || "CN"}
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white dark:border-gray-900 rounded-full"></div>
                </div>
                <h2 className="text-lg font-extrabold text-gray-900 dark:text-white">{selectedCandData?.name || "Candidate"}</h2>
                <p className="text-xs font-bold text-gray-500 mt-1 flex items-center gap-1 justify-center">
                  <MapPin className="w-3 h-3" /> India
                </p>
              </div>

              <div className="space-y-4">
                <div className="p-3 bg-gray-50 dark:bg-gray-850 rounded-xl border border-gray-100 dark:border-gray-800">
                  <h4 className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider mb-2">Contact Info</h4>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                      <Mail className="w-4 h-4 text-gray-400" />
                      <span className="truncate">{selectedCandData?.name?.toLowerCase().replace(/\s/g, '')}@example.com</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <span>+91 98765 43210</span>
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-gray-50 dark:bg-gray-850 rounded-xl border border-gray-100 dark:border-gray-800">
                  <h4 className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider mb-2">Professional Info</h4>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                      <Briefcase className="w-4 h-4 text-gray-400" />
                      <span>2+ Years Experience</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                      <Star className="w-4 h-4 text-gray-400" />
                      <span>Software Engineer</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <span>Notice: 30 Days</span>
                    </div>
                  </div>
                </div>

                <button className="w-full py-2.5 px-4 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 font-bold text-sm rounded-xl border border-indigo-100 dark:border-indigo-800/50 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-colors flex items-center justify-center gap-2">
                  <FileText className="w-4 h-4" />
                  View Full Resume
                </button>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* WhatsApp-Style Floating Video Call Modal */}
      {activeCallId && (
        <div className={`fixed z-50 transition-all duration-300 shadow-2xl overflow-hidden bg-gray-900 border border-gray-800 ${
          isCallMinimized 
            ? "bottom-6 right-6 w-80 h-48 rounded-2xl" 
            : "inset-0 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-[800px] md:h-[600px] md:rounded-3xl"
        }`}>
          {/* Custom Header for the Call Modal */}
          <div className="absolute top-0 left-0 w-full h-12 bg-gradient-to-b from-black/80 to-transparent z-10 flex items-center justify-between px-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
              <span className="text-white text-xs font-bold drop-shadow-md">Calling {selectedCandData?.name}...</span>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setIsCallMinimized(!isCallMinimized)}
                className="p-1.5 text-white/80 hover:bg-white/20 rounded-lg transition-colors backdrop-blur-sm"
              >
                {isCallMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
              </button>
            </div>
          </div>
          
          {/* ZegoCloud Container */}
          <div ref={callContainerRef} className="w-full h-full" />
        </div>
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-4 py-3 rounded-xl shadow-lg font-bold text-sm z-50 animate-in slide-in-from-bottom flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
          {toastMessage}
        </div>
      )}
    </div>
  );
}
