# ProveIt Web — Component Tree

**Version:** 1.0
**Date:** 2026-02-22
**Status:** Approved for build

All components live under `/web/src/`. Unless specified as Client Component (`"use client"`), all components are Server Components by default. The rule throughout this document: **if a component needs browser APIs, event handlers, or React hooks — it is a Client Component.**

The Anthropic API key is never accessible to any Client Component. All Anthropic calls go exclusively through `/api/fast` and `/api/chat` Route Handlers.

---

## File Structure

```
/web/src/
├── app/
│   ├── layout.tsx                    # Root layout (Server)
│   ├── page.tsx                      # Home / landing (Server shell)
│   ├── fast/
│   │   ├── page.tsx                  # Fast Check page (Server shell)
│   │   └── layout.tsx                # Fast Check layout (Server)
│   ├── validate/
│   │   ├── page.tsx                  # Full Validation page (Server shell)
│   │   └── layout.tsx                # Full Validation layout (Server)
│   └── api/
│       ├── fast/
│       │   └── route.ts              # POST /api/fast (Route Handler)
│       └── chat/
│           └── route.ts              # POST /api/chat (Route Handler)
├── components/
│   ├── home/
│   │   ├── IdeaInput.tsx             # Client
│   │   ├── ModeSelector.tsx          # Client
│   │   └── ResumeSessionBanner.tsx   # Client
│   ├── fast/
│   │   ├── FastStream.tsx            # Client
│   │   ├── AssumptionCard.tsx        # Client
│   │   └── StreamingIndicator.tsx    # Client
│   ├── validate/
│   │   ├── ChatInterface.tsx         # Client
│   │   ├── MessageList.tsx           # Client
│   │   ├── UserMessage.tsx           # Client
│   │   ├── AssistantMessage.tsx      # Client
│   │   ├── StreamingText.tsx         # Client
│   │   ├── ChatInput.tsx             # Client
│   │   ├── PhaseIndicator.tsx        # Client
│   │   ├── SearchingIndicator.tsx    # Client
│   │   ├── ScorePanel.tsx            # Client
│   │   └── DownloadButton.tsx        # Client
│   └── ui/                           # shadcn/ui copied components
│       ├── button.tsx
│       ├── badge.tsx
│       ├── card.tsx
│       ├── textarea.tsx
│       └── separator.tsx
├── lib/
│   ├── anthropic.ts                  # Server-only: Anthropic client singleton
│   ├── session.ts                    # Client: localStorage read/write
│   ├── prompts.ts                    # Server-only: system prompt builders
│   ├── streaming.ts                  # Client: stream reader utility
│   └── markdown.ts                   # Client: discovery.md generator
├── types/
│   └── index.ts                      # All TypeScript interfaces (see ARCHITECTURE.md §4)
└── hooks/
    ├── useSession.ts                 # Client: session state management
    ├── useStream.ts                  # Client: fetch + stream reader
    └── useSearching.ts               # Client: pause_turn indicator state
```

---

## Route Handlers

Route Handlers are not React components. They run exclusively on the server. They are documented here for completeness.

### `/web/src/app/api/fast/route.ts`

- **Runtime:** Node.js (not Edge)
- **Method:** POST only
- **Imports:** `anthropic.ts` (server-only), `prompts.ts` (server-only), `zod`
- **Never imports:** Anything from `components/`, `hooks/`, `lib/session.ts`
- **Behavior:** Validates body with `FastCheckSchema`, builds Anthropic request with Fast Check system prompt, pipes stream to response
- **API key access:** Yes — reads via `anthropic.ts` singleton

### `/web/src/app/api/chat/route.ts`

- **Runtime:** Node.js (not Edge)
- **Method:** POST only
- **Imports:** `anthropic.ts` (server-only), `prompts.ts` (server-only), `zod`
- **Never imports:** Anything from `components/`, `hooks/`, `lib/session.ts`
- **Behavior:** Validates body with `ChatRequestSchema`, builds Anthropic request with Full Validation system prompt (injecting current phase and scores), conditionally adds web search tool for research phase, handles `pause_turn` by injecting `searching` events, pipes stream to response
- **API key access:** Yes — reads via `anthropic.ts` singleton

