# Changelog documentale

Ogni voce: data, risultato e motivo, elenco esatto dei file nuovi/aggiornati/rimossi, verifiche e limiti. Le voci precedenti restano immutate; le rettifiche si aggiungono.

## 2026-09-30 — Verifica post-rettifiche

**Risultato:** controlli finali sui cinque punti della review completati: ranged retrieval allineato a `pageSize=1000`, conteggi sorgente verificati, limite risultati qualificato come server-dependent, Q-TLS qualificata come decisione esterna, backlog separato dalla reference.

**Verifiche:** `node autogen-doc/tools/verify-docs.cjs --docs autogen-doc` → `PASS` (19 file, 8 cartelle, 0 errori); scan privacy su documentazione, `README.md` e `.env.example` senza match di domini, nomi, secret o path locali reali.

**Limite:** tentativi di review indipendente dopo i fix non completati per errore/stallo dell'infrastruttura agenti; stato resta `in-review`.

## 2026-09-29 — Rettifiche dopo review indipendente

**Risultato:** corrette descrizioni ranged retrieval, conteggi file, limite risultati, prerequisito LDAPS e riferimenti a backlog.

**File aggiornati:**
- `00-overview/README.md`
- `01-structure/README.md`
- `02-architecture/README.md`
- `03-flussi/README.md`
- `04-operations/README.md`

**Verifiche:** pending seconda review indipendente; status resta `in-review`.

## 2026-09-29 — Prima documentazione completa (layer 0-4)

**Risultato:** creata documentazione tecnica completa del progetto AD Helper, layer Orientamento→Operazioni, secondo documentation-skill + Diataxis.

**Motivo:** richiesta utente di documentazione tecnica per progetto completato e verificato funzionante in produzione.

**File nuovi:**
- `00-overview/README.md` — proposito, stack, glossario, limiti
- `01-structure/README.md` — inventario moduli, file, dipendenze
- `02-architecture/README.md` — responsabilità componenti, pattern AD (ranged retrieval, batch resolution, UAC decoding, DN parsing, filter escaping)
- `03-flussi/README.md` — 5 flussi end-to-end (ricerca utente/gruppo, dettaglio, export), 5 regole con ID stabili
- `04-operations/README.md` — setup, config, troubleshooting, deploy, monitoring

**File aggiornati:**
- `README.md` — percorso di lettura per pubblico/domanda, link nuovi layer
- `_meta/sources.json` — 5 fonti (codice, frontend, config, snapshot AD osservato, test runtime)
- `_meta/scope.md` — perimetro layer 0-4, layer 5 omesso con motivo
- `_meta/ownership.json` — 4 cartelle + 4 file master registrati (01-04)
- `_meta/review-status.json` — 5 unità in stato `in-review`
- `_meta/open-questions.md` — 5 domande (Q-OU-EXT, Q-TLS, Q-CACHE, Q-FOREST, Q-RANGE-LARGE)
- `_meta/reading-log.md` — 5 scoperte registrate

**Verifiche eseguite:**
- Lettura diretta codice sorgente: `src/server.js`, `src/adQueries.js`, `src/ldapClient.js`, `src/export.js`, `public/app.js`
- Gate strutturale `verify-docs.cjs` eseguito
- Contenuto riconciliato con verifica funzionale già eseguita in sessione precedente (curl su AD reale, gruppo 140 membri)

**Limiti dichiarati:**
- Review indipendente non ancora eseguita (stato `in-review` su tutte le unità)
- Nessun test automatizzato eseguito in questa sessione (verifiche manuali via curl/browser in sessione precedente)
- `rangedSearch` non testato su gruppo reale >1500 membri (Q-RANGE-LARGE)
- Layer 5 (business) omesso: non pertinente, tool IT interno senza varianti tenant/canale
