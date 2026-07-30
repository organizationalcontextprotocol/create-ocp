'use strict';

const assert = require('node:assert/strict');
const { test } = require('node:test');
const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const CLI = path.join(__dirname, '..', 'cli.js');
const pkg = require('../package.json');
const templates = require('../templates');

const NOW = '2026-07-30T00:00:00Z';

function runCli(args, options = {}) {
  return spawnSync(process.execPath, [CLI, ...args], { encoding: 'utf8', ...options });
}

function withTmpDir(fn) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'create-ocp-'));
  try {
    return fn(dir);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

function listFiles(root) {
  const out = [];
  const walk = (dir, prefix) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (entry.name === '.git') continue;
      const rel = prefix ? `${prefix}/${entry.name}` : entry.name;
      if (entry.isDirectory()) walk(path.join(dir, entry.name), rel);
      else out.push(rel);
    }
  };
  walk(root, '');
  return out.sort();
}

const SUBSTRATE_FILES = Object.keys(
  templates.files({ basename: 'acme', template: 'substrate', now: NOW })
).sort();
const WIKI_FILES = Object.keys(
  templates.files({ basename: 'acme', template: 'wiki', now: NOW })
).sort();

test('the substrate scaffold matches the template manifest exactly', () => {
  withTmpDir((dir) => {
    const target = path.join(dir, 'acme');
    const result = runCli([target, '--no-git']);
    assert.equal(result.status, 0, result.stderr);
    assert.deepEqual(listFiles(target), SUBSTRATE_FILES);
  });
});

test('wiki template adds ocp.config.ts and the renderer spec', () => {
  withTmpDir((dir) => {
    const target = path.join(dir, 'acme-wiki');
    const result = runCli([target, '-t', 'wiki', '--no-git']);
    assert.equal(result.status, 0, result.stderr);
    assert.deepEqual(listFiles(target), WIKI_FILES);
    assert.ok(WIKI_FILES.includes('ocp.config.ts'));
    assert.ok(WIKI_FILES.includes('renderer/README.md'));
    const config = fs.readFileSync(path.join(target, 'ocp.config.ts'), 'utf8');
    for (const key of ['substrateRoot', 'exclude', 'sourceBlobBase', 'displayOverrides']) {
      assert.ok(config.includes(key), `ocp.config.ts declares ${key}`);
    }
  });
});

test('the root README declares the graph-root organization from the flags', () => {
  withTmpDir((dir) => {
    const target = path.join(dir, 'whatever');
    const result = runCli([
      target, '-n', 'Acme Platform', '-o', 'acme', '-u', 'max', '--altitude', 'agency', '--no-git',
    ]);
    assert.equal(result.status, 0, result.stderr);
    const readme = fs.readFileSync(path.join(target, 'README.md'), 'utf8');
    assert.match(readme, /^org_id: acme$/m);
    assert.match(readme, /^display_name: Acme Platform$/m);
    assert.match(readme, /^parent_org_id: null$/m);
    assert.match(readme, /^role: org_definition$/m);
    assert.ok(fs.existsSync(path.join(target, '_users', 'max', 'README.md')));
  });
});

test('defaults derive the org id and display name from the directory name', () => {
  withTmpDir((dir) => {
    const target = path.join(dir, 'north-wind');
    assert.equal(runCli([target, '--no-git']).status, 0);
    const readme = fs.readFileSync(path.join(target, 'README.md'), 'utf8');
    assert.match(readme, /^org_id: north-wind$/m);
    assert.match(readme, /^display_name: North Wind$/m);
    assert.ok(fs.existsSync(path.join(target, '_users', 'founder', 'README.md')));
  });
});

