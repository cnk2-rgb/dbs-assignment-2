"use client";

import { useState, useEffect } from "react";
import { JournalEntry } from "@/types";

const JOURNAL_PASSWORD = "myjournal";
const AUTO_DELETE_DAYS = 30;

export default function JournalPage() {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [passwordError, setPasswordError] = useState(false);

  const [newDate, setNewDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [newContent, setNewContent] = useState("");

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined" && sessionStorage.getItem("journal-unlocked") === "true") {
      setIsUnlocked(true);
    }
  }, []);

  // Auto-delete old entries
  useEffect(() => {
    const cutoff = Date.now() - AUTO_DELETE_DAYS * 24 * 60 * 60 * 1000;
    setEntries((prev) => prev.filter((e) => e.createdAt > cutoff));
  }, []);

  function handleUnlock(e: React.FormEvent) {
    e.preventDefault();
    if (passwordInput === JOURNAL_PASSWORD) {
      setIsUnlocked(true);
      sessionStorage.setItem("journal-unlocked", "true");
      setPasswordError(false);
    } else {
      setPasswordError(true);
    }
  }

  function addEntry(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = newContent.trim();
    if (!trimmed) return;
    setEntries((prev) => [
      {
        id: Date.now().toString(36) + Math.random().toString(36).slice(2),
        date: newDate,
        content: trimmed,
        createdAt: Date.now(),
      },
      ...prev,
    ]);
    setNewContent("");
    setNewDate(new Date().toISOString().split("T")[0]);
  }

  function deleteEntry(id: string) {
    setEntries((prev) => prev.filter((e) => e.id !== id));
    if (expandedId === id) setExpandedId(null);
  }

  function startEdit(entry: JournalEntry) {
    setExpandedId(entry.id);
    setEditContent(entry.content);
  }

  function saveEdit(id: string) {
    const trimmed = editContent.trim();
    if (!trimmed) return;
    setEntries((prev) =>
      prev.map((e) => (e.id === id ? { ...e, content: trimmed } : e))
    );
    setExpandedId(null);
  }

  if (!isUnlocked) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <form onSubmit={handleUnlock} className="w-full max-w-sm space-y-4">
          <div className="text-center space-y-2">
            <div className="text-4xl">🔒</div>
            <h1 className="text-xl font-bold tracking-tight">Journal</h1>
            <p className="text-sm text-stone-500">Enter your password to continue</p>
          </div>
          <input
            type="password"
            value={passwordInput}
            onChange={(e) => { setPasswordInput(e.target.value); setPasswordError(false); }}
            placeholder="Password"
            autoFocus
            className={`w-full rounded-lg border px-4 py-3 text-sm outline-none transition-all ${
              passwordError
                ? "border-red-300 bg-red-50 focus:border-red-400 focus:ring-2 focus:ring-red-100"
                : "border-stone-200 bg-white focus:border-stone-400 focus:ring-2 focus:ring-stone-200"
            }`}
          />
          {passwordError && (
            <p className="text-xs text-red-500 text-center">Incorrect password. Try again.</p>
          )}
          <button
            type="submit"
            className="w-full rounded-lg bg-stone-900 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-stone-700"
          >
            Unlock
          </button>
          <p className="text-xs text-stone-400 text-center">Hint: myjournal</p>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Journal</h1>
        <p className="text-sm text-stone-500 mt-1">
          Entries auto-delete after {AUTO_DELETE_DAYS} days
        </p>
      </div>

      {/* New entry form */}
      <form onSubmit={addEntry} className="space-y-3 rounded-xl border border-stone-100 bg-white p-5">
        <div className="flex items-center gap-3">
          <label className="text-xs font-medium text-stone-500">Date</label>
          <input
            type="date"
            value={newDate}
            onChange={(e) => setNewDate(e.target.value)}
            className="rounded-md border border-stone-200 bg-transparent px-2 py-1.5 text-sm outline-none focus:border-stone-400"
          />
        </div>
        <textarea
          value={newContent}
          onChange={(e) => setNewContent(e.target.value)}
          placeholder="What's on your mind today?"
          rows={4}
          className="w-full rounded-lg border border-stone-200 bg-transparent px-4 py-3 text-sm outline-none resize-none focus:border-stone-400 focus:ring-2 focus:ring-stone-200 transition-all"
        />
        <button
          type="submit"
          className="rounded-lg bg-stone-900 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-stone-700"
        >
          Save Entry
        </button>
      </form>

      {/* Entries list */}
      {entries.length === 0 ? (
        <p className="text-center text-sm text-stone-400 py-8">
          No journal entries yet. Write your first one above.
        </p>
      ) : (
        <div className="space-y-3">
          {entries.map((entry) => {
            const dateLabel = new Date(entry.date + "T00:00:00").toLocaleDateString("en-US", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            });
            const isExpanded = expandedId === entry.id;

            return (
              <div
                key={entry.id}
                className="group rounded-xl border border-stone-100 bg-white p-5 transition-shadow hover:shadow-sm"
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-1 flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-stone-900">{dateLabel}</h3>
                    {isExpanded ? (
                      <div className="space-y-2 mt-2">
                        <textarea
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          rows={4}
                          autoFocus
                          className="w-full rounded-lg border border-stone-200 bg-transparent px-3 py-2 text-sm outline-none resize-none focus:border-stone-400"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => saveEdit(entry.id)}
                            className="text-xs font-medium text-stone-600 hover:text-stone-900"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setExpandedId(null)}
                            className="text-xs text-stone-400 hover:text-stone-600"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-stone-600 whitespace-pre-wrap">{entry.content}</p>
                    )}
                  </div>
                  {!isExpanded && (
                    <div className="flex gap-2 shrink-0 ml-4">
                      <button
                        onClick={() => startEdit(entry)}
                        className="text-xs text-stone-400 opacity-0 transition-opacity hover:text-stone-600 group-hover:opacity-100"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => deleteEntry(entry.id)}
                        className="text-xs text-stone-400 opacity-0 transition-opacity hover:text-red-500 group-hover:opacity-100"
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
