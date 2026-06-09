#!/usr/bin/env bash
# detect-secrets.sh — PostToolUse hook.
#
# After a file is written, scan it for likely secrets and warn on stderr.
# This is a WARN-only gate: exit 0 regardless. Blocking writes retroactively
# is too disruptive; the point is to surface the signal so the author notices
# before committing.
#
# Patterns detected:
#   * AWS access key IDs           (AKIA…)
#   * Private key PEM headers      (-----BEGIN … PRIVATE KEY-----)
#   * OpenAI-style keys            (sk-… with long value)
#   * GitHub personal access tokens (ghp_…)
#   * Bearer tokens in assignments  (Bearer <long-value>)
#   * High-signal env assignments   (API_KEY=, SECRET=, TOKEN=, PASSWORD= with long value)
#
# Skips binary files, test/spec fixtures, and reads at most MAX_BYTES of content
# to avoid spending time on huge generated files.

set -uo pipefail

MAX_BYTES=65536   # scan first 64 KB only

# Read the PostToolUse hook JSON from stdin.
input="$(cat)"

# jq availability — degrade gracefully if missing.
have_jq=1; command -v jq >/dev/null 2>&1 || have_jq=0

get() { # get <jq-path>
  [ "$have_jq" = 1 ] && printf '%s' "$input" | jq -r "$1 // empty" 2>/dev/null || true
}

file_path="$(get '.tool_input.file_path')"

# Nothing to do if no path was supplied.
[ -n "$file_path" ] || exit 0

# Expand a leading ~ to $HOME.
file_path="${file_path/#\~/$HOME}"

# File must exist and be readable.
[ -f "$file_path" ] || exit 0

# Skip known binary extensions — grep on binary produces noise.
case "$file_path" in
  *.png|*.jpg|*.jpeg|*.gif|*.ico|*.woff|*.woff2|*.ttf|*.otf|*.pdf|*.zip|*.gz|*.tar|*.bin|*.exe|*.so|*.dylib)
    exit 0 ;;
esac

# Skip test/spec files — dummy credentials are expected there.
case "$file_path" in
  *.test.ts|*.test.tsx|*.test.js|*.test.jsx|*.spec.ts|*.spec.tsx|*.spec.js|*.spec.jsx|*__tests__*|*fixtures*)
    exit 0 ;;
esac

# Read up to MAX_BYTES. dd on macOS does not support iflag=; use head -c instead.
content="$(head -c "$MAX_BYTES" "$file_path" 2>/dev/null)" || exit 0

# Confirm the file looks like text (null bytes → binary).
if printf '%s' "$content" | grep -qP '\x00' 2>/dev/null; then
  exit 0
fi

warnings=()

# AWS access key ID
printf '%s' "$content" | grep -Eq 'AKIA[0-9A-Z]{16}' \
  && warnings+=("AWS access key ID (AKIA…)")

# Private key PEM header
printf '%s' "$content" | grep -Eq -- '-----BEGIN (RSA |EC |OPENSSH |DSA )?PRIVATE KEY-----' \
  && warnings+=("Private key PEM header")

# OpenAI-style API key
printf '%s' "$content" | grep -Eq 'sk-[a-zA-Z0-9]{20,}' \
  && warnings+=("OpenAI-style API key (sk-…)")

# GitHub personal access token
printf '%s' "$content" | grep -Eq 'ghp_[a-zA-Z0-9]{36}' \
  && warnings+=("GitHub personal access token (ghp_…)")

# Bearer token in an assignment or header value
printf '%s' "$content" | grep -Eq 'Bearer [a-zA-Z0-9._~+/-]{20,}' \
  && warnings+=("Bearer token value")

# High-signal env-style assignments with a long value (e.g. API_KEY="abc123…")
# Require at least 16 chars for the value to filter out placeholder strings.
printf '%s' "$content" | grep -Eiq '(API_KEY|API_SECRET|SECRET_KEY|AUTH_SECRET|APP_SECRET|TOKEN|PASSWORD|PASSWD|SECRET)\s*[=:]\s*["\x27]?[a-zA-Z0-9+/=_.\-]{16,}' \
  && warnings+=("High-signal secret assignment (API_KEY/SECRET/TOKEN/PASSWORD)")

if [ "${#warnings[@]}" -gt 0 ]; then
  printf 'WARNING [detect-secrets]: Potential secrets detected in %s\n' "$file_path" >&2
  for w in "${warnings[@]}"; do
    printf '  - %s\n' "$w" >&2
  done
  printf 'Review before committing. This is a warning, not a block.\n' >&2
fi

# Always exit 0 — warn only, never block.
exit 0
