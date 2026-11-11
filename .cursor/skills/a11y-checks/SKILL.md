---
name: a11y-checks
description: Adds or verifies @axe-core/playwright accessibility scans and keyboard checks in Playwright tests for pages, modals, and UI components. Use when generating, extending, or reviewing any Playwright spec that navigates to or interacts with a page or component — even if the user never mentions accessibility, a11y, WCAG, keyboard focus, or axe.
---

# Accessibility checks (Axe + Playwright)

**Mandatory** for the programs page, and for any new page, route, modal, drawer, or reusable UI component. Two tests. One suite tag per test (`@regression` unless documented as `@smoke`). See `playwright-conventions.mdc` §11. Do not skip because the user did not ask.

Navigation, focus, and the dialog go through the existing POMs (`ProgramsPage`, `NewProgramModal`). No inline locators in the spec — no `getByRole`, `getByLabel`, `getByText`, CSS, or XPath there. Role-based locators stay on the POM.

## 1. Axe scan — `@programs-a11y-axe`

After `programsPage.goto()` has settled:

```typescript
const results = await new AxeBuilder({ page })
  .withTags(['wcag2a', 'wcag2aa'])
  .analyze();

await expect(results.violations).toEqual([]);
```

Run that scan inside `runA11yCheck` from `utils/a11y-expect.ts`. Locally the expect fails when violations exist. In CI the same violations are attached (`a11y-violations.json`, `a11y-violations.txt`), annotated, and logged as `::warning title=A11y …::`, and the test stays green. Accessibility results are an info state for the dev team. They must not turn CI red.

Chain `.include()` or `.exclude()` only when a third-party widget is noisy, and comment on that line why. Do not scope the programs page for any other reason. Do not call `.disableRules()` to hide a real violation.

When the scan finds violations, report each `id`, `impact`, `help`, and node target. Do not file a Jira bug unless a human asks.

## 2. Keyboard — `@programs-a11y-keyboard`

Axe does not cover this. Tab to the primary control (`programsPage.newProgramButton`). Assert `toBeFocused()`. Press Enter. Assert `programsPage.modal.dialog` is visible.

Press `Tab` until that POM locator is focused. Do not call `.focus()` — that skips tab order. Cap the tabs; a control that never focuses fails the assertion.

```typescript
test('programs-a11y-keyboard opens the new-program dialog', { tag: '@regression' }, async ({ page }) => {
  const programsPage = new ProgramsPage(page);
  await programsPage.goto();
  for (let i = 0; i < 15; i += 1) {
    if (await programsPage.newProgramButton.evaluate((el) => el === document.activeElement)) break;
    await page.keyboard.press('Tab');
  }
  await expect(programsPage.newProgramButton).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(programsPage.modal.dialog).toBeVisible();
});
```

In CI, a keyboard miss is reported the same way as an axe finding: attach the error, add a warning annotation, log `::warning title=A11y::`, and do not fail the job. `reportCiA11yFailureAndSkip` is the existing helper for that path. Locally the expects fail so the gap is visible.

## Other screens

Same two tests: `.withTags(['wcag2a', 'wcag2aa'])`, POM only, one suite tag each (`@regression`; title prefix `<screen>-a11y-axe` / `<screen>-a11y-keyboard`), CI stays green, real violations are reported.

## Review checklist

```
A11y review:
- [ ] withTags(['wcag2a', 'wcag2aa']) then analyze()
- [ ] expect(results.violations).toEqual([]) via runA11yCheck
- [ ] .include()/.exclude() only for a noisy third-party widget, with a comment
- [ ] Keyboard: Tab, toBeFocused(), Enter, dialog visible
- [ ] POM locators only; one tag per test
- [ ] CI does not fail; violations are attachments and warnings
```
