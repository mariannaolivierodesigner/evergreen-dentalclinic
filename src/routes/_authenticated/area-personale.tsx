import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { CalendarPlus, CalendarClock, Download, FileText } from "lucide-react";
import { toast } from "sonner";
import { PageHeader, SiteLayout } from "@/components/site/SiteLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { RescheduleDialog } from "@/components/site/RescheduleDialog";
import { NotificationsPanel } from "@/components/site/NotificationsPanel";
import {
  cancelAppointment,
  listMyAppointments,
  listMyDocuments,
} from "@/lib/booking.functions";
import { useProfile, useSession } from "@/hooks/useAuth";
import { STATUS_LABEL, formatDateTime, formatPrice, isCancellable } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/area-personale")({
  head: () => ({
    meta: [
      { title: "Area personale — Studio Evergreen" },
      {
        name: "description",
        content: "I tuoi appuntamenti, i documenti clinici e i dati del tuo profilo paziente.",
      },
      { property: "og:title", content: "Area personale — Studio Evergreen" },
      { property: "og:description", content: "Gestisci appuntamenti e documenti." },
      { property: "og:url", content: "/area-personale" },
      { name: "robots", content: "noindex" },
    ],
    links: [{ rel: "canonical", href: "/area-personale" }],
  }),
  component: AreaPersonale,
});

const STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  pending: "secondary",
  confirmed: "default",
  completed: "outline",
  cancelled: "destructive",
  no_show: "destructive",
};

