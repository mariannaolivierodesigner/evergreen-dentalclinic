/** Fasce di apertura per giorno della settimana (0 = domenica). */
const OPENING: Record<number, [string, string][]> = {
  0: [],
  1: [
    ["09:00", "13:00"],
    ["14:00", "19:00"],
  ],
  2: [
    ["09:00", "13:00"],
    ["14:00", "19:00"],
  ],
  3: [
    ["09:00", "13:00"],
    ["14:00", "19:00"],
  ],
  4: [
    ["09:00", "13:00"],
    ["14:00", "19:00"],
  ],
  5: [
    ["09:00", "13:00"],
    ["14:00", "17:00"],
  ],
  6: [["09:00", "13:00"]],
};

export const SLOT_STEP_MIN = 30;

function at(day: string, hhmm: string) {
  return new Date(`${day}T${hhmm}:00`);
}

export type Busy = { starts_at: string; ends_at: string };

/**
 * Genera gli slot liberi di una giornata per un trattamento di `durationMin`,
 * escludendo gli intervalli occupati e gli orari già passati.
 */
export function computeSlots(day: string, durationMin: number, busy: Busy[]): string[] {
    const dow = new Date(`${day}T12:00:00`).getDay();
  const ranges = OPENING[dow] ?? [];
  const busyRanges: { start: number; end: number }[] = busy.map((b) => ({
    start: new Date(b.starts_at).getTime(),
    end: new Date(b.ends_at).getTime(),
  }));
  const now = Date.now();
  const out: string[] = [];

  for (const [from, to] of ranges) {
    const start = at(day, from).getTime();
    const end = at(day, to).getTime();
    for (let t = start; t + durationMin * 60000 <= end; t += SLOT_STEP_MIN * 60000) {
      const slotEnd = t + durationMin * 60000;
      if (t < now + 60 * 60000) continue;
      const overlaps = busyRanges.some((b) => t < b.end && slotEnd > b.start);
      if (!overlaps) out.push(new Date(t).toISOString());
    }
  }
  return out;
}

export function isClosed(day: string) {
  const dow = new Date(`${day}T12:00:00`).getDay();
  return (OPENING[dow] ?? []).length === 0;
}