'use strict';

const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync, spawnSync } = require('child_process');
const { classifyPath, dependencyChange } = require('./intern-ceiling');

const SCRIPT = path.join(__dirname, 'intern-ceiling.js');
const STATE_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'adt-ceiling-state-'));
const INTERN = 'agent-dev-team:intern-engineer';

function repo(files) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'adt-ceiling-repo-'));
  for (const [name, body] of Object.entries(files)) {
    fs.mkdirSync(path.dirname(path.join(dir, name)), { recursive: true });
    fs.writeFileSync(path.join(dir, name), body);
  }
  const git = (...args) => execFileSync('git', args, { cwd: dir, stdio: 'pipe' });
  git('init', '-q');
  git('-c', 'user.email=t@local', '-c', 'user.name=t', 'add', '-A');
  git('-c', 'user.email=t@local', '-c', 'user.name=t', 'commit', '-qm', 'baseline');
  return dir;
}

let sessions = 0;
function session(cwd, agentType = INTERN, agentId) {
  const id = `test-${process.pid}-${++sessions}`;
  return (event, tool, toolInput, toolUseId = 'tu-1') => {
    const input = {
      session_id: id,
      hook_event_name: event,
      tool_name: tool,
      tool_input: toolInput,
      tool_use_id: toolUseId,
      cwd,
      ...(agentType ? { agent_type: agentType } : {}),
      ...(agentId ? { agent_id: agentId } : {}),
    };
    const run = spawnSync(process.execPath, [SCRIPT], {
      input: JSON.stringify(input),
      encoding: 'utf8',
      env: { ...process.env, ADT_CEILING_STATE_DIR: STATE_DIR },
    });
    assert.strictEqual(run.status, 0, run.stderr);
    return run.stdout ? JSON.parse(run.stdout).hookSpecificOutput : null;
  };
}

const edit = (dir, file) => ({ file_path: path.join(dir, file), old_string: 'a', new_string: 'b' });

test('classifies protected paths', () => {
  const cases = {
    'src/auth.js': 'security',
    'lib/OAuth2Client.ts': 'security',
    'app/sessionStore.js': 'security',
    'config/.env.production': 'security',
    'certs/server.pem': 'security',
    'db/migrations/003_merge_name.sql': 'migration',
    'db/schema.sql': 'schema',
    'api/openapi.yaml': 'schema',
    'proto/user.proto': 'schema',
    'package.json': 'dependency',
    'requirements-dev.txt': 'dependency',
    'firmware/platformio.ini': 'dependency',
    '.nvmrc': 'dependency',
    'src/middleware.js': null,
    'src/routes.js': null,
    'src/pricing.js': null,
    'src/authors.js': null,
    'styles/tokens.css': null,
  };
  for (const [file, rule] of Object.entries(cases)) assert.strictEqual(classifyPath(file), rule, file);
});

test('recognises commands that change dependencies', () => {
  const blocked = [
    'npm install lodash',
    'npm i -D jest',
    'cd app && yarn add react',
    'pnpm add zod',
    'pip install requests',
    'python3 -m pip install requests',
    'pip install -U -r requirements.txt',
    'uv add httpx',
    'poetry add rich',
    'go get example.com/x@v1.2.0',
    'go mod tidy',
    'cargo add serde',
    'bundle update',
    'dotnet add package Newtonsoft.Json',
    'pio pkg install -l foo',
    'sudo apt-get install -y curl',
    'FOO=1 npm install left-pad',
  ];
  const allowed = [
    'npm install',
    'npm ci',
    'npm test',
    'yarn',
    'pip install -r requirements.txt',
    'pip install -e .',
    'python -m pytest',
    'go test ./...',
    'cargo test',
    'node --test',
    'git diff HEAD',
    'npx prettier --check .',
  ];
  for (const command of blocked) assert.ok(dependencyChange(command), command);
  for (const command of allowed) assert.strictEqual(dependencyChange(command), null, command);
});

test('passes other agents and the untagged main thread straight through', () => {
  const dir = repo({ 'a.js': 'a', 'b.js': 'b', 'c.js': 'c', 'src/auth.js': 'a' });
  for (const agent of ['agent-dev-team:software-engineer', null]) {
    const hook = session(dir, agent);
    assert.strictEqual(hook('PreToolUse', 'Edit', edit(dir, 'src/auth.js')), null);
    assert.strictEqual(hook('PreToolUse', 'Bash', { command: 'npm install lodash' }), null);
  }
});

