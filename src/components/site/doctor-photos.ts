import elena from "@/assets/doc-elena.svg";
import marco from "@/assets/doc-marco.svg";
import giulia from "@/assets/doc-giulia.svg";
import luca from "@/assets/doc-luca.svg";

export const DOCTOR_PHOTOS: Record<string, string> = {
  "Dott.ssa Elena Ferraro": elena,
  "Dott. Marco Bianchi": marco,
  "Dott.ssa Giulia Rinaldi": giulia,
  "Dott. Luca Moretti": luca,
};

export function doctorPhoto(name: string) {
  return DOCTOR_PHOTOS[name];
}

export function initials(name: string) {
  return name
    .replace(/Dott\.ssa|Dott\./g, "")
    .trim()
    .split(" ")
    .slice(0, 2)
    .map((p) => p[0])
    .join("");
}
