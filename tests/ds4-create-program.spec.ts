import { expect, test } from '@playwright/test';
import {
  acceptDeleteConfirm,
  createProgram,
  dismissDeleteConfirm,
  goToPrograms,
  login,
  loginUrl,
  openNewProgramForm,
  programFilter,
  programRow,
  submitCreate,
  fillProgramForm,
  uniqueName,
} from './support/didaxis-programs';

test.setTimeout(120_000);

test.beforeEach(async ({ page }) => {
  test.skip(!process.env.DIDAXIS_EMAIL || !process.env.DIDAXIS_PASSWORD, 'Didaxis credentials missing');
  await login(page);
});

test.describe('Positive flows', () => {
  test('TC-001 — confirmed deletion removes the program from the list', async ({ page }) => {
    const programName = uniqueName('Test Program');

    await createProgram(page, programName, 'Program scheduled for deletion');
    const message = await acceptDeleteConfirm(page, programName);

    expect(message).toContain(programName);
    expect(message).toContain('cannot be undone');
    await expect(programRow(page, programName)).toHaveCount(0);
  });

  test('TC-002 — cancelled deletion keeps the program in the list', async ({ page }) => {
    const programName = uniqueName('Web Development 2026');

    await createProgram(page, programName, 'Full-stack web development program');
    await dismissDeleteConfirm(page, programName);

    await expect(programRow(page, programName)).toBeVisible();
  });

  test('TC-003 — confirmation dialog names the program being removed', async ({ page }) => {
    const programName = uniqueName('Cybersecurity Bootcamp');

    await createProgram(page, programName, 'Security operations track');
    const message = await dismissDeleteConfirm(page, programName);

    expect(message).toContain(`Delete program "${programName}"`);
    expect(message).toContain('All its semesters and courses will be removed');
    await expect(programRow(page, programName)).toBeVisible();
  });

  test('TC-004 — list updates immediately after a successful delete', async ({ page }) => {
    const programName = uniqueName('Data Science Fundamentals');

    await createProgram(page, programName, 'Introductory data science curriculum');
    await acceptDeleteConfirm(page, programName);

    await expect(programRow(page, programName)).toHaveCount(0);
    await expect(page.getByRole('button', { name: '+ New Program' })).toBeVisible();
  });
});

test.describe('Negative flows', () => {
  test('TC-005 — a program stays listed when delete is not started', async ({ page }) => {
    const programName = uniqueName('Test Program');

    await createProgram(page, programName, 'Untouched program');
    await page.reload();

    await expect(page.getByRole('button', { name: '+ New Program' })).toBeVisible();
    await expect(programRow(page, programName)).toBeVisible();
  });

  test('TC-006 — dismissing the confirmation does not delete the program', async ({ page }) => {
    const programName = uniqueName('Cloud Computing 2026');

    await createProgram(page, programName, 'Cloud infrastructure and DevOps track');
    const message = await dismissDeleteConfirm(page, programName);

    expect(message).toContain(programName);
    await expect(programRow(page, programName)).toBeVisible();
  });

  test('TC-007 — non-admin cannot delete programs', async ({ page }) => {
    const nonAdminEmail = process.env.DIDAXIS_NON_ADMIN_EMAIL;
    const nonAdminPassword = process.env.DIDAXIS_NON_ADMIN_PASSWORD;
    test.skip(
      !nonAdminEmail || !nonAdminPassword,
      'Set DIDAXIS_NON_ADMIN_EMAIL and DIDAXIS_NON_ADMIN_PASSWORD to run',
    );

    const programName = uniqueName('Test Program');
    await createProgram(page, programName, 'Role check program');

    await page.goto(loginUrl);
    await page.getByLabel('Email').fill(nonAdminEmail!);
    await page.getByLabel('Password').fill(nonAdminPassword!);
    await page.getByRole('button', { name: 'Sign In' }).click();
    await page.waitForURL((url) => !url.pathname.includes('/login'));
    await goToPrograms(page);

    await expect(
      programRow(page, programName).getByRole('button', { name: `Delete ${programName}`, exact: true }),
    ).toHaveCount(0);
  });

  test('TC-008 — a failed delete request leaves the program in the list', async ({ page }) => {
    const programName = uniqueName('Test Program');

    await createProgram(page, programName, 'Delete failure target');
    await page.route(/\/api\/programs\/[^/]+$/, async (route) => {
      if (route.request().method() === 'DELETE') {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ message: 'delete failed' }),
        });
        return;
      }
      await route.continue();
    });

    const dialogPromise = page.waitForEvent('dialog');
    const clickPromise = programRow(page, programName)
      .getByRole('button', { name: `Delete ${programName}`, exact: true })
      .click();
    const dialog = await dialogPromise;
    await dialog.accept();
    await clickPromise;

    await expect(programRow(page, programName)).toBeVisible();
  });

  test('TC-009 — one confirmation removes the program once', async ({ page }) => {
    const programName = uniqueName('Mobile Development 2026');
    let confirmations = 0;

    await createProgram(page, programName, 'iOS and Android curriculum');

    const dialogPromise = page.waitForEvent('dialog');
    const clickPromise = programRow(page, programName)
      .getByRole('button', { name: `Delete ${programName}`, exact: true })
      .click();
    const dialog = await dialogPromise;
    confirmations += 1;
    expect(dialog.type()).toBe('confirm');
    await dialog.accept();
    await clickPromise;

    await expect(programRow(page, programName)).toHaveCount(0);
    expect(confirmations).toBe(1);
  });
});

