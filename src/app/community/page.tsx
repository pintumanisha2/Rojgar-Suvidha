"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function CommunityPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/dashboard?openChat=true");
  }, [router]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-950">
      <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mb-2" />
      <p className="text-sm text-gray-500 font-bold uppercase tracking-widest">Opening Aspirants Adda...</p>
    </div>
  );
}
