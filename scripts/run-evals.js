#!/usr/bin/env node
'use strict';

// Tier 1 (routing) and Tier 2 (behavioral) of the test plan.
//
//   node scripts/run-evals.js                  routing evals, free and deterministic
//   node scripts/run-evals.js --json           machine-readable routing report
//   node scripts/run-evals.js --behavioral     list behavioral cases
//   node scripts/run-evals.js --behavioral <id>  materialise one case and print its rubric
//
// Routing is scored with a lexical ranker (scripts/lib/rank.js), not a model, so it costs
// nothing and is stable across runs. Behavioral cases need an agent and are run on demand.

const fs = require('fs');
const path = require('path');
const os = require('os');
const { execFileSync } = require('child_process');
const { read } = require('./lib/frontmatter');
const { Index } = require('./lib/rank');

const ROOT = path.resolve(__dirname, '..');
const CASES = path.join(ROOT, 'evals', 'cases');

const RANK1_FLOOR = 0.8;      // CI fails below this share of positives ranked first
const COLLISION_LIMIT = 0.75; // two descriptions this similar are not distinguishable

function loadCorpus(kind) {
  const docs = [];
  if (kind === 'skill') {
    const dir = path.join(ROOT, 'skills');
    for (const name of fs.readdirSync(dir).filter((d) => fs.statSync(path.join(dir, d)).isDirectory())) {
      const { frontmatter } = read(fs.readFileSync(path.join(dir, name, 'SKILL.md'), 'utf8'));
      docs.push({ name, text: `${name} ${frontmatter.description} ${frontmatter.when_to_use || ''}` });
    }
  } else {
    const dir = path.join(ROOT, 'agents');
    for (const file of fs.readdirSync(dir).filter((f) => f.endsWith('.md'))) {
      const { frontmatter } = read(fs.readFileSync(path.join(dir, file), 'utf8'));
      docs.push({ name: file.replace(/\.md$/, ''), text: `${frontmatter.name} ${frontmatter.description}` });
    }
  }
  return new Index(docs);
}

function runRouting() {
  const suite = JSON.parse(fs.readFileSync(path.join(CASES, 'routing.json'), 'utf8'));
  const indexes = { skill: loadCorpus('skill'), agent: loadCorpus('agent') };
  const results = [];
  let positives = 0;
  let rank1 = 0;

  for (const group of suite.groups) {
    const index = indexes[group.kind];
    if (!index) throw new Error(`unknown corpus kind: ${group.kind}`);

    for (const entry of group.cases) {
      if (!index.docs.some((d) => d.name === entry.owner)) {
        results.push({ kind: group.kind, owner: entry.owner, prompt: '(definition)', status: 'error',
          detail: `owner "${entry.owner}" does not exist` });
        continue;
      }

      for (const prompt of entry.positive || []) {
        positives++;
        const ranked = index.rank(prompt);
        const position = ranked.findIndex((r) => r.name === entry.owner) + 1;
        const topK = entry.top_k || 3;
        if (position === 1) rank1++;
        results.push({
          kind: group.kind, owner: entry.owner, prompt, position,
          status: position >= 1 && position <= topK ? 'pass' : 'fail',
          detail: position === 0 ? 'not ranked' : `rank ${position}, top was ${ranked[0].name}`,
        });
      }

      for (const negative of entry.negative || []) {
        const ranked = index.rank(negative.prompt);
        const ownerRank = ranked.findIndex((r) => r.name === negative.owner) + 1;
        const selfRank = ranked.findIndex((r) => r.name === entry.owner) + 1;
        const ok = ownerRank > 0 && (selfRank === 0 || ownerRank < selfRank);
        results.push({
          kind: group.kind, owner: entry.owner, prompt: negative.prompt,
          status: ok ? 'pass' : 'fail',
          detail: `expected ${negative.owner} (rank ${ownerRank || '-'}) to outrank ${entry.owner} (rank ${selfRank || '-'})`,
        });
      }
    }
  }

  const collisions = [];
  for (const [kind, index] of Object.entries(indexes)) {
    for (const pair of index.collisions(COLLISION_LIMIT)) collisions.push({ kind, ...pair });
  }

  const failures = results.filter((r) => r.status !== 'pass');
  const rank1Rate = positives ? rank1 / positives : 1;
  return { results, failures, collisions, positives, rank1, rank1Rate };
}

