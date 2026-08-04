import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { computeSlots } from "./slots";

export const getAvailability = createServerFn({ method: "GET" })
  .inputValidator((d: unknown) =>
    z
      .object({
        doctorId: z.string().uuid(),
        day: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        durationMin: z.number().int().min(15).max(240),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const { publicClient } = await import("./supabase-public.server");
    const { data: busy, error } = await publicClient().rpc("get_busy_slots", {
      _doctor_id: data.doctorId,
      _from: `${data.day}T00:00:00Z`,
      _to: `${data.day}T23:59:59Z`,
    });
    if (error) throw new Error(error.message);
    return computeSlots(data.day, data.durationMin, busy ?? []);
  });

export const bookAppointment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        doctorId: z.string().uuid(),
        serviceId: z.string().uuid(),
        startsAt: z.string().min(10),
        note: z.string().trim().max(600).optional().or(z.literal("")),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const { data: profile, error: pErr } = await supabase
      .from("profiles")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();
    if (pErr) throw new Error(pErr.message);
    if (!profile) throw new Error("Profilo paziente non trovato.");

    const { data: service, error: sErr } = await supabase
      .from("services")
      .select("duration_min")
      .eq("id", data.serviceId)
      .maybeSingle();
    if (sErr) throw new Error(sErr.message);
    if (!service) throw new Error("Trattamento non disponibile.");

    const starts = new Date(data.startsAt);
    const ends = new Date(starts.getTime() + service.duration_min * 60000);

    const { data: clash, error: cErr } = await supabase.rpc("get_busy_slots", {
      _doctor_id: data.doctorId,
      _from: starts.toISOString(),
      _to: ends.toISOString(),
    });
    if (cErr) throw new Error(cErr.message);
    const overlapping = (clash ?? []).some(
      (b) => new Date(b.starts_at) < ends && new Date(b.ends_at) > starts,
    );
    if (overlapping) throw new Error("Questo orario è appena stato occupato. Scegline un altro.");

    const { data: created, error } = await supabase
      .from("appointments")
      .insert({
        patient_id: profile.id,
        doctor_id: data.doctorId,
        service_id: data.serviceId,
        starts_at: starts.toISOString(),
        ends_at: ends.toISOString(),
        patient_note: data.note || null,
      })
      .select("id, starts_at")
      .single();
    if (error) throw new Error(error.message);
    return created;
  });

export const listMyAppointments = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("appointments")
      .select(
        "id, starts_at, ends_at, status, patient_note, services(name, slug, price_cents), doctors(full_name, specialization)",
      )
      .order("starts_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const cancelAppointment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("appointments")
      .update({ status: "cancelled" })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

export const listMyDocuments = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("documents")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const updateMyProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        full_name: z.string().trim().min(2).max(120),
        phone: z.string().trim().max(40).optional().or(z.literal("")),
        birth_date: z.string().optional().or(z.literal("")),
        allergies: z.array(z.string().max(60)).max(20),
        conditions: z.array(z.string().max(60)).max(20),
        marketing_consent: z.boolean(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("profiles")
      .update({
        full_name: data.full_name,
        phone: data.phone || null,
        birth_date: data.birth_date || null,
        allergies: data.allergies,
        conditions: data.conditions,
        marketing_consent: data.marketing_consent,
        onboarded: true,
      })
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });