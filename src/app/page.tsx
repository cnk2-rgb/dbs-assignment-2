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
        <h1 className="font-pixel text-4xl font-bold tracking-tight text-amber-950">Daily Planner</h1>
        <p className="text-sm text-amber-900/60 mt-1">{today}</p>
      </div>
      <TaskList tasks={tasks} setTasks={setTasks} />
    </div>
  );
}
