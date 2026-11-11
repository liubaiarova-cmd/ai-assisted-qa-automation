#!/usr/bin/env node
/**
 * Writes eval-report.md — suite reliability metrics for QA orchestration.
 */
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import {
  ghJson,
  ghRunLog,
  isGenerationPr,
  isHealPr,
  listSpecFiles,
  mapsTicketSpecToFeature,
  prFirstE2eConclusion,
  readLocalSuiteLog,
  scanTranscriptsAskGuess,
  specConforms,
  summarizeFlakeFromText,
} from './lib/eval-metrics.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..');
const REPORT_PATH = path.join(REPO_ROOT, 'eval-report.md');
const EVAL_DIR = path.join(REPO_ROOT, '.eval');

const CI_RUNS_N = Number(process.env.EVAL_CI_RUNS_N ?? 10);
const TRIGGER = process.env.EVAL_TRIGGER ?? 'manual';
const GITHUB_RUN_ID = process.env.GITHUB_RUN_ID ?? '';
const TRANSCRIPTS_DIR =
  process.env.EVAL_TRANSCRIPTS_DIR ??
  path.join(
    process.env.HOME ?? '',
    '.cursor/projects/Users-iarovaliubov-LegionQA-AI-AQA-ai-assisted-qa-automation/agent-transcripts',
  );

const SPEC_FILE_RE = /\.(spec|test)\.[cm]?[jt]sx?$/;

function ensureEvalDir() {
  if (!fs.existsSync(EVAL_DIR)) {
    fs.mkdirSync(EVAL_DIR, { recursive: true });
  }
}

function prDiffNames(prNumber) {
  const result = spawnSync('gh', ['pr', 'diff', String(prNumber), '--name-only'], {
    encoding: 'utf8',
    cwd: REPO_ROOT,
  });
  if (result.status !== 0) {
    return [];
  }
  return result.stdout.split('\n').filter(Boolean);
}

function collectFlakeMetrics() {
  const runs =
    ghJson([
      'run',
      'list',
      '--workflow=e2e.yml',
      `--limit=${CI_RUNS_N}`,
      '--json',
      'databaseId,conclusion,createdAt,displayTitle',
    ]) ?? [];

  const completed = runs.filter((r) =>
    ['success', 'failure'].includes(r.conclusion),
  );

  const perRun = [];
  let totalFlaky = 0;
  let totalTests = 0;

  for (const run of completed) {
    const log = ghRunLog(run.databaseId);
    const summary = summarizeFlakeFromText(log, {
      id: run.databaseId,
      conclusion: run.conclusion,
      createdAt: run.createdAt,
      title: run.displayTitle,
    });
    if (summary.hasSummary) {
      perRun.push(summary);
      totalFlaky += summary.flaky;
      totalTests += summary.total;
    }
  }

  const localLog = readLocalSuiteLog(REPO_ROOT);
  if (localLog) {
    const localSummary = summarizeFlakeFromText(localLog, {
      id: 'local',
      conclusion: 'local',
      createdAt: new Date().toISOString(),
      title: 'suite-run.log',
    });
    if (localSummary.hasSummary) {
      perRun.push(localSummary);
      totalFlaky += localSummary.flaky;
      totalTests += localSummary.total;
    }
  }

  const rate =
    totalTests > 0 ? ((totalFlaky / totalTests) * 100).toFixed(2) : 'n/a';

  return {
    perRun,
    totalFlaky,
    totalTests,
    rate,
    sampleSize: perRun.length,
    window: `last ${CI_RUNS_N} E2E workflow runs (success/failure with Playwright summary)`,
  };
}

function collectHealMetrics() {
  const prs =
    ghJson([
      'pr',
      'list',
      '--state',
      'all',
      '--limit',
      '100',
      '--json',
      'number,title,state,headRefName,statusCheckRollup,createdAt',
    ]) ?? [];

  const healPrs = prs.filter(isHealPr);
  let clean = 0;
  let maskedRegression = 0;
  const details = [];

  for (const pr of healPrs) {
    const names = prDiffNames(pr.number);
    const touchesTests = names.some(
      (f) => f.startsWith('tests/') && SPEC_FILE_RE.test(f),
    );
    const touchesPages = names.some((f) => f.startsWith('pages/'));
    const e2e = prFirstE2eConclusion(pr);

    if (touchesTests) {
      maskedRegression += 1;
    }

    const healedCleanly =
      touchesPages && !touchesTests && e2e === 'SUCCESS';

    if (healedCleanly) {
      clean += 1;
    }

    details.push({
      pr: pr.number,
      title: pr.title,
      state: pr.state,
      e2e,
      touchesTests,
      healedCleanly,
    });
  }

  const total = healPrs.length;
  const successRate =
    total > 0
      ? `${((clean / total) * 100).toFixed(0)}% (${clean}/${total})`
      : 'n/a (no heal PRs)';

  return { total, clean, successRate, maskedRegression, details };
}

