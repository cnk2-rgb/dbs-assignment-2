"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
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

  const [newTitle, setNewTitle] = useState("");
  const [newDate, setNewDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [newContent, setNewContent] = useState("");

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [showEntries, setShowEntries] = useState(true);
  const [dark, setDark] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("journal-dark") === "true";
    }
    return true;
  });

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

  useEffect(() => {
    localStorage.setItem("journal-dark", String(dark));
  }, [dark]);

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
    const titleTrimmed = newTitle.trim() || "Untitled";
    if (!trimmed) return;
    setEntries((prev) => [
      {
        id: Date.now().toString(36) + Math.random().toString(36).slice(2),
        title: titleTrimmed,
        date: newDate,
        content: trimmed,
        createdAt: Date.now(),
      },
      ...prev,
    ]);
    setNewTitle("");
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
    setEditTitle(entry.title || "");
    setEditContent(entry.content);
  }

  function saveEdit(id: string) {
    const trimmed = editContent.trim();
    if (!trimmed) return;
    setEntries((prev) =>
      prev.map((e) => (e.id === id ? { ...e, title: editTitle.trim() || "Untitled", content: trimmed } : e))
    );
    setExpandedId(null);
  }

  function slugify(text: string): string {
    return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "untitled";
  }

  if (!isUnlocked) {
    // First time — set a password
    if (!hasPassword) {
      return (
        <div className="flex items-center justify-center min-h-[60vh]">
          <form onSubmit={handleSetPassword} className="w-full max-w-sm space-y-4">
            <div className="text-center space-y-2">
              <div className="text-4xl">🔒</div>
              <h1 className="font-pixel text-2xl font-bold tracking-tight text-amber-950">Journal</h1>
              <p className="text-sm text-amber-900/60">Set a password to protect your journal</p>
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
                  : "border-amber-200/50 bg-white/80 focus:border-stone-400 focus:ring-2 focus:ring-stone-200"
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
                  : "border-amber-200/50 bg-white/80 focus:border-stone-400 focus:ring-2 focus:ring-stone-200"
              }`}
            />
            {passwordError && (
              <p className="text-xs text-red-500 text-center">{passwordError}</p>
            )}
            <button
              type="submit"
              className="w-full rounded-lg bg-amber-900 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-amber-800"
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
            <h1 className="font-pixel text-2xl font-bold tracking-tight text-amber-950">Journal</h1>
            <p className="text-sm text-amber-900/60">Enter your password to continue</p>
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
                : "border-amber-200/50 bg-white/80 focus:border-stone-400 focus:ring-2 focus:ring-stone-200"
            }`}
          />
          {passwordError && (
            <p className="text-xs text-red-500 text-center">{passwordError}</p>
          )}
          <button
            type="submit"
            className="w-full rounded-lg bg-amber-900 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-amber-800"
          >
            Unlock
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className={`space-y-6 -mx-6 -my-8 min-h-screen transition-colors duration-300 ${dark ? "bg-[#1a1a2e]" : "bg-[#f0e8d8]"}`} style={{ marginLeft: 'calc(-50vw + 50%)', marginRight: 'calc(-50vw + 50%)', paddingLeft: 'max(1.5rem, calc(50vw - 28rem))', paddingRight: 'max(1.5rem, calc(50vw - 28rem))', paddingTop: '2rem', paddingBottom: '2rem' }}>
      <div className="flex items-start justify-between">
        <div>
          <h1 className={`font-pixel text-4xl font-bold tracking-tight ${dark ? "text-amber-100" : "text-amber-950"}`}>Journal</h1>
          <p className={`text-sm mt-1 ${dark ? "text-amber-200/50" : "text-amber-900/60"}`}>
            Entries auto-delete after {AUTO_DELETE_DAYS} days
          </p>
        </div>
        <div className="flex gap-3 shrink-0 mt-1 items-center">
          <button
            onClick={() => setDark(!dark)}
            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm transition-colors ${
              dark ? "bg-amber-100 text-amber-950" : "bg-amber-900 text-amber-50"
            }`}
            title={dark ? "Light mode" : "Dark mode"}
          >
            {dark ? "☀" : "☾"}
          </button>
          <button
            onClick={() => { setShowChangePassword(!showChangePassword); setChangePasswordError(""); setChangePasswordSuccess(false); }}
            className={`text-xs transition-colors ${dark ? "text-stone-500 hover:text-stone-300" : "text-stone-400 hover:text-stone-600"}`}
          >
            Change Password
          </button>
          <button
            onClick={() => { sessionStorage.removeItem("journal-unlocked"); setIsUnlocked(false); setPasswordInput(""); }}
            className={`text-xs transition-colors ${dark ? "text-stone-500 hover:text-red-400" : "text-stone-400 hover:text-red-500"}`}
          >
            Lock
          </button>
        </div>
      </div>

      {showChangePassword && (
        <form onSubmit={handleChangePassword} className={`rounded-xl border p-5 space-y-3 ${dark ? "border-stone-700 bg-[#16213e]" : "border-amber-200/50 bg-white/80"}`}>
          <h3 className={`text-sm font-semibold ${dark ? "text-stone-200" : "text-stone-900"}`}>Change Password</h3>
          <input
            type="password"
            value={currentPasswordInput}
            onChange={(e) => { setCurrentPasswordInput(e.target.value); setChangePasswordError(""); }}
            placeholder="Current password"
            className={`w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 ${dark ? "border-stone-600 bg-[#0f3460] text-stone-200 focus:border-stone-500 focus:ring-stone-600" : "border-stone-200 bg-transparent text-stone-900 focus:border-stone-400 focus:ring-stone-200"}`}
          />
          <input
            type="password"
            value={newPasswordInput}
            onChange={(e) => { setNewPasswordInput(e.target.value); setChangePasswordError(""); }}
            placeholder="New password"
            className={`w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 ${dark ? "border-stone-600 bg-[#0f3460] text-stone-200 focus:border-stone-500 focus:ring-stone-600" : "border-stone-200 bg-transparent text-stone-900 focus:border-stone-400 focus:ring-stone-200"}`}
          />
          <input
            type="password"
            value={newConfirmInput}
            onChange={(e) => { setNewConfirmInput(e.target.value); setChangePasswordError(""); }}
            placeholder="Confirm new password"
            className={`w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 ${dark ? "border-stone-600 bg-[#0f3460] text-stone-200 focus:border-stone-500 focus:ring-stone-600" : "border-stone-200 bg-transparent text-stone-900 focus:border-stone-400 focus:ring-stone-200"}`}
          />
          {changePasswordError && (
            <p className="text-xs text-red-500">{changePasswordError}</p>
          )}
          {changePasswordSuccess && (
            <p className="text-xs text-emerald-600">Password changed successfully!</p>
          )}
          <div className="flex gap-2">
            <button type="submit" className="rounded-lg bg-amber-900 px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-amber-800">
              Update Password
            </button>
            <button type="button" onClick={() => setShowChangePassword(false)} className="rounded-lg border border-stone-200 px-4 py-2 text-xs text-stone-600 transition-colors hover:bg-stone-50">
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* New entry form */}
      <form onSubmit={addEntry} className={`space-y-3 rounded-xl border p-5 ${dark ? "border-stone-700 bg-[#16213e]" : "border-amber-200/50 bg-white/80"}`}>
        <div className="flex items-center gap-3">
          <label className={`text-xs font-medium ${dark ? "text-stone-400" : "text-stone-500"}`}>Date</label>
          <input
            type="date"
            value={newDate}
            onChange={(e) => setNewDate(e.target.value)}
            className={`rounded-md border px-2 py-1.5 text-sm outline-none ${dark ? "border-stone-600 bg-[#0f3460] text-stone-200 focus:border-stone-500" : "border-stone-200 bg-transparent focus:border-stone-400"}`}
          />
        </div>
        <input
          type="text"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="Entry title"
          className={`w-full rounded-lg border px-4 py-3 text-sm font-medium outline-none focus:ring-2 transition-all ${dark ? "border-stone-600 bg-[#0f3460] text-stone-200 placeholder:text-stone-500 focus:border-stone-500 focus:ring-stone-600" : "border-stone-200 bg-transparent focus:border-stone-400 focus:ring-stone-200"}`}
        />
        <textarea
          value={newContent}
          onChange={(e) => setNewContent(e.target.value)}
          placeholder="What's on your mind today?"
          rows={4}
          className={`w-full rounded-lg border px-4 py-3 text-sm outline-none resize-none focus:ring-2 transition-all ${dark ? "border-stone-600 bg-[#0f3460] text-stone-200 placeholder:text-stone-500 focus:border-stone-500 focus:ring-stone-600" : "border-stone-200 bg-transparent focus:border-stone-400 focus:ring-stone-200"}`}
        />
        <button
          type="submit"
          className={`rounded-lg px-5 py-2.5 text-sm font-medium transition-colors ${dark ? "bg-amber-200 text-amber-950 hover:bg-amber-300" : "bg-amber-900 text-white hover:bg-amber-800"}`}
        >
          Save Entry
        </button>
      </form>

      {/* Entries list */}
      {entries.length === 0 ? (
        <p className={`text-center text-sm py-8 ${dark ? "text-stone-500" : "text-stone-400"}`}>
          No journal entries yet. Write your first one above.
        </p>
      ) : (
        <div className="space-y-3">
          <button
            onClick={() => setShowEntries(!showEntries)}
            className={`flex items-center gap-2.5 font-pixel text-lg font-semibold transition-colors ${dark ? "text-stone-300 hover:text-stone-100" : "text-stone-600 hover:text-stone-800"}`}
          >
            <span className="text-[10px]">
              {showEntries ? "▲" : "▼"}
            </span>
            Past Entries
            <span className={`text-sm font-normal ${dark ? "text-stone-600" : "text-stone-400"}`}>({entries.length})</span>
          </button>
          {showEntries && entries.map((entry) => {
            const dateLabel = new Date(entry.date + "T00:00:00").toLocaleDateString("en-US", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            });
            const daysLeft = entry.persist
              ? null
              : Math.max(0, Math.ceil((entry.createdAt + AUTO_DELETE_DAYS * 24 * 60 * 60 * 1000 - Date.now()) / (24 * 60 * 60 * 1000)));

            const entrySlug = slugify(entry.title || "untitled");

            return (
              <Link
                key={entry.id}
                href={`/journal/${entry.date}/${entrySlug}`}
                className={`group block rounded-xl border p-5 transition-shadow hover:shadow-md cursor-pointer ${dark ? "border-stone-700 bg-[#16213e]" : "border-amber-200/50 bg-white/80"}`}
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-1 flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className={`text-base font-semibold transition-colors ${dark ? "text-stone-200 group-hover:text-amber-300" : "text-stone-900 group-hover:text-amber-800"}`}>
                        {entry.title || "Untitled"}
                      </h3>
                      {entry.persist ? (
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${dark ? "bg-emerald-900/40 text-emerald-400" : "bg-emerald-50 text-emerald-700"}`}>
                          Kept
                        </span>
                      ) : daysLeft !== null ? (
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${
                          daysLeft <= 7
                            ? dark ? "bg-amber-900/40 text-amber-400" : "bg-amber-50 text-amber-700"
                            : dark ? "bg-stone-700 text-stone-400" : "bg-stone-50 text-stone-500"
                        }`}>
                          {daysLeft}d left
                        </span>
                      ) : null}
                    </div>
                    <p className={`text-xs ${dark ? "text-stone-500" : "text-stone-400"}`}>{dateLabel}</p>
                  </div>
                  <div className="flex gap-2 shrink-0 ml-4" onClick={(e) => e.preventDefault()}>
                    <button
                      onClick={(e) => { e.preventDefault(); togglePersist(entry.id); }}
                      className={`text-xs transition-opacity ${
                        entry.persist
                          ? "text-emerald-600 hover:text-stone-500"
                          : `${dark ? "text-stone-500" : "text-stone-400"} opacity-0 hover:text-emerald-600 group-hover:opacity-100`
                      }`}
                      title={entry.persist ? "Remove from kept entries" : "Keep forever"}
                    >
                      {entry.persist ? "Unkeep" : "Keep"}
                    </button>
                    <button
                      onClick={(e) => { e.preventDefault(); deleteEntry(entry.id); }}
                      className={`text-xs opacity-0 transition-opacity hover:text-red-500 group-hover:opacity-100 ${dark ? "text-stone-500" : "text-stone-400"}`}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
