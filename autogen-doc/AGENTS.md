# Istruzioni per autogen-doc

Prima di modificare: leggere README, `_meta/project.json`, `_meta/scope.md`, `_meta/methodology.md`, `_meta/ownership.json` e le domande pertinenti. Applicare la versione di documentation-skill registrata nel progetto quando disponibile. Le istruzioni del repository e il perimetro autorizzato restano prevalenti.

- Individuare master e ruolo prima di editare; niente owner nominativi. I campi derivati e gli output non si correggono a mano.
- Separare codice, configurazione versionata, snapshot ed evidenza runtime. Non pubblicare secret o dati personali.
- Delegare analisi profonde per sottodomini con fonti complete e file di scrittura disgiunti. Review da un agente diverso dall'autore; se indisponibile lasciare `in-review` e dichiarare il limite.
- Propagare verso layer precedenti e successivi, incluse sintesi, JSON, scenari, domande, aggregati e output. Dataset nuovi: matrice entità × campo × consumatore e confronto dei valori, non sola ricerca per keyword.
- Stato corrente delle review solo in `_meta/review-status.json`; le pagine rimandano a quel master. `validated` richiede un verbale indipendente riferito alla versione verificata.
- Eseguire i controlli pertinenti e rigenerare output da sorgenti riconciliate. Il gate ownership è strutturale, non prova la correttezza dei fatti.
- Aggiornare changelog, reading-log, navigazione e registro per i file cambiati. Conservare storia e ID. Scratch e backup fuori da autogen-doc.
- In modalità review non modificare master/output: produrre un verbale separato; fix solo se richiesti, poi nuova review indipendente.
