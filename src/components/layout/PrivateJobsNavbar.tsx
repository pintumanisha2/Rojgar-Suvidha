"use client";

import { useState, useEffect, useRef } from"react";
import Link from"next/link";
import { usePathname, useRouter } from"next/navigation";
import { 
 Menu, 
 X, 
 Briefcase, 
 HelpCircle, 
 Sun, 
 Moon, 
 User, 
 Search, 
 Bookmark, 
 Globe, 
 ChevronDown, 
 Sparkles, 
 MessageCircle, 
 MapPin, 
 ClipboardCheck, 
 UserCircle,
 BookOpen,
 LogOut,
 Bell,
 Shield
} from "lucide-react";
import { useTheme } from"@/components/ThemeProvider";
import { supabase } from"@/lib/supabase";
import Image from"next/image";

const navSections = [
  { name:"Vetted Jobs", href:"/private-jobs", icon: Briefcase, color:"text-blue-500"},
  { name:"My Applications", href:"/private-jobs/dashboard?tab=applications", icon: ClipboardCheck, color:"text-indigo-500"},
  { name:"AI Resume Maker", href:"/private-jobs/resume-builder", icon: Sparkles, color:"text-violet-500"},
  { name:"AI Mock Interview", href:"/private-jobs/dashboard?tab=mock-interview", icon: BookOpen, color:"text-orange-500"},
  { name:"Inbox", href:"/private-jobs/dashboard?tab=messages", icon: MessageCircle, color:"text-emerald-500"},
  { name:"Community", onClick: () => window.dispatchEvent(new Event('openPrivateCommunity')), icon: MessageCircle, color:"text-rose-500"},
 { name:"Helpdesk", href:"/private-jobs/contact-us", icon: HelpCircle, color:"text-sky-500"},
];

const jobCategories = [
 { name:"IT & Software", href:"/private-jobs?category=IT", emoji:"💻", desc:"React, Node, Java, Python"},
 { name:"Marketing & Sales", href:"/private-jobs?category=Marketing", emoji:"📈", desc:"SEO, B2B Sales, Advertising"},
 { name:"Finance & Accounts", href:"/private-jobs?category=Finance", emoji:"🏦", desc:"CA, CS, Banking, Auditing"},
 { name:"HR & Admin", href:"/private-jobs?category=HR", emoji:"👥", desc:"Recruiter, Executive, Admin"},
 { name:"Healthcare & Biotech", href:"/private-jobs?category=Healthcare", emoji:"🩺", desc:"Doctor, Nurse, Pharma"},
 { name:"Engineering & Tech", href:"/private-jobs?category=Engineering", emoji:"🛠️", desc:"Mechanical, Civil, QA"},
 { name:"Design & Creative", href:"/private-jobs?category=Design", emoji:"🎨", desc:"UI/UX, Graphic, Animation"},
 { name:"Customer Care", href:"/private-jobs?category=Support", emoji:"📞", desc:"BPO, Telecaller, Support"},
];

const states = [
 { name:"Andhra Pradesh", abbr:"AP"}, { name:"Arunachal Pradesh", abbr:"AR"},
 { name:"Assam", abbr:"AS"}, { name:"Bihar", abbr:"BR"},
 { name:"Chhattisgarh", abbr:"CG"}, { name:"Goa", abbr:"GA"},
 { name:"Gujarat", abbr:"GJ"}, { name:"Haryana", abbr:"HR"},
 { name:"Himachal Pradesh", abbr:"HP"}, { name:"Jharkhand", abbr:"JH"},
 { name:"Karnataka", abbr:"KA"}, { name:"Kerala", abbr:"KL"},
 { name:"Madhya Pradesh", abbr:"MP"}, { name:"Maharashtra", abbr:"MH"},
 { name:"Manipur", abbr:"MN"}, { name:"Meghalaya", abbr:"ML"},
 { name:"Mizoram", abbr:"MZ"}, { name:"Nagaland", abbr:"NL"},
 { name:"Odisha", abbr:"OR"}, { name:"Punjab", abbr:"PB"},
 { name:"Rajasthan", abbr:"RJ"}, { name:"Sikkim", abbr:"SK"},
 { name:"Tamil Nadu", abbr:"TN"}, { name:"Telangana", abbr:"TS"},
 { name:"Tripura", abbr:"TR"}, { name:"Uttar Pradesh", abbr:"UP"},
 { name:"Uttarakhand", abbr:"UK"}, { name:"West Bengal", abbr:"WB"},
 { name:"Andaman & Nicobar", abbr:"AN"}, { name:"Chandigarh", abbr:"CH"},
 { name:"Delhi", abbr:"DL"}, { name:"Jammu & Kashmir", abbr:"JK"},
 { name:"Ladakh", abbr:"LA"}, { name:"Lakshadweep", abbr:"LD"},
 { name:"Puducherry", abbr:"PY"}
];