function generationGatePassOnPr(pr) {
  const e2e = prFirstE2eConclusion(pr);
  const green = e2e === 'SUCCESS';

  const files = prDiffNames(pr.number).filter(
    (f) => f.startsWith('tests/') && SPEC_FILE_RE.test(f),
  );

  if (files.length === 0) {
    return {
      pass: false,
      green,
      conforming: false,
      mapsAc: false,
      files,
      e2e,
    };
  }

  let conforming = true;
  let mapsAc = true;
  for (const rel of files) {
    if (!fs.existsSync(path.join(REPO_ROOT, rel))) {
      conforming = false;
      if (!mapsTicketSpecToFeature(REPO_ROOT, rel).maps) {
        mapsAc = false;
      }
      continue;
    }
    const conf = specConforms(REPO_ROOT, rel);
    if (!conf.ok) {
      conforming = false;
    }
    if (!mapsTicketSpecToFeature(REPO_ROOT, rel).maps) {
      mapsAc = false;
    }
  }

  return {
    pass: green && conforming && mapsAc,
    green,
    conforming,
    mapsAc,
    files,
    e2e,
  };
}

function collectGenerationGateMetrics() {
  const prs =
    ghJson([
      'pr',
      'list',
      '--state',
      'all',
      '--limit',
      '100',
      '--json',
      'number,title,state,headRefName,statusCheckRollup',
    ]) ?? [];

  const genPrs = prs.filter(isGenerationPr);
  let passed = 0;
  const rows = [];

  for (const pr of genPrs) {
    const gate = generationGatePassOnPr(pr);
    if (gate.pass) passed += 1;
    rows.push({ pr: pr.number, title: pr.title, ...gate });
  }

  const total = genPrs.length;
  const rate =
    total > 0
      ? `${((passed / total) * 100).toFixed(0)}% (${passed}/${total})`
      : 'n/a';

  const specs = listSpecFiles(REPO_ROOT);
  const conformingNow = specs.filter((s) => specConforms(REPO_ROOT, s).ok).length;
  const mappedNow = specs.filter(
    (s) => mapsTicketSpecToFeature(REPO_ROOT, s).maps,
  ).length;

  return {
    rate,
    passed,
    total,
    rows,
    conformingNow,
    mappedNow,
    specCount: specs.length,
  };
}

function pickRisk(flake, heal, generation) {
  if (heal.maskedRegression > 0) {
    return {
      risk: 'Self-heal PRs touched `tests/` (masked-regression); assertions may have been changed to force green.',
      action:
        'Close or rewrite heal PRs that edited specs; heal pages-only and re-run the failing test unchanged.',
    };
  }
  const rateNum = Number(flake.rate);
  if (!Number.isNaN(rateNum) && (rateNum > 2 || flake.totalFlaky >= 3)) {
    return {
      risk: 'Elevated flake rate in CI (tests passing only after Playwright retries).',
      action:
        'Identify flaky tests from the table above and harden setup or isolation before the next backlog generation run.',
    };
  }
  if (generation.passed === 0 && generation.total > 0) {
    return {
      risk: 'No agent-opened generation PR has passed all gates on the first E2E check.',
      action:
        'Gate ticket PRs on a green targeted `npx playwright test <spec>` before opening; track this report after each test-generation workflow.',
    };
  }
  return {
    risk: 'Recent mainline failures (locator drift on “+ New Program”) were only partially auto-healed; open heal PR #13 is not merged.',
    action:
      'Review and merge PR #13, then confirm the next three E2E runs report 0 failed and ≤1 flaky.',
  };
}

