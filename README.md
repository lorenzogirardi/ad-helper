# AD Helper

UI web leggera, **solo lettura**, per consultare Active Directory: cercare utenti, vedere in che OU stanno, i loro gruppi (`memberOf`), cercare gruppi e vederne i membri. Pensata per girare in Docker su Mac/Windows (WSL) senza dover installare client LDAP.

Non modifica nulla su AD: bind con service account read-only, solo query `search`.

## Setup

1. Copia `.env.example` in `.env` e compila i valori (URL AD, base DN, service account):

   ```bash
   cp .env.example .env
   ```

2. Avvia:

   ```bash
   docker compose up --build
   ```

3. Apri [http://localhost:3080](http://localhost:3080)

L'app ascolta solo su `127.0.0.1`, quindi accessibile solo dalla macchina dove gira Docker.

## Variabili d'ambiente

| Variabile | Obbligatoria | Descrizione |
|---|---|---|
| `AD_URL` | sì | es. `ldap://ad.example.internal` |
| `AD_BASE_DN` | sì | es. `DC=ad,DC=example,DC=internal` |
| `AD_BIND_DN` | sì | service account read-only, es. `svc-adhelper@ad.example.internal` |
| `AD_BIND_PASSWORD` | sì* | password del service account |
| `AD_BIND_PASSWORD_FILE` | no | path a file con la password (Docker secret), ha priorità su `AD_BIND_PASSWORD` |
| `AD_BIND_DN_FILE` | no | idem, per lo username |
| `PORT` | no | default `3000` |
| `AD_DISABLE_TLS_CHECK` | no | `true` per disattivare verifica certificato su `ldaps://` (solo test) |

\* richiesta `AD_BIND_PASSWORD` oppure `AD_BIND_PASSWORD_FILE`.

## Funzioni

- Ricerca utenti per nome, `sAMAccountName` o email.
- Dettaglio utente: attributi principali, OU (path leggibile), stato attivo/disabilitato, gruppi di appartenenza.
- Ricerca gruppi per nome.
- Dettaglio gruppo: membri (gestisce anche gruppi molto grandi, oltre il limite AD di 1500 membri per risposta, via ranged retrieval).
- Export CSV/JSON per liste utenti, liste gruppi, membri gruppo.

## API

- `GET /api/users/search?q=...`
- `GET /api/users/search.csv?q=...` / `.json`
- `GET /api/users/:dn` (DN URL-encoded)
- `GET /api/groups/search?q=...`
- `GET /api/groups/search.csv?q=...` / `.json`
- `GET /api/groups/:dn`
- `GET /api/groups/:dn/members.csv` / `.json`

## Sviluppo locale senza Docker

```bash
npm install
cp .env.example .env   # e compila
npm start
```

## App desktop macOS (DMG)

`electron-app/` contiene un wrapper Electron separato. Non modifica Docker e non gestisce il suo ciclo di vita: Docker deve essere avviato manualmente prima dell'uso.

```bash
cd electron-app
npm install
npm start
```

Per creare il DMG unsigned:

```bash
npm run dist
```

Output: `electron-app/dist/`. Al primo avvio macOS può bloccare l'app non firmata: usare tasto destro → **Apri** (oppure **Privacy e sicurezza → Apri comunque**).

Il wrapper carica `http://127.0.0.1:3080` e verifica `/api/health`. Se Docker non risponde mostra una pagina locale con pulsante **Riprova**. Se la porta host viene cambiata in Compose, impostare l'URL prima di avviare Electron:

```bash
AD_HELPER_URL=http://127.0.0.1:3081 npm start
```
