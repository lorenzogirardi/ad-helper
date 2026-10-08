# Local method

Adopted from documentation-skill, version in project.json. This document applies the method to the project; skill updates require a reviewed diff and never overwrite this folder automatically.

## Three paths

**Create:** survey sources and boundaries -> assign masters -> document orientation, structure, components/data, flows, variants and relevant business -> domain and cross-cutting review. A new layer may correct the previous ones.

**Update:** identify the delta from the documented revision -> masters and dependencies -> fix sources/copies -> content check -> regeneration -> independent review -> logs and status updated. For datasets, coverage of entity × field × every place that states it, with explicit residuals.

**Review:** read-only on masters and outputs; reopen the sources, look for counterexamples and contradictions between layers. Produce a report with findings, perimeter, checks, revision and limits. Corrections are implemented by an author other than the final reviewer.

## Evidence and completion

Cite the file relative to the code root, symbol and lines at the examined revision. Snapshots/configurations report source, environment and date/hash when known. Keep static fact, persisted data, inference and runtime separate; never deduce the result of a remote system from the call alone.

A change is complete when all relevant copies are consistent, the gates that actually apply pass, an independent verdict exists, questions and navigation are updated and the logs describe the real diff. Without independent review the content stays `in-review`, even with green checkers.

With frequent deploys, update per significant change/PR, not per event. Annotate the documented commit and the environment snapshots separately. The project's verified specific commands belong in project.json; do not record them as executed without having run them.
