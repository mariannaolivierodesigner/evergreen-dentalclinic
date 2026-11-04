import { Link } from "@tanstack/react-router";

/** Round "o" mark: four soft lobes, used in place of the first "o" of the name. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="2.6 2.6 18.8 18.8" aria-hidden="true" className={className} fill="currentColor">
      <circle cx="8.2" cy="8.2" r="5.6" />
      <circle cx="15.8" cy="8.2" r="5.6" />
      <circle cx="8.2" cy="15.8" r="5.6" />
      <circle cx="15.8" cy="15.8" r="5.6" />
      <rect x="8.2" y="8.2" width="7.6" height="7.6" />
    </svg>
  );
}

export function Logo({
  className,
  symbolOnlyMobile = false,
  ivoryMarkMobile = false,
}: {
  className?: string | undefined;
  /** Su telefono (sotto md) mostra solo il simbolo, senza il nome per esteso. */
  symbolOnlyMobile?: boolean;
  /** Su telefono il simbolo prende il colore del testo (avorio sopra la foto) invece del verde. */
  ivoryMarkMobile?: boolean;
}) {
  return (
    <Link to="/" className={className} aria-label="Studio Dentistico Longobardi — home">
      <span
        className={
          symbolOnlyMobile
            ? "font-display hidden items-baseline text-[1.65rem] leading-none font-bold tracking-tight md:flex"
            : "font-display flex items-baseline text-[1.65rem] leading-none font-bold tracking-tight"
        }
      >
        L
        <LogoMark className="mx-[0.04em] h-[0.56em] w-[0.56em] shrink-0 self-baseline text-[oklch(0.76_0.05_160)]" />
        ngobardi
      </span>
      {symbolOnlyMobile && (
        <LogoMark
          className={
            ivoryMarkMobile
              ? "block h-9 w-9 md:hidden"
              : "block h-9 w-9 text-[oklch(0.76_0.05_160)] md:hidden"
          }
        />
      )}
    </Link>
  );
}
