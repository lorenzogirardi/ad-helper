# Flussi end-to-end

## Flusso F1: Ricerca utente

**ID:** F1-search-user  
**Attori:** user (web browser)  
**Canale:** HTTP GET

| Fase | Azione | Input | Output | Note |
|---|---|---|---|---|
| 1. Input | Utente digita nome/email in tab Utenti | `q` (es. "jane") | form data | no invia se q vuoto |
| 2. API call | fetch GET `/api/users/search?q=...` | query param encoded | HTTP 200 o 502 | no retry client-side |
| 3. Query LDAP | buildFilter con escape, search | filter: `(&(objectClass=user)(objectCategory=person)(|(sAMAccountName=*q*)(cn=*q*)(mail=*q*)(displayName=*q*)))` | array entries | truncated se >1500 |
| 4. Map result | estrai dn, displayName, mail, sAMAccountName, userAccountControl | entry ldapjs v3 format | array `{dn, displayName, mail, ou, disabled}` | OU calcolato parseOU(dn) |
| 5. Render | forEach result, tr con nome+email(grigio), OU, status badge | result array | table HTML | email under nome in stessa cella |
| 6. Click | click tr → loadUserDetail(dn) | dn urlencoded | switch tab Utenti, fetch detail | cross-nav ready |

**Eccezioni:**
- `q` vuoto: no fetch
- Query 0 risultati: table hidden, messaggio "nessun risultato" (implícito nel render vuoto)
- Query >1500: flag truncated=true, banner warning "Risultati troncati"
- LDAP bind fail: alert `Errore ricerca utenti`, console.error

**Scenario proposto:**
- Precond: service account configurato, AD raggiungibile
- Attore: admin IT
- Caso: cerca `john` → riceve John Smith in un'OU di esempio
- Verifica: nome+email visibile, OU path leggibile (es. `Accounts > France > IT`)

## Flusso F2: Dettaglio utente

**ID:** F2-user-detail  
**Attori:** user  
**Canale:** HTTP GET

| Fase | Azione | Input | Output | Note |
|---|---|---|---|---|
| 1. Request | fetch GET `/api/users/:dn` | dn urlencoded | HTTP 200 o 404 | |
| 2. Query LDAP | search su dn diretto | base=dn, filter=(objectClass=user), atts=[...] | single entry | no range retrieval, single user |
| 3. Resolve memberOf | array memberOf DN, map → `{cn, dn}` | memberOf list | group chips clickable | no extra query, CN estratto regex |
| 4. Render detail | HTML dl.detail-grid: sAMAccountName, mail, phone, title, dept, company, OU, created, groups | user object | dl + chip-list | |
| 5. Click chip | click chip.data-dn → switch tab Gruppi, loadGroupDetail(dn) | dn | group detail | cross-nav |

**Eccezioni:**
- DN non trovato: HTTP 404
- memberOf vuoto: "Nessun gruppo"

**Scenario:**
- Precond: user trovato in F1
- Caso: apri dettaglio di un utente di esempio con 50+ gruppi, click chip `group-example` → passa a tab Gruppi
- Verifica: OU path completo, created date formattato, chip clickabile

## Flusso F3: Ricerca gruppo

**ID:** F3-search-group  
**Attori:** user  
**Canale:** HTTP GET

| Fase | Azione | Input | Output | Note |
|---|---|---|---|---|
| 1. Input | digita nome gruppo | `q` (es. "platform") | form data | no invia se q vuoto |
| 2. API call | fetch `/api/groups/search?q=...` | query param | HTTP 200 o 502 | |
| 3. Query LDAP | buildFilter escape, search | filter: `(&(objectClass=group)(cn=*q*))` | array entries | no range retrieval per search |
| 4. Map | estrai dn, cn, description, OU | entry ldapjs | array `{dn, cn, description, ou}` | OU parsed |
| 5. Render | forEach result, tr cn, description, OU | result array | table | click → group detail |

**Eccezioni:**
- 0 risultati: table hidden
- >1500: truncated banner

**Scenario:**
- Precond: AD contiene gruppo `group-example-platform-users`
- Caso: cerca "platform" → riceve il gruppo di esempio
- Verifica: nome, description visibile

## Flusso F4: Dettaglio gruppo + membri

**ID:** F4-group-detail  
**Attori:** user  
**Canale:** HTTP GET

