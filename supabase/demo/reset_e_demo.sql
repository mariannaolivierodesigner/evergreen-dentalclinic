-- =====================================================================
--  LONGOBARDI — pulizia del gestionale + dati demo realistici
--  Da incollare in Lovable → Cloud → SQL editor ed eseguire UNA volta.
--
--  Cosa fa:
--   1. Cancella appuntamenti, documenti, messaggi, ferie/permessi,
--      turni, notifiche, registro modifiche e i pazienti "di prova"
--      senza account (i tuoi account e i ruoli restano intatti).
--   2. Crea uno staff demo di 4 medici con i loro turni settimanali.
--   3. Crea 28 pazienti, un'agenda realistica (6 settimane passate,
--      2 future, oggi pieno), documenti, messaggi e due assenze.
--  Trattamenti, recensioni e articoli del magazine non vengono toccati.
-- =====================================================================

BEGIN;

-- ---------- 1. PULIZIA ----------
DELETE FROM public.notifications;
DELETE FROM public.appointments;
DELETE FROM public.documents;
DELETE FROM public.contact_messages;
DELETE FROM public.blocked_slots;
DELETE FROM public.blocked_slots_audit_log;
DELETE FROM public.doctor_availability;
DELETE FROM public.profiles WHERE user_id IS NULL;

-- ---------- 2. STAFF DEMO ----------
INSERT INTO public.doctors (id, full_name, specialization, bio, color) VALUES
 ('11111111-1111-4111-8111-000000000001','Dott.ssa Elena Ferraro','Conservativa e igiene dentale','Laureata a Padova, si occupa di prevenzione e igiene professionale. Ha un approccio delicato, particolarmente apprezzato dai pazienti con ansia odontoiatrica.','#7BA79D'),
 ('11111111-1111-4111-8111-000000000002','Dott. Marco Bianchi','Implantologia e chirurgia orale','Oltre 15 anni di esperienza in implantologia guidata computer assistita. Docente a contratto in chirurgia orale.','#5E8B9E'),
 ('11111111-1111-4111-8111-000000000003','Dott.ssa Giulia Rinaldi','Ortodonzia e allineatori trasparenti','Specialista in ortodonzia per adulti e adolescenti, certificata per i principali sistemi di allineatori invisibili.','#C98B72'),
 ('11111111-1111-4111-8111-000000000004','Dott. Luca Moretti','Odontoiatria pediatrica','Dedica il suo lavoro ai piccoli pazienti: visite giocose, linguaggio semplice e nessuna fretta.','#8FA36B')
ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name, specialization = EXCLUDED.specialization, bio = EXCLUDED.bio, color = EXCLUDED.color;

-- Turni settimanali (1 = lunedì ... 5 = venerdì)
INSERT INTO public.doctor_availability (doctor_id, weekday, start_time, end_time)
SELECT d.id, w, t.s, t.e
FROM (VALUES
  ('11111111-1111-4111-8111-000000000001'::uuid, ARRAY[1,2,3,4,5]),
  ('11111111-1111-4111-8111-000000000002'::uuid, ARRAY[1,2,3,4]),
  ('11111111-1111-4111-8111-000000000003'::uuid, ARRAY[2,4,5]),
  ('11111111-1111-4111-8111-000000000004'::uuid, ARRAY[1,3,4,5])
) AS d(id, days)
CROSS JOIN LATERAL unnest(d.days) AS w
CROSS JOIN (VALUES ('09:00'::time,'13:00'::time), ('14:00'::time,'18:00'::time)) AS t(s,e);

