---
name: jira-bug-reporter
description: Analyzes Playwright test failures, identifies root cause, and creates a Jira Bug linked to the original story or task with expected vs actual results, severity, and priority. Use when a Playwright test fails, automation finds a product defect, or the user asks to file or report a bug from test output — including attaching screenshot evidence and citing the failing test or app source path.
---

# Jira Bug Reporter (Playwright failures)

Turn a failed Playwright run into a **Bug** in Jira that is **linked to the original ticket** (e.g. DS-1), with reproduction steps, expected vs actual behavior, evidence attachments, and paths to the failing test or relevant source.

**Do not fix the product or change test assertions** in this workflow unless the user explicitly asks — the deliverable is an accurate bug report.

**Do not save locally** — do not write bug drafts, reports, or copies of evidence into the repo (no new `.md`, `.json`, `docs/`, or `bugs/` files). Use existing Playwright/MCP artifact paths only for Jira attachments. The record of the bug lives in **Jira** (plus a short summary in chat).

## When to use

- A `@playwright/test` run failed (local, CI, or MCP-driven).
- The user names a ticket (DS-1, DS-2, …) and a failure or defect.
- The user says: file a bug, create a Jira bug, report this failure, attach screenshots.

## Related skills (use in order)

1. **systematic-debugging** — investigate root cause from logs, traces, and DOM before writing the ticket. Do not guess.
2. **triage-issue** — search Jira for duplicates before creating a new Bug. If a strong duplicate exists, add evidence to that issue instead (unless the user insists on a new ticket).

## Inputs to collect

| Source | What to extract |
|--------|-----------------|
| Playwright CLI / HTML report | Test title, file, line, error message, timeout, assertion diff |
| `test-results/` | Failure screenshots, videos, traces (`trace.zip`) |
| `playwright-report/` | Last run summary and embedded artifacts |
| `.playwright-mcp/` | Page snapshots (`.yml`), console logs from MCP sessions |
| Repo | `features/<TICKET>.feature` if present; spec under `tests/` |
| Jira parent ticket | Summary, acceptance criteria, environment notes |

Resolve **parent ticket key** from (first match wins): user message → Gherkin feature name → spec filename (`ds1-…` → DS-1) → test title tag/annotation.

## Workflow

### 1. Investigate the failure

