#!/usr/bin/env node
'use strict';

// Tier 0 of the test plan: static validation. Free, deterministic, CI-safe.
// Run: node scripts/validate.js  [--json]

const fs = require('fs');
const path = require('path');
const { read } = require('./lib/frontmatter');

const ROOT = path.resolve(__dirname, '..');

// The Agent Skills spec (agentskills.io) accepts exactly these keys. Anything else is a
// hard error on claude.ai upload and the Skills API, so skills must stay spec-pure and
// Claude Code-only fields live in agents/ instead.
const SPEC_KEYS = new Set(['name', 'description', 'license', 'compatibility', 'metadata', 'allowed-tools']);
const AGENT_KEYS = new Set([
  'name', 'description', 'tools', 'disallowedTools', 'model', 'effort', 'color',
  'permissionMode', 'maxTurns', 'skills', 'mcpServers', 'hooks', 'memory',
  'background', 'isolation', 'initialPrompt',
]);
const MODELS = new Set(['sonnet', 'opus', 'haiku', 'fable', 'inherit']);
const EFFORTS = new Set(['low', 'medium', 'high', 'xhigh', 'max']);
const COLORS = new Set(['red', 'blue', 'green', 'yellow', 'purple', 'orange', 'pink', 'cyan']);
const TIERS = new Set(['T0', 'T1', 'T2', 'T3']);

const MAX_DESCRIPTION = 1024;
const MAX_SKILL_LINES = 500;

const problems = [];
const fail = (file, message) => problems.push({ file, message });

const rel = (p) => path.relative(ROOT, p).split(path.sep).join('/');
const listFiles = (dir, ext) =>
  fs.existsSync(dir) ? fs.readdirSync(dir).filter((f) => f.endsWith(ext)).sort() : [];

function loadFrontmatter(file) {
  const raw = fs.readFileSync(file, 'utf8');
  let parsed;
  try {
    parsed = read(raw);
  } catch (error) {
    fail(rel(file), error.message);
    return null;
  }
  if (!parsed.frontmatter) {
    fail(rel(file), 'missing YAML frontmatter');
    return null;
  }
  return { ...parsed, raw, lines: raw.split(/\r?\n/).length };
}

// ---------------------------------------------------------------- agents

const agents = new Map();

for (const file of listFiles(path.join(ROOT, 'agents'), '.md')) {
  const full = path.join(ROOT, 'agents', file);
  const doc = loadFrontmatter(full);
  if (!doc) continue;

  const fm = doc.frontmatter;
  const expected = file.replace(/\.md$/, '');
  const id = rel(full);

  for (const key of Object.keys(fm)) {
    if (!AGENT_KEYS.has(key)) fail(id, `unknown agent frontmatter key: ${key}`);
  }
  if (fm.name !== expected) fail(id, `name "${fm.name}" does not match filename "${expected}"`);
  if (!fm.description) fail(id, 'missing description');
  else if (fm.description.length > MAX_DESCRIPTION) {
    fail(id, `description is ${fm.description.length} chars, max ${MAX_DESCRIPTION}`);
  }
  if (fm.model !== undefined && !MODELS.has(fm.model)) fail(id, `invalid model: ${fm.model}`);
  if (fm.effort !== undefined && !EFFORTS.has(fm.effort)) fail(id, `invalid effort: ${fm.effort}`);
  if (fm.color !== undefined && !COLORS.has(fm.color)) fail(id, `invalid color: ${fm.color}`);

  const tierLine = doc.body.match(
    /^\*\*Tier:\*\*\s*(T[0-3])\s*·\s*\*\*Escalates to:\*\*\s*([a-z0-9-]+)\s*·\s*\*\*Terminal:\*\*\s*(yes|no)\s*$/m
  );
  if (!tierLine) {
    fail(id, 'missing or malformed tier line (**Tier:** T<n> · **Escalates to:** <agent> · **Terminal:** yes|no)');
    continue;
  }
  const [, tier, escalatesTo, terminal] = tierLine;
  if (!TIERS.has(tier)) fail(id, `invalid tier: ${tier}`);

  for (const section of ['## Accepts', '## Refuses', '## Escalates to']) {
    if (!doc.body.includes(section)) fail(id, `missing required section: ${section}`);
  }

  agents.set(expected, { id, tier, escalatesTo, terminal: terminal === 'yes', fm });
}

for (const [name, agent] of agents) {
  if (agent.escalatesTo !== 'human' && !agents.has(agent.escalatesTo)) {
    fail(agent.id, `escalates to "${agent.escalatesTo}", which is not an agent`);
  }
  // A terminal agent is one whose only escalation path is the human, and vice versa.
  // Divergence here means the ladder has a hole or a dead end.
  if (agent.terminal !== (agent.escalatesTo === 'human')) {
    fail(agent.id, `Terminal: ${agent.terminal ? 'yes' : 'no'} contradicts "Escalates to: ${agent.escalatesTo}"`);
  }
  if (agent.tier === 'T3' && !agent.terminal) {
    fail(agent.id, 'a T3 agent must be terminal');
  }
  if (agent.tier !== 'T3' && agent.terminal) {
    fail(agent.id, `tier ${agent.tier} cannot be terminal; only T3 escalates to the human`);
  }
  if (name === agent.escalatesTo) fail(agent.id, 'escalates to itself');
}

