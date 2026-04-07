"use client";

import { useState, useRef, useEffect } from "react";
import { Silkscreen } from "next/font/google";
import { Ingredient, Cuisine } from "@/types";
import { suggestExpiryDate, getMatchingIngredients, suggestCuisine, INGREDIENT_CUISINE } from "@/constants/ingredients";

const pixel = Silkscreen({
  weight: ["400", "700"],
  subsets: ["latin"],
});

const CUISINES: Cuisine[] = ["general", "korean", "japanese", "chinese", "other"];

const CUISINE_LABELS: Record<Cuisine, string> = {
  general: "General",
  korean: "Korean",
  japanese: "Japanese",
  chinese: "Chinese",
  other: "Other",
};

const CATEGORIES: Ingredient["category"][] = [
  "produce",
  "dairy",
  "meat",
  "pantry",
  "frozen",
  "other",
];

const CATEGORY_COLORS: Record<Ingredient["category"], string> = {
  produce: "bg-[#d4deb3] border-[#a3b07a] text-[#3d4a2a]",
  dairy: "bg-[#f5e6c8] border-[#d4b98a] text-[#6b4c2a]",
  meat: "bg-[#e8c4b8] border-[#c49080] text-[#6b2d1a]",
  pantry: "bg-[#decca8] border-[#b8a080] text-[#4a3520]",
  frozen: "bg-[#c8dce8] border-[#90b0c4] text-[#2a4a5a]",
  other: "bg-[#d5cfc5] border-[#a8a090] text-[#4a4540]",
};

const CATEGORY_LABELS: Record<Ingredient["category"], string> = {
  produce: "Produce",
  dairy: "Dairy",
  meat: "Meat & Seafood",
  pantry: "Pantry",
  frozen: "Frozen",
  other: "Other",
};

const MAX_FRIDGE_ITEMS = 25;
const FRIDGE_ROWS = 5;

function PixelFridge({ ingredients }: { ingredients: Ingredient[] }) {
  const fillLevel = Math.min(ingredients.length / MAX_FRIDGE_ITEMS, 1);
  const filledRows = Math.round(fillLevel * FRIDGE_ROWS);

  // Count by category for coloring the rows
  const catCounts: Record<string, number> = {};
  for (const ing of ingredients) {
    catCounts[ing.category] = (catCounts[ing.category] || 0) + 1;
  }
  // Sort categories by count descending to fill from bottom
  const sortedCats = Object.entries(catCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([cat]) => cat as Ingredient["category"]);

  const ROW_COLORS: Record<Ingredient["category"], string> = {
    produce: "#b8c98a",
    dairy: "#e8d4a8",
    meat: "#d4a898",
    pantry: "#c8b490",
    frozen: "#a8c4d4",
    other: "#c0b8a8",
  };

  // Assign colors to filled rows based on top categories
  const rowColors: string[] = [];
  for (let i = 0; i < filledRows; i++) {
    const cat = sortedCats[i % sortedCats.length];
    rowColors.push(cat ? ROW_COLORS[cat] : "#b8c98a");
  }

  return (
    <div className="flex flex-col items-center">
      {/* Fridge top / freezer */}
      <div className="relative" style={{ imageRendering: "pixelated" }}>
        {/* Freezer compartment */}
        <div
          className="border-4 border-[#4a3520] rounded-t-lg bg-[#d8e8f0]"
          style={{ width: 72, height: 28 }}
        >
          <div className="flex items-center justify-center h-full">
            <div className="w-8 h-0.5 bg-[#4a3520] rounded-full" />
          </div>
        </div>
        {/* Main fridge body */}
        <div
          className="border-4 border-t-0 border-[#4a3520] rounded-b-lg bg-[#f0ece4] relative overflow-hidden"
          style={{ width: 72, height: 80 }}
        >
          {/* Shelves + fill */}
          <div className="absolute inset-0 flex flex-col-reverse">
            {Array.from({ length: FRIDGE_ROWS }).map((_, i) => (
              <div
                key={i}
                className="border-t border-[#4a3520]/20 transition-all duration-500"
                style={{
                  height: `${100 / FRIDGE_ROWS}%`,
                  backgroundColor: i < filledRows ? rowColors[i] : "transparent",
                  opacity: i < filledRows ? 0.7 : 0,
                }}
              />
            ))}
          </div>
          {/* Door handle */}
          <div className="absolute right-1 top-1/2 -translate-y-1/2 w-1.5 h-6 rounded-full bg-[#4a3520]" />
        </div>
        {/* Feet */}
        <div className="flex justify-between px-2" style={{ width: 72 }}>
          <div className="w-2 h-1.5 bg-[#4a3520] rounded-b" />
          <div className="w-2 h-1.5 bg-[#4a3520] rounded-b" />
        </div>
      </div>
      {/* Label */}
      <p className={`${pixel.className} text-sm text-amber-950/60 mt-2 text-center`}>
        {ingredients.length === 0
          ? "Empty!"
          : ingredients.length >= MAX_FRIDGE_ITEMS
          ? "Full!"
          : `${Math.round(fillLevel * 100)}%`}
      </p>
    </div>
  );
}

