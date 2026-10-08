# Project documentation - AD Helper

Status: layers 0-4 documented (orientation, structure, architecture, flows, operations). Layer 5 (business) omitted, reason in `_meta/scope.md`. Waiting for independent review (`in-review`).

The code lives in the parent folder. `autogen-doc/` contains curated masters, governance and tools; any generated outputs will be declared in the registry.

## Reading path

**To understand what it is and who it is for:** [Overview](00-overview/README.md)

**To find your way around the code:** [Project structure](01-structure/README.md): modules, files, dependencies

**To understand how it works internally:** [Architecture](02-architecture/README.md): component responsibilities, AD patterns (ranged retrieval, batch resolution, UAC decoding, DN parsing, primary group)

**To understand end-to-end behaviour:** [Flows](03-flows/README.md): user/group search, detail, export, rules with stable IDs

**To set up/deploy/debug:** [Operations](04-operations/README.md): env vars, troubleshooting, Docker

**Governance:**
- [Scope and coverage](_meta/scope.md): what is included, excluded or not yet read.
- [Open questions](_meta/open-questions.md): doubts with ID and residual.
- [Current review status](_meta/review-status.json): read perimeter and report before relying on a conclusion.
- [Ownership catalog](_meta/ownership-catalog.md): where to fix a piece of information and which copies to update.
- [Local method](_meta/methodology.md), [agent instructions](AGENTS.md), [changelog](CHANGELOG.md).

Layer 5 (business/variants) does not apply: the project is an internal IT tool, with no tenant/country/channel variants.

## Verify from the code root

```text
node autogen-doc/tools/verify-docs.cjs --docs autogen-doc --write-catalog
node autogen-doc/tools/verify-docs.cjs --docs autogen-doc
```

The first command only updates the catalog from the explicit assignments in the registry. A positive result does not mean the content has been reviewed.
