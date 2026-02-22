# ProveIt — App Flow

**Version:** 1.0
**Date:** 2026-02-22

This document maps every user journey through the ProveIt web app. @engineer uses these flows to understand state transitions, what data persists, and where error recovery is needed.

---

## Overview: Entry Points

```
proveit.com (/)
├── [RUN FAST CHECK] → /fast
└── [START FULL VALIDATION] → /validate
```

Session state is stored in `localStorage`. There is no user account system. State is per-browser.

---

## Flow 1: Landing → Fast Check → Results

### Step-by-step

```
1. User lands on / (homepage)
   State: no localStorage session key present
   Display: hero + two entry points (Fast Check, Full Validation)

2. User clicks [RUN FAST CHECK]
   Navigation: route to /fast
   State: no prior session — show input form

3. /fast — Input state
   Display:
   - Section label: FAST CHECK
   - Textarea: empty, focused on mount
   - Placeholder text in textarea
   - Character count: 0 / 1000
   - Button [RUN FAST CHECK]: disabled (no input)

4. User types their idea
   Display:
   - Character count updates live
   - Button [RUN FAST CHECK]: enabled when input length > 20 chars
   - Button remains disabled if only whitespace

5. User clicks [RUN FAST CHECK]
   Transition: input form fades to 40% opacity (still visible, not removed)
   State: loading begins

6. Loading state — assumption identification (2-3 seconds)
   Display: (appears below faded input)
   - Section label: IDENTIFYING ASSUMPTIONS
   - Three placeholder card skeletons (shimmer)

7. Streaming state — first assumption begins
   Display:
   - Assumption 1 card appears (slide up + fade in)
   - Section label: ASSUMPTION 01
   - Verdict badge: not yet shown
   - Assumption title: streams in character by character
   - Streaming cursor visible at end of text

8. Web search pause (2-10 seconds mid-stream)
   Trigger: when AI makes a web search tool call
   Display: (appears inline within card, below the assumption title)
   - SEARCHING THE WEB label + three pulsing dots
   - This replaces the streaming cursor temporarily

9. Evidence streams in
   Display:
   - Streaming cursor returns after search indicator disappears
   - Evidence text streams in below assumption title
   - Source citations appear as they arrive

10. Verdict appears
    Trigger: when that assumption's block is complete
    Display:
    - Verdict badge fades in at top of card: SUPPORTED / WEAK / CONTRADICTED
    - Left border of card takes on verdict color (color transitions in over 300ms)

11. Assumption 2 card begins
    Display: second card slides up while first card is now complete
    Same sequence as steps 7-10

12. Assumption 3 card completes
    Trigger: entire stream ends

13. Results state — complete
    Display:
    - All three cards visible, all verdicts shown
    - Input form: opacity returns to 100%
    - Quick verdict summary appears below the three cards (streams in last)
    - Three action options appear:
      a. [RUN FULL VALIDATION] — primary button
      b. [CHECK ANOTHER IDEA] — secondary (clears form, scrolls to top)
      c. [START OVER] — text link

14. User takes an action
    a. [RUN FULL VALIDATION] → /validate?idea=[encoded idea text]
    b. [CHECK ANOTHER IDEA] → clears form, resets to step 3
    c. [START OVER] → same as b
```

### Error States

```
Input too short (< 20 chars after trim):
- Button stays disabled
- No error message shown (button disabled is the signal)

Network error mid-stream:
- Streaming stops
- Error message appears below last card: "Something went wrong. Try again."
- [TRY AGAIN] button: resubmits same input without clearing form
- Partial cards remain visible (do not clear)

API rate limit / timeout:
- Same error treatment as network error
- Error message: "Taking longer than expected. Try again in a moment."

Empty response (AI returns nothing):
- Error message: "No response received. Try again."
- [TRY AGAIN] button
```

---

## Flow 2: Landing → Full Validation → Discovery Chat → Research → Results → Download

### Step-by-step