const languages = [
 { code:"EN", label:"English"},
 { code:"HI", label:"हिंदी"},
 { code:"BN", label:"বাংলা"},
 { code:"TE", label:"తెలుగు"},
 { code:"MR", label:"मराठी"},
];

export default function PrivateJobsNavbar() {
 const pathname = usePathname();
 const router = useRouter();
 const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
 const [isEmployer, setIsEmployer] = useState(false);
 const [isCandidate, setIsCandidateLoggedIn] = useState(false);
 const [isAuthLoaded, setIsAuthLoaded] = useState(false);
 const [candidateName, setCandidateName] = useState("");
 const [candidateAvatar, setCandidateAvatar] = useState("");
 const [candidateImage, setCandidateImage] = useState("");
 const { theme, setTheme } = useTheme();
 const isDark = theme ==="dark";
 const [currentQuery, setCurrentQuery] = useState("");
 const [isProfileOpen, setIsProfileOpen] = useState(false);
 const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

 const [isStateOpen, setIsStateOpen] = useState(false);
 const [isLangOpen, setIsLangOpen] = useState(false);
 const [isSearchOpen, setIsSearchOpen] = useState(false);
 const [selectedLang, setSelectedLang] = useState(languages[0]);
 const [stateSearchQuery, setStateSearchQuery] = useState("");
 const [searchQuery, setSearchQuery] = useState("");
 const [searchResults, setSearchResults] = useState<{title: string, slug: string}[]>([]);
 const [isSearching, setIsSearching] = useState(false);
 const searchRef = useRef<HTMLInputElement>(null);

 // Sync URL search parameters dynamically
 useEffect(() => {
 const handleUrlChange = () => {
 setCurrentQuery(window.location.search ||"");
 };

 handleUrlChange();
 window.addEventListener("popstate", handleUrlChange);
 window.addEventListener("click", () => {
 setTimeout(handleUrlChange, 50);
 });

 return () => {
 window.removeEventListener("popstate", handleUrlChange);
 window.removeEventListener("click", handleUrlChange);
 };
 }, []);

 const isActive = (itemHref?: string) => {
 if (!itemHref) return false;
 const [itemPath, itemQuery] = itemHref.split("?");
 if (pathname !== itemPath) return false;
 if (itemQuery) {
 return currentQuery.includes(itemQuery);
 }
 return !currentQuery || currentQuery ==="?";
 };

 // Check if active path is in recruiter workspace
 useEffect(() => {
 setIsEmployer(pathname?.startsWith("/employer") || false);
 }, [pathname]);

 // Synchronize and monitor Candidate Auth session
 useEffect(() => {
    const checkCandidateSession = async () => {
      let isLocalActive = false;
      try {
        isLocalActive = localStorage.getItem("rs_candidate_session_active") === "true";
      } catch (e) {}

      // Always try to fetch standard supabase session first
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          setIsCandidateLoggedIn(true);

          const { data: dbProfile } = await supabase
            .from("private_candidate_profiles")
            .select("full_name, avatar_url")
            .eq("id", session.user.id)
            .maybeSingle();
            
          if (dbProfile) {
            setCandidateName(dbProfile.full_name);
            setCandidateAvatar(dbProfile.avatar_url || "");
          } else {
            setCandidateName(session.user.user_metadata?.full_name || session.user.email?.split("@")[0] || "Candidate");
            setCandidateAvatar(session.user.user_metadata?.avatar_url || "");
          }
          setIsAuthLoaded(true);
          return; // Session successfully restored from DB
        }
      } catch (err) {
        console.warn("Silent failure reading supabase session in navbar", err);
      }

      // Check Multi-profile local sandbox fallback
      if (isLocalActive) {
        setIsCandidateLoggedIn(true);
        try {
          const email = localStorage.getItem("rs_candidate_active_email");
          const dbStr = localStorage.getItem("rs_candidate_profiles_db");
          
          if (email && dbStr) {
             const db = JSON.parse(dbStr);
             if (db[email]) {
                setCandidateName(db[email].full_name || db[email].fullName || "Candidate");
                setCandidateAvatar(db[email].avatar_url || "");
                setIsAuthLoaded(true);
                return;
             }
          }

          const localProfileStr = localStorage.getItem("rs_candidate_mock_profile");
          if (localProfileStr) {
            const parsed = JSON.parse(localProfileStr);
            setCandidateName(parsed.full_name || parsed.fullName || "Candidate");
            setCandidateAvatar(parsed.avatar_url || "");
            setIsAuthLoaded(true);
            return;
          }
        } catch (e) {}
        
        setCandidateName("Candidate");
      } else {
        setIsCandidateLoggedIn(false);
        setCandidateName("");
        setCandidateAvatar("");
      }
      setIsAuthLoaded(true);
    };

    checkCandidateSession();

    // Listen to custom event when avatar is updated
    window.addEventListener('profile_picture_updated', checkCandidateSession);

    // Dynamic Auth listener
    const authListener = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setIsCandidateLoggedIn(true);
        const { data: dbProfile } = await supabase
          .from("private_candidate_profiles")
          .select("full_name, avatar_url")
          .eq("id", session.user.id)
          .maybeSingle();
          
        if (dbProfile) {
          setCandidateName(dbProfile.full_name);
          setCandidateAvatar(dbProfile.avatar_url || "");
        } else {
          setCandidateName(session.user.user_metadata?.full_name || session.user.email?.split("@")[0] || "Candidate");
          setCandidateAvatar(session.user.user_metadata?.avatar_url || "");
        }
        setIsAuthLoaded(true);
      } else {
        // ... (Don't clear yet because of sandbox mode fallback)
        setIsAuthLoaded(true);
      }
    });

    return () => {
      if (authListener && typeof (authListener as any).unsubscribe === "function") {
        (authListener as any).unsubscribe();
      } else if (authListener?.data?.subscription && typeof authListener.data.subscription.unsubscribe === "function") {
        authListener.data.subscription.unsubscribe();
      }
      window.removeEventListener('profile_picture_updated', checkCandidateSession);
    };
  }, []);

 // Monitor saved jobs count
 const [savedCount, setSavedCount] = useState(0);
 useEffect(() => {
 const updateSavedCount = () => {
 const savedJobs = JSON.parse(localStorage.getItem("rs_saved_private_jobs") || localStorage.getItem("saved_jobs") ||"[]");
 setSavedCount(savedJobs.length);
 };

 updateSavedCount();
 window.addEventListener('savedJobsUpdated', updateSavedCount);
 return () => window.removeEventListener('savedJobsUpdated', updateSavedCount);
 }, []);

 // Sync search focus
 useEffect(() => {
 if (isSearchOpen && searchRef.current) {
 searchRef.current.focus();
 } else {
 setSearchQuery('');
 setSearchResults([]);
 }
 }, [isSearchOpen]);

 // Private Jobs search suggestion handler
 useEffect(() => {
 const delayDebounceFn = setTimeout(async () => {
 if (searchQuery.trim().length >= 2) {
 setIsSearching(true);
 try {
 const { data } = await supabase
 .from('private_jobs')
 .select('title, slug')
 .ilike('title',`%${searchQuery}%`)
 .limit(6);
 
 setSearchResults(data || []);
 } catch (e) {
 console.warn("Error searching private jobs suggestions:", e);
 }
 setIsSearching(false);
 } else {
 setSearchResults([]);
 }
 }, 300);

 return () => clearTimeout(delayDebounceFn);
 }, [searchQuery]);

 const handleLanguageChange = (lang: { code: string; label: string }) => {
 setSelectedLang(lang);
 setIsLangOpen(false);
 
 const selectElement = document.querySelector(".goog-te-combo") as HTMLSelectElement;
 if (selectElement) {
 const langMap: Record<string, string> = {
"EN":"en","HI":"hi","BN":"bn","TE":"te","MR":"mr"
 };
 selectElement.value = langMap[lang.code] ||"en";
 selectElement.dispatchEvent(new Event("change"));
 }
 };

 let currentStateName ="Select Location";
 const params = new URLSearchParams(currentQuery);
 const locParam = params.get('location');
 if (locParam) {
 const matchedState = states.find(s => s.name.toLowerCase() === locParam.toLowerCase() || s.abbr.toLowerCase() === locParam.toLowerCase());
 if (matchedState) {
 currentStateName = matchedState.name;
 } else {
 currentStateName = locParam;
 }
 }

 return (
 <>
 <header className="sticky top-0 z-50 w-full shadow-md backdrop-blur-md">
 
 {/* === TOP BAR === */}
 <div className="bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-600/95 text-white border-b border-white/10 shadow-[0_4px_30px_rgba(0,0,0,0.1)] backdrop-blur-md">
 <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
 <div className="flex items-center justify-between h-[60px]">
 
 {/* Logo & Brand */}
 <Link href="/private-jobs"className="flex items-center gap-3 shrink-0">
 <div className="shrink-0 flex items-center justify-center mr-1 hover:scale-110 transition-transform duration-300 cursor-pointer">
 <Image 
 src="/rojgar suvidha logo.png"
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
 <span className="text-[10px] text-blue-200 font-medium tracking-widest uppercase mt-0.5">
 Private Sector
 </span>
 </div>
 </Link>

 {/* Right Controls */}
 <div className="flex items-center gap-1 sm:gap-2">
 
 {/* Search Toggle */}
 <button
 onClick={() => setIsSearchOpen(!isSearchOpen)}
 className="p-2 rounded-lg hover:bg-white/10 transition-all text-white/80 hover:text-white"
 aria-label="Search"
 >
 <Search className="w-5 h-5"/>
 </button>

 {/* Saved Jobs Icon */}
 <Link
 href="/private-jobs/dashboard?tab=saved-jobs"
 className="p-2 rounded-lg hover:bg-white/10 transition-all text-white/80 hover:text-white relative"
 aria-label="Saved Jobs"
 >
 <Bookmark className="w-5 h-5"/>
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
 <Globe className="w-4 h-4"/>
 <span className="hidden sm:inline">{selectedLang.code}</span>
 <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isLangOpen ? 'rotate-180' : ''}`} />
 </button>

 {isLangOpen && (
 <div className="absolute right-0 top-full mt-2 w-40 bg-white text-gray-900 rounded-xl shadow-2xl border border-gray-100 overflow-hidden z-50">
 {languages.map((lang) => (
 <button
 key={lang.code}
 onClick={() => handleLanguageChange(lang)}
 className={`w-full flex items-center justify-between px-4 py-2.5 text-sm transition-colors ${selectedLang.code === lang.code ? 'bg-blue-50 text-blue-600 font-semibold' : 'text-gray-700 hover:bg-gray-50 '}`}
 >
 <span>{lang.label}</span>
 <span className="text-xs text-gray-400">{lang.code}</span>
 </button>
 ))}
 </div>
 )}
 </div>


 {/* Employers Workspace / Candidate Dashboard / Signin */}
 {isEmployer ? (
 <Link
 href="/private-jobs"
 className="hidden sm:flex items-center gap-2 ml-1 px-4 py-2 bg-white text-blue-700 hover:bg-yellow-300 hover:text-indigo-800 rounded-xl text-sm font-bold shadow-md transition-all duration-200"
 >
 <Briefcase className="w-4 h-4"/>
 Find Jobs
 </Link>
 ) : isCandidate ? (
 <div className="relative flex items-center gap-2">
 {/* Notification Bell */}
 <div className="relative hidden sm:block">
 <button
 onClick={() => { setIsNotificationsOpen(!isNotificationsOpen); setIsProfileOpen(false); setIsStateOpen(false); setIsLangOpen(false); }}
 className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all relative"
 >
 <Bell className="w-5 h-5" />
 <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
 <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500"></span>
 </button>

 {isNotificationsOpen && (
 <div className="absolute right-0 top-full mt-3 w-80 bg-white text-gray-900 rounded-2xl shadow-2xl border border-gray-200 overflow-hidden z-50 animate-fadeIn">
 <div className="px-4 py-3 border-b border-gray-100 bg-slate-50 flex justify-between items-center">
 <span className="text-xs font-black text-slate-800 uppercase tracking-widest">Notifications</span>
 <span className="text-[10px] font-bold text-white bg-rose-500 px-2 py-0.5 rounded-full shadow-sm">1 New</span>
 </div>
 <div className="divide-y divide-gray-50">
 <Link
 href="/private-jobs/dashboard?tab=profile"
 onClick={() => setIsNotificationsOpen(false)}
 className="flex items-start gap-3 p-4 hover:bg-slate-50 transition-colors group relative overflow-hidden"
 >
 <div className="absolute top-0 right-0 w-16 h-16 bg-rose-500/5 rounded-bl-full -z-10 group-hover:bg-rose-500/10 transition-colors"></div>
 <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0 shadow-sm relative">
 <span className="text-slate-400 font-black text-xs filter blur-[2px]">??</span>
 <div className="absolute -bottom-1 -right-1 bg-rose-500 text-white rounded-full p-0.5 shadow-sm">
 <Shield className="w-3 h-3" />
 </div>
 </div>
 <div>
 <p className="text-sm text-slate-800 font-extrabold leading-tight">
 Someone Viewed Your Profile!
 </p>
 <p className="text-xs text-slate-500 font-medium mt-1 leading-snug">
 An HR Recruiter just checked your resume. <span className="text-blue-600 font-bold">Complete your profile</span> to unlock their name.
 </p>
 </div>
 </Link>
 </div>
 <div className="p-2 border-t border-gray-100 bg-slate-50/50">
 <Link href="/private-jobs/dashboard?tab=profile" className="block w-full text-center py-2 text-xs font-bold text-slate-600 hover:text-blue-600 hover:bg-white rounded-lg transition-colors border border-transparent hover:border-slate-200">
 View all activity
 </Link>
 </div>
 </div>
 )}
 </div>

 <button
 onClick={() => { setIsProfileOpen(!isProfileOpen); setIsNotificationsOpen(false); setIsStateOpen(false); setIsLangOpen(false); }}
 className="hidden sm:flex items-center gap-2 ml-1 px-3 py-1.5 bg-gradient-to-r from-green-400 to-emerald-500 hover:from-green-500 hover:to-emerald-600 text-white rounded-xl text-sm font-bold shadow-md shadow-green-500/20 transition-all duration-200 shrink-0"
 >
 <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center font-bold text-blue-700 shadow-inner overflow-hidden">
                  {candidateAvatar ? (
                    <img src={candidateAvatar} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    candidateName ? candidateName[0] : "C"
                  )}
                </div>
 <span className="truncate max-w-[100px] font-bold">{candidateName ||"Dashboard"}</span>
 <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isProfileOpen ? 'rotate-180' : ''}`} />
 </button>

 {isProfileOpen && (
 <div className="absolute right-0 top-full mt-2 w-56 bg-white text-gray-900 rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50 animate-fadeIn">
 {/* User Header */}
 <div className="px-4 py-3 border-b border-gray-100 bg-slate-50/50">
 <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Logged In As</p>
 <p className="text-xs font-black text-slate-800 truncate mt-0.5">{candidateName ||"Candidate"}</p>
 </div>
 
 <div className="p-2 space-y-0.5">
 <Link
 href="/private-jobs/dashboard?tab=profile"
 onClick={() => setIsProfileOpen(false)}
 className="flex items-center gap-2.5 w-full px-3.5 py-2.5 text-xs font-bold text-slate-700 hover:bg-blue-50 hover:text-blue-600 rounded-xl transition-all"
 >
 <User className="w-3.5 h-3.5 opacity-80"/>
 My Resume Profile
 </Link>

 <Link
 href="/private-jobs/dashboard?tab=applications"
 onClick={() => setIsProfileOpen(false)}
 className="flex items-center gap-2.5 w-full px-3.5 py-2.5 text-xs font-bold text-slate-700 hover:bg-blue-50 hover:text-blue-600 rounded-xl transition-all"
 >
 <ClipboardCheck className="w-3.5 h-3.5 opacity-80"/>
 My Applications
 </Link>

 <Link
 href="/private-jobs/dashboard?tab=messages"
 onClick={() => setIsProfileOpen(false)}
 className="flex items-center gap-2.5 w-full px-3.5 py-2.5 text-xs font-bold text-slate-700 hover:bg-blue-50 hover:text-blue-600 rounded-xl transition-all"
 >
 <MessageCircle className="w-3.5 h-3.5 opacity-80"/>
 Recruiter Chats
 </Link>

 <Link
 href="/private-jobs/dashboard?tab=ats-optimizer"
 onClick={() => setIsProfileOpen(false)}
 className="flex items-center gap-2.5 w-full px-3.5 py-2.5 text-xs font-bold text-slate-700 hover:bg-blue-50 hover:text-blue-600 rounded-xl transition-all"
 >
 <Sparkles className="w-3.5 h-3.5 opacity-80 text-violet-500 animate-pulse"/>
 ATS Optimizer
 </Link>

 <div className="h-px bg-gray-100 my-1"></div>

 <button
 onClick={async () => {
 setIsProfileOpen(false);
 await supabase.auth.signOut();
 localStorage.removeItem("rs_candidate_mock_profile");
 localStorage.removeItem("rs_candidate_mock_session");
 localStorage.removeItem("rs_candidate_session_active");
 localStorage.removeItem("rs_candidate_active_email");
 window.location.reload();
 router.push("/private-jobs");
 }}
 className="flex items-center gap-2.5 w-full px-3.5 py-2.5 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-xl transition-all text-left"
 >
 <LogOut className="w-3.5 h-3.5 opacity-85"/>
 Logout Session
 </button>
 </div>
 </div>
 )}
 </div>
 ) : !isAuthLoaded ? (
    <div className="hidden sm:flex items-center gap-2 animate-pulse">
      <div className="w-20 h-9 bg-white/20 rounded-xl" />
      <div className="w-28 h-9 bg-white/20 rounded-xl" />
    </div>
  ) : (
 <div className="hidden sm:flex items-center gap-2">
 <Link
 href="/private-jobs/login"
 className="flex items-center gap-2 ml-1 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-sm font-bold transition-all duration-200 border border-white/10"
 >
 <UserCircle className="w-4 h-4"/>
 Login
 </Link>
 <Link
 href="/private-jobs/resume-builder"
 className="flex items-center gap-2 ml-1 px-4 py-2 bg-white text-blue-700 hover:bg-yellow-300 hover:text-indigo-800 rounded-xl text-sm font-bold shadow-md transition-all duration-200"
 >
 <Sparkles className="w-4 h-4"/>
 AI Resume
 </Link>
 </div>
 )}

 {/* Mobile hamburger menu */}
 <button
 className="ml-1 p-2 rounded-lg hover:bg-white/10 transition-all text-white sm:hidden"
 onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
 aria-label="Toggle mobile menu"
 >
 {mobileMenuOpen ? <X className="w-5 h-5"/> : <Menu className="w-5 h-5"/>}
 </button>
 </div>

 </div>
 </div>
 </div>

 {/* Expandable Search Input panel */}
 <div className={`overflow-visible transition-all duration-300 bg-blue-800/95 backdrop-blur-md ${isSearchOpen ? 'py-3' : 'h-0 py-0 opacity-0 pointer-events-none'}`}>
 <div className="max-w-2xl mx-auto px-4 relative">
 <div className="relative">
 <Search className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 ${isSearching ? 'text-yellow-400 animate-pulse' : 'text-blue-300'}`} />
 <input
 ref={searchRef}
 type="text"
 value={searchQuery}
 onChange={(e) => setSearchQuery(e.target.value)}
 onKeyDown={(e) => {
 if (e.key === 'Enter' && searchQuery.trim() && searchResults.length > 0) {
 setIsSearchOpen(false);
 router.push(`/private-jobs/${searchResults[0].slug}`);
 setSearchQuery('');
 }
 }}
 placeholder="Search private vetted jobs, positions, domains..."
 className="w-full bg-white/10 border border-white/20 text-white placeholder-blue-200 rounded-xl pl-11 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400/60 focus:bg-white/15 transition-all"
 />
 </div>

 {/* suggestions */}
 {searchQuery.trim().length >= 2 && (
 <div className="absolute top-full left-4 right-4 mt-2 bg-white text-gray-900 rounded-xl shadow-2xl border border-slate-100 overflow-hidden z-50">
 {isSearching ? (
 <div className="p-4 text-center text-sm text-slate-500">Searching...</div>
 ) : searchResults.length > 0 ? (
 <ul className="divide-y divide-slate-100">
 {searchResults.map((job) => (
 <li key={job.slug}>
 <Link 
 href={`/private-jobs/${job.slug}`}
 onClick={() => setIsSearchOpen(false)}
 className="flex items-center gap-3 px-4 py-3 hover:bg-blue-50 transition-colors group"
 >
 <Search className="w-4 h-4 text-slate-400 group-hover:text-blue-500 shrink-0"/>
 <span className="text-sm font-semibold text-slate-700 group-hover:text-blue-700 line-clamp-1">{job.title}</span>
 </Link>
 </li>
 ))}
 </ul>
 ) : (
 <div className="p-4 text-center text-sm text-slate-500">No matching private jobs found for"{searchQuery}"</div>
 )}
 </div>
 )}
 </div>
 </div>

 {/* === BOTTOM NAVIGATION BAR === */}
 <div className="hidden lg:block bg-white/80 backdrop-blur-md border-b border-gray-200 shadow-sm">
 <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
 <div className="flex items-center justify-between">
 
 {/* Desktop links */}
 <nav className="flex items-center"aria-label="Main navigation">
 {navSections.map((section) => {
 const Icon = section.icon;
 return section.href ? (
 <Link
 key={section.name}
 href={section.href}
 className={`group flex items-center gap-1.5 px-3 py-3.5 text-[11px] lg:text-[12px] font-bold transition-all relative whitespace-nowrap ${
 isActive(section.href)
 ?"text-blue-600 font-extrabold"
 :"text-slate-600 hover:text-blue-600"
 }`}
 >
 <Icon className={`w-3.5 h-3.5 ${section.color} opacity-80 group-hover:opacity-100 transition-opacity shrink-0`} />
 {section.name}
 <span className={`absolute bottom-0 left-1/2 -translate-x-1/2 h-0.5 bg-blue-500 rounded-full transition-all duration-300 ${
 isActive(section.href) ?"w-3/4":"w-0 group-hover:w-3/4"
 }`}></span>
 </Link>
 ) : (
 <button
 key={section.name}
 onClick={section.onClick}
 className="group flex items-center gap-1.5 px-3 py-3.5 text-[11px] lg:text-[12px] font-bold text-slate-600 hover:text-blue-600 transition-all relative whitespace-nowrap"
 >
 <Icon className={`w-3.5 h-3.5 ${section.color} opacity-80 group-hover:opacity-100 transition-opacity shrink-0`} />
 {section.name}
 <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0.5 bg-blue-500 group-hover:w-3/4 transition-all duration-300 rounded-full"></span>
 </button>
 );
 })}

 {/* Hover categories dropdown */}
 <div className="relative group">
 <button
 className="flex items-center gap-1 px-3 py-3.5 text-[11px] lg:text-[12px] font-bold text-slate-600 hover:text-blue-600 transition-all relative whitespace-nowrap"
 aria-label="Jobs by Category"
 >
 <Briefcase className="w-3.5 h-3.5 text-blue-500 opacity-80 group-hover:opacity-100 transition-opacity"/>
 By Role
 <ChevronDown className="w-3 h-3 opacity-60 group-hover:opacity-100 group-hover:rotate-180 transition-all duration-200"/>
 <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0.5 bg-blue-500 group-hover:w-3/4 transition-all duration-300 rounded-full"></span>
 </button>

 <div className="absolute left-0 top-full mt-0 w-64 bg-white text-gray-900 rounded-2xl shadow-2xl border border-slate-100 z-50 overflow-hidden opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 translate-y-1 group-hover:translate-y-0">
 <div className="p-3 bg-blue-50 border-b border-blue-100">
 <p className="text-xs font-bold text-blue-600 uppercase tracking-wider">Jobs by Category</p>
 </div>
 <div className="p-2">
 {jobCategories.map((cat) => (
 <Link
 key={cat.href}
 href={cat.href}
 className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-blue-50 transition-colors group/item"
 >
 <span className="text-xl shrink-0">{cat.emoji}</span>
 <div>
 <p className="text-sm font-bold text-slate-800 group-hover/item:text-blue-600 transition-colors">{cat.name}</p>
 <p className="text-[11px] text-slate-400">{cat.desc}</p>
 </div>
 </Link>
 ))}
 </div>
 </div>
 </div>
 </nav>

 {/* Location selection dropdown */}
 <div className="relative">
 <button
 onClick={() => setIsStateOpen(!isStateOpen)}
 className="flex items-center gap-2 px-4 py-2 my-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl text-sm font-bold transition-all border border-blue-100"
 >
 <MapPin className="w-4 h-4"/>
 <span className="truncate max-w-[120px]">{currentStateName}</span>
 <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isStateOpen ? 'rotate-180' : ''}`} />
 </button>

 {isStateOpen && (
 <div className="absolute right-0 top-full mt-2 w-72 bg-white text-gray-900 rounded-2xl shadow-2xl border border-slate-100 z-50 overflow-hidden flex flex-col">
 <div className="p-3 bg-blue-50 border-b border-blue-100">
 <div className="flex items-center gap-2 mb-2">
 <MapPin className="w-4 h-4 text-blue-500"/>
 <p className="text-xs font-bold text-blue-600 uppercase tracking-wider">Browse by Location</p>
 </div>
 <div className="relative">
 <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-blue-300"/>
 <input 
 type="text"
 placeholder="Find your state..."
 value={stateSearchQuery}
 onChange={(e) => setStateSearchQuery(e.target.value)}
 className="w-full bg-white border border-blue-100 rounded-lg pl-8 pr-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-slate-900"
 />
 </div>
 </div>
 
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 p-2 max-h-[320px] overflow-y-auto custom-scrollbar">
 <Link
 href="/private-jobs"
 onClick={() => { setIsStateOpen(false); setStateSearchQuery(''); }}
 className="flex items-center justify-between px-3 py-2.5 mb-1 rounded-xl text-[13px] text-slate-800 bg-amber-50 hover:bg-amber-100 hover:text-amber-800 transition-all group col-span-1 sm:col-span-2 border border-amber-200 shadow-sm"
 >
 <span className="font-extrabold truncate mr-2">🌍 All Locations</span>
 <span className="text-[10px] bg-amber-200 text-amber-800 px-1.5 py-0.5 rounded-md font-extrabold transition-colors shrink-0">ALL</span>
 </Link>
 
 {states
 .filter(s => s.name.toLowerCase().includes(stateSearchQuery.toLowerCase()) || s.abbr.toLowerCase().includes(stateSearchQuery.toLowerCase()))
 .map((state) => (
 <Link
 key={state.name}
 href={`/private-jobs?location=${state.name}`}
 onClick={() => { setIsStateOpen(false); setStateSearchQuery(''); }}
 className="flex items-center justify-between px-3 py-2 rounded-xl text-[13px] text-slate-700 hover:bg-blue-50 hover:text-blue-600 transition-all group"
 >
 <span className="font-semibold truncate mr-2">{state.name}</span>
 <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-md font-extrabold group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors shrink-0">{state.abbr}</span>
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

 {/* === MOBILE MENU DRAWER === */}
 {mobileMenuOpen && (
 <div className="fixed inset-0 z-40 sm:hidden">
 <div className="absolute inset-0 bg-black/50 backdrop-blur-sm"onClick={() => setMobileMenuOpen(false)}></div>
 <div className="absolute top-[60px] left-0 right-0 bg-white text-gray-900 shadow-2xl max-h-[calc(100vh-60px)] overflow-y-auto z-50">
 
 {/* Quick Action options */}
 <div className="p-4">
 <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 px-2">Quick Navigation</p>
 <div className="grid grid-cols-3 gap-2">
 {navSections.map((section) => {
 const Icon = section.icon;
 return section.href ? (
 <Link
 key={section.name}
 href={section.href}
 onClick={() => setMobileMenuOpen(false)}
 className="flex flex-col items-center gap-2 p-3 bg-slate-50 rounded-xl hover:bg-blue-50 transition-colors"
 >
 <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
 <Icon className={`w-5 h-5 ${section.color}`} />
 </div>
 <span className="text-[11px] font-semibold text-slate-700 text-center leading-tight">{section.name}</span>
 </Link>
 ) : (
 <button
 key={section.name}
 onClick={() => {
 if (section.onClick) section.onClick();
 setMobileMenuOpen(false);
 }}
 className="flex flex-col items-center gap-2 p-3 bg-slate-50 rounded-xl hover:bg-blue-50 transition-colors text-left"
 >
 <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm mx-auto">
 <Icon className={`w-5 h-5 ${section.color}`} />
 </div>
 <span className="text-[11px] font-semibold text-slate-700 text-center leading-tight mx-auto">{section.name}</span>
 </button>
 );
 })}
 </div>
 </div>

 {/* Jobs by Category Roles - Mobile */}
 <div className="px-4 pb-2">
 <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 px-2">Browse Jobs by Role</p>
 <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
 {jobCategories.map((cat) => (
 <Link
 key={cat.href}
 href={cat.href}
 onClick={() => setMobileMenuOpen(false)}
 className="flex flex-col items-center justify-center gap-1.5 p-3 bg-slate-50 rounded-xl hover:bg-blue-50 transition-colors"
 >
 <span className="text-2xl mb-1">{cat.emoji}</span>
 <span className="text-[10px] font-extrabold text-slate-700 text-center leading-tight">{cat.name}</span>
 </Link>
 ))}
 </div>
 </div>

 {/* Accounts Login / Register action items */}
 <div className="px-4 pb-4 space-y-3 pt-2">
 {isEmployer ? (
 <Link
 href="/private-jobs"
 onClick={() => setMobileMenuOpen(false)}
 className="flex items-center justify-center gap-2.5 w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold shadow-lg"
 >
 <Briefcase className="w-5 h-5"/>
 Find Vetted Jobs
 </Link>
 ) : isCandidate ? (
 <div className="space-y-2.5 w-full">
 <Link
 href="/private-jobs/dashboard"
 onClick={() => setMobileMenuOpen(false)}
 className="flex items-center justify-center gap-2.5 w-full py-3.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-bold shadow-lg"
 >
 <div className="w-7 h-7 rounded-full bg-white text-emerald-650 flex items-center justify-center text-xs font-black uppercase shrink-0 overflow-hidden border border-white/50">
 {candidateAvatar ? (
 <img src={candidateAvatar} alt="Profile" className="w-full h-full object-cover"/>
 ) : (
 candidateName ? candidateName[0] :"C"
 )}
 </div>
 Candidate Dashboard
 </Link>
 <button
 onClick={async () => {
 setMobileMenuOpen(false);
 await supabase.auth.signOut();
 localStorage.removeItem("rs_candidate_mock_profile");
 localStorage.removeItem("rs_candidate_mock_session");
 localStorage.removeItem("rs_candidate_session_active");
 localStorage.removeItem("rs_candidate_active_email");
 window.location.reload();
 router.push("/private-jobs");
 }}
 className="flex items-center justify-center gap-2 w-full py-3 bg-rose-50 text-rose-600 rounded-xl font-bold border border-rose-100"
 >
 <LogOut className="w-4 h-4"/>
 Logout Account
 </button>
 </div>
 ) : (
 <div className="space-y-2.5 w-full">
 <Link
 href="/private-jobs/login"
 onClick={() => setMobileMenuOpen(false)}
 className="flex items-center justify-center gap-2 w-full py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold shadow-lg"
 >
 <UserCircle className="w-5 h-5"/>
 Candidate Login
 </Link>
 
 <Link
 href="/private-jobs/resume-builder"
 onClick={() => setMobileMenuOpen(false)}
 className="flex items-center justify-center gap-2 w-full py-3 bg-slate-100 text-slate-700 rounded-xl font-bold border border-slate-200"
 >
 <Sparkles className="w-4 h-4 text-violet-500"/>
 Build AI Resume
 </Link>
 </div>
 )}
 </div>

 {/* States Selector grid - Mobile */}
 <div className="p-4 border-t border-slate-100">
 <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 px-2">Job Locations</p>
 <div className="grid grid-cols-2 gap-2 max-h-[250px] overflow-y-auto custom-scrollbar pr-1">
 <Link
 href="/private-jobs"
 onClick={() => setMobileMenuOpen(false)}
 className="flex items-center gap-2 px-2.5 py-2.5 bg-amber-50 border border-amber-200 hover:bg-amber-100 rounded-xl text-xs font-semibold text-slate-850 transition-colors col-span-2 shadow-sm"
 >
 <span className="text-[10px] font-extrabold bg-amber-200 text-amber-800 px-1.5 py-0.5 rounded-md shrink-0">ALL</span>
 <span className="truncate font-bold">🌍 All Private Job Locations</span>
 </Link>

 {states.map((state) => (
 <Link
 key={state.name}
 href={`/private-jobs?location=${state.name}`}
 onClick={() => setMobileMenuOpen(false)}
 className="flex items-center gap-2 px-2.5 py-2.5 bg-slate-50 hover:bg-blue-50 rounded-xl text-xs font-semibold text-slate-750 transition-colors"
 >
 <span className="text-[10px] font-extrabold bg-white border border-slate-200 text-blue-600 px-1.5 py-0.5 rounded-md shrink-0">{state.abbr}</span>
 <span className="truncate">{state.name}</span>
 </Link>
 ))}
 </div>
 </div>

 </div>
 </div>
 )}

 {/* Overlay dropdown support */}
 {(isStateOpen || isLangOpen || isProfileOpen || isNotificationsOpen) && (
 <div className="fixed inset-0 z-30" onClick={() => { setIsStateOpen(false); setIsLangOpen(false); setIsProfileOpen(false); setIsNotificationsOpen(false); }} />
 )}
 </>
 );
}
