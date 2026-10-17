import { test as setup } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { loginUrl } from './support/didaxis-programs';

const authFile = path.join(__dirname, '..', 'playwright', '.auth', 'user.json');

setup('authenticate', async ({ page }) => {
  const email = process.env.DIDAXIS_EMAIL;
  const password = process.env.DIDAXIS_PASSWORD;
  setup.skip(!email || !password, 'Didaxis credentials missing');

  await page.goto(loginUrl);
  await page.getByLabel('Email').fill(email!);
  await page.getByLabel('Password').fill(password!);
  await page.getByRole('button', { name: 'Sign In' }).click();
  await page.waitForURL((url) => !url.pathname.includes('/login'));
  await page.getByRole('button', { name: /Dashboard/i }).waitFor();

  fs.mkdirSync(path.dirname(authFile), { recursive: true });
  await page.context().storageState({ path: authFile });
});