```
1. User lands on / (homepage)

2. User clicks [START FULL VALIDATION]
   Navigation: route to /validate
   State: no prior session — show input form

3. /validate — Input state
   Display:
   - Section label: FULL VALIDATION
   - Textarea: empty, focused on mount
   - Placeholder text (different from Fast Check)
   - Character count: 0 / 2000
   - Button [START VALIDATION]: disabled
   - Note below button: "Takes 1-2 hours. ProveIt will ask questions, then research."

4. User types their idea, clicks [START VALIDATION]
   Transition: textarea and button slide up to become a sticky header (compressed)
   Chat interface slides up from below
   State: discovery phase begins

5. Discovery phase — Chat interface
   Display:
   - Chat area fills screen
   - ProveIt sends first message (Brain Dump phase)
   - Message streams in, streaming cursor visible
   - Input bar at bottom: text input + [SEND] button, disabled until ProveIt finishes streaming

6. ProveIt asks a question
   Display:
   - ProveIt message complete, streaming cursor disappears
   - Input bar enables
   - Placeholder: "Type your answer..."

7. User types and sends a response
   Display:
   - User message appears as right-aligned chat bubble
   - Input bar clears and temporarily disables
   - ProveIt begins streaming response (next question or summary)

8. Discovery continues (repeat steps 6-7, typically 6-10 exchanges)
   State: discovery.md is being built in memory (not persisted to disk — this is the web app)

9. Research phase transition
   Trigger: ProveIt determines enough context to begin research
   Display:
   - ProveIt sends a transition message: "I have what I need. Researching now — give me a few minutes."
   - Input bar becomes disabled and shows: "Research in progress..."
   - Research indicator appears in chat below the transition message

10. Research in progress
    Display (research indicator block):
    - RESEARCHING label (monospace, muted)
    - Three active tracks shown as a list:
      COMPETITOR LANDSCAPE    [pulsing]
      MARKET EVIDENCE         [pulsing]
      VIABILITY SIGNALS       [pulsing]
    - Individual "SEARCHING THE WEB" indicators appear and disappear as searches run

11. Research phase completes — Findings review
    Display:
    - Research indicator block gets a checkmark-style "done" treatment: tracks go from pulsing to static
    - ProveIt sends findings message
    - Message streams in (confidence score update, key findings summary)
    - Kill signals (if any) appear as visually distinct callout blocks within the ProveIt message

12. Kill signal handling
    Trigger: if a kill signal is surfaced
    Display:
    - Kill signal callout appears embedded in ProveIt's message
    - Text: clear, honest statement of what the evidence shows
    - Below: "The bar for pursuing this just got higher. Here's what would need to be true..."
    - Input bar re-enables (PM decides what to do next)

13. PM reviews findings — decision point
    ProveIt offers options in its message:
    a. Run a deeper research swarm on the weakest assumption
    b. Continue to generate outputs (if confidence is sufficient)
    c. Ask follow-up questions / add information
    d. Stop here

14. If PM chooses Swarm
    Display:
    - ProveIt sends swarm question for confirmation
    - PM approves → research indicator reappears with: RUNNING RESEARCH SWARM
    - 5 agent tracks shown (Market Bull, Market Bear, Customer Impact, Technical Feasibility, Devil's Advocate)
    - Synthesis phase: single "SYNTHESISING" indicator
    - Swarm results stream in as ProveIt message

15. Results phase
    Trigger: PM says ready for outputs, or ProveIt determines confidence sufficient
    Display:
    - ProveIt sends final summary message
    - Confidence score display appears as a structured block (not prose):
      DESIRABILITY  [score]/10
      VIABILITY     [score]/10
      FEASIBILITY   [score]/10
    - Kill signals summary (if any)
    - Below the score block: [DOWNLOAD SUMMARY] button + [GENERATE GAMMA DECK] button

16. Download
    [DOWNLOAD SUMMARY]: generates and downloads discovery.md as a text file
    Name: proveit-[slug-of-idea]-[date].md

17. Gamma Deck
    [GENERATE GAMMA DECK]: triggers Gamma API call
    Display: "Generating your presentation..." loading state
    On complete: "Your deck is ready." + link opens in new tab
```

### Error States

