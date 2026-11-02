import { useState } from "react";
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
import {
  CompareSlider,
  CountUp,
  HorizontalScroller,
  Marquee,
  Parallax,
  ScrollText,
  ScrollVars,
  Tilt,
  Words,
} from "@/components/site/motion";
import { ServiceIcon } from "@/components/site/ServiceIcon";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { servicesQuery, testimonialsQuery } from "@/lib/public-queries";
import { formatDuration, formatPrice, STUDIO } from "@/lib/format";
import heroStudio from "@/assets/hero-studio.jpg";
import beforeSmile from "@/assets/before-smile.jpg";
import afterSmile from "@/assets/after-smile.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Studio Dentistico Longobardi — Il tuo sorriso, la nostra missione" },
      {
        name: "description",
        content:
          "Studio dentistico a Milano: igiene, ortodonzia, implantologia, sbiancamento e urgenze. Prenota online la tua visita in meno di due minuti.",
      },
      { property: "og:title", content: "Studio Dentistico Longobardi — Milano" },
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

function ReasonsPinned() {
  const [active, setActive] = useState(0);
  const n = REASONS.length;
  return (
    <ScrollVars
      mode="pin"
      onProgress={(p) => setActive(Math.min(n - 1, Math.floor(p * n)))}
      className="relative hidden lg:block motion-reduce:hidden"
      style={{ height: `${n * 75 + 100}vh` }}
    >
      <div className="sticky top-0 flex h-screen items-center pt-16">
        <div className="mx-auto grid w-full max-w-6xl grid-cols-2 items-center gap-16 px-5">
          <div>
            <h2 className="max-w-md text-4xl font-semibold">
              Perché i pazienti scelgono Longobardi
            </h2>
            <ol className="mt-10 space-y-2">
              {REASONS.map((r, i) => (
                <li key={r.title}>
                  <span
                    className={
                      "block text-xl font-semibold transition-all duration-500 " +
                      (i === active
                        ? "text-primary translate-x-2 opacity-100"
                        : "text-foreground translate-x-0 opacity-30")
                    }
                  >
                    {r.title}
                  </span>
                </li>
              ))}
            </ol>
          </div>
          <div className="relative h-[26rem]">
            {REASONS.map((r, i) => (
              <div
                key={r.title}
                aria-hidden={i !== active}
                className="surface-card absolute inset-0 flex flex-col justify-center gap-6 p-10 transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]"
                style={{
                  opacity: i === active ? 1 : 0,
                  transform:
                    i === active
                      ? "translateY(0) scale(1)"
                      : i < active
                        ? "translateY(-36px) scale(0.95)"
                        : "translateY(36px) scale(0.95)",
                }}
              >
                <span className="bg-accent-soft text-primary grid h-20 w-20 place-items-center rounded-3xl">
                  <r.icon className="h-9 w-9" aria-hidden="true" />
                </span>
                <h3 className="text-2xl font-semibold">{r.title}</h3>
                <p className="text-muted-foreground text-lg leading-relaxed">{r.text}</p>
                <span className="text-muted-foreground mt-auto text-sm tabular-nums">
                  {String(i + 1).padStart(2, "0")} / {String(n).padStart(2, "0")}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </ScrollVars>
  );
}

function Index() {
  const { data: services } = useSuspenseQuery(servicesQuery());
  const { data: testimonials } = useSuspenseQuery(testimonialsQuery());

  return (
    <SiteLayout footerClassName="mt-0">
      {/* HERO */}
      <ScrollVars as="section" mode="hero" className="bg-calm relative overflow-hidden">
        <div
          aria-hidden="true"
          className="bg-primary-soft animate-float absolute -top-32 -right-24 h-96 w-96 rounded-full opacity-60 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="bg-accent-soft animate-float absolute -bottom-40 -left-24 h-96 w-96 rounded-full opacity-70 blur-3xl [animation-delay:1.5s]"
        />
        <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-5 py-16 md:py-24 lg:grid-cols-2">
          <div
            style={{
              transform: "translate3d(0, calc(var(--p) * -70px), 0)",
              opacity: "calc(1 - var(--p) * 1.25)",
            }}
          >
            <Badge
              variant="secondary"
              className="animate-fade-up mb-5 rounded-full px-3 py-1 text-xs font-medium"
            >
              Milano · Aperti anche il sabato per le urgenze
            </Badge>
            <h1 className="text-4xl leading-[1.05] font-semibold text-balance sm:text-5xl lg:text-7xl">
              <Words text="Il tuo sorriso," startDelay={150} />
              <br />
              <Words text="la nostra missione" className="text-primary" startDelay={150 + 3 * 70} />
            </h1>
            <p className="text-muted-foreground animate-fade-up mt-6 max-w-lg text-lg leading-relaxed [animation-delay:650ms]">
              Uno studio pensato anche per chi il dentista lo teme: tempi distesi, ogni passaggio
              spiegato prima di farlo e la possibilità di fermarsi quando vuoi.
            </p>
            <div className="animate-fade-up mt-8 flex flex-col gap-3 [animation-delay:800ms] sm:flex-row">
              <Button variant="hero" size="xl" className="sheen group" asChild>
                <Link to="/prenota">
                  <CalendarPlus aria-hidden="true" /> Prenota una visita
                </Link>
              </Button>
              <Button variant="outline" size="xl" className="group" asChild>
                <Link to="/servizi">
                  Scopri i trattamenti{" "}
                  <ArrowRight
                    className="transition-transform duration-300 group-hover:translate-x-1"
                    aria-hidden="true"
                  />
                </Link>
              </Button>
            </div>
            <dl className="border-border/70 animate-fade-up mt-10 grid max-w-md grid-cols-3 gap-4 border-t pt-6 [animation-delay:950ms]">
              <div>
                <dt className="font-display text-primary text-2xl font-semibold">
                  <CountUp to={4500} suffix="+" />
                </dt>
                <dd className="text-muted-foreground text-xs">pazienti seguiti</dd>
              </div>
              <div>
                <dt className="font-display text-primary text-2xl font-semibold">
                  <CountUp to={22} suffix=" anni" />
                </dt>
                <dd className="text-muted-foreground text-xs">di attività</dd>
              </div>
              <div>
                <dt className="font-display text-primary text-2xl font-semibold">
                  <CountUp to={4.9} decimals={1} suffix="/5" />
                </dt>
                <dd className="text-muted-foreground text-xs">recensioni verificate</dd>
              </div>
            </dl>
          </div>

          <Parallax speed={0.05} className="relative">
            <div
              className="photo-reveal border-border relative overflow-hidden rounded-[2.5rem] border shadow-[var(--shadow-lift)]"
              style={{ transform: "scale(calc(1 + var(--p) * 0.18))", transformOrigin: "50% 30%" }}
            >
              <img
                src={heroStudio}
                alt="Sala d'attesa luminosa dello Studio Dentistico Longobardi, con divano chiaro e piante"
                width={1408}
                height={1104}
                className="h-full w-full object-cover"
              />
            </div>
            <div className="pop-in bg-card border-border absolute -bottom-6 -left-4 hidden rounded-3xl border p-4 shadow-[var(--shadow-soft)] sm:block">
              <p className="text-muted-foreground text-xs">Prossima disponibilità</p>
              <p className="font-display text-lg font-semibold">Domani, 09:30</p>
              <p className="text-primary text-xs font-medium">Igiene dentale · Dott.ssa Ferraro</p>
            </div>
          </Parallax>
        </div>

        <div className="pb-10" />
      </ScrollVars>

      {/* STRISCIA TRATTAMENTI */}
      <div
        className="bg-primary text-primary-foreground py-4 text-sm font-medium"
        aria-hidden="true"
      >
        <Marquee items={services.map((s) => s.name)} />
      </div>

      {/* SERVIZI */}
      <section className="py-20" aria-labelledby="servizi-title">
        <div className="mx-auto max-w-6xl px-5">
          <Reveal>
            <p className="text-primary text-xs font-semibold tracking-[0.18em] uppercase">
              Trattamenti
            </p>
            <h2 id="servizi-title" className="mt-3 text-3xl font-semibold md:text-4xl">
              Di cosa ci occupiamo
            </h2>
          </Reveal>
          <ScrollText
            className="mt-6 max-w-4xl text-2xl leading-snug font-semibold tracking-tight md:text-4xl"
            text="Dalla prevenzione quotidiana alle riabilitazioni complesse, con un unico team che ti segue dall'inizio alla fine."
          />
        </div>

        <HorizontalScroller label="Trattamenti">
          {services.map((s) => (
            <li key={s.id}>
              <Tilt>
                <Link
                  to="/servizi/$slug"
                  params={{ slug: s.slug }}
                  className="surface-card group flex h-full flex-col p-6"
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
                    <span className="text-foreground font-semibold">
                      da {formatPrice(s.price_cents)}
                    </span>
                    <ArrowRight
                      className="text-primary ml-auto h-4 w-4 transition-transform group-hover:translate-x-1"
                      aria-hidden="true"
                    />
                  </p>
                </Link>
              </Tilt>
            </li>
          ))}
        </HorizontalScroller>
      </section>

      {/* PERCHÉ NOI */}
      <section className="bg-secondary/50 border-border border-y" aria-labelledby="perche-title">
        <div className="mx-auto max-w-6xl px-5 py-20 lg:hidden motion-reduce:block">
          <Reveal>
            <h2 id="perche-title" className="max-w-2xl text-3xl font-semibold md:text-4xl">
              Perché i pazienti scelgono Longobardi
            </h2>
          </Reveal>
          <ul className="mt-10 grid gap-5 md:grid-cols-2">
            {REASONS.map((r, i) => (
              <Reveal as="li" key={r.title} delay={i * 80} variant={i % 2 ? "right" : "left"}>
                <div className="surface-card flex h-full gap-4 p-6">
                  <span className="bg-accent-soft text-primary grid h-11 w-11 shrink-0 place-items-center rounded-2xl">
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
        <ReasonsPinned />
      </section>

      {/* RECENSIONI */}
      <section
        className="bg-secondary/50 border-border border-y"
        aria-labelledby="recensioni-title"
      >
        <div className="mx-auto max-w-6xl px-5 py-20">
          <Reveal>
            <h2 id="recensioni-title" className="text-3xl font-semibold md:text-4xl">
              Cosa raccontano i pazienti
            </h2>
          </Reveal>
          <Reveal delay={100} variant="blur">
            <Carousel opts={{ align: "start", loop: true }} className="mt-10">
              <CarouselContent>
                {testimonials.map((t) => (
                  <CarouselItem key={t.id} className="md:basis-1/2 lg:basis-1/3">
                    <figure className="surface-card flex h-full flex-col p-6">
                      <Quote className="text-primary/40 h-7 w-7" aria-hidden="true" />
                      <blockquote className="mt-3 flex-1 leading-relaxed">{t.quote}</blockquote>
                      <figcaption className="mt-5">
                        <span className="flex gap-0.5" aria-label={`Valutazione ${t.rating} su 5`}>
                          {Array.from({ length: t.rating }).map((_, i) => (
                            <Star
                              key={i}
                              className="fill-primary text-primary h-3.5 w-3.5"
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
        <Reveal className="mt-10" variant="scale">
          <CompareSlider
            before={beforeSmile}
            after={afterSmile}
            beforeAlt="Sorriso prima il trattamento estetico"
            afterAlt="Sorriso dopo il trattamento estetico"
            beforeLabel="Prima"
            afterLabel="Dopo"
            width={1024}
            height={768}
          />
          <div className="text-muted-foreground mt-5 grid gap-4 text-sm md:grid-cols-2 md:gap-6">
            <p>
              <span className="text-foreground font-semibold">Prima · </span>
              Sorriso con smalto opacizzato da caffè e tè, lieve disallineamento degli incisivi.
            </p>
            <p>
              <span className="text-foreground font-semibold">Dopo · </span>
              Sbiancamento professionale e rifinitura estetica: 4 gradi di colore in una seduta.
            </p>
          </div>
        </Reveal>
      </section>

      {/* CTA FINALE */}
      <section className="bg-[image:var(--gradient-primary)]">
        <div className="mx-auto max-w-4xl px-5 py-20 text-center">
          <Reveal variant="blur">
            <h2 className="text-primary-foreground text-3xl font-semibold text-balance md:text-4xl">
              Prenota la tua visita in meno di due minuti
            </h2>
            <p className="text-primary-foreground/85 mx-auto mt-4 max-w-xl">
              Scegli il trattamento, il medico e l'orario che preferisci. Ricevi conferma immediata
              e un promemoria il giorno prima.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Button variant="hero" size="xl" className="sheen" asChild>
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
