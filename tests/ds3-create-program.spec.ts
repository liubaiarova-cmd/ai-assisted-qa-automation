import { expect, test } from '../fixtures/cleanup.fixture';
import { ProgramsPage } from '../pages/ProgramsPage';
import { uniqueName } from './support/didaxis-programs';

test.setTimeout(120_000);

/** Sibling create/edit tests use 255. DS-3 does not name a limit. */
const MAX_PROGRAM_NAME_LENGTH = 255;

function nameOfLength(length: number): string {
  const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  return `${'A'.repeat(length - suffix.length)}${suffix}`;
}

async function expectProgramListed(programsPage: ProgramsPage, programName: string): Promise<void> {
  await expect(programsPage.modal.dialog).toBeHidden({ timeout: 20_000 });
  await expect(programsPage.firstProgramRow(programName)).toBeAttached({ timeout: 15_000 });
  await programsPage.scrollFirstProgramRowIntoView(programName);
  await expect(programsPage.firstProgramRow(programName)).toBeVisible();
}

test.describe('DS-3 Program name validation and duplicate prevention', () => {
  test.describe('Happy paths', () => {
    test('TC-001 — program name with special characters and accents is accepted', async ({
      page,
      trackProgram,
    }) => {
      const programName = uniqueName('Informatique & IA - Niveau 2');
      const description = 'Programme bilingue en informatique et intelligence artificielle';
      const programsPage = new ProgramsPage(page);

      await programsPage.createProgram(programName, description, trackProgram);

      await expectProgramListed(programsPage, programName);
    });

    test('TC-002 — a simple valid program name is accepted', async ({ page, trackProgram }) => {
      const programName = uniqueName('Mobile Development 2026');
      const description = 'iOS and Android curriculum';
      const programsPage = new ProgramsPage(page);

      await programsPage.createProgram(programName, description, trackProgram);

      await expectProgramListed(programsPage, programName);
    });
  });

  test.describe('Negative', () => {
    test('TC-003 — whitespace-only program name is not submitted', async ({ page }) => {
      const programsPage = new ProgramsPage(page);

      await programsPage.goto();
      const modal = await programsPage.openNewProgramForm();
      await modal.fill('   ', 'Valid description text');

      await expect(modal.createButton).toBeDisabled();
      await expect(modal.dialog).toBeVisible();
    });

    test.fixme('TC-004 — duplicate program name is rejected', async ({ page, trackProgram }) => {
      const programName = uniqueName('Web Development 2026');
      const programsPage = new ProgramsPage(page);

      await programsPage.createProgram(programName, 'Full-stack web development program', trackProgram);
      await expect(programsPage.modal.dialog).toBeHidden({ timeout: 20_000 });

      await programsPage.attemptCreate(programName, 'Another description for duplicate attempt', trackProgram);

      await expect(programsPage.duplicateError).toBeVisible();
      await expect(programsPage.modal.dialog).toBeVisible();
      await expect(programsPage.programRow(programName)).toHaveCount(1);
    });

    test('TC-005 — empty program name is not submitted', async ({ page }) => {
      const programsPage = new ProgramsPage(page);

      await programsPage.goto();
      const modal = await programsPage.openNewProgramForm();
      await modal.fillDescription('Description without a program name');

      await expect(modal.createButton).toBeDisabled();
      await expect(modal.dialog).toBeVisible();
    });

    test.fixme('TC-006 — a rejected duplicate does not persist after refresh', async ({ page, trackProgram }) => {
      const programName = uniqueName('Web Development 2026');
      const programsPage = new ProgramsPage(page);

      await programsPage.createProgram(programName, 'Full-stack web development program', trackProgram);
      await expect(programsPage.modal.dialog).toBeHidden({ timeout: 20_000 });
      await programsPage.attemptCreate(programName, 'Another description for duplicate attempt', trackProgram);
      await expect(programsPage.duplicateError).toBeVisible();

      await programsPage.reload();

      await expect(programsPage.programRow(programName)).toHaveCount(1);
    });
  });

  test.describe('Edge cases', () => {
    test('TC-007 — leading and trailing spaces around a valid name are trimmed', async ({
      page,
      trackProgram,
    }) => {
      const programName = uniqueName('Unique Program Alpha');
      const programsPage = new ProgramsPage(page);

      await programsPage.goto();
      const modal = await programsPage.openNewProgramForm();
      await modal.fill(`  ${programName}  `, 'Trim test program');
      await modal.submitCreate(trackProgram);

      await expectProgramListed(programsPage, programName);

      const editModal = await programsPage.openEdit(programName);
      await expect(editModal.programNameInput).toHaveValue(programName);
    });

    test.fixme('TC-008 — a case-variant of an existing name is treated as a duplicate', async ({
      page,
      trackProgram,
    }) => {
      const programName = uniqueName('Web Development 2026');
      const caseVariant = programName.toLowerCase();
      const programsPage = new ProgramsPage(page);

      await programsPage.createProgram(programName, 'Full-stack web development program', trackProgram);
      await expect(programsPage.modal.dialog).toBeHidden({ timeout: 20_000 });

      await programsPage.attemptCreate(caseVariant, 'Case variant duplicate attempt', trackProgram);

      await expect(programsPage.duplicateError).toBeVisible();
      await expect(programsPage.modal.dialog).toBeVisible();
      await expect(programsPage.programRow(programName)).toHaveCount(1);
      await expect(programsPage.programRow(caseVariant)).toHaveCount(0);
    });

    test('TC-009 — multiple internal spaces in a program name are preserved', async ({
      page,
      trackProgram,
    }) => {
      const programName = uniqueName('Full   Stack   Engineering');
      const programsPage = new ProgramsPage(page);

      await programsPage.createProgram(programName, 'Engineering track with spaced name', trackProgram);

      await expectProgramListed(programsPage, programName);

      const editModal = await programsPage.openEdit(programName);
      await expect(editModal.programNameInput).toHaveValue(programName);
    });

    test('TC-010 — program name at the maximum allowed length is accepted', async ({
      page,
      trackProgram,
    }) => {
      const programName = nameOfLength(MAX_PROGRAM_NAME_LENGTH);
      expect(programName).toHaveLength(MAX_PROGRAM_NAME_LENGTH);
      const programsPage = new ProgramsPage(page);

      await programsPage.createProgram(programName, 'Boundary test for name length', trackProgram);

      await expectProgramListed(programsPage, programName);
    });

    test.fixme('TC-011 — program name longer than the maximum is rejected', async ({ page, trackProgram }) => {
      const overlongName = nameOfLength(MAX_PROGRAM_NAME_LENGTH + 1);
      expect(overlongName.length).toBeGreaterThan(MAX_PROGRAM_NAME_LENGTH);
      const programsPage = new ProgramsPage(page);

      await programsPage.goto();
      const modal = await programsPage.openNewProgramForm();
      await modal.fill(overlongName, 'Over limit test');

      const entered = await modal.programNameInput.inputValue();
      if (entered.length <= MAX_PROGRAM_NAME_LENGTH) {
        await expect(modal.dialog).toBeVisible();
        expect(entered.length).toBeLessThanOrEqual(MAX_PROGRAM_NAME_LENGTH);
        return;
      }

      if (await modal.createButton.isDisabled()) {
        await expect(modal.createButton).toBeDisabled();
        await expect(modal.dialog).toBeVisible();
        return;
      }

      if (await modal.lengthError.isVisible()) {
        await expect(modal.lengthError).toBeVisible();
        await expect(modal.dialog).toBeVisible();
        return;
      }

      const response = await modal.clickCreate(trackProgram, { required: false });
      expect(response?.status() ?? 0).not.toBe(201);
      await expect(modal.dialog).toBeVisible();
      await expect(programsPage.programRow(overlongName)).toHaveCount(0);
    });

    test('TC-012 — parentheses, quotes, and a hash in a program name are accepted', async ({
      page,
      trackProgram,
    }) => {
      const programName = uniqueName('DevOps (2026) "Fast Track" #1');
      const programsPage = new ProgramsPage(page);

      await programsPage.createProgram(programName, 'Special character name test', trackProgram);

      await expectProgramListed(programsPage, programName);
    });

    test('TC-013 — a deleted program name can be used again', async ({ page, trackProgram }) => {
      const programName = uniqueName('Web Development 2026');
      const programsPage = new ProgramsPage(page);

      await programsPage.createProgram(programName, 'Name reserved until delete', trackProgram);
      await expectProgramListed(programsPage, programName);

      await programsPage.confirmDelete(programName);
      await expect(programsPage.programRow(programName)).toHaveCount(0);

      await programsPage.createProgram(programName, 'Reused name after delete', trackProgram);

      await expectProgramListed(programsPage, programName);
    });
  });
});
