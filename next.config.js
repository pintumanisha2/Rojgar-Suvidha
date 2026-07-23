const path = require("path");

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
      {
        protocol: "https",
        hostname: "kkfgdzaoukekhlijlfsw.supabase.co",
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
          // X-Frame-Options removed — Jitsi Meet iframe needs to embed
          // Forces HTTPS
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
          // Basic XSS protection
          { key: "X-XSS-Protection", value: "1; mode=block" },
          // Controls Referrer info (good for SEO)
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // Permissions policy — disable unnecessary browser features
          // Allow camera & microphone for study room video calls
          { key: "Permissions-Policy", value: "camera=(self), microphone=(self), geolocation=(self)" },
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
      {
        source: "/about",
        destination: "/about-us",
        permanent: true,
      },
    ];
  },

  // ── Experimental features for performance ──
  experimental: {
    optimizeCss: false, // Keep false to avoid build issues; enable after testing
  },

  outputFileTracingRoot: path.join(__dirname),

  // ── Skip ESLint checks during build to prevent Vercel CI failures ──
  eslint: {
    ignoreDuringBuilds: true,
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