1. Read the full error and stack trace; note **file:line** for the failing assertion or thrown error.
2. Identify whether the failure is a **product bug**, **test bug**, **environment/data**, or **flaky** timing. State that classification in the ticket (honest uncertainty is OK).
3. Derive **steps to reproduce** from the test body and any `Given`/`When`/`Then` in the matching `.feature` file — use concrete values (URLs, labels, data), not placeholders.
4. Write **expected result** and **actual result** as separate, testable statements (see [Expected vs actual](#expected-vs-actual-mandatory)).
5. Propose **severity** and **priority** with a short rationale (see [Severity and priority](#severity-and-priority-mandatory)).
6. Collect **evidence files** (absolute paths on disk):
   - Prefer Playwright’s failure screenshot under `test-results/`.
   - If missing, take a **browser screenshot** via Playwright MCP or re-run the single test with `npx playwright test <file> -g "<title>" --trace on` and capture artifacts.
   - Attach console errors from `.playwright-mcp/console-*.log` when relevant.

### 2. Duplicate check (recommended)

Run a focused Jira search (see **triage-issue**) using error text, component, and parent ticket key. If duplicate ≥90%, stop and offer to comment on the existing Bug with new evidence instead of creating another.

### Expected vs actual (mandatory)

These sections are **required** in every Bug description. They must be clearly separated and written so a developer can verify the fix without reading the test code.

**Expected result** — what should happen according to:

1. The parent ticket’s acceptance criteria (prefer quoting the relevant AC line).
2. The Gherkin `Then` step for the scenario, if `features/<KEY>.feature` exists.
3. The Playwright assertion message (`expect(…).to…`) or test title when AC is missing.

Format: one short lead sentence, then bullets if multiple outcomes matter.

- State **observable UI or API behavior** (visible text, URL, count, enabled/disabled), not implementation details.
- Use the same nouns as the steps to reproduce (button names, page titles, field labels).

**Actual result** — what happened when the steps were followed:

1. Describe **user-visible behavior** first (wrong screen, missing element, wrong copy, stale data).
2. Include the **automation failure** as supporting detail: assertion diff, timeout, HTTP status, console error — in a fenced code block.
3. Tie to evidence: “See attachment `…png` — dialog still open after Save.”

Do **not** merge expected and actual into one paragraph. Do **not** use vague wording (“doesn’t work”, “broken”) without specifics.

**Example (good):**

| | |
|---|---|
| **Expected** | After clicking **Save**, the Create Program dialog closes and the new program **"QA Program 42"** appears in the programs table. |
| **Actual** | The dialog stays open; **Save** remains enabled; the table does not list **"QA Program 42"**. Playwright: `Timed out 5000ms waiting for getByRole('dialog') to be hidden`. |

### Severity and priority (mandatory)

Set both on create when the Jira project supports them. If the user specifies values, use those. Otherwise propose defaults in the draft and apply on create after confirmation.

**Severity** — impact on users or data if this defect occurs in production (how bad is the broken behavior):

| Severity | When to use |
|----------|-------------|
| **Critical / Highest** | Data loss, security issue, complete inability to use core flow, no workaround |
| **Major / High** | Core feature broken for most users; wrong data shown; workaround painful or unclear |
| **Minor / Medium** | Feature partially broken; cosmetic + functional mix; reasonable workaround |
| **Trivial / Low** | Cosmetic only, typo, minor layout; no functional impact |

Derive from: blocked acceptance criterion on the parent story, whether the failure is on a happy path vs edge case, and whether the app shows misleading success (often **Major** or higher).

**Priority** — how soon the team should fix it relative to other work (urgency + severity + context):

| Priority | When to use |
|----------|-------------|
| **Highest** | Blocks release or parent story sign-off; CI red on main; production hotfix candidate |
| **High** | Blocks current sprint story; frequent user path; no acceptable workaround |
| **Medium** | Should fix in normal backlog; workaround exists; edge case with moderate impact |
| **Low** | Nice to fix later; rare path; low business impact |

For **Playwright failures on a story under test**, default to **Priority: Medium** and **Severity: Major** when a core AC fails, **Minor/Medium** for edge scenarios — adjust up if the parent ticket is release-critical.

**Jira fields:**

- **Priority** — set via `createJiraIssue` → `priority` (e.g. `"High"`, `"Medium"`). Use names valid on the site.
- **Severity** — often a custom field. If create fails or severity is required:
  1. `executeRead` → `getJiraIssueTypeMetaWithFields` for project + Bug type.
  2. Set `additional_fields` with the field **name** (e.g. `"Severity": "Major"`) or `customfield_*` ID from metadata.
  3. Retry using `repairHint` allowed values.

Repeat **Severity** and **Priority** at the top of the description (after Linked requirement) so they are visible even when custom fields are easy to miss:

```markdown
## Severity & priority
- **Severity:** Major — create-program happy path cannot be completed; no workaround.
- **Priority:** High — blocks acceptance of DS-1.
```

### 3. Draft the Bug content

**Summary (title)** — one line, specific:

`[<PARENT-KEY>] <component or screen>: <symptom> — <test id or scenario name>`

Examples:

- `[DS-1] Programs list: Create Program dialog does not close after save — TC-003`
- `[DS-5] Programs API: empty state shown when request fails — TC-007`

**Description** — use this structure in markdown:

```markdown
## Linked requirement
Parent ticket: <PARENT-KEY> — <parent summary>
Failing automation: `<repo-relative path to spec>` (line <n>)
Spec / scenario: `<path to .feature if any>` — Scenario: "<name>"

## Classification
<Product bug | Test defect | Environment | Flaky | Unknown — reason>

## Root cause (investigation)
<1–4 sentences: what the app did vs what the test expected; cite error message>

## Severity & priority
- **Severity:** <Critical | Major | Minor | Trivial> — <one-line rationale>
- **Priority:** <Highest | High | Medium | Low> — <one-line rationale>

## Steps to reproduce
1. …
2. …
3. …

## Expected result
<Observable correct behavior; quote AC or Gherkin Then if available>

## Actual result
<Observable incorrect behavior first, then automation error in a code block>

## Environment
- App URL: …
- Browser/project: … (from playwright.config.ts)
- Date/run: …

## Evidence
- Screenshot(s): attached — <filenames>
- Trace/video: <paths if not attached>

## Source references
- Test: `<path>:<line>`
- Application (if known): `<path>:<line>` or "unknown — UI-only failure"

## Notes
<Flakiness, data prerequisites, follow-ups>
```

### 4. Create the Jira Bug

1. Call `getAccessibleAtlassianResources` once per session; reuse `cloudId`.
2. Load the parent issue with `getJiraIssue` to confirm project key and context.
3. Create the Bug with `createJiraIssue`:
   - `issueType`: `Bug` (fallback: use `executeRead` → `listJiraProjectIssueTypesMetadata` if needed)
   - `projectKey`: same project as the parent ticket
   - `summary` / `description`: from step 3 (must include **Expected result**, **Actual result**, **Severity & priority** sections)
   - `priority`: from [Severity and priority](#severity-and-priority-mandatory) (required unless user says otherwise)
   - `additional_fields`: set **Severity** (and Components, etc.) when the project requires them — read `repairHint` and retry
   - `labels`: include `automated-test`, `playwright`, and the parent key (e.g. `DS-1`)

### 5. Link Bug to original ticket

Use `executeWrite` → `createJiraIssueLink`:

- `linkType`: `Relates` (default) or `Blocks` if the defect blocks acceptance of the parent story
- Direction: **Bug relates to Story** — e.g. `inwardIssue`: `<BUG-KEY>`, `outwardIssue`: `<PARENT-KEY>`, with link type **Relates** (wording varies by site; call `listJiraIssueLinkTypes` if the link fails)

Also mention the parent key in the description under **Linked requirement** so the link is visible even if linking fails once.

### 6. Attach screenshots and key artifacts

For each evidence file (screenshots first; then trace zip if size allows):

1. `executeWrite` → `uploadAttachmentToJiraIssue` with `filePath` only → run the returned `uploadCommand` in the shell from the correct working directory.
2. Call again with the returned `fileId` to attach to **`<BUG-KEY>`**.

Prefer PNG/JPEG screenshots for readability. Name files clearly in the description (e.g. `failure-step-3-dialog.png`).

### 7. Confirm to the user

Return:

- Bug key and browse URL
- Link to parent ticket
- **Severity**, **Priority**, and one-line **expected vs actual** summary
- List of attachments uploaded
- One-sentence root cause summary
- Whether a duplicate was found or skipped

## Project conventions (this repo)

- Tests live under `tests/` (e.g. `tests/ds1-create-program.spec.ts`).
- Gherkin checkpoints live under `features/<TICKET-KEY>.feature`.
- Default reporter: HTML → `playwright-report/`; traces on retry per `playwright.config.ts`.
- MCP debug artifacts may appear under `.playwright-mcp/`.

## Rules

- **No local save** — never persist the bug report on disk in this project; only create/update Jira issues and attach files already produced by the test run or MCP.
- **Evidence before claims** — attach or cite paths; do not invent screenshots or stack traces.
- **User confirmation** — if the user did not explicitly ask to create the ticket, show the draft summary and description first; create only after they approve (duplicate triage may change this to “comment on PROJ-123 instead”).
- **Secrets** — never paste credentials from `.env` into Jira; redact tokens and passwords in descriptions and attachments.
- **No silent skip** — if attachment upload or issue linking fails, report the error and what was still created.

## Example trigger

> DS-5 test TC-007 failed locally — file a Jira bug with screenshots.

Expected actions: read failure output → investigate → search duplicates → create Bug in same project as DS-5 → link Relates to DS-5 → attach `test-results/.../test-failed-1.png` → reply with bug key and links.
