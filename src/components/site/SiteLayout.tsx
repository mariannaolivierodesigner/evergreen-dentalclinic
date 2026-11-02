import type { ReactNode } from "react";
import { SiteHeader } from "./SiteHeader";
import { SiteFooter } from "./SiteFooter";
import { ScrollProgress, ScrollVars, Words } from "./motion";

export function SiteLayout({
  children,
  footerClassName,
  progress = true,
}: {
  children: ReactNode;
  footerClassName?: string;
  /** Scroll progress bar (public site only). */
  progress?: boolean;
}) {
  return (
    <div className="flex min-h-dvh flex-col">
      {progress && <ScrollProgress />}
      <SiteHeader />
      <main className="overflow-x-clip">{children}</main>
      <SiteFooter className={footerClassName ?? ""} />
    </div>
  );
}

export function PageHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
}) {
  return (
    <ScrollVars
      as="section"
      mode="hero"
      className="bg-calm border-border relative overflow-hidden border-b"
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
        {eyebrow && (
          <p className="text-primary animate-fade-up mb-3 text-xs font-semibold tracking-[0.18em] uppercase">
            {eyebrow}
          </p>
        )}
        <h1 className="max-w-3xl text-4xl font-semibold text-balance md:text-6xl">
          <Words text={title} />
        </h1>
        {description && (
          <p className="text-muted-foreground animate-fade-up mt-4 max-w-2xl text-lg leading-relaxed [animation-delay:400ms]">
            {description}
          </p>
        )}
      </div>
    </ScrollVars>
  );
}
