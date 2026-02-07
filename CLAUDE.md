# ProveIt — Agent Instructions

ProveIt is a product validation tool for product managers. One agent, one skill, one loop.

## What It Does

Takes a raw product idea through Desirability, Viability, and light Feasibility assessment using structured discovery and automated market research. Outputs a confidence score, a `discovery.md` research document, and a Gamma presentation for technical handoff.

## How to Use

```
/proveit [your idea]
```

Or just `/proveit` to resume an existing session (reads `discovery.md`).

## Agent

| Agent | Model | Purpose |
|-------|-------|---------|
| `@proveit` | Opus | Discovery, scoring, synthesis, outputs |

Research phases are delegated to Sonnet subagents for speed.

## Core Principles

- **One question at a time** — never overwhelm the PM
- **Evidence over opinion** — research backs every score
- **Honest assessment** — kill signals are flagged, not hidden
- **Persistence** — `discovery.md` survives across sessions
- **PM decides** — ProveIt presents evidence, never makes the go/kill call

## Security

This project commits NO Bash permission allows in `.claude/settings.json`. All Bash commands require explicit user approval. This is intentional — anyone who clones this repo should review and approve commands individually.

## Project Location

ProveIt projects (where PMs run `/proveit`) should be in their own directories. ProveIt creates `discovery.md` in the current working directory.
