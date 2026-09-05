/**
 * Supabase Auth restituisce i messaggi di errore in inglese. Li traduciamo qui,
 * in un unico posto, così ogni pagina con login/registrazione mostra messaggi
 * coerenti e comprensibili in italiano.
 */
export function translateAuthError(message: string | undefined | null): string {
  const m = (message ?? "").toLowerCase();

  if (
    m.includes("password") &&
    (m.includes("weak") || m.includes("pwned") || m.includes("easy to guess"))
  ) {
    return "Questa password è troppo comune ed è stata trovata in fughe di dati note: scegline un'altra, più difficile da indovinare.";
  }
  if (m.includes("password") && m.includes("at least")) {
    return "La password è troppo corta: deve avere almeno 8 caratteri.";
  }
  if (
    m.includes("user already registered") ||
    m.includes("already registered") ||
    m.includes("already exists")
  ) {
    return "Esiste già un account con questa email. Accedi invece di registrarti.";
  }
  if (m.includes("invalid login credentials") || m.includes("invalid email or password")) {
    return "Email o password non corrette.";
  }
  if (m.includes("email not confirmed")) {
    return "Devi prima confermare la tua email: controlla la posta in arrivo (e lo spam).";
  }
  if (m.includes("invalid email")) {
    return "L'indirizzo email inserito non è valido.";
  }
  if (m.includes("rate limit") || m.includes("too many requests")) {
    return "Troppi tentativi in poco tempo. Riprova tra qualche minuto.";
  }
  if (m.includes("network") || m.includes("failed to fetch")) {
    return "Problema di connessione. Controlla la rete e riprova.";
  }
  if (!message) {
    return "Si è verificato un errore imprevisto. Riprova.";
  }
  // Fallback: messaggio generico in italiano invece di mostrare il testo inglese grezzo.
  return "Non è stato possibile completare l'operazione. Controlla i dati inseriti e riprova.";
}
