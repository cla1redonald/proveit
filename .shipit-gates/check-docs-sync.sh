#!/usr/bin/env bash
# Docs-sync check (zero-cost, no LLM). Fails if code changed without docs.
#
# "Code" = common SOURCE dirs across both ShipIt's own layout (scripts/ agents/ commands/
#   hooks/ gates/) AND app repos (src/ app/ web/ api/ lib/ server/ packages/ components/
#   pages/). The original default only listed ShipIt's own dirs, so on an app repo with code
#   under src/ the gate matched nothing and silently PASSED every PR — a false-confidence
#   no-op (worse than no gate). Set SHIPIT_CODE_RE to tailor it to an unusual layout.
# "Docs" = README.md CLAUDE.md AGENTS.md HISTORY.md docs/
# Override: put [no-docs] in any commit message in the range when a change genuinely
# needs no doc update (e.g. a bugfix). Then this passes.
#
# Usage:
#   gates/check-docs-sync.sh [base-ref]      # range mode (CI): <base>...HEAD   (default origin/main)
#   gates/check-docs-sync.sh --staged        # local mode: staged changes only
#
# Configurable via env vars:
#   SHIPIT_CODE_RE   — ERE pattern matching "code" files (default: see below)
#   SHIPIT_DOCS_RE   — ERE pattern matching "docs" files (default: see below)

set -uo pipefail

CODE_RE="${SHIPIT_CODE_RE:-^(scripts/|agents/|commands/|hooks/|gates/|src/|app/|web/|api/|lib/|server/|packages/|components/|pages/)}"
DOCS_RE="${SHIPIT_DOCS_RE:-^(README\.md|CLAUDE\.md|AGENTS\.md|HISTORY\.md|docs/)}"

if [ "${1:-}" = "--staged" ]; then
  changed=$(git diff --cached --name-only)
  # Commit message not yet known in pre-commit; [no-docs] override only works in range mode.
  msg="${COMMIT_MSG:-}"
else
  base="${1:-origin/main}"
  changed=$(git diff --name-only "${base}...HEAD" 2>/dev/null)
  msg=$(git log --format='%B' "${base}..HEAD" 2>/dev/null)
fi

code=$(printf '%s\n' "$changed" | grep -E "$CODE_RE" || true)
docs=$(printf '%s\n' "$changed" | grep -E "$DOCS_RE" || true)
override=$(printf '%s\n' "$msg" | grep -ci '\[no-docs\]' || true)

if [ -n "$code" ] && [ -z "$docs" ] && [ "${override:-0}" -eq 0 ]; then
  echo "::error::Code changed but no docs were updated."
  echo "Update README.md / CLAUDE.md / AGENTS.md / HISTORY.md / docs/ to match — or add [no-docs] to a commit message if this genuinely needs none."
  echo "Code files changed:"
  printf '%s\n' "$code" | sed 's/^/  - /'
  exit 1
fi

echo "docs-sync OK"
exit 0
