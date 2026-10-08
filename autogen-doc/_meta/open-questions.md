# Domande aperte

Registro unico.

| ID | Priorità | Stato | Domanda | Evidenza / risposta | Residuo e prova necessaria | Unità |
|---|---|---|---|---|---|---|
| Q-OU-EXT | media | PARTIAL | Account contractor (`-ext`) hanno OU/struttura diversa da account persona standard? | Testato: account `user-example-ext@example.internal` ha OU standard — stessa struttura, nessuna OU dedicata a contractor osservata | Nessun test su altre unità organizzative per confermare pattern uniforme | architecture, flows |
| Q-TLS | bassa | EXTERNAL | Deploy in produzione richiede LDAPS con validazione certificato invece di LDAP plain? | MVP usa `ldap://` semplice, `AD_DISABLE_TLS_CHECK` esiste solo come flag test | Decisione IT/security fuori dal perimetro di questa documentazione | operations |
| Q-CACHE | bassa | EXTERNAL | Serve introdurre cache (Redis o in-memory) per ricerche frequenti? | Design attuale è stateless per scelta (consistenza dati), nessun problema di performance osservato con 140 membri | Richiede dato di utilizzo reale (frequenza query, numero utenti concorrenti) non disponibile ora | operations |
| Q-FOREST | bassa | OPEN | App supporta multi-forest/multi-base-DN AD? | Codice legge un solo `AD_BASE_DN` da env, nessun supporto multi-base osservato in `adQueries.js`/`server.js` | Nessuna richiesta cliente per multi-forest finora | structure, architecture |
| Q-RANGE-LARGE | bassa | OPEN | `rangedSearch` testato solo su gruppo con 140 membri (sotto soglia 1500 di un singolo range). Comportamento corretto anche su gruppi >1500 membri con range multipli reali? | Codice implementa loop generico, logica letta e coerente con documentazione AD ufficiale, ma nessun gruppo >1500 membri disponibile nell'ambiente di test per verifica diretta | Serve un gruppo reale con >1500 membri per test end-to-end del loop multi-range | architecture, flows |

Stati: OPEN, PARTIAL, EXTERNAL, CLOSED. Conservare ID e motivazione; aggiornare le copie con link all'ID. Un dato di configurazione non chiude automaticamente una domanda runtime.
