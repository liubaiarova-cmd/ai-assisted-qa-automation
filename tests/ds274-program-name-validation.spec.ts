import { expect, test } from '../fixtures/cleanup.fixture';
import { ProgramsPage } from '../pages/ProgramsPage';
import { registerProgramsA11y } from './support/programs-a11y';
import {
  fulfillPrograms,
  listEmptyCopyStatuses,
  programsCollection,
  saveStatuses,
} from './support/programs-network';
import { emptyProgramsMessage, uniqueName } from './support/didaxis-programs';

test.setTimeout(60_000);

test.describe('DS-274 Program name validation and duplicate prevention', () => {
  test('whitespace program name keeps Create disabled', async ({ page }) => {
    const programsPage = new ProgramsPage(page);
    await programsPage.goto();
    const modal = await programsPage.openNewProgramForm();
    await modal.fillProgramName('   ');

    await expect(modal.createButton).toBeDisabled();
    await expect(modal.dialog).toBeVisible();
  });

  test('program name Informatique & IA - Niveau 2 is created', async ({ page, trackProgram }) => {
    const programName = uniqueName('Informatique & IA - Niveau 2');
    const description = 'Programme bilingue';
    const programsPage = new ProgramsPage(page);

    await programsPage.createProgram(programName, description, trackProgram);

    await expect(programsPage.modal.dialog).toBeHidden();
    await expect(programsPage.programRow(programName)).toBeAttached({ timeout: 15_000 });
    await programsPage.programRow(programName).scrollIntoViewIfNeeded();
    await expect(programsPage.programRow(programName)).toBeVisible();
  });

  test('duplicate program name shows an error and does not add a second row', async ({ page, trackProgram }) => {
    const programName = uniqueName('Web Development 2026');
    const programsPage = new ProgramsPage(page);

    await programsPage.createProgram(programName, 'Full-stack web development program', trackProgram);
    await programsPage.openNewProgramForm();
    await programsPage.modal.fill(programName, 'Another description');
    await programsPage.modal.clickCreate(trackProgram, { required: false });

    await expect(programsPage.duplicateError).toBeVisible();
    await expect(programsPage.programRow(programName)).toHaveCount(1);
  });

  for (const status of saveStatuses) {
    test(
      `create renders nothing when save returns ${status}`,
      { tag: `@programs-save-${status}` },
      async ({ page, trackProgram }) => {
        const programsPage = new ProgramsPage(page);
        await programsPage.goto();
        await programsPage.openNewProgramForm();
        await programsPage.modal.fill(uniqueName('Web Development 2026'), 'Full-stack web development program');
        await fulfillPrograms(
          page,
          programsCollection,
          'POST',
          status,
          JSON.stringify({ message: `status ${status}` }),
        );
        await programsPage.modal.clickCreate(trackProgram, { required: false });

        await expect(programsPage.modal.dialog).toBeVisible();
        await expect(programsPage.alert).toHaveCount(0);
        await expect(page).toHaveURL(/\/programs/);
      },
    );
  }

  test('empty programs list shows the empty state', { tag: '@programs-list-empty' }, async ({ page }) => {
    const programsPage = new ProgramsPage(page);
    await fulfillPrograms(page, programsCollection, 'GET', 200, JSON.stringify({ data: [] }));
    await programsPage.goto();

    await expect(programsPage.emptyStateMessage).toHaveText(emptyProgramsMessage);
  });

  test('non-JSON programs list renders nothing', { tag: '@programs-list-malformed' }, async ({ page }) => {
    const programsPage = new ProgramsPage(page);
    await fulfillPrograms(page, programsCollection, 'GET', 200, 'not-json', 'text/plain');
    await programsPage.gotoPrograms();

    await expect(page).toHaveURL(/\/programs/);
    await expect(programsPage.programsHeading).toHaveCount(0);
    await expect(programsPage.emptyStateMessage).toHaveCount(0);
    await expect(programsPage.programsTable).toHaveCount(0);
  });

  test(
    'programs list whose data is not an array renders nothing',
    { tag: '@programs-list-malformed' },
    async ({ page }) => {
      const programsPage = new ProgramsPage(page);
      await fulfillPrograms(page, programsCollection, 'GET', 200, JSON.stringify({ data: {} }));
      await programsPage.gotoPrograms();

      await expect(page).toHaveURL(/\/programs/);
      await expect(programsPage.programsHeading).toHaveCount(0);
      await expect(programsPage.emptyStateMessage).toHaveCount(0);
      await expect(programsPage.programsTable).toHaveCount(0);
    },
  );

  test('programs list 204 renders nothing', { tag: '@programs-list-204' }, async ({ page }) => {
    const programsPage = new ProgramsPage(page);
    await fulfillPrograms(page, programsCollection, 'GET', 204, null);
    await programsPage.gotoPrograms();

    await expect(page).toHaveURL(/\/programs/);
    await expect(programsPage.programsHeading).toHaveCount(0);
    await expect(programsPage.emptyStateMessage).toHaveCount(0);
    await expect(programsPage.programsTable).toHaveCount(0);
  });

  for (const status of listEmptyCopyStatuses) {
    test(
      `programs list ${status} shows the empty state`,
      { tag: `@programs-list-${status}` },
      async ({ page }) => {
        const programsPage = new ProgramsPage(page);
        await fulfillPrograms(
          page,
          programsCollection,
          'GET',
          status,
          JSON.stringify({ message: `status ${status}` }),
        );
        await programsPage.goto();

        await expect(programsPage.emptyStateMessage).toHaveText(emptyProgramsMessage);
      },
    );
  }
});

registerProgramsA11y(test);
