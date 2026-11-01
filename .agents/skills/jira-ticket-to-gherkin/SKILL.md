---
name: jira-ticket-to-gherkin
description: Turns a Jira ticket's acceptance criteria into structured, reviewable Gherkin test scenarios. Use this skill whenever the user references a Jira ticket (DS-1, DS-2, etc.) and asks for test cases, a test plan, scenarios, or wants to plan testing for a ticket — even if they don't say the word "Gherkin". Includes programs list and save edge cases fulfilled later with page.route.
---

# Jira Ticket to Gherkin Test Cases

Generate reviewable test scenarios from a Jira ticket. The Gherkin output
is a human-readable checkpoint — the QA reviews it before any Playwright
code gets written.

## Steps

1. Read the referenced Jira ticket using the Atlassian MCP. Extract the title, description, and every acceptance criterion.

2. Generate test scenarios as a Gherkin `.feature` file:
   - One `Feature`, named after the ticket
   - Cover every acceptance criterion with at least one `Scenario`
   - Add negative scenarios — what should NOT happen
   - Add edge-case scenarios — boundaries, empty inputs, duplicates, special characters, max length
   - When the ticket touches the programs list or saving a program, add one scenario per programs network edge case in `.cursor/rules/programs-network-edge-cases.mdc`: **503** on save, **200** with `{ "data": [] }`, **200** with a malformed body, and the other statuses that rule lists (**401, 403, 404, 501, 502, 300**, plus the extra save and list statuses). Before writing `Then`, open the real page (Playwright MCP → `agent-browser` → Playwright CLI) and read the error and empty-state copy. Quote that text. If that case renders nothing, say so. Do not invent the string. Note the single tag (`@programs-save-<status>`, `@programs-list-<status>`, `@programs-list-empty`, or `@programs-list-malformed`). The scenario mocks only the call whose UI reaction it checks, never the request it is verifying.
   - When the ticket touches the programs page, add two `# Accessibility` scenarios, one tag each. Axe: `withTags(['wcag2a', 'wcag2aa'])`, `expect(results.violations).toEqual([])`, and the `Then` step lists real violation `id`, `impact`, and `help` from a live scan, or "none". `.include()` / `.exclude()` only for a noisy third-party widget, with a comment why. Keyboard: Tab to the primary control, it is focused, Enter opens the dialog. Steps use POM actions, not inline locators. Tags: `@programs-a11y-axe` and `@programs-a11y-keyboard`. Note that these checks are informational in CI and must not turn the build red.

3. Write each scenario in Given / When / Then form. `Given` sets the starting state, `When` is the action under test, `Then` is the observable expected outcome.

4. Group scenarios with comments: `# Happy paths`, `# Negative`, `# Edge cases`.

5. Use real, specific values from the ticket — never placeholders.

6. End the file with a comment block listing any ambiguities or gaps found in the ticket's acceptance criteria, so the QA can resolve them.

## Output

Save as `features/<ticket-key>.feature`.
