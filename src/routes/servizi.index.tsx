import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { ArrowRight } from "lucide-react";
import { PageHeader, SiteLayout } from "@/components/site/SiteLayout";
import { Reveal } from "@/components/site/Reveal";
import { ServiceIcon } from "@/components/site/ServiceIcon";
import { servicesQuery } from "@/lib/public-queries";
import { formatDuration, formatPrice } from "@/lib/format";

export const Route = createFileRoute("/servizi/")({
  head: () => ({
    meta: [
      { title: "Trattamenti odontoiatrici — Studio Evergreen Milano" },
      {
        name: "description",
        content:
          "Igiene, ortodonzia invisibile, implantologia, sbiancamento, pedodonzia e urgenze: tutti i trattamenti dello Studio Evergreen con durata e prezzo indicativo.",
      },
      { property: "og:title", content: "Trattamenti — Studio Evergreen" },
      {
        property: "og:description",
        content: "Tutti i trattamenti dello studio, con durata e prezzi trasparenti.",
      },
      { property: "og:url", content: "/servizi" },
    ],
    links: [{ rel: "canonical", href: "/servizi" }],
  }),
  loader: ({ context }) => {
    context.queryClient.ensureQueryData(servicesQuery());
  },
  component: ServiziPage,
});

function ServiziPage() {
  const { data: services } = useSuspenseQuery(servicesQuery());

  return (
    <SiteLayout>
      <PageHeader
        eyebrow="Trattamenti"
        title="Cure su misura, spiegate senza gergo"
        description="Ogni percorso parte da una visita di valutazione con preventivo scritto. I prezzi indicati sono di partenza e vengono confermati dopo la diagnosi."
      />
      <div className="mx-auto max-w-6xl px-5 py-16">
        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((s, i) => (
            <Reveal as="li" key={s.id} delay={i * 60}>
              <Link
                to="/servizi/$slug"
                params={{ slug: s.slug }}
                className="surface-card lift-on-hover group flex h-full flex-col p-6"
              >
                <span className="bg-primary-soft text-primary group-hover:bg-primary group-hover:text-primary-foreground mb-5 grid h-12 w-12 place-items-center rounded-2xl transition-colors">
                  <ServiceIcon name={s.icon} className="h-5 w-5" />
                </span>
                <h2 className="text-lg font-semibold">{s.name}</h2>
                <p className="text-muted-foreground mt-2 flex-1 text-sm leading-relaxed">
                  {s.short_description}
                </p>
                <p className="text-muted-foreground mt-5 flex items-center gap-3 text-xs">
                  <span className="bg-secondary rounded-full px-2.5 py-1 font-medium">
                    {formatDuration(s.duration_min)}
                  </span>
                  <span className="text-foreground font-semibold">
                    da {formatPrice(s.price_cents)}
                  </span>
                  <ArrowRight
                    className="text-primary ml-auto h-4 w-4 transition-transform group-hover:translate-x-1"
                    aria-hidden="true"
                  />
                </p>
              </Link>
            </Reveal>
          ))}
        </ul>
      </div>
    </SiteLayout>
  );
}