function listBehavioral() {
  const dir = path.join(CASES, 'behavioral');
  return fs.existsSync(dir) ? fs.readdirSync(dir).filter((f) => f.endsWith('.json')).sort() : [];
}

function materialise(caseFile) {
  const spec = JSON.parse(fs.readFileSync(path.join(CASES, 'behavioral', caseFile), 'utf8'));
  const workspace = fs.mkdtempSync(path.join(os.tmpdir(), 'adt-eval-'));
  const fixture = path.join(ROOT, 'evals', 'fixtures', spec.fixture);

  if (!fs.existsSync(fixture)) throw new Error(`fixture not found: ${spec.fixture}`);
  fs.cpSync(fixture, workspace, { recursive: true });

  // Commit the fixture so the grader can read the agent's changes as a diff rather than
  // trusting its self-report.
  const git = (...args) => execFileSync('git', args, { cwd: workspace, stdio: 'pipe' });
  git('init', '-q');
  git('-c', 'user.email=evals@local', '-c', 'user.name=evals', 'add', '-A');
  git('-c', 'user.email=evals@local', '-c', 'user.name=evals', 'commit', '-qm', 'fixture baseline');

  return { spec, workspace };
}

// ------------------------------------------------------------------ main

const args = process.argv.slice(2);
const asJson = args.includes('--json');
const behavioralAt = args.indexOf('--behavioral');

if (behavioralAt !== -1) {
  const target = args[behavioralAt + 1];
  const available = listBehavioral();

  if (!target || target.startsWith('--')) {
    console.log('Behavioral cases:\n');
    for (const file of available) {
      const spec = JSON.parse(fs.readFileSync(path.join(CASES, 'behavioral', file), 'utf8'));
      console.log(`  ${file.replace(/\.json$/, '').padEnd(28)} ${spec.title}`);
    }
    console.log('\nRun one with: node scripts/run-evals.js --behavioral <id>');
    process.exit(0);
  }

  const file = target.endsWith('.json') ? target : `${target}.json`;
  if (!available.includes(file)) {
    console.error(`No such behavioral case: ${target}\nAvailable: ${available.map((f) => f.replace(/\.json$/, '')).join(', ')}`);
    process.exit(1);
  }

  const { spec, workspace } = materialise(file);
  console.log(`\n=== ${spec.title} ===\n`);
  console.log(`Workspace : ${workspace}`);
  console.log(`Under test: ${spec.under_test.join(', ')}\n`);
  console.log('--- prompt (give this to the agent, in that workspace) ---');
  console.log(spec.prompt);
  console.log('--- end prompt ---\n');
  console.log('Grade PASS only if every expectation holds:\n');
  spec.expectations.forEach((e, i) => console.log(`  ${i + 1}. ${e}`));
  if (spec.must_not && spec.must_not.length) {
    console.log('\nAutomatic FAIL if any of these happened:\n');
    spec.must_not.forEach((e, i) => console.log(`  ${i + 1}. ${e}`));
  }
  console.log(`\nInspect what the agent actually did:\n  git -C "${workspace}" diff HEAD --stat\n`);
  process.exit(0);
}

const report = runRouting();

if (asJson) {
  console.log(JSON.stringify(report, null, 2));
} else {
  for (const failure of report.failures) {
    console.error(`  FAIL [${failure.kind}] ${failure.owner}: "${failure.prompt}"`);
    console.error(`        ${failure.detail}`);
  }
  for (const collision of report.collisions) {
    console.error(`  COLLISION [${collision.kind}] ${collision.a} vs ${collision.b} (${collision.score.toFixed(2)})`);
  }
  const rate = (report.rank1Rate * 100).toFixed(0);
  console.log(`\nrank-1: ${report.rank1}/${report.positives} (${rate}%, floor ${RANK1_FLOOR * 100}%)`);
  console.log(report.failures.length || report.collisions.length
    ? `FAIL — ${report.failures.length} routing failure(s), ${report.collisions.length} collision(s)`
    : 'PASS — routing evals clean');
}

const belowFloor = report.rank1Rate < RANK1_FLOOR;
if (belowFloor) console.error(`rank-1 rate below floor of ${RANK1_FLOOR * 100}%`);
process.exit(report.failures.length || report.collisions.length || belowFloor ? 1 : 0);
