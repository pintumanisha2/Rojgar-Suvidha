"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Briefcase, Bookmark, UserCircle } from "lucide-react";
import { useEffect, useState, useRef } from "react";

export default function BottomNav() {
  const pathname = usePathname();
  const [isVisible, setIsVisible] = useState(true);
  const lastScrollYRef = useRef(0);

  // Hide Bottom Nav on admin pages
  if (pathname.startsWith("/admin")) return null;

  // Hide on scroll down, show on scroll up
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > lastScrollYRef.current && currentScrollY > 100) {
        setIsVisible(false);
      } else {
        setIsVisible(true);
      }
      lastScrollYRef.current = currentScrollY;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []); // Empty dep array - listener registered ONCE only

  const navItems = [
    { name: "Home", href: "/", icon: Home },
    { name: "Jobs", href: "/latest-jobs", icon: Briefcase },
    { name: "Saved", href: "/dashboard?tab=saved", icon: Bookmark },
    { name: "Profile", href: "/dashboard", icon: UserCircle },
  ];

  return (
    <>
      {/* Spacer to prevent content from hiding behind the bottom nav */}
      <div className="h-16 md:hidden block"></div>
      
      <div 
        className={`md:hidden fixed bottom-0 left-0 w-full bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.1)] z-50 transition-transform duration-300 ${isVisible ? 'translate-y-0' : 'translate-y-full'}`}
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="flex items-center justify-around h-16 px-2">
          {navItems.map((item) => {
            // Check if active (handle dashboard tabs carefully)
            const isActive = pathname === item.href || (item.href !== "/" && pathname === item.href.split('?')[0]);
            
            return (
              <Link 
                key={item.name} 
                href={item.href}
                className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${
                  isActive ? "text-indigo-600 dark:text-indigo-400" : "text-gray-500 dark:text-gray-400 hover:text-indigo-500"
                }`}
              >
                <item.icon 
                  className={`w-6 h-6 ${isActive ? "fill-indigo-50 dark:fill-indigo-900/30 stroke-[2.5px] scale-110" : "stroke-2"} transition-all`} 
                />
                <span className={`text-[10px] ${isActive ? "font-extrabold" : "font-medium"}`}>
                  {item.name}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </>
  );
}
// force rebuild
