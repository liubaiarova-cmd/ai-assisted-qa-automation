import type { Locator, Page } from '@playwright/test';
import { NewSemesterModal } from './NewSemesterModal';

export class SemesterPanel {
  readonly subtitle: Locator;
  readonly manageCoursesButton: Locator;
  readonly generateCurriculumButton: Locator;
  readonly addSemesterButton: Locator;
  readonly emptyMessage: Locator;
  readonly modal: NewSemesterModal;

  constructor(private readonly page: Page) {
    this.subtitle = page.getByText('Semesters & scheduling config', { exact: true });
    this.manageCoursesButton = page.getByRole('button', { name: 'Manage Courses' });
    this.generateCurriculumButton = page.getByRole('button', { name: /Generate Curriculum/ });
    this.addSemesterButton = page.getByRole('button', { name: '+ Semester' });
    this.emptyMessage = page.getByText('No semesters yet', { exact: true });
    this.modal = new NewSemesterModal(page);
  }

  heading(programName: string): Locator {
    return this.page.getByRole('heading', { level: 4, name: programName, exact: true });
  }

  async openAddSemester(): Promise<NewSemesterModal> {
    await this.addSemesterButton.click();
    return this.modal;
  }
}
