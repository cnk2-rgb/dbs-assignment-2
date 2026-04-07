import { Cuisine } from "@/types";

/** Maps lowercase keyword to typical shelf life in days */
export const SHELF_LIFE_DAYS: Record<string, number> = {
  // Multi-word first (matched before single words)
  "ice cream": 60,
  "cream cheese": 14,
  "sour cream": 14,
  "sesame oil": 365,
  "soy sauce": 730,
  "fish sauce": 730,
  "rice vinegar": 730,
  "rice wine": 365,
  "red pepper flakes": 365,
  "sweet potato": 21,
  // Korean ingredients
  gochugaru: 365,
  gochujang: 365,
  doenjang: 365,
  kimchi: 90,
  tofu: 7,
  "dried seaweed": 365,
  seaweed: 5,
  miso: 365,
  napa: 14,
  perilla: 5,
  radish: 14,
  "bean sprouts"
  : 3,
  scallion: 7,
  garlic: 30,
  ginger: 21,
  // Dairy
  milk: 7,
  yogurt: 14,
  cheese: 21,
  butter: 30,
  cream: 7,
  // Meat & Seafood
  chicken: 3,
  beef: 5,
  pork: 5,
  fish: 2,
  salmon: 2,
  shrimp: 3,
  turkey: 3,
  // Produce
  lettuce: 5,
  spinach: 5,
  tomato: 7,
  apple: 21,
  banana: 5,
  avocado: 4,
  carrot: 21,
  onion: 30,
  potato: 21,
  berries: 5,
  // Pantry & Bread
  bread: 5,
  rice: 365,
  pasta: 730,
  egg: 21,
  flour: 180,
  cereal: 180,
};

/** Maps ingredient keywords to their cuisine */
export const INGREDIENT_CUISINE: Record<string, Cuisine> = {
  gochugaru: "korean",
  gochujang: "korean",
  doenjang: "korean",
  kimchi: "korean",
  "dried seaweed": "korean",
  perilla: "korean",
  "red pepper flakes": "korean",
  napa: "korean",
  "bean sprouts": "korean",
  scallion: "korean",
  miso: "japanese",
  tofu: "korean",
  "sesame oil": "korean",
  "soy sauce": "korean",
  "fish sauce": "korean",
  "rice vinegar": "japanese",
  "rice wine": "korean",
  seaweed: "korean",
};

export function getMatchingIngredients(input: string): string[] {
  const lower = input.toLowerCase().trim();
  if (!lower) return [];
  return Object.keys(SHELF_LIFE_DAYS).filter((keyword) =>
    keyword.startsWith(lower)
  );
}

export function suggestCuisine(ingredientName: string): Cuisine | null {
  const lower = ingredientName.toLowerCase().trim();
  if (!lower) return null;
  for (const [keyword, cuisine] of Object.entries(INGREDIENT_CUISINE)) {
    if (lower.includes(keyword)) return cuisine;
  }
  return null;
}

export function suggestExpiryDate(ingredientName: string): string | null {
  const lower = ingredientName.toLowerCase().trim();
  if (!lower) return null;

  for (const [keyword, days] of Object.entries(SHELF_LIFE_DAYS)) {
    if (lower.includes(keyword)) {
      const date = new Date();
      date.setDate(date.getDate() + days);
      return date.toISOString().split("T")[0];
    }
  }
  return null;
}
