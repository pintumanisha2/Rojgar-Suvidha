"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Briefcase, Bookmark, UserCircle, MessageSquare, MessageCircle } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";

export default function BottomNav() {
  const pathname = usePathname();
  const [isVisible, setIsVisible] = useState(true);
  const [tappedItem, setTappedItem] = useState<string | null>(null);
  const lastScrollYRef = useRef(0);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isCommunityOpen, setIsCommunityOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // FIX: All hooks MUST be called before any conditional return
  useEffect(() => {
    if (pathname.startsWith("/admin")) return;

    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      // Psychology: Hide on scroll down (more reading space), show on scroll up (user wants to navigate)
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

  useEffect(() => {
    const handleStateChange = (e: Event) => {
      const customEvent = e as CustomEvent;
      setIsChatOpen(!!customEvent.detail?.isOpen);
    };
    window.addEventListener("aspirantsCircleStateChange", handleStateChange);
    
    // Check initial search param
    if (typeof window !== "undefined" && window.location.search.includes("openChat=true")) {
      setIsChatOpen(true);
    }

    return () => window.removeEventListener("aspirantsCircleStateChange", handleStateChange);
  }, []);

  // Track community drawer open state
  useEffect(() => {
    const handleCommunityOpen = () => setIsCommunityOpen(true);
    const handleCommunityClosed = () => setIsCommunityOpen(false);
    window.addEventListener("openCommunityChat", handleCommunityOpen);
    // Close listener — CommunityChatDrawer dispatches this on X click
    window.addEventListener("closeCommunityChat", handleCommunityClosed);
    return () => {
      window.removeEventListener("openCommunityChat", handleCommunityOpen);
      window.removeEventListener("closeCommunityChat", handleCommunityClosed);
    };
  }, []);

  // Check auth state
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        setIsLoggedIn(!!data?.session);
      } catch {
        setIsLoggedIn(false);
      }
    };
    checkAuth();

    const authListener = supabase.auth.onAuthStateChange((_e, session) => {
      setIsLoggedIn(!!session);
    });

    return () => {
      if (authListener && typeof (authListener as any).unsubscribe === "function") {
        (authListener as any).unsubscribe();
      } else if (authListener?.data?.subscription && typeof authListener.data.subscription.unsubscribe === "function") {
        authListener.data.subscription.unsubscribe();
      }
    };
  }, []);

  if (
    pathname.startsWith("/admin") ||
    pathname.startsWith("/private-jobs") ||
    pathname.startsWith("/employer")
  ) {
    return null;
  }

  const navItems = [
    {
      name: "Home",
      href: "/",
      icon: Home,
      activeCheck: !isChatOpen && !isCommunityOpen && pathname === "/",
    },
    {
      name: "Jobs",
      href: "/latest-jobs",
      icon: Briefcase,
      activeCheck: !isChatOpen && !isCommunityOpen && (pathname === "/latest-jobs" || pathname.startsWith("/latest-jobs/") || pathname.startsWith("/job/")),
    },
    {
      name: "Adda",
      onClick: () => {
        window.dispatchEvent(new CustomEvent("openAspirantsCircle"));
      },
      icon: MessageSquare,
      activeCheck: isChatOpen,
    },
    // Show Community Chat only for logged-in users
    ...(isLoggedIn ? [{
      name: "Community",
      onClick: () => {
        window.dispatchEvent(new CustomEvent("openCommunityChat"));
      },
      icon: MessageCircle,
      activeCheck: isCommunityOpen,
    }] : []),
    {
      name: "Saved",
      href: "/saved-jobs",
      icon: Bookmark,
      activeCheck: !isChatOpen && !isCommunityOpen && (pathname === "/saved-jobs" || pathname.startsWith("/saved-jobs/")),
    },
    {
      name: "Account",
      href: "/dashboard",
      icon: UserCircle,
      activeCheck: !isChatOpen && !isCommunityOpen && (pathname === "/dashboard" || pathname.startsWith("/dashboard/")),
    },
  ];

  const handleTap = (name: string) => {
    setTappedItem(name);
    // Psychology: Haptic-like bounce feedback confirms the tap was registered
    setTimeout(() => setTappedItem(null), 300);
  };

  return (
    <>
      {/* Spacer so content doesn't hide behind nav */}
      <div className="h-[68px] md:hidden block" />

      <nav
        aria-label="Main navigation"
        className={`md:hidden fixed bottom-0 left-0 w-full z-50 transition-transform duration-300 ease-in-out ${
          isVisible ? "translate-y-0" : "translate-y-full"
        }`}
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        {/* Psychology: Frosted glass = modern, familiar iOS/Android pattern */}
        <div className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-t border-gray-200/80 dark:border-gray-800/80 shadow-[0_-4px_24px_-8px_rgba(0,0,0,0.12)]">
          <div className="flex items-stretch justify-around h-[60px] px-1">
            {navItems.map((item) => {
              const isActive = item.activeCheck;
              const isTapped = tappedItem === item.name;

              const content = (
                <>
                  {/* Psychology: Active pill indicator — clear, unambiguous feedback */}
                  {isActive && (
                    <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-indigo-500 rounded-full" />
                  )}

                  {/* Icon with tap animation */}
                  <span
                    className={`flex items-center justify-center w-9 h-7 rounded-xl transition-all duration-200 ${
                      isActive
                        ? "bg-indigo-50 dark:bg-indigo-900/40"
                        : "bg-transparent"
                    } ${isTapped ? "scale-90" : "scale-100"}`}
                  >
                    <item.icon
                      className={`transition-all duration-200 ${
                        isActive
                          ? "w-5 h-5 text-indigo-600 dark:text-indigo-400 stroke-[2.5px]"
                          : "w-5 h-5 text-gray-400 dark:text-gray-500 stroke-2 group-hover:text-gray-600"
                      }`}
                    />
                  </span>

                  {/* Psychology: Short, clear labels (Hick's Law — reduce reading time) */}
                  <span
                    className={`text-[10px] leading-none transition-all duration-200 ${
                      isActive
                        ? "font-extrabold text-indigo-600 dark:text-indigo-400"
                        : "font-medium text-gray-400 dark:text-gray-500"
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
