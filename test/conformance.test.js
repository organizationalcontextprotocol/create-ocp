'use strict';

// Conformance of the GENERATED content against OCP canon. The frontmatter reader
// is reimplemented inline on purpose: create-ocp must not depend on ocp-core, so
// these assertions have to stand on their own.

const assert = require('node:assert/strict');
const { test } = require('node:test');

const templates = require('../templates');

const NOW = '2026-07-30T00:00:00Z';
const ARTIFACT_TYPES = ['note', 'adr', 'prompt', 'template', 'report'];

const scaffolds = {
  substrate: templates.files({ basename: 'acme', template: 'substrate', now: NOW }),
  wiki: templates.files({ basename: 'acme', template: 'wiki', now: NOW }),
};

const markdownEntries = (files) => Object.entries(files).filter(([p]) => p.endsWith('.md'));

// Minimal frontmatter reader: top-level `key: value` pairs only, which is all
// these assertions need.
function frontmatterOf(source) {
  const lines = source.split('\n');
  if (lines[0] !== '---') return null;
  const end = lines.indexOf('---', 1);
  if (end === -1) return null;
  const data = {};
  for (const line of lines.slice(1, end)) {
    const match = /^([A-Za-z_][\w-]*):(.*)$/.exec(line);
    if (!match) continue;
    let value = match[2].trim();
    if (
      value.length >= 2 &&
      ((value[0] === '"' && value.endsWith('"')) || (value[0] === "'" && value.endsWith("'")))
    ) {
      value = value.slice(1, -1);
    }
    data[match[1]] = value;
  }
  return { data, body: lines.slice(end + 1).join('\n') };
}

function stripCode(markdown) {
  const out = [];
  let fence = null;
  for (const line of markdown.split('\n')) {
    const marker = /^\s*(`{3,}|~{3,})/.exec(line);
    if (fence) {
      if (marker && marker[1][0] === fence) fence = null;
      continue;
    }
    if (marker) {
      fence = marker[1][0];
      continue;
    }
    out.push(line.replace(/`[^`\n]*`/g, ''));
  }
  return out.join('\n');
}

