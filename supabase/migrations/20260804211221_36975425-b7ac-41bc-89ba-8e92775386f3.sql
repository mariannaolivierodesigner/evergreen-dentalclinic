-- ROLES
CREATE TYPE public.app_role AS ENUM ('admin','doctor','receptionist','patient');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

CREATE OR REPLACE FUNCTION public.is_staff(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role IN ('admin','doctor','receptionist'));
$$;

CREATE POLICY "own roles readable" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_staff(auth.uid()));

CREATE OR REPLACE FUNCTION public.set_updated_at() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- DOCTORS
CREATE TABLE public.doctors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  full_name text NOT NULL,
  specialization text NOT NULL,
  bio text NOT NULL DEFAULT '',
  photo_url text,
  color text NOT NULL DEFAULT '#7BA79D',
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.doctors TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.doctors TO authenticated;
GRANT ALL ON public.doctors TO service_role;
ALTER TABLE public.doctors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "doctors public read" ON public.doctors FOR SELECT USING (true);
CREATE POLICY "doctors admin write" ON public.doctors FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- SERVICES
CREATE TABLE public.services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  short_description text NOT NULL,
  long_description text NOT NULL DEFAULT '',
  what_to_expect text NOT NULL DEFAULT '',
  duration_min integer NOT NULL DEFAULT 30,
  price_cents integer NOT NULL DEFAULT 0,
  icon text NOT NULL DEFAULT 'Sparkles',
  faq jsonb NOT NULL DEFAULT '[]'::jsonb,
  published boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.services TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.services TO authenticated;
GRANT ALL ON public.services TO service_role;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
CREATE POLICY "services public read" ON public.services FOR SELECT USING (published OR public.is_staff(auth.uid()));
CREATE POLICY "services admin write" ON public.services FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER services_updated BEFORE UPDATE ON public.services FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- PATIENT PROFILES
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE REFERENCES auth.users(id) ON DELETE SET NULL,
  full_name text NOT NULL,
  email text,
  phone text,
  birth_date date,
  allergies text[] NOT NULL DEFAULT '{}',
  conditions text[] NOT NULL DEFAULT '{}',
  notes text,
  privacy_consent boolean NOT NULL DEFAULT false,
  marketing_consent boolean NOT NULL DEFAULT false,
  onboarded boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles own read" ON public.profiles FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_staff(auth.uid()));
CREATE POLICY "profiles own insert" ON public.profiles FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid() OR public.is_staff(auth.uid()));
CREATE POLICY "profiles own update" ON public.profiles FOR UPDATE TO authenticated USING (user_id = auth.uid() OR public.is_staff(auth.uid())) WITH CHECK (user_id = auth.uid() OR public.is_staff(auth.uid()));
CREATE POLICY "profiles staff delete" ON public.profiles FOR DELETE TO authenticated USING (public.is_staff(auth.uid()));
CREATE TRIGGER profiles_updated BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email,'@',1)), NEW.email)
  ON CONFLICT (user_id) DO NOTHING;
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'patient') ON CONFLICT DO NOTHING;
  RETURN NEW;
END; $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- APPOINTMENTS
CREATE TYPE public.appointment_status AS ENUM ('pending','confirmed','completed','cancelled','no_show');

CREATE TABLE public.appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  doctor_id uuid NOT NULL REFERENCES public.doctors(id) ON DELETE RESTRICT,
  service_id uuid NOT NULL REFERENCES public.services(id) ON DELETE RESTRICT,
  starts_at timestamptz NOT NULL,
  ends_at timestamptz NOT NULL,
  status public.appointment_status NOT NULL DEFAULT 'pending',
  patient_note text,
  staff_note text,
  reminder_sent boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX appointments_starts_at_idx ON public.appointments (starts_at);
CREATE INDEX appointments_doctor_idx ON public.appointments (doctor_id, starts_at);
CREATE INDEX appointments_patient_idx ON public.appointments (patient_id, starts_at);
GRANT SELECT ON public.appointments TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.appointments TO authenticated;
GRANT ALL ON public.appointments TO service_role;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "appointments own read" ON public.appointments FOR SELECT TO authenticated
  USING (public.is_staff(auth.uid()) OR patient_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));
