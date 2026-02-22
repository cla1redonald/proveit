# ProveIt Web — Architecture Specification

**Version:** 1.0
**Date:** 2026-02-22
**Status:** Approved for build

---

## 1. System Overview

ProveIt Web is a public Next.js 15 App Router application. It exposes the ProveIt validation workflow — currently a Claude Code plugin — as a web UI accessible without any tooling setup. There is no authentication, no database, and no user accounts. All state lives in the browser's localStorage. Anthropic API calls are made exclusively from server-side Route Handlers.

**Two modes, one product:**

- **Fast Check** — Single-shot: user pastes an idea, receives three streamed assumption verdict cards. No conversation. Target completion: under 90 seconds.
- **Full Validation** — Conversational: chat interface drives a multi-phase discovery loop, delegates to Anthropic's native web search for research, returns scored results with a downloadable markdown summary.

**What this is not:** No auth, no database, no persistence across devices, no Gamma deck generation (cut for web MVP), no multi-user sessions.

---

## 2. Component Diagram

```
Browser
│
├── / (Home)
│   ├── IdeaInput (Client)          — textarea + mode toggle
│   └── ModeSelector (Client)       — Fast vs Full toggle
│
├── /fast (Fast Check)
│   ├── FastLayout (Server)         — page shell, meta
│   ├── FastStream (Client)         — initiates POST /api/fast, renders stream
│   │   ├── AssumptionCard (Client) — individual verdict card (x3)
│   │   └── StreamingIndicator (Client) — live typing animation
│   └── RestartButton (Client)      — clears state, routes back to /
│
└── /validate (Full Validation)
    ├── ValidateLayout (Server)     — page shell, meta
    ├── ChatInterface (Client)      — orchestrates full session
    │   ├── MessageList (Client)    — renders conversation history
    │   │   ├── UserMessage (Client)
    │   │   └── AssistantMessage (Client)
    │   │       └── StreamingText (Client) — token-level stream render
    │   ├── ChatInput (Client)      — text input + send
    │   ├── PhaseIndicator (Client) — Brain Dump / Discovery / Research / Results
    │   ├── SearchingIndicator (Client) — shown during pause_turn gap
    │   ├── ScorePanel (Client)     — live Desirability/Viability/Feasibility scores
    │   └── DownloadButton (Client) — generates + downloads discovery.md
    └── SessionManager (Client)     — reads/writes localStorage, resume banner

API Route Handlers (server-side only)
├── POST /api/fast                  — single-shot Fast Check
└── POST /api/chat                  — streaming Full Validation turns
```

---

## 3. Three-Layer AI Architecture

### Layer 1: Model Layer — Anthropic API

**Model:** `claude-sonnet-4-6` for both modes.

**Capabilities used:**
- Text generation with streaming (`stream: true`)
- Native web search tool (`type: "web_search_20250305"`) — Full Validation research phase only

**Failure modes and handling:**

| Failure | HTTP code from Anthropic | App response |
|---------|--------------------------|-------------|
| Invalid API key | 401 | Return 500 to client with message "Service configuration error. Contact support." (never expose key error) |
| Rate limit | 429 | Return 429 to client with `{ error: "Rate limit reached. Please wait a moment and try again.", retryAfter: 60 }` |
| Model overloaded | 529 | Return 503 to client with `{ error: "AI service is under high load. Please try again in a few seconds." }` |
| Network timeout | N/A | Route Handler must set a 90-second timeout. If exceeded, close the stream with a recoverable error event: `data: {"type":"error","message":"Response timed out. Your conversation is saved — try sending your message again."}\n\n` |
| Context window exceeded | 400 with `context_window_exceeded` | Return 400 to client with `{ error: "Conversation too long. Please start a new session." }` |

**Accuracy profile:** Anthropic web search results are directional research, not exhaustive. The system prompts must include a disclaimer in output that signals are not a substitute for talking to real users. The AI will occasionally hallucinate competitor names or funding data — this is expected and mitigated by instructing the model to cite URLs rather than make unattributed claims.

**Graceful degradation:** If the Anthropic API is unreachable, the Route Handler returns a 503. The client displays a full-page error state with a retry button. No partial state is committed to localStorage on error.

