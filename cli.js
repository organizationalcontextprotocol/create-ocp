#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const readline = require('node:readline/promises');
const { spawnSync } = require('node:child_process');
const { parseArgs } = require('node:util');

const templates = require('./templates');
const pkg = require('./package.json');

const HELP = `Usage: npm create ocp <directory> [options]

Scaffold an OCP (Organizational Context Protocol) organization: a git-native
markdown substrate that humans read and AI agents consume.

Run it with no arguments in a terminal and it will walk you through the
options instead.

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
  npm create ocp                       walk me through it
  npm create ocp acme-context
  npm create ocp acme-wiki -- --template wiki
  npx create-ocp acme -n "Acme Platform" -o acme -u max --no-git

Passing flags through "npm create" needs a "--" separator, because npm claims
--name, --force, --help and --version for itself before they reach this CLI.
"npx create-ocp" takes them directly. Both run the same program.

The spec, the conventions, and the patterns: https://ocp.wiki
Scaffolding as an AI agent: https://ocp.wiki/genesis.md
`;

// Errors caused by how the CLI was invoked: printed as a one-line message
// with a help hint — never as a stack trace.
class UsageError extends Error {}

/**
 * Interactive mode is offered ONLY when the invocation carries no target
 * directory AND both ends of the terminal are a TTY.
 *
 * The second half is load-bearing, not defensive. This CLI is what the
 * https://ocp.wiki/genesis.md one-shot funnel lands on: an agent, a CI job, or
 * anything reading our stdout through a pipe must never be handed a prompt,
 * because nothing is there to answer it and the run would hang forever rather
 * than fail. A missing directory in a non-TTY stays what it has always been —
 * usage on stderr, exit 1.
 */
function isInteractive() {
  return Boolean(process.stdin.isTTY && process.stdout.isTTY);
}

/**
 * The menu itself, over an injected `ask(label, fallback)`. Kept free of
 * readline and of stdout so the defaulting and the re-ask loops are testable
 * without a pseudo-terminal.
 *
 * Every answer has a default, so the whole menu is four carriage returns if you
 * like what it proposes.
 */
async function collectAnswers(ask, note = () => {}) {
  let directory = '';
  while (directory === '') {
    directory = (await ask('Directory', '')) || '';
    if (directory === '') note('  A target directory is required.');
  }

  const name = await ask('Display name', templates.humanize(path.basename(directory)));

  let template = '';
  while (!templates.TEMPLATES.includes(template)) {
    template = await ask(`Template [${templates.TEMPLATES.join('/')}]`, 'substrate');
    if (!templates.TEMPLATES.includes(template)) {
      note(`  Expected one of: ${templates.TEMPLATES.join(', ')}`);
    }
  }

  const user = await ask('Seed user', 'founder');
  return { directory, name, template, user };
}

async function promptForOptions() {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const ask = async (label, fallback) => {
    const suffix = fallback === undefined || fallback === '' ? '' : ` (${fallback})`;
    const answer = (await rl.question(`  ${label}${suffix}: `)).trim();
    return answer === '' ? fallback : answer;
  };
  try {
    process.stdout.write('\nScaffold an OCP organization. Press enter to accept a default.\n\n');
    const answers = await collectAnswers(ask, (line) => process.stdout.write(`${line}\n`));
    process.stdout.write('\n');
    return answers;
  } finally {
    rl.close();
  }
}

/**
 * The flag-form command equivalent to what the menu just collected. Printed
 * after an interactive run so the menu teaches the flags rather than hiding
 * them — the second time, an operator can skip it.
 */
function equivalentCommand(answers) {
  const parts = ['npm create ocp', answers.directory];
  const flags = [];
  if (answers.name !== templates.humanize(path.basename(answers.directory))) {
    flags.push(`--name ${JSON.stringify(answers.name)}`);
  }
  if (answers.template !== 'substrate') flags.push(`--template ${answers.template}`);
  if (answers.user !== 'founder') flags.push(`--user ${answers.user}`);
  if (flags.length > 0) parts.push('--', ...flags);
  return parts.join(' ');
}

function scaffold(options) {
  const { directory, displayName, orgId, userId, template, noGit, force, equivalent } = options;

  if (!templates.TEMPLATES.includes(template)) {
    throw new UsageError(
      `unknown template "${template}" (expected one of: ${templates.TEMPLATES.join(', ')})`
    );
  }

  const targetDir = path.resolve(process.cwd(), directory);
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
  if (stat && fs.readdirSync(targetDir).length > 0 && !force) {
    throw new UsageError(
      `target directory "${targetDir}" is not empty; rerun with --force to scaffold into it anyway`
    );
  }

  let fileMap;
  try {
    fileMap = templates.files({
      basename,
      template,
      displayName,
      orgId,
      userId,
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
  if (!noGit) {
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
  const resolvedName = displayName ?? templates.humanize(basename);

  const lines = [];
  lines.push(`Scaffolded the OCP ${template} "${resolvedName}" in ${displayTarget}`);
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
  if (equivalent) {
    lines.push('Same result without the questions next time:');
    lines.push('');
    lines.push(`  ${equivalent}`);
    lines.push('');
  }
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

async function main(argv) {
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
  if (positionals.length > 1) {
    throw new UsageError(
      `unexpected extra argument "${positionals[1]}" — pass exactly one target directory`
    );
  }

  if (positionals.length === 0) {
    if (!isInteractive()) {
      process.stderr.write(HELP);
      return 1;
    }
    const answers = await promptForOptions();
    return scaffold({
      directory: answers.directory,
      displayName: answers.name,
      orgId: values['org-id'],
      userId: answers.user,
      template: answers.template,
      noGit: values['no-git'],
      force: values.force,
      equivalent: equivalentCommand(answers),
    });
  }

  return scaffold({
    directory: positionals[0],
    displayName: values.name,
    orgId: values['org-id'],
    userId: values.user,
    template: values.template ?? 'substrate',
    noGit: values['no-git'],
    force: values.force,
    equivalent: null,
  });
}

// Exported for tests. The bin behavior is guarded on being the entry point, so
// requiring this file runs nothing.
module.exports = { collectAnswers, equivalentCommand, isInteractive };

if (require.main === module) {
  main(process.argv.slice(2))
    .then((code) => {
      process.exitCode = code;
    })
    .catch((error) => {
      // A Ctrl-C at a prompt closes stdin, which rejects the pending question.
      // That is a deliberate exit, not a failure to report as one.
      if (error && error.code === 'ABORT_ERR') {
        process.stdout.write('\nCancelled. Nothing was written.\n');
        process.exitCode = 130;
        return;
      }
      const usage = error instanceof UsageError;
      const message = usage ? error.message : `unexpected error: ${error.message}`;
      process.stderr.write(`create-ocp: ${message}\n`);
      if (usage) {
        process.stderr.write('Run "create-ocp --help" for usage.\n');
      }
      process.exitCode = 1;
    });
}