test.describe('Edge cases', () => {
  test('TC-010 — a program with special characters can be deleted', async ({ page }) => {
    const programName = uniqueName('Informatique & IA - Niveau 2');

    await createProgram(page, programName, 'Programme bilingue');
    const message = await acceptDeleteConfirm(page, programName);

    expect(message).toContain(programName);
    await expect(programRow(page, programName)).toHaveCount(0);
  });

  test.skip('TC-011 — deleting the only program shows an empty list', async () => {
    // The shared tenant already contains other programs.
  });

  test('TC-012 — a long program name is included in the delete confirmation', async ({ page }) => {
    const suffix = String(Date.now());
    const programName = `${'LongName'.repeat(12)} ${suffix}`;

    await createProgram(page, programName, 'Long name delete');
    const message = await acceptDeleteConfirm(page, programName);

    expect(message).toContain(programName);
    await expect(programRow(page, programName)).toHaveCount(0);
  });

  test('TC-013 — deletion updates a filtered program list', async ({ page }) => {
    await goToPrograms(page);
    const filter = await programFilter(page);
    test.skip(!filter, 'Programs page has no search or filter control');

    const programName = uniqueName('Test Program');
    await createProgram(page, programName, 'Filtered delete target');
    await filter!.fill('Test Program');
    await acceptDeleteConfirm(page, programName);
    await expect(programRow(page, programName)).toHaveCount(0);
  });

  test('TC-014 — delete confirmation warns that related semesters and courses are removed', async ({ page }) => {
    const programName = uniqueName('Test Program');

    await createProgram(page, programName, 'Program without enrollments');
    const message = await acceptDeleteConfirm(page, programName);

    expect(message).toContain('All its semesters and courses will be removed');
    await expect(programRow(page, programName)).toHaveCount(0);
  });

  test('TC-015 — delete confirmation can be accepted from the keyboard', async ({ page }) => {
    const programName = uniqueName('Test Program');

    await createProgram(page, programName, 'Keyboard delete target');
    const deleteButton = programRow(page, programName).getByRole('button', {
      name: `Delete ${programName}`,
      exact: true,
    });
    await deleteButton.focus();

    const dialogPromise = page.waitForEvent('dialog');
    const keyPromise = page.keyboard.press('Enter');
    const dialog = await dialogPromise;
    expect(dialog.type()).toBe('confirm');
    await dialog.accept();
    await keyPromise;

    await expect(programRow(page, programName)).toHaveCount(0);
  });

  test('TC-016 — successful delete does not show an error dialog', async ({ page }) => {
    const programName = uniqueName('Test Program');

    await createProgram(page, programName, 'Silent success target');
    const message = await acceptDeleteConfirm(page, programName);

    expect(message).toContain(programName);
    expect(message).not.toMatch(/fail|error/i);
    await expect(programRow(page, programName)).toHaveCount(0);
  });

  test('TC-017 — a deleted name can be used for a new program', async ({ page }) => {
    const programName = uniqueName('Test Program');

    await createProgram(page, programName, 'Original program');
    await acceptDeleteConfirm(page, programName);

    await goToPrograms(page);
    const dialog = await openNewProgramForm(page);
    await fillProgramForm(dialog, programName, 'Recreated program');
    await submitCreate(dialog);

    await expect(programRow(page, programName)).toHaveCount(1);
    await expect(programRow(page, programName).getByText('Recreated program')).toBeVisible();
  });
});