### Layer 2: API Layer — Route Handlers

Two routes. Both are POST. Both stream. Both validate inputs with Zod before touching the Anthropic SDK.

**POST /api/fast**

Single shot. Sends one Anthropic request with a full Fast Check system prompt and the user's idea. Streams back the response as plain text. No conversation history. No localStorage interaction.

**POST /api/chat**

Conversational. Accepts the full message history plus current session metadata. Adds the Full Validation system prompt as the first message. Streams back the response as plain text. During the research phase, enables the native web search tool — which may produce `pause_turn` events (see Section 7).

**Context management:** The Full Validation route accepts up to 50 messages of history. Messages beyond that limit are truncated from the beginning (oldest first), preserving the system prompt and the last 48 user/assistant turns. This prevents context window errors on long sessions.

**Prompt engineering principles:**
- System prompts are written as role definitions, not instruction lists
- Scoring is always grounded in evidence gathered during the session — the model cannot score without citing a reason
- Kill signals are surfaced as evidence, never as verdicts ("Here is what the data shows" not "This idea is dead")
- Questions are asked one at a time by instruction — the system prompt explicitly prohibits multi-question messages

### Layer 3: Product Harness Layer — Streaming UI

The client establishes a `fetch()` connection to the Route Handler, reads the response body as a `ReadableStream`, and decodes each chunk with a `TextDecoder`. Text deltas are appended to the current message in React state as they arrive — no buffering, no waiting for the full response.

**Error state rendering:**
- Network errors before stream starts: full message in place of assistant response, with retry button
- Errors mid-stream: stream terminates, partial message shown with error note appended
- `pause_turn` gap: `SearchingIndicator` shown (see Section 7)

**User controls during streaming:**
- Send button is disabled while streaming
- Stop button is shown while streaming (clicking it aborts the fetch via `AbortController`, closes the stream, preserves the partial response as a complete message in history)

---

## 4. TypeScript Interfaces

All interfaces live in `/web/src/types/index.ts`.

```typescript
// ─── Shared ───────────────────────────────────────────────────────────────────

export type Verdict = "SUPPORTED" | "WEAK" | "CONTRADICTED";

export type DiscoveryPhase =
  | "brain_dump"
  | "discovery"
  | "research"
  | "findings"
  | "complete";

// ─── Fast Check ───────────────────────────────────────────────────────────────

export interface AssumptionResult {
  assumption: string;
  category: "Desirability" | "Viability" | "Competition";
  verdict: Verdict;
  evidence: EvidenceItem[];
}

export interface EvidenceItem {
  source: string; // URL or source name
  finding: string; // what it shows
}

export interface FastResult {
  assumptions: AssumptionResult[];
  quickVerdict: string; // one-sentence summary of the biggest risk or strongest signal
  offerFullValidation: boolean; // always true — UI decision, not AI
}

// ─── Full Validation ──────────────────────────────────────────────────────────

export interface Message {
  id: string; // nanoid, client-generated
  role: "user" | "assistant";
  content: string;
  timestamp: number; // Date.now()
  isStreaming?: boolean; // true only during active stream, never persisted
}

export interface ConfidenceScores {
  desirability: number | null; // null = not yet scored
  viability: number | null;
  feasibility: number | null;
}

export interface KillSignal {
  type: "tarpit" | "saturation" | "no_switching" | "no_willingness_to_pay";
  evidence: string;
  detectedAt: number; // message index when signal was first flagged
}

export interface ValidationSession {
  id: string; // nanoid, created at session start
  ideaSummary: string; // 1-2 sentence summary, set after brain dump phase
  phase: DiscoveryPhase;
  messages: Message[];
  scores: ConfidenceScores;
  killSignals: KillSignal[];
  researchComplete: boolean;
  createdAt: number;
  updatedAt: number;
}

// ─── API Request / Response Shapes ────────────────────────────────────────────

export interface FastCheckRequest {
  idea: string; // validated: 10–2000 chars
}

export interface ChatRequest {
  sessionId: string;
  messages: Pick<Message, "role" | "content">[]; // stripped of client-only fields
  phase: DiscoveryPhase;
  scores: ConfidenceScores;
}

// Streaming events sent as line-delimited text
// Normal text deltas: raw text chunks (no wrapper)
// Special events: prefixed with `data: ` as JSON lines
export type StreamEvent =
  | { type: "phase_change"; phase: DiscoveryPhase }
  | { type: "scores"; scores: ConfidenceScores }
  | { type: "kill_signal"; signal: KillSignal }
  | { type: "searching"; active: boolean } // pause_turn indicator
  | { type: "done" }
  | { type: "error"; message: string };

// ─── localStorage ─────────────────────────────────────────────────────────────

export interface StoredSession {
  version: 1; // schema version for future migrations
  session: ValidationSession;
}
```

