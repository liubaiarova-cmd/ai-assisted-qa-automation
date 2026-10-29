import { expect, test } from '../fixtures/cleanup.fixture';
import { NewProgramModal } from '../pages/NewProgramModal';
import { ProgramsPage } from '../pages/ProgramsPage';
import { uniqueName, type TrackProgram } from './support/didaxis-programs';

test.setTimeout(60_000);

const NAME_LIMIT_PREFIX = 'NameLimit100_';

function programNameAtLength(totalLength: number): string {
  return NAME_LIMIT_PREFIX + 'X'.repeat(totalLength - NAME_LIMIT_PREFIX.length);
}

const NAME_100 = programNameAtLength(100);
const NAME_101 = programNameAtLength(101);

async function expectProgramVisible(programsPage: ProgramsPage, programName: string): Promise<void> {
  await expect(programsPage.firstProgramRow(programName)).toBeAttached({ timeout: 15_000 });
  await programsPage.scrollFirstProgramRowIntoView(programName);
  await expect(programsPage.firstProgramRow(programName)).toBeVisible();
}

async function openCreateModal(programsPage: ProgramsPage): Promise<NewProgramModal> {
  await programsPage.goto();
  const modal = await programsPage.openNewProgramForm();
  await expect(modal.newProgramHeading).toBeVisible();
  await expect(modal.dialog).toBeVisible();
  return modal;
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

test.describe('DS-3 Program name validation and duplicate prevention', () => {
  test('TC-001 — Special characters in Program Name are accepted', async ({ page, trackProgram }) => {
    const programName = uniqueName('Informatique & IA - Niveau 2');
    const programsPage = new ProgramsPage(page);
    const modal = await openCreateModal(programsPage);

    await modal.fill(programName, 'Programme avec caractères spéciaux');
    await modal.submitCreate(trackProgram);

    await expect(modal.dialog).toBeHidden();
    await expectProgramVisible(programsPage, programName);
  });

  test('TC-002 — Program Name is the only required field', async ({ page, trackProgram }) => {
    const programName = uniqueName('Informatique & IA - Niveau 2');
    const programsPage = new ProgramsPage(page);
    const modal = await openCreateModal(programsPage);

    await modal.fillProgramName(programName);
    await modal.submitCreate(trackProgram);

    await expect(modal.dialog).toBeHidden();
    await expectProgramVisible(programsPage, programName);
  });

  test('TC-003 — Whitespace-only Program Name is treated as empty', async ({ page, trackProgram }) => {
    const programsPage = new ProgramsPage(page);
    const modal = await openCreateModal(programsPage);

    await modal.fill('   ', 'Valid description');

    await expect(modal.createButton).toBeDisabled();
    await expect(modal.dialog).toBeVisible();
    await expect(programsPage.programNameText('   ')).toHaveCount(0);
  });

  test('TC-004 — Empty Program Name keeps Create disabled', async ({ page, trackProgram }) => {
    const programsPage = new ProgramsPage(page);
    const modal = await openCreateModal(programsPage);

    await modal.fillDescription('Valid description');

    await expect(modal.createButton).toBeDisabled();
    await expect(modal.dialog).toBeVisible();
  });

  test('TC-005 — Duplicate program name is rejected', async ({ page, trackProgram }) => {
    const programName = uniqueName('Web Development 2026');
    const programsPage = new ProgramsPage(page);

    await seedProgram(programsPage, programName, 'First program', trackProgram);

    const modal = await openCreateModal(programsPage);
    await modal.fill(programName, 'Another description');
    await modal.clickCreate(trackProgram);

    await expect(programsPage.duplicateError).toBeVisible();
    await expect(modal.dialog).toBeVisible();
    await expect(programsPage.programRow(programName)).toHaveCount(1);
  });

  test('TC-006 — Leading and trailing spaces do not create a second program', async ({
    page,
    trackProgram,
  }) => {
    const programName = uniqueName('Web Development 2026');
    const programsPage = new ProgramsPage(page);

    await seedProgram(programsPage, programName, 'Original', trackProgram);

    const modal = await openCreateModal(programsPage);
    await modal.fill(`  ${programName}  `, 'Padded duplicate');
    await modal.clickCreate(trackProgram);

    await expect(programsPage.duplicateError).toBeVisible();
    await expect(programsPage.programRow(programName)).toHaveCount(1);
  });

  test('TC-007 — Case-variant duplicate name is rejected', async ({ page, trackProgram }) => {
    const programName = uniqueName('Web Development 2026');
    const programsPage = new ProgramsPage(page);

    await seedProgram(programsPage, programName, 'Original', trackProgram);

    const modal = await openCreateModal(programsPage);
    await modal.fill(programName.toLowerCase(), 'Case variant');
    await modal.clickCreate(trackProgram);

    await expect(programsPage.duplicateError).toBeVisible();
    await expect(programsPage.programRow(programName)).toHaveCount(1);
  });

  test('TC-008 — Single-character Program Name is accepted', async ({ page, trackProgram }) => {
    const programName = 'A';
    const programsPage = new ProgramsPage(page);
    const modal = await openCreateModal(programsPage);

    await modal.fill(programName, 'Single character name');
    await modal.submitCreate(trackProgram);

    await expect(modal.dialog).toBeHidden();
    await expectProgramVisible(programsPage, programName);
  });

  test('TC-009 — Program Name at 100 characters is accepted', async ({ page, trackProgram }) => {
    expect(NAME_100.length).toBe(100);
    const programsPage = new ProgramsPage(page);
    const modal = await openCreateModal(programsPage);

    await modal.fill(NAME_100, 'Boundary test for name length');
    await modal.submitCreate(trackProgram);

    await expect(modal.dialog).toBeHidden();
    await expectProgramVisible(programsPage, NAME_100);
  });

  test('TC-010 — Program Name over 100 characters is rejected', async ({ page, trackProgram }) => {
    expect(NAME_101.length).toBe(101);
    const programsPage = new ProgramsPage(page);
    const modal = await openCreateModal(programsPage);

    await modal.fill(NAME_101, 'Over limit test');

    if (await modal.createButton.isDisabled()) {
      await expect(modal.createButton).toBeDisabled();
    } else {
      await expect(modal.lengthError).toBeVisible();
    }

    await expect(programsPage.programRow(NAME_101)).toHaveCount(0);
  });

  test('TC-011 — Internal spaces are preserved and are not a duplicate of a collapsed name', async ({
    page,
    trackProgram,
  }) => {
    const existingName = uniqueName('Web Development 2026');
    const spacedName = 'Web  Development  2026';
    const programsPage = new ProgramsPage(page);

    await seedProgram(programsPage, existingName, 'Single-space version', trackProgram);

    const modal = await openCreateModal(programsPage);
    await modal.fill(spacedName, 'Internal spaces');
    await modal.submitCreate(trackProgram);

    await expect(modal.dialog).toBeHidden();
    await expectProgramVisible(programsPage, spacedName);
    await expectProgramVisible(programsPage, existingName);
  });

  test('TC-012 — HTML in Program Name is stored as text and not executed', async ({
    page,
    trackProgram,
  }) => {
    const programName = uniqueName('IA <img src=x onerror=alert(1)>');
    let alertDialogSeen = false;
    page.on('dialog', async (dialog) => {
      alertDialogSeen = true;
      await dialog.dismiss();
    });

    const programsPage = new ProgramsPage(page);
    const modal = await openCreateModal(programsPage);

    await modal.fill(programName, 'Markup in the name');
    await modal.submitCreate(trackProgram);

    expect(alertDialogSeen).toBe(false);
    await expect(modal.dialog).toBeHidden();
    await expectProgramVisible(programsPage, programName);
  });
});
