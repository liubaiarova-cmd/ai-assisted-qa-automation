import { expect, test } from '../fixtures/cleanup.fixture';
import { login } from './support/didaxis-programs';

const baseUrl = process.env.DIDAXIS_URL ?? 'https://test.didaxis.studio';

let trackedId = '';
let untrackedId = '';

async function accessToken(page: import('@playwright/test').Page): Promise<string> {
  let refresh = await page.request.post(`${baseUrl}/api/auth/refresh`);
  if (refresh.status() === 401) {
    await login(page);
    refresh = await page.request.post(`${baseUrl}/api/auth/refresh`);
  }
  expect(refresh.ok()).toBe(true);
  const token = (await refresh.json())?.data?.access_token as string;
  expect(token).toBeTruthy();
  return token;
}

async function createProgram(page: import('@playwright/test').Page, token: string, name: string): Promise<string> {
  const response = await page.request.post(`${baseUrl}/api/programs`, {
    headers: { Authorization: `Bearer ${token}` },
    data: { name, description: 'api cleanup proof' },
  });
  expect(response.status()).toBe(201);
  const id = (await response.json())?.data?.id as string;
  expect(id).toBeTruthy();
  return id;
}

test.describe.serial('api cleanup fixture', () => {
  test('tracks only the program it is asked to delete', async ({ page, trackProgram }) => {
    test.skip(!process.env.DIDAXIS_EMAIL || !process.env.DIDAXIS_PASSWORD, 'Didaxis credentials missing');
    test.setTimeout(60_000);

    await login(page);
    const token = await accessToken(page);
    const suffix = `${Date.now()}`;
    trackedId = await createProgram(page, token, `Cleanup tracked ${suffix}`);
    untrackedId = await createProgram(page, token, `Cleanup untracked ${suffix}`);
    trackProgram(trackedId);
  });

  test('deletes the tracked program after the test and leaves the other', async ({ page, trackProgram }) => {
    test.skip(!trackedId || !untrackedId, 'Previous cleanup proof did not create programs');
    test.setTimeout(60_000);

    await login(page);
    const token = await accessToken(page);
    const headers = { Authorization: `Bearer ${token}` };

    try {
      expect((await page.request.get(`${baseUrl}/api/programs/${trackedId}`, { headers })).status()).toBe(404);
      expect((await page.request.get(`${baseUrl}/api/programs/${untrackedId}`, { headers })).ok()).toBe(true);
    } finally {
      trackProgram(untrackedId);
    }
  });
});
