# ProveIt — UI Specification

**Version:** 1.0
**Date:** 2026-02-22

Screen-by-screen specifications for every state. @engineer should be able to build every component from this document without asking design questions.

All visual values reference FRONTEND_GUIDELINES.md tokens. Dimensions are logical pixels unless noted.

---

## 1. Landing Page (`/`)

### Layout

```
Mobile (375px):
┌─────────────────────────────┐
│  [PROVEIT wordmark]         │
├─────────────────────────────┤
│                             │
│  Above fold (100vh):        │
│  [Hero block]               │
│  [Entry point: Fast Check]  │
│  [Entry point: Validation]  │
│                             │
├─────────────────────────────┤
│  Below fold (optional):     │
│  [How it works — 3 steps]   │
│  [Footer]                   │
└─────────────────────────────┘

Desktop (lg+ / 1024px+):
┌─────────────────────────────────────────┐
│  [PROVEIT wordmark]                      │
├─────────────────────────────────────────┤
│                                         │
│  Left col 60%:         Right col 40%:   │
│  [Hero text]           [Fast Check box] │
│                        [Full Val box]   │
│                                         │
└─────────────────────────────────────────┘
```

### Header / Nav

- Background: transparent (over `--bg-base`)
- Height: 56px mobile, 64px desktop
- Content: wordmark "ProveIt" left-aligned, nothing else
- Wordmark: `font-mono`, `--text-xl`, `--text-primary`, font-weight 500
- No links, no buttons, no hamburger
- Position: sticky top-0, `z-index: 50`
- Border-bottom: 1px solid `--border-subtle` (appears on scroll only — add class on scroll event)

### Hero Block (Mobile — above the fold, stacked)

```
Section label: PRODUCT VALIDATION TOOL
(monospace, --text-xs, uppercase, letter-spaced, --text-secondary)

Heading: "ProveIt first,
then build it."
(--text-3xl, --text-primary, --leading-tight, font-mono, font-weight 500)

Subhead (1-2 lines):
"Products don't fail at launch. They fail at the idea,
when nobody checked the odds first."
(--text-base, --text-secondary, --leading-normal, font-mono)

Spacing: --space-6 between label and heading, --space-4 between heading and subhead
```

### Entry Points (Mobile — stacked vertically, below hero text)

Two cards, separated by `--space-4`. Each card:

```
FAST CHECK card:
┌──────────────────────────────┐
│  FAST CHECK                  │  ← section label style
│  3 assumptions. 15 minutes.  │  ← --text-base, --text-secondary
│  No back-and-forth.          │
│                              │
│  [RUN FAST CHECK]            │  ← primary button, full-width on mobile
└──────────────────────────────┘

FULL VALIDATION card:
┌──────────────────────────────┐
│  FULL VALIDATION             │  ← section label style
│  Desirability, viability,    │  ← --text-base, --text-secondary
│  feasibility. With evidence. │
│                              │
│  [START FULL VALIDATION]     │  ← secondary button style, full-width on mobile
└──────────────────────────────┘
```

Card styles:
- Background: `--bg-surface`
- Border: 1px solid `--border-default`
- Border radius: `--radius-lg`
- Padding: `--space-5`

Fast Check card: left border 3px solid `--accent` (the only decorative accent use on this page)
Full Validation card: no left border accent

Secondary button style (Full Validation CTA):
- Background: transparent
- Border: 1px solid `--border-default`
- Text: `--text-primary`, uppercase, letter-spaced
- Hover: border-color `--text-secondary`

### Desktop Layout

On `lg+`, switch to two-column layout:

- Left column (60%): wordmark (handled by header), then hero section label + heading + subhead + brief "How it works" 3-step list
- Right column (40%): stacked entry point cards (same cards, not full-width buttons — auto-width)
- Max container width: 960px, centered
- Vertical center alignment on the two-column row

How it works (left column, below subhead, optional section):

```
01  Paste your idea
    One textarea. No setup.

02  ProveIt researches
    Competitors, market evidence, viability signals.

03  You decide
    Evidence on the table. Go, kill, or pivot.
```

Style: numbered list, `--text-xs` monospace label for numbers, `--text-sm` for body, `--space-8` between items.

### Footer

Minimal. One line:

```
ProveIt — Evidence-based product validation.
```

`--text-xs`, `--text-muted`, `font-mono`. Centered. `--space-12` top margin.

---

## 2. Fast Check Flow (`/fast`)

### State 1: Input