---

## 5. localStorage Schema

All localStorage interaction is isolated in `/web/src/lib/session.ts`. No component reads from localStorage directly.

**Keys:**

| Key | Type | Purpose |
|-----|------|---------|
| `proveit_session` | `StoredSession \| null` | The active validation session. One session at a time. |

**`proveit_session` shape:**

```json
{
  "version": 1,
  "session": {
    "id": "abc123",
    "ideaSummary": "A habit tracker for remote teams",
    "phase": "discovery",
    "messages": [
      {
        "id": "msg_001",
        "role": "user",
        "content": "I want to build a habit tracker for remote teams",
        "timestamp": 1740185600000
      },
      {
        "id": "msg_002",
        "role": "assistant",
        "content": "Got it — a habit tracker built specifically for remote teams...",
        "timestamp": 1740185605000
      }
    ],
    "scores": {
      "desirability": 6,
      "viability": null,
      "feasibility": null
    },
    "killSignals": [],
    "researchComplete": false,
    "createdAt": 1740185600000,
    "updatedAt": 1740185605000
  }
}
```

**Rules:**
- `isStreaming` is never written to localStorage — it is transient React state only.
- On session start (new idea submitted), any existing `proveit_session` is overwritten after the user confirms ("You have an existing session for [ideaSummary]. Start fresh?"). If user declines, they are routed to `/validate` to resume.
- On session complete (phase === `"complete"`), the session remains in localStorage until the user explicitly starts a new one or clears it via the UI.
- If `localStorage.getItem("proveit_session")` throws (private browsing restriction, storage quota exceeded), the app continues without persistence — a non-blocking warning is shown.
- Schema version field enables future migrations: if `version` does not equal `1`, the stored value is discarded and a fresh session starts.

**What is NOT stored:**
- The user's raw idea text before submission (only stored as the first message once submitted)
- Any partial streaming responses (only committed once the stream closes cleanly)
- Fast Check results (ephemeral — shown on page, gone on refresh by design)

---

## 6. API Design

### POST /api/fast

**Request:**
```json
{
  "idea": "A slack bot that..."
}
```

**Zod schema:**
```typescript
const FastCheckSchema = z.object({
  idea: z.string().min(10, "Tell us a bit more about the idea").max(2000, "Please keep your idea under 2000 characters"),
});
```

**Response (streaming):**
- `Content-Type: text/plain; charset=utf-8`
- `Cache-Control: no-cache`
- Body: raw text stream of the assistant's response

**Error responses (non-streaming):**
- `400 { "error": "Tell us a bit more about the idea" }` — idea too short
- `400 { "error": "Please keep your idea under 2000 characters" }` — idea too long
- `429 { "error": "Rate limit reached. Please wait a moment and try again.", "retryAfter": 60 }` — Anthropic rate limit
- `500 { "error": "Something went wrong. Please try again." }` — unhandled errors (logged server-side, never exposed to client)
- `503 { "error": "AI service is under high load. Please try again in a few seconds." }` — Anthropic 529

**Streaming behavior:**
1. Validate request body with Zod. Return 400 immediately if invalid.
2. Create Anthropic stream with Fast Check system prompt.
3. Pipe text deltas directly to client.
4. On stream end, close the response.
5. On error, close with error (stream is already open; append an error sentinel if mid-stream, or return non-streaming error if pre-stream).

**No session state.** This route is stateless. Every call starts fresh.

---

### POST /api/chat

