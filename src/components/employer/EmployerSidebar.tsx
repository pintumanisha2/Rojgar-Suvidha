"use client";

import Link from "next/link";
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { 
  LayoutDashboard, 
  MessageSquare, 
  Calendar, 
  BarChart3, 
  Users, 
  Settings,
  Building2,
  Bell,
  ClipboardList,
  LogOut,
  Menu,
  X
} from "lucide-react";
import Image from "next/image";

import { useEffect, useState } from "react";

export default function EmployerSidebar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();

  const [hrName, setHrName] = useState("HR Manager");
  const [companyName, setCompanyName] = useState("Eduhorizon");
  const [role, setRole] = useState("Recruiter");

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Fetch from employer_profiles
        const { data, error } = await supabase
          .from("employer_profiles")
          .select("hr_name, company_name")
          .eq("id", user.id)
          .single();
        
        if (data && !error) {
          setHrName(data.hr_name);
          setCompanyName(data.company_name);
          // For now, default primary user to Admin so they can see team settings
          setRole("Admin");
        }
      } else {
        // Fallback for missing auth
        const storedName = localStorage.getItem("rs_employer_mock_hr");
        const storedCompany = localStorage.getItem("rs_employer_mock_company");
        if (storedName) setHrName(storedName);
        if (storedCompany) setCompanyName(storedCompany);
      }
    };

    fetchProfile();
  }, []);

  const navItems = [
    { name: "Dashboard", href: "/employer/dashboard", icon: LayoutDashboard },
    { name: "ATS Pipeline", href: "/employer/pipeline", icon: ClipboardList },
    { name: "Inbox", href: "/employer/messages", icon: MessageSquare, badge: 3 },
    { name: "Calendar", href: "/employer/calendar", icon: Calendar },
    { name: "Reports", href: "/employer/reports", icon: BarChart3 },
    // Only show Team page for Admins or Senior HR
    ...(role.toLowerCase().includes("admin") || role.toLowerCase().includes("senior") 
        ? [{ name: "Team", href: "/employer/team", icon: Users }] 
        : []),
    { name: "Settings", href: "/employer/settings", icon: Settings },
  ];

  return (
    <>
      {/* Mobile Top Bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 z-40 flex items-center justify-between px-4 shadow-sm">
        <Link href="/" className="flex items-center gap-2 hover:opacity-90 transition-opacity">
          <Image
            src="/logo-blue.png"
            alt="Rojgar Suvidha Logo"
            width={28}
            height={28}
            className="w-7 h-7 rounded-lg shadow-sm"
          />
          <div className="flex flex-col">
            <span className="font-extrabold text-lg leading-tight tracking-tight text-indigo-700 dark:text-indigo-400">
              Rojgar<span className="text-gray-900 dark:text-white">Suvidha</span>
            </span>
          </div>
        </Link>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-black text-xs border border-indigo-200 dark:border-indigo-800">
            {hrName.slice(0, 2).toUpperCase()}
          </div>
        </div>
      </div>

      {/* Sidebar Navigation (Desktop Only) */}
      <aside className="hidden md:flex fixed left-0 top-0 h-screen w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex-col z-50 transition-colors duration-300">
      {/* Brand Header */}
      <div className="h-16 flex items-center px-6 border-b border-gray-200 dark:border-gray-800 shrink-0">
        <Link href="/" className="flex items-center gap-2 hover:opacity-90 transition-opacity">
          <Image
            src="/logo-blue.png"
            alt="Rojgar Suvidha Logo"
            width={28}
            height={28}
            className="w-7 h-7 rounded-lg shadow-sm"
          />
          <div className="flex flex-col">
            <span className="font-extrabold text-lg leading-tight tracking-tight text-indigo-700 dark:text-indigo-400">
              Rojgar<span className="text-gray-900 dark:text-white">Suvidha</span>
            </span>
          </div>
        </Link>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto py-6 px-4 space-y-1">
        <div className="px-2 mb-4">
          <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest">Enterprise HR</span>
        </div>
        
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          
          return (
            <Link
              key={item.name}
              href={item.href}
              prefetch={true}
              onClick={(e) => {
                if (pathname === "/employer/dashboard" && item.href.includes("/employer/dashboard")) {
                  // If we are already on the dashboard page, force a hard navigation so query params re-trigger
                  e.preventDefault();
                  window.location.href = item.href;
                }
              }}
              className={`flex items-center justify-between px-3 py-2.5 rounded-xl transition-all ${
                isActive 
                  ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 font-extrabold" 
                  : "text-gray-500 hover:text-gray-900 hover:bg-gray-50 dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-800 font-bold"
              }`}
            >
              <div className="flex items-center gap-3 text-sm">
                <Icon className={`w-4 h-4 ${isActive ? "text-indigo-600 dark:text-indigo-400" : ""}`} />
                {item.name}
              </div>
              {item.badge && (
                <span className="bg-red-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </div>

      {/* User Profile Footer */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-800 shrink-0 space-y-2">
        <div className="flex items-center gap-3 p-2 rounded-xl bg-gray-50 dark:bg-gray-850 cursor-default">
          <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-black text-sm shrink-0 border border-indigo-200 dark:border-indigo-800">
            {hrName.slice(0, 2).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-extrabold text-gray-900 dark:text-white truncate">Hi, {hrName} 👋</h4>
            <p className="text-[10px] font-bold text-gray-500 truncate">{role} @ {companyName}</p>
          </div>
        </div>
        <button 
          onClick={async () => {
            try {
              await supabase.auth.signOut();
            } catch (err) {
              console.warn("Supabase signout failed:", err);
            } finally {
              localStorage.removeItem("rs_employer_mock_company");
              localStorage.removeItem("rs_employer_mock_hr");
              localStorage.removeItem("rs_employer_mock_role");
              localStorage.removeItem("rs_employer_mock_verified");
              router.push("/employer/login");
            }
          }}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 dark:bg-red-900/20 dark:hover:bg-red-900/40 dark:text-red-400 font-bold rounded-xl transition-colors text-sm border border-red-100 dark:border-red-900/50"
        >
          <LogOut className="w-4 h-4" /> Log Out
        </button>
      </div>
    </aside>

    {/* Mobile Bottom Navigation Bar */}
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md border-t border-gray-200 dark:border-gray-800 z-50 pb-safe">
      <div className="flex items-center justify-around px-2 py-2 overflow-x-auto hide-scrollbar">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.name}
              href={item.href}
              prefetch={true}
              onClick={(e) => {
                if (pathname === "/employer/dashboard" && item.href.includes("/employer/dashboard")) {
                  e.preventDefault();
                  window.location.href = item.href;
                }
              }}
              className={`flex flex-col items-center justify-center p-2 min-w-[64px] transition-all rounded-xl ${
                isActive 
                  ? "text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 font-extrabold" 
                  : "text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 ${isActive ? "mb-1 scale-110" : "mb-1"}`} />
                {item.badge && (
                  <span className="absolute -top-1 -right-2 bg-red-500 text-white text-[8px] font-black w-4 h-4 flex items-center justify-center rounded-full border-2 border-white dark:border-gray-900">
                    {item.badge}
                  </span>
                )}
              </div>
              <span className="text-[9px] whitespace-nowrap">{item.name.split(" ")[0]}</span>
            </Link>
          );
        })}
        {/* Mobile Log Out Button */}
        <button
          onClick={async () => {
            try {
              await supabase.auth.signOut();
            } catch (err) {} finally {
              localStorage.removeItem("rs_employer_mock_company");
              localStorage.removeItem("rs_employer_mock_hr");
              localStorage.removeItem("rs_employer_mock_role");
              localStorage.removeItem("rs_employer_mock_verified");
              window.location.href = "/employer/login";
            }
          }}
          className="flex flex-col items-center justify-center p-2 min-w-[64px] text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all"
        >
          <LogOut className="w-5 h-5 mb-1" />
          <span className="text-[9px]">Log Out</span>
        </button>
      </div>
    </div>
    </>
  );
}
