## 2. Discovery (loops)

Targeted questions across three lenses. Check what the brain dump already answered — don't re-ask.

### Frameworks this phase applies

Discovery isn't free-form question-asking. The 14 questions below sit on top of named frameworks — when you reach for a question, reach for the framework underneath it too, and pull supporting context from `mcp__lenny-transcripts__search_transcripts` when you need a sharper lens.

**Desirability lens:**
- **Bob Moesta — Jobs to Be Done & switching forces:** push of the situation, pull of the new, anxiety, habit. Questions 4 and 5 sit directly on his "Bitchin' ain't switchin'" and "Who will they fire?" framings.
- **Teresa Torres — Continuous Discovery + Opportunity Solution Tree:** interview discipline. Avoid leading the witness; map opportunities (not features). Question 1 ("a real person, not a segment") is her ICP discipline applied.
- **Marty Cagan — Discovery vs delivery:** discovery is about *risk-testing*, not requirements-gathering. If a discovery question feels like spec-writing, you've drifted into delivery thinking.
- **Ravi Mehta — ICP Scorecard:** force precision on "who specifically" (question 1). Vague segments are the #1 sign discovery isn't real yet.

**Viability lens:**
- **Madhavan Ramanujam — Monetizing Innovation:** discover willingness-to-pay BEFORE building. His central rule: don't anchor low (especially with AI), or you train customers to expect a low price. Questions 7 and 8 implement this.
- **Marc Andreessen — "Market is the most important thing":** weak markets kill strong teams. Question 9 (sizing) and 11 (existing money) are the cheap test for market quality.
- **Sean Ellis — PMF Survey:** the "very disappointed" 40% bar. Question 5 ("what would they stop using") is the cheapest pre-build version of this.
- **Shreyas Doshi — Pre-mortem framing:** question 10 ("what would make this a terrible business even if people loved it") is his pre-mortem in question form. Take the answer seriously — surface the elephants now, not in Phase 6.5.

**Feasibility lens (light touch):**
- **Marty Cagan — Feasibility as a discovery risk:** questions 12–14 aren't a tech spec request. They're risk-surfacing. Treat the answers as flags to test, not problems to solve.

If a discovery question lands somewhere fuzzy or the PM gives a stock answer, search Lenny's archive for the relevant framework (e.g. `search_transcripts` for "switching forces", "ICP", "pricing strategy", "PMF survey") to get current expert framing — then re-ask with a sharper lens. Cite the guest in `discovery.md` so the PM sees where the framing came from.

### Desirability (User lens)

| # | Question | What it reveals |
|---|----------|-----------------|
| 1 | "Who specifically has this problem? Describe a real person, not a segment." | Concrete thinking vs vague |
| 2 | "What do they do today to solve this? Walk me through it." | Current workaround = real competitor |
| 3 | "What's painful about how they do it today?" | Actual pain vs assumed pain |
| 4 | "How painful is it? Do they complain, or actually try to fix it?" | Stated frustration vs switching behaviour (Bob Moesta: "Bitchin' ain't switchin'") |
| 5 | "If your solution existed tomorrow, what would they stop using?" | Displacement thinking (Bob Moesta: "Who will they fire?") |
| 6 | "How would they find out your solution exists?" | Distribution signal — if vague, red flag |

### Viability (Business lens)

| # | Question | What it reveals |
|---|----------|-----------------|
| 7 | "Would someone pay for this? Who, and roughly how much?" | Willingness to pay vs willingness to use |
| 8 | "How would the money work? Subscription, one-time, freemium?" | Business model shape |
| 9 | "How big is this market? Thousands or millions?" | Gut-check sizing |
| 10 | "What would make this a terrible business even if people loved it?" | Pre-mortem — surfaces elephants early (Shreyas Doshi) |
| 11 | "Is anyone already making money solving this?" | Market existence signal |

### Feasibility (Technical lens — light touch)

| # | Question | What it reveals |
|---|----------|-----------------|
| 12 | "Does this need to connect to anything? APIs, hardware, other systems?" | Integration complexity |
| 13 | "Does this need real-time anything? Live data, collaboration, notifications?" | Architecture complexity signal |
| 14 | "Is there anything here that feels technically hard or uncertain?" | PM's own intuition on risk |

### Flow Rules

- **Don't fire all 14 in order.** Identify the biggest gaps and go there.
- **Ask 2-3 questions**, then pause and reflect back what you heard.
- **Update the confidence score** after each mini-round.
- **Move to research** when you have enough context to search effectively — usually after ~8 questions total including brain dump.
- **Never more than 15 minutes of questions** before the PM sees research coming back. Momentum matters.

### Use Lenny's Podcast for expert framing

When discovery surfaces a tricky question (e.g. "how do I tell if this is real demand?", "what's the right way to think about pricing for this?", "how do I detect a tarpit?"), search Lenny's Podcast (`mcp__lenny-transcripts__search_transcripts`) for relevant expert framing. Don't re-derive frameworks from scratch when 284 episodes of Lenny have probably covered it. Cite the guest in `discovery.md` so the PM sees where the framing came from.

Examples of when to query Lenny:
- Idea touches pricing → search "pricing strategy" or "price testing"
- Discovery uncovers weak switching → search "Bob Moesta switching" or "JTBD demand"
- PM asks about market sizing → search "market sizing" or "TAM"
- Pre-mortem needs failure modes → search "why startups fail" or "tarpit"

After each mini-round, update the Discovery section in `discovery.md`.

---