**Request:**
```json
{
  "sessionId": "abc123",
  "messages": [
    { "role": "user", "content": "I want to build a habit tracker for remote teams" },
    { "role": "assistant", "content": "Got it — tell me more about who specifically has this problem." }
  ],
  "phase": "discovery",
  "scores": {
    "desirability": 6,
    "viability": null,
    "feasibility": null
  }
}
```

**Zod schema:**
```typescript
const MessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().min(1).max(10000),
});

const ChatRequestSchema = z.object({
  sessionId: z.string().min(1).max(100),
  messages: z.array(MessageSchema).min(1).max(50),
  phase: z.enum(["brain_dump", "discovery", "research", "findings", "complete"]),
  scores: z.object({
    desirability: z.number().min(1).max(10).nullable(),
    viability: z.number().min(1).max(10).nullable(),
    feasibility: z.number().min(1).max(10).nullable(),
  }),
});
```

**Response (streaming):**
- `Content-Type: text/plain; charset=utf-8`
- `Cache-Control: no-cache`
- Body: mixed stream — see protocol below

**Streaming protocol:**

The response body is a mixed stream of two types of content:

1. **Text deltas** — raw UTF-8 text chunks, appended directly to the current message display.
2. **Event lines** — lines starting with `data: ` followed by a JSON object. The client reads line-by-line and parses lines starting with `data: ` as `StreamEvent`.

The server emits event lines by injecting `\ndata: {"type":"..."}\n` into the stream at the appropriate moment. This is a lightweight custom protocol — not SSE — because the content type is `text/plain` and the client uses a manual stream reader, not `EventSource`.

**Example stream for a research phase turn:**
```
Let me research this now. Give me a few minutes.
data: {"type":"searching","active":true}
[2-10 seconds of silence during web search]
data: {"type":"searching","active":false}
Here's what I found...
data: {"type":"scores","scores":{"desirability":7,"viability":5,"feasibility":null}}
data: {"type":"done"}
```

**Error responses (non-streaming):**
- `400 { "error": "..." }` — Zod validation failure with specific field message
- `400 { "error": "Conversation too long. Please start a new session." }` — context window exceeded
- `429 { "error": "Rate limit reached. Please wait a moment and try again.", "retryAfter": 60 }`
- `500 { "error": "Something went wrong. Please try again." }`
- `503 { "error": "AI service is under high load. Please try again in a few seconds." }`

**Web search tool activation:**

The web search tool is included in the tools array only when `phase === "research"`. For all other phases, `tools` is omitted from the Anthropic request entirely — web search does not run during conversation phases.

```typescript
const tools = phase === "research"
  ? [{ type: "web_search_20250305", name: "web_search", max_uses: 5 }]
  : undefined;
```

**Context truncation:**

Before calling Anthropic, if `messages.length > 48`, drop messages from index 0 upward until `messages.length === 48`. The system prompt is prepended by the Route Handler — it is not in the messages array — so it is always preserved.

---

## 7. System Prompt Design

### Fast Check System Prompt

This is the complete, production-ready system prompt for `/api/fast`.

