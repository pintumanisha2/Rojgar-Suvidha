"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

// Parse browser from user agent
function getBrowser(ua: string): string {
  if (ua.includes("Edg/")) return "Edge";
  if (ua.includes("OPR/") || ua.includes("Opera")) return "Opera";
  if (ua.includes("Chrome") && !ua.includes("Chromium")) return "Chrome";
  if (ua.includes("Firefox")) return "Firefox";
  if (ua.includes("Safari") && !ua.includes("Chrome")) return "Safari";
  if (ua.includes("Samsung")) return "Samsung";
  return "Other";
}

// Parse OS from user agent
function getOS(ua: string): string {
  if (ua.includes("Android")) return "Android";
  if (ua.includes("iPhone") || ua.includes("iPad")) return "iOS";
  if (ua.includes("Windows")) return "Windows";
  if (ua.includes("Mac OS X")) return "macOS";
  if (ua.includes("Linux")) return "Linux";
  return "Other";
}

// Parse device type
function getDeviceType(ua: string, width: number): string {
  if (ua.includes("Android") || ua.includes("iPhone")) return "Mobile";
  if (ua.includes("iPad") || (ua.includes("Android") && !ua.includes("Mobile"))) return "Tablet";
  if (width <= 768) return "Mobile";
  if (width <= 1024) return "Tablet";
  return "Desktop";
}

// Get or create session ID
function getSessionId(): string {
  let sid = sessionStorage.getItem("rs_sid");
  if (!sid) {
    sid = Math.random().toString(36).slice(2) + Date.now().toString(36);
    sessionStorage.setItem("rs_sid", sid);
  }
  return sid;
}

// New or returning user
function getUserType(): string {
  const key = "rs_visited";
  if (localStorage.getItem(key)) return "returning";
  localStorage.setItem(key, "1");
  return "new";
}

export default function AnalyticsTracker() {
  const pathname = usePathname();
  const startTime = useRef(Date.now());
  const maxScroll = useRef(0);

  useEffect(() => {
    if (pathname?.startsWith("/admin")) return;

    const ua = navigator.userAgent;
    const width = window.innerWidth;

    // Detect Capacitor app
    const isApp =
      !!(window as any).Capacitor?.isNativePlatform?.() ||
      ua.includes("wv") ||
      (window as any).__CAPACITOR_NATIVE__ === true;

    const source = isApp ? "app" : "web";
    const browser = getBrowser(ua);
    const os = getOS(ua);
    const deviceType = getDeviceType(ua, width);
    const sessionId = getSessionId();
    const userType = getUserType();
    const screenRes = `${window.screen.width}x${window.screen.height}`;
    startTime.current = Date.now();
    maxScroll.current = 0;

    // Track scroll depth
    const handleScroll = () => {
      const scrollPct = Math.round(
        (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100
      );
      if (scrollPct > maxScroll.current) maxScroll.current = Math.min(scrollPct, 100);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });

    // Send page view
    fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        page: pathname,
        source,
        browser,
        os,
        device_type: deviceType,
        screen_res: screenRes,
        session_id: sessionId,
        user_type: userType,
        referrer: document.referrer || null,
        event: "pageview",
      }),
      keepalive: true,
    }).catch(() => {});

    // Send time on page + scroll depth when leaving
    const sendExit = () => {
      const timeOnPage = Math.round((Date.now() - startTime.current) / 1000);
      navigator.sendBeacon(
        "/api/track",
        JSON.stringify({
          page: pathname,
          source,
          browser,
          os,
          device_type: deviceType,
          session_id: sessionId,
          user_type: userType,
          event: "exit",
          time_on_page: timeOnPage,
          scroll_depth: maxScroll.current,
        })
      );
    };

    window.addEventListener("beforeunload", sendExit);
    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("beforeunload", sendExit);
    };
  }, [pathname]);

  return null;
}

