#!/usr/bin/env bash
# block-sensitive-paths.sh — PreToolUse hook.
#
# Runs BEFORE a file write. Blocks writes to paths that should never be
# touched by an automated agent:
#   * ~/.ssh/**               — SSH keys and known-hosts
#   * ~/.aws/**               — AWS credentials and config
#   * ~/.gnupg/**             — GPG keyring
#   * files named id_rsa, id_ed25519, id_ecdsa, id_dsa (anywhere)
#   * any *.pem file
#   * files named "credentials" (AWS, GCP, etc.)
#   * .env files outside the current working directory (the repo)
#     — .env files INSIDE the repo root are allowed (managed by the project)
#
# Exit 2 = block.  Exit 0 = allow.  Never crash (missing jq → exit 0 safely).

set -uo pipefail

# Read the PreToolUse hook JSON from stdin.
input="$(cat)"

# jq availability — degrade gracefully if missing.
have_jq=1; command -v jq >/dev/null 2>&1 || have_jq=0

get() { # get <jq-path>
  [ "$have_jq" = 1 ] && printf '%s' "$input" | jq -r "$1 // empty" 2>/dev/null || true
}

file_path="$(get '.tool_input.file_path')"

# No path supplied — nothing to check, allow.
[ -n "$file_path" ] || exit 0

# Expand a leading ~ to $HOME.
expanded="${file_path/#\~/$HOME}"

# Resolve to an absolute path without requiring the file to exist.
# Use Python as a portable realpath that handles non-existent paths.
if command -v python3 >/dev/null 2>&1; then
  resolved="$(python3 -c "import os,sys; print(os.path.abspath(sys.argv[1]))" "$expanded" 2>/dev/null)" || resolved="$expanded"
elif command -v realpath >/dev/null 2>&1; then
  resolved="$(realpath -m "$expanded" 2>/dev/null)" || resolved="$expanded"
else
  resolved="$expanded"
fi

home="$HOME"
basename_part="$(basename "$resolved")"

block() { # block <reason>
  printf 'BLOCKED [block-sensitive-paths]: Cannot write to %s\n' "$file_path" >&2
  printf 'Reason: %s\n' "$1" >&2
  printf 'If this is intentional, perform the edit manually outside the agent session.\n' >&2
  exit 2
}

# ── Directory prefix checks ───────────────────────────────────────────────────

# ~/.ssh
if [[ "$resolved" == "$home/.ssh" || "$resolved" == "$home/.ssh/"* ]]; then
  block "~/.ssh is protected (SSH keys and config)"
fi

# ~/.aws
if [[ "$resolved" == "$home/.aws" || "$resolved" == "$home/.aws/"* ]]; then
  block "~/.aws is protected (AWS credentials and config)"
fi

# ~/.gnupg
if [[ "$resolved" == "$home/.gnupg" || "$resolved" == "$home/.gnupg/"* ]]; then
  block "~/.gnupg is protected (GPG keyring)"
fi

# ── Filename checks ───────────────────────────────────────────────────────────

# SSH private key files (common names, anywhere on disk)
case "$basename_part" in
  id_rsa|id_ed25519|id_ecdsa|id_dsa|id_rsa.pub|id_ed25519.pub|id_ecdsa.pub|id_dsa.pub)
    block "SSH key file names are protected ($basename_part)" ;;
esac

# .pem certificate / key files
case "$basename_part" in
  *.pem)
    block "PEM files are protected (private keys / certificates)" ;;
esac

# Files literally named "credentials" (AWS credential file, GCP ADC, etc.)
if [[ "$basename_part" == "credentials" ]]; then
  block "Files named 'credentials' are protected"
fi

# ── .env files outside the repo ───────────────────────────────────────────────
# Allow .env* inside the current working directory tree (the project repo).
# Block .env* anywhere else — those are system/global secret stores.
case "$basename_part" in
  .env|.env.*|*.env)
    repo_root="$(pwd)"
    if [[ "$resolved" != "$repo_root"* ]]; then
      block ".env files outside the project directory are protected ($resolved is outside $repo_root)"
    fi
    ;;
esac

# ── Allow everything else ─────────────────────────────────────────────────────
exit 0
