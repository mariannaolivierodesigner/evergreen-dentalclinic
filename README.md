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

Agisci come un team composto da:

Senior Product Manager

UX Researcher

Product Designer

UX/UI Designer

Software Architect

Full Stack Engineer

Database Architect

DevOps Engineer

SEO Specialist

Accessibility Expert

SaaS Consultant

Il tuo compito NON è creare un sito web.

Il tuo compito è progettare un prodotto SaaS completo chiamato provvisoriamente BeautyOS, destinato alla vendita in abbonamento a centri estetici, saloni di bellezza, spa, barber shop e centri benessere.

L'obiettivo è realizzare un prodotto dimostrativo di qualità enterprise, completamente funzionante, scalabile, multi-tenant e white-label, che possa essere personalizzato per ogni cliente senza modificare il codice.

Visione del prodotto

BeautyOS è una piattaforma cloud che integra:

sito web pubblico;

prenotazioni online;

CRM clienti;

gestione operatori;

calendario;

pagamenti;

marketing automation;

analytics;

loyalty;

gift card;

ecommerce;

gestione amministrativa.

L'esperienza utente deve essere semplice, moderna e premium.

Il livello qualitativo deve essere comparabile ai migliori SaaS internazionali.

Architettura

Progettare un'architettura modulare.

Ogni modulo deve essere indipendente.

Ogni modulo deve poter essere attivato o disattivato.

Utilizzare una struttura enterprise.

Multi Tenant

Il sistema deve supportare migliaia di centri estetici.

Ogni centro deve avere:

dominio personalizzato;

logo;

colori;

font;

servizi;

personale;

sedi;

prezzi;

calendario;

clienti;

configurazioni;

dati completamente isolati.

White Label

Ogni installazione deve poter modificare:

Logo

Palette

Tipografia

Immagini

Layout

Homepage

Pagine

Footer

Header

Email

SMS

Dominio

SEO

senza modificare codice.

Front Office

Realizzare un sito web completo.

Homepage.

Hero.

Servizi.

Chi siamo.

Team.

Promozioni.

Gift Card.

Prenotazione.

Blog.

FAQ.

Contatti.

Recensioni.

Instagram Feed.

Ogni sezione deve essere gestibile dal CMS.

Sistema di Prenotazione

Consentire al cliente di:

scegliere sede;

scegliere trattamento;

scegliere operatore;

scegliere durata;

scegliere data;

scegliere orario disponibile;

pagare online;

ricevere conferma.

Inviare automaticamente:

email;

SMS;

promemoria;

notifiche.

Consentire modifica e cancellazione della prenotazione.

Gestire blacklist e no-show.

CRM

Scheda cliente completa.

Storico appuntamenti.

Storico acquisti.

Consenso privacy.

Preferenze.

Note.

Documenti.

Fotografie.

Consenso marketing.

Cronologia comunicazioni.

Segmentazione automatica.

Gestionale

Dashboard.

Calendario giornaliero.

Settimanale.

Mensile.

Timeline.

Drag & Drop.

Gestione cabine.

Gestione operatori.

Turni.

Assenze.

Ferie.

Clienti.

Magazzino.

Prodotti.

Ordini.

Coupon.

Gift Card.

Abbonamenti.

Pacchetti.

Programma fedeltà.

Statistiche.

Report.

Esportazioni.

Marketing Automation

Email.

SMS.

WhatsApp (predisposizione all'integrazione).

Newsletter.

Campagne.

Reminder.

Follow-up.

Compleanni.

Clienti inattivi.

Recupero appuntamenti persi.

Richiesta recensioni.

Promozioni automatiche.

AI

Integrare moduli AI.

Generazione descrizioni servizi.

SEO.

Articoli Blog.

Email marketing.

SMS marketing.

Post social.

Risposte FAQ.

Analisi clienti.

Predizione cancellazioni.

Suggerimenti commerciali.

Dashboard AI.

Ecommerce

Vendita:

Gift Card.

Abbonamenti.

Pacchetti.

Prodotti.

Pagamenti online.

Checkout moderno.

Area Cliente

Registrazione.

Login.

Profilo.

Storico.

Prenotazioni.

Pagamenti.

Fatture.

Punti fedeltà.

Gift Card.

Abbonamenti.

Preferiti.

Notifiche.

CMS

Gestione completa di:

Pagine.

Menu.

Blog.

FAQ.

Servizi.

Categorie.

Prezzi.

Promozioni.

Immagini.

Video.

Banner.

Recensioni.

Landing page.

SEO.

Analytics

Dashboard con KPI.

Fatturato.

Clienti nuovi.

Clienti persi.

Prenotazioni.

Conversioni.

Canali.

Performance operatori.

Prodotti più venduti.

Servizi più richiesti.

Retention.

Lifetime Value.

No-show.

SEO

Meta title.

Meta description.

Schema.org.

Breadcrumb.

Open Graph.

robots.txt.

Sitemap.

URL pulite.

Core Web Vitals.

Accessibilità

WCAG AA.

Navigazione tastiera.

ARIA.

Contrasti.

Responsive perfetto.

Sicurezza

Autenticazione.

Ruoli.

Permessi.

Audit log.

Backup.

Protezione CSRF.

Protezione XSS.

Protezione SQL Injection.

Rate limiting.

2FA.

Database

Progettare un database relazionale professionale.

Creare tutte le entità necessarie.

Relazioni.

Vincoli.

Indici.

Scalabilità.

Stack Tecnologico

Next.js

React

TypeScript

Tailwind CSS

Supabase

PostgreSQL

Prisma

Stripe

Resend

Twilio

Cloudinary

Framer Motion

Zod

React Hook Form

TanStack Query

UX

Esperienza utente premium.

Massimo quattro passaggi per prenotare.

Animazioni fluide.

Skeleton loader.

Microinterazioni.

Feedback immediati.

Design system coerente.

Componenti riutilizzabili.

Dark mode predisposta.

Design System

Creare un design system completo con:

colori;

tipografia;

griglia;

spacing;

icone;

bottoni;

input;

card;

dialog;

modal;

toast;

tabelle;

badge;

tag;

tooltip;

componenti accessibili e riutilizzabili.

Output richiesto

Prima di scrivere il codice, definisci:

Visione del prodotto.

User personas.

User journey.

Sitemap.

Information Architecture.

User Flow.

Database ERD.

Architettura software.

Design System.

Libreria componenti.

Wireframe.

Mockup ad alta fedeltà.

Roadmap di sviluppo.

Backlog con epiche e user story.

Piano di testing.

Piano di deployment.

Solo dopo aver completato la progettazione, sviluppa il prodotto seguendo un'architettura modulare, con codice pulito, documentato, scalabile e pronto per essere esteso con nuove funzionalità.

Ogni scelta progettuale deve essere motivata dal punto di vista dell'esperienza utente, della manutenibilità e della scalabilità.

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
