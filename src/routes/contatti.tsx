import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Clock, Mail, MapPin, Phone } from "lucide-react";
import { toast } from "sonner";
import { PageHeader, SiteLayout } from "@/components/site/SiteLayout";
import { Reveal } from "@/components/site/Reveal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { sendContactMessage } from "@/lib/public.functions";
import { STUDIO } from "@/lib/format";

export const Route = createFileRoute("/contatti")({
  head: () => ({
    meta: [
      { title: "Contatti e orari — Studio Dentistico Evergreen, Milano" },
      {
        name: "description",
        content:
          "Dove siamo, orari di apertura, telefono ed email dello Studio Dentistico Evergreen in Via dei Tigli 14 a Milano. Scrivici e ti rispondiamo entro un giorno lavorativo.",
      },
      { property: "og:title", content: "Contatti — Studio Evergreen" },
      { property: "og:description", content: "Indirizzo, orari e modulo di contatto." },
      { property: "og:url", content: "/contatti" },
    ],
    links: [{ rel: "canonical", href: "/contatti" }],
  }),
  component: Contatti,
});

function Contatti() {
  const send = useServerFn(sendContactMessage);
  const [consent, setConsent] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const mutation = useMutation({
    mutationFn: send,
    onSuccess: () => toast.success("Messaggio inviato: ti rispondiamo entro un giorno lavorativo."),
    onError: (e: Error) => toast.error(e.message || "Invio non riuscito, riprova."),
  });

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    const values = {
      name: String(fd.get("name") ?? ""),
      email: String(fd.get("email") ?? ""),
      phone: String(fd.get("phone") ?? ""),
      message: String(fd.get("message") ?? ""),
    };
    const next: Record<string, string> = {};
    if (values.name.trim().length < 2) next["name"] = "Inserisci il tuo nome.";
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(values.email.trim())) next["email"] = "Email non valida.";
    if (values.message.trim().length < 10) next["message"] = "Scrivi almeno una riga.";
    if (!consent) next["consent"] = "Devi accettare l'informativa privacy.";
    setErrors(next);
    if (Object.keys(next).length) return;

    mutation.mutate(
      { data: { ...values, privacy_consent: true as const } },
      { onSuccess: () => form.reset() },
    );
  }

  return (
    <SiteLayout>
      <PageHeader
        eyebrow="Contatti"
        title="Parliamone"
        description="Per urgenze chiama: rispondiamo negli orari di apertura e teniamo sempre uno slot libero al mattino."
      />
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-16 lg:grid-cols-[1fr_1.1fr]">
        <Reveal>
          <ul className="space-y-5">
            {[
              { icon: MapPin, label: "Indirizzo", value: STUDIO.address },
              { icon: Phone, label: "Telefono", value: STUDIO.phone, href: STUDIO.phoneHref },
              { icon: Mail, label: "Email", value: STUDIO.email, href: `mailto:${STUDIO.email}` },
            ].map((c) => (
              <li key={c.label} className="surface-card flex items-start gap-4 p-5">
                <span className="bg-primary-soft text-primary grid h-10 w-10 shrink-0 place-items-center rounded-2xl">
                  <c.icon className="h-4 w-4" aria-hidden="true" />
                </span>
                <div>
                  <p className="text-muted-foreground text-xs tracking-wide uppercase">{c.label}</p>
                  {c.href ? (
                    <a href={c.href} className="hover:text-primary font-medium">
                      {c.value}
                    </a>
                  ) : (
                    <p className="font-medium">{c.value}</p>
                  )}
                </div>
              </li>
            ))}
            <li className="surface-card flex items-start gap-4 p-5">
              <span className="bg-primary-soft text-primary grid h-10 w-10 shrink-0 place-items-center rounded-2xl">
                <Clock className="h-4 w-4" aria-hidden="true" />
              </span>
              <div className="w-full">
                <p className="text-muted-foreground text-xs tracking-wide uppercase">Orari</p>
                <dl className="mt-2 space-y-1 text-sm">
                  {STUDIO.hours.map((h) => (
                    <div key={h.day} className="flex justify-between gap-4">
                      <dt className="text-muted-foreground">{h.day}</dt>
                      <dd className="font-medium">{h.value}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            </li>
          </ul>
        </Reveal>

        <Reveal delay={90}>
          <form onSubmit={onSubmit} noValidate className="surface-card space-y-5 p-6 md:p-8">
            <h2 className="text-2xl font-semibold">Scrivici</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="name">Nome e cognome</Label>
                <Input id="name" name="name" maxLength={100} className="mt-1.5" />
                {errors["name"] && (
                  <p className="text-destructive mt-1 text-xs">{errors["name"]}</p>
                )}
              </div>
              <div>
                <Label htmlFor="phone">Telefono (facoltativo)</Label>
                <Input id="phone" name="phone" maxLength={40} className="mt-1.5" />
              </div>
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" maxLength={255} className="mt-1.5" />
              {errors["email"] && (
                <p className="text-destructive mt-1 text-xs">{errors["email"]}</p>
              )}
            </div>
            <div>
              <Label htmlFor="message">Messaggio</Label>
              <Textarea id="message" name="message" rows={5} maxLength={1500} className="mt-1.5" />
              {errors["message"] && (
                <p className="text-destructive mt-1 text-xs">{errors["message"]}</p>
              )}
            </div>
            <div className="flex items-start gap-3">
              <Checkbox
                id="consent"
                checked={consent}
                onCheckedChange={(v) => setConsent(v === true)}
              />
              <Label htmlFor="consent" className="text-muted-foreground text-sm leading-relaxed">
                Ho letto l'informativa privacy e acconsento al trattamento dei dati per essere
                ricontattato.
              </Label>
            </div>
            {errors["consent"] && (
              <p className="text-destructive text-xs">{errors["consent"]}</p>
            )}
            <Button type="submit" variant="hero" size="lg" disabled={mutation.isPending}>
              {mutation.isPending ? "Invio…" : "Invia messaggio"}
            </Button>
          </form>
        </Reveal>
      </div>
    </SiteLayout>
  );
}