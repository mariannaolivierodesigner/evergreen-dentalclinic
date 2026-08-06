import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { z } from "zod";
import { useMutation, useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { CalendarPlus, Check, ChevronLeft, ChevronRight, LogIn } from "lucide-react";
import { toast } from "sonner";
import { PageHeader, SiteLayout } from "@/components/site/SiteLayout";
import { ServiceIcon } from "@/components/site/ServiceIcon";
import { doctorPhoto } from "@/components/site/doctor-photos";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { doctorsQuery, servicesQuery } from "@/lib/public-queries";
import { getAvailability, bookAppointment } from "@/lib/booking.functions";
import { formatDateShort, formatDuration, formatPrice, formatTime, isoDay } from "@/lib/format";
import { useSession } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/prenota")({
  validateSearch: z.object({ servizio: z.string().optional() }),
  head: () => ({
    meta: [
      { title: "Prenota una visita online — Studio Evergreen Milano" },
      {
        name: "description",
        content:
          "Scegli trattamento, medico e orario e prenota la tua visita allo Studio Dentistico Evergreen in meno di due minuti, con conferma immediata.",
      },
      { property: "og:title", content: "Prenota online — Studio Evergreen" },
      { property: "og:description", content: "Conferma immediata e promemoria il giorno prima." },
      { property: "og:url", content: "/prenota" },
    ],
    links: [{ rel: "canonical", href: "/prenota" }],
  }),
  loader: ({ context }) => {
    context.queryClient.ensureQueryData(servicesQuery());
    context.queryClient.ensureQueryData(doctorsQuery());
  },
  component: Prenota,
});

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