| Fase | Azione | Input | Output | Note |
|---|---|---|---|---|
| 1. Request | fetch `/api/groups/:dn` | dn urlencoded | HTTP 200 o 404 | |
| 2. Query gruppo | search su dn | filter=(objectClass=group) | cn, description | single query |
| 3. Ranged member retrieval | rangedSearch(dn, 'member') | loop member;range=0-999, 1000-1999, ... (chunk 1000) | array memberDNs | until range=N-* |
| 4. Batch resolve | `resolveUserDetails(baseDN, memberDNs)` | chunk 200 DN per query, OR filter | Map dn → `{sAMAccountName, mail, disabled}` | no N+1 query |
| 5. Map members | per memberDN lookup Map | memberDN | array `{cn, dn, sAMAccountName, mail, disabled}` | disabled=null se non risolto (nested group) |
| 6. Render | table nome+email, hr click nav | member array | table HTML | email sotto nome, click → user detail |

**Eccezioni:**
- dn not found: HTTP 404
- no members: "Nessun membro" message
- member DN non risolvibile (nested group): cn estratto regex, mail/sAMAccountName vuoto, disabled=null

**Scenario:**
- Precond: `group-example-platform-users` esiste, 140 membri
- Caso: open dettaglio → tabella 140 righe nome+email
- Verifica: ogni membro user mostra nome+email, click riga → user detail, cross-nav ok
- Verifica performance: batch resolution in <2s per 140 membri

## Flusso F5: Export risultati

**ID:** F5-export  
**Attori:** user  
**Canale:** HTTP GET (link download)

| Fase | Azione | Input | Output | Note |
|---|---|---|---|---|
| 1. Click | click "Esporta CSV" o "Esporta JSON" | href endpoint.csv or .json | HTTP 200 | Content-Type header |
| 2. API | GET `/api/users/search.csv?q=...` | same query | CSV bytes | Content-Disposition: attachment → force download |
| 2b. JSON | GET `/api/users/search.json?q=...` | same query | JSON bytes | NO Content-Disposition → inline browser view |
| 3. Serialize | toCSV rows or JSON.stringify | array rows | text/csv or application/json | |
| 4. Deliver | browser download o inline | file | .csv o .json | browser default action |

**Eccezioni:**
- no results: empty CSV/JSON (0 rows/[])

**Scenario CSV:**
- Precond: ricerca trova 5 utenti
- Caso: export CSV → browser download users.csv
- Verifica: header col, 5 data row, mail visibile

**Scenario JSON:**
- Precond: ricerca trova 5 utenti
- Caso: export JSON → browser tab inline JSON viewer
- Verifica: array [{},...], mail visibile, no download silent

## Regola R1: OU Path display

**ID:** R1-ou-path  
Ogni utente/gruppo mostra OU path radice → foglia, es. `Accounts > Company > Italy > Users`.

Implementazione: parseOU(dn) split su OU=, inverse order.

Applicazione: ricerca result, dettaglio, export tutti includono OU.

## Regola R2: Account disabled check

**ID:** R2-disabled-status  
userAccountControl bit 2 = disabilitato.

Check: `(uac & 0x2) !== 0`.

Display: badge "Disabilitato" (red) vs "Attivo" (green).

Applicazione: ricerca utenti, dettaglio utente, dettaglio gruppo (solo per membri user-type, nested group = null).

## Regola R3: LDAP Filter Escaping

**ID:** R3-escape  
Input `q` user scappato prima filtro: `\` → `\5c`, `*` → `\2a`, `(` → `\28`, `)` → `\29`, null → `\00`.

Applicazione: F1, F3 search.

## Regola R4: memberOf non espanso

**ID:** R4-memberof-light  
Utente memberOf: DN estratto CN via regex, no query aggiuntiva per ogni DN.

Rapido come sed dell'utente.

Applicazione: F2 dettaglio utente.

## Regola R5: Range retrieval loop

**ID:** R5-range  
Attributo multivalore grande (soglia server, spesso 1500): AD response `attrName;range=X-Y` finché `-Y` non è `-*`. Client richiede chunk da 1000 (`pageSize`).

Loop finché range unbounded.

Applicazione: F4 group member list (testato con 140 membri < 1500; loop multi-range non ancora verificato su gruppo reale, vedi Q-RANGE-LARGE).
