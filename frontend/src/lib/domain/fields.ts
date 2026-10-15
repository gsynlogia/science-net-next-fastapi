export const FIELD_SLUGS = [
  "computer_science",
  "physics",
  "biology",
  "chemistry",
  "mathematics",
  "medicine",
  "social_sciences",
] as const;

export type FieldSlug = (typeof FIELD_SLUGS)[number];

export const FIELD_NAMES: Record<FieldSlug, string> = {
  computer_science: "Informatyka",
  physics: "Fizyka",
  biology: "Biologia",
  chemistry: "Chemia",
  mathematics: "Matematyka",
  medicine: "Medycyna",
  social_sciences: "Nauki społeczne",
};