test('allows two files and refuses a third', () => {
  const dir = repo({ 'a.js': 'a', 'b.js': 'b', 'c.js': 'c' });
  const hook = session(dir);
  assert.strictEqual(hook('PreToolUse', 'Edit', edit(dir, 'a.js')), null);
  assert.strictEqual(hook('PreToolUse', 'Write', { file_path: path.join(dir, 'b.js'), content: 'x' }), null);
  assert.strictEqual(hook('PreToolUse', 'Edit', edit(dir, 'a.js')), null, 'a file already touched is free');
  const third = hook('PreToolUse', 'Edit', edit(dir, 'c.js'));
  assert.strictEqual(third.permissionDecision, 'deny');
  assert.match(third.permissionDecisionReason, /c\.js would be a third file; already touched: a\.js, b\.js/);
  assert.match(third.permissionDecisionReason, /Trigger: cost/);
});

test('matches the unscoped agent name used by copy installs', () => {
  const dir = repo({ 'src/auth.js': 'a' });
  const hook = session(dir, 'intern-engineer');
  assert.strictEqual(hook('PreToolUse', 'Edit', edit(dir, 'src/auth.js')).permissionDecision, 'deny');
});

test('refuses an auth path before any edit happens', () => {
  const dir = repo({ 'src/auth.js': 'a' });
  const denied = session(dir)('PreToolUse', 'Edit', edit(dir, 'src/auth.js'));
  assert.strictEqual(denied.permissionDecision, 'deny');
  assert.match(denied.permissionDecisionReason, /src\/auth\.js is on an authentication/);
  assert.match(denied.permissionDecisionReason, /Trigger: security-surface/);
});

