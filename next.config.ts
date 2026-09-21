import type { NextConfig } from "next";

// Content-Security-Policy tailored to the third parties this app actually uses:
//   - Razorpay checkout (script + iframe + api)      checkout/api.razorpay.com
//   - Google Analytics 4                              googletagmanager / google-analytics
//   - Supabase REST + realtime                        *.supabase.co (https + wss)
//   - Image CDNs                                       pexels / unsplash / gstatic / googleapis / placehold
//
// 'unsafe-inline' is required for script-src because Next.js injects inline
// hydration scripts and GA uses an inline bootstrap; moving to strict nonces
// needs middleware and is a separate step. Even so this policy blocks external
// script injection to non-allowlisted origins, disables object/embeds, pins
// base-uri, and forbids framing (clickjacking).
//
// ROLLOUT: shipped below as `Content-Security-Policy-Report-Only` so it CANNOT
// break the live checkout — the browser reports violations (see devtools
// console / network) without enforcing. After confirming a clean run in prod
// (load homepage, a deal page, complete a test checkout, sign in), promote it
// to enforcing by renaming the header key to `Content-Security-Policy`.
const csp = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "form-action 'self'",
  "img-src 'self' data: blob: https://*.pexels.com https://*.unsplash.com https://*.googleapis.com https://*.gstatic.com https://placehold.co https://*.google-analytics.com https://*.googletagmanager.com",
  "script-src 'self' 'unsafe-inline' https://checkout.razorpay.com https://*.googletagmanager.com https://*.google-analytics.com https://accounts.google.com https://apis.google.com",
  "style-src 'self' 'unsafe-inline' https://accounts.google.com",
  "font-src 'self' data: https://*.gstatic.com",
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://*.razorpay.com https://*.google-analytics.com https://*.googletagmanager.com https://api.pexels.com https://accounts.google.com",
  "frame-src https://checkout.razorpay.com https://*.razorpay.com https://accounts.google.com",
  "upgrade-insecure-requests",
].join('; ')

// Security headers applied to every response. These are all safe to enforce
// immediately (they don't affect what the app can load); only the CSP is
// report-only pending the prod smoke test described above.
const securityHeaders = [
  // Force HTTPS for 2 years on this host. `includeSubDomains` and `preload` are
  // intentionally omitted: they can't be enabled safely until every subdomain of
  // the domain is confirmed HTTPS-only (and preload is hard to reverse). Once the
  // domain/subdomain setup is finalized, append '; includeSubDomains; preload'.
  { key: 'Strict-Transport-Security', value: 'max-age=63072000' },
  // Stop MIME-type sniffing.
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  // Legacy clickjacking guard (frame-ancestors in CSP is the modern equivalent).
  { key: 'X-Frame-Options', value: 'DENY' },
  // Don't leak full URLs/paths to third parties.
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  // Drop access to powerful browser features the site doesn't use.
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), browsing-topics=()' },
  // Isolate this origin from cross-origin window references, but allow popups so
  // Google Identity Services (window.google.accounts.id / One Tap) keeps working.
  // A plain 'same-origin' value here breaks Google sign-in.
  { key: 'Cross-Origin-Opener-Policy', value: 'same-origin-allow-popups' },
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
  // Report-only CSP — see the note above before promoting to enforcing.
  { key: 'Content-Security-Policy-Report-Only', value: csp },
]

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.pexels.com' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: '**.pexels.com' },
      { protocol: 'https', hostname: '**.unsplash.com' },
      { protocol: 'https', hostname: '**.googleapis.com' },
      { protocol: 'https', hostname: '**.gstatic.com' },
      { protocol: 'https', hostname: 'placehold.co' },
    ],
  },
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }]
  },
};

export default nextConfig;
