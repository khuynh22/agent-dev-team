#!/usr/bin/env node
'use strict';

// The mechanical half of the T0 ceiling. hooks/hooks.json runs this around every Edit,
// Write, NotebookEdit, and Bash call in Claude Code. It acts only when the caller is
// intern-engineer; every other agent passes straight through.
//
// It holds the parts of agents/intern-engineer.md a program can see: at most two files, no
// dependency or version change, nothing on an auth, secrets, crypto, migration, or schema
// path. Inventing requirements and touching concurrency still rest on the agent itself.
//
// File tools are stopped before they run. A shell command cannot be read reliably, so the
// working tree is snapshotted before it and compared after it: a file changed through Bash
// still counts, and the intern is told to stop and hand off, since the change has happened.

const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');
const { execFileSync } = require('child_process');

const T0_AGENTS = new Set(['intern-engineer']);
const FILE_LIMIT = 2;
const FILE_TOOLS = new Set(['Edit', 'Write', 'NotebookEdit']);
const STATE_DIR = process.env.ADT_CEILING_STATE_DIR || path.join(os.tmpdir(), 'adt-intern-ceiling');

// Each clause is quoted from the Refuses list in agents/intern-engineer.md, so a refusal
// names the rule it enforces. scripts/validate.js fails if the two drift apart.
const RULES = {
  files: { clause: 'Touch more than two files.', trigger: 'cost' },
  security: { clause: 'Touch authentication, authorization, secrets, or cryptography.', trigger: 'security-surface' },
  migration: { clause: 'Write a migration.', trigger: 'irreversibility' },
  schema: { clause: 'Change a database schema, a public API, a wire format, or a serialized shape.', trigger: 'contract-change' },
  dependency: { clause: 'Add a dependency or change a version.', trigger: 'blast-radius' },
};

const DESCRIBE = {
  security: 'on an authentication, authorization, secrets, or crypto path',
  migration: 'a migration',
  schema: 'a schema or wire-format file',
  dependency: 'a dependency manifest, lockfile, or version pin',
};

// ------------------------------------------------------------------ paths

const SECURITY_WORDS = new Set([
  'auth', 'authn', 'authz', 'authentication', 'authorization', 'authorize', 'authorizer',
  'oauth', 'oidc', 'saml', 'sso', 'login', 'logout', 'signin', 'session', 'sessions',
  'jwt', 'jwks', 'password', 'passwords', 'passwd', 'credential', 'credentials', 'secret',
  'secrets', 'crypto', 'cryptography', 'cipher', 'encrypt', 'encryption', 'decrypt', 'hmac',
  'keystore', 'keychain', 'permission', 'permissions', 'acl', 'rbac', 'iam', 'mfa', 'totp',
  'csrf', 'cors',
]);
const SECRET_FILE = /^(\.env(\..*)?|.*\.(pem|key|p12|pfx|jks|keystore)|id_(rsa|dsa|ecdsa|ed25519)(\.pub)?|\.(npmrc|pypirc|netrc|htpasswd))$/i;
const MIGRATION_DIRS = new Set(['migrations', 'migration', 'migrate', 'alembic', 'flyway', 'liquibase']);
const SCHEMA_DIRS = new Set(['schema', 'schemas']);
const SCHEMA_FILE = /(\.(sql|prisma|proto|avsc|avdl|thrift|graphqls?|gql|xsd|fbs|capnp)|^schema\.rb|^(openapi|swagger)\.(ya?ml|json))$/i;
const DEPENDENCY_FILES = new Set([
  'package.json', 'package-lock.json', 'npm-shrinkwrap.json', 'yarn.lock', 'pnpm-lock.yaml',
  'pnpm-workspace.yaml', 'bun.lock', 'bun.lockb', 'deno.json', 'deno.jsonc', 'deno.lock',
  'pipfile', 'pipfile.lock', 'pyproject.toml', 'poetry.lock', 'uv.lock', 'pdm.lock', 'setup.py',
  'setup.cfg', 'environment.yml', 'environment.yaml', 'go.mod', 'go.sum', 'go.work',
  'go.work.sum', 'cargo.toml', 'cargo.lock', 'gemfile', 'gemfile.lock', 'composer.json',
  'composer.lock', 'pom.xml', 'build.gradle', 'build.gradle.kts', 'settings.gradle',
  'settings.gradle.kts', 'gradle.lockfile', 'libs.versions.toml', 'packages.config',
  'directory.packages.props', 'directory.build.props', 'packages.lock.json', 'global.json',
  'package.swift', 'package.resolved', 'podfile', 'podfile.lock', 'cartfile', 'cartfile.resolved',
  'pubspec.yaml', 'pubspec.lock', 'mix.exs', 'mix.lock', 'rebar.config', 'stack.yaml',
  'cabal.project', 'platformio.ini', 'library.json', 'library.properties', 'idf_component.yml',
  'west.yml', 'conanfile.txt', 'conanfile.py', 'vcpkg.json', 'flake.nix', 'flake.lock',
  '.nvmrc', '.node-version', '.python-version', '.ruby-version', '.tool-versions',
  'rust-toolchain', 'rust-toolchain.toml', '.terraform.lock.hcl',
]);
const DEPENDENCY_FILE = /^(requirements|constraints)[\w.-]*\.(txt|in)$|\.(gemspec|csproj|fsproj|vbproj)$/i;