```
You are ProveIt, a product validation assistant. Your job is to run a rapid preflight check on a product idea by identifying the three assumptions most likely to kill it, researching them, and delivering clear verdicts.

## What you must do

1. Read the idea provided by the user.

2. Identify exactly 3 critical assumptions — the things that, if false, would make this idea not worth building. Label each one:
   - Assumption 1: Desirability — "Users have this pain badly enough to change behaviour"
   - Assumption 2: Viability — "Someone will pay for this / a business model exists"
   - Assumption 3: Competition — "There isn't already a dominant solution doing this"

   Adapt the specific wording to match the idea. These are starting categories, not rigid labels.

3. For each assumption, deliver a verdict:
   - SUPPORTED — evidence clearly backs this assumption
   - WEAK — some signal but meaningful gaps or counterevidence
   - CONTRADICTED — evidence argues against this assumption

4. Under each verdict, list 2-4 evidence points. Each evidence point must cite a specific source (URL, publication, or named study) and state what it shows. Do not make claims without a source.

5. After the three verdicts, write a "Quick verdict" — one sentence identifying the single biggest risk or the strongest signal across all three assumptions.

6. End with three options the user could take next:
   - Run full validation (full discovery + research + scoring)
   - Stop here — the evidence is enough
   - Dig deeper into one specific assumption

## Formatting

Use this exact structure:

---

**Assumption 1: [Category] — [Statement]**
Verdict: SUPPORTED / WEAK / CONTRADICTED

Evidence:
- [Source name or URL]: [What it shows]
- [Source name or URL]: [What it shows]

**Assumption 2: [Category] — [Statement]**
Verdict: SUPPORTED / WEAK / CONTRADICTED

Evidence:
- [Source name or URL]: [What it shows]
- [Source name or URL]: [What it shows]

**Assumption 3: [Category] — [Statement]**
Verdict: SUPPORTED / WEAK / CONTRADICTED

Evidence:
- [Source name or URL]: [What it shows]
- [Source name or URL]: [What it shows]

---

**Quick verdict:** [One sentence]

**What next?**
- Run full validation on this idea
- Stop here — you have enough to make a call
- Dig deeper into Assumption [N] — it's the weakest link

---

## What you must not do

- Do not make the go/kill decision. Present evidence; the user decides.
- Do not cite sources without URLs or names. "Studies show" is not a citation.
- Do not ask clarifying questions. Work with what you have.
- Do not exceed 3 assumptions. Quality over quantity.
- Do not soften kill signals. If evidence contradicts the assumption, say CONTRADICTED.

## Research quality

These findings are directional, not exhaustive. Web search coverage varies. Treat the verdicts as a starting hypothesis to be tested, not a final answer. The most important validation is talking to real users.
```

---

### Full Validation System Prompt

This is the complete, production-ready system prompt for `/api/chat`. The Route Handler injects the current phase and scores into the prompt before every request.

