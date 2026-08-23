import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { CalendarOff, TriangleAlert } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { listCalendar, listStaffDoctors } from "@/lib/staff.functions";
import { localToIso } from "@/lib/slots";
import { STATUS_LABEL, formatDate, formatTime, isoDay } from "@/lib/format";

const ALL = "all";

function addDays(day: string, n: number) {
  const d = new Date(`${day}T12:00:00`);
  d.setDate(d.getDate() + n);
  return isoDay(d);
}

function overlaps(a: { starts_at: string; ends_at: string }, b: { starts_at: string; ends_at: string }) {
  return (
    new Date(a.starts_at).getTime() < new Date(b.ends_at).getTime() &&
    new Date(a.ends_at).getTime() > new Date(b.starts_at).getTime()
  );
}

export function StaffCalendar() {
  const fetchCalendar = useServerFn(listCalendar);
  const fetchDoctors = useServerFn(listStaffDoctors);

  const [doctorId, setDoctorId] = useState<string>(ALL);
  const [from, setFrom] = useState(isoDay(new Date()));
  const [to, setTo] = useState(addDays(isoDay(new Date()), 6));

  const doctors = useQuery({ queryKey: ["staff-doctors"], queryFn: () => fetchDoctors() });

  const rangeValid = from <= to;
  const fromIso = rangeValid ? localToIso(from, "00:00") : "";
  const toIso = rangeValid ? localToIso(addDays(to, 1), "00:00") : "";

  const calendar = useQuery({
    queryKey: ["staff-calendar", doctorId, fromIso, toIso],
    enabled: rangeValid,
    queryFn: () =>
      fetchCalendar({
        data: {
          from: fromIso,
          to: toIso,
          ...(doctorId !== ALL ? { doctor_id: doctorId } : {}),
        },
      }),
  });

  const days = useMemo(() => {
    if (!rangeValid) return [];
    const out: string[] = [];
    for (let d = from; d <= to && out.length < 62; d = addDays(d, 1)) out.push(d);
    return out;
  }, [from, to, rangeValid]);

  const data = calendar.data;

  const conflictIds = useMemo(() => {
    const set = new Set<string>();
    if (!data) return set;
    for (const a of data.appointments) {
      if (a.status === "cancelled") continue;
      if (data.blocked.some((b) => b.doctor_id === a.doctor_id && overlaps(a, b))) set.add(a.id);
    }
    return set;
  }, [data]);

  const byDay = useMemo(() => {
    type Data = NonNullable<typeof data>;
    const map = new Map<string, { appointments: Data["appointments"]; blocked: Data["blocked"] }>();
    for (const d of days) map.set(d, { appointments: [], blocked: [] });
    if (!data) return map;
    for (const a of data.appointments) {
      const key = isoDay(new Date(a.starts_at));
      map.get(key)?.appointments.push(a);
    }
    for (const b of data.blocked) {
      for (const d of days) {
        const dayStart = new Date(localToIso(d, "00:00")).getTime();
        const dayEnd = new Date(localToIso(addDays(d, 1), "00:00")).getTime();
        if (new Date(b.starts_at).getTime() < dayEnd && new Date(b.ends_at).getTime() > dayStart) {
          map.get(d)?.blocked.push(b);
        }
      }
    }
    return map;
  }, [data, days]);

  return (
    <div>
      <div className="surface-card mb-6 grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="grid gap-2">
          <Label>Medico</Label>
          <Select value={doctorId} onValueChange={setDoctorId}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>Tutti i medici</SelectItem>
              {(doctors.data ?? []).map((d) => (
                <SelectItem key={d.id} value={d.id}>
                  {d.full_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="cal-from">Dal</Label>
          <Input
            id="cal-from"
            type="date"
            value={from}
            onChange={(e) => {
              const v = e.target.value;
              setFrom(v);
              if (to < v) setTo(v);
            }}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="cal-to">Al</Label>
          <Input
            id="cal-to"
            type="date"
            min={from}
            value={to}
            onChange={(e) => setTo(e.target.value)}
          />
        </div>
        <div className="flex items-end gap-2">
          <Button
            variant="outline"
            onClick={() => {
              const today = isoDay(new Date());
              setFrom(today);
              setTo(addDays(today, 6));
            }}
          >
            Prossimi 7 giorni
          </Button>
        </div>
      </div>

      {!rangeValid ? (
        <p className="text-destructive text-sm">La data finale deve essere successiva all'inizio.</p>
      ) : calendar.isPending ? (
        <Skeleton className="h-64 w-full rounded-3xl" />
      ) : calendar.isError ? (
        <div className="surface-card p-5">
          <p className="text-sm">Impossibile caricare il calendario.</p>
          <Button className="mt-3" variant="outline" onClick={() => calendar.refetch()}>
            Riprova
          </Button>
        </div>
      ) : (
        <>
          {conflictIds.size > 0 ? (
            <p className="text-destructive mb-4 flex items-center gap-2 text-sm">
              <TriangleAlert className="size-4" />
              {conflictIds.size} appuntamenti in conflitto con periodi di indisponibilità.
            </p>
          ) : null}

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {days.map((d) => {
              const cell = byDay.get(d) ?? { appointments: [], blocked: [] };
              return (
                <div key={d} className="surface-card p-5">
                  <p className="font-display text-base font-semibold capitalize">
                    {formatDate(`${d}T12:00:00`)}
                  </p>

                  {cell.blocked.map((b) => (
                    <div
                      key={b.id}
                      className="bg-muted/60 mt-3 flex items-start gap-2 rounded-2xl p-3 text-xs"
                    >
                      <CalendarOff className="text-muted-foreground mt-0.5 size-4 shrink-0" />
                      <span>
                        <span className="font-medium">{b.reason}</span>
                        <span className="text-muted-foreground">
                          {" "}
                          · {b.doctors?.full_name} · {formatTime(b.starts_at)}–
                          {formatTime(b.ends_at)}
                        </span>
                      </span>
                    </div>
                  ))}

                  {cell.appointments.length === 0 && cell.blocked.length === 0 ? (
                    <p className="text-muted-foreground mt-3 text-xs">Nessun impegno.</p>
                  ) : null}

                  <ul className="mt-3 space-y-2">
                    {cell.appointments.map((a) => {
                      const conflict = conflictIds.has(a.id);
                      return (
                        <li
                          key={a.id}
                          className={`rounded-2xl border p-3 text-xs ${
                            conflict ? "border-destructive bg-destructive/5" : "border-border"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span
                              aria-hidden
                              className="size-2 shrink-0 rounded-full"
                              style={{ backgroundColor: a.doctors?.color ?? "#7BA79D" }}
                            />
                            <span className="font-medium">
                              {formatTime(a.starts_at)}–{formatTime(a.ends_at)}
                            </span>
                            <Badge variant="secondary" className="ml-auto">
                              {STATUS_LABEL[a.status]}
                            </Badge>
                          </div>
                          <p className="mt-1">{a.profiles?.full_name ?? "Paziente"}</p>
                          <p className="text-muted-foreground">
                            {a.services?.name} · {a.doctors?.full_name}
                          </p>
                          {conflict ? (
                            <p className="text-destructive mt-1 flex items-center gap-1">
                              <TriangleAlert className="size-3" /> In conflitto con
                              un'indisponibilità
                            </p>
                          ) : null}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
