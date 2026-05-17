import type { NextConfig } from "next";

const securityHeaders = [
  // Force HTTPS for 1 year, include subdomains.
  // Only meaningful over HTTPS; browsers ignore it on plain HTTP.
  {
    key: "Strict-Transport-Security",
    value: "max-age=31536000; includeSubDomains",
  },
  // Prevent the app from being embedded in iframes (clickjacking)
  {
    key: "X-Frame-Options",
    value: "DENY",
  },
  // Stop browsers from MIME-sniffing the content type
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  // Only send the origin (no path) in the Referer header when navigating to external sites
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  // Restrict access to browser features not used by this app
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
  // Content Security Policy
  // - default-src 'self': only load resources from same origin
  // - script-src 'self' 'unsafe-inline' 'unsafe-eval' eu-assets.i.posthog.com:
  //   Next.js App Router requires unsafe-inline for inline hydration scripts and
  //   unsafe-eval for dynamic code evaluation used by the React runtime in
  //   production builds on Vercel. Removing unsafe-eval causes hydration
  //   failures; track Next.js roadmap for a nonce-based CSP approach before
  //   removing it. eu-assets is PostHog's array config script (analytics +
  //   error tracking, #29 + #42).
  // - style-src 'self' 'unsafe-inline': Tailwind CSS requires unsafe-inline
  // - connect-src 'self' eu.i.posthog.com eu-assets.i.posthog.com: API calls
  //   go to same origin (Anthropic is called server-side); PostHog ingests
  //   client-side events + exception captures over the EU endpoints.
  // - img-src 'self' data:: allow data URIs for any inline images
  // - frame-ancestors 'none': belt-and-suspenders with X-Frame-Options
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://eu-assets.i.posthog.com",
      "style-src 'self' 'unsafe-inline'",
      "connect-src 'self' https://eu.i.posthog.com https://eu-assets.i.posthog.com",
      "img-src 'self' data: blob:",
      "font-src 'self'",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  // Explicitly using Node.js runtime for API routes (not Edge)
  // The Anthropic SDK requires Node.js built-ins
  // This is the default but explicit is better than implicit

  async headers() {
    return [
      {
        // Apply security headers to all routes
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
