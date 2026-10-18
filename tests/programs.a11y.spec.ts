import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { ProgramsPage } from '../pages/ProgramsPage';

test.setTimeout(60_000);

test.describe('Programs accessibility', () => {
  test('programs page has no automatically detectable accessibility violations', async ({ page }) => {
    const programsPage = new ProgramsPage(page);
    await programsPage.goto();

    const results = await new AxeBuilder({ page }).analyze();

    await expect(results.violations).toEqual([]);
  });

  test('New Program modal has no accessibility violations when color-contrast is disabled', async ({
    page,
  }) => {
    const programsPage = new ProgramsPage(page);
    await programsPage.goto();
    const modal = await programsPage.openNewProgramForm();
    await expect(modal.dialog).toBeVisible();

    const results = await new AxeBuilder({ page })
      .include('[role="dialog"]')
      .disableRules(['color-contrast'])
      .analyze();

    await expect(results.violations).toEqual([]);
  });
});
