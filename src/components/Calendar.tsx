"use client";

import Link from "next/link";
import { Task } from "@/types";

interface CalendarProps {
  tasks: Task[];
  currentMonth: Date;
  onPrevMonth: () => void;
  onNextMonth: () => void;
}

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfWeek(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

export default function Calendar({ tasks, currentMonth, onPrevMonth, onNextMonth }: CalendarProps) {
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfWeek(year, month);

  const monthLabel = currentMonth.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  const today = new Date();
  const isToday = (day: number) =>
    today.getFullYear() === year &&
    today.getMonth() === month &&
    today.getDate() === day;

  function tasksForDay(day: number): Task[] {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return tasks.filter((t) => t.dueDate === dateStr);
  }

  function dateStr(day: number) {
    return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }

  const days: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) days.push(null);
  for (let d = 1; d <= daysInMonth; d++) days.push(d);

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={onPrevMonth}
          className="rounded-lg px-3 py-1.5 text-sm text-amber-800/60 hover:bg-amber-100/50 hover:text-amber-900 transition-colors"
        >
          &larr;
        </button>
        <h3 className="text-sm font-semibold text-amber-950">
          {monthLabel}
        </h3>
        <button
          onClick={onNextMonth}
          className="rounded-lg px-3 py-1.5 text-sm text-amber-800/60 hover:bg-amber-100/50 hover:text-amber-900 transition-colors"
        >
          &rarr;
        </button>
      </div>

      <div className="grid grid-cols-7 gap-px mb-1">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
          <div key={d} className="text-center text-xs font-medium text-amber-800/40 py-1">
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {days.map((day, i) => {
          if (day === null) {
            return <div key={`empty-${i}`} className="h-18" />;
          }
          const dayTasks = tasksForDay(day);
          return (
            <Link
              key={day}
              href={`/day/${dateStr(day)}`}
              className={`h-18 rounded-lg border p-1.5 transition-colors hover:bg-amber-50/50 ${
                isToday(day)
                  ? "border-amber-800 bg-amber-50/50 ring-1 ring-amber-800"
                  : "border-amber-200/50"
              }`}
            >
              <div
                className={`text-xs ${
                  isToday(day)
                    ? "font-bold text-amber-950"
                    : "text-amber-800/60"
                }`}
              >
                {day}
              </div>
              <div className="mt-0.5 space-y-0.5 overflow-hidden">
                {dayTasks.slice(0, 2).map((t) => (
                  <div
                    key={t.id}
                    className={`truncate rounded px-1 text-[10px] leading-tight ${
                      t.completed
                        ? "bg-emerald-100 text-emerald-700 line-through"
                        : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    {t.text}
                  </div>
                ))}
                {dayTasks.length > 2 && (
                  <div className="text-[10px] text-amber-800/40">
                    +{dayTasks.length - 2} more
                  </div>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
