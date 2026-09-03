import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { CalendarOff, Pencil, Plus, Trash2, TriangleAlert } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  deleteBlockedSlot,
  listBlockedSlots,
  listStaffDoctors,
  saveBlockedSlot,
} from "@/lib/staff.functions";
import { BlockedSlotsAudit } from "@/components/site/BlockedSlotsAudit";
import { localToIso } from "@/lib/slots";
import { formatDateTime, isoDay } from "@/lib/format";

type Conflict = {
  id: string;
  starts_at: string;
  ends_at: string;
  profiles: { full_name: string } | null;
};

type Recurrence = "none" | "monthly" | "yearly";

type FormState = {
  id?: string;
  doctor_id: string;
  fromDay: string;
  fromTime: string;
  toDay: string;
  toTime: string;
  reason: string;
  recurrence: Recurrence;
  recurrenceCount: number;
};

const emptyForm = (): FormState => ({
  doctor_id: "",
  fromDay: isoDay(new Date()),
  fromTime: "09:00",
  toDay: isoDay(new Date()),
  toTime: "13:00",
  reason: "Ferie",
  recurrence: "none",
  recurrenceCount: 1,
});

/** Estrae giorno e ora locali (fuso studio) da un timestamp ISO. */
function splitLocal(iso: string) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Rome",
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).formatToParts(new Date(iso));
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "00";
  return {
    day: `${get("year")}-${get("month")}-${get("day")}`,
    time: `${get("hour") === "24" ? "00" : get("hour")}:${get("minute")}`,
  };
}

