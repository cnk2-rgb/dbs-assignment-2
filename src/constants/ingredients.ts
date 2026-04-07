/** Maps lowercase keyword to typical shelf life in days */
export const SHELF_LIFE_DAYS: Record<string, number> = {
  // Multi-word first (matched before single words)
  "ice cream": 60,
  "cream cheese": 14,
  "sour cream": 14,
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

export function getMatchingIngredients(input: string): string[] {
  const lower = input.toLowerCase().trim();
  if (!lower) return [];
  return Object.keys(SHELF_LIFE_DAYS).filter((keyword) =>
    keyword.startsWith(lower)
  );
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
