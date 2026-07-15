"use client";

import { useState, useEffect, useRef } from "react";
import { Search, X, Loader2, ArrowRight, Clock, Trash2, Flame } from "lucide-react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

interface GlobalSearchProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function GlobalSearch({ isOpen, onClose }: GlobalSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Load recent searches
  useEffect(() => {
    if (isOpen) {
      const saved = JSON.parse(localStorage.getItem("rs_recent_searches") || "[]");
      setRecentSearches(saved);
      // Auto focus after a tiny delay for animation to finish
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      setQuery("");
      setResults([]);
    }
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(async () => {
      const cleanQuery = query.trim();
      if (cleanQuery.length >= 2) {
        setIsSearching(true);
        try {
          const { data } = await supabase
            .from("jobs")
            .select("title, slug, category, status")
            .ilike("title", `%${cleanQuery}%`)
            .neq("status", "draft")
            .order("created_at", { ascending: false })
            .limit(8);
          setResults(data || []);
        } catch (err) {
          console.error("Search error:", err);
        } finally {
          setIsSearching(false);
        }
      } else {
        setResults([]);
      }
    }, 300); // 300ms debounce
    return () => clearTimeout(timer);
  }, [query]);

  const saveRecentSearch = (searchTerm: string) => {
    if (!searchTerm.trim()) return;
    const current = JSON.parse(localStorage.getItem("rs_recent_searches") || "[]");
    const updated = [searchTerm, ...current.filter((s: string) => s !== searchTerm)].slice(0, 5);
    localStorage.setItem("rs_recent_searches", JSON.stringify(updated));
    setRecentSearches(updated);
  };

  const handleResultClick = (slug: string, title: string) => {
    saveRecentSearch(title);
    onClose();
    router.push(`/job/${slug}`);
  };

  const handleRecentClick = (term: string) => {
    setQuery(term);
  };

  const clearRecent = () => {
    localStorage.removeItem("rs_recent_searches");
    setRecentSearches([]);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100000] flex flex-col bg-white dark:bg-gray-950 sm:p-4 sm:bg-black/60 sm:backdrop-blur-sm animate-in fade-in duration-200">
      <div className="flex-1 w-full sm:max-w-3xl sm:mx-auto bg-white dark:bg-gray-950 sm:rounded-3xl sm:shadow-2xl overflow-hidden flex flex-col sm:max-h-[85vh]">
        
        {/* Search Header */}
        <div className="flex items-center gap-3 p-3 sm:p-4 border-b border-gray-100 dark:border-gray-800 shrink-0">
          <div className="flex-1 relative">
            <Search className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 ${isSearching ? "text-indigo-500 animate-pulse" : "text-gray-400"}`} />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search for SSC, Railway, UPSC jobs..."
              className="w-full bg-gray-100 dark:bg-gray-900 border-none rounded-2xl pl-12 pr-10 py-4 text-base sm:text-lg font-medium text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 transition-shadow"
            />
            {query && (
              <button 
                onClick={() => setQuery("")}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 bg-gray-200 dark:bg-gray-800 rounded-full transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-3 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 bg-gray-100 dark:bg-gray-900 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-2xl transition-colors sm:hidden"
          >
            Cancel
          </button>
        </div>

        {/* Search Body */}
        <div className="flex-1 overflow-y-auto overscroll-contain pb-safe p-4">
          
          {/* Loading State */}
          {isSearching && results.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-gray-400">
              <Loader2 className="w-8 h-8 animate-spin mb-4 text-indigo-500" />
              <p className="font-medium">Searching jobs...</p>
            </div>
          )}

          {/* Results List */}
          {query.trim().length >= 2 && !isSearching && results.length > 0 && (
            <div className="animate-in slide-in-from-bottom-2 duration-300">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 px-1">Search Results</h3>
              <ul className="space-y-1">
                {results.map((job) => (
                  <li key={job.slug}>
                    <button
                      onClick={() => handleResultClick(job.slug, job.title)}
                      className="w-full text-left flex items-start gap-3 p-3 rounded-2xl hover:bg-indigo-50 dark:hover:bg-indigo-900/20 group transition-colors"
                    >
                      <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-800 group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900/40 flex items-center justify-center shrink-0 mt-0.5">
                        <Search className="w-4 h-4 text-gray-400 group-hover:text-indigo-500 transition-colors" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm sm:text-base font-bold text-gray-900 dark:text-white line-clamp-2 leading-tight group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                          {job.title}
                        </h4>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] sm:text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-md">
                            {job.category}
                          </span>
                          {job.status === "last" && (
                            <span className="text-[10px] sm:text-xs font-bold text-red-600 bg-red-50 dark:bg-red-900/20 px-2 py-0.5 rounded-md flex items-center gap-1">
                              <Flame className="w-3 h-3" /> Closing Soon
                            </span>
                          )}
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-gray-300 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all shrink-0 mt-3" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* No Results */}
          {query.trim().length >= 2 && !isSearching && results.length === 0 && (
            <div className="text-center py-12 px-4 animate-in fade-in duration-300">
              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-gray-300 dark:text-gray-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">No jobs found</h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                We couldn't find any active jobs matching "{query}". Try checking your spelling or search for a broader term like "SSC" or "Police".
              </p>
            </div>
          )}

          {/* Idle State: Recent Searches & Popular Tags */}
          {query.trim().length < 2 && (
            <div className="animate-in fade-in duration-300">
              {recentSearches.length > 0 && (
                <div className="mb-8">
                  <div className="flex items-center justify-between px-1 mb-3">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Recent Searches</h3>
                    <button onClick={clearRecent} className="text-[11px] font-semibold text-gray-400 hover:text-red-500 flex items-center gap-1 transition-colors">
                      <Trash2 className="w-3 h-3" /> Clear
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {recentSearches.map((term, i) => (
                      <button
                        key={i}
                        onClick={() => handleRecentClick(term)}
                        className="flex items-center gap-1.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 px-3 py-2 rounded-xl text-sm font-medium transition-colors border border-transparent hover:border-gray-300 dark:hover:border-gray-600"
                      >
                        <Clock className="w-3.5 h-3.5 text-gray-400" />
                        <span className="truncate max-w-[200px]">{term}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 px-1">Popular Categories</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { label: "SSC Jobs", slug: "ssc", icon: "🏛️" },
                    { label: "Railway", slug: "railway", icon: "🚂" },
                    { label: "Banking", slug: "banking", icon: "🏦" },
                    { label: "Defence", slug: "defence", icon: "🛡️" },
                  ].map((cat) => (
                    <button
                      key={cat.slug}
                      onClick={() => { onClose(); router.push(`/jobs/${cat.slug}`); }}
                      className="flex items-center gap-2 bg-indigo-50/50 dark:bg-indigo-900/10 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 px-4 py-3 rounded-2xl text-sm font-bold transition-colors border border-indigo-100 dark:border-indigo-800/50 text-left"
                    >
                      <span className="text-lg">{cat.icon}</span>
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
      
      {/* Desktop Close Click-Away Area */}
      <div className="hidden sm:block flex-1" onClick={onClose} />
    </div>
  );
}
