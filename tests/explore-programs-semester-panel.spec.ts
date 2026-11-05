import { expect, test } from '../fixtures/cleanup.fixture';
import { ProgramsPage } from '../pages/ProgramsPage';
import { uniqueName } from './support/didaxis-programs';

test.setTimeout(60_000);

test.describe('Program semester panel', () => {
  test('selecting a program shows its empty semester panel', async ({ page, trackProgram }) => {
    const programName = uniqueName('Semester Panel');
    const programsPage = new ProgramsPage(page);

    await programsPage.createProgram(programName, 'Semester panel seed', trackProgram);
    const panel = await programsPage.openProgram(programName);

    await expect(panel.heading(programName)).toBeVisible();
    await expect(panel.subtitle).toBeVisible();
    await expect(panel.manageCoursesButton).toBeEnabled();
    await expect(panel.addSemesterButton).toBeEnabled();
    await expect(panel.generateCurriculumButton).toBeDisabled();
    await expect(panel.emptyMessage).toBeVisible();
    await expect(page).toHaveURL(/\/programs$/);
  });

  test('Create Semester stays disabled until required fields are filled', async ({ page, trackProgram }) => {
    const programName = uniqueName('Semester Cancel');
    const programsPage = new ProgramsPage(page);

    await programsPage.createProgram(programName, 'Semester cancel seed', trackProgram);
    const panel = await programsPage.openProgram(programName);
    const modal = await panel.openAddSemester();

    await expect(modal.heading).toBeVisible();
    await expect(modal.semesterNameInput).toHaveValue('');
    await expect(modal.startDateInput).toHaveValue('');
    await expect(modal.endDateInput).toHaveValue('');
    await expect(modal.createButton).toBeDisabled();

    await modal.cancel();

    await expect(modal.dialog).toBeHidden();
    await expect(panel.emptyMessage).toBeVisible();
  });

  test('keyboard moves from the new semester dialog close control to Semester Name', {
    tag: '@semester-a11y-keyboard',
  }, async ({ page, trackProgram }) => {
    const programName = uniqueName('Semester Keyboard');
    const programsPage = new ProgramsPage(page);

    await programsPage.createProgram(programName, 'Semester keyboard seed', trackProgram);
    const panel = await programsPage.openProgram(programName);
    const modal = await panel.openAddSemester();

    await expect(modal.dialog).toBeVisible();
    await expect(modal.closeButton).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(modal.semesterNameInput).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(modal.dialog).toBeHidden();
    await expect(panel.emptyMessage).toBeVisible();
  });
});
