/**
 * DS-274 — Program name validation and duplicate prevention
 * Live UI walk skipped: DIDAXIS_EMAIL, DIDAXIS_PASSWORD, and DIDAXIS_URL are unset; .env is absent.
 * Error and empty-state copy were not read from the app; network edge cases assert stability only (except empty list repo constant).
 */
import AxeBuilder from '@axe-core/playwright';
import type { Page } from '@playwright/test';
import { expect, test } from '../fixtures/cleanup.fixture';
import { NewProgramModal } from '../pages/NewProgramModal';
import { ProgramsPage } from '../pages/ProgramsPage';
import { reportCiA11yFailureAndSkip, runA11yCheck } from '../utils/a11y-expect';
import { uniqueName, type TrackProgram } from './support/didaxis-programs';

test.setTimeout(120_000);

const programsListApi = /\/api\/programs$/;
const DEFAULT_DESCRIPTION = 'Full-stack web development program';

/** Exact 100-character name from features/DS-274.feature (no uniqueName suffix). */
const PROGRAM_NAME_100_CHARS =
  'Web Development 2026 XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX';

function listenForPageErrors(page: Page): Error[] {
  const pageErrors: Error[] = [];
  page.on('pageerror', (error) => pageErrors.push(error));
  return pageErrors;
}

async function expectStableProgramsUi(
  page: Page,
  programsPage: ProgramsPage,
  pageErrors: Error[],
): Promise<void> {
  expect(pageErrors).toEqual([]);
  if (page.url().includes('/login')) {
    await expect(page).toHaveURL(/\/login/);
    return;
  }
  await expect(programsPage.newProgramButton).toBeVisible();
}

async function openCreateModal(programsPage: ProgramsPage): Promise<NewProgramModal> {
  await programsPage.goto();
  const modal = await programsPage.openNewProgramForm();
  await expect(modal.newProgramHeading).toBeVisible();
  await expect(modal.dialog).toBeVisible();
  return modal;
}

async function expectProgramRowVisible(programsPage: ProgramsPage, programName: string): Promise<void> {
  await expect(programsPage.modal.dialog).toBeHidden({ timeout: 20_000 });
  await expect(programsPage.firstProgramRow(programName)).toBeAttached({ timeout: 15_000 });
  await programsPage.scrollFirstProgramRowIntoView(programName);
  await expect(programsPage.firstProgramRow(programName)).toBeVisible();
}

async function seedProgram(
  programsPage: ProgramsPage,
  programName: string,
  description: string,
  trackProgram: TrackProgram,
): Promise<void> {
  await programsPage.goto();
  const modal = await programsPage.openNewProgramForm();
  await modal.fill(programName, description);
  await modal.submitCreate(trackProgram);
}

async function fulfillProgramsSave(page: Page, status: number): Promise<void> {
  await page.route(programsListApi, async (route) => {
    if (route.request().method() !== 'POST') {
      await route.continue();
      return;
    }
    await route.fulfill({
      status,
      contentType: 'application/json',
      body: JSON.stringify({ message: 'mock programs save response' }),
    });
  });
}

async function runSaveStatusEdgeCase(
  page: Page,
  programsPage: ProgramsPage,
  trackProgram: TrackProgram,
  status: number,
): Promise<void> {
  const pageErrors = listenForPageErrors(page);
  const programName = uniqueName('Web Development 2026');

  await programsPage.goto();
  await programsPage.openNewProgramForm();
  await programsPage.modal.fill(programName, DEFAULT_DESCRIPTION);
  await fulfillProgramsSave(page, status);
  await programsPage.modal.clickCreate(trackProgram, { required: false });
  await expectStableProgramsUi(page, programsPage, pageErrors);
}

async function fulfillProgramsListGet(
  page: Page,
  options: { status: number; body: string; contentType?: string },
): Promise<void> {
  await page.route(programsListApi, async (route) => {
    if (route.request().method() !== 'GET') {
      await route.continue();
      return;
    }
    await route.fulfill({
      status: options.status,
      contentType: options.contentType ?? 'application/json',
      body: options.body,
    });
  });
}

async function runListStatusEdgeCase(
  page: Page,
  programsPage: ProgramsPage,
  status: number,
  body = JSON.stringify({ message: 'mock programs list response' }),
): Promise<void> {
  const pageErrors = listenForPageErrors(page);
  await fulfillProgramsListGet(page, { status, body });
  await programsPage.openProgramsShell();
  await expectStableProgramsUi(page, programsPage, pageErrors);
}

