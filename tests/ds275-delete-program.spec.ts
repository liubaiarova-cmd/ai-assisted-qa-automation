import { expect, test } from '../fixtures/cleanup.fixture';
import { ProgramsPage } from '../pages/ProgramsPage';
import { registerProgramsA11y } from './support/programs-a11y';
import {
  fulfillPrograms,
  listEmptyCopyStatuses,
  programsCollection,
} from './support/programs-network';
import { emptyProgramsMessage, uniqueName } from './support/didaxis-programs';

test.setTimeout(90_000);

function confirmationMessage(programName: string): string {
  return `Delete program "${programName}"? All its semesters and courses will be removed. This cannot be undone.`;
}

test.describe('DS-275 Delete program with confirmation', () => {
  test('confirming deletion removes Test Program', async ({ page, trackProgram }) => {
    const programName = uniqueName('Test Program');
    const programsPage = new ProgramsPage(page);

    await programsPage.createProgram(programName, 'Program scheduled for deletion', trackProgram);
    const message = await programsPage.respondToDelete(programName, 'accept');

    expect(message).toBe(confirmationMessage(programName));
    await expect(programsPage.programRow(programName)).toHaveCount(0);
  });

  test('cancelling deletion keeps Test Program in the list', async ({ page, trackProgram }) => {
    const programName = uniqueName('Test Program');
    const programsPage = new ProgramsPage(page);

    await programsPage.createProgram(programName, 'Program that should remain', trackProgram);
    const message = await programsPage.respondToDelete(programName, 'dismiss');

    expect(message).toBe(confirmationMessage(programName));
    await expect(programsPage.programRow(programName)).toBeAttached();
    await programsPage.programRow(programName).scrollIntoViewIfNeeded();
    await expect(programsPage.programRow(programName)).toBeVisible();
  });

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
