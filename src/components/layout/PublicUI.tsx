"use client";

import { usePathname } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import NewsTicker from "@/components/layout/NewsTicker";
import Footer from "@/components/layout/Footer";
import { GoogleTranslate } from "@/components/GoogleTranslate";

export function PublicHeader() {
  const pathname = usePathname();
  if (
    pathname?.startsWith("/admin") ||
    pathname?.startsWith("/private-jobs") ||
    pathname?.startsWith("/employer")
  ) {
    return null;
  }
  
  return (
    <>
      <GoogleTranslate />
      <Navbar />
      <NewsTicker />
    </>
  );
}

export function PublicFooter() {
  const pathname = usePathname();
  if (
    pathname?.startsWith("/admin") ||
    pathname?.startsWith("/private-jobs") ||
    pathname?.startsWith("/employer")
  ) {
    return null;
  }
  
  return <Footer />;
}