---

## Server-Only Library Files

### `/web/src/lib/anthropic.ts`

```typescript
import "server-only";
import Anthropic from "@anthropic-ai/sdk";

export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});
```

- **Type:** Server-only singleton
- **Imported by:** Route Handlers only
- **Never imported by:** Any component or client-side hook
- **Guard:** `import "server-only"` throws build error if imported in client context

### `/web/src/lib/prompts.ts`

```typescript
import "server-only";
// buildFastCheckPrompt(): string
// buildChatSystemPrompt(phase, scores): string
```

- **Type:** Server-only utility
- **Imported by:** Route Handlers only
- **Exports:** `buildFastCheckPrompt()` and `buildChatSystemPrompt(phase, scores)` — injects current phase and score values into the Full Validation system prompt template
- **Never imported by:** Any component or client-side hook

---

## App Layout

### `/web/src/app/layout.tsx`

- **Type:** Server Component
- **Purpose:** Root HTML shell. Sets `<html lang="en">`, imports global CSS, renders `{children}`.
- **Props:** None (Next.js layout convention)
- **State:** None
- **API calls:** None
- **localStorage:** Never

```tsx
// Renders: <html> → <body> → {children}
// No client interactivity at this level
```

---

## Home Route (`/`)

### `/web/src/app/page.tsx`

- **Type:** Server Component
- **Purpose:** Landing page shell. Renders static content (tagline, value proposition, "How it works" steps) as server-rendered HTML. Mounts the `IdeaInput` client island and `ResumeSessionBanner`.
- **Props:** None
- **State:** None
- **API calls:** None
- **localStorage:** Never (delegates to `ResumeSessionBanner`)

Static content rendered server-side:
- Hero tagline: "ProveIt first, then build it."
- Value proposition paragraph
- Three-step "How it works" summary
- Two-column layout placeholder for `IdeaInput` + mode context

---

### `IdeaInput` — Client Component

**File:** `/web/src/components/home/IdeaInput.tsx`

- **Type:** Client Component (`"use client"`)
- **Purpose:** The primary input surface. A textarea for the product idea plus a mode selector. On submit, validates the idea length locally (min 10, max 2000 chars) and routes to `/fast?idea=...` (Fast Check) or `/validate` with the idea stored in localStorage.
- **Props:** None (self-contained)
- **State:**
  - `idea: string` — controlled textarea value
  - `mode: "fast" | "full"` — which mode is selected
  - `error: string | null` — client-side validation error
  - `isSubmitting: boolean` — prevents double-submit
- **API calls:** None directly. Submission routes to the appropriate page, which initiates the API call.
- **localStorage:** On submit in "full" mode, calls `createSession(idea)` from `lib/session.ts` to initialize the `ValidationSession` and store it under `proveit_session`. On submit in "fast" mode, no localStorage write (Fast Check is ephemeral).
- **Behavior on submit:**
  - Fast mode: `router.push("/fast")` passing idea via URL search param (`/fast?idea=encoded_idea`)
  - Full mode: writes session to localStorage, then `router.push("/validate")`

---

### `ModeSelector` — Client Component

**File:** `/web/src/components/home/ModeSelector.tsx`

- **Type:** Client Component (`"use client"`)
- **Purpose:** Toggle between Fast Check and Full Validation. Displays a brief description of each mode. Used inside `IdeaInput`.
- **Props:**
  - `mode: "fast" | "full"`
  - `onChange: (mode: "fast" | "full") => void`
- **State:** None (controlled)
- **API calls:** None
- **localStorage:** Never

---

### `ResumeSessionBanner` — Client Component

**File:** `/web/src/components/home/ResumeSessionBanner.tsx`

- **Type:** Client Component (`"use client"`)
- **Purpose:** On mount, reads `proveit_session` from localStorage. If a session exists and is not complete, renders a banner: "You have an existing session for [ideaSummary]. [Resume] or [Start fresh]." Resume routes to `/validate`. Start fresh prompts for confirmation then clears localStorage.
- **Props:** None (self-contained)
- **State:**
  - `existingSession: ValidationSession | null`
  - `showConfirm: boolean` — confirmation dialog state for "Start fresh"