-- ---------- 3. PAZIENTI ----------
INSERT INTO public.profiles (id, full_name, email, phone, birth_date, allergies, conditions, notes, privacy_consent, onboarded) VALUES
 ('33333333-3333-4333-8333-000000000001','Chiara Belli','chiara.belli@example.com','+39 340 118 2244','1989-04-12','{"Lattice"}','{}','Paziente ansiosa: preferisce appuntamenti al mattino.',true,true),
 ('33333333-3333-4333-8333-000000000002','Andrea Gallo','andrea.gallo@example.com','+39 333 985 1120','1976-11-03','{}','{"Ipertensione"}','In terapia con anticoagulanti, avvisare prima di estrazioni.',true,true),
 ('33333333-3333-4333-8333-000000000003','Sofia Marchetti','sofia.marchetti@example.com','+39 349 776 3390','1995-06-27','{"Penicillina"}','{}',NULL,true,true),
 ('33333333-3333-4333-8333-000000000004','Davide Conti','davide.conti@example.com','+39 328 445 9902','1982-01-19','{}','{}','Richiamo igiene semestrale.',true,true),
 ('33333333-3333-4333-8333-000000000005','Martina Esposito','martina.esposito@example.com','+39 351 220 7781','2016-09-05','{}','{}','Piccola paziente, accompagnata dalla mamma.',true,true),
 ('33333333-3333-4333-8333-000000000006','Riccardo Fontana','riccardo.fontana@example.com','+39 347 662 1145','1968-03-30','{}','{"Diabete tipo 2"}','Valutazione implantologica in corso.',true,true),
 ('33333333-3333-4333-8333-000000000007','Giulia Romano','giulia.romano@example.com','+39 339 504 7716','1993-09-14','{}','{}','Allineatori trasparenti in corso.',true,true),
 ('33333333-3333-4333-8333-000000000008','Luca Ferri','luca.ferri@example.com','+39 335 281 4093','1985-02-08','{"Ibuprofene"}','{}',NULL,true,true),
 ('33333333-3333-4333-8333-000000000009','Elisa Colombo','elisa.colombo@example.com','+39 346 912 3358','1999-12-21','{}','{}','Prima visita per sbiancamento.',true,true),
 ('33333333-3333-4333-8333-000000000010','Paolo Greco','paolo.greco@example.com','+39 338 670 2481','1972-07-02','{}','{"Bruxismo"}','Bite notturno consigliato.',true,true),
 ('33333333-3333-4333-8333-000000000011','Tommaso Greco','tommaso.greco@example.com','+39 338 670 2481','2014-05-18','{}','{}','Figlio di Paolo. Sigillature eseguite.',true,true),
 ('33333333-3333-4333-8333-000000000012','Anna Villa','anna.villa@example.com','+39 347 188 5502','1961-10-09','{}','{"Osteoporosi"}','Protesi mobile superiore, controllo annuale.',true,true),
 ('33333333-3333-4333-8333-000000000013','Federico Rizzo','federico.rizzo@example.com','+39 329 733 0615','1990-03-25','{}','{}',NULL,true,true),
 ('33333333-3333-4333-8333-000000000014','Valentina Moretti','valentina.moretti@example.com','+39 340 556 8827','1987-08-30','{}','{}','Richiamo igiene ogni 6 mesi.',true,true),
 ('33333333-3333-4333-8333-000000000015','Marco Neri','marco.neri@example.com','+39 342 811 0934','1979-01-11','{}','{}','Controllo semestrale.',true,true),
 ('33333333-3333-4333-8333-000000000016','Laura Testa','laura.testa@example.com','+39 349 227 6410','1991-06-03','{}','{}',NULL,true,true),
 ('33333333-3333-4333-8333-000000000017','Simone Barbieri','simone.barbieri@example.com','+39 333 604 7712','1984-11-22','{}','{}','Sensibilità al freddo.',true,true),
 ('33333333-3333-4333-8333-000000000018','Francesca Leone','francesca.leone@example.com','+39 347 395 1180','1997-04-05','{}','{}',NULL,true,true),
 ('33333333-3333-4333-8333-000000000019','Alessandro Gatti','alessandro.gatti@example.com','+39 338 456 9023','1966-09-17','{}','{}','Corona provvisoria in attesa del definitivo.',true,true),
 ('33333333-3333-4333-8333-000000000020','Ilaria Monti','ilaria.monti@example.com','+39 340 689 2251','2001-02-28','{}','{}',NULL,true,true),
 ('33333333-3333-4333-8333-000000000021','Stefano Caruso','stefano.caruso@example.com','+39 335 774 3306','1975-12-12','{}','{}',NULL,true,true),
 ('33333333-3333-4333-8333-000000000022','Beatrice Fabbri','beatrice.fabbri@example.com','+39 346 128 5547','1988-07-19','{}','{}','Preferisce appuntamenti nel pomeriggio.',true,true),
 ('33333333-3333-4333-8333-000000000023','Nicola Serra','nicola.serra@example.com','+39 329 540 8819','1993-10-01','{}','{}',NULL,true,true),
 ('33333333-3333-4333-8333-000000000024','Camilla Longo','camilla.longo@example.com','+39 348 903 6672','1986-05-23','{}','{}',NULL,true,true),
 ('33333333-3333-4333-8333-000000000025','Sara Pellegrini','sara.pellegrini@example.com','+39 347 410 2299','2015-03-09','{}','{}','Figlia di Marta Pellegrini.',true,true),
 ('33333333-3333-4333-8333-000000000026','Leonardo Bruno','leonardo.bruno@example.com','+39 339 215 7740','2017-11-30','{}','{}',NULL,true,true),
 ('33333333-3333-4333-8333-000000000027','Aurora Silvestri','aurora.silvestri@example.com','+39 333 880 1426','2013-08-14','{}','{}','Controllo con apparecchio mobile.',true,true),
 ('33333333-3333-4333-8333-000000000028','Matteo Ricci','matteo.ricci@example.com','+39 340 972 3085','2018-01-22','{}','{}',NULL,true,true)
ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name, email = EXCLUDED.email, phone = EXCLUDED.phone,
  birth_date = EXCLUDED.birth_date, allergies = EXCLUDED.allergies, conditions = EXCLUDED.conditions, notes = EXCLUDED.notes;

