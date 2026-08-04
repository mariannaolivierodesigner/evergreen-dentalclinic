import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const listServices = createServerFn({ method: "GET" }).handler(async () => {
  const { publicClient } = await import("./supabase-public.server");
  const { data, error } = await publicClient()
    .from("services")
    .select("*")
    .eq("published", true)
    .order("sort_order");
  if (error) throw new Error(error.message);
  return data ?? [];
});

export const getService = createServerFn({ method: "GET" })
  .inputValidator((d: unknown) => z.object({ slug: z.string() }).parse(d))
  .handler(async ({ data: input }) => {
    const { publicClient } = await import("./supabase-public.server");
    const { data, error } = await publicClient()
      .from("services")
      .select("*")
      .eq("slug", input.slug)
      .eq("published", true)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data;
  });

export const listDoctors = createServerFn({ method: "GET" }).handler(async () => {
  const { publicClient } = await import("./supabase-public.server");
  const { data, error } = await publicClient()
    .from("doctors")
    .select("id, full_name, specialization, bio, color, active")
    .eq("active", true)
    .order("created_at");
  if (error) throw new Error(error.message);
  return data ?? [];
});

export const listTestimonials = createServerFn({ method: "GET" }).handler(async () => {
  const { publicClient } = await import("./supabase-public.server");
  const { data, error } = await publicClient()
    .from("testimonials")
    .select("id, author, role, rating, quote")
    .eq("published", true);
  if (error) throw new Error(error.message);
  return data ?? [];
});

export const listPosts = createServerFn({ method: "GET" }).handler(async () => {
  const { publicClient } = await import("./supabase-public.server");
  const { data, error } = await publicClient()
    .from("posts")
    .select("slug, title, excerpt, category, read_minutes, published_at")
    .eq("published", true)
    .order("published_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
});

export const getPost = createServerFn({ method: "GET" })
  .inputValidator((d: unknown) => z.object({ slug: z.string() }).parse(d))
  .handler(async ({ data: input }) => {
    const { publicClient } = await import("./supabase-public.server");
    const { data, error } = await publicClient()
      .from("posts")
      .select("*")
      .eq("slug", input.slug)
      .eq("published", true)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data;
  });

const contactSchema = z.object({
  name: z.string().trim().min(2, "Inserisci il tuo nome").max(100),
  email: z.string().trim().email("Email non valida").max(255),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  message: z.string().trim().min(10, "Scrivi almeno una riga").max(1500),
  privacy_consent: z.literal(true),
});

export const sendContactMessage = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => contactSchema.parse(d))
  .handler(async ({ data: input }) => {
    const { publicClient } = await import("./supabase-public.server");
    const { error } = await publicClient()
      .from("contact_messages")
      .insert({
        name: input.name,
        email: input.email,
        phone: input.phone || null,
        message: input.message,
        privacy_consent: true,
      });
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });