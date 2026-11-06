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

test.describe('DS-272 Create new academic program', () => {
  test('program creation form shows Program Name and Description', async ({ page }) => {
    const programsPage = new ProgramsPage(page);
    await programsPage.goto();
    const modal = await programsPage.openNewProgramForm();

    await expect(modal.newProgramHeading).toBeVisible();
    await expect(modal.programNameInput).toBeVisible();
    await expect(modal.descriptionInput).toBeVisible();
    await expect(modal.createButton).toBeVisible();
  });

  test('created program Web Development 2026 appears in the list', async ({ page, trackProgram }) => {
    const programName = uniqueName('Web Development 2026');
    const description = 'Full-stack web development program';
    const programsPage = new ProgramsPage(page);

    await programsPage.createProgram(programName, description, trackProgram);

    await expect(programsPage.modal.dialog).toBeHidden();
    await expect(programsPage.programRow(programName)).toBeAttached({ timeout: 15_000 });
    await programsPage.programRow(programName).scrollIntoViewIfNeeded();
    await expect(programsPage.programRow(programName)).toBeVisible();
  });

  test('Create stays disabled when Program Name is empty', async ({ page }) => {
    const programsPage = new ProgramsPage(page);
    await programsPage.goto();
    const modal = await programsPage.openNewProgramForm();
    await modal.fillDescription('Full-stack web development program');

    await expect(modal.createButton).toBeDisabled();
    await expect(modal.dialog).toBeVisible();
  });

  test('Cancel does not add Draft Program', async ({ page }) => {
    const draftName = uniqueName('Draft Program');
    const programsPage = new ProgramsPage(page);
    await programsPage.goto();
    const modal = await programsPage.openNewProgramForm();
    await modal.fill(draftName, 'Full-stack web development program');
    await modal.dismiss();

    await expect(modal.dialog).toBeHidden();
    await expect(programsPage.programRow(draftName)).toHaveCount(0);
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
