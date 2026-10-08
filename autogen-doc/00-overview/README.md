# AD Helper — Consultazione LDAP in lettura

**Proposito:** web UI leggera per interrogare Active Directory aziendale da Mac/Windows+WSL, senza client LDAP da terminale.

**Scope:** lettura pura — cerca utenti, gruppi, mostra appartenenze, OU, dettagli, export CSV/JSON. No write/modify.

**Stack verificato:**
- Backend: Node.js 20 + Express 4 + ldapjs 3
- Frontend: vanilla HTML/JS, nessun framework
- Deploy: Docker + Compose su `node:20-alpine`
- Autenticazione: bind LDAP con service account, configurato via env var, nessun login utente nell'app

**Pubblico:**
- Admin IT: consultazione rapida AD senza ldapsearch da terminale
- Team tecnico: verifica appartenenze gruppo, status utente

**Link principali:**
- [Struttura progetto](../01-structure/README.md) — moduli, file
- [Architettura](../02-architecture/README.md) — responsabilità, AD patterns
- [Flussi](../03-flussi/README.md) — ricerca, export
- [Operazioni](../04-operations/README.md) — setup, deploy Docker

**Glossario locale:**
- **DN (Distinguished Name):** path completo utente/gruppo in LDAP, es. `CN=Jane Doe,OU=IT,OU=Accounts,DC=ad,DC=example,DC=internal`
- **OU:** organizational unit = divisione/team/ufficio nella gerarchia AD
- **sAMAccountName:** username pre-Windows-2000, es. `jane.doe`
- **memberOf:** attributo lista, contiene DN dei gruppi a cui l'utente appartiene
- **member:** attributo lista su gruppo, contiene DN degli utenti/gruppi nel gruppo
- **userAccountControl (UAC):** bitmask, bit 2 = account disabilitato

**Limitazioni dichiarate:**
- Legge da un solo base DN configurato (non multi-forest)
- No LDAPS certificato (MVP su LDAP plain, TLS skip-verify per test)
- Limite risultati: dipende dal server LDAP (spesso 1500), non un default imposto dal codice; gestito con flag `truncated`
- Nessuna cache, ogni ricerca interroga il server
- Protetto da network (bind 127.0.0.1) non da autenticazione app

**Versione skill:** 0.1.0  
**Documento letto:** 2026-09-29

## Domande aperte
| ID | Priorità | Stato | Domanda | Evidenza |
|---|---|---|---|---|
| Q-OU-EXT | media | OPEN | Account `-ext` (contractor) hanno OU uguale a persona? | Testato: account contractor `-ext` osservato con OU standard, non OU separato |
| Q-TLS | bassa | EXTERNAL | Produzione richiede LDAPS + cert? | Decisione cliente, non nel perimetro MVP |
| Q-CACHE | bassa | EXTERNAL | Cache risultati ricerca? | Proposta futura, no per MVP |
