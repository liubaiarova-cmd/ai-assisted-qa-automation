import { expect, test, type Page } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'path';
import {
  createProgram,
  goToPrograms,
  login,
  loginUrl,
  openEditForm,
  programRow,
  submitSave,
  uniqueName,
} from './support/didaxis-programs';

dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

test.setTimeout(120_000);

test.beforeEach(async ({ page }) => {
  test.skip(!process.env.DIDAXIS_EMAIL || !process.env.DIDAXIS_PASSWORD, 'Didaxis credentials missing');
  await login(page);
});

async function expectDescription(page: Page, programName: string, description: string): Promise<void> {
  const dialog = await openEditForm(page, programName);
  await expect(dialog.getByRole('heading', { name: 'Edit Program' })).toBeVisible();
  await expect(dialog.getByRole('textbox', { name: 'Program Name' })).toHaveValue(programName);
  await expect(dialog.getByRole('textbox', { name: 'Description' })).toHaveValue(description);
  await dialog.getByRole('button', { name: 'Cancel' }).click();
  await expect(dialog).toBeHidden();
}

test.describe('Positive flows', () => {
  test('TC-001 — edit form shows current program data', async ({ page }) => {
    const programName = uniqueName('Web Development 2026');
    const description = 'Full-stack web development program';

    await createProgram(page, programName, description);
    const dialog = await openEditForm(page, programName);

    await expect(dialog.getByRole('heading', { name: 'Edit Program' })).toBeVisible();
    await expect(dialog.getByRole('textbox', { name: 'Program Name' })).toHaveValue(programName);
    await expect(dialog.getByRole('textbox', { name: 'Description' })).toHaveValue(description);
    await expect(dialog.getByRole('button', { name: 'Save' })).toBeVisible();
    await expect(dialog.getByRole('button', { name: 'Cancel' })).toBeVisible();
    await expect(dialog.getByLabel('Default Session Hours')).toHaveValue('4');
    await expect(dialog.getByLabel('Default Exam Hours')).toHaveValue('3');
  });

  test('TC-002 — updated program name appears in the list after save', async ({ page }) => {
    const programName = uniqueName('Web Development 2026');
    const updatedName = `${programName} - Updated`;

    await createProgram(page, programName, 'Full-stack web development program');
    const dialog = await openEditForm(page, programName);
    await dialog.getByRole('textbox', { name: 'Program Name' }).fill(updatedName);
    await submitSave(dialog);

    await expect(programRow(page, programName)).toHaveCount(0);
    await expect(programRow(page, updatedName)).toBeVisible();
  });

  test('TC-003 — name stays unchanged when only the description is edited', async ({ page }) => {
    const programName = uniqueName('Data Science Fundamentals');
    const updatedDescription = 'Updated cohort description for 2026';

    await createProgram(page, programName, 'Original cohort description');
    const dialog = await openEditForm(page, programName);
    await dialog.getByRole('textbox', { name: 'Description' }).fill(updatedDescription);
    await submitSave(dialog);

    await expect(programRow(page, programName)).toBeVisible();
    await expect(programRow(page, programName).getByText(updatedDescription)).toBeVisible();
    await expectDescription(page, programName, updatedDescription);
  });

  test('TC-004 — name and description can be updated in one save', async ({ page }) => {
    const programName = uniqueName('Cloud Computing 2026');
    const updatedName = `${programName} - Advanced`;
    const updatedDescription = 'Expanded curriculum with Kubernetes and Terraform';

    await createProgram(page, programName, 'Cloud infrastructure and DevOps track');
    const dialog = await openEditForm(page, programName);
    await dialog.getByRole('textbox', { name: 'Program Name' }).fill(updatedName);
    await dialog.getByRole('textbox', { name: 'Description' }).fill(updatedDescription);
    await submitSave(dialog);

    await expect(programRow(page, updatedName)).toBeVisible();
    await expect(programRow(page, updatedName).getByText(updatedDescription)).toBeVisible();
    await expectDescription(page, updatedName, updatedDescription);
  });

  test('TC-019 — edit form includes AI generation config fields', async ({ page }) => {
    const programName = uniqueName('Web Development 2026');

    await createProgram(page, programName, 'Full-stack web development program');
    const dialog = await openEditForm(page, programName);

    await expect(dialog.getByRole('button', { name: /Show AI Generation Config/ })).toBeVisible();
    await expect(dialog.getByLabel('Total Program Hours')).toBeVisible();
    await expect(dialog.getByText('Required for AI curriculum generation')).toBeVisible();
    await expect(dialog.getByLabel('Default Session Hours')).toHaveValue('4');
    await expect(dialog.getByLabel('Default Exam Hours')).toHaveValue('3');
    await expect(dialog.getByLabel('Target Audience')).toBeVisible();
    await expect(dialog.getByLabel('Focus Areas')).toBeVisible();
    await expect(dialog.getByText('Sync/Async Ratio: 70% sync / 30% async')).toBeVisible();
  });
});

