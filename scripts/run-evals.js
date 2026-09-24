#!/usr/bin/env node
'use strict';

// Tier 1 (routing) and Tier 2 (behavioral) of the test plan.
//
//   node scripts/run-evals.js                  routing evals, free and deterministic
//   node scripts/run-evals.js --json           machine-readable routing report
//   node scripts/run-evals.js --behavioral     list behavioral cases
//   node scripts/run-evals.js --behavioral <id>  materialise one case and print its rubric
//   node scripts/run-evals.js --behavioral --run [<id>...] [--models haiku,sonnet,opus]
//        [--trials N] [--judge sonnet] [--jobs 2] [--budget 3] [--max-turns 60] [--no-hooks]
//                                              run cases against Claude Code and grade them
//
// Routing is scored with a lexical ranker (scripts/lib/rank.js), not a model, so it costs
// nothing and is stable across runs. Behavioral cases need an agent and are run on demand.

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const { read } = require('./lib/frontmatter');
const { Index } = require('./lib/rank');
const behavioral = require('./lib/behavioral');

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

// ------------------------------------------------------------------ behavioral

const VALUE_FLAGS = new Set(['--models', '--trials', '--judge', '--jobs', '--budget', '--max-turns', '--out']);

function option(args, name, fallback) {
  const at = args.indexOf(name);
  return at === -1 || args[at + 1] === undefined ? fallback : args[at + 1];
}

function printRubric(id) {
  const spec = behavioral.loadCase(id);
  const workspace = behavioral.materialise(spec);
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
  console.log(`\nInspect what the agent actually did:\n  git -C "${workspace}" diff HEAD --stat`);
  console.log(`\nOr let the harness run and grade it:\n  node scripts/run-evals.js --behavioral ${id} --run\n`);
}

function describe(record) {
  const money = (n) => `$${(n || 0).toFixed(2)}`;
  const head = `${record.status.toUpperCase().padEnd(5)} ${record.case.padEnd(24)} ${`${record.model} #${record.trial}`.padEnd(10)}`;
  const cost = `${money(record.agent_run.cost_usd)} + judge ${money(record.judge.cost_usd)}, ${record.agent_run.turns ?? '?'} turns`;
  const why = record.status === 'fail' ? `  failed: ${record.failed.join(', ')}` : record.reason ? `  ${record.reason}` : '';
  return `${head} ${cost}${why}`;
}

function failureNotes(results) {
  const notes = [];
  for (const r of results.filter((x) => x.status !== 'pass')) {
    notes.push(`### \`${r.case}\` on ${r.model}, trial ${r.trial}: ${r.status}\n`);
    if (r.reason) notes.push(`- ${r.reason}`);
    for (const c of r.checks.filter((x) => !x.pass)) notes.push(`- **check** ${c.name}: ${c.detail.split('\n')[0]}`);
    for (const e of (r.expectations || []).filter((x) => !x.met)) notes.push(`- **${e.id}** ${e.text}\n  - ${e.evidence}`);
    for (const m of (r.must_not || []).filter((x) => x.happened)) notes.push(`- **${m.id}** ${m.text}\n  - ${m.evidence}`);
    notes.push('');
  }
  return notes.join('\n');
}

async function runBehavioral(args, ids) {
  const version = spawnSync('claude', ['--version'], { encoding: 'utf8' });
  if (version.status !== 0) {
    console.error("The 'claude' CLI is not on PATH. Install Claude Code to run behavioral cases unattended.");
    process.exit(1);
  }
  const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const models = option(args, '--models', 'shipped').split(',').map((m) => m.trim()).filter(Boolean);
  const trials = Number(option(args, '--trials', 1));
  const options = {
    judge: option(args, '--judge', 'sonnet'),
    budget: Number(option(args, '--budget', 3)),
    maxTurns: Number(option(args, '--max-turns', 60)),
    timeoutMs: 20 * 60 * 1000,
    noHooks: args.includes('--no-hooks'),
    out: path.resolve(option(args, '--out', path.join(ROOT, 'evals', 'results', stamp))),
  };

  const tasks = [];
  for (const id of ids) {
    for (const model of models) {
      for (let trial = 1; trial <= trials; trial++) tasks.push(() => behavioral.runOne({ id, model, trial, options }));
    }
  }
  const rel = path.relative(process.cwd(), options.out) || '.';
  console.log(`${tasks.length} run(s): ${ids.length} case(s) × ${models.join(', ')} × ${trials} trial(s). Judge: ${options.judge}. Hooks: ${options.noHooks ? 'off' : 'on'}.`);
  console.log(`Transcripts, diffs, and verdicts go to ${rel}\n`);

  const results = await behavioral.pool(tasks, Number(option(args, '--jobs', 2)), (r) => console.log(describe(r)));
  const { table, cost, passed, total } = behavioral.summarise(results);
  const header = [
    '# Behavioral eval run',
    '',
    `- **Date:** ${new Date().toISOString().slice(0, 10)}`,
    `- **Claude Code:** ${version.stdout.trim()}`,
    `- **Judge:** ${options.judge} · **Trials per cell:** ${trials} · **Hooks:** ${options.noHooks ? 'off' : 'on'}`,
    `- **Cost:** $${cost.toFixed(2)} (agent runs and judging)`,
    '',
    table,
    '',
  ].join('\n');
  fs.writeFileSync(path.join(options.out, 'summary.md'), `${header}\n## Not passing\n\n${failureNotes(results) || 'Nothing.\n'}`);
  fs.writeFileSync(path.join(options.out, 'summary.json'), `${JSON.stringify({ options, results }, null, 2)}\n`);

  console.log(`\n${table}\n`);
  console.log(`${passed}/${total} passed. Cost $${cost.toFixed(2)}. Details: ${path.join(rel, 'summary.md')}`);
  process.exit(passed === total ? 0 : 1);
}

// ------------------------------------------------------------------ main

const args = process.argv.slice(2);
const asJson = args.includes('--json');

if (args.includes('--behavioral')) {
  const available = behavioral.listCases();
  const ids = args.filter((a, i) => !a.startsWith('--') && !VALUE_FLAGS.has(args[i - 1])).map((a) => a.replace(/\.json$/, ''));
  const unknown = ids.filter((id) => !available.includes(id));
  if (unknown.length) {
    console.error(`No such behavioral case: ${unknown.join(', ')}\nAvailable: ${available.join(', ')}`);
    process.exit(1);
  }

  if (args.includes('--run')) {
    runBehavioral(args, ids.length ? ids : available).catch((error) => {
      console.error(error.stack || error.message);
      process.exit(1);
    });
  } else if (ids.length) {
    printRubric(ids[0]);
  } else {
    console.log('Behavioral cases:\n');
    for (const id of available) console.log(`  ${id.padEnd(28)} ${behavioral.loadCase(id).title}`);
    console.log('\nPrint one to run by hand:  node scripts/run-evals.js --behavioral <id>');
    console.log('Run and grade unattended:  node scripts/run-evals.js --behavioral [<id>...] --run');
  }
} else {
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
}
