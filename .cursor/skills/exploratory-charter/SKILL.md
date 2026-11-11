---
name: exploratory-charter
description: Turns a named feature and a named risk into an exploratory charter and an empty findings template. Use when the user asks for an exploratory charter, a session charter, session-based testing, SBTM, or a findings sheet for a manual explore. The thinking is human; the skill just keeps the format. Do not use for ticket acceptance criteria (jira-ticket-to-gherkin) or for finding untested flows to automate (explore-and-generate).
---

# Exploratory charter

The thinking is human; the skill just keeps the format.

Copy the human's feature and risk into the blanks. Leave every other blank empty. Do not add tactics, extra risks, oracles, or "also look at". Do not crawl the app, write Gherkin or Playwright, or file Jira.

## When

A person names a **feature** and a **risk** and wants a session to run by hand.

If either is missing, ask once for the missing piece and stop. Do not guess it.

| They want | Use |
|-----------|-----|
| A charter for a manual session | This skill |
| Acceptance criteria from a DS ticket | `jira-ticket-to-gherkin` |
| An untested flow to automate | `explore-and-generate` |
| A defect written up | `jira-bug-reporter`, after they confirm it |

## Charter

Emit this, with their words in the first two lines. Fill Time box, Setup, or Out of scope only when they already said so.

```markdown
# Charter

Explore: <feature, their words>
Risk: <risk, their words>
Time box:
Setup:
Out of scope:
```

## Findings

Emit this in the same reply. Leave the body empty.

```markdown
# Findings

Charter: Explore <feature> / Risk <risk>
Tester:
Date:
Build:

## Notes
-

## Bugs
| What I saw | Expected |
|------------|----------|

## Questions
-

## Coverage
Touched:
Not touched:
```

## When they come back with notes

Slot their words into the section they match.

- Unlabeled observations stay under **Notes**.
- A bug row only if they called it a bug, or stated both what they saw and what they expected.
- Do not add severity, a theory, or a next test.
- Do not file Jira unless they ask. Filing still goes through `jira-bug-reporter` after they confirm the defect.

Reply with the two blocks only. No file unless they name a path.
