'use strict';

/**
 * The `_system/` substrate-definition files.
 *
 * These four files define how the scaffolded substrate is *shaped*: the closed
 * artifact-type set, the org-structure law, and the admission bar for a new
 * kernel. They are seed material an adopter is expected to keep and edit, not
 * placeholders.
 *
 * Determinism: every timestamp comes from `ctx.now`, never from the clock, so
 * the same inputs always produce byte-identical output.
 *
 * @param {{
 *   orgId: string,
 *   displayName: string,
 *   userId: string,
 *   template: string,
 *   now: string,
 *   childOrgId: string,
 *   childOrgDisplayName: string,
 *   initiativeId: string,
 * }} ctx
 * @returns {Record<string, string>} POSIX relative path -> file contents
 */
module.exports = function systemFiles(ctx) {
  const { orgId, displayName, userId, childOrgId, now } = ctx;

  // Every file here is a `note` (the five types are closed); only `role:` varies.
  const frontmatter = (role) =>
    [
      '---',
      'artifact_type: note',
      `role: ${role}`,
      'status: active',
      `tenant: ${orgId}`,
      `created: ${now}`,
      `updated: ${now}`,
      '---',
      '',
    ].join('\n');

  return {
    '_system/README.md': `${frontmatter('note')}
# System Definitions

\`_system/\` holds the files that define how this substrate is *shaped*: the closed artifact-type set, the org-structure law, and the admission bar for a new kernel. Nothing here is organizational content. Everything here is the rulebook that content obeys — for **${displayName}** and for every organization nested beneath it.

## What lives here

| File | \`role:\` | Defines |
| ---- | ------- | ------- |
| [[_system/artifact-types]] | \`artifact_types_definition\` | The closed five-type set, the universal frontmatter fields, and the extensibility pattern |
| [[_system/altitude-types]] | \`org_structure_definition\` | The uniform org-subdirectory law and the five altitudes as positional vocabulary |
| [[_system/kernel-criteria]] | \`note\` | The criteria a pattern must clear before it may be called a kernel |

## Substrate vs. content

Every directory in an OCP graph is one of two things, and the underscore prefix tells you which:

| Kind | Prefix | Meaning | Directories |
| ---- | ------ | ------- | ----------- |
| **Substrate** | \`_\` | Definitional. Authored once, versioned, canonical. Changing it changes what is conformant everywhere below. | \`_system/\`, \`_kernels/\`, \`_adrs/\`, \`_users/\` |
| **Content** | none | Organizational reality — the material the definitions govern. | \`notes/\`, \`prompts/\`, \`templates/\`, \`reports/\`, \`initiatives/\`, \`orgs/\` |

The underscore applies to **directories, never to entry-point files**: this file is \`README.md\`, not \`_README.md\`. Two things follow, and both are the point. Substrate sorts to the top of any directory listing, and a reader — human or agent — scanning a tree can separate definitions from content without opening a single file.

The distinction is not decorative. Git holds the substrate; vector indexes, databases, and caches hold **projections** of it. A projection is rendered on demand and is never canonical: if it burns down you re-render it from this repository. If this repository burns down, the organization is gone. That asymmetry is why substrate is versioned markdown and projections are not versioned at all.

## Substrate is graph-level

\`_system/\`, \`_kernels/\`, \`_adrs/\`, and \`_users/\` live **only at the graph root** — the organization whose \`parent_org_id\` is \`null\`, which in this repository is [[README|the root README]]. A child organization under \`orgs/\` never carries its own copy; it inherits these definitions by being in the same graph. That is a property of position, not of privilege: the root hosts substrate because it *is* the root, not because it is a special kind of org.

## Reading order

A first-time operator should be able to read the root README, one kernel definition, and one initiative README and then run a competent operation inside thirty minutes. Complexity beyond that budget is a defect, not a feature. For this directory the fast path is:

1. [[_system/artifact-types]] — what an artifact may be, and how to extend without breaking the closed set. Read this one.
2. [[_system/altitude-types]] — where an organization may sit and which directories it may hold. Read this when you add your first child org.
3. [[_system/kernel-criteria]] — read only when you are proposing a new kernel, which should be rare.

## Editing these files

Changing a definition here changes what is conformant everywhere below it, so the three files carry very different edit costs:

- **Adding a \`role:\` value** to [[_system/artifact-types]] is a normal edit. Roles are the designed extension point; you are expected to add them freely.
- **Adding an artifact type** requires an OCP-amending decision record in [[_adrs/README|_adrs/]]. The set is closed at five.
- **Subsetting** the canonical directory set in [[_system/altitude-types]] is a local choice — omit whatever you do not need. **Extending** it requires an amending decision record.
- **Moving the kernel bar** in [[_system/kernel-criteria]] is itself a decision worth recording. Never lower it silently.

The commit SHA is the authoritative version reference. "Which rules were in force when this was written?" is answered by checking out the commit, not by reading a version field in frontmatter.
`,

    '_system/artifact-types.md': `${frontmatter('artifact_types_definition')}
# Canonical Artifact Types

The canonical artifact set is **closed — five types only**. Every file in this substrate declares exactly one of them in its \`artifact_type:\` key. Extensibility is exactly two open dimensions: \`role:\` discriminates *within* a type, and \`metadata:\` carries user-domain fields that conformant tooling never reads.

Closing the set is what makes the substrate agent-readable. An agent that knows five types knows how to handle every file it will ever meet here — no plugin, no schema registry, no lookup table.

## The five types

| Type | Purpose | Lives In | Write-Author |
| ---- | ------- | -------- | ------------ |
| \`note\` | Authored knowledge: explanations, definitions, rosters, entry points | \`notes/\`, or at a directory root as that directory's \`README.md\` entry point | Human (AI only when explicitly asked) |
| \`adr\` | Architectural decision record: a decision, its context, its consequences | \`_adrs/\` at the graph root; \`adrs/\` for instance-level decisions | Human (AI may draft) |
| \`prompt\` | Agent system prompt — the hydrated instructions an agent runs under | \`prompts/\` | Human (AI drafting common) |
| \`template\` | Renderable template with placeholders, awaiting a fill | \`templates/\` | Human + AI |
| \`report\` | A filled template instance, immutable once written | \`reports/\` | AI agent (typically) |

Two notes on that table. First, \`note\` is the only type with two homes: authored knowledge belongs in \`notes/\`, but every directory's \`README.md\` entry point is also a \`note\` — which is why you can open any directory in this repository and find a file that explains it. Second, \`template\` and \`report\` are a pair: the template is the shape, the report is one rendering of that shape with a specific fill. A report is never edited after it is written; you render a new one.

## Universal frontmatter

Every artifact, of every type, carries:

| Key | Meaning |
| --- | ------- |
| \`artifact_type:\` | One of the five types above. **Closed.** |
| \`role:\` | Discriminator within the type. **Open** — any domain may declare new roles. |
| \`status:\` | Lifecycle state: \`active\`, \`draft\`, \`archived\`, \`deprecated\`. |
| \`tenant:\` | Tenant scope — \`${orgId}\` throughout this substrate unless deliberately narrowed. |
| \`created:\` | RFC3339 timestamp. |
| \`updated:\` | RFC3339 timestamp. |
| \`tags:\` | Array of classification tags. Optional. |
| \`metadata:\` | **Open** sub-object for user-domain fields. Conformant tooling never reads it. |

Organization and user entry points add \`org_id\`, \`display_name\`, \`parent_org_id\`, \`members[]\`, and \`settings{}\`. Artifacts carrying access or provenance add \`visibility\` and \`trust_tier\`.

The human-readable name key is **\`display_name\`**, never \`title\`. A file's H1 line carries the same name for human readers; the frontmatter key is what tooling binds to.

## Extensibility: roles, not types

New concepts are expressed as \`role:\` values on instances of the five types — **never as new types, never as new directories.** A worked set:

| Concept | Wrong | Right |
| ------- | ----- | ----- |
| An offer definition | a new \`offer\` type | \`note\` with \`role: offer_definition\` in \`notes/\` |
| An org entry point | a new \`org\` type | \`note\` with \`role: org_definition\` at the org's \`README.md\` |
| A scorecard an agent fills in | a \`scorecards/\` directory | \`template\` in \`templates/\`; each filled copy is a \`report\` in \`reports/\` |
| A query-derived report | a new type naming the derivation | \`template\` with \`role: report_definition\`; its renders are \`report\` artifacts |

\`metadata:\` is the other half of the extension story. It is an open sub-object holding fields that matter to one domain and to nothing else — service lines, primary contacts, account tier, whatever the organization actually tracks. Conformant tooling reads \`artifact_type:\` and \`role:\` and treats \`metadata:\` as opaque. That contract is precisely what lets you put anything in \`metadata:\` without forking the standard.

## Query-derived reports

A report whose fill comes from a **query over substrate** rather than from a person is declared by a \`template\` carrying \`role: report_definition\` in \`templates/\`. Its renders are ordinary \`report\` artifacts in \`reports/\`. There is no separate type and no separate directory for this.

The reasoning, recorded so it is not reopened: a query-derived report is a *subset* of reports, identified structurally rather than nominally. A report whose definition carries a derivation **is** one by construction, while a hand-authored report has no definition at all. One role on the definition side is therefore sufficient, and no label is needed on the render side. A sixth type for this was proposed and **retired on 2026-07-28**; do not resurrect it. The naming test below is the durable output of that decision.

## The naming test (P16.1)

> A proposed artifact type MUST name **what the artifact is**, not the theory or relationship it participates in. A proposal whose name encodes a relationship — *view-of*, *derived-from*, *snapshot-of*, *projection-of* — is a \`role:\` on an existing type, never a new type.

Apply it at the proposal stage, before anything ships. The worked example is the retirement above: "projection" names a relationship, while "report" names the thing a reader is actually holding. The render was always a report, so the definition is a \`report_definition\`, and \`report_definition\` → \`report\` reads as a matched pair where the relationship-named alternative bolted two vocabularies together. That mismatch is exactly what makes a spurious new directory feel natural when an existing one already holds the same artifacts.

## Extending the set

Adding a sixth type requires an **OCP-amending decision record** in [[_adrs/README|_adrs/]]. Before writing one, run both tests:

1. **The naming test.** Does the proposed name say what the artifact *is*? If it names a relationship, you have found a role.
2. **The identity test.** Is the artifact derivable from existing substrate plus a definition? If so it is a \`template\` with \`role: report_definition\`, and its renders are \`report\` artifacts.

Only when both resolve to "a genuinely new sovereign category" is a sixth type on the table. In practice, five has held.

## The composition rule

A directory is legal only if it is a declared type-home permitted at that position — see [[_system/altitude-types]]. One classification axis per mechanism:

| Axis | Mechanism | Law |
| ---- | --------- | --- |
| Type | Directory | The filesystem encodes artifact type only. Legal directories are the type-homes above plus the structural set (\`orgs/\`, \`initiatives/\`, \`_users/\`, \`_kernels/\`, \`_adrs/\`, \`_system/\`) and \`README.md\` entry points. |
| Role | Frontmatter | New concepts are \`role:\` values on the closed types — never new types, never new directories. |
| Prominence | README index | Centrality is declared in the org README's Core Canon block, never encoded as a path. |

So when a new concept arrives the question is never "which directory does this need?" but "which of the five types, and which role?" Stateful runtime data never lives in git at all; it stays in its owning system and is referenced from here by pointer. Git is for natural language; systems are for data.
`,

    '_system/altitude-types.md': `${frontmatter('org_structure_definition')}
# Canonical Org Structure

Two laws govern where things live.

**The uniform subdirectory law.** Every organization — at every altitude, at any depth — permits the same canonical set of subdirectories. Capability does not change structure.

**The composition rule.** A directory is legal only if it is a declared type-home ([[_system/artifact-types]]) permitted at that position. An organization may **subset** the canonical set — omit anything not needed — but may never **extend** it. Extending the canonical set requires an OCP-amending decision record in [[_adrs/README|_adrs/]].

## AMENDED 2026-07-21 — the \`org_type\` field is retired

> The frontmatter field formerly named \`org_type\` **no longer exists and must never be authored.** An earlier model gave each altitude its own enumerated type with its own permitted-subdirectory list, encoding a fixed tier ladder. That model is retired.
>
> **Capabilities are data, not canon.** Whether an organization acts as an agency, a brand, a reseller, or all three is recorded as ordinary facts — \`metadata:\` fields and Core Canon rows — not as a type in the taxonomy. An org can gain or lose a capability without changing what kind of thing it is.
>
> **Nor does altitude replace it.** The retirement took the whole axis out of frontmatter, not just the field name: never author \`altitude:\` either, at the top level or under \`metadata:\`. An altitude is something you say about an organization, never something an artifact declares.
>
> **The only structural distinction that survives is root vs. child**, keyed on \`parent_org_id == null\`. The root hosts the graph-level substrate directories; every other organization does not. That is the whole of it.

If you are porting notes or tooling from an older OCP substrate, delete the field outright. Do not translate it into a \`role:\` value: the information it carried is either already expressible in \`metadata:\` or was never load-bearing.

## The uniform org subdirectory set

| Entry | Required | Purpose |
| ----- | -------- | ------- |
| \`README.md\` | **Yes** | The org entry point, \`role: org_definition\`. Carries the Core Canon block. |
| \`initiatives/\` | No | Goal-directed work per the Initiative Kernel ([[_kernels/initiative]]). |
| \`notes/\` | No | Authored knowledge belonging to this org. |
| \`orgs/\` | No | Child organizations, nested to any depth. |
| \`prompts/\` | No | Org-standing agent prompts. |
| \`templates/\` | No | Renderable templates, including \`role: report_definition\`. |
| \`reports/\` | No | Rendered report instances. |
| \`decisions.md\`, \`log.md\` | No | Recognized convention files: rolling decisions, and an operational ledger. |

**The graph root additionally** hosts the shared substrate directories — \`_system/\`, \`_adrs/\`, \`_kernels/\`, \`_users/\` — because it is the root of the whole graph (\`parent_org_id: null\`), **not** by a type privilege. Substrate is graph-level, never per-org; a child org never carries it.

**User directories** (\`_users/<id>/\`) are principals, not orgs. They permit \`README.md\` (required, \`role: user_definition\`), \`memberships.md\`, \`initiatives/\`, and \`notes/\`. A principal may belong to organizations at any position — see [[_users/README|_users/]].

The permitted set governs **directories only**. Convention *files* are governed by their own conventions: \`README.md\` is the required entry point at every directory level, and \`memberships.md\` is the user-directory membership file. Such files are legal wherever their convention applies and are not extensions of the directory set. There is **no \`index.md\` anywhere in OCP** — the entry point is always \`README.md\`, and its \`role:\` declares what the directory is for.

## The five altitudes

Altitudes are **descriptive vocabulary for positions a designer may occupy** — not a required ladder, not a path you encode, and not a field you author. They are how you *talk* about the shape of a tree while planning it; no artifact records an altitude, and no tool reads one. The table below is a planning aid, not a schema.

| Altitude | Definition | Typical use |
| -------- | ---------- | ----------- |
| \`platform\` | The top-level organization in the repository. By convention it sits at the repository root with no wrapper directory, and owns the graph-level substrate. | A SaaS vendor publishing a canonical kernel set. An open-source framework publishing its definitions. One operator's personal AI operating system. |
| \`tenant\` | An organization operating the platform under its own brand or licensing arrangement. | A white-label reseller. A multinational's regional division. A franchise operator running several brand instances. |
| \`agency\` | An organization performing services or programmatic work on behalf of paying customers. Runs initiatives both for itself and for its accounts. | A marketing agency. A consulting firm. A managed services provider. An AI-orchestrated services company. |
| \`account\` | The unit of customer relationship for an agency — the entity being served, with its own operations, audiences, and offers. | A client of an agency. A customer of a managed services provider. (Engineering says "account"; the customer-facing label is usually "client".) |
| \`user\` | An individual human or service principal with credentials. Cross-cutting: users live at the graph root under \`_users/<id>/\`, never nested inside one org. | A platform admin. An agency operator. An account staff member with portal access. A personal agent user. |

## The minimal-altitudes principle

Construct only the altitudes you need. Three shapes cover nearly everyone.

**Solo builder — \`platform\` → \`user\` (two altitudes).** The repository *is* the platform org; the operator is the user. No \`orgs/\` tree at all until there is something to put in it. Most first substrates should start here.

\`\`\`
${orgId}/  <- platform  (parent_org_id: null)
├── README.md
├── _system/  _kernels/  _adrs/
├── _users/${userId}/  <- user
│   └── README.md
├── initiatives/
└── notes/
\`\`\`

**Direct agency — \`platform\` → \`agency\` → \`account\` (three altitudes).** The repository is the agency's own substrate; accounts are child orgs under \`orgs/\`. No reseller layer, because there is no reseller.

\`\`\`
${orgId}/  <- platform, holding the agency capability
├── README.md
├── initiatives/
└── orgs/
    └── <child-org-id>/  <- account
        ├── README.md
        └── notes/
\`\`\`

**White-label — \`platform\` → \`tenant\` → \`agency\` → \`account\` (four altitudes).** The platform is the licensing position, the tenant is the reseller's brand, agencies operate under the tenant, accounts sit under the agencies.

\`\`\`
${orgId}/  <- platform
└── orgs/
    └── <reseller-id>/  <- tenant
        └── orgs/
            └── <agency-id>/  <- agency
                └── orgs/
                    └── <child-org-id>/  <- account
\`\`\`

Notice what does *not* change between these shapes: the directory names, the frontmatter keys, and the entry-point convention are identical at every node. That uniformity is the reason an agent that can operate one organization can operate any of them, at any depth, without being told which shape it is in.

## Growth is insertion, never migration

The structure scales by **adding nodes**, never by restructuring existing ones. A direct agency that starts white-labeling slots its existing subtree under a new parent org: a directory level appears above it and **not a single file moves**. Every path inside the subtree keeps its shape; only the prefix lengthens. The single field that changes is the subtree root's \`parent_org_id\`, which stops being \`null\` and starts naming its new parent.

This is the productization invariant operating at the organizational layer: the substrate you author on day one for yourself is the substrate you operate at scale, unchanged. If a growth story appears to require moving files, you have found a modeling error, not a migration.
`,

    '_system/kernel-criteria.md': `${frontmatter('note')}
# Kernel Admission Criteria

A **kernel** is a universal primitive for a category of organizational work: a definition general enough that every organization can instantiate it, and stable enough to be worth authoring once and living with for years. Kernels are deliberately heavyweight. This file is the bar a pattern must clear before it may be called one.

Today **exactly one kernel is canonical**: the Initiative Kernel, at [[_kernels/initiative]]. That is not an oversight or a list waiting to be filled in — it is the expected steady state.

## Why the bar exists

Without an admission bar, every feature gets called a kernel. The failure mode is predictable and fast: a "Campaign Kernel" here, a "Hiring Kernel" there, a "Content Kernel" for the marketing team, and within a quarter the substrate carries six overlapping work models that agents must special-case and humans must translate between. The uniformity that made the substrate agent-readable is gone, and every consumer now maintains a dispatch table.

The bar is the defense. Most good ideas turn out to be \`role:\` values on the five artifact types ([[_system/artifact-types]]), or a template, or a plain convention. Very few are kernels, and these criteria are written to make that the default outcome rather than the exception.

## The criteria

All must hold. Failure on any single criterion means the pattern is **not** a kernel.

| # | Criterion | The test |
| - | --------- | -------- |
| 1 | **Universally applicable** | Applies across altitudes and business domains. A solo operator and a four-altitude white-label graph both instantiate it, and neither has to pretend. |
| 2 | **Substrate-independent** | Not tied to a channel, vendor, or technology. If swapping a tool would invalidate the definition, you have a template, not a kernel. |
| 3 | **Agent-readable without translation** | Markdown plus YAML frontmatter. An agent reads the definition and operates. No parsing library, no schema server, no glossary. |
| 4 | **Three independent use cases** | At least three *demonstrably independent* uses — not one use case described three ways. Independence means each case would still stand if you deleted the other two. |
| 5 | **Stable multi-year lifespan** | Grounded in a first principle about how organizations actually work, not in how yours works this year. Expect five-plus years of stability. |
| 6 | **Composable, not subsumable** | Cannot be expressed as instances of an existing kernel. If the Initiative Kernel already models it, you have found a \`role:\`. |
| 7 | **A full decision record** | The proposal ships with an ADR in [[_adrs/README|_adrs/]] recording context, alternatives considered, and consequences. If the benefit does not justify writing that record, it does not justify the kernel. |

## How to run the bar

1. **Write the three use cases first**, before the definition. If you cannot name three independent ones drawn from real work, stop — criteria 4 and 5 will fail together, and later.
2. **Try to express it as a role.** Attempt an honest modeling on the five artifact types and the Initiative Kernel. Most proposals resolve here, and resolving here is a success, not a defeat.
3. **Hand the draft definition to an agent cold.** No preamble, no explanation. If the agent needs you to explain the definition, criterion 3 has failed.
4. **Write the decision record.** Only then propose it.

## What is not a kernel

Concrete examples of things that feel kernel-shaped and are not:

| Proposal | What it actually is |
| -------- | ------------------- |
| A campaign model | A \`role:\` on initiative-kernel work units — a campaign is a project at account altitude. |
| A scorecard system | A \`template\` in \`templates/\`; each filled copy is a \`report\` in \`reports/\`. |
| A recurring weekly digest | A \`template\` with \`role: report_definition\`; its renders are \`report\` artifacts. |
| An onboarding checklist | An initiative instance with tickets. The Initiative Kernel already models it. |
| A CRM schema | Not substrate at all. Stateful runtime data stays in its owning system and is referenced from here by pointer. |

That last row generalizes: git is for natural language, systems are for data. A pattern that is really a data model does not become a kernel by being written in markdown.

## If it passes

A new kernel is defined as a \`note\` carrying \`role: kernel_definition\` in [[_kernels/README|_kernels/]], landing in the same commit as the decision record that admitted it. Read [[_kernels/initiative]] first: it is the worked example of what a kernel definition looks like once it clears this bar, and matching its shape is most of the authoring work.
`,
  };
};
