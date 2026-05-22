"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Bookmark, UserCircle, MessageCircle, Sparkles } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";

export default function PrivateBottomNav() {
  const pathname = usePathname();
  const [isVisible, setIsVisible] = useState(true);
  const [tappedItem, setTappedItem] = useState<string | null>(null);
  const lastScrollYRef = useRef(0);
  const [isCommunityOpen, setIsCommunityOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > lastScrollYRef.current && currentScrollY > 80) {
        setIsVisible(false);
      } else {
        setIsVisible(true);
      }
      lastScrollYRef.current = currentScrollY;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [pathname]);

  // Track community drawer open state
  useEffect(() => {
    const handleCommunityOpen = () => setIsCommunityOpen(true);
    const handleCommunityClosed = () => setIsCommunityOpen(false);
    window.addEventListener("openPrivateCommunity", handleCommunityOpen);
    window.addEventListener("closePrivateCommunity", handleCommunityClosed);
    return () => {
      window.removeEventListener("openPrivateCommunity", handleCommunityOpen);
      window.removeEventListener("closePrivateCommunity", handleCommunityClosed);
    };
  }, []);

  // Check auth state
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsLoggedIn(!!session);
    };
    checkAuth();
    const { data: listener } = supabase.auth.onAuthStateChange((_e, session) => {
      setIsLoggedIn(!!session);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  const navItems = [
    {
      name: "Home",
      href: "/private-jobs",
      icon: Home,
      activeCheck: !isCommunityOpen && pathname === "/private-jobs",
    },
    // Show Community Chat only for logged-in users
    ...(isLoggedIn ? [{
      name: "Community",
      onClick: () => {
        window.dispatchEvent(new Event("openPrivateCommunity"));
      },
      icon: MessageCircle,
      activeCheck: isCommunityOpen,
    }] : []),
    {
      name: "AI Resume",
      href: "/resume-builder",
      icon: Sparkles,
      activeCheck: !isCommunityOpen && pathname === "/resume-builder",
    },
    {
      name: "Saved",
      href: "/private-jobs/dashboard?tab=saved-jobs",
      icon: Bookmark,
      activeCheck: !isCommunityOpen && pathname === "/private-jobs/dashboard" && (mounted ? window.location.search.includes("tab=saved-jobs") : false),
    },
    {
      name: "Account",
      href: "/private-jobs/dashboard",
      icon: UserCircle,
      activeCheck: !isCommunityOpen && pathname === "/private-jobs/dashboard" && (mounted ? !window.location.search.includes("tab=saved-jobs") : true),
    },
  ];

  const handleTap = (name: string) => {
    setTappedItem(name);
    setTimeout(() => setTappedItem(null), 300);
  };

  return (
    <>
      <div className="h-[68px] md:hidden block" />

      <nav
        aria-label="Private Jobs Navigation"
        className={`md:hidden fixed bottom-0 left-0 w-full z-50 transition-transform duration-300 ease-in-out ${
          isVisible ? "translate-y-0" : "translate-y-full"
        }`}
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-t border-gray-200/80 dark:border-gray-800/80 shadow-[0_-4px_24px_-8px_rgba(0,0,0,0.12)]">
          <div className="flex items-stretch justify-around h-[60px] px-1">
            {navItems.map((item) => {
              const isActive = item.activeCheck;
              const isTapped = tappedItem === item.name;

              const content = (
                <>
                  {isActive && (
                    <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-blue-500 rounded-full" />
                  )}
                  <span
                    className={`flex items-center justify-center w-9 h-7 rounded-xl transition-all duration-200 ${
                      isActive
                        ? "bg-blue-50 text-blue-600"
                        : "bg-transparent text-gray-400"
                    } ${isTapped ? "scale-90" : "scale-100"}`}
                  >
                    <item.icon
                      className={`transition-all duration-200 ${
                        isActive
                          ? "w-5 h-5 stroke-[2.5px]"
                          : "w-5 h-5 stroke-2 group-hover:text-gray-600"
                      }`}
                    />
                  </span>
                  <span
                    className={`text-[10px] leading-none transition-all duration-200 ${
                      isActive
                        ? "font-extrabold text-blue-600"
                        : "font-medium text-gray-400"
                    }`}
                  >
                    {item.name}
                  </span>
                </>
              );

              if ('onClick' in item && item.onClick) {
                return (
                  <button
                    key={item.name}
                    onClick={() => {
                      handleTap(item.name);
                      item.onClick();
                    }}
                    className="flex flex-col items-center justify-center flex-1 gap-0.5 relative py-1 transition-all outline-none"
                    aria-label={item.name}
                  >
                    {content}
                  </button>
                );
              }

              return (
                <Link
                  key={item.name}
                  href={'href' in item ? item.href : '#'}
                  onClick={() => handleTap(item.name)}
                  className="flex flex-col items-center justify-center flex-1 gap-0.5 relative py-1 transition-all"
                  aria-label={item.name}
                  aria-current={isActive ? "page" : undefined}
                >
                  {content}
                </Link>
              );
            })}
          </div>
        </div>
      </nav>
    </>
  );
}