CREATE POLICY "appointments own insert" ON public.appointments FOR INSERT TO authenticated
  WITH CHECK (public.is_staff(auth.uid()) OR patient_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));
CREATE POLICY "appointments own update" ON public.appointments FOR UPDATE TO authenticated
  USING (public.is_staff(auth.uid()) OR patient_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()))
  WITH CHECK (public.is_staff(auth.uid()) OR patient_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));
CREATE POLICY "appointments staff delete" ON public.appointments FOR DELETE TO authenticated USING (public.is_staff(auth.uid()));
CREATE TRIGGER appointments_updated BEFORE UPDATE ON public.appointments FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Public availability view (busy slots only, no personal data)
CREATE VIEW public.busy_slots WITH (security_invoker = off) AS
  SELECT doctor_id, starts_at, ends_at FROM public.appointments WHERE status IN ('pending','confirmed');
GRANT SELECT ON public.busy_slots TO anon, authenticated;

-- BLOCKED SLOTS
CREATE TABLE public.blocked_slots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id uuid NOT NULL REFERENCES public.doctors(id) ON DELETE CASCADE,
  starts_at timestamptz NOT NULL,
  ends_at timestamptz NOT NULL,
  reason text NOT NULL DEFAULT 'Non disponibile',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.blocked_slots TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.blocked_slots TO authenticated;
GRANT ALL ON public.blocked_slots TO service_role;
ALTER TABLE public.blocked_slots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "blocked public read" ON public.blocked_slots FOR SELECT USING (true);
CREATE POLICY "blocked staff write" ON public.blocked_slots FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

-- DOCUMENTS
CREATE TABLE public.documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  kind text NOT NULL DEFAULT 'referto',
  issued_on date NOT NULL DEFAULT current_date,
  file_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.documents TO authenticated;
GRANT ALL ON public.documents TO service_role;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "documents own read" ON public.documents FOR SELECT TO authenticated
  USING (public.is_staff(auth.uid()) OR patient_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));
CREATE POLICY "documents staff write" ON public.documents FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

-- TESTIMONIALS
CREATE TABLE public.testimonials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author text NOT NULL,
  role text,
  rating integer NOT NULL DEFAULT 5,
  quote text NOT NULL,
  published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.testimonials TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.testimonials TO authenticated;
GRANT ALL ON public.testimonials TO service_role;
ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;
CREATE POLICY "testimonials public read" ON public.testimonials FOR SELECT USING (published);
CREATE POLICY "testimonials staff write" ON public.testimonials FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

-- BLOG
CREATE TABLE public.posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  excerpt text NOT NULL,
  body text NOT NULL,
  category text NOT NULL DEFAULT 'Prevenzione',
  read_minutes integer NOT NULL DEFAULT 4,
  published_at date NOT NULL DEFAULT current_date,
  published boolean NOT NULL DEFAULT true
);
GRANT SELECT ON public.posts TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.posts TO authenticated;
GRANT ALL ON public.posts TO service_role;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "posts public read" ON public.posts FOR SELECT USING (published);
CREATE POLICY "posts staff write" ON public.posts FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

-- CONTACT MESSAGES
CREATE TABLE public.contact_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  phone text,
  message text NOT NULL,
  privacy_consent boolean NOT NULL DEFAULT false,
  handled boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT INSERT ON public.contact_messages TO anon, authenticated;
GRANT SELECT, UPDATE ON public.contact_messages TO authenticated;
GRANT ALL ON public.contact_messages TO service_role;
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "contact insert" ON public.contact_messages FOR INSERT WITH CHECK (privacy_consent = true);
CREATE POLICY "contact staff read" ON public.contact_messages FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "contact staff update" ON public.contact_messages FOR UPDATE TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

