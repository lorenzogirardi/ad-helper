# Documentazione del progetto — AD Helper

Stato: layer 0-4 documentati (orientamento, struttura, architettura, flussi, operazioni). Layer 5 (business) omesso — motivo in `_meta/scope.md`. In attesa di review indipendente (`in-review`).

Il codice è nella cartella superiore. `autogen-doc/` contiene master curati, governance e strumenti; gli output eventualmente generati saranno dichiarati nel registro.

## Percorso di lettura

**Per capire cos'è e a chi serve:** [Orientamento](00-overview/README.md)

**Per orientarsi nel codice:** [Struttura progetto](01-structure/README.md) — moduli, file, dipendenze

**Per capire come funziona internamente:** [Architettura](02-architecture/README.md) — responsabilità componenti, pattern AD (ranged retrieval, batch resolution, UAC decoding, DN parsing)

**Per capire i comportamenti end-to-end:** [Flussi](03-flussi/README.md) — ricerca utente/gruppo, dettaglio, export, regole con ID stabili

**Per fare setup/deploy/debug:** [Operazioni](04-operations/README.md) — env var, troubleshooting, Docker

**Governance:**
- [Perimetro e copertura](_meta/scope.md): cosa è incluso, escluso o ancora non letto.
- [Domande aperte](_meta/open-questions.md): dubbi con ID e residuo.
- [Stato corrente delle review](_meta/review-status.json): leggere perimetro e verbale prima di usare una conclusione.
- [Catalogo ownership](_meta/ownership-catalog.md): dove correggere un'informazione e quali copie aggiornare.
- [Metodo locale](_meta/methodology.md), [istruzioni agenti](AGENTS.md), [changelog](CHANGELOG.md).

Layer 5 (business/varianti) non applicabile: progetto è tool IT interno, no varianti tenant/paese/canale.

## Verifica dalla radice del codice

```text
node autogen-doc/tools/verify-docs.cjs --docs autogen-doc --write-catalog
node autogen-doc/tools/verify-docs.cjs --docs autogen-doc
```

Il primo comando aggiorna solo il catalogo dalle assegnazioni esplicite del registro. Un esito positivo non significa che il contenuto sia stato revisionato.
