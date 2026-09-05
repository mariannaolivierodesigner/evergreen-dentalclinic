import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { PageHeader, SiteLayout } from "@/components/site/SiteLayout";
import { Reveal } from "@/components/site/Reveal";
import { Button } from "@/components/ui/button";
import { doctorPhoto } from "@/components/site/doctor-photos";
import { doctorsQuery } from "@/lib/public-queries";
import { STUDIO } from "@/lib/format";
import heroStudio from "@/assets/hero-studio.jpg";

export const Route = createFileRoute("/chi-siamo")({
  head: () => ({
    meta: [
      { title: "Chi siamo — Studio Dentistico Evergreen, Milano" },
      {
        name: "description",
        content:
          "22 anni di odontoiatria a Milano: il nostro team, il metodo di lavoro e i valori che guidano lo Studio Evergreen.",
      },
      { property: "og:title", content: "Chi siamo — Studio Evergreen" },
      {
        property: "og:description",
        content: "Il team, il metodo e i valori dello Studio Dentistico Evergreen.",
      },
      { property: "og:url", content: "/chi-siamo" },
    ],
    links: [{ rel: "canonical", href: "/chi-siamo" }],
  }),
  loader: ({ context }) => {
    context.queryClient.ensureQueryData(doctorsQuery());
  },
  component: ChiSiamo,
});

const VALUES = [
  {
    title: "Prevenzione prima di tutto",
    text: "Il richiamo di igiene non è un upselling: è il modo più economico per non arrivare mai all'intervento.",
  },
  {
    title: "Nessuna decisione al volo",
    text: "Ti diamo il tempo di leggere il piano di cura a casa. Se vuoi un secondo parere, ti consegniamo tutta la documentazione.",
  },
  {
    title: "Un solo referente",
    text: "Ogni paziente ha un medico di riferimento che coordina eventuali specialisti coinvolti.",
  },
];

function ChiSiamo() {
  const { data: doctors } = useSuspenseQuery(doctorsQuery());

  return (
    <SiteLayout>
      <PageHeader
        eyebrow="Chi siamo"
        title="Uno studio nato per far cambiare idea a chi teme il dentista"
        description={`${STUDIO.name} è a Milano dal 2003. Tre sale operative, un laboratorio interno e un team che lavora insieme da anni.`}
      />

      <section className="mx-auto grid max-w-6xl items-center gap-10 px-5 py-16 lg:grid-cols-2">
        <Reveal>
          <img
            src={heroStudio}
            alt="Interno dello Studio Dentistico Evergreen"
            loading="lazy"
            width={1408}
            height={1104}
            className="border-border w-full rounded-[2rem] border object-cover shadow-[var(--shadow-soft)]"
          />
        </Reveal>
        <Reveal delay={80}>
          <h2 className="text-3xl font-semibold">La nostra storia</h2>
          <p className="text-muted-foreground mt-4 leading-relaxed">
            Abbiamo aperto in due, con una poltrona e molta pazienza. Vent'anni dopo siamo un team
            di dodici persone, ma il criterio è rimasto lo stesso: nessun paziente esce dallo studio
            senza aver capito cosa gli succederà la volta dopo.
          </p>
          <p className="text-muted-foreground mt-4 leading-relaxed">
            Abbiamo progettato gli spazi con un architetto per togliere tutto ciò che rende
            ansiogeno uno studio dentistico: rumori, odori, sale d'attesa affollate. Ogni
            appuntamento ha una durata reale, così non ti troverai mai ad aspettare mezz'ora oltre
            l'orario.
          </p>
          <ul className="mt-8 space-y-4">
            {VALUES.map((v) => (
              <li key={v.title} className="border-primary/40 border-l-2 pl-4">
                <h3 className="font-semibold">{v.title}</h3>
                <p className="text-muted-foreground mt-1 text-sm leading-relaxed">{v.text}</p>
              </li>
            ))}
          </ul>
        </Reveal>
      </section>

      <section className="bg-secondary/50 border-border border-y" aria-labelledby="team-title">
        <div className="mx-auto max-w-6xl px-5 py-16">
          <Reveal>
            <h2 id="team-title" className="text-3xl font-semibold">
              Il team clinico
            </h2>
          </Reveal>
          <ul className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {doctors.map((d, i) => (
              <Reveal as="li" key={d.id} delay={i * 60}>
                <article className="surface-card lift-on-hover h-full overflow-hidden">
                  <img
                    src={doctorPhoto(d.full_name)}
                    alt={`Ritratto di ${d.full_name}`}
                    loading="lazy"
                    width={700}
                    height={800}
                    className="aspect-[4/3] w-full object-cover sm:aspect-4/5"
                  />
                  <div className="p-5">
                    <h3 className="font-semibold">{d.full_name}</h3>
                    <p className="text-primary mt-0.5 text-xs font-medium">{d.specialization}</p>
                    <p className="text-muted-foreground mt-3 text-sm leading-relaxed">{d.bio}</p>
                  </div>
                </article>
              </Reveal>
            ))}
          </ul>
          <div className="mt-10">
            <Button variant="hero" size="lg" asChild>
              <Link to="/prenota">Prenota con il team</Link>
            </Button>
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}