-- ================= SEED =================
INSERT INTO public.doctors (id, full_name, specialization, bio, color) VALUES
 ('11111111-1111-4111-8111-000000000001','Dott.ssa Elena Ferraro','Conservativa e igiene dentale','Laureata a Padova, si occupa di prevenzione e igiene professionale. Ha un approccio delicato, particolarmente apprezzato dai pazienti con ansia odontoiatrica.','#7BA79D'),
 ('11111111-1111-4111-8111-000000000002','Dott. Marco Bianchi','Implantologia e chirurgia orale','Oltre 15 anni di esperienza in implantologia guidata computer assistita. Docente a contratto in chirurgia orale.','#5E8B9E'),
 ('11111111-1111-4111-8111-000000000003','Dott.ssa Giulia Rinaldi','Ortodonzia e allineatori trasparenti','Specialista in ortodonzia per adulti e adolescenti, certificata per i principali sistemi di allineatori invisibili.','#C98B72'),
 ('11111111-1111-4111-8111-000000000004','Dott. Luca Moretti','Odontoiatria pediatrica','Dedica il suo lavoro ai piccoli pazienti: visite giocose, linguaggio semplice e nessuna fretta.','#8FA36B');

INSERT INTO public.services (id, slug, name, short_description, long_description, what_to_expect, duration_min, price_cents, icon, sort_order, faq) VALUES
 ('22222222-2222-4222-8222-000000000001','igiene-dentale','Igiene dentale professionale','Rimozione di placca e tartaro con richiamo consigliato ogni 6 mesi.','Una seduta di igiene professionale rimuove placca e tartaro nei punti che lo spazzolino non raggiunge, prevenendo carie e gengiviti. Concludiamo sempre con lucidatura e consigli personalizzati sulla tua routine quotidiana.','Ti accogliamo in sala, valutiamo lo stato delle gengive, procediamo con ablazione a ultrasuoni e air-flow. La seduta è indolore; se hai denti sensibili usiamo anestesia topica.',45,9000,'Sparkles',1,'[{"q":"Fa male?","a":"Nella maggior parte dei casi no. Su denti sensibili applichiamo un gel anestetico topico prima di iniziare."},{"q":"Ogni quanto devo farla?","a":"Ogni 6 mesi per la maggior parte dei pazienti, ogni 3-4 mesi in caso di parodontite."}]'),
 ('22222222-2222-4222-8222-000000000002','ortodonzia','Ortodonzia e allineatori','Allineamento dentale con apparecchi fissi o allineatori trasparenti.','Correggiamo malocclusioni e affollamenti dentali con piani di trattamento digitali: scansione intraorale, simulazione del risultato finale e controllo dei progressi step by step.','Prima visita con scansione 3D e simulazione del sorriso finale. Ti mostriamo durata stimata, costi e alternative prima di iniziare.',60,25000,'AlignCenter',2,'[{"q":"Quanto dura il trattamento?","a":"Da 6 mesi per correzioni lievi fino a 24 mesi per casi complessi."},{"q":"Gli allineatori si vedono?","a":"Sono trasparenti e praticamente invisibili a conversazione normale."}]'),
 ('22222222-2222-4222-8222-000000000003','implantologia','Implantologia','Sostituzione di denti mancanti con impianti in titanio a carico guidato.','Utilizziamo implantologia guidata computer assistita: TAC, pianificazione digitale e dima chirurgica per un intervento mininvasivo e prevedibile.','Prima visita con TAC e piano di trattamento. L''intervento avviene in anestesia locale, con possibilità di sedazione cosciente.',90,120000,'Anchor',3,'[{"q":"È doloroso?","a":"L''intervento avviene in anestesia locale: non sentirai dolore. Il post-operatorio si gestisce con normali antidolorifici."},{"q":"Quanto durano gli impianti?","a":"Con igiene e controlli regolari, oltre 20 anni."}]'),
 ('22222222-2222-4222-8222-000000000004','sbiancamento','Sbiancamento dentale','Trattamento estetico professionale per un sorriso più luminoso.','Sbiancamento in studio con gel attivato a LED, con eventuale mantenimento domiciliare tramite mascherine personalizzate.','Valutiamo prima lo stato di smalto e gengive. La seduta dura circa un''ora, il risultato è visibile subito.',60,35000,'Sun',4,'[{"q":"Rovina lo smalto?","a":"No, i protocolli professionali sono sicuri e supervisionati dall''odontoiatra."},{"q":"Quanto dura il risultato?","a":"Da 12 a 24 mesi, in base ad alimentazione e abitudini."}]'),
 ('22222222-2222-4222-8222-000000000005','pedodonzia','Odontoiatria pediatrica','Cure e prevenzione dedicate ai bambini, con tempi e linguaggio su misura.','Sigillature, fluoroprofilassi e prime visite pensate per costruire un rapporto sereno con il dentista fin da piccoli.','La prima visita è di conoscenza: nessuno strumento invasivo, solo esplorazione e gioco. I genitori restano sempre in sala.',30,6000,'Baby',5,'[{"q":"A che età la prima visita?","a":"Intorno ai 3 anni, o prima se noti macchie o dolore."}]'),
 ('22222222-2222-4222-8222-000000000006','urgenze','Urgenze odontoiatriche','Dolore acuto, traumi o restauri saltati: slot riservati ogni giorno.','Teniamo liberi alcuni slot giornalieri per le emergenze. Ti richiamiamo entro un''ora dalla richiesta per capire la priorità.','Valutazione rapida, gestione del dolore e piano di cura successivo concordato con te.',30,8000,'Siren',6,'[{"q":"Posso venire senza appuntamento?","a":"Meglio chiamare: riserviamo slot dedicati e riduciamo le attese."}]');

