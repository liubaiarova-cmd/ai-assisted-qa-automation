import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { ProgramsPage } from '../pages/ProgramsPage';
import { runA11yCheck } from '../utils/a11y-expect';

test.setTimeout(60_000);

test.describe('Programs accessibility', () => {
  test('programs page has no automatically detectable accessibility violations', async ({
    page,
  }, testInfo) => {
    await runA11yCheck(
      testInfo,
      async () => {
        const programsPage = new ProgramsPage(page);
        await programsPage.goto();
        const results = await new AxeBuilder({ page }).analyze();
        return results.violations;
      },
      { ciLabel: 'Programs page a11y check did not complete in CI' },
    );
  });

  test('New Program modal has no accessibility violations when color-contrast is disabled', async ({
    page,
  }, testInfo) => {
    await runA11yCheck(
      testInfo,
      async () => {
        const programsPage = new ProgramsPage(page);
        await programsPage.goto();
        const modal = await programsPage.openNewProgramForm();
        await expect(modal.dialog).toBeVisible();

        const results = await new AxeBuilder({ page })
          .include('[role="dialog"]')
          .disableRules(['color-contrast'])
          .analyze();
        return results.violations;
      },
      { ciLabel: 'New Program modal a11y check did not complete in CI' },
    );
  });
});
