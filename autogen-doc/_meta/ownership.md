# Ownership discipline

Owner means role. Cartographer: technical model and structure; Evidence curator: sources and surveys; Business writer: business translation and scenarios; Tools maintainer: parsers/checkers/generators; Reviewer: independent verdicts. One operational owner per file; no personal names.

The ownership.json registry owns assignments, scope, dependencies and procedures; ownership-catalog.md is its generated view. Every file/folder must be classified; do not automatically assign new files just from their position.

Distinguish evidentiary source, documentation master and propagation. Code, versioned configuration, snapshots and runtime prove different claims. Copies do not own the replicated value. For `mixed` files declare manual and derived fields in `fields`; a `generated` output owns no facts.

Current unit status: review-status.json. Source provenance: sources.json. Perimeter: scope.md. Questions: open-questions.md. Findings: reading-log.md. Changes: CHANGELOG.md. These registries do not replace the domain masters or the evidentiary sources.

Curated inventories, computed reports, historical hashes and approved baselines have distinct procedures. Do not update a baseline to hide drift; investigate first. Follow direct/transitive consumers and also look for manual occurrences. The graph is a derivation graph, not a list of every hyperlink.

For new files update the registry before the catalog. The gate verifies coverage and uniqueness of declared scopes, not the truth or semantic uniqueness of sentences. Scratch files and backups stay external; archives are frozen history, not a source of the current state.
