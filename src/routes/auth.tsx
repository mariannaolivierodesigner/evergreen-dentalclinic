import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useSession } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Logo } from "@/components/site/Logo";

const searchSchema = z.object({ redirect: z.string().optional() });

export const Route = createFileRoute("/auth")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Accedi all'area personale — Studio Evergreen" },
      {
        name: "description",
        content:
          "Accedi o registrati per prenotare visite, consultare i tuoi appuntamenti e scaricare preventivi e referti dello Studio Evergreen.",
      },
      { property: "og:title", content: "Area personale — Studio Evergreen" },
      { property: "og:description", content: "Accedi per gestire appuntamenti e documenti." },
      { property: "og:url", content: "/auth" },
      { name: "robots", content: "noindex" },
    ],
    links: [{ rel: "canonical", href: "/auth" }],
  }),
  component: AuthPage,
});

function safePath(value?: string) {
  return value && value.startsWith("/") && !value.startsWith("//") ? value : "/area-personale";
}

function AuthPage() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const { user, loading } = useSession();
  const [busy, setBusy] = useState(false);
  const target = safePath(search.redirect);

  useEffect(() => {
    if (!loading && user) navigate({ to: target, replace: true });
  }, [loading, user, target, navigate]);

  async function signIn(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: String(fd.get("email") ?? ""),
      password: String(fd.get("password") ?? ""),
    });
    setBusy(false);
    if (error) {
      toast.error("Credenziali non valide.");
      return;
    }
    navigate({ to: target, replace: true });
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
        emailRedirectTo: `${window.location.origin}${target}`,
        data: { full_name: String(fd.get("full_name") ?? "") },
      },
    });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Ti abbiamo inviato una email di conferma: apri il link per attivare l'account.");
  }

  async function google() {
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      toast.error("Accesso con Google non riuscito.");
      return;
    }
    if (result.redirected) return;
    navigate({ to: target, replace: true });
  }

  return (
    <div className="bg-calm flex min-h-dvh flex-col items-center justify-center px-5 py-12">
      <Link to="/" className="mb-8">
        <Logo />
      </Link>
      <div className="surface-card w-full max-w-md p-6 md:p-8">
        <Tabs defaultValue="signin">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="signin">Accedi</TabsTrigger>
            <TabsTrigger value="signup">Registrati</TabsTrigger>
          </TabsList>

          <TabsContent value="signin">
            <form onSubmit={signIn} className="mt-6 space-y-4">
              <div>
                <Label htmlFor="si-email">Email</Label>
                <Input id="si-email" name="email" type="email" required className="mt-1.5" />
              </div>
              <div>
                <Label htmlFor="si-pw">Password</Label>
                <Input id="si-pw" name="password" type="password" required className="mt-1.5" />
              </div>
              <Button type="submit" variant="hero" size="lg" className="w-full" disabled={busy}>
                Accedi
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="signup">
            <form onSubmit={signUp} className="mt-6 space-y-4">
              <div>
                <Label htmlFor="su-name">Nome e cognome</Label>
                <Input id="su-name" name="full_name" required maxLength={120} className="mt-1.5" />
              </div>
              <div>
                <Label htmlFor="su-email">Email</Label>
                <Input id="su-email" name="email" type="email" required className="mt-1.5" />
              </div>
              <div>
                <Label htmlFor="su-pw">Password</Label>
                <Input
                  id="su-pw"
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

        <div className="text-muted-foreground my-6 flex items-center gap-3 text-xs">
          <span className="bg-border h-px flex-1" />
          oppure
          <span className="bg-border h-px flex-1" />
        </div>

        <Button variant="outline" size="lg" className="w-full" onClick={google}>
          Continua con Google
        </Button>

        <p className="text-muted-foreground mt-6 text-center text-xs leading-relaxed">
          Continuando accetti la nostra{" "}
          <Link to="/privacy" className="text-primary underline-offset-2 hover:underline">
            informativa privacy
          </Link>
          .
        </p>
      </div>
    </div>
  );
}