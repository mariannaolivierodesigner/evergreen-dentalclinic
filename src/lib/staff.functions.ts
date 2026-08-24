import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function assertStaff(context: { supabase: any; userId: string }) {
  const { data, error } = await context.supabase.rpc("is_staff", { _user_id: context.userId });
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Accesso riservato allo staff.");
}

export const listAgenda = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ from: z.string(), to: z.string() }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertStaff(context);
    const { data: rows, error } = await context.supabase
      .from("appointments")
      .select(
        "id, starts_at, ends_at, status, patient_note, staff_note, services(name, price_cents), doctors(id, full_name, color), profiles(full_name, phone, email)",
      )
      .gte("starts_at", data.from)
      .lte("starts_at", data.to)
      .order("starts_at");
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const setAppointmentStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        status: z.enum(["pending", "confirmed", "completed", "cancelled", "no_show"]),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertStaff(context);
    const { error } = await context.supabase
      .from("appointments")
      .update({ status: data.status })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

export const listPatients = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertStaff(context);
    const { data, error } = await context.supabase
      .from("profiles")
      .select("id, full_name, email, phone, birth_date, allergies, conditions, created_at")
      .order("full_name");
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const listMessages = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertStaff(context);
    const { data, error } = await context.supabase
      .from("contact_messages")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

/** ---- Ferie / permessi (indisponibilità) ---- */

const blockedInput = z
  .object({
    doctor_id: z.string().uuid(),
    starts_at: z.string().min(1),
    ends_at: z.string().min(1),
    reason: z.string().trim().min(3).max(200),
  })
  .refine((v) => new Date(v.ends_at).getTime() > new Date(v.starts_at).getTime(), {
    message: "La data di fine deve essere successiva a quella di inizio.",
    path: ["ends_at"],
  });

export const listBlockedSlots = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertStaff(context);
    const { data, error } = await context.supabase
      .from("blocked_slots")
      .select("id, doctor_id, starts_at, ends_at, reason, doctors(full_name, color)")
      .gte("ends_at", new Date(Date.now() - 30 * 24 * 3600_000).toISOString())
      .order("starts_at");
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const listStaffDoctors = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertStaff(context);
    const { data, error } = await context.supabase
      .from("doctors")
      .select("id, full_name, specialization, active")
      .eq("active", true)
      .order("full_name");
    if (error) throw new Error(error.message);
    return data ?? [];
  });

/** Appuntamenti attivi che si sovrappongono al periodo indicato. */
async function findConflicts(
  context: { supabase: any },
  input: { doctor_id: string; starts_at: string; ends_at: string },
) {
  const { data, error } = await context.supabase
    .from("appointments")
    .select("id, patient_id, starts_at, ends_at, profiles(full_name)")
    .eq("doctor_id", input.doctor_id)
    .in("status", ["pending", "confirmed"])
    .lt("starts_at", input.ends_at)
    .gt("ends_at", input.starts_at)
    .order("starts_at");
  if (error) throw new Error(error.message);
  return (data ?? []) as Array<{
    id: string;
    patient_id: string;
    starts_at: string;
    ends_at: string;
    profiles: { full_name: string } | null;
  }>;
}

function dateLabel(iso: string) {
  return new Intl.DateTimeFormat("it-IT", {
    timeZone: "Europe/Rome",
    day: "2-digit",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

export const checkBlockedConflicts = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        doctor_id: z.string().uuid(),
        starts_at: z.string(),
        ends_at: z.string(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertStaff(context);
    return findConflicts(context, data);
  });

export const saveBlockedSlot = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({ id: z.string().uuid().optional(), force: z.boolean().optional() })
      .and(blockedInput)
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertStaff(context);
    const payload = {
      doctor_id: data.doctor_id,
      starts_at: data.starts_at,
      ends_at: data.ends_at,
      reason: data.reason,
    };

    const conflicts = await findConflicts(context, payload);
    if (!data.force && conflicts.length > 0) {
      return { ok: false as const, conflicts, notified: 0 };
    }

    const query = data.id
      ? context.supabase.from("blocked_slots").update(payload).eq("id", data.id)
      : context.supabase.from("blocked_slots").insert(payload);
    const { error } = await query;
    if (error) throw new Error(error.message);

    // Avvisa i pazienti i cui appuntamenti ricadono nel periodo di indisponibilità.
    let notified = 0;
    if (conflicts.length > 0) {
      const rows = conflicts.map((c) => ({
        patient_id: c.patient_id,
        appointment_id: c.id,
        type: "conflict",
        title: "Il tuo appuntamento va riprogrammato",
        body: `L'appuntamento del ${dateLabel(c.starts_at)} ricade in un periodo di indisponibilità del medico (${data.reason}). Ti invitiamo a spostarlo dall'area personale o a contattare lo studio.`,
      }));
      const { error: nErr } = await context.supabase.from("notifications").insert(rows);
      if (!nErr) notified = rows.length;
    }

    return { ok: true as const, conflicts: [], notified };
  });


