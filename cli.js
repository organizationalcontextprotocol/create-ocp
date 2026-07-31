#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { parseArgs } = require('node:util');

const templates = require('./templates');
const pkg = require('./package.json');

const HELP = `Usage: create-ocp <directory> [options]

Scaffold an OCP (Organizational Context Protocol) organization: a git-native
markdown substrate that humans read and AI agents consume.

Options:
  -t, --template <substrate|wiki>  What to scaffold (default: substrate)
                                   substrate  the conformant organization
                                   wiki       substrate + ocp.config.ts for a renderer
  -n, --name <display name>        Organization display name
                                   (default: humanized target directory name)
  -o, --org-id <kebab-id>          Organization id (default: kebab-cased directory name)
  -u, --user <user-id>             Seed user under _users/ (default: founder)
      --no-git                     Skip running "git init" in the new project
  -f, --force                      Scaffold into a non-empty directory
  -h, --help                       Print this help and exit
  -v, --version                    Print the create-ocp version and exit

Examples:
  npx create-ocp acme-context
  npx create-ocp acme-wiki --template wiki
  npx create-ocp acme -n "Acme Platform" -o acme -u max --no-git

The spec, the conventions, and the patterns: https://ocp.wiki
Scaffolding as an AI agent: https://ocp.wiki/genesis.md
`;

// Errors caused by how the CLI was invoked: printed as a one-line message
// with a help hint — never as a stack trace.
class UsageError extends Error {}

function main(argv) {
  let parsed;
  try {
    parsed = parseArgs({
      args: argv,
      strict: true,
      allowPositionals: true,
      options: {
        template: { type: 'string', short: 't' },
        name: { type: 'string', short: 'n' },
        'org-id': { type: 'string', short: 'o' },
        user: { type: 'string', short: 'u' },
        'no-git': { type: 'boolean' },
        force: { type: 'boolean', short: 'f' },
        help: { type: 'boolean', short: 'h' },
        version: { type: 'boolean', short: 'v' },
      },
    });
  } catch (error) {
    throw new UsageError(error.message);
  }

  const { values, positionals } = parsed;

  if (values.help) {
    process.stdout.write(HELP);
    return 0;
  }
  if (values.version) {
    process.stdout.write(`${pkg.version}\n`);
    return 0;
  }
  if (positionals.length === 0) {
    process.stderr.write(HELP);
    return 1;
  }
  if (positionals.length > 1) {
    throw new UsageError(
      `unexpected extra argument "${positionals[1]}" — pass exactly one target directory`
    );
  }

  const template = values.template ?? 'substrate';
  if (!templates.TEMPLATES.includes(template)) {
    throw new UsageError(
      `unknown template "${template}" (expected one of: ${templates.TEMPLATES.join(', ')})`
    );
  }
  const targetDir = path.resolve(process.cwd(), positionals[0]);
  const basename = path.basename(targetDir);

  let stat = null;
  try {
    stat = fs.statSync(targetDir);
  } catch {
    stat = null;
  }
  if (stat && !stat.isDirectory()) {
    throw new UsageError(`target "${targetDir}" already exists and is not a directory`);
  }
  if (stat && fs.readdirSync(targetDir).length > 0 && !values.force) {
    throw new UsageError(
      `target directory "${targetDir}" is not empty; rerun with --force to scaffold into it anyway`
    );
  }

  let fileMap;
  try {
    fileMap = templates.files({
      basename,
      template,
      displayName: values.name,
      orgId: values['org-id'],
      userId: values.user,
      now: new Date().toISOString().replace(/\.\d{3}Z$/, 'Z'),
    });
  } catch (error) {
    throw new UsageError(error.message);
  }

  // Never clobber a file that is already there. Scaffold paths like README.md
  // and .gitignore are exactly the ones an existing repository already has, and
  // --force exists to add OCP structure alongside them — not to overwrite them.
  const skipped = [];
  for (const [relPath, content] of Object.entries(fileMap)) {
    const absPath = path.join(targetDir, ...relPath.split('/'));
    if (fs.existsSync(absPath)) {
      skipped.push(relPath);
      continue;
    }
    fs.mkdirSync(path.dirname(absPath), { recursive: true });
    fs.writeFileSync(absPath, content);
  }

  let gitNote = 'Skipped "git init" (--no-git).';
  if (!values['no-git']) {
    let result;
    try {
      result = spawnSync('git', ['init', '--quiet'], { cwd: targetDir, stdio: 'ignore' });
    } catch (error) {
      result = { error };
    }
    if (!result || result.error || result.status !== 0) {
      gitNote =
        'Warning: "git init" failed or git is not installed; continuing without a git repository.';
    } else {
      gitNote = 'Initialized an empty git repository.';
    }
  }

  const relTarget = path.relative(process.cwd(), targetDir);
  const displayTarget = relTarget === '' ? '.' : relTarget.startsWith('..') ? targetDir : relTarget;
  const displayName = values.name ?? templates.humanize(basename);

  const lines = [];
  lines.push(`Scaffolded the OCP ${template} "${displayName}" in ${displayTarget}`);
  lines.push('');
  lines.push(templates.renderTree(basename, Object.keys(fileMap)));
  lines.push('');
  if (skipped.length > 0) {
    lines.push(
      `Kept ${skipped.length} existing ${skipped.length === 1 ? 'file' : 'files'} (not overwritten):`
    );
    for (const relPath of skipped) lines.push(`  ${relPath}`);
    lines.push('');
  }
  lines.push(gitNote);
  lines.push('');
  lines.push('Next steps:');
  lines.push('');
  if (displayTarget !== '.') lines.push(`  cd ${displayTarget}`);
  lines.push('  Read AGENTS.md — it is the entry point you point an AI agent at.');
  lines.push('  Open README.md and fill in the Core Canon block with your own pointers.');
  lines.push('  Replace the example initiative and child org with real ones.');
  lines.push('');
  lines.push('  A first-time reader, human or agent, should be able to read README.md,');
  lines.push('  the kernel definition, and one initiative and be operational in 30 minutes.');
  lines.push('  If that stops being true, that is a defect worth fixing.');
  lines.push('');
  lines.push('If you are an AI agent creating this knowledge base for an operator:');
  lines.push('');
  lines.push('  1. Read AGENTS.md — "Populating a fresh scaffold" is your procedure.');
  lines.push("  2. Populate the substrate from the operator's own context (conversation,");
  lines.push('     documents, existing repos). Never invent facts: stub what you do not');
  lines.push('     know and list every stub in your final report.');
  lines.push('  3. Validate conformance, fix, and re-validate until clean:');
  lines.push('');
  lines.push('       npx ocp-core validate');
  lines.push('');
  lines.push('  4. Commit, then report the resulting structure as an outline.');
  lines.push('');
  lines.push('  Full directive: https://ocp.wiki/genesis.md');
  lines.push('');
  lines.push('To project this substrate (tree, access policy, scoped corpus):');
  lines.push('');
  lines.push('  npm install ocp-core');
  lines.push('');
  process.stdout.write(lines.join('\n'));
  return 0;
}

try {
  process.exitCode = main(process.argv.slice(2));
} catch (error) {
  const usage = error instanceof UsageError;
  const message = usage ? error.message : `unexpected error: ${error.message}`;
  process.stderr.write(`create-ocp: ${message}\n`);
  if (usage) {
    process.stderr.write('Run "create-ocp --help" for usage.\n');
  }
  process.exitCode = 1;
}
