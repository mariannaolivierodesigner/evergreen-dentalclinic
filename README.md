# Evergreen

Crea un'applicazione web full-stack completa per uno studio dentistico moderno, pensata come prodotto digitale realistico e production-ready: sito pubblico animato/interattivo + sistema di prenotazione online per i pazienti + gestionale (dashboard) per lo studio. Deve risultare un case study credibile di Product Design senior: non solo bello, ma con un flusso UX coerente, stati vuoti/di errore curati, micro-interazioni intenzionali e architettura dati sensata.

Stack: React + Tailwind CSS, Supabase per autenticazione, database e backend (integrato nativamente in Lovable). Design moderno, pulito, rassicurante (l'utente medio è ansioso quando pensa al dentista: il design deve trasmettere calma, professionalità, fiducia), con animazioni fluide ma mai eccessive.

Direzione visiva

Palette chiara, "clinical ma calda": bianco/grigio molto chiaro come base, un colore primario rassicurante (es. verde salvia, blu petrolio, o azzurro tenue — non il classico "azzurro ospedale" freddo), un accento secondario caldo (es. corallo/pesca) per CTA e highlight

Tipografia moderna, leggibile, con buona gerarchia (titoli importanti ma non aggressivi)

Molto spazio bianco, elementi arrotondati (border-radius generoso), ombre morbide, niente spigoli duri

Animazioni on-scroll (reveal, fade-in, parallax leggero), micro-interazioni su hover/click (bottoni con feedback tattile, transizioni fluide tra le sezioni), illustrazioni o icone custom a tema odontoiatrico (denti, sorriso, strumenti stilizzati — evitare immagini cliniche crude/spaventose)

Sezione hero con animazione d'impatto (es. un sorriso che si "costruisce" progressivamente, o forme organiche animate)

PARTE 1 — Sito pubblico (marketing site)

Home

Hero con claim forte (es. "Il tuo sorriso, la nostra missione") e CTA principale "Prenota una visita"

Sezione servizi offerti (igiene dentale, ortodonzia, implantologia, sbiancamento, odontoiatria pediatrica, urgenze) con card animate

Sezione "Perché scegliere lo studio" (tecnologie all'avanguardia, staff qualificato, ambiente confortevole, sedazione cosciente per pazienti ansiosi)

Presentazione del team medico (card con foto, nome, specializzazione, breve bio)

Sezione recensioni/testimonianze pazienti (carousel)

Sezione "prima/dopo" per trattamenti estetici (galleria)

CTA finale a tutta larghezza per la prenotazione

Footer con contatti, orari, mappa dello studio, social, link a privacy/cookie policy

Pagine di dettaglio

Pagina per ogni servizio/trattamento con descrizione, cosa aspettarsi, durata media, FAQ specifiche

Pagina "Chi siamo" con storia dello studio, valori, tour virtuale/fotografico degli ambienti

Pagina contatti con form, mappa interattiva, orari di apertura

Blog/risorse (opzionale ma consigliato per credibilità del case study)

Sezione articoli su prevenzione e cura dentale, per dimostrare SEO/content strategy nel prodotto

PARTE 2 — Sistema di prenotazione (area paziente)

Onboarding e autenticazione

Registrazione/login paziente (email + password, opzione social login)

Onboarding con raccolta dati anagrafici essenziali e eventuale anamnesi base (allergie, patologie rilevanti — semplice checklist, non un modulo clinico completo)

Prenotazione appuntamento

Flusso guidato multi-step: scelta del servizio → scelta del medico (o "primo disponibile") → calendario con slot disponibili in tempo reale → conferma

Calendario interattivo con disponibilità reali (slot occupati non selezionabili), animazioni di selezione fluide

Riepilogo prenotazione con possibilità di aggiungere note per il medico

Conferma con notifica (in-app, e simulazione di invio email/reminder)

Area personale paziente

Dashboard con prossimi appuntamenti, storico visite, possibilità di annullare/riprogrammare (con policy tipo "cancellabile fino a 24h prima")

Documenti/referti scaricabili (mock, anche solo struttura UI)

Promemoria automatici richiami periodici (es. igiene semestrale)

PARTE 3 — Gestionale per lo studio (dashboard interna, area riservata staff)

Accesso

Login separato per staff (ruoli: amministratore, medico, receptionist) con permessi differenziati

Dashboard principale

Vista d'insieme: appuntamenti di oggi, occupazione settimanale, KPI rapidi (numero pazienti attivi, tasso di cancellazione, appuntamenti da confermare)

Grafici semplici (andamento prenotazioni nel tempo, distribuzione per tipo di servizio) — usa Recharts o simile

Gestione agenda

Calendario multi-medico (vista giornaliera/settimanale) con drag & drop per spostare appuntamenti

Possibilità di bloccare slot (ferie, pause), creare appuntamenti manualmente, gestire liste d'attesa

Gestione pazienti (anagrafica)

Elenco pazienti con ricerca/filtri, scheda paziente con storico appuntamenti, note cliniche essenziali, contatti

Possibilità per lo staff di aggiungere note post-visita

Gestione servizi/listino

CRUD per i trattamenti offerti (nome, durata, prezzo, descrizione mostrata sul sito pubblico)

Notifiche e comunicazioni

Pannello per gestire i reminder automatici ai pazienti (es. conferma 24h prima)

Requisiti trasversali (per credibilità come case study senior)

Responsive design completo: il flusso di prenotazione deve funzionare bene anche da mobile, dato che molti pazienti prenoteranno da smartphone

Stati gestiti con cura: loading states, empty states (es. "nessun appuntamento in programma"), error states, conferme di azioni distruttive (es. "sei sicura di voler cancellare l'appuntamento?")

Accessibilità: contrasti adeguati, focus states visibili, form con label corrette

Privacy/GDPR: essendo dati sanitari, prevedi consenso esplicito al trattamento dati in fase di registrazione/prenotazione, e pagina privacy policy dedicata che menzioni il trattamento di dati relativi alla salute

Dati mock realistici precaricati (medici, pazienti fittizi, appuntamenti d'esempio) così l'app sia subito dimostrabile e popolata, non vuota

Nota per l'uso come demo

Questo prodotto verrà mostrato sia in un portfolio di Product Design (quindi conta la coerenza del processo UX e la cura dei dettagli) sia come demo a potenziali clienti reali di studi dentistici (quindi conta che sembri un prodotto vendibile, credibile, "pronto per il mercato"). Cura entrambi gli aspetti: micro-copy professionale e rassicurante in italiano, nessun elemento placeholder visibile ("lorem ipsum" da evitare), dati di esempio coerenti e realistici.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://evergreen-dentalclinic.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/ec9c14c2-6085-40b2-a414-4c47bb031695).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
