import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { CalendarPlus, Check, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { PageHeader, SiteLayout } from "@/components/site/SiteLayout";
import { ServiceIcon } from "@/components/site/ServiceIcon";
import { doctorPhoto } from "@/components/site/doctor-photos";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { doctorsQuery, servicesQuery } from "@/lib/public-queries";
import { getAvailability, bookAppointment } from "@/lib/booking.functions";
import { formatDateShort, formatDuration, formatPrice, formatTime, isoDay } from "@/lib/format";
import { useSession } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { translateAuthError } from "@/lib/auth-errors";
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
  const [confirmOpen, setConfirmOpen] = useState(false);

  // Identità paziente non ancora loggato: raccolta direttamente nel riepilogo,
  // senza far passare da una pagina di login/registrazione separata.
  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [guestConsent, setGuestConsent] = useState(false);
  const [guestPassword, setGuestPassword] = useState("");
  const [accountExists, setAccountExists] = useState(false);
  const [identityBusy, setIdentityBusy] = useState(false);

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
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: book,
    onSuccess: () => {
      setConfirmOpen(false);
      setSlot(null);
      setNote("");
      void queryClient.invalidateQueries({ queryKey: ["availability"] });
      void queryClient.invalidateQueries({ queryKey: ["my-appointments"] });
      void availability.refetch();
      toast.success("Appuntamento richiesto! Lo trovi nella tua area personale.");
      navigate({ to: "/area-personale" });
    },
    onError: (e: Error) => toast.error(e.message || "Prenotazione non riuscita."),
  });

  const canBook = serviceId && doctorId && slot;

  /**
   * Se il paziente è già loggato, non fa nulla (torna true subito).
   * Se non lo è, crea l'account dietro le quinte con i dati raccolti nel
   * riepilogo (nessuna pagina separata, nessuna password da scegliere) e
   * aggiorna il profilo con telefono e consenso privacy. Se esiste già un
   * account con quella email, chiede la password per accedere invece di
   * registrarne uno nuovo.
   */
  async function ensureIdentity(): Promise<boolean> {
    if (user) return true;

    if (!guestName.trim() || !guestEmail.trim() || !guestPhone.trim()) {
      toast.error("Compila nome, email e telefono per continuare.");
      return false;
    }
    if (!guestConsent) {
      toast.error("Devi accettare l'informativa privacy per prenotare.");
      return false;
    }

    setIdentityBusy(true);
    try {
      if (accountExists) {
        if (!guestPassword) {
          toast.error("Inserisci la password del tuo account per continuare.");
          return false;
        }
        const { error } = await supabase.auth.signInWithPassword({
          email: guestEmail.trim(),
          password: guestPassword,
        });
        if (error) {
          toast.error(translateAuthError(error.message));
          return false;
        }
        return true;
      }

      const randomPassword = `${crypto.randomUUID()}${crypto.randomUUID()}`;
      const { data, error } = await supabase.auth.signUp({
        email: guestEmail.trim(),
        password: randomPassword,
        options: {
          emailRedirectTo: `${window.location.origin}/area-personale`,
          data: { full_name: guestName.trim() },
        },
      });

      if (error) {
        if (error.message.toLowerCase().includes("already registered")) {
          setAccountExists(true);
          toast.error(
            "Risulta già un account con questa email: inserisci la password per continuare.",
          );
          return false;
        }
        toast.error(translateAuthError(error.message));
        return false;
      }

      if (!data.session || !data.user) {
        toast.error(
          "Ti abbiamo inviato un'email di conferma: apri il link e poi torna qui per completare la prenotazione.",
        );
        return false;
      }

      const { error: profileError } = await supabase
        .from("profiles")
        .update({ phone: guestPhone.trim(), privacy_consent: true })
        .eq("user_id", data.user.id);
      if (profileError) {
        // Non blocchiamo la prenotazione per questo: il profilo esiste comunque.
        console.error("Aggiornamento profilo non riuscito:", profileError.message);
      }

      return true;
    } finally {
      setIdentityBusy(false);
    }
  }

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
                      serviceId === s.id
                        ? "border-primary bg-primary-soft/60"
                        : "hover:bg-secondary",
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

            {loading ? null : (
              <Button
                variant="hero"
                size="lg"
                className="mt-6 w-full"
                disabled={!canBook || mutation.isPending}
                onClick={() => setConfirmOpen(true)}
              >
                <CalendarPlus aria-hidden="true" /> Vai al riepilogo
              </Button>
            )}

            <p className="text-muted-foreground mt-4 flex items-start gap-2 text-xs">
              <Check className="text-primary mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              Puoi spostare o annullare gratuitamente fino a 24 ore prima.
            </p>
          </div>
        </aside>
      </div>

      <Dialog open={confirmOpen} onOpenChange={(o) => !mutation.isPending && setConfirmOpen(o)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Conferma il tuo appuntamento</DialogTitle>
            <DialogDescription>
              Controlla i dettagli: dopo la conferma riceverai l'appuntamento nella tua area
              personale.
            </DialogDescription>
          </DialogHeader>

          {!user && (
            <div className="border-border space-y-4 border-b pb-5">
              <p className="text-muted-foreground text-xs">
                {accountExists
                  ? "Hai già un account con questa email: inserisci la password per continuare."
                  : "Ci servono pochi dati per confermare la prenotazione — ti creiamo subito un accesso alla tua area personale, senza bisogno di scegliere una password."}
              </p>
              {!accountExists && (
                <>
                  <div>
                    <Label htmlFor="guest-name">Nome e cognome</Label>
                    <Input
                      id="guest-name"
                      value={guestName}
                      onChange={(e) => setGuestName(e.target.value)}
                      maxLength={120}
                      className="mt-1.5"
                    />
                  </div>
                  <div>
                    <Label htmlFor="guest-phone">Telefono</Label>
                    <Input
                      id="guest-phone"
                      type="tel"
                      value={guestPhone}
                      onChange={(e) => setGuestPhone(e.target.value)}
                      maxLength={30}
                      className="mt-1.5"
                    />
                  </div>
                </>
              )}
              <div>
                <Label htmlFor="guest-email">Email</Label>
                <Input
                  id="guest-email"
                  type="email"
                  value={guestEmail}
                  onChange={(e) => setGuestEmail(e.target.value)}
                  className="mt-1.5"
                />
              </div>
              {accountExists && (
                <div>
                  <Label htmlFor="guest-password">Password</Label>
                  <Input
                    id="guest-password"
                    type="password"
                    value={guestPassword}
                    onChange={(e) => setGuestPassword(e.target.value)}
                    className="mt-1.5"
                  />
                </div>
              )}
              {!accountExists && (
                <div className="flex items-start gap-2.5">
                  <Checkbox
                    id="guest-consent"
                    checked={guestConsent}
                    onCheckedChange={(v) => setGuestConsent(v === true)}
                    className="mt-0.5"
                  />
                  <Label htmlFor="guest-consent" className="text-xs leading-relaxed font-normal">
                    Ho letto e accetto l'{" "}
                    <a href="/privacy" target="_blank" rel="noreferrer" className="underline">
                      informativa privacy
                    </a>{" "}
                    e presto il consenso al trattamento dei dati relativi alla salute necessari per
                    la visita.
                  </Label>
                </div>
              )}
            </div>
          )}

          <dl className="divide-border divide-y text-sm">
            <div className="flex items-start justify-between gap-4 py-2.5">
              <dt className="text-muted-foreground">Trattamento</dt>
              <dd className="text-right font-medium">
                {service?.name ?? "—"}
                {service && (
                  <span className="text-muted-foreground block text-xs font-normal">
                    {formatDuration(service.duration_min)}
                  </span>
                )}
              </dd>
            </div>
            <div className="flex items-start justify-between gap-4 py-2.5">
              <dt className="text-muted-foreground">Medico</dt>
              <dd className="text-right font-medium">
                {doctors.find((d) => d.id === doctorId)?.full_name ?? "—"}
                <span className="text-muted-foreground block text-xs font-normal">
                  {doctors.find((d) => d.id === doctorId)?.specialization}
                </span>
              </dd>
            </div>
            <div className="flex items-start justify-between gap-4 py-2.5">
              <dt className="text-muted-foreground">Data e orario</dt>
              <dd className="text-right font-medium">
                {slot
                  ? `${new Date(slot).toLocaleDateString("it-IT", {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                    })} · ${formatTime(slot)}`
                  : "—"}
              </dd>
            </div>
            {service && (
              <div className="flex items-start justify-between gap-4 py-2.5">
                <dt className="text-muted-foreground">Prezzo indicativo</dt>
                <dd className="text-right font-medium">da {formatPrice(service.price_cents)}</dd>
              </div>
            )}
            {note.trim() && (
              <div className="py-2.5">
                <dt className="text-muted-foreground">Nota per il medico</dt>
                <dd className="mt-1 whitespace-pre-line">{note.trim()}</dd>
              </div>
            )}
          </dl>

          <p className="text-muted-foreground text-xs">
            Puoi spostare o annullare gratuitamente fino a 24 ore prima.
          </p>

          <DialogFooter className="gap-2 sm:gap-2">
            <Button
              variant="outline"
              onClick={() => setConfirmOpen(false)}
              disabled={mutation.isPending}
            >
              Modifica
            </Button>
            <Button
              variant="hero"
              disabled={!canBook || mutation.isPending || identityBusy}
              onClick={async () => {
                const ready = await ensureIdentity();
                if (!ready) return;
                mutation.mutate({
                  data: {
                    doctorId: doctorId!,
                    serviceId: serviceId!,
                    startsAt: slot!,
                    note,
                  },
                });
              }}
            >
              {mutation.isPending || identityBusy ? (
                "Prenotazione…"
              ) : (
                <>
                  <Check aria-hidden="true" /> Conferma e prenota
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SiteLayout>
  );
}
