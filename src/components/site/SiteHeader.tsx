import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { ArrowUpRight, CalendarPlus, Download, LogOut, Menu, User, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useRoles, useSession } from "@/hooks/useAuth";
import { useInstallPrompt } from "@/hooks/use-install-prompt";
import { supabase } from "@/integrations/supabase/client";
import { Logo } from "./Logo";
import { cn } from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";

const NAV = [
  { to: "/servizi", label: "Trattamenti" },
  { to: "/chi-siamo", label: "Chi siamo" },
  { to: "/blog", label: "Magazine" },
  { to: "/contatti", label: "Contatti" },
] as const;

export function SiteHeader() {
  const overlay = useRouterState({ select: (s) => s.location.pathname === "/" });
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const { user } = useSession();
  const { isStaff } = useRoles(user?.id);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { canInstall, promptInstall } = useInstallPrompt();

  useEffect(() => {
    let last = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      const home = window.location.pathname === "/";
      setScrolled(y > (home ? window.innerHeight * 0.6 : 12));
      // hide while scrolling down so it never covers the sections; show again on scroll up
      if (y > window.innerHeight * 0.6 && y > last + 4) setHidden(true);
      else if (y < last - 4 || y < 80) setHidden(false);
      last = y;
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/", replace: true });
  }

  // On the home, once the photo slide is behind us the pill turns into a slim,
  // full-width rectangular bar with a hamburger menu.
  const compact = overlay && scrolled;

  return (
    <header
      className={cn(
        "z-50 transition-[transform,background-color] duration-300",
        hidden && !open && "-translate-y-full",
        overlay
          ? compact
            ? "fixed inset-x-0 top-0 border-b border-white/15 bg-[rgb(32_32_31/0.88)] backdrop-blur-xl"
            : "fixed inset-x-0 top-0"
          : cn(
              "sticky top-0",
              scrolled
                ? "bg-background/85 border-border border-b backdrop-blur-xl"
                : "bg-transparent",
            ),
      )}
    >
      <div
        className={cn(
          "mx-auto flex h-18 max-w-6xl items-center justify-between px-5 py-3",
          overlay &&
            !compact &&
            "h-16",
          compact &&
            "h-14",
        )}
      >
        <Logo symbolOnlyMobile className={overlay ? "text-white" : undefined} />

        <nav
          aria-label="Navigazione principale"
          className={cn("hidden items-center gap-1", !compact && "md:flex")}
        >
          {NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                "rounded-full px-4 py-2 text-sm font-medium transition-colors",
                overlay
                  ? "text-white/90 hover:bg-white/12 hover:text-[oklch(0.88_0.05_160)]"
                  : "hover:text-primary hover:bg-secondary",
              )}
              activeProps={{
                className: overlay
                  ? "text-[oklch(0.88_0.05_160)] bg-white/12"
                  : "text-primary bg-secondary",
              }}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className={cn("hidden items-center gap-2", !compact && "md:flex")}>
          <Button variant="hero" asChild>
            <Link to="/prenota">
              <CalendarPlus aria-hidden="true" /> Prenota una visita
            </Link>
          </Button>
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "gap-2",
                    overlay &&
                      "border-white/60 bg-white/10 text-white hover:border-white hover:bg-white/20 hover:text-white",
                  )}
                >
                  <User aria-hidden="true" />
                  Accedi
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="truncate text-xs font-normal">
                  {user.email}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/area-personale">Area personale</Link>
                </DropdownMenuItem>
                {isStaff && (
                  <DropdownMenuItem asChild>
                    <Link to="/staff">Gestionale studio</Link>
                  </DropdownMenuItem>
                )}
                {isStaff && canInstall && (
                  <DropdownMenuItem onSelect={promptInstall}>
                    <Download aria-hidden="true" /> Installa app
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={signOut}>
                  <LogOut aria-hidden="true" /> Esci
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button
              variant="outline"
              className={cn(
                overlay &&
                  "border-white/60 bg-white/10 text-white hover:border-white hover:bg-white/20 hover:text-white",
              )}
              asChild
            >
              <Link to="/auth">
                <User aria-hidden="true" /> Accedi
              </Link>
            </Button>
          )}
        </div>

        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "-mr-2 h-12 w-12 [&_svg]:!size-8",
            !compact && "md:hidden",
            overlay && "text-white hover:bg-white/12 hover:text-white",
          )}
          aria-label={open ? "Chiudi menu" : "Apri menu"}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X strokeWidth={1.5} /> : <Menu strokeWidth={1.5} />}
        </Button>
      </div>

      {open && <MobileDrawer onClose={() => setOpen(false)} isStaff={isStaff} signedIn={!!user} />}
    </header>
  );
}

/** Menu laterale (mobile): pannello che scorre da destra su sfondo sfocato. */
function MobileDrawer({
  onClose,
  isStaff,
  signedIn,
}: {
  onClose: () => void;
  isStaff: boolean;
  signedIn: boolean;
}) {
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  const link =
    "group flex items-center justify-between border-b border-white/15 py-4 text-xl font-medium tracking-tight";

  return createPortal(
    <div className="fixed inset-0 z-[60]" role="dialog" aria-modal="true" aria-label="Menu">
      <button
        type="button"
        aria-label="Chiudi menu"
        onClick={onClose}
        className="drawer-backdrop absolute inset-0 bg-[rgb(32_32_31/0.5)] backdrop-blur-sm"
      />
      <div className="drawer-panel absolute inset-y-0 right-0 flex w-[min(86vw,22rem)] flex-col bg-[#20201f] px-5 pt-3 pb-8 text-white shadow-[-24px_0_60px_-20px_rgb(0_0_0/0.5)]">
        <div className="flex h-14 items-center justify-between">
          <Logo symbolOnlyMobile className="text-white" />
          <Button
            variant="ghost"
            size="icon"
            className="-mr-2 h-12 w-12 text-white hover:bg-white/12 hover:text-white [&_svg]:!size-8"
            aria-label="Chiudi menu"
            onClick={onClose}
          >
            <X strokeWidth={1.5} />
          </Button>
        </div>
        <nav aria-label="Navigazione mobile" className="mt-6 flex flex-col">
          {NAV.map((item) => (
            <Link key={item.to} to={item.to} onClick={onClose} className={link}>
              {item.label}
              <ArrowUpRight
                aria-hidden="true"
                className="h-5 w-5 text-[oklch(0.8_0.05_160)] opacity-70 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
              />
            </Link>
          ))}
          {isStaff && (
            <Link to="/staff" onClick={onClose} className={link}>
              Gestionale studio
              <ArrowUpRight aria-hidden="true" className="h-5 w-5 text-[oklch(0.8_0.05_160)] opacity-70" />
            </Link>
          )}
        </nav>
        <div className="mt-auto space-y-3 pt-8">
          <Button variant="hero" className="w-full" size="lg" asChild>
            <Link to="/prenota" onClick={onClose}>
              <CalendarPlus aria-hidden="true" /> Prenota una visita
            </Link>
          </Button>
          <Button
            variant="outline"
            className="w-full border-white/50 bg-white/10 text-white hover:border-white hover:bg-white/20 hover:text-white"
            size="lg"
            asChild
          >
            <Link to={signedIn ? "/area-personale" : "/auth"} onClick={onClose}>
              <User aria-hidden="true" /> Accedi
            </Link>
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
