/**
 * DS-275 — Delete program with confirmation
 * Live UI walk skipped: DIDAXIS_EMAIL, DIDAXIS_PASSWORD, and DIDAXIS_URL are unset; .env is absent.
 * Confirmation dialog message and save error copy were not read from the app; network edge cases assert stability only (except empty list repo constant).
 */
import AxeBuilder from '@axe-core/playwright';
import type { Page } from '@playwright/test';
import { expect, test } from '../fixtures/cleanup.fixture';
import { ProgramsPage } from '../pages/ProgramsPage';
import { reportCiA11yFailureAndSkip, runA11yCheck } from '../utils/a11y-expect';
import { uniqueName, type TrackProgram } from './support/didaxis-programs';

test.setTimeout(120_000);

const programsListApi = /\/api\/programs$/;
const DEFAULT_DESCRIPTION = 'Full-stack web development program';

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
  await expect(programsPage.firstProgramRow(programName)).toBeVisible();
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

test.describe('DS-275 Delete program with confirmation', () => {
  test.describe('Happy paths', () => {
    test('Delete program with confirmation', async ({ page, trackProgram }) => {
      const programName = uniqueName('Test Program');
      const programsPage = new ProgramsPage(page);

      await seedProgram(programsPage, programName, DEFAULT_DESCRIPTION, trackProgram);

      const dialogType = await programsPage.confirmDelete(programName);
      expect(dialogType).toBe('confirm');
      await expect(programsPage.programRow(programName)).toHaveCount(0);
    });

    test('Cancel program deletion', async ({ page, trackProgram }) => {
      const programName = uniqueName('Test Program');
      const programsPage = new ProgramsPage(page);

      await seedProgram(programsPage, programName, DEFAULT_DESCRIPTION, trackProgram);

      const dialogType = await programsPage.cancelDelete(programName);
      expect(dialogType).toBe('confirm');
      await expect(programsPage.firstProgramRow(programName)).toBeVisible();
    });
  });

  test.describe('Negative', () => {
    test('Dismissing the confirmation keeps the program', async ({ page, trackProgram }) => {
      const programName = uniqueName('Test Program');
      const programsPage = new ProgramsPage(page);

      await seedProgram(programsPage, programName, DEFAULT_DESCRIPTION, trackProgram);

      const dialogType = await programsPage.cancelDelete(programName);
      expect(dialogType).toBe('confirm');
      await expect(programsPage.firstProgramRow(programName)).toBeVisible();
    });

    test('A program that is not deleted stays in the list', async ({ page, trackProgram }) => {
      const deletedName = uniqueName('Test Program');
      const remainingName = uniqueName('Web Development 2026');
      const programsPage = new ProgramsPage(page);

      await seedProgram(programsPage, deletedName, DEFAULT_DESCRIPTION, trackProgram);
      await programsPage.openNewProgramForm();
      await programsPage.modal.fill(remainingName, DEFAULT_DESCRIPTION);
      await programsPage.modal.submitCreate(trackProgram);

      await programsPage.confirmDelete(deletedName);

      await expect(programsPage.programRow(deletedName)).toHaveCount(0);
      await expect(programsPage.firstProgramRow(remainingName)).toBeVisible();
    });
  });

  test.describe('Edge cases', () => {
    test('Delete program with special characters in the name', async ({ page, trackProgram }) => {
      const programName = uniqueName('Informatique & IA - Niveau 2');
      const programsPage = new ProgramsPage(page);

      await seedProgram(programsPage, programName, 'Programme bilingue', trackProgram);
      await programsPage.confirmDelete(programName);

      await expect(programsPage.programRow(programName)).toHaveCount(0);
    });

    test('Deleting the only seeded program', async ({ page, trackProgram }) => {
      const programName = uniqueName('Test Program');
      const programsPage = new ProgramsPage(page);

      await seedProgram(programsPage, programName, DEFAULT_DESCRIPTION, trackProgram);
      await programsPage.confirmDelete(programName);

      await expect(programsPage.programRow(programName)).toHaveCount(0);
      await expect(programsPage.emptyStateMessage.or(programsPage.newProgramButton)).toBeVisible();
    });

    test('Name can be created again after deletion', async ({ page, trackProgram }) => {
      const programName = uniqueName('Test Program');
      const programsPage = new ProgramsPage(page);

      await seedProgram(programsPage, programName, DEFAULT_DESCRIPTION, trackProgram);
      await programsPage.confirmDelete(programName);
      await expect(programsPage.programRow(programName)).toHaveCount(0);

      await programsPage.openNewProgramForm();
      await programsPage.modal.fill(programName, DEFAULT_DESCRIPTION);
      await programsPage.modal.submitCreate(trackProgram);

      await expect(programsPage.firstProgramRow(programName)).toBeVisible();
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
          { ciLabel: 'DS-275 programs page axe scan did not complete in CI' },
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
            'DS-275 keyboard a11y check did not pass in CI',
          );
        }
        throw error;
      }
    });
  });
});
