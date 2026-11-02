import { useEffect, useState } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { CalendarPlus, Download, LogOut, Menu, User, X } from "lucide-react";
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
  const { user } = useSession();
  const { isStaff } = useRoles(user?.id);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { canInstall, promptInstall } = useInstallPrompt();

  useEffect(() => {
    const onScroll = () =>
      setScrolled(
        window.scrollY > (window.location.pathname === "/" ? window.innerHeight * 0.6 : 12),
      );
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

  return (
    <header
      className={cn(
        "z-50 transition-all duration-300",
        overlay
          ? "fixed inset-x-3 top-3 md:inset-x-6"
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
            "h-16 rounded-full border border-white/25 px-4 shadow-[0_8px_32px_-8px_rgb(0_0_0/0.35)] backdrop-blur-xl backdrop-saturate-150 transition-colors duration-300 md:px-6",
          overlay && (scrolled ? "bg-[oklch(0.3_0.05_222/0.82)]" : "bg-[oklch(0.3_0.05_222/0.38)]"),
        )}
      >
        <Logo className={overlay ? "text-white" : undefined} />

        <nav aria-label="Navigazione principale" className="hidden items-center gap-1 md:flex">
          {NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                "rounded-full px-4 py-2 text-sm font-medium transition-colors",
                overlay
                  ? "text-white/90 hover:bg-white/12 hover:text-[oklch(0.86_0.1_168)]"
                  : "hover:text-primary hover:bg-secondary",
              )}
              activeProps={{
                className: overlay
                  ? "text-[oklch(0.86_0.1_168)] bg-white/12"
                  : "text-primary bg-secondary",
              }}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "gap-2",
                    overlay && "text-white hover:bg-white/12 hover:text-[oklch(0.86_0.1_168)]",
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
              variant="ghost"
              size="sm"
              className={cn(
                overlay && "text-white hover:bg-white/12 hover:text-[oklch(0.86_0.1_168)]",
              )}
              asChild
            >
              <Link to="/auth">
                <User aria-hidden="true" /> Accedi
              </Link>
            </Button>
          )}
          <Button variant="hero" asChild>
            <Link to="/prenota">
              <CalendarPlus aria-hidden="true" /> Prenota una visita
            </Link>
          </Button>
        </div>

        <Button
          variant="ghost"
          size="icon"
          className={cn("md:hidden", overlay && "text-white hover:bg-white/12 hover:text-white")}
          aria-label={open ? "Chiudi menu" : "Apri menu"}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X /> : <Menu />}
        </Button>
      </div>

      {open && (
        <div
          className={cn(
            "animate-fade-up px-5 pt-2 pb-6 md:hidden",
            overlay
              ? "mt-2 rounded-3xl border border-white/25 bg-[oklch(0.3_0.05_222/0.78)] text-white backdrop-blur-xl"
              : "bg-background border-border border-t",
          )}
        >
          <nav aria-label="Navigazione mobile" className="flex flex-col">
            {NAV.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setOpen(false)}
                className={cn(
                  "border-b py-3 text-base font-medium",
                  overlay ? "border-white/20" : "border-border/60",
                )}
              >
                {item.label}
              </Link>
            ))}
            <Link
              to={user ? "/area-personale" : "/auth"}
              onClick={() => setOpen(false)}
              className={cn(
                "border-b py-3 text-base font-medium",
                overlay ? "border-white/20" : "border-border/60",
              )}
            >
              {user ? "Area personale" : "Accedi"}
            </Link>
            {isStaff && (
              <Link
                to="/staff"
                onClick={() => setOpen(false)}
                className={cn(
                  "border-b py-3 text-base font-medium",
                  overlay ? "border-white/20" : "border-border/60",
                )}
              >
                Gestionale studio
              </Link>
            )}
          </nav>
          <Button variant="hero" className="mt-5 w-full" size="lg" asChild>
            <Link to="/prenota" onClick={() => setOpen(false)}>
              <CalendarPlus aria-hidden="true" /> Prenota una visita
            </Link>
          </Button>
        </div>
      )}
    </header>
  );
}
