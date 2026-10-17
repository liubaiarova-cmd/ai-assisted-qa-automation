# Refactor tests to Page Object Model

Refactor `tests/programs.spec.ts` to the Page Object Model. Do not delete existing tests.

- Create a `pages/` directory.
- Create `pages/LoginPage.ts`, `pages/NewProgramModal.ts`, and `pages/ProgramsPage.ts` (compose the modal inside `ProgramsPage`).
- Locators are readonly properties defined in the constructor, using `getByRole` / `getByLabel` / `getByText` only — no CSS, no XPath.
- Methods perform user actions (`goto`, `openNewProgramForm`, `createProgram`).
- No assertions inside the Page Objects — leave every `expect()` in the test.
- Update the spec to use the POMs so the test body has zero inline locators.