// authMiddleware, OAuth2Client, and user_session all have to yield their auth word.
function words(segment) {
  return segment
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .map((w) => w.replace(/\d+$/, ''))
    .filter(Boolean);
}

// Takes a path relative to the project root. Returns the rule it falls under, or null.
function classifyPath(relPath) {
  const segments = String(relPath).split(/[\\/]+/).filter((s) => s && s !== '.');
  const base = segments[segments.length - 1] || '';
  const dirs = segments.slice(0, -1).map((s) => s.toLowerCase());

  if (dirs.some((d) => MIGRATION_DIRS.has(d))) return 'migration';
  if (SECRET_FILE.test(base) || segments.some((s) => words(s).some((w) => SECURITY_WORDS.has(w)))) {
    return 'security';
  }
  if (SCHEMA_FILE.test(base) || dirs.some((d) => SCHEMA_DIRS.has(d))) return 'schema';
  if (DEPENDENCY_FILES.has(base.toLowerCase()) || DEPENDENCY_FILE.test(base)) return 'dependency';
  return null;
}

// ------------------------------------------------------------------ commands

const WRAPPERS = new Set(['sudo', 'env', 'time', 'command', 'exec', 'nohup', 'nice']);

function simpleCommands(command) {
  return String(command)
    .split(/&&|\|\||[;&|\n]|\$\(|`/)
    .map((part) => part.replace(/[()]/g, ' ').trim())
    .filter(Boolean);
}

function tokens(simple) {
  const out = simple.split(/\s+/).map((t) => t.replace(/^['"]+|['"]+$/g, '')).filter(Boolean);
  while (out.length && (/^[A-Za-z_][A-Za-z0-9_]*=/.test(out[0]) || WRAPPERS.has(out[0]))) {
    out.shift();
    while (out.length && out[0].startsWith('-')) out.shift();
  }
  return out;
}

function pipChange(sub, rest) {
  if (sub === 'uninstall') return true;
  if (sub !== 'install') return false;
  for (let i = 0; i < rest.length; i++) {
    const arg = rest[i];
    if (arg === '-U' || arg === '--upgrade') return true;
    if (['-r', '--requirement', '-c', '--constraint', '-e', '--editable'].includes(arg)) i++;
    else if (!arg.startsWith('-') && arg !== '.') return true;
  }
  return false;
}

// True when the command would add, remove, or re-version a dependency. Installing what the
// project already declares (npm ci, pip install -r) is fine; naming a new package is not.
function changesDependencies(t) {
  const bin = path.basename(t[0] || '').replace(/\.(exe|cmd)$/i, '').toLowerCase();
  const args = t.slice(1);
  const at = args.findIndex((a) => !a.startsWith('-'));
  const sub = at === -1 ? '' : args[at].toLowerCase();
  const rest = at === -1 ? [] : args.slice(at + 1);
  const named = rest.filter((a) => !a.startsWith('-'));
  const first = (named[0] || '').toLowerCase();
  const oneOf = (...subs) => subs.includes(sub);

  switch (bin) {
    case 'npm':
    case 'cnpm':
      if (oneOf('install', 'i', 'add', 'in', 'isntall')) return named.length > 0;
      return oneOf('uninstall', 'remove', 'rm', 'r', 'un', 'update', 'up', 'upgrade', 'udpate');
    case 'yarn':
      return oneOf('add', 'remove', 'upgrade', 'up', 'upgrade-interactive', 'global');
    case 'pnpm':
    case 'bun':
      if (oneOf('install', 'i')) return named.length > 0;
      return oneOf('add', 'a', 'remove', 'rm', 'uninstall', 'un', 'update', 'up', 'upgrade');
    case 'pip':
    case 'pip3':
    case 'pipx':
      return pipChange(sub, rest);
    case 'python':
    case 'python3':
    case 'py': {
      const m = args.indexOf('-m');
      return m !== -1 && /^pip3?$/.test(args[m + 1] || '') && changesDependencies(['pip', ...args.slice(m + 2)]);
    }
    case 'uv':
      return sub === 'pip' ? changesDependencies(['pip', ...rest]) : oneOf('add', 'remove');
    case 'poetry':
      return oneOf('add', 'remove', 'update');
    case 'pipenv':
      return sub === 'install' ? named.length > 0 : oneOf('uninstall', 'update', 'upgrade');
    case 'conda':
    case 'mamba':
    case 'micromamba':
      return oneOf('install', 'update', 'upgrade', 'remove', 'uninstall');
    case 'cargo':
      return oneOf('add', 'remove', 'rm', 'update', 'install');
    case 'go':
      if (sub === 'get') return true;
      if (sub === 'install') return named.some((a) => a.includes('@'));
      return sub === 'mod' && ['tidy', 'edit'].includes(first);
    case 'gem':
      return oneOf('install', 'update', 'uninstall');
    case 'bundle':
    case 'bundler':
      return oneOf('add', 'remove', 'update');
    case 'composer':
      return oneOf('require', 'remove', 'update', 'upgrade');
    case 'dotnet':
      return oneOf('add', 'remove');
    case 'nuget':
      return oneOf('install', 'update');
    case 'swift':
      return sub === 'package' && ['update', 'add-dependency'].includes(first);
    case 'pod':
      return sub === 'update';
    case 'pio':
    case 'platformio':
      return oneOf('pkg', 'lib') && ['install', 'update', 'uninstall'].includes(first);
    case 'brew':
    case 'apt':
    case 'apt-get':
    case 'apk':
    case 'yum':
    case 'dnf':
    case 'zypper':
    case 'port':
    case 'choco':
    case 'winget':
    case 'scoop':
      return oneOf('install', 'add', 'upgrade', 'remove', 'uninstall', 'del', 'reinstall');
    default:
      return false;
  }
}

// Returns the first simple command that changes dependencies, or null.
function dependencyChange(command) {
  for (const simple of simpleCommands(command)) {
    const t = tokens(simple);
    if (t.length && changesDependencies(t)) return simple;
  }
  return null;
}

// ------------------------------------------------------------------ working tree

// Generated by running tests, not written by the agent.
const NOISE = /(^|\/)(node_modules|__pycache__|\.pytest_cache|\.mypy_cache|\.ruff_cache|\.tox|\.nyc_output|coverage|\.next|\.turbo|\.cache|\.gradle|\.venv|venv)(\/|$)|\.(pyc|pyo|log)$|(^|\/)\.DS_Store$/;

function git(cwd, args) {
  return execFileSync('git', args, {
    cwd,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'ignore'],
    maxBuffer: 64 * 1024 * 1024,
  });
}

function projectRoot(cwd) {
  try {
    return { root: git(cwd, ['rev-parse', '--show-toplevel']).trim(), git: true };
  } catch {
    return { root: cwd, git: false };
  }
}

function fingerprint(file) {
  try {
    const stat = fs.statSync(file);
    if (!stat.isFile()) return 'other';
    if (stat.size > 8 * 1024 * 1024) return `size:${stat.size}:${stat.mtimeMs}`;
    return crypto.createHash('sha1').update(fs.readFileSync(file)).digest('hex');
  } catch {
    return 'missing';
  }
}

// Every dirty or untracked file, with a content hash, so a later snapshot shows what changed
// in between, including further edits to a file that was already dirty.
function snapshot(root) {
  const parts = git(root, ['status', '--porcelain=v1', '-z', '--untracked-files=all']).split('\0');
  const tree = {};
  for (let i = 0; i < parts.length; i++) {
    const entry = parts[i];
    if (entry.length < 4) continue;
    const code = entry.slice(0, 2);
    const file = entry.slice(3);
    if (code[0] === 'R' || code[0] === 'C') {
      const from = parts[++i];
      if (from && !NOISE.test(from)) tree[from] = `from:${code}`;
    }
    if (!NOISE.test(file)) tree[file] = `${code}:${fingerprint(path.join(root, file))}`;
  }
  return tree;
}

function changedPaths(before, after) {
  const keys = new Set([...Object.keys(before), ...Object.keys(after)]);
  return [...keys].filter((key) => before[key] !== after[key]).sort();
}

// ------------------------------------------------------------------ state

// One budget per agent instance. A resumed session keeps its budget; the transcript path is
// in the key because a nested `claude -p` can inherit its parent's session id.
function statePath(input) {
  const key = crypto
    .createHash('sha1')
    .update([input.session_id, input.transcript_path, input.agent_id || 'main'].join('\0'))
    .digest('hex')
    .slice(0, 20);
  return path.join(STATE_DIR, `${key}.json`);
}

// Parallel tool calls run their hooks in parallel, and three edits checked at once must
// not all see an empty budget.
function withLock(file, fn) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const lock = `${file}.lock`;
  const deadline = Date.now() + 5000;
  for (;;) {
    try {
      fs.mkdirSync(lock);
      break;
    } catch (error) {
      if (error.code !== 'EEXIST') throw error;
      try {
        if (Date.now() - fs.statSync(lock).mtimeMs > 10000) fs.rmdirSync(lock);
      } catch {
        // Another process released or reclaimed it first.
      }
      if (Date.now() > deadline) throw new Error(`timed out waiting for ${lock}`);
      Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 20);
    }
  }
  try {
    return fn();
  } finally {
    fs.rmdirSync(lock);
  }
}

function load(file) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    return { touched: [], pending: {}, crossed: null };
  }
}

// ------------------------------------------------------------------ decisions

function relative(root, abs) {
  const rel = path.relative(root, abs);
  return rel.startsWith('..') || path.isAbsolute(rel) ? null : rel.split(path.sep).join('/');
}

function refusal(rule, finding) {
  const { clause, trigger } = RULES[rule];
  const lines = [
    `T0 ceiling: ${finding}.`,
    `intern-engineer refuses to: ${clause}`,
    `Stop here, change nothing else, and emit a HANDOFF to software-engineer with Trigger: ${trigger}.`,
  ];
  if (rule === 'dependency') {
    lines.push('If this change touches no dependency or version, the check cannot tell, so the work still belongs with a T1.');
  }
  lines.push('This check is mechanical (hooks/intern-ceiling.js); confidence does not lift it.');
  return lines.join(' ');
}

const deny = (reason) => ({
  hookSpecificOutput: { hookEventName: 'PreToolUse', permissionDecision: 'deny', permissionDecisionReason: reason },
});
const tell = (event, text) => ({ hookSpecificOutput: { hookEventName: event, additionalContext: text } });

function step(state, input, project) {
  const event = input.hook_event_name;
  const tool = input.tool_name;
  const args = input.tool_input || {};
  const cwd = input.cwd || project.root;
  const show = (abs) => relative(project.root, abs) || abs;
  const classify = (abs) => classifyPath(relative(project.root, abs) || path.basename(abs));

  if (event === 'PreToolUse' && FILE_TOOLS.has(tool)) {
    const given = args.file_path || args.notebook_path;
    if (!given) return null;
    const target = path.resolve(cwd, given);
    if (state.crossed) {
      return deny(`T0 ceiling already crossed: ${state.crossed} Make no further changes, and emit the HANDOFF to software-engineer.`);
    }
    const rule = classify(target);
    if (rule) return deny(refusal(rule, `${show(target)} is ${DESCRIBE[rule]}`));
    if (!state.touched.includes(target)) {
      if (state.touched.length >= FILE_LIMIT) {
        return deny(refusal('files', `${show(target)} would be a third file; already touched: ${state.touched.map(show).join(', ')}`));
      }
      state.touched.push(target);
    }
    return null;
  }

  if (event === 'PreToolUse' && tool === 'Bash') {
    const offending = dependencyChange(args.command || '');
    if (offending) return deny(refusal('dependency', `\`${offending}\` changes the project's dependencies`));
    if (project.git) state.pending[input.tool_use_id || 'bash'] = snapshot(project.root);
    return null;
  }

  if ((event === 'PostToolUse' || event === 'PostToolUseFailure') && tool === 'Bash') {
    const key = input.tool_use_id || 'bash';
    const before = state.pending[key];
    delete state.pending[key];
    if (!before || !project.git) return null;

    const changed = changedPaths(before, snapshot(project.root)).map((rel) => path.join(project.root, rel));
    if (!changed.length) return null;
    for (const abs of changed) if (!state.touched.includes(abs)) state.touched.push(abs);
    const flagged = changed.find((abs) => classify(abs));
    if (!flagged && state.touched.length <= FILE_LIMIT) return null;

    const rule = flagged ? classify(flagged) : 'files';
    const finding = flagged
      ? `that command changed ${show(flagged)}, which is ${DESCRIBE[rule]}`
      : `that command brought the files changed to ${state.touched.length}: ${state.touched.map(show).join(', ')}`;
    state.crossed = `${finding}.`;
    return tell(event, [
      `T0 ceiling crossed: ${finding}. intern-engineer refuses to: ${RULES[rule].clause}`,
      'The change has already happened, so do not undo it yourself, and make no further changes.',
      `Emit a HANDOFF to software-engineer with Trigger: ${RULES[rule].trigger}, and list every changed file under Files touched and Done so far.`,
    ].join(' '));
  }

  return null;
}

function isT0(agentType) {
  return Boolean(agentType) && T0_AGENTS.has(String(agentType).split(':').pop());
}

function decide(input) {
  if (!isT0(input.agent_type)) return null;
  const project = projectRoot(input.cwd || process.cwd());
  const file = statePath(input);
  return withLock(file, () => {
    const state = load(file);
    const result = step(state, input, project);
    fs.writeFileSync(file, JSON.stringify(state));
    return result;
  });
}

if (require.main === module) {
  let raw = '';
  process.stdin.setEncoding('utf8');
  process.stdin.on('data', (chunk) => (raw += chunk));
  process.stdin.on('end', () => {
    try {
      const output = decide(JSON.parse(raw));
      if (output) process.stdout.write(JSON.stringify(output));
    } catch (error) {
      // A non-blocking failure: the tool call proceeds and the agent's own ceiling still holds.
      process.stderr.write(`intern-ceiling: ${error.message}\n`);
      process.exit(1);
    }
  });
}

module.exports = { RULES, classifyPath, dependencyChange, snapshot, changedPaths, decide };
