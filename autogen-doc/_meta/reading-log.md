# Findings log

Add append-only entries: date | area | finding | source | documentation consequence. The log keeps history; current facts belong to the domain masters.

| Date | Area | Finding | Source | Documentation consequence |
|---|---|---|---|---|
| 2026-09-29 | architecture | AD splits multi-valued attributes with more than 1500 elements into ranges (`member;range=0-1499`, etc.), a read loop is required | `src/ldapClient.js` function `rangedSearch`, verified against documented AD behaviour | Pattern documented in 02-architecture/README.md section "Ranged attribute retrieval" |
| 2026-09-29 | architecture | Resolving N group members with N single queries is inefficient; an OR filter on `distinguishedName` (chunk 200) resolves them in 1 query per chunk | `src/adQueries.js` function `resolveUserDetails`, tested on an example group with 140 members | Pattern "Batch DN resolution" documented in 02-architecture, flow F4 in 03-flows |
| 2026-09-29 | operations | `Content-Disposition: attachment` header on a JSON response forced a silent browser download, perceived by the user as an "empty export" (not a data bug, a UX one) | `src/export.js` function `sendJSON`, reproduced and fixed during development | Documented in 04-operations/README.md troubleshooting section, and rule F5 in 03-flows |
| 2026-09-29 | AD domain | Contractor accounts may have the suffix `-ext` in `sAMAccountName` and `mail`; in the observed sample they had no dedicated OU and were `objectClass=user` | Direct test on an example group with 140 members | Documented in 00-overview and Q-OU-EXT in open-questions.md |
| 2026-09-29 | AD domain | A standard user can belong to 50+ groups (technical, SSO, mixed organizational), not only team groups | Direct `getUser` test on an example user, `memberOf` field | Documented in flow F2 03-flows/README.md |
| 2026-10-08 | AD domain | The primary group of a user (e.g. `Domain Users`, `primaryGroupID=513`) is not stored in `member`/`memberOf`: the group showed 0 members and the user "no groups" although the ADUC console lists them | `ldapsearch`: `member` of `Domain Users` has 0 values while 4 users have `primaryGroupID=513`; ADUC screenshot | Rule R6 in 03-flows, pattern "Primary group" in 02-architecture; fixed in `getGroup`/`getUser` |
