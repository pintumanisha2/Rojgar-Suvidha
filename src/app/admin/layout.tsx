"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import {
  LayoutDashboard, FileText, Users, CreditCard, BookOpen, Briefcase,
  Image as ImageIcon, BarChart2, Ticket, MessageSquareWarning,
  ChevronRight, LogOut, Bell, Menu, X, ShieldCheck, Zap, Loader2, Sparkles, Activity, Radar, Inbox
} from "lucide-react";

const navItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/applications", label: "User Applications", icon: FileText },
  { href: "/admin/users", label: "Admin Users", icon: Users },
  { href: "/admin/payments", label: "Payments", icon: CreditCard },
  { href: "/admin/jobs", label: "Govt Jobs (Sarkari)", icon: BookOpen },
  { href: "/admin/ai-writer", label: "AI Super Writer", icon: Sparkles },
  { href: "/admin/banners", label: "Banner", icon: ImageIcon },
  { href: "/admin/community", label: "Community Chat", icon: Users },
  { href: "/admin/notifications", label: "Notifications", icon: Bell },
  { href: "/admin/job-scout", label: "Job Scout (Auto Tracker)", icon: Bell },
  { href: "/admin/direct-form", label: "Direct Form", icon: BarChart2 },
  { href: "/admin/coupons", label: "Coupon", icon: Ticket },
  { href: "/admin/ticker", label: "Live Ticker", icon: Zap },
  { href: "/admin/complaints", label: "Complaints", icon: MessageSquareWarning },
  { href: "/admin/analytics", label: "Deep Analytics", icon: Activity },
  { href: "/admin/study", label: "Study Room Moderation", icon: ShieldCheck },
  // Private Portal Items
  { href: "/admin/private-portal", label: "Platform Overview", icon: LayoutDashboard, exact: true },
  { href: "/admin/private-portal/employers", label: "HR Approvals", icon: Users },
  { href: "/admin/private-portal/jobs", label: "Private Jobs Moderation", icon: Briefcase },
  { href: "/admin/private-portal/candidates", label: "Candidate Directory", icon: FileText },
  { href: "/admin/private-portal/job-scout", label: "Private Job Scout", icon: Radar },
  { href: "/admin/private-portal/applications", label: "Application Tracker", icon: Inbox },
];

