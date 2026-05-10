import "server-only";
import { NextRequest } from "next/server";
import { z } from "zod";
import { addToWaitlist } from "@/lib/waitlist";
import { checkRateLimit, getClientIp, RATE_LIMITS } from "@/lib/rate-limit";

export const runtime = "nodejs";

// Tight schema — email is the only required field. Idea excerpt is optional
// (the user typed it before hitting the cap, but we don't require it back).
const WaitlistSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .min(5, "That doesn't look like a valid email")
    .max(254, "Email too long")
    .email("That doesn't look like a valid email"),
  ideaExcerpt: z.string().trim().max(500).optional(),
  reason: z.enum(["global_cap", "per_ip_cap"]),
});

export async function POST(req: NextRequest) {
  // Reuse the fast-check rate limiter so an attacker can't flood the waitlist
  // either. Gives us 10 submissions per IP per minute — generous for a
  // legitimate user, restrictive for a bot.
  const ip = getClientIp(req);
  const { limit, windowMs } = RATE_LIMITS.fast;
  const rl = await checkRateLimit(ip, "fast", limit, windowMs);
  if (!rl.allowed) {
    return new Response(
      JSON.stringify({ error: "Too many submissions. Please wait a moment and try again." }),
      { status: 429, headers: { "Content-Type": "application/json" } }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid request body" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const parsed = WaitlistSchema.safeParse(body);
  if (!parsed.success) {
    const message = parsed.error.errors[0]?.message ?? "Invalid input";
    return new Response(JSON.stringify({ error: message }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  await addToWaitlist({
    email: parsed.data.email,
    ideaExcerpt: parsed.data.ideaExcerpt,
    reason: parsed.data.reason,
    ip,
  });

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