```
┌─────────────────────────────────────────┐
│  [Header: PROVEIT wordmark]             │
├─────────────────────────────────────────┤
│                                         │
│  FAST CHECK                             │  ← section label
│                                         │
│  ┌─────────────────────────────────┐   │
│  │                                 │   │
│  │  [Textarea — auto-focused]      │   │
│  │                                 │   │
│  │                                 │   │
│  │                                 │   │
│  └─────────────────────────────────┘   │
│  0 / 1000                              │  ← char count, right-aligned, --text-muted
│                                         │
│  [RUN FAST CHECK]                       │  ← disabled until valid input
│                                         │
└─────────────────────────────────────────┘
```

Container: max-width 720px, centered, `--space-8` top padding (below header).

Section label: "FAST CHECK" — standard section label style.

Textarea:
- No label visible (label exists in DOM for a11y: `<label class="sr-only">Describe your product idea</label>`)
- Width: 100%
- Min height: 120px mobile, 160px desktop
- Auto-focuses on mount
- `--space-4` padding inside
- Does not auto-resize (resize: vertical is fine)

Character count:
- Right-aligned below textarea
- Format: "0 / 1000"
- `--text-xs`, `font-mono`, color: `--text-muted`
- When > 900: color changes to `--color-weak-fg`
- When = 1000: color changes to `--color-contradicted-fg`
- Button disables at 1001+ (textarea hard-caps at 1000 via `maxlength`)

Button:
- Full-width on mobile
- Auto-width (min 180px) on desktop, left-aligned
- Disabled state: opacity 0.4, `cursor: not-allowed`
- Transition to enabled: opacity transition `--duration-base`

### State 2: Loading / Streaming

When user clicks [RUN FAST CHECK]:

```
┌─────────────────────────────────────────┐
│  [Header]                               │
├─────────────────────────────────────────┤
│                                         │
│  [Textarea at 40% opacity]              │  ← form does not disappear
│  [Button: disabled, "Running..."]       │
│                                         │
│  ─────────────────────────────          │  ← hairline divider, --border-subtle
│                                         │
│  IDENTIFYING ASSUMPTIONS                │  ← section label, appears first
│                                         │
│  [Card skeleton 1 — shimmer]            │  ← placeholder while AI identifies assumptions
│  [Card skeleton 2 — shimmer]            │
│  [Card skeleton 3 — shimmer]            │
│                                         │
└─────────────────────────────────────────┘
```

Card skeleton:
- Same dimensions as assumption card
- Background: `--bg-surface`
- Shimmer animation: gradient sweep from left to right, 1.5s loop
- `--border-subtle` border

Once first assumption identified (0-3 seconds), real cards begin replacing skeletons from top to bottom.

### State 3: Streaming — Per Assumption Card

As each assumption streams in:

```
┌──────────────────────────────────────────┐
│  ASSUMPTION 01                           │  ← section label, top of card
│                                          │
│  [Verdict badge — blank until complete]  │
│                                          │
│  Users have this pain badly enough       │
│  to change behaviour                     │  ← assumption title streaming in, cursor at end
│                                          │
│  [SEARCHING THE WEB          . . .]      │  ← appears during web search pause
│                                          │
│  Evidence:                               │
│  - Reddit thread (r/productmanagement)   │  ← evidence streaming in after search
│    "We tried three tools..."             │
│  - ProductHunt listing: Notion           │
│    "7,400 upvotes, top comment..."       │
│                                          │
│  Source: reddit.com/r/... — Feb 2026     │  ← citation, --text-xs, --text-secondary
└──────────────────────────────────────────┘
```

Streaming cursor: appears at the end of the last streamed character in the card's active content area.

Web search indicator: replaces streaming cursor during a search. Appears inline below the assumption title, above where evidence will appear. It disappears when the search completes and the streaming cursor returns.

Verdict badge: appears (fade in, 200ms) when that assumption block is complete. The card's left border also transitions to the verdict color at the same moment.

Streaming across multiple cards: Card 2 begins appearing below Card 1 before Card 1 is necessarily complete. Each card has its own streaming state and cursor.

### State 4: Results — Complete

All three cards visible. Stream ended.

```
┌──────────────────────────────────────────┐
│  [Form — opacity 100%, re-enabled]       │
│  ─────────────────────────────────────── │
│  [Card 1 — verdict shown]               │
│  [Card 2 — verdict shown]               │
│  [Card 3 — verdict shown]               │
│                                          │
│  QUICK VERDICT                           │  ← section label
│  [Quick verdict text streams in last]    │  ← --text-base, --text-secondary
│                                          │
│  [RUN FULL VALIDATION]                   │  ← primary button
│  [CHECK ANOTHER IDEA]                    │  ← secondary button
└──────────────────────────────────────────┘
```

