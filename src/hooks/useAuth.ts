/**
 * useAuth — Zero-Flash Authentication Hook
 *
 * Problem solved: Supabase's async getSession() takes 1–3 seconds,
 * during which pages show loading spinners or flash to the login screen
 * even when the user IS already logged in (their token is in localStorage).
 *
 * Solution: Read localStorage synchronously FIRST (instant, 0ms).
 * If we find a valid session → render the page immediately.
 * Then verify/refresh in the background silently.
 * Only redirect to login if we are 100% sure the user is not logged in.
 */

"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase, getStoredSession } from "@/lib/supabase";

export type AuthState =
  | "checking"      // Still figuring out — show nothing or skeleton
  | "authenticated" // Logged in — render page
  | "unauthenticated"; // Not logged in — safe to redirect

export interface UseAuthReturn {
  user: any | null;
  token: string;
  authState: AuthState;
  /** true only during the initial sync check — resolves in <5ms if session exists */
  loading: boolean;
}

/**
 * @param redirectToLogin If true (default), automatically redirects to /login
 *   when the user is confirmed unauthenticated. Set false if you handle redirect yourself.
 * @param loginPath Override the login redirect URL (default: /login)
 */
export function useAuth(
  redirectToLogin: boolean = true,
  loginPath: string = "/login"
): UseAuthReturn {
  const router = useRouter();

  // ── Phase 1: Synchronous fast-path check (runs before first render) ──────
  // getStoredSession reads localStorage synchronously — no await, no flash.
  const syncSession = typeof window !== "undefined" ? getStoredSession() : null;

  const [user, setUser] = useState<any | null>(syncSession?.user ?? null);
  const [token, setToken] = useState<string>(syncSession?.access_token ?? "");

  // If sync session exists → start as "authenticated" (no loading flash at all!)
  // If not → "checking" (show skeleton/spinner briefly while async check runs)
  const [authState, setAuthState] = useState<AuthState>(
    syncSession?.user ? "authenticated" : "checking"
  );
  const [loading, setLoading] = useState<boolean>(!syncSession?.user);

  const redirectIfNeeded = useCallback(() => {
    if (!redirectToLogin) return;
    const fullUrl = window.location.pathname + window.location.search;
    const loginUrl = `${loginPath}?redirect=${encodeURIComponent(fullUrl)}`;
    router.replace(loginUrl);
  }, [router, redirectToLogin, loginPath]);

  useEffect(() => {
    // ── Phase 2: If sync check already confirmed user → no async needed ───
    if (syncSession?.user) {
      // Still fire a background refresh so we catch expired tokens gracefully.
      // This does NOT block rendering — user already sees the page.
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session) {
          // Token refreshed silently — update state
          setUser(session.user);
          setToken(session.access_token);
          setAuthState("authenticated");
        } else {
          // localStorage had stale data — session actually expired
          // Clear stale data and redirect
          setUser(null);
          setToken("");
          setAuthState("unauthenticated");
          redirectIfNeeded();
        }
      }).catch(() => {
        // Network error during background refresh → keep user logged in
        // (avoid logging out users on network glitch)
        console.warn("[useAuth] Background session refresh failed — keeping user logged in.");
      });
      return;
    }

    // ── Phase 3: No sync session found → do async check (1–3s typically) ───
    // Show a loading skeleton during this, but do NOT redirect yet.
    let cancelled = false;

    const asyncCheck = async () => {
      try {
        // Race against a 6-second timeout to avoid infinite spinner
        const sessionPromise = supabase.auth.getSession();
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("Auth timeout")), 6000)
        );

        const res = await Promise.race([sessionPromise, timeoutPromise]).catch(
          () => null
        ) as any;

        if (cancelled) return;

        if (res?.data?.session) {
          setUser(res.data.session.user);
          setToken(res.data.session.access_token);
          setAuthState("authenticated");
          setLoading(false);
        } else {
          // Confirmed: user is not logged in
          setUser(null);
          setToken("");
          setAuthState("unauthenticated");
          setLoading(false);
          redirectIfNeeded();
        }
      } catch {
        if (!cancelled) {
          setAuthState("unauthenticated");
          setLoading(false);
          redirectIfNeeded();
        }
      }
    };

    asyncCheck();
    return () => { cancelled = true; };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run once on mount only

  return { user, token, authState, loading };
}
