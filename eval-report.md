# Suite reliability — eval report

Generated: 2026-11-11T22:52:51.871Z  
Trigger: `manual`

Cursor does not ship built-in telemetry for these metrics; numbers below are computed from GitHub Actions, PR history, optional `suite-run.log`, and local agent transcripts (see **How measured** under each section).

---

## Flake rate

**1 flaky / 194 completed tests (0.52% retry-only passes)** across 5 runs (last 10 E2E workflow runs (success/failure with Playwright summary)).

| Run | Conclusion | Flaky | Passed | Failed |
|-----|------------|-------|--------|--------|
| 42739712655 | success | 1 | 38 | 0 |
| 42729402391 | failure | 0 | 33 | 6 |
| 42729376668 | failure | 0 | 33 | 6 |
| 42712312058 | failure | 0 | 33 | 6 |
| 42712291866 | failure | 0 | 33 | 6 |

**How measured:** Parsed Playwright list-reporter lines (`N flaky`, `N passed`) from `gh run view <id> --log` on E2E workflow runs; merges in `suite-run.log` when present after local or Test generation suite steps.

**What it tells us:** Retry-only passes are instability under `retries: 2`; aim for ≤1% flake rate on unattended agent runs.

---

## Heal success rate

**50% (1/2)** cleanly healed (POM-only, E2E green). **Masked-regression count: 1** (must be 0).

| PR | State | First E2E | `tests/` diff? | Clean heal? |
|----|-------|-----------|----------------|-------------|
| #13 | OPEN | SUCCESS | no | yes |
| #9 | CLOSED | CANCELLED | yes | no |

**How measured:** PRs with `heal/` branch or `fix(pom)` / `Heal/` title via `gh pr list`; clean = `pages/` only + first `E2E Tests` SUCCESS; masked-regression = heal PR diff touching `tests/**`.

**What it tells us:** Self-heal is reliable only when assertions stay frozen; stop healing until assertion diffs are reverted.

---

## Generation-gate pass rate

**0% (0/6)** of agent generation PRs (green + conforming + maps-to-AC on first PR CI). On `main` now: **9/9** specs pass hook rules; **5/9** map to `features/DS-*.feature`.

| PR | E2E | Conforming | Maps AC | Gate |
|----|-----|------------|---------|------|
| #7 | FAILURE | no | no | fail |
| #6 | CANCELLED | no | no | fail |
| #5 | CANCELLED | no | no | fail |
| #4 | CANCELLED | no | no | fail |
| #3 | FAILURE | no | no | fail |
| #1 | NONE | no | no | fail |

**How measured:** DS/explore PRs; conforming = `.cursor/hooks/generation-gate.sh` rules; maps-to-AC = `tests/dsN-*` ↔ `features/DS-N.feature`; green = first `E2E Tests` conclusion on the PR.

**What it tells us:** First-PR green measures whether generated specs are merge-ready without human rework.

---

## Ask-vs-guess

**5 asks** vs **0 logged guesses** (transcript AskQuestion: 5; hook ledger: 0 ask / 0 guess).

**How measured:** `AskQuestion` tool invocations in project agent-transcript JSONL; optional `.eval/ask-guess.jsonl` from `.cursor/hooks/eval-ask-guess.sh`.

**What it tells us:** High guess count without asks usually means silent assumptions in locators, copy, or AC scope.

---

## Top reliability risk

Self-heal PRs touched `tests/` (masked-regression); assertions may have been changed to force green.

## Next action

Close or rewrite heal PRs that edited specs; heal pages-only and re-run the failing test unchanged.

---

_Regenerate: `npm run eval:report` · auto after `test-generation.yml` and agent `stop` / `sessionEnd` hooks._
