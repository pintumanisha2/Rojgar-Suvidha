import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Custom fetch with dynamic timeouts per endpoint type.
// IMPORTANT: Auth calls (token refresh, session) must NEVER be cut short —
// a timed-out refresh = user gets logged out. Give them plenty of headroom.
const customFetch = async (url: RequestInfo | URL, options?: RequestInit) => {
  const urlStr = typeof url === "string" ? url : (url as any).url || url.toString();
  const isStorage = urlStr.includes("/storage/v1");
  const isAuth    = urlStr.includes("/auth/v1");

  // Auth calls get 25s — enough for slow networks, won't block refresh token renewal.
  // Storage uploads get 60s. Regular DB queries get 15s (fast-fail for UX).
  const timeoutMs = isStorage ? 60000 : isAuth ? 25000 : 15000;

  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await globalThis.fetch(url, { ...options, signal: controller.signal });
    clearTimeout(id);
    return response;
  } catch (error: any) {
    clearTimeout(id);

    if (error.name === 'AbortError') {
      // For auth timeouts, return a retriable 503 rather than 408 —
      // Supabase auth internals handle 503 more gracefully during token refresh.
      const isAuthTimeout = isAuth;
      return new Response(
        JSON.stringify({
          code: isAuthTimeout ? "AUTH_TIMEOUT" : "TIMEOUT",
          message: `Request took too long (>${timeoutMs / 1000}s). Please check your connection.`,
        }),
        {
          status: 503,
          statusText: "Service Unavailable",
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Network/CORS/AdBlock errors → clean 503 to prevent Supabase from hanging
    return new Response(
      JSON.stringify({
        code: "NETWORK_ERROR",
        message: error.message || "Failed to fetch. Check your internet connection.",
      }),
      {
        status: 503,
        statusText: "Service Unavailable",
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  global: { fetch: customFetch },
  auth: {
    persistSession: true,          // Keep session in localStorage across browser restarts
    autoRefreshToken: true,        // Silently refresh before 1-hr access token expires
    detectSessionInUrl: true,      // Needed for OAuth + magic link callbacks
    storage: typeof window !== "undefined" ? window.localStorage : undefined,
    // PKCE flow is more secure for SPAs — prevents auth code interception attacks
    flowType: "pkce",
  },
});
