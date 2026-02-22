## Code Review: ProveIt Web App

**Reviewer:** Code Review Agent
**Date:** 2026-02-22
**Scope:** All source files in `src/` — API routes, lib, hooks, components, pages

---

### Summary

Solid foundational architecture with the security-critical paths done correctly, but there are four shippable bugs, several unfinished TODOs that will reach the browser, a meaningful streaming protocol deviation, and one security validation gap that contradicts the spec. Tests passing is not the same as correct.

---

### Must Fix (blocks ship)

#### 1. `ModeSelector` renders a raw `TODO:` string to users

**File:** `src/components/home/ModeSelector.tsx`, line 14

```tsx
<p>TODO: Implement ModeSelector — mode: {mode}, see COMPONENT_TREE.md</p>
```

This component is not currently rendered on the homepage (the homepage uses card links directly), but it is shipped in the bundle and could be introduced accidentally. More importantly: the spec lists `ModeSelector (Client)` as a named component in `§2 Component Diagram`. If any future code path renders it, users see raw engineering notes. Either complete it or remove it. It cannot ship as-is.

---

#### 2. `sessionId` regex validation is present but does NOT reject all injection-relevant characters

**File:** `src/app/api/chat/route.ts`, lines 18-19

```typescript
.regex(/^[a-zA-Z0-9-]+$/, "Invalid session ID"),
```

This correctly rejects most characters. However, `nanoid` — the client-side ID generator — produces IDs using the character set `A-Za-z0-9_-`. The underscore `_` is in nanoid's default alphabet but is rejected by this regex. This means **every chat request will fail validation** because the sessionId generated client-side (`nanoid()` in `src/lib/session.ts` line 13) will frequently contain underscores that the server rejects.

The spec says `alphanumeric + hyphens only` for sessionId. Either the spec must be updated to permit underscores, or nanoid must be configured with a custom alphabet. As written, the regex and the ID generator are incompatible — the chat route is broken for any sessionId containing `_`.

Verify: `nanoid()` default alphabet = `useURLAlphabet` = `A-Za-z0-9_-`. Underscores will appear.

---

#### 3. Fast Check passes the idea in `messages` but the route uses a `user` role message directly — client-side `MAX_CHARS` is 1000, not 2000

**File:** `src/components/fast/FastInput.tsx`, line 6

```typescript
const MAX_CHARS = 1000;
```

The architecture spec (§6, `FastCheckSchema`) defines the max as `2000` characters. The route handler validates up to 2000 (`z.string().min(10).max(2000)`). The client enforces 1000. This means:

- Users who type 1001–2000 characters see a client-side error saying "Please keep your idea under 1000 characters" and cannot submit — but the API would accept it.
- The Fast Check feature is silently half-locked.

This is a product-correctness bug. The client cap should match the API cap (2000), or the API cap should be updated to match the client (1000) and the spec revised. One of the two must be authoritative — currently neither is.

---

#### 4. The `searching:false` event logic in `/api/chat` fires on the FIRST text block, not only on text blocks following a search

**File:** `src/app/api/chat/route.ts`, lines 103–116

```typescript
if (
  event.type === "content_block_start" &&
  "content_block" in event &&
  event.content_block?.type === "text"
) {
  if (!textBlockStarted) {
    textBlockStarted = true;
  } else {
    // A new text block after search — signal searching stopped
    controller.enqueue(
      encoder.encode('\ndata: {"type":"searching","active":false}\n')
    );
  }
}
```

The logic emits `searching:false` on the second or later text block. But `textBlockStarted` is reset to `false` when a tool_use block is detected (line 99). The scenario where the model begins with a tool use call immediately (no leading text) will never set `textBlockStarted = true` before resetting it, so the first post-search text block will be flagged as `!textBlockStarted` and will NOT emit `searching:false`.

Walk-through of the case "tool use fires immediately":
1. `content_block_start` tool_use → emit `searching:true`, `textBlockStarted = false`
2. `content_block_start` text → `!textBlockStarted` is true → set `textBlockStarted = true`, no `searching:false` emitted

The `SearchingIndicator` will stay active until the 15-second secondary message shows, then the 60-second timeout fires. The spec says `searching:false` must be emitted when text resumes after the search. This does not happen in the tool-use-first case.

---

### Should Fix

#### 5. `/api/fast` does not emit a `data: {"type":"done"}` event

**File:** `src/app/api/fast/route.ts`

The `/api/chat` route correctly emits `\ndata: {"type":"done"}\n` after the stream loop (line 132). The `/api/fast` route does not. The `FastStream` component handles `done` events via `handleEvent` (line 108–110), setting `isComplete = true`. Without the event, completion is detected only via the `startStream` promise resolving (line 125), which sets `isComplete = true` after the await. This is functionally adequate but inconsistent with the streaming protocol defined in `ARCHITECTURE.md §6`. Adds fragility if the component is ever refactored to rely on the event rather than the promise.

---

#### 6. Incomplete `searching:false` on stream end — `SearchingIndicator` can stay visible if stream ends while searching

**File:** `src/components/fast/FastStream.tsx`, lines 105–114; `src/hooks/useStream.ts`

