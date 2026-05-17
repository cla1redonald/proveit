/**
 * Next.js instrumentation hook — captures server-side errors via PostHog.
 *
 * Story #42. The `onRequestError` hook fires for any uncaught error in a
 * server component, server action, route handler, or middleware. We forward
 * it to PostHog for the maintainer to see in the activity feed.
 *
 * Runtime guard: PostHog Node SDK only works in the nodejs runtime. Edge
 * runtime errors are skipped (we don't deploy edge functions for ProveIt).
 *
 * PII: pass route metadata only — no headers other than path, method, and
 * the PostHog distinct_id cookie (so errors link to the right user). Idea
 * text, chat messages, and emails must stay private.
 */

export function register(): void {
  // No-op for now. Add server-side singletons here if they need lazy init.
}

interface NextRequestErrorContext {
  routerKind: "Pages Router" | "App Router";
  routePath: string;
  routeType: "render" | "route" | "action" | "middleware";
}

interface NextRequestErrorRequest {
  path?: string;
  method?: string;
  headers?: Record<string, string | string[] | undefined>;
}

export const onRequestError = async (
  err: unknown,
  request: NextRequestErrorRequest,
  context: NextRequestErrorContext
): Promise<void> => {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  // Lazy-require avoids loading posthog-node into the edge runtime bundle.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { captureServerException } = require("./src/lib/posthog-server") as typeof import("./src/lib/posthog-server");

  // Extract the PostHog distinct_id from the cookie so the error attaches
  // to the same person as their session events. Cookie format set by
  // posthog-js: `ph_<key>_posthog={"distinct_id":"..."}`.
  let distinctId: string | undefined;
  const cookieHeader = request.headers?.cookie;
  if (cookieHeader) {
    const cookieString = Array.isArray(cookieHeader)
      ? cookieHeader.join("; ")
      : cookieHeader;
    const match = cookieString.match(/ph_[^=]+?_posthog=([^;]+)/);
    if (match?.[1]) {
      try {
        const decoded = decodeURIComponent(match[1]);
        const parsed = JSON.parse(decoded) as { distinct_id?: string };
        if (typeof parsed.distinct_id === "string") {
          distinctId = parsed.distinct_id;
        }
      } catch {
        // Malformed cookie — fall through with no distinctId.
      }
    }
  }

  await captureServerException(
    err,
    {
      source: "instrumentation_onRequestError",
      route_path: context.routePath,
      route_kind: context.routerKind,
      route_type: context.routeType,
      request_method: request.method,
      request_path: request.path,
    },
    distinctId
  );
};