function renderReport({
  generatedAt,
  trigger,
  flake,
  heal,
  generation,
  askGuess,
  risk,
}) {
  const runLines = flake.perRun
    .map(
      (r) =>
        `| ${r.id} | ${r.conclusion} | ${r.flaky} | ${r.passed} | ${r.failed} |`,
    )
    .join('\n');

  const healLines = heal.details
    .map(
      (d) =>
        `| #${d.pr} | ${d.state} | ${d.e2e} | ${d.touchesTests ? 'yes' : 'no'} | ${d.healedCleanly ? 'yes' : 'no'} |`,
    )
    .join('\n');

  const genLines = generation.rows
    .map(
      (g) =>
        `| #${g.pr} | ${g.green ? 'green' : g.e2e ?? '—'} | ${g.conforming ? 'yes' : 'no'} | ${g.mapsAc ? 'yes' : 'no'} | ${g.pass ? '**pass**' : 'fail'} |`,
    )
    .join('\n');

  return `# Suite reliability — eval report

Generated: ${generatedAt}  
Trigger: \`${trigger}\`${GITHUB_RUN_ID ? ` · [workflow run ${GITHUB_RUN_ID}](https://github.com/liubaiarova-cmd/ai-assisted-qa-automation/actions/runs/${GITHUB_RUN_ID})` : ''}

Cursor does not ship built-in telemetry for these metrics; numbers below are computed from GitHub Actions, PR history, optional \`suite-run.log\`, and local agent transcripts (see **How measured** under each section).

---

## Flake rate

**${flake.totalFlaky} flaky / ${flake.totalTests} completed tests (${flake.rate}% retry-only passes)** across ${flake.sampleSize} runs (${flake.window}).

| Run | Conclusion | Flaky | Passed | Failed |
|-----|------------|-------|--------|--------|
${runLines || '| — | — | — | — | — |'}

**How measured:** Parsed Playwright list-reporter lines (\`N flaky\`, \`N passed\`) from \`gh run view <id> --log\` on E2E workflow runs; merges in \`suite-run.log\` when present after local or Test generation suite steps.

**What it tells us:** Retry-only passes are instability under \`retries: 2\`; aim for ≤1% flake rate on unattended agent runs.

---

## Heal success rate

**${heal.successRate}** cleanly healed (POM-only, E2E green). **Masked-regression count: ${heal.maskedRegression}** (must be 0).

| PR | State | First E2E | \`tests/\` diff? | Clean heal? |
|----|-------|-----------|----------------|-------------|
${healLines || '| — | — | — | — | — |'}

**How measured:** PRs with \`heal/\` branch or \`fix(pom)\` / \`Heal/\` title via \`gh pr list\`; clean = \`pages/\` only + first \`E2E Tests\` SUCCESS; masked-regression = heal PR diff touching \`tests/**\`.

**What it tells us:** Self-heal is reliable only when assertions stay frozen; ${heal.maskedRegression === 0 ? 'no assertion masking on heal PRs.' : 'stop healing until assertion diffs are reverted.'}

---

## Generation-gate pass rate

**${generation.rate}** of agent generation PRs (green + conforming + maps-to-AC on first PR CI). On \`main\` now: **${generation.conformingNow}/${generation.specCount}** specs pass hook rules; **${generation.mappedNow}/${generation.specCount}** map to \`features/DS-*.feature\`.

| PR | E2E | Conforming | Maps AC | Gate |
|----|-----|------------|---------|------|
${genLines || '| — | — | — | — | — |'}

**How measured:** DS/explore PRs; conforming = \`.cursor/hooks/generation-gate.sh\` rules; maps-to-AC = \`tests/dsN-*\` ↔ \`features/DS-N.feature\`; green = first \`E2E Tests\` conclusion on the PR.

**What it tells us:** First-PR green measures whether generated specs are merge-ready without human rework.

---

## Ask-vs-guess

**${askGuess.asks} asks** vs **${askGuess.guesses} logged guesses** (transcript AskQuestion: ${askGuess.transcriptAsks ?? askGuess.asks}; hook ledger: ${askGuess.hookAsks ?? 0} ask / ${askGuess.hookGuesses ?? 0} guess).

**How measured:** \`AskQuestion\` tool invocations in project agent-transcript JSONL; optional \`.eval/ask-guess.jsonl\` from \`.cursor/hooks/eval-ask-guess.sh\`.

**What it tells us:** High guess count without asks usually means silent assumptions in locators, copy, or AC scope.

---

## Top reliability risk

${risk.risk}

## Next action

${risk.action}

---

_Regenerate: \`npm run eval:report\` · auto after \`test-generation.yml\` and agent \`stop\` / \`sessionEnd\` hooks._
`;
}

function main() {
  ensureEvalDir();

  const hasGh = spawnSync('gh', ['auth', 'status'], { encoding: 'utf8' }).status === 0;

  const flake = hasGh
    ? collectFlakeMetrics()
    : {
        perRun: [],
        totalFlaky: 0,
        totalTests: 0,
        rate: 'n/a',
        sampleSize: 0,
        window: 'gh not available',
      };

  const heal = hasGh
    ? collectHealMetrics()
    : {
        total: 0,
        clean: 0,
        successRate: 'n/a',
        maskedRegression: 0,
        details: [],
      };

  const generation = hasGh
    ? collectGenerationGateMetrics()
    : {
        rate: 'n/a',
        passed: 0,
        total: 0,
        rows: [],
        conformingNow: 0,
        mappedNow: 0,
        specCount: 0,
      };

  const askGuess = scanTranscriptsAskGuess(TRANSCRIPTS_DIR, REPO_ROOT);
  const risk = pickRisk(flake, heal, generation);

  const md = renderReport({
    generatedAt: new Date().toISOString(),
    trigger: TRIGGER,
    flake,
    heal,
    generation,
    askGuess,
    risk,
  });

  fs.writeFileSync(REPORT_PATH, md, 'utf8');
  fs.writeFileSync(
    path.join(EVAL_DIR, 'last-report.json'),
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        trigger: TRIGGER,
        flake,
        heal,
        generation,
        askGuess,
      },
      null,
      2,
    ),
    'utf8',
  );

  console.log(`Wrote ${REPORT_PATH}`);
}

main();
