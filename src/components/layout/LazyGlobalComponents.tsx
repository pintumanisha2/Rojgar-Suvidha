"use client";

import dynamic from "next/dynamic";

import { usePathname } from "next/navigation";

// 🔥 NUCLEAR OPTIMIZATION: Lazy-load all heavy background components and drawers to unblock Main Thread
const FloatingSocials = dynamic(() => import("@/components/layout/FloatingSocials"), { ssr: false });
const AIChatBot = dynamic(() => import("@/components/layout/AIChatBot"), { ssr: false });
const AspirantsCircleDrawer = dynamic(() => import("@/components/layout/AspirantsCircleDrawer"), { ssr: false });
const CommunityChatDrawer = dynamic(() => import("@/components/layout/CommunityChatDrawer"), { ssr: false });
const PushNotificationPrompt = dynamic(() => import("@/components/layout/PushNotificationPrompt"), { ssr: false });
const AnalyticsTracker = dynamic(() => import("@/components/layout/AnalyticsTracker"), { ssr: false });
const GlobalBehaviorTracker = dynamic(() => import("@/components/layout/GlobalBehaviorTracker"), { ssr: false });
const FloatingInbox = dynamic(() => import("@/components/layout/FloatingInbox"), { ssr: false });

export default function LazyGlobalComponents() {
  const pathname = usePathname() || "";

  // Private job section: private-jobs, employer, job pages
  const isPrivateJobsSection = 
    pathname.startsWith("/private-jobs") || 
    pathname.startsWith("/employer") ||
    pathname.startsWith("/job/");

  // Government job section: everything that is NOT private jobs / employer
  const isGovtJobsSection = !isPrivateJobsSection;

  return (
    <>
      <FloatingSocials />
      <AIChatBot />
      {/* Govt Community: Aspirants Adda — only on govt/general pages */}
      {isGovtJobsSection && <AspirantsCircleDrawer />}
      {/* Private Community Chat — only on private job pages */}
      {isPrivateJobsSection && <CommunityChatDrawer />}
      <PushNotificationPrompt />
      <AnalyticsTracker />
      <GlobalBehaviorTracker />
      {isPrivateJobsSection && <FloatingInbox />}
    </>
  );
}
