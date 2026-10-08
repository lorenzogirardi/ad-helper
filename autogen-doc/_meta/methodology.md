# Metodo locale

Adottato da documentation-skill, versione in project.json. Questo documento applica il metodo al progetto; gli aggiornamenti della skill richiedono un diff revisionato e non sovrascrivono automaticamente questa cartella.

## Tre percorsi

**Creare:** censire fonti e confini → assegnare master → documentare orientamento, struttura, componenti/dati, flussi, varianti e business pertinenti → review di dominio e trasversale. Un layer nuovo può correggere quelli precedenti.

**Aggiornare:** individuare delta dalla revisione documentata → master e dipendenze → correggere sorgenti/copie → check contenuto → rigenerazione → review indipendente → log e stato aggiornati. Per dataset, copertura entità × campo × ogni luogo che lo afferma, con residui espliciti.

**Review:** in sola lettura su master e output; riaprire fonti, cercare controesempi e contraddizioni tra layer. Produrre verbale con rilievi, perimetro, controlli, revisione e limiti. Correzioni implementate da autore diverso dal reviewer finale.

## Evidenze e completamento

Citare file relativo alla radice del codice, simbolo e righe alla revisione esaminata. Snapshot/configurazioni riportano fonte, ambiente e data/hash se conosciuti. Separare fatto statico, dato persistito, inferenza e runtime; nessun risultato di un sistema remoto dedotto dalla sola chiamata.

Una modifica è completa quando tutte le copie pertinenti sono coerenti, i gate effettivamente applicabili passano, esiste un verdetto indipendente, domande e navigazione sono aggiornate e i log descrivono il diff reale. Senza review indipendente il contenuto resta `in-review`, anche con checker verdi.

Con deploy frequenti aggiornare per cambiamento significativo/PR, non per evento. Annotare separatamente commit documentato e snapshot ambientali. I comandi specifici verificati del progetto appartengono a project.json; non registrarli come eseguiti senza averli provati.
