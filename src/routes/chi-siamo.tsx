import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, SiteLayout } from "@/components/site/SiteLayout";
import { Reveal } from "@/components/site/Reveal";
import { Parallax } from "@/components/site/motion";
import { STUDIO } from "@/lib/format";
import heroStudio from "@/assets/hero-studio.jpg";

export const Route = createFileRoute("/chi-siamo")({
  head: () => ({
    meta: [
      { title: "Chi siamo — Studio Dentistico Longobardi, Milano" },
      {
        name: "description",
        content:
          "22 anni di odontoiatria a Milano: il nostro team, il metodo di lavoro e i valori che guidano lo Studio Longobardi.",
      },
      { property: "og:title", content: "Chi siamo — Studio Longobardi" },
      {
        property: "og:description",
        content: "Il team, il metodo e i valori dello Studio Dentistico Longobardi.",
      },
      { property: "og:url", content: "/chi-siamo" },
    ],
    links: [{ rel: "canonical", href: "/chi-siamo" }],
  }),
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
  return (
    <SiteLayout>
      <PageHeader
        eyebrow="Chi siamo"
        title="Uno studio nato per far cambiare idea a chi teme il dentista"
        description={`${STUDIO.name} è a Milano dal 2003. Tre sale operative, un laboratorio interno e un team che lavora insieme da anni.`}
      />

      <section className="mx-auto grid max-w-6xl items-center gap-10 px-5 py-16 lg:grid-cols-2">
        <Reveal variant="left">
          <Parallax speed={0.06}>
            <div className="zoom-on-hover border-border rounded-[2rem] border shadow-[var(--shadow-soft)]">
              <img
                src={heroStudio}
                alt="Interno dello Studio Dentistico Longobardi"
                loading="lazy"
                width={1408}
                height={1104}
                className="w-full object-cover"
              />
            </div>
          </Parallax>
        </Reveal>
        <Reveal delay={80} variant="right">
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
            {VALUES.map((v, i) => (
              <Reveal as="li" key={v.title} delay={i * 110} variant="left">
                <div className="border-primary/40 hover:border-primary border-l-2 pl-4 transition-all duration-300 hover:pl-6">
                  <h3 className="font-semibold">{v.title}</h3>
                  <p className="text-muted-foreground mt-1 text-sm leading-relaxed">{v.text}</p>
                </div>
              </Reveal>
            ))}
          </ul>
        </Reveal>
      </section>
    </SiteLayout>
  );
}