test('refuses an existing non-empty directory without --force, accepts it with', () => {
  withTmpDir((dir) => {
    const target = path.join(dir, 'occupied');
    fs.mkdirSync(target);
    fs.writeFileSync(path.join(target, 'keep.txt'), 'mine\n');

    const refused = runCli([target, '--no-git']);
    assert.equal(refused.status, 1);
    assert.match(refused.stderr, /--force/);
    assert.deepEqual(listFiles(target), ['keep.txt']);

    const forced = runCli([target, '--no-git', '--force']);
    assert.equal(forced.status, 0, forced.stderr);
    assert.ok(fs.existsSync(path.join(target, 'keep.txt')), 'unrelated files survive --force');
    assert.ok(fs.existsSync(path.join(target, 'README.md')));
  });
});

test('errors when the target exists as a file', () => {
  withTmpDir((dir) => {
    const target = path.join(dir, 'a-file');
    fs.writeFileSync(target, 'not a directory\n');
    const result = runCli([target, '--no-git']);
    assert.equal(result.status, 1);
    assert.match(result.stderr, /not a directory/);
  });
});

test('missing directory argument prints help to stderr and exits 1', () => {
  const result = runCli([]);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /Usage: create-ocp/);
  assert.equal(result.stdout, '');
});

test('-h exits 0 with usage on stdout; -v prints the exact version', () => {
  const help = runCli(['-h']);
  assert.equal(help.status, 0);
  assert.match(help.stdout, /Usage: create-ocp/);
  assert.match(help.stdout, /ocp\.wiki/);

  const version = runCli(['-v']);
  assert.equal(version.status, 0);
  assert.equal(version.stdout, `${pkg.version}\n`);
});

test('unknown template and unknown altitude are rejected before writing anything', () => {
  withTmpDir((dir) => {
    const target = path.join(dir, 'nope');
    const badTemplate = runCli([target, '-t', 'blog', '--no-git']);
    assert.equal(badTemplate.status, 1);
    assert.match(badTemplate.stderr, /unknown template/);

    const badAltitude = runCli([target, '--altitude', 'galaxy', '--no-git']);
    assert.equal(badAltitude.status, 1);
    assert.match(badAltitude.stderr, /unknown altitude/);

    assert.equal(fs.existsSync(target), false, 'nothing was written');
  });
});

test('extra positionals are rejected and unknown flags produce a usage error', () => {
  withTmpDir((dir) => {
    const extra = runCli([path.join(dir, 'a'), path.join(dir, 'b'), '--no-git']);
    assert.equal(extra.status, 1);
    assert.match(extra.stderr, /exactly one target directory/);

    const unknown = runCli([path.join(dir, 'a'), '--wat', '--no-git']);
    assert.equal(unknown.status, 1);
    assert.match(unknown.stderr, /create-ocp:/);
  });
});

test('--no-git leaves no repository; git is attempted by default', () => {
  withTmpDir((dir) => {
    const bare = path.join(dir, 'nogit');
    assert.equal(runCli([bare, '--no-git']).status, 0);
    assert.equal(fs.existsSync(path.join(bare, '.git')), false);

    const withGit = path.join(dir, 'withgit');
    const result = runCli([withGit]);
    assert.equal(result.status, 0, result.stderr);
    if (spawnSync('git', ['--version'], { encoding: 'utf8' }).status === 0) {
      assert.ok(fs.existsSync(path.join(withGit, '.git')));
    }
  });
});

test('a missing git binary only warns and never fails the scaffold', () => {
  withTmpDir((dir) => {
    const emptyBin = path.join(dir, 'empty-bin');
    fs.mkdirSync(emptyBin);
    const target = path.join(dir, 'gitless');
    const result = runCli([target], { env: { ...process.env, PATH: emptyBin } });
    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /Warning: "git init" failed or git is not installed/);
    assert.ok(fs.existsSync(path.join(target, 'README.md')));
  });
});

