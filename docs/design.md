# ProveIt — Design Document

**Version:** POC
**Date:** 2026-02-07
**Author:** Claire Donald

## What is ProveIt?

ProveIt is a Claude Code plugin that helps product managers validate ideas before committing technical resources. It takes a raw idea through Desirability (do users want it?), Viability (can it be a business?), and light Feasibility (how big is the build?) — then generates a Gamma presentation for technical handoff.

**Tagline:** "ProveIt first, then ShipIt."

## The Problem

PMs have ideas but no structured way to validate them before pulling in engineers. They either:
- Skip validation and jump to building (waste)
- Do ad-hoc research that's inconsistent and gets lost
- Write PRDs based on assumptions, not evidence

## Core Loop

ProveIt runs one iterative loop. It is NOT linear — it cycles until confidence is high enough.

```
Brain Dump → Structured Discovery → Research → Findings Review
                                                      ↓
                                              Confidence high enough?
                                               No → back to Discovery
                                              Yes → Generate Outputs
                                                      ↓
                                              Gamma Deck + Validation Playbook
```

### Phase 1: Brain Dump (runs once)

Casual, conversational extraction. Get the raw idea out fast. 5-6 open questions max.

Goal: capture the emotional intent and raw concept before structure kicks in. PMs often lose the spark in frameworks — this preserves it.

Questions:
- "What's the idea? Just tell me."
- "What made you think of this?"
- "Who's it for?"
- "What do they do today instead?"
- "Why now?"

After: summarise back in 2-3 sentences, confirm understanding.

### Phase 2: Structured Discovery (loops)

Targeted questions across three lenses. ProveIt checks what the brain dump already covered and fills gaps.

**Desirability (User lens)**

| # | Question | Reveals |
|---|----------|---------|
| 1 | "Who specifically has this problem? Describe a real person." | Concrete user vs vague segment |
| 2 | "What do they do today to solve this? Walk me through it." | Current workaround = real competitor |
| 3 | "What's painful about how they do it today?" | Actual pain vs assumed pain |
| 4 | "How painful? Do they complain, or actually try to fix it?" | Stated frustration vs switching behaviour |
| 5 | "If your solution existed tomorrow, what would they stop using?" | Displacement thinking (Bob Moesta) |
| 6 | "How would they find out it exists?" | Distribution signal |

**Viability (Business lens)**

| # | Question | Reveals |
|---|----------|---------|
| 7 | "Would someone pay for this? Who, and roughly how much?" | Willingness to pay |
| 8 | "How would the money work? Subscription, one-time, freemium?" | Business model shape |
| 9 | "How big is this market? Thousands or millions?" | Gut-check sizing |
| 10 | "What would make this a terrible business even if people loved it?" | Pre-mortem (Shreyas Doshi) |
| 11 | "Is anyone already making money solving this?" | Market existence signal |

**Feasibility (Technical lens — light touch)**

| # | Question | Reveals |
|---|----------|---------|
| 12 | "Does this need to connect to anything? APIs, hardware, other systems?" | Integration complexity |
| 13 | "Does this need real-time anything? Live data, collaboration, notifications?" | Architecture complexity |
| 14 | "Is there anything here that feels technically hard or uncertain?" | PM's own intuition on risk |

**Flow:**
- Don't fire all 14 in order
- Check what brain dump already answered
- Identify biggest gaps — if desirability is strong but viability is blank, go there
- Ask 2-3 questions, pause, reflect back
- Update confidence score after each mini-round
- Move to research when enough context to search effectively (usually ~8 questions total)
- Never more than 15 minutes of questions before research starts

### Phase 3: Research (loops)

ProveIt goes autonomous. PM waits. Three parallel research tracks:

**Track 1: Competitor Landscape**
- Existing products (Product Hunt, app stores, SaaS directories)
- Open source alternatives (GitHub)
- Failed attempts — the graveyard (tarpit detection)
- Tools: `firecrawl_search`, `firecrawl_scrape`, `WebSearch`

**Track 2: Market Evidence**
- Real people expressing this pain (Reddit, HN, Twitter, forums)
- "I wish...", "I built...", "why isn't there..." patterns
- Industry articles about the problem space
- Evidence of switching behaviour
- Tools: `firecrawl_search`, `firecrawl_agent`, `WebSearch`

**Track 3: Viability Signals**
- Competitor pricing
- Market size estimates
- Adjacent market signals
- Investor activity (recent funding = validation)
- Tools: `firecrawl_search`, `firecrawl_extract`, `WebSearch`

**Output per competitor/finding:**
```
[Product Name]
What it does — 1-2 sentences
Overlap — High/Medium/Low
Gap — what's missing that your idea fills
Learn — patterns to steal
Status — Active/Dead/Funded/Free
```

### Phase 4: Findings Review (loops)

Present structured summary with updated confidence scores:

```
Desirability: 6 → 8/10 (strong pain signals on Reddit, 3 active competitors = validated market)
Viability:    4 → 5/10 (competitors exist but only 1 charges, unclear willingness to pay)
Feasibility:  7/10     (no change — needs technical review)
```

**What happens next — PM decides:**
- Scores high enough → "Let's generate the deck"
- Gaps remain → ProveIt asks targeted follow-up questions, then researches again
- Kill signal → Present evidence honestly, PM decides to pivot/persist/stop
- PM has new info → Incorporate, re-score
- PM wants to stop → Everything saved in `discovery.md`, resume anytime

