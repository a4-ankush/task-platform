export type Role = "admin" | "manager" | "user";

export type User = {
  id: string;
  email: string;
  name: string;
  role: Role;
};

export type TaskStatus = "todo" | "in-progress" | "done";
export type TaskPriority = "low" | "medium" | "high";

export type Task = {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string | null;
  assignee: null | { id: string; email: string; name: string; role: Role };
  createdBy: string;
  createdAt: string;
  updatedAt: string;
};

export function normalizeTask(input: any): Task {
  const id = String(input.id ?? input._id);
  const assignee = input.assignee
    ? {
        id: String(input.assignee.id ?? input.assignee._id),
        email: String(input.assignee.email),
        name: String(input.assignee.name),
        role: input.assignee.role as Role,
      }
    : null;

  return {
    id,
    title: String(input.title ?? ""),
    description: String(input.description ?? ""),
    status: input.status as TaskStatus,
    priority: (input.priority ?? "medium") as TaskPriority,
    dueDate: input.dueDate ? String(input.dueDate) : null,
    assignee,
    createdBy: String(input.createdBy ?? ""),
    createdAt: String(input.createdAt ?? new Date().toISOString()),
    updatedAt: String(input.updatedAt ?? new Date().toISOString()),
  };
}
