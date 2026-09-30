import { expect, test } from '@playwright/test';
import {
  acceptDeleteConfirm,
  createProgram,
  emptyProgramsMessage,
  goToPrograms,
  login,
  openEditForm,
  openNewProgramForm,
  programFilter,
  programRow,
  programsUrl,
  submitCreate,
  submitSave,
  fillProgramForm,
  uniqueName,
} from './support/didaxis-programs';

test.setTimeout(120_000);

test.describe('Positive flows', () => {
  test.beforeEach(async ({ page }) => {
    test.skip(!process.env.DIDAXIS_EMAIL || !process.env.DIDAXIS_PASSWORD, 'Didaxis credentials missing');
    await login(page);
  });

  test('TC-001 — program list shows name and description', async ({ page }) => {
    const webName = uniqueName('Web Development 2026');
    const webDescription = 'Full-stack web development program';
    const dataName = uniqueName('Data Science Fundamentals');
    const dataDescription = 'Introductory data science curriculum';
    const securityName = uniqueName('Cybersecurity Bootcamp');
    const securityDescription = 'Security operations and incident response';

    await createProgram(page, webName, webDescription);
    await createProgram(page, dataName, dataDescription);
    await createProgram(page, securityName, securityDescription);

    await expect(programRow(page, webName).getByText(webDescription)).toBeVisible();
    await expect(programRow(page, dataName).getByText(dataDescription)).toBeVisible();
    await expect(programRow(page, securityName).getByText(securityDescription)).toBeVisible();
  });

  test('TC-002 — empty state explains how to create the first program', async ({ page }) => {
    await page.route(/\/api\/programs$/, async (route) => {
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

    await goToPrograms(page);

    await expect(page.getByText(emptyProgramsMessage)).toBeVisible();
    await expect(page.getByRole('button', { name: 'Create Program' })).toBeVisible();
    await expect(page.getByRole('button', { name: '+ New Program' })).toBeVisible();
  });

  test('TC-003 — the empty-state prompt opens program creation', async ({ page }) => {
    const programName = uniqueName('Mobile Development 2026');
    const description = 'iOS and Android track';
    const programsApi = /\/api\/programs$/;

    await page.route(programsApi, async (route) => {
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
    await goToPrograms(page);
    await page.getByRole('button', { name: 'Create Program' }).click();
    await page.unroute(programsApi);

    const dialog = page.getByRole('dialog');
    await expect(dialog.getByRole('heading', { name: 'New Program' })).toBeVisible();
    await fillProgramForm(dialog, programName, description);
    await submitCreate(dialog);

    await expect(page.getByText(emptyProgramsMessage)).toHaveCount(0);
    await expect(programRow(page, programName).getByText(description)).toBeVisible();
  });

  test('TC-004 — the list shows a newly created program without a manual refresh', async ({ page }) => {
    const programName = uniqueName('Cloud Computing 2026');
    const description = 'AWS and Azure fundamentals';

    await goToPrograms(page);
    const dialog = await openNewProgramForm(page);
    await fillProgramForm(dialog, programName, description);
    await submitCreate(dialog);

    await expect(programRow(page, programName).getByText(description)).toBeVisible();
  });
});

test.describe('Negative flows', () => {
  test('TC-005 — an unauthorized visitor does not see the program list', async ({ page }) => {
    await page.goto(programsUrl);

    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByRole('button', { name: 'Sign In' })).toBeVisible();
    await expect(page.getByRole('button', { name: '+ New Program' })).toHaveCount(0);
    await expect(page.getByText(emptyProgramsMessage)).toHaveCount(0);
  });

  test('TC-006 — the empty state is hidden when programs exist', async ({ page }) => {
    test.skip(!process.env.DIDAXIS_EMAIL || !process.env.DIDAXIS_PASSWORD, 'Didaxis credentials missing');
    await login(page);

    const programName = uniqueName('Web Development 2026');
    await createProgram(page, programName, 'Full-stack web development program');

    await expect(programRow(page, programName)).toBeVisible();
    await expect(page.getByText(emptyProgramsMessage)).toHaveCount(0);
  });

  test('TC-007 — a failed list load is distinct from an empty catalog', async ({ page }) => {
    test.fail(true, 'A failed programs request currently renders the empty state');
    test.skip(!process.env.DIDAXIS_EMAIL || !process.env.DIDAXIS_PASSWORD, 'Didaxis credentials missing');
    await login(page);

    await page.route(/\/api\/programs$/, async (route) => {
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
    await expect(page.getByRole('button', { name: '+ New Program' })).toBeVisible();
    await expect(page.getByText(emptyProgramsMessage)).toBeHidden();
    await expect(page.getByText(/error|retry|failed|try again/i)).toBeVisible();
  });

  test('TC-008 — a non-admin does not see a create prompt on an empty list', async ({ page }) => {
    const nonAdminEmail = process.env.DIDAXIS_NON_ADMIN_EMAIL;
    const nonAdminPassword = process.env.DIDAXIS_NON_ADMIN_PASSWORD;
    test.skip(
      !nonAdminEmail || !nonAdminPassword,
      'Set DIDAXIS_NON_ADMIN_EMAIL and DIDAXIS_NON_ADMIN_PASSWORD to run',
    );

    await page.goto(programsUrl);
    await page.getByLabel('Email').fill(nonAdminEmail!);
    await page.getByLabel('Password').fill(nonAdminPassword!);
    await page.getByRole('button', { name: 'Sign In' }).click();
    await page.waitForURL((url) => !url.pathname.includes('/login'));

    await page.route(/\/api\/programs$/, async (route) => {
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
    await goToPrograms(page);

    await expect(page.getByText(/no programs/i)).toBeVisible();
    await expect(page.getByRole('button', { name: '+ New Program' })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Create Program' })).toHaveCount(0);
  });
});

test.describe('Edge cases', () => {
  test.beforeEach(async ({ page }) => {
    test.skip(!process.env.DIDAXIS_EMAIL || !process.env.DIDAXIS_PASSWORD, 'Didaxis credentials missing');
    await login(page);
  });

  test('TC-009 — special characters display correctly in the list', async ({ page }) => {
    const programName = uniqueName('Informatique & IA - Niveau 2');
    const description = 'Programme bilingue — 100% pratique';

    await createProgram(page, programName, description);

    await expect(programRow(page, programName)).toBeVisible();
    await expect(programRow(page, programName).getByText(description)).toBeVisible();
  });

  test('TC-010 — long name and description stay inside their row', async ({ page }) => {
    const suffix = String(Date.now());
    const programName = `${'Long program name '.repeat(8).trim()} ${suffix}`;
    const description =
      'Introductory data science covering Python, statistics, and machine learning basics. '.repeat(4);

    await createProgram(page, programName, description);
    const neighborName = uniqueName('Layout Neighbor');
    await createProgram(page, neighborName, 'Short neighbor description');

    const longRow = programRow(page, programName);
    const neighborRow = programRow(page, neighborName);
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

  test('TC-011 — a program with an empty description is still listed', async ({ page }) => {
    const programName = uniqueName('Cybersecurity Bootcamp');

    await goToPrograms(page);
    const dialog = await openNewProgramForm(page);
    await dialog.getByLabel('Program Name').fill(programName);
    await submitCreate(dialog);

    const row = programRow(page, programName);
    await expect(row).toBeVisible();
    await expect(row.getByRole('paragraph')).toHaveCount(1);
  });

  test('TC-012 — a large program list still shows the created program', async ({ page }) => {
    const programName = uniqueName('Paged Program');
    const description = 'Visible among a large catalog';

    await createProgram(page, programName, description);
    const nextPage = page.getByRole('button', { name: /next/i });
    if ((await nextPage.count()) > 0) {
      await nextPage.first().click();
    }

    await expect(programRow(page, programName).getByText(description)).toBeVisible();
    expect(await page.getByRole('row').count()).toBeGreaterThan(2);
  });

  test('TC-013 — filtering by name keeps matching programs only', async ({ page }) => {
    await goToPrograms(page);
    const filter = await programFilter(page);
    test.skip(!filter, 'Programs page has no search or filter control');

    const suffix = Date.now();
    const webDev = `Web Development ${suffix}`;
    const webDesign = `Web Design ${suffix}`;
    const dataScience = `Data Science Fundamentals ${suffix}`;

    await createProgram(page, webDev, 'Full-stack web development program');
    await createProgram(page, webDesign, 'Visual design track');
    await createProgram(page, dataScience, 'Introductory data science curriculum');

    await filter!.fill('Web');
    await expect(programRow(page, webDev)).toBeVisible();
    await expect(programRow(page, webDesign)).toBeVisible();
    await expect(programRow(page, dataScience)).toHaveCount(0);
  });

  test('TC-014 — a filter with no matches is different from an empty catalog', async ({ page }) => {
    await goToPrograms(page);
    const filter = await programFilter(page);
    test.skip(!filter, 'Programs page has no search or filter control');

    await createProgram(page, uniqueName('Web Development 2026'), 'Full-stack web development program');
    await filter!.fill(`ZZZ-No-Match-${Date.now()}`);
    await expect(page.getByText(/no results|no matches|nothing found/i)).toBeVisible();
    await expect(page.getByText(emptyProgramsMessage)).toHaveCount(0);
  });

  test('TC-015 — the list can be sorted by name', async ({ page }) => {
    const sortControl = page.getByRole('button', { name: /sort/i });
    test.skip((await sortControl.count()) === 0, 'Programs page has no sort control');

    const alpha = uniqueName('Alpha Program');
    const beta = uniqueName('Beta Program');
    const gamma = uniqueName('Gamma Program');
    await createProgram(page, gamma, 'Gamma description');
    await createProgram(page, alpha, 'Alpha description');
    await createProgram(page, beta, 'Beta description');

    await sortControl.first().click();
    const names = await page.getByRole('row').allInnerTexts();
    const positions = [alpha, beta, gamma].map((name) => names.findIndex((row) => row.includes(name)));
    expect(positions[0]).toBeLessThan(positions[1]);
    expect(positions[1]).toBeLessThan(positions[2]);
  });

  test('TC-016 — the list updates after edit and delete', async ({ page }) => {
    const programName = uniqueName('Web Development 2026');
    const updatedName = `${programName} - Updated`;
    const description = 'Full-stack web development program';

    await createProgram(page, programName, description);
    const dialog = await openEditForm(page, programName);
    await dialog.getByLabel('Program Name').fill(updatedName);
    await submitSave(dialog);

    await expect(programRow(page, updatedName).getByText(description)).toBeVisible();
    await acceptDeleteConfirm(page, updatedName);
    await expect(programRow(page, updatedName)).toHaveCount(0);
  });

  test('TC-017 — HTML in a description is not executed in the list', async ({ page }) => {
    const programName = uniqueName('Security Test Program');
    const description = '<b>Bold</b> <script>alert(1)</script>';
    let alertSeen = false;

    page.on('dialog', async (dialog) => {
      alertSeen = true;
      await dialog.dismiss();
    });

    await createProgram(page, programName, description);

    expect(alertSeen).toBe(false);
    await expect(programRow(page, programName).getByText(description)).toBeVisible();
  });

  test('TC-018 — name and description stay readable on a narrow viewport', async ({ page }) => {
    const programName = uniqueName('Web Development 2026');
    const description = 'Full-stack web development program';

    await createProgram(page, programName, description);
    await page.setViewportSize({ width: 390, height: 844 });

    const row = programRow(page, programName);
    await row.scrollIntoViewIfNeeded();
    await expect(row.getByText(programName, { exact: true })).toBeVisible();
    await expect(row.getByText(description)).toBeVisible();
  });
});