Quick verdict: 1-2 sentences from ProveIt. The biggest risk or the strongest signal.

Action buttons appear after quick verdict text completes. They slide up with a `card-enter` animation.

### State 5: Error

```
[Partial cards remain — do not clear]

┌──────────────────────────────────────────┐
│  Something went wrong. Try again.        │  ← --text-sm, --text-secondary
│  [TRY AGAIN]                             │  ← secondary button
└──────────────────────────────────────────┘
```

Error appears below the last visible card. The input form re-enables.

---

## 3. Full Validation Chat (`/validate`)

### State 1: Input (New Session)

Identical layout to `/fast` input state, but with different copy and a 2000 character limit.

```
┌─────────────────────────────────────────┐
│  [Header]                               │
├─────────────────────────────────────────┤
│                                         │
│  FULL VALIDATION                        │  ← section label
│                                         │
│  ┌─────────────────────────────────┐   │
│  │                                 │   │
│  │  [Textarea — auto-focused]      │   │
│  │                                 │   │
│  │                                 │   │
│  └─────────────────────────────────┘   │
│  0 / 2000                              │
│                                         │
│  [START VALIDATION]                     │  ← primary button
│                                         │
│  Takes 1-2 hours. ProveIt will ask      │  ← --text-xs, --text-muted, font-mono
│  questions, then research.              │
└─────────────────────────────────────────┘
```

### State 2: Resume Session Prompt

When localStorage has a saved session:

```
┌─────────────────────────────────────────┐
│  PREVIOUS SESSION                       │  ← section label
│                                         │
│  ┌──────────────────────────────────┐  │
│  │  A workspace management tool     │  │  ← first 80 chars of idea
│  │  for distributed teams...        │  │
│  │                                  │  │
│  │  Status: Research complete       │  │  ← phase label
│  │  Last active: 3 hours ago        │  │  ← --text-xs, --text-muted
│  └──────────────────────────────────┘  │
│                                         │
│  [RESUME SESSION]                       │  ← primary button
│  Start fresh                            │  ← text link, --text-secondary
└─────────────────────────────────────────┘
```

Session summary card: same card style as FRONTEND_GUIDELINES.md Assumption Card, but no left border accent and no verdict badge.

"Start fresh" is a text link, not a button. Clicking it shows an inline confirmation prompt directly below:

```
Start fresh? Your previous session will be cleared.
[CONFIRM]  [CANCEL]
```

Confirmation is inline — no modal.

### State 3: Chat Interface — Active

When validation starts (or session resumed), the input form transitions:

**Transition behavior:**
1. Textarea and button fade out (200ms)
2. Compact idea summary slides down from the top (below header):
   ```
   [ Idea: "A workspace management tool..." ]   [ DISCOVERY  ●  ]
   ```
   Background: `--bg-surface`, border-bottom: `--border-subtle`, padding: `--space-3 --space-4`
   Phase indicator right-aligned: current phase name + pulsing dot
3. Chat area fades in below the compact summary

**Chat layout:**

```
┌─────────────────────────────────────────┐
│  [Header]                               │
│  [Compact idea bar + phase indicator]   │
├─────────────────────────────────────────┤
│                                         │
│  ┌─────────────────────────────────┐   │  ← ProveIt message
│  │  What's the idea? Just tell me. │   │
│  └─────────────────────────────────┘   │
│                                         │
│              ┌────────────────────────┐ │  ← PM message
│              │  It's a tool for...   │ │
│              └────────────────────────┘ │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │  Who specifically has this...   │   │
│  └─────────────────────────────────┘   │
│                                         │
├─────────────────────────────────────────┤
│  ┌─────────────────────────────────┐   │  ← Input bar, sticky bottom
│  │  Type your answer...      [SEND]│   │
│  └─────────────────────────────────┘   │
└─────────────────────────────────────────┘
```

**Chat area:**
- Scrollable, fills remaining viewport height
- New messages appear at the bottom
- Auto-scrolls to bottom on each new message
- Chat area max-width: 720px, centered within the page

