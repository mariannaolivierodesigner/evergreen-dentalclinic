import { Link } from "@tanstack/react-router";
import { Clock, Instagram, Facebook, Mail, MapPin, Phone } from "lucide-react";
import { STUDIO } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Logo } from "./Logo";

export function SiteFooter({ className }: { className?: string }) {
  return (
    <footer className={cn("bg-secondary/60 border-border mt-24 border-t", className)}>
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-14 md:grid-cols-4">
        <div className="md:col-span-1">
          <Logo />
          <p className="text-muted-foreground mt-4 text-sm leading-relaxed">
            Studio odontoiatrico a Milano. Prevenzione, estetica e cure complesse con un approccio
            attento alle persone ansiose.
          </p>
          <div className="mt-5 flex gap-2">
            <a
              href="https://instagram.com"
              aria-label="Instagram dello studio"
              className="bg-background hover:text-primary grid h-10 w-10 place-items-center rounded-full transition-colors"
            >
              <Instagram className="h-4 w-4" aria-hidden="true" />
            </a>
            <a
              href="https://facebook.com"
              aria-label="Facebook dello studio"
              className="bg-background hover:text-primary grid h-10 w-10 place-items-center rounded-full transition-colors"
            >
              <Facebook className="h-4 w-4" aria-hidden="true" />
            </a>
          </div>
        </div>

        <div>
          <h2 className="font-display mb-4 text-sm font-semibold">Contatti</h2>
          <ul className="text-muted-foreground space-y-3 text-sm">
            <li className="flex gap-2">
              <MapPin className="text-primary mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              {STUDIO.address}
            </li>
            <li className="flex gap-2">
              <Phone className="text-primary mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              <a href={STUDIO.phoneHref} className="hover:text-primary">
                {STUDIO.phone}
              </a>
            </li>
            <li className="flex gap-2">
              <Mail className="text-primary mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              <a href={`mailto:${STUDIO.email}`} className="hover:text-primary">
                {STUDIO.email}
              </a>
            </li>
          </ul>
        </div>

        <div>
          <h2 className="font-display mb-4 text-sm font-semibold">Orari</h2>
          <ul className="text-muted-foreground space-y-2 text-sm">
            {STUDIO.hours.map((h) => (
              <li key={h.day} className="flex items-start gap-2">
                <Clock className="text-primary mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                <span>
                  <span className="text-foreground block font-medium">{h.day}</span>
                  {h.value}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="font-display mb-4 text-sm font-semibold">Dove siamo</h2>
          <div className="border-border overflow-hidden rounded-2xl border">
            <iframe
              title="Mappa dello Studio Dentistico Evergreen"
              src="https://www.openstreetmap.org/export/embed.html?bbox=9.155%2C45.451%2C9.185%2C45.469&layer=mapnik&marker=45.460%2C9.170"
              className="h-44 w-full"
              loading="lazy"
            />
          </div>
        </div>
      </div>

      <div className="border-border border-t">
        <div className="text-muted-foreground mx-auto flex max-w-6xl flex-col gap-3 px-5 py-6 text-xs sm:flex-row sm:items-center sm:justify-between">
          <p>{`© ${new Date().getFullYear()} Studio Dentistico Evergreen · P.IVA 09876543210`}</p>
          <nav aria-label="Note legali" className="flex gap-4">
            <Link to="/privacy" className="hover:text-primary">
              Privacy policy
            </Link>
            <Link to="/privacy" hash="cookie" className="hover:text-primary">
              Cookie policy
            </Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}