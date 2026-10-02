import { expect, type Locator, type Page } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '..', '..', '.env') });

export const baseUrl = process.env.DIDAXIS_URL ?? 'https://test.didaxis.studio';
export const loginUrl = `${baseUrl}/login`;
export const programsUrl = `${baseUrl}/programs`;

export const emptyProgramsMessage =
  'No programs yet. Create your first program to get started.';

export function uniqueName(label: string): string {
  return `${label} ${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function programDialog(page: Page): Locator {
  return page.getByRole('dialog');
}

export function programRow(page: Page, programName: string): Locator {
  return page.getByRole('row').filter({
    has: page.getByText(programName, { exact: true }),
  });
}

export async function login(page: Page): Promise<void> {
  const email = process.env.DIDAXIS_EMAIL;
  const password = process.env.DIDAXIS_PASSWORD;
  if (!email || !password) {
    throw new Error('DIDAXIS_EMAIL and DIDAXIS_PASSWORD must be set in the environment');
  }

  for (let attempt = 0; attempt < 3; attempt += 1) {
    await page.goto(loginUrl);
    await page.getByLabel('Email').fill(email);
    await page.getByLabel('Password').fill(password);
    await page.getByRole('button', { name: 'Sign In' }).click();

    try {
      await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 20_000 });
      return;
    } catch (error) {
      if (attempt === 2) {
        throw error;
      }
    }
  }
}

export async function goToPrograms(page: Page): Promise<void> {
  await page.goto(programsUrl);
  await page.getByRole('button', { name: '+ New Program' }).waitFor({ state: 'visible' });
  await expect(page.getByRole('table').or(page.getByText(emptyProgramsMessage))).toBeVisible({
    timeout: 30_000,
  });
}

export async function openNewProgramForm(page: Page): Promise<Locator> {
  await page.getByRole('button', { name: '+ New Program' }).click();
  const dialog = programDialog(page);
  await expect(dialog.getByRole('heading', { name: 'New Program' })).toBeVisible();
  return dialog;
}

export async function fillProgramForm(
  dialog: Locator,
  programName: string,
  description?: string,
): Promise<void> {
  await dialog.getByLabel('Program Name').fill(programName);
  if (description !== undefined) {
    await dialog.getByLabel('Description').fill(description);
  }
}

export async function submitCreate(dialog: Locator): Promise<void> {
  const createButton = dialog.getByRole('button', { name: 'Create' });
  await expect(createButton).toBeEnabled({ timeout: 10_000 });
  await createButton.click();
  await expect(dialog).toBeHidden({ timeout: 20_000 });
}

export async function expectProgramInList(page: Page, programName: string): Promise<void> {
  const row = programRow(page, programName).first();
  await expect(row).toBeAttached({ timeout: 20_000 });
  await row.scrollIntoViewIfNeeded();
  await expect(row).toBeVisible();
}

export async function createProgram(
  page: Page,
  programName: string,
  description?: string,
): Promise<void> {
  await goToPrograms(page);
  const dialog = await openNewProgramForm(page);
  await fillProgramForm(dialog, programName, description);
  await submitCreate(dialog);
  await expectProgramInList(page, programName);
}

export async function openEditForm(page: Page, programName: string): Promise<Locator> {
  const editButton = programRow(page, programName)
    .first()
    .getByRole('button', { name: `Edit ${programName}`, exact: true });
  await editButton.scrollIntoViewIfNeeded();
  await editButton.click();

  const dialog = programDialog(page);
  const heading = dialog.getByRole('heading', { name: 'Edit Program' });
  if (!(await heading.isVisible())) {
    await editButton.dispatchEvent('click');
  }
  await expect(heading).toBeVisible({ timeout: 10_000 });
  return dialog;
}

export async function submitSave(dialog: Locator): Promise<void> {
  const saveButton = dialog.getByRole('button', { name: 'Save' });
  await expect(saveButton).toBeEnabled({ timeout: 10_000 });
  await saveButton.click();
  await expect(dialog).toBeHidden({ timeout: 45_000 });
}

export async function acceptDeleteConfirm(page: Page, programName: string): Promise<string> {
  const dialogPromise = page.waitForEvent('dialog');
  const clickPromise = programRow(page, programName)
    .first()
    .getByRole('button', { name: `Delete ${programName}`, exact: true })
    .click();
  const dialog = await dialogPromise;
  const message = dialog.message();
  expect(dialog.type()).toBe('confirm');
  await dialog.accept();
  await clickPromise;
  await expect(programRow(page, programName)).toHaveCount(0, { timeout: 20_000 });
  return message;
}

export async function dismissDeleteConfirm(page: Page, programName: string): Promise<string> {
  const dialogPromise = page.waitForEvent('dialog');
  const clickPromise = programRow(page, programName)
    .first()
    .getByRole('button', { name: `Delete ${programName}`, exact: true })
    .click();
  const dialog = await dialogPromise;
  const message = dialog.message();
  expect(dialog.type()).toBe('confirm');
  await dialog.dismiss();
  await clickPromise;
  return message;
}

export async function programFilter(page: Page): Promise<Locator | null> {
  const candidates = [
    page.getByRole('searchbox'),
    page.getByPlaceholder(/search|filter/i),
    page.getByLabel(/search|filter/i),
  ];

  for (const candidate of candidates) {
    if ((await candidate.count()) > 0) {
      return candidate.first();
    }
  }

  return null;
}
