---
name: api-cleanup
description: >
  Ensures Playwright tests clean up the data they create.
  Use whenever generating or reviewing tests that create programs (or
  any persistent records) in Didaxis, so test data does not accumulate.
  Apply this to every test that creates data — even if cleanup isn't
  explicitly requested.
---

# API Cleanup for Test Data

Tests that create data must remove it. Leftover data slows the app and
makes test runs unreliable. Every test that creates a program must track
its UUID and delete it via the API afterwards.

## Steps

1. Use the shared cleanup fixture in `fixtures/cleanup.fixture.ts`.
   Import `test` from there, not from `@playwright/test`.
2. When a test creates a program, capture the program's UUID and call
   `trackProgram(uuid)` immediately.
3. Do not write manual `afterAll` blocks for cleanup — the fixture
   handles teardown for every test that uses it.
4. Cleanup uses the DELETE API, not the UI:
   `DELETE /api/programs/<uuid>` with a Bearer token from
   `process.env.DIDAXIS_API_TOKEN`.
5. Never hardcode the token. Never delete data the test did not create.

## Reference

- Endpoint: `DELETE https://test.didaxis.studio/api/programs/<uuid>`
- Auth: `Authorization: Bearer ${DIDAXIS_API_TOKEN}`
- Create response: `POST /api/programs` returns **201** with the UUID at `data.id`. That value is the `<uuid>` to track.
- Base URL: `process.env.DIDAXIS_URL` (default `https://test.didaxis.studio`).

## Capture the UUID

UI creation and API creation both hit `POST /api/programs`. Wait for that response and pass `data.id` to `trackProgram` before the test continues. A later rename does not change the id — still delete that UUID.

```ts
const responsePromise = page.waitForResponse(
  (response) =>
    response.url().endsWith('/api/programs') &&
    response.request().method() === 'POST' &&
    response.status() === 201,
);
// ...submit the create form or API call...
const body = await (await responsePromise).json();
trackProgram(body.data.id);
```

If `fixtures/cleanup.fixture.ts` does not exist yet, add it before writing the test. Tests must not invent their own delete helper.

## Fixture contract

`fixtures/cleanup.fixture.ts` extends Playwright's `test` and exposes `trackProgram(uuid: string)`.

- Collect ids only for the current test.
- After the test finishes (fixture teardown, including when the test fails), `DELETE` each tracked id.
- Treat **200** and **404** as success. A **404** means the test already removed that program.
- On any other status, throw so the run shows leftover data.
- Delete only ids passed to `trackProgram`.

## Expired token

Access tokens expire about 15 minutes after they are issued. They are not in `localStorage`. UI login sets an httpOnly cookie, `didaxis_refresh_token`, on path `/api/auth`. The SPA keeps the access token in memory and sends it as `Authorization: Bearer`.

Resolve the token inside the fixture, in memory only. Do not write it into source, logs, or `.env`.

1. Use `process.env.DIDAXIS_API_TOKEN` when its JWT `exp` is more than 60 seconds in the future. Read `exp` from the payload (the middle segment, base64url). Do not log the token.
2. Otherwise call `POST ${baseUrl}/api/auth/refresh` with the Playwright request context that just logged in (`page.request`). The cookie is sent automatically. The body is `{ data: { access_token } }`.
3. If refresh returns **401**, there is no session cookie. Log in through the UI with `login()` from `tests/support/didaxis-programs.ts` (`DIDAXIS_EMAIL` / `DIDAXIS_PASSWORD`), then call `/api/auth/refresh` again on that same context.
4. If the browser is not open yet, open one, run that same login, refresh, then close it. Do not scrape the token from the page DOM.
5. If `DELETE` returns **401**, refresh once and retry that delete. Do not retry forever.

```ts
async function resolveToken(page: Page): Promise<string> {
  const envToken = process.env.DIDAXIS_API_TOKEN;
  if (envToken && !tokenExpired(envToken)) return envToken;

  let refresh = await page.request.post(`${baseUrl}/api/auth/refresh`);
  if (refresh.status() === 401) {
    await login(page);
    refresh = await page.request.post(`${baseUrl}/api/auth/refresh`);
  }
  if (!refresh.ok()) {
    throw new Error(`Could not refresh Didaxis API token (${refresh.status()})`);
  }
  const token = (await refresh.json())?.data?.access_token;
  if (!token) throw new Error('Refresh response did not include data.access_token');
  return token;
}
```