```
You are ProveIt, a product validation partner for product managers. Your job is to help PMs take a raw idea and determine whether it is worth building — through structured discovery, market research, and honest assessment. You are not a cheerleader. You are a truth-finder.

## Current session state

Phase: {PHASE}
Confidence scores: Desirability {DESIRABILITY}/10 | Viability {VIABILITY}/10 | Feasibility {FEASIBILITY}/10

({PHASE} will be one of: brain_dump, discovery, research, findings, complete)
(Scores will be null if not yet assessed for that dimension)

## Core principles

- Ask one question at a time. Never ask two questions in the same message.
- Be warm but direct — like a smart colleague, not a consultant.
- Do not over-explain. Get to the point.
- Evidence over opinion — every score must cite a reason from the conversation or research.
- Kill signals are flagged clearly, never softened. But the PM makes the go/kill call — you present evidence.
- Use plain language. No jargon unless the PM uses it first.

## Phase behaviour

### brain_dump phase

You are in the brain dump phase. Your goal is to get the raw idea out fast, conversationally. Ask one warm question at a time. Do not introduce frameworks or structure.

After 4-5 exchanges, summarise what you've heard in 2-3 sentences, confirm your understanding, and say you're ready to dig deeper on a few things before you go research.

When the brain dump is complete, emit this event on its own line:
data: {"type":"phase_change","phase":"discovery"}

### discovery phase

You are in the structured discovery phase. Your goal is to identify gaps across Desirability, Viability, and Feasibility. Do not re-ask what the brain dump already covered.

Priority order: Go to where the gaps are biggest. If Desirability is mostly answered but Viability is blank, go there.

Ask 2-3 questions, then pause and reflect back what you heard. Update your confidence scores after each mini-round.

Discovery questions available to you:

Desirability:
- Who specifically has this problem? Describe a real person, not a segment.
- What do they do today to solve this? Walk me through it.
- What's painful about how they do it today?
- How painful is it? Do they complain, or actually try to fix it?
- If your solution existed tomorrow, what would they stop using?
- How would they find out your solution exists?

Viability:
- Would someone pay for this? Who, and roughly how much?
- How would the money work? Subscription, one-time, freemium?
- How big is this market? Thousands or millions?
- What would make this a terrible business even if people loved it?
- Is anyone already making money solving this?

Feasibility (light touch only):
- Does this need to connect to anything? APIs, hardware, other systems?
- Does this need real-time anything? Live data, collaboration, notifications?
- Is there anything here that feels technically hard or uncertain?

When you have enough context to search effectively (roughly 8 questions total including brain dump), tell the PM: "I'm going to research this now. Give me a few minutes." Then emit:
data: {"type":"phase_change","phase":"research"}

### research phase

You are in the research phase. Use the web_search tool to investigate three tracks:

Track 1 — Competitor landscape:
- Search for existing products solving this problem (include Product Hunt, app stores, SaaS directories)
- Search for failed attempts and shutdowns (tarpit detection)
- Search pattern: "[idea space] software", "[idea space] app alternatives", "[idea space] startup failed"

Track 2 — Market evidence:
- Search for real people expressing this pain (Reddit, Hacker News, forums)
- Patterns to search: "I wish there was [X]", "frustrated with [X]", "why isn't there [X]"
- Look for switching behaviour — evidence of people actually changing tools

Track 3 — Viability signals:
- Search for competitor pricing and business models
- Search for market size estimates from industry sources
- Search for recent investment in the space

After completing all three tracks, present a structured findings summary:
- List key competitors found with their status (Active/Dead/Funded/Free)
- List market evidence with sources
- Flag any kill signals:
  - Tarpit: 5+ failed startups in this exact space
  - Saturated: 10+ active competitors with no clear gap
  - Zero switching evidence: people complain but nobody changes
  - No willingness to pay: all competitors are free, no paid tier survives
- List viability signals with sources

Then update confidence scores based on what you found. Emit updated scores:
data: {"type":"scores","scores":{"desirability":X,"viability":X,"feasibility":X}}

If a kill signal is found, emit:
data: {"type":"kill_signal","signal":{"type":"tarpit","evidence":"..."}}

Then transition to findings review:
data: {"type":"phase_change","phase":"findings"}

### findings phase

You are in the findings review phase. Present the updated confidence scores with evidence:

Format:
Desirability: [old] → [new]/10  ([evidence summary])
Viability:    [old] → [new]/10  ([evidence summary])
Feasibility:  [X]/10            ([assessment])

Scoring guide:
- 1-3: Weak — little or no supporting evidence
- 4-5: Mixed — some signals but significant unknowns
- 6-7: Moderate — evidence supports it but gaps remain
- 8-9: Strong — clear evidence, minor unknowns
- 10: Exceptional — overwhelming evidence (rare)

If kill signals were detected, present them clearly: "Here's what the evidence shows. The bar for pursuing this just got higher. Here's what would need to be true for this to work despite these signals."

Then offer the PM options:
- Scores are all 6+: suggest moving to outputs (markdown download)
- Gaps remain: offer to ask targeted follow-up questions and research again
- Kill signal: present evidence, let PM decide whether to continue
- PM wants to stop: "Everything's captured in your session. You can download a summary."

Suggest: all three scores at 6+ to proceed. But the PM has final say.

If PM wants outputs:
data: {"type":"phase_change","phase":"complete"}

### complete phase

The session is complete. Help the PM download their findings. The download will be triggered by the UI — you do not need to write markdown. Simply confirm what was captured and offer to answer any follow-up questions.

## Kill signals (detect in research phase)

- Tarpit: 5+ failed startups in this exact space despite clear stated demand
- Saturated market: 10+ active competitors with no differentiation gap evident
- Zero switching evidence: people express pain but no evidence of actually switching tools
- No willingness to pay: competitor landscape is entirely free/open-source with no successful paid tier

Flag these honestly when evidence supports them. Do not infer a kill signal from weak evidence.

## What you must not do

- Make the go/kill decision — you present evidence, the PM decides
- Ask two questions in one message
- Write technical specifications or architecture documents
- Promise accuracy — research is directional, not exhaustive
- Skip brain dump to jump straight to frameworks
- Score without citing evidence from the session or research
```

The Route Handler replaces `{PHASE}`, `{DESIRABILITY}`, `{VIABILITY}`, and `{FEASIBILITY}` with actual values before sending to Anthropic.

---

## 8. pause_turn Handling

When the native web search tool executes during the research phase, the Anthropic API may return `stop_reason: "pause_turn"`. This means the stream pauses — potentially for 2–10 seconds — while Anthropic executes the search query internally. The stream then resumes with the search results folded into the response.

**Server-side behavior:**

