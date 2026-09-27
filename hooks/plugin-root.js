#!/usr/bin/env node
'use strict';

// Agents and skills cite checklists as `references/<name>.md`, a path relative to wherever
// this plugin is installed. That is never the project the agent is working in, so without
// this line an agent looking for the HANDOFF packet finds nothing and improvises one.
// hooks/hooks.json runs this at session start and when one of this plugin's subagents starts.

const fs = require('fs');
const path = require('path');

const ROOT = process.env.CLAUDE_PLUGIN_ROOT || path.resolve(__dirname, '..');

function context(input) {
  const event = input.hook_event_name;
  const plugin = JSON.parse(fs.readFileSync(path.join(ROOT, '.claude-plugin', 'plugin.json'), 'utf8')).name;
  if (event === 'SubagentStart' && !String(input.agent_type || '').startsWith(`${plugin}:`)) return null;
  const refs = path.join(ROOT, 'references');
  return {
    hookSpecificOutput: {
      hookEventName: event,
      additionalContext:
        `${plugin} is installed at ${ROOT}. Its agents and skills cite checklists as ` +
        `\`references/<name>.md\`; read them from ${refs}${path.sep}<name>.md. The HANDOFF ` +
        `packet and the BRIEF are defined in ${path.join(refs, 'escalation-ladder.md')}.`,
    },
  };
}

if (require.main === module) {
  let raw = '';
  process.stdin.setEncoding('utf8');
  process.stdin.on('data', (chunk) => (raw += chunk));
  process.stdin.on('end', () => {
    try {
      const output = context(JSON.parse(raw || '{}'));
      if (output) process.stdout.write(JSON.stringify(output));
    } catch (error) {
      process.stderr.write(`plugin-root: ${error.message}\n`);
      process.exit(1);
    }
  });
}

module.exports = { context };
