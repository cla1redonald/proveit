#!/usr/bin/env bash
set -euo pipefail

# ProveIt — Automated Setup
# Registers ProveIt as a Claude Code plugin by merging config into ~/.claude/settings.json

SETTINGS_DIR="$HOME/.claude"
SETTINGS_FILE="$SETTINGS_DIR/settings.json"
PROVEIT_PATH="$(cd "$(dirname "$0")" && pwd)"

# --- Colors (fall back to plain text if no tty) ---
if [[ -t 1 ]]; then
  GREEN='\033[0;32m'
  RED='\033[0;31m'
  YELLOW='\033[0;33m'
  BOLD='\033[1m'
  RESET='\033[0m'
else
  GREEN='' RED='' YELLOW='' BOLD='' RESET=''
fi

info()    { echo -e "${BOLD}$1${RESET}"; }
success() { echo -e "${GREEN}OK${RESET} $1"; }
error()   { echo -e "${RED}ERROR${RESET} $1" >&2; }
warn()    { echo -e "${YELLOW}NOTE${RESET} $1"; }

# --- Prerequisites ---
check_prereqs() {
  local missing=0

  if ! command -v claude &>/dev/null; then
    error "'claude' not found. Install Claude Code: https://claude.ai/download"
    missing=1
  fi

  if ! command -v node &>/dev/null; then
    error "'node' not found. Install Node.js: https://nodejs.org"
    missing=1
  else
    local node_major
    node_major=$(node -v | sed 's/v//' | cut -d'.' -f1)
    if [[ "$node_major" -lt 18 ]]; then
      error "Node.js 18+ required. Current: $(node -v)"
      missing=1
    fi
  fi

  if ! command -v jq &>/dev/null; then
    if [[ "$(uname)" == "Darwin" ]]; then
      error "'jq' not found. Install it: brew install jq"
    else
      error "'jq' not found. Install it: apt-get install jq (Debian/Ubuntu) or yum install jq (RHEL/CentOS)"
    fi
    missing=1
  fi

  if [[ $missing -ne 0 ]]; then
    echo ""
    echo "Install missing tools, then run this script again."
    exit 1
  fi

  success "Prerequisites (claude, node, jq)"
}

# --- Install ---
install_proveit() {
  # Create settings dir if needed
  mkdir -p "$SETTINGS_DIR" || {
    error "Cannot create $SETTINGS_DIR. Check permissions."
    exit 1
  }

  # Create settings file if needed
  if [[ ! -f "$SETTINGS_FILE" ]]; then
    echo '{}' > "$SETTINGS_FILE"
    warn "Created $SETTINGS_FILE"
  fi

  # Validate existing JSON
  if ! jq empty "$SETTINGS_FILE" 2>/dev/null; then
    error "$SETTINGS_FILE contains invalid JSON."
    error "Fix it manually or delete it, then run this script again."
    exit 1
  fi

  # Backup (timestamped to preserve previous backups)
  local backup_file="$SETTINGS_FILE.bak.$(date +%s)"
  cp "$SETTINGS_FILE" "$backup_file"
  success "Backed up settings to $(basename "$backup_file")"

  # Merge keys using dot-path notation (preserves all existing keys)
  jq --arg path "$PROVEIT_PATH" '
    .extraKnownMarketplaces.proveit.source = {
      "source": "directory",
      "path": $path
    } |
    .enabledPlugins["proveit@proveit"] = true
  ' "$SETTINGS_FILE" > "$SETTINGS_FILE.tmp"

  mv "$SETTINGS_FILE.tmp" "$SETTINGS_FILE"
  success "Registered ProveIt plugin at $PROVEIT_PATH"

  # Verify
  local ok=1
  jq -e '.extraKnownMarketplaces.proveit.source.path' "$SETTINGS_FILE" >/dev/null 2>&1 || ok=0
  jq -e '.enabledPlugins["proveit@proveit"] == true' "$SETTINGS_FILE" >/dev/null 2>&1 || ok=0

  if [[ $ok -eq 1 ]]; then
    success "Verified installation"
  else
    error "Verification failed. Check $SETTINGS_FILE manually."
    error "A backup is at $backup_file"
    exit 1
  fi

  print_quickstart
}

# --- Uninstall ---
uninstall_proveit() {
  if [[ ! -f "$SETTINGS_FILE" ]]; then
    warn "No settings file found at $SETTINGS_FILE. Nothing to uninstall."
    exit 0
  fi

  local backup_file="$SETTINGS_FILE.bak.$(date +%s)"
  cp "$SETTINGS_FILE" "$backup_file"
  success "Backed up settings to $(basename "$backup_file")"

  jq '
    del(.extraKnownMarketplaces.proveit) |
    del(.enabledPlugins["proveit@proveit"]) |
    if .extraKnownMarketplaces == {} then del(.extraKnownMarketplaces) else . end |
    if .enabledPlugins == {} then del(.enabledPlugins) else . end
  ' "$SETTINGS_FILE" > "$SETTINGS_FILE.tmp"

  mv "$SETTINGS_FILE.tmp" "$SETTINGS_FILE"

  # Verify removal
  if jq -e '.extraKnownMarketplaces.proveit' "$SETTINGS_FILE" >/dev/null 2>&1; then
    error "Uninstall verification failed. ProveIt config still present."
    error "A backup is at $backup_file"
    exit 1
  fi
  success "Verified ProveIt removed from settings"
  echo ""
  echo "To reinstall: ./setup.sh"
}

# --- Quick Start Guide ---
print_quickstart() {
  echo ""
  info "==========================================="
  info " ProveIt installed!"
  info "==========================================="
  echo ""
  echo "Start a new Claude Code session, then:"
  echo ""
  info "  Start validating an idea:"
  echo "  /proveit:proveit I want to build a habit tracker for remote teams"
  echo ""
  info "  Or resume a previous session:"
  echo "  /proveit:proveit"
  echo "  (reads discovery.md from the current directory)"
  echo ""
  info "  What you'll get:"
  echo "  - Structured discovery questions (desirability, viability, feasibility)"
  echo "  - Automated market research and competitor analysis"
  echo "  - Confidence scoring with honest kill signals"
  echo "  - discovery.md — persistent research document"
  echo "  - Handoff presentation for the technical team"
  echo ""
  info "  Tip: Create a directory for each idea:"
  echo "  mkdir ~/my-idea && cd ~/my-idea && /proveit:proveit"
  echo ""
}

# --- Main ---
case "${1:-}" in
  --uninstall)
    info "Uninstalling ProveIt..."
    check_prereqs
    uninstall_proveit
    ;;
  --help|-h)
    echo "Usage: ./setup.sh [--uninstall]"
    echo ""
    echo "  ./setup.sh             Install ProveIt as a Claude Code plugin"
    echo "  ./setup.sh --uninstall Remove ProveIt from Claude Code settings"
    ;;
  "")
    info "Installing ProveIt..."
    check_prereqs
    install_proveit
    ;;
  *)
    error "Unknown option: $1"
    echo "Usage: ./setup.sh [--uninstall]"
    exit 1
    ;;
esac