INSERT INTO public.profiles (id, full_name, email, phone, birth_date, allergies, conditions, notes, privacy_consent, onboarded) VALUES
 ('33333333-3333-4333-8333-000000000001','Chiara Belli','chiara.belli@example.com','+39 340 118 2244','1989-04-12','{"Lattice"}','{}','Paziente ansiosa: preferisce appuntamenti al mattino.',true,true),
 ('33333333-3333-4333-8333-000000000002','Andrea Gallo','andrea.gallo@example.com','+39 333 985 1120','1976-11-03','{}','{"Ipertensione"}','In terapia con anticoagulanti, avvisare prima di estrazioni.',true,true),
 ('33333333-3333-4333-8333-000000000003','Sofia Marchetti','sofia.marchetti@example.com','+39 349 776 3390','1995-06-27','{"Penicillina"}','{}',NULL,true,true),
 ('33333333-3333-4333-8333-000000000004','Davide Conti','davide.conti@example.com','+39 328 445 9902','1982-01-19','{}','{}','Richiamo igiene semestrale.',true,true),
 ('33333333-3333-4333-8333-000000000005','Martina Esposito','martina.esposito@example.com','+39 351 220 7781','2016-09-05','{}','{}','Piccola paziente, accompagnata dalla mamma.',true,true),
 ('33333333-3333-4333-8333-000000000006','Riccardo Fontana','riccardo.fontana@example.com','+39 347 662 1145','1968-03-30','{}','{"Diabete tipo 2"}','Valutazione implantologica in corso.',true,true);

