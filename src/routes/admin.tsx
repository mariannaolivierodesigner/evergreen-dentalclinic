import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useRoles, useSession } from "@/hooks/useAuth";
import { adminExists, claimFirstAdmin } from "@/lib/admin-setup.functions";
import { translateAuthError } from "@/lib/auth-errors";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Logo } from "@/components/site/Logo";

export const Route = createFileRoute("/admin")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Accesso gestionale — Studio Evergreen" },
      {
        name: "description",
        content:
          "Area riservata dello staff dello Studio Evergreen: accedi per gestire calendario, appuntamenti, ferie e registro modifiche.",
      },
      { property: "og:title", content: "Accesso gestionale — Studio Evergreen" },
      { property: "og:description", content: "Area riservata dello staff dello Studio Evergreen." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
    links: [{ rel: "canonical", href: "/admin" }],
  }),
  component: AdminGate,
});

function AdminGate() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, loading } = useSession();
  const { isStaff, isPending } = useRoles(user?.id);
  const [busy, setBusy] = useState(false);

  const checkAdmin = useServerFn(adminExists);
  const claim = useServerFn(claimFirstAdmin);

  const bootstrap = useQuery({
    queryKey: ["admin-exists"],
    enabled: !!user && !isPending && !isStaff,
    queryFn: () => checkAdmin({}),
  });

  const claimMutation = useMutation({
    mutationFn: () => claim({}),
    onSuccess: async () => {
      toast.success("Sei ora amministratore dello studio.");
      await queryClient.invalidateQueries({ queryKey: ["roles"] });
      navigate({ to: "/staff" });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  useEffect(() => {
    if (!loading && user && isStaff) navigate({ to: "/staff", replace: true });
  }, [loading, user, isStaff, navigate]);

  async function signIn(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: String(fd.get("email") ?? ""),
      password: String(fd.get("password") ?? ""),
    });
    setBusy(false);
    if (error) toast.error(translateAuthError(error.message));
  }

  async function signUp(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const password = String(fd.get("password") ?? "");
    if (password.length < 8) {
      toast.error("La password deve avere almeno 8 caratteri.");
      return;
    }
    setBusy(true);
    const { error } = await supabase.auth.signUp({
      email: String(fd.get("email") ?? ""),
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/admin`,
        data: { full_name: String(fd.get("full_name") ?? "") },
      },
    });
    setBusy(false);
    if (error) {
      toast.error(translateAuthError(error.message));
      return;
    }
    toast.success("Account creato: se richiesto, conferma l'email e torna su questa pagina.");
  }

  return (
    <div className="bg-calm flex min-h-dvh flex-col items-center justify-center px-5 py-12">
      <Link to="/" className="mb-8">
        <Logo />
      </Link>

      <div className="surface-card w-full max-w-md p-6 md:p-8">
        <h1 className="font-display text-2xl">Accesso al gestionale</h1>
        <p className="text-muted-foreground mt-2 text-sm">
          Area riservata allo staff: calendario, appuntamenti, ferie e permessi, registro modifiche.
        </p>

        {!user ? (
          <Tabs defaultValue="signin" className="mt-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Accedi</TabsTrigger>
              <TabsTrigger value="signup">Registrati</TabsTrigger>
            </TabsList>

            <TabsContent value="signin">
              <form onSubmit={signIn} className="mt-6 space-y-4">
                <div>
                  <Label htmlFor="ad-email">Email</Label>
                  <Input id="ad-email" name="email" type="email" required className="mt-1.5" />
                </div>
                <div>
                  <Label htmlFor="ad-pw">Password</Label>
                  <Input id="ad-pw" name="password" type="password" required className="mt-1.5" />
                </div>
                <Button type="submit" variant="hero" size="lg" className="w-full" disabled={busy}>
                  Accedi
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={signUp} className="mt-6 space-y-4">
                <div>
                  <Label htmlFor="ad-name">Nome e cognome</Label>
                  <Input
                    id="ad-name"
                    name="full_name"
                    required
                    maxLength={120}
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label htmlFor="ad-email2">Email</Label>
                  <Input id="ad-email2" name="email" type="email" required className="mt-1.5" />
                </div>
                <div>
                  <Label htmlFor="ad-pw2">Password</Label>
                  <Input
                    id="ad-pw2"
                    name="password"
                    type="password"
                    required
                    minLength={8}
                    className="mt-1.5"
                  />
                  <p className="text-muted-foreground mt-1 text-xs">Almeno 8 caratteri.</p>
                </div>
                <Button type="submit" variant="hero" size="lg" className="w-full" disabled={busy}>
                  Crea account
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        ) : (
          <div className="mt-6 space-y-4">
            <p className="text-sm">
              Sei collegato come <strong>{user.email}</strong>.
            </p>
            {isPending || bootstrap.isLoading ? (
              <p className="text-muted-foreground text-sm">Verifica del profilo in corso…</p>
            ) : bootstrap.data?.exists === false ? (
              <>
                <p className="text-muted-foreground text-sm">
                  Nessun amministratore è ancora attivo. Puoi attivare questo account come
                  amministratore dello studio.
                </p>
                <Button
                  variant="hero"
                  size="lg"
                  className="w-full"
                  disabled={claimMutation.isPending}
                  onClick={() => claimMutation.mutate()}
                >
                  Attiva questo account come amministratore
                </Button>
              </>
            ) : (
              <p className="text-muted-foreground text-sm">
                Questo account non ha ancora i permessi dello staff. Chiedi all'amministratore dello
                studio di assegnarti un ruolo, poi ricarica la pagina.
              </p>
            )}
            <Button
              variant="outline"
              className="w-full"
              onClick={async () => {
                await supabase.auth.signOut();
                queryClient.clear();
              }}
            >
              Esci
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
