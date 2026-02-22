# ProveIt Web — Tech Stack

**Version:** 1.0
**Date:** 2026-02-22
**Status:** Locked for MVP

All versions are the current stable releases as of 2026-02-22. Pin these in `package.json`. Do not upgrade to a new major version without an explicit architecture review.

---

## Core Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `next` | `15.3.0` | App Router, Route Handlers, server components |
| `react` | `19.0.0` | UI rendering |
| `react-dom` | `19.0.0` | DOM rendering |
| `typescript` | `5.9.3` | Type safety across all layers |
| `@anthropic-ai/sdk` | `0.39.0` | Anthropic API client — server-side only |
| `zod` | `3.25.23` | Input validation in Route Handlers |
| `server-only` | `0.0.1` | Build-time guard preventing server modules from being imported by Client Components |
| `nanoid` | `5.1.5` | Collision-resistant ID generation for session and message IDs (client-safe, tiny) |

---

## UI Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `tailwindcss` | `4.1.8` | Utility-first CSS |
| `@tailwindcss/typography` | `0.5.16` | Prose styles for markdown rendering in the chat |
| `lucide-react` | `0.511.0` | Icon library used by shadcn/ui components |
| `class-variance-authority` | `0.7.1` | Variant utility used by shadcn/ui |
| `clsx` | `2.1.1` | Conditional className composition |
| `tailwind-merge` | `3.3.0` | Merge conflicting Tailwind classes safely |

shadcn/ui components are copied directly into `/web/src/components/ui/` via the shadcn CLI — they are not a runtime npm dependency. Do not add `shadcn-ui` or `@shadcn/ui` as a package dependency.

---

## Dev Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `@types/node` | `22.15.21` | Node.js type definitions |
| `@types/react` | `19.1.5` | React type definitions |
| `@types/react-dom` | `19.1.3` | React DOM type definitions |
| `eslint` | `9.28.0` | Linting |
| `eslint-config-next` | `15.3.0` | Next.js ESLint rules |
| `postcss` | `8.5.4` | CSS processing for Tailwind |
| `autoprefixer` | `10.4.21` | Vendor prefix addition |
| `vitest` | `3.2.4` | Unit testing |
| `@vitejs/plugin-react` | `4.5.2` | React plugin for Vitest |
| `@testing-library/react` | `16.3.0` | Component testing utilities |
| `@testing-library/user-event` | `14.6.1` | Simulated user interactions in tests |

---

## Runtime Requirements

| Requirement | Version |
|-------------|---------|
| Node.js | 20.x or higher (required by Next.js 15) |
| npm | 10.x or higher |

---

## Explicitly Excluded Packages

| Package | Why Excluded |
|---------|-------------|
| `@ai-sdk/react` | The Vercel AI SDK's `useChat` hook buffers responses before yielding them, breaking real-time streaming. The custom streaming implementation in this project is 30 lines and does not need the SDK's overhead. |
| `ai` (Vercel AI SDK core) | Same reason as `@ai-sdk/react`. The streaming pattern from the research findings uses the raw Anthropic SDK iterator — no Vercel AI SDK required. |
| `tavily` / `@tavily/core` | Anthropic's native web search tool (`web_search_20250305`) covers the research use case without an additional API key or dependency. |
| `firecrawl-js` | Firecrawl is used in the Claude Code plugin via MCP. The web app uses Anthropic's native web search instead — one dependency instead of two. |
| `next-auth` / `@auth/*` | No authentication in this product. Adding auth would require a database and user model. Out of scope for MVP. |
| `@supabase/supabase-js` | No database. Session state lives in localStorage. Adding Supabase would require auth (see above). |
| `prisma` / `drizzle-orm` | No database. |
| `redis` / `ioredis` | No server-side session management. Stateless Route Handlers. |
| `openai` | Anthropic SDK only. Never mix providers in a single product without explicit architectural justification. |
| `marked` / `react-markdown` | The streaming text output is plain text with minimal markdown formatting. Using `@tailwindcss/typography` with `prose` classes handles the display. A full markdown parser adds weight without benefit for this use case. If richer markdown rendering is needed in a future version, evaluate `react-markdown` at that point. |
| `socket.io` / `pusher` | Streaming is handled via fetch + ReadableStream, which works in all modern browsers and does not require WebSocket infrastructure. |
| `@sentry/nextjs` | Not included in MVP. Add in the first production hardening pass if error tracking is needed. |
| `react-query` / `@tanstack/react-query` | Server state management is not needed — all data fetching is ad-hoc streaming fetch calls. React state + localStorage is sufficient. |

---

## Environment Variables

```
# .env.local (never committed)
ANTHROPIC_API_KEY=sk-ant-...
```

No other environment variables are required for the MVP. Document any additions here before implementing.

---

## Deployment Target

**Platform:** Vercel
**Region:** Auto (Vercel selects based on proximity)
**Edge Runtime:** Not used — Route Handlers run in the Node.js runtime (required for `@anthropic-ai/sdk` which uses Node.js APIs)

Add to `next.config.ts` to prevent accidental Edge runtime usage:
```typescript
// Explicitly declare Node.js runtime for API routes
// (Next.js default — but explicit is better than implicit)
export const config = {
  api: {
    bodyParser: false, // we parse manually in Route Handlers
  },
};
```

Route Handler runtime must be declared as `nodejs` (not `edge`) because the Anthropic SDK uses Node.js built-ins.
