"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Task } from "@/types";

export default function DayPage() {
  const params = useParams();
  const date = params.date as string;

  const [tasks, setTasks] = useState<Task[]>([]);
  const [input, setInput] = useState("");
  const [dueTime, setDueTime] = useState("");

  const dateLabel = (() => {
    try {
      const d = new Date(date + "T00:00:00");
      return d.toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return date;
    }
  })();

  function addTask() {
    const trimmed = input.trim();
    if (!trimmed) return;
    setTasks((prev) => [
      ...prev,
      {
        id: Date.now().toString(36) + Math.random().toString(36).slice(2),
        text: trimmed,
        completed: false,
        dueDate: date,
        dueTime: dueTime || undefined,
      },
    ]);
    setInput("");
    setDueTime("");
  }

  function toggleTask(id: string) {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
    );
  }

  function deleteTask(id: string) {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  }

  const completedCount = tasks.filter((t) => t.completed).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/"
          className="rounded-lg px-3 py-1.5 text-sm text-stone-500 hover:bg-stone-100 hover:text-stone-900 transition-colors"
        >
          &larr; Back
        </Link>
      </div>

      <div>
        <h1 className="text-2xl font-bold tracking-tight">{dateLabel}</h1>
        <p className="text-sm text-stone-500 mt-1">
          {tasks.length === 0
            ? "No tasks for this day"
            : `${completedCount} of ${tasks.length} completed`}
        </p>
      </div>

      {/* Add task form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          addTask();
        }}
        className="flex gap-2"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Add a task for this day..."
          className="flex-1 rounded-lg border border-stone-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-stone-400 focus:ring-2 focus:ring-stone-200 transition-all"
        />
        <div className="flex items-center gap-1.5">
          <input
            type="time"
            value={dueTime}
            onChange={(e) => setDueTime(e.target.value)}
            className="rounded-lg border border-stone-200 bg-white px-2 py-2.5 text-xs outline-none focus:border-stone-400"
          />
        </div>
        <button
          type="submit"
          className="rounded-lg bg-stone-900 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-stone-700"
        >
          Add
        </button>
      </form>

      {/* Tasks */}
      {tasks.length > 0 && (
        <ul className="space-y-2">
          {tasks.map((task) => (
            <li
              key={task.id}
              className="group flex items-center gap-3 rounded-lg border border-stone-100 bg-white px-4 py-3 transition-shadow hover:shadow-sm"
            >
              <input
                type="checkbox"
                checked={task.completed}
                onChange={() => toggleTask(task.id)}
                className="h-4 w-4 shrink-0 accent-stone-900"
              />
              <div className="flex-1 min-w-0">
                <span
                  className={`text-sm ${
                    task.completed ? "text-stone-400 line-through" : "text-stone-900"
                  }`}
                >
                  {task.text}
                </span>
                {task.dueTime && (
                  <span className="ml-2 text-xs text-stone-400">
                    {(() => {
                      const [h, m] = task.dueTime.split(":");
                      const hour = parseInt(h);
                      const ampm = hour >= 12 ? "PM" : "AM";
                      const h12 = hour % 12 || 12;
                      return `${h12}:${m} ${ampm}`;
                    })()}
                  </span>
                )}
              </div>
              <button
                onClick={() => deleteTask(task.id)}
                className="shrink-0 text-xs text-stone-400 opacity-0 transition-opacity hover:text-red-500 group-hover:opacity-100"
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* Progress bar */}
      {tasks.length > 0 && (
        <div className="space-y-2">
          <div className="h-1.5 rounded-full bg-stone-100 overflow-hidden">
            <div
              className="h-full rounded-full bg-emerald-500 transition-all duration-500"
              style={{ width: `${(completedCount / tasks.length) * 100}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
