# create-ocp

[![npm](https://img.shields.io/npm/v/create-ocp.svg)](https://www.npmjs.com/package/create-ocp)
[![license](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/organizationalcontextprotocol/create-ocp/blob/main/LICENSE)
[![node](https://img.shields.io/badge/node-%3E%3D20-brightgreen.svg)](https://nodejs.org)

> ## Internal beta - MVP, not production ready
>
> **This is an internal beta MVP.** It is published to establish the package name and to exercise
> the shape of the OCP surface against real canon - not to be depended on. The generated content
> and the CLI flags will change without notice, it implements only part of the protocol, and it
> has not been reviewed for correctness, security, or disclosure safety.
>
> **Do not ship this to clients or partners, or use it in production, without a full rework and
> review first.** Specifically not yet done:
>
> - **The OCP reference renderer is not included.** The `wiki` template emits the config a renderer consumes plus a specification of what it will be — not an application. Rendering, search, and the AI panel are unbuilt.
> - **No access-control wiring.** The scaffold declares the organizational structure that access policy is *derived from*; nothing here authenticates a viewer or enforces a boundary.
> - **The seed content is a starting point, not reviewed organizational canon.** It explains the conventions correctly; it has not had the review an adopter's real substrate deserves.
> - **No migration path for existing documents.** This scaffolds a new organization; it does not ingest, classify, or convert a folder of documents you already have.
> - **Conformance has a mechanical check, not a formal suite.** `npx ocp-core validate` (ocp-core ≥ 0.3.0) independently validates a scaffolded substrate — entry points, frontmatter, the closed type set, Core Canon blocks — but the protocol has no formal conformance suite beyond it.

---

`create-ocp` scaffolds an **Organizational Context Protocol** organization: a git-native markdown
substrate that a human reads in any editor and an AI agent consumes with no parsing library, no
vendor client, and no integration.

## Start at [ocp.wiki](https://ocp.wiki)

**https://ocp.wiki** is the single entry point for OCP — the specification, the conventions, and
a library of working examples, published free for anyone to use.

It is written to be read by a person and fetched by an agent. Hand any coding agent (Claude,
ChatGPT/Codex, Cursor, …) one line:

> Create our company knowledge base using the patterns from https://ocp.wiki

…and it does the rest: reads the spec, runs `npm create ocp`, lays out the recursive
organizational structure, and fills it with your company's own content. What comes out is a
knowledge base your team and your agents share, self-hosted, with access boundaries that follow
the shape of the organization rather than being wired up by hand afterward — and with the SOPs
and templates inside it ready to drive whatever you build next.

**This package is what that cascade lands on.** The scaffolder is deliberately one-command dumb,
so an agent — or an operator with thirty seconds and no interest in tooling — reaches a working
substrate with no decision tree in the way.

## Quickstart

```sh
npx create-ocp acme-context
```

That is the whole thing. You now have a conformant organization: a graph-root org, the substrate
directories, a worked Initiative Kernel example, and a nested child org proving the recursion.

```sh
npx create-ocp acme-wiki --template wiki
npx create-ocp acme -n "Acme Platform" -o acme -u max --no-git
```

## For AI agents

If you are an agent standing up this knowledge base for an operator, the whole loop is:

```sh
npx create-ocp@latest <org-slug> --name "<Organization Display Name>"
cd <org-slug>
# populate from the operator's own context — AGENTS.md → "Populating a fresh scaffold"
npx ocp-core validate
```

Scaffold, then populate the stubs from context you legitimately hold — the conversation, shared
documents, existing repositories — never inventing facts: stub what you cannot ground and list
every stub in your final report. Validate until it prints `OK`, commit, and report the resulting
tree as an outline. The complete directive, including the no-shell fallback:
**[ocp.wiki/genesis.md](https://ocp.wiki/genesis.md)**.

## Options

| Flag | Default | What it does |
|---|---|---|
| `-t, --template <substrate\|wiki>` | `substrate` | `substrate` scaffolds the organization. `wiki` adds `ocp.config.ts` and a renderer specification. |
| `-n, --name <display name>` | humanized directory name | The organization's `display_name`. |
| `-o, --org-id <kebab-id>` | kebab-cased directory name | The organization's `org_id`. |
| `-u, --user <user-id>` | `founder` | Seeds `_users/<id>/` with a profile and memberships. |
| `--no-git` | off | Skip `git init`. |
| `-f, --force` | off | Scaffold into a non-empty directory. Any file that already exists is **kept, never overwritten**, and listed in the summary. |
| `-h, --help` | — | Print usage and exit 0. |
| `-v, --version` | — | Print the version and exit 0. |

A missing target directory prints usage to stderr and exits 1. An unknown template fails before
anything is written. If `git` is missing, the scaffold still succeeds with a warning.

*(`--altitude` was removed in 0.3.0. Altitude is descriptive vocabulary that no artifact records,
so the flag had nowhere to write and was accepted as a silent no-op. See below.)*

## What you get

```text
acme-context/
├── _adrs/
│   └── README.md
├── _kernels/
│   ├── README.md
│   └── initiative.md
├── _system/
│   ├── README.md
│   ├── altitude-types.md
│   ├── artifact-types.md
│   └── kernel-criteria.md
├── _users/
│   ├── founder/
│   │   ├── README.md
│   │   └── memberships.md
│   └── README.md
├── initiatives/
│   ├── example-initiative/
│   │   └── README.md
│   └── README.md
├── notes/
│   └── README.md
├── orgs/
│   ├── example-client/
│   │   ├── notes/
│   │   │   └── README.md
│   │   └── README.md
│   └── README.md
├── prompts/
│   └── README.md
├── reports/
│   └── README.md
├── templates/
│   └── README.md
├── .gitignore
├── AGENTS.md
├── DISCOVERED.md
└── README.md
```

The `wiki` template adds `ocp.config.ts` and `renderer/README.md` on top of exactly this.

| Path | What it is |
|---|---|
| `README.md` | The graph-root **organization** — `role: org_definition`, `parent_org_id: null`. The repository root *is* the organization; there is no wrapper directory. Carries the Core Canon block. |
| `AGENTS.md` | The entry point you point an AI agent at. The conventions an agent must honor before it writes anything. |
| `DISCOVERED.md` | The fail-soft log. Tooling that cannot parse a file records it here instead of aborting a build. |
| `_system/` | Definitions of the conventions themselves: the closed artifact-type set, the org-structure law, the kernel admission criteria. |
| `_kernels/` | Kernel definitions. `initiative.md` is the Initiative Kernel — the universal primitive for goal-directed work. |
| `_adrs/` | Platform-canonical decision records. Immutable once accepted; superseded rather than edited. |
| `_users/` | Users, cross-cutting. A person may belong to organizations at several altitudes, so they do not nest under any one of them. |
| `notes/` `prompts/` `templates/` `reports/` | The content directories — one per artifact type. |
| `initiatives/` | Instances of the Initiative Kernel, with a worked example you can run. |
| `orgs/` | Child organizations. Where the recursion begins; it goes as deep as you need. |
| `ocp.config.ts` | *(wiki)* The single user-facing config a renderer consumes: `substrateRoot`, `exclude`, `sourceBlobBase`, `displayOverrides`. |
| `renderer/README.md` | *(wiki)* What the reference renderer will be, and an explicit statement that it is not included. |

Underscore-prefixed **directories** are substrate — definitions of the repository or of the
containing entity. Un-prefixed directories are content. The convention echoes `_posts/` and
`_index.md` in static-site generators and is filesystem-safe everywhere.

## The conventions it generates

**README-as-index.** Every directory has a `README.md` entry point whose `role:` frontmatter
declares that directory's purpose. There is no `index.md` anywhere in OCP — `README.md` renders
for free on every git host, IDE, and documentation tool.

**Five closed artifact types.** Every artifact is exactly one of `note`, `adr`, `prompt`,
`template`, `report`, declared as `artifact_type:`. The set is closed on purpose: five known types
means five known schemas, so an OCP-aware tool is written once and works against every conformant
organization. Extension happens in two open dimensions that need zero ecosystem coordination — the
`role:` field discriminates within a type, and the open `metadata:` object holds whatever your
domain needs. Conformant tooling never reads `metadata`, so you extend without ever migrating a
schema.

**Recursive, uniform structure.** Every organization holds the same canonical subdirectories, and
every organization may contain child organizations under `orgs/`. Depth is your choice: a solo
builder uses two altitudes, a direct-operating agency three, a white-label reseller four or five.
The structure scales by *adding nodes, never by restructuring existing ones* — when an agency
starts white-labeling, its existing subtree slots under a new parent without a single file moving.

**Altitude is vocabulary, not schema.** `platform`, `tenant`, `agency`, `account`, `user` are
descriptive words for positions an organization *may* occupy — useful for planning a tree's shape,
written into no file, and read by no tool. The `org_type` frontmatter field was retired 2026-07-21
and the whole axis went with it: never author `altitude:` either, at the top level or under
`metadata:`. The single structural fact an artifact records is `parent_org_id` — `null` at the graph
root, the parent's id everywhere else — and root-vs-child is the only structural distinction OCP
has. That is what lets one standard serve a two-person shop and a multi-tenant platform without
either distorting the other.

**Access lives in the substrate.** Ownership is path-derived and admin authority cascades
downward, so who-may-read-what is a property of the tree and its frontmatter, versioned in the
same commit as the content — not a policy engine bolted onto an index afterward.

Two halves, unequal in maturity: **path-derived ownership is the half with production data behind
it** — a document under `orgs/<id>/` belongs to that org, full stop. The **`visibility:`
frontmatter cascade is proposed and unexercised**: zero of the 322 files in the reference
substrate use it (grounding F-038). The scaffold declares structure; it does not authenticate
anyone. Audit what a given viewer can actually reach with `scopedCorpus` before you put a real
boundary on it.

## The quality bar

The scaffold is designed against one measurable standard, and it is the standard your own content
should hold to as it grows:

> **Thirty-minute operability.** A first-time operator — human or agent — should be able to read
> the root `README.md`, the relevant kernel definition, and an initiative's `README.md`, and run a
> competent operation within half an hour.

Complexity that exceeds that budget is a defect to be fixed with better entry points, not the cost
of doing business. A standard nobody can start using in an afternoon is a standard nobody uses.

## Divergence from the plan of record

The Phase 0 plan specifies that v1 ships one template — `wiki`, the reference renderer — with
`substrate` deferred. **This beta inverts that, deliberately:** the renderer is not built yet, and
a `wiki` template that emitted a fake application would be a lie. So `substrate` is the default and
is real, and `wiki` adds the renderer's *configuration and specification* without pretending to be
the renderer. The flag shape is preserved, so landing the real renderer later is an implementation
change rather than a rename.

## Projecting the substrate

The substrate is sovereign; everything else is a projection of it. To walk the tree, derive access
policy, and take a scoped slice:

```sh
npm install ocp-core
npx ocp-core validate   # the same package machine-checks a scaffold's conformance
```

See [ocp-core](https://github.com/organizationalcontextprotocol/core) — the projection library
and the protocol's conformance surface.

## Deferred, with triggers

Named rather than vague, so you know what would make each of these move:

| Deferred | Trigger |
|---|---|
| The reference renderer | The next build after this package |
| A remote/GitHub substrate adapter | The first external org that cannot vendor its substrate locally |
| A theming system for the renderer | Never for v1 — chrome is the adopter's job; that is the point of a template |
| Foundation, governance, RFC process | The first unsolicited external contribution of substance |

## About OCP

OCP is an open specification for how an organization exposes its structure, knowledge, and access
rules to AI agents. One axiom governs it:

> Every piece of organizational reality is **either** sovereign substrate — authored once,
> versioned, canonical, living in git as markdown — **or** a derived projection, rendered from
> substrate on demand, never canonical, always disposable and rebuildable.

OCP is to context what MCP is to tools: the same architectural move applied to a different
substrate. MCP canonicalizes the **action** layer; OCP canonicalizes the **context** layer. Both
collapse N×M bespoke integrations to N+M.

It is a standard, not a product — MIT, free, and valuable in proportion to how widely it is
adopted rather than how tightly it is held.

Giving it away is deliberate. The businesses with the most to gain from agents running the
repetitive work — the agency owner who would rather spend the day on the craft than on admin, the
operator sitting on a filing cabinet of hard-won process — are the least likely to fund an
engineering effort to get there. Automating the busywork so that people can spend their attention
on the part only they can do is the entire promise of this technology, and it should not be
rationed to whoever can afford the implementation.

## Status

Source lives in [organizationalcontextprotocol/create-ocp](https://github.com/organizationalcontextprotocol/create-ocp).
The package is on npm at `0.2.x`. The reference renderer — a Fumadocs application over `ocp-core`
with a per-viewer access gate and scoped search — is the next build; until it lands, the `wiki`
template emits its configuration and specification rather than pretending to be it.

## Links

- [ocp.wiki](https://ocp.wiki) — the specification, the conventions, and the worked examples
- Projection library: [ocp-core on npm](https://www.npmjs.com/package/ocp-core) ·
  [on GitHub](https://github.com/organizationalcontextprotocol/core)
- Protocol and organization:
  [github.com/organizationalcontextprotocol](https://github.com/organizationalcontextprotocol)
- Issues:
  [create-ocp issue tracker](https://github.com/organizationalcontextprotocol/create-ocp/issues)

MIT © 2026 Max Forbang
