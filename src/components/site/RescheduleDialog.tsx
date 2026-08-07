import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
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
import { getAvailability, rescheduleAppointment } from "@/lib/booking.functions";
import { formatDateShort, formatDateTime, formatTime, isoDay } from "@/lib/format";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appointment: {
    id: string;
    starts_at: string;
    doctor_id: string;
    services: { name: string; duration_min: number } | null;
    doctors: { full_name: string } | null;
  };
};

function nextDays(count: number, offset: number) {
  const out: Date[] = [];
  const base = new Date();
  base.setHours(12, 0, 0, 0);
  for (let i = 0; i < count; i++) {
    const d = new Date(base);
    d.setDate(base.getDate() + offset + i);
    out.push(d);
  }
  return out;
}

export function RescheduleDialog({ open, onOpenChange, appointment }: Props) {
  const queryClient = useQueryClient();
  const [offset, setOffset] = useState(1);
  const [day, setDay] = useState<string>(isoDay(nextDays(1, 1)[0]!));
  const [slot, setSlot] = useState<string | null>(null);

  const days = useMemo(() => nextDays(7, offset), [offset]);
  const duration = appointment.services?.duration_min ?? 30;

  const availability = useQuery({
    queryKey: ["availability", appointment.doctor_id, day, duration],
    enabled: open,
    queryFn: () =>
      getAvailability({
        data: { doctorId: appointment.doctor_id, day, durationMin: duration },
      }),
  });

  const reschedule = useServerFn(rescheduleAppointment);
  const mutation = useMutation({
    mutationFn: reschedule,
    onSuccess: () => {
      toast.success("Riprogrammazione richiesta: attendi la conferma dello studio.");
      setSlot(null);
      void queryClient.invalidateQueries({ queryKey: ["my-appointments"] });
      void queryClient.invalidateQueries({ queryKey: ["availability"] });
      onOpenChange(false);
    },
    onError: (e: Error) => toast.error(e.message || "Riprogrammazione non riuscita."),
  });

  return (
    <Dialog open={open} onOpenChange={(o) => !mutation.isPending && onOpenChange(o)}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Sposta l'appuntamento</DialogTitle>
          <DialogDescription>
            {appointment.services?.name} con {appointment.doctors?.full_name} — attualmente{" "}
            {formatDateTime(appointment.starts_at)}.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center justify-between gap-2">
          <Button
            variant="ghost"
            size="sm"
            disabled={offset <= 1}
            onClick={() => setOffset((o) => Math.max(1, o - 7))}
          >
            Settimana precedente
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setOffset((o) => o + 7)}>
            Settimana successiva
          </Button>
        </div>

        <div className="grid grid-cols-4 gap-2 sm:grid-cols-7">
          {days.map((d) => {
            const value = isoDay(d);
            return (
              <button
                key={value}
                type="button"
                aria-pressed={day === value}
                onClick={() => {
                  setDay(value);
                  setSlot(null);
                }}
                className={`rounded-2xl border px-2 py-2 text-xs transition ${
                  day === value
                    ? "border-primary bg-primary-soft text-primary font-semibold"
                    : "border-border hover:border-primary/50"
                }`}
              >
                {formatDateShort(d)}
              </button>
            );
          })}
        </div>

        <div className="min-h-24">
          {availability.isPending ? (
            <Skeleton className="h-20 w-full rounded-2xl" />
          ) : availability.isError ? (
            <div className="text-sm">
              <p className="text-muted-foreground">Non riesco a caricare gli orari liberi.</p>
              <Button variant="outline" size="sm" className="mt-2" onClick={() => availability.refetch()}>
                Riprova
              </Button>
            </div>
          ) : availability.data?.closed ? (
            <p className="text-muted-foreground text-sm">Lo studio è chiuso in questa data.</p>
          ) : (availability.data?.slots ?? []).length === 0 ? (
            <p className="text-muted-foreground text-sm">
              Nessun orario libero: prova un altro giorno.
            </p>
          ) : (
            <ul className="flex flex-wrap gap-2">
              {(availability.data?.slots ?? []).map((s) => (
                <li key={s}>
                  <button
                    type="button"
                    aria-pressed={slot === s}
                    onClick={() => setSlot(s)}
                    className={`rounded-full border px-3 py-1.5 text-sm transition ${
                      slot === s
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    {formatTime(s)}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={mutation.isPending}>
            Annulla
          </Button>
          <Button
            variant="hero"
            disabled={!slot || mutation.isPending}
            onClick={() => mutation.mutate({ data: { id: appointment.id, startsAt: slot! } })}
          >
            {mutation.isPending ? "Salvataggio…" : "Sposta appuntamento"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}