/** Appuntamenti + indisponibilità di un intervallo, per la vista calendario. */
export const listCalendar = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        from: z.string().min(1),
        to: z.string().min(1),
        doctor_id: z.string().uuid().optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertStaff(context);

    let apptQuery = context.supabase
      .from("appointments")
      .select(
        "id, starts_at, ends_at, status, doctor_id, services(name), doctors(full_name, color), profiles(full_name)",
      )
      .lt("starts_at", data.to)
      .gt("ends_at", data.from)
      .order("starts_at");
    if (data.doctor_id) apptQuery = apptQuery.eq("doctor_id", data.doctor_id);

    let blockedQuery = context.supabase
      .from("blocked_slots")
      .select("id, doctor_id, starts_at, ends_at, reason, doctors(full_name, color)")
      .lt("starts_at", data.to)
      .gt("ends_at", data.from)
      .order("starts_at");
    if (data.doctor_id) blockedQuery = blockedQuery.eq("doctor_id", data.doctor_id);

    const [appts, blocked] = await Promise.all([apptQuery, blockedQuery]);
    if (appts.error) throw new Error(appts.error.message);
    if (blocked.error) throw new Error(blocked.error.message);

    return {
      appointments: (appts.data ?? []) as Array<{
        id: string;
        starts_at: string;
        ends_at: string;
        status: string;
        doctor_id: string;
        services: { name: string } | null;
        doctors: { full_name: string; color: string } | null;
        profiles: { full_name: string } | null;
      }>,
      blocked: (blocked.data ?? []) as Array<{
        id: string;
        doctor_id: string;
        starts_at: string;
        ends_at: string;
        reason: string;
        doctors: { full_name: string; color: string } | null;
      }>,
    };
  });

export const deleteBlockedSlot = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertStaff(context);
    const { error } = await context.supabase.from("blocked_slots").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });
/** Registro modifiche ferie/permessi (solo admin). */
export const listBlockedSlotsAudit = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertStaff(context);
    const { data: isAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!isAdmin) return { allowed: false as const, rows: [] };

    const { data, error } = await context.supabase
      .from("blocked_slots_audit_log")
      .select(
        "id, action, created_at, actor_user_id, doctor_id, old_starts_at, old_ends_at, old_reason, new_starts_at, new_ends_at, new_reason",
      )
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) throw new Error(error.message);

    const rows = data ?? [];
    const actorIds = [...new Set(rows.map((r: any) => r.actor_user_id).filter(Boolean))];
    const doctorIds = [...new Set(rows.map((r: any) => r.doctor_id).filter(Boolean))];

    const [actors, docs] = await Promise.all([
      actorIds.length
        ? context.supabase.from("profiles").select("user_id, full_name").in("user_id", actorIds)
        : Promise.resolve({ data: [] }),
      doctorIds.length
        ? context.supabase.from("doctors").select("id, full_name").in("id", doctorIds)
        : Promise.resolve({ data: [] }),
    ]);

    const actorMap = new Map((actors.data ?? []).map((p: any) => [p.user_id, p.full_name]));
    const doctorMap = new Map((docs.data ?? []).map((d: any) => [d.id, d.full_name]));

    return {
      allowed: true as const,
      rows: rows.map((r: any) => ({
        ...r,
        actor_name: (actorMap.get(r.actor_user_id) as string | undefined) ?? "Sistema",
        doctor_name: (doctorMap.get(r.doctor_id) as string | undefined) ?? "—",
      })),
    };
  });