**ProveIt message bubble:**
- See FRONTEND_GUIDELINES.md "Chat Bubble — ProveIt" spec
- Contains streaming cursor while streaming
- Groups: consecutive ProveIt messages have no gap between them (only gap between PM groups)
- Timestamp: `--text-xs`, `--text-muted`, appears below message group on hover (desktop) or always visible (mobile)

**PM message bubble:**
- See FRONTEND_GUIDELINES.md "Chat Bubble — PM" spec
- No streaming cursor (PM messages appear immediately)

**Input bar (sticky bottom):**
- Background: `--bg-base` with 1px top border `--border-default`
- Input: `font-mono`, `--text-base`, `--bg-surface`, `--border-default`, `--radius-md`
- Placeholder: "Type your answer..."
- [SEND] button: `font-sans`, `--text-sm`, uppercase, `--accent` background
- Button disabled: when ProveIt is streaming, or input is empty
- `Return` key submits (with `shift+return` for newline)
- Input bar `padding: --space-3 --space-4`

### State 4: Research Phase

When ProveIt transitions to research:

**Phase indicator updates:** "DISCOVERY  ●" → "RESEARCH  ●" (smooth text transition)

**Research indicator block** (appears as a ProveIt chat message, but with special visual treatment):

```
┌──────────────────────────────────────────┐
│  RESEARCHING                             │  ← section label style, --text-muted
│                                          │
│  COMPETITOR LANDSCAPE      . . .         │  ← track + pulsing dots
│  MARKET EVIDENCE           . . .         │
│  VIABILITY SIGNALS         . . .         │
│                                          │
│  SEARCHING THE WEB         . . .         │  ← web search indicator, appears/disappears
└──────────────────────────────────────────┘
```

Research indicator block style:
- Same card style as ProveIt message bubbles
- Tracks: `--text-xs`, `font-mono`, uppercase, `--text-secondary`
- Pulsing dots: 3-dot animation from FRONTEND_GUIDELINES.md
- When a track completes: dots stop, track label gets a `--color-supported-fg` checkmark character (✓) in the same monospace style
- `role="status"`, `aria-live="polite"`, `aria-label="Research in progress"`

Web search indicator appears below the track list when a specific web search is running. It disappears when that search completes.

**Input bar during research:**
- Disabled
- Placeholder: "Research in progress..."
- [SEND] button hidden (replaced with nothing — the bar is visible but inactive)

### State 5: Kill Signal in Chat

Kill signals appear as embedded callout blocks within a ProveIt message:

```
ProveIt message:
┌──────────────────────────────────────────┐
│  Here's what research found:             │
│                                          │
│  ┌────────────────────────────────────┐ │  ← Kill signal callout
│  │  KILL SIGNAL                       │ │
│  │                                    │ │
│  │  Tarpit Detected                   │ │
│  │  Seven startups have tried this    │ │
│  │  exact approach since 2018. Four   │ │
│  │  are shut down. Two pivoted.       │ │
│  │                                    │ │
│  │  "The bar just got higher. Here's  │ │
│  │  what would need to be true..."    │ │
│  └────────────────────────────────────┘ │
│                                          │
│  Desirability moved from 6 to 7 (strong │
│  pain evidence). Viability stayed at 4  │
│  (no clear monetisation path found)...  │
└──────────────────────────────────────────┘
```

Kill signal callout: see FRONTEND_GUIDELINES.md "Kill Signal Callout" spec.

### State 6: Results Phase

After research completes and PM decides to proceed to outputs:

**Phase indicator updates:** "RESEARCH  ●" → "RESULTS  ●" (dots stop pulsing)

**Results block** (appears as a ProveIt chat message with structured content):

```
┌──────────────────────────────────────────┐
│  CONFIDENCE SCORES                       │  ← section label
│                                          │
│  DESIRABILITY    8/10                    │  ← see Confidence Score Display in guidelines
│  VIABILITY       5/10                    │
│  FEASIBILITY     7/10                    │
│                                          │
│  ─────────────────────────────────────── │
│                                          │
│  KILL SIGNALS                            │  ← section label (only if signals present)
│  Tarpit detected (see research above)    │  ← brief reference
│  None detected                           │  ← shown when no kill signals
│                                          │
│  ─────────────────────────────────────── │
│                                          │
│  NEXT STEPS                              │  ← section label
│  ProveIt's recommended validation        │
│  experiments...                          │
└──────────────────────────────────────────┘
```

Below the results block (outside the chat bubble, full-width):

```
┌────────────────────────────────────────────┐
│  [DOWNLOAD SUMMARY]   [GENERATE GAMMA DECK] │
└────────────────────────────────────────────┘
```

