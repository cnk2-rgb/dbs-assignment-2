"use client";

import { useState } from "react";
import { Task } from "@/types";
import TaskList from "@/components/TaskList";

export default function Home() {
  const [tasks, setTasks] = useState<Task[]>([]);

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Daily Planner</h1>
        <p className="text-sm text-stone-500 mt-1">{today}</p>
      </div>
      <TaskList tasks={tasks} setTasks={setTasks} />
    </div>
  );
}
