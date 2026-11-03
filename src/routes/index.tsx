import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import {
  ArrowDown,
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
  CardMarquee,
  Marquee,
  Parallax,
  ScrollText,
  ScrollVars,
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
import heroSmile from "@/assets/hero-smile.jpg";
import heroStudio from "@/assets/hero-studio.jpg";
import beforeSmile from "@/assets/before-smile.jpg";
import afterSmile from "@/assets/after-smile.jpg";
import treat1 from "@/assets/treat-1.jpg";
import treat2 from "@/assets/treat-2.jpg";
import treat3 from "@/assets/treat-3.jpg";
import treat4 from "@/assets/treat-4.jpg";
import treat5 from "@/assets/treat-5.jpg";
import treat6 from "@/assets/treat-6.jpg";

const TREATMENT_PHOTOS: Record<string, string> = {
  "igiene-dentale": treat1,
  ortodonzia: treat2,
  implantologia: treat3,
  sbiancamento: treat4,
  pedodonzia: treat5,
  urgenze: treat6,
};
const TREATMENT_ORDER = Object.values(TREATMENT_PHOTOS);

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Studio Dentistico Longobardi — Liberi di sorridere" },
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
    image: treat6,
    title: "Tecnologia che riduce i tempi",
    text: "Scanner intraorale, radiologia digitale a basso dosaggio e implantologia guidata: meno sedute, più precisione.",
  },
  {
    icon: HeartHandshake,
    image: treat1,
    title: "Sedazione cosciente",
    text: "Per chi vive l'odontoiatra con ansia: resti sveglio e collaborativo, ma profondamente rilassato.",
  },
  {
    icon: ShieldCheck,
    image: treat3,
    title: "Preventivi chiari",
    text: "Costi, alternative e tempi scritti nero su bianco prima di iniziare. Nessuna sorpresa in fattura.",
  },
  {
    icon: Leaf,
    image: heroStudio,
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
      style={{ height: `calc(40rem + ${n * 48}vh)` }}
    >
      <div className="sticky top-[max(5rem,calc(50vh-19rem))] flex h-[38rem] items-center">
        <div className="mx-auto grid w-full max-w-6xl grid-cols-[1fr_1.15fr] items-center gap-16 px-5">
          <div>
            <p className="text-muted-foreground text-xs font-semibold tracking-[0.2em] uppercase">
              Perché noi
            </p>
            <h2 className="mt-4 max-w-md text-4xl font-semibold text-balance">
              Perché i pazienti scelgono Longobardi
            </h2>
            <div className="relative mt-10 pl-7">
              {/* linea di avanzamento: si riempie con lo scroll */}
              <span className="bg-border absolute top-1 bottom-1 left-0 w-px" aria-hidden="true" />
              <span
                className="bg-accent absolute top-1 left-0 w-px origin-top"
                style={{ height: "calc(var(--p) * (100% - 0.5rem))" }}
                aria-hidden="true"
              />
              <ol className="space-y-1">
                {REASONS.map((r, i) => (
                  <li key={r.title}>
                    <span
                      className={
                        "flex items-baseline gap-3 text-xl font-semibold transition-all duration-500 " +
                        (i === active ? "translate-x-1 opacity-100" : "opacity-35")
                      }
                    >
                      <span className="text-accent text-sm tabular-nums">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      {r.title}
                    </span>
                    <span
                      className="text-muted-foreground block overflow-hidden pl-9 text-sm leading-relaxed transition-all duration-500"
                      style={{
                        maxHeight: i === active ? "4.5rem" : 0,
                        opacity: i === active ? 1 : 0,
                        marginBottom: i === active ? "0.5rem" : 0,
                      }}
                    >
                      {r.text}
                    </span>
                  </li>
                ))}
              </ol>
            </div>
          </div>
          <div className="relative h-[34rem]">
            {REASONS.map((r, i) => (
              <div
                key={r.title}
                aria-hidden={i !== active}
                className="surface-card absolute inset-0 flex flex-col overflow-hidden transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]"
                style={{
                  opacity: i === active ? 1 : 0,
                  transform:
                    i === active
                      ? "translateY(0) scale(1)"
                      : i < active
                        ? "translateY(-36px) scale(0.96)"
                        : "translateY(36px) scale(0.96)",
                }}
              >
                <div className="relative h-72 overflow-hidden">
                  <img
                    src={r.image}
                    alt=""
                    loading="lazy"
                    className="absolute inset-0 h-full w-full object-cover transition-transform duration-[2600ms] ease-out"
                    style={{ transform: i === active ? "scale(1.08)" : "scale(1)" }}
                  />
                  <span className="bg-card text-foreground absolute bottom-5 left-6 grid h-14 w-14 place-items-center rounded-2xl shadow-[var(--shadow-soft)]">
                    <r.icon
                      className={"h-6 w-6 transition-transform duration-700 " + (i === active ? "scale-110" : "scale-90")}
                      aria-hidden="true"
                    />
                  </span>
                </div>
                <div className="flex flex-1 flex-col gap-3 p-7">
                  <h3 className="text-2xl font-semibold">{r.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{r.text}</p>
                  <div className="mt-auto flex items-center gap-3">
                    <span className="text-muted-foreground text-sm tabular-nums">
                      {String(i + 1).padStart(2, "0")} / {String(n).padStart(2, "0")}
                    </span>
                    <span className="flex gap-1.5" aria-hidden="true">
                      {REASONS.map((_, d) => (
                        <span
                          key={d}
                          className={
                            "h-1.5 rounded-full transition-all duration-500 " +
                            (d === i ? "bg-accent w-6" : "bg-border w-1.5")
                          }
                        />
                      ))}
                    </span>
                  </div>
                </div>
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
      {/* SLIDE PRINCIPALE */}
      <ScrollVars
        as="section"
        mode="hero"
        className="relative isolate h-[100svh] min-h-[560px] overflow-hidden bg-[#0e1311]"
      >
        <img
          src={heroSmile}
          alt="Primo piano del sorriso di una paziente durante la scelta del colore dei denti"
          width={2000}
          height={1333}
          fetchPriority="high"
          className="photo-settle absolute inset-0 -z-20 h-full w-full object-cover object-[58%_50%]"
          style={{
            transform: "scale(calc(1 + var(--p) * 0.06))",
            transformOrigin: "50% 50%",
          }}
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10 bg-[linear-gradient(0deg,rgb(11_14_13/0.85)_0%,rgb(11_14_13/0.4)_38%,transparent_70%),linear-gradient(180deg,rgb(11_14_13/0.78)_0%,rgb(11_14_13/0.4)_14%,transparent_32%)]"
        />
        <div className="absolute inset-x-0 bottom-0 mx-auto max-w-6xl px-5 pb-12 md:pb-16">
          <h1 className="text-[2.15rem] leading-[1.05] font-semibold whitespace-nowrap text-white sm:text-5xl lg:text-7xl">
            <Words text="Liberi di" startDelay={250} />{" "}
            <Words className="text-peach" text="sorridere" startDelay={250 + 2 * 80} />
          </h1>
          <div className="animate-fade-up mt-8 [animation-delay:1.1s]">
            <Button
              variant="outline"
              size="xl"
              className="group border-white/60 bg-white/10 text-white backdrop-blur-md hover:border-white hover:bg-white/20 hover:text-white"
              asChild
            >
              <Link to="/servizi">
                Scopri i trattamenti{" "}
                <ArrowRight
                  className="transition-transform duration-300 group-hover:translate-x-1"
                  aria-hidden="true"
                />
              </Link>
            </Button>
          </div>
        </div>
        <div
          aria-hidden="true"
          className="animate-fade-up absolute right-5 bottom-12 grid h-12 w-12 max-sm:hidden place-items-center rounded-full border border-white/30 bg-white/15 text-white backdrop-blur-xl [animation-delay:1.4s] md:right-10 md:bottom-16"
        >
          <ArrowDown className="scroll-cue h-5 w-5" />
        </div>
      </ScrollVars>

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
          <Reveal>
            <div
              style={{
                transform: "translate3d(0, calc(var(--p) * -70px), 0)",
                opacity: "calc(1 - var(--p) * 1.25)",
              }}
            >
              <Badge
                variant="secondary"
                className="mb-5 rounded-full px-3 py-1 text-xs font-medium"
              >
                Milano · Aperti anche il sabato per le urgenze
              </Badge>
              <h2 className="text-4xl leading-[1.05] font-semibold text-balance sm:text-5xl lg:text-6xl">
                Cure serene, <span className="text-peach">spiegate passo dopo passo</span>
              </h2>
              <p className="text-muted-foreground mt-6 max-w-lg text-lg leading-relaxed">
                Uno studio pensato anche per chi il dentista lo teme: tempi distesi, ogni passaggio
                spiegato prima di farlo e la possibilità di fermarsi quando vuoi.
              </p>
              <div className="mt-8">
                <Button variant="hero" size="xl" className="sheen group" asChild>
                  <Link to="/prenota">
                    <CalendarPlus aria-hidden="true" /> Prenota una visita
                  </Link>
                </Button>
              </div>
              <dl className="border-border/70 mt-10 grid max-w-md grid-cols-3 gap-4 border-t pt-6">
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
          </Reveal>
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
        className="bg-[#0e1311] text-[#f1f0ea] py-4 text-sm font-medium"
        aria-hidden="true"
      >
        <Marquee items={services.map((s) => s.name)} />
      </div>

      {/* SERVIZI */}
      <section className="pt-20 pb-10" aria-labelledby="servizi-title">
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
            className="text-muted-foreground mt-4 max-w-2xl text-lg leading-relaxed"
            text="Dalla prevenzione quotidiana alle riabilitazioni complesse, con un unico team che ti segue dall'inizio alla fine."
          />
        </div>

        <CardMarquee label="Trattamenti">
          {services.map((s, i) => (
            <li key={s.id}>
              <div className="h-full">
                <Link
                  to="/servizi/$slug"
                  params={{ slug: s.slug }}
                  className="surface-card group flex h-full flex-col p-6"
                >
                  <div className="relative -mx-6 -mt-6 mb-9 aspect-[4/3] rounded-t-[inherit]">
                    <div className="absolute inset-0 overflow-hidden rounded-t-[inherit]">
                      <img
                        src={TREATMENT_PHOTOS[s.slug] ?? TREATMENT_ORDER[i % TREATMENT_ORDER.length]}
                        alt=""
                        loading="lazy"
                        className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                      />
                    </div>
                    <span className="bg-card text-primary group-hover:bg-primary group-hover:text-primary-foreground absolute bottom-0 left-6 grid h-12 w-12 translate-y-1/2 place-items-center rounded-2xl shadow-[var(--shadow-soft)] transition-colors duration-300">
                      <ServiceIcon
                        name={s.icon}
                        className="h-5 w-5 transition-transform duration-500 ease-out group-hover:scale-110 group-hover:-rotate-6"
                      />
                    </span>
                  </div>
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
              </div>
            </li>
          ))}
        </CardMarquee>
      </section>

      {/* PERCHÉ NOI */}
      <section className="band-light mx-3 rounded-[2rem] md:mx-5" aria-labelledby="perche-title">
        <div className="mx-auto max-w-6xl px-5 py-14 lg:hidden motion-reduce:block">
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
              <span className="text-foreground block font-semibold">Prima</span>
              Sorriso con smalto opacizzato da caffè e tè, lieve disallineamento degli incisivi.
            </p>
            <p>
              <span className="text-foreground block font-semibold">Dopo</span>
              Sbiancamento professionale e rifinitura estetica: 4 gradi di colore in una seduta.
            </p>
          </div>
        </Reveal>
      </section>

      {/* CTA FINALE */}
      <section className="band-dark mx-3 mb-3 rounded-[2rem] md:mx-5 md:mb-5">
        <div className="mx-auto max-w-4xl px-5 py-20 text-center">
          <Reveal variant="blur">
            <h2 className="text-foreground text-3xl font-semibold text-balance md:text-4xl">
              Prenota la tua visita in meno di due minuti
            </h2>
            <p className="text-muted-foreground mx-auto mt-4 max-w-xl">
              Scegli il trattamento e l'orario che preferisci. Ricevi conferma immediata
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
                className="border-foreground/40 text-foreground bg-transparent hover:bg-foreground/10"
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