export function BlockedSlotsManager() {
  const queryClient = useQueryClient();
  const fetchSlots = useServerFn(listBlockedSlots);
  const fetchDoctors = useServerFn(listStaffDoctors);
  const save = useServerFn(saveBlockedSlot);
  const remove = useServerFn(deleteBlockedSlot);

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [conflicts, setConflicts] = useState<Conflict[]>([]);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const slots = useQuery({ queryKey: ["blocked-slots"], queryFn: () => fetchSlots() });
  const doctors = useQuery({ queryKey: ["staff-doctors"], queryFn: () => fetchDoctors() });

  const startsAt = useMemo(
    () => (form.fromDay ? localToIso(form.fromDay, form.fromTime) : ""),
    [form.fromDay, form.fromTime],
  );
  const endsAt = useMemo(
    () => (form.toDay ? localToIso(form.toDay, form.toTime) : ""),
    [form.toDay, form.toTime],
  );

  const validation = (() => {
    if (!form.doctor_id) return "Seleziona un medico.";
    if (!form.fromDay || !form.toDay) return "Inserisci le date di inizio e fine.";
    if (form.reason.trim().length < 3) return "Indica un motivo (almeno 3 caratteri).";
    if (new Date(endsAt).getTime() <= new Date(startsAt).getTime())
      return "La fine deve essere successiva all'inizio.";
    return null;
  })();

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["blocked-slots"] });
    queryClient.invalidateQueries({ queryKey: ["availability"] });
    queryClient.invalidateQueries({ queryKey: ["agenda"] });
  };

  const saveMutation = useMutation({
    mutationFn: (force: boolean) =>
      save({
        data: {
          ...(form.id ? { id: form.id } : {}),
          doctor_id: form.doctor_id,
          starts_at: startsAt,
          ends_at: endsAt,
          reason: form.reason.trim(),
          recurrence: form.recurrence,
          recurrence_count: form.recurrence === "none" ? 1 : form.recurrenceCount,
          force,
        },
      }),
    onSuccess: (res) => {
      if (!res.ok) {
        setConflicts(res.conflicts as Conflict[]);
        toast.warning("Ci sono appuntamenti in conflitto nel periodo scelto.");
        return;
      }
      setConflicts([]);
      setOpen(false);
      invalidate();
      const base = form.id
        ? "Periodo aggiornato."
        : res.created > 1
          ? `${res.created} periodi salvati (ricorrenza).`
          : "Periodo di indisponibilità salvato.";
      toast.success(base, {
        description:
          res.notified > 0 || res.emailed > 0
            ? `${res.notified + res.emailed} pazienti avvisati${res.emailed > 0 ? ` (${res.emailed} via email)` : ""}.`
            : undefined,
      });
    },
    onError: (e: Error) => toast.error(e.message || "Salvataggio non riuscito."),
  });

  const deleteMutation = useMutation({
    mutationFn: (input: { id: string; whole_series?: boolean }) => remove({ data: input }),
    onSuccess: () => {
      setDeleteId(null);
      invalidate();
      toast.success("Periodo rimosso.");
    },
    onError: () => toast.error("Rimozione non riuscita."),
  });

  function openNew() {
    setForm(emptyForm());
    setConflicts([]);
    setOpen(true);
  }

  function openEdit(row: {
    id: string;
    doctor_id: string;
    starts_at: string;
    ends_at: string;
    reason: string;
  }) {
    const from = splitLocal(row.starts_at);
    const to = splitLocal(row.ends_at);
    setForm({
      id: row.id,
      doctor_id: row.doctor_id,
      fromDay: from.day,
      fromTime: from.time,
      toDay: to.day,
      toTime: to.time,
      reason: row.reason,
      recurrence: "none",
      recurrenceCount: 1,
    });
    setConflicts([]);
    setOpen(true);
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <p className="text-muted-foreground flex-1 text-sm">
          Ferie, permessi e chiusure: gli orari inseriti spariscono subito dalla prenotazione online.
        </p>
        <Button onClick={openNew}>
          <Plus /> Nuovo periodo
        </Button>
      </div>

      {slots.isPending ? (
        <Skeleton className="h-40 w-full rounded-3xl" />
      ) : (slots.data ?? []).length === 0 ? (
        <p className="text-muted-foreground text-sm">Nessuna indisponibilità registrata.</p>
      ) : (
        <ul className="space-y-3">
          {(slots.data ?? []).map((s) => (
            <li key={s.id} className="surface-card flex flex-wrap items-center gap-4 p-5">
              <CalendarOff className="text-muted-foreground size-5" />
              <div className="min-w-52 flex-1">
                <p className="font-medium">{s.reason}</p>
                <p className="text-muted-foreground text-sm">
                  {s.doctors?.full_name} · dal {formatDateTime(s.starts_at)} al{" "}
                  {formatDateTime(s.ends_at)}
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={() => openEdit(s)}>
                <Pencil /> Modifica
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setDeleteId(s.id)}>
                <Trash2 /> Elimina
              </Button>
            </li>
          ))}
        </ul>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{form.id ? "Modifica indisponibilità" : "Nuova indisponibilità"}</DialogTitle>
            <DialogDescription>
              Il periodo blocca la prenotazione online per il medico selezionato.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label>Medico</Label>
              <Select
                value={form.doctor_id}
                onValueChange={(v) => {
                  setForm((f) => ({ ...f, doctor_id: v }));
                  setConflicts([]);
                }}
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

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="from-day">Inizio</Label>
                <Input
                  id="from-day"
                  type="date"
                  value={form.fromDay}
                  onChange={(e) => {
                    const v = e.target.value;
                    setForm((f) => ({ ...f, fromDay: v, toDay: f.toDay < v ? v : f.toDay }));
                    setConflicts([]);
                  }}
                />
                <Input
                  aria-label="Ora di inizio"
                  type="time"
                  step={900}
                  value={form.fromTime}
                  onChange={(e) => {
                    const v = e.target.value;
                    setForm((f) => ({ ...f, fromTime: v }));
                    setConflicts([]);
                  }}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="to-day">Fine</Label>
                <Input
                  id="to-day"
                  type="date"
                  min={form.fromDay}
                  value={form.toDay}
                  onChange={(e) => {
                    const v = e.target.value;
                    setForm((f) => ({ ...f, toDay: v }));
                    setConflicts([]);
                  }}
                />
                <Input
                  aria-label="Ora di fine"
                  type="time"
                  step={900}
                  value={form.toTime}
                  onChange={(e) => {
                    const v = e.target.value;
                    setForm((f) => ({ ...f, toTime: v }));
                    setConflicts([]);
                  }}
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="reason">Motivo</Label>
              <Input
                id="reason"
                maxLength={200}
                value={form.reason}
                placeholder="Ferie, permesso, congresso…"
                onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))}
              />
            </div>

            {validation ? (
              <p className="text-destructive text-sm">{validation}</p>
            ) : null}

            {conflicts.length > 0 ? (
              <Alert variant="destructive">
                <TriangleAlert />
                <AlertTitle>{conflicts.length} appuntamenti in conflitto</AlertTitle>
                <AlertDescription>
                  <ul className="mt-1 space-y-1 text-xs">
                    {conflicts.map((c) => (
                      <li key={c.id}>
                        {formatDateTime(c.starts_at)} · {c.profiles?.full_name ?? "Paziente"}
                      </li>
                    ))}
                  </ul>
                  <p className="mt-2 text-xs">
                    Sposta o annulla gli appuntamenti dall'agenda, oppure salva comunque il periodo.
                  </p>
                </AlertDescription>
              </Alert>
            ) : null}
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Annulla
            </Button>
            {conflicts.length > 0 ? (
              <Button
                variant="destructive"
                disabled={saveMutation.isPending}
                onClick={() => saveMutation.mutate(true)}
              >
                Salva comunque
              </Button>
            ) : null}
            <Button
              disabled={!!validation || saveMutation.isPending}
              onClick={() => saveMutation.mutate(false)}
            >
              {form.id ? "Aggiorna" : "Salva"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Rimuovere il periodo?</AlertDialogTitle>
            <AlertDialogDescription>
              Gli orari torneranno prenotabili online. Se il periodo fa parte di una serie
              ricorrente puoi rimuovere anche tutte le occorrenze.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annulla</AlertDialogCancel>
            <Button
              variant="outline"
              onClick={() =>
                deleteId && deleteMutation.mutate({ id: deleteId, whole_series: true })
              }
            >
              Rimuovi tutta la serie
            </Button>
            <AlertDialogAction
              onClick={() => deleteId && deleteMutation.mutate({ id: deleteId })}
            >
              Rimuovi
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="border-border mt-12 border-t pt-10">
        <BlockedSlotsAudit />
      </div>
    </div>
  );
}
