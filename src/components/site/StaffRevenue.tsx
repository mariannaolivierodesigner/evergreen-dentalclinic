import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { formatPrice, isoDay } from "@/lib/format";
import { listAgenda } from "@/lib/staff.functions";

type Period = "day" | "week" | "month" | "custom";

const PERIODS: { id: Period; label: string }[] = [
  { id: "day", label: "Giorno" },
  { id: "week", label: "Settimana" },
  { id: "month", label: "Mese" },
  { id: "custom", label: "Periodo" },
];

function addDays(day: string, n: number) {
  const d = new Date(`${day}T12:00:00`);
  d.setDate(d.getDate() + n);
  return isoDay(d);
}

function rangeFor(period: Period, ref: string): { from: string; to: string } {
  const d = new Date(`${ref}T12:00:00`);
  if (period === "day") return { from: ref, to: ref };
  if (period === "week") {
    const dow = (d.getDay() + 6) % 7; // lunedì = 0
    const from = addDays(ref, -dow);
    return { from, to: addDays(from, 6) };
  }
  const first = new Date(d.getFullYear(), d.getMonth(), 1);
  const last = new Date(d.getFullYear(), d.getMonth() + 1, 0);
  return { from: isoDay(first), to: isoDay(last) };
}

export function StaffRevenue() {
  const fetchAgenda = useServerFn(listAgenda);
  const today = isoDay(new Date());
  const [period, setPeriod] = useState<Period>("month");
  const [customFrom, setCustomFrom] = useState(addDays(today, -29));
  const [customTo, setCustomTo] = useState(today);

  const { from, to } =
    period === "custom" ? { from: customFrom, to: customTo } : rangeFor(period, today);

  const agenda = useQuery({
    queryKey: ["revenue", from, to],
    queryFn: () => fetchAgenda({ data: { from: `${from}T00:00:00Z`, to: `${to}T23:59:59Z` } }),
  });

  const stats = useMemo(() => {
    const rows = (agenda.data ?? []).filter((a) => a.status !== "cancelled");
    const byService = new Map<string, { count: number; cents: number }>();
    let total = 0;
    for (const a of rows) {
      const cents = a.services?.price_cents ?? 0;
      total += cents;
      const name = a.services?.name ?? "Altro";
      const cur = byService.get(name) ?? { count: 0, cents: 0 };
      byService.set(name, { count: cur.count + 1, cents: cur.cents + cents });
    }
    const list = [...byService.entries()].sort((x, y) => y[1].cents - x[1].cents);
    return { total, count: rows.length, list };
  }, [agenda.data]);

  return (
    <div>
      <div className="flex flex-wrap items-end gap-4">
        <div className="bg-muted flex w-full gap-1 rounded-2xl p-1.5 sm:inline-flex sm:w-auto">
          {PERIODS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setPeriod(p.id)}
              className={cn(
                "flex-1 cursor-pointer rounded-xl px-2 py-2.5 sm:px-4 text-[0.95rem] font-medium transition-all sm:flex-none",
                period === p.id
                  ? "bg-background text-foreground font-semibold shadow"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {p.label}
            </button>
          ))}
        </div>
        {period === "custom" ? (
          <div className="flex flex-wrap items-end gap-3">
            <div className="grid gap-2">
              <Label htmlFor="rev-from">Dal</Label>
              <Input
                id="rev-from"
                type="date"
                value={customFrom}
                onChange={(e) => {
                  setCustomFrom(e.target.value);
                  if (customTo < e.target.value) setCustomTo(e.target.value);
                }}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="rev-to">Al</Label>
              <Input
                id="rev-to"
                type="date"
                min={customFrom}
                value={customTo}
                onChange={(e) => setCustomTo(e.target.value)}
              />
            </div>
          </div>
        ) : null}
      </div>

      <div className="surface-card mt-6 p-6 md:p-8">
        <p className="text-muted-foreground text-sm">Fatturato indicativo</p>
        <p className="font-display mt-1 text-5xl font-semibold tracking-tight">
          {formatPrice(stats.total)}
        </p>
        <p className="text-muted-foreground mt-2 text-sm">
          {stats.count} {stats.count === 1 ? "visita" : "visite"}, escluse le annullate
        </p>
      </div>

      {stats.list.length > 0 ? (
        <ul className="mt-4 grid gap-3">
          {stats.list.map(([name, v]) => (
            <li key={name} className="surface-card flex items-center justify-between gap-4 p-5">
              <div>
                <p className="font-semibold">{name}</p>
                <p className="text-muted-foreground text-sm">
                  {v.count} {v.count === 1 ? "visita" : "visite"}
                </p>
              </div>
              <p className="font-medium">{formatPrice(v.cents)}</p>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
