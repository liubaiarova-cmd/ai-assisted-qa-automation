---
name: jira-ticket-to-gherkin
description: Turns a Jira ticket's acceptance criteria into structured, reviewable Gherkin test scenarios. Use this skill whenever the user references a Jira ticket (DS-1, DS-2, etc.) and asks for test cases, a test plan, scenarios, or wants to plan testing for a ticket — even if the user doesn't say the word "Gherkin".
---

# Jira Ticket to Gherkin Test Cases

Generate reviewable test scenarios from a Jira ticket. The Gherkin output
is a human-readable checkpoint — the QA reviews it before any Playwright
code gets written.

Ground scenarios in the **live Didaxis UI** when credentials are available,
not only ticket text.

## Steps

1. Read the referenced Jira ticket using the Atlassian MCP. Extract the
   title, description, and every acceptance criterion.

2. **UI reconnaissance** — before writing scenarios:
   - Base URL: `DIDAXIS_URL` or `https://test.didaxis.studio`. Login at
     `/login` with `DIDAXIS_EMAIL` / `DIDAXIS_PASSWORD` from `.env` — never
     hardcode. If either var is missing, skip recon and document **Skipped recon**.
   - Use the first option that works: **Playwright MCP** (`user-Playwright`) →
     **`agent-browser` CLI** (`open`, `wait --load networkidle`, `snapshot -i`,
     interact via `@refs`, `screenshot`, `close`) → **Playwright CLI** from repo root
     (`npx playwright open /login`, or `codegen` — do not commit codegen output).
     If MCP is unavailable, skip straight to `agent-browser` or Playwright CLI.
   - Walk only flows the ticket touches. Note routes, control labels (for
     `getByRole` / `getByLabel` / `getByText`), messages, and ticket-vs-UI gaps.
   - Reuse `pages/` and `tests/` for entry paths; confirm they still match the UI.
   - Record **which tool** you used in the feature file **UI recon** block.

3. Generate test scenarios as a Gherkin `.feature` file:
   - One `Feature`, named after the ticket
   - Cover every acceptance criterion with at least one `Scenario`
   - Add negative scenarios — what should NOT happen
   - Add edge-case scenarios — boundaries, empty inputs, duplicates,
     special characters, max length
   - Align `When` / `Then` steps with what you observed in the app when
     recon ran; flag ticket-vs-UI mismatches in ambiguities instead of guessing.

4. Write each scenario in Given / When / Then form. `Given` sets the
   starting state, `When` is the action under test, `Then` is the
   observable expected outcome.

5. Group scenarios with comments: `# Happy paths`, `# Negative`, `# Edge cases`.

6. Use real, specific values from the ticket — never placeholders.

7. End the file with a comment block:
   - **Ambiguities / gaps** in the ticket's acceptance criteria
   - **UI recon** (tool used, date, base URL, paths, locator hints)
   - **Skipped recon** reason if login env was unavailable

## Output

Save as `features/<ticket-key>.feature`.