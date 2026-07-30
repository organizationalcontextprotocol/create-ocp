# create-ocp

Scaffold an **Organizational Context Protocol** organization: a git-native markdown substrate that
a human reads in any editor and an AI agent consumes with no parsing library, no vendor client,
and no integration.

[![npm](https://img.shields.io/npm/v/create-ocp.svg)](https://www.npmjs.com/package/create-ocp)
[![license](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)

> ## Internal beta - MVP, not production ready
>
> **This is an internal beta MVP.** It is published to establish the package name and to exercise
> the shape of the OCP surface against real canon - not to be depended on. The generated content
> and the CLI flags will change without notice, it implements only part of the protocol, and it
> has not been reviewed for correctness, security, or disclosure safety.
>
> **Do not ship this to clients or partners, or use it in production, without a full rework and
> review first.** In particular the OCP reference renderer is **not** included yet.

---

## Start at [ocp.wiki](https://ocp.wiki)

**https://ocp.wiki** is the public home of OCP — the specification, the conventions, and a shelf
of real, working examples, free to take.

It reads as documentation to a person and as instructions to a machine. Point any coding agent
(Claude, ChatGPT/Codex, Cursor, …) at it with one sentence:

> Create our company knowledge base using the patterns from https://ocp.wiki

The agent handles the rest: it reads the spec, runs `npm create ocp`, lays out the recursive
organizational structure, and fills it with your own material — leaving you a knowledge base you
host, that your people and your agents share, and whose permissions follow the shape of the
business instead of being stitched together afterward.

**This package is where that instruction lands.** The scaffolder stays deliberately one-command
dumb, so an agent — or an operator with half a minute and no appetite for tooling — gets a
working substrate without a decision tree in the way.

## Quickstart

```sh
npx create-ocp acme-context
```

That is the whole thing. You get a conformant organization: a graph-root org, the substrate
directories, a worked Initiative Kernel example, and a nested child org proving the recursion.

```sh
npx create-ocp acme-wiki --template wiki
npx create-ocp acme -n "Acme Platform" -o acme --altitude agency --no-git
```

The full options table and the generated file tree are in the
[package README on npm](https://www.npmjs.com/package/create-ocp).

## What it generates

**README-as-index.** Every directory has a `README.md` entry point whose `role:` frontmatter
declares that directory's purpose. There is no `index.md` anywhere in OCP.

**Five closed artifact types** — `note`, `adr`, `prompt`, `template`, `report`. Closed on purpose:
five known types means five known schemas, so an OCP-aware tool is written once and works against
every conformant organization. Extension happens through the `role:` field and an open `metadata:`
object, neither of which needs ecosystem coordination.

**Recursive, uniform structure.** Every organization holds the same canonical subdirectories, and
may contain child organizations under `orgs/` to any depth. The structure scales by adding nodes,
never by restructuring existing ones.

**Access in the substrate.** Ownership is path-derived and admin authority cascades downward, so
who-may-read-what is a property of the tree and its frontmatter, versioned in the same commit as
the content — not a policy engine bolted onto an index afterward.

## The quality bar

> **Thirty-minute operability.** A first-time operator — human or agent — should be able to read
> the root `README.md`, the relevant kernel definition, and an initiative's `README.md`, and run a
> competent operation within half an hour.

Complexity beyond that budget is a defect to be fixed with better entry points, not the cost of
doing business. A standard nobody can start using in an afternoon is a standard nobody uses.

## Status

Source lands in this repository. The package is on npm today at `0.2.x`. The reference renderer —
a Fumadocs application over `ocp-core` with a per-viewer access gate and scoped search — is the
next build; the `wiki` template currently emits its configuration and specification rather than
pretending to be it.

## Related

- [`core`](https://github.com/organizationalcontextprotocol/core) — `ocp-core`, the projection
  library and the protocol's conformance surface
- [The OCP organization](https://github.com/organizationalcontextprotocol)

## License

MIT © 2026 Max Forbang. See [LICENSE](./LICENSE).

OCP is a standard, not a product. It is free on purpose: a standard derives its value from
adoption, not from exclusion — and because an owner should be able to hand the repetitive work to
agents and keep their attention on the part of the job only a person can do, without standing up
an engineering function first.
