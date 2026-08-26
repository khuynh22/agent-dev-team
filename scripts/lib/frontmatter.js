'use strict';

// Minimal YAML frontmatter reader. Handles exactly what this repo's files use: scalars,
// inline `[a, b]` lists, block lists, and one level of nested mapping. Deliberately not a
// YAML implementation — the validator rejects anything it cannot read, which is the point.

function parseScalar(raw) {
  const value = raw.trim();
  if (value === '') return '';
  if (value === 'true') return true;
  if (value === 'false') return false;
  if (/^-?\d+$/.test(value)) return Number(value);
  if (/^\[.*\]$/.test(value)) {
    const inner = value.slice(1, -1).trim();
    if (inner === '') return [];
    return inner.split(',').map((item) => parseScalar(item));
  }
  if (/^".*"$/.test(value) || /^'.*'$/.test(value)) return value.slice(1, -1);
  return value;
}

function parseBlock(lines, baseIndent) {
  const out = {};
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (line.trim() === '' || line.trim().startsWith('#')) {
      i++;
      continue;
    }
    const indent = line.length - line.trimStart().length;
    if (indent < baseIndent) break;

    const match = line.trim().match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (!match) throw new Error(`cannot parse frontmatter line: ${line.trim()}`);
    const [, key, rest] = match;

    if (rest !== '') {
      out[key] = parseScalar(rest);
      i++;
      continue;
    }

    const child = [];
    i++;
    while (i < lines.length) {
      const next = lines[i];
      if (next.trim() === '') {
        i++;
        continue;
      }
      const nextIndent = next.length - next.trimStart().length;
      if (nextIndent <= indent) break;
      child.push(next);
      i++;
    }
    if (child.length && child[0].trim().startsWith('- ')) {
      out[key] = child.map((entry) => parseScalar(entry.trim().slice(2)));
    } else {
      out[key] = parseBlock(child, child.length ? child[0].length - child[0].trimStart().length : 0);
    }
  }
  return out;
}

function read(raw) {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!match) return { frontmatter: null, body: raw };
  return {
    frontmatter: parseBlock(match[1].split(/\r?\n/), 0),
    body: match[2],
  };
}

module.exports = { read };
