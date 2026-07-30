'use strict';

/**
 * Content-directory templates for `create-ocp`.
 *
 * Emits the un-prefixed content trees (notes, prompts, templates, reports,
 * initiatives, orgs) and the cross-cutting `_users/` tree. Every directory gets
 * a README.md entry point whose `role:` declares that directory's purpose
 * (OCP P20, README-as-index). There is no index.md anywhere in OCP.
 *
 * All timestamps come from `ctx.now` so the same inputs always produce
 * byte-identical output.
 */

/** `bingo-jets` -> `Bingo Jets`. Deterministic, no locale dependence. */
function humanize(id) {
  return String(id)
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/** `2026-07-30T00:00:00Z` -> `2026-07-30`, for as-of anchors in prose tables. */
function asOfDate(now) {
  return String(now).slice(0, 10);
}

module.exports = function contentFiles(ctx) {
  const orgId = ctx.orgId;
  const displayName = ctx.displayName;
  const userId = ctx.userId;
  const now = ctx.now;
  const today = asOfDate(now);
  const childOrgId = ctx.childOrgId;
  const childDisplayName = ctx.childOrgDisplayName;
  const initiativeId = ctx.initiativeId;
  const initiativeDisplayName = humanize(initiativeId);
  const userDisplayName = humanize(userId);

  const files = {};

  // ---------------------------------------------------------------- notes/

  files['notes/README.md'] = `---
artifact_type: note
role: note
status: active
tenant: ${orgId}
created: ${now}
updated: ${now}
---

# Notes

Authored knowledge for ${displayName}. A \`note\` is the org's durable prose — the thing a person wrote down once so that nobody has to reconstruct it from memory or from a chat log.

## What belongs here

| Kind | Example filename | What it holds |
| ---- | ---------------- | ------------- |
| SOP | \`client-onboarding-sop.md\` | A repeatable procedure, written for someone doing it the first time |
| Definition | \`qualified-lead.md\` | A term this org binds to exactly one meaning |
| Roster | \`team-roster.md\` | The current cast: people, systems, services |
| Principle | \`how-we-decide.md\` | A rule of thumb that outlives any one project |
| Entity record | \`clients/northwind.md\` | One durable thing the org tracks |

## Conventions

- **Notes are the living type.** Edit them in place. Git history is the version record — the commit SHA is the authoritative version reference (P8). Nothing here is frozen, unlike a [[reports/README|report]], which is corrected by writing a new one rather than by editing.
- **One subject per file.** If a note needs a second H1, it is two notes.
- **Name by subject, in kebab-case.** Not by author, not by date — dates belong on reports.
- **Discriminate with \`role:\`, not with new directories.** Every file here is \`artifact_type: note\`; \`role: sop\`, \`role: definition\`, \`role: client_record\` tell an agent what kind it is. The five artifact types are closed; roles are open — see [[_system/artifact-types|artifact types]].
- **Facts the whole org binds to get a Core Canon row** in the [[README|root README]], not a prominent path. Prominence is declared, never encoded as directory structure.
`;

  // -------------------------------------------------------------- prompts/

  files['prompts/README.md'] = `---
artifact_type: note
role: note
status: active
tenant: ${orgId}
created: ${now}
updated: ${now}
---

# Prompts

Agent system prompts for ${displayName}. A \`prompt\` is substrate like anything else: authored, reviewed, versioned in git, and readable by a human before it is ever handed to a model.

## The hydration rule (P18)

Agents are **stateless renderers**. An agent remembers nothing between runs, so a prompt must carry everything the run needs — the notes it reads from, the template it fills, the org it is acting for, and the altitude it is acting at. A prompt that only works because the last operator happened to have context in their session is a broken prompt.

Write the hydration explicitly. A workable shape:

\`\`\`markdown
## Hydration
- Org: ${orgId}
- Read first: [[notes/README|notes/]] client-onboarding-sop.md
- Fill: templates/weekly-status.md
- Write to: reports/
\`\`\`

## Conventions

- **Reference, do not restate.** A prompt points at [[notes/README|notes]] and [[templates/README|templates]]; it never copies their contents, or the copy drifts from the source.
- **Version by commit, and say which version you ran.** When an agent produces a [[reports/README|report]], the report records the prompt path and the commit it ran at.
- **Use \`role:\` for the agent's job** — \`role: research_agent\`, \`role: intake_agent\` — so a prompt library stays browsable as it grows.
- **Trust does not launder.** If a prompt pulls in a low-trust source, everything derived from it inherits that low trust, no matter how many model hops it passes through. Say so in the prompt.
`;

  // ------------------------------------------------------------ templates/

  files['templates/README.md'] = `---
artifact_type: note
role: note
status: active
tenant: ${orgId}
created: ${now}
updated: ${now}
---

# Templates

Renderable documents with placeholders, shared across every agent and operator at ${displayName}. A \`template\` is the blank; its filled instances are [[reports/README|reports]].

## Two kinds of fill

| \`role:\` | Who fills it | Example |
| ------- | ------------ | ------- |
| any domain role (e.g. \`role: status_template\`) | a person, or an agent working from a person's input | a weekly status page, a call scorecard, a meeting agenda |
| \`role: report_definition\` | a **query over the substrate** — nobody types the answers | "every active initiative and its KPI deltas", "every org missing a Core Canon row" |

A \`report_definition\` is still an ordinary \`template\` artifact living in this directory. It declares what to select from the substrate and how to lay the result out; its renders land in \`reports/\` as \`report\` artifacts. It is a projection: rendered on demand, never canonical, disposable. The substrate it reads from is the canon.

## Conventions

- **Placeholders are explicit and named** — \`{{org_id}}\`, \`{{as_of}}\` — never "fill this in".
- **A template names its report's \`role:\`** so a renderer knows what it is producing.
- **Every number a report emits is anchored** to an as-of date and a source, so the template must have slots for both.
- **Templates are edited freely; their renders are not.** Changing a template never rewrites history — old reports keep the shape they were rendered with.
`;

  // -------------------------------------------------------------- reports/

  files['reports/README.md'] = `---
artifact_type: note
role: note
status: active
tenant: ${orgId}
created: ${now}
updated: ${now}
---

# Reports

Filled instances of [[templates/README|templates]] — the operational log of ${displayName}. This directory answers "what actually happened, and when did we know it".

## Immutability

**A report is immutable once written.** If it is wrong, write a new report that supersedes it; never edit the original. The record of having been wrong is itself information — it is how an operator learns that a metric moved because reality moved, or because the measurement did.

Supersession is declared in frontmatter, not in prose:

\`\`\`yaml
artifact_type: report
role: weekly_status
supersedes: reports/2026-07-23-weekly-status.md
as_of: ${today}
\`\`\`

## Conventions

- **Operations produce artifacts (P19).** No work that disappears: if an agent ran, a report exists. A run that left nothing behind did not happen as far as the substrate is concerned.
- **Name by date, then subject** — \`${today}-weekly-status.md\` — because reports are read chronologically.
- **Record provenance:** which [[prompts/README|prompt]], which [[templates/README|template]], and the commit SHA each was read at (P8).
- **Carry the trust tier of the lowest-trust input.** Derivation does not launder trust; a confident summary of an unverified source is still unverified.
`;

  // ---------------------------------------------------------- initiatives/

  files['initiatives/README.md'] = `---
artifact_type: note
role: note
status: active
tenant: ${orgId}
created: ${now}
updated: ${now}
---

# Initiatives

Instances of the [[_kernels/initiative|Initiative Kernel]] for ${displayName} — the only canonical kernel, and the universal primitive for goal-directed work.

Every work unit under this directory declares a \`tier_type\`:

| \`tier_type\` | Horizon | Carries |
| ----------- | ------- | ------- |
| \`initiative\` | quarter or year | a goal and its measurement (KPIs) |
| \`project\` | sprint or month | a definition of done |
| \`ticket\` | hours or days | binary completion |
| \`sub-ticket\` | optional | a decomposition of one ticket |

How deep you go is a per-organization choice. Small orgs stop at projects; nobody is required to create tickets in git for work a person can hold in their head.

## Layout

\`\`\`
initiatives/<initiative-id>/
├── README.md              (tier_type: initiative — the entry point)
├── projects/<project-id>/
│   └── README.md          (tier_type: project)
├── notes/  prompts/  templates/  reports/
\`\`\`

## Start here

- [[initiatives/${initiativeId}/README|${initiativeDisplayName}]] — a worked example you can run today, then replace.
`;

  // ------------------------------------------- initiatives/<id>/README.md

  files['initiatives/' + initiativeId + '/README.md'] = `---
artifact_type: note
role: kernel_index
kernel_id: initiative
tier_type: initiative
initiative_id: ${initiativeId}
display_name: ${ctx.initiativeDisplayNameYaml}
status: active
tenant: ${orgId}
parent_org_id: ${orgId}
created: ${now}
updated: ${now}
journey_goals:
  - "Every directory declares its purpose in a README entry point"
  - "The root README's Core Canon block resolves the org's foundational facts"
  - "A first-time operator runs a real operation in under thirty minutes"
---

# ${initiativeDisplayName}

A worked example of the [[_kernels/initiative|Initiative Kernel]] at \`tier_type: initiative\` — the top tier, which carries a goal and the measurement that proves it. The goal below is deliberately self-demonstrating: **stand up this substrate itself** so that someone who has never seen ${displayName} can read it and do useful work. Run it once; then replace it with the initiative your organization actually cares about.

## Goal

Make ${displayName}'s context substrate operable by a stranger — human or agent. Concretely: every directory declares what it is for, the facts that matter are reachable from the [[README|root README]]'s Core Canon block, and at least one real operation has been run end to end and left an artifact behind.

## Measurement

Initiatives carry KPIs; a number is only canon-legal when anchored to an as-of date and a source, so every row carries both.

| Metric | Baseline | Target | As of | Source |
| ------ | -------- | ------ | ----- | ------ |
| Directories with a README entry point | 100% (scaffolded) | 100% (held as the tree grows) | ${today} | this repository |
| Core Canon rows in the root README | 0 | 5 or more | ${today} | [[README\\|root README]] |
| Notes an operator would actually reuse | 0 | 5 or more | ${today} | [[notes/README\\|notes/]] |
| Agent loops that end in a written report | 0 | 1 or more | ${today} | [[reports/README\\|reports/]] |
| Minutes for a first-time operator to run a competent operation | unmeasured | 30 or fewer | ${today} | timed walkthrough, recorded as a report |

That last row is the quality bar (P21). If getting oriented costs more than thirty minutes, the excess complexity is a defect to be removed — not documentation to be added.

## Definition of Done

The kernel places \`definition_of_done\` at the **project** tier, so each project below restates its own slice. The initiative closes when all three are met and the KPI targets above hold on a second measurement:

- Every directory in the tree has a README whose \`role:\` says what the directory is for.
- The root Core Canon block resolves at least five foundational facts by namespace and key — no more "None declared yet."
- One agent has run against a prompt in this repo and left a report behind, and a second person has reproduced that run from the substrate alone.

## Projects

Create each as \`projects/<project-id>/README.md\` with \`tier_type: project\` when you begin it. Three are enough to finish this initiative:

| Project | Definition of done |
| ------- | ------------------ |
| \`projects/seed-the-canon/\` | Five real notes exist and five Core Canon rows point at them. |
| \`projects/first-agent-loop/\` | One prompt plus one template produced one report, with provenance recorded. |
| \`projects/onboard-a-second-operator/\` | A second person ran a competent operation from the substrate alone, timed, and the timing was written up as a report. |

## How to run this

The whole orientation path, in order — this is the thirty minutes:

1. Read the [[README|root README]]: what this organization is, and its Core Canon block.
2. Read [[_kernels/initiative|the Initiative Kernel]]: what a work unit is and what each tier carries.
3. Read this file: the goal, the measurement, the projects.
4. Pick the first project, create \`projects/seed-the-canon/README.md\` with \`tier_type: project\` and its definition of done, and do the work.
5. When the work produces something — a decision, a number, a run — write it down. A [[notes/README|note]] if it is knowledge, a [[reports/README|report]] if it is an event. Operations produce artifacts (P19); nothing valuable is allowed to evaporate.
6. Commit. The commit SHA is the version reference (P8); there is no separate version field to bump.

If step 1 through 3 took longer than thirty minutes, that is the finding — record it as a note and simplify whatever cost the time.
`;

  // ----------------------------------------------------------------- orgs/

  files['orgs/README.md'] = `---
artifact_type: note
role: note
status: active
tenant: ${orgId}
created: ${now}
updated: ${now}
---

# Organizations

Child organizations of ${displayName}. **This directory is where the recursion begins.**

The repository root is itself an organization — the graph root, the one with \`parent_org_id: null\`. Every organization, root or child, may contain an \`orgs/\` directory holding further organizations, to any depth. The structure is uniform: a child org has the same canonical subdirectories as its parent (\`notes/\`, \`prompts/\`, \`templates/\`, \`reports/\`, \`initiatives/\`, \`orgs/\`), and may omit any it does not need — subset, never extend.

## Altitude is declared, not encoded

OCP names five altitudes — platform, tenant, agency, account, user. They are **positional vocabulary**, not directory levels and not a type ladder. A child organization's altitude is declared in its own README frontmatter; you cannot read it off the path, and you must never try. Two orgs at the same depth may sit at different altitudes, and that is legal. See [[_system/altitude-types|altitude types]].

The only structural distinction that survives is **root versus child**, keyed on \`parent_org_id == null\`. Substrate directories (\`_system/\`, \`_adrs/\`, \`_kernels/\`, \`_users/\`) exist only at the graph root, because they are graph-level — never per-org.

## Adding a child organization

Create \`orgs/<org-id>/README.md\` with \`role: org_definition\` and \`parent_org_id: ${orgId}\`, then give it whichever canonical subdirectories it needs.

**Deliberately, this file does not list the children.** A hand-authored index of child organizations is a disclosure leak: this directory's own entry point is readable by every member of the organization, so naming the children here would tell a member of one child organization that the others exist, and what they are called. An index of children must be **derived per viewer** from the access-scoped projection, never authored into a file that outranks the boundary it would expose. The children are discoverable by walking \`orgs/\` with the reader's own grants applied — which is what a conformant renderer does.
`;

  // -------------------------------------------- orgs/<childOrgId>/README.md

  files['orgs/' + childOrgId + '/README.md'] = `---
artifact_type: note
role: org_definition
org_id: ${childOrgId}
display_name: ${ctx.childOrgDisplayNameYaml}
parent_org_id: ${orgId}
status: active
tenant: ${orgId}
created: ${now}
updated: ${now}
members: []
settings:
  timezone: UTC
  default_language: en
metadata: {}
---

# ${childDisplayName}

A child organization of ${displayName}. Replace this description with what ${childDisplayName} actually is — a client account, a business unit, a subsidiary agency, a product line. Whatever it represents, the substrate treats it identically: an organization is an organization at every altitude.

Its altitude is declared here in frontmatter, never inferred from where this directory sits. Its parent is \`${orgId}\`; if it ever grows children of its own, they go under \`orgs/\` right here and the recursion continues unchanged.

## Structure

${childDisplayName} permits exactly the same canonical subdirectories as its parent:

\`README.md\` (required — this file) · \`notes/\` · \`prompts/\` · \`templates/\` · \`reports/\` · \`initiatives/\` · \`orgs/\`

Only [[orgs/${childOrgId}/notes/README|notes/]] is scaffolded; create the others when you have something to put in them. Omitting a directory you do not need is correct. Inventing one that is not in the canonical set is not — that requires an OCP-amending ADR. Substrate directories (\`_system/\`, \`_adrs/\`, \`_kernels/\`, \`_users/\`) never appear here: they live only at the graph root.

## Core Canon

Foundational facts for this organization. Consumers bind by Namespace + Key; only this table carries locations. Rows update in the same commit as the artifacts they point at.

None declared yet.

## Access

Access to this subtree is **derived from position** — a path-prefix decision, walking up from the artifact being read to the organization that controls it. There is no separate permission file to keep in sync.

- A member of **${childDisplayName}** reaches this subtree and nothing above it. Non-admin roles require explicit membership at each altitude and **never cascade**: membership here grants nothing at ${displayName}, and nothing at a sibling organization.
- An **admin of ${displayName}** reaches this subtree without appearing in the empty \`members:\` list above, because **admin authority cascades downward** to every descendant organization, at any depth.

Membership is declared on the user, not here in prose — see [[_users/${userId}/memberships|the seeded memberships file]].
`;

  // -------------------------------------- orgs/<childOrgId>/notes/README.md

  files['orgs/' + childOrgId + '/notes/README.md'] = `---
artifact_type: note
role: note
status: active
tenant: ${orgId}
created: ${now}
updated: ${now}
---

# ${childDisplayName} Notes

Authored knowledge scoped to [[orgs/${childOrgId}/README|${childDisplayName}]]: procedures, definitions, rosters, and entity records that are true here and not necessarily true at ${displayName}.

Same conventions as the parent org's [[notes/README|notes/]] — one subject per file, kebab-case names, \`role:\` to discriminate. Knowledge that is true for every organization belongs upward, at the parent, not copied down into each child.
`;

  // -------------------------------------------------------------- _users/

  files['_users/README.md'] = `---
artifact_type: note
role: note
status: active
tenant: ${orgId}
created: ${now}
updated: ${now}
---

# Users

Identities — human operators and service principals — for this whole graph.

## Why users live at the root

Users are **cross-cutting**. The same person may be an admin of ${displayName}, a member of [[orgs/${childOrgId}/README|${childDisplayName}]], and an operator on an initiative somewhere else entirely. Nesting a user under one organization would force a choice about which of those relationships is the "real" one, and would distort every other. So identity lives once, at the graph root, and *relationships* are declared separately in each user's \`memberships.md\`.

This is why \`_users/\` is an underscore-prefixed directory: it is substrate — graph-level machinery, like \`_system/\`, \`_adrs/\` and \`_kernels/\` — rather than content owned by any one organization.

## Layout

\`\`\`
_users/<user-id>/
├── README.md         (role: user_definition — identity and profile)
├── memberships.md    (which orgs, at which roles)
├── notes/            (optional — knowledge this principal owns)
└── initiatives/      (optional — personal goal-directed work)
\`\`\`

A user directory is a principal, not an organization: it carries no \`orgs/\` and no Core Canon block.

## Users

- [[_users/${userId}/README|${userDisplayName}]] — seeded as admin of ${displayName}.
`;

  // ------------------------------------------------- _users/<id>/README.md

  files['_users/' + userId + '/README.md'] = `---
artifact_type: note
role: user_definition
user_id: ${userId}
display_name: ${ctx.userDisplayNameYaml}
status: active
tenant: ${orgId}
created: ${now}
updated: ${now}
---

# ${userDisplayName}

Identity record for \`${userId}\`, a principal in the ${displayName} graph. Replace the profile below with the real thing — this file is what an agent reads to know who it is acting for or acting as.

## Profile

| Field | Value |
| ----- | ----- |
| User ID | \`${userId}\` |
| Display name | ${userDisplayName} |
| Kind | human operator (use \`service principal\` for an agent or integration identity) |
| Since | ${today} |

## Working context

Useful things to record here, because a stateless agent cannot infer them: how this person prefers to be addressed, their timezone and working hours, which decisions they own outright, and which they only advise on. Keep it short and true; a profile that has quietly gone stale is worse than none.

## Memberships

Which organizations this principal belongs to, and at what role, is declared in [[_users/${userId}/memberships|memberships]] — not here, and not in any org's README.

A user directory may also carry \`notes/\` for knowledge this principal owns and \`initiatives/\` for personal goal-directed work, using the same [[_kernels/initiative|Initiative Kernel]] as any organization.
`;

  // -------------------------------------------- _users/<id>/memberships.md

  files['_users/' + userId + '/memberships.md'] = `---
artifact_type: note
role: note
user_id: ${userId}
status: active
tenant: ${orgId}
created: ${now}
updated: ${now}
---

# ${userDisplayName} — Memberships

Which organizations [[_users/${userId}/README|${userDisplayName}]] belongs to, and at which role. This table is the source of truth; no organization README restates it.

| Organization | Role | Since |
| ------------ | ---- | ----- |
| \`${orgId}\` (graph root) | admin | ${today} |

## How authorization is decided

Authorization is a **path-prefix decision**. To decide whether this principal may read or write an artifact, walk up from that artifact's path to the nearest organization that controls it, and check this table against that organization and every organization above it. Two rules, and they are not symmetric:

- **Admin authority cascades downward.** An admin of an organization is automatically an admin of all of its descendants, at any depth. The row above therefore grants ${userDisplayName} admin over ${displayName} *and* over [[orgs/${childOrgId}/README|${childDisplayName}]] and anything nested beneath it — with no additional row and no entry in those orgs' \`members:\` lists.
- **Non-admin roles never cascade.** Every other role — member, editor, viewer, whatever an adopter defines — requires an explicit row at each altitude where it applies. Being a member of a parent grants nothing in a child; being a member of a child grants nothing in the parent, and nothing in a sibling.

The practical consequence: grant admin high and sparingly, grant everything else exactly where it is needed. Adding a row here is the only way to widen access — access is never conferred by editing an artifact, by moving a directory, or by an agent asserting it has permission.

## Adding a membership

Append a row naming the organization by its \`org_id\`, the role, and the date the grant took effect. Removing access means deleting the row and committing — git history preserves that the grant existed and when it ended, which is exactly the audit trail you want.
`;

  return files;
};