export default function IngredientsPage() {
  const [ingredients, setIngredients] = useState<Ingredient[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("ingredients");
      if (saved) {
        try { return JSON.parse(saved); } catch { return []; }
      }
    }
    return [];
  });
  const [name, setName] = useState("");
  const [expiry, setExpiry] = useState("");
  const [category, setCategory] = useState<Ingredient["category"]>("produce");
  const [cuisine, setCuisine] = useState<Cuisine>("general");

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editExpiry, setEditExpiry] = useState("");
  const [editName, setEditName] = useState("");
  const [editCategory, setEditCategory] = useState<Ingredient["category"]>("pantry");
  const [editCuisine, setEditCuisine] = useState<Cuisine>("general");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    localStorage.setItem("ingredients", JSON.stringify(ingredients));
  }, [ingredients]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (suggestionsRef.current && !suggestionsRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function addIngredient(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    setIngredients((prev) => [
      ...prev,
      {
        id: Date.now().toString(36) + Math.random().toString(36).slice(2),
        name: trimmed,
        expiry: expiry || "",
        category,
        cuisine: category === "pantry" ? cuisine : undefined,
        addedDate: new Date().toISOString().split("T")[0],
      },
    ]);
    setName("");
    setExpiry("");
    setCuisine("general");
  }

  function handleNameChange(value: string) {
    setName(value);
    const matches = getMatchingIngredients(value);
    setSuggestions(matches);
    setShowSuggestions(matches.length > 0);
  }

  function selectSuggestion(keyword: string) {
    const capitalized = keyword.charAt(0).toUpperCase() + keyword.slice(1);
    setName(capitalized);
    setShowSuggestions(false);
    if (!expiry) {
      const suggested = suggestExpiryDate(keyword);
      if (suggested) setExpiry(suggested);
    }
    const suggestedCuisine = suggestCuisine(keyword);
    if (suggestedCuisine) {
      setCuisine(suggestedCuisine);
      if (keyword in INGREDIENT_CUISINE) setCategory("pantry");
    }
  }

  function handleNameBlur() {
    // Delay to allow click on suggestion
    setTimeout(() => {
      if (expiry) return;
      const suggested = suggestExpiryDate(name);
      if (suggested) setExpiry(suggested);
    }, 150);
  }

  function deleteIngredient(id: string) {
    setIngredients((prev) => prev.filter((i) => i.id !== id));
    setSelectedIds((prev) => { const next = new Set(prev); next.delete(id); return next; });
  }

  function clearAll() {
    setIngredients([]);
    setSelectedIds(new Set());
  }

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleSearchRecipes() {
    const selectedNames = ingredients
      .filter((i) => selectedIds.has(i.id))
      .map((i) => i.name);
    if (selectedNames.length === 0) return;
    const query = `site:maangchi.com ${selectedNames.join(" ")}`;
    window.open(`https://www.google.com/search?q=${encodeURIComponent(query)}`, "_blank", "noopener,noreferrer");
  }

  function startEditExpiry(ingredient: Ingredient) {
    setEditingId(ingredient.id);
    setEditExpiry(ingredient.expiry);
    setEditName(ingredient.name);
    setEditCategory(ingredient.category);
  }

  function startEditPantryItem(ingredient: Ingredient) {
    setEditingId(ingredient.id);
    setEditName(ingredient.name);
    setEditExpiry(ingredient.expiry);
    setEditCategory(ingredient.category);
    setEditCuisine(ingredient.cuisine || "general");
  }

  function savePantryItem(id: string) {
    const trimmed = editName.trim();
    if (!trimmed) return;
    setIngredients((prev) =>
      prev.map((i) =>
        i.id === id ? { ...i, name: trimmed, expiry: editExpiry, category: editCategory, cuisine: editCategory === "pantry" ? editCuisine : undefined } : i
      )
    );
    setEditingId(null);
  }

  function saveExpiry(id: string) {
    setIngredients((prev) =>
      prev.map((i) => (i.id === id ? { ...i, expiry: editExpiry } : i))
    );
    setEditingId(null);
  }

  function getExpiryStatus(expiry: string): "expired" | "soon" | "ok" | "none" {
    if (!expiry) return "none";
    const expiryDate = new Date(expiry + "T00:00:00").getTime();
    const now = Date.now();
    const daysLeft = (expiryDate - now) / (24 * 60 * 60 * 1000);
    if (daysLeft < 0) return "expired";
    if (daysLeft <= 3) return "soon";
    return "ok";
  }

  function formatExpiry(expiry: string): string {
    if (!expiry) return "No expiry set";
    const date = new Date(expiry + "T00:00:00");
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  }

  // Group by category
  const grouped = CATEGORIES.map((cat) => ({
    category: cat,
    items: ingredients.filter((i) => i.category === cat),
  })).filter((g) => g.items.length > 0);

  return (
    <div className="space-y-6 -mx-6 -my-8 min-h-screen bg-[#8b9e6b] font-sans" style={{ marginLeft: 'calc(-50vw + 50%)', marginRight: 'calc(-50vw + 50%)', paddingLeft: 'max(1.5rem, calc(50vw - 28rem))', paddingRight: 'max(1.5rem, calc(50vw - 28rem))', paddingTop: '2rem', paddingBottom: '2rem' }}>
      <div className="flex items-start gap-6">
        <div className="flex-1">
          <h1 className={`${pixel.className} text-4xl font-bold tracking-tight text-amber-950`}>My Kitchen</h1>
          <p className={`${pixel.className} text-lg text-amber-950/80 mt-1`}>
            {ingredients.length === 0
              ? "Track what's in your kitchen"
              : `${ingredients.length} item${ingredients.length !== 1 ? "s" : ""} on the shelves`}
          </p>
          <p className="text-sm text-amber-950/70 mt-1">
            Click ingredients to select them. Then you can search for recipes including those ingredients!
          </p>
        </div>
        <PixelFridge ingredients={ingredients} />
      </div>

      {/* Add form */}
      <form onSubmit={addIngredient} className="flex flex-wrap gap-2 items-end rounded-xl border-2 border-amber-900/30 bg-[#c4a882] p-5 shadow-md">
        <div className="flex-1 min-w-[180px] space-y-1 relative" ref={suggestionsRef}>
          <label className="text-xs font-medium text-amber-950/70">Ingredient</label>
          <input
            type="text"
            value={name}
            onChange={(e) => handleNameChange(e.target.value)}
            onBlur={handleNameBlur}
            onFocus={() => { if (suggestions.length > 0) setShowSuggestions(true); }}
            placeholder="e.g. Chicken breast"
            className="w-full rounded-md border-2 border-amber-900/30 bg-amber-50/80 px-3 py-2.5 text-sm text-amber-950 outline-none focus:border-amber-700/50 focus:ring-2 focus:ring-amber-300/50 transition-all"
          />
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute z-10 top-full mt-1 w-full rounded-md border-2 border-amber-900/30 bg-[#f5e6c8] shadow-lg max-h-40 overflow-y-auto">
              {suggestions.map((s) => (
                <button
                  key={s}
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => selectSuggestion(s)}
                  className="w-full text-left px-3 py-2 text-sm text-amber-950 hover:bg-[#e8d4b0] transition-colors capitalize"
                >
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="w-40 space-y-1">
          <label className="text-xs font-medium text-amber-950/70">Expiry Date</label>
          <input
            type="date"
            value={expiry}
            onChange={(e) => setExpiry(e.target.value)}
            className="w-full rounded-md border-2 border-amber-900/30 bg-amber-50/80 px-3 py-2.5 text-sm text-amber-950 outline-none focus:border-amber-700/50 focus:ring-2 focus:ring-amber-300/50 transition-all"
          />
        </div>
        <div className="w-36 space-y-1">
          <label className="text-xs font-medium text-amber-950/70">Category</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as Ingredient["category"])}
            className="w-full rounded-md border-2 border-amber-900/30 bg-amber-50/80 px-3 py-2.5 text-sm text-amber-950 outline-none focus:border-amber-700/50"
          >
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {CATEGORY_LABELS[cat]}
              </option>
            ))}
          </select>
        </div>
        {category === "pantry" && (
          <div className="w-32 space-y-1">
            <label className="text-xs font-medium text-amber-950/70">Cuisine</label>
            <select
              value={cuisine}
              onChange={(e) => setCuisine(e.target.value as Cuisine)}
              className="w-full rounded-md border-2 border-amber-900/30 bg-amber-50/80 px-3 py-2.5 text-sm text-amber-950 outline-none focus:border-amber-700/50"
            >
              {CUISINES.map((c) => (
                <option key={c} value={c}>
                  {CUISINE_LABELS[c]}
                </option>
              ))}
            </select>
          </div>
        )}
        <button
          type="submit"
          className="rounded-lg bg-amber-900 px-5 py-2.5 text-sm font-medium text-amber-50 transition-colors hover:bg-amber-800 shadow-sm"
        >
          Add
        </button>
      </form>

      {/* Search recipes bar */}
      {selectedIds.size > 0 && (
        <div className="flex items-center justify-between rounded-xl border-2 border-amber-900/30 bg-[#c4a882] p-4 shadow-md">
          <span className="text-sm text-amber-950">
            {selectedIds.size} ingredient{selectedIds.size !== 1 ? "s" : ""} selected
          </span>
          <button
            onClick={handleSearchRecipes}
            className="rounded-lg bg-amber-900 px-5 py-2.5 text-sm font-medium text-amber-50 transition-colors hover:bg-amber-800 shadow-sm"
          >
            Search Recipes
          </button>
        </div>
      )}

      {/* Grouped ingredients */}
      {grouped.length === 0 ? (
        <p className="text-center text-sm text-amber-950/40 py-8">
          Your kitchen shelves are empty. Add some ingredients above.
        </p>
      ) : (
        <div className="space-y-6">
          {grouped.map((group) => (
            <div key={group.category}>
              <div className="flex items-center justify-between mb-2">
                <h2 className={`${pixel.className} text-sm font-bold text-amber-950`}>
                  {CATEGORY_LABELS[group.category]}
                </h2>
                {group.category === "pantry" && (
                  <button
                    onClick={clearAll}
                    className="text-xs text-red-500 hover:text-red-700 transition-colors"
                  >
                    Clear all
                  </button>
                )}
              </div>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {group.items.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => toggleSelect(item.id)}
                    className={`group relative rounded-lg border-2 p-3 transition-all hover:shadow-md cursor-pointer ${
                      CATEGORY_COLORS[item.category]
                    } ${selectedIds.has(item.id) ? "ring-2 ring-amber-700" : ""}`}
                  >
                    {getExpiryStatus(item.expiry) === "expired" && (
                      <div className="absolute -top-1.5 -right-1.5 rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-medium text-white">
                        Expired
                      </div>
                    )}
                    {getExpiryStatus(item.expiry) === "soon" && (
                      <div className="absolute -top-1.5 -right-1.5 rounded-full bg-orange-500 px-1.5 py-0.5 text-[10px] font-medium text-white">
                        Expiring soon
                      </div>
                    )}
                    {/* Full edit form for pantry items */}
                    {editingId === item.id && item.category === "pantry" ? (
                      <form
                        onClick={(e) => e.stopPropagation()}
                        onSubmit={(e) => {
                          e.preventDefault();
                          savePantryItem(item.id);
                        }}
                        className="space-y-2"
                      >
                        <div className="space-y-1">
                          <label className="text-[10px] font-medium opacity-60">Name</label>
                          <input
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            autoFocus
                            className="w-full rounded border border-current/20 bg-transparent px-2 py-1 text-sm outline-none"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-medium opacity-60">Expiry</label>
                          <input
                            type="date"
                            value={editExpiry}
                            onChange={(e) => setEditExpiry(e.target.value)}
                            className="w-full rounded border border-current/20 bg-transparent px-2 py-1 text-xs outline-none"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-medium opacity-60">Category</label>
                          <select
                            value={editCategory}
                            onChange={(e) => setEditCategory(e.target.value as Ingredient["category"])}
                            className="w-full rounded border border-current/20 bg-transparent px-2 py-1 text-xs outline-none"
                          >
                            {CATEGORIES.map((cat) => (
                              <option key={cat} value={cat}>
                                {CATEGORY_LABELS[cat]}
                              </option>
                            ))}
                          </select>
                        </div>
                        {editCategory === "pantry" && (
                          <div className="space-y-1">
                            <label className="text-[10px] font-medium opacity-60">Cuisine</label>
                            <select
                              value={editCuisine}
                              onChange={(e) => setEditCuisine(e.target.value as Cuisine)}
                              className="w-full rounded border border-current/20 bg-transparent px-2 py-1 text-xs outline-none"
                            >
                              {CUISINES.map((c) => (
                                <option key={c} value={c}>
                                  {CUISINE_LABELS[c]}
                                </option>
                              ))}
                            </select>
                          </div>
                        )}
                        <div className="flex gap-2 pt-1">
                          <button type="submit" className="text-xs font-medium opacity-70 hover:opacity-100">
                            Save
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingId(null)}
                            className="text-xs opacity-50 hover:opacity-100"
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    ) : (
                    <div className="flex items-start justify-between">
                      <div className="min-w-0">
                        <div className="font-medium text-sm truncate">
                          {item.name}
                          {item.cuisine && item.cuisine !== "general" && (
                            <span className="ml-1.5 inline-block rounded-full bg-current/10 px-1.5 py-0.5 text-[10px] font-medium opacity-60">
                              {CUISINE_LABELS[item.cuisine]}
                            </span>
                          )}
                        </div>
                        {editingId === item.id ? (
                          <form
                            onClick={(e) => e.stopPropagation()}
                            onSubmit={(e) => {
                              e.preventDefault();
                              saveExpiry(item.id);
                            }}
                            className="flex items-center gap-1 mt-1"
                          >
                            <input
                              type="date"
                              value={editExpiry}
                              onChange={(e) => setEditExpiry(e.target.value)}
                              autoFocus
                              className="w-32 rounded border border-current/20 bg-transparent px-1.5 py-0.5 text-xs outline-none"
                            />
                            <button type="submit" className="text-xs font-medium opacity-70 hover:opacity-100">
                              Save
                            </button>
                          </form>
                        ) : (
                          <div
                            onClick={(e) => { e.stopPropagation(); item.category === "pantry" ? startEditPantryItem(item) : startEditExpiry(item); }}
                            className={`text-xs mt-0.5 cursor-pointer hover:opacity-100 ${
                              getExpiryStatus(item.expiry) === "expired"
                                ? "text-red-600 font-medium"
                                : getExpiryStatus(item.expiry) === "soon"
                                ? "text-orange-600 font-medium"
                                : "opacity-70"
                            }`}
                          >
                            {formatExpiry(item.expiry)}
                          </div>
                        )}
                      </div>
                      <div className="absolute top-2 right-2 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        {item.category === "pantry" && (
                          <button
                            onClick={(e) => { e.stopPropagation(); startEditPantryItem(item); }}
                            className="text-[11px] font-medium text-amber-700 hover:text-amber-900 transition-colors"
                          >
                            Edit
                          </button>
                        )}
                        <button
                          onClick={(e) => { e.stopPropagation(); deleteIngredient(item.id); }}
                          className="text-[11px] font-medium text-red-500 hover:text-red-700 transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
