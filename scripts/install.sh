#!/usr/bin/env bash
# Installs agent-dev-team for Claude Code, and optionally for other agent tools.
#
#   ./scripts/install.sh                          plugin mode (default)
#   ./scripts/install.sh --mode copy              copy into ~/.claude/skills and ~/.claude/agents
#   ./scripts/install.sh --target codex --target gemini
#   ./scripts/install.sh --uninstall
#
# plugin mode registers this repository as a local Claude Code marketplace. Everything is
# namespaced (/agent-dev-team:...), nothing is copied, and uninstall is one command.
# copy mode places the files directly, prefixing skill directories with adt- so they
# cannot collide with your own.

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PLUGIN_NAME="agent-dev-team"
CLAUDE_HOME="${HOME}/.claude"
PREFIX="adt-"

MODE="plugin"
UNINSTALL=0
FORCE=0
TARGETS=()

while [ $# -gt 0 ]; do
  case "$1" in
    --mode) MODE="$2"; shift 2 ;;
    --target) TARGETS+=("$2"); shift 2 ;;
    --uninstall) UNINSTALL=1; shift ;;
    --force) FORCE=1; shift ;;
    -h|--help) sed -n '2,14p' "$0" | sed 's/^# \{0,1\}//'; exit 0 ;;
    *) echo "unknown option: $1" >&2; exit 1 ;;
  esac
done

case "$MODE" in
  plugin|copy) ;;
  *) echo "--mode must be plugin or copy" >&2; exit 1 ;;
esac

step() { printf '  %s\n' "$1"; }
ok()   { printf '  \033[32mOK\033[0m   %s\n' "$1"; }
warn() { printf '  \033[33mWARN\033[0m %s\n' "$1"; }

for required in skills agents references .claude-plugin/plugin.json; do
  [ -e "$REPO_ROOT/$required" ] || { echo "Not a complete checkout: missing $required" >&2; exit 1; }
done

target_path() {
  case "$1" in
    codex)    echo ".codex/skills" ;;
    gemini)   echo ".gemini/skills" ;;
    cursor)   echo ".cursor/skills" ;;
    opencode) echo ".config/opencode/skills" ;;
    windsurf) echo ".codeium/windsurf/skills" ;;
    *) echo "" ;;
  esac
}

install_plugin() {
  command -v claude >/dev/null 2>&1 || {
    echo "The 'claude' CLI is not on PATH. Install Claude Code, or use: --mode copy" >&2
    exit 1
  }
  step "Registering marketplace from $REPO_ROOT"
  claude plugin marketplace add "$REPO_ROOT" || {
    echo "claude plugin marketplace add failed. See the output above." >&2
    exit 1
  }
  step "Installing ${PLUGIN_NAME}@${PLUGIN_NAME}"
  claude plugin install "${PLUGIN_NAME}@${PLUGIN_NAME}" || {
    echo "claude plugin install failed. See the output above." >&2
    exit 1
  }
  ok "Plugin installed. Start a new Claude Code session to load it."
  printf '\n  Try:  /agent-dev-team:team  add rate limiting to the upload endpoint\n'
}

uninstall_plugin() {
  command -v claude >/dev/null 2>&1 || { echo "The 'claude' CLI is not on PATH." >&2; exit 1; }
  claude plugin uninstall "$PLUGIN_NAME" || true
  claude plugin marketplace remove "$PLUGIN_NAME" || true
  ok "Plugin removed."
}

install_copy() {
  mkdir -p "$CLAUDE_HOME/skills" "$CLAUDE_HOME/agents"
  local count=0
  for skill in "$REPO_ROOT"/skills/*/; do
    local name dest
    name="$(basename "$skill")"
    dest="$CLAUDE_HOME/skills/${PREFIX}${name}"
    rm -rf "$dest"
    cp -R "$skill" "$dest"
    count=$((count + 1))
  done

  # Skills reference the checklists by relative path, so they travel with them.
  rm -rf "$CLAUDE_HOME/skills/${PREFIX}references"
  cp -R "$REPO_ROOT/references" "$CLAUDE_HOME/skills/${PREFIX}references"

  local agents=0
  for agent in "$REPO_ROOT"/agents/*.md; do
    cp "$agent" "$CLAUDE_HOME/agents/$(basename "$agent")"
    agents=$((agents + 1))
  done

  ok "$count skills -> $CLAUDE_HOME/skills (prefixed $PREFIX)"
  ok "$agents agents -> $CLAUDE_HOME/agents"
  warn "Agent names are not prefixed. An agent of yours with one of these names is overwritten."
}

uninstall_copy() {
  local removed=0
  for dir in "$CLAUDE_HOME"/skills/${PREFIX}*/; do
    [ -d "$dir" ] || continue
    rm -rf "$dir"
    removed=$((removed + 1))
  done
  for agent in "$REPO_ROOT"/agents/*.md; do
    local installed="$CLAUDE_HOME/agents/$(basename "$agent")"
    if [ -f "$installed" ]; then rm -f "$installed"; removed=$((removed + 1)); fi
  done
  ok "Removed $removed item(s)."
}

install_targets() {
  [ ${#TARGETS[@]} -eq 0 ] && return 0
  for tool in "${TARGETS[@]}"; do
    local sub dest
    sub="$(target_path "$tool")"
    [ -n "$sub" ] || { warn "unknown target: $tool"; continue; }
    dest="$HOME/$sub"
    mkdir -p "$dest"
    for skill in "$REPO_ROOT"/skills/*/; do
      rm -rf "$dest/$(basename "$skill")"
      cp -R "$skill" "$dest/$(basename "$skill")"
    done
    rm -rf "$dest/references"
    cp -R "$REPO_ROOT/references" "$dest/references"
    ok "$tool -> $dest"
  done
  warn "Agent personas are not copied to these tools. Point the tool at AGENTS.md in this repository instead."
}

printf '\nagent-dev-team installer\n'
printf '  repo: %s\n' "$REPO_ROOT"
printf '  mode: %s%s\n\n' "$MODE" "$([ $UNINSTALL -eq 1 ] && echo ' (uninstall)')"

if [ $UNINSTALL -eq 1 ]; then
  if [ "$MODE" = "plugin" ]; then uninstall_plugin; else uninstall_copy; fi
else
  if command -v node >/dev/null 2>&1; then
    step "Validating repository..."
    if ! node "$REPO_ROOT/scripts/validate.js"; then
      [ $FORCE -eq 1 ] || { echo "Validation failed. Fix the problems above, or re-run with --force." >&2; exit 1; }
    fi
  else
    warn "node not found; skipping pre-install validation"
  fi
  if [ "$MODE" = "plugin" ]; then install_plugin; else install_copy; fi
  install_targets
fi

printf '\n'
