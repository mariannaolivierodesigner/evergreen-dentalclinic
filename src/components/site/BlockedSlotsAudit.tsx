import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { History } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { listBlockedSlotsAudit, listStaffDoctors } from "@/lib/staff.functions";
import { formatDateTime } from "@/lib/format";

const ACTION_LABEL: Record<string, string> = {
  created: "Creato",
  updated: "Modificato",
  deleted: "Eliminato",
};

const ACTION_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  created: "default",
  updated: "secondary",
  deleted: "destructive",
};

const PAGE_SIZE = 10;

export function BlockedSlotsAudit() {
  const fetchAudit = useServerFn(listBlockedSlotsAudit);
  const fetchDoctors = useServerFn(listStaffDoctors);

  const [action, setAction] = useState<"all" | "created" | "updated" | "deleted">("all");
  const [doctorId, setDoctorId] = useState<string>("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [page, setPage] = useState(1);

  const doctors = useQuery({ queryKey: ["staff-doctors"], queryFn: () => fetchDoctors() });

  const audit = useQuery({
    queryKey: ["blocked-audit", action, doctorId, from, to, page],
    queryFn: () =>
      fetchAudit({
        data: {
          action,
          ...(doctorId !== "all" ? { doctor_id: doctorId } : {}),
          ...(from ? { from: new Date(`${from}T00:00:00`).toISOString() } : {}),
          ...(to ? { to: new Date(`${to}T23:59:59`).toISOString() } : {}),
          page,
          page_size: PAGE_SIZE,
        },
      }),
  });

  const resetPage = <T,>(setter: (v: T) => void) => (v: T) => {
    setter(v);
    setPage(1);
  };

  if (audit.isPending) return <Skeleton className="h-64 w-full rounded-3xl" />;
  if (audit.data && !audit.data.allowed)
    return (
      <p className="text-muted-foreground text-sm">
        Il registro delle modifiche è visibile solo agli amministratori.
      </p>
    );

  const rows = audit.data?.rows ?? [];
  const total = audit.data?.total ?? 0;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <section className="space-y-5">
      <div>
        <h2 className="flex items-center gap-2 text-lg font-semibold">
          <History className="size-4" aria-hidden="true" /> Registro modifiche
        </h2>
        <p className="text-muted-foreground mt-1 text-sm">
          Chi ha creato, modificato o eliminato ferie e permessi, e quando.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="grid gap-2">
          <Label>Azione</Label>
          <Select value={action} onValueChange={resetPage((v) => setAction(v as typeof action))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tutte</SelectItem>
              <SelectItem value="created">Creazioni</SelectItem>
              <SelectItem value="updated">Modifiche</SelectItem>
              <SelectItem value="deleted">Eliminazioni</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-2">
          <Label>Medico</Label>
          <Select value={doctorId} onValueChange={resetPage(setDoctorId)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tutti</SelectItem>
              {(doctors.data ?? []).map((d) => (
                <SelectItem key={d.id} value={d.id}>
                  {d.full_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="audit-from">Dal</Label>
          <Input
            id="audit-from"
            type="date"
            value={from}
            onChange={(e) => resetPage(setFrom)(e.target.value)}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="audit-to">Al</Label>
          <Input
            id="audit-to"
            type="date"
            value={to}
            onChange={(e) => resetPage(setTo)(e.target.value)}
          />
        </div>
      </div>

      {rows.length === 0 ? (
        <p className="text-muted-foreground text-sm">Nessuna modifica per i filtri scelti.</p>
      ) : (
        <div className="surface-card overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <caption className="sr-only">Registro modifiche di ferie e permessi</caption>
            <thead className="text-muted-foreground border-border border-b text-left text-xs uppercase">
              <tr>
                <th scope="col" className="p-4">Quando</th>
                <th scope="col" className="p-4">Azione</th>
                <th scope="col" className="p-4">Autore</th>
                <th scope="col" className="p-4">Medico</th>
                <th scope="col" className="p-4">Periodo</th>
                <th scope="col" className="p-4">Motivo</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r: any) => {
                const starts = r.new_starts_at ?? r.old_starts_at;
                const ends = r.new_ends_at ?? r.old_ends_at;
                return (
                  <tr key={r.id} className="border-border/60 border-b last:border-0">
                    <td className="p-4 whitespace-nowrap">{formatDateTime(r.created_at)}</td>
                    <td className="p-4">
                      <Badge variant={ACTION_VARIANT[r.action] ?? "secondary"}>
                        {ACTION_LABEL[r.action] ?? r.action}
                      </Badge>
                    </td>
                    <td className="p-4">{r.actor_name}</td>
                    <td className="p-4">{r.doctor_name}</td>
                    <td className="p-4 whitespace-nowrap">
                      {starts ? `${formatDateTime(starts)} → ${formatDateTime(ends)}` : "—"}
                    </td>
                    <td className="p-4">{r.new_reason ?? r.old_reason ?? "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <p className="text-muted-foreground text-sm">
          {total} modifiche · pagina {page} di {pages}
        </p>
        <div className="flex-1" />
        <Button
          variant="outline"
          size="sm"
          disabled={page <= 1 || audit.isFetching}
          onClick={() => setPage((p) => Math.max(1, p - 1))}
        >
          Precedente
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={page >= pages || audit.isFetching}
          onClick={() => setPage((p) => Math.min(pages, p + 1))}
        >
          Successiva
        </Button>
      </div>
    </section>
  );
}
