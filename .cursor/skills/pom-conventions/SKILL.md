---
name: pom-conventions
description: >
  Creates Playwright Page Objects so tests do not repeat selectors. One class
  per page or component (LoginPage, ProgramsPage, NewProgramModal). Locators
  are readonly constructor properties in priority order getByRole, then
  getByLabel or getByPlaceholder, then getByText, then getByTestId. Disambiguate
  with filter({ hasText }). Action methods only; no assertions or waitForTimeout
  in pages/. Use when creating, reviewing, or refactoring page objects under
  pages/, or when a Playwright test needs UI actions, including a programs
  spec that fulfills /api/programs with page.route.
---

# Page Object conventions

## Steps

One Page Object class per page or distinct component. Examples: LoginPage, ProgramsPage, NewProgramModal.

Define locators as readonly properties in the constructor, in this priority order only: getByRole → getByLabel / getByPlaceholder → getByText → getByTestId (escape hatch only — comment why nothing higher worked). Never CSS selectors, XPath, or brittle text.

If a locator matches more than one element, disambiguate with .filter({ hasText }) — do not use .first().

Provide methods for user actions: goto, clickX, fillY, submit. Methods perform actions; they do not assert. Never use waitForTimeout inside POMs — callers wait with web-first expect(locator).toBeVisible() / .toBeEnabled() / .toHaveText().

No assertions inside Page Objects. All expect(...) calls live in the test files, never in pages/. Prefer auto-retrying web-first expects; never expect(await locator.isVisible()).toBe(true).

Compose POMs when a page contains distinct components — e.g. ProgramsPage holds a NewProgramModal instance.

Import POMs at the top of each spec; instantiate with new XxxPage(page).

`page.route` / `page.unroute` stay in the spec. Do not add route helpers to a POM. Programs clicks, fills, and navigation still go through ProgramsPage, NewProgramModal, or LoginPage. Methods that wait for HTTP 201 or a closed dialog (`submitCreate`, `createProgram`) are for a real success response only. Failed create fulfillments use `attemptCreate` or `clickCreate(track, { required: false })`; a failed update uses `clickSave`.

Accessibility specs use those POM locators too. The programs keyboard check tabs to `newProgramButton`, asserts `toBeFocused()`, presses Enter, and asserts `modal.dialog` is visible. Do not put role locators for that flow inline in the spec.

## Output

Page Object files in pages/. Tests in tests/ that import them.
