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
    .select("id, starts_at, ends_at, profiles(full_name)")
    .eq("doctor_id", input.doctor_id)
    .in("status", ["pending", "confirmed"])
    .lt("starts_at", input.ends_at)
    .gt("ends_at", input.starts_at)
    .order("starts_at");
  if (error) throw new Error(error.message);
  return (data ?? []) as Array<{
    id: string;
    starts_at: string;
    ends_at: string;
    profiles: { full_name: string } | null;
  }>;
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

    if (!data.force) {
      const conflicts = await findConflicts(context, payload);
      if (conflicts.length > 0) {
        return { ok: false as const, conflicts };
      }
    }

    const query = data.id
      ? context.supabase.from("blocked_slots").update(payload).eq("id", data.id)
      : context.supabase.from("blocked_slots").insert(payload);
    const { error } = await query;
    if (error) throw new Error(error.message);
    return { ok: true as const, conflicts: [] };
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