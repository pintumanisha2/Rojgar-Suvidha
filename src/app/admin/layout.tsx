"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
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

export type Role = "super_admin" | "admin" | "govt_manager" | "govt_data_entry" | "private_manager" | "private_data_entry" | "unauthorized";

// Function to fetch role from Supabase 'admin_roles' table
const getRoleFromEmail = async (email: string | null): Promise<Role> => {
  if (!email) return "unauthorized";
  
  try {
    const { data, error } = await supabase
      .from('admin_roles')
      .select('role, status')
      .eq('email', email)
      .single();
      
    if (data && data.role) {
      if (data.status === 'Inactive') {
        return "unauthorized";
      }
      return data.role as Role;
    }
  } catch (err) {
    console.error("Error fetching role:", err);
  }
  
  // Hardcoded fallback for the primary owner just in case table fails
  if (email === "admin@rojgarsuvidha.com" || email === "superadmin@rojgarsuvidha.com") return "super_admin";
  
  return "unauthorized";
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [adminEmail, setAdminEmail] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<Role>("unauthorized");
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!mounted) return;
      
      if (!session && pathname !== "/admin/login") {
        router.push("/admin/login");
      } else if (session) {
        const email = session.user.email ?? null;
        setAdminEmail(email);
        const fetchedRole = await getRoleFromEmail(email);
        if (!mounted) return;
        setUserRole(fetchedRole);
        if (pathname === "/admin/login") {
          router.replace("/admin");
        }
      }
      setIsAuthLoading(false);
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!mounted) return;
      
      if (session) {
        const email = session.user.email ?? null;
        setAdminEmail(email);
        const fetchedRole = await getRoleFromEmail(email);
        if (!mounted) return;
        setUserRole(fetchedRole);
        // Removed router.replace("/admin") to prevent race condition with login page
      } else {
        setAdminEmail(null);
        setUserRole("unauthorized");
        if (pathname !== "/admin/login") {
          router.push("/admin/login");
        }
      }
      setIsAuthLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [pathname, router]);

  // --- Auto Logout for Inactivity (10 minutes) ---
  useEffect(() => {
    // Only run this if we are authenticated and NOT on the login page
    if (pathname === "/admin/login" || !adminEmail) return;

    let timeoutId: NodeJS.Timeout;

    const resetTimer = () => {
      clearTimeout(timeoutId);
      // Set to 10 minutes (600,000 ms)
      timeoutId = setTimeout(async () => {
        await supabase.auth.signOut();
        alert("Session Expired due to 10 minutes of inactivity. For security reasons, you have been logged out.");
        router.push("/admin/login");
      }, 600000); 
    };

    // Attach event listeners for activity
    const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];
    events.forEach(event => document.addEventListener(event, resetTimer));

    // Initialize timer
    resetTimer();

    return () => {
      clearTimeout(timeoutId);
      events.forEach(event => document.removeEventListener(event, resetTimer));
    };
  }, [pathname, adminEmail, router]);

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
      router.replace("/");
    }
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-950 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-red-500" />
      </div>
    );
  }

  if (!isAllowedPath && pathname !== "/admin") {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-950 flex flex-col items-center justify-center p-6 text-center">
        <ShieldCheck className="h-16 w-16 text-red-500 mb-4" />
        <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-2">Access Denied</h2>
        <p className="text-gray-500 dark:text-gray-400 mb-6">Your current role ({userRole}) does not have permission to view this page.</p>
        <Link href="/admin" className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold">Go to Dashboard</Link>
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
    <div className="h-screen w-full bg-gray-100 dark:bg-gray-950 flex overflow-hidden">
      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed top-0 left-0 h-full w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 z-30 flex flex-col transform transition-transform duration-300 ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:relative lg:translate-x-0`}>
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-gray-200 dark:border-gray-800 shrink-0">
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

        {/* Global Admin Mode Toggle (Sarkari vs Private) */}
        {(userRole === "super_admin" || userRole === "admin") && (
          <div className="px-4 pt-4 shrink-0">
            <div className="bg-gray-100 dark:bg-gray-800 p-1 rounded-xl flex items-center relative">
              <button 
                onClick={() => router.push("/admin")}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all z-10 ${!isPrivateMode ? "bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-white" : "text-gray-500 hover:text-gray-700"}`}
              >
                🏛️ Sarkari
              </button>
              <button 
                onClick={() => router.push("/admin/private-portal")}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all z-10 ${isPrivateMode ? "bg-white dark:bg-gray-700 shadow-sm text-blue-600 dark:text-blue-400" : "text-gray-500 hover:text-gray-700"}`}
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
              <span className="block text-[9px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest px-3 mb-1">
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
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all group ${active
                          ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                          : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white"
                        }`}
                    >
                      <Icon className="h-5 w-5 shrink-0" />
                      {item.label}
                      {active && <ChevronRight className="h-4 w-4 ml-auto" />}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Admin Profile */}
        <div className="border-t border-gray-200 dark:border-gray-800 px-4 py-4 shrink-0 bg-gray-50/50 dark:bg-gray-900/50">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-full bg-indigo-100 dark:bg-indigo-600/20 border border-indigo-200 dark:border-indigo-500/30 flex items-center justify-center shrink-0">
              <ShieldCheck className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 dark:text-white truncate capitalize">{userRole.replace("_", " ")}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{adminEmail || "Loading..."}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all font-bold"
          >
            <LogOut className="h-4 w-4" /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Top Bar */}
        <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-4 sm:px-6 py-4 flex items-center gap-4 shrink-0">
          <button
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            onClick={() => setIsSidebarOpen(true)}
          >
            <Menu className="h-5 w-5 text-gray-600 dark:text-gray-400" />
          </button>

          <div className="flex-1">
            <h1 className="text-lg font-bold text-gray-900 dark:text-white capitalize">
              {navItems.find(i => isActive(i))?.label || "Admin Panel"}
            </h1>
          </div>

          <div className="flex items-center gap-2">
            {/* FIX: Removed hardcoded red dot - bell icon now goes to notifications page */}
            <Link href="/admin/notifications" className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
              <Bell className="h-5 w-5 text-gray-500 dark:text-gray-400" />
            </Link>
            <Link
              href="/"
              target="_blank"
              className="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
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
    </div>
  );
}
