import { expect, test, type TestInfo } from '@playwright/test';
import type { Result } from 'axe-core';

function formatViolations(violations: Result[]): string {
  return violations
    .map((violation) => {
      const targets = violation.nodes
        .map((node) => node.target.join(' '))
        .join('\n    ');
      return [
        `${violation.id} (${violation.impact ?? 'unknown'}): ${violation.help}`,
        violation.helpUrl,
        targets ? `  nodes:\n    ${targets}` : '',
      ]
        .filter(Boolean)
        .join('\n');
    })
    .join('\n\n');
}

export type A11yAssertOptions = {
  /** In CI only: report violations but do not fail the test. */
  nonBlockingInCi?: boolean;
};

/**
 * Fail the test when axe reports violations.
 * With `nonBlockingInCi`, CI attaches reports and warnings instead of failing.
 */
export async function expectNoAccessibilityViolations(
  violations: Result[],
  testInfo: TestInfo,
  options: A11yAssertOptions = {},
): Promise<void> {
  if (violations.length === 0) {
    return;
  }

  const summary = formatViolations(violations);

  if (process.env.CI && options.nonBlockingInCi) {
    await testInfo.attach('a11y-violations.json', {
      body: JSON.stringify(violations, null, 2),
      contentType: 'application/json',
    });
    await testInfo.attach('a11y-violations.txt', {
      body: summary,
      contentType: 'text/plain',
    });
    testInfo.annotations.push({
      type: 'warning',
      description: `${violations.length} accessibility violation(s) — see test attachments in the HTML report`,
    });
    for (const violation of violations) {
      const message = `${violation.help} (${violation.impact ?? 'unknown'})`.replace(/\r?\n/g, ' ');
      console.log(`::warning title=A11y ${violation.id}::${message}`);
    }
    return;
  }

  await expect(violations, summary).toEqual([]);
}

/** CI-only: attach scan failure details and skip so the workflow stays green. */
export async function reportCiA11yFailureAndSkip(
  testInfo: TestInfo,
  error: unknown,
  reason: string,
): Promise<never> {
  const detail =
    error instanceof Error ? `${error.message}${error.stack ? `\n${error.stack}` : ''}` : String(error);

  await testInfo.attach('a11y-scan-error.txt', {
    body: `${reason}\n\n${detail}`,
    contentType: 'text/plain',
  });
  testInfo.annotations.push({
    type: 'warning',
    description: `${reason} — see a11y-scan-error.txt in the HTML report`,
  });
  console.log(`::warning title=A11y::${reason.replace(/\r?\n/g, ' ')}`);

  test.skip(true, reason);
}

export type RunA11yCheckOptions = {
  /** Shown on CI skip/warning when the scan cannot finish. */
  ciLabel?: string;
  ciTimeoutMs?: number;
};

const DEFAULT_CI_A11Y_TIMEOUT_MS = 240_000;

/**
 * Locally: fail on violations or scan errors.
 * In CI: attach a report and stay green; skip with attachments if the scan cannot finish.
 */
export async function runA11yCheck(
  testInfo: TestInfo,
  scan: () => Promise<Result[]>,
  options: RunA11yCheckOptions = {},
): Promise<void> {
  if (process.env.CI) {
    testInfo.setTimeout(options.ciTimeoutMs ?? DEFAULT_CI_A11Y_TIMEOUT_MS);
    try {
      const violations = await scan();
      await expectNoAccessibilityViolations(violations, testInfo, { nonBlockingInCi: true });
    } catch (error) {
      await reportCiA11yFailureAndSkip(
        testInfo,
        error,
        options.ciLabel ?? 'Accessibility check did not complete in CI',
      );
    }
    return;
  }

  const violations = await scan();
  await expectNoAccessibilityViolations(violations, testInfo);
}
