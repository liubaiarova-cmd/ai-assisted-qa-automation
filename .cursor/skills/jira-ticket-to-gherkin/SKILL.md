---
name: jira-ticket-to-gherkin
description: Turns a Jira ticket's acceptance criteria into structured, reviewable Gherkin test scenarios. Use this skill whenever the user references a Jira ticket (DS-1, DS-2, etc.) and asks for test cases, a test plan, scenarios, or wants to plan testing for a ticket — even if the user doesn't say the word "Gherkin". Includes programs list and save edge cases fulfilled later with page.route.
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
   - Walk only flows the ticket touches. Note routes, messages, ticket-vs-UI
     gaps, and locator hints in this order only: `getByRole` → `getByLabel` /
     `getByPlaceholder` → `getByText` → `getByTestId` (escape hatch only — say
     why). No CSS or XPath. If several elements match, note `.filter({ hasText })`,
     not `.first()`.
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
   - When the ticket touches the programs list or saving a program, add one
     scenario per programs network edge case in
     `.cursor/rules/programs-network-edge-cases.mdc`: **503** on save,
     **200** with `{ "data": [] }`, **200** with a malformed body, and the
     other statuses that rule lists (**401, 403, 404, 501, 502, 300**, plus
     the extra save and list statuses). `Then` quotes only error or
     empty-state copy read on the live page during recon. If that case
     renders nothing, the `Then` step says the app renders nothing. Do not
     invent the string. Note the single tag (`@programs-save-<status>`,
     `@programs-list-<status>`, `@programs-list-empty`, or
     `@programs-list-malformed`). The scenario mocks only the call whose UI
     reaction it checks, never the request it is verifying.
   - When the ticket touches the programs page, add two `# Accessibility`
     scenarios, one tag each. Axe: `withTags(['wcag2a', 'wcag2aa'])`,
     `expect(results.violations).toEqual([])`, and the `Then` step lists
     real violation `id`, `impact`, and `help` from a live scan, or "none".
     `.include()` / `.exclude()` only for a noisy third-party widget, with
     a comment why. Keyboard: Tab to the primary control, it is focused,
     Enter opens the dialog. Steps use POM actions, not inline locators.
     Tags: `@programs-a11y-axe` and `@programs-a11y-keyboard`. Note that
     these checks are informational in CI and must not turn the build red.

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