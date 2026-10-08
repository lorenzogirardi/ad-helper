# End-to-end flows

## Flow F1: User search

**ID:** F1-search-user  
**Actors:** user (web browser)  
**Channel:** HTTP GET

| Step | Action | Input | Output | Notes |
|---|---|---|---|---|
| 1. Input | User types name/email in the Users tab | `q` (e.g. "jane") | form data | does not submit if q is empty |
| 2. API call | fetch GET `/api/users/search?q=...` | encoded query param | HTTP 200 or 502 | no client-side retry |
| 3. LDAP query | buildFilter with escape, search | filter: `(&(objectClass=user)(objectCategory=person)(|(sAMAccountName=*q*)(cn=*q*)(mail=*q*)(displayName=*q*)))` | array of entries | truncated if >1500 |
| 4. Map result | extract dn, displayName, mail, sAMAccountName, userAccountControl | ldapjs v3 entry format | array `{dn, displayName, mail, ou, disabled}` | OU computed with parseOU(dn) |
| 5. Render | forEach result, tr with name+email (grey), OU, status badge | result array | HTML table | email under the name in the same cell |
| 6. Click | click tr -> loadUserDetail(dn) | url-encoded dn | switch to Users tab, fetch detail | cross-nav ready |

**Exceptions:**
- empty `q`: no fetch
- Query with 0 results: table hidden, no results message (implicit in the empty render)
- Query >1500: flag truncated=true, warning banner "Too many results"
- LDAP bind fail: alert `User search failed`, console.error

**Proposed scenario:**
- Precondition: bind account configured, AD reachable
- Actor: IT admin
- Case: search `john` -> gets John Smith in an example OU
- Check: name+email visible, readable OU path (e.g. `Accounts > France > IT`)

## Flow F2: User detail

**ID:** F2-user-detail  
**Actors:** user  
**Channel:** HTTP GET

| Step | Action | Input | Output | Notes |
|---|---|---|---|---|
| 1. Request | fetch GET `/api/users/:dn` | url-encoded dn | HTTP 200 or 404 | |
| 2. LDAP query | search on the dn directly | base=dn, filter=(objectClass=user), atts=[...] | single entry | no range retrieval, single user |
| 3. Resolve memberOf | array memberOf DN, map -> `{cn, dn}` | memberOf list | clickable group chips | no extra query, CN extracted by regex |
| 3b. Primary group | primaryGroupID + objectSid -> group SID -> search | user SID with replaced RID | primary group added to chips | not in memberOf, see rule R6 |
| 4. Render detail | HTML dl.detail-grid: sAMAccountName, mail, phone, title, dept, company, OU, created, groups | user object | dl + chip-list | |
| 5. Click chip | click chip.data-dn -> switch to Groups tab, loadGroupDetail(dn) | dn | group detail | cross-nav |

**Exceptions:**
- DN not found: HTTP 404
- empty memberOf: "No groups"

**Scenario:**
- Precondition: user found in F1
- Case: open the detail of an example user with 50+ groups, click chip `group-example` -> switches to the Groups tab
- Check: full OU path, formatted created date, clickable chip

## Flow F3: Group search

**ID:** F3-search-group  
**Actors:** user  
**Channel:** HTTP GET

| Step | Action | Input | Output | Notes |
|---|---|---|---|---|
| 1. Input | types group name | `q` (e.g. "platform") | form data | does not submit if q is empty |
| 2. API call | fetch `/api/groups/search?q=...` | query param | HTTP 200 or 502 | |
| 3. LDAP query | buildFilter escape, search | filter: `(&(objectClass=group)(cn=*q*))` | array of entries | no range retrieval for search |
| 4. Map | extract dn, cn, description, OU | ldapjs entry | array `{dn, cn, description, ou}` | OU parsed |
| 5. Render | forEach result, tr cn, description, OU | result array | table | click -> group detail |

**Exceptions:**
- 0 results: table hidden
- >1500: truncated banner

**Scenario:**
- Precondition: AD contains the group `group-example-platform-users`
- Case: search "platform" -> gets the example group
- Check: name, description visible

## Flow F4: Group detail + members

**ID:** F4-group-detail  
**Actors:** user  
**Channel:** HTTP GET