function AreaPersonale() {
  const { user } = useSession();
  const { data: profile } = useProfile(user?.id);
  const queryClient = useQueryClient();
  const [rescheduleId, setRescheduleId] = useState<string | null>(null);

  const fetchAppointments = useServerFn(listMyAppointments);
  const fetchDocuments = useServerFn(listMyDocuments);
  const cancel = useServerFn(cancelAppointment);

  const appointments = useQuery({
    queryKey: ["my-appointments"],
    queryFn: () => fetchAppointments(),
  });
  const documents = useQuery({ queryKey: ["my-documents"], queryFn: () => fetchDocuments() });

  const cancelMutation = useMutation({
    mutationFn: cancel,
    onSuccess: () => {
      toast.success("Appuntamento annullato.");
      queryClient.invalidateQueries({ queryKey: ["my-appointments"] });
      queryClient.invalidateQueries({ queryKey: ["availability"] });
    },
    onError: (e: Error) =>
      toast.error(e.message || "Non è stato possibile annullare l'appuntamento."),
  });

  const now = Date.now();
  const rows = appointments.data ?? [];
  const upcoming = rows.filter(
    (a) => new Date(a.starts_at).getTime() >= now && a.status !== "cancelled",
  );
  const past = rows.filter(
    (a) => new Date(a.starts_at).getTime() < now || a.status === "cancelled",
  );
  const rescheduling = rows.find((a) => a.id === rescheduleId) ?? null;

  return (
    <SiteLayout>
      <PageHeader
        eyebrow="Area personale"
        title={profile?.full_name ? `Ciao, ${profile.full_name.split(" ")[0]}` : "Area personale"}
        description="Qui trovi i tuoi appuntamenti, i preventivi e i referti caricati dallo studio."
      />

      <div className="mx-auto max-w-6xl px-5 py-12">
        <Button variant="hero" size="lg" asChild>
          <Link to="/prenota">
            <CalendarPlus aria-hidden="true" /> Nuova prenotazione
          </Link>
        </Button>

        <Tabs defaultValue="appuntamenti" className="mt-8">
          <TabsList>
            <TabsTrigger value="appuntamenti">Appuntamenti</TabsTrigger>
            <TabsTrigger value="notifiche">Notifiche</TabsTrigger>
            <TabsTrigger value="documenti">Documenti</TabsTrigger>
            <TabsTrigger value="profilo">Profilo</TabsTrigger>
          </TabsList>


          <TabsContent value="appuntamenti" className="mt-6 space-y-8">
            {appointments.isPending ? (
              <Skeleton className="h-32 w-full rounded-3xl" />
            ) : (
              <>
                <section>
                  <h2 className="text-lg font-semibold">In programma</h2>
                  {upcoming.length === 0 ? (
                    <p className="text-muted-foreground mt-2 text-sm">
                      Nessun appuntamento in programma.
                    </p>
                  ) : (
                    <ul className="mt-4 space-y-3">
                      {upcoming.map((a) => (
                        <li
                          key={a.id}
                          className="surface-card flex flex-wrap items-center gap-4 p-5"
                        >
                          <div className="min-w-52 flex-1">
                            <p className="font-semibold">{a.services?.name}</p>
                            <p className="text-muted-foreground text-sm">
                              {formatDateTime(a.starts_at)} · {a.doctors?.full_name}
                            </p>
                            {a.patient_note && (
                              <p className="text-muted-foreground mt-1 text-xs italic">
                                “{a.patient_note}”
                              </p>
                            )}
                          </div>
                          <Badge variant={STATUS_VARIANT[a.status] ?? "secondary"}>
                            {STATUS_LABEL[a.status]}
                          </Badge>
                          <div className="flex flex-wrap gap-2">
                            <Button
                              variant="soft"
                              size="sm"
                              disabled={!isCancellable(a.starts_at)}
                              onClick={() => setRescheduleId(a.id)}
                            >
                              <CalendarClock aria-hidden="true" /> Sposta
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  disabled={!isCancellable(a.starts_at) || cancelMutation.isPending}
                                >
                                  Annulla
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Annullare l'appuntamento?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    {a.services?.name} del {formatDateTime(a.starts_at)}. Puoi
                                    sempre prenotare di nuovo o spostarlo a un altro orario.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Mantieni</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => cancelMutation.mutate({ data: { id: a.id } })}
                                  >
                                    Annulla appuntamento
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                          {!isCancellable(a.starts_at) && (
                            <p className="text-muted-foreground w-full text-xs">
                              Mancano meno di 24 ore: chiamaci per modifiche.
                            </p>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </section>

                <section>
                  <h2 className="text-lg font-semibold">Storico</h2>
                  {past.length === 0 ? (
                    <p className="text-muted-foreground mt-2 text-sm">Ancora nessuna visita.</p>
                  ) : (
                    <ul className="mt-4 space-y-3">
                      {past.map((a) => (
                        <li
                          key={a.id}
                          className="surface-card flex flex-wrap items-center gap-4 p-5 opacity-80"
                        >
                          <div className="min-w-52 flex-1">
                            <p className="font-medium">{a.services?.name}</p>
                            <p className="text-muted-foreground text-sm">
                              {formatDateTime(a.starts_at)} · {a.doctors?.full_name}
                            </p>
                          </div>
                          {a.services?.price_cents ? (
                            <span className="text-sm font-medium">
                              {formatPrice(a.services.price_cents)}
                            </span>
                          ) : null}
                          <Badge variant={STATUS_VARIANT[a.status] ?? "secondary"}>
                            {STATUS_LABEL[a.status]}
                          </Badge>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
              </>
            )}
          </TabsContent>

          <TabsContent value="documenti" className="mt-6">
            {documents.isPending ? (
              <Skeleton className="h-24 w-full rounded-3xl" />
            ) : (documents.data ?? []).length === 0 ? (
              <p className="text-muted-foreground text-sm">
                Nessun documento disponibile. Preventivi e referti compaiono qui dopo la visita.
              </p>
            ) : (
              <ul className="grid gap-3 md:grid-cols-2">
                {(documents.data ?? []).map((d) => (
                  <li key={d.id} className="surface-card flex items-center gap-4 p-5">
                    <span className="bg-primary-soft text-primary grid h-10 w-10 place-items-center rounded-2xl">
                      <FileText className="h-4 w-4" aria-hidden="true" />
                    </span>
                    <div className="flex-1">
                      <p className="font-medium">{d.title}</p>
                      <p className="text-muted-foreground text-xs capitalize">{d.kind}</p>
                    </div>
                    <Button variant="ghost" size="icon" aria-label={`Scarica ${d.title}`} asChild>
                      <a href={d.file_url ?? "#"} target="_blank" rel="noreferrer">
                        <Download />
                      </a>
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </TabsContent>

          <TabsContent value="profilo" className="mt-6">
            <div className="surface-card max-w-xl space-y-4 p-6">
              <div>
                <p className="text-muted-foreground text-xs uppercase">Nome</p>
                <p className="font-medium">{profile?.full_name ?? "—"}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs uppercase">Email</p>
                <p className="font-medium">{profile?.email ?? user?.email ?? "—"}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs uppercase">Telefono</p>
                <p className="font-medium">{profile?.phone ?? "—"}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs uppercase">Allergie segnalate</p>
                <p className="font-medium">
                  {profile?.allergies?.length ? profile.allergies.join(", ") : "Nessuna"}
                </p>
              </div>
              <p className="text-muted-foreground text-sm">
                Per aggiornare i dati clinici scrivici dalla pagina contatti o parlane in
                reception: li verifichiamo insieme.
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {rescheduling && (
        <RescheduleDialog
          key={rescheduling.id}
          open
          onOpenChange={(o) => !o && setRescheduleId(null)}
          appointment={rescheduling}
        />
      )}
    </SiteLayout>
  );
}