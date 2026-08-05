export const STUDIO = {
  name: "Studio Dentistico Evergreen",
  short: "Evergreen",
  claim: "Il tuo sorriso, la nostra missione",
  address: "Via dei Tigli 14, 20144 Milano",
  phone: "+39 02 8422 1170",
  phoneHref: "tel:+390284221170",
  email: "ciao@studioevergreen.it",
  hours: [
    { day: "Lunedì – Giovedì", value: "09:00 – 13:00 · 14:00 – 19:00" },
    { day: "Venerdì", value: "09:00 – 13:00 · 14:00 – 17:00" },
    { day: "Sabato", value: "09:00 – 13:00 (solo urgenze)" },
    { day: "Domenica", value: "Chiuso" },
  ],
};

export function formatPrice(cents: number) {
  // Formattazione deterministica: evita differenze ICU tra server e browser.
  const euros = Math.round(cents / 100);
  const grouped = String(Math.abs(euros)).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `${euros < 0 ? "-" : ""}${grouped}\u00a0€`;
}

export function formatDuration(minutes: number) {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `${h}h ${m}min` : `${h}h`;
}

const dateFmt = new Intl.DateTimeFormat("it-IT", {
  weekday: "long",
  day: "numeric",
  month: "long",
});
const dateShortFmt = new Intl.DateTimeFormat("it-IT", { day: "2-digit", month: "short" });
const timeFmt = new Intl.DateTimeFormat("it-IT", { hour: "2-digit", minute: "2-digit" });

export const formatDate = (d: string | Date) => dateFmt.format(new Date(d));
export const formatDateShort = (d: string | Date) => dateShortFmt.format(new Date(d));
export const formatTime = (d: string | Date) => timeFmt.format(new Date(d));
export const formatDateTime = (d: string | Date) => `${formatDate(d)} alle ${formatTime(d)}`;

export function isoDay(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** Gli appuntamenti sono modificabili fino a 24 ore prima. */
export function isCancellable(startsAt: string) {
  return new Date(startsAt).getTime() - Date.now() > 24 * 60 * 60 * 1000;
}

export const STATUS_LABEL: Record<string, string> = {
  pending: "Da confermare",
  confirmed: "Confermato",
  completed: "Completato",
  cancelled: "Annullato",
  no_show: "Mancata presenza",
};