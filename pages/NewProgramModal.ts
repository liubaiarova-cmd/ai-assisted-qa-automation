import type { Locator, Page, Response } from '@playwright/test';
import { trackCreatedProgram, type TrackProgram } from '../tests/support/didaxis-programs';

function isProgramCreate(response: Response): boolean {
  if (response.request().method() !== 'POST') return false;
  try {
    return new URL(response.url()).pathname === '/api/programs';
  } catch {
    return false;
  }
}

export class NewProgramModal {
  readonly dialog: Locator;
  readonly programNameInput: Locator;
  readonly descriptionInput: Locator;
  readonly createButton: Locator;
  readonly cancelButton: Locator;
  readonly lengthError: Locator;
  readonly editHeading: Locator;
  readonly newProgramHeading: Locator;
  readonly saveButton: Locator;

  constructor(private readonly page: Page) {
    this.dialog = page.getByRole('dialog');
    this.programNameInput = this.dialog.getByLabel('Program Name');
    this.descriptionInput = this.dialog.getByLabel('Description');
    this.createButton = this.dialog.getByRole('button', { name: 'Create' });
    this.cancelButton = this.dialog.getByRole('button', { name: 'Cancel' });
    this.saveButton = this.dialog.getByRole('button', { name: 'Save' });
    this.lengthError = this.dialog.getByText(/too long|maximum|max\.?\s*\d+|character/i);
    this.editHeading = this.dialog.getByRole('heading', { name: 'Edit Program' });
    this.newProgramHeading = this.dialog.getByRole('heading', { name: 'New Program' });
  }

  async fill(programName: string, description?: string): Promise<void> {
    await this.programNameInput.fill(programName);
    if (description !== undefined) {
      await this.descriptionInput.fill(description);
    }
  }

  async fillDescription(description: string): Promise<void> {
    await this.descriptionInput.fill(description);
  }

  async fillProgramName(programName: string): Promise<void> {
    await this.programNameInput.fill(programName);
  }

  async dismiss(): Promise<void> {
    await this.cancelButton.click();
    if (await this.dialog.isVisible()) {
      await this.page.keyboard.press('Escape');
    }
  }

  async clickCreate(trackProgram: TrackProgram, options?: { required?: boolean }): Promise<Response | null> {
    const required = options?.required !== false;
    const responsePromise = this.page
      .waitForResponse(isProgramCreate, { timeout: 20_000 })
      .catch((error: unknown) => {
        if (!required) return null;
        throw error;
      });
    await this.createButton.click();
    const response = await responsePromise;
    if (response && response.status() === 201) {
      await trackCreatedProgram(response, trackProgram);
    }
    return response;
  }

  async submitCreate(trackProgram: TrackProgram): Promise<void> {
    const responsePromise = this.page.waitForResponse(
      (response) => isProgramCreate(response) && response.status() === 201,
    );
    await this.createButton.click();
    await trackCreatedProgram(await responsePromise, trackProgram);
    await this.dialog.waitFor({ state: 'hidden', timeout: 20_000 });
  }

  async clickSave(): Promise<void> {
    await this.saveButton.click();
  }
}
