"use client";

import { useEffect, useMemo, useState } from "react";
import {
  DndContext,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import type { DragEndEvent } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { useAuth } from "@/context/AuthContext";
import { useSocket } from "@/context/SocketContext";
import { Protected } from "@/components/Protected";
import type { Task, TaskStatus } from "@/lib/types";
import { normalizeTask } from "@/lib/types";
import { cx } from "@/lib/utils";

const STATUSES: Array<{ key: TaskStatus; label: string }> = [
  { key: "todo", label: "Todo" },
  { key: "in-progress", label: "In Progress" },
  { key: "done", label: "Done" },
];

function Column({
  status,
  title,
  tasks,
}: {
  status: TaskStatus;
  title: string;
  tasks: Task[];
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <div
      ref={setNodeRef}
      className={cx(
        "flex min-w-70 flex-1 flex-col rounded-xl border bg-white transition",
        isOver ? "ring-2 ring-zinc-900/20" : "",
      )}
    >
      <div className="flex items-center justify-between border-b px-4 py-3">
        <h2 className="text-sm font-semibold">{title}</h2>
        <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-700">
          {tasks.length}
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-3 p-3">
        {tasks.map((t) => (
          <TaskCard key={t.id} task={t} />
        ))}
      </div>
    </div>
  );
}

function TaskCard({ task }: { task: Task }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: task.id,
    });

  const style: React.CSSProperties = {
    transform: CSS.Translate.toString(transform),
    transition: isDragging ? undefined : "transform 180ms ease",
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cx(
        "cursor-grab rounded-lg border bg-white p-3 shadow-sm active:cursor-grabbing",
        isDragging ? "opacity-60" : "",
      )}
      {...listeners}
      {...attributes}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="text-sm font-medium">{task.title}</div>
          {task.description ? (
            <div className="mt-1 text-xs text-zinc-600">{task.description}</div>
          ) : null}
        </div>
        <span
          className={cx(
            "rounded-md px-2 py-0.5 text-xs",
            task.priority === "high"
              ? "bg-red-50 text-red-700"
              : task.priority === "low"
                ? "bg-emerald-50 text-emerald-700"
                : "bg-amber-50 text-amber-700",
          )}
        >
          {task.priority}
        </span>
      </div>
      <div className="mt-2 flex items-center justify-between text-xs text-zinc-500">
        <span>{task.assignee ? `@${task.assignee.name}` : "Unassigned"}</span>
        <span className="select-none">Drag</span>
      </div>
    </div>
  );
}

export default function BoardPage() {
  const { apiFetch } = useAuth();
  const { socket } = useSocket();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newPriority, setNewPriority] = useState<"low" | "medium" | "high">(
    "medium",
  );

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );

  const grouped = useMemo(() => {
    const by: Record<TaskStatus, Task[]> = {
      todo: [],
      "in-progress": [],
      done: [],
    };
    for (const t of tasks) by[t.status].push(t);
    return by;
  }, [tasks]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await apiFetch<{ items: any[] }>("/api/tasks?limit=100");
        setTasks(data.items.map(normalizeTask));
      } catch (e: any) {
        setError(e?.message || "Failed to load tasks");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [apiFetch]);

  useEffect(() => {
    if (!socket) return;

    const onCreated = (payload: any) => {
      const t = normalizeTask(payload);
      setTasks((prev) =>
        prev.some((x) => x.id === t.id) ? prev : [t, ...prev],
      );
    };

    const onUpdated = (payload: any) => {
      const t = normalizeTask(payload);
      setTasks((prev) => prev.map((x) => (x.id === t.id ? t : x)));
    };

    const onDeleted = (payload: any) => {
      const id = String(payload.id ?? payload._id);
      setTasks((prev) => prev.filter((x) => x.id !== id));
    };

    socket.on("task:created", onCreated);
    socket.on("task:updated", onUpdated);
    socket.on("task:deleted", onDeleted);

    return () => {
      socket.off("task:created", onCreated);
      socket.off("task:updated", onUpdated);
      socket.off("task:deleted", onDeleted);
    };
  }, [socket]);

  const findTaskIdFromEvent = (event: DragEndEvent): string | null => {
    const activeId = String(event.active.id);
    return activeId || null;
  };

  const findNewStatus = (event: DragEndEvent): TaskStatus | null => {
    if (!event.over) return null;

    const overId = String(event.over.id);
    if (overId === "todo" || overId === "in-progress" || overId === "done")
      return overId;

    // Dropped over a card: use that card's status
    const overTask = tasks.find((t) => t.id === overId);
    return overTask ? overTask.status : null;
  };

  const onDragEnd = async (event: DragEndEvent) => {
    const taskId = findTaskIdFromEvent(event);
    const newStatus = findNewStatus(event);
    if (!taskId || !newStatus) return;

    const current = tasks.find((t) => t.id === taskId);
    if (!current) return;
    if (current.status === newStatus) return;

    // optimistic
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t)),
    );

    try {
      await apiFetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        body: JSON.stringify({ status: newStatus }),
      });
    } catch (e: any) {
      setTasks((prev) => prev.map((t) => (t.id === taskId ? current : t)));
      setError(e?.message || "Update failed");
    }
  };

  const createTask = async () => {
    setError(null);
    const title = newTitle.trim();
    if (!title) {
      setError("Title is required");
      return;
    }

    setCreating(true);
    try {
      await apiFetch("/api/tasks", {
        method: "POST",
        body: JSON.stringify({ title, priority: newPriority, status: "todo" }),
      });
      setNewTitle("");
      // realtime event should add it; fallback to reload if socket not connected
      if (!socket) {
        const data = await apiFetch<{ items: any[] }>("/api/tasks?limit=100");
        setTasks(data.items.map(normalizeTask));
      }
    } catch (e: any) {
      setError(e?.message || "Create failed");
    } finally {
      setCreating(false);
    }
  };

  return (
    <Protected>
      <main className="mx-auto max-w-6xl px-4 py-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">Kanban Board</h1>
            <p className="mt-1 text-sm text-zinc-600">
              Drag cards between columns. Changes sync in realtime.
            </p>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-3 rounded-xl border bg-white p-4 sm:flex-row sm:items-end">
          <div className="flex-1">
            <label className="text-sm font-medium">New task title</label>
            <input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="mt-1 w-full rounded-md border px-3 py-2"
              placeholder="e.g. Prepare release notes"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Priority</label>
            <select
              value={newPriority}
              onChange={(e) => setNewPriority(e.target.value as any)}
              className="mt-1 w-full rounded-md border px-3 py-2"
            >
              <option value="low">low</option>
              <option value="medium">medium</option>
              <option value="high">high</option>
            </select>
          </div>
          <button
            disabled={creating}
            onClick={createTask}
            className="rounded-md bg-zinc-900 px-4 py-2 text-sm text-white hover:bg-black disabled:opacity-60"
          >
            {creating ? "Creating…" : "Add task"}
          </button>
        </div>

        {error && (
          <p className="mt-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </p>
        )}

        {loading ? (
          <div className="mt-6 text-sm text-zinc-600">Loading…</div>
        ) : (
          <DndContext sensors={sensors} onDragEnd={onDragEnd}>
            <div className="mt-6 flex gap-4 overflow-x-auto pb-2">
              {STATUSES.map((s) => (
                <Column
                  key={s.key}
                  status={s.key}
                  title={s.label}
                  tasks={grouped[s.key]}
                />
              ))}
            </div>
          </DndContext>
        )}
      </main>
    </Protected>
  );
}
