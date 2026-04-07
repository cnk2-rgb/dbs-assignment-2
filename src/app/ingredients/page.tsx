"use client";

import { useState } from "react";
import { Ingredient } from "@/types";

const CATEGORIES: Ingredient["category"][] = [
  "produce",
  "dairy",
  "meat",
  "pantry",
  "frozen",
  "other",
];

const CATEGORY_COLORS: Record<Ingredient["category"], string> = {
  produce: "bg-green-50 border-green-200 text-green-800",
  dairy: "bg-blue-50 border-blue-200 text-blue-800",
  meat: "bg-red-50 border-red-200 text-red-800",
  pantry: "bg-amber-50 border-amber-200 text-amber-800",
  frozen: "bg-cyan-50 border-cyan-200 text-cyan-800",
  other: "bg-stone-50 border-stone-200 text-stone-800",
};

const CATEGORY_LABELS: Record<Ingredient["category"], string> = {
  produce: "Produce",
  dairy: "Dairy",
  meat: "Meat & Seafood",
  pantry: "Pantry",
  frozen: "Frozen",
  other: "Other",
};

export default function IngredientsPage() {
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [name, setName] = useState("");
  const [expiry, setExpiry] = useState("");
  const [category, setCategory] = useState<Ingredient["category"]>("produce");

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editExpiry, setEditExpiry] = useState("");
  const [editName, setEditName] = useState("");
  const [editCategory, setEditCategory] = useState<Ingredient["category"]>("pantry");

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
        addedDate: new Date().toISOString().split("T")[0],
      },
    ]);
    setName("");
    setExpiry("");
  }

  function deleteIngredient(id: string) {
    setIngredients((prev) => prev.filter((i) => i.id !== id));
  }

  function clearCategory(category: Ingredient["category"]) {
    setIngredients((prev) => prev.filter((i) => i.category !== category));
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
  }

  function savePantryItem(id: string) {
    const trimmed = editName.trim();
    if (!trimmed) return;
    setIngredients((prev) =>
      prev.map((i) =>
        i.id === id ? { ...i, name: trimmed, expiry: editExpiry, category: editCategory } : i
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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">My Fridge</h1>
        <p className="text-sm text-stone-500 mt-1">
          {ingredients.length === 0
            ? "Track what's in your fridge"
            : `${ingredients.length} item${ingredients.length !== 1 ? "s" : ""} tracked`}
        </p>
      </div>

      {/* Add form */}
      <form onSubmit={addIngredient} className="flex flex-wrap gap-2 items-end rounded-xl border border-stone-100 bg-white p-5">
        <div className="flex-1 min-w-[180px] space-y-1">
          <label className="text-xs font-medium text-stone-500">Ingredient</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Chicken breast"
            className="w-full rounded-lg border border-stone-200 bg-transparent px-3 py-2.5 text-sm outline-none focus:border-stone-400 focus:ring-2 focus:ring-stone-200 transition-all"
          />
        </div>
        <div className="w-40 space-y-1">
          <label className="text-xs font-medium text-stone-500">Expiry Date</label>
          <input
            type="date"
            value={expiry}
            onChange={(e) => setExpiry(e.target.value)}
            className="w-full rounded-lg border border-stone-200 bg-transparent px-3 py-2.5 text-sm outline-none focus:border-stone-400 focus:ring-2 focus:ring-stone-200 transition-all"
          />
        </div>
        <div className="w-36 space-y-1">
          <label className="text-xs font-medium text-stone-500">Category</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as Ingredient["category"])}
            className="w-full rounded-lg border border-stone-200 bg-transparent px-3 py-2.5 text-sm outline-none focus:border-stone-400"
          >
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {CATEGORY_LABELS[cat]}
              </option>
            ))}
          </select>
        </div>
        <button
          type="submit"
          className="rounded-lg bg-stone-900 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-stone-700"
        >
          Add
        </button>
      </form>

      {/* Grouped ingredients */}
      {grouped.length === 0 ? (
        <p className="text-center text-sm text-stone-400 py-8">
          No ingredients yet. Add some above to start tracking.
        </p>
      ) : (
        <div className="space-y-6">
          {grouped.map((group) => (
            <div key={group.category}>
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-sm font-semibold text-stone-700">
                  {CATEGORY_LABELS[group.category]}
                </h2>
                {group.category === "pantry" && (
                  <button
                    onClick={() => clearCategory("pantry")}
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
                    className={`group relative rounded-lg border p-3 transition-shadow hover:shadow-sm ${
                      CATEGORY_COLORS[item.category]
                    }`}
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
                        <div className="font-medium text-sm truncate">{item.name}</div>
                        {editingId === item.id ? (
                          <form
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
                            onClick={() => item.category === "pantry" ? startEditPantryItem(item) : startEditExpiry(item)}
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
                      <div className="flex items-center gap-1 shrink-0">
                        {item.category === "pantry" && (
                          <button
                            onClick={() => startEditPantryItem(item)}
                            className="text-xs opacity-0 transition-opacity hover:opacity-100 group-hover:opacity-60"
                          >
                            ✎
                          </button>
                        )}
                      </div>
                      <button
                        onClick={() => deleteIngredient(item.id)}
                        className="shrink-0 text-xs opacity-0 transition-opacity hover:opacity-100 group-hover:opacity-60"
                      >
                        &times;
                      </button>
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