-- ---------- 4. AGENDA ----------
DO $$
DECLARE
  adults uuid[] := ARRAY[
    '33333333-3333-4333-8333-000000000001','33333333-3333-4333-8333-000000000002','33333333-3333-4333-8333-000000000003',
    '33333333-3333-4333-8333-000000000004','33333333-3333-4333-8333-000000000006','33333333-3333-4333-8333-000000000007',
    '33333333-3333-4333-8333-000000000008','33333333-3333-4333-8333-000000000009','33333333-3333-4333-8333-000000000010',
    '33333333-3333-4333-8333-000000000012','33333333-3333-4333-8333-000000000013','33333333-3333-4333-8333-000000000014',
    '33333333-3333-4333-8333-000000000015','33333333-3333-4333-8333-000000000016','33333333-3333-4333-8333-000000000017','33333333-3333-4333-8333-000000000018','33333333-3333-4333-8333-000000000019','33333333-3333-4333-8333-000000000020','33333333-3333-4333-8333-000000000021','33333333-3333-4333-8333-000000000022','33333333-3333-4333-8333-000000000023','33333333-3333-4333-8333-000000000024']::uuid[];
  kids uuid[] := ARRAY['33333333-3333-4333-8333-000000000005','33333333-3333-4333-8333-000000000011','33333333-3333-4333-8333-000000000025','33333333-3333-4333-8333-000000000026','33333333-3333-4333-8333-000000000027','33333333-3333-4333-8333-000000000028']::uuid[];
  docs uuid[] := ARRAY['11111111-1111-4111-8111-000000000001','11111111-1111-4111-8111-000000000002',
                       '11111111-1111-4111-8111-000000000003','11111111-1111-4111-8111-000000000004']::uuid[];
  -- orari di inizio per medico (ore decimali) e servizi
  slots numeric[][] := ARRAY[
    ARRAY[9, 10, 11.5, 14.5, 16],
    ARRAY[9, 10.5, 14.5, 16.5, 0],
    ARRAY[9.5, 11, 15, 16.5, 0],
    ARRAY[9.5, 14.5, 15.5, 17, 0]];
  wdays int[][] := ARRAY[ARRAY[1,2,3,4,5], ARRAY[1,2,3,4,0], ARRAY[2,4,5,0,0], ARRAY[1,3,4,5,0]];
  svc_for uuid[] := ARRAY[
    '22222222-2222-4222-8222-000000000001','22222222-2222-4222-8222-000000000003',
    '22222222-2222-4222-8222-000000000002','22222222-2222-4222-8222-000000000005']::uuid[];
  d int; i int; k int; dow int; h numeric; pid uuid; sid uuid; dur int; st timestamptz; en timestamptz;
  status public.appointment_status; n_ad int := array_length(adults,1); h_val int; mins int;
  pnote text; snote text;
