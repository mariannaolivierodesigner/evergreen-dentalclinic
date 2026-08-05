import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ShieldCheck, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { PageHeader, SiteLayout } from "@/components/site/SiteLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { listRoleAudit, listRoleMembers, setUserRole } from "@/lib/roles.functions";
import { useRoles, useSession } from "@/hooks/useAuth";
import { formatDate, formatTime } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/staff-ruoli")({
  head: () => ({
    meta: [
      { title: "Gestione ruoli staff — Studio Evergreen" },
      {
        name: "description",
        content:
          "Assegna e revoca i ruoli del personale dello studio con registro completo delle modifiche.",
      },
      { property: "og:title", content: "Gestione ruoli staff — Studio Evergreen" },
      { property: "og:description", content: "Permessi del personale e audit delle modifiche." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
    links: [{ rel: "canonical", href: "/staff-ruoli" }],
  }),
  component: RolesPage,
});

const MANAGED = [
  { role: "admin", label: "Amministratore" },
  { role: "doctor", label: "Medico" },
  { role: "receptionist", label: "Reception" },
  { role: "patient", label: "Paziente" },
] as const;

function RolesPage() {
  const { user } = useSession();
  const { isAdmin, isPending } = useRoles(user?.id);
  const queryClient = useQueryClient();

  const fetchMembers = useServerFn(listRoleMembers);
  const fetchAudit = useServerFn(listRoleAudit);
  const mutateRole = useServerFn(setUserRole);

  const members = useQuery({
    queryKey: ["role-members"],
    enabled: isAdmin,
    queryFn: () => fetchMembers(),
  });
  const audit = useQuery({
    queryKey: ["role-audit"],
    enabled: isAdmin,
    queryFn: () => fetchAudit(),
  });

  const roleMutation = useMutation({
    mutationFn: mutateRole,
    onSuccess: () => {
      toast.success("Permessi aggiornati.");
      queryClient.invalidateQueries({ queryKey: ["role-members"] });
      queryClient.invalidateQueries({ queryKey: ["role-audit"] });
      queryClient.invalidateQueries({ queryKey: ["roles"] });
    },
    onError: (e: Error) => toast.error(e.message || "Modifica non riuscita."),
  });

  if (isPending) {
    return (
      <SiteLayout>
        <div className="mx-auto max-w-5xl space-y-4 px-5 py-20">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-40 w-full" />
        </div>
      </SiteLayout>
    );
  }

  if (!isAdmin) {
    return (
      <SiteLayout>
        <PageHeader
          eyebrow="Accesso negato"
          title="Area riservata agli amministratori"
          description="Il tuo account non dispone dei permessi necessari per gestire i ruoli dello staff."
        />
        <div className="mx-auto max-w-5xl px-5 pb-20">
          <Button asChild variant="outline">
            <Link to="/staff">
              <ArrowLeft /> Torna al gestionale
            </Link>
          </Button>
        </div>
      </SiteLayout>
    );
  }

  return (
    <SiteLayout>
      <PageHeader
        eyebrow="Gestionale"
        title="Ruoli e permessi"
        description="Assegna o revoca i ruoli del personale. Ogni modifica viene registrata nel log di audit."
      />

      <div className="mx-auto max-w-5xl px-5 py-12">
        <Button asChild variant="ghost" className="mb-6">
          <Link to="/staff">
            <ArrowLeft /> Torna all'agenda
          </Link>
        </Button>

        <Tabs defaultValue="permessi">
          <TabsList>
            <TabsTrigger value="permessi">Permessi</TabsTrigger>
            <TabsTrigger value="audit">Registro modifiche</TabsTrigger>
          </TabsList>

          <TabsContent value="permessi" className="mt-6 space-y-4">
            {members.isPending ? (
              <Skeleton className="h-48 w-full" />
            ) : members.isError ? (
              <p className="text-destructive text-sm">
                Impossibile caricare gli utenti. Riprova più tardi.
              </p>
            ) : members.data?.length === 0 ? (
              <p className="text-muted-foreground text-sm">Nessun utente registrato.</p>
            ) : (
              members.data?.map((m) => (
                <article key={m.userId} className="bg-card rounded-2xl border p-5 shadow-sm">
                  <header className="flex flex-wrap items-center gap-3">
                    <ShieldCheck className="text-primary size-5" aria-hidden />
                    <div className="flex-1">
                      <h2 className="font-display text-lg font-semibold">{m.fullName}</h2>
                      <p className="text-muted-foreground text-sm">{m.email}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {m.roles.length === 0 ? (
                        <Badge variant="outline">Nessun ruolo</Badge>
                      ) : (
                        m.roles.map((r) => (
                          <Badge key={r} variant="secondary">
                            {MANAGED.find((x) => x.role === r)?.label ?? r}
                          </Badge>
                        ))
                      )}
                    </div>
                  </header>

                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    {MANAGED.map(({ role, label }) => {
                      const active = m.roles.includes(role);
                      const selfAdminLock = role === "admin" && m.userId === user?.id && active;
                      return (
                        <label
                          key={role}
                          className="bg-muted/40 flex items-center justify-between gap-3 rounded-xl px-4 py-3"
                        >
                          <span className="text-sm font-medium">{label}</span>
                          <Switch
                            checked={active}
                            disabled={selfAdminLock || roleMutation.isPending}
                            aria-label={`${active ? "Revoca" : "Assegna"} ruolo ${label} a ${m.fullName}`}
                            onCheckedChange={(next) =>
                              roleMutation.mutate({
                                data: { userId: m.userId, role, grant: next },
                              })
                            }
                          />
                        </label>
                      );
                    })}
                  </div>
                  {m.userId === user?.id && m.roles.includes("admin") ? (
                    <p className="text-muted-foreground mt-3 text-xs">
                      Non puoi revocare il tuo ruolo di amministratore.
                    </p>
                  ) : null}
                </article>
              ))
            )}
          </TabsContent>

          <TabsContent value="audit" className="mt-6">
            {audit.isPending ? (
              <Skeleton className="h-48 w-full" />
            ) : audit.isError ? (
              <p className="text-destructive text-sm">Impossibile caricare il registro.</p>
            ) : audit.data?.length === 0 ? (
              <p className="text-muted-foreground text-sm">Nessuna modifica registrata.</p>
            ) : (
              <ul className="space-y-3">
                {audit.data?.map((a) => (
                  <li key={a.id} className="bg-card rounded-xl border p-4 text-sm shadow-sm">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant={a.action === "granted" ? "default" : "outline"}>
                        {a.action === "granted" ? "Assegnato" : "Revocato"}
                      </Badge>
                      <span className="font-medium">
                        {MANAGED.find((x) => x.role === a.role)?.label ?? a.role}
                      </span>
                      <span className="text-muted-foreground">a {a.targetName}</span>
                    </div>
                    <p className="text-muted-foreground mt-1 text-xs">
                      da {a.actorName} · {formatDate(a.createdAt)} alle {formatTime(a.createdAt)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </SiteLayout>
  );
}