function Prenota() {
  const { servizio } = Route.useSearch();
  const navigate = useNavigate();
  const { user, loading } = useSession();
  const { data: services } = useSuspenseQuery(servicesQuery());
  const { data: doctors } = useSuspenseQuery(doctorsQuery());

  const [serviceId, setServiceId] = useState<string | null>(
    services.find((s) => s.slug === servizio)?.id ?? null,
  );
  const [doctorId, setDoctorId] = useState<string | null>(null);
  const [offset, setOffset] = useState(0);
  const [day, setDay] = useState<string>(isoDay(new Date()));
  const [slot, setSlot] = useState<string | null>(null);
  const [note, setNote] = useState("");

  const service = services.find((s) => s.id === serviceId) ?? null;
  const days = useMemo(() => nextDays(7, offset), [offset]);

  const availability = useQuery({
    queryKey: ["availability", doctorId, day, service?.duration_min],
    enabled: !!doctorId && !!service,
    queryFn: () =>
      getAvailability({
        data: { doctorId: doctorId!, day, durationMin: service!.duration_min },
      }),
  });

  const book = useServerFn(bookAppointment);
  const mutation = useMutation({
    mutationFn: book,
    onSuccess: () => {
      toast.success("Appuntamento richiesto! Lo trovi nella tua area personale.");
      navigate({ to: "/area-personale" });
    },
    onError: (e: Error) => toast.error(e.message || "Prenotazione non riuscita."),
  });

  const canBook = serviceId && doctorId && slot;

  return (
    <SiteLayout>
      <PageHeader
        eyebrow="Prenotazione"
        title="Prenota in tre passaggi"
        description="Scegli il trattamento, il medico e l'orario. Ricevi conferma nell'area personale e un promemoria il giorno prima."
      />

      <div className="mx-auto grid max-w-6xl gap-8 px-5 py-16 lg:grid-cols-[1fr_20rem]">
        <div className="space-y-10">
          {/* Step 1 */}
          <section aria-labelledby="step-1">
            <h2 id="step-1" className="text-xl font-semibold">
              <span className="text-primary">1.</span> Scegli il trattamento
            </h2>
            <ul className="mt-4 grid gap-3 sm:grid-cols-2">
              {services.map((s) => (
                <li key={s.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setServiceId(s.id);
                      setSlot(null);
                    }}
                    aria-pressed={serviceId === s.id}
                    className={cn(
                      "surface-card flex w-full items-start gap-3 p-4 text-left transition-colors",
                      serviceId === s.id ? "border-primary bg-primary-soft/60" : "hover:bg-secondary",
                    )}
                  >
                    <span className="bg-primary-soft text-primary grid h-9 w-9 shrink-0 place-items-center rounded-xl">
                      <ServiceIcon name={s.icon} className="h-4 w-4" />
                    </span>
                    <span>
                      <span className="block font-medium">{s.name}</span>
                      <span className="text-muted-foreground block text-xs">
                        {formatDuration(s.duration_min)} · da {formatPrice(s.price_cents)}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </section>

          {/* Step 2 */}
          <section aria-labelledby="step-2">
            <h2 id="step-2" className="text-xl font-semibold">
              <span className="text-primary">2.</span> Scegli il medico
            </h2>
            <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {doctors.map((d) => (
                <li key={d.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setDoctorId(d.id);
                      setSlot(null);
                    }}
                    aria-pressed={doctorId === d.id}
                    className={cn(
                      "surface-card w-full overflow-hidden text-left transition-colors",
                      doctorId === d.id ? "border-primary" : "hover:bg-secondary",
                    )}
                  >
                    <img
                      src={doctorPhoto(d.full_name)}
                      alt=""
                      loading="lazy"
                      width={700}
                      height={700}
                      className="aspect-square w-full object-cover"
                    />
                    <span className="block p-3">
                      <span className="block text-sm font-medium">{d.full_name}</span>
                      <span className="text-muted-foreground block text-xs">
                        {d.specialization}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </section>

          {/* Step 3 */}
          <section aria-labelledby="step-3">
            <h2 id="step-3" className="text-xl font-semibold">
              <span className="text-primary">3.</span> Scegli data e orario
            </h2>

            <div className="mt-4 flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                aria-label="Settimana precedente"
                disabled={offset === 0}
                onClick={() => setOffset((o) => Math.max(0, o - 7))}
              >
                <ChevronLeft />
              </Button>
              <ul className="flex flex-1 gap-2 overflow-x-auto pb-1">
                {days.map((d) => {
                  const key = isoDay(d);
                  return (
                    <li key={key}>
                      <button
                        type="button"
                        onClick={() => {
                          setDay(key);
                          setSlot(null);
                        }}
                        aria-pressed={day === key}
                        className={cn(
                          "min-w-[4.5rem] rounded-2xl border px-3 py-2 text-center text-sm transition-colors",
                          day === key
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border hover:bg-secondary",
                        )}
                      >
                        <span className="block text-xs capitalize">
                          {d.toLocaleDateString("it-IT", { weekday: "short" })}
                        </span>
                        <span className="block font-semibold">{formatDateShort(d)}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
              <Button
                variant="outline"
                size="icon"
                aria-label="Settimana successiva"
                onClick={() => setOffset((o) => o + 7)}
              >
                <ChevronRight />
              </Button>
            </div>

            <div className="mt-5">
              {!serviceId || !doctorId ? (
                <p className="text-muted-foreground text-sm">
                  Seleziona prima trattamento e medico per vedere gli orari liberi.
                </p>
              ) : availability.isPending ? (
                <div className="flex flex-wrap gap-2">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <Skeleton key={i} className="h-10 w-20 rounded-full" />
                  ))}
                </div>
              ) : availability.isError ? (
                <p className="text-destructive text-sm">
                  Non riusciamo a caricare gli orari liberi.{" "}
                  <button
                    type="button"
                    className="underline underline-offset-4"
                    onClick={() => availability.refetch()}
                  >
                    Riprova
                  </button>
                </p>
              ) : availability.data?.closed ? (
                <p className="text-muted-foreground text-sm">
                  Il medico selezionato non riceve in questa data: scegli un altro giorno.
                </p>
              ) : availability.data && availability.data.slots.length > 0 ? (
                <ul className="flex flex-wrap gap-2">
                  {availability.data.slots.map((iso) => (
                    <li key={iso}>
                      <button
                        type="button"
                        onClick={() => setSlot(iso)}
                        aria-pressed={slot === iso}
                        className={cn(
                          "rounded-full border px-4 py-2 text-sm transition-colors",
                          slot === iso
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border hover:bg-secondary",
                        )}
                      >
                        {formatTime(iso)}
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-muted-foreground text-sm">
                  Nessun orario libero in questa giornata: prova un altro giorno o un altro medico.
                </p>
              )}
            </div>

            <div className="mt-6 max-w-xl">
              <Label htmlFor="note">Vuoi dirci qualcosa prima della visita? (facoltativo)</Label>
              <Textarea
                id="note"
                value={note}
                maxLength={600}
                rows={3}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Es. ho molta ansia del dentista, preferirei una spiegazione passo passo."
                className="mt-1.5"
              />
            </div>
          </section>
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="surface-card p-6">
            <h2 className="font-semibold">Riepilogo</h2>
            <dl className="mt-4 space-y-3 text-sm">
              <div>
                <dt className="text-muted-foreground text-xs uppercase">Trattamento</dt>
                <dd className="font-medium">{service?.name ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground text-xs uppercase">Medico</dt>
                <dd className="font-medium">
                  {doctors.find((d) => d.id === doctorId)?.full_name ?? "—"}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground text-xs uppercase">Quando</dt>
                <dd className="font-medium">
                  {slot ? `${formatDateShort(slot)} · ${formatTime(slot)}` : "—"}
                </dd>
              </div>
              {service && (
                <div>
                  <dt className="text-muted-foreground text-xs uppercase">Prezzo indicativo</dt>
                  <dd className="font-medium">da {formatPrice(service.price_cents)}</dd>
                </div>
              )}
            </dl>

            {loading ? null : user ? (
              <Button
                variant="hero"
                size="lg"
                className="mt-6 w-full"
                disabled={!canBook || mutation.isPending}
                onClick={() =>
                  mutation.mutate({
                    data: {
                      doctorId: doctorId!,
                      serviceId: serviceId!,
                      startsAt: slot!,
                      note,
                    },
                  })
                }
              >
                {mutation.isPending ? (
                  "Prenotazione…"
                ) : (
                  <>
                    <CalendarPlus aria-hidden="true" /> Conferma prenotazione
                  </>
                )}
              </Button>
            ) : (
              <div className="mt-6">
                <p className="text-muted-foreground text-sm">
                  Per completare la prenotazione accedi o crea un account: ti serve anche per
                  gestire e disdire gli appuntamenti.
                </p>
                <Button variant="hero" size="lg" className="mt-3 w-full" asChild>
                  <Link to="/auth" search={{ redirect: "/prenota" }}>
                    <LogIn aria-hidden="true" /> Accedi per prenotare
                  </Link>
                </Button>
              </div>
            )}

            <p className="text-muted-foreground mt-4 flex items-start gap-2 text-xs">
              <Check className="text-primary mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              Puoi spostare o annullare gratuitamente fino a 24 ore prima.
            </p>
          </div>
        </aside>
      </div>
    </SiteLayout>
  );
}