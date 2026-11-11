# AI-assisted QA automation

Playwright end-to-end tests and Cursor agent workflows for Didaxis (programs flows, Jira-driven test generation).

## Prerequisites

- [Node.js](https://nodejs.org/) 18+ (CI uses 20)
- npm

## Install

```bash
git clone https://github.com/liubaiarova-cmd/ai-assisted-qa-automation.git
cd ai-assisted-qa-automation
npm ci
npx playwright install --with-deps chromium
```

## Environment

1. Copy the example file:

   ```bash
   cp .env.example .env
   ```

2. Fill in **Run tests** variables (see `.env.example` for comments on each):

   - `DIDAXIS_URL`, `DIDAXIS_EMAIL`, `DIDAXIS_PASSWORD`, `DIDAXIS_API_TOKEN`
   - Optional: `DIDAXIS_ALT_EMAIL`, `DIDAXIS_ALT_PASSWORD` for permission probes. Specs that check non-admin access currently read `DIDAXIS_NON_ADMIN_EMAIL` and `DIDAXIS_NON_ADMIN_PASSWORD`; set those in `.env` to the same alt credentials.

3. **Agent / CI** variables (`CURSOR_API_KEY`, `ATLASSIAN_*`) are only needed for the test-generation workflow and Atlassian MCP in Cursor—not for running Playwright locally.

`.env` is gitignored. Do not commit secrets.

## Run tests

Full suite (setup project logs in once, then Chromium specs with `storageState`):

```bash
npm test
# or
npx playwright test
```

Other useful commands:

```bash
npm run test:ui      # Playwright UI mode
npm run test:headed  # Headed browser
```

Manual program cleanup (separate config):

```bash
npm run cleanup:programs
```

## Run a tagged slice

Each test carries exactly one suite tag: `@smoke`, `@sanity`, `@regression`, `@api`, `@e2e`, or `@destructive` (see `playwright-conventions.mdc`).

```bash
npm run test:smoke
npm run test:sanity
npm run test:regression
npm run test:api
npm run test:e2e
npm run test:destructive   # --workers=1
```

- **One file:** `npx playwright test tests/ds1-create-program.spec.ts`
- **By title:** `npx playwright test -g "TC-001"`

## Cursor agent and skills (optional)

This repo is set up for QA orchestration in **Cursor Agent**:

| Path | Purpose |
|------|---------|
| `.cursor/rules/` | Constitution, Playwright conventions, QA routing (e.g. `qa-orchestration.mdc`) |
| `.cursor/skills/` | Jira → Gherkin, POM, API cleanup, self-heal, explore-and-generate, etc. |
| `.cursor/agents/` | Specialist prompts (test-writer, triage, bug-reporter) |
| `.cursor/hooks/` | Guards on generation and assertions (see `hooks.json`) |

**Local agent use**

1. Open the project in Cursor with Agent enabled.
2. Keep Didaxis creds in `.env` for live UI recon (`jira-ticket-to-gherkin`, explore-and-generate).
3. Configure **Atlassian MCP** in Cursor settings with `ATLASSIAN_EMAIL`, `ATLASSIAN_API_TOKEN`, and site URL aligned with `ATLASSIAN_BASE_URL` in `.env.example`.

**CI**

- `.github/workflows/e2e.yml` — runs Playwright on pushes/PRs using GitHub Actions secrets for `DIDAXIS_*`.
- `.github/workflows/test-generation.yml` — headless Cursor agent backlog (`CURSOR_API_KEY`, `ATLASSIAN_*`); not required for local `npx playwright test`.
- `eval-report.md` — suite reliability metrics (flake rate, heal success, generation-gate pass rate, ask-vs-guess). Regenerated via `npm run eval:report`, after each `test-generation` / `e2e` workflow run, and when a local Agent session ends (`stop` / `sessionEnd` hooks).

Gherkin plans live under `features/`; implemented specs under `tests/` with page objects in `pages/`.

## Project layout (short)

- `tests/auth.setup.ts` — shared login → `playwright/.auth/user.json`
- `fixtures/cleanup.fixture.ts` — tracks created programs and deletes via API
- `playwright.config.ts` — `baseURL` from `DIDAXIS_URL`, `en-CA` / `America/Toronto`

## License

ISC
