import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { computeSlots, weekdayOf } from "./slots";

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
    const client = publicClient();

    const [{ data: ranges, error: rErr }, { data: busy, error }] = await Promise.all([
      client
        .from("doctor_availability")
        .select("start_time, end_time")
        .eq("doctor_id", data.doctorId)
        .eq("weekday", weekdayOf(data.day))
        .order("start_time"),
      client.rpc("get_busy_slots", {
        _doctor_id: data.doctorId,
        // margine di un giorno per intercettare gli impegni a cavallo della mezzanotte
        _from: `${data.day}T00:00:00Z`,
        _to: `${data.day}T23:59:59Z`,
      }),
    ]);
    if (rErr) throw new Error(rErr.message);
    if (error) throw new Error(error.message);

    return {
      closed: (ranges ?? []).length === 0,
      slots: computeSlots(data.day, data.durationMin, ranges ?? [], busy ?? []),
    };
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
        "id, starts_at, ends_at, status, patient_note, doctor_id, service_id, services(name, slug, price_cents, duration_min), doctors(full_name, specialization)",
      )
      .order("starts_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const cancelAppointment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: appt, error: aErr } = await context.supabase
      .from("appointments")
      .select("id, starts_at, status")
      .eq("id", data.id)
      .maybeSingle();
    if (aErr) throw new Error(aErr.message);
    if (!appt) throw new Error("Appuntamento non trovato.");
    if (appt.status === "cancelled") throw new Error("Appuntamento già annullato.");
    if (new Date(appt.starts_at).getTime() - Date.now() <= 24 * 60 * 60 * 1000)
      throw new Error("Puoi annullare fino a 24 ore prima. Chiamaci per assistenza.");

    const { error } = await context.supabase
      .from("appointments")
      .update({ status: "cancelled" })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

export const rescheduleAppointment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        startsAt: z.string().min(10),
        note: z.string().trim().max(600).optional().or(z.literal("")),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase } = context;

    const { data: appt, error: aErr } = await supabase
      .from("appointments")
      .select("id, doctor_id, starts_at, status, services(duration_min)")
      .eq("id", data.id)
      .maybeSingle();
    if (aErr) throw new Error(aErr.message);
    if (!appt) throw new Error("Appuntamento non trovato.");
    if (appt.status === "cancelled" || appt.status === "completed")
      throw new Error("Questo appuntamento non è più modificabile.");
    if (new Date(appt.starts_at).getTime() - Date.now() <= 24 * 60 * 60 * 1000)
      throw new Error("Puoi riprogrammare fino a 24 ore prima. Chiamaci per assistenza.");

    const duration = appt.services?.duration_min ?? 30;
    const starts = new Date(data.startsAt);
    if (Number.isNaN(starts.getTime())) throw new Error("Orario non valido.");
    if (starts.getTime() <= Date.now()) throw new Error("Scegli un orario futuro.");
    const ends = new Date(starts.getTime() + duration * 60000);

    const { data: clash, error: cErr } = await supabase.rpc("get_busy_slots", {
      _doctor_id: appt.doctor_id,
      _from: starts.toISOString(),
      _to: ends.toISOString(),
    });
    if (cErr) throw new Error(cErr.message);
    const overlapping = (clash ?? []).some(
      (b) =>
        new Date(b.starts_at) < ends &&
        new Date(b.ends_at) > starts &&
        new Date(b.starts_at).toISOString() !== new Date(appt.starts_at).toISOString(),
    );
    if (overlapping) throw new Error("Questo orario è appena stato occupato. Scegline un altro.");

    const { error } = await supabase
      .from("appointments")
      .update({
        starts_at: starts.toISOString(),
        ends_at: ends.toISOString(),
        status: "pending",
        ...(data.note ? { patient_note: data.note } : {}),
      })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true as const, starts_at: starts.toISOString() };
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