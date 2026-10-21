import { expect, type TestInfo } from '@playwright/test';
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

/**
 * Locally: fail the test when axe reports violations.
 * In CI: keep the job green, attach violation details, and emit GitHub warnings.
 */
export async function expectNoAccessibilityViolations(
  violations: Result[],
  testInfo: TestInfo,
): Promise<void> {
  if (violations.length === 0) {
    return;
  }

  const summary = formatViolations(violations);

  if (process.env.CI) {
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
