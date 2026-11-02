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

export function Logo({ className }: { className?: string }) {
  return (
    <Link to="/" className={className} aria-label="Studio Dentistico Longobardi — home">
      <span className="font-display flex items-baseline text-[1.65rem] leading-none font-bold tracking-tight">
        L
        <LogoMark className="mx-[0.03em] h-[0.8em] w-[0.8em] shrink-0 self-baseline text-[oklch(0.72_0.1_168)]" />
        ngobardi
      </span>
    </Link>
  );
}