for (const [template, files] of Object.entries(scaffolds)) {
  test(`${template}: every markdown file carries conformant frontmatter`, () => {
    for (const [rel, source] of markdownEntries(files)) {
      const parsed = frontmatterOf(source);
      assert.ok(parsed, `${rel} opens with a frontmatter block (P17)`);
      const { data } = parsed;
      assert.ok(
        ARTIFACT_TYPES.includes(data.artifact_type),
        `${rel} declares an artifact_type from the closed five (P16), got ${data.artifact_type}`
      );
      assert.ok(data.role, `${rel} declares a role`);
      assert.ok(data.status, `${rel} declares a status`);
      assert.equal(data.created, NOW, `${rel} uses the injected clock`);
      assert.equal(data.updated, NOW, `${rel} uses the injected clock`);
      assert.ok(parsed.body.trim().length > 0, `${rel} has a non-empty body`);
    }
  });

  test(`${template}: display_name is the name key and title is never used`, () => {
    for (const [rel, source] of markdownEntries(files)) {
      const { data } = frontmatterOf(source);
      assert.equal(data.title, undefined, `${rel} must not use title (OCP uses display_name)`);
    }
  });

  test(`${template}: org_type is never authored (retired 2026-07-21)`, () => {
    for (const [rel, source] of Object.entries(files)) {
      assert.ok(!/^org_type\s*:/m.test(source), `${rel} must not declare org_type`);
    }
  });

  test(`${template}: there is no index.md anywhere (README is the entry point)`, () => {
    for (const rel of Object.keys(files)) {
      assert.ok(!rel.endsWith('index.md'), `${rel} must not exist; OCP uses README.md`);
    }
  });

  test(`${template}: every directory has a README.md entry point (P20)`, () => {
    const dirs = new Set(['']);
    for (const rel of Object.keys(files)) {
      const segments = rel.split('/');
      for (let i = 0; i < segments.length - 1; i += 1) {
        dirs.add(segments.slice(0, i + 1).join('/'));
      }
    }
    for (const dir of dirs) {
      const entry = dir === '' ? 'README.md' : `${dir}/README.md`;
      assert.ok(files[entry], `${dir || '<root>'} needs ${entry}`);
    }
  });

  test(`${template}: the graph root and its child org are well formed`, () => {
    const root = frontmatterOf(files['README.md']).data;
    assert.equal(root.role, 'org_definition');
    assert.equal(root.parent_org_id, 'null');
    assert.equal(root.org_id, 'acme');

    const childPath = Object.keys(files).find(
      (p) => p.startsWith('orgs/') && p.endsWith('/README.md') && p.split('/').length === 3
    );
    assert.ok(childPath, 'a nested child org proves the recursion');
    const child = frontmatterOf(files[childPath]).data;
    assert.equal(child.role, 'org_definition');
    assert.equal(child.parent_org_id, 'acme', 'the child points back at its parent');
    assert.notEqual(child.org_id, root.org_id);
  });

  test(`${template}: org definitions carry a Core Canon block (P20)`, () => {
    for (const [rel, source] of markdownEntries(files)) {
      const { data, body } = frontmatterOf(source);
      if (data.role !== 'org_definition') continue;
      assert.match(body, /##+\s+Core Canon/i, `${rel} needs a Core Canon block`);
    }
  });

  test(`${template}: the example initiative declares its kernel tier`, () => {
    const initiative = Object.keys(files).find(
      (p) => p.startsWith('initiatives/') && p.split('/').length === 3
    );
    assert.ok(initiative, 'a worked initiative example exists');
    const { data } = frontmatterOf(files[initiative]);
    assert.equal(data.role, 'kernel_index');
    assert.equal(data.tier_type, 'initiative');
  });

  test(`${template}: every wikilink resolves within the scaffold`, () => {
    const slugs = new Set(
      Object.keys(files).map((p) => (p.endsWith('.md') ? p.slice(0, -3) : p))
    );
    const basenames = new Map();
    for (const slug of slugs) {
      const base = slug.split('/').pop();
      basenames.set(base, (basenames.get(base) || 0) + 1);
    }
    // A directory link resolves to that directory's README (README-as-index),
    // and a `|` inside a markdown table cell is escaped as `\|`, so a piped
    // wikilink in a table arrives as `[[target\|display]]`.
    const unresolved = [];
    for (const [rel, source] of markdownEntries(files)) {
      for (const match of stripCode(source).matchAll(/\[\[([^\][|]+)(?:\|[^\][]*)?\]\]/g)) {
        const target = match[1].trim().replace(/\\$/, '');
        const ok =
          slugs.has(target) ||
          slugs.has(`${target}/README`) ||
          (basenames.get(target.split('/').pop()) === 1 &&
            [...slugs].some((s) => s === target || s.endsWith(`/${target}`)));
        if (!ok) unresolved.push(`${rel} -> [[${target}]]`);
      }
    }
    assert.deepEqual(unresolved, [], 'every wikilink points at a file in the scaffold');
  });

  test(`${template}: no placeholder or filler text survives`, () => {
    for (const [rel, source] of Object.entries(files)) {
      assert.ok(!/\bTODO\b/.test(source), `${rel} contains a TODO`);
      assert.ok(!/coming soon/i.test(source), `${rel} says "coming soon"`);
      assert.ok(!/lorem ipsum/i.test(source), `${rel} contains lorem ipsum`);
    }
  });

  test(`${template}: every file ends with exactly one trailing newline`, () => {
    for (const [rel, source] of Object.entries(files)) {
      assert.ok(source.endsWith('\n'), `${rel} ends with a newline`);
      assert.ok(!source.endsWith('\n\n'), `${rel} has a single trailing newline`);
      assert.ok(!source.includes('\r'), `${rel} uses LF endings`);
    }
  });
}

test('the wiki template is the substrate plus renderer configuration', () => {
  const extra = Object.keys(scaffolds.wiki).filter((p) => !scaffolds.substrate[p]);
  assert.deepEqual(extra.sort(), ['ocp.config.ts', 'renderer/README.md']);
  for (const [rel, source] of Object.entries(scaffolds.substrate)) {
    assert.equal(scaffolds.wiki[rel], source, `${rel} is identical across templates`);
  }
});

test('the renderer spec is honest that the renderer is not included', () => {
  const spec = scaffolds.wiki['renderer/README.md'];
  assert.match(spec, /not included/i);
  assert.match(spec, /scopedCorpus/);
});
