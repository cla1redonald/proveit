import "server-only";
import { NextRequest } from "next/server";
import { z } from "zod";
import { anthropic } from "@/lib/anthropic";
import { buildChatSystemPrompt } from "@/lib/prompts";
import { checkRateLimit, getClientIp, RATE_LIMITS } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const maxDuration = 300;

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
  // 0. Rate limiting — checked before any parsing to fail fast
  const ip = getClientIp(req);
  const { limit, windowMs } = RATE_LIMITS.chat;
  const rateLimit = await checkRateLimit(ip, "chat", limit, windowMs);
  if (!rateLimit.allowed) {
    const retryAfterSec = Math.ceil((rateLimit.resetAt - Date.now()) / 1000);
    return new Response(
      JSON.stringify({ error: "Too many requests. Please wait before trying again." }),
      {
        status: 429,
        headers: {
          "Content-Type": "application/json",
          "Retry-After": String(retryAfterSec),
          "X-RateLimit-Limit": String(limit),
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": String(Math.ceil(rateLimit.resetAt / 1000)),
        },
      }
    );
  }

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

  // 4. Web search tool: enabled for research phase (heavy — up to 12 uses) AND
  // for brain_dump phase with a small budget (up to 3 uses) so the model can
  // fetch any URLs the user pastes during Phase 0 Intake. Other phases get no
  // tools — discovery and findings are conversation-only.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tools: any[] | undefined =
    phase === "research"
      ? [{ type: "web_search_20250305", name: "web_search", max_uses: 12 }]
      : phase === "brain_dump"
        ? [{ type: "web_search_20250305", name: "web_search", max_uses: 3 }]
        : undefined;

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      let searchingActive = false;
      let inToolUseBlock = false;
      let inputJsonBuffer = "";

      // Application-level timeout — Vercel's 300s function timeout is not enough
      // protection on its own (a hung Anthropic stream burns 5min of credits).
      // 90s aligns with ARCHITECTURE.md §3.
      const abortController = new AbortController();
      const timeoutId = setTimeout(() => abortController.abort(), 90_000);

      try {
        const anthropicStream = await anthropic.messages.create(
          {
            model: "claude-sonnet-4-6",
            max_tokens: 8096,
            system: systemPrompt,
            messages: truncatedMessages,
            tools,
            stream: true,
          },
          { signal: abortController.signal }
        );

        for await (const event of anthropicStream) {
          // Detect web search tool call starting.
          // Anthropic SDK >= 0.50 emits server-side tools (web_search, web_fetch,
          // code_execution, etc.) as `server_tool_use` blocks; client-callable
          // tools still arrive as `tool_use`. Accept either to stay forward
          // compatible.
          if (
            event.type === "content_block_start" &&
            "content_block" in event &&
            (event.content_block?.type === "tool_use" ||
              event.content_block?.type === "server_tool_use") &&
            (event.content_block as { type: string; name?: string }).name === "web_search"
          ) {
            controller.enqueue(
              encoder.encode('\ndata: {"type":"searching","active":true}\n')
            );
            searchingActive = true;
            inToolUseBlock = true;
            inputJsonBuffer = "";
          }

          // Accumulate tool input JSON to extract the search query
          if (
            inToolUseBlock &&
            event.type === "content_block_delta" &&
            "delta" in event &&
            (event.delta as { type: string }).type === "input_json_delta"
          ) {
            inputJsonBuffer += (event.delta as { type: string; partial_json?: string }).partial_json ?? "";
          }

          // `content_block_stop` fires for every block (text AND tool_use).
          // The `inToolUseBlock` guard ensures we only act when a web_search
          // tool-use block has just finished, not on ordinary text block endings.
          if (inToolUseBlock && event.type === "content_block_stop") {
            inToolUseBlock = false;
            try {
              const parsed = JSON.parse(inputJsonBuffer) as { query?: string };
              if (parsed.query) {
                controller.enqueue(
                  encoder.encode(`\ndata: ${JSON.stringify({ type: "search_query", query: parsed.query })}\n`)
                );
              }
            } catch { /* ignore malformed */ }
            inputJsonBuffer = "";
          }

          // Detect text block resuming — signal searching stopped
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
        }

        // Belt-and-braces: ensure searching:false is emitted before done.
        // If the model ended with a tool call and no trailing text block,
        // the spinner would otherwise be stuck on the client.
        if (searchingActive) {
          controller.enqueue(
            encoder.encode('\ndata: {"type":"searching","active":false}\n')
          );
          searchingActive = false;
        }

        // Emit done event
        controller.enqueue(encoder.encode('\ndata: {"type":"done"}\n'));
      } catch (err) {
        // Always clear the searching indicator on error, regardless of cause
        if (searchingActive) {
          controller.enqueue(
            encoder.encode('\ndata: {"type":"searching","active":false}\n')
          );
          searchingActive = false;
        }

        const anthropicErr = err as {
          status?: number;
          error?: { type?: string };
          message?: string;
          name?: string;
        };

        // AbortError from our 90s timeout
        if (anthropicErr.name === "AbortError" || abortController.signal.aborted) {
          controller.enqueue(
            encoder.encode(
              '\ndata: {"type":"error","message":"Response timed out. Your conversation is saved — try sending your message again."}\n'
            )
          );
        } else if (
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
        clearTimeout(timeoutId);
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      // text/event-stream signals to CDNs/proxies (including Vercel edge) that
      // this is a streaming response and should not be buffered or transformed.
      // The body is not strict SSE — the client uses a manual stream reader,
      // not EventSource — but the Content-Type prevents intermediaries from
      // breaking the stream.
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      "X-Accel-Buffering": "no",
      Connection: "keep-alive",
    },
  });
}
