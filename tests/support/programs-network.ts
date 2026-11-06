import type { Page } from '@playwright/test';

export const programsCollection = /\/api\/programs$/;
export const programResource = /\/api\/programs\/[^/]+$/;

export const saveStatuses = [503, 401, 403, 404, 501, 502, 400, 409, 422, 429, 500, 504, 408, 300] as const;

/** Failed list responses that render the empty-state sentence. */
export const listEmptyCopyStatuses = [401, 403, 404, 501, 502, 503, 300, 400, 500, 504, 408] as const;

export async function fulfillPrograms(
  page: Page,
  url: RegExp,
  method: string,
  status: number,
  body: string | null,
  contentType?: string,
): Promise<void> {
  await page.route(url, async (route) => {
    if (route.request().method() !== method) {
      await route.continue();
      return;
    }
    await route.fulfill({
      status,
      contentType: contentType ?? (body === null ? undefined : 'application/json'),
      body: body ?? '',
    });
  });
}
