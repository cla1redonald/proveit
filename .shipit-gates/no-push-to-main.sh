#!/usr/bin/env bash
# no-push-to-main.sh — ShipIt V4 gate, MANDATORY rule #2: never push directly to main.
#
# A PreToolUse(Bash) hook. Reads the hook JSON from stdin, looks at the proposed shell
# command, and BLOCKS (exit 2) if it would push to `main`. Branch first, then PR.
#
# Blocks:
#   git push origin main            (explicit main target)
#   git push -u origin main
#   git push origin HEAD:main       (refspec dst = main)
#   git push origin +main           (force ref)
#   git push  /  git push origin    (BARE push while the current branch IS main)
# Allows:
#   git push origin feature-x       (explicit non-main branch — even from a main checkout)
#   anything that isn't a git push
#
# exit 0 = allow, exit 2 = block. Never crashes a turn (degrades to allow on bad input).

set -uo pipefail

input="$(cat)"
command -v jq >/dev/null 2>&1 || exit 0   # no jq → can't inspect; don't block blindly

cmd="$(printf '%s' "$input" | jq -r '.tool_input.command // empty' 2>/dev/null)"
cwd="$(printf '%s' "$input" | jq -r '.cwd // empty' 2>/dev/null)"
[ -n "$cmd" ] || exit 0

# Must actually be a git push (covers `git -C dir push`, compound `... && git push`).
printf '%s' "$cmd" | grep -Eq '\bgit\b.*\bpush\b' || exit 0

block() {
  printf '[ShipIt gate: no-push-to-main] BLOCKED — %s\n' "$1" >&2
  printf 'MANDATORY rule #2: never push directly to main. Branch, then PR:\n' >&2
  printf '  git switch -c my-branch && git push -u origin my-branch && gh pr create\n' >&2
  exit 2
}

# 1. Explicit `main` target anywhere in the command (as a standalone ref or a refspec dst).
if printf '%s' "$cmd" | grep -Eq '(^|[[:space:]])\+?(refs/heads/)?main([[:space:]]|$)' \
   || printf '%s' "$cmd" | grep -Eq ':(refs/heads/)?main([[:space:]]|$)'; then
  block "the command pushes to main explicitly"
fi

# 2. Bare push (no explicit branch/refspec) while the current branch IS main.
rest="${cmd#*push}"
remote_seen=0; explicit_ref=0
# shellcheck disable=SC2086
set -- $rest
for tok in "$@"; do
  case "$tok" in
    -*) continue ;;                                   # a flag (-u, --force, …)
  esac
  if [ "$remote_seen" -eq 0 ]; then remote_seen=1; continue; fi  # first positional = remote
  explicit_ref=1                                      # a positional past the remote = a refspec
done

if [ "$explicit_ref" -eq 0 ]; then
  branch="$(git -C "${cwd:-.}" rev-parse --abbrev-ref HEAD 2>/dev/null || echo '')"
  [ "$branch" = "main" ] && block "a bare push from the 'main' branch would push main"
fi

exit 0
