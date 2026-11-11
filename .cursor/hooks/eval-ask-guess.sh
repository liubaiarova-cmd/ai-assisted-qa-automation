#!/usr/bin/env bash
# Logs AskQuestion (ask) and heuristic guesses to .eval/ask-guess.jsonl for eval-report.md.
set -euo pipefail

ROOT="${CURSOR_PROJECT_DIR:-${CLAUDE_PROJECT_DIR:-$(git rev-parse --show-toplevel 2>/dev/null || pwd)}}"
LEDGER="$ROOT/.eval/ask-guess.jsonl"
mkdir -p "$ROOT/.eval"

payload="$(cat)"
tool_name="$(printf '%s' "$payload" | python3 -c 'import json,sys; d=json.load(sys.stdin); print(d.get("tool_name") or d.get("toolName") or "")' 2>/dev/null || true)"

append() {
  local type="$1"
  local detail="$2"
  printf '%s\n' "{\"ts\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\",\"type\":\"$type\",\"detail\":$(python3 -c 'import json,sys; print(json.dumps(sys.argv[1]))' "$detail")}" >> "$LEDGER"
}

case "$tool_name" in
  AskQuestion)
    append ask "$tool_name"
  ;;
  Write)
    file_path="$(printf '%s' "$payload" | python3 -c 'import json,sys; d=json.load(sys.stdin); print(d.get("file_path") or d.get("path") or "")' 2>/dev/null || true)"
    if [[ "$file_path" == *"/tests/"* ]] && [[ "$file_path" =~ \.(spec|test)\.[cm]?[jt]sx?$ ]]; then
      # Heuristic: spec write without a preceding user answer in the same session is a guess candidate.
      # Hooks cannot see full session state; log for human/aggregate review only.
      append guess "spec_write:$file_path"
    fi
  ;;
esac

printf '{}\n'