BEGIN
  FOR d IN -42..14 LOOP
    dow := extract(isodow FROM (current_date + d))::int;
    CONTINUE WHEN dow > 5;
    FOR i IN 1..4 LOOP
      CONTINUE WHEN NOT (dow = ANY (wdays[i:i][1:5]));
      FOR k IN 1..5 LOOP
        h := slots[i][k];
        CONTINUE WHEN h = 0;
        CONTINUE WHEN (abs(d * 7 + i * 3 + k * 5)) % 2 = 0;
        CONTINUE WHEN i = 4 AND (abs(d + k)) % 3 <> 0;  -- pediatria: meno visite  -- lascia buchi liberi, come in uno studio reale
        IF i = 4 THEN
          pid := kids[1 + (abs(d * 13 + k * 7)) % 6];
        ELSE
          pid := adults[1 + (abs(d * 37 + k * 11 + i * 17 + d * d)) % n_ad];
        END IF;
        sid := svc_for[i];
        IF i = 1 AND (abs(d + k)) % 4 = 0 THEN sid := '22222222-2222-4222-8222-000000000004'; END IF; -- sbiancamento
        IF i = 4 AND (abs(d + k)) % 7 = 0 THEN sid := '22222222-2222-4222-8222-000000000006'; END IF; -- urgenza
        SELECT duration_min INTO dur FROM public.services WHERE id = sid;
        h_val := floor(h)::int; mins := round((h - floor(h)) * 60)::int;
        st := ((current_date + d)::timestamp + make_interval(hours => h_val, mins => mins)) AT TIME ZONE 'Europe/Rome';
        en := st + make_interval(mins => dur);
        IF st < now() THEN
          status := 'completed';
          IF (abs(d * 3 + k + i)) % 13 = 0 THEN status := 'cancelled'; END IF;
          IF (abs(d * 3 + k + i)) % 29 = 0 THEN status := 'no_show'; END IF;
        ELSE
          status := 'confirmed';
          IF d > 0 AND (abs(d + k + i)) % 4 = 0 THEN status := 'pending'; END IF;
          IF d = 0 AND (abs(k + i)) % 4 = 0 THEN status := 'pending'; END IF;
        END IF;
        pnote := NULL; snote := NULL;
        IF (abs(d + k * 2 + i)) % 9 = 0 THEN pnote := 'Vorrei una spiegazione chiara prima di iniziare, sono un po'' ansioso/a.'; END IF;
        IF (abs(d + k + i * 2)) % 11 = 0 AND status = 'completed' THEN snote := 'Eseguito senza complicazioni, richiamo consigliato tra 6 mesi.'; END IF;
        INSERT INTO public.appointments (patient_id, doctor_id, service_id, starts_at, ends_at, status, patient_note, staff_note, reminder_sent)
        VALUES (pid, docs[i], sid, st, en, status, pnote, snote, (status = 'confirmed' AND d <= 1));
      END LOOP;
    END LOOP;
  END LOOP;
END $$;