If the stream ends (the `finally` block in `useStream.startStream`) while `isSearching === true`, neither component emits a cleanup `setIsSearching(false)` from the stream resolution path. `FastStream.handleEvent` only resets `isSearching` on `done` or `error` events. If the stream closes without those events (connection drop, abort), `isSearching` stays `true` and the `SearchingIndicator` never hides.

The `handleEvent` registered in `FastStream` does call `setIsSearching(false)` on `error`, but connection drops don't produce stream events. The `useStream` catch block sets `setError`, but `FastStream` doesn't clear `isSearching` in response to the `error` prop changing. The fix requires clearing `isSearching` when `error` becomes truthy or when the stream promise resolves/rejects.

---

#### 7. `useSearching` hook is never used — dead code

**File:** `src/hooks/useSearching.ts`

This hook exists in `src/hooks/` and encapsulates exactly the elapsed-timer logic that `SearchingIndicator.tsx` reimplements inline. `SearchingIndicator` does not import or use `useSearching`. The hook is dead code and will confuse anyone who reads `src/hooks/` expecting it to be in use. Either wire it up (the `SearchingIndicator` is the right consumer) or delete it. Shipping dead hooks makes the next engineer's job harder.

---

#### 8. `IdeaInput` component renders `null` — dead component

**File:** `src/components/home/IdeaInput.tsx`

This is listed in the architecture diagram as a component (`IdeaInput (Client) — textarea + mode toggle`). The implementation is an empty shell that returns `null` with a comment saying entry is handled via card links. It is imported nowhere in the codebase. This is fine for the current homepage design, but the file should either be removed or its comment should clearly mark it as intentionally deprecated. Leaving a component that matches a spec name but does nothing is a trap.

---

#### 9. Streaming text protocol mismatch: text lines vs raw chunks

**File:** `src/lib/streaming.ts`, lines 37–39

```typescript
} else if (line.length > 0) {
  onText(line + "\n");
}
```

The stream reader splits on `\n`, strips event lines, and re-appends `\n` to each remaining line. This is structurally correct but means the client reconstructs the text as line-by-line instead of chunk-by-chunk. The problem: a text delta that does not end with `\n` (which is almost all mid-sentence deltas) will be held in `buffer` until the next newline arrives, introducing latency. The streaming cursor will appear to jump forward in chunks at line boundaries rather than token by token. This is not a correctness bug but noticeably degrades the "streaming feels live" UX that the spec emphasizes (§3 Product Harness Layer).

The architecture spec says "Text deltas are appended to the current message in React state as they arrive — no buffering, no waiting for the full response." The current implementation buffers until newlines, which contradicts this.

---

#### 10. Anthropic errors in `/api/fast` are returned mid-stream, not as HTTP error codes

**File:** `src/app/api/fast/route.ts`, lines 60–91

When an Anthropic error occurs before any text has been streamed, the response has already committed `200 OK` with `Content-Type: text/plain`. Error details are sent as `data: {"type":"error",...}` lines. The `FastStream` component handles this via `handleEvent`, which is correct. However, the ARCHITECTURE.md §6 specifies that pre-stream errors should return non-streaming HTTP error codes (400, 429, 503). The current implementation always returns 200 and embeds errors in the stream body regardless of whether text has started flowing.

For `/api/fast`, this means the client can never distinguish "API key is wrong" from "streaming" at the HTTP level — both return 200. The architecture spec explicitly separates "pre-stream errors" (non-streaming with HTTP codes) from "mid-stream errors" (error sentinel in stream). This deviation is acceptable as an MVP simplification but should be documented as a known deviation.

---

#### 11. `DownloadButton` silently swallows errors

**File:** `src/components/validate/DownloadButton.tsx`, lines 38–40

```typescript
} catch {
  // Could show a toast here — keeping simple for MVP
}
```

A failed download gives the user no feedback. The button label returns to "DOWNLOAD SUMMARY" and nothing appears to have happened. For a feature that represents the end-state deliverable of the full validation flow, silent failure is not acceptable. The TODO comment acknowledges this. This needs at least an inline error message before shipping.

---

#### 12. `scores` validation allows `0` via the route but 0 is semantically invalid per the scoring guide

**File:** `src/app/api/chat/route.ts`, line 29

```typescript
desirability: z.number().min(1).max(10).nullable(),
```

This correctly uses `.min(1)`. Good. However the spec in `ARCHITECTURE.md §6` says `z.number().min(1).max(10).nullable()`, so this matches. No issue.

---

#### 13. Multiple TODO comment headers in shipped files

Files with TODO comments that will be visible to future developers but were not completed before ship:

| File | TODO |
|------|------|
| `src/lib/session.ts:1` | "Implement localStorage session management" — but it IS implemented; stale TODO |
| `src/lib/session.ts:11` | "Implement full session creation" — implemented; stale |
| `src/lib/session.ts:35` | "Add schema version migration if needed" — the discard-and-restart behavior IS the migration strategy; TODO is misleading |
| `src/lib/markdown.ts:1` | "Implement discovery.md generator" — implemented; stale |
| `src/lib/streaming.ts:1` | "Implement stream reader utility" — implemented; stale |
| `src/hooks/useSession.ts:2` | "Implement useSession hook" — implemented; stale |
| `src/hooks/useStream.ts:2` | "Implement useStream hook" — implemented; stale |
| `src/app/fast/layout.tsx:1` | "Implement Fast Check layout" — implemented; stale |
| `src/app/validate/layout.tsx:1` | "Implement Full Validation layout" — implemented; stale |

