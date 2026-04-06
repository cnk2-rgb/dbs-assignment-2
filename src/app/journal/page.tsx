"use client";

import { useState, useEffect } from "react";
import { JournalEntry } from "@/types";

const AUTO_DELETE_DAYS = 30;

export default function JournalPage() {
  const [entries, setEntries] = useState<JournalEntry[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("journal-entries");
      if (saved) {
        try { return JSON.parse(saved); } catch { return []; }
      }
    }
    return [];
  });
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [hasPassword, setHasPassword] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [confirmInput, setConfirmInput] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [currentPasswordInput, setCurrentPasswordInput] = useState("");
  const [newPasswordInput, setNewPasswordInput] = useState("");
  const [newConfirmInput, setNewConfirmInput] = useState("");
  const [changePasswordError, setChangePasswordError] = useState("");
  const [changePasswordSuccess, setChangePasswordSuccess] = useState(false);

  const [newDate, setNewDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [newContent, setNewContent] = useState("");

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("journal-password");
      setHasPassword(!!stored);
      if (sessionStorage.getItem("journal-unlocked") === "true" && stored) {
        setIsUnlocked(true);
      }
    }
  }, []);

  // Save entries to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem("journal-entries", JSON.stringify(entries));
  }, [entries]);

  // Auto-delete old entries (skip persisted ones)
  useEffect(() => {
    const cutoff = Date.now() - AUTO_DELETE_DAYS * 24 * 60 * 60 * 1000;
    setEntries((prev) => {
      const filtered = prev.filter((e) => e.persist || e.createdAt > cutoff);
      return filtered.length !== prev.length ? filtered : prev;
    });
  }, []);

  function handleSetPassword(e: React.FormEvent) {
    e.preventDefault();
    if (passwordInput.length < 4) {
      setPasswordError("Password must be at least 4 characters.");
      return;
    }
    if (passwordInput !== confirmInput) {
      setPasswordError("Passwords do not match.");
      return;
    }
    localStorage.setItem("journal-password", passwordInput);
    sessionStorage.setItem("journal-unlocked", "true");
    setHasPassword(true);
    setIsUnlocked(true);
    setPasswordError("");
  }

  function handleUnlock(e: React.FormEvent) {
    e.preventDefault();
    const stored = localStorage.getItem("journal-password");
    if (passwordInput === stored) {
      setIsUnlocked(true);
      sessionStorage.setItem("journal-unlocked", "true");
      setPasswordError("");
    } else {
      setPasswordError("Incorrect password. Try again.");
    }
  }

  function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    const stored = localStorage.getItem("journal-password");
    if (currentPasswordInput !== stored) {
      setChangePasswordError("Current password is incorrect.");
      return;
    }
    if (newPasswordInput.length < 4) {
      setChangePasswordError("New password must be at least 4 characters.");
      return;
    }
    if (newPasswordInput !== newConfirmInput) {
      setChangePasswordError("New passwords do not match.");
      return;
    }
    localStorage.setItem("journal-password", newPasswordInput);
    setChangePasswordError("");
    setChangePasswordSuccess(true);
    setCurrentPasswordInput("");
    setNewPasswordInput("");
    setNewConfirmInput("");
    setTimeout(() => {
      setShowChangePassword(false);
      setChangePasswordSuccess(false);
    }, 1500);
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

  function togglePersist(id: string) {
    setEntries((prev) =>
      prev.map((e) => (e.id === id ? { ...e, persist: !e.persist } : e))
    );
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
    // First time — set a password
    if (!hasPassword) {
      return (
        <div className="flex items-center justify-center min-h-[60vh]">
          <form onSubmit={handleSetPassword} className="w-full max-w-sm space-y-4">
            <div className="text-center space-y-2">
              <div className="text-4xl">🔒</div>
              <h1 className="text-xl font-bold tracking-tight">Journal</h1>
              <p className="text-sm text-stone-500">Set a password to protect your journal</p>
            </div>
            <input
              type="password"
              value={passwordInput}
              onChange={(e) => { setPasswordInput(e.target.value); setPasswordError(""); }}
              placeholder="Create a password"
              autoFocus
              className={`w-full rounded-lg border px-4 py-3 text-sm outline-none transition-all ${
                passwordError
                  ? "border-red-300 bg-red-50 focus:border-red-400 focus:ring-2 focus:ring-red-100"
                  : "border-stone-200 bg-white focus:border-stone-400 focus:ring-2 focus:ring-stone-200"
              }`}
            />
            <input
              type="password"
              value={confirmInput}
              onChange={(e) => { setConfirmInput(e.target.value); setPasswordError(""); }}
              placeholder="Confirm password"
              className={`w-full rounded-lg border px-4 py-3 text-sm outline-none transition-all ${
                passwordError
                  ? "border-red-300 bg-red-50 focus:border-red-400 focus:ring-2 focus:ring-red-100"
                  : "border-stone-200 bg-white focus:border-stone-400 focus:ring-2 focus:ring-stone-200"
              }`}
            />
            {passwordError && (
              <p className="text-xs text-red-500 text-center">{passwordError}</p>
            )}
            <button
              type="submit"
              className="w-full rounded-lg bg-stone-900 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-stone-700"
            >
              Set Password
            </button>
            <p className="text-xs text-stone-400 text-center">Minimum 4 characters</p>
          </form>
        </div>
      );
    }

    // Returning user — enter password
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
            onChange={(e) => { setPasswordInput(e.target.value); setPasswordError(""); }}
            placeholder="Password"
            autoFocus
            className={`w-full rounded-lg border px-4 py-3 text-sm outline-none transition-all ${
              passwordError
                ? "border-red-300 bg-red-50 focus:border-red-400 focus:ring-2 focus:ring-red-100"
                : "border-stone-200 bg-white focus:border-stone-400 focus:ring-2 focus:ring-stone-200"
            }`}
          />
          {passwordError && (
            <p className="text-xs text-red-500 text-center">{passwordError}</p>
          )}
          <button
            type="submit"
            className="w-full rounded-lg bg-stone-900 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-stone-700"
          >
            Unlock
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Journal</h1>
          <p className="text-sm text-stone-500 mt-1">
            Entries auto-delete after {AUTO_DELETE_DAYS} days
          </p>
        </div>
        <button
          onClick={() => { setShowChangePassword(!showChangePassword); setChangePasswordError(""); setChangePasswordSuccess(false); }}
          className="text-xs text-stone-400 hover:text-stone-600 transition-colors mt-1"
        >
          Change Password
        </button>
      </div>

      {showChangePassword && (
        <form onSubmit={handleChangePassword} className="rounded-xl border border-stone-100 bg-white p-5 space-y-3">
          <h3 className="text-sm font-semibold text-stone-900">Change Password</h3>
          <input
            type="password"
            value={currentPasswordInput}
            onChange={(e) => { setCurrentPasswordInput(e.target.value); setChangePasswordError(""); }}
            placeholder="Current password"
            className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm outline-none focus:border-stone-400 focus:ring-2 focus:ring-stone-200"
          />
          <input
            type="password"
            value={newPasswordInput}
            onChange={(e) => { setNewPasswordInput(e.target.value); setChangePasswordError(""); }}
            placeholder="New password"
            className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm outline-none focus:border-stone-400 focus:ring-2 focus:ring-stone-200"
          />
          <input
            type="password"
            value={newConfirmInput}
            onChange={(e) => { setNewConfirmInput(e.target.value); setChangePasswordError(""); }}
            placeholder="Confirm new password"
            className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm outline-none focus:border-stone-400 focus:ring-2 focus:ring-stone-200"
          />
          {changePasswordError && (
            <p className="text-xs text-red-500">{changePasswordError}</p>
          )}
          {changePasswordSuccess && (
            <p className="text-xs text-emerald-600">Password changed successfully!</p>
          )}
          <div className="flex gap-2">
            <button type="submit" className="rounded-lg bg-stone-900 px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-stone-700">
              Update Password
            </button>
            <button type="button" onClick={() => setShowChangePassword(false)} className="rounded-lg border border-stone-200 px-4 py-2 text-xs text-stone-600 transition-colors hover:bg-stone-50">
              Cancel
            </button>
          </div>
        </form>
      )}

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

            const daysLeft = entry.persist
              ? null
              : Math.max(0, Math.ceil((entry.createdAt + AUTO_DELETE_DAYS * 24 * 60 * 60 * 1000 - Date.now()) / (24 * 60 * 60 * 1000)));

            return (
              <div
                key={entry.id}
                className="group rounded-xl border border-stone-100 bg-white p-5 transition-shadow hover:shadow-sm"
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-1 flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold text-stone-900">{dateLabel}</h3>
                      {entry.persist ? (
                        <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700">
                          Kept
                        </span>
                      ) : daysLeft !== null ? (
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${
                          daysLeft <= 7 ? "bg-amber-50 text-amber-700" : "bg-stone-50 text-stone-500"
                        }`}>
                          {daysLeft}d left
                        </span>
                      ) : null}
                    </div>
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
                        onClick={() => togglePersist(entry.id)}
                        className={`text-xs transition-opacity ${
                          entry.persist
                            ? "text-emerald-600 hover:text-stone-500"
                            : "text-stone-400 opacity-0 hover:text-emerald-600 group-hover:opacity-100"
                        }`}
                        title={entry.persist ? "Remove from kept entries" : "Keep forever"}
                      >
                        {entry.persist ? "Unkeep" : "Keep"}
                      </button>
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