- **API calls:** None
- **localStorage:** Reads `proveit_session` on mount. Clears it when user confirms "Start fresh".
- **Render condition:** Only renders if an incomplete session exists. Returns `null` otherwise.

---

## Fast Check Route (`/fast`)

### `/web/src/app/fast/layout.tsx`

- **Type:** Server Component
- **Purpose:** Minimal layout wrapper for Fast Check pages. Sets page title via Next.js metadata API.
- **Props:** `{ children: React.ReactNode }`
- **State:** None
- **API calls:** None
- **localStorage:** Never

### `/web/src/app/fast/page.tsx`

- **Type:** Server Component
- **Purpose:** Fast Check page shell. Reads the `idea` search param from the URL. If no idea param is present, redirects to `/`. Renders static heading ("Fast Check") and mounts the `FastStream` client component, passing the idea as a prop.
- **Props:** `{ searchParams: { idea?: string } }` (Next.js convention)
- **State:** None
- **API calls:** None (delegates to `FastStream`)
- **localStorage:** Never

---

### `FastStream` — Client Component

**File:** `/web/src/components/fast/FastStream.tsx`

- **Type:** Client Component (`"use client"`)
- **Purpose:** The heart of the Fast Check UI. On mount, calls `POST /api/fast` with the idea, reads the response stream, and renders assumption cards as text arrives. Shows a loading state while the stream is establishing. Shows an error state if the request fails.
- **Props:**
  - `idea: string` — the validated idea from the URL param
- **State:**
  - `streamText: string` — accumulated raw text from the stream (for parsing)
  - `assumptions: AssumptionResult[]` — parsed assumption cards (populated as stream completes)
  - `isStreaming: boolean`
  - `isComplete: boolean`
  - `error: string | null`
- **API calls:** `POST /api/fast` on mount (one time). Uses `useStream` hook internally.
- **localStorage:** Never (Fast Check is ephemeral)
- **Children:** `AssumptionCard` (x3, after stream completes), `StreamingIndicator` (while streaming), restart link

**Parsing behavior:** The raw stream text is accumulated in `streamText`. Once `isComplete === true`, the component parses the text for assumption blocks using a regex pattern matching `**Assumption N:**` headers. Until parsing succeeds, the raw text is rendered as-is. This makes the render resilient to malformed model output — the user always sees something.

---

### `AssumptionCard` — Client Component

**File:** `/web/src/components/fast/AssumptionCard.tsx`

- **Type:** Client Component (`"use client"`) — needs interactivity for expand/collapse on mobile
- **Purpose:** Renders a single parsed assumption with verdict badge and evidence list.
- **Props:**
  - `assumption: AssumptionResult`
  - `index: number` — card number (1, 2, 3)
- **State:**
  - `isExpanded: boolean` — evidence list expand/collapse on mobile
- **API calls:** None
- **localStorage:** Never
- **Verdict color mapping:**
  - `SUPPORTED` → green badge
  - `WEAK` → amber badge
  - `CONTRADICTED` → red badge

---

### `StreamingIndicator` — Client Component

**File:** `/web/src/components/fast/StreamingIndicator.tsx`

- **Type:** Client Component (`"use client"`)
- **Purpose:** Animated indicator shown while the Fast Check stream is establishing or running. Shows a pulsing dot and "Researching your idea..." text.
- **Props:** None (rendered conditionally by `FastStream`)
- **State:** None (CSS animation only)
- **API calls:** None
- **localStorage:** Never

---

## Full Validation Route (`/validate`)

### `/web/src/app/validate/layout.tsx`

- **Type:** Server Component
- **Purpose:** Minimal layout wrapper. Sets page title via Next.js metadata API.
- **Props:** `{ children: React.ReactNode }`
- **State:** None
- **API calls:** None
- **localStorage:** Never

### `/web/src/app/validate/page.tsx`

- **Type:** Server Component
- **Purpose:** Full Validation page shell. Renders the two-column layout grid (chat panel + score panel). Mounts `ChatInterface` and `ScorePanel` as client islands.
- **Props:** None (session state is in localStorage, not URL params)
- **State:** None
- **API calls:** None (delegates to `ChatInterface`)
- **localStorage:** Never (delegates to `ChatInterface` and `SessionManager`)
- **Layout:** Two-column on desktop (chat 2/3, scores 1/3), stacked on mobile (scores collapse below chat).

