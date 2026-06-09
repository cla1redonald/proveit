#!/usr/bin/env bash
# docs-sync-reminder.sh — PreToolUse(Bash) reminder, NON-blocking.
# On a `git commit`, warns (exit 0) if code is staged without docs. The CI gate is the
# wall; this is just the early nudge. Installed per-repo by install-gates.sh.
set -uo pipefail
command -v jq >/dev/null 2>&1 || exit 0
cmd="$(cat | jq -r '.tool_input.command // empty' 2>/dev/null || true)"
printf '%s' "$cmd" | grep -q 'git commit' || exit 0
here="$(cd "$(dirname "$0")" && pwd)"
if ! bash "$here/check-docs-sync.sh" --staged >/dev/null 2>&1; then
  echo "docs-sync reminder: code is staged with no docs (README/CLAUDE/AGENTS/HISTORY/docs). Update them, or put [no-docs] in the commit message." >&2
fi
exit 0
