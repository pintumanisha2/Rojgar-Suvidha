"use client";

import { useState, useEffect } from "react";
import { Bell, BellRing, X } from "lucide-react";

export default function PushNotificationPrompt() {
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);
  const [loading, setLoading] = useState(false);

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

  if (!isSupported) return null;

  // Floating button if they are not subscribed but the prompt is hidden
  if (!isSubscribed && !showPrompt) {
    return (
      <button 
        onClick={() => setShowPrompt(true)}
        className="fixed bottom-6 left-6 z-50 bg-indigo-600 hover:bg-indigo-700 text-white p-3 rounded-full shadow-2xl hover:scale-110 transition-transform group"
        title="Get Job Alerts"
      >
        <Bell className="w-6 h-6 animate-pulse group-hover:animate-none" />
      </button>
    );
  }

  // The main prompt
  if (showPrompt && !isSubscribed) {
    return (
      <div className="fixed bottom-6 left-6 z-50 w-[340px] max-w-[calc(100vw-48px)] bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-2xl p-5 overflow-hidden">
        {/* Decorative background */}
        <div className="absolute top-0 right-0 -mr-8 -mt-8 w-24 h-24 bg-indigo-500/10 rounded-full blur-2xl"></div>
        <div className="absolute bottom-0 left-0 -ml-8 -mb-8 w-24 h-24 bg-purple-500/10 rounded-full blur-2xl"></div>
        
        <button 
          onClick={dismissPrompt}
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-start gap-4 relative z-10">
          <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center shrink-0">
            <BellRing className="w-6 h-6 text-indigo-600 dark:text-indigo-400 animate-[wiggle_1s_ease-in-out_infinite]" />
          </div>
          <div>
            <h3 className="font-extrabold text-gray-900 dark:text-white text-sm">Want Free Job Alerts?</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 mb-3">
              Never miss a Govt Job or Admit Card. Get instant notifications directly on your device.
            </p>
            <div className="flex items-center gap-2">
              <button 
                onClick={subscribeToPush}
                disabled={loading}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold py-2 rounded-lg transition-colors disabled:opacity-70"
              >
                {loading ? "Activating..." : "Yes, Enable Alerts"}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