---

### `ChatInterface` — Client Component

**File:** `/web/src/components/validate/ChatInterface.tsx`

- **Type:** Client Component (`"use client"`)
- **Purpose:** Orchestrates the entire Full Validation session. Reads the session from localStorage on mount. Manages message history, current phase, and scores in React state. Sends messages to `POST /api/chat` and streams responses. Writes updated session to localStorage after each exchange.
- **Props:** None (self-contained; reads from localStorage)
- **State:**
  - `session: ValidationSession | null` — loaded from localStorage on mount
  - `currentMessage: string` — the text currently being streamed
  - `isStreaming: boolean`
  - `isSearching: boolean` — true during `pause_turn` gap
  - `error: string | null`
  - `abortController: AbortController | null` — for stop button
- **API calls:** `POST /api/chat` on each user message send. Uses `useStream` hook internally.
- **localStorage:** Reads on mount via `useSession` hook. Writes after each assistant message completes (not during streaming — only committed when stream closes cleanly).
- **Children:**
  - `MessageList`
  - `SearchingIndicator` (rendered when `isSearching === true`)
  - `PhaseIndicator`
  - `ChatInput`
  - `DownloadButton` (rendered when `session.phase === "complete"`)

**Send message flow:**
1. User types in `ChatInput` and submits.
2. `ChatInterface` appends user message to `session.messages` and sets `isStreaming = true`.
3. Calls `POST /api/chat` with current messages, phase, and scores.
4. Reads stream token by token, appending to `currentMessage`.
5. Parses `data: {...}` event lines in the stream (see streaming protocol in ARCHITECTURE.md §6).
6. On `phase_change` event: updates `session.phase`.
7. On `scores` event: updates `session.scores`.
8. On `kill_signal` event: pushes to `session.killSignals`.
9. On `searching` event: toggles `isSearching`.
10. On stream close: appends the complete assistant message to `session.messages`, writes session to localStorage, sets `isStreaming = false`.
11. On error: shows error in UI, does not write to localStorage.

---

### `MessageList` — Client Component

**File:** `/web/src/components/validate/MessageList.tsx`

- **Type:** Client Component (`"use client"`)
- **Purpose:** Renders the full conversation history. Scrolls to bottom on new messages. Distinguishes user vs assistant messages.
- **Props:**
  - `messages: Message[]`
  - `streamingMessage: string | null` — the current in-progress assistant message (shown below last committed message)
- **State:**
  - `bottomRef: React.RefObject<HTMLDivElement>` — used for auto-scroll
- **API calls:** None
- **localStorage:** Never
- **Auto-scroll:** Calls `bottomRef.current?.scrollIntoView({ behavior: "smooth" })` in a `useEffect` whenever `messages` or `streamingMessage` changes.

---

### `UserMessage` — Client Component

**File:** `/web/src/components/validate/UserMessage.tsx`

- **Type:** Client Component (`"use client"`) — minimal interactivity, but collocated with other client message components
- **Purpose:** Renders a single user message bubble.
- **Props:**
  - `message: Message`
- **State:** None
- **API calls:** None
- **localStorage:** Never

---

### `AssistantMessage` — Client Component

**File:** `/web/src/components/validate/AssistantMessage.tsx`

- **Type:** Client Component (`"use client"`)
- **Purpose:** Renders a single assistant message. Applies `prose` class from `@tailwindcss/typography` for markdown-like formatting. Renders `StreamingText` when message is actively streaming.
- **Props:**
  - `message: Message`
  - `isStreaming?: boolean`
- **State:** None
- **API calls:** None
- **localStorage:** Never

---

### `StreamingText` — Client Component

**File:** `/web/src/components/validate/StreamingText.tsx`

- **Type:** Client Component (`"use client"`)
- **Purpose:** Renders text content with a blinking cursor appended while streaming is active.
- **Props:**
  - `text: string`
  - `isStreaming: boolean`
