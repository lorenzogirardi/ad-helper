# Documentation scope

**Goal:** describe architecture, module responsibilities, flows, specific AD patterns and operational setup. No feature roadmap or unapproved future decisions.

**Audience:** development team, deployment IT admins, future maintainer. Not end users (see the root README for the user guide).

**Completed layers:**
- 0 Orientation: context, glossary, stack
- 1 Structure: module inventory, graph, build
- 2 Architecture: responsibilities, wiring, AD patterns
- 3 Flows: search, detail, end-to-end export
- 4 Operations: setup, troubleshooting, deploy

**Omitted layers (not relevant):**
- 5 Business: no tenant/country variants, no business decisions outside scope (IT setup only)

**Code perimeter:**
- Include: Node.js backend, vanilla frontend, Docker, config
- Exclude: internal AD exchanges (user query details already in the docs), migration from previous tools

**Declared limits:**
- Single base DN (no forest)
- Plain LDAP in the MVP (no LDAPS in the MVP)
- No cache (fresh query every time)
- No custom timeout beyond the ones set in `ldapClient.js`
- Protected by network (127.0.0.1 only), not by app authentication

**Checks performed:**
- Complete reading of the source code
- Functional tests: user search, group search, group detail + batch resolve, CSV/JSON export
- Observed AD schema: email format, OU pattern, contractor `-ext` accounts
- Batch resolution performance: 140 members < 2s

**Checks NOT performed (out of scope):**
- Scalability load test
- LDAPS + cert validation
- Multi-forest AD
- Compliance/audit
- Penetration test

**Open questions:**
- Q-OU-EXT: contractor OU? (Tested: same OU, no separate one)
- Q-TLS: LDAPS in production? (EXTERNAL decision)
- Q-CACHE: cache for frequent searches? (EXTERNAL backlog)

**Documentation status:** not-analyzed (ready for independent review)

**Scope date:** 2026-09-29
