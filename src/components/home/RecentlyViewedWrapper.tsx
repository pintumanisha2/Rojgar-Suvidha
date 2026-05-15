"use client";

import dynamic from "next/dynamic";

// ssr: false is only allowed inside Client Components (not Server Components)
const RecentlyViewed = dynamic(
  () => import("@/components/home/RecentlyViewed"),
  { ssr: false }
);

export default function RecentlyViewedWrapper() {
  return <RecentlyViewed />;
}
