# Evergreen — Modifiche: prenotazione senza registrazione separata + errori in italiano + pulizia

## File nuovi/modificati in questo pacchetto
- `src/lib/auth-errors.ts` → nuovo: traduce in italiano i messaggi di errore di Supabase Auth
- `src/routes/prenota.tsx` → il flusso di prenotazione non blocca più chi non è loggato
- `src/routes/auth.tsx` → errori di login/registrazione pazienti tradotti in italiano
- `src/routes/admin.tsx` → errori di login/registrazione staff tradotti in italiano
- `src/components/site/SiteLayout.tsx` → tolto lo spazio bianco eccessivo tra i contenuti e il
  footer su tutte le pagine pubbliche con poco contenuto (es. "Chi siamo")
- `README.md` → rimossa la parte finale ("BeautyOS") che non riguardava questo progetto: era
  materiale di un prompt diverso rimasto per errore nel file

## App installabile su desktop e smartphone (PWA)
Stesso trattamento fatto per Aura Clinic: il sito è ora installabile come un'app, senza passare
da App Store/Play Store.
- `public/manifest.webmanifest`, `public/sw.js`, `public/icons/` → involucro PWA, icona con il
  dente del logo su sfondo verde salvia (sostituibile in futuro col logo reale del cliente)
- Pulsante **"Installa app"** nel menu "Il mio account" dell'header (visibile solo a chi è
  loggato, quando il browser lo supporta)

**Come si installa**: Desktop/Android (Chrome/Edge) → icona nella barra indirizzi o voce nel
menu account; iPhone (Safari) → Condividi (□↑) → "Aggiungi a Home" (sempre manuale su iOS, limite
di Apple).

## Fix vero spazio bianco "Chi siamo" (il precedente non bastava)
La causa reale era un margine fisso di 96px sempre applicato sopra il footer
(`src/components/site/SiteFooter.tsx`), su ogni pagina — non il layout generale come pensavo la
prima volta. Tolto: ora lo spazio prima del footer dipende solo dal contenuto della pagina, niente
più vuoti innaturali sulle pagine corte.

## Registrazione automatica come "admin" per la demo (paziente E staff, email E Google)
Ho aggiunto `supabase/migrations/20260905140000_demo_auto_admin_role.sql`: chi si registra per la
prima volta — da `/auth` (pazienti) o da `/admin` (staff), con email o con Google — riceve subito
anche il ruolo "admin", oltre a "patient". Così un potenziale cliente in prova entra direttamente
nel gestionale con accesso completo, senza il messaggio "Questo account non ha ancora i permessi
dello staff".

**Da eseguire una volta in SQL Editor** (Lovable → Altro → Cloud → SQL editor):
```sql
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email,'@',1)), NEW.email)
  ON CONFLICT (user_id) DO NOTHING;
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'patient') ON CONFLICT DO NOTHING;
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin') ON CONFLICT DO NOTHING;
  RETURN NEW;
END; $$;
```

**Per sbloccare subito l'account già registrato** (lorenzaiacone@gmail.com, rimasto senza ruoli):
```sql
insert into public.user_roles (user_id, role)
select id, 'admin' from auth.users where email = 'lorenzaiacone@gmail.com'
on conflict (user_id, role) do nothing;
```

**IMPORTANTE — da fare alla consegna a un cliente reale**: questa migrazione va disattivata,
altrimenti chiunque si registrasse vedrebbe subito i dati reali di pazienti e appuntamenti. Te la
preparo io al momento della consegna.

## Come caricarlo
1. GitHub → repository `evergreen-dentalclinic` → **Add file → Upload files**
2. Trascina dentro `src` (sovrascrivendo)
3. Commit changes
4. Lovable → **Publish / Publish changes**

## Passaggio obbligatorio — stesso di Aura Clinic
Perché la prenotazione "invisibile" funzioni (senza far aspettare al paziente un'email di
conferma prima di poter prenotare), serve attivare l'auto-conferma email su questo progetto:

1. Lovable → **Altro → Cloud → Users**
2. Icona impostazioni → **Auto-confirm email** → attiva

Se questa opzione resta disattivata, il sistema funziona comunque ma mostra al paziente il
messaggio "ti abbiamo inviato un'email di conferma" e non riesce a completare subito la
prenotazione — esattamente il problema di prima.

## Collaudo
1. Da un browser/finestra anonima, vai su `/prenota`
2. Scegli trattamento, medico, data e ora
3. Nel riepilogo finale, compila nome/email/telefono con dati di prova mai usati prima, accetta
   il consenso, clicca "Conferma e prenota"
4. Deve funzionare **senza passare da nessuna schermata di login/registrazione separata**
5. Prova a rifare la stessa cosa una seconda volta con la **stessa email** di prima: deve
   comparire la richiesta della password invece di un errore incomprensibile
6. Prova a registrarti da `/admin` o `/auth` con una password debole (es. "password123") e
   verifica che l'errore sia ora in italiano
