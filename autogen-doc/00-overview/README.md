# AD Helper - Read-only LDAP lookup

**Purpose:** lightweight web UI to query the company Active Directory from Mac/Windows+WSL, without a terminal LDAP client. It relies on the fact that, by default, every authenticated domain user can read users, groups and memberships (see the root README), so group membership can be checked without opening tickets.

**Scope:** pure reading: search users and groups, show memberships, OU, details, CSV/JSON export. No write/modify.

**Verified stack:**
- Backend: Node.js 20 + Express 4 + ldapjs 3
- Frontend: vanilla HTML/JS, no framework
- Deploy: Docker + Compose on `node:20-alpine`
- Authentication: LDAP bind with a normal account, configured via env vars, no user login in the app

**Audience:**
- IT admins: quick AD lookup without a terminal ldapsearch
- Technical team: check group membership, user status

**Main links:**
- [Project structure](../01-structure/README.md): modules, files
- [Architecture](../02-architecture/README.md): responsibilities, AD patterns
- [Flows](../03-flows/README.md): search, export
- [Operations](../04-operations/README.md): setup, Docker deploy

**Local glossary:**
- **DN (Distinguished Name):** full path of a user/group in LDAP, e.g. `CN=Jane Doe,OU=IT,OU=Accounts,DC=ad,DC=example,DC=internal`
- **OU:** organizational unit = division/team/office in the AD hierarchy
- **sAMAccountName:** pre-Windows-2000 username, e.g. `jane.doe`
- **memberOf:** list attribute, contains the DNs of the groups the user belongs to
- **member:** list attribute on a group, contains the DNs of the users/groups in the group
- **Primary group:** group referenced by the user's `primaryGroupID` (typically `Domain Users`, RID 513); it is not listed in `member`/`memberOf`
- **userAccountControl (UAC):** bitmask, bit 2 = account disabled

**Declared limitations:**
- Reads from a single configured base DN (not multi-forest)
- No certificate-validated LDAPS in the MVP (plain LDAP, TLS skip-verify for tests)
- Result limit: depends on the LDAP server (often 1500), not a default imposed by the code; handled with the `truncated` flag
- No cache, every search queries the server
- Protected by network (bind 127.0.0.1), not by app authentication

**Skill version:** 0.1.0  
**Document read:** 2026-09-29

## Open questions
| ID | Priority | Status | Question | Evidence |
|---|---|---|---|---|
| Q-OU-EXT | medium | OPEN | Do `-ext` (contractor) accounts have the same OU as a person? | Tested: an observed contractor `-ext` account had a standard OU, not a separate one |
| Q-TLS | low | EXTERNAL | Does production require LDAPS + cert? | Customer decision, not in the MVP perimeter |
| Q-CACHE | low | EXTERNAL | Cache search results? | Future proposal, not for the MVP |
