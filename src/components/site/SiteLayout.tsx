import { useLayoutEffect, type ReactNode } from "react";
import { SiteHeader } from "./SiteHeader";
import { SiteFooter } from "./SiteFooter";
import { ScrollProgress, ScrollVars, Words } from "./motion";

/** Attiva il tema scuro su <html> finché il componente è montato. */
export function useSiteDark(active = true) {
  useLayoutEffect(() => {
    if (!active) return;
    document.documentElement.classList.add("site-dark");
    return () => document.documentElement.classList.remove("site-dark");
  }, [active]);
}

export function SiteLayout({
  children,
  footerClassName,
  progress = true,
  theme = "dark",
}: {
  children: ReactNode;
  footerClassName?: string;
  /** Scroll progress bar (public site only). */
  progress?: boolean;
  /** "dark" per il sito pubblico, "light" per il gestionale. */
  theme?: "dark" | "light";
}) {
  // anche <html>, così dialog, menu e notifiche (che escono dal contenuto) usano gli stessi colori
  useSiteDark(theme === "dark");
  return (
    <div className={`flex min-h-dvh flex-col ${theme === "dark" ? "site-dark" : ""}`}>
      {progress && <ScrollProgress />}
      <SiteHeader />
      <main className="overflow-x-clip">{children}</main>
      <SiteFooter className={footerClassName ?? ""} />
    </div>
  );
}

export function PageHeader({
  title,
  description,
  children,
  tone,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  children?: ReactNode;
  tone?: "dark";
}) {
  const dark = tone === "dark";
  return (
    <ScrollVars
      as="section"
      mode="hero"
      className={`border-border relative overflow-hidden border-b ${dark ? "band-dark" : "bg-calm"}`}
      style={
        dark
          ? { background: "linear-gradient(135deg, #3a5c4b 0%, #1a2a22 42%, #0b0e0d 100%)" }
          : undefined
      }
    >
      <div
        aria-hidden="true"
        className="bg-primary-soft animate-float absolute -top-24 -right-20 h-72 w-72 rounded-full opacity-60 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="bg-accent-soft animate-float absolute -bottom-32 -left-16 h-72 w-72 rounded-full opacity-70 blur-3xl [animation-delay:1.5s]"
      />
      <div
        className="relative mx-auto max-w-6xl px-5 py-16 md:py-24"
        style={{
          transform: "translate3d(0, calc(var(--p) * -40px), 0)",
          opacity: "calc(1 - var(--p) * 1.1)",
        }}
      >
        <h1 className="max-w-3xl text-4xl font-semibold text-balance md:text-6xl">
          {(() => {
            // seconda parte del titolo in pesca (dopo la virgola, oppure le ultime due parole)
            const comma = title.indexOf(",");
            const w = title.split(" ");
            const head = comma > 0 ? title.slice(0, comma + 1) : w.slice(0, -2).join(" ");
            const tail = comma > 0 ? title.slice(comma + 2) : w.slice(-2).join(" ");
            if (!head || !tail) return <Words text={title} />;
            return (
              <>
                <Words text={head} />{" "}
                <Words
                  className="text-peach"
                  text={tail}
                  startDelay={head.split(" ").length * 70}
                />
              </>
            );
          })()}
        </h1>
        {description && (
          <p className="text-muted-foreground animate-fade-up mt-4 max-w-2xl text-lg leading-relaxed [animation-delay:400ms]">
            {description}
          </p>
        )}
        {children && <div className="animate-fade-up mt-6 [animation-delay:500ms]">{children}</div>}
      </div>
    </ScrollVars>
  );
}
