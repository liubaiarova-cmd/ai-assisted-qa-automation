# GitHub Actions E2E workflow

Create a GitHub Actions workflow for this Playwright repo.

1. File: `.github/workflows/e2e.yml`, workflow name "E2E Tests".
2. Trigger on push to the `main` branch and on every `pull_request`. It should also be runnable manually (`workflow_dispatch`).
3. One job called `test` on `ubuntu-latest`, `timeout-minutes: 30`.
4. Job-level `env` block with `DIDAXIS_URL`, `DIDAXIS_EMAIL`, `DIDAXIS_PASSWORD`, and `DIDAXIS_API_TOKEN`, each pulled from the matching GitHub secret (for example `${{ secrets.DIDAXIS_URL }}`). No hardcoded credentials.
5. Steps, in order:
   - `actions/checkout@v4`
   - `actions/setup-node@v4` with Node.js 20 and npm caching
   - `npm ci`
   - `npx playwright install --with-deps chromium`
   - `npx playwright test`
6. Final step: `actions/upload-artifact@v4` named `playwright-report`, path `playwright-report/`, `retention-days: 7`, with `if: ${{ !cancelled() }}` so the report uploads on pass and fail.