Button row:
- `--space-4` gap between buttons
- [DOWNLOAD SUMMARY]: secondary style (border, no fill)
- [GENERATE GAMMA DECK]: primary style (accent fill)
- Mobile: stack vertically, full width
- Desktop: side by side, auto width

**Gamma deck generation loading state** (inline, below buttons):

```
GENERATING PRESENTATION    . . .
```

Section label style + pulsing dots. Replaces button area while generating.

**Gamma deck complete:**

```
Your presentation is ready.
[OPEN PRESENTATION]  ← primary button, opens in new tab
```

### State 7: Swarm Research Phase

Appears after standard research if PM requests deeper analysis:

```
┌──────────────────────────────────────────┐
│  RUNNING RESEARCH SWARM                  │  ← section label
│                                          │
│  MARKET BULL           . . .             │
│  MARKET BEAR           . . .             │
│  CUSTOMER IMPACT       . . .             │
│  TECHNICAL FEASIBILITY . . .             │
│  DEVIL'S ADVOCATE      . . .             │
│                                          │
│  SEARCHING THE WEB     . . .             │
└──────────────────────────────────────────┘
```

Same visual treatment as standard research indicator. Tracks complete individually with checkmarks.

After 5 agents complete:

```
│  SYNTHESISING          . . .             │
```

Replaces the 5 tracks with a single synthesis indicator.

---

## 4. Streaming UX Details

### Characters appear

Characters render instantly as they arrive in the stream. No artificial delay between characters. The natural variation in stream speed creates the "live" feeling. Adding typewriter delays would make the product feel slower without benefit.

### Section boundaries during streaming

When ProveIt begins a new section (e.g., finishing "Assumption 01 evidence" and starting "Assumption 02"):

1. Streaming cursor disappears from the first card
2. A brief pause (natural from the stream) signals the boundary
3. Second card slides up from below (card-enter animation)
4. Streaming cursor appears at the start of the second card's content

Cards do not animate in until there is actual content to show. Never show an empty card with just a label.

### Working vs rendering state

**ProveIt is thinking / calling tools (no characters streaming):**
- Web search indicator visible (if a search is happening)
- Streaming cursor blinks at end of last content
- No other loading indicator needed — the cursor blink is the signal

**ProveIt is rendering (characters streaming):**
- Streaming cursor visible, advancing with each character
- No other loading indicator

**ProveIt has finished a section:**
- Streaming cursor disappears
- Verdict badge fades in (Fast Check) or message bubble closes (Full Validation)

### Multi-section streaming (Full Validation)

In Full Validation, a ProveIt message may contain multiple paragraphs and a structured block (like confidence scores). The streaming cursor is always at the end of the current active line. Structured content (like the confidence score table) appears as a single unit once all its lines have streamed, not character by character within the table.

### The 2-10 second web search pause

This is the most important gap to handle. When the AI makes a web search tool call, there can be 2-10 seconds of silence in the stream. Without a visible indicator, users will think the app has frozen.

**Required behavior:**
1. Stream begins
2. AI makes a search tool call — stream pauses
3. Within 500ms of the stream pausing: "SEARCHING THE WEB" indicator appears
4. Stream resumes with search results
5. Within 200ms of stream resuming: indicator disappears
6. Streaming cursor reappears

The 500ms delay before showing the indicator prevents a flash of the indicator for very fast searches.

**Detection:** Monitor for gaps in the stream. If no characters have arrived for 500ms and the stream is not ended, show the indicator.

---

## 5. Responsive Behavior Summary

### Mobile (< 640px)

- Single column layout everywhere
- Full-width buttons
- Chat bubbles max-width 92% of container
- Assumption cards: full-width, stacked
- Results score display: label and score on same row, full width
- Input textarea: min-height 120px
- Header height: 56px

### Tablet (640px - 1023px)

- Landing: single column (same as mobile but more whitespace)
- Fast/Validate: max-width 640px, centered
- Chat bubbles max-width 84% (same as desktop)
- Some padding increases to `--space-6`

### Desktop (1024px+)

- Landing: two-column layout (hero left, entry points right)
- Fast/Validate: max-width 860px, centered
- Three assumption cards: optionally side by side on xl+ (if space allows; single column is also acceptable)
- Chat area max-width 720px within the 860px container

### Wide Desktop (1280px+)

- Max content width: 960px, centered on page
- No further layout changes — wider margins just have more `--bg-base` visible