const navSections = [
  {
    title: "🏛️ SARKARI SERVICES",
    items: [
      { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
      { href: "/admin/applications", label: "User Applications", icon: FileText },
      { href: "/admin/jobs?type=sarkari", label: "Govt Jobs (Sarkari)", icon: BookOpen },
      { href: "/admin/ai-writer", label: "AI Super Writer", icon: Sparkles },
      { href: "/admin/job-scout", label: "Job Scout (Auto Tracker)", icon: Bell },
    ]
  },
  {
    title: "⚙️ GENERAL SETTINGS",
    items: [
      { href: "/admin/users", label: "Admin Users", icon: Users },
      { href: "/admin/payments", label: "Payments", icon: CreditCard },
      { href: "/admin/banners", label: "Banner", icon: ImageIcon },
      { href: "/admin/community", label: "Community Chat", icon: Users },
      { href: "/admin/notifications", label: "Notifications", icon: Bell },
      { href: "/admin/direct-form", label: "Direct Form", icon: BarChart2 },
      { href: "/admin/coupons", label: "Coupon", icon: Ticket },
      { href: "/admin/ticker", label: "Live Ticker", icon: Zap },
      { href: "/admin/complaints", label: "Complaints", icon: MessageSquareWarning },
      { href: "/admin/analytics", label: "Deep Analytics", icon: Activity },
      { href: "/admin/study", label: "Study Rooms", icon: ShieldCheck },
    ]
  }
];

const privateNavSections = [
  {
    title: "🏢 PRIVATE PORTAL",
    items: [
      { href: "/admin/private-portal", label: "Platform Overview", icon: LayoutDashboard, exact: true },
      { href: "/admin/private-portal/employers", label: "HR Approvals", icon: Users },
      { href: "/admin/private-portal/jobs", label: "Private Jobs Moderation", icon: Briefcase },
      { href: "/admin/private-portal/candidates", label: "Candidate Directory", icon: FileText },
      { href: "/admin/private-portal/job-scout", label: "Private Job Scout", icon: Radar },
      { href: "/admin/private-portal/applications", label: "Application Tracker 🔴", icon: Inbox },
      { href: "/admin/private-portal/community", label: "Private Community Chat", icon: Users },
    ]
  },
  {
    title: "⚙️ GENERAL SETTINGS",
    items: [
      { href: "/admin/users", label: "Admin Users", icon: Users },
      { href: "/admin/analytics", label: "Deep Analytics", icon: Activity },
    ]
  }
];

export type Role = "super_admin" | "admin" | "govt_manager" | "govt_data_entry" | "private_manager" | "private_data_entry" | "content_writer" | "form_filler" | "unauthorized";

// Function to fetch role from Supabase 'admin_roles' table
const getRoleFromEmail = async (email: string | null): Promise<Role> => {
  if (!email) return "unauthorized";
  
  try {
    const { data, error } = await supabase
      .from('admin_roles')
      .select('role, status')
      .eq('email', email)
      .single();
    
    if (!error && data?.role) {
      if (data.status === 'Inactive') return "unauthorized";
      return data.role as Role;
    }
  } catch (err) {
    // Silent fail — use fallback
  }
  
  // Hardcoded fallback for the primary owner just in case table fails
  if (email === "admin@rojgarsuvidha.com" || email === "superadmin@rojgarsuvidha.com") {
    return "super_admin";
  }
  
  return "unauthorized";
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [adminEmail, setAdminEmail] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<Role>("unauthorized");
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState<Date | null>(null);
  const lastActivityRef = useRef(typeof window !== "undefined" ? Date.now() : 0);
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [countdownSeconds, setCountdownSeconds] = useState(60);

  // Fix 1.3 — Live Clock
  useEffect(() => {
    setCurrentTime(new Date());
    const tick = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(tick);
  }, []);

  // Check authentication and fetch role ONCE on mount
  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!mounted) return;
        
        if (session) {
          const email = session.user.email ?? null;
          setAdminEmail(email);
          const fetchedRole = await getRoleFromEmail(email);
          if (!mounted) return;
          setUserRole(fetchedRole);
        } else {
          setAdminEmail(null);
          setUserRole("unauthorized");
        }
      } catch (err) {
        // Silent fail
      } finally {
        if (mounted) setIsAuthLoading(false);
      }
    };

    initAuth();

    const authListener = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;
      
      // Skip the initial callback as it is already handled reliably by getSession()
      if (event === "INITIAL_SESSION") return;

      if (session) {
        const email = session.user.email ?? null;
        setAdminEmail(email);
        const fetchedRole = await getRoleFromEmail(email);
        if (!mounted) return;
        setUserRole(fetchedRole);
      } else {
        setAdminEmail(null);
        setUserRole("unauthorized");
      }
      if (mounted) setIsAuthLoading(false);
    });

    const unsubscribe = () => {
      if (authListener && typeof (authListener as any).unsubscribe === "function") {
        (authListener as any).unsubscribe();
      } else if (authListener?.data?.subscription && typeof authListener.data.subscription.unsubscribe === "function") {
        authListener.data.subscription.unsubscribe();
      }
    };

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []); // Run ONLY once on mount to prevent infinite DB querying during page navigation!

  // Instant client-side redirect protection
  useEffect(() => {
    if (isAuthLoading) return;

    if (!adminEmail) {
      if (pathname !== "/admin/login") {
        window.location.href = "/admin/login";
      }
    } else {
      if (pathname === "/admin/login") {
        window.location.href = "/admin";
      }
    }
  }, [pathname, adminEmail, isAuthLoading]);

  // --- Auto Logout for Inactivity (10 minutes) ---
  useEffect(() => {
    // Only run this if we are authenticated and NOT on the login page
    if (pathname === "/admin/login" || !adminEmail) return;

    const INACTIVITY_LIMIT = 10 * 60 * 1000; // 10 minutes
    const WARNING_THRESHOLD = 9 * 60 * 1000; // 9 minutes

    const interval = setInterval(async () => {
      const elapsed = Date.now() - lastActivityRef.current;
      if (elapsed >= INACTIVITY_LIMIT) {
        clearInterval(interval);
        await supabase.auth.signOut();
        window.location.href = "/admin/login";
      } else if (elapsed >= WARNING_THRESHOLD) {
        setShowWarningModal(true);
        const secondsLeft = Math.ceil((INACTIVITY_LIMIT - elapsed) / 1000);
        setCountdownSeconds(secondsLeft);
      } else {
        setShowWarningModal(false);
      }
    }, 1000);

    const resetTimer = () => {
      lastActivityRef.current = Date.now();
    };

    // Attach event listeners for activity
    const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];
    events.forEach(event => document.addEventListener(event, resetTimer));

    // Initialize timer reference
    lastActivityRef.current = Date.now();

    return () => {
      clearInterval(interval);
      events.forEach(event => document.removeEventListener(event, resetTimer));
    };
  }, [pathname, adminEmail]);

  // --- Disable DevTools / Right Click for Lower Roles ---
  useEffect(() => {
    // Only apply restrictions if they are logged in and NOT super_admin or admin
    if (!userRole || userRole === "unauthorized" || userRole === "super_admin" || userRole === "admin") return;

    const preventDefault = (e: Event) => e.preventDefault();
    
    const preventShortcuts = (e: KeyboardEvent) => {
      // F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+U
      if (
        e.key === "F12" ||
        (e.ctrlKey && e.shiftKey && (e.key === "I" || e.key === "i" || e.key === "J" || e.key === "j")) ||
        (e.ctrlKey && (e.key === "U" || e.key === "u")) ||
        (e.metaKey && e.altKey && (e.key === "I" || e.key === "i")) // Mac equivalent
      ) {
        e.preventDefault();
      }
    };

    document.addEventListener("contextmenu", preventDefault);
    document.addEventListener("keydown", preventShortcuts);

    return () => {
      document.removeEventListener("contextmenu", preventDefault);
      document.removeEventListener("keydown", preventShortcuts);
    };
  }, [userRole]);

  // Don't show sidebar on login page
  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  // Prevent flashing of admin content while checking auth
  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-950 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  // If unauthenticated, keep showing loader while redirecting
  if (!adminEmail) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-950 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  // Determine which nav items this role can see
  const getAllowedNavItems = () => {
    if (userRole === "super_admin") return navItems;
    if (userRole === "admin") return navItems.filter(item => item.href !== "/admin/payments");
    
    // Govt Roles
    if (userRole === "govt_manager") return navItems.filter(item => ["/admin", "/admin/applications", "/admin/jobs", "/admin/ai-writer", "/admin/banners", "/admin/community", "/admin/notifications", "/admin/job-scout", "/admin/direct-form", "/admin/coupons", "/admin/ticker", "/admin/complaints"].includes(item.href) || (item.href.startsWith("/admin/jobs") && !item.href.includes("private")));
    if (userRole === "govt_data_entry") return navItems.filter(item => ["/admin", "/admin/jobs", "/admin/applications", "/admin/ai-writer", "/admin/job-scout"].includes(item.href) || (item.href.startsWith("/admin/jobs") && !item.href.includes("private")));
    
    // Private Roles
    if (userRole === "private_manager") return navItems.filter(item => ["/admin/private-portal", "/admin/private-portal/employers", "/admin/private-portal/jobs", "/admin/private-portal/candidates", "/admin/private-portal/job-scout", "/admin/private-portal/applications", "/admin/private-portal/community"].includes(item.href));
    if (userRole === "private_data_entry") return navItems.filter(item => ["/admin/private-portal", "/admin/private-portal/jobs", "/admin/private-portal/job-scout"].includes(item.href));
    
    return [];
  };

  const allowedNavItems = getAllowedNavItems();

  // Route Protection: Redirect if user tries to access a restricted URL manually
  const isAllowedPath = allowedNavItems.some(item => {
    const basePath = item.href.split("?")[0];
    return pathname === basePath || (basePath !== "/admin" && pathname.startsWith(basePath));
  });
  
  if (userRole === "unauthorized") {
    if (typeof window !== "undefined") {
      window.location.href = "/";
    }
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-950 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-red-500" />
      </div>
    );
  }

  if (!isAllowedPath && pathname !== "/admin") {
    return (
      <div className="flex h-screen bg-gray-50 dark:bg-zinc-950 text-gray-900 dark:text-gray-100 overflow-hidden font-sans transition-colors duration-200">
        <head>
          <meta name="robots" content="noindex, nofollow" />
        </head>
        <div className="flex-1 flex flex-col items-center justify-center">
          <ShieldCheck className="h-16 w-16 text-red-500 mb-4" />
          <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-2">Access Denied</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-6">Your current role ({userRole}) does not have permission to view this page.</p>
          <Link href="/admin" className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold">Go to Dashboard</Link>
        </div>
      </div>
    );
  }

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/admin/login");
  };

  const isActive = (item: { href: string; exact?: boolean }) => {
    const [pathPart, queryPart] = item.href.split("?");
    const pathMatches = item.exact ? pathname === pathPart : pathname.startsWith(pathPart);
    if (!pathMatches) return false;
    
    if (queryPart) {
      if (typeof window !== "undefined") {
        const searchParams = new URLSearchParams(window.location.search);
        const [key, value] = queryPart.split("=");
        return searchParams.get(key) === value;
      }
      return false;
    }
    
    if (pathPart === "/admin/jobs") {
      if (typeof window !== "undefined") {
        const searchParams = new URLSearchParams(window.location.search);
        const type = searchParams.get("type");
        return !type || type === "sarkari";
      }
      return true;
    }
    
    return true;
  };

  const isPrivateMode = pathname.startsWith("/admin/private-portal");

  const getAllowedNavSections = () => {
    const activeSections = isPrivateMode ? privateNavSections : navSections;
    return activeSections.map(section => {
      const allowedItems = section.items.filter(item => {
        const basePath = item.href.split("?")[0];
        return allowedNavItems.some(allowed => {
          return allowed.href === item.href || allowed.href === basePath;
        });
      });
      return { ...section, items: allowedItems };
    }).filter(section => section.items.length > 0);
  };

  const allowedNavSections = getAllowedNavSections();

  return (
    <div className="h-screen w-full bg-gray-100 dark:bg-[#000000] flex overflow-hidden">
      <head>
        <meta name="robots" content="noindex, nofollow" />
      </head>
      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed top-0 left-0 h-full w-64 bg-white dark:bg-zinc-950 border-r border-gray-200 dark:border-zinc-900 z-30 flex flex-col transform transition-transform duration-300 ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:relative lg:translate-x-0`}>
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-gray-200 dark:border-zinc-900 shrink-0">
          <div className="bg-white rounded-xl p-1 shrink-0 shadow-sm border border-gray-200">
            <Image src="/logo-blue.png" alt="Rojgar Suvidha Logo" width={32} height={32} className="object-contain" priority />
          </div>
          <div>
            <span className="font-extrabold text-lg text-gray-900 dark:text-white tracking-tight leading-none block">Rojgar Suvidha</span>
            <p className="text-[10px] text-gray-500 dark:text-gray-400 leading-tight mt-0.5 font-bold uppercase tracking-widest">Admin Portal</p>
          </div>
          <button
            className="ml-auto lg:hidden text-gray-400 hover:text-gray-900 dark:hover:text-white"
            onClick={() => setIsSidebarOpen(false)}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Global Admin Mode Toggle (Sarkari vs Private) — Animated Pill */}
        {(userRole === "super_admin" || userRole === "admin") && (
          <div className="px-4 pt-4 shrink-0">
            <div className="relative bg-gray-100 dark:bg-zinc-900 p-1 rounded-2xl flex items-center border border-gray-200 dark:border-zinc-800">
              {/* Sliding active pill */}
              <div
                className={`absolute top-1 bottom-1 w-[calc(50%-4px)] bg-white dark:bg-zinc-700 rounded-xl shadow-sm transition-transform duration-300 ease-in-out ${
                  isPrivateMode ? "translate-x-[calc(100%+8px)]" : "translate-x-0"
                }`}
              />
              <button
                onClick={() => router.push("/admin")}
                className={`relative z-10 flex-1 py-2 text-xs font-bold rounded-xl transition-colors ${
                  !isPrivateMode ? "text-gray-900 dark:text-white" : "text-gray-500 dark:text-zinc-500"
                }`}
              >
                🏛️ Sarkari
              </button>
              <button
                onClick={() => router.push("/admin/private-portal")}
                className={`relative z-10 flex-1 py-2 text-xs font-bold rounded-xl transition-colors ${
                  isPrivateMode ? "text-blue-600 dark:text-blue-400" : "text-gray-500 dark:text-zinc-500"
                }`}
              >
                💼 Private
              </button>
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-4">
          {allowedNavSections.map((section) => (
            <div key={section.title} className="space-y-1.5">
              <span className="block text-[9px] font-black text-gray-400 dark:text-zinc-600 uppercase tracking-widest px-3 mb-1">
                {section.title}
              </span>
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setIsSidebarOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all group ${
                        active
                          ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/30 border border-indigo-500/50 ring-1 ring-indigo-400/20"
                          : "text-gray-600 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-900 hover:text-gray-900 dark:hover:text-white"
                      }`}
                    >
                      <Icon className="h-5 w-5 shrink-0" />
                      {item.label}
                      {active && <ChevronRight className="h-4 w-4 ml-auto opacity-70" />}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Admin Profile — Fix 1.6 */}
        <div className="border-t border-gray-200 dark:border-zinc-900 px-4 py-4 shrink-0 bg-gray-50/50 dark:bg-zinc-950">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-full bg-indigo-100 dark:bg-indigo-600/20 border border-indigo-200 dark:border-indigo-500/30 flex items-center justify-center shrink-0">
              <ShieldCheck className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 dark:text-white truncate capitalize">{userRole.replace(/_/g, " ")}</p>
              <p className="text-xs text-gray-500 dark:text-zinc-500 truncate">{adminEmail || "Loading..."}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all font-bold border border-transparent hover:border-red-100 dark:hover:border-red-900/30"
          >
            <LogOut className="h-4 w-4" /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Top Bar — Fix 1.3: Live clock + role badge */}
        <header className="bg-white dark:bg-zinc-950 border-b border-gray-200 dark:border-zinc-900 px-4 sm:px-6 py-3 flex items-center gap-4 shrink-0">
          <button
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-900 transition-colors"
            onClick={() => setIsSidebarOpen(true)}
          >
            <Menu className="h-5 w-5 text-gray-600 dark:text-zinc-400" />
          </button>

          <div className="flex-1">
            <h1 className="text-base font-bold text-gray-900 dark:text-white capitalize leading-tight">
              {navItems.find(i => isActive(i))?.label || "Admin Panel"}
            </h1>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Live Clock */}
            <span className="hidden sm:block text-xs font-mono font-bold text-gray-500 dark:text-zinc-500 tabular-nums bg-gray-100 dark:bg-zinc-900 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-zinc-800">
              {currentTime?.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true }) || "--:--:--"}
            </span>

            {/* Role Badge */}
            <span className={`hidden sm:block text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-full border ${
              userRole === "super_admin" ? "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800/40" :
              userRole === "admin" ? "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/20 dark:text-purple-400 dark:border-purple-800/40" :
              userRole === "content_writer" ? "bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800/40" :
              userRole === "form_filler" ? "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800/40" :
              "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800/40"
            }`}>
              {userRole.replace(/_/g, " ")}
            </span>

            <Link href="/admin/notifications" className="relative p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-zinc-900 transition-colors border border-transparent hover:border-gray-200 dark:hover:border-zinc-800">
              <Bell className="h-5 w-5 text-gray-500 dark:text-zinc-400" />
            </Link>
            <Link
              href="/"
              target="_blank"
              className="text-xs sm:text-sm font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 flex items-center gap-1 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg border border-indigo-100 dark:border-indigo-900/40 transition-colors"
            >
              View Site ↗
            </Link>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 relative">
          {children}
        </main>
      </div>

      {showWarningModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="inline-flex p-4 bg-amber-50 dark:bg-amber-950/20 text-amber-500 rounded-2xl mb-4 border border-amber-200 dark:border-amber-900/50">
              <ShieldCheck className="h-8 w-8 animate-bounce" />
            </div>
            <h3 className="text-lg font-black text-gray-900 dark:text-white mb-2">Inactivity Warning ⚠️</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 leading-relaxed">
              Aapki admin session 10 minutes of inactivity ke baad log out hone wali hai.
            </p>
            <div className="text-4xl font-black text-indigo-600 dark:text-indigo-400 mb-6 font-mono tabular-nums">
              {countdownSeconds}s
            </div>
            <button
              onClick={() => {
                lastActivityRef.current = Date.now();
                setShowWarningModal(false);
              }}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-lg shadow-indigo-500/20 transition-all hover:-translate-y-0.5 active:translate-y-0"
            >
              Continue Working
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
