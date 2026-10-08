# Scope documentazione

**Obiettivo:** descrivere architettura, responsabilità moduli, flussi, pattern AD specifici, setup operativo. No feature roadmap o decisioni future non approvate.

**Pubblico:** team sviluppo, admin IT deployment, manutentore futuro. Non end-user (no UI guide).

**Layer completati:**
- 0 Orientamento: contesto, glossario, stack
- 1 Struttura: inventario moduli, grafo, build
- 2 Architettura: responsabilità, wiring, AD pattern
- 3 Flussi: ricerca, dettaglio, export end-to-end
- 4 Operazioni: setup, troubleshoot, deploy

**Layer omessi (non pertinenti):**
- 5 Business: no varianti tenant/paese, no decisioni business fuori scope (solo setup IT)

**Perimetro del codice:**
- Include: backend Node.js, frontend vanilla, Docker, config
- Escludi: scambi AD interni (query dettagli utenti già in doc), migrazione da precedenti tool

**Limiti dichiarati:**
- Single base DN (no forest)
- LDAP plain MVP (no LDAPS MVP)
- No cache (fresh query ogni volta)
- No custom timeout (ldapjs default)
- Protetto da network (127.0.0.1 only) non autenticazione app

**Verifiche eseguite:**
- Lettura codice fonte completa
- Functional test: ricerca utente, ricerca gruppo, dettaglio gruppo + batch resolve, export CSV/JSON
- Schema AD osservato: email format, OU pattern, contractor `-ext` account
- Performance batch resolution: 140 membri < 2s

**Verifiche NON eseguite (fuori scope):**
- Load test scalabilità
- LDAPS + cert validation
- Multi-forest AD
- Compliance/audit
- Penetration test

**Domande aperte:**
- Q-OU-EXT: contractor OU? (Testato: same OU, no separate)
- Q-TLS: Produzione LDAPS? (EXTERNAL decision)
- Q-CACHE: cache per ricerche frequenti? (EXTERNAL backlog)

**Stato documentazione:** not-analyzed (ready for independent review)

**Data scope:** 2026-09-29