The Route Handler uses the raw async iterator pattern (`stream: true`). It does not need to explicitly handle `pause_turn` — the async iterator simply blocks during the pause and resumes when the next event arrives. No special server code is needed. The stream connection stays open during the pause.

However, the Route Handler must inject a `searching` event into the stream at the right moment. The way to detect that a search is starting is the `content_block_start` event with `type: "tool_use"` and `name: "web_search"`. When this event is received, immediately enqueue the searching event before continuing to read from the iterator:

```typescript
for await (const event of anthropicStream) {
  if (
    event.type === "content_block_start" &&
    event.content_block?.type === "tool_use" &&
    event.content_block?.name === "web_search"
  ) {
    // Inject searching indicator into the stream
    controller.enqueue(
      encoder.encode('\ndata: {"type":"searching","active":true}\n')
    );
  }

  if (
    event.type === "message_delta" &&
    event.delta?.stop_reason === "pause_turn"
  ) {
    // Search is executing — stream is paused. Nothing to do server-side.
    // The iterator will resume when results are ready.
    // searching:true is already signaled above.
  }

  if (
    event.type === "content_block_start" &&
    event.content_block?.type === "text"
  ) {
    // Text is resuming after search. Signal searching:false.
    controller.enqueue(
      encoder.encode('\ndata: {"type":"searching","active":false}\n')
    );
  }

  if (
    event.type === "content_block_delta" &&
    event.delta.type === "text_delta"
  ) {
    controller.enqueue(encoder.encode(event.delta.text));
  }
}
```

**Client-side behavior:**

The `ChatInterface` component tracks a `isSearching: boolean` state. When it reads a `data: {"type":"searching","active":true}` event line from the stream, it sets `isSearching = true`. When it reads `active: false`, it sets `isSearching = false`.

While `isSearching === true`, the `SearchingIndicator` component is rendered in place of the streaming cursor. It shows:

```
Searching the web...
```

with a pulsing animation. This makes the 2–10 second silence feel intentional and visible rather than broken.

The `SearchingIndicator` replaces — it does not stack with — the normal streaming cursor. Once `searching: false` is received and text starts flowing again, the indicator disappears and text rendering resumes.

**The pause_turn gap must not look broken.** If `isSearching` is true for longer than 15 seconds with no `active: false` event, show a secondary message: "Still searching... this can take up to 30 seconds." If it exceeds 60 seconds, treat it as a timeout and show an error.

---

## 9. Security Model

### API Key Protection

`ANTHROPIC_API_KEY` lives in `.env.local` (never committed) and is read by the Route Handlers at runtime via `process.env.ANTHROPIC_API_KEY`. The Anthropic client is instantiated server-side only:

```typescript
// /web/src/lib/anthropic.ts — server-only file
import Anthropic from "@anthropic-ai/sdk";

export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});
```

This file must never be imported by any Client Component. The `"use server"` directive at the top of Route Handler files prevents accidental client import. Additionally, mark this file with a server-only guard:

```typescript
import "server-only"; // npm package — throws if imported in client context
```

The API key is never returned in any API response. Error messages never include the key or hint at its format.

### Input Validation

All Route Handler inputs are validated with Zod before any downstream processing. The Zod schemas are defined in Section 6. Validation failures return 400 immediately — the Anthropic client is never invoked on invalid input.

Additional validation rules:
- `idea` field: strip leading/trailing whitespace before validation
- `messages[].content`: strip leading/trailing whitespace, enforce max 10,000 chars per message to prevent prompt injection via very long messages
- `sessionId`: alphanumeric + hyphens only (`/^[a-zA-Z0-9-]+$/`), max 100 chars

### Prompt Injection Mitigation

User-supplied content (the idea, chat messages) appears only in the `messages` array, never in the system prompt. The system prompt is hardcoded in the Route Handler and is not influenced by user input. This prevents users from overriding the system prompt via the chat interface.

### Rate Limiting

**MVP:** No rate limiting is implemented. The Anthropic API's own rate limits act as a backstop.

**Post-MVP recommendation:** Add Vercel's Edge Rate Limiting middleware (`@vercel/kv` + custom middleware) limiting to 10 requests per IP per minute for `/api/fast` and 30 requests per IP per minute for `/api/chat`. Document this here when implemented.

### CORS

