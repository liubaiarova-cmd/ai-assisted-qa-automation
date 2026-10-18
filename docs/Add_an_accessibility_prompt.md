Add an accessibility test using @axe-core/playwright.
- Create tests/programs.a11y.spec.ts.
- Use the stored session (no UI login).
- Navigate to https://test.didaxis.studio/programs via the ProgramsPage POM.
- Run AxeBuilder({ page }).analyze() and assert results.violations
  is empty with a web-first expect.
- Add a second test that scopes the scan to the New Program modal with
  .include(), and show how to disable a single rule with .disableRules().
Keep all locators role/label-based and route page interactions through POMs.
