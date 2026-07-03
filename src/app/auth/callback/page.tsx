"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Loader2 } from "lucide-react";

function CallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const handleAuthCallback = async () => {
      // Catch error parameters if any
      const error = searchParams.get("error");
      const errorDescription = searchParams.get("error_description");
      const nextRedirect = searchParams.get("next") || "/dashboard";

      if (error) {
        console.error("Auth callback error:", error, errorDescription);
        router.push(`/login?error=${encodeURIComponent(errorDescription || "Authentication failed")}`);
        return;
      }

      // Check active session check
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        router.push(nextRedirect);
      } else {
        // Fallback wait for session load
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, newSession) => {
          if (newSession) {
            subscription.unsubscribe();
            router.push(nextRedirect);
          }
        });
        
        // Timeout safety fallback
        setTimeout(() => {
          subscription.unsubscribe();
          router.push(nextRedirect);
        }, 3000);
      }
    };

    handleAuthCallback();
  }, [router, searchParams]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-950 p-4">
      <div className="text-center space-y-4">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-600 mx-auto" />
        <h2 className="text-lg font-black text-gray-900 dark:text-white">Verifying account...</h2>
        <p className="text-sm text-gray-500">Please wait while we set up your workspace session.</p>
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    }>
      <CallbackContent />
    </Suspense>
  );
}
