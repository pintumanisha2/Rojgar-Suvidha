"use client";

import React, { useEffect, useState, useRef } from"react";
import { supabase } from"@/lib/supabase";
import { Loader2, Send, ShieldAlert, CheckCircle2, UserCircle2 } from"lucide-react";

const CATEGORIES = ["General","IT/Engineering","BPO/Calling","Sales/Marketing","Interview-Prep"];

export default function CommunityFeed() {
 const [activeCategory, setActiveCategory] = useState("General");
 const [posts, setPosts] = useState<any[]>([]);
 const [loading, setLoading] = useState(true);
 
 const [newPost, setNewPost] = useState("");
 const [isSubmitting, setIsSubmitting] = useState(false);
 const [errorMsg, setErrorMsg] = useState("");

 const [userProfile, setUserProfile] = useState<any>(null);
 const messagesEndRef = useRef<HTMLDivElement>(null);

 // 1. Fetch User Profile
 useEffect(() => {
 const fetchUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name, avatar_url")
          .eq("id", session.user.id)
          .single();
        setUserProfile(profile || { full_name: session.user.email?.split("@")[0], avatar_url: "" });
      } else {
        let isLocalActive = false;
        try { isLocalActive = localStorage.getItem("rs_candidate_session_active") === "true"; } catch(e) {}
        if (isLocalActive) {
          let localName = "Candidate Profile";
          try {
            const profileStr = localStorage.getItem("rs_candidate_mock_profile");
            if (profileStr) {
               const parsed = JSON.parse(profileStr);
               if (parsed.fullName) localName = parsed.fullName;
            }
          } catch(e) {}
          setUserProfile({ full_name: localName, avatar_url: "" });
        }
      }
    };
 fetchUser();
 }, []);

 // 2. Fetch Initial Posts & Subscribe to Realtime
 useEffect(() => {
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
 .channel("public:private_community_posts")
 .on(
"postgres_changes",
 {
 event:"INSERT",
 schema:"public",
 table:"private_community_posts",
 filter:`category=eq.${activeCategory}`,
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
 }, [activeCategory]);

 const scrollToBottom = () => {
 messagesEndRef.current?.scrollIntoView({ behavior:"smooth"});
 };

 // 3. Handle Submit via API (for moderation)
 const handleSubmit = async (e: React.FormEvent) => {
 e.preventDefault();
 if (!newPost.trim() || !userProfile) return;
 
 setIsSubmitting(true);
 setErrorMsg("");

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      let isLocalActive = false;
      try { isLocalActive = localStorage.getItem("rs_candidate_session_active") === "true"; } catch(e) {}
      
      if (!session && !isLocalActive) throw new Error("Not authenticated");

      // For local sandbox environment where session is bypassed, we can post directly to DB
      // because the API route requires a valid JWT token.
      if (!session && isLocalActive) {
         const { error } = await supabase.from("private_community_posts").insert([{
           user_id: "local-mock-user-id",
           content: newPost,
           category: activeCategory,
           author_name: userProfile.full_name,
           author_avatar: userProfile.avatar_url || "1",
           is_blocked: false
         }]);
         if (error) throw new Error("Failed to post locally");
         setNewPost("");
         return;
      }

      const response = await fetch("/api/community/post", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session?.access_token}`
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

 return (
 <div className="flex flex-col h-[80vh] max-h-[800px] bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
 
 {/* HEADER & CATEGORIES */}
 <div className="p-4 border-b border-gray-200 bg-gray-50">
 <h2 className="text-xl font-extrabold text-gray-900 mb-3">Private Jobs Community</h2>
 
 {/* Category Tabs (Scrollable on mobile) */}
 <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
 {CATEGORIES.map(cat => (
 <button
 key={cat}
 onClick={() => setActiveCategory(cat)}
 className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${
 activeCategory === cat 
 ?"bg-indigo-600 text-white shadow-md shadow-indigo-500/20"
 :"bg-white text-gray-600 border border-gray-200 hover:bg-gray-100"
 }`}
 >
 #{cat}
 </button>
 ))}
 </div>
 </div>

 {/* MODERATION ALERT */}
 <div className="bg-amber-50 border-b border-amber-200 p-2 text-center flex items-center justify-center gap-2">
 <ShieldAlert className="w-4 h-4 text-amber-600"/>
 <span className="text-xs font-bold text-amber-700">
 Strict Rules: No Phone numbers, Emails, Links, or Abusive Words. Violators will be banned.
 </span>
 </div>

 {/* CHAT FEED */}
 <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50">
 {loading ? (
 <div className="flex h-full items-center justify-center">
 <Loader2 className="w-8 h-8 animate-spin text-indigo-500"/>
 </div>
 ) : posts.length === 0 ? (
  <div className="flex flex-col h-full items-center justify-center text-center text-gray-400 p-6 animate-in fade-in duration-700">
    <div className="relative mb-6">
      <div className="absolute inset-0 bg-blue-100 rounded-full blur-xl opacity-50 animate-pulse"></div>
      <div className="relative bg-white w-24 h-24 rounded-full flex items-center justify-center shadow-lg border border-slate-100 animate-bounce" style={{ animationDuration: '3s' }}>
        <span className="text-5xl">💬</span>
      </div>
    </div>
    <h3 className="font-black text-slate-800 text-xl mb-2">It's quiet in here...</h3>
    <p className="font-medium text-slate-500 max-w-sm">Be the first to spark a conversation in <span className="font-bold text-blue-600">#{activeCategory}</span>!</p>
  </div>
 ) : (
 posts.map((post) => (
 <div key={post.id} className="flex gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
 <div className="w-10 h-10 rounded-full bg-gray-200 flex-shrink-0 overflow-hidden flex items-center justify-center">
 {post.author_avatar && post.author_avatar.startsWith("http") ? (
 <img src={post.author_avatar} alt="Avatar" className="w-full h-full object-cover"/>
 ) : (
 <span className="font-bold text-gray-500 text-lg">{post.author_name ? post.author_name.charAt(0).toUpperCase() : <UserCircle2 className="w-full h-full text-gray-400"/>}</span>
 )}
 </div>
 <div className="flex-1 min-w-0">
 <div className="flex items-center gap-2 mb-0.5">
 <span className="font-extrabold text-sm text-gray-900">
 {post.author_name}
 </span>
 <span className="text-[10px] text-gray-400 font-medium">
 {new Date(post.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
 </span>
 {/* Verified Badge placeholder */}
 <CheckCircle2 className="w-3.5 h-3.5 text-blue-500"/>
 </div>
 <div className="bg-white rounded-2xl rounded-tl-none border border-gray-200 px-4 py-2.5 inline-block max-w-full shadow-sm">
 <p className="text-gray-800 text-sm whitespace-pre-wrap break-words">
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
 <div className="p-4 bg-white border-t border-gray-200">
 
 {errorMsg && (
 <div className="mb-2 p-2 bg-red-50 border border-red-200 rounded-xl text-xs font-bold text-red-600 flex items-center gap-2 animate-in fade-in">
 <ShieldAlert className="w-4 h-4"/> {errorMsg}
 </div>
 )}

 <form onSubmit={handleSubmit} className="flex items-end gap-2">
 <div className="flex-1 relative">
 <textarea
 value={newPost}
 onChange={(e) => setNewPost(e.target.value)}
 placeholder={`Share something in #${activeCategory}...`}
 className="w-full bg-gray-50 border-2 border-gray-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500 resize-none h-14"
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
 className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 disabled: text-white h-14 px-5 rounded-2xl flex items-center justify-center transition-colors shadow-lg shadow-indigo-500/20"
 >
 {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin"/> : <Send className="w-5 h-5"/>}
 </button>
 </form>
 </div>
 </div>
 );
}
