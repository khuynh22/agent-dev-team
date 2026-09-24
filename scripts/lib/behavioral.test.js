'use strict';

// The grading pipeline, run offline: a fake `claude` on PATH plays both the agent under test
// and the judge, so these tests cost nothing and can run in CI.

const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const os = require('os');
const path = require('path');

const FAKE = `#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const args = process.argv.slice(2);
const emit = (o) => process.stdout.write(JSON.stringify(o) + '\\n');
if (args.includes('--version')) { console.log('0.0.0 (fake)'); process.exit(0); }
if (args.includes('--json-schema')) {
  let prompt = '';
  process.stdin.on('data', (c) => (prompt += c));
  process.stdin.on('end', () => {
    const ids = (prefix) => [...new Set(prompt.match(new RegExp('^' + prefix + '\\\\d+(?=\\\\. )', 'gm')))];
    const verdict = process.env.FAKE_JUDGE === 'incomplete'
      ? { expectations: [], must_not: [], summary: 'lost the thread' }
      : {
          expectations: ids('E').map((id) => ({ id, met: true, evidence: 'shown' })),
          must_not: ids('M').map((id) => ({ id, happened: false, evidence: 'not shown' })),
          summary: 'fake verdict',
        };
    emit({ type: 'result', subtype: 'success', total_cost_usd: 0.01, structured_output: verdict });
  });
} else {
  if (process.env.FAKE_EDIT) fs.writeFileSync(path.join(process.cwd(), process.env.FAKE_EDIT), 'changed\\n');
  emit({ type: 'system', subtype: 'init', model: 'fake' });
  emit({ type: 'assistant', message: { content: [{ type: 'text', text: process.env.FAKE_SAYS || '' }] } });
  emit({ type: 'result', subtype: 'success', num_turns: 1, total_cost_usd: 0.02, modelUsage: { fake: {} } });
}
`;

const bin = fs.mkdtempSync(path.join(os.tmpdir(), 'adt-fake-claude-'));
fs.writeFileSync(path.join(bin, 'claude'), FAKE, { mode: 0o755 });
process.env.PATH = `${bin}${path.delimiter}${process.env.PATH}`;

const behavioral = require('./behavioral');

const HANDOFF = [
  '## HANDOFF',
  '- **From:** intern-engineer (T0)',
  '- **To:** software-engineer (T1)',
  '- **Trigger:** security-surface',
].join('\n');

async function run(env) {
  Object.assign(process.env, { FAKE_EDIT: '', FAKE_SAYS: '', FAKE_JUDGE: '' }, env);
  const out = fs.mkdtempSync(path.join(os.tmpdir(), 'adt-results-'));
  return behavioral.runOne({
    id: 'intern-ceiling',
    model: 'shipped',
    trial: 1,
    options: { out, judge: 'sonnet', budget: 1, maxTurns: 5, timeoutMs: 60000, noHooks: false },
  });
}

test('passes when every check passes and the judge finds nothing wrong', { skip: process.platform === 'win32' }, async () => {
  const record = await run({ FAKE_SAYS: HANDOFF });
  assert.strictEqual(record.status, 'pass', JSON.stringify(record.failed));
  assert.strictEqual(record.model, 'haiku', 'shipped resolves to the agent frontmatter model');
  assert.ok(record.checks.every((c) => c.pass));
});

test('a failed check fails the run whatever the judge says', { skip: process.platform === 'win32' }, async () => {
  const record = await run({ FAKE_SAYS: HANDOFF, FAKE_EDIT: 'src/auth.js' });
  assert.strictEqual(record.status, 'fail');
  assert.deepStrictEqual(record.failed, ['nothing under src/ changed']);
  assert.deepStrictEqual(record.changed, ['src/auth.js']);
});

test('output checks read what the agent said', { skip: process.platform === 'win32' }, async () => {
  const record = await run({ FAKE_SAYS: 'I would rather not.' });
  assert.strictEqual(record.status, 'fail');
  assert.ok(record.failed.some((f) => f.includes('HANDOFF')));
});

test('an incomplete verdict is an error, not a pass', { skip: process.platform === 'win32' }, async () => {
  const record = await run({ FAKE_SAYS: HANDOFF, FAKE_JUDGE: 'incomplete' });
  assert.strictEqual(record.status, 'error');
  assert.match(record.reason, /judge/);
});

test('summarises a matrix by case and model', () => {
  const runs = [
    { case: 'a', model: 'haiku', status: 'pass', agent_run: { cost_usd: 0.1 }, judge: { cost_usd: 0.05 } },
    { case: 'a', model: 'haiku', status: 'fail', agent_run: { cost_usd: 0.1 }, judge: { cost_usd: 0.05 } },
    { case: 'a', model: 'opus', status: 'error', agent_run: { cost_usd: 0.3 }, judge: { cost_usd: 0 } },
  ];
  const { table, cost, passed, total } = behavioral.summarise(runs);
  assert.match(table, /\| `a` \| 1\/2 \| 0\/1 \(1 error\) \|/);
  assert.strictEqual(passed, 1);
  assert.strictEqual(total, 3);
  assert.ok(Math.abs(cost - 0.6) < 1e-9);
});
