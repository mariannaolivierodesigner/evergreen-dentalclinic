import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { CalendarPlus, Check } from "lucide-react";
import { PageHeader, SiteLayout } from "@/components/site/SiteLayout";
import { Reveal } from "@/components/site/Reveal";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { serviceQuery } from "@/lib/public-queries";
import { formatDuration, formatPrice } from "@/lib/format";

export const Route = createFileRoute("/servizi/$slug")({
  loader: async ({ context, params }) => {
    const service = await context.queryClient.ensureQueryData(serviceQuery(params.slug));
    if (!service) throw notFound();
  },
  head: ({ params }) => ({
    meta: [
      { title: `Trattamento ${params.slug.replace(/-/g, " ")} — Studio Evergreen` },
      {
        name: "description",
        content: `Come funziona il trattamento, quanto dura, quanto costa e cosa aspettarsi presso lo Studio Dentistico Evergreen a Milano.`,
      },
      { property: "og:title", content: "Trattamento — Studio Evergreen" },
      {
        property: "og:description",
        content: "Dettagli, durata, prezzo e domande frequenti sul trattamento.",
      },
      { property: "og:url", content: `/servizi/${params.slug}` },
    ],
    links: [{ rel: "canonical", href: `/servizi/${params.slug}` }],
  }),
  component: ServiceDetail,
  notFoundComponent: () => (
    <SiteLayout>
      <PageHeader
        title="Trattamento non trovato"
        description="La pagina che cerchi non esiste più o è stata rinominata."
      />
      <div className="mx-auto max-w-6xl px-5 py-16">
        <Button asChild variant="hero">
          <Link to="/servizi">Vedi tutti i trattamenti</Link>
        </Button>
      </div>
    </SiteLayout>
  ),
});

const FAQ = [
  {
    q: "Il trattamento è doloroso?",
    a: "Lavoriamo sempre in anestesia locale quando serve e, su richiesta, con sedazione cosciente. Se durante la seduta senti fastidio ci fermiamo: concordiamo un segnale con la mano prima di iniziare.",
  },
  {
    q: "Quante sedute servono?",
    a: "Dipende dal punto di partenza. Nella visita di valutazione ricevi un piano scritto con numero di sedute, tempi e costi complessivi.",
  },
  {
    q: "È possibile pagare a rate?",
    a: "Sì, per i piani sopra i 900 € proponiamo finanziamenti a tasso agevolato in 12, 24 o 36 mesi, senza costi nascosti.",
  },
  {
    q: "Cosa succede se devo disdire?",
    a: "Puoi spostare o annullare l'appuntamento dall'area personale fino a 24 ore prima, senza alcun addebito.",
  },
];

function ServiceDetail() {
  const { slug } = Route.useParams();
  const { data: service } = useSuspenseQuery(serviceQuery(slug));
  if (!service) return null;

  return (
    <SiteLayout>
      <PageHeader
        eyebrow="Trattamento"
        title={service.name}
        description={service.short_description}
      />
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-16 lg:grid-cols-[1fr_20rem]">
        <div>
          <Reveal>
            <div className="text-base leading-relaxed whitespace-pre-line">
              {service.description}
            </div>
          </Reveal>

          <Reveal delay={80}>
            <h2 className="mt-12 text-2xl font-semibold">Come si svolge</h2>
            <ol className="mt-5 space-y-4">
              {[
                "Visita di valutazione con foto e radiografia digitale.",
                "Piano di cura scritto, con alternative e preventivo dettagliato.",
                "Seduta operativa, con pause concordate quando ti servono.",
                "Controllo di verifica incluso e richiami programmati.",
              ].map((step, i) => (
                <li key={step} className="flex gap-3">
                  <span className="bg-primary-soft text-primary grid h-7 w-7 shrink-0 place-items-center rounded-full text-sm font-semibold">
                    {i + 1}
                  </span>
                  <span className="text-muted-foreground pt-0.5 leading-relaxed">{step}</span>
                </li>
              ))}
            </ol>
          </Reveal>

          <Reveal delay={120}>
            <h2 className="mt-12 text-2xl font-semibold">Domande frequenti</h2>
            <Accordion type="single" collapsible className="mt-4">
              {FAQ.map((f) => (
                <AccordionItem key={f.q} value={f.q}>
                  <AccordionTrigger className="text-left">{f.q}</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground leading-relaxed">
                    {f.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </Reveal>
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="surface-card p-6">
            <p className="text-muted-foreground text-xs tracking-wide uppercase">Prezzo da</p>
            <p className="font-display mt-1 text-3xl font-semibold">
              {formatPrice(service.price_cents)}
            </p>
            <ul className="text-muted-foreground mt-5 space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <Check className="text-primary h-4 w-4" aria-hidden="true" />
                Durata seduta: {formatDuration(service.duration_min)}
              </li>
              <li className="flex items-center gap-2">
                <Check className="text-primary h-4 w-4" aria-hidden="true" />
                Preventivo scritto incluso
              </li>
              <li className="flex items-center gap-2">
                <Check className="text-primary h-4 w-4" aria-hidden="true" />
                Pagamento rateale disponibile
              </li>
            </ul>
            <Button variant="hero" size="lg" className="mt-6 w-full" asChild>
              <Link to="/prenota" search={{ servizio: service.slug }}>
                <CalendarPlus aria-hidden="true" /> Prenota
              </Link>
            </Button>
          </div>
        </aside>
      </div>
    </SiteLayout>
  );
}