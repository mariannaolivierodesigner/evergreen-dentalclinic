import type { ReactNode } from "react";
import { SiteHeader } from "./SiteHeader";
import { SiteFooter } from "./SiteFooter";

export function SiteLayout({
  children,
  footerClassName,
}: {
  children: ReactNode;
  footerClassName?: string;
}) {
  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />
      <main>{children}</main>
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
    <section className="bg-calm border-border border-b">
      <div className="mx-auto max-w-6xl px-5 py-16 md:py-20">
        {eyebrow && (
          <p className="text-primary mb-3 text-xs font-semibold tracking-[0.18em] uppercase">
            {eyebrow}
          </p>
        )}
        <h1 className="max-w-3xl text-4xl font-semibold text-balance md:text-5xl">{title}</h1>
        {description && (
          <p className="text-muted-foreground mt-4 max-w-2xl text-lg leading-relaxed">
            {description}
          </p>
        )}
      </div>
    </section>
  );
}
