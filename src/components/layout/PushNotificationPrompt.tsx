"use client";

import { useState, useEffect } from "react";
import { Bell, BellRing, X } from "lucide-react";
import { usePathname } from "next/navigation";

export default function PushNotificationPrompt() {
  const pathname = usePathname();
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);
  const [loading, setLoading] = useState(false);

  const checkSubscription = async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      setIsSubscribed(!!subscription);
    } catch (e) {
      console.error("Error checking subscription:", e);
    }
  };

  const subscribeToPush = async () => {
    setLoading(true);
    try {
      // Request permission
      const permission = await Notification.requestPermission();
      
      if (permission === "granted") {
        // Register service worker if not already
        const registration = await navigator.serviceWorker.register("/sw.js");
        await navigator.serviceWorker.ready;
        
        // Subscribe to push manager
        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
        });
        
        // Save to backend & test it immediately
        await fetch("/api/push", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            subscription, 
            action: 'test' 
          }),
        });

        setIsSubscribed(true);
        setShowPrompt(false);
        localStorage.setItem("push_prompted", "true");
        alert("Success! You will now receive job alerts.");
      } else {
        alert("You have blocked notifications. You can enable them in your browser settings.");
        setShowPrompt(false);
        localStorage.setItem("push_prompted", "true");
      }
    } catch (error) {
      console.error("Failed to subscribe:", error);
      alert("Failed to subscribe. Please ensure your browser supports Push Notifications.");
    } finally {
      setLoading(false);
    }
  };

  const dismissPrompt = () => {
    setShowPrompt(false);
    localStorage.setItem("push_prompted", "true");
  };


  useEffect(() => {
    // Check if push messaging is supported
    if ("serviceWorker" in navigator && "PushManager" in window) {
      setIsSupported(true);
      checkSubscription();
      
      // Delay showing the prompt by a few seconds so it doesn't annoy the user immediately
      const timer = setTimeout(() => {
        const hasPrompted = localStorage.getItem("push_prompted");
        if (!hasPrompted && Notification.permission === "default") {
          setShowPrompt(true);
        }
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, []);

  if (
    pathname?.startsWith("/admin") ||
    pathname?.startsWith("/private-jobs") ||
    pathname?.startsWith("/employer")
  ) {
    return null;
  }



  if (!isSupported) return null;

  // Floating button if they are not subscribed but the prompt is hidden
  if (!isSubscribed && !showPrompt) {
    return (
      <button 
        onClick={() => setShowPrompt(true)}
        className="fixed bottom-[110px] md:bottom-[90px] right-6 z-50 bg-indigo-600 hover:bg-indigo-700 text-white p-3 rounded-full shadow-2xl hover:scale-110 transition-transform group"
        title="Get Job Alerts"
      >
        <Bell className="w-6 h-6 animate-pulse group-hover:animate-none" />
      </button>
    );
  }

  // The main prompt
  if (showPrompt && !isSubscribed) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
        <div className="relative w-full max-w-md bg-white dark:bg-gray-900 border border-indigo-100 dark:border-gray-800 rounded-3xl shadow-2xl p-6 md:p-8 overflow-hidden transform animate-in zoom-in-95 duration-300">
          
          {/* Decorative background */}
          <div className="absolute -top-20 -right-20 w-40 h-40 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-purple-500/20 rounded-full blur-3xl pointer-events-none"></div>
          
          <button 
            onClick={dismissPrompt}
            className="absolute top-4 right-4 p-2 bg-gray-100 dark:bg-gray-800 text-gray-500 hover:text-gray-700 dark:hover:text-gray-200 rounded-full transition-colors z-20"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex flex-col items-center text-center relative z-10">
            <div className="w-20 h-20 bg-indigo-50 dark:bg-indigo-900/30 rounded-full flex items-center justify-center mb-5 relative">
              <div className="absolute inset-0 rounded-full border-2 border-indigo-500/30 animate-ping"></div>
              <BellRing className="w-10 h-10 text-indigo-600 dark:text-indigo-400 animate-[wiggle_1s_ease-in-out_infinite]" />
            </div>
            
            <h3 className="font-extrabold text-gray-900 dark:text-white text-xl md:text-2xl mb-2">
              Govt Job Updates Chahiye?
            </h3>
            
            <p className="text-sm md:text-base text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
              Koi bhi **Vacancy, Admit Card** ya **Result** aate hi turant aapke phone me notification aayega. Ab form chootne ka dar khatam!
            </p>
            
            <div className="flex flex-col sm:flex-row w-full gap-3">
              <button 
                onClick={subscribeToPush}
                disabled={loading}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-base font-bold py-3.5 px-6 rounded-xl transition-all shadow-lg shadow-indigo-600/30 disabled:opacity-70 flex items-center justify-center gap-2"
              >
                {loading ? "Chalu ho raha hai..." : "Haan, Chalu Karein"}
              </button>
              
              <button 
                onClick={dismissPrompt}
                className="w-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm font-bold py-3.5 px-6 rounded-xl transition-all"
              >
                Nahi, Baad me
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
