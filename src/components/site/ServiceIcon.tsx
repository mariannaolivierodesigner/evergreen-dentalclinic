import { AlignCenter, Anchor, Baby, Siren, Sparkles, Sun, type LucideIcon } from "lucide-react";

const ICONS: Record<string, LucideIcon> = {
  Sparkles,
  AlignCenter,
  Anchor,
  Sun,
  Baby,
  Siren,
};

export function ServiceIcon({ name, className }: { name: string; className?: string }) {
  const Icon = ICONS[name] ?? Sparkles;
  return <Icon className={className} aria-hidden="true" />;
}