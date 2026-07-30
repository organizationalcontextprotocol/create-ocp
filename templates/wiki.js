'use strict';

/**
 * The `wiki` template adds exactly two files on top of the substrate scaffold:
 *
 *   ocp.config.ts       the single user-facing config `ocp-core` reads
 *   renderer/README.md  an honest specification of the reference renderer
 *
 * It deliberately emits no application code. The OCP reference renderer is not
 * built yet, and a stub application would be a projection masquerading as
 * substrate — the exact confusion the protocol exists to prevent.
 */
module.exports = function wikiFiles(ctx) {
  const { orgId, displayName, childOrgId, now } = ctx;

  return {
    'ocp.config.ts': `/**
 * ocp.config.ts — the single user-facing configuration for this substrate.
 *
 * \`ocp-core\` reads this file to walk the substrate and derive projections: a page
 * tree, an access-policy map, a viewer-scoped corpus, an llms.txt. Everything
 * else about a rendered site is derived from the markdown itself, because OCP
 * conventions own the tree.
 *
 * The substrate is consumed READ-ONLY. A renderer never writes back into it. The
 * governing axiom splits organizational reality in two: substrate is sovereign
 * (authored once, versioned, canonical, git markdown) and every projection is
 * derived and disposable. Delete a projection and rebuild it from git, losing
 * nothing. Write to the substrate from a renderer and you have inverted that —
 * the projection becomes a second source of truth, and the commit SHA stops
 * being the authoritative version reference (P8).
 *
 * Exactly four keys are valid. \`defineConfig\` throws on a fifth.
 * Reference: https://github.com/organizationalcontextprotocol/core
 */
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'ocp-core';

// This file sits at the substrate root, so paths resolve relative to the file
// itself and stay correct from any working directory. If your toolchain compiles
// this config to CommonJS, replace the line below with: const here = __dirname;
const here = path.dirname(fileURLToPath(import.meta.url));

// Where the substrate lives, relative to this file. '.' is the repository root,
// because this repository IS the graph-root organization (parent_org_id: null).
// Point it elsewhere — '../${orgId}-substrate', say — if you keep the renderer in
// a separate package and consume the substrate as a submodule beside it.
const SUBSTRATE_ROOT = '.';

export default defineConfig({
  // Absolute path to the substrate the walker reads from — read-only, always.
  substrateRoot: path.resolve(here, SUBSTRATE_ROOT),

  // Entry names skipped during the walk (dot-prefixed entries are always skipped).
  exclude: ['.git', 'node_modules', 'DISCOVERED.md', 'CLAUDE.md', 'assets'],

  // Base URL for per-page "view source" links — REPLACE THIS PLACEHOLDER with your
  // own git host, org, repo, and branch; as written it is not a working URL.
  sourceBlobBase: 'https://github.com/<org>/<repo>/blob/main',

  // Route -> display name, for the few names frontmatter should not decide:
  // { 'path/to/node': 'Display Name' }.
  displayOverrides: {},
});
`,

    'renderer/README.md': `---
artifact_type: note
role: note
display_name: OCP Reference Renderer
status: active
tenant: ${orgId}
created: ${now}
updated: ${now}
tags: [renderer, projection, disclosure]
---

# OCP Reference Renderer

> **NOT INCLUDED IN THIS SCAFFOLD.** This directory contains no application code, and none was
> generated. The OCP reference renderer is planned work tracked as Phase 0 — a specification,
> not shipped software. What exists today is the substrate you are reading and \`ocp.config.ts\`
> at the repository root. This file states precisely what the renderer will be, so you can build
> it yourself now, fork the reference implementation later, or judge whether the eventual
> implementation did what it promised.

## Why a config ships before an application

\`ocp.config.ts\` is not a stub. It is a real, validated \`ocp-core\` configuration today:
\`defineConfig\` accepts exactly four keys and throws on a fifth, and any program that calls
\`walk\` can read it right now without a renderer existing at all.

That ordering is the axiom expressed as a shipping decision. Substrate is sovereign; renderers
are projections. A scaffold with a substrate and no renderer loses nothing — you can render it
with anything, or read it with \`cat\`. A scaffold with a renderer and no substrate would have
shipped you the disposable half.

## What the renderer will be

### 1. A Fumadocs application over a custom OCP content source

The content source is built on \`ocp-core\`'s \`walk()\` and \`project()\`: \`walk\` reads the
substrate through the filesystem port and returns an \`OcpTree\`; \`project\` turns that tree
into a Fumadocs-shaped page tree. The division of labor is fixed and one-directional —
**OCP conventions own the tree; Fumadocs renders it.** The tree comes from the OCP walker,
never from a Fumadocs content-directory convention, and nothing is imported from Fumadocs into
the projection layer. The only coupling is a documented output shape.

This is not a stylistic preference. Fumadocs' default \`pageSchema\` requires a \`title\`
frontmatter key; OCP's human-readable name key is \`display_name\`. Pointed at the 322-file
reference substrate, the default convention silently dropped 271 of 322 files **and still
exited 0**. A renderer that lets the framework's content convention decide what a document is
will discard most of an organization without reporting anything. Hence: the walker decides, and
an unrecognized artifact type is recorded, never silently dropped.

### 2. A per-request access gate

Every request resolves a viewer's grants through a **GrantsPort** — one method,
\`resolve(request) -> { isPlatformAdmin, orgs }\`. Two adapters ship with \`ocp-core\`:

| Adapter | Use | Behavior |
| --- | --- | --- |
| \`openGrants()\` | single-tenant or genuinely public substrate | full reach; **never deploy multi-tenant** |
| \`envGrants(env)\` | CI, preview deploys, small teams | static token allowlist; unrecognized input resolves to zero reach |

Any session-issuing identity provider wires in as a relying party by implementing that same
single method — the port exists so that adopting OCP does not mean adopting anyone's auth. Two
rules make a custom adapter safe. **Flatten before you return:** resolve the downward-admin
cascade inside your IdP so \`orgs\` is a plain reachability list, because \`ocp-core\` tests
membership exactly and never expands an org id. That is precisely how the canon rule holds —
admin authority cascades downward, non-admin roles never cascade. **Fail closed:** an absent or
invalid session is \`{ isPlatformAdmin: false, orgs: [] }\`, which sees only what is declared
public.

### 3. A per-scope search index

One index per resolved scope, built from \`corpus.pages\`, cached and invalidated per scope.
Never a module-scope index over all pages. The scope is derived **server-side from the request's
grants** — never accepted as a client-supplied parameter, because a scope the client can send is
a scope the client can change.

### 4. An AI panel whose retrieval runs over the scoped corpus

The panel's retrieval tool is rebuilt per request against that viewer's corpus, so the tool
physically cannot reach a document the viewer cannot read. Retrieval scope is an argument, not
ambient state.

## The one rule

> **\`scopedCorpus(grants)\` is the single disclosure chokepoint.** Every read surface routes
> through it, and unscoped enumeration on a request path is banned.
>
> This is not defense in depth; it is the load-bearing wall. The Fumadocs starter this renderer
> builds on constructs a module-scope search index over all pages, and its AI chat \`search\`
> tool takes no scope parameter. Deployed multi-tenant as written, the assistant retrieves and
> summarizes other clients' documents **invisibly** — tool results are not rendered, so nothing
> in the UI shows that it happened. The fix is an inversion: what determines what a consumer sees
> must be an argument, not ambient state. One function, one argument, one slice.

\`scopedCorpus(tree, grants)\` returns \`{ tree, pages, text, scope, sha }\` — the pruned tree
for navigation, the pages the viewer may read, their concatenated text, the normalized grants,
and the substrate commit. Pruning is fail-closed at the first invisible ancestor: a public
artifact nested under a scope the viewer cannot see is not surfaced, because surfacing it would
leak the path containing it.

## Disclosure surfaces that must each be scoped

| Surface | Required behavior |
| --- | --- |
| Page tree / sidebar | built from \`scopedCorpus(tree, grants).tree\` |
| Page render | \`canView\` at the gate; **404** on out-of-scope, never 403 — a 403 confirms the document exists |
| Search | per-scope index built from the corpus; scope derived server-side from grants |
| AI panel retrieval | tool rebuilt over the corpus; grants resolved per request |
| \`llms.txt\` / \`llms-full.txt\` | scoped — \`llmsText\` accepts a corpus and refuses a tree, so it is structurally impossible to render unscoped |
| Markdown content negotiation | gate before negotiate |
| OG images | scope-gated; a generic card otherwise |
| Error and 404 bodies | must not echo sibling titles or valid-route hints |

Trust travels with the content through every one of these: **derivation does not launder
trust.** A fact inherits the trust tier of its lowest-trust source, no matter how many LLM hops
it passes through, so a \`trust_tier: 2\` capture summarized by the AI panel is still tier 2 in
the answer.

## Open questions this spec does not paper over

- **Nested-org reach.** \`filterTree\` prunes at the first invisible ancestor, so a viewer
  needs reach to every org on the path. In a substrate shaped \`orgs/${childOrgId}/…\` under a
  deeper parent, grants to the leaf alone return zero pages. Whether an ancestor org should be
  traversable without being readable is an undecided protocol question; \`ocp-core\` takes the
  conservative branch and leaves the ruling to canon. Resolve it before deploying orgs nested
  more than one level deep.
- **The \`visibility:\` cascade is proposed, not exercised.** Path-derived ownership is the half
  with production data behind it. Treat the frontmatter cascade as a design you are testing.
- **Markdown compile is the renderer's job.** \`ocp-core\` hands you page handles and body text,
  not HTML. It never writes, and it renders nothing.

## This directory and the walker

\`renderer/\` is application code, not substrate — it is not one of the canonical org
subdirectories, which the composition rule permits an org to subset but never to extend. It
carries this \`README.md\` because README-as-index (P20) applies to every directory in the
repository, and there is no \`index.md\` anywhere in OCP. The walker will include it as an
ordinary page; add \`'renderer'\` to \`exclude\` in \`ocp.config.ts\` if you would rather keep
your application out of the projection of ${displayName}.

## What exists today

[\`ocp-core\`](https://github.com/organizationalcontextprotocol/core) — the projection
library, published and usable now. It gives you \`walk\`, \`derivePolicy\`, \`canView\`,
\`filterTree\`, \`scopedCorpus\`, \`project\`, \`llmsText\`, and \`conformance\` against this
substrate, with zero runtime dependencies. Everything specified above is a consumer of that
surface, which is why the specification can be written precisely before the application is.

Orientation for the substrate itself: [[README|the root org README]],
[[_system/artifact-types|the five artifact types]], and
[[_kernels/initiative|the Initiative Kernel]].

**Status: Phase 0.** The renderer is tracked work, not a promise of a date.
`,
  };
};
