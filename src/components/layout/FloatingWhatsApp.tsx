"use client";

import { MessageCircle } from "lucide-react";
import { useEffect, useState } from "react";

export default function FloatingWhatsApp() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Small delay to prevent distraction on initial load
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  if (!isVisible) return null;

  return (
    <a
      href="https://api.whatsapp.com/send?phone=918877434088&text=Hello%20Rojgar%20Suvidha!%20I%20need%20help."
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-50 flex items-center justify-center w-14 h-14 bg-[#25D366] text-white rounded-full shadow-lg hover:shadow-xl hover:scale-110 transition-all duration-300 group"
      aria-label="Contact Support on WhatsApp"
    >
      <div className="absolute -inset-2 bg-[#25D366] rounded-full opacity-20 animate-ping group-hover:animate-none"></div>
      <MessageCircle className="w-7 h-7 relative z-10" />
      
      {/* Tooltip */}
      <span className="absolute right-full mr-4 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 text-xs font-bold py-1.5 px-3 rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none border border-gray-100 dark:border-gray-700">
        Live Help / Support
      </span>
    </a>
  );
}
