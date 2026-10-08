# Documentation changelog

Each entry: date, result and reason, exact list of new/updated/removed files, checks and limits. Previous entries stay untouched; corrections are added as new entries.

## 2026-10-08 - Primary group handling and English translation

**Result:** documentation translated to English; folder `03-flussi` renamed to `03-flows`. Documented that users whose *primary group* is a group (typically `Domain Users`, `primaryGroupID=513`) are not listed in the `member` attribute: `getGroup` now adds them via `primaryGroupID`, and `getUser` adds the primary group to the user's groups (rule R6).

**Files updated:** all pages, `_meta/*`, `tools/` unchanged. Role IDs in `ownership.json` are now English (`cartographer`, `curator`, `business-writer`, `tools-maintainer`, `reviewer`).

**Checks:** `node autogen-doc/tools/verify-docs.cjs --docs autogen-doc`, see the result in the commit that introduced this entry. Functional check against a real directory: `Domain Users` lists the same four accounts as the ADUC console.

**Limit:** no independent review; status stays `in-review`.

## 2026-09-30 - Post-correction verification

**Result:** final checks on the five review points completed: ranged retrieval aligned to `pageSize=1000`, source counts verified, result limit qualified as server-dependent, Q-TLS qualified as an external decision, backlog separated from the reference.

**Checks:** `node autogen-doc/tools/verify-docs.cjs --docs autogen-doc` -> `PASS` (19 files, 8 folders, 0 errors); privacy scan on documentation, `README.md` and `.env.example` with no match of real domains, names, secrets or local paths.

**Limit:** attempts at independent review after the fixes did not complete because of agent infrastructure errors/stalls; status stays `in-review`.

## 2026-09-29 - Corrections after independent review

**Result:** fixed ranged retrieval descriptions, file counts, result limit, LDAPS prerequisite and backlog references.

**Files updated:**
- `00-overview/README.md`
- `01-structure/README.md`
- `02-architecture/README.md`
- `03-flows/README.md`
- `04-operations/README.md`

**Checks:** pending second independent review; status stays `in-review`.

## 2026-09-29 - First complete documentation (layers 0-4)

**Result:** complete technical documentation of the AD Helper project, layers Orientation -> Operations, following documentation-skill + Diataxis.

**Reason:** user request for technical documentation of a project completed and verified working in production.

**New files:**
- `00-overview/README.md`: purpose, stack, glossary, limits
- `01-structure/README.md`: module, file and dependency inventory
- `02-architecture/README.md`: component responsibilities, AD patterns (ranged retrieval, batch resolution, UAC decoding, DN parsing, filter escaping)
- `03-flows/README.md`: 5 end-to-end flows (user/group search, detail, export), 5 rules with stable IDs
- `04-operations/README.md`: setup, config, troubleshooting, deploy, monitoring

**Updated files:**
- `README.md`: reading path by audience/question, links to the new layers
- `_meta/sources.json`: 5 sources (code, frontend, config, observed AD snapshot, runtime tests)
- `_meta/scope.md`: layers 0-4 perimeter, layer 5 omitted with reason
- `_meta/ownership.json`: 4 folders + 4 master files registered (01-04)
- `_meta/review-status.json`: 5 units in `in-review` state
- `_meta/open-questions.md`: 5 questions (Q-OU-EXT, Q-TLS, Q-CACHE, Q-FOREST, Q-RANGE-LARGE)
- `_meta/reading-log.md`: 5 findings recorded

**Checks performed:**
- Direct reading of the source code: `src/server.js`, `src/adQueries.js`, `src/ldapClient.js`, `src/export.js`, `public/app.js`
- Structural gate `verify-docs.cjs` executed
- Content reconciled with the functional verification done in a previous session (curl against a real AD, 140-member group)

**Declared limits:**
- Independent review not yet performed (`in-review` on all units)
- No automated tests run in this session (manual checks via curl/browser in a previous session)
- `rangedSearch` not tested on a real group with more than 1500 members (Q-RANGE-LARGE)
- Layer 5 (business) omitted: not relevant, internal IT tool without tenant/channel variants