-- ---------- 5. DOCUMENTI ----------
INSERT INTO public.documents (patient_id, title, kind, issued_on) VALUES
 ('33333333-3333-4333-8333-000000000001','Referto igiene dentale','referto', current_date - 170),
 ('33333333-3333-4333-8333-000000000001','Consenso informato — igiene professionale','altro', current_date - 170),
 ('33333333-3333-4333-8333-000000000002','Radiografia panoramica','radiografia', current_date - 75),
 ('33333333-3333-4333-8333-000000000002','Piano di cura implantologico','piano', current_date - 60),
 ('33333333-3333-4333-8333-000000000002','Preventivo implantologia — firmato','preventivo', current_date - 58),
 ('33333333-3333-4333-8333-000000000002','Consenso informato — intervento implantare','altro', current_date - 40),
 ('33333333-3333-4333-8333-000000000002','Fattura n. 2026/041','altro', current_date - 38),
 ('33333333-3333-4333-8333-000000000003','Referto visita di controllo','referto', current_date - 30),
 ('33333333-3333-4333-8333-000000000006','Radiografia panoramica','radiografia', current_date - 20),
 ('33333333-3333-4333-8333-000000000006','Preventivo implantologia','preventivo', current_date - 12),
 ('33333333-3333-4333-8333-000000000007','Piano di cura ortodontico — allineatori','piano', current_date - 100),
 ('33333333-3333-4333-8333-000000000007','Preventivo ortodonzia — firmato','preventivo', current_date - 98),
 ('33333333-3333-4333-8333-000000000007','Consenso informato — trattamento ortodontico','altro', current_date - 97),
 ('33333333-3333-4333-8333-000000000007','Fattura n. 2026/033','altro', current_date - 90),
 ('33333333-3333-4333-8333-000000000009','Preventivo sbiancamento','preventivo', current_date - 6),
 ('33333333-3333-4333-8333-000000000010','Referto visita — bruxismo','referto', current_date - 45),
 ('33333333-3333-4333-8333-000000000011','Referto sigillature','referto', current_date - 52),
 ('33333333-3333-4333-8333-000000000011','Consenso informato — sigillature (firmato dal genitore)','altro', current_date - 52),
 ('33333333-3333-4333-8333-000000000012','Radiografia endorale','radiografia', current_date - 80),
 ('33333333-3333-4333-8333-000000000014','Referto igiene dentale','referto', current_date - 33),
 ('33333333-3333-4333-8333-000000000014','Fattura n. 2026/052','altro', current_date - 33);

-- ---------- 6. MESSAGGI RICEVUTI ----------
INSERT INTO public.contact_messages (name, email, phone, message, privacy_consent, handled, created_at) VALUES
 ('Marta Bellini','marta.bellini@example.com','+39 347 410 2299','Buongiorno, vorrei sapere se fate la prima visita per un bambino di 5 anni e quanto dura. Grazie.',true,false, now() - interval '3 hours'),
 ('Giorgio Pellegrini','giorgio.pellegrini@example.com',NULL,'Avrei bisogno di un preventivo per due impianti nella zona dei molari. Posso inviare la panoramica via email?',true,false, now() - interval '1 day 4 hours'),
 ('Silvia Lombardi','silvia.lombardi@example.com','+39 333 760 1148','Ho un dente che mi fa molto male da stanotte, avete un posto libero oggi?',true,true, now() - interval '2 days 2 hours'),
 ('Roberto Sala','roberto.sala@example.com','+39 338 902 6671','Volevo spostare l''appuntamento di giovedì prossimo alla settimana successiva. Si può fare?',true,true, now() - interval '5 days');

-- ---------- 7. FERIE E PERMESSI ----------
INSERT INTO public.blocked_slots (doctor_id, starts_at, ends_at, reason) VALUES
 ('11111111-1111-4111-8111-000000000004', ((current_date + 9)::timestamp + time '09:00') AT TIME ZONE 'Europe/Rome', ((current_date + 9)::timestamp + time '18:00') AT TIME ZONE 'Europe/Rome','Corso di aggiornamento'),
 ('11111111-1111-4111-8111-000000000001', ((current_date + 12)::timestamp + time '14:00') AT TIME ZONE 'Europe/Rome', ((current_date + 12)::timestamp + time '18:00') AT TIME ZONE 'Europe/Rome','Permesso');
DELETE FROM public.blocked_slots_audit_log;   -- registro modifiche pulito

COMMIT;
