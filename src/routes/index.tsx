import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  CalendarPlus,
  HeartHandshake,
  Leaf,
  MonitorSmartphone,
  Quote,
  ShieldCheck,
  Star,
} from "lucide-react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Reveal } from "@/components/site/Reveal";
import { ServiceIcon } from "@/components/site/ServiceIcon";
import { doctorPhoto } from "@/components/site/doctor-photos";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { doctorsQuery, servicesQuery, testimonialsQuery } from "@/lib/public-queries";
import { formatDuration, formatPrice, STUDIO } from "@/lib/format";
import heroStudio from "@/assets/hero-studio.jpg";
import beforeSmile from "@/assets/before-smile.jpg";
import afterSmile from "@/assets/after-smile.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Studio Dentistico Evergreen — Il tuo sorriso, la nostra missione" },
      {
        name: "description",
        content:
          "Studio dentistico a Milano: igiene, ortodonzia, implantologia, sbiancamento e urgenze. Prenota online la tua visita in meno di due minuti.",
      },
      { property: "og:title", content: "Studio Dentistico Evergreen — Milano" },
      {
        property: "og:description",
        content: "Cure odontoiatriche serene, tecnologia avanzata e prenotazione online.",
      },
      { property: "og:url", content: "/" },
    ],
    links: [{ rel: "canonical", href: "/" }],
  }),
  loader: ({ context }) => {
    context.queryClient.ensureQueryData(servicesQuery());
    context.queryClient.ensureQueryData(doctorsQuery());
    context.queryClient.ensureQueryData(testimonialsQuery());
  },
  component: Index,
});

const REASONS = [
  {
    icon: MonitorSmartphone,
    title: "Tecnologia che riduce i tempi",
    text: "Scanner intraorale, radiologia digitale a basso dosaggio e implantologia guidata: meno sedute, più precisione.",
  },
  {
    icon: HeartHandshake,
    title: "Sedazione cosciente",
    text: "Per chi vive l'odontoiatra con ansia: resti sveglio e collaborativo, ma profondamente rilassato.",
  },
  {
    icon: ShieldCheck,
    title: "Preventivi chiari",
    text: "Costi, alternative e tempi scritti nero su bianco prima di iniziare. Nessuna sorpresa in fattura.",
  },
  {
    icon: Leaf,
    title: "Ambiente che rassicura",
    text: "Niente odore di studio dentistico, luce naturale, musica a scelta e tempi mai compressi.",
  },
];

