#!/usr/bin/env bash
# Docs-sync check (zero-cost, no LLM). Fails if agent code changed without docs.
#
# "Code" = scripts/ agents/ commands/ (plugin) + web/src/ (web app) + studio/src/ (Studio)
#   + packages/ (shared core). AGENTS.md requires doc updates for all of these.
# "Docs" = README.md CLAUDE.md AGENTS.md docs/ web/README.md studio/README.md
# Override: put [no-docs] in any commit message in the range when a change genuinely
# needs no doc update (e.g. a bugfix). Then this passes.
#
# Usage:
#   scripts/check-docs-sync.sh [base-ref]      # range mode (CI): <base>...HEAD   (default origin/main)
#   scripts/check-docs-sync.sh --staged        # local mode: staged changes only

set -uo pipefail

CODE_RE='^(scripts/|agents/|commands/|web/src/|studio/src/|packages/)'
DOCS_RE='^(README\.md|CLAUDE\.md|AGENTS\.md|docs/|web/README\.md|studio/README\.md)'

if [ "${1:-}" = "--staged" ]; then
  changed=$(git diff --cached --name-only)
  msg="$(git diff --cached 2>/dev/null >/dev/null; echo "${COMMIT_MSG:-}")"  # message not known pre-commit; override via range only
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
  echo "Update README.md / CLAUDE.md / AGENTS.md / docs/ / web/README.md / studio/README.md to match — or add [no-docs] to a commit message if this genuinely needs none."
  echo "Code files changed:"
  printf '%s\n' "$code" | sed 's/^/  - /'
  exit 1
fi

echo "docs-sync OK"
exit 0
