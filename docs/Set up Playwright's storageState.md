Set up Playwright's storageState auth pattern for this repo.

1. Create tests/auth.setup.ts: a setup test named "authenticate" that
   goes to https://test.didaxis.studio/login, fills Email and Password
   from process.env.DIDAXIS_EMAIL / DIDAXIS_PASSWORD, clicks Sign In,
   waits for **/programs, then saves storageState to
   playwright/.auth/user.json.
2. Update playwright.config.ts to add a "setup" project matching
   *.setup.ts, and make the chromium project depend on it and load
   storageState from playwright/.auth/user.json.
3. Add playwright/.auth/ to .gitignore.
Use role- and label-based locators only. No hardcoded credentials
