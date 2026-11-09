---
name: self-heal
description: >
  Repairs one drifted Playwright locator in its page object and opens a PR.
  Use when the user says "the build is red because a locator broke", "fix
  the drifted selector", "the test broke after a UI change", or "heal the
  suite". Use it ONLY after triage classifies the red run as a test issue
  (drift), never for a real app bug.
---

# Self-heal

One repair per run. Every heal becomes a PR. Do not merge.

Drift means triage classified the red run as a **test issue** because a locator no longer matches the element. Anything else is out of scope.

## Steps

1. Require triage's drift classification, else stop and route to bug-reporter.
2. From the trace, find the failing locator and its POM.
3. Re-discover the element via the Agent-Browser a11y tree by its role + current accessible name.
4. Patch the locator in the POM, minimal role-based diff, never the spec's assertions.
5. Re-run and prove green WITH assertions unchanged (green via a weakened assertion is a bug, escalate).
6. Report the old->new locator diff + the green run.

## 1. Gate

Read the triage diagnosis for this red run (`ci-failure-triage`). Continue only when it says **test issue** and the cause is locator drift (role, accessible name, or selector no longer matches).

Stop and do not edit `pages/` or `tests/` when:

- triage has not classified this run — do not invent a drift label; send the run through triage first
- classification is a real app bug, env/flake, wrong expected copy, or a clock mismatch
- the failure is an assertion about product behaviour, not a locator that missed its element

Route those to bug-reporter. Filing still waits for a human to confirm the defect.

## 2. Trace → locator

From the Playwright error and trace, record:

- spec path and exact test title
- the locator expression that failed
- the POM file and property (`pages/*.ts`) that owns it
- the call site (action method), not the `expect`

If the stack is only an `expect` in `tests/` and the locator still resolves, this is not drift. Stop (step 1).

## 3. Re-discover

Open the live page with `agent-browser` and read the accessibility tree. Login with `DIDAXIS_URL`, `DIDAXIS_EMAIL`, and `DIDAXIS_PASSWORD` from `.env` when the page requires it.

```bash
agent-browser open "$DIDAXIS_URL/<path>"
agent-browser wait --load networkidle
agent-browser snapshot -i
```

Match the element by **role + current accessible name** on that snapshot. Record the role and the name string you will put in `getByRole`. If several nodes share that role and name, note the visible text you will pass to `.filter({ hasText })`.

`snapshot -i` is the source of the new locator. Do not guess a name from the old selector or from memory.

## 4. Patch

Follow [pom-conventions](../pom-conventions/SKILL.md). Change only the one failing locator property:

- `getByRole('<role>', { name: '<accessible name>' })` taken from the snapshot
- disambiguate with `.filter({ hasText })` when role + name hit more than one node
- no CSS, no XPath, no `.first()`
- `getByTestId` only when role, label, placeholder, and text all fail — comment why

Do not edit the spec. Do not change, delete, or loosen any `expect`. Do not add `waitForTimeout`. One locator only; leave other drift for the next run.

## 5. Prove green

Re-run that test:

```bash
npx playwright test <spec> -g "<title>"
```

Before calling it healed, confirm assertions are the same as before the patch:

```bash
git diff -- tests/
```

`tests/` must have no assertion edits. A green run bought by weakening, removing, or rewriting an `expect` is a bug: revert the spec, stop, and escalate to bug-reporter. Do not open a heal PR for that run.

## 6. Report and PR

Report:

```markdown
## Heal
- POM: pages/<File>.ts `<property>`
- old: `<previous locator>`
- new: `<role + accessible name from the a11y snapshot>`
- spec assertions: unchanged
- run: `npx playwright test <spec> -g "<title>"` → passed
```

Open one PR for this repair. Do not merge. Title and body name the POM property, the old locator, the new locator, and the green command.
