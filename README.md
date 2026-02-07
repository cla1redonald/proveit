# ProveIt

Validate product ideas before committing technical resources. For product managers.

ProveIt takes a raw idea through Desirability (do users want it?), Viability (can it be a business?), and light Feasibility (how big is the build?) — then generates a presentation for technical handoff.

**"ProveIt first, then build it."**

## What It Does

1. **Brain Dump** — Get the raw idea out fast, no frameworks
2. **Structured Discovery** — Targeted questions across desirability, viability, and feasibility
3. **Automated Research** — Competitor analysis, market evidence, tarpit detection
4. **Confidence Scoring** — Desirability/Viability/Feasibility scored out of 10
5. **Honest Assessment** — Kill signals flagged when evidence is against the idea
6. **Handoff Deck** — Gamma presentation for the technical team
7. **Validation Playbook** — Suggested experiments to de-risk remaining unknowns

Everything is saved to `discovery.md` — stop anytime, resume later.

## Prerequisites

- **Claude Code** (latest version) — [install](https://claude.ai/download)
- **Node.js** — [install](https://nodejs.org)
- **jq** — `brew install jq` on macOS

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

## Quick Start

Create a directory for your idea and start validating:

```bash
mkdir ~/my-idea && cd ~/my-idea
```

Then in Claude Code:

```
/proveit:proveit I want to build a habit tracker for remote teams
```

ProveIt will:
- Ask you about the idea conversationally
- Run structured discovery questions
- Research competitors, market evidence, and viability signals
- Score your confidence across three dimensions
- Flag any kill signals honestly
- Generate a handoff deck when you're ready

## Resuming a Session

ProveIt saves everything to `discovery.md` in your working directory. To resume:

```
cd ~/my-idea
/proveit:proveit
```

It reads `discovery.md`, shows where you left off, and picks up from there.

## What You Get

### discovery.md

A living research document updated after every phase:
- Confidence scores with evidence
- Discovery answers (user, pain, market, model)
- Research findings (competitors, market evidence, tarpit check)
- Kill signals (if any)
- Validation playbook (experiments to run next)

### Gamma Presentation

When confidence is high enough, ProveIt generates a slide deck covering:
- The problem and who has it
- Market landscape and positioning
- Business model and market size
- What to build (high level)
- T-shirt size estimate and technical risks
- Recommended next steps

### Validation Playbook

Practical experiments tied to remaining unknowns:
- Landing page tests, user interviews, pricing experiments
- Each states what it tests, how to run it, and what "pass" looks like

## Security

This repo commits **zero Bash permission allows** in `.claude/settings.json`. Anyone who clones this repo will be prompted to approve every command individually. This is intentional — see [ShipIt's security rationale](https://github.com/cla1redonald/shipit-v2) for why shared repos should not pre-approve command execution.

## Frameworks Used

ProveIt draws on established product strategy frameworks:

| Framework | Creator | Used For |
|-----------|---------|----------|
| Jobs-to-Be-Done | Bob Moesta | Understanding what users hire/fire |
| Opportunity Solution Tree | Teresa Torres | Separating opportunities from solutions |
| Pre-mortem | Shreyas Doshi | Surfacing risks and elephants early |
| Tarpit Detection | Dalton Caldwell (YC) | Identifying ideas that seem good but fail |
| Value Proposition Canvas | Strategyzer | Mapping jobs, pains, gains |
| PMF Test | Sean Ellis | "Very disappointed" as PMF indicator |

## License

MIT