test.describe('Negative flows', () => {
  test('TC-005 — empty program name blocks save on edit', async ({ page }) => {
    const programName = uniqueName('Web Development 2026');

    await createProgram(page, programName, 'Full-stack web development program');
    const dialog = await openEditForm(page, programName);
    await dialog.getByRole('textbox', { name: 'Program Name' }).fill('');

    await expect(dialog.getByRole('button', { name: 'Save' })).toBeDisabled();
    await expect(dialog).toBeVisible();
    await expect(programRow(page, programName)).toBeVisible();
  });

  test('TC-006 — canceling edit does not persist changes', async ({ page }) => {
    const programName = uniqueName('Web Development 2026');
    const draftName = uniqueName('Temporary Draft Name');

    await createProgram(page, programName, 'Full-stack web development program');
    const dialog = await openEditForm(page, programName);
    await dialog.getByRole('textbox', { name: 'Program Name' }).fill(draftName);
    await dialog.getByRole('button', { name: 'Cancel' }).click();

    await expect(dialog).toBeHidden();
    await expect(programRow(page, programName)).toBeVisible();
    await expect(page.getByText(draftName, { exact: true })).toHaveCount(0);
  });

  test('TC-007 — non-admin cannot edit program details', async ({ page }) => {
    const nonAdminEmail = process.env.DIDAXIS_NON_ADMIN_EMAIL;
    const nonAdminPassword = process.env.DIDAXIS_NON_ADMIN_PASSWORD;
    test.skip(
      !nonAdminEmail || !nonAdminPassword,
      'Set DIDAXIS_NON_ADMIN_EMAIL and DIDAXIS_NON_ADMIN_PASSWORD to run',
    );

    const programName = uniqueName('Web Development 2026');
    await createProgram(page, programName, 'Full-stack web development program');

    await page.goto(loginUrl);
    await page.getByLabel('Email').fill(nonAdminEmail!);
    await page.getByLabel('Password').fill(nonAdminPassword!);
    await page.getByRole('button', { name: 'Sign In' }).click();
    await page.waitForURL((url) => !url.pathname.includes('/login'));
    await goToPrograms(page);

    await expect(
      programRow(page, programName).getByRole('button', { name: `Edit ${programName}`, exact: true }),
    ).toHaveCount(0);
  });

  test('TC-008 — renaming to an existing program name is currently accepted', async ({ page }) => {
    const existingName = uniqueName('Web Development 2026');
    const editedName = uniqueName('Cybersecurity Bootcamp');

    await createProgram(page, existingName, 'Full-stack web development program');
    await createProgram(page, editedName, 'Security operations track');

    const dialog = await openEditForm(page, editedName);
    await dialog.getByRole('textbox', { name: 'Program Name' }).fill(existingName);
    await submitSave(dialog);

    await expect(programRow(page, existingName)).toHaveCount(2);
    await expect(programRow(page, editedName)).toHaveCount(0);
  });

  test('TC-009 — server failure does not show a false success', async ({ page }) => {
    const programName = uniqueName('Web Development 2026');
    const failedDescription = 'Change pending save failure test';

    await createProgram(page, programName, 'Full-stack web development program');
    const dialog = await openEditForm(page, programName);
    await dialog.getByRole('textbox', { name: 'Description' }).fill(failedDescription);

    await page.route(/\/api\/programs\/[^/]+$/, async (route) => {
      if (route.request().method() === 'PATCH') {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ message: 'save failed' }),
        });
        return;
      }
      await route.continue();
    });

    await dialog.getByRole('button', { name: 'Save' }).click();

    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole('textbox', { name: 'Description' })).toHaveValue(failedDescription);
    await expect(programRow(page, programName).getByText(failedDescription)).toHaveCount(0);
    await expect(programRow(page, programName).getByText('Full-stack web development program')).toBeVisible();
  });

  test('TC-022 — closing edit with the banner X does not persist changes', async ({ page }) => {
    const programName = uniqueName('Web Development 2026');
    const draftName = uniqueName('Closed Without Save');

    await createProgram(page, programName, 'Full-stack web development program');
    const dialog = await openEditForm(page, programName);
    await dialog.getByRole('textbox', { name: 'Program Name' }).fill(draftName);
    await dialog.getByRole('banner').getByRole('button').click();

    await expect(dialog).toBeHidden();
    await expect(programRow(page, programName)).toBeVisible();
    await expect(page.getByText(draftName, { exact: true })).toHaveCount(0);
  });
});

