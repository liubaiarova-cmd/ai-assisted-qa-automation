import type { Locator, Page } from '@playwright/test';
import { emptyProgramsMessage, programsUrl, type TrackProgram } from '../tests/support/didaxis-programs';
import { NewProgramModal } from './NewProgramModal';

export class ProgramsPage {
  readonly newProgramButton: Locator;
  readonly createFirstProgramButton: Locator;
  readonly emptyStateMessage: Locator;
  readonly duplicateError: Locator;
  readonly modal: NewProgramModal;

  constructor(private readonly page: Page) {
    this.newProgramButton = page.getByRole('button', { name: '+ New Program' });
    this.createFirstProgramButton = page.getByRole('button', { name: 'Create Program' });
    this.emptyStateMessage = page.getByText(emptyProgramsMessage);
    this.duplicateError = page.getByText(/already|duplicate|exists|in use/i);
    this.modal = new NewProgramModal(page);
  }

  async filterControl(): Promise<Locator | null> {
    const candidates = [
      this.page.getByRole('searchbox'),
      this.page.getByPlaceholder(/search|filter/i),
      this.page.getByLabel(/search|filter/i),
    ];

    for (const candidate of candidates) {
      if ((await candidate.count()) > 0) {
        return candidate.first();
      }
    }

    return null;
  }

  programRow(programName: string): Locator {
    return this.page.getByRole('row').filter({
      has: this.page.getByText(programName, { exact: true }),
    });
  }

  firstProgramRow(programName: string): Locator {
    return this.programRow(programName).first();
  }

  programNameText(name: string): Locator {
    return this.page.getByText(name, { exact: true });
  }

  async scrollFirstProgramRowIntoView(programName: string): Promise<void> {
    await this.firstProgramRow(programName).scrollIntoViewIfNeeded();
  }

  async goto(): Promise<void> {
    await this.page.goto(programsUrl);
    await this.newProgramButton.waitFor({ state: 'visible' });
    await this.waitForListSurface();
  }

  async waitForListSurface(): Promise<void> {
    await this.page
      .getByRole('table')
      .or(this.emptyStateMessage)
      .waitFor({ state: 'visible', timeout: 30_000 });
  }

  async reload(): Promise<void> {
    await this.page.reload();
    await this.newProgramButton.waitFor({ state: 'visible' });
  }

  async openNewProgramForm(): Promise<NewProgramModal> {
    await this.newProgramButton.click();
    return this.modal;
  }

  async createProgram(
    programName: string,
    description: string | undefined,
    trackProgram: TrackProgram,
  ): Promise<void> {
    await this.goto();
    await this.openNewProgramForm();
    await this.modal.fill(programName, description);
    await this.modal.submitCreate(trackProgram);
  }

  async attemptCreate(
    programName: string,
    description: string | undefined,
    trackProgram: TrackProgram,
  ): Promise<void> {
    await this.openNewProgramForm();
    await this.modal.fill(programName, description);
    await this.modal.clickCreate(trackProgram, { required: false });
  }

  async confirmDelete(programName: string): Promise<void> {
    const deleteButton = this.firstProgramRow(programName).getByRole('button', {
      name: `Delete ${programName}`,
      exact: true,
    });
    await deleteButton.scrollIntoViewIfNeeded();
    const dialogPromise = this.page.waitForEvent('dialog');
    const clickPromise = deleteButton.click();
    const dialog = await dialogPromise;
    await dialog.accept();
    await clickPromise;
  }

  async openEdit(programName: string): Promise<NewProgramModal> {
    const editButton = this.firstProgramRow(programName).getByRole('button', {
      name: `Edit ${programName}`,
      exact: true,
    });
    await editButton.scrollIntoViewIfNeeded();
    await editButton.click();
    if (!(await this.modal.editHeading.isVisible())) {
      await editButton.dispatchEvent('click');
    }
    await this.modal.editHeading.waitFor({ state: 'visible', timeout: 10_000 });
    return this.modal;
  }
}
