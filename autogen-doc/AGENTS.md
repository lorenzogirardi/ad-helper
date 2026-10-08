# Instructions for autogen-doc

Before editing: read the README, `_meta/project.json`, `_meta/scope.md`, `_meta/methodology.md`, `_meta/ownership.json` and the relevant open questions. Apply the documentation-skill version recorded in the project when available. Repository instructions and the authorized perimeter always prevail.

- Identify the master and its role before editing; no named owners. Derived fields and outputs are never fixed by hand.
- Keep code, versioned configuration, snapshots and runtime evidence separate. Never publish secrets or personal data.
- Delegate deep analysis by subdomain, with complete sources and disjoint write files. Review is done by an agent other than the author; if unavailable, leave `in-review` and state the limit.
- Propagate to previous and following layers, including summaries, JSON, scenarios, questions, aggregates and outputs. For new datasets: entity × field × consumer matrix and value comparison, not just keyword search.
- The current review status lives only in `_meta/review-status.json`; pages point to that master. `validated` requires an independent report that refers to the verified version.
- Run the relevant checks and regenerate outputs from reconciled sources. The ownership gate is structural, it does not prove that facts are correct.
- Update changelog, reading-log, navigation and registry for changed files. Keep history and IDs. Scratch files and backups stay outside autogen-doc.
- In review mode do not modify masters/outputs: produce a separate report; fix only if requested, then run a new independent review.
