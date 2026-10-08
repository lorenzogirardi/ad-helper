# Disciplina di ownership

Owner significa ruolo. Cartografo: modello tecnico e struttura; Curatore delle evidenze: fonti e censimenti; Redattore business: traduzione business e scenari; Manutentore degli strumenti: parser/checker/generatori; Revisore: verdetti indipendenti. Un solo owner operativo per file; nessun nome personale.

Il registro ownership.json possiede assegnazioni, scope, dipendenze e procedure; ownership-catalog.md ne è la vista generata. Ogni file/cartella deve essere classificato; non assegnare automaticamente i nuovi file solo dalla posizione.

Distinguere fonte probatoria, master documentale e propagazione. Codice, configurazione versionata, snapshot e runtime provano tesi diverse. Le copie non possiedono il valore replicato. Per file `mixed` dichiarare campi manuali e derivati in `fields`; un output `generated` non possiede fatti.

Stato corrente delle unità: review-status.json. Provenienza delle fonti: sources.json. Perimetro: scope.md. Domande: open-questions.md. Scoperte: reading-log.md. Modifiche: CHANGELOG.md. Questi registri non sostituiscono i master di dominio né le fonti probatorie.

Inventari curati, report calcolati, hash storici e baseline approvate hanno procedure distinte. Non aggiornare una baseline per mascherare deriva; riesaminare prima. Seguire consumatori diretti/transitivi e cercare anche le occorrenze manuali. Il grafo è di derivazione, non un elenco di ogni hyperlink.

Per file nuovi aggiornare il registro prima del catalogo. Il gate verifica copertura e unicità degli scope dichiarati, non la verità o unicità semantica delle frasi. Scratch e backup restano esterni; gli archivi sono storici congelati, non fonte dello stato attuale.
