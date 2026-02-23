import { NextRequest, NextResponse } from "next/server";

/**
 * CORS guard for API routes.
 *
 * Blocks cross-origin POST requests to /api/* from third-party origins.
 * Requests without an Origin header (server-to-server, same-origin browser
 * requests, and curl) are passed through unchanged.
 *
 * The allowed origin can be overridden with the ALLOWED_ORIGIN env var,
 * which should be set to your production domain once one is configured
 * (e.g. ALLOWED_ORIGIN=https://proveit.yourdomain.com).
 */
export function middleware(request: NextRequest) {
  // Only guard API routes
  if (!request.nextUrl.pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  const origin = request.headers.get("origin");

  // No Origin header — same-origin browser request or non-browser client, allow
  if (!origin) return NextResponse.next();

  // Determine the allowed origin: explicit env var, or derive from Host header
  const allowedOrigin =
    process.env.ALLOWED_ORIGIN ??
    (() => {
      const host = request.headers.get("host");
      if (!host) return null;
      // Vercel deployments are always HTTPS; localhost dev is HTTP
      const proto = host.startsWith("localhost") ? "http" : "https";
      return `${proto}://${host}`;
    })();

  if (allowedOrigin && origin === allowedOrigin) {
    return NextResponse.next();
  }

  return new Response(
    JSON.stringify({ error: "Cross-origin request not allowed" }),
    {
      status: 403,
      headers: { "Content-Type": "application/json" },
    }
  );
}

export const config = {
  matcher: "/api/:path*",
};
