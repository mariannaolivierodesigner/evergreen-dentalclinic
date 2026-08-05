import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const ROLES = ["admin", "doctor", "receptionist", "patient"] as const;

async function assertAdmin(context: { supabase: any; userId: string }) {
  const { data, error } = await context.supabase.rpc("has_role", {
    _user_id: context.userId,
    _role: "admin",
  });
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Solo gli amministratori possono gestire i ruoli.");
}

export const listRoleMembers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const [{ data: profiles, error: pErr }, { data: roles, error: rErr }] = await Promise.all([
      context.supabase
        .from("profiles")
        .select("user_id, full_name, email")
        .not("user_id", "is", null)
        .order("full_name"),
      context.supabase.from("user_roles").select("user_id, role"),
    ]);
    if (pErr) throw new Error(pErr.message);
    if (rErr) throw new Error(rErr.message);

    return (profiles ?? []).map((p: any) => ({
      userId: p.user_id as string,
      fullName: p.full_name as string,
      email: (p.email as string | null) ?? "",
      roles: (roles ?? [])
        .filter((r: any) => r.user_id === p.user_id)
        .map((r: any) => r.role as string),
    }));
  });

export const listRoleAudit = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { data: rows, error } = await context.supabase
      .from("role_audit_log")
      .select("id, actor_user_id, target_user_id, role, action, created_at")
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) throw new Error(error.message);

    const ids = Array.from(
      new Set(
        (rows ?? []).flatMap((r: any) => [r.actor_user_id, r.target_user_id]).filter(Boolean),
      ),
    );
    const { data: profiles } = ids.length
      ? await context.supabase.from("profiles").select("user_id, full_name").in("user_id", ids)
      : { data: [] as any[] };
    const nameOf = (id: string | null) =>
      (profiles ?? []).find((p: any) => p.user_id === id)?.full_name ?? "Sistema";

    return (rows ?? []).map((r: any) => ({
      id: r.id as string,
      role: r.role as string,
      action: r.action as "granted" | "revoked",
      createdAt: r.created_at as string,
      actorName: nameOf(r.actor_user_id),
      targetName: nameOf(r.target_user_id),
    }));
  });

export const setUserRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        userId: z.string().uuid(),
        role: z.enum(ROLES),
        grant: z.boolean(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    if (!data.grant && data.userId === context.userId && data.role === "admin") {
      throw new Error("Non puoi revocare il tuo stesso ruolo di amministratore.");
    }

    if (data.grant) {
      const { error } = await context.supabase
        .from("user_roles")
        .insert({ user_id: data.userId, role: data.role });
      if (error && !error.message.includes("duplicate")) throw new Error(error.message);
    } else {
      const { error } = await context.supabase
        .from("user_roles")
        .delete()
        .eq("user_id", data.userId)
        .eq("role", data.role);
      if (error) throw new Error(error.message);
    }
    return { ok: true as const };
  });
