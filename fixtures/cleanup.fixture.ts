import { test as base, expect, type Page } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'path';
import { login } from '../tests/support/didaxis-programs';

dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

const baseUrl = process.env.DIDAXIS_URL ?? 'https://test.didaxis.studio';

type CleanupFixtures = {
  trackProgram: (uuid: string) => void;
};

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

async function pageForCleanup(page: Page): Promise<{ page: Page; close: () => Promise<void> }> {
  if (!page.isClosed()) return { page, close: async () => {} };

  const browser = page.context().browser();
  if (!browser) throw new Error('Cannot clean up programs because the browser is closed');
  const context = await browser.newContext();
  const fresh = await context.newPage();
  return { page: fresh, close: () => context.close() };
}

export const test = base.extend<CleanupFixtures>({
  trackProgram: async ({ page }, use, testInfo) => {
    const ids = new Set<string>();
    const where = `${path.basename(testInfo.file)} | ${testInfo.title}`;
    await use((uuid: string) => {
      if (!uuid) throw new Error('trackProgram requires a program UUID');
      ids.add(uuid);
      console.log(`[api-cleanup] created ${uuid} | ${where}`);
    });

    if (ids.size === 0) return;

    const cleanup = await pageForCleanup(page);
    try {
      let token = await resolveToken(cleanup.page);
      const failures: string[] = [];
      for (const id of ids) {
        const result = await deleteProgram(cleanup.page, id, token);
        token = result.token;
        console.log(`[api-cleanup] deleted ${id} status ${result.status} | ${where}`);
        if (result.status !== 200 && result.status !== 404) {
          failures.push(`${id} (${result.status})`);
        }
      }
      if (failures.length > 0) {
        throw new Error(`Program cleanup failed for: ${failures.join(', ')}`);
      }
    } finally {
      await cleanup.close();
    }
  },
});

export { expect };
