"use client";

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';
import { useTheme } from '@/components/ThemeProvider';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';
import {
  Briefcase,
  Search,
  Globe,
  Moon,
  Sun,
  ChevronDown,
  ClipboardCheck,
  Menu,
  X,
  Newspaper,
  FileText,
  BookOpen,
  Key,
  GraduationCap,
  Landmark,
  ChevronRight,
  UserCircle,
  MessageSquareWarning,
  Bookmark,
  MapPin,
} from 'lucide-react';

const navSections = [
  { name: "Latest Jobs", href: "/latest-jobs", icon: Briefcase, color: "text-indigo-500" },
  { name: "Results", href: "/results", icon: FileText, color: "text-green-500" },
  { name: "Admit Card", href: "/admit-card", icon: BookOpen, color: "text-orange-500" },
  { name: "Answer Key", href: "/answer-key", icon: Key, color: "text-purple-500" },
  { name: "Admission", href: "/admission", icon: GraduationCap, color: "text-blue-500" },
  { name: "News", href: "/news", icon: Newspaper, color: "text-rose-500" },
];

// Jobs by sector — links to /jobs/[type] dynamic pages
const jobCategories = [
  { name: "SSC Jobs", href: "/jobs/ssc", emoji: "🏛️", desc: "CGL, CHSL, MTS, GD" },
  { name: "Railway Jobs", href: "/jobs/railway", emoji: "🚂", desc: "NTPC, Group D, ALP" },
  { name: "Bank Jobs", href: "/jobs/banking", emoji: "🏦", desc: "IBPS, SBI, RBI" },
  { name: "UPSC Jobs", href: "/jobs/upsc", emoji: "🎖️", desc: "IAS, NDA, CDS" },
  { name: "Police Jobs", href: "/jobs/police", emoji: "👮", desc: "UP, Delhi, CISF" },
  { name: "Defence Jobs", href: "/jobs/defence", emoji: "🛡️", desc: "Army, Navy, Airforce" },
  { name: "Teaching Jobs", href: "/jobs/teaching", emoji: "📚", desc: "CTET, KVS, NVS" },
  { name: "State PSC", href: "/jobs/state-psc", emoji: "🏢", desc: "UPPSC, BPSC, MPPSC" },
];

const states = [
  { name: "Andhra Pradesh", abbr: "AP" }, { name: "Arunachal Pradesh", abbr: "AR" },
  { name: "Assam", abbr: "AS" }, { name: "Bihar", abbr: "BR" },
  { name: "Chhattisgarh", abbr: "CG" }, { name: "Goa", abbr: "GA" },
  { name: "Gujarat", abbr: "GJ" }, { name: "Haryana", abbr: "HR" },
  { name: "Himachal Pradesh", abbr: "HP" }, { name: "Jharkhand", abbr: "JH" },
  { name: "Karnataka", abbr: "KA" }, { name: "Kerala", abbr: "KL" },
  { name: "Madhya Pradesh", abbr: "MP" }, { name: "Maharashtra", abbr: "MH" },
  { name: "Manipur", abbr: "MN" }, { name: "Meghalaya", abbr: "ML" },
  { name: "Mizoram", abbr: "MZ" }, { name: "Nagaland", abbr: "NL" },
  { name: "Odisha", abbr: "OR" }, { name: "Punjab", abbr: "PB" },
  { name: "Rajasthan", abbr: "RJ" }, { name: "Sikkim", abbr: "SK" },
  { name: "Tamil Nadu", abbr: "TN" }, { name: "Telangana", abbr: "TS" },
  { name: "Tripura", abbr: "TR" }, { name: "Uttar Pradesh", abbr: "UP" },
  { name: "Uttarakhand", abbr: "UK" }, { name: "West Bengal", abbr: "WB" },
  { name: "Andaman & Nicobar", abbr: "AN" }, { name: "Chandigarh", abbr: "CH" },
  { name: "Delhi", abbr: "DL" }, { name: "Jammu & Kashmir", abbr: "JK" },
  { name: "Ladakh", abbr: "LA" }, { name: "Lakshadweep", abbr: "LD" },
  { name: "Puducherry", abbr: "PY" }
];

