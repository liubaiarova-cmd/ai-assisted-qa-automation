---
name: a11y-checks
description: Adds or verifies @axe-core/playwright accessibility scans in Playwright tests for pages, modals, and UI components. Use when generating, extending, or reviewing any Playwright spec that navigates to or interacts with a page or component — even if the user never mentions accessibility, a11y, WCAG, or axe.
---

# Accessibility checks (Axe + Playwright)

**Mandatory.** Any time you **write**, **extend**, or **review** a Playwright test that covers a **new page, route, modal, drawer, or reusable UI component**, you **must** include or verify an `@axe-core/playwright` scan. Do not skip because the user did not ask for accessibility. Treat missing axe coverage as an incomplete test, same as missing assertions on the primary user action.

## When this skill applies (always assume yes)

- New `*.spec.ts` or new `test()` / `test.describe()` for a screen or widget
- Refactors that change navigation, modal open/close, or visible UI under test
- Code review of tests under `tests/` that touch the DOM
- User asks only for “happy path” or functional coverage — **still add axe**

If the package is missing, add `@axe-core/playwright` (project already uses it) and mirror patterns in `tests/programs.a11y.spec.ts`.

## Required pattern

1. **Import** `AxeBuilder` from `@axe-core/playwright` and `expect` from `@playwright/test`.
2. **Reach a stable UI state** (page loaded, modal visible, component mounted) using POMs — no raw selectors in the spec when a POM exists.
3. **Run the scan:**

   ```typescript
   const results = await new AxeBuilder({ page }).analyze();
   ```

4. **Assert with a web-first expect** (violations must be empty):

   ```typescript
   await expect(results.violations).toEqual([]);
   ```

   Do not use bare `expect(results.violations.length).toBe(0)` if a matcher on the array is available; prefer `toEqual([])` for a clear failure diff.

## Page-level vs component-level

| Scope | When | AxeBuilder setup |
|-------|------|------------------|
| **Full page** | Default for route/screen tests | `new AxeBuilder({ page }).analyze()` after navigation settles |
| **Component / modal / region** | Dialogs, panels, isolated widgets | Chain `.include('<selector>')` so only that subtree is scanned |

**Component-level example** (modal already visible):

```typescript
const results = await new AxeBuilder({ page })
  .include('[role="dialog"]')
  .analyze();

await expect(results.violations).toEqual([]);
```

Prefer stable selectors aligned with the app (`role`, `aria-*`, test ids used elsewhere). Scope **after** the component is visible and interactive state is ready (not mid-transition).

## `.disableRules()` — strict policy

- **Never** use `.disableRules()` to make a failing test pass or to hide a real product defect.
- **Only** disable a rule when there is a **documented, temporary exception** (known false positive, tracked bug, or environment limitation).
- **Always** add an **inline comment** on the same line or immediately above explaining **why** the rule is disabled and **what** will remove the exception (ticket id, fix owner, or follow-up).

```typescript
// DS-XXX: modal header uses brand color below 4.5:1 until design tokens ship — re-enable color-contrast when fixed
const results = await new AxeBuilder({ page })
  .include('[role="dialog"]')
  .disableRules(['color-contrast'])
  .analyze();
```

If violations remain after a justified disable, **fix the product or the test** — do not stack more disabled rules.

## File and test layout

- Prefer a dedicated `*.a11y.spec.ts` next to functional specs when the screen is large (see `tests/programs.a11y.spec.ts`).
- For a small feature, a `test('… has no axe violations')` block inside the existing describe is acceptable.
- Reuse the same navigation/session setup as sibling tests (stored session, POM `goto()`, etc.).

## Review checklist (use when reviewing tests)

Copy and complete:

```
A11y review:
- [ ] AxeBuilder.analyze() runs at a stable UI state
- [ ] await expect(results.violations).toEqual([])
- [ ] Component/modal scans use .include(...)
- [ ] Any .disableRules() has a comment with reason + removal path
- [ ] No rule disabled solely to silence a failing violation
```

## On failure

Report violation `id`, `impact`, `help`, and affected nodes from `results.violations`. Do not weaken the assertion. Use **jira-bug-reporter** when the failure reflects a product defect and the user wants a ticket.
