/** @type {import('next').NextConfig} */
const nextConfig = {
  
  // ── Image Optimization ──────────────────────────────────
  images: {
    formats: ["image/avif", "image/webp"], // Use modern formats for faster load
    minimumCacheTTL: 86400, // Cache images for 24 hours (86400 seconds)
    remotePatterns: [
      {
        protocol: "https",
        hostname: "dflnrfvngmquaqdtjjhh.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },

  // ── HTTP Headers for Performance & Security (Core Web Vitals = SEO Signal) ──
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          // Prevent MIME-type sniffing
          { key: "X-Content-Type-Options", value: "nosniff" },
          // Prevents clickjacking
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          // Forces HTTPS
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
          // Basic XSS protection
          { key: "X-XSS-Protection", value: "1; mode=block" },
          // Controls Referrer info (good for SEO)
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // Permissions policy — disable unnecessary browser features
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(self)" },
        ],
      },
      // ── Cache static assets aggressively (faster = better SEO) ──
      {
        source: "/(.*)\\.(ico|png|jpg|jpeg|gif|webp|avif|svg|woff2|woff|ttf|css|js)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },

  // ── Redirects (Important for SEO - canonical URLs) ──
  async redirects() {
    return [
      // Redirect www to non-www (or vice versa) - pick ONE canonical domain
      // Uncomment the one you want:
      // { source: "/(.*)", has: [{ type: "host", value: "rojgarsuvidha.com" }], destination: "https://www.rojgarsuvidha.com/:path*", permanent: true },
    ];
  },

  // ── Experimental features for performance ──
  experimental: {
    optimizeCss: false, // Keep false to avoid build issues; enable after testing
  },

  // ── Compiler optimizations ──
  compiler: {
    removeConsole: process.env.NODE_ENV === "production", // Remove console.log in production
  },

  // ── Compression ──
  compress: true,

  // ── Power mode: generate etags for better caching ──
  generateEtags: true,

  // ── Trailing slash - important for SEO consistency ──
  trailingSlash: false,
};

module.exports = nextConfig;
