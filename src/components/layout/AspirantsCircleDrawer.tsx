"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { Send, Users, ShieldAlert, CheckCircle2, UserCheck, AlertTriangle, X, Loader2, ArrowDown, Trash2, Pin, Plus, BarChart3, Flag } from "lucide-react";
import { usePathname } from "next/navigation";

interface ChatMessage {
  id: string;
  user_id: string;
  text_content: string;
  is_deleted: boolean;
  created_at: string;
  is_pinned?: boolean;
  is_poll?: boolean;
  poll_question?: string | null;
  poll_options?: string[] | null;
  reports_count?: number;
  chat_users: {
    display_name: string;
    avatar: string;
    role: string;
    is_banned: boolean;
  };
  votes?: { [option: string]: number };
  myVote?: string | null;
  reactions?: { [emoji: string]: { count: number; users: string[] } };
}

const BAD_WORDS_SUBSTRING = [
  "chutiya", "madarchod", "behenchod", "bhenchod", "harami", "kamina", "kamine",
  "asshole", "bastard", "bhosdike", "bhosadi", "laundiya", "randi"
];

const BAD_WORDS_EXACT = [
  "fuck", "bitch", "gandu", "bsdk", "mc", "bc", "chut", "lund", "lauda",
  "kutta", "kutti", "saala", "saali", "gali"
];

const isMessageClean = (text: string): { clean: boolean; reason: string | null } => {
  const lowerText = text.toLowerCase();
  
  // 1. Check for External Links/URLs
  const urlRegex = /(https?:\/\/[^\s]+|www\.[^\s]+|[a-zA-Z0-9-]+\.(com|in|net|org|co|info|xyz|io|me|us|biz|edu|gov|online|app)\b)/gi;
  const urls = text.match(urlRegex);
  if (urls) {
    const isOurDomain = urls.every(url => 
      url.includes("rojgarsuvidha.com") || url.includes("rojgar-suvidha")
    );
    if (!isOurDomain) {
      return { clean: false, reason: "External links/URLs are not allowed in community chat for safety reasons." };
    }
  }

  // 2. Check for Email Addresses
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/gi;
  if (emailRegex.test(text)) {
    return { clean: false, reason: "Sharing email addresses is prohibited to protect your privacy." };
  }

  // 3. Check for 10-digit mobile numbers (anti-spam / anti-dox)
  if (/\d{10}/.test(text.replace(/[\s-]/g, ""))) {
    return { clean: false, reason: "Sharing phone numbers is strictly prohibited to prevent spam and preserve privacy." };
  }

  // 4. Check for substring bad words (Hindi/English)
  const cleanText = lowerText.replace(/[\s\-_.*\n]/g, "");
  if (BAD_WORDS_SUBSTRING.some(word => cleanText.includes(word))) {
    return { clean: false, reason: "Please maintain respect. Abusive or inappropriate language is not allowed." };
  }
  
  // 5. Check exact bad words
  const words = lowerText.split(/[\s\-_.*,\n]+/);
  if (words.some(word => BAD_WORDS_EXACT.includes(word))) {
    return { clean: false, reason: "Please maintain respect. Abusive or inappropriate language is not allowed." };
  }

  // 6. Check for repeated character flooding (e.g. "!!!!!!!!", "hellooooooo", "......")
  const repeatRegex = /(.)\1{4,}/g;
  if (repeatRegex.test(lowerText)) {
    return { clean: false, reason: "Flooding the chat with repeating characters/symbols is not allowed." };
  }

  // 7. Check for layout breaking excessively long words
  if (words.some(w => w.length > 35)) {
    return { clean: false, reason: "Words longer than 35 characters are not allowed to keep the layout responsive." };
  }

  return { clean: true, reason: null };
};

