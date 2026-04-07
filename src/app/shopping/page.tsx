"use client";

import { useState, useEffect } from "react";
import { ShoppingList, ShoppingItem } from "@/types";

const genId = () => Date.now().toString(36) + Math.random().toString(36).slice(2);
const DEFAULT_STORES = ["Grocery", "Costco", "Target"];

export default function ShoppingPage() {
  const [lists, setLists] = useState<ShoppingList[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("shopping-lists");
      if (saved) {
        try { return JSON.parse(saved); } catch { return []; }
      }
    }
    return [];
  });

  const [deferredItems, setDeferredItems] = useState<ShoppingItem[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("shopping-deferred");
      if (saved) {
        try { return JSON.parse(saved); } catch { return []; }
      }
    }
    return [];
  });

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [newListName, setNewListName] = useState("");
  const [newStoreName, setNewStoreName] = useState("");
  const [newItemName, setNewItemName] = useState("");
  const [newItemQty, setNewItemQty] = useState("");
  const [newItemStore, setNewItemStore] = useState("");
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editQty, setEditQty] = useState("");
  // Track which deferred item has its "add to list" picker open
  const [addingToListId, setAddingToListId] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem("shopping-lists", JSON.stringify(lists));
  }, [lists]);

  useEffect(() => {
    localStorage.setItem("shopping-deferred", JSON.stringify(deferredItems));
  }, [deferredItems]);

  const expandedList = lists.find((l) => l.id === expandedId) ?? null;

  // --- List CRUD ---
  const createList = (e: React.FormEvent) => {
    e.preventDefault();
    const name = newListName.trim() || "Shopping List";
    const list: ShoppingList = {
      id: genId(),
      name,
      createdAt: Date.now(),
      stores: [...DEFAULT_STORES],
      items: [],
    };
    setLists((prev) => [list, ...prev]);
    setExpandedId(list.id);
    setNewListName("");
  };

  const deleteList = (id: string) => {
    setLists((prev) => prev.filter((l) => l.id !== id));
    if (expandedId === id) setExpandedId(null);
  };

  const updateList = (id: string, updater: (list: ShoppingList) => ShoppingList) => {
    setLists((prev) => prev.map((l) => (l.id === id ? updater(l) : l)));
  };

  // --- Store management ---
  const addStore = () => {
    const name = newStoreName.trim();
    if (!name || !expandedList) return;
    if (expandedList.stores.some((s) => s.toLowerCase() === name.toLowerCase())) return;
    updateList(expandedId!, (l) => ({ ...l, stores: [...l.stores, name] }));
    setNewStoreName("");
  };

  const removeStore = (store: string) => {
    if (!expandedList) return;
    updateList(expandedId!, (l) => ({
      ...l,
      stores: l.stores.filter((s) => s !== store),
      items: l.items.filter((i) => i.store !== store),
    }));
  };

  // --- Item CRUD ---
  const addItem = () => {
    const name = newItemName.trim();
    if (!name || !expandedList) return;
    const store = newItemStore || expandedList.stores[0] || "General";
    const item: ShoppingItem = {
      id: genId(),
      name,
      quantity: newItemQty.trim() || "1",
      checked: false,
      deferred: false,
      store,
    };
    updateList(expandedId!, (l) => ({ ...l, items: [...l.items, item] }));
    setNewItemName("");
    setNewItemQty("");
  };

  const toggleItem = (itemId: string) => {
    updateList(expandedId!, (l) => ({
      ...l,
      items: l.items.map((i) => (i.id === itemId ? { ...i, checked: !i.checked } : i)),
    }));
  };

  const deleteItem = (itemId: string) => {
    updateList(expandedId!, (l) => ({
      ...l,
      items: l.items.filter((i) => i.id !== itemId),
    }));
  };

  const startEdit = (item: ShoppingItem) => {
    setEditingItemId(item.id);
    setEditName(item.name);
    setEditQty(item.quantity);
  };

  const saveEdit = (itemId: string) => {
    updateList(expandedId!, (l) => ({
      ...l,
      items: l.items.map((i) =>
        i.id === itemId
          ? { ...i, name: editName.trim() || i.name, quantity: editQty.trim() || i.quantity }
          : i
      ),
    }));
    setEditingItemId(null);
  };

  // --- Defer: move item from list into deferred pool ---
  const deferItem = (itemId: string) => {
    if (!expandedList) return;
    const item = expandedList.items.find((i) => i.id === itemId);
    if (!item) return;

    setDeferredItems((prev) => [...prev, { ...item, id: genId(), deferred: true, checked: false }]);
    updateList(expandedId!, (l) => ({
      ...l,
      items: l.items.filter((i) => i.id !== itemId),
    }));
  };

  const deferAllUnchecked = () => {
    if (!expandedList) return;
    const unchecked = expandedList.items.filter((i) => !i.checked);
    if (unchecked.length === 0) return;

    setDeferredItems((prev) => [
      ...prev,
      ...unchecked.map((i) => ({ ...i, id: genId(), deferred: true, checked: false })),
    ]);
    updateList(expandedId!, (l) => ({
      ...l,
      items: l.items.filter((i) => i.checked),
    }));
  };

  // --- Add a deferred item to a chosen list ---
  const addDeferredToList = (deferredId: string, listId: string) => {
    const item = deferredItems.find((i) => i.id === deferredId);
    if (!item) return;

    const targetList = lists.find((l) => l.id === listId);
    if (!targetList) return;

    // Use the item's original store if the target list has it, otherwise default to the first store
    const store = targetList.stores.includes(item.store) ? item.store : (targetList.stores[0] || "General");

    updateList(listId, (l) => ({
      ...l,
      items: [...l.items, { ...item, id: genId(), deferred: false, checked: false, store }],
    }));
    setDeferredItems((prev) => prev.filter((i) => i.id !== deferredId));
    setAddingToListId(null);
  };

  const discardDeferred = (deferredId: string) => {
    setDeferredItems((prev) => prev.filter((i) => i.id !== deferredId));
  };

  return (
    <div className="space-y-6 -mx-6 -my-8 min-h-screen bg-[#e8ddd0]" style={{ marginLeft: 'calc(-50vw + 50%)', marginRight: 'calc(-50vw + 50%)', paddingLeft: 'max(1.5rem, calc(50vw - 28rem))', paddingRight: 'max(1.5rem, calc(50vw - 28rem))', paddingTop: '2rem', paddingBottom: '2rem' }}>
      <div>
        <h1 className="font-pixel text-4xl font-bold tracking-tight text-amber-950">Shopping Lists</h1>
        <p className="text-sm text-amber-900/60 mt-1">
          Plan your trips and defer what you don&apos;t get to.
        </p>
      </div>

      {/* New list form */}
      <form onSubmit={createList} className="space-y-3 rounded-xl border border-amber-200/50 bg-white/80 p-5">
        <input
          type="text"
          value={newListName}
          onChange={(e) => setNewListName(e.target.value)}
          placeholder="New list name..."
          className="w-full rounded-lg border border-stone-200 bg-transparent px-4 py-3 text-sm font-medium outline-none focus:border-stone-400 focus:ring-2 focus:ring-stone-200 transition-all"
        />
        <button
          type="submit"
          className="rounded-lg bg-amber-900 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-amber-800"
        >
          Create List
        </button>
      </form>

      {/* Deferred items */}
      {deferredItems.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-orange-800">
            Deferred Items
            <span className="ml-2 text-xs font-normal text-orange-600">
              {deferredItems.length} item{deferredItems.length !== 1 ? "s" : ""} waiting to be added to a list
            </span>
          </h2>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {deferredItems.map((item) => (
              <div
                key={item.id}
                className="group rounded-xl border border-orange-200/60 bg-orange-50/50 p-4 transition-shadow hover:shadow-md"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-semibold text-stone-900 truncate">{item.name}</h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-stone-400">x{item.quantity}</span>
                      <span className="text-[10px] bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded-full font-medium">
                        {item.store}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => discardDeferred(item.id)}
                    className="text-xs text-stone-400 opacity-0 group-hover:opacity-100 transition-opacity hover:text-red-500"
                  >
                    Discard
                  </button>
                </div>

                {addingToListId === item.id ? (
                  <div className="space-y-1.5">
                    {lists.length === 0 ? (
                      <p className="text-xs text-stone-400">No lists yet. Create one first.</p>
                    ) : (
                      lists.map((list) => (
                        <button
                          key={list.id}
                          onClick={() => addDeferredToList(item.id, list.id)}
                          className="w-full text-left rounded-lg border border-amber-200/50 bg-white/80 px-3 py-2 text-xs font-medium text-amber-900 hover:bg-amber-50 transition-colors"
                        >
                          {list.name}
                        </button>
                      ))
                    )}
                    <button
                      onClick={() => setAddingToListId(null)}
                      className="text-xs text-stone-400 hover:text-stone-600"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setAddingToListId(item.id)}
                    className="w-full rounded-lg border border-orange-300/60 bg-white/60 px-3 py-1.5 text-xs font-medium text-orange-700 hover:bg-white/80 transition-colors"
                  >
                    Add to list...
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Lists */}
      {lists.length === 0 ? (
        <p className="text-center text-sm text-stone-400 py-8">
          No shopping lists yet. Create one above.
        </p>
      ) : (
        <div className="space-y-3">
          {lists.map((list) => {
            const isExpanded = expandedId === list.id;
            const checkedCount = list.items.filter((i) => i.checked).length;
            const totalCount = list.items.length;
            const dateLabel = new Date(list.createdAt).toLocaleDateString("en-US", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            });

            return (
              <div
                key={list.id}
                className={`rounded-xl border border-amber-200/50 bg-white/80 transition-shadow ${
                  isExpanded ? "shadow-md" : "hover:shadow-md"
                }`}
              >
                {/* Card header */}
                <div
                  className="group p-5 cursor-pointer"
                  onClick={() => setExpandedId(isExpanded ? null : list.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="space-y-1 flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-semibold text-stone-900 group-hover:text-amber-800 transition-colors">
                          {list.name}
                        </h3>
                        <button
                          onClick={(e) => { e.stopPropagation(); deleteList(list.id); }}
                          className="text-sm text-red-500 opacity-0 transition-opacity hover:text-red-700 group-hover:opacity-100"
                        >
                          Delete
                        </button>
                        {totalCount > 0 && checkedCount === totalCount && (
                          <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium bg-emerald-50 text-emerald-700">
                            Done
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-stone-400">{dateLabel}</p>
                    </div>
                    <span className={`shrink-0 ml-4 text-sm text-stone-400 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}>
                      ▼
                    </span>
                  </div>

                  {!isExpanded && totalCount > 0 && (
                    <div className="mt-3">
                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-1.5 rounded-full bg-amber-100">
                          <div
                            className="h-1.5 rounded-full bg-emerald-500 transition-all duration-300"
                            style={{ width: `${(checkedCount / totalCount) * 100}%` }}
                          />
                        </div>
                        <span className="text-sm text-stone-400 shrink-0">
                          {checkedCount}/{totalCount} items bought
                        </span>
                      </div>
                      <p className="text-sm text-stone-400 mt-1.5 truncate">
                        {(() => {
                          const names = list.items.map((i) => i.name);
                          const shown = names.slice(0, 3);
                          const remaining = names.length - shown.length;
                          return shown.join(", ") + (remaining > 0 ? `, +${remaining} more` : "");
                        })()}
                      </p>
                    </div>
                  )}
                </div>

                {/* Expanded content */}
                {isExpanded && (
                  <div className="border-t border-amber-200/30 px-5 pb-5 pt-4 space-y-5">
                    {/* Progress bar */}
                    {totalCount > 0 && (
                      <div>
                        <div className="flex justify-between text-xs text-stone-500 mb-1">
                          <span>{checkedCount} of {totalCount} items</span>
                          <span>{Math.round((checkedCount / totalCount) * 100)}%</span>
                        </div>
                        <div className="h-2 rounded-full bg-amber-100">
                          <div
                            className="h-2 rounded-full bg-emerald-500 transition-all duration-300"
                            style={{ width: `${(checkedCount / totalCount) * 100}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Add item */}
                    <div>
                      <h4 className="text-xs font-medium text-stone-500 mb-2">Add Item</h4>
                      <div className="flex gap-2 flex-wrap">
                        <input
                          type="text"
                          value={newItemName}
                          onChange={(e) => setNewItemName(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && addItem()}
                          placeholder="Item name..."
                          className="flex-1 min-w-[140px] rounded-lg border border-stone-200 bg-transparent px-3 py-2 text-sm outline-none focus:border-stone-400 focus:ring-2 focus:ring-stone-200"
                        />
                        <input
                          type="text"
                          value={newItemQty}
                          onChange={(e) => setNewItemQty(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && addItem()}
                          placeholder="Qty"
                          className="w-20 rounded-lg border border-stone-200 bg-transparent px-3 py-2 text-sm outline-none focus:border-stone-400 focus:ring-2 focus:ring-stone-200"
                        />
                        <select
                          value={newItemStore}
                          onChange={(e) => setNewItemStore(e.target.value)}
                          className="rounded-lg border border-stone-200 bg-transparent px-3 py-2 text-sm outline-none focus:border-stone-400 focus:ring-2 focus:ring-stone-200"
                        >
                          {list.stores.map((s) => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                        <button
                          onClick={addItem}
                          className="rounded-lg bg-amber-900 px-4 py-2 text-sm font-medium text-white hover:bg-amber-800 transition-colors"
                        >
                          Add
                        </button>
                      </div>
                    </div>

                    {/* Stores */}
                    <div>
                      <h4 className="text-xs font-medium text-stone-500 mb-2">Stores</h4>
                      <div className="flex gap-2 flex-wrap mb-2">
                        {list.stores.map((store) => (
                          <span
                            key={store}
                            className="group/tag inline-flex items-center gap-1.5 rounded-full bg-amber-100/80 px-3 py-1 text-xs text-amber-900 border border-amber-200/60"
                          >
                            {store}
                            <button
                              onClick={() => removeStore(store)}
                              className="opacity-0 group-hover/tag:opacity-100 transition-opacity text-amber-600 hover:text-red-500 font-bold"
                            >
                              x
                            </button>
                          </span>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={newStoreName}
                          onChange={(e) => setNewStoreName(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && addStore()}
                          placeholder="Add a store..."
                          className="flex-1 rounded-lg border border-stone-200 bg-transparent px-3 py-2 text-sm outline-none focus:border-stone-400 focus:ring-2 focus:ring-stone-200"
                        />
                        <button
                          onClick={addStore}
                          className="rounded-lg border border-amber-900/20 bg-amber-900/10 px-3 py-2 text-xs font-medium text-amber-900 hover:bg-amber-900/20 transition-colors"
                        >
                          Add Store
                        </button>
                      </div>
                    </div>

                    {/* Items grouped by store */}
                    {list.stores.map((store) => {
                      const storeItems = list.items.filter((i) => i.store === store);
                      if (storeItems.length === 0) return null;

                      return (
                        <div key={store}>
                          <h4 className="text-xs font-medium text-stone-500 mb-2 flex items-center gap-2">
                            <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-600" />
                            {store}
                            <span className="text-stone-300 font-normal">
                              {storeItems.filter((i) => i.checked).length}/{storeItems.length}
                            </span>
                          </h4>
                          <div className="space-y-0.5">
                            {storeItems.map((item) => (
                              <div
                                key={item.id}
                                className={`group/item flex items-center gap-3 rounded-lg px-3 py-2 transition-colors ${
                                  item.checked
                                    ? "bg-emerald-50/60"
                                    : "hover:bg-amber-50/60"
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={item.checked}
                                  onChange={() => toggleItem(item.id)}
                                  className="h-4 w-4 rounded border-amber-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                                />

                                {editingItemId === item.id ? (
                                  <div className="flex-1 flex gap-2 items-center">
                                    <input
                                      type="text"
                                      value={editName}
                                      onChange={(e) => setEditName(e.target.value)}
                                      onKeyDown={(e) => e.key === "Enter" && saveEdit(item.id)}
                                      className="flex-1 rounded border border-amber-200 px-2 py-1 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-amber-300"
                                      autoFocus
                                    />
                                    <input
                                      type="text"
                                      value={editQty}
                                      onChange={(e) => setEditQty(e.target.value)}
                                      onKeyDown={(e) => e.key === "Enter" && saveEdit(item.id)}
                                      className="w-16 rounded border border-amber-200 px-2 py-1 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-amber-300"
                                    />
                                    <button onClick={() => saveEdit(item.id)} className="text-xs text-emerald-600 hover:text-emerald-700 font-medium">Save</button>
                                    <button onClick={() => setEditingItemId(null)} className="text-xs text-stone-400 hover:text-stone-600">Cancel</button>
                                  </div>
                                ) : (
                                  <>
                                    <span className={`flex-1 text-sm ${item.checked ? "line-through text-stone-400" : "text-amber-950"}`}>
                                      {item.name}
                                    </span>
                                    <span className="text-xs text-stone-400 mr-1">x{item.quantity}</span>
                                    {!item.checked && (
                                      <button
                                        onClick={() => deferItem(item.id)}
                                        className="opacity-0 group-hover/item:opacity-100 transition-opacity text-xs text-orange-500 hover:text-orange-700"
                                      >
                                        Defer
                                      </button>
                                    )}
                                    <button
                                      onClick={() => startEdit(item)}
                                      className="opacity-0 group-hover/item:opacity-100 transition-opacity text-xs text-amber-600 hover:text-amber-800"
                                    >
                                      Edit
                                    </button>
                                    <button
                                      onClick={() => deleteItem(item.id)}
                                      className="opacity-0 group-hover/item:opacity-100 transition-opacity text-xs text-red-400 hover:text-red-600"
                                    >
                                      Delete
                                    </button>
                                  </>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}

                    {totalCount === 0 && (
                      <p className="text-center text-sm text-stone-400 py-4">
                        No items yet. Add some above.
                      </p>
                    )}

                    {/* Defer all unchecked button */}
                    {(() => {
                      const deferrable = list.items.filter((i) => !i.checked).length;
                      return deferrable > 0 ? (
                        <button
                          onClick={deferAllUnchecked}
                          className="w-full rounded-xl border-2 border-dashed border-orange-300/60 bg-orange-50/40 px-5 py-3.5 text-sm font-medium text-orange-700 hover:bg-orange-50/70 hover:border-orange-400/60 transition-colors"
                        >
                          Defer all {deferrable} unchecked item{deferrable !== 1 ? "s" : ""} for next time
                        </button>
                      ) : null;
                    })()}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
