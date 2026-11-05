import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Clock,
  Euro,
  Download,
  FileText,
  MessageSquare,
  Palmtree,
  ShieldCheck,
  Tag,
  Trash2,
  Upload,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader, SiteLayout } from "@/components/site/SiteLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import {
  addPatientDocument,
  deletePatientDocument,
  listAgenda,
  listMessages,
  listPatientDocuments,
  listPatients,
  sendAppointmentReminder,
  setAppointmentStatus,
} from "@/lib/staff.functions";
import { supabase } from "@/integrations/supabase/client";
import { BlockedSlotsManager } from "@/components/site/BlockedSlotsManager";
import { ShiftsManager } from "@/components/site/ShiftsManager";
import { ServicesManager } from "@/components/site/ServicesManager";
import { StaffCalendar } from "@/components/site/StaffCalendar";
import { StaffRevenue } from "@/components/site/StaffRevenue";
import { useRoles, useSession } from "@/hooks/useAuth";
import { STATUS_LABEL, formatDate, formatPrice, formatTime, isoDay } from "@/lib/format";

const tabTrigger =
  "flex-col gap-1.5 whitespace-normal rounded-xl px-1.5 py-3 text-center text-[0.78rem] leading-tight font-medium data-[state=active]:font-semibold sm:text-[0.85rem] lg:flex-1 lg:flex-row lg:whitespace-nowrap lg:px-3 lg:text-[0.9rem]";

export const Route = createFileRoute("/_authenticated/staff")({
  head: () => ({
    meta: [
      { title: "Gestionale studio — Studio Longobardi" },
      {
        name: "description",
        content: "Agenda giornaliera, anagrafica pazienti e messaggi in arrivo per lo staff.",
      },
      { property: "og:title", content: "Gestionale — Studio Longobardi" },
      { property: "og:description", content: "Agenda, pazienti e messaggi." },
      { property: "og:url", content: "/staff" },
      { name: "robots", content: "noindex" },
    ],
    links: [
      { rel: "canonical", href: "/staff" },
      { rel: "manifest", href: "/manifest.webmanifest" },
    ],
  }),
  component: StaffPage,
});

const STATUSES = ["pending", "confirmed", "completed", "cancelled", "no_show"] as const;

const DOCUMENT_KINDS = ["referto", "radiografia", "piano", "preventivo", "altro"] as const;
const DOCUMENT_KIND_LABEL: Record<(typeof DOCUMENT_KINDS)[number], string> = {
  referto: "Referto",
  radiografia: "Radiografia",
  piano: "Piano di cura",
  preventivo: "Preventivo",
  altro: "Altro",
};

