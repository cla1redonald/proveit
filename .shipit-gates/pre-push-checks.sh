#!/usr/bin/env bash
# pre-push-checks.sh — ShipIt V4 Gate S4: test / typecheck / build
#
# Dual-mode: PreToolUse(Bash) hook OR standalone git pre-push hook.
#
# As a PreToolUse hook:
#   stdin carries a JSON object; we read .tool_input.command and only act
#   when it is a `git push`. Any other command exits 0 immediately.
#
# As a standalone git pre-push hook:
#   invoked with no stdin (or a non-JSON stdin); just runs the checks.
#
# Checks (in order):
#   1. Conflict markers — grep tracked source files for <<<<<<<, =======, >>>>>>>
#   2. Tests          — npm test --run  (CI-safe; vitest-friendly)
#   3. Typecheck      — npm run typecheck
#   4. Build          — npm run build
#
# Each of checks 2-4 is skipped when the corresponding script is absent from
# package.json. If package.json itself is missing the whole test/build section
# is skipped with a warning (never punish a repo with no package.json).
#
# Override:
#   [no-test] in the latest commit message, OR SHIPIT_NO_TEST=1 in the
#   environment, skips checks 2-4.  Conflict-marker check always runs.
#
# Exit codes:  0 = allow / pass,  2 = block with message.

set -uo pipefail

# ---------------------------------------------------------------------------
# 1. Dual-mode dispatch: hook or standalone?
# ---------------------------------------------------------------------------

IS_HOOK=0
COMMAND=""

# Detect PreToolUse mode: stdin available and starts with '{' (JSON)
if [ -t 0 ]; then
  # stdin is a terminal — standalone pre-push invocation
  IS_HOOK=0
else
  # Try to read stdin. A short timeout so a dead pipe doesn't hang forever.
  raw_stdin=""
  if read -r -t 2 first_line 2>/dev/null; then
    raw_stdin="$first_line"
    # Drain any remaining lines (up to a reasonable cap)
    while IFS= read -r -t 1 more_line 2>/dev/null; do
      raw_stdin="${raw_stdin}
${more_line}"
    done
  fi

  # Is this JSON? (starts with '{')
  first_char="${raw_stdin:0:1}"
  if [ "$first_char" = "{" ]; then
    IS_HOOK=1
    # Extract .tool_input.command with jq if available, else grep fallback
    if command -v jq >/dev/null 2>&1; then
      COMMAND="$(printf '%s' "$raw_stdin" | jq -r '.tool_input.command // empty' 2>/dev/null || true)"
    else
      # Best-effort grep extraction — good enough for push detection
      COMMAND="$(printf '%s' "$raw_stdin" | grep -o '"command"[[:space:]]*:[[:space:]]*"[^"]*"' | head -1 | sed 's/.*: *"//' | sed 's/"//' || true)"
    fi
  fi
  # If stdin was not JSON (empty, git push refs, etc.) treat as standalone
fi

# If we are a PreToolUse hook, only proceed for `git push` commands
if [ "$IS_HOOK" = "1" ]; then
  if ! printf '%s' "$COMMAND" | grep -qE '\bgit\s+push\b'; then
    exit 0
  fi
fi

# ---------------------------------------------------------------------------
# 2. [no-test] override check
# ---------------------------------------------------------------------------

SKIP_TESTS=0

if [ "${SHIPIT_NO_TEST:-}" = "1" ]; then
  SKIP_TESTS=1
fi

if [ "$SKIP_TESTS" = "0" ] && command -v git >/dev/null 2>&1; then
  last_msg="$(git log -1 --pretty=%B 2>/dev/null || true)"
  if printf '%s' "$last_msg" | grep -qF '[no-test]'; then
    SKIP_TESTS=1
  fi
fi

if [ "$SKIP_TESTS" = "1" ]; then
  printf '[ShipIt Gate S4] [no-test] override active — skipping test/typecheck/build.\n' >&2
fi

# ---------------------------------------------------------------------------
# 3. Check 1: Conflict markers in tracked source files
# ---------------------------------------------------------------------------

ERRORS=""

add_error() {
  if [ -z "$ERRORS" ]; then
    ERRORS="$1"
  else
    ERRORS="${ERRORS}

$1"
  fi
}

# Search common source directories; skip binary/generated paths
if command -v git >/dev/null 2>&1; then
  # Use git-aware search: only tracked files, no node_modules/.next/dist
  conflict_hits="$(git grep -n -E '^(<{7}|={7}|>{7})' \
    -- ':!node_modules' ':!.next' ':!dist' ':!build' ':!.git' \
    2>/dev/null || true)"
else
  # Fallback: filesystem grep across known source dirs
  conflict_hits="$(grep -rn \
    -e '^<<<<<<<' -e '^=======' -e '^>>>>>>>' \
    src/ app/ components/ lib/ pages/ 2>/dev/null || true)"
fi

if [ -n "$conflict_hits" ]; then
  add_error "Conflict markers found in source files:
${conflict_hits}"
fi

# ---------------------------------------------------------------------------
# 4. Checks 2-4: test / typecheck / build  (skip if [no-test])
# ---------------------------------------------------------------------------

if [ "$SKIP_TESTS" = "0" ]; then

  # Helper: does a script exist in package.json?
  has_script() {
    local script_name="$1"
    if command -v jq >/dev/null 2>&1; then
      jq -e --arg s "$script_name" '.scripts[$s] != null' package.json >/dev/null 2>&1
    else
      # grep fallback
      grep -qE "\"${script_name}\"[[:space:]]*:" package.json 2>/dev/null
    fi
  }

  if [ ! -f package.json ]; then
    printf '[ShipIt Gate S4] No package.json found — skipping test/typecheck/build checks.\n' >&2
  else
    # Check 2: Tests
    if has_script "test"; then
      printf '[ShipIt Gate S4] Running tests...\n' >&2
      # --run makes vitest non-interactive (CI mode); jest ignores unknown flags
      if ! npm test -- --run 2>&1 | tail -20 >&2; then
        add_error "Tests are failing. Run \`npm test\` locally and fix before pushing."
      fi
    fi

    # Check 3: Typecheck
    if has_script "typecheck"; then
      printf '[ShipIt Gate S4] Running typecheck...\n' >&2
      if ! npm run typecheck 2>&1 | tail -20 >&2; then
        add_error "Type errors found. Run \`npm run typecheck\` locally and fix before pushing."
      fi
    fi

    # Check 4: Build
    if has_script "build"; then
      printf '[ShipIt Gate S4] Running build...\n' >&2
      if ! npm run build 2>&1 | tail -20 >&2; then
        add_error "Build is failing. Run \`npm run build\` locally and fix before pushing."
      fi
    fi
  fi

fi  # end SKIP_TESTS=0 block

# ---------------------------------------------------------------------------
# 5. Result
# ---------------------------------------------------------------------------

if [ -n "$ERRORS" ]; then
  printf '\n[ShipIt Gate S4] Push blocked:\n\n%s\n\n' "$ERRORS" >&2
  exit 2
fi

exit 0
