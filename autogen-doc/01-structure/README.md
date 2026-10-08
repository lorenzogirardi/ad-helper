# Struttura progetto

**Tipo:** app Node.js monolitica, no monorepo.

```
ad-helper/
├── docker-compose.yml          # compose config (host 127.0.0.1:3080 → container 3000, .env file)
├── Dockerfile                  # build: node:20-alpine, npm ci, expose 3000
├── package.json                # entry: src/server.js, deps: express^4, ldapjs^3
├── package-lock.json           # reproducibile build
├── .env.example                # template var: AD_URL, AD_BASE_DN, AD_BIND_DN, AD_BIND_PASSWORD
├── .gitignore                  # esclude: node_modules/, .env
│
├── src/                         # backend logic
│   ├── server.js              # entrypoint express, routing API
│   ├── ldapClient.js          # bind, search, rangedSearch wrapper
│   ├── adQueries.js           # query specifiche (searchUsers, getUser, searchGroups, getGroup)
│   └── export.js              # CSV/JSON formatter
│
└── public/                     # frontend static
    ├── index.html             # SPA markup, 2 tab (Utenti/Gruppi)
    ├── app.js                 # vanilla JS, fetch API call, DOM render
    └── style.css              # dark theme CSS
```

## Moduli

| Modulo | Owner | Scopo | Dipendenze | Peso |
|---|---|---|---|---|
| `server.js` | backend | Express routing, error handler, API mount | express, adQueries, export | 147 righe |
| `ldapClient.js` | backend | LDAP bind, search wrapper, range retrieval | ldapjs | 126 righe |
| `adQueries.js` | backend | Filter + map (users, groups, batch resolution) | ldapClient, util parseOU/cnFromDN | 172 righe |
| `export.js` | backend | CSV escape, JSON format, Content-Type | standard lib | 31 righe |
| `app.js` | frontend | Tab nav, fetch, DOM render, click nav | vanilla | 208 righe |
| `index.html` | frontend | 2 tab layout, form, table, detail panel | vanilla | 80 righe |
| `style.css` | frontend | dark theme vars, table/chip/detail layout | vanilla | 215 righe |

**Entrypoint:** `src/server.js` → listen sulla porta `PORT` (default 3000 nel container). Compose mappa la porta host loopback 3080 sulla porta container 3000; non modifica `PORT`.

**Dipendenze di produzione:**
- `express@^4.19.2` — server HTTP
- `ldapjs@^3.0.7` — client LDAP

**No dipendenze dev** (npm ci --omit=dev in Docker)

**Build:** Dockerfile multi-stage non usato (semplice copia src+public, npm ci)

**Config letto da:**
- Env var: `AD_URL`, `AD_BASE_DN`, `AD_BIND_DN`, `AD_BIND_PASSWORD`, `PORT`, `AD_DISABLE_TLS_CHECK` (test solo)
- Fallback file: `AD_BIND_PASSWORD_FILE` se definito (legge secret file)
- `.env` gitignored (no git commit di credenziali)

**Output:**
- Docker image: `ad-helper:latest` (~144MB, node:20-alpine + 2 npm packages)

**Limite:** nessuna cache, nessuna persistenza — stateless, ogni istanza indipendente