function StaffPage() {
  const { user } = useSession();
  const { isStaff, isAdmin, isPending } = useRoles(user?.id);
  const queryClient = useQueryClient();
  const [day, setDay] = useState(isoDay(new Date()));
  const [agendaPeriod, setAgendaPeriod] = useState<"day" | "week" | "month">("week");
  const agendaRange = (() => {
    const d = new Date(`${day}T12:00:00`);
    if (agendaPeriod === "day") return { from: day, to: day };
    if (agendaPeriod === "week") {
      const from = new Date(d);
      from.setDate(d.getDate() - ((d.getDay() + 6) % 7));
      const to = new Date(from);
      to.setDate(from.getDate() + 6);
      return { from: isoDay(from), to: isoDay(to) };
    }
    return {
      from: isoDay(new Date(d.getFullYear(), d.getMonth(), 1)),
      to: isoDay(new Date(d.getFullYear(), d.getMonth() + 1, 0)),
    };
  })();
  const [docPatientId, setDocPatientId] = useState<string>("");
  const [docTitle, setDocTitle] = useState("");
  const [docKind, setDocKind] = useState<(typeof DOCUMENT_KINDS)[number]>("referto");
  const [docFile, setDocFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const fetchAgenda = useServerFn(listAgenda);
  const fetchPatients = useServerFn(listPatients);
  const fetchMessages = useServerFn(listMessages);
  const fetchPatientDocuments = useServerFn(listPatientDocuments);
  const registerDocument = useServerFn(addPatientDocument);
  const removeDocument = useServerFn(deletePatientDocument);
  const updateStatus = useServerFn(setAppointmentStatus);
  const sendReminder = useServerFn(sendAppointmentReminder);

  const [reminderTarget, setReminderTarget] = useState<{
    appointment: any;
    channel: "sms" | "whatsapp";
  } | null>(null);

  const agenda = useQuery({
    queryKey: ["agenda", agendaRange.from, agendaRange.to],
    enabled: isStaff,
    queryFn: () =>
      fetchAgenda({
        data: { from: `${agendaRange.from}T00:00:00Z`, to: `${agendaRange.to}T23:59:59Z` },
      }),
  });
  const patients = useQuery({
    queryKey: ["staff-patients"],
    enabled: isStaff,
    queryFn: () => fetchPatients(),
  });
  const messages = useQuery({
    queryKey: ["staff-messages"],
    enabled: isStaff,
    queryFn: () => fetchMessages(),
  });
  const patientDocuments = useQuery({
    queryKey: ["staff-patient-documents", docPatientId],
    enabled: isStaff && !!docPatientId,
    queryFn: () => fetchPatientDocuments({ data: { patientId: docPatientId } }),
  });

  const statusMutation = useMutation({
    mutationFn: updateStatus,
    onSuccess: () => {
      toast.success("Stato aggiornato.");
      queryClient.invalidateQueries({ queryKey: ["agenda"] });
    },
    onError: () => toast.error("Aggiornamento non riuscito."),
  });

  const reminderMutation = useMutation({
    mutationFn: (input: { id: string; channel: "sms" | "whatsapp" }) =>
      sendReminder({ data: input }),
    onSuccess: () => {
      toast.success("Promemoria segnato come inviato.");
      setReminderTarget(null);
      queryClient.invalidateQueries({ queryKey: ["agenda"] });
    },
    onError: () => toast.error("Non è stato possibile registrare l'invio."),
  });

  function composeReminderMessage(a: any) {
    const firstName = (a.profiles?.full_name ?? "").split(" ")[0] || "";
    const when = new Intl.DateTimeFormat("it-IT", {
      timeZone: "Europe/Rome",
      weekday: "long",
      day: "numeric",
      month: "long",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(a.starts_at));
    return `Ciao ${firstName}, ti confermiamo l'appuntamento per "${a.services?.name}" presso Studio Dentistico Longobardi, ${when}. A presto!`;
  }

  const uploadDocumentMutation = useMutation({
    mutationFn: async () => {
      if (!docPatientId || !docFile || !docTitle.trim()) {
        throw new Error("Compila paziente, titolo e file prima di caricare.");
      }
      setIsUploading(true);
      const safeName = docFile.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const path = `${docPatientId}/${Date.now()}-${safeName}`;
      const { error: uploadError } = await supabase.storage
        .from("documents")
        .upload(path, docFile, { upsert: false });
      if (uploadError) throw new Error(uploadError.message);
      await registerDocument({
        data: { patientId: docPatientId, title: docTitle.trim(), kind: docKind, filePath: path },
      });
    },
    onSuccess: () => {
      toast.success("Documento caricato.");
      setDocTitle("");
      setDocFile(null);
      queryClient.invalidateQueries({ queryKey: ["staff-patient-documents", docPatientId] });
    },
    onError: (e: Error) => toast.error(e.message || "Caricamento non riuscito."),
    onSettled: () => setIsUploading(false),
  });

  const deleteDocumentMutation = useMutation({
    mutationFn: (id: string) => removeDocument({ data: { id } }),
    onSuccess: () => {
      toast.success("Documento eliminato.");
      queryClient.invalidateQueries({ queryKey: ["staff-patient-documents", docPatientId] });
    },
    onError: () => toast.error("Eliminazione non riuscita."),
  });

  function shiftDay(delta: number) {
    const d = new Date(`${day}T12:00:00`);
    if (agendaPeriod === "month") d.setMonth(d.getMonth() + delta);
    else d.setDate(d.getDate() + delta * (agendaPeriod === "week" ? 7 : 1));
    setDay(isoDay(d));
  }

  if (!isPending && !isStaff) {
    return (
      <SiteLayout progress={false}>
        <PageHeader
          title="Area riservata allo staff"
          description="Il tuo account non ha i permessi per accedere al gestionale."
        />
      </SiteLayout>
    );
  }

  return (
    <SiteLayout progress={false}>
      <PageHeader title="Area riservata" tone="dark">
        {isAdmin ? (
          <Button asChild variant="outline">
            <Link to="/staff-ruoli">
              <ShieldCheck /> Gestisci ruoli e permessi
            </Link>
          </Button>
        ) : null}
      </PageHeader>

      <div className="mx-auto max-w-6xl px-5 py-12">
        <Tabs defaultValue="agenda">
          <div className="pb-1">
            <TabsList className="grid h-auto w-full grid-cols-3 gap-1.5 rounded-2xl p-1.5 sm:grid-cols-5 lg:flex lg:justify-between lg:gap-1">
              <TabsTrigger value="agenda" className={tabTrigger}>
                <ClipboardList aria-hidden="true" className="size-[1.35rem] lg:size-[1.05rem]" />
                Agenda
              </TabsTrigger>
              <TabsTrigger value="calendario" className={tabTrigger}>
                <CalendarDays aria-hidden="true" className="size-[1.35rem] lg:size-[1.05rem]" />
                Calendario
              </TabsTrigger>
              <TabsTrigger value="pazienti" className={tabTrigger}>
                <Users aria-hidden="true" className="size-[1.35rem] lg:size-[1.05rem]" />
                Pazienti
              </TabsTrigger>
              <TabsTrigger value="documenti" className={tabTrigger}>
                <FileText aria-hidden="true" className="size-[1.35rem] lg:size-[1.05rem]" />
                Documenti
              </TabsTrigger>
              <TabsTrigger value="listino" className={tabTrigger}>
                <Tag aria-hidden="true" className="size-[1.35rem] lg:size-[1.05rem]" />
                Listino
              </TabsTrigger>
              <TabsTrigger value="indisponibilita" className={tabTrigger}>
                <Palmtree aria-hidden="true" className="size-[1.35rem] lg:size-[1.05rem]" />
                Ferie e permessi
              </TabsTrigger>
              <TabsTrigger value="turni" className={tabTrigger}>
                <Clock aria-hidden="true" className="size-[1.35rem] lg:size-[1.05rem]" />
                Turni
              </TabsTrigger>
              <TabsTrigger value="fatturato" className={tabTrigger}>
                <Euro aria-hidden="true" className="size-[1.35rem] lg:size-[1.05rem]" />
                Fatturato
              </TabsTrigger>
              <TabsTrigger value="messaggi" className={tabTrigger}>
                <MessageSquare aria-hidden="true" className="size-[1.35rem] lg:size-[1.05rem]" />
                Messaggi
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="agenda" className="mt-6">
            <div className="bg-muted mb-4 flex w-full gap-1 rounded-2xl p-1.5 sm:inline-flex sm:w-auto">
              {(
                [
                  ["day", "Giorno"],
                  ["week", "Settimana"],
                  ["month", "Mese"],
                ] as const
              ).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setAgendaPeriod(id)}
                  className={`flex-1 cursor-pointer rounded-xl px-4 py-2 text-sm font-medium transition-all sm:flex-none ${
                    agendaPeriod === id
                      ? "bg-background text-foreground font-semibold shadow"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="icon"
                aria-label="Periodo precedente"
                onClick={() => shiftDay(-1)}
              >
                <ChevronLeft />
              </Button>
              <p className="font-display flex-1 text-center text-lg font-semibold capitalize sm:text-left">
                {agendaPeriod === "day"
                  ? formatDate(`${day}T12:00:00`)
                  : agendaPeriod === "week"
                    ? `${formatDate(`${agendaRange.from}T12:00:00`)} – ${formatDate(`${agendaRange.to}T12:00:00`)}`
                    : new Intl.DateTimeFormat("it-IT", { month: "long", year: "numeric" }).format(
                        new Date(`${day}T12:00:00`),
                      )}
              </p>
              <Button
                variant="outline"
                size="icon"
                aria-label="Periodo successivo"
                onClick={() => shiftDay(1)}
              >
                <ChevronRight />
              </Button>
            </div>

            <div className="mt-6">
              {agenda.isPending ? (
                <Skeleton className="h-40 w-full rounded-3xl" />
              ) : (agenda.data ?? []).length === 0 ? null : (
                <ul className="space-y-3">
                  {(agenda.data ?? []).map((a, idx, arr) => (
                    <li key={a.id} className="space-y-3 list-none">
                      {agendaPeriod !== "day" &&
                      (idx === 0 ||
                        a.starts_at.slice(0, 10) !== arr[idx - 1]?.starts_at.slice(0, 10)) ? (
                        <p className="font-display text-muted-foreground pt-3 text-sm font-semibold capitalize">
                          {formatDate(a.starts_at)}
                        </p>
                      ) : null}
                      <div className="surface-card flex flex-wrap items-center gap-4 p-5">
                        <span className="font-display w-20 text-lg font-semibold">
                          {formatTime(a.starts_at)}
                        </span>
                        <div className="min-w-52 flex-1">
                          <p className="font-medium">{a.profiles?.full_name}</p>
                          <p className="text-muted-foreground text-sm">
                            {a.services?.name} · {a.doctors?.full_name}
                          </p>
                          {a.patient_note && (
                            <p className="text-muted-foreground mt-1 text-xs italic">
                              “{a.patient_note}”
                            </p>
                          )}
                          {a.status === "confirmed" && (
                            <div className="mt-3 flex flex-wrap items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  setReminderTarget({ appointment: a, channel: "sms" })
                                }
                              >
                                SMS
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  setReminderTarget({ appointment: a, channel: "whatsapp" })
                                }
                              >
                                WhatsApp
                              </Button>
                              {a.reminder_sent_at && (
                                <span className="text-muted-foreground text-xs">
                                  Inviato via{" "}
                                  {a.reminder_channel === "whatsapp" ? "WhatsApp" : "SMS"} il{" "}
                                  {formatDate(a.reminder_sent_at)} alle{" "}
                                  {formatTime(a.reminder_sent_at)}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                        <Badge variant="secondary">{STATUS_LABEL[a.status]}</Badge>
                        <Select
                          value={a.status}
                          onValueChange={(value) =>
                            statusMutation.mutate({
                              data: { id: a.id, status: value as (typeof STATUSES)[number] },
                            })
                          }
                        >
                          <SelectTrigger className="w-44" aria-label="Cambia stato">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {STATUSES.map((s) => (
                              <SelectItem key={s} value={s}>
                                {STATUS_LABEL[s]}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </TabsContent>

          <TabsContent value="calendario" className="mt-6">
            <StaffCalendar />
          </TabsContent>

          <TabsContent value="pazienti" className="mt-6">
            {patients.isPending ? (
              <Skeleton className="h-40 w-full rounded-3xl" />
            ) : (
              <ul className="grid gap-3 md:grid-cols-2">
                {(patients.data ?? []).map((p) => (
                  <li key={p.id} className="surface-card p-5">
                    <p className="font-semibold">{p.full_name}</p>
                    <p className="text-muted-foreground text-sm">
                      {p.email ?? "—"} · {p.phone ?? "—"}
                    </p>
                    {p.allergies?.length ? (
                      <p className="text-destructive mt-2 text-xs">
                        Allergie: {p.allergies.join(", ")}
                      </p>
                    ) : null}
                    {p.conditions?.length ? (
                      <p className="text-muted-foreground mt-1 text-xs">
                        Condizioni: {p.conditions.join(", ")}
                      </p>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </TabsContent>

          <TabsContent value="documenti" className="mt-6 space-y-6">
            <div className="surface-card space-y-4 p-6">
              <div>
                <Label htmlFor="doc-patient">Paziente</Label>
                <Select value={docPatientId} onValueChange={setDocPatientId}>
                  <SelectTrigger id="doc-patient" className="mt-2">
                    <SelectValue placeholder="Scegli un paziente" />
                  </SelectTrigger>
                  <SelectContent>
                    {(patients.data ?? []).map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.full_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {docPatientId ? (
                <form
                  className="grid gap-4 sm:grid-cols-2"
                  onSubmit={(e) => {
                    e.preventDefault();
                    uploadDocumentMutation.mutate();
                  }}
                >
                  <div>
                    <Label htmlFor="doc-title">Titolo</Label>
                    <Input
                      id="doc-title"
                      className="mt-2"
                      placeholder="Es. Referto igiene dentale"
                      value={docTitle}
                      onChange={(e) => setDocTitle(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="doc-kind">Tipo</Label>
                    <Select
                      value={docKind}
                      onValueChange={(v) => setDocKind(v as (typeof DOCUMENT_KINDS)[number])}
                    >
                      <SelectTrigger id="doc-kind" className="mt-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {DOCUMENT_KINDS.map((k) => (
                          <SelectItem key={k} value={k}>
                            {DOCUMENT_KIND_LABEL[k]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="sm:col-span-2">
                    <Label htmlFor="doc-file">File (PDF, JPG, PNG…)</Label>
                    <Input
                      id="doc-file"
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png,.heic,.webp"
                      className="mt-2"
                      onChange={(e) => setDocFile(e.target.files?.[0] ?? null)}
                      required
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <Button type="submit" disabled={isUploading}>
                      <Upload /> {isUploading ? "Caricamento…" : "Carica documento"}
                    </Button>
                  </div>
                </form>
              ) : (
                <p className="text-muted-foreground text-sm">
                  Scegli un paziente per vedere e caricare i suoi documenti.
                </p>
              )}
            </div>

            {docPatientId ? (
              patientDocuments.isPending ? (
                <Skeleton className="h-24 w-full rounded-3xl" />
              ) : (patientDocuments.data ?? []).length === 0 ? (
                <p className="text-muted-foreground text-sm">
                  Nessun documento caricato per questo paziente.
                </p>
              ) : (
                <ul className="grid gap-3 md:grid-cols-2">
                  {(patientDocuments.data ?? []).map((d) => (
                    <li key={d.id} className="surface-card flex items-center gap-4 p-5">
                      <span className="bg-primary-soft text-primary grid h-10 w-10 place-items-center rounded-2xl">
                        <FileText className="h-4 w-4" aria-hidden="true" />
                      </span>
                      <div className="flex-1">
                        <p className="font-medium">{d.title}</p>
                        <p className="text-muted-foreground text-xs capitalize">
                          {DOCUMENT_KIND_LABEL[d.kind as (typeof DOCUMENT_KINDS)[number]] ?? d.kind}
                          {" · "}
                          {formatDate(d.created_at)}
                        </p>
                      </div>
                      {d.file_url ? (
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={`Scarica ${d.title}`}
                          asChild
                        >
                          <a href={d.file_url} target="_blank" rel="noreferrer">
                            <Download />
                          </a>
                        </Button>
                      ) : null}
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={`Elimina ${d.title}`}
                        onClick={() => {
                          if (confirm(`Eliminare il documento "${d.title}"?`))
                            deleteDocumentMutation.mutate(d.id);
                        }}
                      >
                        <Trash2 />
                      </Button>
                    </li>
                  ))}
                </ul>
              )
            ) : null}
          </TabsContent>

          <TabsContent value="listino" className="mt-6">
            <ServicesManager />
          </TabsContent>

          <TabsContent value="indisponibilita" className="mt-6">
            <BlockedSlotsManager />
          </TabsContent>

          <TabsContent value="turni" className="mt-6">
            <ShiftsManager />
          </TabsContent>

          <TabsContent value="fatturato" className="mt-6">
            <StaffRevenue />
          </TabsContent>

          <TabsContent value="messaggi" className="mt-6">
            {messages.isPending ? (
              <Skeleton className="h-40 w-full rounded-3xl" />
            ) : (messages.data ?? []).length === 0 ? (
              <p className="text-muted-foreground text-sm">Nessun messaggio ricevuto.</p>
            ) : (
              <ul className="space-y-3">
                {(messages.data ?? []).map((m) => (
                  <li key={m.id} className="surface-card p-5">
                    <div className="flex items-baseline justify-between gap-3">
                      <p className="font-semibold">{m.name}</p>
                      <span className="text-muted-foreground shrink-0 text-xs">
                        {formatDate(m.created_at)}
                      </span>
                    </div>
                    <div className="mt-1 flex flex-col gap-0.5 text-sm sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-4">
                      <span className="text-muted-foreground break-all">{m.email}</span>
                      {m.phone ? (
                        <a
                          href={`tel:${m.phone}`}
                          className="text-primary font-medium hover:underline"
                        >
                          {m.phone}
                        </a>
                      ) : null}
                    </div>
                    <p className="mt-2 text-sm leading-relaxed">{m.message}</p>
                  </li>
                ))}
              </ul>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={!!reminderTarget} onOpenChange={(o) => !o && setReminderTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Promemoria via {reminderTarget?.channel === "whatsapp" ? "WhatsApp" : "SMS"}
            </DialogTitle>
            <DialogDescription>
              {reminderTarget?.appointment.profiles?.phone
                ? `Numero: ${reminderTarget.appointment.profiles.phone}`
                : "Numero di telefono non presente in anagrafica."}
            </DialogDescription>
          </DialogHeader>
          {reminderTarget && (
            <div className="bg-muted/50 rounded-2xl p-4 text-sm whitespace-pre-wrap">
              {composeReminderMessage(reminderTarget.appointment)}
            </div>
          )}
          <p className="text-muted-foreground text-xs">
            Invio dimostrativo: nessun SMS o messaggio WhatsApp viene realmente inviato, il
            messaggio viene solo registrato come inviato con data e ora.
          </p>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setReminderTarget(null)}>
              Annulla
            </Button>
            <Button
              disabled={reminderMutation.isPending}
              onClick={() =>
                reminderTarget &&
                reminderMutation.mutate({
                  id: reminderTarget.appointment.id,
                  channel: reminderTarget.channel,
                })
              }
            >
              {reminderMutation.isPending ? "Registrazione…" : "Segna come inviato"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SiteLayout>
  );
}