test.describe('DS-274 Program name validation and duplicate prevention', () => {
  test.describe('Happy paths', () => {
    test('Accept program name with special characters', async ({ page, trackProgram }) => {
      const programName = uniqueName('Informatique & IA - Niveau 2');
      const programsPage = new ProgramsPage(page);
      const modal = await openCreateModal(programsPage);

      await modal.fill(programName, 'Programme avec caractères spéciaux');
      await modal.submitCreate(trackProgram);

      await expect(modal.dialog).toBeHidden();
      await expectProgramRowVisible(programsPage, programName);
    });
  });

  test.describe('Negative', () => {
    test('Reject program name with only whitespace', async ({ page }) => {
      const programsPage = new ProgramsPage(page);
      const modal = await openCreateModal(programsPage);

      await modal.fill('   ', DEFAULT_DESCRIPTION);

      await expect(modal.createButton).toBeDisabled();
      await expect(modal.dialog).toBeVisible();
    });

    test('Reject duplicate program name', async ({ page, trackProgram }) => {
      const programName = uniqueName('Web Development 2026');
      const programsPage = new ProgramsPage(page);

      await seedProgram(programsPage, programName, DEFAULT_DESCRIPTION, trackProgram);

      const modal = await openCreateModal(programsPage);
      await modal.fill(programName, DEFAULT_DESCRIPTION);
      await modal.clickCreate(trackProgram, { required: false });

      await expect(programsPage.duplicateError).toBeVisible();
      await expect(modal.dialog).toBeVisible();
      await expect(programsPage.programRow(programName)).toHaveCount(1);
    });

    test('Empty Program Name keeps Create disabled', async ({ page }) => {
      const programsPage = new ProgramsPage(page);
      const modal = await openCreateModal(programsPage);

      await modal.fillDescription(DEFAULT_DESCRIPTION);

      await expect(modal.createButton).toBeDisabled();
      await expect(modal.dialog).toBeVisible();
    });
  });

  test.describe('Edge cases', () => {
    test('Leading and trailing spaces do not bypass duplicate prevention', async ({
      page,
      trackProgram,
    }) => {
      const programName = uniqueName('Web Development 2026');
      const programsPage = new ProgramsPage(page);

      await seedProgram(programsPage, programName, DEFAULT_DESCRIPTION, trackProgram);

      const modal = await openCreateModal(programsPage);
      await modal.fill(`  ${programName}  `, DEFAULT_DESCRIPTION);
      await modal.clickCreate(trackProgram, { required: false });

      await expect(programsPage.duplicateError).toBeVisible();
      await expect(programsPage.programRow(programName)).toHaveCount(1);
    });

    test('Case-variant duplicate name is rejected', async ({ page, trackProgram }) => {
      const programName = uniqueName('Web Development 2026');
      const programsPage = new ProgramsPage(page);

      await seedProgram(programsPage, programName, DEFAULT_DESCRIPTION, trackProgram);

      const modal = await openCreateModal(programsPage);
      await modal.fill(programName.toLowerCase(), DEFAULT_DESCRIPTION);
      await modal.clickCreate(trackProgram, { required: false });

      await expect(programsPage.duplicateError).toBeVisible();
      await expect(programsPage.programRow(programName)).toHaveCount(1);
    });

    test('Single-character Program Name is accepted', async ({ page, trackProgram }) => {
      const programName = uniqueName('A');
      const programsPage = new ProgramsPage(page);
      const modal = await openCreateModal(programsPage);

      await modal.fill(programName, DEFAULT_DESCRIPTION);
      await modal.submitCreate(trackProgram);

      await expect(modal.dialog).toBeHidden();
      await expectProgramRowVisible(programsPage, programName);
    });

    test('Program Name at 100 characters', async ({ page, trackProgram }) => {
      expect(PROGRAM_NAME_100_CHARS.length).toBe(100);
      const programsPage = new ProgramsPage(page);
      const modal = await openCreateModal(programsPage);

      await modal.fill(PROGRAM_NAME_100_CHARS, DEFAULT_DESCRIPTION);

      if (await modal.createButton.isDisabled()) {
        await expect(modal.createButton).toBeDisabled();
        await expect(programsPage.programRow(PROGRAM_NAME_100_CHARS)).toHaveCount(0);
        return;
      }

      const lengthErrorVisible = await modal.lengthError
        .isVisible({ timeout: 2_000 })
        .catch(() => false);
      if (lengthErrorVisible) {
        await expect(modal.lengthError).toBeVisible();
        await expect(programsPage.programRow(PROGRAM_NAME_100_CHARS)).toHaveCount(0);
        return;
      }

      await modal.submitCreate(trackProgram);
      await expectProgramRowVisible(programsPage, PROGRAM_NAME_100_CHARS);
    });

    test('Description is not required for a valid name', async ({ page, trackProgram }) => {
      const programName = uniqueName('Informatique & IA - Niveau 2');
      const programsPage = new ProgramsPage(page);
      const modal = await openCreateModal(programsPage);

      await modal.fillProgramName(programName);

      if (await modal.createButton.isDisabled()) {
        await expect(modal.createButton).toBeDisabled();
        return;
      }

      await modal.submitCreate(trackProgram);
      await expectProgramRowVisible(programsPage, programName);
    });
  });

  test.describe('Programs network edge cases — save', () => {
    test('Save fulfilled with 503', { tag: '@programs-save-503' }, async ({ page, trackProgram }) => {
      const programsPage = new ProgramsPage(page);
      await runSaveStatusEdgeCase(page, programsPage, trackProgram, 503);
    });

    for (const status of [401, 403, 404, 501, 502, 400, 409, 422, 429, 500, 504, 408] as const) {
      test(`Save fulfilled with ${status}`, { tag: `@programs-save-${status}` }, async ({
        page,
        trackProgram,
      }) => {
        const programsPage = new ProgramsPage(page);
        await runSaveStatusEdgeCase(page, programsPage, trackProgram, status);
      });
    }

    test('Save fulfilled with 300', { tag: '@programs-save-300' }, async ({ page, trackProgram }) => {
      const programsPage = new ProgramsPage(page);
      await runSaveStatusEdgeCase(page, programsPage, trackProgram, 300);
    });
  });

  test.describe('Programs network edge cases — list', () => {
    test('Programs list fulfilled with 200 and an empty data array', { tag: '@programs-list-empty' }, async ({
      page,
    }) => {
      const programsPage = new ProgramsPage(page);
      await fulfillProgramsListGet(page, {
        status: 200,
        body: JSON.stringify({ data: [] }),
      });
      await programsPage.goto();
      await expect(programsPage.emptyStateMessage).toBeVisible();
      await expect(programsPage.createFirstProgramButton).toBeVisible();
    });

    test('Programs list fulfilled with 200 and a non-JSON body', { tag: '@programs-list-malformed' }, async ({
      page,
    }) => {
      const programsPage = new ProgramsPage(page);
      const pageErrors = listenForPageErrors(page);
      await fulfillProgramsListGet(page, {
        status: 200,
        contentType: 'text/plain',
        body: 'not-json',
      });
      await programsPage.openProgramsShell();
      await expectStableProgramsUi(page, programsPage, pageErrors);
    });

    test('Programs list fulfilled with 200 and data that is not an array', {
      tag: '@programs-list-malformed',
    }, async ({ page }) => {
      const programsPage = new ProgramsPage(page);
      const pageErrors = listenForPageErrors(page);
      await fulfillProgramsListGet(page, {
        status: 200,
        body: JSON.stringify({ data: {} }),
      });
      await programsPage.openProgramsShell();
      await expectStableProgramsUi(page, programsPage, pageErrors);
    });

    for (const status of [401, 403, 404, 501, 502, 503, 300, 204, 400, 500, 504, 408] as const) {
      test(`Programs list fulfilled with ${status}`, { tag: `@programs-list-${status}` }, async ({
        page,
      }) => {
        const programsPage = new ProgramsPage(page);
        await runListStatusEdgeCase(page, programsPage, status);
      });
    }
  });

  test.describe('Accessibility', () => {
    test(
      'Programs page axe scan reports WCAG 2 A and 2 AA violations',
      { tag: '@programs-a11y-axe' },
      async ({ page }, testInfo) => {
        await runA11yCheck(
          testInfo,
          async () => {
            const programsPage = new ProgramsPage(page);
            await programsPage.goto();
            const results = await new AxeBuilder({ page })
              .withTags(['wcag2a', 'wcag2aa'])
              .analyze();
            return results.violations;
          },
          { ciLabel: 'DS-274 programs page axe scan did not complete in CI' },
        );
      },
    );

    test('Keyboard opens the New Program dialog', { tag: '@programs-a11y-keyboard' }, async ({
      page,
    }, testInfo) => {
      const programsPage = new ProgramsPage(page);
      await programsPage.goto();

      try {
        for (let i = 0; i < 15; i += 1) {
          if (await programsPage.newProgramButton.evaluate((el) => el === document.activeElement)) {
            break;
          }
          await page.keyboard.press('Tab');
        }
        await expect(programsPage.newProgramButton).toBeFocused();
        await page.keyboard.press('Enter');
        await expect(programsPage.modal.dialog).toBeVisible();
      } catch (error) {
        if (process.env.CI) {
          await reportCiA11yFailureAndSkip(
            testInfo,
            error,
            'DS-274 keyboard a11y check did not pass in CI',
          );
        }
        throw error;
      }
    });
  });
});