// Every non-terminal agent must reach a terminal one without a cycle.
for (const [name, agent] of agents) {
  const seen = new Set([name]);
  let cursor = agent;
  while (!cursor.terminal) {
    const next = cursor.escalatesTo;
    if (seen.has(next)) {
      fail(agent.id, `escalation cycle: ${[...seen, next].join(' -> ')}`);
      break;
    }
    seen.add(next);
    cursor = agents.get(next);
    if (!cursor) break;
  }
}

// ---------------------------------------------------------------- skills

const skills = new Map();
const skillsDir = path.join(ROOT, 'skills');
const skillNames = fs.existsSync(skillsDir)
  ? fs.readdirSync(skillsDir).filter((d) => fs.statSync(path.join(skillsDir, d)).isDirectory()).sort()
  : [];

for (const dir of skillNames) {
  const full = path.join(skillsDir, dir, 'SKILL.md');
  if (!fs.existsSync(full)) {
    fail(`skills/${dir}`, 'missing SKILL.md');
    continue;
  }
  const doc = loadFrontmatter(full);
  if (!doc) continue;

  const fm = doc.frontmatter;
  const id = rel(full);

  for (const key of Object.keys(fm)) {
    if (!SPEC_KEYS.has(key)) {
      fail(id, `frontmatter key "${key}" is outside the Agent Skills spec; move it into metadata`);
    }
  }
  if (fm.name !== dir) fail(id, `name "${fm.name}" does not match directory "${dir}"`);
  if (!fm.description) fail(id, 'missing description');
  else if (fm.description.length > MAX_DESCRIPTION) {
    fail(id, `description is ${fm.description.length} chars, max ${MAX_DESCRIPTION}`);
  }
  if (doc.lines > MAX_SKILL_LINES) fail(id, `${doc.lines} lines, max ${MAX_SKILL_LINES}`);

  const owners = (fm.metadata && fm.metadata.owners) || [];
  for (const owner of owners) {
    if (!agents.has(owner)) fail(id, `metadata.owners lists "${owner}", which is not an agent`);
  }
  if (fm.metadata && !fm.metadata.phase) fail(id, 'metadata.phase is required');

  skills.set(dir, { id, fm, body: doc.body });
}

// ---------------------------------------------------- cross-file references

const referenceFiles = new Set(listFiles(path.join(ROOT, 'references'), '.md').map((f) => `references/${f}`));

function checkReferences(id, body) {
  for (const match of body.matchAll(/`(references\/[a-z0-9-]+\.md)`/g)) {
    if (!referenceFiles.has(match[1])) fail(id, `points at ${match[1]}, which does not exist`);
  }
}

for (const [, skill] of skills) checkReferences(skill.id, skill.body);
for (const [, agent] of agents) {
  checkReferences(agent.id, fs.readFileSync(path.join(ROOT, agent.id), 'utf8'));
}

// ---------------------------------------------------------------- commands

const commandDir = path.join(ROOT, '.claude', 'commands');
for (const file of listFiles(commandDir, '.md')) {
  const full = path.join(commandDir, file);
  const doc = loadFrontmatter(full);
  if (!doc) continue;
  const id = rel(full);
  if (!doc.frontmatter.description) fail(id, 'missing description');

  // Backticked lowercase-hyphen identifiers in a command body are skill or agent names.
  for (const match of doc.body.matchAll(/`([a-z][a-z0-9-]{3,})`/g)) {
    const token = match[1];
    if (token.includes('/') || token.includes('.')) continue;
    if (skills.has(token) || agents.has(token)) continue;
    fail(id, `references \`${token}\`, which is neither a skill nor an agent`);
  }
}

// ---------------------------------------------------------------- manifests

for (const manifest of ['.claude-plugin/plugin.json', '.claude-plugin/marketplace.json', 'package.json']) {
  const full = path.join(ROOT, manifest);
  if (!fs.existsSync(full)) {
    fail(manifest, 'missing');
    continue;
  }
  try {
    JSON.parse(fs.readFileSync(full, 'utf8'));
  } catch (error) {
    fail(manifest, `invalid JSON: ${error.message}`);
  }
}

// The roster table in AGENTS.md is what non-Claude tools read. Drift makes it wrong.
const agentsDoc = fs.readFileSync(path.join(ROOT, 'AGENTS.md'), 'utf8');
for (const name of agents.keys()) {
  if (!agentsDoc.includes(`\`${name}\``)) fail('AGENTS.md', `roster is missing ${name}`);
}
for (const name of skills.keys()) {
  if (!agentsDoc.includes(`\`${name}\``)) fail('AGENTS.md', `routing table is missing ${name}`);
}

// ---------------------------------------------------------------- report

const summary = {
  agents: agents.size,
  skills: skills.size,
  references: referenceFiles.size,
  commands: listFiles(commandDir, '.md').length,
  problems: problems.length,
};

if (process.argv.includes('--json')) {
  console.log(JSON.stringify({ ...summary, details: problems }, null, 2));
} else {
  for (const p of problems) console.error(`  ${p.file}: ${p.message}`);
  const counts = `${summary.agents} agents · ${summary.skills} skills · ${summary.references} references · ${summary.commands} commands`;
  console.log(problems.length ? `\nFAIL — ${problems.length} problem(s). ${counts}` : `PASS — ${counts}`);
}

process.exit(problems.length ? 1 : 0);