test.describe('Edge cases', () => {
  test('TC-010 — leading and trailing whitespace in the name is trimmed', async ({ page }) => {
    const programName = uniqueName('Web Development 2026');
    const trimmedName = uniqueName('Web Development 2026 - Trimmed');

    await createProgram(page, programName, 'Original description');
    const dialog = await openEditForm(page, programName);
    await dialog.getByRole('textbox', { name: 'Program Name' }).fill(`  ${trimmedName}  `);
    await submitSave(dialog);

    await expect(programRow(page, trimmedName)).toBeVisible();
    const reopened = await openEditForm(page, trimmedName);
    await expect(reopened.getByRole('textbox', { name: 'Program Name' })).toHaveValue(trimmedName);
  });

  test('TC-011 — special characters and unicode persist after edit', async ({ page }) => {
    const programName = uniqueName('Web Development 2026');
    const updatedName = uniqueName('AI & ML (2026) — Cohort #2');
    const description = 'Résumé skills: NLP, CV, 100% hands-on';

    await createProgram(page, programName, 'Full-stack web development program');
    const dialog = await openEditForm(page, programName);
    await dialog.getByRole('textbox', { name: 'Program Name' }).fill(updatedName);
    await dialog.getByRole('textbox', { name: 'Description' }).fill(description);
    await submitSave(dialog);

    await expect(programRow(page, updatedName)).toBeVisible();
    await expectDescription(page, updatedName, description);
  });

  test('TC-012 — program name of 255 characters saves', async ({ page }) => {
    const suffix = `-${Date.now()}`;
    const programName = uniqueName('Web Development 2026');
    const maxName = `${'A'.repeat(255 - suffix.length)}${suffix}`;
    expect(maxName).toHaveLength(255);

    await createProgram(page, programName, 'Boundary description');
    const dialog = await openEditForm(page, programName);
    await dialog.getByRole('textbox', { name: 'Program Name' }).fill(maxName);
    await submitSave(dialog);

    await expect(programRow(page, maxName)).toBeVisible();
  });

  test('TC-013 — program name over 255 characters is currently accepted', async ({ page }) => {
    const suffix = `-${Date.now()}`;
    const programName = uniqueName('Web Development 2026');
    const overlongName = `${'B'.repeat(256 - suffix.length)}${suffix}`;
    expect(overlongName.length).toBeGreaterThan(255);

    await createProgram(page, programName, 'Boundary description');
    const dialog = await openEditForm(page, programName);
    await dialog.getByRole('textbox', { name: 'Program Name' }).fill(overlongName);
    await expect(dialog.getByRole('button', { name: 'Save' })).toBeEnabled();
    await submitSave(dialog);

    await expect(programRow(page, overlongName)).toBeVisible();
    await expect(programRow(page, programName)).toHaveCount(0);
  });

  test('TC-014 — whitespace-only name is treated as empty', async ({ page }) => {
    const programName = uniqueName('Web Development 2026');

    await createProgram(page, programName, 'Full-stack web development program');
    const dialog = await openEditForm(page, programName);
    await dialog.getByRole('textbox', { name: 'Program Name' }).fill('   ');

    await expect(dialog.getByRole('button', { name: 'Save' })).toBeDisabled();
  });

  test('TC-015 — clearing the description is allowed', async ({ page }) => {
    const programName = uniqueName('Web Development 2026');

    await createProgram(page, programName, 'Full-stack web development program');
    const dialog = await openEditForm(page, programName);
    await dialog.getByRole('textbox', { name: 'Description' }).fill('');
    await submitSave(dialog);

    await expect(programRow(page, programName)).toBeVisible();
    await expect(
      programRow(page, programName).getByText('Full-stack web development program'),
    ).toHaveCount(0);
    await expectDescription(page, programName, '');
  });

  test('TC-016 — save without modifications leaves a single row', async ({ page }) => {
    const programName = uniqueName('Web Development 2026');

    await createProgram(page, programName, 'Full-stack web development program');
    const dialog = await openEditForm(page, programName);
    await expect(dialog.getByRole('button', { name: 'Save' })).toBeEnabled();
    await submitSave(dialog);

    await expect(programRow(page, programName)).toHaveCount(1);
  });

  test('TC-017 — script-like description content is stored as text', async ({ page }) => {
    const programName = uniqueName('Web Development 2026');
    const payload = '<img src=x onerror=alert(1)>';
    let alertSeen = false;

    page.on('dialog', async (browserDialog) => {
      alertSeen = true;
      await browserDialog.dismiss();
    });

    await createProgram(page, programName, 'Full-stack web development program');
    const dialog = await openEditForm(page, programName);
    await dialog.getByRole('textbox', { name: 'Description' }).fill(payload);
    await submitSave(dialog);

    expect(alertSeen).toBe(false);
    await expect(programRow(page, programName)).toBeVisible();
    await expectDescription(page, programName, payload);
  });

  test('TC-018 — concurrent edits keep the last write', async ({ page, browser }) => {
    const programName = uniqueName('Web Development 2026');
    const sessionAName = `${programName} - Session A`;
    const sessionBDescription = 'Session B description';

    await createProgram(page, programName, 'Original cohort description');

    const sessionB = await browser.newContext();
    const pageB = await sessionB.newPage();
    try {
      await login(pageB);
      await goToPrograms(pageB);
      const dialogB = await openEditForm(pageB, programName);

      const dialogA = await openEditForm(page, programName);
      await dialogA.getByRole('textbox', { name: 'Program Name' }).fill(sessionAName);
      await submitSave(dialogA);

      await dialogB.getByRole('textbox', { name: 'Description' }).fill(sessionBDescription);
      await submitSave(dialogB);

      await goToPrograms(page);
      await expect(page.getByRole('table')).toBeVisible({ timeout: 30_000 });

      const originalRow = programRow(page, programName);
      const renamedRow = programRow(page, sessionAName);
      await expect(originalRow.or(renamedRow).first()).toBeVisible({ timeout: 20_000 });
      expect((await originalRow.count()) + (await renamedRow.count())).toBe(1);

      const survivingName = (await originalRow.count()) === 1 ? programName : sessionAName;
      const saved = await openEditForm(page, survivingName);
      await expect(saved.getByRole('textbox', { name: 'Description' })).toHaveValue(sessionBDescription);
    } finally {
      await sessionB.close();
    }
  });

  test('TC-020 — default hours stay set when only description is edited', async ({ page }) => {
    const programName = uniqueName('Data Science Fundamentals');

    await createProgram(page, programName, 'Original cohort description');
    const dialog = await openEditForm(page, programName);
    await expect(dialog.getByLabel('Default Session Hours')).toHaveValue('4');
    await expect(dialog.getByLabel('Default Exam Hours')).toHaveValue('3');
    await dialog.getByRole('textbox', { name: 'Description' }).fill('Updated cohort description for 2026');
    await submitSave(dialog);

    const reopened = await openEditForm(page, programName);
    await expect(reopened.getByRole('textbox', { name: 'Program Name' })).toHaveValue(programName);
    await expect(reopened.getByRole('textbox', { name: 'Description' })).toHaveValue(
      'Updated cohort description for 2026',
    );
    await expect(reopened.getByLabel('Default Session Hours')).toHaveValue('4');
    await expect(reopened.getByLabel('Default Exam Hours')).toHaveValue('3');
  });

  test('TC-021 — single-character program name is accepted on edit', async ({ page }) => {
    const programName = uniqueName('Web Development 2026');
    const shortName = uniqueName('A');

    await createProgram(page, programName, 'Full-stack web development program');
    const dialog = await openEditForm(page, programName);
    await dialog.getByRole('textbox', { name: 'Program Name' }).fill(shortName);
    await submitSave(dialog);

    await expect(programRow(page, shortName)).toBeVisible();
  });

  test('TC-023 — case-only duplicate program name is currently accepted', async ({ page }) => {
    const existingName = uniqueName('Web Development 2026');
    const editedName = uniqueName('Cybersecurity Bootcamp');
    const caseVariant = existingName.toLowerCase();

    await createProgram(page, existingName, 'Full-stack web development program');
    await createProgram(page, editedName, 'Security operations track');

    const dialog = await openEditForm(page, editedName);
    await dialog.getByRole('textbox', { name: 'Program Name' }).fill(caseVariant);
    await submitSave(dialog);

    await expect(programRow(page, existingName)).toHaveCount(1);
    await expect(programRow(page, caseVariant)).toHaveCount(1);
    await expect(programRow(page, editedName)).toHaveCount(0);
  });
});
