'use strict';

// Composes the scaffold from per-area template modules. Each module is a pure
// function of the context object and returns { 'posix/rel/path': contents }, so
// the whole scaffold can be inspected without touching the filesystem.

const rootFiles = require('./templates/root');
const systemFiles = require('./templates/system');
const kernelFiles = require('./templates/kernels');
const contentFiles = require('./templates/content');
const wikiFiles = require('./templates/wiki');

const TEMPLATES = Object.freeze(['substrate', 'wiki']);

// P4: altitude (platform / tenant / agency / account / user) is DESCRIPTIVE
// vocabulary for talking about an organization's position — it is written into
// no file. The scaffold therefore takes no altitude input: there is nothing to
// put it in. The `org_type` field was retired 2026-07-21 and the whole axis went
// with it; the only structural fact an artifact records is `parent_org_id`.

const DEFAULTS = Object.freeze({
  userId: 'founder',
  childOrgId: 'example-client',
  childOrgDisplayName: 'Example Client',
  initiativeId: 'example-initiative',
});

function kebab(value) {
  return String(value)
    .normalize('NFKD')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/[\s_]+/g, '-')
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase();
}

function humanize(value) {
  const words = String(value).split(/[-_\s]+/).filter(Boolean);
  if (words.length === 0) return String(value);
  return words
    .map((word) => (/^[A-Z0-9]+$/.test(word) ? word : word[0].toUpperCase() + word.slice(1)))
    .join(' ');
}

// Emits a value that is safe as a YAML scalar. A display name is user supplied,
// so `-n 'Acme: The Sequel'` must not produce `display_name: Acme: The Sequel`,
// which is not parseable YAML. Quoting only kicks in when it has to, so ordinary
// names stay unquoted and readable.
function yamlScalar(value) {
  const text = String(value);
  const needsQuoting =
    text === '' ||
    /^[\s>|@%&*!#`[\]{},'"?-]/.test(text) ||
    /:\s|\s#|[\n\r\t]/.test(text) ||
    /[:\s]$/.test(text) ||
    /^(true|false|null|yes|no|on|off|~)$/i.test(text) ||
    /^-?\d+(\.\d+)?$/.test(text);
  return needsQuoting ? JSON.stringify(text) : text;
}

function defaultDescription(template) {
  return template === 'wiki'
    ? 'An OCP substrate plus the configuration an OCP renderer consumes.'
    : 'A git-native organizational context substrate, readable by humans and AI agents.';
}

function normalize(input) {
  const given = input || {};
  const template = given.template || 'substrate';
  if (!TEMPLATES.includes(template)) {
    throw new Error(`unknown template "${template}" (expected one of: ${TEMPLATES.join(', ')})`);
  }
  if (!given.now) {
    throw new Error('a "now" RFC3339 timestamp is required so scaffolds are deterministic');
  }

  const base = given.basename || given.orgId || given.displayName || 'my-org';
  const orgId = kebab(given.orgId || base) || 'my-org';
  const userId = kebab(given.userId || DEFAULTS.userId) || DEFAULTS.userId;

  const displayName = given.displayName || humanize(base);
  const childOrgId = kebab(given.childOrgId || DEFAULTS.childOrgId) || DEFAULTS.childOrgId;
  const childOrgDisplayName = given.childOrgDisplayName || DEFAULTS.childOrgDisplayName;
  const initiativeId = kebab(given.initiativeId || DEFAULTS.initiativeId) || DEFAULTS.initiativeId;

  return {
    template,
    now: String(given.now),
    orgId,
    displayName,
    userId,
    childOrgId,
    childOrgDisplayName,
    initiativeId,
    // Pre-escaped variants for frontmatter emission. Templates use the plain
    // values in prose and these in YAML.
    displayNameYaml: yamlScalar(displayName),
    childOrgDisplayNameYaml: yamlScalar(childOrgDisplayName),
    userDisplayNameYaml: yamlScalar(humanize(userId)),
    initiativeDisplayNameYaml: yamlScalar(humanize(initiativeId)),
  };
}

function sortPaths(fileMap) {
  const sorted = {};
  for (const key of Object.keys(fileMap).sort()) sorted[key] = fileMap[key];
  return sorted;
}

function files(input) {
  const ctx = normalize(input);
  const out = Object.assign(
    {},
    rootFiles(ctx),
    systemFiles(ctx),
    kernelFiles(ctx),
    contentFiles(ctx)
  );
  if (ctx.template === 'wiki') Object.assign(out, wikiFiles(ctx));
  return sortPaths(out);
}

// Renders the created file set as an indented tree for the CLI's success output.
function renderTree(rootLabel, paths) {
  const root = { dirs: new Map(), files: [] };
  for (const rel of paths.slice().sort()) {
    const segments = rel.split('/');
    let node = root;
    for (let i = 0; i < segments.length - 1; i += 1) {
      const segment = segments[i];
      if (!node.dirs.has(segment)) node.dirs.set(segment, { dirs: new Map(), files: [] });
      node = node.dirs.get(segment);
    }
    node.files.push(segments[segments.length - 1]);
  }

  const lines = [`${rootLabel}/`];
  const walk = (node, prefix) => {
    const dirNames = Array.from(node.dirs.keys()).sort();
    const entries = [
      ...dirNames.map((name) => ({ name, dir: true })),
      ...node.files.sort().map((name) => ({ name, dir: false })),
    ];
    entries.forEach((entry, index) => {
      const last = index === entries.length - 1;
      lines.push(`${prefix}${last ? '└── ' : '├── '}${entry.name}${entry.dir ? '/' : ''}`);
      if (entry.dir) walk(node.dirs.get(entry.name), `${prefix}${last ? '    ' : '│   '}`);
    });
  };
  walk(root, '');
  return lines.join('\n');
}

module.exports = { TEMPLATES, files, renderTree, defaultDescription, kebab, humanize };
