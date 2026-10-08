# Setup e operazioni

## Tutorial: primo avvio

### 1. Clone/setup progetto

```bash
cd ad-helper
cp .env.example .env
```

### 2. Compila `.env`

Richieste:
- `AD_URL`: protocol + hostname, es. `ldap://ad.example.internal`
- `AD_BASE_DN`: search base, es. `DC=ad,DC=example,DC=internal`
- `AD_BIND_DN`: service account username, es. `svc-adhelper@ad.example.internal` o `CN=SERVICE_ACCOUNT_DN,OU=Service Accounts,DC=ad,DC=example,DC=internal`
- `AD_BIND_PASSWORD`: password service account (gitignored)

Opzionali:
- `PORT`: porta su cui Node ascolta nel container, default 3000 (Compose la mappa su host `127.0.0.1:3080`, non la sovrascrive)
- `AD_DISABLE_TLS_CHECK`: `true` per test con LDAP su non-prod (skip cert validation)
- `AD_BIND_PASSWORD_FILE`: `/run/secrets/...` se usi Docker secrets (altrimenti fallback env var)

Esempio `.env`:
```
AD_URL=ldap://ad.example.internal
AD_BASE_DN=DC=ad,DC=example,DC=internal
AD_BIND_DN=svc-adhelper@ad.example.internal
AD_BIND_PASSWORD=REPLACE_WITH_SECRET
PORT=3000
```

### 3. Build e start

```bash
docker compose up -d --build
```

Verifica container running:
```bash
docker ps | grep ad-helper
```

Verifica health:
```bash
curl http://localhost:3080/api/health
```

Expected: `{"status":"ok"}`

## How-to: troubleshooting

### Cannot connect to AD / bind failure

**Errore:** `502 LDAP query failed: ... error_name: InvalidCredentialsError`

**Cause:** AD_BIND_DN o AD_BIND_PASSWORD errati, o account bloccato.

**Fix:**
- Verifica AD_BIND_DN syntax (DN completo o sAMAccountName@domain a seconda AD config)
- Verifica password non scaduta su service account
- Test locale: `ldapsearch -x -H "AD_URL" -D "AD_BIND_DN" -W -b "AD_BASE_DN" "cn=*" 2>&1` per debug

### Connection timeout

**Errore:** `502 Error: getaddrinfo ENOTFOUND ...`

**Cause:** AD_URL non raggiungibile (hostname, firewall, DNS).

**Fix:**
- Test DNS: `nslookup ad.example.internal` / `ping -c 1 ad.example.internal`
- Test LDAP port: `nc -zv ad.example.internal 389`
- Verifica firewall outbound port 389

### Search returns 0 results

**Atteso:** ricerca "jane" ritorna utenti con jane in sAMAccountName/cn/displayName/mail

**Se vuoto:**
- Verifica AD_BASE_DN: `ldapsearch -x -H ldap://AD_URL -D "AD_BIND_DN" -W -b "DC=x,DC=y" "cn=*" dn | head`
- Verifica filtri: `objectClass=user`, `objectCategory=person` escludono account macchina, no escludono `-ext`

### Docker compose port 3080 in use

**Errore:** `Error response from daemon: ... address already in use`

**Fix:** cambia la porta host in docker-compose.yml, es. `127.0.0.1:3081:3000` (lascia invariata la porta container `3000`)

### JSON export appears empty / CSV works

**Root cause (FIXED):** `Content-Disposition: attachment` su JSON → browser download silent, sembrava empty.

**Fix:** `.json` endpoint rimuove header attachment, mostra inline browser.

## How-to: monitoring

### Container running check
```bash
docker compose ps
```

### Logs
```bash
docker compose logs -f ad-helper
```

### Performance check — batch resolution timing

Ricerca gruppo con 140 membri dovrebbe completare <2s (1 range retrieval + 1 batch query).

`curl` a `/api/groups/{dn}` include gruppo con member risolti.

## Reference: deployment notes

**Security:**
- Bind host `127.0.0.1` only (Compose), no expose se dietro VPN esterno
- `.env` never in git
- Service account read-only su AD (no permission modify)
- No TLS cert validation in MVP (per test only); LDAPS + validazione cert per produzione è decisione da confermare (vedi Q-TLS in open-questions.md), non requisito già implementato

**Scalability:**
- Stateless: no session, no cache → scale horizontal con load balancer
- Each query hits LDAP fresh (no cache, design choice per consistenza)
- Batch resolution chunk size 200 (tunable in adQueries.js se servisse)
- Timeout LDAP: 15s per operazione, 10s per connessione (`src/ldapClient.js`)

Evoluzioni non implementate (cache, LDAPS, multi-forest): vedi [domande aperte](../_meta/open-questions.md). Rate limit e audit log sono idee di backlog non ancora tracciate con una domanda formale.

## How-to: update e rebuild

After code change:
```bash
docker compose up -d --build
```

After config change only:
```bash
docker compose restart ad-helper
```

After new npm dep:
```bash
npm install  # o npm install --package-lock-only se aggiunto dipendenza
docker compose up -d --build
```
