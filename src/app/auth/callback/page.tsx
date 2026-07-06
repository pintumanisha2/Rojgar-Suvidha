"use client";

import { useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Loader2 } from "lucide-react";

function CallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    let subscription: any = null;

    const handleAuthCallback = async () => {
      const nextRedirect = searchParams.get("redirect") || searchParams.get("next") || "/dashboard";

      try {
        const error = searchParams.get("error");
        const errorDescription = searchParams.get("error_description");

        if (error) {
          console.error("Auth callback error:", error, errorDescription);
          if (isMountedRef.current) {
            router.push(`/login?error=${encodeURIComponent(errorDescription || "Authentication failed")}`);
          }
          return;
        }

        // Explicit manual hash parsing fallback
        if (typeof window !== "undefined" && window.location.hash) {
          const hash = window.location.hash.substring(1);
          const hashParams = new URLSearchParams(hash);
          const token = hashParams.get("access_token");
          const refresh = hashParams.get("refresh_token");

          if (token && refresh) {
            console.log("Found OAuth tokens in hash parameters, setting session...");
            await supabase.auth.setSession({
              access_token: token,
              refresh_token: refresh,
            });
          }
        }

        // Check if session is already present
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session) {
          if (isMountedRef.current) {
            router.push(nextRedirect);
          }
          return;
        }

        // Fallback real-time state listener
        const authResponse = supabase.auth.onAuthStateChange((event, newSession) => {
          if (newSession && isMountedRef.current) {
            if (subscription) {
              if (typeof subscription.unsubscribe === "function") subscription.unsubscribe();
              else if (typeof subscription === "function") subscription();
            }
            router.push(nextRedirect);
          }
        });
        
        subscription = authResponse.data?.subscription || authResponse;

        // Fallback timeout redirect (forces page transition if Supabase doesn't reply in time)
        setTimeout(() => {
          if (isMountedRef.current) {
            console.log("Forcing fallback timeout redirect to:", nextRedirect);
            if (subscription) {
              if (typeof subscription.unsubscribe === "function") subscription.unsubscribe();
              else if (typeof subscription === "function") subscription();
            }
            router.push(nextRedirect);
          }
        }, 1200);

      } catch (err) {
        console.error("Error in callback execution:", err);
        if (isMountedRef.current) {
          router.push(nextRedirect);
        }
      }
    };

    handleAuthCallback();

    return () => {
      if (subscription) {
        if (typeof subscription.unsubscribe === "function") subscription.unsubscribe();
        else if (typeof subscription === "function") subscription();
      }
    };
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
