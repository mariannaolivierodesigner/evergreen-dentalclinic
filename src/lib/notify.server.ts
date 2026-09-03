/**
 * Invio email "demo" per le notifiche ai pazienti.
 * Se il dominio email non è configurato, la funzione non invia nulla e
 * l'app ricade automaticamente sulla notifica in-app.
 */
export async function sendPatientEmail(input: {
  to: string;
  subject: string;
  text: string;
}): Promise<boolean> {
  const apiKey = process.env["LOVABLE_API_KEY"];
  const from = process.env["EMAIL_FROM_ADDRESS"];
  if (!apiKey || !from) return false;

  try {
    const res = await fetch("https://api.lovable.dev/email/send", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: input.to,
        subject: input.subject,
        text: input.text,
      }),
    });
    if (!res.ok) {
      console.error(`Invio email non riuscito [${res.status}]: ${await res.text()}`);
      return false;
    }
    return true;
  } catch (e) {
    console.error("Invio email non riuscito:", e);
    return false;
  }
}
