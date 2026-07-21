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
      href="https://api.whatsapp.com/send?phone=918877434088&text=Namaste!%20Mujhe%20Apply%20For%20Me%20service%20ke%20baare%20mein%20jaankari%20chahiye.%20%F0%9F%99%8F"
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-20 sm:bottom-6 left-4 sm:left-auto sm:right-6 z-40 flex items-center justify-center w-14 h-14 bg-[#25D366] text-white rounded-full shadow-lg hover:shadow-xl hover:scale-110 transition-all duration-300 group"
      aria-label="Contact Support on WhatsApp"
    >
      <div className="absolute -inset-2 bg-[#25D366] rounded-full opacity-20 animate-ping group-hover:animate-none"></div>
      <MessageCircle className="w-7 h-7 relative z-10" />
      
      {/* Tooltip */}
      <span className="absolute left-full ml-4 sm:left-auto sm:right-full sm:mr-4 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 text-xs font-bold py-1.5 px-3 rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none border border-gray-100 dark:border-gray-700">
        Form mein help chahiye? 💬
      </span>
    </a>
  );
}
