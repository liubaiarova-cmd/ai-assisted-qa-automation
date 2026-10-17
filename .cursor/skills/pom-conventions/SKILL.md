---
name: pom-conventions
description: >
  Creates Playwright Page Objects using locators so tests do not repeat
  the same selectors. Use when creating, reviewing, or refactoring page
  objects under pages/, or when a Playwright test needs UI actions.
---

# Page Object conventions

create Page Objects using locators to prevent repeatability in tests

# You must:

analyze pages, locators are readonly properties defined in the constructor, using
  getByRole / getByLabel / getByText only — no CSS, no XPath.
- Methods perform user actions (goto, openNewProgramForm, createProgram, click).
- No assertions inside the Page Objects — leave every expect() in the test.

## Example

```ts
import type { Locator, Page } from '@playwright/test';

export class ProgramsPage {
  readonly newProgramButton: Locator;
  readonly programNameInput: Locator;
  readonly duplicateError: Locator;

  constructor(private readonly page: Page) {
    this.newProgramButton = page.getByRole('button', { name: '+ New Program' });
    this.programNameInput = page.getByLabel('Program Name');
    this.duplicateError = page.getByText(/already|duplicate|exists|in use/i);
  }

  async goto(): Promise<void> {
    await this.page.goto(programsUrl);
  }

  async openNewProgramForm(): Promise<void> {
    await this.newProgramButton.click();
  }

  async createProgram(programName: string): Promise<void> {
    await this.goto();
    await this.openNewProgramForm();
    await this.programNameInput.fill(programName);
  }
}
```

```ts
await programsPage.createProgram(name);
await expect(programsPage.duplicateError).toBeVisible();
```
