"use client";

import { useState } from "react";
import { Task } from "@/types";
import Calendar from "./Calendar";

interface TaskListProps {
  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
}

export default function TaskList({ tasks, setTasks }: TaskListProps) {
  const [input, setInput] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [dueTime, setDueTime] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [editDueDate, setEditDueDate] = useState("");
  const [editDueTime, setEditDueTime] = useState("");
  const [calendarMonth, setCalendarMonth] = useState(new Date());

  function addTask() {
    const trimmed = input.trim();
    if (!trimmed) return;
    setTasks((prev) => [
      ...prev,
      {
        id: Date.now().toString(36) + Math.random().toString(36).slice(2),
        text: trimmed,
        completed: false,
        dueDate: dueDate || undefined,
        dueTime: dueTime || undefined,
      },
    ]);
    setInput("");
    setDueDate("");
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

  function startEditing(task: Task) {
    setEditingId(task.id);
    setEditText(task.text);
    setEditDueDate(task.dueDate || "");
    setEditDueTime(task.dueTime || "");
  }

  function saveEdit(id: string) {
    const trimmed = editText.trim();
    if (!trimmed) return;
    setTasks((prev) =>
      prev.map((t) =>
        t.id === id
          ? { ...t, text: trimmed, dueDate: editDueDate || undefined, dueTime: editDueTime || undefined }
          : t
      )
    );
    setEditingId(null);
  }

  function cancelEdit() {
    setEditingId(null);
  }

  function formatDueLabel(date?: string, time?: string) {
    if (!date) return null;
    const d = new Date(date + "T00:00:00");
    const label = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    if (time) {
      const [h, m] = time.split(":");
      const hour = parseInt(h);
      const ampm = hour >= 12 ? "PM" : "AM";
      const h12 = hour % 12 || 12;
      return `${label}, ${h12}:${m} ${ampm}`;
    }
    return label;
  }

  function isOverdue(date?: string, time?: string) {
    if (!date) return false;
    const now = new Date();
    const due = time ? new Date(`${date}T${time}`) : new Date(`${date}T23:59:59`);
    return due < now;
  }

  function generateIcsEvent(task: Task): string {
    const now = new Date().toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
    const uid = `${task.id}@productivity-app`;
    let dtStart: string;
    let dtEnd: string;
    let allDay = false;

    if (task.dueDate) {
      const dateStr = task.dueDate.replace(/-/g, "");
      if (task.dueTime) {
        const timeStr = task.dueTime.replace(":", "") + "00";
        dtStart = `${dateStr}T${timeStr}`;
        const start = new Date(`${task.dueDate}T${task.dueTime}`);
        const end = new Date(start.getTime() + 60 * 60 * 1000);
        dtEnd = end.toISOString().replace(/[-:]/g, "").split(".")[0];
      } else {
        allDay = true;
        dtStart = dateStr;
        const nextDay = new Date(task.dueDate + "T00:00:00");
        nextDay.setDate(nextDay.getDate() + 1);
        dtEnd = nextDay.toISOString().slice(0, 10).replace(/-/g, "");
      }
    } else {
      allDay = true;
      const today = new Date();
      dtStart = today.toISOString().slice(0, 10).replace(/-/g, "");
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      dtEnd = tomorrow.toISOString().slice(0, 10).replace(/-/g, "");
    }

    const dtProps = allDay
      ? `DTSTART;VALUE=DATE:${dtStart}\nDTEND;VALUE=DATE:${dtEnd}`
      : `DTSTART:${dtStart}\nDTEND:${dtEnd}`;

    return `BEGIN:VEVENT\nUID:${uid}\nDTSTAMP:${now}\n${dtProps}\nSUMMARY:${task.text}\nEND:VEVENT`;
  }

  function downloadIcs(content: string, filename: string) {
    const blob = new Blob(
      [`BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//Productivity App//EN\n${content}\nEND:VCALENDAR`],
      { type: "text/calendar;charset=utf-8" }
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function exportTask(task: Task) {
    downloadIcs(generateIcsEvent(task), `${task.text.replace(/\s+/g, "-").toLowerCase()}.ics`);
  }

  function exportAllTasks() {
    const events = tasks.filter((t) => !t.completed).map(generateIcsEvent).join("\n");
    downloadIcs(events, "all-tasks.ics");
  }

  const completedCount = tasks.filter((t) => t.completed).length;

  return (
    <div className="space-y-8">
      {/* Add task form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          addTask();
        }}
        className="space-y-3"
      >
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Add a new task..."
            className="flex-1 rounded-lg border border-stone-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-stone-400 focus:ring-2 focus:ring-stone-200 transition-all"
          />
          <button
            type="submit"
            className="rounded-lg bg-stone-900 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-stone-700"
          >
            Add
          </button>
        </div>
        <div className="flex gap-3">
          <div className="flex items-center gap-1.5">
            <label htmlFor="due-date" className="text-xs text-stone-500">Date</label>
            <input
              id="due-date"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="rounded-md border border-stone-200 bg-white px-2 py-1.5 text-xs outline-none focus:border-stone-400"
            />
          </div>
          <div className="flex items-center gap-1.5">
            <label htmlFor="due-time" className="text-xs text-stone-500">Time</label>
            <input
              id="due-time"
              type="time"
              value={dueTime}
              onChange={(e) => setDueTime(e.target.value)}
              className="rounded-md border border-stone-200 bg-white px-2 py-1.5 text-xs outline-none focus:border-stone-400"
            />
          </div>
        </div>
      </form>

      {/* Task list */}
      {tasks.length === 0 ? (
        <p className="text-center text-sm text-stone-400 py-8">
          No tasks yet. Add one above to get started.
        </p>
      ) : (
        <>
          <ul className="space-y-2">
            {tasks.map((task) => (
              <li
                key={task.id}
                className="group flex items-start gap-3 rounded-lg border border-stone-100 bg-white px-4 py-3 transition-shadow hover:shadow-sm"
              >
                <input
                  type="checkbox"
                  checked={task.completed}
                  onChange={() => toggleTask(task.id)}
                  className="mt-0.5 h-4 w-4 shrink-0 accent-stone-900"
                />

                {editingId === task.id ? (
                  <form
                    onSubmit={(e) => { e.preventDefault(); saveEdit(task.id); }}
                    className="flex flex-1 flex-col gap-2"
                  >
                    <input
                      type="text"
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      autoFocus
                      className="flex-1 rounded border border-stone-200 bg-transparent px-2 py-1 text-sm outline-none focus:border-stone-400"
                    />
                    <div className="flex items-center gap-2">
                      <input type="date" value={editDueDate} onChange={(e) => setEditDueDate(e.target.value)} className="rounded border border-stone-200 bg-transparent px-2 py-1 text-xs outline-none focus:border-stone-400" />
                      <input type="time" value={editDueTime} onChange={(e) => setEditDueTime(e.target.value)} className="rounded border border-stone-200 bg-transparent px-2 py-1 text-xs outline-none focus:border-stone-400" />
                      <button type="submit" className="text-xs font-medium text-stone-600 hover:text-stone-900">Save</button>
                      <button type="button" onClick={cancelEdit} className="text-xs text-stone-400 hover:text-stone-600">Cancel</button>
                    </div>
                  </form>
                ) : (
                  <div className="flex flex-1 items-start gap-2">
                    <div className="flex-1 min-w-0">
                      <span className={`text-sm ${task.completed ? "text-stone-400 line-through" : "text-stone-900"}`}>
                        {task.text}
                      </span>
                      {task.dueDate && (
                        <div className={`mt-0.5 text-xs ${task.completed ? "text-stone-400" : isOverdue(task.dueDate, task.dueTime) ? "text-red-500" : "text-stone-500"}`}>
                          {isOverdue(task.dueDate, task.dueTime) && !task.completed ? "Overdue \u00b7 " : "Due "}
                          {formatDueLabel(task.dueDate, task.dueTime)}
                        </div>
                      )}
                    </div>
                    <a
                      href={getGoogleCalendarUrl(task)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shrink-0 text-xs text-stone-400 opacity-0 transition-opacity hover:text-blue-600 group-hover:opacity-100"
                      title="Add to Google Calendar"
                    >
                      📅 Export
                    </a>
                    <button onClick={() => startEditing(task)} className="shrink-0 text-xs text-stone-400 opacity-0 transition-opacity hover:text-stone-600 group-hover:opacity-100">Edit</button>
                    <button onClick={() => deleteTask(task.id)} className="shrink-0 text-xs text-stone-400 opacity-0 transition-opacity hover:text-red-500 group-hover:opacity-100">Delete</button>
                  </div>
                )}
              </li>
            ))}
          </ul>

          {/* Export all to Google Calendar */}
          {tasks.some((t) => t.dueDate) && (
            <div className="flex justify-end">
              <button
                onClick={() => {
                  tasks.filter((t) => !t.completed).forEach((task) => {
                    window.open(getGoogleCalendarUrl(task), "_blank");
                  });
                }}
                className="rounded-lg border border-stone-200 px-3 py-1.5 text-xs font-medium text-stone-600 transition-colors hover:bg-stone-50 hover:text-blue-600"
              >
                📅 Export All to Google Calendar
              </button>
            </div>
          )}

          {/* Progress */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-stone-500">
              <span>{completedCount} of {tasks.length} completed</span>
              {completedCount === tasks.length && tasks.length > 0 && (
                <span className="text-emerald-600 font-medium">All done!</span>
              )}
            </div>
            <div className="h-1.5 rounded-full bg-stone-100 overflow-hidden">
              <div
                className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                style={{ width: `${(completedCount / tasks.length) * 100}%` }}
              />
            </div>
          </div>
        </>
      )}

      {/* Calendar */}
      <div className="rounded-xl border border-stone-100 bg-white p-5">
        <Calendar
          tasks={tasks}
          currentMonth={calendarMonth}
          onPrevMonth={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1))}
          onNextMonth={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1))}
        />
      </div>
    </div>
  );
}