const languages = [
  { code: "EN", label: "English" },
  { code: "HI", label: "हिंदी" },
  { code: "BN", label: "বাংলা" },
  { code: "TE", label: "తెలుగు" },
  { code: "MR", label: "मराठी" },
];

export default function Navbar() {
  const { theme, setTheme } = useTheme();
  const isDark = theme === 'dark';
  
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isStateOpen, setIsStateOpen] = useState(false);
  const [isLangOpen, setIsLangOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [selectedLang, setSelectedLang] = useState(languages[0]);
  
  // State Dropdown Search
  const [stateSearchQuery, setStateSearchQuery] = useState('');

  // Smart Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<{title: string, slug: string}[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const searchRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const pathname = usePathname();
  const isPrivate = pathname === '/private-jobs';

  let currentStateName = "Select State";
  if (pathname && pathname.startsWith('/state/')) {
    const slug = pathname.split('/')[2];
    if (slug) {
      const matchedState = states.find(s => s.name.toLowerCase().replace(/ /g, '-') === slug);
      if (matchedState) {
        currentStateName = matchedState.name;
      } else {
        currentStateName = slug.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
      }
    }
  }

  // Auth State
  const [user, setUser] = useState<any>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  // Saved Jobs State
  const [savedCount, setSavedCount] = useState(0);

  useEffect(() => {
    const updateSavedCount = () => {
      const savedJobs = JSON.parse(localStorage.getItem("saved_jobs") || "[]");
      setSavedCount(savedJobs.length);
    };

    updateSavedCount(); // Initial check
    window.addEventListener('savedJobsUpdated', updateSavedCount);
    
    return () => window.removeEventListener('savedJobsUpdated', updateSavedCount);
  }, []);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user || null);
      if (session?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('avatar_url')
          .eq('id', session.user.id)
          .single();
        setAvatarUrl(profile?.avatar_url || null);
      }
    };
    checkUser();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user || null);
      if (session?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('avatar_url')
          .eq('id', session.user.id)
          .single();
        setAvatarUrl(profile?.avatar_url || null);
      } else {
        setAvatarUrl(null);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (isSearchOpen && searchRef.current) {
      searchRef.current.focus();
    } else {
      setSearchQuery('');
      setSearchResults([]);
    }
  }, [isSearchOpen]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (searchQuery.trim().length >= 2) {
        setIsSearching(true);
        const { data } = await supabase
          .from('jobs')
          .select('title, slug')
          .ilike('title', `%${searchQuery}%`)
          .neq('status', 'draft')
          .limit(6);
        
        setSearchResults(data || []);
        setIsSearching(false);
      } else {
        setSearchResults([]);
      }
    }, 300); // 300ms debounce

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const handleLanguageChange = (lang: { code: string; label: string }) => {
    setSelectedLang(lang);
    setIsLangOpen(false);
    
    // Trigger Google Translate
    const selectElement = document.querySelector(".goog-te-combo") as HTMLSelectElement;
    if (selectElement) {
      const langMap: Record<string, string> = {
        "EN": "en", "HI": "hi", "BN": "bn", "TE": "te", "MR": "mr"
      };
      selectElement.value = langMap[lang.code] || "en";
      selectElement.dispatchEvent(new Event("change"));
    }
  };

  // Hide public navbar on admin pages
  if (pathname.startsWith('/admin')) return null;

  return (
    <>
      {/* Navbar */}
      <header className="sticky top-0 z-50 w-full">

        {/* === TOP BAR === */}
        <div className="bg-gradient-to-r from-indigo-700 via-indigo-600 to-violet-600 text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-[60px]">

              {/* Logo */}
              <Link href="/" className="flex items-center gap-3 shrink-0">
                <div className="shrink-0 flex items-center justify-center mr-1 hover:scale-110 transition-transform duration-300 cursor-pointer">
                  <Image 
                    src="/logo-v2.svg" 
                    alt="Rojgar Suvidha Icon"
                    width={46}
                    height={46}
                    className="h-11 w-11 object-contain"
                    priority
                  />
                </div>
                <div className="flex flex-col leading-none">
                  <span className="font-extrabold text-xl tracking-tight text-white">
                    Rojgar<span className="text-yellow-300">Suvidha</span>
                  </span>
                  <span className="text-[10px] text-indigo-200 font-medium tracking-widest uppercase">
                    Your Career Partner
                  </span>
                </div>
              </Link>

              {/* Central Premium Toggle (Desktop) */}
              <div className="hidden md:flex items-center bg-black/20 p-1 rounded-xl border border-white/10 backdrop-blur-md">
                <Link 
                  href="/"
                  className={`flex items-center gap-2 px-5 py-1.5 rounded-lg text-sm font-bold transition-all ${!isPrivate ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg' : 'text-white/70 hover:text-white hover:bg-white/10'}`}
                >
                  🏛️ Govt Jobs
                </Link>
                <Link 
                  href="/private-jobs"
                  className={`flex items-center gap-2 px-5 py-1.5 rounded-lg text-sm font-bold transition-all ${isPrivate ? 'bg-gradient-to-r from-indigo-500 to-blue-500 text-white shadow-lg' : 'text-white/70 hover:text-white hover:bg-white/10'}`}
                >
                  🏢 Private Jobs
                </Link>
              </div>

              {/* Right Controls */}
              <div className="flex items-center gap-1 sm:gap-2">

                {/* Search Toggle */}
                <button
                  onClick={() => setIsSearchOpen(!isSearchOpen)}
                  className="p-2 rounded-lg hover:bg-white/10 transition-all text-white/80 hover:text-white"
                  aria-label="Search"
                >
                  <Search className="w-5 h-5" />
                </button>

                {/* Saved Jobs Icon */}
                <Link
                  href="/saved-jobs"
                  className="p-2 rounded-lg hover:bg-white/10 transition-all text-white/80 hover:text-white relative"
                  aria-label="Saved Jobs"
                >
                  <Bookmark className="w-5 h-5" />
                  {savedCount > 0 && (
                    <span className="absolute top-1 right-0.5 bg-yellow-400 text-indigo-900 text-[10px] font-extrabold px-1.5 py-0.5 rounded-full min-w-[18px] text-center shadow-sm">
                      {savedCount}
                    </span>
                  )}
                </Link>

                {/* Language Switcher */}
                <div className="relative">
                  <button
                    onClick={() => { setIsLangOpen(!isLangOpen); setIsStateOpen(false); }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-white/10 transition-all text-white/80 hover:text-white text-sm font-semibold"
                  >
                    <Globe className="w-4 h-4" />
                    <span className="hidden sm:inline">{selectedLang.code}</span>
                    <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isLangOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {isLangOpen && (
                    <div className="absolute right-0 top-full mt-2 w-40 bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-gray-100 dark:border-gray-800 overflow-hidden z-50">
                      {languages.map((lang) => (
                        <button
                          key={lang.code}
                          onClick={() => handleLanguageChange(lang)}
                          className={`w-full flex items-center justify-between px-4 py-2.5 text-sm transition-colors ${selectedLang.code === lang.code ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 font-semibold' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
                        >
                          <span>{lang.label}</span>
                          <span className="text-xs text-gray-400">{lang.code}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Dark Mode */}
                <button
                  onClick={() => setTheme(isDark ? 'light' : 'dark')}
                  className="p-2 rounded-lg hover:bg-white/10 transition-all text-white/80 hover:text-white"
                  aria-label="Toggle Dark Mode"
                >
                  {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                </button>

                {/* Track Application (Desktop only) */}
                <Link
                  href="/track-application"
                  className="hidden sm:flex items-center gap-2 ml-1 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-sm font-bold transition-all duration-200 border border-white/10"
                >
                  <ClipboardCheck className="w-4 h-4" />
                  <span className="hidden lg:inline">Track</span>
                </Link>

                {/* Help & Support (Desktop) */}
                <Link
                  href="/complaint"
                  className="hidden sm:flex items-center gap-2 ml-1 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-200 hover:text-white rounded-xl text-sm font-bold transition-all duration-200 border border-red-400/20"
                >
                  <MessageSquareWarning className="w-4 h-4" />
                  <span className="hidden lg:inline">Help</span>
                </Link>

                {/* Login / Dashboard */}
                {user ? (
                  <Link
                    href="/dashboard"
                    className="hidden sm:flex items-center gap-2 ml-1 px-3 py-1.5 bg-gradient-to-r from-green-400 to-emerald-500 text-white hover:from-green-500 hover:to-emerald-600 rounded-xl text-sm font-bold shadow-md shadow-green-500/20 transition-all duration-200"
                  >
                    {avatarUrl ? (
                      <img
                        src={avatarUrl}
                        alt="Profile"
                        className="w-6 h-6 rounded-full object-cover border-2 border-white/50 shrink-0"
                      />
                    ) : (
                      <UserCircle className="w-4 h-4" />
                    )}
                    Dashboard
                  </Link>
                ) : (
                  <Link
                    href="/login"
                    className="hidden sm:flex items-center gap-2 ml-1 px-4 py-2 bg-white text-indigo-700 hover:bg-yellow-300 hover:text-indigo-800 rounded-xl text-sm font-bold shadow-md transition-all duration-200"
                  >
                    <UserCircle className="w-4 h-4" />
                    Login
                  </Link>
                )}

                {/* Mobile Hamburger */}
                <button
                  className="ml-1 p-2 rounded-lg hover:bg-white/10 transition-all text-white sm:hidden"
                  onClick={() => setIsMobileOpen(!isMobileOpen)}
                >
                  {isMobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Search Expandable Bar */}
        <div className={`overflow-visible transition-all duration-300 bg-indigo-800/95 backdrop-blur-md ${isSearchOpen ? 'py-3' : 'h-0 py-0 opacity-0 pointer-events-none'}`}>
          <div className="max-w-2xl mx-auto px-4 relative">
            <div className="relative">
              <Search className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 ${isSearching ? 'text-yellow-400 animate-pulse' : 'text-indigo-300'}`} />
              <input
                ref={searchRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && searchQuery.trim() && searchResults.length > 0) {
                    setIsSearchOpen(false);
                    router.push(`/job/${searchResults[0].slug}`);
                    setSearchQuery('');
                  }
                }}
                placeholder="Search for jobs, states, departments..."
                className="w-full bg-white/10 border border-white/20 text-white placeholder-indigo-300 rounded-xl pl-11 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400/60 focus:bg-white/15 transition-all"
              />
            </div>

            {/* Smart Search Auto-suggestions */}
            {searchQuery.trim().length >= 2 && (
              <div className="absolute top-full left-4 right-4 mt-2 bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-gray-100 dark:border-gray-800 overflow-hidden z-50">
                {isSearching ? (
                  <div className="p-4 text-center text-sm text-gray-500">Searching...</div>
                ) : searchResults.length > 0 ? (
                  <ul className="divide-y divide-gray-50 dark:divide-gray-800">
                    {searchResults.map((job) => (
                      <li key={job.slug}>
                        <Link 
                          href={`/job/${job.slug}`}
                          onClick={() => setIsSearchOpen(false)}
                          className="flex items-center gap-3 px-4 py-3 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors group"
                        >
                          <Search className="w-4 h-4 text-gray-400 group-hover:text-indigo-500 shrink-0" />
                          <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 group-hover:text-indigo-700 dark:group-hover:text-indigo-400 line-clamp-1">{job.title}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="p-4 text-center text-sm text-gray-500">No jobs found matching "{searchQuery}"</div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* === BOTTOM NAVIGATION BAR === */}
        <div className="hidden sm:block bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between">

              {/* Nav Links */}
              <nav className="flex items-center gap-1" aria-label="Main navigation">
                {navSections.map((section) => {
                  const Icon = section.icon;
                  return (
                    <Link
                      key={section.name}
                      href={section.href}
                      className="group flex items-center gap-1.5 px-3 py-3.5 text-sm font-semibold text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all relative"
                    >
                      <Icon className={`w-4 h-4 ${section.color} opacity-60 group-hover:opacity-100 transition-opacity`} />
                      {section.name}
                      <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0.5 bg-indigo-500 group-hover:w-3/4 transition-all duration-300 rounded-full"></span>
                    </Link>
                  );
                })}

                {/* Jobs by Category Dropdown */}
                <div className="relative group">
                  <button
                    className="flex items-center gap-1.5 px-3 py-3.5 text-sm font-semibold text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all relative"
                    aria-label="Jobs by Category"
                  >
                    <Briefcase className="w-4 h-4 text-indigo-500 opacity-60 group-hover:opacity-100 transition-opacity" />
                    By Category
                    <ChevronDown className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100 group-hover:rotate-180 transition-all duration-200" />
                    <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0.5 bg-indigo-500 group-hover:w-3/4 transition-all duration-300 rounded-full"></span>
                  </button>

                  {/* Dropdown Panel */}
                  <div className="absolute left-0 top-full mt-0 w-64 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-800 z-50 overflow-hidden opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 translate-y-1 group-hover:translate-y-0">
                    <div className="p-3 bg-indigo-50 dark:bg-indigo-900/30 border-b border-indigo-100 dark:border-indigo-800/50">
                      <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">Jobs by Sector</p>
                    </div>
                    <div className="p-2">
                      {jobCategories.map((cat) => (
                        <Link
                          key={cat.href}
                          href={cat.href}
                          className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors group/item"
                        >
                          <span className="text-xl shrink-0">{cat.emoji}</span>
                          <div>
                            <p className="text-sm font-bold text-gray-800 dark:text-gray-200 group-hover/item:text-indigo-600 dark:group-hover/item:text-indigo-400 transition-colors">{cat.name}</p>
                            <p className="text-[11px] text-gray-400">{cat.desc}</p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              </nav>

              {/* State Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setIsStateOpen(!isStateOpen)}
                  className="flex items-center gap-2 px-4 py-2 my-1.5 bg-indigo-50 dark:bg-indigo-900/30 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 text-indigo-700 dark:text-indigo-400 rounded-xl text-sm font-bold transition-all border border-indigo-100 dark:border-indigo-800/50"
                >
                  <MapPin className="w-4 h-4" />
                  <span className="truncate max-w-[120px]">{currentStateName}</span>
                  <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isStateOpen ? 'rotate-180' : ''}`} />
                </button>

                {isStateOpen && (
                  <div className="absolute right-0 top-full mt-2 w-72 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-800 z-50 overflow-hidden flex flex-col">
                    <div className="p-3 bg-indigo-50 dark:bg-indigo-900/30 border-b border-indigo-100 dark:border-indigo-800/50">
                      <div className="flex items-center gap-2 mb-2">
                        <MapPin className="w-4 h-4 text-indigo-500" />
                        <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">Browse by State</p>
                      </div>
                      <div className="relative">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-indigo-300" />
                        <input 
                          type="text" 
                          placeholder="Find your state..." 
                          value={stateSearchQuery}
                          onChange={(e) => setStateSearchQuery(e.target.value)}
                          className="w-full bg-white dark:bg-gray-800 border border-indigo-100 dark:border-indigo-800/50 rounded-lg pl-8 pr-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-gray-900 dark:text-white"
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 p-2 max-h-[320px] overflow-y-auto custom-scrollbar">
                      {/* All India Option */}
                      <Link
                        href="/"
                        onClick={() => { setIsStateOpen(false); setStateSearchQuery(''); }}
                        className="flex items-center justify-between px-3 py-2.5 mb-1 rounded-xl text-[13px] text-gray-800 dark:text-gray-200 bg-amber-50 dark:bg-amber-900/20 hover:bg-amber-100 dark:hover:bg-amber-900/40 hover:text-amber-800 dark:hover:text-amber-400 transition-all group col-span-1 sm:col-span-2 border border-amber-200 dark:border-amber-800/50 shadow-sm"
                      >
                        <span className="font-extrabold truncate mr-2">🌍 All India (Central Govt)</span>
                        <span className="text-[10px] bg-amber-200 dark:bg-amber-800 text-amber-800 dark:text-amber-200 px-1.5 py-0.5 rounded-md font-extrabold transition-colors shrink-0">INDIA</span>
                      </Link>
                      
                      {states
                        .filter(s => s.name.toLowerCase().includes(stateSearchQuery.toLowerCase()) || s.abbr.toLowerCase().includes(stateSearchQuery.toLowerCase()))
                        .map((state) => (
                        <Link
                          key={state.name}
                          href={`/state/${state.name.toLowerCase().replace(/ /g, '-')}`}
                          onClick={() => { setIsStateOpen(false); setStateSearchQuery(''); }}
                          className="flex items-center justify-between px-3 py-2 rounded-xl text-[13px] text-gray-700 dark:text-gray-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all group"
                        >
                          <span className="font-semibold truncate mr-2">{state.name}</span>
                          <span className="text-[10px] bg-gray-100 dark:bg-gray-800 text-gray-500 px-1.5 py-0.5 rounded-md font-extrabold group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900/50 group-hover:text-indigo-600 transition-colors shrink-0">{state.abbr}</span>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* === MOBILE DRAWER === */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-40 sm:hidden">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsMobileOpen(false)}></div>
          <div className="absolute top-[60px] left-0 right-0 bg-white dark:bg-gray-950 shadow-2xl max-h-[calc(100vh-60px)] overflow-y-auto">
            
            {/* Mobile Govt / Private Toggle */}
            <div className="p-4 pb-0">
              <div className="flex items-center bg-gray-100 dark:bg-gray-900 p-1 rounded-xl w-full">
                <Link 
                  href="/"
                  onClick={() => setIsMobileOpen(false)}
                  className={`flex-1 flex justify-center items-center gap-2 py-2 rounded-lg text-sm font-bold transition-all ${!isPrivate ? 'bg-white dark:bg-gray-800 text-orange-600 dark:text-orange-400 shadow-sm' : 'text-gray-500'}`}
                >
                  🏛️ Govt Jobs
                </Link>
                <Link 
                  href="/private-jobs"
                  onClick={() => setIsMobileOpen(false)}
                  className={`flex-1 flex justify-center items-center gap-2 py-2 rounded-lg text-sm font-bold transition-all ${isPrivate ? 'bg-white dark:bg-gray-800 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-gray-500'}`}
                >
                  🏢 Private Jobs
                </Link>
              </div>
            </div>

            {/* Sections */}
            <div className="p-4">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 px-2">Quick Navigate</p>
              <div className="grid grid-cols-3 gap-2" role="navigation" aria-label="Main categories">
                {navSections.map((section) => {
                  const Icon = section.icon;
                  return (
                    <Link
                      key={section.name}
                      href={section.href}
                      onClick={() => setIsMobileOpen(false)}
                      className="flex flex-col items-center gap-2 p-3 bg-gray-50 dark:bg-gray-900 rounded-xl hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors"
                    >
                      <div className="w-10 h-10 bg-white dark:bg-gray-800 rounded-xl flex items-center justify-center shadow-sm">
                        <Icon className={`w-5 h-5 ${section.color}`} />
                      </div>
                      <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 text-center">{section.name}</span>
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Jobs by Sector – Mobile */}
            <div className="px-4 pb-2">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 px-2">Jobs by Sector</p>
              <div className="grid grid-cols-4 gap-2" role="navigation" aria-label="Job sectors">
                {jobCategories.map((cat) => (
                  <Link
                    key={cat.href}
                    href={cat.href}
                    onClick={() => setIsMobileOpen(false)}
                    className="flex flex-col items-center gap-1.5 p-2.5 bg-gray-50 dark:bg-gray-900 rounded-xl hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors"
                  >
                    <span className="text-xl">{cat.emoji}</span>
                    <span className="text-[10px] font-bold text-gray-700 dark:text-gray-300 text-center leading-tight">{cat.name}</span>
                  </Link>
                ))}
              </div>
            </div>

            {/* Track Application & Login */}
            <div className="px-4 pb-4 space-y-3">
              {user ? (
                <Link
                  href="/dashboard"
                  onClick={() => setIsMobileOpen(false)}
                  className="flex items-center justify-center gap-2.5 w-full py-3.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-bold shadow-lg shadow-green-200 dark:shadow-none"
                >
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt="Profile"
                      className="w-7 h-7 rounded-full object-cover border-2 border-white/60 shrink-0"
                    />
                  ) : (
                    <UserCircle className="w-5 h-5" />
                  )}
                  Student Dashboard
                </Link>
              ) : (
                <Link
                  href="/login"
                  onClick={() => setIsMobileOpen(false)}
                  className="flex items-center justify-center gap-2 w-full py-3.5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-200 dark:shadow-none"
                >
                  <UserCircle className="w-5 h-5" />
                  Login / Create Account
                </Link>
              )}
              
              <Link
                href="/track-application"
                onClick={() => setIsMobileOpen(false)}
                className="flex items-center justify-center gap-2 w-full py-3 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl font-bold transition-all"
              >
                <ClipboardCheck className="w-5 h-5" />
                Track Your Application
              </Link>

              <Link
                href="/complaint"
                onClick={() => setIsMobileOpen(false)}
                className="flex items-center justify-center gap-2 w-full py-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 rounded-xl font-bold transition-all"
              >
                <MessageSquareWarning className="w-5 h-5" />
                Help & Support
              </Link>
            </div>

            {/* States Dropdown (Mobile) */}
            <div className="p-4 border-t border-gray-100 dark:border-gray-800">
              <div className="flex items-center justify-between mb-3 px-2">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">States & UTs</p>
              </div>
              <div className="grid grid-cols-2 gap-2 max-h-[300px] overflow-y-auto custom-scrollbar pr-1">
                {/* All India Option - Mobile */}
                <Link
                  href="/"
                  onClick={() => setIsMobileOpen(false)}
                  className="flex items-center gap-2 px-2.5 py-2.5 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 hover:bg-amber-100 dark:hover:bg-amber-900/40 rounded-xl text-xs font-semibold text-gray-800 dark:text-gray-200 transition-colors col-span-2 shadow-sm"
                >
                  <span className="text-[10px] font-extrabold bg-amber-200 dark:bg-amber-800 text-amber-800 dark:text-amber-200 px-1.5 py-0.5 rounded-md shrink-0">INDIA</span>
                  <span className="truncate font-bold">🌍 All India (Central Govt)</span>
                </Link>
                
                {states.map((state) => (
                  <Link
                    key={state.name}
                    href={`/state/${state.name.toLowerCase().replace(/ /g, '-')}`}
                    onClick={() => setIsMobileOpen(false)}
                    className="flex items-center gap-2 px-2.5 py-2.5 bg-gray-50 dark:bg-gray-900 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-xl text-xs font-semibold text-gray-700 dark:text-gray-300 transition-colors"
                  >
                    <span className="text-[10px] font-extrabold bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-indigo-600 dark:text-indigo-400 px-1.5 py-0.5 rounded-md">{state.abbr}</span>
                    <span className="truncate">{state.name}</span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Overlay for dropdown close */}
      {(isStateOpen || isLangOpen) && (
        <div className="fixed inset-0 z-30" onClick={() => { setIsStateOpen(false); setIsLangOpen(false); }} />
      )}
    </>
  );
}
