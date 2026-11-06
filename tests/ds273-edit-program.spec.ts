import { expect, test } from '../fixtures/cleanup.fixture';
import { ProgramsPage } from '../pages/ProgramsPage';
import { registerProgramsA11y } from './support/programs-a11y';
import {
  fulfillPrograms,
  listEmptyCopyStatuses,
  programResource,
  programsCollection,
  saveStatuses,
} from './support/programs-network';
import { emptyProgramsMessage, uniqueName } from './support/didaxis-programs';

test.setTimeout(90_000);

async function expectRowVisible(programsPage: ProgramsPage, programName: string): Promise<void> {
  await expect(programsPage.programRow(programName)).toBeAttached({ timeout: 15_000 });
  await programsPage.programRow(programName).scrollIntoViewIfNeeded();
  await expect(programsPage.programRow(programName)).toBeVisible();
}

test.describe('DS-273 Edit existing program details', () => {
  test('edit form shows the current program data', async ({ page, trackProgram }) => {
    const programName = uniqueName('Web Development 2026');
    const description = 'Full-stack web development program';
    const programsPage = new ProgramsPage(page);

    await programsPage.createProgram(programName, description, trackProgram);
    await programsPage.openEdit(programName);

    await expect(programsPage.modal.editHeading).toBeVisible();
    await expect(programsPage.modal.programNameInput).toHaveValue(programName);
    await expect(programsPage.modal.descriptionInput).toHaveValue(description);
    await expect(programsPage.modal.saveButton).toBeVisible();
  });

  test('saved name Web Development 2026 - Updated appears in the list', async ({ page, trackProgram }) => {
    const programName = uniqueName('Web Development 2026');
    const updatedName = `${programName} - Updated`;
    const programsPage = new ProgramsPage(page);

    await programsPage.createProgram(programName, 'Full-stack web development program', trackProgram);
    await programsPage.openEdit(programName);
    await programsPage.modal.fillProgramName(updatedName);
    await programsPage.modal.clickSave();

    await expect(programsPage.modal.dialog).toBeHidden({ timeout: 20_000 });
    await expect(programsPage.programRow(programName)).toHaveCount(0);
    await expectRowVisible(programsPage, updatedName);
  });

  test('changing only the description keeps the name and default hours', async ({ page, trackProgram }) => {
    const programName = uniqueName('Web Development 2026');
    const updatedDescription = 'Updated cohort description for 2026';
    const programsPage = new ProgramsPage(page);

    await programsPage.createProgram(programName, 'Full-stack web development program', trackProgram);
    await programsPage.openEdit(programName);
    await programsPage.modal.fillDescription(updatedDescription);
    await programsPage.modal.clickSave();
    await expect(programsPage.modal.dialog).toBeHidden({ timeout: 20_000 });

    await expectRowVisible(programsPage, programName);
    await expect(programsPage.programRow(programName).getByText(updatedDescription)).toBeVisible();
    await programsPage.openEdit(programName);
    await expect(programsPage.modal.programNameInput).toHaveValue(programName);
    await expect(programsPage.modal.descriptionInput).toHaveValue(updatedDescription);
    await expect(programsPage.modal.defaultSessionHoursInput).toHaveValue('4');
    await expect(programsPage.modal.defaultExamHoursInput).toHaveValue('3');
  });

  test('Cancel does not keep Temporary Draft Name', async ({ page, trackProgram }) => {
    const programName = uniqueName('Web Development 2026');
    const draftName = uniqueName('Temporary Draft Name');
    const programsPage = new ProgramsPage(page);

    await programsPage.createProgram(programName, 'Full-stack web development program', trackProgram);
    await programsPage.openEdit(programName);
    await programsPage.modal.fillProgramName(draftName);
    await programsPage.modal.dismiss();

    await expect(programsPage.modal.dialog).toBeHidden();
    await expectRowVisible(programsPage, programName);
    await expect(programsPage.programRow(draftName)).toHaveCount(0);
  });

  for (const status of saveStatuses) {
    test(
      `save renders nothing when update returns ${status}`,
      { tag: `@programs-save-${status}` },
      async ({ page, trackProgram }) => {
        const programName = uniqueName('Web Development 2026');
        const originalDescription = 'Full-stack web development program';
        const programsPage = new ProgramsPage(page);

        await programsPage.createProgram(programName, originalDescription, trackProgram);
        await programsPage.openEdit(programName);
        await programsPage.modal.fillDescription(`save status ${status}`);
        await fulfillPrograms(
          page,
          programResource,
          'PATCH',
          status,
          JSON.stringify({ message: `status ${status}` }),
        );
        const saved = page.waitForResponse(
          (response) =>
            response.request().method() === 'PATCH' &&
            programResource.test(new URL(response.url()).pathname),
        );
        await programsPage.modal.clickSave();
        await saved;

        await expect(programsPage.modal.dialog).toBeVisible();
        await expect(programsPage.alert).toHaveCount(0);
        await expect(page).toHaveURL(/\/programs/);
        await expect(programsPage.programRow(programName).getByText(originalDescription)).toBeVisible();
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
