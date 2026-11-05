import type { Locator, Page } from '@playwright/test';

export class NewSemesterModal {
  readonly dialog: Locator;
  readonly heading: Locator;
  readonly semesterNameInput: Locator;
  readonly startDateInput: Locator;
  readonly endDateInput: Locator;
  readonly createButton: Locator;
  readonly cancelButton: Locator;
  readonly closeButton: Locator;

  constructor(private readonly page: Page) {
    this.dialog = page.getByRole('dialog').filter({
      has: page.getByRole('heading', { name: 'New Semester' }),
    });
    this.heading = this.dialog.getByRole('heading', { name: 'New Semester' });
    this.semesterNameInput = this.dialog.getByLabel('Semester Name');
    this.startDateInput = this.dialog.getByLabel('Start Date');
    this.endDateInput = this.dialog.getByLabel('End Date');
    this.createButton = this.dialog.getByRole('button', { name: 'Create Semester' });
    this.cancelButton = this.dialog.getByRole('button', { name: 'Cancel' });
    this.closeButton = this.dialog.getByRole('banner').getByRole('button');
  }

  async cancel(): Promise<void> {
    await this.cancelButton.click();
  }
}
