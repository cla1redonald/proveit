# ProveIt — Agent Instructions

ProveIt is a product validation tool for product managers. One agent, one skill, one loop.

## The Problem It Solves

Products don't fail at launch — they fail at the idea, when nobody checked if the problem was real, the market was big enough, or someone already tried and failed. ProveIt runs that check before the bet is made.

## What It Does

Takes a raw product idea through Desirability, Viability, and light Feasibility assessment using structured discovery and automated market research. Outputs a confidence score, a `discovery.md` research document, and a Gamma presentation for technical handoff.

## How to Use

```
/proveit [your idea]
```

Or just `/proveit` to resume an existing session (reads `discovery.md`).

**Where to run it:** In the PM's own project directory (not inside `~/proveit/`). ProveIt creates `discovery.md` in the current working directory.

Or for a quick assumption check (10-15 min):

```
/proveit:proveit-fast [your idea]
```

Surfaces the 3 assumptions most likely to kill the idea, with research evidence. No full discovery loop, no Gamma deck.

## Directory Structure

```
proveit/
├── agents/proveit.md      # Core agent definition — discovery loop, scoring, outputs
├── commands/proveit.md    # Skill entry point for /proveit
├── docs/design.md         # Design decisions and validation framework
└── .claude/settings.json  # Permissions config (Bash disabled by default)
```

## Agent

| Agent | Model | Purpose |
|-------|-------|---------|
| `@proveit` | Opus | Discovery, scoring, synthesis, outputs |

Research phases are delegated to Sonnet subagents for speed.

## MCP Tools Used

- **Gamma** — Generates technical handoff presentations (`mcp__claude_ai_Gamma__generate`)
- **Firecrawl** — Competitor/market research (`firecrawl_search`, `firecrawl_scrape`, `firecrawl_agent`)
- **WebSearch/WebFetch** — Fallback web research

## Core Principles

- **One question at a time** — never overwhelm the PM
- **Evidence over opinion** — research backs every score
- **Honest assessment** — kill signals are flagged, not hidden
- **Persistence** — `discovery.md` survives across sessions
- **PM decides** — ProveIt presents evidence, never makes the go/kill call

## Security

This project commits NO Bash permission allows in `.claude/settings.json`. All Bash commands require explicit user approval. This is intentional — anyone who clones this repo should review and approve commands individually.