export default function AspirantsCircleDrawer() {
  const pathname = usePathname();
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

  // Poll state variables
  const [isCreatePollOpen, setIsCreatePollOpen] = useState(false);
  const [pollQuestion, setPollQuestion] = useState("");
  const [pollOptions, setPollOptions] = useState(["", ""]);
  const [pinnedMessage, setPinnedMessage] = useState<ChatMessage | null>(null);


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

  if (
    pathname?.startsWith("/admin") ||
    pathname?.startsWith("/private-jobs") ||
    pathname?.startsWith("/employer")
  ) {
    return null;
  }

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
    const { data, error } = await supabase
      .from("chat_messages")
      .select(`
        id, text_content, is_deleted, created_at, user_id, is_pinned, is_poll, poll_question, poll_options, reports_count,
        chat_users ( display_name, avatar, role, is_banned )
      `)
      .gte("created_at", sevenDaysAgo.toISOString())
      .order("created_at", { ascending: false })
      .limit(100);
      
    if (error) {
      console.error("Error fetching messages:", error);
      return;
    }

    if (data) {
      const chatMsgs = data as unknown as ChatMessage[];
      const msgIds = chatMsgs.map(m => m.id);

      // 3. Fetch poll votes in a single query
      let votesList: any[] = [];
      if (msgIds.length > 0) {
        const { data: votesData } = await supabase
          .from("chat_poll_votes")
          .select("message_id, selected_option, user_id")
          .in("message_id", msgIds);
        if (votesData) votesList = votesData;
      }

      // 4. Fetch reactions in a single query
      let reactionsList: any[] = [];
      if (msgIds.length > 0) {
        const { data: reactionsData } = await supabase
          .from("chat_reactions")
          .select("message_id, reaction_type, user_id")
          .in("message_id", msgIds);
        if (reactionsData) reactionsList = reactionsData;
      }

      // 5. Enrich messages with votes & reactions counts
      const enriched = chatMsgs.map(msg => {
        const votesMap: { [opt: string]: number } = {};
        let myVote: string | null = null;
        
        if (msg.is_poll && msg.poll_options) {
          const options = Array.isArray(msg.poll_options) 
            ? msg.poll_options 
            : typeof msg.poll_options === 'string'
              ? JSON.parse(msg.poll_options)
              : [];
          
          msg.poll_options = options;
          options.forEach((opt: string) => {
            votesMap[opt] = 0;
          });

          const msgVotes = votesList.filter(v => v.message_id === msg.id);
          msgVotes.forEach(v => {
            if (votesMap[v.selected_option] !== undefined) {
              votesMap[v.selected_option]++;
            }
            if (myUserId && v.user_id === myUserId) {
              myVote = v.selected_option;
            }
          });
        }

        const rxMap: { [emoji: string]: { count: number; users: string[] } } = {};
        const msgRx = reactionsList.filter(r => r.message_id === msg.id);
        msgRx.forEach(r => {
          if (!rxMap[r.reaction_type]) {
            rxMap[r.reaction_type] = { count: 0, users: [] };
          }
          rxMap[r.reaction_type].count++;
          rxMap[r.reaction_type].users.push(r.user_id);
        });

        return {
          ...msg,
          votes: votesMap,
          myVote,
          reactions: rxMap
        };
      });

      // Update pinned message
      const activePinned = enriched.find(m => m.is_pinned);
      if (activePinned) {
        setPinnedMessage(activePinned);
      } else {
        const { data: separatePinned } = await supabase
          .from("chat_messages")
          .select(`
            id, text_content, is_deleted, created_at, user_id, is_pinned, is_poll, poll_question, poll_options, reports_count,
            chat_users ( display_name, avatar, role, is_banned )
          `)
          .eq("is_pinned", true)
          .limit(1)
          .maybeSingle();

        if (separatePinned) {
          setPinnedMessage(separatePinned as unknown as ChatMessage);
        } else {
          setPinnedMessage(null);
        }
      }

      setMessages(enriched.reverse());
    }
  };

  const fetchSingleMessage = async (msgId: string) => {
    const { data } = await supabase
      .from("chat_messages")
      .select(`
        id, text_content, is_deleted, created_at, user_id, is_pinned, is_poll, poll_question, poll_options, reports_count,
        chat_users ( display_name, avatar, role, is_banned )
      `)
      .eq("id", msgId)
      .maybeSingle();
      
    if (data) {
      const msg = data as unknown as ChatMessage;

      let votesMap: { [opt: string]: number } = {};
      let myVote: string | null = null;
      if (msg.is_poll && msg.poll_options) {
        const options = Array.isArray(msg.poll_options) 
          ? msg.poll_options 
          : typeof msg.poll_options === 'string'
            ? JSON.parse(msg.poll_options)
            : [];
        msg.poll_options = options;
        options.forEach((opt: string) => {
          votesMap[opt] = 0;
        });

        const { data: votesData } = await supabase
          .from("chat_poll_votes")
          .select("selected_option, user_id")
          .eq("message_id", msgId);
        
        if (votesData) {
          votesData.forEach(v => {
            if (votesMap[v.selected_option] !== undefined) {
              votesMap[v.selected_option]++;
            }
            if (myUserId && v.user_id === myUserId) {
              myVote = v.selected_option;
            }
          });
        }
      }

      const rxMap: { [emoji: string]: { count: number; users: string[] } } = {};
      const { data: rxData } = await supabase
        .from("chat_reactions")
        .select("reaction_type, user_id")
        .eq("message_id", msgId);
      
      if (rxData) {
        rxData.forEach(r => {
          if (!rxMap[r.reaction_type]) {
            rxMap[r.reaction_type] = { count: 0, users: [] };
          }
          rxMap[r.reaction_type].count++;
          rxMap[r.reaction_type].users.push(r.user_id);
        });
      }

      const enrichedMsg = {
        ...msg,
        votes: votesMap,
        myVote,
        reactions: rxMap
      };

      setMessages(prev => {
        if (prev.some(m => m.id === enrichedMsg.id)) {
          return prev.map(m => m.id === enrichedMsg.id ? enrichedMsg : m);
        }
        return [...prev, enrichedMsg];
      });
      
      if (enrichedMsg.is_pinned) {
        setPinnedMessage(enrichedMsg);
      }
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

    const validation = isMessageClean(inputText);
    if (!validation.clean) {
      alert(`⚠️ Safety Alert: ${validation.reason}`);
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
    const { data, error } = await supabase
      .from("chat_messages")
      .update({ is_deleted: true })
      .eq("id", msgId)
      .select();
      
    if (error) {
      alert("Failed to delete message: " + error.message);
    } else if (!data || data.length === 0) {
      alert("Permission Denied: Database RLS policies are preventing you from deleting this message. Please run the SQL command in Supabase Dashboard.");
    } else {
      setMessages(prev =>
        prev.map(m => m.id === msgId ? { ...m, is_deleted: true } : m)
      );
    }
  };

  const handlePinMessage = async (msgId: string) => {
    if (myRole !== 'admin') return;
    if (!confirm("Pin this message to the top of the chat?")) return;
    
    // Unpin any existing message first
    await supabase.from("chat_messages").update({ is_pinned: false }).eq("is_pinned", true);
    
    // Pin the new one
    const { error } = await supabase.from("chat_messages").update({ is_pinned: true }).eq("id", msgId);
    if (error) {
      alert("Failed to pin message: " + error.message);
    } else {
      fetchMessages();
    }
  };

  const handleUnpinMessage = async (msgId: string) => {
    if (myRole !== 'admin') return;
    const { error } = await supabase.from("chat_messages").update({ is_pinned: false }).eq("id", msgId);
    if (error) {
      alert("Failed to unpin message: " + error.message);
    } else {
      setPinnedMessage(null);
    }
  };

  const handleVote = async (msgId: string, option: string) => {
    if (!myUserId) {
      alert("Please login/join the Adda first to vote.");
      return;
    }
    
    const { data: existing } = await supabase
      .from("chat_poll_votes")
      .select("id, selected_option")
      .eq("message_id", msgId)
      .eq("user_id", myUserId)
      .maybeSingle();

    if (existing) {
      if (existing.selected_option === option) {
        await supabase.from("chat_poll_votes").delete().eq("id", existing.id);
      } else {
        await supabase.from("chat_poll_votes").update({ selected_option: option }).eq("id", existing.id);
      }
    } else {
      const { error } = await supabase
        .from("chat_poll_votes")
        .insert([{
          message_id: msgId,
          user_id: myUserId,
          selected_option: option
        }]);
      if (error) {
        console.error("Error voting:", error);
      }
    }
    fetchMessages();
  };

  const handleToggleReaction = async (msgId: string, reactionType: string) => {
    if (!myUserId) {
      alert("Please login/join the Adda first to react.");
      return;
    }
    
    const { data: existing } = await supabase
      .from("chat_reactions")
      .select("id")
      .eq("message_id", msgId)
      .eq("user_id", myUserId)
      .eq("reaction_type", reactionType)
      .maybeSingle();
      
    if (existing) {
      await supabase.from("chat_reactions").delete().eq("id", existing.id);
    } else {
      const { error } = await supabase.from("chat_reactions").insert([{
        message_id: msgId,
        user_id: myUserId,
        reaction_type: reactionType
      }]);
      if (error) {
        console.error("Error adding reaction:", error);
      }
    }
    fetchMessages();
  };

  const handleReportMessage = async (msgId: string) => {
    if (!confirm("Are you sure you want to report this message? If a message gets 3 reports, it will be automatically hidden for review.")) return;
    
    const { data } = await supabase
      .from("chat_messages")
      .select("reports_count")
      .eq("id", msgId)
      .single();
      
    const currentCount = data?.reports_count || 0;
    const { error } = await supabase
      .from("chat_messages")
      .update({ reports_count: currentCount + 1 })
      .eq("id", msgId);
      
    if (error) {
      alert("Failed to report message: " + error.message);
    } else {
      alert("Thank you. The message has been reported for review.");
      fetchMessages();
    }
  };

  const handleCreatePoll = async () => {
    if (!myUserId || isBanned) return;
    
    const question = pollQuestion.trim();
    const options = pollOptions.map(o => o.trim()).filter(o => o.length > 0);
    
    if (!question) {
      alert("Please enter a question.");
      return;
    }
    if (options.length < 2) {
      alert("Please provide at least 2 options.");
      return;
    }

    const { error } = await supabase.from("chat_messages").insert([{
      user_id: myUserId,
      is_poll: true,
      poll_question: question,
      poll_options: options,
      text_content: `Poll: ${question}`
    }]);

    if (error) {
      alert("Failed to create poll: " + error.message);
    } else {
      setPollQuestion("");
      setPollOptions(["", ""]);
      setIsCreatePollOpen(false);
      fetchMessages();
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

        {/* Pinned Message Bar */}
        {pinnedMessage && (
          <div className="bg-indigo-50 dark:bg-indigo-950/40 border-b border-indigo-100 dark:border-indigo-900/50 px-4 py-2.5 flex items-center justify-between gap-2 text-xs text-indigo-900 dark:text-indigo-200 shrink-0 relative z-10 shadow-sm animate-fadeIn">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <Pin className="w-3.5 h-3.5 text-indigo-500 shrink-0 transform rotate-45" />
              <span className="font-extrabold text-[9px] uppercase tracking-wider bg-indigo-200 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200 px-1.5 py-0.5 rounded">Pinned</span>
              <span className="truncate flex-1 font-semibold">
                {pinnedMessage.is_poll ? `📊 Poll: ${pinnedMessage.poll_question}` : pinnedMessage.text_content}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => {
                  const element = document.getElementById(`msg-${pinnedMessage.id}`);
                  if (element) {
                    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  } else {
                    alert("Message is older than current loaded messages.");
                  }
                }}
                className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 underline shrink-0 cursor-pointer"
              >
                View
              </button>
              {myRole === 'admin' && (
                <button 
                  onClick={() => handleUnpinMessage(pinnedMessage.id)}
                  className="p-1 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 rounded shrink-0 cursor-pointer text-indigo-400 hover:text-indigo-600"
                  title="Unpin Message"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        )}

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
                  const isReportedAndHidden = (msg.reports_count || 0) >= 3 && myRole !== 'admin';
                  
                  return (
                    <div id={`msg-${msg.id}`} key={msg.id} className={`flex w-full ${isMe ? 'justify-end' : 'justify-start'}`}>
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
                              {(msg.reports_count || 0) > 0 && myRole === 'admin' && (
                                <span className="bg-rose-500 text-white text-[8px] px-1.5 py-0.5 rounded font-black flex items-center gap-0.5 tracking-wider">
                                  <Flag className="w-2 h-2" /> {msg.reports_count} Reports
                                </span>
                              )}
                            </div>
                          )}

                          {/* Bubble Container with Actions */}
                          <div className={`flex items-center gap-1.5 group/msg ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                            {isReportedAndHidden ? (
                              <div className="bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400 border border-red-100 dark:border-red-900/30 px-3 py-2 rounded-2xl text-[11px] font-semibold flex items-center gap-1.5 leading-normal max-w-full">
                                <AlertTriangle className="w-3.5 h-3.5 text-red-500 shrink-0" />
                                <span>Hidden for review due to multiple reports.</span>
                              </div>
                            ) : msg.is_poll ? (
                              <div className="bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100/60 dark:border-indigo-900/40 p-3.5 rounded-2xl max-w-sm w-full shadow-sm relative">
                                <div className="flex items-center gap-1.5 mb-2">
                                  <BarChart3 className="w-4 h-4 text-indigo-500 shrink-0" />
                                  <span className="font-extrabold text-[11px] uppercase tracking-wider text-indigo-700 dark:text-indigo-300">Aspirants Poll</span>
                                </div>
                                <p className="font-black text-gray-900 dark:text-white text-xs mb-3 leading-normal">{msg.poll_question}</p>
                                
                                <div className="space-y-2">
                                  {msg.poll_options?.map((opt: string) => {
                                    const votes = msg.votes?.[opt] || 0;
                                    const totalVotes = Object.values(msg.votes || {}).reduce((a, b) => a + b, 0);
                                    const pct = totalVotes > 0 ? Math.round((votes / totalVotes) * 100) : 0;
                                    const isMyVote = msg.myVote === opt;
                                    const hasVoted = !!msg.myVote;

                                    return (
                                      <button
                                        key={opt}
                                        onClick={() => handleVote(msg.id, opt)}
                                        className={`w-full text-left relative overflow-hidden rounded-xl border p-2.5 transition-all duration-200 text-xs font-bold leading-normal flex items-center justify-between cursor-pointer ${
                                          isMyVote 
                                            ? 'border-green-500/80 bg-green-50/50 dark:bg-green-950/20 text-green-900 dark:text-green-200' 
                                            : hasVoted
                                              ? 'border-gray-200 dark:border-gray-800 bg-gray-50/30 dark:bg-gray-900/30 text-gray-800 dark:text-gray-200'
                                              : 'border-indigo-200 dark:border-indigo-900 hover:border-indigo-500 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 hover:shadow-sm'
                                        }`}
                                      >
                                        {hasVoted && (
                                          <div 
                                            className={`absolute top-0 left-0 bottom-0 z-0 opacity-15 dark:opacity-20 transition-all duration-500 ${isMyVote ? 'bg-green-500' : 'bg-indigo-500'}`}
                                            style={{ width: `${pct}%` }}
                                          />
                                        )}
                                        <span className="relative z-10 flex items-center gap-1.5 min-w-0 pr-2">
                                          {isMyVote && <CheckCircle2 className="w-3.5 h-3.5 text-green-600 dark:text-green-400 shrink-0" />}
                                          <span className="truncate">{opt}</span>
                                        </span>
                                        {hasVoted && (
                                          <span className="relative z-10 font-black text-indigo-900 dark:text-indigo-300 text-[10px] shrink-0">
                                            {pct}% ({votes})
                                          </span>
                                        )}
                                      </button>
                                    );
                                  })}
                                </div>
                                <p className="text-[9px] text-gray-400 dark:text-gray-500 font-bold mt-2 flex justify-between items-center">
                                  <span>Total: {Object.values(msg.votes || {}).reduce((a, b) => a + b, 0)} votes</span>
                                  {msg.myVote && <span className="text-green-600 dark:text-green-400">Vote Casted</span>}
                                </p>
                              </div>
                            ) : (
                              <div className={`px-4 py-2.5 rounded-2xl text-[13px] font-medium leading-relaxed break-words max-w-full ${
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
                            )}

                            {/* Actions on hover */}
                            {!isDeleted && (
                              <div className={`flex items-center gap-0.5 opacity-0 group-hover/msg:opacity-100 transition-all shrink-0 ${isMe ? 'flex-row' : 'flex-row-reverse'}`}>
                                {myRole === 'admin' && (
                                  <>
                                    <button
                                      onClick={() => handlePinMessage(msg.id)}
                                      className="p-1 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-950/30 text-gray-400 hover:text-indigo-500 dark:hover:text-indigo-400 transition-all cursor-pointer"
                                      title="Pin message"
                                    >
                                      <Pin className="w-3.5 h-3.5 transform rotate-45" />
                                    </button>
                                    <button
                                      onClick={() => handleDeleteMessage(msg.id)}
                                      className="p-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-all cursor-pointer"
                                      title="Delete message"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </>
                                )}
                                {myRole !== 'admin' && !isMe && (
                                  <button
                                    onClick={() => handleReportMessage(msg.id)}
                                    className="p-1 rounded-lg hover:bg-yellow-50 dark:hover:bg-yellow-950/30 text-gray-400 hover:text-yellow-600 dark:hover:text-yellow-400 transition-all cursor-pointer"
                                    title="Report message"
                                  >
                                    <Flag className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                          
                          {/* Reactions & Time Row */}
                          <div className={`flex items-center gap-2 mt-1 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                            <span className="text-[8px] text-gray-400 dark:text-gray-500 font-semibold shrink-0">
                              {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>

                            {!isDeleted && !isReportedAndHidden && (
                              <div className="flex flex-wrap items-center gap-1 shrink-0">
                                {msg.reactions && Object.entries(msg.reactions).map(([emoji, data]) => {
                                  const hasReacted = myUserId && data.users.includes(myUserId);
                                  return (
                                    <button
                                      key={emoji}
                                      onClick={() => handleToggleReaction(msg.id, emoji)}
                                      className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold transition-all border cursor-pointer ${
                                        hasReacted
                                          ? 'bg-indigo-100/85 dark:bg-indigo-900/40 border-indigo-400/60 text-indigo-900 dark:text-indigo-200 shadow-sm'
                                          : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 text-gray-600 dark:text-gray-400'
                                      }`}
                                    >
                                      <span>{emoji}</span>
                                      <span className="text-[9px] font-black">{data.count}</span>
                                    </button>
                                  );
                                })}

                                <div className="relative group/react inline-block">
                                  <button
                                    className="w-4 h-4 rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-all cursor-pointer"
                                    title="Add reaction"
                                  >
                                    <Plus className="w-2.5 h-2.5" />
                                  </button>
                                  
                                  <div className="hidden group-hover/react:flex absolute left-0 bottom-5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-1 rounded-full shadow-lg gap-1 z-50 animate-fadeIn">
                                    {['👍', '❤️', '🙏', '👏', '🔥', '📚'].map(emoji => (
                                      <button
                                        key={emoji}
                                        onClick={() => handleToggleReaction(msg.id, emoji)}
                                        className="hover:scale-125 transition-transform duration-100 text-xs cursor-pointer p-0.5"
                                      >
                                        {emoji}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
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
            <div className="p-3 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 shrink-0 relative">
              <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                {myRole === 'admin' && (
                  <button 
                    type="button"
                    onClick={() => setIsCreatePollOpen(true)}
                    className="bg-indigo-50 hover:bg-indigo-100 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400 p-3 rounded-full transition-colors flex items-center justify-center shrink-0 border border-indigo-100 dark:border-indigo-900/50 cursor-pointer"
                    title="Create Poll"
                  >
                    <BarChart3 className="w-4 h-4" />
                  </button>
                )}
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
                  className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white p-3 rounded-full transition-colors flex items-center justify-center shrink-0 shadow-md cursor-pointer"
                >
                  <Send className="w-4 h-4 ml-0.5" />
                </button>
              </form>
              <p className="text-[9px] text-center text-gray-400 dark:text-gray-500 mt-2 font-semibold">
                Please remain respectful. Phone numbers and abuse are prohibited.
              </p>
            </div>

            {/* Create Poll Dialog Overlay */}
            {isCreatePollOpen && (
              <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-[60]">
                <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-5 shadow-2xl w-full max-w-sm animate-fadeIn">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-extrabold text-gray-900 dark:text-white flex items-center gap-1.5">
                      <BarChart3 className="w-4 h-4 text-indigo-600" /> Create GK Poll
                    </h3>
                    <button 
                      onClick={() => setIsCreatePollOpen(false)}
                      className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <div className="mb-4">
                    <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1.5">Question</label>
                    <input 
                      type="text"
                      placeholder="e.g. Which country hosts the 2026 Winter Olympics?"
                      value={pollQuestion}
                      onChange={(e) => setPollQuestion(e.target.value)}
                      className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl px-3 py-2 text-xs font-semibold focus:ring-2 focus:ring-indigo-500 outline-none dark:text-white"
                      maxLength={120}
                    />
                  </div>

                  <div className="space-y-3 mb-5">
                    <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-wider">Options</label>
                    {pollOptions.map((opt, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <span className="text-[11px] font-bold text-gray-400 dark:text-gray-500 w-4">{idx + 1}.</span>
                        <input 
                          type="text"
                          placeholder={`Option ${idx + 1}`}
                          value={opt}
                          onChange={(e) => {
                            const newOpts = [...pollOptions];
                            newOpts[idx] = e.target.value;
                            setPollOptions(newOpts);
                          }}
                          className="flex-1 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl px-3 py-2 text-xs font-semibold focus:ring-2 focus:ring-indigo-500 outline-none dark:text-white"
                          maxLength={60}
                        />
                        {pollOptions.length > 2 && (
                          <button
                            type="button"
                            onClick={() => {
                              setPollOptions(pollOptions.filter((_, i) => i !== idx));
                            }}
                            className="p-1.5 text-gray-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    ))}
                    
                    {pollOptions.length < 5 && (
                      <button
                        type="button"
                        onClick={() => setPollOptions([...pollOptions, ""])}
                        className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 flex items-center gap-1 mt-1.5 cursor-pointer"
                      >
                        <Plus className="w-3 h-3" /> Add Option
                      </button>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setIsCreatePollOpen(false)}
                      className="flex-1 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-bold py-2 rounded-xl text-xs hover:bg-gray-50 dark:hover:bg-gray-800 transition-all cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleCreatePoll}
                      className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 rounded-xl text-xs transition-all shadow-md cursor-pointer"
                    >
                      Post Poll
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
