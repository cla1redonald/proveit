import "server-only";
import { NextRequest } from "next/server";
import { z } from "zod";
import { anthropic } from "@/lib/anthropic";
import { buildFastCheckPrompt } from "@/lib/prompts";

export const runtime = "nodejs";

const FastCheckSchema = z.object({
  idea: z
    .string()
    .trim()
    .min(10, "Tell us a bit more about the idea")
    .max(2000, "Please keep your idea under 2000 characters"),
});

export async function POST(req: NextRequest) {
  // 1. Parse and validate request body
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid request body" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const parsed = FastCheckSchema.safeParse(body);
  if (!parsed.success) {
    const message = parsed.error.errors[0]?.message ?? "Invalid input";
    return new Response(JSON.stringify({ error: message }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { idea } = parsed.data;
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const anthropicStream = await anthropic.messages.create({
          model: "claude-sonnet-4-6",
          max_tokens: 8096,
          system: buildFastCheckPrompt(),
          messages: [{ role: "user", content: idea }],
          stream: true,
        });

        for await (const event of anthropicStream) {
          if (
            event.type === "content_block_delta" &&
            event.delta.type === "text_delta"
          ) {
            controller.enqueue(encoder.encode(event.delta.text));
          }
        }

        // Emit done event for consistency with /api/chat streaming protocol
        controller.enqueue(encoder.encode('\ndata: {"type":"done"}\n'));
      } catch (err) {
        const anthropicErr = err as { status?: number; error?: { type?: string } };

        if (anthropicErr.status === 401) {
          controller.enqueue(
            encoder.encode(
              '\ndata: {"type":"error","message":"Service configuration error. Contact support."}\n'
            )
          );
        } else if (anthropicErr.status === 429) {
          controller.enqueue(
            encoder.encode(
              '\ndata: {"type":"error","message":"Rate limit reached. Please wait a moment and try again."}\n'
            )
          );
        } else if (anthropicErr.status === 529) {
          controller.enqueue(
            encoder.encode(
              '\ndata: {"type":"error","message":"AI service is under high load. Please try again in a few seconds."}\n'
            )
          );
        } else {
          console.error("[/api/fast] Anthropic error:", err);
          controller.enqueue(
            encoder.encode(
              '\ndata: {"type":"error","message":"Something went wrong. Please try again."}\n'
            )
          );
        }
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache",
    },
  });
}
