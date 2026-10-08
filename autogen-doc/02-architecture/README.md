# Architettura

## Componenti e responsabilità

```
┌─ Frontend (vanilla JS) ──────────────┐
│  app.js: fetch API, DOM render       │
│  index.html: 2 tab, form, table      │
│  style.css: theme + layout           │
└──────────────────────────────────────┘
              │ HTTP
              ↓
┌─ API REST (Express) ─────────────────┐
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
│  error: SizeLimitExceededError → ok  │
└──────────────────────────────────────┘
              │ LDAP protocol
              ↓
         Active Directory
```

## Flusso ricerca utente

1. **Frontend:** form input `q`, submit → fetch `/api/users/search?q=jane`
2. **Express:** routing `/api/users/search` richiede `?q`, chiama `searchUsers(client, baseDN, q)`
3. **adQueries:** escape LDAP filter, build `(&(objectClass=user)(...)(|(sAMAccountName=*q*)(cn=*q*)(mail=*q*)(displayName=*q*)))`, search
4. **ldapClient:** `withClient` crea client ldapjs, bind service account, esegue search, unbind
5. **LDAP:** server ritorna entries (partial se >1500)
6. **adQueries:** map entry → `{dn, sAMAccountName, displayName, mail, ou, disabled}`, return + truncated flag
7. **Express:** res.json → tabella frontend
8. **Frontend:** renderUserResults → tr per ogni utente, click → loadUserDetail

## Flusso ricerca gruppo con membri

1. **Frontend:** tab Gruppi, cerca, click riga → loadGroupDetail(dn)
2. **Express:** GET `/api/groups/:dn`
3. **adQueries:** `getGroup(client, baseDN, dn)`
   - search su dn, prendi cn + description
   - `rangedSearch(client, dn, 'member')` → loop while `member;range=X-Y` esiste
   - `resolveUserDetails(client, baseDN, memberDNs)` → batch query
4. **Batch resolution:** split DN in chunk da 200, per chunk: `(&(objectClass=user)(|(distinguishedName=dn1)...(distinguishedName=dn200)))`, risultato Map keyed by dn.toLowerCase()
5. **map members:** per DN member, lookup in Map → `{cn, dn, sAMAccountName, mail, disabled}`
6. **Frontend:** renderGroupDetail → table nome+email, click → userDetail

## Pattern AD specifici

### Ranged attribute retrieval
Problema: AD limita multivalore a un numero massimo di elementi per query (spesso 1500, dipende dal server). Soluzione: client richiede `member;range=0-999` (chunk da 1000, vedi `pageSize` in `rangedSearch`), riceve quel range. Rilancia con `member;range=1000-1999`, e così via. Continua finché risposta contiene `member;range=N-*` (unbounded = ultimi elementi).

Implementazione: `rangedSearch(client, dn, attrName)` loop, accumula, finché `responseKey.includes('-*')`.

Applicazione: un gruppo di esempio ha 140 membri (sotto limite, ma il codice gestisce anche gruppi più grandi).

### DN parsing per OU

DN: `CN=Jane Doe,OU=Users,OU=Italy,OU=Company,OU=Accounts,DC=ad,DC=example,DC=internal`

OU path (radice → foglia): `Accounts > Company > Italy > Users`

Implementazione: split DN su `,`, estrai segment `OU=X`, inverti, join ` > `.

### CN extraction

Estrai nome visualizzazione da DN via regex `/CN=([^,]*)/i`.

Uso: membro DN da group.member list → quick display senza query (come sed dell'utente).

### userAccountControl decoding

UAC bitmask: bit 2 = 0x2 = ACCOUNTDISABLE.

Check: `(uac & 0x2) !== 0` → account disabilitato.

Display: badge "Disabilitato" vs "Attivo".

Applicazione: visibilità stato account in ricerca e dettaglio.

### Batch DN resolution

Problema N+1: risolvere 140 DN → 140 query LDAP = lento.

Soluzione: chunk 200 DN per query, OR filter su `distinguishedName`: `(&(objectClass=user)(|(distinguishedName=dn1)(distinguishedName=dn2)...(distinguishedName=dn200))))` → 1 query restituisce fino a 200 user details.

Implementazione: `resolveUserDetails(client, baseDN, dns)` → Map keyed dn.toLowerCase().

Applicazione: getGroup members list ottiene mail/sAMAccountName per display nome+email senza round-trip per membro.

### LDAP Filter Escaping

Caratteri speciali in filter: `\`, `*`, `(`, `)`, null byte.

Implementazione: `escapeLDAPFilterValue(value)` sostituisce con `\5c`, `\2a`, `\28`, `\29`, `\00`.

Applicazione: user input `q` in ricerca utente scappato prima di costruire filter.

## Integrazioni / Operazioni

**Config sources:**
- Env var `AD_*` richieste: URL, BASE_DN, BIND_DN, BIND_PASSWORD
- Fallback: `AD_BIND_PASSWORD_FILE` legge secret file (Docker pattern)
- `PORT` default 3000 (porta su cui Node ascolta nel container); Compose mappa host `127.0.0.1:3080` → container `3000`, senza modificare `PORT`

**Errori:**
- `SizeLimitExceededError`: catturato in search(), ritorna risultati parziali + `truncated: true`
- LDAP bind fail: catturato handleError(), res 502 + detail
- Missing query param: res 400

**Limiti non ispezionabili:**
- Server LDAP max results per query (gestito truncated flag)
- Timeout LDAP: configurati esplicitamente in `ldapClient.js` (`timeout: 15000`ms query, `connectTimeout: 10000`ms connessione), non default ldapjs
- Range retrieval chunk size: 1000 (`pageSize` in `rangedSearch`, hardcoded)