```
Research phase timeout (> 10 minutes):
- Research indicator shows a "Taking longer than expected" note
- Input bar re-enables
- ProveIt message: "Research is taking longer than usual. You can wait, or I can share what I've found so far."
- PM can choose to continue or review partial results

Swarm agent failure:
- Swarm continues with remaining agents
- Synthesis note: "One research track returned incomplete results. Synthesis is based on [N] of 5 agents."

Gamma deck generation failure:
- Error message inline: "Presentation generation failed. Try again."
- [RETRY] button below

Download failure:
- Toast notification: "Download failed. Try again."

Connection lost mid-chat:
- Toast: "Connection lost. Your progress is saved. Reconnect to continue."
- When reconnected: chat history restores from localStorage, ProveIt resumes
```

---

## Flow 3: Returning User with Saved Session

### Scenario: User has a previous Full Validation session in localStorage

```
1. User navigates to /validate
   State: localStorage contains session data (idea text, chat history, phase, confidence scores)

2. /validate — Resume state
   Display (instead of blank input):
   - Section label: PREVIOUS SESSION
   - Session summary card:
     Idea: [first 80 characters of idea + "..."]
     Status: [Discovery / Research / Results]
     Last active: [relative time, e.g. "3 hours ago"]
   - Two options:
     [RESUME SESSION]  — primary button
     [START FRESH]     — secondary button (text style)

3a. User chooses [RESUME SESSION]
    Display:
    - Chat history loads (all previous messages visible)
    - User scrolled to bottom (most recent message)
    - If session was mid-discovery: input bar enabled, ProveIt resumes
    - If session was mid-research: research indicator shown (but now complete — ProveIt picks up from findings)
    - If session was at results: results state shown with download button

3b. User chooses [START FRESH]
    Display:
    - Confirmation: "Start fresh? Your previous session will be cleared." + [CONFIRM] [CANCEL]
    - On confirm: localStorage cleared, blank input form shown
    - On cancel: resume prompt returns

4. Session expires (localStorage cleared by browser, or > 7 days old)
   Display: blank input form (standard new session state)
   No error message — just the normal new session experience
```

### Scenario: User navigates to /fast with no prior Fast Check session

```
Standard flow — no resume state for Fast Check.
Fast Check does not persist to localStorage (it is intentionally stateless).
```

---

## Flow 4: Error Recovery

### Global error states

```
JavaScript error / white screen:
- Error boundary catches render errors
- Display: "Something went wrong. Reload the page to continue."
- [RELOAD PAGE] button
- Session data in localStorage is preserved — user can resume after reload

API key error / backend unavailable:
- Detected on first API call
- Display: "ProveIt is unavailable right now. Try again in a moment."
- No retry loop — user must manually refresh

Request rejected (content moderation):
- Rare but possible
- Display: "That idea couldn't be processed. Try rephrasing it."
- Input form resets to allow re-entry (previous input retained in textarea)
```

### Form validation

```
Textarea empty or whitespace only:
- Button stays disabled
- No error message shown

Textarea > character limit:
- Character counter turns red (--color-contradicted-fg)
- Button disables
- No toast or modal — character counter is the signal
- User can trim their input to re-enable button

Textarea exactly at limit:
- Character counter shows 1000/1000 in --color-weak-fg (amber)
- Button remains enabled (at limit is acceptable)
```

---

## State Persistence (localStorage)

```
Key: proveit_session
Value: JSON object

{
  version: "1",
  mode: "validate",         // "fast" not persisted
  idea: "...",              // original idea text
  phase: "discovery",       // discovery | research | results
  messages: [              // array of {role: "proveit"|"pm", content: "...", timestamp: "..."}
    { role: "proveit", content: "...", timestamp: "..." },
    { role: "pm", content: "...", timestamp: "..." }
  ],
  scores: {                // updated after each research round
    desirability: null,
    viability: null,
    feasibility: null
  },
  killSignals: [],         // array of {title: "...", evidence: "..."}
  researchComplete: false,
  createdAt: "...",
  updatedAt: "..."
}
```

Session is saved to localStorage after every PM message sent and every ProveIt message received. If the user closes the tab mid-stream, the partial ProveIt message is not saved.

---

## Navigation Rules

- There is no global navigation bar on `/fast` or `/validate` during an active session. The ProveIt wordmark in the header is the only nav element.
- Clicking the wordmark during an active session shows a confirmation: "Leave this session? Your progress will be saved." — then navigates to `/`.
- The browser back button during an active session triggers the same confirmation.
- `/fast` and `/validate` do not share session state. They are independent flows.