These are all stale scaffolding comments — the code was written but the header comment was not removed. Not a bug, but unprofessional on a production codebase and should be cleaned before ship.

---

### Nice to Have

#### 14. `getRelativeTime` is duplicated

**Files:** `src/components/home/ResumeSessionBanner.tsx` and `src/components/validate/ChatInterface.tsx` (inside `IdeaInputForm`)

Identical function, implemented twice. Move to a shared util.

---

#### 15. The `phase` prop is unused in `ChatInput` for purposes beyond the `isResearch` check

**File:** `src/components/validate/ChatInput.tsx`, line 11

`phase?: DiscoveryPhase` is typed as the full phase union but only used to check `phase === "research"`. The prop could be typed as `boolean` (`isResearchPhase`) to reduce coupling, or left as-is with no functional impact.

---

#### 16. `AssumptionCard` uses array index as React key

**File:** `src/components/fast/FastStream.tsx`, line 210

```tsx
<AssumptionCard key={idx} ...>
```

Since assumptions are streamed in order and never reordered, this is not causing any real rendering issue today. But it is a lint warning and fragile. Keys from the assumption text or index-as-string would be more idiomatic.

---

#### 17. `aria-label` and `aria-hidden` conflict on streaming cursor

**File:** `src/components/validate/StreamingText.tsx`, lines 13–16

```tsx
<span
  className="streaming-cursor"
  aria-hidden="true"
  aria-label="ProveIt is typing"
/>
```

`aria-hidden="true"` tells screen readers to ignore the element. `aria-label` on an `aria-hidden` element is ignored. The accessible announcement of "ProveIt is typing" belongs on the parent container (the `aria-busy` attribute on `AssistantMessage`), which is already set. Remove the `aria-label` from the cursor span — it does nothing and is misleading to future developers.

---

### Security Check

**API key exposure: Pass**

`src/lib/anthropic.ts` has `import "server-only"` on line 1. It is never imported by any `"use client"` file. Both route handlers also include `import "server-only"`. The API key is only accessed via `process.env.ANTHROPIC_API_KEY` in a server-only module. No key or key-related error message appears in any response body. This is correctly implemented.

**Input validation: Partial Pass — one gap**

Both routes use Zod before touching the Anthropic client. The Zod schemas match the spec with one exception: `sessionId` uses `/^[a-zA-Z0-9-]+$/` which rejects the underscore character from nanoid's default alphabet (see Must Fix #2). All other validation — min/max lengths, enums, message array bounds, content length limits — matches the spec exactly. The `.trim()` on the `idea` field in `/api/fast` is present as required. Content whitespace stripping is present.

The `idea` field in `/api/fast` is trimmed (`z.string().trim()`) before validation, matching the spec. The `messages[].content` fields are not trimmed server-side, but this is acceptable since messages are chat turns where leading/trailing whitespace may be intentional.

**Prompt injection: Documented risk (acceptable for MVP)**

User-supplied content goes into the `messages` array, not the system prompt. The system prompt is hardcoded in `src/lib/prompts.ts` and is not interpolated with user input — only the known-safe `phase` and `scores` values are interpolated (lines 100–101 of `prompts.ts`). These are validated enum and number values, not user strings. The architecture acknowledges this risk explicitly in §9.

No additional sanitization is applied to message content beyond Zod's `.max(10000)` character limit. This is the documented MVP posture: accept the risk, limit vector surface via max length.

**XSS prevention: Pass**

No `dangerouslySetInnerHTML` usage anywhere in the codebase. AI response text is rendered as plain text in all components. `StreamingText` renders `{text}` as a React text node. `UserMessage` and `AssistantMessage` do the same. The `@tailwindcss/typography` `prose` class is applied in `AssistantMessage` but only for styling — no HTML injection occurs. React's default escaping handles XSS prevention.

**Rate limiting: Documented gap**

No rate limiting is implemented. The architecture spec §9 explicitly documents this as an intentional MVP omission with a post-MVP recommendation. The gap is documented — it is not an undocumented oversight. The Anthropic API's own limits act as a backstop.

---

### Verdict

**Fix and re-review.**

Two of the four Must Fix issues are functional blockers: the `sessionId` regex incompatibility with nanoid will cause all Full Validation chat requests to return 400 validation errors (the feature does not work), and the `searching:false` timing bug in the research phase stream handler will leave the `SearchingIndicator` permanently active in the most common tool-use-first scenario. These are not edge cases — they are on the primary happy path.

The `ModeSelector` rendering a TODO string and the Fast/API character limit mismatch are lower severity but unacceptable for a shipped product.

Fix the four Must Fix items and address the `searching:false` cleanup on stream end (Should Fix #6). The rest can ship with the first post-launch patch.
