import type { Page } from '@playwright/test';
import { expect, test } from '../fixtures/cleanup.fixture';
import { LoginPage } from '../pages/LoginPage';
import { ProgramsPage } from '../pages/ProgramsPage';
import { programsUrl, uniqueName } from './support/didaxis-programs';

test.setTimeout(120_000);

const programsListApi = /\/api\/programs$/;

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

async function mockEmptyProgramsList(page: Page): Promise<void> {
  await page.route(programsListApi, async (route) => {
    if (route.request().method() !== 'GET') {
      await route.continue();
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ data: [] }),
    });
  });
}

test.describe('DS-5 Program list filtering and display', () => {
  test.describe('Happy paths', () => {
    test('TC-001 — program list shows name and description', async ({ page, trackProgram }) => {
      const webName = uniqueName('Web Development 2026');
      const webDescription = 'Full-stack web development program';
      const dataName = uniqueName('Data Science Fundamentals');
      const dataDescription = 'Introductory data science curriculum';
      const securityName = uniqueName('Cybersecurity Bootcamp');
      const securityDescription = 'Security operations and incident response';
      const programsPage = new ProgramsPage(page);

      await programsPage.createProgram(webName, webDescription, trackProgram);
      await programsPage.createProgram(dataName, dataDescription, trackProgram);
      await programsPage.createProgram(securityName, securityDescription, trackProgram);

      await expect(programsPage.programRow(webName).getByText(webDescription)).toBeVisible();
      await expect(programsPage.programRow(dataName).getByText(dataDescription)).toBeVisible();
      await expect(programsPage.programRow(securityName).getByText(securityDescription)).toBeVisible();
    });

    test('TC-002 — empty state explains how to create the first program', async ({ page }) => {
      const programsPage = new ProgramsPage(page);

      await mockEmptyProgramsList(page);
      await programsPage.goto();

      await expect(programsPage.emptyStateMessage).toBeVisible();
      await expect(programsPage.createFirstProgramButton).toBeVisible();
      await expect(programsPage.newProgramButton).toBeVisible();
    });

    test('TC-003 — the empty-state prompt opens program creation', async ({ page, trackProgram }) => {
      const programName = uniqueName('Mobile Development 2026');
      const description = 'iOS and Android track';
      const programsPage = new ProgramsPage(page);

      await mockEmptyProgramsList(page);
      await programsPage.goto();
      await programsPage.createFirstProgramButton.click();
      await page.unroute(programsListApi);

      await expect(programsPage.modal.newProgramHeading).toBeVisible();
      await programsPage.modal.fill(programName, description);
      await programsPage.modal.submitCreate(trackProgram);

      await expect(programsPage.emptyStateMessage).toHaveCount(0);
      await expectProgramRowVisible(programsPage, programName, description);
    });

    test('TC-004 — the list shows a newly created program without a manual refresh', async ({
      page,
      trackProgram,
    }) => {
      const programName = uniqueName('Cloud Computing 2026');
      const description = 'AWS and Azure fundamentals';
      const programsPage = new ProgramsPage(page);

      await programsPage.goto();
      await programsPage.openNewProgramForm();
      await programsPage.modal.fill(programName, description);
      await programsPage.modal.submitCreate(trackProgram);

      await expectProgramRowVisible(programsPage, programName, description);
    });
  });

  test.describe('Negative flows', () => {
    test.describe(() => {
      test.use({ storageState: { cookies: [], origins: [] } });

      test('TC-005 — an unauthorized visitor does not see the program list', async ({ page }) => {
        const loginPage = new LoginPage(page);

        await page.goto(programsUrl);

        await expect(page).toHaveURL(/\/login/);
        await expect(loginPage.signInButton).toBeVisible();
        await expect(page.getByRole('button', { name: '+ New Program' })).toHaveCount(0);
        await expect(page.getByText(/no programs yet/i)).toHaveCount(0);
      });
    });

    test('TC-006 — the empty state is hidden when programs exist', async ({ page, trackProgram }) => {
      const programName = uniqueName('Web Development 2026');
      const programsPage = new ProgramsPage(page);

      await programsPage.createProgram(programName, 'Full-stack web development program', trackProgram);

      await expect(programsPage.firstProgramRow(programName)).toBeVisible();
      await expect(programsPage.emptyStateMessage).toHaveCount(0);
    });

    test('TC-007 — a failed list load is distinct from an empty catalog', async ({ page }) => {
      test.fail(true, 'A failed programs request currently renders the empty state');

      const programsPage = new ProgramsPage(page);

      await page.route(programsListApi, async (route) => {
        if (route.request().method() !== 'GET') {
          await route.continue();
          return;
        }
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ message: 'failed' }),
        });
      });

      await page.goto(programsUrl);
      await expect(programsPage.newProgramButton).toBeVisible();
      await expect(programsPage.emptyStateMessage).toBeHidden();
      await expect(page.getByText(/error|retry|failed|try again/i)).toBeVisible();
    });

    test('TC-008 — a non-admin does not see a create prompt on an empty list', async ({ page }) => {
      const nonAdminEmail = process.env.DIDAXIS_NON_ADMIN_EMAIL;
      const nonAdminPassword = process.env.DIDAXIS_NON_ADMIN_PASSWORD;
      test.skip(
        !nonAdminEmail || !nonAdminPassword,
        'Set DIDAXIS_NON_ADMIN_EMAIL and DIDAXIS_NON_ADMIN_PASSWORD to run',
      );

      const programsPage = new ProgramsPage(page);
      const loginPage = new LoginPage(page);

      await loginPage.signIn(nonAdminEmail!, nonAdminPassword!);
      await mockEmptyProgramsList(page);
      await programsPage.goto();

      await expect(page.getByText(/no programs/i)).toBeVisible();
      await expect(programsPage.newProgramButton).toHaveCount(0);
      await expect(programsPage.createFirstProgramButton).toHaveCount(0);
    });
  });

  test.describe('Edge cases', () => {
    test('TC-009 — special characters display correctly in the list', async ({ page, trackProgram }) => {
      const programName = uniqueName('Informatique & IA - Niveau 2');
      const description = 'Programme bilingue — 100% pratique';
      const programsPage = new ProgramsPage(page);

      await programsPage.createProgram(programName, description, trackProgram);

      await expectProgramRowVisible(programsPage, programName, description);
    });

    test('TC-010 — long name and description stay inside their row', async ({ page, trackProgram }) => {
      const suffix = String(Date.now());
      const programName = `${'Long program name '.repeat(8).trim()} ${suffix}`;
      const description =
        'Introductory data science covering Python, statistics, and machine learning basics. '.repeat(4);
      const programsPage = new ProgramsPage(page);

      await programsPage.createProgram(programName, description, trackProgram);
      const neighborName = uniqueName('Layout Neighbor');
      await programsPage.createProgram(neighborName, 'Short neighbor description', trackProgram);

      const longRow = programsPage.programRow(programName);
      const neighborRow = programsPage.programRow(neighborName);
      await longRow.scrollIntoViewIfNeeded();
      const longBox = await longRow.boundingBox();
      const neighborBox = await neighborRow.boundingBox();

      expect(longBox).not.toBeNull();
      expect(neighborBox).not.toBeNull();
      const top = Math.min(longBox!.y, neighborBox!.y);
      const bottom = Math.max(longBox!.y + longBox!.height, neighborBox!.y + neighborBox!.height);
      expect(bottom - top).toBeGreaterThanOrEqual(longBox!.height + neighborBox!.height - 1);
      await expect(longRow.getByText(programName, { exact: true })).toBeVisible();
    });

    test('TC-011 — a program with an empty description is still listed', async ({ page, trackProgram }) => {
      const programName = uniqueName('Cybersecurity Bootcamp');
      const programsPage = new ProgramsPage(page);

      await programsPage.goto();
      await programsPage.openNewProgramForm();
      await programsPage.modal.fillProgramName(programName);
      await programsPage.modal.submitCreate(trackProgram);

      const row = programsPage.programRow(programName);
      await expect(row).toBeVisible();
      await expect(row.getByRole('paragraph')).toHaveCount(1);
    });

    test('TC-012 — a large program list still shows the created program', async ({ page, trackProgram }) => {
      const programName = uniqueName('Paged Program');
      const description = 'Visible among a large catalog';
      const programsPage = new ProgramsPage(page);

      await programsPage.createProgram(programName, description, trackProgram);
      const nextPage = page.getByRole('button', { name: /next/i });
      if ((await nextPage.count()) > 0) {
        await nextPage.first().click();
      }

      await expect(programsPage.programRow(programName).getByText(description)).toBeVisible();
      expect(await page.getByRole('row').count()).toBeGreaterThan(2);
    });

    test('TC-013 — filtering by name keeps matching programs only', async ({ page, trackProgram }) => {
      const programsPage = new ProgramsPage(page);

      await programsPage.goto();
      const filter = await programsPage.filterControl();
      test.skip(!filter, 'Programs page has no search or filter control');

      const suffix = Date.now();
      const webDev = `Web Development ${suffix}`;
      const webDesign = `Web Design ${suffix}`;
      const dataScience = `Data Science Fundamentals ${suffix}`;

      await programsPage.createProgram(webDev, 'Full-stack web development program', trackProgram);
      await programsPage.createProgram(webDesign, 'Visual design track', trackProgram);
      await programsPage.createProgram(dataScience, 'Introductory data science curriculum', trackProgram);

      await filter!.fill('Web');
      await expect(programsPage.programRow(webDev)).toBeVisible();
      await expect(programsPage.programRow(webDesign)).toBeVisible();
      await expect(programsPage.programRow(dataScience)).toHaveCount(0);
    });

    test('TC-014 — a filter with no matches is different from an empty catalog', async ({
      page,
      trackProgram,
    }) => {
      const programsPage = new ProgramsPage(page);

      await programsPage.goto();
      const filter = await programsPage.filterControl();
      test.skip(!filter, 'Programs page has no search or filter control');

      await programsPage.createProgram(
        uniqueName('Web Development 2026'),
        'Full-stack web development program',
        trackProgram,
      );
      await filter!.fill(`ZZZ-No-Match-${Date.now()}`);
      await expect(page.getByText(/no results|no matches|nothing found/i)).toBeVisible();
      await expect(programsPage.emptyStateMessage).toHaveCount(0);
    });

    test('TC-015 — the list can be sorted by name', async ({ page, trackProgram }) => {
      const programsPage = new ProgramsPage(page);

      await programsPage.goto();
      const sortControl = page.getByRole('button', { name: /sort/i });
      test.skip((await sortControl.count()) === 0, 'Programs page has no sort control');

      const alpha = uniqueName('Alpha Program');
      const beta = uniqueName('Beta Program');
      const gamma = uniqueName('Gamma Program');
      await programsPage.createProgram(gamma, 'Gamma description', trackProgram);
      await programsPage.createProgram(alpha, 'Alpha description', trackProgram);
      await programsPage.createProgram(beta, 'Beta description', trackProgram);

      await sortControl.first().click();
      const names = await page.getByRole('row').allInnerTexts();
      const positions = [alpha, beta, gamma].map((name) => names.findIndex((row) => row.includes(name)));
      expect(positions[0]).toBeLessThan(positions[1]);
      expect(positions[1]).toBeLessThan(positions[2]);
    });

    test('TC-016 — the list updates after edit and delete', async ({ page, trackProgram }) => {
      const programName = uniqueName('Web Development 2026');
      const updatedName = `${programName} - Updated`;
      const description = 'Full-stack web development program';
      const programsPage = new ProgramsPage(page);

      await programsPage.createProgram(programName, description, trackProgram);
      const editModal = await programsPage.openEdit(programName);
      await editModal.fillProgramName(updatedName);
      await editModal.clickSave();

      await expect(programsPage.modal.dialog).toBeHidden({ timeout: 45_000 });
      await expectProgramRowVisible(programsPage, updatedName, description);

      await programsPage.confirmDelete(updatedName);
      await expect(programsPage.programRow(updatedName)).toHaveCount(0);
    });

    test('TC-017 — HTML in a description is not executed in the list', async ({ page, trackProgram }) => {
      const programName = uniqueName('Security Test Program');
      const description = '<b>Bold</b> <script>alert(1)</script>';
      let alertSeen = false;
      const programsPage = new ProgramsPage(page);

      page.on('dialog', async (dialog) => {
        alertSeen = true;
        await dialog.dismiss();
      });

      await programsPage.createProgram(programName, description, trackProgram);

      expect(alertSeen).toBe(false);
      await expect(programsPage.programRow(programName).getByText(description)).toBeVisible();
    });

    test('TC-018 — name and description stay readable on a narrow viewport', async ({
      page,
      trackProgram,
    }) => {
      const programName = uniqueName('Web Development 2026');
      const description = 'Full-stack web development program';
      const programsPage = new ProgramsPage(page);

      await programsPage.createProgram(programName, description, trackProgram);
      await page.setViewportSize({ width: 390, height: 844 });

      const row = programsPage.programRow(programName);
      await row.scrollIntoViewIfNeeded();
      await expect(row.getByText(programName, { exact: true })).toBeVisible();
      await expect(row.getByText(description)).toBeVisible();
    });
  });
});
