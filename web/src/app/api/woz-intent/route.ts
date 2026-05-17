import "server-only";
import { NextRequest } from "next/server";
import { z } from "zod";
import { recordWozIntent } from "@/lib/woz-intent";
import { notifyWozIntent } from "@/lib/notifications";
import { checkRateLimit, getClientIp, RATE_LIMITS } from "@/lib/rate-limit";

export const runtime = "nodejs";

const WozIntentSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .min(5, "That doesn't look like a valid email")
    .max(254, "Email too long")
    .email("That doesn't look like a valid email"),
  chosenOption: z.enum(["one_off", "subscription"]),
  intendedUse: z.string().trim().max(500).optional(),
  ideaSummary: z.string().trim().max(500).optional(),
});

export async function POST(req: NextRequest) {
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

  const parsed = WozIntentSchema.safeParse(body);
  if (!parsed.success) {
    const message = parsed.error.errors[0]?.message ?? "Invalid input";
    return new Response(JSON.stringify({ error: message }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  await recordWozIntent({
    email: parsed.data.email,
    chosenOption: parsed.data.chosenOption,
    intendedUse: parsed.data.intendedUse,
    ideaSummary: parsed.data.ideaSummary,
    ip,
  });

  await notifyWozIntent({
    email: parsed.data.email,
    chosenOption: parsed.data.chosenOption,
    intendedUse: parsed.data.intendedUse ?? "",
    ideaSummary: parsed.data.ideaSummary ?? "",
    ip,
    ts: new Date().toISOString(),
  });

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
