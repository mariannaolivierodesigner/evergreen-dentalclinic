import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { CalendarOff, Download, Plus, Printer, TriangleAlert } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  listCalendar,
  listStaffDoctors,
  releaseConflictingAppointment,
  saveBlockedSlot,
} from "@/lib/staff.functions";
import { localToIso } from "@/lib/slots";
import { STATUS_LABEL, formatDate, formatDateTime, formatTime, isoDay } from "@/lib/format";

const ALL = "all";

function addDays(day: string, n: number) {
  const d = new Date(`${day}T12:00:00`);
  d.setDate(d.getDate() + n);
  return isoDay(d);
}

function overlaps(
  a: { starts_at: string; ends_at: string },
  b: { starts_at: string; ends_at: string },
) {
  return (
    new Date(a.starts_at).getTime() < new Date(b.ends_at).getTime() &&
    new Date(a.ends_at).getTime() > new Date(b.starts_at).getTime()
  );
}

function csvEscape(v: string) {
  return `"${v.replaceAll('"', '""')}"`;
}

export function StaffCalendar() {
  const queryClient = useQueryClient();
  const fetchCalendar = useServerFn(listCalendar);
  const fetchDoctors = useServerFn(listStaffDoctors);
  const saveBlocked = useServerFn(saveBlockedSlot);
  const releaseAppointment = useServerFn(releaseConflictingAppointment);

  const [doctorId, setDoctorId] = useState<string>(ALL);
  const [from, setFrom] = useState(isoDay(new Date()));
  const [to, setTo] = useState(addDays(isoDay(new Date()), 6));
  const [view, setView] = useState<"day" | "month">("day");

  const [quickOpen, setQuickOpen] = useState(false);
  const [quick, setQuick] = useState({
    doctor_id: "",
    day: isoDay(new Date()),
    fromTime: "09:00",
    toTime: "13:00",
    reason: "Ferie",
  });

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

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["staff-calendar"] });
    queryClient.invalidateQueries({ queryKey: ["blocked-slots"] });
    queryClient.invalidateQueries({ queryKey: ["agenda"] });
    queryClient.invalidateQueries({ queryKey: ["availability"] });
  };

  const quickMutation = useMutation({
    mutationFn: () =>
      saveBlocked({
        data: {
          doctor_id: quick.doctor_id,
          starts_at: localToIso(quick.day, quick.fromTime),
          ends_at: localToIso(quick.day, quick.toTime),
          reason: quick.reason.trim(),
          recurrence: "none" as const,
          recurrence_count: 1,
          force: true,
        },
      }),
    onSuccess: (res) => {
      setQuickOpen(false);
      invalidate();
      toast.success("Indisponibilità creata.", {
        description:
          res.ok && res.notified + res.emailed > 0
            ? `${res.notified + res.emailed} pazienti avvisati.`
            : undefined,
      });
    },
    onError: (e: Error) => toast.error(e.message || "Creazione non riuscita."),
  });

  const releaseMutation = useMutation({
    mutationFn: (input: { id: string; mode: "cancel" | "notify" }) =>
      releaseAppointment({ data: input }),
    onSuccess: (_r, vars) => {
      invalidate();
      toast.success(
        vars.mode === "cancel"
          ? "Appuntamento annullato e paziente avvisato."
          : "Paziente invitato a riprogrammare.",
      );
    },
    onError: (e: Error) => toast.error(e.message || "Operazione non riuscita."),
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

  function exportCsv() {
    if (!data) return;
    const lines = [
      ["Tipo", "Data e ora inizio", "Data e ora fine", "Medico", "Paziente", "Trattamento", "Stato/Motivo"]
        .map(csvEscape)
        .join(";"),
    ];
    for (const a of data.appointments) {
      lines.push(
        [
          "Appuntamento",
          formatDateTime(a.starts_at),
          formatDateTime(a.ends_at),
          a.doctors?.full_name ?? "",
          a.profiles?.full_name ?? "",
          a.services?.name ?? "",
          `${STATUS_LABEL[a.status] ?? a.status}${conflictIds.has(a.id) ? " (in conflitto)" : ""}`,
        ]
          .map(csvEscape)
          .join(";"),
      );
    }
    for (const b of data.blocked) {
      lines.push(
        [
          "Indisponibilità",
          formatDateTime(b.starts_at),
          formatDateTime(b.ends_at),
          b.doctors?.full_name ?? "",
          "",
          "",
          b.reason,
        ]
          .map(csvEscape)
          .join(";"),
      );
    }
    const blob = new Blob(["\uFEFF" + lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `calendario-${from}_${to}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  const quickValid =
    !!quick.doctor_id && quick.reason.trim().length >= 3 && quick.toTime > quick.fromTime;

  return (
    <div>
      <div className="surface-card mb-6 grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-4 print:hidden">
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
        <div className="flex flex-wrap items-end gap-2">
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
          <Button
            variant="outline"
            onClick={() => {
              const now = new Date();
              const first = isoDay(new Date(now.getFullYear(), now.getMonth(), 1));
              const last = isoDay(new Date(now.getFullYear(), now.getMonth() + 1, 0));
              setFrom(first);
              setTo(last);
              setView("month");
            }}
          >
            Questo mese
          </Button>
        </div>
      </div>

      <div className="mb-6 flex flex-wrap items-center gap-3 print:hidden">
        <Tabs value={view} onValueChange={(v) => setView(v as "day" | "month")}>
          <TabsList>
            <TabsTrigger value="day">Giorno</TabsTrigger>
            <TabsTrigger value="month">Mese</TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="flex-1" />
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setQuick((q) => ({ ...q, day: from }));
            setQuickOpen(true);
          }}
        >
          <Plus aria-hidden="true" /> Indisponibilità rapida
        </Button>
        <Button variant="outline" size="sm" disabled={!data} onClick={exportCsv}>
          <Download aria-hidden="true" /> CSV
        </Button>
        <Button variant="outline" size="sm" disabled={!data} onClick={() => window.print()}>
          <Printer aria-hidden="true" /> PDF / Stampa
        </Button>
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

          {view === "month" ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
              {days.map((d) => {
                const cell = byDay.get(d) ?? { appointments: [], blocked: [] };
                const dayConflicts = cell.appointments.filter((a) => conflictIds.has(a.id)).length;
                return (
                  <div
                    key={d}
                    className={`surface-card p-3 text-xs ${dayConflicts > 0 ? "border-destructive" : ""}`}
                  >
                    <p className="font-semibold">{d.slice(8)}</p>
                    <p className="text-muted-foreground capitalize">
                      {formatDate(`${d}T12:00:00`).split(" ").slice(0, 1).join(" ")}
                    </p>
                    <p className="mt-2">{cell.appointments.length} appuntamenti</p>
                    {cell.blocked.length > 0 ? (
                      <p className="text-muted-foreground">{cell.blocked.length} indisponibilità</p>
                    ) : null}
                    {dayConflicts > 0 ? (
                      <p className="text-destructive mt-1">{dayConflicts} in conflitto</p>
                    ) : null}
                  </div>
                );
              })}
            </div>
          ) : (
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
                              <div className="mt-2 space-y-2">
                                <p className="text-destructive flex items-center gap-1">
                                  <TriangleAlert className="size-3" /> In conflitto con
                                  un'indisponibilità
                                </p>
                                <div className="flex flex-wrap gap-2 print:hidden">
                                  <Button
                                    size="sm"
                                    variant="soft"
                                    disabled={releaseMutation.isPending}
                                    onClick={() =>
                                      releaseMutation.mutate({ id: a.id, mode: "notify" })
                                    }
                                  >
                                    Chiedi di riprogrammare
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    disabled={releaseMutation.isPending}
                                    onClick={() =>
                                      releaseMutation.mutate({ id: a.id, mode: "cancel" })
                                    }
                                  >
                                    Libera lo slot
                                  </Button>
                                </div>
                              </div>
                            ) : null}
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      <Dialog open={quickOpen} onOpenChange={setQuickOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Indisponibilità rapida</DialogTitle>
            <DialogDescription>
              Blocca subito una fascia oraria: i pazienti con appuntamenti nel periodo vengono
              avvisati.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label>Medico</Label>
              <Select
                value={quick.doctor_id}
                onValueChange={(v) => setQuick((q) => ({ ...q, doctor_id: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleziona un medico" />
                </SelectTrigger>
                <SelectContent>
                  {(doctors.data ?? []).map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="quick-day">Giorno</Label>
              <Input
                id="quick-day"
                type="date"
                value={quick.day}
                onChange={(e) => setQuick((q) => ({ ...q, day: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="quick-from">Dalle</Label>
                <Input
                  id="quick-from"
                  type="time"
                  step={900}
                  value={quick.fromTime}
                  onChange={(e) => setQuick((q) => ({ ...q, fromTime: e.target.value }))}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="quick-to">Alle</Label>
                <Input
                  id="quick-to"
                  type="time"
                  step={900}
                  value={quick.toTime}
                  onChange={(e) => setQuick((q) => ({ ...q, toTime: e.target.value }))}
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="quick-reason">Motivo</Label>
              <Input
                id="quick-reason"
                maxLength={200}
                value={quick.reason}
                onChange={(e) => setQuick((q) => ({ ...q, reason: e.target.value }))}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setQuickOpen(false)}>
              Annulla
            </Button>
            <Button
              disabled={!quickValid || quickMutation.isPending}
              onClick={() => quickMutation.mutate()}
            >
              Crea
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