test('the success output shows the tree and the next steps', () => {
  withTmpDir((dir) => {
    const result = runCli([path.join(dir, 'acme'), '--no-git']);
    assert.equal(result.status, 0);
    assert.match(result.stdout, /Scaffolded the OCP substrate/);
    assert.match(result.stdout, /_kernels\//);
    assert.match(result.stdout, /AGENTS\.md/);
    assert.match(result.stdout, /30 minutes/);
  });
});

test('scaffolding into "." works and targets the current directory', () => {
  withTmpDir((dir) => {
    const result = runCli(['.', '--no-git'], { cwd: dir });
    assert.equal(result.status, 0, result.stderr);
    assert.ok(fs.existsSync(path.join(dir, 'README.md')));
  });
});

test('a target path containing spaces is handled', () => {
  withTmpDir((dir) => {
    const target = path.join(dir, 'my org wiki');
    const result = runCli([target, '--no-git']);
    assert.equal(result.status, 0, result.stderr);
    const readme = fs.readFileSync(path.join(target, 'README.md'), 'utf8');
    assert.match(readme, /^org_id: my-org-wiki$/m);
  });
});

test('scaffolding is deterministic for the same inputs and injected clock', () => {
  const a = templates.files({ basename: 'acme', template: 'wiki', now: NOW });
  const b = templates.files({ basename: 'acme', template: 'wiki', now: NOW });
  assert.deepEqual(Object.keys(a), Object.keys(b));
  for (const key of Object.keys(a)) assert.equal(a[key], b[key], `${key} is stable`);
});

test('templates.files rejects an unknown template, altitude, or a missing clock', () => {
  assert.throws(() => templates.files({ basename: 'a', template: 'blog', now: NOW }), /unknown template/);
  assert.throws(() => templates.files({ basename: 'a', altitude: 'galaxy', now: NOW }), /unknown altitude/);
  assert.throws(() => templates.files({ basename: 'a' }), /deterministic/);
});

test('--force never overwrites a colliding file and reports what it kept', () => {
  withTmpDir((dir) => {
    const target = path.join(dir, 'existing-repo');
    fs.mkdirSync(path.join(target, 'notes'), { recursive: true });
    fs.writeFileSync(path.join(target, 'README.md'), 'MY ORIGINAL README\n');
    fs.writeFileSync(path.join(target, 'notes', 'README.md'), 'my original notes index\n');
    fs.writeFileSync(path.join(target, 'keep.txt'), 'unrelated\n');

    const result = runCli([target, '--force', '--no-git']);
    assert.equal(result.status, 0, result.stderr);

    // The originals survive verbatim — this is the README's promise.
    assert.equal(fs.readFileSync(path.join(target, 'README.md'), 'utf8'), 'MY ORIGINAL README\n');
    assert.equal(
      fs.readFileSync(path.join(target, 'notes', 'README.md'), 'utf8'),
      'my original notes index\n'
    );
    assert.equal(fs.readFileSync(path.join(target, 'keep.txt'), 'utf8'), 'unrelated\n');

    // And the scaffold still lands everywhere it did not collide.
    assert.ok(fs.existsSync(path.join(target, 'AGENTS.md')));
    assert.ok(fs.existsSync(path.join(target, '_kernels', 'initiative.md')));

    // The user is told, rather than left to discover it.
    assert.match(result.stdout, /Kept 2 existing files \(not overwritten\)/);
    assert.match(result.stdout, /README\.md/);
    assert.match(result.stdout, /notes\/README\.md/);
  });
});

test('a display name with YAML metacharacters still emits parseable frontmatter', () => {
  const hostile = [
    'Acme: The Sequel',
    '#Hashy',
    'true',
    '- dash lead',
    '*star',
    '@at',
    'trailing:',
    '123',
  ];
  for (const name of hostile) {
    const files = templates.files({ basename: 'x', displayName: name, now: NOW });
    const line = files['README.md']
      .split('\n')
      .find((candidate) => candidate.startsWith('display_name:'));
    const value = line.slice('display_name:'.length).trim();
    const parsed =
      value.startsWith('"') && value.endsWith('"') ? JSON.parse(value) : value;
    assert.equal(parsed, name, `${name} survives frontmatter emission`);
    // A bare scalar must never carry a construct that changes YAML's reading.
    if (!value.startsWith('"')) {
      assert.ok(!/:\s|\s#/.test(value), `${name} would need quoting`);
    }
  }
});