INSERT INTO public.appointments (patient_id, doctor_id, service_id, starts_at, ends_at, status, patient_note, staff_note) VALUES
 ('33333333-3333-4333-8333-000000000001','11111111-1111-4111-8111-000000000001','22222222-2222-4222-8222-000000000001', date_trunc('day', now()) + interval '9 hours', date_trunc('day', now()) + interval '9 hours 45 minutes','confirmed','Vorrei una seduta tranquilla, sono un po'' ansiosa.','Gengive sensibili, procedere con delicatezza.'),
 ('33333333-3333-4333-8333-000000000002','11111111-1111-4111-8111-000000000002','22222222-2222-4222-8222-000000000003', date_trunc('day', now()) + interval '10 hours', date_trunc('day', now()) + interval '11 hours 30 minutes','confirmed',NULL,'Verificare terapia anticoagulante.'),
 ('33333333-3333-4333-8333-000000000003','11111111-1111-4111-8111-000000000003','22222222-2222-4222-8222-000000000002', date_trunc('day', now()) + interval '11 hours 30 minutes', date_trunc('day', now()) + interval '12 hours 30 minutes','pending',NULL,NULL),
 ('33333333-3333-4333-8333-000000000005','11111111-1111-4111-8111-000000000004','22222222-2222-4222-8222-000000000005', date_trunc('day', now()) + interval '15 hours', date_trunc('day', now()) + interval '15 hours 30 minutes','confirmed','Prima visita, è emozionata.',NULL),
 ('33333333-3333-4333-8333-000000000004','11111111-1111-4111-8111-000000000001','22222222-2222-4222-8222-000000000001', date_trunc('day', now()) + interval '1 day 9 hours 30 minutes', date_trunc('day', now()) + interval '1 day 10 hours 15 minutes','confirmed',NULL,NULL),
 ('33333333-3333-4333-8333-000000000006','11111111-1111-4111-8111-000000000002','22222222-2222-4222-8222-000000000003', date_trunc('day', now()) + interval '2 days 10 hours', date_trunc('day', now()) + interval '2 days 11 hours 30 minutes','pending','Vorrei capire i tempi complessivi.',NULL),
 ('33333333-3333-4333-8333-000000000003','11111111-1111-4111-8111-000000000001','22222222-2222-4222-8222-000000000004', date_trunc('day', now()) + interval '3 days 16 hours', date_trunc('day', now()) + interval '3 days 17 hours','confirmed',NULL,NULL),
 ('33333333-3333-4333-8333-000000000001','11111111-1111-4111-8111-000000000001','22222222-2222-4222-8222-000000000001', date_trunc('day', now()) - interval '170 days' + interval '9 hours', date_trunc('day', now()) - interval '170 days' + interval '9 hours 45 minutes','completed',NULL,'Igiene eseguita, consigliato spazzolino elettrico.'),
 ('33333333-3333-4333-8333-000000000002','11111111-1111-4111-8111-000000000001','22222222-2222-4222-8222-000000000001', date_trunc('day', now()) - interval '95 days' + interval '14 hours', date_trunc('day', now()) - interval '95 days' + interval '14 hours 45 minutes','completed',NULL,NULL),
 ('33333333-3333-4333-8333-000000000004','11111111-1111-4111-8111-000000000003','22222222-2222-4222-8222-000000000002', date_trunc('day', now()) - interval '40 days' + interval '11 hours', date_trunc('day', now()) - interval '40 days' + interval '12 hours','cancelled',NULL,'Disdetta del paziente con 2 giorni di anticipo.'),
 ('33333333-3333-4333-8333-000000000006','11111111-1111-4111-8111-000000000004','22222222-2222-4222-8222-000000000006', date_trunc('day', now()) - interval '20 days' + interval '17 hours', date_trunc('day', now()) - interval '20 days' + interval '17 hours 30 minutes','completed',NULL,'Ascesso trattato, terapia antibiotica prescritta.'),
 ('33333333-3333-4333-8333-000000000005','11111111-1111-4111-8111-000000000004','22222222-2222-4222-8222-000000000005', date_trunc('day', now()) - interval '10 days' + interval '16 hours', date_trunc('day', now()) - interval '10 days' + interval '16 hours 30 minutes','no_show',NULL,NULL);

INSERT INTO public.documents (patient_id, title, kind, issued_on) VALUES
 ('33333333-3333-4333-8333-000000000001','Referto igiene dentale','referto', current_date - 170),
 ('33333333-3333-4333-8333-000000000002','Piano di cura implantologico','piano', current_date - 60),
 ('33333333-3333-4333-8333-000000000006','Radiografia panoramica','radiografia', current_date - 20);