**Kill Signals (flag clearly, don't decide for PM):**
- Tarpit detected — 5+ failed startups in this exact space
- Saturated market — 10+ active competitors, no clear gap
- Zero switching evidence — people complain but nobody changes
- No willingness to pay — competitors all free, no paid tier succeeds

Message: "Here's what the evidence shows. The bar for pursuing this just got higher. Here's what would need to be true for this to work despite these signals."

### Phase 5: Outputs (runs once, when ready)

**1. Gamma Presentation (technical handoff deck)**

Generated via `mcp__claude_ai_Gamma__generate` with format: 'presentation'.

Slides:
1. The Problem — who has it, how painful, evidence
2. Market Landscape — competitors, gaps, positioning
3. The Opportunity — what's different about this approach
4. Target User — persona, JTBD, current workaround
5. Business Model — how money works, market size
6. What to Build — high-level concept (NOT technical spec)
7. Size & Complexity — T-shirt size, key technical risks
8. Remaining Unknowns — what still needs validation
9. Recommended Next Steps — validation playbook summary

**2. Validation Playbook (appended to discovery.md)**

Practical experiments tied to remaining unknowns:
- "Viability is 7/10 — run a landing page test with pricing to test willingness to pay"
- "Desirability is 8/10 but forum-based — do 5 user interviews to confirm"
- "Feasibility is 6/10 — get a technical spike on the real-time sync before committing"
- Suggested quick prototypes or MVP tests

## Persistence: discovery.md

One living document, updated after every phase. This is the primary artefact.

```markdown
# ProveIt: [Idea Name]
Generated: [date]
Last updated: [date]

## Confidence Score
Desirability: X/10 | Viability: X/10 | Feasibility: X/10
Status: [Researching / Needs more discovery / Ready for handoff / Kill signal]

## Idea (Brain Dump)
[Raw capture from Phase 1]

## Discovery
### Desirability
- Target user: ...
- Current workaround: ...
- Pain level: ...
- Who they'd fire: ...
- Distribution: ...

### Viability
- Willingness to pay: ...
- Business model: ...
- Market size (gut): ...
- Biggest business risk: ...

### Feasibility
- Key integrations: ...
- Real-time needs: ...
- T-shirt size: ...

## Research Findings
### Round 1 ([date])
#### Competitors
- [Product] — overlap, gaps, learnings
#### Market Evidence
- [Source] — what it shows
#### Tarpit Check
- Pass/Flag with evidence
#### Viability Signals
- [Finding]

### Round 2 ([date])
[triggered by low score]
...

## Kill Signals
[Any triggered, with evidence]

## Recommendation
[Go / Kill / Pivot — with reasoning]

## Validation Playbook
- [ ] [Experiment 1 — what it tests, how to run it]
- [ ] [Experiment 2]
- [ ] [Experiment 3]

## Gamma Deck
[Link to generated presentation, or "Not yet generated"]
```

**Session resume:** ProveIt's first move in any session is to check if `discovery.md` exists. If yes, read it, summarise where things stand, and ask what the PM wants to tackle next. If no, start fresh with brain dump.

## Model Strategy

| Phase | Model | Why |
|-------|-------|-----|
| Brain Dump | Opus | Reads between the lines, catches what PM isn't saying |
| Structured Discovery | Opus | Confidence scoring requires judgement |
| Research | Sonnet (subagent) | Heavy tool use, structured output, speed |
| Findings Review | Opus | Synthesising messy research into clear signal |
| Gamma Deck | Sonnet (subagent) | Structured output from synthesised content |
| Validation Playbook | Opus | Creative + strategic, connecting gaps to experiments |

Single ProveIt agent runs on Opus. Delegates research and deck generation to Sonnet subagents.

## Plugin Structure

```
proveit/
├── .claude-plugin/
│   ├── plugin.json          # Plugin manifest
│   └── marketplace.json     # Local marketplace config
├── agents/
│   └── proveit.md           # Main ProveIt agent (Opus)
├── commands/
│   └── proveit.md           # /proveit skill — entry point
├── docs/
│   └── design.md            # This file
├── setup.sh                 # Automated installation
├── README.md                # User-facing docs
└── CLAUDE.md                # Agent instructions
```

Minimal footprint. One agent, one skill, one setup script.

## MCP Tools Required

| Tool | Used For |
|------|----------|
| `WebSearch` | Quick market searches, trend discovery |
| `firecrawl_search` | Deep web search with scraped results |
| `firecrawl_scrape` | Competitor site analysis |
| `firecrawl_agent` | Autonomous multi-source research |
| `Gamma generate` | Final presentation output |
| `Gamma get_themes` | Theme selection for deck |

## Setup / Onboarding

Same pattern as ShipIt's `setup.sh`:

```bash
git clone https://github.com/cla1redonald/proveit.git ~/proveit
cd ~/proveit
./setup.sh
```

Script:
1. Checks prerequisites (claude, node, jq)
2. Merges plugin config into `~/.claude/settings.json`
3. Verifies installation
4. Prints quick-start: "Start Claude Code in any directory and type: /proveit [your idea]"

## What This Is NOT

- Not a project management tool
- Not a technical architecture tool (that's ShipIt)
- Not a PRD generator (though discovery.md could feed into one)
- Not a replacement for talking to real users
- Not a decision-maker — it presents evidence, the PM decides

## POC Scope

**In:**
- Single-user (one PM, one idea per session)
- Core discovery loop (all 5 phases)
- discovery.md persistence
- Gamma deck generation
- Validation playbook
- Confidence scoring
- Kill signal detection
- Session resume

**Out:**
- Multi-user collaboration
- Web UI
- Database persistence
- Custom frameworks (question set is hardcoded)
- Historical comparison across ideas
- Integration with Notion/Linear/Jira
