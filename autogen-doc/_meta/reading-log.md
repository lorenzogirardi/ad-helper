# Registro delle scoperte

Aggiungere voci append-only: data | area | scoperta | fonte | conseguenza documentale. Il log conserva la storia; i fatti correnti appartengono ai master di dominio.

| Data | Area | Scoperta | Fonte | Conseguenza documentale |
|---|---|---|---|---|
| 2026-09-29 | architettura | AD spezza attributi multivalore >1500 elementi in range (`member;range=0-1499`, ecc.), richiede loop lettura | `src/ldapClient.js` funzione `rangedSearch`, verificato contro comportamento AD documentato | Documentato pattern in 02-architecture/README.md sezione "Ranged attribute retrieval" |
| 2026-09-29 | architettura | Risolvere N membri gruppo con N query singole è inefficiente; batch OR-filter su `distinguishedName` (chunk 200) risolve in 1 query per chunk | `src/adQueries.js` funzione `resolveUserDetails`, testato su gruppo di esempio con 140 membri | Documentato pattern "Batch DN resolution" in 02-architecture, flusso F4 in 03-flussi |
| 2026-09-29 | operazioni | Header `Content-Disposition: attachment` su risposta JSON forzava download silenzioso browser, percepito da utente come "export vuoto" (non era un bug di dati, era UX) | `src/export.js` funzione `sendJSON`, riprodotto e risolto durante sviluppo | Documentato in 04-operations/README.md sezione troubleshooting, e regola F5 in 03-flussi |
| 2026-09-29 | dominio AD | Account contractor possono avere suffisso `-ext` in `sAMAccountName` e `mail`; nel campione osservato non avevano OU dedicata e risultavano `objectClass=user` | Test diretto su gruppo di esempio con 140 membri | Documentato in 00-overview e Q-OU-EXT in open-questions.md |
| 2026-09-29 | dominio AD | Utente standard può appartenere a 50+ gruppi (tecnici, SSO, organizzativi misti), non solo gruppi di team | Test diretto `getUser` su utente di esempio, campo `memberOf` | Documentato in flusso F2 03-flussi/README.md |
