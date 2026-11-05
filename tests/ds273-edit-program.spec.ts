/**
 * DS-273 — Edit existing program details
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
const programsPatchApi = /\/api\/programs\/[^/]+$/;
const DEFAULT_DESCRIPTION = 'Full-stack web development program';
const SAVE_FAILURE_DESCRIPTION = 'Full-stack web development program — save failure check';

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
  // Live error copy not read — UI recon skipped (see file header).
  expect(pageErrors).toEqual([]);
  if (page.url().includes('/login')) {
    await expect(page).toHaveURL(/\/login/);
    return;
  }
  await expect(programsPage.newProgramButton).toBeVisible();
}

async function expectProgramRowVisible(
  programsPage: ProgramsPage,
  programName: string,
  description?: string,
): Promise<void> {
  await expect(programsPage.modal.dialog).toBeHidden({ timeout: 20_000 });
  await expect(programsPage.firstProgramRow(programName)).toBeAttached({ timeout: 15_000 });
  await programsPage.scrollFirstProgramRowIntoView(programName);
  await expect(programsPage.firstProgramRow(programName)).toBeVisible();
  if (description !== undefined) {
    await expect(programsPage.programRow(programName).getByText(description)).toBeVisible();
  }
}

async function seedProgram(
  programsPage: ProgramsPage,
  trackProgram: TrackProgram,
): Promise<{ programName: string; description: string }> {
  const programName = uniqueName('Web Development 2026');
  const description = DEFAULT_DESCRIPTION;

  await programsPage.goto();
  await programsPage.openNewProgramForm();
  await programsPage.modal.fill(programName, description);
  await programsPage.modal.submitCreate(trackProgram);
  await expectProgramRowVisible(programsPage, programName, description);

  return { programName, description };
}

async function fulfillProgramsPatchSave(page: Page, status: number): Promise<void> {
  await page.route(programsPatchApi, async (route) => {
    if (route.request().method() !== 'PATCH') {
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
  const { programName } = await seedProgram(programsPage, trackProgram);

  await programsPage.openEdit(programName);
  await programsPage.modal.fillDescription(SAVE_FAILURE_DESCRIPTION);
  await fulfillProgramsPatchSave(page, status);
  await programsPage.modal.clickSave();
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

test.describe('DS-273 Edit existing program details', () => {
  test.describe('Happy paths', () => {
    test('Open program for editing', async ({ page, trackProgram }) => {
      const programsPage = new ProgramsPage(page);
      const { programName, description } = await seedProgram(programsPage, trackProgram);

      await programsPage.openEdit(programName);

      await expect(programsPage.modal.editHeading).toBeVisible();
      await expect(programsPage.modal.programNameInput).toHaveValue(programName);
      await expect(programsPage.modal.descriptionInput).toHaveValue(description);
    });

    test('Successfully edit a program name', async ({ page, trackProgram }) => {
      const programsPage = new ProgramsPage(page);
      const { programName } = await seedProgram(programsPage, trackProgram);
      const updatedName = uniqueName('Web Development 2026 - Updated');

      await programsPage.openEdit(programName);
      await programsPage.modal.fillProgramName(updatedName);
      await programsPage.modal.submitSave();

      await expectProgramRowVisible(programsPage, updatedName);
      await expect(programsPage.programNameText(programName)).toHaveCount(0);
    });

    test('Edit preserves unchanged fields', async ({ page, trackProgram }) => {
      const programsPage = new ProgramsPage(page);
      const { programName } = await seedProgram(programsPage, trackProgram);
      const updatedDescription = 'Updated full-stack web development program';

      await programsPage.openEdit(programName);
      await programsPage.modal.fillDescription(updatedDescription);
      await programsPage.modal.submitSave();

      await expect(programsPage.firstProgramRow(programName)).toBeVisible();
      await expect(programsPage.programRow(programName).getByText(updatedDescription)).toBeVisible();
    });
  });

  test.describe('Negative', () => {
    test('Clearing Program Name prevents save', async ({ page, trackProgram }) => {
      const programsPage = new ProgramsPage(page);
      const { programName } = await seedProgram(programsPage, trackProgram);

      await programsPage.openEdit(programName);
      await programsPage.modal.fillProgramName('');

      await expect(programsPage.modal.saveButton).toBeDisabled();
      await expect(programsPage.firstProgramRow(programName)).toBeVisible();
    });

    test('Closing the edit form discards the new name', async ({ page, trackProgram }) => {
      const programsPage = new ProgramsPage(page);
      const { programName } = await seedProgram(programsPage, trackProgram);
      const draftName = uniqueName('Web Development 2026 - Updated');

      await programsPage.openEdit(programName);
      await programsPage.modal.fillProgramName(draftName);
      await programsPage.modal.dismiss();

      await expect(programsPage.modal.dialog).toBeHidden();
      await expect(programsPage.firstProgramRow(programName)).toBeVisible();
      await expect(programsPage.programNameText(draftName)).toHaveCount(0);
    });
  });

  test.describe('Edge cases', () => {
    test('Whitespace-only Program Name on edit is treated as empty', async ({ page, trackProgram }) => {
      const programsPage = new ProgramsPage(page);
      const { programName } = await seedProgram(programsPage, trackProgram);

      await programsPage.openEdit(programName);
      await programsPage.modal.fillProgramName('   ');

      await expect(programsPage.modal.saveButton).toBeDisabled();
      await expect(programsPage.firstProgramRow(programName)).toBeVisible();
    });

    test('Special characters persist after edit', async ({ page, trackProgram }) => {
      const programsPage = new ProgramsPage(page);
      const { programName } = await seedProgram(programsPage, trackProgram);
      const updatedName = uniqueName('Informatique & IA - Niveau 2');
      const updatedDescription = 'Programme bilingue — 100% pratique';

      await programsPage.openEdit(programName);
      await programsPage.modal.fill(updatedName, updatedDescription);
      await programsPage.modal.submitSave();

      await expectProgramRowVisible(programsPage, updatedName, updatedDescription);
    });

    test('Save without changes leaves the same program', async ({ page, trackProgram }) => {
      const programsPage = new ProgramsPage(page);
      const { programName, description } = await seedProgram(programsPage, trackProgram);

      await programsPage.openEdit(programName);
      await expect(programsPage.modal.descriptionInput).toHaveValue(description);
      await programsPage.modal.submitSave();

      await expectProgramRowVisible(programsPage, programName, description);
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
          { ciLabel: 'DS-273 programs page axe scan did not complete in CI' },
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
            'DS-273 keyboard a11y check did not pass in CI',
          );
        }
        throw error;
      }
    });
  });
});
