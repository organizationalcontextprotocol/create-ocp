'use strict';

// Root module of the create-ocp scaffold.
//
// Emits the four repository-root files of an OCP-conformant substrate: the
// graph-root organization entry point, the agent guide, the fail-soft
// discovery log, and .gitignore. Everything here is deterministic — the only
// time source is ctx.now, so identical inputs always produce byte-identical
// output.
module.exports = function rootFiles(ctx) {
  const { orgId, displayName, userId, altitude, now, initiativeId } = ctx;

  const README = `---
artifact_type: note
role: org_definition
org_id: ${orgId}
display_name: ${ctx.displayNameYaml}
parent_org_id: null
status: active
tenant: ${orgId}
created: ${now}
updated: ${now}
members:
  - user_id: ${userId}
    role: admin
settings:
  timezone: UTC
  default_language: en
metadata:
  altitude: ${altitude}
---

# ${displayName}

${displayName} is an **OCP (Organizational Context Protocol) substrate**: this organization's
structure, knowledge, and access rules authored once as versioned markdown, so that humans and AI
agents read the same source of truth.

The governing axiom: every piece of organizational reality is either **sovereign substrate**
(authored once, versioned, canonical, in git as markdown) or a **derived projection** (rendered on
demand, never canonical, disposable). This repository holds the substrate. Vector indexes,
databases, caches, and context bundles are projections — regenerate them freely, never treat them
as the source. OCP is to context what MCP is to tools.

## The repository root is the organization

There is no separate "org file" hiding somewhere below. **This \`README.md\` is the organization's
entry point**, and because it declares \`parent_org_id: null\` it is the **graph root** — the top of
the whole organizational graph.

Structure is recursive and uniform. Every organization — root or child, at any depth — permits the
same directory set, and any organization may hold child organizations under \`orgs/\`. A child org is
an ordinary org whose \`parent_org_id\` names its parent; nothing else distinguishes it. Root vs child
is the *only* structural distinction in OCP.

Altitude (\`platform\`, \`tenant\`, \`agency\`, \`account\`, \`user\`) is **positional vocabulary you declare**,
not a path you encode and not a capability that changes the permitted structure. This organization
declares \`metadata.altitude: ${altitude}\`.
See [[_system/altitude-types|the org structure definition]].

**Access** cascades along that structure as a path-prefix decision. Admin authority cascades
*downward*: an admin of this organization is an admin of every descendant organization. Every
non-admin role requires explicit membership at each altitude and never cascades. Membership is
declared by the principal, in \`_users/<id>/memberships.md\` — see
[[_users/${userId}/memberships|${userId}'s memberships]].

## Directory map

Directories whose name starts with an underscore are **substrate**: shared, graph-level definitions
that the organization is built out of. Un-prefixed directories are **content**: the artifacts the
organization actually produces. The underscore applies to directories only — entry-point files at
the root (\`README.md\`, \`AGENTS.md\`, \`DISCOVERED.md\`) are never prefixed.

| Directory | Kind | Holds |
| --- | --- | --- |
| \`_system/\` | substrate | The canonical definitions this repo is validated against: artifact types, org structure and altitudes, kernel admission criteria. |
| \`_kernels/\` | substrate | Kernel definitions. The Initiative Kernel is the only canonical kernel. |
| \`_adrs/\` | substrate | Architectural decision records — the durable record of *why* this substrate is shaped the way it is. |
| \`_users/\` | substrate | Principals (humans and service identities) and their membership declarations. Cross-cutting: a principal may belong to orgs at any position. |
| \`notes/\` | content | User-authored knowledge. \`artifact_type: note\`. |
| \`prompts/\` | content | Agent system prompts. \`artifact_type: prompt\`. |
| \`templates/\` | content | Renderable templates with placeholders, including \`role: report_definition\` templates whose fill comes from a query over substrate. \`artifact_type: template\`. |
| \`reports/\` | content | Filled template instances, immutable once written. \`artifact_type: report\`. |
| \`initiatives/\` | content | Initiative Kernel instances — all goal-directed work. |
| \`orgs/\` | content | Child organizations, nested to any depth. |

Subset, never extend: an organization may omit any canonical directory it does not need, but may
never invent one. Adding to the canonical set requires an OCP-amending ADR.

## Core Canon

Foundational facts for this organization. Consumers bind by **Namespace + Key**; only this table
carries locations, so an artifact can move without breaking a single consumer. Rows update in the
same commit as the artifacts they point at (the Same-Commit Rule).

None declared yet.

When you declare your first fact, replace the line above with a table in this shape — namespace,
key, human name, pointer:

\`\`\`markdown
| Namespace | Key | Artifact | Location |
| --------- | --- | -------- | -------- |
| offer | starter-plan | Starter Plan | [notes/offers/starter-plan.md](notes/offers/starter-plan.md) |
| audience | founders-smb | SMB Founders | [notes/audiences/founders-smb.md](notes/audiences/founders-smb.md) |
\`\`\`

Namespaces are yours to choose (\`offer\`, \`audience\`, \`voice\`, \`icp\`, \`policy\`, …). Prominence is
declared here and nowhere else — never encode centrality as a directory path.

## Start here

A first-time operator, human or agent, should be able to read four documents and run a competent
operation inside thirty minutes. Complexity beyond that budget is a defect, not a feature. Your
thirty minutes:

1. **This file** (~5 min) — what the organization is, where things live, what its foundational
   facts are.
2. **[[AGENTS]]** (~5 min) — the same conventions expressed for an agent: the five closed artifact
   types, the frontmatter contract, and how to add a document without breaking conformance.
3. **[[_kernels/initiative|The Initiative Kernel]]** (~10 min) — the one canonical kernel and the
   universal primitive for goal-directed work. Its atom is a work unit declaring \`tier_type\`:
   \`initiative\` (goals and measurement), \`project\` (a definition of done), \`ticket\` (binary
   completion), \`sub-ticket\` (optional decomposition). How deep you go is your organization's
   choice.
4. **[[initiatives/${initiativeId}/README|The example initiative]]** (~10 min) — a worked instance
   of that kernel. Copy it, rename it, and delete the example once yours is real.

Then operate. Two rules make the operation legible to whoever reads it next: **every operation
produces an artifact** — no work that disappears into a chat log — and **the commit SHA is the
authoritative version reference**. When you cite a fact, cite the commit; branch names and file
paths drift, SHAs do not.

Directory-level orientation lives in each directory's own \`README.md\`: [[notes/README|notes]],
[[prompts/README|prompts]], [[templates/README|templates]], [[reports/README|reports]],
[[initiatives/README|initiatives]], [[orgs/README|orgs]], [[_users/README|users]],
[[_system/README|system]], [[_kernels/README|kernels]], [[_adrs/README|ADRs]].
`;

  const AGENTS = `---
artifact_type: note
role: agent_guide
status: active
tenant: ${orgId}
created: ${now}
updated: ${now}
---

# Agent Guide

Operating instructions for AI agents working in this OCP substrate. **Read [[README|README.md]]
first** — it tells you what this organization is, what its foundational facts are, and where they
live. This file tells you how to write into it without breaking conformance.

The one axiom to keep in mind: everything here is either **sovereign substrate** (authored once,
versioned, canonical, markdown in git) or a **derived projection** (rendered on demand, disposable,
never canonical). You are usually reading substrate and writing substrate. A context bundle, an
embedding, a cached summary — those are projections. Never edit a projection and never cite one as
the source.

## The five artifact types are closed

Every document declares exactly one \`artifact_type\`. There are five, and the set is closed — a sixth
requires an OCP-amending ADR, which is not something you author on your own initiative.

| \`artifact_type\` | Purpose | Home directory |
| --- | --- | --- |
| \`note\` | Human-authored knowledge, including every directory entry point | \`notes/\`, or the directory root for entry points |
| \`adr\` | Architectural decision record | \`_adrs/\` |
| \`prompt\` | Agent system prompt | \`prompts/\` |
| \`template\` | Renderable template with placeholders | \`templates/\` |
| \`report\` | Filled template instance, immutable once written | \`reports/\` |

Extensibility is exactly two open dimensions, and no others:

- **\`role:\`** discriminates *within* a type. New concepts — a sender, an audience, a scorecard, a
  hydration packet, a report definition — are \`role:\` values on one of the five types. Roles are
  open; invent the one your domain needs.
- **\`metadata:\`** is an open sub-object for user-domain fields. Conformant tooling never reads it,
  so it is safe for anything the kernel has no opinion about.

A projection definition is a \`template\` carrying \`role: report_definition\`; its renders are \`report\`
artifacts. It is not a sixth type and not its own directory.

## README-as-index — and there is no index.md

Every directory has a \`README.md\` entry point whose \`role:\` frontmatter declares that directory's
purpose. That is the index. **There is no \`index.md\` anywhere in OCP** — if you find yourself about
to create one, you want a \`README.md\` instead.

Every \`role: org_definition\` README additionally carries a **Core Canon** block: a
namespace + key → pointer table of that organization's foundational facts, whose conformant empty
state is the literal line \`None declared yet.\` Consumers bind by namespace and key; only the table
carries locations. When you move an artifact that Core Canon points at, update the row in the same
commit.

## The frontmatter contract

Every artifact opens with a YAML frontmatter block delimited by \`---\` lines.

Universal keys: \`artifact_type\`, \`role\`, \`status\`, \`tenant\`, \`created\`, \`updated\`, \`tags\`,
\`metadata\`. Organization and user entry points add \`org_id\`, \`display_name\`, \`parent_org_id\`,
\`members[]\`, \`settings{}\`. Access and provenance add \`visibility\` and \`trust_tier\`.

The human-readable name key is **\`display_name\`**. It is never \`title\`. If you see \`title\` in a
frontmatter block, that is a defect to fix, not a convention to copy.

\`created\` and \`updated\` are RFC3339 timestamps. Set \`updated\` when you change a file's substance;
leave \`created\` alone forever.

## You are a stateless renderer

Assume nothing carries over between invocations. Every prompt carries its own hydration — the facts
it needs, resolved and inlined at render time, with pointers back to the substrate they came from.
If a prompt only works because of something you happen to remember from earlier in a session, it is
broken; hydrate it explicitly.

## Every operation produces an artifact

No work disappears. A run that decided something produces an artifact recording what was decided; a
run that rendered something produces the \`report\` it rendered. If you finish an operation and there
is nothing in the tree to show for it, the operation is not finished. The commit SHA is the
authoritative version reference for whatever you produced.

## Derivation does not launder trust

A fact inherits the trust tier of its **lowest-trust source**, no matter how many LLM hops it passes
through. Summarizing an unverified scrape does not make it verified. Merging one high-trust fact
with one low-trust fact yields a low-trust fact. Carry \`trust_tier\` forward honestly and cite the
source; a confident sentence with no provenance is the failure mode this rule exists to prevent.

## How to add a document

1. **Pick the type.** Which of the five is it? Knowledge → \`note\`. A decision and its reasoning →
   \`adr\`. Instructions for an agent → \`prompt\`. Something with placeholders to be filled → \`template\`.
   A filled instance → \`report\`. If none of the five fit, you have almost certainly mis-framed the
   document — reframe it rather than reaching for a new type.
2. **Pick the role.** \`role:\` says what kind of thing it is within that type. Reuse an existing role
   in this repo when one fits; declare a new one when none does.
3. **Write the frontmatter.** Universal keys, \`display_name\` for the human-readable name, RFC3339
   \`created\`/\`updated\`, domain-specific fields under \`metadata\`.
4. **Put it in the type's home directory** (see the table above), and if it introduces a foundational
   fact, add the Core Canon row in the same commit.

If the document is a new directory, give that directory a \`README.md\` declaring its \`role\`.

## What not to do

- **Do not invent artifact types.** Five, closed. Express the new concept as a \`role\` instead.
- **Do not author an \`org_type\` field.** It was retired. The only structural distinction is
  root vs child, keyed on whether \`parent_org_id\` is null. Altitude is declared vocabulary, not a
  type and not a path.
- **Do not create \`index.md\`.** Directory entry points are \`README.md\`, always.
- **Do not resurrect \`projection_definition\`.** It was retired and re-expressed as
  \`role: report_definition\` on a \`template\`.
- **Do not put stateful runtime numbers in markdown.** Live counts, balances, and telemetry belong
  in the system that owns them, referenced by pointer. Git is for natural language; systems are for
  data. A number is canon-legal only when anchored to an as-of date and a source.
- **Do not encode prominence as a path.** Centrality is declared in Core Canon, never by burying or
  promoting a directory.
- **Do not abort a build on one bad file.** Log it to [[DISCOVERED]] and continue — unless more
  than 10% of files fail, which is a halt condition.
`;

  const DISCOVERED = `---
artifact_type: note
role: discovered_log
status: active
tenant: ${orgId}
created: ${now}
updated: ${now}
---

# Discovered

The fail-soft log for this substrate.

## Why this file exists

OCP tooling **fails soft, per file**. A build that hits a document it cannot parse — malformed
frontmatter, an unknown \`artifact_type\`, a wikilink pointing at nothing, a missing directory
\`README.md\` — does not abort. It skips that one file, records it here, and finishes. One broken
document must never cost you the other nine hundred.

The trade for that resilience is this log. A failure that is swallowed and never written down is
just data loss with better manners, so every skip lands here where a human can see it.

## The 10% halt condition

Fail-soft has a ceiling. **If more than 10% of the files in a build fail, the build HALTS** and
publishes nothing.

Past that threshold the problem is no longer "a bad file" — it is a bad build: a schema change that
landed without a migration, a truncated checkout, a parser pointed at the wrong root. Shipping a
projection that silently dropped a fifth of the substrate is far worse than shipping nothing, and
downstream consumers cannot tell the difference by looking. Halt, read the entries below, fix the
cause, rerun.

## How entries are resolved

**Fix the source file, then delete the entry — in the same commit.** Entries are never resolved by
editing this log, striking a row through, or marking it "wontfix". This log records current
breakage; if the row is still here, the file is still broken. An empty log is the healthy state,
and it should be reachable.

If a row is genuinely not a defect — the parser is wrong, not the document — that is an ADR-shaped
conversation about the rule, not a row you delete quietly.

## Entries

None discovered yet.

When the first failure is logged, replace the line above with a table in this shape:

\`\`\`markdown
| Path | Reason | First seen |
| ---- | ------ | ---------- |
| notes/pricing-2026.md | Frontmatter is not valid YAML — unquoted colon in display_name, line 5 | ${now} |
| orgs/acquired-co/README.md | Missing required key for role org_definition — parent_org_id | ${now} |
| templates/qbr.md | Unknown artifact_type "widget" — not one of the five canonical types | ${now} |
\`\`\`

Record the repository-relative **path**, a **reason** specific enough to fix from without reopening
the file, and the **first seen** timestamp — first seen, not most recent, so you can tell a fresh
break from one that has been rotting for a month.
`;

  const GITIGNORE = `# Installed dependencies — restored from the lockfile, never canonical.
node_modules/

# OS and editor cruft — machine-local, never canonical.
.DS_Store

# Build output — a regenerable projection of the source, never canonical.
.next/

# Rendered projections of the markdown substrate — regenerable on demand,
# disposable, and never canonical. Do not edit these; edit the substrate.
context-bundle.md
llms.txt
llms-full.txt
`;

  return {
    'README.md': README,
    'AGENTS.md': AGENTS,
    'DISCOVERED.md': DISCOVERED,
    '.gitignore': GITIGNORE,
  };
};
