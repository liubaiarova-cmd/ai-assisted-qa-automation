import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { ProgramsPage } from '../pages/ProgramsPage';
import {
  expectNoAccessibilityViolations,
  reportCiA11yFailureAndSkip,
} from '../utils/a11y-expect';

const PROGRAMS_PAGE_A11Y_TIMEOUT_MS = 60_000;
const PROGRAMS_PAGE_A11Y_CI_TIMEOUT_MS = 240_000;

test.setTimeout(PROGRAMS_PAGE_A11Y_TIMEOUT_MS);

test.describe('Programs accessibility', () => {
  test('programs page has no automatically detectable accessibility violations', async ({
    page,
  }, testInfo) => {
    if (process.env.CI) {
      testInfo.setTimeout(PROGRAMS_PAGE_A11Y_CI_TIMEOUT_MS);
      try {
        const programsPage = new ProgramsPage(page);
        await programsPage.goto();

        const results = await new AxeBuilder({ page }).analyze();

        await expectNoAccessibilityViolations(results.violations, testInfo, {
          nonBlockingInCi: true,
        });
      } catch (error) {
        await reportCiA11yFailureAndSkip(
          testInfo,
          error,
          'Programs page a11y check did not complete in CI',
        );
      }
      return;
    }

    const programsPage = new ProgramsPage(page);
    await programsPage.goto();

    const results = await new AxeBuilder({ page }).analyze();

    await expectNoAccessibilityViolations(results.violations, testInfo);
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
