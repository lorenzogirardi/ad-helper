# Architecture

## Components and responsibilities

```
┌─ Frontend (vanilla JS) ──────────────┐
│  app.js: fetch API, DOM render       │
│  index.html: 2 tabs, form, table     │
│  style.css: theme + layout           │
└──────────────────────────────────────┘
              │ HTTP
              ↓
┌─ REST API (Express) ─────────────────┐
│  server.js: routing, error handler   │
│  POST body: none; query param ?q=... │
└──────────────────────────────────────┘
     │ searchUsers        │ searchGroups
     │ getUser           │ getGroup
     ↓                   ↓
┌─ Query Logic (adQueries) ────────────┐
│  filter building, map result, OU extract
└──────────────────────────────────────┘
     │ search
     │ rangedSearch
     ↓
┌─ LDAP Client (ldapClient) ──────────┐
│  bind, search wrapper, range loop    │
│  error: SizeLimitExceededError -> ok │
└──────────────────────────────────────┘
              │ LDAP protocol
              ↓
         Active Directory
```

## User search flow

1. **Frontend:** form input `q`, submit -> fetch `/api/users/search?q=jane`
2. **Express:** route `/api/users/search` requires `?q`, calls `searchUsers(client, baseDN, q)`
3. **adQueries:** escape LDAP filter, build `(&(objectClass=user)(...)(|(sAMAccountName=*q*)(cn=*q*)(mail=*q*)(displayName=*q*)))`, search
4. **ldapClient:** `withClient` creates an ldapjs client, binds, runs the search, unbinds
5. **LDAP:** the server returns entries (partial if >1500)
6. **adQueries:** map entry -> `{dn, sAMAccountName, displayName, mail, ou, disabled}`, return + truncated flag
7. **Express:** res.json -> frontend table
8. **Frontend:** renderUserResults -> one tr per user, click -> loadUserDetail

## Group search with members flow

1. **Frontend:** Groups tab, search, row click -> loadGroupDetail(dn)
2. **Express:** GET `/api/groups/:dn`
3. **adQueries:** `getGroup(client, baseDN, dn)`
   - search on dn, take cn + description + primaryGroupToken
   - `rangedSearch(client, dn, 'member')` -> loop while `member;range=X-Y` exists
   - `primaryGroupMembers(client, baseDN, rid)` -> users whose `primaryGroupID` is the group RID, merged without duplicates
   - `resolveUserDetails(client, baseDN, memberDNs)` -> batch query
4. **Batch resolution:** split DNs in chunks of 200, per chunk: `(&(objectClass=user)(|(distinguishedName=dn1)...(distinguishedName=dn200)))`, result Map keyed by dn.toLowerCase()
5. **map members:** for each member DN, lookup in the Map -> `{cn, dn, sAMAccountName, mail, disabled}`
6. **Frontend:** renderGroupDetail -> name+email table, click -> userDetail

## Specific AD patterns

### Ranged attribute retrieval
Problem: AD limits a multi-valued attribute to a maximum number of elements per query (often 1500, depends on the server). Solution: the client requests `member;range=0-999` (chunk of 1000, see `pageSize` in `rangedSearch`) and receives that range. It asks again with `member;range=1000-1999`, and so on. It continues until the response contains `member;range=N-*` (unbounded = last elements).

Implementation: `rangedSearch(client, dn, attrName)` loop, accumulates until `responseKey.includes('-*')`.

Application: an example group has 140 members (below the limit, but the code also handles larger groups).

### Primary group

Problem: a user's primary group (typically `Domain Users`, RID 513) is not stored in `member` of the group nor in `memberOf` of the user. Without special handling `Domain Users` shows 0 members and the user shows no groups, while ADUC lists them.

Solution:
- Group side: read the constructed attribute `primaryGroupToken` (the group RID) and search `(&(objectCategory=person)(primaryGroupID=<rid>))`; merge the result with `member`.
- User side: read `primaryGroupID` and `objectSid`, replace the last sub-authority of the user SID with `primaryGroupID` to get the group SID, search `(&(objectClass=group)(objectSid=<groupSid>))` and add it to the groups. `primaryGroupToken` cannot be used in a filter (`Inappropriate Matching`).

Implementation: `primaryGroupMembers` and `getUser` in `adQueries.js`; `sidToString` in `ldapClient.js` decodes the binary `objectSid` from the raw buffer (the utf8-decoded pojo value is lossy).

### DN parsing for OU

DN: `CN=Jane Doe,OU=Users,OU=Italy,OU=Company,OU=Accounts,DC=ad,DC=example,DC=internal`

OU path (root -> leaf): `Accounts > Company > Italy > Users`

Implementation: split the DN on `,`, extract `OU=X` segments, reverse, join with ` > `.

### CN extraction

Extract the display name from a DN via regex `/CN=([^,]*)/i`.

Use: member DN from group.member list -> quick display without a query (like the user's `sed`).

### userAccountControl decoding

UAC bitmask: bit 2 = 0x2 = ACCOUNTDISABLE.

Check: `(uac & 0x2) !== 0` -> account disabled.

Display: badge "Disabled" vs "Active".

Application: account status visibility in search and detail.

### Batch DN resolution

N+1 problem: resolving 140 DNs -> 140 LDAP queries = slow.

Solution: chunk of 200 DNs per query, OR filter on `distinguishedName`: `(&(objectClass=user)(|(distinguishedName=dn1)(distinguishedName=dn2)...(distinguishedName=dn200))))` -> 1 query returns up to 200 user details.

Implementation: `resolveUserDetails(client, baseDN, dns)` -> Map keyed dn.toLowerCase().

Application: the getGroup members list gets mail/sAMAccountName to display name+email without a round trip per member.

### LDAP filter escaping

Special characters in filters: `\`, `*`, `(`, `)`, null byte.

Implementation: `escapeLDAPFilterValue(value)` replaces them with `\5c`, `\2a`, `\28`, `\29`, `\00`.

Application: the user input `q` in user search is escaped before building the filter.

## Integrations / Operations

**Config sources:**
- Required `AD_*` env vars: URL, BASE_DN, BIND_DN, BIND_PASSWORD
- Fallback: `AD_BIND_PASSWORD_FILE` reads a secret file (Docker pattern)
- `PORT` default 3000 (port Node listens on inside the container); Compose maps host `127.0.0.1:3080` -> container `3000`, without changing `PORT`

**Errors:**
- `SizeLimitExceededError`: caught in search(), returns partial results + `truncated: true`
- LDAP bind fail: caught by handleError(), res 502 + detail
- Missing query param: res 400

**Limits that cannot be inspected:**
- LDAP server max results per query (handled with the truncated flag)
- LDAP timeouts: set explicitly in `ldapClient.js` (`timeout: 15000` ms query, `connectTimeout: 10000` ms connection), not ldapjs defaults
- Range retrieval chunk size: 1000 (`pageSize` in `rangedSearch`, hardcoded)