test('refuses a dependency change made through Bash', () => {
  const dir = repo({ 'a.js': 'a' });
  const denied = session(dir)('PreToolUse', 'Bash', { command: 'npm install left-pad' });
  assert.strictEqual(denied.permissionDecision, 'deny');
  assert.match(denied.permissionDecisionReason, /`npm install left-pad` changes the project's dependencies/);
});

test('counts files a shell command changed, then blocks further edits', () => {
  const dir = repo({ 'a.js': 'a', 'b.js': 'b', 'c.js': 'c' });
  const hook = session(dir);
  assert.strictEqual(hook('PreToolUse', 'Bash', { command: "sed -i 's/x/y/' *.js" }, 'tu-sed'), null);
  for (const file of ['a.js', 'b.js', 'c.js']) fs.writeFileSync(path.join(dir, file), 'changed');
  const told = hook('PostToolUse', 'Bash', { command: "sed -i 's/x/y/' *.js" }, 'tu-sed');
  assert.match(told.additionalContext, /T0 ceiling crossed: that command brought the files changed to 3: a\.js, b\.js, c\.js/);
  assert.match(told.additionalContext, /do not undo it yourself/);
  const after = hook('PreToolUse', 'Edit', edit(dir, 'a.js'));
  assert.strictEqual(after.permissionDecision, 'deny');
  assert.match(after.permissionDecisionReason, /already crossed/);
});

test('catches a protected file changed by a command that then failed', () => {
  const dir = repo({ 'src/auth.js': 'a', 'README.md': 'r' });
  const hook = session(dir);
  hook('PreToolUse', 'Bash', { command: 'node rewrite.js && npm test' }, 'tu-fail');
  fs.writeFileSync(path.join(dir, 'src/auth.js'), 'changed');
  const told = hook('PostToolUseFailure', 'Bash', { command: 'node rewrite.js && npm test' }, 'tu-fail');
  assert.strictEqual(told.hookEventName, 'PostToolUseFailure');
  assert.match(told.additionalContext, /changed src\/auth\.js, which is on an authentication/);
});

test('ignores files that running the tests generated', () => {
  const dir = repo({ 'a.js': 'a' });
  const hook = session(dir);
  hook('PreToolUse', 'Bash', { command: 'python -m pytest' }, 'tu-py');
  fs.mkdirSync(path.join(dir, '__pycache__'));
  fs.writeFileSync(path.join(dir, '__pycache__', 'a.cpython-312.pyc'), 'x');
  fs.mkdirSync(path.join(dir, 'coverage'));
  fs.writeFileSync(path.join(dir, 'coverage', 'lcov.info'), 'x');
  assert.strictEqual(hook('PostToolUse', 'Bash', { command: 'python -m pytest' }, 'tu-py'), null);
});

test('keeps a separate budget for each subagent instance', () => {
  const dir = repo({ 'a.js': 'a', 'b.js': 'b', 'c.js': 'c' });
  const first = session(dir, INTERN, 'agent-1');
  first('PreToolUse', 'Edit', edit(dir, 'a.js'));
  first('PreToolUse', 'Edit', edit(dir, 'b.js'));
  assert.strictEqual(first('PreToolUse', 'Edit', edit(dir, 'c.js')).permissionDecision, 'deny');
  assert.strictEqual(session(dir, INTERN, 'agent-2')('PreToolUse', 'Edit', edit(dir, 'c.js')), null);
});

test('does not repeat itself after a command that changed nothing', () => {
  const dir = repo({ 'a.js': 'a', 'b.js': 'b', 'c.js': 'c' });
  const hook = session(dir);
  hook('PreToolUse', 'Bash', { command: 'node rewrite.js' }, 'tu-1');
  for (const file of ['a.js', 'b.js', 'c.js']) fs.writeFileSync(path.join(dir, file), 'changed');
  assert.match(hook('PostToolUse', 'Bash', { command: 'node rewrite.js' }, 'tu-1').additionalContext, /crossed/);
  hook('PreToolUse', 'Bash', { command: 'git diff' }, 'tu-2');
  assert.strictEqual(hook('PostToolUse', 'Bash', { command: 'git diff' }, 'tu-2'), null);
});

test('keeps separate budgets for sessions that share an id but not a transcript', () => {
  const dir = repo({ 'a.js': 'a', 'b.js': 'b', 'c.js': 'c' });
  const run = (transcript, file) => {
    const input = {
      session_id: 'shared-session', transcript_path: transcript, agent_type: INTERN,
      hook_event_name: 'PreToolUse', tool_name: 'Edit', tool_input: edit(dir, file), cwd: dir,
    };
    const out = spawnSync(process.execPath, [SCRIPT], {
      input: JSON.stringify(input), encoding: 'utf8', env: { ...process.env, ADT_CEILING_STATE_DIR: STATE_DIR },
    });
    return out.stdout ? JSON.parse(out.stdout).hookSpecificOutput.permissionDecision : null;
  };
  run('/tmp/one.jsonl', 'a.js');
  run('/tmp/one.jsonl', 'b.js');
  assert.strictEqual(run('/tmp/one.jsonl', 'c.js'), 'deny');
  assert.strictEqual(run('/tmp/two.jsonl', 'c.js'), null);
});

test('works outside a git repository, without shell tracking', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'adt-ceiling-plain-'));
  const hook = session(dir);
  assert.strictEqual(hook('PreToolUse', 'Bash', { command: 'node --test' }), null);
  assert.strictEqual(hook('PostToolUse', 'Bash', { command: 'node --test' }), null);
  assert.strictEqual(hook('PreToolUse', 'Edit', edit(dir, 'session.js')).permissionDecision, 'deny');
});

test('tells sessions and this plugin\'s subagents where the references live', () => {
  const hook = (input) => {
    const run = spawnSync(process.execPath, [path.join(__dirname, 'plugin-root.js')], {
      input: JSON.stringify(input),
      encoding: 'utf8',
      env: { ...process.env, CLAUDE_PLUGIN_ROOT: path.resolve(__dirname, '..') },
    });
    assert.strictEqual(run.status, 0, run.stderr);
    return run.stdout ? JSON.parse(run.stdout).hookSpecificOutput : null;
  };
  const ladder = path.join(path.resolve(__dirname, '..'), 'references', 'escalation-ladder.md');
  const start = hook({ hook_event_name: 'SessionStart', source: 'startup' });
  assert.strictEqual(start.hookEventName, 'SessionStart');
  assert.ok(start.additionalContext.includes(ladder), start.additionalContext);
  assert.ok(fs.existsSync(ladder));
  assert.ok(hook({ hook_event_name: 'SubagentStart', agent_type: 'agent-dev-team:intern-engineer' }));
  assert.strictEqual(hook({ hook_event_name: 'SubagentStart', agent_type: 'Explore' }), null);
});
