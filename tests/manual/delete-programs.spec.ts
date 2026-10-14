import { expect, test, type Page } from '@playwright/test';
import { baseUrl, login } from '../support/didaxis-programs';
import { idsToDelete, parseDeleteLimit, programIds } from '../support/delete-limit';

function tokenExpired(token: string): boolean {
  try {
    const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString()) as { exp?: number };
    return typeof payload.exp !== 'number' || payload.exp * 1000 < Date.now() + 60_000;
  } catch {
    return true;
  }
}

async function resolveToken(page: Page, forceLogin = false): Promise<string> {
  const envToken = process.env.DIDAXIS_API_TOKEN;
  if (!forceLogin && envToken && !tokenExpired(envToken)) return envToken;

  if (forceLogin) await login(page);

  let refresh = await page.request.post(`${baseUrl}/api/auth/refresh`);
  if (refresh.status() === 401) {
    await login(page);
    refresh = await page.request.post(`${baseUrl}/api/auth/refresh`);
  }
  if (!refresh.ok()) {
    throw new Error(`Could not refresh Didaxis API token (${refresh.status()})`);
  }
  const token = (await refresh.json())?.data?.access_token as string | undefined;
  if (!token) throw new Error('Refresh response did not include data.access_token');
  return token;
}

async function deleteProgram(page: Page, uuid: string, token: string): Promise<{ status: number; token: string }> {
  const send = (bearer: string) =>
    page.request.delete(`${baseUrl}/api/programs/${uuid}`, {
      headers: { Authorization: `Bearer ${bearer}` },
    });

  let response = await send(token);
  if (response.status() === 401 || response.status() === 403) {
    const refreshed = await resolveToken(page, true);
    response = await send(refreshed);
    return { status: response.status(), token: refreshed };
  }
  return { status: response.status(), token };
}

test('deletes programs chosen by DELETE_LIMIT', async ({ page }) => {
  const limit = parseDeleteLimit(process.env.DELETE_LIMIT);
  test.setTimeout(0);

  let token = await resolveToken(page);
  let response = await page.request.get(`${baseUrl}/api/programs`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (response.status() === 401 || response.status() === 403) {
    token = await resolveToken(page, true);
    response = await page.request.get(`${baseUrl}/api/programs`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  }
  expect(response.ok()).toBe(true);

  const ids = programIds(await response.json());
  const selected = idsToDelete(ids, limit);
  console.log(`[manual-cleanup] found ${ids.length} programs, deleting ${selected.length}`);

  const failures: string[] = [];
  for (const id of selected) {
    const result = await deleteProgram(page, id, token);
    token = result.token;
    console.log(`[manual-cleanup] deleted ${id} status ${result.status}`);
    if (result.status !== 200 && result.status !== 404) {
      failures.push(`${id} (${result.status})`);
    }
  }

  expect(failures, `Program delete failed for: ${failures.join(', ')}`).toEqual([]);
});