- **State:** None
- **API calls:** None
- **localStorage:** Never
- **Implementation:** Renders `text` directly. If `isStreaming`, appends a `<span>` with a CSS blinking cursor character (`▋`). The cursor disappears when `isStreaming` is false.

---

### `ChatInput` — Client Component

**File:** `/web/src/components/validate/ChatInput.tsx`

- **Type:** Client Component (`"use client"`)
- **Purpose:** Textarea + send button for the conversation. Disabled while `isStreaming` is true. Shows Stop button during streaming. Enter key submits (Shift+Enter inserts newline).
- **Props:**
  - `onSend: (message: string) => void`
  - `onStop: () => void`
  - `isStreaming: boolean`
  - `isDisabled: boolean` — true when `session.phase === "complete"`
- **State:**
  - `value: string` — controlled textarea
- **API calls:** None
- **localStorage:** Never
- **Keyboard handling:** `keydown` event — if `Enter` without Shift, and not streaming, call `onSend(value)` and clear `value`.

---

### `PhaseIndicator` — Client Component

**File:** `/web/src/components/validate/PhaseIndicator.tsx`

- **Type:** Client Component (`"use client"`)
- **Purpose:** Shows the current discovery phase as a progress indicator. Renders four labeled steps: Brain Dump → Discovery → Research → Results. Highlights the current step.
- **Props:**
  - `phase: DiscoveryPhase`
- **State:** None
- **API calls:** None
- **localStorage:** Never
- **Phase mapping:**
  - `brain_dump` → step 1 active
  - `discovery` → step 2 active
  - `research` → step 3 active
  - `findings` | `complete` → step 4 active

---

### `SearchingIndicator` — Client Component

**File:** `/web/src/components/validate/SearchingIndicator.tsx`

- **Type:** Client Component (`"use client"`)
- **Purpose:** Shown during the `pause_turn` gap when Anthropic web search is executing. Replaces the streaming cursor for the duration of the search. Shows "Searching the web..." with a pulsing animation. After 15 seconds, adds "Still searching... this can take up to 30 seconds." After 60 seconds, signals timeout.
- **Props:**
  - `isSearching: boolean`
  - `onTimeout: () => void` — called after 60 seconds to trigger error state
- **State:**
  - `elapsed: number` — seconds since `isSearching` became true
- **API calls:** None
- **localStorage:** Never
- **Implementation:** A `useEffect` starts a `setInterval` when `isSearching` becomes `true`, incrementing `elapsed` every second. Clears interval when `isSearching` becomes `false`. Calls `onTimeout` when `elapsed >= 60`.

---

### `ScorePanel` — Client Component

**File:** `/web/src/components/validate/ScorePanel.tsx`

- **Type:** Client Component (`"use client"`)
- **Purpose:** Displays the live Desirability / Viability / Feasibility scores. Updates whenever scores change in the session. Shows null scores as "—" (not yet assessed). Shows kill signal badges if any are present.
- **Props:**
  - `scores: ConfidenceScores`
  - `killSignals: KillSignal[]`
  - `phase: DiscoveryPhase`
- **State:** None (pure display)
- **API calls:** None
- **localStorage:** Never
- **Score color mapping:**
  - null → neutral (gray)
  - 1-3 → red
  - 4-5 → amber
  - 6-7 → green
  - 8-10 → bright green

---

### `DownloadButton` — Client Component

**File:** `/web/src/components/validate/DownloadButton.tsx`

- **Type:** Client Component (`"use client"`)
- **Purpose:** Generates a markdown summary of the validation session and triggers a browser file download. Only rendered when `session.phase === "complete"`.
- **Props:**
  - `session: ValidationSession`
- **State:**
  - `isGenerating: boolean` — brief loading state while markdown is built
- **API calls:** None (generation is client-side)
- **localStorage:** Never (reads session from props, not localStorage directly)
- **Implementation:** On click, calls `generateDiscoveryMarkdown(session)` from `lib/markdown.ts`. The function returns a markdown string. The component creates a Blob, generates an object URL, programmatically clicks a hidden `<a>` element to trigger the download, then revokes the object URL. Filename: `discovery-[ideaSummary slug]-[date].md`.

---

## Client Library Files

### `/web/src/lib/session.ts`

