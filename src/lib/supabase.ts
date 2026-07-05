import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Custom fetch with dynamic timeout to prevent regular queries from hanging,
// while allowing file/storage uploads enough time to complete.
const customFetch = async (url: RequestInfo | URL, options?: RequestInit) => {
  const urlStr = typeof url === "string" ? url : (url as any).url || url.toString();
  const isStorage = urlStr.includes("/storage/v1");
  const timeoutMs = isStorage ? 60000 : 8000; // 60s for storage uploads, 8s for regular queries

  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await globalThis.fetch(url, { ...options, signal: controller.signal });
    clearTimeout(id);
    return response;
  } catch (error: any) {
    clearTimeout(id);
    if (error.name === 'AbortError') {
      throw new Error(`Network timeout: The request took too long (${timeoutMs / 1000}s). Please try again.`);
    }
    throw error;
  }
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  global: { fetch: customFetch },
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: typeof window !== "undefined" ? window.localStorage : undefined,
  }
});
