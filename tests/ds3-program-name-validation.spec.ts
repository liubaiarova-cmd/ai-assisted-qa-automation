import { expect, test } from '../fixtures/cleanup.fixture';
import { NewProgramModal } from '../pages/NewProgramModal';
import { ProgramsPage } from '../pages/ProgramsPage';
import { uniqueName, type TrackProgram } from './support/didaxis-programs';

test.setTimeout(60_000);

const NAME_LIMIT_PREFIX = 'NameLimit100_';

function programNameAtLength(totalLength: number, uniqueSeed: string): string {
  const fillerLength = totalLength - NAME_LIMIT_PREFIX.length - uniqueSeed.length;
  if (fillerLength < 0) {
    throw new Error(`Cannot build a ${totalLength}-char name with seed "${uniqueSeed}"`);
  }
  return NAME_LIMIT_PREFIX + uniqueSeed + 'X'.repeat(fillerLength);
}

function singleCharProgramName(parallelIndex: number): string {
  return String.fromCharCode(65 + (parallelIndex % 26));
}

async function expectDuplicateCreateRejected(
  programsPage: ProgramsPage,
  modal: NewProgramModal,
  trackProgram: TrackProgram,
  canonicalName: string,
): Promise<void> {
  const response = await modal.clickCreate(trackProgram, { required: false });
  if (response) {
    expect(response.status(), 'duplicate program name must not return 201 Created').not.toBe(201);
  }
  await expect(programsPage.programRow(canonicalName)).toHaveCount(1);
  await expect(programsPage.duplicateError).toBeVisible();
  await expect(modal.dialog).toBeVisible();
}

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
  test('TC-001 — Special characters in Program Name are accepted', { tag: ['@TC-001', '@smoke'] }, async ({
    page,
    trackProgram,
  }) => {
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

  test('TC-003 — Whitespace-only Program Name is treated as empty', { tag: ['@TC-003', '@smoke'] }, async ({
    page,
    trackProgram,
  }) => {
    const programsPage = new ProgramsPage(page);
    const modal = await openCreateModal(programsPage);

    let createPosted = false;
    page.on('request', (request) => {
      if (request.method() !== 'POST') return;
      try {
        if (new URL(request.url()).pathname === '/api/programs') {
          createPosted = true;
        }
      } catch {
        /* ignore malformed URLs */
      }
    });

    await modal.fill('   ', 'Valid description');

    await expect(modal.createButton).toBeDisabled();
    await expect(modal.dialog).toBeVisible();
    expect(createPosted).toBe(false);
  });

  test('TC-004 — Empty Program Name keeps Create disabled', async ({ page, trackProgram }) => {
    const programsPage = new ProgramsPage(page);
    const modal = await openCreateModal(programsPage);

    await modal.fillDescription('Valid description');

    await expect(modal.createButton).toBeDisabled();
    await expect(modal.dialog).toBeVisible();
  });

  test('TC-005 — Duplicate program name is rejected', { tag: ['@TC-005', '@smoke'] }, async ({
    page,
    trackProgram,
  }) => {
    const programName = uniqueName('Web Development 2026');
    const programsPage = new ProgramsPage(page);

    await seedProgram(programsPage, programName, 'First program', trackProgram);

    const modal = await openCreateModal(programsPage);
    await modal.fill(programName, 'Another description');
    await expectDuplicateCreateRejected(programsPage, modal, trackProgram, programName);
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
    await expectDuplicateCreateRejected(programsPage, modal, trackProgram, programName);
  });

  test('TC-007 — Case-variant duplicate name is rejected', async ({ page, trackProgram }) => {
    const programName = uniqueName('Web Development 2026');
    const programsPage = new ProgramsPage(page);

    await seedProgram(programsPage, programName, 'Original', trackProgram);

    const modal = await openCreateModal(programsPage);
    await modal.fill(programName.toLowerCase(), 'Case variant');
    await expectDuplicateCreateRejected(programsPage, modal, trackProgram, programName);
  });

  test('TC-008 — Single-character Program Name is accepted', async ({ page, trackProgram }, testInfo) => {
    const programName = singleCharProgramName(testInfo.parallelIndex);
    const programsPage = new ProgramsPage(page);
    const modal = await openCreateModal(programsPage);

    await modal.fill(programName, 'Single character name');
    await modal.submitCreate(trackProgram);

    await expect(modal.dialog).toBeHidden();
    await expectProgramVisible(programsPage, programName);
  });

  test('TC-009 — Program Name at 100 characters is accepted', async ({ page, trackProgram }, testInfo) => {
    const uniqueSeed = `${testInfo.parallelIndex}${Date.now()}`.slice(-8);
    const programName = programNameAtLength(100, uniqueSeed);
    expect(programName.length).toBe(100);
    const programsPage = new ProgramsPage(page);
    const modal = await openCreateModal(programsPage);

    await modal.fill(programName, 'Boundary test for name length');
    await modal.submitCreate(trackProgram);

    await expect(modal.dialog).toBeHidden();
    await expectProgramVisible(programsPage, programName);
  });

  test('TC-010 — Program Name over 100 characters is rejected', async ({ page, trackProgram }, testInfo) => {
    const uniqueSeed = `${testInfo.parallelIndex}${Date.now()}`.slice(-8);
    const programName = programNameAtLength(101, uniqueSeed);
    expect(programName.length).toBe(101);
    const programsPage = new ProgramsPage(page);
    const modal = await openCreateModal(programsPage);

    await modal.fill(programName, 'Over limit test');

    if (await modal.createButton.isDisabled()) {
      await expect(modal.createButton).toBeDisabled();
    } else {
      const response = await modal.clickCreate(trackProgram, { required: false });
      if (response) {
        expect(response.status(), 'over-limit name must not create a program').not.toBe(201);
      }
      await expect(modal.dialog).toBeVisible();
    }

    await expect(programsPage.programRow(programName)).toHaveCount(0);
  });

  test('TC-011 — Internal spaces are preserved and are not a duplicate of a collapsed name', async ({
    page,
    trackProgram,
  }) => {
    const existingName = uniqueName('Web Development 2026');
    const spacedName = existingName.replace(/ /g, '  ');
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
