# Project structure

**Type:** monolithic Node.js app, no monorepo.

```
ad-helper/
├── docker-compose.yml          # compose config (host 127.0.0.1:3080 -> container 3000, .env file)
├── Dockerfile                  # build: node:20-alpine, npm ci, expose 3000
├── package.json                # entry: src/server.js, deps: express^4, ldapjs^3
├── package-lock.json           # reproducible build
├── .env.example                # template vars: AD_URL, AD_BASE_DN, AD_BIND_DN, AD_BIND_PASSWORD
├── .gitignore                  # excludes: node_modules/, .env
│
├── src/                         # backend logic
│   ├── server.js              # express entrypoint, API routing
│   ├── ldapClient.js          # bind, search, rangedSearch wrapper
│   ├── adQueries.js           # specific queries (searchUsers, getUser, searchGroups, getGroup)
│   └── export.js              # CSV/JSON formatter
│
└── public/                     # static frontend
    ├── index.html             # SPA markup, 2 tabs (Users/Groups)
    ├── app.js                 # vanilla JS, fetch API calls, DOM render
    └── style.css              # dark theme CSS
```

## Modules

| Module | Owner | Purpose | Dependencies | Size |
|---|---|---|---|---|
| `server.js` | backend | Express routing, error handler, API mount | express, adQueries, export | ~150 lines |
| `ldapClient.js` | backend | LDAP bind, search wrapper, range retrieval, objectSid decoding | ldapjs | ~140 lines |
| `adQueries.js` | backend | Filter + map (users, groups, batch resolution, primary group) | ldapClient, util parseOU/cnFromDN | ~200 lines |
| `export.js` | backend | CSV escape, JSON format, Content-Type | standard lib | 31 lines |
| `app.js` | frontend | Tab nav, fetch, DOM render, click nav | vanilla | ~210 lines |
| `index.html` | frontend | 2-tab layout, form, table, detail panel | vanilla | ~80 lines |
| `style.css` | frontend | dark theme vars, table/chip/detail layout | vanilla | ~215 lines |

**Entrypoint:** `src/server.js` -> listens on port `PORT` (default 3000 in the container). Compose maps host loopback port 3080 to container port 3000; it does not change `PORT`.

**Production dependencies:**
- `express@^4.19.2`: HTTP server
- `ldapjs@^3.0.7`: LDAP client

**No dev dependencies** (npm ci --omit=dev in Docker)

**Build:** multi-stage Dockerfile not used (simple copy of src+public, npm ci)

**Config read from:**
- Env vars: `AD_URL`, `AD_BASE_DN`, `AD_BIND_DN`, `AD_BIND_PASSWORD`, `PORT`, `AD_DISABLE_TLS_CHECK` (tests only)
- File fallback: `AD_BIND_PASSWORD_FILE` if defined (reads a secret file)
- `.env` gitignored (no git commit of credentials)

**Output:**
- Docker image: `ad-helper:latest` (~144MB, node:20-alpine + 2 npm packages)

**Limit:** no cache, no persistence: stateless, every instance is independent
