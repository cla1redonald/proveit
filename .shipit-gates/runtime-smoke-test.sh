#!/usr/bin/env bash
# runtime-smoke-test.sh — the gate the FocusBoard 504 taught us we needed.
#
# Green build + passing tests + successful deploy + passing code-review do NOT mean the
# code works at runtime. (Proof: a Hono catch-all compiled, 661 tests passed, the build
# + Vercel deploy went green, and the independent review passed — yet EVERY route 504'd
# because a Web handler ran on the Node runtime. The 25 tests passed because they call
# app.fetch() in-process, bypassing the deploy adapter.) AND a healthy API can sit behind
# a broken UI (or vice-versa), so this gate hits BOTH: live HTTP endpoints and the real
# rendered UI via Playwright — exactly the kind of pass a human does by hand.
#
# Deploy-conditional: only runs when a deploy URL is present (skips cleanly otherwise).
# Override: [no-smoke] in a commit message (mirrors [no-test]/[no-docs]).
#
# Config:
#   SHIPIT_DEPLOY_URL          deployed base URL (or pass as $1). No URL → skip.
#   SHIPIT_SMOKE_PATHS         comma-separated API/page paths to curl (default "/").
#                              Set this to CRITICAL routes — a SPA root often 200s while
#                              /api/* 504s, the exact FocusBoard failure a root check misses.
#   SHIPIT_SMOKE_UI            "1" → also drive the rendered UI with Playwright (ui-smoke.mjs).
#   SHIPIT_SMOKE_UI_URL        page to load for the UI check (default = SHIPIT_DEPLOY_URL).
#   SHIPIT_SMOKE_SELECTOR      selector that must render (default "body").
#   SHIPIT_SMOKE_FAIL_ON_CONSOLE  "1" → fail on browser console errors (default: warn).
#   SHIPIT_SMOKE_BASE          git base for the [no-smoke] scan (default origin/main).

set -uo pipefail

URL="${SHIPIT_DEPLOY_URL:-${1:-}}"
if [ -z "$URL" ]; then
  echo "runtime-smoke: no deploy URL (set SHIPIT_DEPLOY_URL or pass one) — skipping."
  exit 0
fi
if git log --format='%B' "${SHIPIT_SMOKE_BASE:-origin/main}..HEAD" 2>/dev/null | grep -qiF '[no-smoke]'; then
  echo "runtime-smoke: [no-smoke] override present — skipping."
  exit 0
fi

fail=0

# ── 1. HTTP smoke: every path must answer non-5xx, non-timeout ────────────────
PATHS="${SHIPIT_SMOKE_PATHS:-/}"
IFS=',' read -ra ARR <<< "$PATHS"
for p in "${ARR[@]}"; do
  [ -n "$p" ] || continue
  full="${URL%/}${p}"
  code="$(curl -s -o /dev/null --max-time 25 -w '%{http_code}' "$full" 2>/dev/null)"
  # curl prints "000" on connect failure/timeout; normalise anything not a 3-digit code.
  printf '%s' "$code" | grep -qE '^[0-9]{3}$' || code="000"
  if [ "$code" = "000" ]; then
    echo "::error::runtime-smoke: $full TIMED OUT / unreachable (the exact FocusBoard failure mode)"; fail=1
  elif [ "$code" -ge 500 ]; then
    echo "::error::runtime-smoke: $full → HTTP $code (5xx) — deployed artifact is broken"; fail=1
  else
    echo "runtime-smoke: $full → HTTP $code ✓"
  fi
done

# ── 2. UI smoke: the real rendered page (Playwright) ──────────────────────────
if [ "${SHIPIT_SMOKE_UI:-0}" = "1" ]; then
  here="$(cd "$(dirname "$0")" && pwd)"
  if command -v node >/dev/null 2>&1 && node -e "require.resolve('playwright')" >/dev/null 2>&1; then
    SHIPIT_SMOKE_UI_URL="${SHIPIT_SMOKE_UI_URL:-$URL}" node "$here/ui-smoke.mjs" || fail=1
  else
    echo "::warning::runtime-smoke: UI check requested but Playwright isn't installed — run 'npm i -D playwright && npx playwright install chromium'. Skipping the UI smoke."
  fi
fi

# ── 3. Full E2E suite (optional): the project's Cypress / Playwright Test / Cucumber ──
# This gate is the always-on FLOOR (liveness + render). Your real user-FLOW tests live
# in a proper E2E suite — point this at it and ShipIt runs it against the DEPLOYED
# artifact. The deploy URL is exported as both SHIPIT_DEPLOY_URL and BASE_URL so the
# suite can target it (Cypress baseUrl, Playwright baseURL, a BASE_URL your steps read).
#   e.g.  SHIPIT_SMOKE_E2E_CMD="npx playwright test"
#         SHIPIT_SMOKE_E2E_CMD="npx cypress run --config baseUrl=$SHIPIT_DEPLOY_URL"
#         SHIPIT_SMOKE_E2E_CMD="npx cucumber-js"
if [ -n "${SHIPIT_SMOKE_E2E_CMD:-}" ]; then
  echo "runtime-smoke: running E2E suite → $SHIPIT_SMOKE_E2E_CMD"
  if SHIPIT_DEPLOY_URL="$URL" BASE_URL="$URL" bash -c "$SHIPIT_SMOKE_E2E_CMD"; then
    echo "runtime-smoke: E2E suite passed ✓"
  else
    echo "::error::runtime-smoke: E2E suite FAILED against $URL"; fail=1
  fi
fi

if [ "$fail" -eq 0 ]; then
  echo "runtime-smoke OK"
  exit 0
fi
echo "::error::runtime-smoke FAILED — the deployed artifact is broken at runtime despite green CI."
exit 1
