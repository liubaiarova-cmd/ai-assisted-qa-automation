---
name: explore-and-generate
description: Finds untested user flows by diffing the live Didaxis UI against tests/ and emits one reviewable Gherkin plan for the highest-value gap. Use when the user says find what we're not testing, explore a page for untested flows, expand coverage, coverage gap, missing tests, or what should we automate next — especially with no Jira ticket. Do NOT use when a Jira ticket already drives the work (use jira-ticket-to-gherkin instead); this skill is for ticketless discovery only.
---

# Explore and Generate

Read-only discovery: map what tests already cover, walk the real app, diff
gaps, pick **one** high-value flow per run, output Gherkin for human review
and **test-writer** implementation. Do not write Playwright specs, edit app
source, or file Jira issues in this skill.

## Guardrails

- **No ticket** → this skill. **Ticket / AC** → `jira-ticket-to-gherkin`.
- **Read-only exploration**: `tests/`, `pages/`, and live UI via MCP only.
- **One uncovered flow per run** — do not batch multiple features.
- Prefer **accessibility snapshots** (`browser_snapshot` / MCP a11y tree), not
  screenshots or pixel checks, when mapping controls and flows.
- Record **which tool** you used in the output **UI recon** block.

## Step 1 — Map covered flows (`tests/`)

1. List specs under `tests/` (and linked `pages/` helpers).
2. For each spec, extract **user-visible flows**: entry route, actions, and
   outcomes asserted in `test()` titles and bodies.
3. Build a short **coverage inventory** (bullet list): flow name → spec file(s).
4. Note tags, `page.route` mocks, and setup projects so you do not double-count
   the same happy path.
5. When the user names a ticket (e.g. **DS-3**), also read
   `features/<KEY>.feature` if it exists and map each `@TC-*` scenario to a
   `tests/*` spec title — report unmapped scenarios or orphan specs.

## Step 2 — Crawl the target (Playwright MCP)

1. Resolve target page or area from the user (route, nav label, or feature name).
2. Login when needed: `DIDAXIS_URL`, `DIDAXIS_EMAIL`, `DIDAXIS_PASSWORD` from
   `.env` — never hardcode. If vars are missing, stop after Step 1 and document
   **Skipped recon**.
3. Use **`user-Playwright` MCP** first: `browser_navigate`, then
   `browser_snapshot` (and further snapshots after each meaningful navigation).
   Read roles, names, states, and links from the tree — not screenshots.
4. If MCP is unavailable, fall back per qa-orchestration: `agent-browser` snapshot
   (`snapshot -i`) or Playwright CLI (`npx playwright open`) — still treat
   snapshot output as the source of truth, not pixels.
5. Walk the target deeply enough to list **real** flows: primary actions,
   secondary menus, dialogs, empty states, validation, cancel/back, and error
   paths visible without destructive writes unless the user explicitly allows
   creating throwaway data (prefer read-only navigation when possible).

## Step 3 — Enumerate UI-supported flows

From snapshots and navigation, list **concrete user flows** the UI supports
(independent of tests), e.g. “open New Program modal from Programs list”,
“filter table”, “sign out”. Use observable UI labels from the a11y tree.

## Step 4 — Diff for coverage gaps

Compare Step 3 to Step 1. Mark each UI flow **covered**, **partially covered**
(which assertion is missing), or **uncovered**. The gap list is the input to
Step 5.

## Step 5 — Pick one highest-value flow

Choose **exactly one** uncovered (or materially partial) flow. In one short
paragraph, state **why** it wins (user impact, regression risk, AC-adjacent
behaviour with no ticket, data integrity, a11y-critical path, etc.). Do not
pick more than one flow in this run.

## Step 6 — Gherkin test plan (for test-writer)

Output a mini feature file content (in chat; optionally save as
`features/explore-<slug>.feature` if the user wants a file):

- `Feature:` named after the chosen flow (not a ticket key).
- **Two scenarios only** for this run:
  1. **Positive path** — happy path for the chosen flow.
  2. **One edge case** — boundary, empty input, cancel, duplicate, network
     edge, or empty state; pick the edge that matters most for that flow.
- Every **`Then`** must describe an **assertable** observable outcome (visible
  copy, URL, row count, dialog open/closed, disabled control, toast text read
  from the live UI during recon). No vague “should work” steps.
- Align `When` / `Then` with what you saw in Step 2; flag UI surprises under
  **Ambiguities**.
- Add locator hints only in the trailing comment block (order:
  `getByRole` → `getByLabel` / `getByPlaceholder` → `getByText` →
  `getByTestId` with reason). No CSS or XPath.
- End with a comment block:
  - **Coverage gap** (what was missing and why this flow was chosen)
  - **Ambiguities**
  - **UI recon** (tool, date, base URL, paths)
  - **Skipped recon** if applicable

Stop after the plan — human approval, then delegate to **test-writer**; do not
implement specs in this skill.

## Output checklist

- [ ] Coverage inventory from `tests/`
- [ ] UI flow list from a11y snapshots
- [ ] Gap diff
- [ ] One chosen flow + rationale
- [ ] Gherkin: 1 positive + 1 edge, every `Then` assertable
- [ ] No Playwright code in this step