INSERT INTO public.testimonials (author, role, rating, quote) VALUES
 ('Chiara B.','Paziente dal 2019',5,'Ho sempre avuto il terrore del dentista. Qui mi hanno spiegato ogni passaggio prima di farlo: è la prima volta che esco da uno studio rilassata.'),
 ('Andrea G.','Paziente dal 2021',5,'Impianto eseguito in un''ora, zero dolore e follow-up puntuale. Professionalità vera, senza fretta.'),
 ('Sofia M.','Paziente dal 2022',5,'Prenoto tutto dall''app in due minuti e ricevo il promemoria il giorno prima. Un servizio che non avevo mai trovato altrove.'),
 ('Federica L.','Mamma di Martina',5,'Mia figlia chiede di tornare dal dentista. Direi che dice tutto.'),
 ('Riccardo F.','Paziente dal 2018',5,'Studio pulitissimo, staff gentile e preventivi chiari dall''inizio. Nessuna sorpresa in fattura.');

INSERT INTO public.posts (slug, title, excerpt, body, category, read_minutes, published_at) VALUES
 ('come-spazzolare-i-denti','Come spazzolare i denti nel modo corretto (e gli errori più comuni)','Due minuti, movimenti giusti e il dentifricio adatto: la guida pratica del nostro reparto di igiene.','Spazzolare i denti sembra banale, ma è il gesto che più influenza la salute della tua bocca.

**Quanto a lungo.** Due minuti pieni, due volte al giorno. Quasi tutti si fermano a 45 secondi: usa un timer o uno spazzolino elettrico con segnalatore.

**Come muoversi.** Inclina le setole di 45 gradi verso il bordo gengivale e usa piccoli movimenti circolari. Evita lo sfregamento orizzontale energico: consuma smalto e fa recedere le gengive.

**Cosa dimenticano tutti.** La superficie interna degli incisivi inferiori e la lingua. Sono i due punti dove si accumula più placca.

**Il filo interdentale.** Lo spazzolino pulisce circa il 60% della superficie dentale. Il restante 40% richiede filo o scovolino, una volta al giorno, preferibilmente la sera.

**Dopo i pasti acidi** (agrumi, vino, bibite) aspetta 30 minuti prima di spazzolare: lo smalto è temporaneamente più vulnerabile.','Prevenzione',4, current_date - 12),
 ('paura-del-dentista','Paura del dentista: perché succede e cosa facciamo per aiutarti','L''ansia odontoiatrica riguarda un adulto su tre. Non è una debolezza, ed è gestibile.','L''ansia odontoiatrica non è capriccio: nasce quasi sempre da un''esperienza negativa, spesso nell''infanzia.

**Cosa cambia nel nostro studio.** Prima visita senza strumenti in mano: parliamo, guardiamo insieme le immagini e costruiamo il piano. Nessuna decisione viene presa mentre sei sulla poltrona.

**Il segnale di stop.** Concordiamo un gesto: alzi la mano e ci fermiamo immediatamente. Sapere di avere il controllo riduce l''ansia più di qualsiasi rassicurazione.

**Sedazione cosciente.** Per interventi più lunghi offriamo la sedazione cosciente con protossido d''azoto: resti sveglio e collaborativo, ma profondamente rilassato.

**Appuntamenti su misura.** Slot al mattino, tempi più lunghi, nessuna sala d''attesa affollata: piccoli accorgimenti che fanno una grande differenza.','Benessere',5, current_date - 30),
 ('sbiancamento-cosa-sapere','Sbiancamento dentale: cosa funziona davvero e cosa no','Kit da supermercato, rimedi casalinghi e trattamenti professionali a confronto.','Il colore dei denti dipende dalla dentina sottostante, non solo dalle macchie superficiali. Ecco perché non tutti i metodi funzionano allo stesso modo.

**Bicarbonato e limone.** Da evitare. Abradono e demineralizzano lo smalto: il dente appare più chiaro per pochi giorni, poi più giallo di prima.

**Kit da banco.** Concentrazioni molto basse di perossido: risultati minimi e rischio di irritazione gengivale se le mascherine non sono personalizzate.

**Sbiancamento professionale.** Gel a concentrazione controllata, gengive protette, attivazione a LED. Un salto di 3-6 gradi di colore in una seduta.

**Prima di tutto.** Uno sbiancamento su denti con carie o gengive infiammate è controindicato. La valutazione preliminare non è burocrazia: è ciò che rende il trattamento sicuro.','Estetica',4, current_date - 45);