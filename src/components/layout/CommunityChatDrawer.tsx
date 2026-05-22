"use client";

import React, { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { Loader2, Send, ShieldAlert, CheckCircle2, UserCircle2, Users, X } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";

const CATEGORIES = ["General", "IT/Engineering", "BPO/Calling", "Sales/Marketing", "Interview-Prep"];

export default function CommunityChatDrawer() {
  const pathname = usePathname();
  const router = useRouter();
  
  const [isOpen, setIsOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState("General");
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [newPost, setNewPost] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const [userProfile, setUserProfile] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOpen = () => {
      // Check auth before opening
      checkAuthAndOpen();
    };
    window.addEventListener("openCommunityChat", handleOpen);
    return () => window.removeEventListener("openCommunityChat", handleOpen);
  }, []);

  const checkAuthAndOpen = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      alert("Please login to join the Community Chat.");
      router.push("/login");
      return;
    }
    
    // Fetch profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, avatar_url")
      .eq("id", session.user.id)
      .single();
      
    setUserProfile(profile || { full_name: session.user.email?.split("@")[0] || "User" });
    setIsOpen(true);
  };

  // 2. Fetch Initial Posts & Subscribe to Realtime
  useEffect(() => {
    if (!isOpen) return;

    const fetchPosts = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("private_community_posts")
        .select("*")
        .eq("category", activeCategory)
        .eq("is_blocked", false)
        .order("created_at", { ascending: true }) // Oldest first, so newest are at the bottom
        .limit(100);
        
      if (data) setPosts(data);
      setLoading(false);
      setTimeout(scrollToBottom, 100);
    };

    fetchPosts();

    // Supabase Realtime Subscription
    const channel = supabase
      .channel(`public:private_community_posts:${activeCategory}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "private_community_posts",
          filter: `category=eq.${activeCategory}`,
        },
        (payload) => {
          if (payload.new && !payload.new.is_blocked) {
            setPosts((prev) => [...prev, payload.new]);
            setTimeout(scrollToBottom, 100);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeCategory, isOpen]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // 3. Handle Submit via API (for moderation)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPost.trim() || !userProfile) return;
    
    setIsSubmitting(true);
    setErrorMsg("");

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const response = await fetch("/api/community/post", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          content: newPost,
          category: activeCategory,
          author_name: userProfile.full_name,
          author_avatar: userProfile.avatar_url
        })
      });

      const result = await response.json();
      
      if (!response.ok) {
        setErrorMsg(result.error || "Failed to post");
      } else {
        setNewPost(""); // Clear on success
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("Network error. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Don't render on some admin pages
  if (
    pathname?.startsWith("/admin") ||
    pathname?.startsWith("/employer")
  ) {
    return null;
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex justify-end">
      {/* Backdrop overlay */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300"
        onClick={() => setIsOpen(false)}
      />

      {/* Drawer Panel - Half screen on Desktop, Full screen on Mobile */}
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
                Community Chat
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-black bg-green-500 text-white animate-pulse">LIVE</span>
              </h2>
              <p className="text-[11px] text-indigo-100 mt-0.5">Connect with Private Job Aspirants</p>
            </div>
          </div>
          <button 
            onClick={() => {
              setIsOpen(false);
              window.dispatchEvent(new CustomEvent("closeCommunityChat"));
            }}
            className="p-1.5 hover:bg-white/15 rounded-xl transition-colors relative z-20 text-white"
            aria-label="Close drawer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* CATEGORIES */}
        <div className="p-2 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 shrink-0">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide px-2">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                  activeCategory === cat 
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/20" 
                    : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700"
                }`}
              >
                #{cat}
              </button>
            ))}
          </div>
        </div>

        {/* MODERATION ALERT */}
        <div className="bg-amber-50 dark:bg-amber-900/10 border-b border-amber-200 dark:border-amber-800/30 p-2 text-center flex items-center justify-center gap-2 shrink-0">
          <ShieldAlert className="w-4 h-4 text-amber-600 dark:text-amber-500" />
          <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400">
            Strict Rules: No Phone numbers, Emails, Links, or Abusive Words.
          </span>
        </div>

        {/* CHAT FEED */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50 dark:bg-gray-950">
          {loading ? (
            <div className="flex h-full items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
            </div>
          ) : posts.length === 0 ? (
            <div className="flex flex-col h-full items-center justify-center text-center text-gray-400">
              <span className="text-4xl mb-2">👋</span>
              <p className="font-bold">Be the first to post in #{activeCategory}!</p>
            </div>
          ) : (
            posts.map((post) => (
              <div key={post.id} className="flex gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-gray-200 dark:bg-gray-800 flex-shrink-0 overflow-hidden">
                  {post.author_avatar ? (
                    <img src={post.author_avatar} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <UserCircle2 className="w-full h-full text-gray-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-extrabold text-xs md:text-sm text-gray-900 dark:text-white">
                      {post.author_name}
                    </span>
                    <span className="text-[9px] md:text-[10px] text-gray-400 font-medium">
                      {new Date(post.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <CheckCircle2 className="w-3 h-3 text-blue-500" />
                  </div>
                  <div className="bg-white dark:bg-gray-800 rounded-2xl rounded-tl-none border border-gray-200 dark:border-gray-700 px-3 py-2 md:px-4 md:py-2.5 inline-block max-w-[90%] shadow-sm">
                    <p className="text-gray-800 dark:text-gray-200 text-xs md:text-sm whitespace-pre-wrap break-words">
                      {post.content}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* INPUT BOX */}
        <div className="p-4 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 shrink-0">
          
          {errorMsg && (
            <div className="mb-2 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-xs font-bold text-red-600 dark:text-red-400 flex items-center gap-2 animate-in fade-in">
              <ShieldAlert className="w-4 h-4 shrink-0" /> {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex items-end gap-2">
            <div className="flex-1 relative">
              <textarea
                value={newPost}
                onChange={(e) => setNewPost(e.target.value)}
                placeholder={`Share something in #${activeCategory}...`}
                className="w-full bg-gray-50 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-indigo-500 resize-none h-12"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit(e);
                  }
                }}
              />
            </div>
            <button
              type="submit"
              disabled={!newPost.trim() || isSubmitting}
              className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 disabled:dark:bg-gray-700 text-white h-12 px-4 rounded-xl flex items-center justify-center transition-colors shadow-lg shadow-indigo-500/20"
            >
              {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