Route Handlers are only called by the same-origin frontend. No CORS headers are needed and none should be added — this prevents other sites from calling the API routes using the app's Anthropic key.

### Environment Variables

Required in production (Vercel environment settings):
```
ANTHROPIC_API_KEY=sk-ant-...
```

No other secrets. No database credentials. No third-party API keys.

---

## 10. System Accuracy Profile

**What ProveIt Web is:** A structured research assistant that accelerates competitor scanning and market signal gathering. Results are directional, not exhaustive.

**Known limitations:**
- Web search results are limited to publicly indexed content and may miss private market data
- Competitor death dates and funding data can be stale
- The model may hallucinate specific statistics (e.g. market size numbers) — this is mitigated by requiring source citations in prompts, but not eliminated
- Research is point-in-time — the market may have changed since the last index

**User communication:** The system prompt instructs the model to include a research quality caveat in Fast Check output. The Full Validation findings review explicitly states that scores are based on available evidence and are a starting hypothesis.

**When Anthropic is down:**
1. Route Handler catches the connection error
2. Returns `503 { "error": "AI service is temporarily unavailable. Please try again shortly." }`
3. Client shows a full-page error state: "ProveIt is temporarily unavailable" with a retry button
4. No localStorage state is modified during an error — the session is preserved exactly as it was before the failed request
5. The retry button re-submits the last user message

---

## 11. Key Technical Decisions

### Decision 1: Native Anthropic web search, no Tavily

**Chosen:** `type: "web_search_20250305"` tool built into the Anthropic SDK.
**Rejected:** Tavily API, Firecrawl.
**Rationale:** One fewer API key, one fewer dependency, one fewer failure mode. The native tool works with `claude-sonnet-4-6` and handles result parsing internally. The PM persona does not need to configure anything.

### Decision 2: Custom streaming protocol over SSE

**Chosen:** `Content-Type: text/plain` with line-based event injection (`data: {...}` lines).
**Rejected:** Server-Sent Events (`Content-Type: text/event-stream`), `@ai-sdk/react` useChat hook.
**Rationale:** `useChat` from the Vercel AI SDK accumulates the full response before exposing it, which defeats streaming. The custom protocol is lightweight (20 lines of client parsing code) and gives precise control over event timing. SSE would require consistent event formatting; mixing prose and structured events is simpler with the custom line-based approach.

### Decision 3: localStorage, no database

**Chosen:** localStorage for session state.
**Rejected:** Supabase, PlanetScale, Redis.
**Rationale:** No auth, no user accounts. A database would require user identification. localStorage is sufficient for single-browser session continuity. The privacy model is explicit: data stays in the browser, nothing is sent to a server except active API calls.

### Decision 4: POST for all routes

**Chosen:** POST for `/api/fast` and `/api/chat`.
**Rejected:** GET with query params.
**Rationale:** Next.js 15 breaking change — GET Route Handlers are no longer cached by default. POST avoids ambiguity, supports request bodies naturally, and correctly signals the side-effect (LLM call) semantics.

### Decision 5: Phase state in request, not server

**Chosen:** Client sends `phase` and `scores` on every request.
**Rejected:** Server-side session tracking.
**Rationale:** Stateless server is simpler, cheaper, and matches the no-database constraint. The client is the source of truth for session state (backed by localStorage). The server only needs the current state to inject into the system prompt — it does not need history.

### Decision 6: Markdown download, no Gamma

**Chosen:** Client-side markdown generation and file download.
**Rejected:** Gamma MCP integration for web MVP.
**Rationale:** Gamma integration requires MCP server infrastructure not present in a Next.js web app. The Claude Code plugin version uses Gamma because MCP tools are available in that runtime. For the web MVP, a markdown download provides the same reference artifact with zero infrastructure. Gamma can be added in a later version via a separate API if the Gamma HTTP API becomes available.

### Decision 7: `server-only` package for Anthropic client

**Chosen:** Import `server-only` in `/web/src/lib/anthropic.ts`.
**Rejected:** Convention-only separation.
**Rationale:** Next.js will bundle server-only modules into the client bundle if accidentally imported from a Client Component. The `server-only` package throws a build-time error if this happens — it is a hard guardrail, not a convention.
