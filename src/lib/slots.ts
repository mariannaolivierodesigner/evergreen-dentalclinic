/** Fascia oraria di lavoro di un medico in un giorno (orario locale studio). */
export type Range = { start_time: string; end_time: string };

export type Busy = { starts_at: string; ends_at: string };

export const SLOT_STEP_MIN = 30;

const TZ = "Europe/Rome";

/** Millisecondi UTC corrispondenti a `day` + `hh:mm` nel fuso dello studio. */
function atLocal(day: string, hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  const naive = Date.UTC(
    Number(day.slice(0, 4)),
    Number(day.slice(5, 7)) - 1,
    Number(day.slice(8, 10)),
    h ?? 0,
    m ?? 0,
  );
  // Offset del fuso studio in quel momento (gestisce ora legale).
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: TZ,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).formatToParts(new Date(naive));
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value ?? 0);
  const asUtc = Date.UTC(get("year"), get("month") - 1, get("day"), get("hour"), get("minute"));
  return naive - (asUtc - naive);
}

/** Giorno della settimana (0 = domenica) di una data ISO `YYYY-MM-DD`. */
export function weekdayOf(day: string): number {
  return new Date(`${day}T12:00:00Z`).getUTCDay();
}

/**
 * Genera gli slot liberi di una giornata per un trattamento di `durationMin`,
 * partendo dalle fasce di disponibilità del medico ed escludendo gli intervalli
 * occupati (appuntamenti + indisponibilità) e gli orari già passati.
 */
export function computeSlots(
  day: string,
  durationMin: number,
  ranges: Range[],
  busy: Busy[],
): string[] {
  const busyRanges = busy.map((b) => ({
    start: new Date(b.starts_at).getTime(),
    end: new Date(b.ends_at).getTime(),
  }));
  const now = Date.now();
  const out: string[] = [];

  for (const r of ranges) {
    const start = atLocal(day, r.start_time.slice(0, 5));
    const end = atLocal(day, r.end_time.slice(0, 5));
    for (let t = start; t + durationMin * 60000 <= end; t += SLOT_STEP_MIN * 60000) {
      const slotEnd = t + durationMin * 60000;
      if (t < now + 60 * 60000) continue;
      if (busyRanges.some((b) => t < b.end && slotEnd > b.start)) continue;
      out.push(new Date(t).toISOString());
    }
  }
  return out.sort();
}
