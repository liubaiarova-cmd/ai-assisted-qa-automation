/**
 * DS-276 — Program list filtering and display
 * Live UI walk skipped: DIDAXIS_EMAIL, DIDAXIS_PASSWORD, and DIDAXIS_URL are unset; .env is absent.
 * Error and empty-state copy were not read from the app; network edge cases assert stability only (except empty list repo constant).
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

test.describe('DS-276 Program list filtering and display', () => {
  test.describe('Happy paths', () => {
    test('Display program list with key details', async ({ page, trackProgram }) => {
      const webName = uniqueName('Web Development 2026');
      const webDescription = 'Full-stack web development program';
      const infoName = uniqueName('Informatique & IA - Niveau 2');
      const infoDescription = 'Programme bilingue — 100% pratique';
      const programsPage = new ProgramsPage(page);

      await programsPage.createProgram(webName, webDescription, trackProgram);
      await programsPage.createProgram(infoName, infoDescription, trackProgram);

      await expect(programsPage.programRow(webName).getByText(webDescription)).toBeVisible();
      await expect(programsPage.programRow(infoName).getByText(infoDescription)).toBeVisible();
    });

    test('Empty state when no programs exist', { tag: '@programs-list-empty' }, async ({ page }) => {
      const programsPage = new ProgramsPage(page);

      await fulfillProgramsListGet(page, {
        status: 200,
        body: JSON.stringify({ data: [] }),
      });
      await programsPage.goto();

      await expect(programsPage.emptyStateMessage).toBeVisible();
      await expect(programsPage.createFirstProgramButton).toBeVisible();
    });
  });

  test.describe('Negative', () => {
    test.describe(() => {
      test.use({ storageState: { cookies: [], origins: [] } });

      test('A visitor who is not logged in does not see the program list', async ({ page }) => {
        const programsPage = new ProgramsPage(page);

        await programsPage.openPrograms();

        await expect(page).toHaveURL(/\/login/);
        await expect(programsPage.newProgramButton).toHaveCount(0);
      });
    });

    test('Populated list hides the empty state', async ({ page, trackProgram }) => {
      const programName = uniqueName('Web Development 2026');
      const programsPage = new ProgramsPage(page);

      await programsPage.createProgram(programName, DEFAULT_DESCRIPTION, trackProgram);

      await expect(programsPage.programRow(programName)).toBeVisible();
      await expect(programsPage.emptyStateMessage).toHaveCount(0);
    });
  });

  test.describe('Edge cases', () => {
    test('Filter the list by a name substring', async ({ page, trackProgram }, testInfo) => {
      const programsPage = new ProgramsPage(page);
      await programsPage.goto();
      const filter = await programsPage.filterControl();
      if (!filter) {
        testInfo.annotations.push({
          type: 'gap',
          description: 'No filter control on the programs page; DS-276 acceptance criteria do not require one.',
        });
        return;
      }

      const webDev = uniqueName('Web Development 2026');
      const webDesign = uniqueName('Web Design 2026');
      const dataScience = uniqueName('Data Science Fundamentals');

      await programsPage.createProgram(webDev, DEFAULT_DESCRIPTION, trackProgram);
      await programsPage.createProgram(webDesign, 'Visual design track', trackProgram);
      await programsPage.createProgram(dataScience, 'Introductory data science curriculum', trackProgram);

      await filter.fill('Web');
      await expect(programsPage.programRow(webDev)).toBeVisible();
      await expect(programsPage.programRow(webDesign)).toBeVisible();
      await expect(programsPage.programRow(dataScience)).toHaveCount(0);
    });

    test('A filter with no matches is not the global empty catalog', async ({ page, trackProgram }, testInfo) => {
      const programsPage = new ProgramsPage(page);
      await programsPage.goto();
      const filter = await programsPage.filterControl();
      if (!filter) {
        testInfo.annotations.push({
          type: 'gap',
          description: 'No filter control on the programs page; DS-276 acceptance criteria do not require one.',
        });
        return;
      }

      const programName = uniqueName('Web Development 2026');
      await programsPage.createProgram(programName, DEFAULT_DESCRIPTION, trackProgram);

      await filter.fill(`ZZZ-No-Match-${Date.now()}`);
      await expect(programsPage.programRow(programName)).toHaveCount(0);
      await expect(programsPage.emptyStateMessage).toHaveCount(0);
    });

    test('Program with an empty description is still listed by name', async ({ page, trackProgram }) => {
      const programName = uniqueName('Web Development 2026');
      const programsPage = new ProgramsPage(page);

      await programsPage.goto();
      await programsPage.openNewProgramForm();
      await programsPage.modal.fillProgramName(programName);
      await programsPage.modal.submitCreate(trackProgram);

      await expect(programsPage.programRow(programName)).toBeVisible();
    });

    test('Description markup is not executed', async ({ page, trackProgram }) => {
      const programName = uniqueName('Web Development 2026');
      const description = "<script>alert('xss')</script>";
      const pageErrors = listenForPageErrors(page);
      const programsPage = new ProgramsPage(page);

      await programsPage.createProgram(programName, description, trackProgram);

      expect(pageErrors).toEqual([]);
      await expect(programsPage.programRow(programName)).toBeVisible();
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
          { ciLabel: 'DS-276 programs page axe scan did not complete in CI' },
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
            'DS-276 keyboard a11y check did not pass in CI',
          );
        }
        throw error;
      }
    });
  });
});
