'use strict';

// Kernel substrate: the `_kernels/` definitions and the `_adrs/` entry point.
//
// These are the two platform-substrate directories a new graph root needs on day
// one. `_kernels/` answers "what shape does goal-directed work take here"; `_adrs/`
// answers "how did we decide that, and how does it change". Both are pure functions
// of ctx so the same inputs always produce byte-identical output (no Date.now()).

module.exports = function kernelFiles(ctx) {
  const { orgId, displayName, now, initiativeId } = ctx;

  const kernelsReadme = `---
artifact_type: note
role: kernel_index
status: active
tenant: ${orgId}
created: ${now}
updated: ${now}
tags: [kernel, index, substrate]
---

# Kernels

A **kernel** is the canonical content shape an organizational concern requires. It declares what an
instance of that concern must carry — which frontmatter fields, which tiers, which directories — and
says nothing about the tool that renders it, the database that mirrors it, or the agent that reads
it. The shape is the contract. Everything downstream binds to the shape.

This directory holds kernel *definitions*. Kernel *instances* live in content directories: an
initiative instance under any org's \`initiatives/\`, a personal one under \`_users/<id>/initiatives/\`.
The definition is substrate, authored once and versioned; the instances are the organization's actual
work. Start at [[_kernels/initiative|the Initiative Kernel]], then look at
[[initiatives/${initiativeId}|the example initiative]] to see the same shape populated.

## The hexagonal analogy

Kernels are to organizational content what ports are to hexagonal architecture. A concern declares
the shape it requires; implementations bind to it from the outside and stay replaceable.

| Hexagonal architecture | OCP |
| ---------------------- | --- |
| **Port** — the interface a concern requires | **Kernel** — the content shape a concern requires |
| **Use case** — one implementation satisfying that interface | **Kernel instance** — one populated initiative, project, or ticket |
| **Adapter** — binds the port to a specific technology | **Renderer or integration** — a wiki, a vector index, a dashboard, an agent |

The payoff is the same one hexagonal architecture buys: the shape survives every adapter. Swap the
renderer, change the agent, rebuild the index — the substrate does not move. This is the governing
axiom applied to work itself. The kernel and its instances are sovereign substrate, authored once and
versioned in git. Every adapter is a derived projection: rendered on demand, never canonical, safe to
delete because it can always be rebuilt from the substrate that produced it.

## Kernels are deliberately rare and heavyweight

A kernel is not a convention, a folder layout, or a nice idea about how to organize work. Admitting
one is a constitutional act: from that point on, every conformant tool and every agent operating on
this graph must understand it. That cost is paid forever, so the bar is set where few things clear it.

A candidate must be **universally applicable** across altitudes and domains, **substrate-independent**
(bound to no vendor, channel, or technology), **agent-readable without translation** (markdown plus
YAML frontmatter, no parsing library), backed by **at least three genuinely independent use cases**
(the rule of three — two is a coincidence), and expected to hold **stable for years** because it
encodes something true about reality rather than something true about this quarter's tooling.

The full admission checklist is [[_system/kernel-criteria|_system/kernel-criteria.md]]. Failing a
single criterion means the pattern is not a kernel. That is the normal outcome, and it is fine: most
recurring shapes are better expressed as a \`role:\` value on one of the five artifact types in
[[_system/artifact-types|_system/artifact-types.md]], which costs nothing and requires no amendment.

## Exactly one kernel is canonical today

| Kernel | Definition | Covers |
| ------ | ---------- | ------ |
| Initiative Kernel | [[_kernels/initiative|_kernels/initiative.md]] | Goal-directed work at any altitude, as a recursive multi-tier work unit |

One kernel is the expected steady state, not a gap waiting to be filled. If a concern feels like it
needs its own kernel, first try to express it as an initiative instance with domain-specific
\`role:\` values and \`metadata:\` fields. A client-acquisition campaign, a support program, and an
internal ops push all reduce to the Initiative Kernel; most candidates do.

## Adding a kernel

Adding a second kernel amends OCP and therefore requires an accepted ADR that walks the criteria
one at a time and names the three independent use cases explicitly. Draft it in
[[_adrs/README|_adrs/]], and only after the ADR is accepted does the definition file land here.

## Conventions in this directory

- One definition per file, named for the kernel id: \`_kernels/<kernel-id>.md\`.
- Every definition carries \`role: kernel_definition\` and a \`kernel_id:\` matching its filename.
- \`_kernels/\` is underscore-prefixed because it is platform substrate and lives only at the graph
  root. A child org never carries it — it inherits the graph's kernels by being in the graph.
- This \`README.md\` is the directory's entry point. There is no \`index.md\` anywhere in OCP.
`;

  const initiativeKernel = `---
artifact_type: note
role: kernel_definition
kernel_id: initiative
kernel_name: "Initiative Kernel"
kernel_short_description: "Goal-directed work as a recursive multi-tier work unit"
version: 1.0
status: active
tenant: ${orgId}
created: ${now}
updated: ${now}
tags: [kernel, initiative, work-unit]
altitude_binding:
  permitted: [platform, tenant, agency, account, user]
  forbidden: []
  description: "Initiatives may be instantiated at any altitude"
tier_types:
  initiative:
    description: "Top-level goal-directed program carrying goals and measurement"
    enabled_fields: [journey_goals, kpis, allocation_strategy]
    entry_point_file: README.md
  project:
    description: "Scoped effort contributing to an initiative"
    enabled_fields: [definition_of_done, project_lead, estimated_completion]
    entry_point_file: README.md
  ticket:
    description: "Atomic unit of work with binary completion"
    enabled_fields: [assignee, due_date, priority, dependencies]
    entry_point_file: null
  sub_ticket:
    description: "Decomposition of a ticket that proved too large to complete in one pass"
    enabled_fields: [assignee, due_date, status]
    entry_point_file: null
permitted_instance_subdirs:
  - README.md
  - projects/
  - notes/
  - prompts/
  - templates/
  - reports/
  - adrs/
---

# Initiative Kernel

The Initiative Kernel is the only canonical kernel in OCP. It is the universal primitive for
goal-directed work: a recursive, multi-tier work unit that describes a measurable end state and the
sub-units of execution that reach it. Every program this organization runs — a campaign, a migration,
a hiring push, a personal sprint — is an instance of this one shape.

Read this file once, then read [[initiatives/${initiativeId}|the example initiative]]. Between them
you have everything needed to author a real initiative.

## The atom is a work unit

There is exactly one structural element in this kernel: the **work unit**. Every work unit is
structurally identical — same frontmatter contract, same nesting rules. What differs is its
\`tier_type\`, which declares its position in the hierarchy and therefore which fields are meaningful
on it:

\`\`\`yaml
tier_type: initiative | project | ticket | sub_ticket
\`\`\`

That single discriminator is the whole trick. Rather than four types with four schemas to learn, there
is one type with one schema and a field that says where you are. An agent that can read one work unit
can read all of them.

## What each tier carries

| Tier | \`tier_type\` | Carries | Answers | Entry point |
| ---- | ----------- | ------- | ------- | ----------- |
| 1 | \`initiative\` | A goal, its measurement, and KPIs | "What outcome are we buying, and how will we know we got it?" | \`README.md\` |
| 2 | \`project\` | A definition of done | "What scoped effort moves that outcome, and when is it finished?" | \`README.md\` |
| 3 | \`ticket\` | Binary completion | "What single thing gets done? It is either done or it is not." | the ticket file itself |
| 4 | \`sub_ticket\` | Decomposition | "This ticket turned out too large — what are its parts?" | the sub-ticket file itself |

The tiers are not four kinds of thing. They are one thing at four resolutions, and the resolution
determines what it is honest to claim. An initiative can carry a KPI because it spans enough time for
a number to mean something. A ticket cannot carry a KPI — it is too small to trend, so it carries a
checkbox instead. A project sits between the two: too coarse for a checkbox, too short for a trend, so
it carries a definition of done. Putting a percentage-complete on a ticket, or a checkbox on a
quarterly initiative, is the most common way instances of this kernel go wrong.

## Depth is a per-organization choice

Nothing requires all four tiers. Depth is chosen per organization and per initiative, and the
canonical sweet spot is **three tiers: initiative → project → ticket**.

- **Two tiers** (initiative → ticket) suits a small org or a short program where projects would be
  ceremony around a list of tasks.
- **Three tiers** is the default. It survives contact with real work: a quarterly goal, a handful of
  scoped efforts, and the concrete units that close them.
- **Four tiers** is a repair, not a plan. Reach for \`sub_ticket\` when a specific ticket proved too
  large once it was underway — never as the default decomposition depth. If most tickets need
  sub-tickets, the projects are scoped too coarsely and the fix belongs one tier up.

Because every tier shares one schema, changing depth is a local edit, not a migration.

## Directory shape of an instance

\`\`\`
initiatives/<initiative-id>/
├── README.md                        role: kernel_index, tier_type: initiative
├── projects/
│   └── <project-id>/
│       ├── README.md                role: kernel_index, tier_type: project
│       └── tickets/
│           └── <ticket-id>.md       tier_type: ticket — atomic leaf, no entry point
├── notes/                           knowledge this initiative depends on
├── prompts/                         agent prompts scoped to this initiative
├── templates/                       blank forms, including role: report_definition
├── reports/                         filled, immutable renders
└── adrs/                            decisions scoped to this initiative
\`\`\`

Two rules do most of the work here.

**Every directory has a \`README.md\` entry point whose \`role:\` declares its purpose.** Initiative and
project directories therefore carry \`role: kernel_index\` plus the \`tier_type\` that says which tier
they are. Tickets are the exception that proves the rule: a ticket is an atomic leaf, so the ticket
file *is* the artifact and gets no separate entry point. There is no \`index.md\` anywhere in OCP.

**\`adrs/\` here has no underscore, and that is deliberate.** Underscore-prefixed directories are
platform substrate that exists only at the graph root (\`_kernels/\`, \`_adrs/\`, \`_system/\`,
\`_users/\`). Un-prefixed directories are content. An ADR written inside an initiative is that
initiative's content — it governs this program, not the graph — so it lives in \`adrs/\`. See
[[_adrs/README|_adrs/]] for the placement rule and the promotion path.

The per-instance \`notes/\`, \`prompts/\`, \`templates/\`, and \`reports/\` are optional. Create one when
this initiative genuinely owns that material; leave it out otherwise. Substrate an initiative shares
with its whole org belongs in the org's own directories, not copied down.

## Frontmatter by tier

**Tier 1 — initiative** (\`initiatives/<initiative-id>/README.md\`):

\`\`\`yaml
---
artifact_type: note
role: kernel_index
kernel_id: initiative
tier_type: initiative
initiative_id: ${initiativeId}
display_name: "Example Initiative"
status: active
tenant: ${orgId}
parent_org_id: ${orgId}
created: ${now}
updated: ${now}
journey_goals:
  - "The terminal outcome, stated so its achievement is checkable"
metadata:
  kpi_primary: "The one number that moves if this initiative works"
---
\`\`\`

**Tier 2 — project** (\`projects/<project-id>/README.md\`):

\`\`\`yaml
---
artifact_type: note
role: kernel_index
kernel_id: initiative
tier_type: project
project_id: first-project
display_name: "First Project"
status: active
tenant: ${orgId}
parent_initiative_id: ${initiativeId}
created: ${now}
updated: ${now}
definition_of_done: "The observable condition that ends this project"
---
\`\`\`

**Tier 3 — ticket** (\`tickets/<ticket-id>.md\`, an atomic leaf):

\`\`\`yaml
---
artifact_type: note
role: work_unit
tier_type: ticket
ticket_id: first-ticket
display_name: "First Ticket"
status: todo
tenant: ${orgId}
parent_project_id: first-project
assignee: ${ctx.userId}
priority: medium
dependencies: []
created: ${now}
updated: ${now}
---
\`\`\`

**Tier 4 — sub-ticket** is a ticket with \`tier_type: sub_ticket\` and \`parent_ticket_id:\` in place of
\`parent_project_id:\`. It carries no fields the ticket does not.

\`status:\` on a ticket is \`todo | in_progress | blocked | done\` — the binary completion of the tier
table, plus the two states worth knowing about on the way there. Initiatives and projects use the
lifecycle vocabulary (\`active | paused | complete | archived\`).

Anything domain-specific goes in \`metadata:\`, which conformant tooling never reads. Anything that
discriminates *kind* within a tier goes in \`role:\` — a ticket that is really a fill-in-the-blanks
form can be \`artifact_type: template\` with a domain role, and its renders land in \`reports/\`. Those
two open dimensions are why this kernel has needed no new artifact types.

## Worked example

For a client-acquisition program, the tiers read:

- **Initiative** — "Reach 40 qualified conversations by end of quarter." Measurement: qualified
  conversations booked, counted weekly.
- **Project** — "Launch the manufacturing-vertical sequence." Definition of done: sequence live,
  600 contacts enrolled, first replies triaged.
- **Ticket** — "Write and approve the three-email sequence copy." Done or not done.

Swap the domain and the sentences change while the structure does not. That is the point, and it is
the argument for admission.

## Why this qualifies as a kernel

The rule of three, satisfied by four independent domains:

| Use case | Initiative | Project | Ticket |
| -------- | ---------- | ------- | ------ |
| Client acquisition campaign | 40 qualified conversations this quarter | Launch the manufacturing sequence | Approve the sequence copy |
| Customer support program | Cut first-response time to under 2 hours | Deploy the after-hours intake agent | Review the first week of transcripts |
| Internal operations program | Close the books within 5 days of month end | Automate the reconciliation import | Map the vendor CSV columns |
| Personal accountability sprint | Ship the book proposal by March | Draft the sample chapter | Write the 800 words due today |

These four share no vendor, no channel, no team, and no vocabulary. They share a **shape**, because
the underlying truth does not vary across domains: goal-directed work is a measurable end state with
sub-units of execution beneath it. Someone commits to an outcome, that outcome decomposes into
scoped efforts, and those efforts decompose into things that are either done or not. Every planning
system ever built rediscovers this, then buries it under domain vocabulary — sprints, campaigns,
epics, protocols — so the same structure has to be re-learned per tool.

Naming the invariant once, in substrate an agent can read without a parser, is what earns this the
kernel designation. It is universally applicable, bound to no technology, stable over years because
it encodes something about work rather than about tooling, and it cannot be expressed as an instance
of another kernel because there is no other kernel it could reduce to. The remaining criteria are
checked one by one in [[_system/kernel-criteria|_system/kernel-criteria.md]].

## Operating an instance

Per the thirty-minute operability bar, a first-time operator should be able to read the root
[[README|README.md]], this definition, and an initiative's \`README.md\`, then run a competent
operation. If operating an instance of this kernel takes longer than that, the instance has drifted —
the fix is to thin the instance, not to extend this kernel.

Operations produce artifacts. A review, a planning session, or an agent run against this initiative
ends with something written to \`reports/\` or an edit to a live note — never with output that
disappears when the session closes. That is what makes an initiative compound instead of dissipate,
and it is why agents can be stateless: each run rehydrates from what previous runs wrote down.
`;

  const adrsReadme = `---
artifact_type: note
role: note
status: active
tenant: ${orgId}
created: ${now}
updated: ${now}
tags: [adr, decisions, substrate]
---

# Platform ADRs

An **Architectural Decision Record** captures a decision, the context that forced it, and the
consequences accepted along with it. Under OCP an ADR is one of the five canonical artifact types,
declared with \`artifact_type: adr\`. It is the organization's memory of *why* — the thing that
otherwise evaporates the moment the people who were in the room move on.

This directory holds the platform-canonical ADRs for **${displayName}**: decisions that govern the
whole graph.

## Immutable once accepted

An accepted ADR is not edited. It is a record of what was decided and what was known at the time, and
rewriting it destroys exactly the value it exists to provide — a future reader learning that a
constraint was considered and rejected for reasons that no longer hold.

When a decision changes, **write a new ADR that supersedes the old one**. The new ADR names its
predecessor in \`supersedes:\`; the old one is amended in exactly one respect, gaining
\`superseded_by:\` and \`adr_status: superseded\` so a reader who lands on it is routed forward. The
chain stays readable in both directions and the history stays honest.

Before acceptance an ADR is freely editable — that is what \`adr_status: proposed\` is for. Acceptance
is the moment it freezes.

## Placement: \`_adrs/\` versus \`adrs/\`

The underscore is the whole rule. Underscore-prefixed **directories** are platform substrate and
exist only at the graph root; un-prefixed directories are content and may appear at any org or
instance.

| Location | Scope | Write one here when |
| -------- | ----- | ------------------- |
| \`_adrs/\` (graph root only) | Platform-canonical. Governs every org, user, and initiative in the graph. | The decision changes how the substrate itself works — amending the artifact type set, admitting a kernel, changing a structural convention. |
| \`adrs/\` (inside an initiative instance) | Instance content. Governs that program only. | The decision shapes one initiative — how this campaign sequences outreach, how this deployment handles escalation. |

A child organization does not carry \`_adrs/\`. It inherits the graph's platform decisions by being in
the graph, and records its own program-level decisions in the \`adrs/\` directory of the relevant
initiative.

**Promotion.** An instance-scoped ADR sometimes turns out to apply everywhere. When it does, move it
to \`_adrs/\` and record where it came from with \`promoted_from:\` (the original path) and
\`promoted_date:\`. Promotion is a deliberate act, not an accident of filing — the ADR is being
elevated from "how we ran this program" to "how this graph works."

## Minimal frontmatter

\`\`\`yaml
---
artifact_type: adr
adr_id: ADR-001
adr_status: proposed | accepted | superseded | rejected
status: active
tenant: ${orgId}
decision_date: ${now.slice(0, 10)}
supersedes: null
superseded_by: null
references: []
created: ${now}
updated: ${now}
tags: [adr]
---
\`\`\`

\`adr_status:\` tracks the decision's own lifecycle; \`status:\` is the universal artifact lifecycle
field every OCP artifact carries. They are not redundant — a superseded ADR is still an active
artifact worth reading. \`references:\` may hold other ADR ids or repo-root-relative paths to the
notes that informed the decision.

Suggested body sections: **Context** (the forces in play), **Decision** (what was chosen, in the
active voice), **Consequences** (what this costs, including what it forecloses), and
**Alternatives considered** (what was rejected and why — the section future readers use most).

## When to write one

Write an ADR when either test passes:

1. **The decision is expensive to reverse.** Structural conventions, kernel admissions, identity and
   access rules, anything other artifacts will come to depend on.
2. **A future reader will otherwise re-litigate it.** If you can imagine someone in six months
   proposing the exact thing you already considered and rejected, write down why. That includes
   *you* in six months.

If neither test passes, do not write an ADR. A note in \`notes/\` or a line in the relevant
\`README.md\` is the right weight, and ADR bureaucracy that outruns its value gets abandoned — which
returns the organization to having no record at all. The point is a small number of ADRs that are
actually read.

## Numbering

Sequential and never reused: \`ADR-001\`, \`ADR-002\`. A rejected or superseded ADR keeps its number
forever, because the references pointing at it must keep resolving. Filenames follow the id and a
slug — \`ADR-001-the-decision.md\` — so the directory sorts chronologically.

Because the commit SHA is the authoritative version reference in OCP, an ADR needs no internal
version field. What the file said on a given date is recoverable from git.
`;

  return {
    '_kernels/README.md': kernelsReadme,
    '_kernels/initiative.md': initiativeKernel,
    '_adrs/README.md': adrsReadme,
  };
};
