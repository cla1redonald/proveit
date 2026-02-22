# ProveIt

Validate product ideas before committing technical resources. For product managers.

ProveIt takes a raw idea through Desirability (do users want it?), Viability (can it be a business?), and light Feasibility (how big is the build?) — then generates a presentation for technical handoff.

**"ProveIt first, then build it."**

---

## What It Does

1. **Brain Dump** — Get the raw idea out fast, no frameworks
2. **Structured Discovery** — Targeted questions across desirability, viability, and feasibility
3. **Automated Research** — Competitor analysis, market evidence, tarpit detection — written to its own file each round
4. **Confidence Scoring** — Desirability/Viability/Feasibility scored out of 10
5. **Honest Assessment** — Kill signals flagged when evidence is against the idea
6. **Research Swarm** *(optional)* — 5 parallel agents argue opposing angles on the sharpest open question, synthesised into a scored recommendation
7. **Handoff Deck** — Gamma presentation for the technical team
8. **Validation Playbook** — Suggested experiments to de-risk remaining unknowns

---

## Prerequisites

**Required:**
- **Claude Code** (latest version) — [install](https://claude.ai/download)
- **Node.js** — [install](https://nodejs.org)
- **jq** — `brew install jq` on macOS

**MCP Tools** (configure in Claude Code settings):
- **Firecrawl** — deep web research and competitor analysis
- **Gamma** — generates the technical handoff presentation

ProveIt works without Firecrawl (falls back to WebSearch/WebFetch) and without Gamma (skips deck generation), but both are recommended for the full experience.

---

## Installation

```bash
git clone https://github.com/cla1redonald/proveit.git ~/proveit
cd ~/proveit
./setup.sh
```

To uninstall:

```bash
cd ~/proveit
./setup.sh --uninstall
```

<details>
<summary>Manual installation</summary>

Add these keys to `~/.claude/settings.json` (merge — don't replace the whole file):

```json
{
  "extraKnownMarketplaces": {
    "proveit": {
      "source": {
        "source": "directory",
        "path": "/absolute/path/to/proveit"
      }
    }
  },
  "enabledPlugins": {
    "proveit@proveit": true
  }
}
```

</details>

---

## Quick Start

Create a directory for your idea and start validating:

```bash
mkdir ~/my-idea && cd ~/my-idea
```

Then in Claude Code:

```
/proveit I want to build a habit tracker for remote teams
```

ProveIt will ask about the idea conversationally, run structured discovery, research competitors and market evidence, score confidence, and flag any kill signals honestly.

## Resuming a Session

ProveIt saves everything across files in your working directory. To resume:

```bash
cd ~/my-idea
/proveit
```

It reads `discovery.md`, checks what research has already been done, shows where you left off, and picks up from there.

---

## What You Get

Every output is a standalone markdown file in your working directory — shareable, pasteable, no dependencies.

### discovery.md

The index. Stays lightweight throughout the session:
- Confidence scores (updated after every phase)
- Brain dump and discovery Q&A
- Links to all research files
- Kill signals (if any)
- Recommendation
- Validation playbook

### research-N.md

One file per standard research round. Each contains:
- Competitor landscape (what exists, what failed, what's funded)
- Market evidence (real people expressing the pain)
- Tarpit check
- Viability signals (pricing, market size, investor activity)

If ProveIt loops back for a second research round, it writes `research-2.md` — never overwrites prior rounds.

### swarm-N-synthesis.md *(if Research Swarm is run)*

The main swarm deliverable. Contains:
- Executive summary with confidence-weighted recommendation
- Direct contradictions between opposing agents, with resolution
- Bias check (absolute claims, echo chambers, missing perspectives)
- Impact on Desirability/Viability/Feasibility scores
- Next steps

The five individual agent files (`swarm-N-market-bull.md`, `swarm-N-market-bear.md`, etc.) are also written for deep dives.

### Gamma Presentation

When confidence is high enough, ProveIt generates a slide deck covering:
- The problem and who has it
- Market landscape and positioning
- Business model and market size
- What to build (high level)
- T-shirt size estimate and technical risks
- Recommended next steps

---

## Security

This repo commits **zero Bash permission allows** in `.claude/settings.json`. Anyone who clones this repo will be prompted to approve every command individually. This is intentional — see [ShipIt's security rationale](https://github.com/cla1redonald/shipit-v2) for why shared repos should not pre-approve command execution.

---

## Frameworks Used

| Framework | Creator | Used For |
|-----------|---------|----------|
| Jobs-to-Be-Done | Bob Moesta | Understanding what users hire/fire |
| "Bitchin' ain't switchin'" | Bob Moesta | Separating complaints from switching behaviour |
| Opportunity Solution Tree | Teresa Torres | Separating opportunities from solutions |
| Pre-mortem | Shreyas Doshi | Surfacing risks and elephants early |
| Tarpit Detection | Dalton Caldwell (YC) | Identifying ideas that seem good but fail |
| Value Proposition Canvas | Strategyzer | Mapping jobs, pains, gains |
| PMF Test | Sean Ellis | "Very disappointed" as PMF indicator |

---

## License

MIT
