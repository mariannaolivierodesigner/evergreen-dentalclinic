import brushing from "@/assets/treat-1.jpg";
import aligners from "@/assets/treat-2.jpg";
import model from "@/assets/treat-3.jpg";
import whitening from "@/assets/treat-4.jpg";
import chair from "@/assets/treat-5.jpg";
import xray from "@/assets/treat-6.jpg";
import calm from "@/assets/hero-studio.jpg";
import smile from "@/assets/hero-smile.jpg";

/** Foto di copertina degli articoli: per slug, altrimenti per categoria. */
const BY_SLUG: Record<string, string> = {
  "come-spazzolare-i-denti": brushing,
  "paura-del-dentista": calm,
};

const BY_CATEGORY: Record<string, string> = {
  prevenzione: brushing,
  igiene: brushing,
  benessere: calm,
  ortodonzia: aligners,
  estetica: smile,
  sbiancamento: whitening,
  bambini: whitening,
  implantologia: xray,
  radiografie: xray,
  protesi: model,
};

export function postImage(slug: string, category: string): string {
  return BY_SLUG[slug] ?? BY_CATEGORY[category.trim().toLowerCase()] ?? chair;
}
