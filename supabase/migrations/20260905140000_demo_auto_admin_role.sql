-- SOLO PER LA DEMO "EVERGREEN": chi si registra (da /auth come paziente, da /admin come staff,
-- via email o via Google) riceve automaticamente anche il ruolo "admin", oltre a "patient".
-- Così un potenziale cliente che prova il gestionale entra subito con accesso completo,
-- senza dover aspettare che un amministratore lo abiliti a mano.
--
-- ATTENZIONE: quando questo prodotto verrà consegnato a un cliente reale, questa parte va
-- RIMOSSA — in produzione i ruoli staff/admin devono essere assegnati solo da un amministratore
-- vero (dalla pagina "Gestisci ruoli e permessi"), altrimenti chiunque si registrasse sul sito
-- del cliente vedrebbe subito i dati reali di pazienti e appuntamenti.

CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email,'@',1)), NEW.email)
  ON CONFLICT (user_id) DO NOTHING;

  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'patient') ON CONFLICT DO NOTHING;

  -- Auto-assegnazione ruolo "admin" per la demo pubblica
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin') ON CONFLICT DO NOTHING;

  RETURN NEW;
END; $$;