- **Type:** Client-side utility (`"use client"` context — no `"use server"`)
- **Exports:**
  - `createSession(ideaText: string): ValidationSession` — creates a new session object and writes to localStorage
  - `getSession(): ValidationSession | null` — reads from localStorage, returns null if missing or schema version mismatch
  - `updateSession(session: ValidationSession): void` — writes updated session to localStorage
  - `clearSession(): void` — removes `proveit_session` key
- **localStorage key:** `proveit_session`
- **Error handling:** All reads/writes are wrapped in try/catch. If localStorage is unavailable, `getSession()` returns null and `updateSession()` is a no-op — the session runs in memory only.

### `/web/src/lib/streaming.ts`

- **Type:** Client-side utility
- **Exports:**
  - `readStream(response: Response, onText: (chunk: string) => void, onEvent: (event: StreamEvent) => void): Promise<void>` — reads a streaming response, calls `onText` for text chunks and `onEvent` for parsed `data: {...}` lines
- **Implementation:**
  ```typescript
  const reader = response.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    // Split on newlines to find event lines
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? ""; // keep incomplete last line in buffer

    for (const line of lines) {
      if (line.startsWith("data: ")) {
        try {
          const event = JSON.parse(line.slice(6)) as StreamEvent;
          onEvent(event);
        } catch {
          // Malformed event line — ignore and continue
        }
      } else if (line.length > 0) {
        onText(line + "\n");
      }
    }
  }

  // Flush remaining buffer
  if (buffer.length > 0) {
    onText(buffer);
  }
  ```

### `/web/src/lib/markdown.ts`

- **Type:** Client-side utility
- **Exports:**
  - `generateDiscoveryMarkdown(session: ValidationSession): string` — builds the markdown summary document for download
- **Output format:**
  ```markdown
  # ProveIt: [ideaSummary]
  Generated: [date]

  ## Confidence Scores
  Desirability: X/10 | Viability: X/10 | Feasibility: X/10

  ## Kill Signals
  [if any]

  ## Conversation
  [full message history, formatted as Q&A]
  ```

---

## Custom Hooks

### `/web/src/hooks/useSession.ts`

- **Type:** Client hook (`"use client"`)
- **Purpose:** Wraps `lib/session.ts` in React state. Provides `session`, `updateSession`, and `clearSession` with automatic re-renders.
- **Used by:** `ChatInterface`, `ResumeSessionBanner`, `DownloadButton`

### `/web/src/hooks/useStream.ts`

- **Type:** Client hook (`"use client"`)
- **Purpose:** Wraps the fetch + `readStream` pattern. Manages `isStreaming`, `error`, and `abortController` state. Returns `{ startStream, stopStream, isStreaming, error }`.
- **Used by:** `ChatInterface`, `FastStream`
- **`startStream(url, body, onText, onEvent)`:** Creates a new `AbortController`, stores it in state, calls `fetch()` with the body, checks `response.ok` (throws if not), calls `readStream`.
- **`stopStream()`:** Calls `abortController.abort()`. Sets `isStreaming = false`.

### `/web/src/hooks/useSearching.ts`

- **Type:** Client hook (`"use client"`)
- **Purpose:** Tracks the `isSearching` state and elapsed time. Returns `{ isSearching, setSearching, elapsed }`. Used by `ChatInterface` to drive `SearchingIndicator`.
- **Used by:** `ChatInterface`

---

## Critical Rules (Summary)

| Rule | Why |
|------|-----|
| `import "server-only"` in `lib/anthropic.ts` and `lib/prompts.ts` | Hard build-time guard — API key cannot leak into client bundle |
| No Anthropic SDK import in any `components/` or `hooks/` file | API key is server-only |
| Route Handlers are POST only | Next.js 15 GET caching behavior, and POST correctly signals side effects |
| `isStreaming` is never written to localStorage | Transient state — a crash during streaming should not persist a broken state |
| localStorage writes happen only when stream closes cleanly | Prevents partial/corrupt session state |
| `FastStream` never writes to localStorage | Fast Check is intentionally ephemeral |
| `AbortController` is used for stop-stream | Cleanly closes the fetch connection without leaving the server-side stream orphaned |
