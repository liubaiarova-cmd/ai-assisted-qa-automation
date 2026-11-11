#!/usr/bin/env bash
# Regenerates eval-report.md when an agent session ends (local orchestrator).
set -euo pipefail

ROOT="${CURSOR_PROJECT_DIR:-${CLAUDE_PROJECT_DIR:-$(git rev-parse --show-toplevel 2>/dev/null || pwd)}}"
cd "$ROOT"

export EVAL_TRIGGER="${EVAL_TRIGGER:-cursor-agent-stop}"
node scripts/generate-eval-report.mjs || {
  echo "eval-report: generation failed (non-fatal for hook)" >&2
}

printf '{}\n'
