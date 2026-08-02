## 3. Research (loops)

### Research Steering (optional)

Before launching research, ask one optional question:

> "Before I dive in — anything I should focus on specifically, or anything I should ignore? For example, a specific market segment, competitor to skip, or ecosystem to look at."

If the PM gives direction, pass it as additional context appended to all three research subagent prompts (competitor landscape, market evidence, viability signals). Also write the steering input to `discovery.md` in the Research Files section as a note: `Research steering: [PM's input]`.

If the PM says "no, just go" or similar, proceed immediately.

Tell the PM: "I'm going to research this now. Give me a few minutes."

### Determine the round number

Glob for `research-*.md` in the current directory. Count existing files, then add 1 to get N (e.g. if `research-1.md` already exists, this round writes to `research-2.md`). This round writes to `research-[N].md`.

### Spawn a Sonnet research subagent

Use the Task tool with `model: "sonnet"` and `subagent_type: "general-purpose"`.

Instruct the subagent to research three parallel tracks and write ALL findings to `research-[N].md` in the current working directory:

#### Track 1: Competitor Landscape
- Existing products solving this problem (Product Hunt, app stores, SaaS directories)
- Open source alternatives (GitHub, npm)
- Failed attempts — the graveyard (critical for tarpit detection)
- Search patterns: `site:producthunt.com [topic]`, `site:github.com [topic] awesome`, `[topic] startup failed`

#### Track 2: Market Evidence
- Real people expressing this pain (Reddit, HN, Twitter, forums)
- Search for: "I wish...", "I built...", "why isn't there...", "frustrated with..."
- Industry articles about the problem space
- Evidence of switching behaviour — people actually moving between solutions

#### Track 3: Viability Signals
- Are competitors charging? What pricing models?
- Market size estimates from industry sources
- Adjacent markets that hint at demand
- Investor activity in the space (recent funding rounds = validation)

#### Research subagent output format

For each competitor/finding:
```
[Product/Source Name]
What it does — 1-2 sentences
Overlap with idea — High/Medium/Low
Gap — what's missing that this idea fills
Learn — patterns to steal or avoid
Status — Active/Dead/Funded/Free/Community
```

The subagent must also flag:
- Tarpit signals (5+ failed startups in this exact space)
- Saturation signals (10+ active competitors, no clear gap)
- Switching evidence (or lack of it)
- Pricing patterns across competitors

#### research-N.md template

```markdown
# Research Round [N]: [Idea Name]
Date: [date]

## Competitor Landscape
### [Product Name]
- What it does: ...
- Overlap: High/Medium/Low
- Gap: ...
- Learn: ...
- Status: Active/Dead/Funded/Free/Community

[repeat]

## Market Evidence
- [Source/URL] — [what it shows]
[repeat]

## Tarpit Check
- [Pass/Flag] — [evidence]

## Viability Signals
- [Finding]

## Key Patterns
[3-5 bullet synthesis of what stands out across all three tracks]
```

After the subagent returns, update `discovery.md` to reference the new file:
```
- research-[N].md — [one-line summary of key finding] ([date])
```

---
