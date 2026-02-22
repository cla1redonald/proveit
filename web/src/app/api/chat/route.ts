import "server-only";
import { NextRequest } from "next/server";
import { z } from "zod";
import { anthropic } from "@/lib/anthropic";
import { buildChatSystemPrompt } from "@/lib/prompts";

export const runtime = "nodejs";

const MessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().min(1).max(10000),
});

const ChatRequestSchema = z.object({
  sessionId: z
    .string()
    .min(1)
    .max(100)
    .regex(/^[a-zA-Z0-9_-]+$/, "Invalid session ID"),
  messages: z.array(MessageSchema).min(1).max(50),
  phase: z.enum([
    "brain_dump",
    "discovery",
    "research",
    "findings",
    "complete",
  ]),
  scores: z.object({
    desirability: z.number().min(1).max(10).nullable(),
    viability: z.number().min(1).max(10).nullable(),
    feasibility: z.number().min(1).max(10).nullable(),
  }),
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

  const parsed = ChatRequestSchema.safeParse(body);
  if (!parsed.success) {
    const message = parsed.error.errors[0]?.message ?? "Invalid input";
    return new Response(JSON.stringify({ error: message }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { messages, phase, scores } = parsed.data;

  // 2. Truncate messages if too many (keep latest 48, system prompt is separate)
  const truncatedMessages = messages.length > 48 ? messages.slice(messages.length - 48) : messages;

  // 3. Build system prompt with current phase and scores
  const systemPrompt = buildChatSystemPrompt(phase, scores);

  // 4. Conditionally add web search tool for research phase
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tools: any[] | undefined =
    phase === "research"
      ? [{ type: "web_search_20250305", name: "web_search", max_uses: 5 }]
      : undefined;

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      let searchingActive = false;

      try {
        const anthropicStream = await anthropic.messages.create({
          model: "claude-sonnet-4-6",
          max_tokens: 8096,
          system: systemPrompt,
          messages: truncatedMessages,
          tools,
          stream: true,
        });

        for await (const event of anthropicStream) {
          // Detect web search tool call starting
          if (
            event.type === "content_block_start" &&
            "content_block" in event &&
            event.content_block?.type === "tool_use" &&
            (event.content_block as { type: string; name?: string }).name === "web_search"
          ) {
            // Inject searching indicator
            controller.enqueue(
              encoder.encode('\ndata: {"type":"searching","active":true}\n')
            );
            searchingActive = true;
          }

          // Detect text block resuming — if a search was active, signal it stopped
          if (
            event.type === "content_block_start" &&
            "content_block" in event &&
            event.content_block?.type === "text"
          ) {
            if (searchingActive) {
              searchingActive = false;
              controller.enqueue(
                encoder.encode('\ndata: {"type":"searching","active":false}\n')
              );
            }
          }

          // Stream text deltas
          if (
            event.type === "content_block_delta" &&
            "delta" in event &&
            event.delta.type === "text_delta"
          ) {
            controller.enqueue(encoder.encode(event.delta.text));
          }

          // Handle pause_turn (web search executing) — signal searching:false when text resumes
          // The searching:false is signaled on content_block_start with type "text" above
        }

        // Emit done event
        controller.enqueue(encoder.encode('\ndata: {"type":"done"}\n'));
      } catch (err) {
        const anthropicErr = err as {
          status?: number;
          error?: { type?: string };
          message?: string;
        };

        if (
          anthropicErr.status === 400 &&
          typeof anthropicErr.message === "string" &&
          anthropicErr.message.includes("context_window_exceeded")
        ) {
          controller.enqueue(
            encoder.encode(
              '\ndata: {"type":"error","message":"Conversation too long. Please start a new session."}\n'
            )
          );
        } else if (anthropicErr.status === 401) {
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
          console.error("[/api/chat] Anthropic error:", err);
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
