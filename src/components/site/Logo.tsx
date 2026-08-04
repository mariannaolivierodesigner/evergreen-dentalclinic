import { Link } from "@tanstack/react-router";

export function Logo({ className }: { className?: string }) {
  return (
    <Link to="/" className={className} aria-label="Studio Dentistico Evergreen — home">
      <span className="flex items-center gap-2.5">
        <span className="grid h-9 w-9 place-items-center rounded-2xl bg-[image:var(--gradient-primary)] text-primary-foreground">
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
            <path
              d="M12 6.2c1.6-1.5 3.4-2 5-1.2 1.9 1 2.6 3.4 2 6.2-.5 2.3-1.3 4.3-2.2 6-.7 1.3-2.3 1.2-2.8-.2l-.9-2.6c-.35-1-1.9-1-2.25 0l-.9 2.6c-.5 1.4-2.1 1.5-2.8.2-.9-1.7-1.7-3.7-2.2-6-.6-2.8.1-5.2 2-6.2 1.6-.8 3.4-.3 5 1.2Z"
              fill="currentColor"
            />
          </svg>
        </span>
        <span className="font-display text-lg font-semibold tracking-tight">Evergreen</span>
      </span>
    </Link>
  );
}