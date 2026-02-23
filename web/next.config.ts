import type { NextConfig } from "next";

const securityHeaders = [
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
  // - script-src 'self' 'unsafe-inline': Next.js requires unsafe-inline for hydration
  // - style-src 'self' 'unsafe-inline': Tailwind CSS requires unsafe-inline
  // - connect-src 'self': API calls only go to same origin (Anthropic is called server-side)
  // - img-src 'self' data:: allow data URIs for any inline images
  // - frame-ancestors 'none': belt-and-suspenders with X-Frame-Options
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline'",
      "connect-src 'self'",
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
