import { useEffect, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { CalendarPlus, LogOut, Menu, User, X } from "lucide-react";
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
import { supabase } from "@/integrations/supabase/client";
import { Logo } from "./Logo";
import { cn } from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";

const NAV = [
  { to: "/servizi", label: "Servizi" },
  { to: "/chi-siamo", label: "Chi siamo" },
  { to: "/blog", label: "Risorse" },
  { to: "/contatti", label: "Contatti" },
] as const;

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { user } = useSession();
  const { isStaff } = useRoles(user?.id);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
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
        "sticky top-0 z-50 transition-all duration-300",
        scrolled ? "bg-background/85 border-border border-b backdrop-blur-xl" : "bg-transparent",
      )}
    >
      <div className="mx-auto flex h-18 max-w-6xl items-center justify-between px-5 py-3">
        <Logo />

        <nav aria-label="Navigazione principale" className="hidden items-center gap-1 md:flex">
          {NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="hover:text-primary hover:bg-secondary rounded-full px-4 py-2 text-sm font-medium transition-colors"
              activeProps={{ className: "text-primary bg-secondary" }}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-2">
                  <User aria-hidden="true" />
                  Il mio account
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
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={signOut}>
                  <LogOut aria-hidden="true" /> Esci
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button variant="ghost" size="sm" asChild>
              <Link to="/auth">Accedi</Link>
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
          className="md:hidden"
          aria-label={open ? "Chiudi menu" : "Apri menu"}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X /> : <Menu />}
        </Button>
      </div>

      {open && (
        <div className="bg-background border-border animate-fade-up border-t px-5 pt-2 pb-6 md:hidden">
          <nav aria-label="Navigazione mobile" className="flex flex-col">
            {NAV.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setOpen(false)}
                className="border-border/60 border-b py-3 text-base font-medium"
              >
                {item.label}
              </Link>
            ))}
            <Link
              to={user ? "/area-personale" : "/auth"}
              onClick={() => setOpen(false)}
              className="border-border/60 border-b py-3 text-base font-medium"
            >
              {user ? "Area personale" : "Accedi"}
            </Link>
            {isStaff && (
              <Link
                to="/staff"
                onClick={() => setOpen(false)}
                className="border-border/60 border-b py-3 text-base font-medium"
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