function Index() {
  const { data: services } = useSuspenseQuery(servicesQuery());
  const { data: doctors } = useSuspenseQuery(doctorsQuery());
  const { data: testimonials } = useSuspenseQuery(testimonialsQuery());

  return (
    <SiteLayout>
      {/* HERO */}
      <section className="bg-calm relative overflow-hidden">
        <div
          aria-hidden="true"
          className="bg-primary-soft animate-float absolute -top-32 -right-24 h-96 w-96 rounded-full opacity-60 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="bg-accent-soft animate-float absolute -bottom-40 -left-24 h-96 w-96 rounded-full opacity-70 blur-3xl [animation-delay:1.5s]"
        />
        <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-5 py-16 md:py-24 lg:grid-cols-2">
          <div className="animate-fade-up">
            <Badge variant="secondary" className="mb-5 rounded-full px-3 py-1 text-xs font-medium">
              Milano · Aperti anche il sabato per le urgenze
            </Badge>
            <h1 className="text-4xl leading-[1.05] font-semibold text-balance sm:text-5xl lg:text-6xl">
              Il tuo sorriso,
              <br />
              <span className="text-primary">la nostra missione</span>
            </h1>
            <p className="text-muted-foreground mt-6 max-w-lg text-lg leading-relaxed">
              Uno studio pensato anche per chi il dentista lo teme: tempi distesi, ogni passaggio
              spiegato prima di farlo e la possibilità di fermarsi quando vuoi.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button variant="hero" size="xl" asChild>
                <Link to="/prenota">
                  <CalendarPlus aria-hidden="true" /> Prenota una visita
                </Link>
              </Button>
              <Button variant="outline" size="xl" asChild>
                <Link to="/servizi">
                  Scopri i trattamenti <ArrowRight aria-hidden="true" />
                </Link>
              </Button>
            </div>
            <dl className="border-border/70 mt-10 grid max-w-md grid-cols-3 gap-4 border-t pt-6">
              {[
                { k: "4.500+", v: "pazienti seguiti" },
                { k: "22 anni", v: "di attività" },
                { k: "4,9/5", v: "recensioni verificate" },
              ].map((s) => (
                <div key={s.k}>
                  <dt className="font-display text-primary text-2xl font-semibold">{s.k}</dt>
                  <dd className="text-muted-foreground text-xs">{s.v}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="relative">
            <div className="border-border relative overflow-hidden rounded-[2.5rem] border shadow-[var(--shadow-lift)]">
              <img
                src={heroStudio}
                alt="Sala d'attesa luminosa dello Studio Dentistico Evergreen, con divano chiaro e piante"
                width={1408}
                height={1104}
                className="h-full w-full object-cover"
              />
            </div>
            <div className="bg-card border-border absolute -bottom-6 -left-4 hidden rounded-3xl border p-4 shadow-[var(--shadow-soft)] sm:block">
              <p className="text-muted-foreground text-xs">Prossima disponibilità</p>
              <p className="font-display text-lg font-semibold">Domani, 09:30</p>
              <p className="text-primary text-xs font-medium">Igiene dentale · Dott.ssa Ferraro</p>
            </div>
          </div>
        </div>

        <div className="pb-10" />

      </section>

      {/* SERVIZI */}
      <section className="mx-auto max-w-6xl px-5 py-20" aria-labelledby="servizi-title">
        <Reveal>
          <p className="text-primary text-xs font-semibold tracking-[0.18em] uppercase">
            Trattamenti
          </p>
          <h2 id="servizi-title" className="mt-3 text-3xl font-semibold md:text-4xl">
            Di cosa ci occupiamo
          </h2>
          <p className="text-muted-foreground mt-3 max-w-2xl">
            Dalla prevenzione quotidiana alle riabilitazioni complesse, con un unico team che ti
            segue dall'inizio alla fine.
          </p>
        </Reveal>

        <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
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
                <h3 className="text-lg font-semibold">{s.name}</h3>
                <p className="text-muted-foreground mt-2 flex-1 text-sm leading-relaxed">
                  {s.short_description}
                </p>
                <p className="text-muted-foreground mt-5 flex items-center gap-3 text-xs">
                  <span className="bg-secondary rounded-full px-2.5 py-1 font-medium">
                    {formatDuration(s.duration_min)}
                  </span>
                  <span className="text-foreground font-semibold">da {formatPrice(s.price_cents)}</span>
                  <ArrowRight
                    className="text-primary ml-auto h-4 w-4 transition-transform group-hover:translate-x-1"
                    aria-hidden="true"
                  />
                </p>
              </Link>
            </Reveal>
          ))}
        </ul>
      </section>

      {/* PERCHÉ NOI */}
      <section className="bg-secondary/50 border-border border-y" aria-labelledby="perche-title">
        <div className="mx-auto max-w-6xl px-5 py-20">
          <Reveal>
            <h2 id="perche-title" className="max-w-2xl text-3xl font-semibold md:text-4xl">
              Perché i pazienti scelgono Evergreen
            </h2>
          </Reveal>
          <ul className="mt-10 grid gap-5 md:grid-cols-2">
            {REASONS.map((r, i) => (
              <Reveal as="li" key={r.title} delay={i * 70}>
                <div className="surface-card flex h-full gap-4 p-6">
                  <span className="bg-accent-soft text-accent grid h-11 w-11 shrink-0 place-items-center rounded-2xl">
                    <r.icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <div>
                    <h3 className="font-semibold">{r.title}</h3>
                    <p className="text-muted-foreground mt-1.5 text-sm leading-relaxed">{r.text}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </ul>
        </div>
      </section>

      {/* TEAM */}
      <section className="mx-auto max-w-6xl px-5 py-20" aria-labelledby="team-title">
        <Reveal>
          <p className="text-primary text-xs font-semibold tracking-[0.18em] uppercase">Il team</p>
          <h2 id="team-title" className="mt-3 text-3xl font-semibold md:text-4xl">
            Le persone che ti seguiranno
          </h2>
        </Reveal>
        <ul className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {doctors.map((d, i) => (
            <Reveal as="li" key={d.id} delay={i * 60}>
              <article className="surface-card lift-on-hover h-full overflow-hidden">
                <img
                  src={doctorPhoto(d.full_name)}
                  alt={`Ritratto di ${d.full_name}, ${d.specialization}`}
                  loading="lazy"
                  width={700}
                  height={800}
                  className="aspect-4/5 w-full object-cover"
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
      </section>

      {/* RECENSIONI */}
      <section className="bg-secondary/50 border-border border-y" aria-labelledby="recensioni-title">
        <div className="mx-auto max-w-6xl px-5 py-20">
          <Reveal>
            <h2 id="recensioni-title" className="text-3xl font-semibold md:text-4xl">
              Cosa raccontano i pazienti
            </h2>
          </Reveal>
          <Reveal delay={100}>
            <Carousel opts={{ align: "start", loop: true }} className="mt-10">
              <CarouselContent>
                {testimonials.map((t) => (
                  <CarouselItem key={t.id} className="md:basis-1/2 lg:basis-1/3">
                    <figure className="surface-card flex h-full flex-col p-6">
                      <Quote className="text-primary/40 h-7 w-7" aria-hidden="true" />
                      <blockquote className="mt-3 flex-1 leading-relaxed">{t.quote}</blockquote>
                      <figcaption className="mt-5">
                        <span
                          className="flex gap-0.5"
                          aria-label={`Valutazione ${t.rating} su 5`}
                        >
                          {Array.from({ length: t.rating }).map((_, i) => (
                            <Star
                              key={i}
                              className="fill-accent text-accent h-3.5 w-3.5"
                              aria-hidden="true"
                            />
                          ))}
                        </span>
                        <span className="mt-2 block text-sm font-semibold">{t.author}</span>
                        <span className="text-muted-foreground text-xs">{t.role}</span>
                      </figcaption>
                    </figure>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <div className="mt-6 flex gap-2">
                <CarouselPrevious className="static translate-y-0" />
                <CarouselNext className="static translate-y-0" />
              </div>
            </Carousel>
          </Reveal>
        </div>
      </section>

      {/* PRIMA / DOPO */}
      <section className="mx-auto max-w-6xl px-5 py-20" aria-labelledby="prima-dopo-title">
        <Reveal>
          <h2 id="prima-dopo-title" className="text-3xl font-semibold md:text-4xl">
            Prima e dopo
          </h2>
          <p className="text-muted-foreground mt-3 max-w-2xl">
            Casi reali di sbiancamento e riabilitazione estetica, pubblicati con il consenso dei
            pazienti.
          </p>
        </Reveal>
        <div className="mt-10 grid items-stretch gap-6 md:grid-cols-2">
          {[
            {
              img: beforeSmile,
              label: "Prima",
              text: "Sorriso con smalto opacizzato da caffè e tè, lieve disallineamento degli incisivi.",
            },
            {
              img: afterSmile,
              label: "Dopo",
              text: "Sbiancamento professionale e rifinitura estetica: 4 gradi di colore in una seduta.",
            },
          ].map((c, i) => (
            <Reveal key={c.label} delay={i * 90} className="h-full">
              <figure className="surface-card flex h-full flex-col overflow-hidden">
                <div className="relative">
                  <img
                    src={c.img}
                    alt={`Sorriso ${c.label.toLowerCase()} il trattamento estetico`}
                    loading="lazy"
                    width={1024}
                    height={768}
                    className="aspect-[4/3] w-full object-cover"
                  />
                  <span className="bg-background/90 absolute top-4 left-4 rounded-full px-3 py-1 text-xs font-semibold">
                    {c.label}
                  </span>
                </div>
                <figcaption className="text-muted-foreground flex-1 p-5 text-sm">
                  {c.text}
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </div>

      </section>

      {/* CTA FINALE */}
      <section className="bg-[image:var(--gradient-primary)]">
        <div className="mx-auto max-w-4xl px-5 py-20 text-center">
          <Reveal>
            <h2 className="text-primary-foreground text-3xl font-semibold text-balance md:text-4xl">
              Prenota la tua visita in meno di due minuti
            </h2>
            <p className="text-primary-foreground/85 mx-auto mt-4 max-w-xl">
              Scegli il trattamento, il medico e l'orario che preferisci. Ricevi conferma immediata e
              un promemoria il giorno prima.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Button variant="hero" size="xl" asChild>
                <Link to="/prenota">
                  <CalendarPlus aria-hidden="true" /> Prenota online
                </Link>
              </Button>
              <Button
                variant="outline"
                size="xl"
                className="border-primary-foreground/40 text-primary-foreground bg-transparent hover:bg-primary-foreground/10"
                asChild
              >
                <a href={STUDIO.phoneHref}>Preferisco chiamare</a>
              </Button>
            </div>
          </Reveal>
        </div>
      </section>
    </SiteLayout>
  );
}
