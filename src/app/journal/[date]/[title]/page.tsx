"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { JournalEntry } from "@/types";

export default function JournalEntryPage({
  params,
}: {
  params: Promise<{ date: string; title: string }>;
}) {
  const { date, title } = use(params);
  const [entry, setEntry] = useState<JournalEntry | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [passwordError, setPasswordError] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("journal-password");
      if (stored && sessionStorage.getItem("journal-unlocked") === "true") {
        setIsUnlocked(true);
      }
    }
  }, []);

  useEffect(() => {
    if (!isUnlocked) return;
    const saved = localStorage.getItem("journal-entries");
    if (!saved) {
      setNotFound(true);
      return;
    }
    try {
      const entries: JournalEntry[] = JSON.parse(saved);
      const decodedTitle = decodeURIComponent(title);
      const match = entries.find((e) => {
        const slug = (e.title || "untitled")
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, "") || "untitled";
        return e.date === date && slug === decodedTitle;
      });
      if (match) {
        setEntry(match);
      } else {
        setNotFound(true);
      }
    } catch {
      setNotFound(true);
    }
  }, [isUnlocked, date, title]);

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

  if (!isUnlocked) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <form onSubmit={handleUnlock} className="w-full max-w-sm space-y-4">
          <div className="text-center space-y-2">
            <div className="text-4xl">🔒</div>
            <h1 className="font-pixel text-2xl font-bold tracking-tight text-amber-950">Journal Entry</h1>
            <p className="text-sm text-amber-900/60">Enter your password to view this entry</p>
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

  if (notFound) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <p className="text-stone-500">Entry not found.</p>
        <Link href="/journal" className="text-sm text-amber-800 hover:text-amber-600 transition-colors">
          &larr; Back to Journal
        </Link>
      </div>
    );
  }

  if (!entry) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-stone-400 text-sm">Loading...</p>
      </div>
    );
  }

  const dateLabel = new Date(entry.date + "T00:00:00").toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="space-y-6 -mx-6 -my-8 min-h-screen bg-[#f0e8d8]" style={{ marginLeft: 'calc(-50vw + 50%)', marginRight: 'calc(-50vw + 50%)', paddingLeft: 'max(1.5rem, calc(50vw - 28rem))', paddingRight: 'max(1.5rem, calc(50vw - 28rem))', paddingTop: '2rem', paddingBottom: '2rem' }}>
      <Link href="/journal" className="inline-flex items-center gap-1 text-sm text-amber-800 hover:text-amber-600 transition-colors">
        &larr; Back to Journal
      </Link>

      <article className="rounded-xl border border-amber-200/50 bg-white/80 p-6 space-y-4">
        <div className="space-y-1">
          <h1 className="font-pixel text-3xl font-bold tracking-tight text-amber-950">
            {entry.title || "Untitled"}
          </h1>
          <p className="text-sm text-stone-400">{dateLabel}</p>
          {entry.persist && (
            <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700">
              Kept
            </span>
          )}
        </div>
        <div className="border-t border-stone-200/50 pt-4">
          <p className="text-sm text-stone-700 whitespace-pre-wrap leading-relaxed">{entry.content}</p>
        </div>
      </article>
    </div>
  );
}
