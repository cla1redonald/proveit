#!/usr/bin/env bash
# retro-sweep-nudge.sh — PostToolUse(Bash) nudge. NON-blocking, NO LLM.
#
# The cost-safe "autonomous sweep trigger". On a `git commit`, if the session's tripwire
# markers have crossed a threshold, it REMINDS you to run /retro. It never spawns an LLM
# job itself — the paid sweep runs in your interactive session (Max plan), on demand.
# That split is deliberate (MANDATORY rule #1): detection is free; the sweep stays
# you-triggered, so nothing ever bills the API wallet unattended.
set -uo pipefail
command -v jq >/dev/null 2>&1 || exit 0

input="$(cat)"
cmd="$(printf '%s' "$input" | jq -r '.tool_input.command // empty' 2>/dev/null || true)"
printf '%s' "$cmd" | grep -q 'git commit' || exit 0          # only on commits
session="$(printf '%s' "$input" | jq -r '.session_id // empty' 2>/dev/null || true)"
[ -n "$session" ] || exit 0

THRESHOLD="${SHIPIT_SWEEP_THRESHOLD:-5}"
MARKER_DIR="${SHIPIT_RETRO_DIR:-$HOME/.claude/shipit-retro}"
mf="$MARKER_DIR/$session.markers"
[ -f "$mf" ] || exit 0

n="$(grep -c . "$mf" 2>/dev/null || echo 0)"
state="$MARKER_DIR/$session.nudged"
last="$(cat "$state" 2>/dev/null || echo 0)"

# Nudge when the buffer first crosses the threshold, and again only as it grows —
# not on every single commit.
if [ "${n:-0}" -ge "$THRESHOLD" ] && [ "${n:-0}" -gt "${last:-0}" ]; then
  echo "retro: $n learning candidate(s) flagged this session — run /retro to capture them before they're lost." >&2
  printf '%s' "$n" > "$state"
fi
exit 0
