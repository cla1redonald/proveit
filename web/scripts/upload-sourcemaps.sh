#!/usr/bin/env bash
#
# Post-build: inject PostHog chunk IDs into Next.js production bundles and
# upload the source maps to PostHog. Then delete the .map files from the
# build output so they are NOT served publicly via the CDN.
#
# Wired into npm's lifecycle as the `postbuild` script — runs after every
# `next build`.
#
# We invoke posthog-cli via `npx --no-install` so the same script works in
# both environments. @posthog/cli is a devDependency, so `npm install`
# (run locally and on Vercel before build) places the binary on PATH at
# node_modules/.bin/posthog-cli, which npx finds.
#
# Authentication priority (matches posthog-cli's own resolution order):
#   1. Env vars POSTHOG_CLI_API_KEY + POSTHOG_CLI_PROJECT_ID
#      → required in CI (Vercel, GitHub Actions, etc.)
#   2. ~/.posthog/credentials.json (`posthog-cli login`)
#      → used during local builds on the maintainer's machine
#
# If neither auth path resolves, posthog-cli prints an error and we
# continue — the build still succeeds.
#
# The .map files are ALWAYS deleted post-attempt, so even a failed upload
# (auth or otherwise) doesn't leak source maps via the public CDN.
#
# Story #42 follow-up. See README "Error tracking via PostHog".

set -u

NEXT_BUILD_DIR=".next"
STATIC_DIR="$NEXT_BUILD_DIR/static"

if [ ! -d "$STATIC_DIR" ]; then
  echo "[upload-sourcemaps] $STATIC_DIR not found — did the build fail? Skipping."
  exit 0
fi

MAP_COUNT=$(find "$STATIC_DIR" -name "*.map" 2>/dev/null | wc -l | tr -d ' ')
if [ "$MAP_COUNT" -eq 0 ]; then
  echo "[upload-sourcemaps] No .map files in $STATIC_DIR — productionBrowserSourceMaps not enabled? Skipping."
  exit 0
fi

echo "[upload-sourcemaps] Found $MAP_COUNT .map files."

# @posthog/cli is a devDependency, so npx finds it at node_modules/.bin/.
# --no-install avoids npx fetching a fresh copy from the registry if it's
# missing — fail fast instead.
if ! npx --no-install posthog-cli --version >/dev/null 2>&1; then
  echo "[upload-sourcemaps] @posthog/cli not in node_modules — skipping upload. Run 'npm install' first."
else
  echo "[upload-sourcemaps] Uploading source maps to PostHog from $STATIC_DIR..."
  # `sourcemap process` runs inject + upload in one go and auto-derives the
  # release name + version from git when not provided.
  if npx --no-install posthog-cli --host "${POSTHOG_CLI_HOST:-https://eu.posthog.com}" sourcemap process -d "$STATIC_DIR"; then
    echo "[upload-sourcemaps] Upload succeeded."
  else
    echo "[upload-sourcemaps] Upload failed (continuing build anyway — best-effort)."
  fi
fi

echo "[upload-sourcemaps] Deleting .map files to prevent public exposure..."
find "$STATIC_DIR" -name "*.map" -delete 2>/dev/null || true

echo "[upload-sourcemaps] Done."
