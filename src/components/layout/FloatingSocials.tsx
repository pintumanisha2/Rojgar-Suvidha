"use client";

import { MessageCircle, Send } from "lucide-react";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

export default function FloatingSocials() {
  const pathname = usePathname();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 1200);
    return () => clearTimeout(timer);
  }, []);

  if (
    !pathname ||
    pathname.startsWith('/admin') ||
    pathname.startsWith('/private-jobs') ||
    pathname.startsWith('/employer')
  ) {
    return null;
  }

  return (
    <div
      className={`fixed z-50 transition-all duration-700 ease-out ${
        isVisible ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0'
      }
      /* Mobile: bottom-left above BottomNav | Desktop: bottom-left side */
      bottom-20 left-4
      md:bottom-10 md:left-10
      hidden md:flex flex-col gap-3`}
    >
      {/* YouTube */}
      <a
        href={SOCIAL_LINKS.youtube}
        target="_blank"
        rel="noopener noreferrer"
        className="group relative flex items-center justify-center w-10 h-10 bg-red-600/90 hover:bg-red-600 text-white rounded-full shadow-md hover:shadow-red-500/30 transition-all hover:scale-110 opacity-85 hover:opacity-100"
        aria-label="Subscribe YouTube"
      >
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path fillRule="evenodd" d="M19.812 5.418c.861.23 1.538.907 1.768 1.768C21.998 8.746 22 12 22 12s0 3.255-.418 4.814a2.504 2.504 0 0 1-1.768 1.768c-1.56.419-7.814.419-7.814.419s-6.255 0-7.814-.419a2.505 2.505 0 0 1-1.768-1.768C2 15.255 2 12 2 12s0-3.255.417-4.814a2.507 2.507 0 0 1 1.768-1.768C5.744 5 11.998 5 11.998 5s6.255 0 7.814.418ZM15.194 12 10 15V9l5.194 3Z" clipRule="evenodd" />
        </svg>
        <span className="hidden sm:block absolute left-full ml-3 bg-gray-900 text-white text-xs font-bold px-2.5 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
          Subscribe Channel
        </span>
      </a>

      {/* Telegram */}
      <a
        href={SOCIAL_LINKS.telegram}
        target="_blank"
        rel="noopener noreferrer"
        className="group relative flex items-center justify-center w-10 h-10 bg-sky-500/90 hover:bg-sky-500 text-white rounded-full shadow-md hover:shadow-sky-500/30 transition-all hover:scale-110 opacity-85 hover:opacity-100"
        aria-label="Join Telegram"
      >
        <Send className="w-4 h-4 -ml-0.5 group-hover:rotate-12 transition-transform" />
        <span className="hidden sm:block absolute left-full ml-3 bg-gray-900 text-white text-xs font-bold px-2.5 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
          Join Telegram
        </span>
      </a>

      {/* WhatsApp */}
      <a
        href={SOCIAL_LINKS.whatsappChannel}
        target="_blank"
        rel="noopener noreferrer"
        className="group relative flex items-center justify-center w-10 h-10 bg-[#25D366]/90 hover:bg-[#25D366] text-white rounded-full shadow-md shadow-[#25D366]/20 transition-all hover:scale-110 opacity-85 hover:opacity-100"
        aria-label="Join WhatsApp"
      >
        <MessageCircle className="w-4 h-4" />
        {/* Ping dot */}
        <span className="absolute top-0 right-0 flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500 border-2 border-white"></span>
        </span>
        <span className="hidden sm:block absolute left-full ml-3 bg-gray-900 text-white text-xs font-bold px-2.5 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
          Daily Job Alerts!
        </span>
      </a>
    </div>
  );
}