| Step | Action | Input | Output | Notes |
|---|---|---|---|---|
| 1. Request | fetch `/api/groups/:dn` | url-encoded dn | HTTP 200 or 404 | |
| 2. Group query | search on dn | filter=(objectClass=group) | cn, description, primaryGroupToken | single query |
| 3. Ranged member retrieval | rangedSearch(dn, 'member') | loop member;range=0-999, 1000-1999, ... (chunk 1000) | array memberDNs | until range=N-* |
| 3b. Primary group members | `primaryGroupMembers(baseDN, primaryGroupToken)` | `(&(objectCategory=person)(primaryGroupID=<rid>))` | extra user DNs merged without duplicates | see rule R6 |
| 4. Batch resolve | `resolveUserDetails(baseDN, memberDNs)` | chunk of 200 DNs per query, OR filter | Map dn -> `{sAMAccountName, mail, disabled}` | no N+1 queries |
| 5. Map members | for each memberDN lookup in the Map | memberDN | array `{cn, dn, sAMAccountName, mail, disabled}` | disabled=null if unresolved (nested group) |
| 6. Render | name+email table, row click nav | member array | HTML table | email under the name, click -> user detail |

**Exceptions:**
- dn not found: HTTP 404
- no members: "No members" message
- unresolvable member DN (nested group): cn extracted by regex, mail/sAMAccountName empty, disabled=null

**Scenario:**
- Precondition: `group-example-platform-users` exists, 140 members
- Case: open the detail -> 140-row name+email table
- Check: every user member shows name+email, row click -> user detail, cross-nav ok
- Performance check: batch resolution in <2s for 140 members
- Primary group check: `Domain Users` lists the same accounts as the ADUC console

## Flow F5: Export results

**ID:** F5-export  
**Actors:** user  
**Channel:** HTTP GET (download link)

| Step | Action | Input | Output | Notes |
|---|---|---|---|---|
| 1. Click | click "Export CSV" or "Export JSON" | href endpoint.csv or .json | HTTP 200 | Content-Type header |
| 2. API | GET `/api/users/search.csv?q=...` | same query | CSV bytes | Content-Disposition: attachment -> forces download |
| 2b. JSON | GET `/api/users/search.json?q=...` | same query | JSON bytes | NO Content-Disposition -> inline browser view |
| 3. Serialize | toCSV rows or JSON.stringify | array rows | text/csv or application/json | |
| 4. Deliver | browser download or inline | file | .csv or .json | browser default action |

**Exceptions:**
- no results: empty CSV/JSON (0 rows/[])

**CSV scenario:**
- Precondition: search finds 5 users
- Case: export CSV -> browser downloads users.csv
- Check: header row, 5 data rows, mail visible

**JSON scenario:**
- Precondition: search finds 5 users
- Case: export JSON -> browser tab with inline JSON viewer
- Check: array [{},...], mail visible, no silent download

## Rule R1: OU path display

**ID:** R1-ou-path  
Every user/group shows the OU path root -> leaf, e.g. `Accounts > Company > Italy > Users`.

Implementation: parseOU(dn) split on OU=, reverse order.

Application: search results, detail, exports all include the OU.

## Rule R2: Account disabled check

**ID:** R2-disabled-status  
userAccountControl bit 2 = disabled.

Check: `(uac & 0x2) !== 0`.

Display: badge "Disabled" (red) vs "Active" (green).

Application: user search, user detail, group detail (only for user-type members, nested group = null).

## Rule R3: LDAP filter escaping

**ID:** R3-escape  
The user input `q` is escaped before the filter: `\` -> `\5c`, `*` -> `\2a`, `(` -> `\28`, `)` -> `\29`, null -> `\00`.

Application: F1, F3 search.

## Rule R4: memberOf not expanded

**ID:** R4-memberof-light  
User memberOf: the CN is extracted from the DN by regex, no additional query for each DN.

As fast as the user's `sed`.

Application: F2 user detail.

## Rule R5: Range retrieval loop

**ID:** R5-range  
Large multi-valued attribute (server threshold, often 1500): AD responds `attrName;range=X-Y` until `-Y` is `-*`. The client requests chunks of 1000 (`pageSize`).

Loop until the range is unbounded.

Application: F4 group member list (tested with 140 members < 1500; the multi-range loop is not yet verified on a real group, see Q-RANGE-LARGE).

## Rule R6: Primary group is added explicitly

**ID:** R6-primary-group  
The primary group of a user (`primaryGroupID`, typically 513 = `Domain Users`) is not in `member` nor in `memberOf`. Group detail adds the users with that `primaryGroupID` to the members; user detail adds the group identified by the user SID with the last sub-authority replaced by `primaryGroupID`.

Application: F2 user detail, F4 group detail. Verified on a lab domain: `Domain Users` lists the same four accounts as the ADUC console.
