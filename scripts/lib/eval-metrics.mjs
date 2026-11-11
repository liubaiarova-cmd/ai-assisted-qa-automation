/**
 * Shared eval metrics helpers (flake parsing, generation gate, PR classification).
 */
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const SPEC_RE = /\.(spec|test)\.[cm]?[jt]sx?$/;
const LOCATOR_RE = /page\.locator\(\s*(['"`])((?:\\.|(?!\1).)*)\1/g;

export function ghJson(args) {
  const result = spawnSync('gh', args, { encoding: 'utf8' });
  if (result.status !== 0) {
    return null;
  }
  try {
    return JSON.parse(result.stdout);
  } catch {
    return null;
  }
}

export function ghRunLog(runId) {
  const result = spawnSync('gh', ['run', 'view', String(runId), '--log'], {
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
  });
  if (result.status !== 0) {
    return '';
  }
  return result.stdout;
}

/** Playwright list reporter: "  38 passed (4.9m)" and optional "  1 flaky" */
export function parsePlaywrightSummaries(text) {
  const flaky = [];
  const passed = [];
  const failed = [];
  for (const line of text.split('\n')) {
    // GitHub Actions prefixes log lines; match the Playwright summary tail.
    const flakyMatch = line.match(/(\d+)\s+flaky\b/);
    if (flakyMatch && !line.includes('##[group]')) {
      flaky.push(Number(flakyMatch[1]));
    }
    const passedMatch = line.match(/(\d+)\s+passed\s*\(/);
    if (passedMatch) {
      passed.push(Number(passedMatch[1]));
    }
    const failedMatch = line.match(/(\d+)\s+failed\b/);
    if (failedMatch && line.includes('failed') && !line.includes('Self-heal')) {
      failed.push(Number(failedMatch[1]));
    }
  }
  const runFlaky = flaky.length ? flaky[flaky.length - 1] : 0;
  const runPassed = passed.length ? passed[passed.length - 1] : 0;
  const runFailed = failed.length ? failed[failed.length - 1] : 0;
  return { runFlaky, runPassed, runFailed, flaky, passed, failed };
}

export function summarizeFlakeFromText(text, runMeta) {
  const { runFlaky, runPassed, runFailed } = parsePlaywrightSummaries(text);
  const total = runPassed + runFailed;
  return {
    ...runMeta,
    flaky: runFlaky,
    passed: runPassed,
    failed: runFailed,
    total,
    hasSummary: total > 0 || runFlaky > 0,
  };
}

export function readLocalSuiteLog(repoRoot) {
  const logPath = path.join(repoRoot, 'suite-run.log');
  if (!fs.existsSync(logPath)) {
    return '';
  }
  return fs.readFileSync(logPath, 'utf8');
}

export function generationGateViolations(source, filePath) {
  const reasons = [];
  if (!source.includes('expect(')) {
    reasons.push('no expect(');
  }
  LOCATOR_RE.lastIndex = 0;
  let match;
  while ((match = LOCATOR_RE.exec(source)) !== null) {
    const body = match[2];
    if (body.includes('.') || body.includes('#') || body.includes('//')) {
      reasons.push(`brittle page.locator in ${path.basename(filePath)}`);
      break;
    }
  }
  return reasons;
}

export function specConforms(repoRoot, relPath) {
  const full = path.join(repoRoot, relPath);
  if (!fs.existsSync(full)) {
    return { ok: false, reasons: ['missing file'] };
  }
  const source = fs.readFileSync(full, 'utf8');
  const reasons = generationGateViolations(source, relPath);
  return { ok: reasons.length === 0, reasons };
}

export function mapsTicketSpecToFeature(repoRoot, specRel) {
  const base = path.basename(specRel);
  const m = base.match(/^ds(\d+)-/i);
  if (!m) {
    return { maps: false, feature: null };
  }
  const feature = `features/DS-${m[1]}.feature`;
  const exists = fs.existsSync(path.join(repoRoot, feature));
  return { maps: exists, feature };
}

export function isGenerationPr(pr) {
  const title = pr.title ?? '';
  const branch = pr.headRefName ?? '';
  if (/^DS-\d+/i.test(title)) {
    return true;
  }
  if (/^explore-/i.test(branch) || /explore/i.test(title)) {
    return true;
  }
  if (/Playwright coverage/i.test(title)) {
    return true;
  }
  return false;
}

export function isHealPr(pr) {
  const branch = pr.headRefName ?? '';
  const title = pr.title ?? '';
  return (
    branch.startsWith('heal/') ||
    /^fix\(pom\)/i.test(title) ||
    /^Heal\//i.test(title)
  );
}

export function prFirstE2eConclusion(pr) {
  const rollup = pr.statusCheckRollup ?? [];
  for (const check of rollup) {
    if (check.workflowName === 'E2E Tests' && check.name === 'test') {
      return check.conclusion ?? 'UNKNOWN';
    }
  }
  return 'NONE';
}

export function healPrTouchesTests(prNumber, repoRoot) {
  const result = spawnSync(
    'gh',
    ['pr', 'diff', String(prNumber), '--name-only'],
    { encoding: 'utf8', cwd: repoRoot },
  );
  if (result.status !== 0) {
    return false;
  }
  return result.stdout
    .split('\n')
    .some((line) => line.startsWith('tests/') && SPEC_RE.test(line));
}

export function scanTranscriptsAskGuess(transcriptsDir, repoRoot) {
  let transcriptAsks = 0;
  let hookAsks = 0;
  let hookGuesses = 0;

  if (fs.existsSync(transcriptsDir)) {
    function walk(dir) {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          walk(full);
        } else if (entry.name.endsWith('.jsonl')) {
          const text = fs.readFileSync(full, 'utf8');
          const askMatches = text.match(/"name"\s*:\s*"AskQuestion"/g);
          if (askMatches) {
            transcriptAsks += askMatches.length;
          }
        }
      }
    }
    walk(transcriptsDir);
  }

  const ledgerPath = path.join(repoRoot, '.eval/ask-guess.jsonl');
  if (fs.existsSync(ledgerPath)) {
    for (const line of fs.readFileSync(ledgerPath, 'utf8').split('\n')) {
      if (!line.trim()) continue;
      try {
        const row = JSON.parse(line);
        if (row.type === 'ask') hookAsks += 1;
        if (row.type === 'guess') hookGuesses += 1;
      } catch {
        /* ignore */
      }
    }
  }

  return {
    asks: transcriptAsks + hookAsks,
    guesses: hookGuesses,
    transcriptAsks,
    hookAsks,
    hookGuesses,
  };
}

export function listSpecFiles(repoRoot) {
  const testsDir = path.join(repoRoot, 'tests');
  const out = [];
  for (const name of fs.readdirSync(testsDir)) {
    if (SPEC_RE.test(name)) {
      out.push(`tests/${name}`);
    }
  }
  return out.sort();
}
