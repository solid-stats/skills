#!/usr/bin/env bash
# Updates global and all project skills across the system.
# Usage: ./update-all-skills.sh [--dry-run]

set -euo pipefail

DRY_RUN=false
if [[ "${1:-}" == "--dry-run" ]]; then
  DRY_RUN=true
fi

BOLD='\033[1m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
DIM='\033[2m'
RESET='\033[0m'

run() {
  if $DRY_RUN; then
    echo -e "  ${DIM}[dry-run] $*${RESET}"
  else
    "$@"
  fi
}

header() { echo -e "\n${BOLD}$*${RESET}"; }
ok()     { echo -e "  ${GREEN}✓${RESET} $*"; }
warn()   { echo -e "  ${YELLOW}!${RESET} $*"; }
fail()   { echo -e "  ${RED}✗${RESET} $*"; }

ERRORS=()

# ── 1. Global skills ──────────────────────────────────────────────────────────
# `npx skills update` (>= v1.5.10) handles every source natively: GitHub via the
# API, SSH / self-hosted git via a real `git clone`. No per-host workaround needed.
header "Global skills"
if run npx skills update -g -y; then
  ok "Global skills updated"
else
  fail "Global skills update failed"
  ERRORS+=("global")
fi

# ── 2. Project skills ─────────────────────────────────────────────────────────
header "Project skills"

# Find all skills-lock.json files, exclude node_modules and .git
mapfile -t LOCK_FILES < <(
  find "${HOME}/Projects" -name "skills-lock.json" \
    -not -path "*/node_modules/*" \
    -not -path "*/.git/*" \
    2>/dev/null | sort
)

if [[ ${#LOCK_FILES[@]} -eq 0 ]]; then
  warn "No skills-lock.json files found under ~/Projects"
else
  for lock in "${LOCK_FILES[@]}"; do
    dir="$(dirname "$lock")"
    rel="${dir/#$HOME/~}"
    echo -e "\n  ${DIM}${rel}${RESET}"
    if (cd "$dir" && run npx skills update -p -y); then
      ok "${rel}"
    else
      fail "${rel}"
      ERRORS+=("$rel")
    fi
  done
fi

# ── Summary ───────────────────────────────────────────────────────────────────
echo ""
if [[ ${#ERRORS[@]} -eq 0 ]]; then
  echo -e "${GREEN}${BOLD}All skills updated successfully.${RESET}"
else
  echo -e "${RED}${BOLD}${#ERRORS[@]} location(s) failed:${RESET}"
  for e in "${ERRORS[@]}"; do
    echo -e "  ${RED}•${RESET} $e"
  done
  exit 1
fi
