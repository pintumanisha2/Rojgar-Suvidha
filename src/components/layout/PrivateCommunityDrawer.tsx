"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { Send, Users, X, Briefcase, Lock } from "lucide-react";
import { usePathname } from "next/navigation";
import Link from "next/link";

interface CommunityPost {
  id: string;
  user_id: string;
  content: string;
  category: string;
  author_name: string;
  author_avatar: string;
  created_at: string;
}

const CATEGORIES = [
  "General",
  "IT/Engineering",
  "BPO/Calling",
  "Sales/Marketing",
  "Interview-Prep"
];

export default function PrivateCommunityDrawer() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Filter state
  const [selectedFilter, setSelectedFilter] = useState("All");
  
  // Posting category state
  const [postCategory, setPostCategory] = useState("General");

  // User Session State
  const [myUserId, setMyUserId] = useState<string | null>(null);
  const [myName, setMyName] = useState("");

  useEffect(() => {
    const handleOpen = () => setIsOpen(true);
    window.addEventListener("openPrivateCommunity", handleOpen);
    return () => window.removeEventListener("openPrivateCommunity", handleOpen);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    
    checkUserSession();
    fetchPosts();

    const channel = supabase
      .channel("private-community")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "private_community_posts" },
        (payload) => {
          // If the post matches the current filter or filter is "All", add it
          const newPost = payload.new as CommunityPost;
          setPosts(prev => {
            if (selectedFilter === "All" || newPost.category === selectedFilter) {
              return [newPost, ...prev];
            }
            return prev;
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isOpen, selectedFilter]);

  const checkUserSession = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      setMyUserId(session.user.id);
      
      const { data: profile } = await supabase
        .from("private_candidate_profiles")
        .select("full_name")
        .eq("id", session.user.id)
        .maybeSingle();

      setMyName(profile?.full_name || session.user.email?.split("@")[0] || "Candidate");
    } else {
      let isLocalActive = false;
      try {
        isLocalActive = localStorage.getItem("rs_candidate_session_active") === "true";
      } catch(e) {}
      
      if (isLocalActive) {
        setMyUserId("local-mock-user-id");
        let localName = "Candidate Profile";
        try {
          const profileStr = localStorage.getItem("rs_candidate_mock_profile");
          if (profileStr) {
             const parsed = JSON.parse(profileStr);
             if (parsed.fullName) localName = parsed.fullName;
          }
        } catch(e) {}
        setMyName(localName);
      } else {
        setMyUserId(null);
      }
    }
  };

  const fetchPosts = async () => {
    setLoading(true);
    let query = supabase
      .from("private_community_posts")
      .select("*")
      .eq("is_blocked", false)
      .order("created_at", { ascending: false });

    if (selectedFilter !== "All") {
      query = query.eq("category", selectedFilter);
    }

    const { data, error } = await query.limit(50);
      
    if (data) {
      setPosts(data as CommunityPost[]);
    }
    setLoading(false);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !myUserId) return;

    const newPost = {
      user_id: myUserId,
      content: inputText.trim(),
      category: postCategory,
      author_name: myName || "Anonymous User",
      author_avatar: "1",
    };

    const tempText = inputText.trim();
    setInputText("");

    const { error } = await supabase.from("private_community_posts").insert([newPost]);

    if (error) {
      alert("Failed to send message. Please try again.");
      setInputText(tempText);
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
      <div className="relative w-full md:w-[50%] lg:w-[45%] xl:w-[40%] h-full bg-white  shadow-2xl border-l border-gray-200  flex flex-col z-10 transition-transform duration-300 transform translate-x-0">
        
        {/* Drawer Header */}
        <div className="bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 px-5 py-4 flex items-center justify-between shrink-0 shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center border border-white/20 shadow-inner">
              <Users className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="font-extrabold text-white text-lg leading-tight flex items-center gap-2">
                Private Jobs Community
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black bg-green-500 text-white animate-pulse">LIVE</span>
              </h2>
              <p className="text-xs text-blue-100 mt-0.5">Connect, Discuss, and Find Jobs</p>
            </div>
          </div>
          <button 
            onClick={() => setIsOpen(false)}
            className="p-2 hover:bg-white/15 rounded-xl transition-colors text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Category Hashtag Filter Bar */}
        <div className="bg-white  border-b border-gray-200  px-4 py-2.5 shrink-0 flex items-center gap-2 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setSelectedFilter("All")}
            className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap ${
              selectedFilter === "All"
                ? "bg-blue-600 text-white shadow-sm"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200   :bg-gray-700"
            }`}
          >
            # All
          </button>
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedFilter(cat)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap ${
                selectedFilter === cat
                  ? "bg-blue-600 text-white shadow-sm"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200   :bg-gray-700"
              }`}
            >
              #{cat}
            </button>
          ))}
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50  flex flex-col-reverse">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center text-gray-500  my-10 flex flex-col items-center">
              <Briefcase className="w-12 h-12 mb-3 opacity-20" />
              <p>No posts in #{selectedFilter} yet.</p>
            </div>
          ) : (
            <>
              <div ref={messagesEndRef} />
              {posts.map((post) => (
                <div key={post.id} className="flex flex-col mb-4 bg-white  p-3 rounded-2xl shadow-sm border border-gray-100 ">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-blue-100  flex items-center justify-center text-blue-700  font-bold text-xs shrink-0">
                        {post.author_name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-bold text-sm text-gray-900 ">{post.author_name}</span>
                        <span className="text-[10px] text-gray-500 ">
                          {new Date(post.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </span>
                      </div>
                    </div>
                    {/* Post Category Tag */}
                    <span className="text-[10px] bg-blue-50  text-blue-600  font-black px-2 py-0.5 rounded-md border border-blue-100 ">
                      #{post.category}
                    </span>
                  </div>
                  <p className="text-sm text-gray-800  ml-10">
                    {post.content}
                  </p>
                </div>
              ))}
            </>
          )}
        </div>

        {/* Input Area */}
        <div className="p-4 bg-white  border-t border-gray-200  shrink-0">
          {!myUserId ? (
            <div className="text-center py-6 px-4 bg-blue-50/50 /20 rounded-2xl border border-blue-100 /50 flex flex-col items-center">
              <Lock className="w-8 h-8 text-blue-500  mb-2 opacity-80" />
              <p className="text-sm text-blue-900  font-extrabold mb-1">Join the Conversation</p>
              <p className="text-xs text-gray-500  mb-4">You need to log in to post messages in the community.</p>
              <Link
                href="/private-jobs/login"
                className="w-full text-center bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-sm py-3 rounded-xl transition-all shadow-md shadow-blue-600/20 active:scale-95"
              >
                Log In Now 🔑
              </Link>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {/* Category selector for posting */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 no-scrollbar">
                <span className="text-[10px] font-bold text-gray-400  uppercase tracking-wider shrink-0 mr-1">Tag:</span>
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setPostCategory(cat)}
                    className={`px-2 py-1 rounded-lg text-[10px] font-black transition-all ${
                      postCategory === cat
                        ? "bg-blue-50  text-blue-600  border border-blue-200 "
                        : "bg-gray-50 text-gray-400 hover:text-gray-600   :text-gray-400 border border-transparent"
                    }`}
                  >
                    #{cat}
                  </button>
                ))}
              </div>
              
              <form onSubmit={handleSendMessage} className="flex gap-2">
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder={`Post in #${postCategory}...`}
                  className="flex-1 bg-gray-100  border-none rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 "
                  maxLength={500}
                />
                <button
                  type="submit"
                  disabled={!inputText.trim()}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 :bg-gray-700 text-white rounded-2xl p-3 transition-colors flex items-center justify-center shrink-0 shadow-md"
                >
                  <Send className="w-5 h-5" />
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
