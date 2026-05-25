"use client";

import dynamic from "next/dynamic";

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
  return (
    <>
      <FloatingSocials />
      <AIChatBot />
      <AspirantsCircleDrawer />
      <CommunityChatDrawer />
      <PushNotificationPrompt />
      <AnalyticsTracker />
      <GlobalBehaviorTracker />
      <FloatingInbox />
    </>
  );
}
