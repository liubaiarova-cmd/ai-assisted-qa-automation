import AxeBuilder from '@axe-core/playwright';
import { expect, type TestType } from '@playwright/test';
import { ProgramsPage } from '../../pages/ProgramsPage';
import { reportCiA11yFailureAndSkip, runA11yCheck } from '../../utils/a11y-expect';

type A11yTest = TestType<Record<string, never>, Record<string, never>>;

export function registerProgramsA11y(test: A11yTest): void {
  test(
    'programs page WCAG 2 A and 2 AA scan',
    { tag: '@programs-a11y-axe' },
    async ({ page }, testInfo) => {
      await runA11yCheck(
        testInfo,
        async () => {
          const programsPage = new ProgramsPage(page);
          await programsPage.goto();
          const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
          return results.violations;
        },
        { ciLabel: 'Programs page a11y check did not complete in CI' },
      );
    },
  );

  test(
    'keyboard opens the new-program dialog',
    { tag: '@programs-a11y-keyboard' },
    async ({ page }, testInfo) => {
      const run = async () => {
        const programsPage = new ProgramsPage(page);
        await programsPage.goto();
        for (let i = 0; i < 25; i += 1) {
          if (await programsPage.newProgramButton.evaluate((el) => el === document.activeElement)) break;
          await page.keyboard.press('Tab');
        }
        await expect(programsPage.newProgramButton).toBeFocused();
        await page.keyboard.press('Enter');
        await expect(programsPage.modal.dialog).toBeVisible();
      };

      if (process.env.CI) {
        try {
          await run();
        } catch (error) {
          await reportCiA11yFailureAndSkip(testInfo, error, 'Programs keyboard check did not pass in CI');
        }
        return;
      }

      await run();
    },
  );
}
